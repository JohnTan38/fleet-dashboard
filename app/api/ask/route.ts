export const runtime = "nodejs";

type AskPayload = {
  question?: string;
  context?: unknown;
};

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response("Missing OPENAI_API_KEY", { status: 500 });
  }

  let payload: AskPayload;
  try {
    payload = (await request.json()) as AskPayload;
  } catch {
    return new Response("Invalid JSON payload", { status: 400 });
  }

  const question = (payload.question ?? "").trim();
  if (!question) {
    return new Response("Question is required.", { status: 400 });
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-5.1";

  const upstream = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: true,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: [
                "You are a fleet analytics assistant.",
                "Answer using only the provided JSON context.",
                "If a required field is missing, say so explicitly and suggest what to upload.",
                "When driver names are available, include them alongside Drive IDs.",
                "Revenue-by-driver is derived by joining Freight to Cost on Truck ID + Month; call this out if relevant.",
                "Be concise and include the key metric values.",
              ].join(" "),
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Question: ${question}\n\nContext JSON:\n${JSON.stringify(payload.context ?? {}, null, 2)}`,
            },
          ],
        },
      ],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const errorText = await upstream.text();
    return new Response(errorText || "OpenAI request failed.", { status: upstream.status });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
