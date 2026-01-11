"use client";

import { useMemo, useState } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

type KPIData = {
  totalRevenue: number;
  totalCosts: number;
  profit: number;
  profitMargin: number;
  totalFleetSize: number;
  totalKmTraveled: number;
  totalFuelConsumed: number;
  avgFuelEfficiency: number;
};

type RevenueRow = {
  month: string;
  revenue: number;
  fuel: number;
  maintenance: number;
  fixedCosts: number;
};

type CostByTruckType = {
  truckType: string;
  costPerKm: number;
  totalFuel: number;
  totalMaintenance: number;
  totalFixedCosts: number;
  totalCost: number;
  totalKm: number;
};

type FuelEfficiency = {
  truckType: string;
  efficiency: number;
  totalLiters: number;
  totalKm: number;
};

type MaintenanceByYearRow = {
  year: string;
  total: number;
} & Record<string, number | string>;

type TopTruck = {
  truckId: string;
  truckType: string;
  year?: string;
  revenue: number;
  totalCost: number;
  profit: number;
  kmTraveled: number;
  costPerKm: number;
};

type DashboardData = {
  kpis: KPIData;
  revenueVsCosts: RevenueRow[];
  costByTruckType: CostByTruckType[];
  fuelEfficiency: FuelEfficiency[];
  fuelTrend: { month: string; liters: number }[];
  maintenanceByYear: MaintenanceByYearRow[];
  topTrucks: TopTruck[];
};

type QAEntry = {
  id: string;
  question: string;
  answer: string;
  status: "streaming" | "done" | "error";
};

const defaultDashboardData: DashboardData = {
  kpis: {
    totalRevenue: 5461023.69,
    totalCosts: 3771645.7,
    profit: 1689377.99,
    profitMargin: 30.94,
    totalFleetSize: 23,
    totalKmTraveled: 1267630.0,
    totalFuelConsumed: 269137.71,
    avgFuelEfficiency: 4.72,
  },
  revenueVsCosts: [
    { month: "2018-01", revenue: 260988.32, fuel: 42344.65, maintenance: 11890.88, fixedCosts: 138768.12 },
    { month: "2018-02", revenue: 240046.95, fuel: 41072.14, maintenance: 9683.1, fixedCosts: 140060.93 },
    { month: "2018-03", revenue: 290943.43, fuel: 42606.23, maintenance: 16039.25, fixedCosts: 139988.4 },
    { month: "2018-04", revenue: 279992.68, fuel: 42087.55, maintenance: 13074.3, fixedCosts: 139827.31 },
    { month: "2018-05", revenue: 303154.03, fuel: 43169.56, maintenance: 9839.19, fixedCosts: 139913.72 },
    { month: "2018-06", revenue: 282729.57, fuel: 42644.65, maintenance: 16337.23, fixedCosts: 139893.26 },
  ],
  costByTruckType: [
    { truckType: "BOX", costPerKm: 2.507, totalFuel: 144854.86, totalMaintenance: 47754.52, totalFixedCosts: 221639.02, totalCost: 414248.4, totalKm: 165267.0 },
    { truckType: "SEMI-TRAILER", costPerKm: 3.139, totalFuel: 184047.93, totalMaintenance: 60293.97, totalFixedCosts: 327667.91, totalCost: 572009.81, totalKm: 182215.0 },
    { truckType: "TRACTOR", costPerKm: 2.833, totalFuel: 148653.26, totalMaintenance: 35561.62, totalFixedCosts: 185999.06, totalCost: 370213.94, totalKm: 130682.0 },
    { truckType: "TRAILER", costPerKm: 2.562, totalFuel: 424338.84, totalMaintenance: 123796.39, totalFixedCosts: 943004.78, totalCost: 1491139.99, totalKm: 789466.0 },
  ],
  fuelEfficiency: [
    { truckType: "BOX", efficiency: 4.15, totalLiters: 46329.98, totalKm: 165267.0 },
    { truckType: "SEMI-TRAILER", efficiency: 3.43, totalLiters: 58848.67, totalKm: 182215.0 },
    { truckType: "TRACTOR", efficiency: 3.0, totalLiters: 47531.75, totalKm: 130682.0 },
    { truckType: "TRAILER", efficiency: 5.47, totalLiters: 116427.31, totalKm: 789466.0 },
  ],
  fuelTrend: [
    { month: "2018-01", liters: 21451.79 },
    { month: "2018-02", liters: 20800.71 },
    { month: "2018-03", liters: 21589.7 },
    { month: "2018-04", liters: 21322.23 },
    { month: "2018-05", liters: 21871.48 },
    { month: "2018-06", liters: 21605.51 },
  ],
  maintenanceByYear: [],
  topTrucks: [
    { truckId: "23", truckType: "TRAILER", year: "2014", revenue: 701472.71, totalCost: 242823.24, profit: 458649.47, kmTraveled: 105966.0, costPerKm: 2.291 },
    { truckId: "17", truckType: "TRACTOR", year: "2011", revenue: 527629.53, totalCost: 370213.94, profit: 157415.59, kmTraveled: 130682.0, costPerKm: 2.833 },
    { truckId: "2", truckType: "SEMI-TRAILER", year: "2011", revenue: 350831.42, totalCost: 225632.71, profit: 125198.71, kmTraveled: 72021.0, costPerKm: 3.133 },
    { truckId: "36", truckType: "SEMI-TRAILER", year: "2014", revenue: 334991.99, totalCost: 225611.06, profit: 109380.93, kmTraveled: 71929.0, costPerKm: 3.137 },
    { truckId: "29", truckType: "TRAILER", year: "2008", revenue: 329686.93, totalCost: 241983.08, profit: 87703.85, kmTraveled: 105612.0, costPerKm: 2.291 },
  ],
};

const normalizeKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const KM_KEYS = [
  "km",
  "km traveled",
  "km travelled",
  "kmtraveled",
  "kmtravelled",
  "kilometers",
  "kilometres",
  "distance",
  "kms",
  "mileage",
];

const LITER_KEYS = ["liters", "litres", "fuel consumed", "fuel liters", "fuelconsumed"];

const buildHeaderMap = (row: Record<string, unknown>) => {
  const map: Record<string, string> = {};
  Object.keys(row).forEach((key) => {
    map[normalizeKey(key)] = key;
  });
  return map;
};

const pickValue = (row: Record<string, unknown>, map: Record<string, string>, keys: string[]) => {
  for (const key of keys) {
    const normalized = normalizeKey(key);
    if (map[normalized]) {
      return row[map[normalized]];
    }
  }
  return undefined;
};

const toNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const raw = String(value).trim();
  if (!raw) return 0;
  const cleaned = raw.replace(/[^0-9,.-]/g, "");
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let normalized = cleaned;
  if (lastComma > -1 && lastDot > -1) {
    if (lastComma > lastDot) {
      normalized = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = cleaned.replace(/,/g, "");
    }
  } else if (lastComma > -1) {
    normalized = cleaned.replace(/,/g, ".");
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toMonthKey = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "Unknown";
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed && parsed.y && parsed.m) {
      return `${parsed.y}-${String(parsed.m).padStart(2, "0")}`;
    }
  }
  if (value instanceof Date) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
  }
  const raw = String(value);
  const slashMatch = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (slashMatch) {
    const year = slashMatch[3].length === 2 ? `20${slashMatch[3]}` : slashMatch[3];
    return `${year}-${String(slashMatch[2]).padStart(2, "0")}`;
  }
  const parsedDate = new Date(raw);
  if (!Number.isNaN(parsedDate.getTime())) {
    return `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, "0")}`;
  }
  return raw.slice(0, 7);
};

const formatCurrency = (value: number, digits = 0) =>
  value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: digits, minimumFractionDigits: digits });

const formatNumber = (value: number, digits = 0) =>
  value.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits });

const parseWorkbook = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
};

const buildEfficiencyTable = (rows: Record<string, unknown>[], header: Record<string, string>, keyLabels: string[]) => {
  const map: Record<string, { id: string; totalKm: number; totalLiters: number }> = {};

  rows.forEach((row) => {
    const key = pickValue(row, header, keyLabels);
    if (key === null || key === undefined || key === "") return;
    const id = String(key).trim();
    if (!id) return;
    const km = toNumber(pickValue(row, header, KM_KEYS));
    const liters = toNumber(pickValue(row, header, LITER_KEYS));
    if (!map[id]) {
      map[id] = { id, totalKm: 0, totalLiters: 0 };
    }
    map[id].totalKm += km;
    map[id].totalLiters += liters;
  });

  return Object.values(map)
    .map((entry) => ({
      ...entry,
      kmPerLiter: entry.totalLiters ? entry.totalKm / entry.totalLiters : 0,
    }))
    .sort((a, b) => b.kmPerLiter - a.kmPerLiter || b.totalKm - a.totalKm);
};

const buildDriverNameMap = (rows: Record<string, unknown>[], header: Record<string, string>) => {
  const map: Record<string, string> = {};
  rows.forEach((row) => {
    const id = pickValue(row, header, ["drive id", "driver id", "id"]);
    const name = pickValue(row, header, ["driver", "driver name", "name"]);
    if (!id || !name) return;
    map[String(id).trim()] = String(name).trim();
  });
  return map;
};

const getYearFromMonthKey = (monthKey: string) => {
  const match = monthKey.match(/^(\d{4})-/);
  return match ? match[1] : "Unknown";
};

const buildDriveLookup = (rows: Record<string, unknown>[], header: Record<string, string>) => {
  const map: Record<string, { driveId: string; km: number }> = {};
  rows.forEach((row) => {
    const truckId = String(pickValue(row, header, ["truck id", "truckid", "vehicle id", "id"]) ?? "").trim();
    const driveId = String(pickValue(row, header, ["drive id", "driver id", "id"]) ?? "").trim();
    if (!truckId || !driveId) return;
    const monthKey = toMonthKey(pickValue(row, header, ["date", "transaction date", "service date"]));
    const km = toNumber(pickValue(row, header, KM_KEYS));
    const key = `${truckId}::${monthKey}`;
    if (!map[key] || km > map[key].km) {
      map[key] = { driveId, km };
    }
  });
  return map;
};

const buildDashboardData = (
  costRows: Record<string, unknown>[],
  vehicleRows: Record<string, unknown>[],
  freightRows: Record<string, unknown>[]
) => {
  if (!costRows.length && !freightRows.length) return defaultDashboardData;

  const vehicleHeader = buildHeaderMap(vehicleRows[0] ?? {});
  const costHeader = buildHeaderMap(costRows[0] ?? {});
  const freightHeader = buildHeaderMap(freightRows[0] ?? {});

  const vehicleMap: Record<string, { truckType: string; trailerType?: string; year?: string }> = {};
  vehicleRows.forEach((row) => {
    const truckId = pickValue(row, vehicleHeader, ["truck id", "truckid", "vehicle id", "id"]);
    if (!truckId) return;
    const key = String(truckId).trim();
    vehicleMap[key] = {
      truckType: String(pickValue(row, vehicleHeader, ["truck type", "trucktype"]) ?? "Unknown"),
      trailerType: String(pickValue(row, vehicleHeader, ["trailers type", "trailer type", "trailer"]) ?? ""),
      year: String(pickValue(row, vehicleHeader, ["year"]) ?? ""),
    };
  });

  const monthlyMap: Record<string, RevenueRow> = {};
  const fuelTrendMap: Record<string, number> = {};
  const costByTypeMap: Record<string, CostByTruckType> = {};
  const fuelEfficiencyMap: Record<string, FuelEfficiency> = {};
  const maintenanceByYearMap: Record<string, { year: string; total: number; byType: Record<string, number> }> = {};
  const topTruckMap: Record<string, TopTruck> = {};
  const truckIdSet = new Set<string>();

  let totalRevenue = 0;
  let totalFuel = 0;
  let totalMaintenance = 0;
  let totalFixed = 0;
  let totalKm = 0;
  let totalFuelLiters = 0;

  const ensureMonthly = (monthKey: string) => {
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { month: monthKey, revenue: 0, fuel: 0, maintenance: 0, fixedCosts: 0 };
    }
  };

  freightRows.forEach((row) => {
    const truckId = String(pickValue(row, freightHeader, ["truck id", "truckid", "vehicle id", "id"]) ?? "").trim();
    const revenue = toNumber(pickValue(row, freightHeader, ["net revenue", "revenue", "freight revenue", "amount", "total revenue"]));
    const monthKey = toMonthKey(pickValue(row, freightHeader, ["date", "freight date", "invoice date"]));

    ensureMonthly(monthKey);
    monthlyMap[monthKey].revenue += revenue;
    totalRevenue += revenue;

    if (truckId) {
      truckIdSet.add(truckId);
      if (!topTruckMap[truckId]) {
        topTruckMap[truckId] = {
          truckId,
          truckType: vehicleMap[truckId]?.truckType || "Unknown",
          year: vehicleMap[truckId]?.year || "",
          revenue: 0,
          totalCost: 0,
          profit: 0,
          kmTraveled: 0,
          costPerKm: 0,
        };
      }
      const record = topTruckMap[truckId];
      record.revenue += revenue;
      record.profit = record.revenue - record.totalCost;
    }
  });

  costRows.forEach((row) => {
    const truckId = String(pickValue(row, costHeader, ["truck id", "truckid", "vehicle id", "id"]) ?? "").trim();
    const rowTruckType = String(pickValue(row, costHeader, ["truck type", "trucktype"]) ?? "").trim();
    const vehicleInfo = vehicleMap[truckId];
    const truckType = vehicleInfo?.truckType || rowTruckType || "Unknown";

    const fuel = toNumber(pickValue(row, costHeader, ["fuel", "fuel cost", "fuelcost"]));
    const maintenance = toNumber(pickValue(row, costHeader, ["maintenance", "maintenance cost", "service cost"]));
    const fixedCosts = toNumber(pickValue(row, costHeader, ["fixed costs", "fixed cost", "fixed"]));
    const km = toNumber(pickValue(row, costHeader, KM_KEYS));
    const liters = toNumber(pickValue(row, costHeader, LITER_KEYS));

    totalFuel += fuel;
    totalMaintenance += maintenance;
    totalFixed += fixedCosts;
    totalKm += km;
    totalFuelLiters += liters;

    const monthKey = toMonthKey(pickValue(row, costHeader, ["date", "transaction date", "service date"]));
    const yearKey = getYearFromMonthKey(monthKey);
    ensureMonthly(monthKey);
    monthlyMap[monthKey].fuel += fuel;
    monthlyMap[monthKey].maintenance += maintenance;
    monthlyMap[monthKey].fixedCosts += fixedCosts;

    if (!fuelTrendMap[monthKey]) fuelTrendMap[monthKey] = 0;
    fuelTrendMap[monthKey] += liters;

    if (!maintenanceByYearMap[yearKey]) {
      maintenanceByYearMap[yearKey] = { year: yearKey, total: 0, byType: {} };
    }
    maintenanceByYearMap[yearKey].total += maintenance;
    maintenanceByYearMap[yearKey].byType[truckType] = (maintenanceByYearMap[yearKey].byType[truckType] ?? 0) + maintenance;

    if (!costByTypeMap[truckType]) {
      costByTypeMap[truckType] = {
        truckType,
        costPerKm: 0,
        totalFuel: 0,
        totalMaintenance: 0,
        totalFixedCosts: 0,
        totalCost: 0,
        totalKm: 0,
      };
    }
    costByTypeMap[truckType].totalFuel += fuel;
    costByTypeMap[truckType].totalMaintenance += maintenance;
    costByTypeMap[truckType].totalFixedCosts += fixedCosts;
    costByTypeMap[truckType].totalCost += fuel + maintenance + fixedCosts;
    costByTypeMap[truckType].totalKm += km;

    if (!fuelEfficiencyMap[truckType]) {
      fuelEfficiencyMap[truckType] = {
        truckType,
        efficiency: 0,
        totalLiters: 0,
        totalKm: 0,
      };
    }
    fuelEfficiencyMap[truckType].totalLiters += liters;
    fuelEfficiencyMap[truckType].totalKm += km;

    if (truckId) {
      truckIdSet.add(truckId);
      if (!topTruckMap[truckId]) {
        topTruckMap[truckId] = {
          truckId,
          truckType,
          year: vehicleInfo?.year || "",
          revenue: 0,
          totalCost: 0,
          profit: 0,
          kmTraveled: 0,
          costPerKm: 0,
        };
      }
      const record = topTruckMap[truckId];
      if (record.truckType === "Unknown" && truckType !== "Unknown") {
        record.truckType = truckType;
      }
      record.totalCost += fuel + maintenance + fixedCosts;
      record.kmTraveled += km;
      record.profit = record.revenue - record.totalCost;
    }
  });

  const revenueVsCosts = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));
  const fuelTrend = Object.entries(fuelTrendMap)
    .map(([month, liters]) => ({ month, liters }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const maintenanceByYear = Object.values(maintenanceByYearMap)
    .map((entry) => {
      const row: MaintenanceByYearRow = { year: entry.year, total: entry.total };
      Object.entries(entry.byType).forEach(([truckType, value]) => {
        row[truckType] = value;
      });
      return row;
    })
    .sort((a, b) => a.year.localeCompare(b.year));

  const costByTruckType = Object.values(costByTypeMap).map((item) => ({
    ...item,
    costPerKm: item.totalKm ? item.totalCost / item.totalKm : 0,
  }));

  const fuelEfficiency = Object.values(fuelEfficiencyMap).map((item) => ({
    ...item,
    efficiency: item.totalLiters ? item.totalKm / item.totalLiters : 0,
  }));

  const topTrucks = Object.values(topTruckMap)
    .map((truck) => ({
      ...truck,
      costPerKm: truck.kmTraveled ? truck.totalCost / truck.kmTraveled : 0,
    }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 10);

  const totalCosts = totalFuel + totalMaintenance + totalFixed;
  const profit = totalRevenue - totalCosts;
  const profitMargin = totalRevenue ? (profit / totalRevenue) * 100 : 0;

  return {
    kpis: {
      totalRevenue,
      totalCosts,
      profit,
      profitMargin,
      totalFleetSize: truckIdSet.size || Object.keys(vehicleMap).length,
      totalKmTraveled: totalKm,
      totalFuelConsumed: totalFuelLiters,
      avgFuelEfficiency: totalFuelLiters ? totalKm / totalFuelLiters : 0,
    },
    revenueVsCosts,
    costByTruckType,
    fuelEfficiency,
    fuelTrend,
    maintenanceByYear,
    topTrucks,
  };
};

const buildAskContext = (
  costRows: Record<string, unknown>[],
  vehicleRows: Record<string, unknown>[],
  freightRows: Record<string, unknown>[],
  driverRows: Record<string, unknown>[]
) => {
  const costHeader = buildHeaderMap(costRows[0] ?? {});
  const vehicleHeader = buildHeaderMap(vehicleRows[0] ?? {});
  const freightHeader = buildHeaderMap(freightRows[0] ?? {});
  const driverHeader = buildHeaderMap(driverRows[0] ?? {});
  const driverNameMap = buildDriverNameMap(driverRows, driverHeader);
  const dashboard = buildDashboardData(costRows, vehicleRows, freightRows);
  const driveLookup = buildDriveLookup(costRows, costHeader);

  const driveEfficiency = buildEfficiencyTable(costRows, costHeader, ["drive id", "driver id"]);
  const truckEfficiency = buildEfficiencyTable(costRows, costHeader, ["truck id", "truckid", "vehicle id", "id"]);
  const truckTypeEfficiency = buildEfficiencyTable(costRows, costHeader, ["truck type", "trucktype"]);

  const revenueByDrive: Record<string, number> = {};
  const revenueByDriveByYear: Record<string, Record<string, number>> = {};
  let matchedFreight = 0;
  let totalFreight = 0;

  freightRows.forEach((row) => {
    totalFreight += 1;
    const truckId = String(pickValue(row, freightHeader, ["truck id", "truckid", "vehicle id", "id"]) ?? "").trim();
    const revenue = toNumber(pickValue(row, freightHeader, ["net revenue", "revenue", "freight revenue", "amount", "total revenue"]));
    const monthKey = toMonthKey(pickValue(row, freightHeader, ["date", "freight date", "invoice date"]));
    const lookup = truckId ? driveLookup[`${truckId}::${monthKey}`] : undefined;
    if (!lookup?.driveId) return;
    matchedFreight += 1;
    revenueByDrive[lookup.driveId] = (revenueByDrive[lookup.driveId] ?? 0) + revenue;
    const year = getYearFromMonthKey(monthKey);
    if (!revenueByDriveByYear[year]) revenueByDriveByYear[year] = {};
    revenueByDriveByYear[year][lookup.driveId] = (revenueByDriveByYear[year][lookup.driveId] ?? 0) + revenue;
  });

  const toRevenueList = (map: Record<string, number>) =>
    Object.entries(map)
      .map(([driveId, revenue]) => ({
        driveId,
        driverName: driverNameMap[driveId] ?? "Unknown",
        revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue);

  return {
    kpis: dashboard.kpis,
    rowCounts: {
      cost: costRows.length,
      freight: freightRows.length,
      vehicles: vehicleRows.length,
      drivers: driverRows.length,
    },
    availableColumns: {
      cost: Object.keys(costRows[0] ?? {}),
      freight: Object.keys(freightRows[0] ?? {}),
      vehicles: Object.keys(vehicleRows[0] ?? {}),
      drivers: Object.keys(driverRows[0] ?? {}),
    },
    efficiencyByDrive: driveEfficiency
      .map((entry) => ({ ...entry, driverName: driverNameMap[entry.id] ?? "Unknown" }))
      .slice(0, 15),
    efficiencyByTruck: truckEfficiency.slice(0, 15),
    efficiencyByTruckType: truckTypeEfficiency.slice(0, 15),
    driverFields: {
      driveId: pickValue(driverRows[0] ?? {}, driverHeader, ["drive id", "driver id", "id"]) ? "available" : "missing",
      driverName: pickValue(driverRows[0] ?? {}, driverHeader, ["driver", "driver name", "name"]) ? "available" : "missing",
    },
    vehicleFields: {
      truckId: pickValue(vehicleRows[0] ?? {}, vehicleHeader, ["truck id", "truckid", "vehicle id", "id"]) ? "available" : "missing",
      truckType: pickValue(vehicleRows[0] ?? {}, vehicleHeader, ["truck type", "trucktype"]) ? "available" : "missing",
    },
    freightFields: {
      truckId: pickValue(freightRows[0] ?? {}, freightHeader, ["truck id", "truckid", "vehicle id", "id"]) ? "available" : "missing",
      revenue: pickValue(freightRows[0] ?? {}, freightHeader, ["net revenue", "revenue", "freight revenue", "amount", "total revenue"]) ? "available" : "missing",
    },
    revenueByDrive: {
      joinMethod: "Freight rows joined to cost rows by Truck ID + Month; Drive ID picked by max KM within that key.",
      joinCoverage: { matched: matchedFreight, total: totalFreight },
      topOverall: toRevenueList(revenueByDrive).slice(0, 15),
      top2018: toRevenueList(revenueByDriveByYear["2018"] ?? {}).slice(0, 15),
    },
  };
};

const KPICard = ({ label, value, variant = "primary", change }: { label: string; value: string | number; variant?: string; change?: string }) => (
  <div className={`kpi-card ${variant}`}>
    <div className="kpi-label">{label}</div>
    <div className="kpi-value">{value}</div>
    {change && (
      <div className={`kpi-change ${change.startsWith("+") ? "positive" : "negative"}`}>
        {change.startsWith("+") ? "Up" : "Down"} {change}
      </div>
    )}
  </div>
);

export default function HomePage() {
  const [dashboardData, setDashboardData] = useState<DashboardData>(defaultDashboardData);
  const [currentPage, setCurrentPage] = useState("overview");
  const [vehiclesFile, setVehiclesFile] = useState<File | null>(null);
  const [freightFile, setFreightFile] = useState<File | null>(null);
  const [costFile, setCostFile] = useState<File | null>(null);
  const [driversFile, setDriversFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [qaEntries, setQaEntries] = useState<QAEntry[]>([]);
  const [askStatus, setAskStatus] = useState<{ type: "idle" | "error" | "success"; message: string }>({
    type: "idle",
    message: "",
  });
  const [status, setStatus] = useState<{ type: "idle" | "error" | "success"; message: string }>({
    type: "idle",
    message: "Upload your freight, cost, and optional vehicles/drivers Excel files to generate the dashboard.",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);

  const handleSubmit = async () => {
    if (!costFile || !freightFile) {
      setStatus({ type: "error", message: "Please upload the freight and cost files before generating the dashboard." });
      return;
    }
    setIsLoading(true);
    setStatus({ type: "idle", message: "Processing files..." });
    try {
      const [costRows, vehicleRows, freightRows] = await Promise.all([
        parseWorkbook(costFile),
        vehiclesFile ? parseWorkbook(vehiclesFile) : Promise.resolve([]),
        parseWorkbook(freightFile),
      ]);
      const nextData = buildDashboardData(costRows, vehicleRows, freightRows);
      setDashboardData(nextData);
      setStatus({ type: "success", message: "Dashboard updated from your Excel files." });
    } catch (error) {
      setStatus({ type: "error", message: "Unable to parse the uploaded files. Please verify the Excel format." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    const target = document.querySelector(".main-content") as HTMLElement | null;
    if (!target) return;
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
    const canvas = await html2canvas(target, {
      scale: 2,
      backgroundColor: "#f8fafc",
      scrollY: -window.scrollY,
      scrollX: -window.scrollX,
      windowWidth: target.scrollWidth,
      windowHeight: target.scrollHeight,
      onclone: (doc) => {
        const clonedTarget = doc.querySelector(".main-content") as HTMLElement | null;
        if (clonedTarget) {
          clonedTarget.style.background = "#f8fafc";
          clonedTarget.style.backdropFilter = "none";
        }
        doc
          .querySelectorAll(
            ".page-content, .page-header, .kpi-card, .chart-container, .table-container, .upload-card, .ask-card, .qa-entry"
          )
          .forEach((node) => {
            const element = node as HTMLElement;
            element.style.animation = "none";
            element.style.transform = "none";
            element.style.opacity = "1";
          });
      },
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "pt", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save("fleet-dashboard.pdf");
  };

  const handleAskQuestion = async () => {
    const trimmed = question.trim();
    if (!trimmed) {
      setAskStatus({ type: "error", message: "Please type a question before asking." });
      return;
    }
    if (!costFile) {
      setAskStatus({ type: "error", message: "Please upload the cost file before asking questions." });
      return;
    }

    setIsAsking(true);
    setAskStatus({ type: "idle", message: "Analyzing your data..." });

    const entryId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`;
    setQaEntries((prev) => [{ id: entryId, question: trimmed, answer: "", status: "streaming" }, ...prev]);

    try {
      const [costRows, vehicleRows, freightRows, driverRows] = await Promise.all([
        parseWorkbook(costFile),
        vehiclesFile ? parseWorkbook(vehiclesFile) : Promise.resolve([]),
        freightFile ? parseWorkbook(freightFile) : Promise.resolve([]),
        driversFile ? parseWorkbook(driversFile) : Promise.resolve([]),
      ]);

      const context = buildAskContext(costRows, vehicleRows, freightRows, driverRows);
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, context }),
      });

      if (!response.ok || !response.body) {
        const errorText = await response.text();
        setQaEntries((prev) =>
          prev.map((entry) =>
            entry.id === entryId
              ? { ...entry, status: "error", answer: errorText || "Unable to reach the assistant." }
              : entry
          )
        );
        setAskStatus({ type: "error", message: "Unable to get a response from the assistant." });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let doneStreaming = false;

      while (!doneStreaming) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let lineEnd = buffer.indexOf("\n");
        while (lineEnd >= 0) {
          const line = buffer.slice(0, lineEnd).trimEnd();
          buffer = buffer.slice(lineEnd + 1);
          if (line.startsWith("data:")) {
            const data = line.replace(/^data:\s*/, "").trim();
            if (data === "[DONE]") {
              doneStreaming = true;
              break;
            }
            try {
              const event = JSON.parse(data);
              const delta =
                typeof event?.delta === "string"
                  ? event.delta
                  : typeof event?.response?.output_text?.delta === "string"
                    ? event.response.output_text.delta
                    : typeof event?.output_text?.delta === "string"
                      ? event.output_text.delta
                      : event?.type === "response.output_text.delta" && typeof event?.delta === "string"
                        ? event.delta
                        : "";
              if (delta) {
                setQaEntries((prev) =>
                  prev.map((entry) => (entry.id === entryId ? { ...entry, answer: entry.answer + delta } : entry))
                );
              }
            } catch {
              // Ignore malformed chunks
            }
          }
          lineEnd = buffer.indexOf("\n");
        }
      }

      setQaEntries((prev) => prev.map((entry) => (entry.id === entryId ? { ...entry, status: "done" } : entry)));
      setAskStatus({ type: "success", message: "Response ready." });
    } catch (error) {
      setQaEntries((prev) =>
        prev.map((entry) =>
          entry.id === entryId ? { ...entry, status: "error", answer: "An error occurred while processing the request." } : entry
        )
      );
      setAskStatus({ type: "error", message: "Unable to process the question right now." });
    } finally {
      setIsAsking(false);
    }
  };

  const pages = useMemo(
    () => ({
      overview: { name: "Overview", icon: "OV" },
      revenue: { name: "Revenue and Costs", icon: "RC" },
      fleet: { name: "Fleet Performance", icon: "FP" },
      fuel: { name: "Fuel Analytics", icon: "FU" },
      ask: { name: "Ask Question", icon: "AQ" },
    }),
    []
  );

  const pageOrder = ["overview", "revenue", "fleet", "fuel", "ask"];
  const currentIndex = pageOrder.indexOf(currentPage);
  const prevPage = currentIndex > 0 ? pageOrder[currentIndex - 1] : null;
  const nextPage = currentIndex < pageOrder.length - 1 ? pageOrder[currentIndex + 1] : null;

  const OverviewPage = () => {
    const { kpis, revenueVsCosts } = dashboardData;
    const monthlyData = revenueVsCosts.map((item) => ({
      ...item,
      totalCosts: item.fuel + item.maintenance + item.fixedCosts,
    }));
    const totalMaintenance = revenueVsCosts.reduce((sum, item) => sum + item.maintenance, 0);
    const maintenancePerKm = kpis.totalKmTraveled ? totalMaintenance / kpis.totalKmTraveled : 0;
    const revenuePerKm = kpis.totalKmTraveled ? kpis.totalRevenue / kpis.totalKmTraveled : 0;

    return (
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">Fleet Dashboard Overview</h1>
          <p className="page-subtitle">Operations snapshot for revenue, costs, and utilization</p>
        </div>

        <div className="kpi-grid">
          <KPICard label="Total Revenue" value={formatCurrency(kpis.totalRevenue)} variant="primary" change="+12.5%" />
          <KPICard label="Total Costs" value={formatCurrency(kpis.totalCosts)} variant="warning" change="+3.2%" />
          <KPICard label="Net Profit" value={formatCurrency(kpis.profit)} variant="success" change="+18.7%" />
          <KPICard label="Profit Margin" value={`${formatNumber(kpis.profitMargin, 1)}%`} variant="secondary" change="+2.1%" />
        </div>

        <div className="kpi-grid">
          <KPICard label="Fleet Size" value={kpis.totalFleetSize} variant="primary" />
          <KPICard label="Total KM Traveled" value={formatNumber(kpis.totalKmTraveled)} variant="secondary" />
          <KPICard label="Fuel Consumed" value={`${formatNumber(kpis.totalFuelConsumed)} L`} variant="warning" />
          <KPICard label="Avg Efficiency" value={`${formatNumber(kpis.avgFuelEfficiency, 2)} km/L`} variant="success" />
        </div>

        <div className="chart-container">
          <h2 className="chart-title">Monthly Revenue vs Total Costs</h2>
          <ResponsiveContainer width="100%" height={360}>
            <ComposedChart data={monthlyData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5a4" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#0ea5a4" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.08)",
                }}
              />
              <Legend />
              <Area type="monotone" dataKey="revenue" fill="url(#colorRevenue)" stroke="#0ea5a4" strokeWidth={3} />
              <Bar dataKey="totalCosts" fill="#f97316" radius={[8, 8, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h2 className="chart-title">Key Metrics Snapshot</h2>
          <div className="kpi-grid">
            <KPICard label="Maintenance Cost per KM" value={formatCurrency(maintenancePerKm, 2)} variant="warning" />
            <KPICard label="Revenue per KM" value={formatCurrency(revenuePerKm, 2)} variant="primary" />
            <KPICard label="Fuel Efficiency" value={`${formatNumber(kpis.avgFuelEfficiency, 2)} km/L`} variant="success" />
          </div>
        </div>
      </div>
    );
  };

  const RevenuePage = () => {
    const { revenueVsCosts } = dashboardData;
    const monthlyData = revenueVsCosts.map((item) => ({
      ...item,
      totalCosts: item.fuel + item.maintenance + item.fixedCosts,
      profit: item.revenue - (item.fuel + item.maintenance + item.fixedCosts),
    }));

    return (
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">Revenue and Cost Analysis</h1>
          <p className="page-subtitle">Monthly breakdown of revenue and cost components</p>
        </div>

        <div className="chart-container">
          <h2 className="chart-title">Revenue vs Cost Components</h2>
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "8px" }} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#0ea5a4" strokeWidth={3} dot={{ r: 5 }} />
              <Line type="monotone" dataKey="fuel" stroke="#f59e0b" strokeWidth={2} />
              <Line type="monotone" dataKey="maintenance" stroke="#ef4444" strokeWidth={2} />
              <Line type="monotone" dataKey="fixedCosts" stroke="#0ea5e9" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h2 className="chart-title">Monthly Profit Trend</h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "8px" }} />
              <Legend />
              <Bar dataKey="profit" fill="#16a34a" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const FleetPage = () => {
    const { costByTruckType, topTrucks, maintenanceByYear } = dashboardData;
    const colors = ["#0ea5a4", "#0ea5e9", "#f59e0b", "#16a34a"];
    const maintenanceTypes = costByTruckType.map((item) => item.truckType);

    return (
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">Fleet Performance Metrics</h1>
          <p className="page-subtitle">Cost profile by truck type and top performers</p>
        </div>

        <div className="chart-container">
          <h2 className="chart-title">Cost per KM by Truck Type</h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={costByTruckType}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="truckType" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "8px" }} />
              <Legend />
              <Bar dataKey="costPerKm" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h2 className="chart-title">Maintenance Cost by Year (by Truck Type)</h2>
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={maintenanceByYear}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" stroke="#64748b" />
              <YAxis yAxisId="left" stroke="#64748b" tickFormatter={(value) => formatNumber(value)} />
              <YAxis yAxisId="right" orientation="right" stroke="#64748b" tickFormatter={(value) => formatNumber(value)} />
              <Tooltip
                contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              {maintenanceTypes.map((truckType, index) => (
                <Bar key={truckType} dataKey={truckType} yAxisId="left" fill={colors[index % colors.length]} radius={[6, 6, 0, 0]} />
              ))}
              <Line type="monotone" dataKey="total" yAxisId="right" stroke="#1f2937" strokeWidth={3} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>
          <div className="chart-container">
            <h2 className="chart-title">Total Cost Distribution</h2>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={costByTruckType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => (entry.payload as CostByTruckType | undefined)?.truckType ?? ""}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="totalCost"
                >
                  {costByTruckType.map((entry, index) => (
                    <Cell key={`cell-${entry.truckType}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="table-container">
            <h2 className="chart-title">Top Performing Trucks</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Truck ID</th>
                  <th>Type</th>
                  <th>Profit</th>
                  <th>Cost per KM</th>
                </tr>
              </thead>
              <tbody>
                {topTrucks.map((truck) => (
                  <tr key={truck.truckId}>
                    <td>
                      <strong>#{truck.truckId}</strong>
                    </td>
                    <td>{truck.truckType}</td>
                    <td style={{ color: "#16a34a", fontWeight: 600 }}>{formatCurrency(truck.profit)}</td>
                    <td>{formatCurrency(truck.costPerKm, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const FuelPage = () => {
    const { fuelEfficiency, fuelTrend } = dashboardData;

    return (
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">Fuel Consumption Analytics</h1>
          <p className="page-subtitle">Efficiency metrics and consumption trends</p>
        </div>

        <div className="chart-container">
          <h2 className="chart-title">Fuel Efficiency by Truck Type (km per L)</h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={fuelEfficiency}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="truckType" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "8px" }} />
              <Legend />
              <Bar dataKey="efficiency" fill="#16a34a" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h2 className="chart-title">Monthly Fuel Consumption Trend</h2>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={fuelTrend}>
              <defs>
                <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "8px" }} />
              <Legend />
              <Area type="monotone" dataKey="liters" fill="url(#colorFuel)" stroke="#f59e0b" strokeWidth={3} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="table-container">
          <h2 className="chart-title">Fuel Efficiency Summary</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Truck Type</th>
                <th>Efficiency (km per L)</th>
                <th>Total Liters</th>
                <th>Total KM</th>
              </tr>
            </thead>
            <tbody>
              {fuelEfficiency.map((item) => (
                <tr key={item.truckType}>
                  <td>
                    <strong>{item.truckType}</strong>
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatNumber(item.efficiency, 2)}</td>
                  <td>{formatNumber(item.totalLiters)}</td>
                  <td>{formatNumber(item.totalKm)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const AskPage = () => (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Ask Fleet Questions</h1>
        <p className="page-subtitle">Query the uploaded data with AI-powered insights</p>
      </div>

      <div className="ask-card">
        <label className="ask-label" htmlFor="ask-input">
          Your question
        </label>
        <textarea
          id="ask-input"
          className="ask-input"
          placeholder="Which Drive ID is most fuel efficient (KM per L)?"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={4}
        />
        <div className="ask-examples">
          <span className="ask-label">Example questions</span>
          <div className="example-list">
            {[
              "Which Drive ID is most fuel efficient (KM per L)?",
              "Which truck type has the best fuel efficiency?",
              "Top 3 trucks by profit this period?",
            ].map((example) => (
              <button key={example} type="button" className="example-item" onClick={() => setQuestion(example)}>
                {example}
              </button>
            ))}
          </div>
        </div>
        <div className="ask-actions">
          <button className="btn btn-primary" onClick={handleAskQuestion} disabled={isAsking}>
            {isAsking ? "Asking..." : "Ask Question"}
          </button>
          <span className={`status-text ${askStatus.type === "error" ? "error" : ""}`}>{askStatus.message}</span>
        </div>
      </div>

      <div className="qa-list">
        {qaEntries.map((entry) => (
          <div key={entry.id} className="qa-entry">
            <div className="qa-question">
              <span className="qa-label">Question</span>
              <p>{entry.question}</p>
            </div>
            <div className={`qa-answer ${entry.status === "error" ? "error" : ""}`}>
              <span className="qa-label">Answer</span>
              <p>{entry.answer || (entry.status === "streaming" ? "Thinking..." : "No response yet.")}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPage = () => {
    switch (currentPage) {
      case "revenue":
        return <RevenuePage />;
      case "fleet":
        return <FleetPage />;
      case "fuel":
        return <FuelPage />;
      case "ask":
        return <AskPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>FleetCommand</h1>
          <p>Advanced fleet analytics and insight</p>
        </div>
        <nav className="sidebar-nav">
          {Object.entries(pages).map(([id, page]) => (
            <div key={id} className={`nav-item ${currentPage === id ? "active" : ""}`} onClick={() => setCurrentPage(id)}>
              <span className="nav-icon">{page.icon}</span>
              <span>{page.name}</span>
            </div>
          ))}
        </nav>
        <div style={{ padding: "0 1.5rem", marginTop: "1.5rem" }}>
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleExport}>
            Download PDF
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="upload-card">
          <h2 className="chart-title">Upload Fleet Data</h2>
          <div className="upload-grid">
            <div className="upload-field">
              <label>Vehicles File</label>
              <input type="file" accept=".xlsx,.xls" onChange={(event) => setVehiclesFile(event.target.files?.[0] ?? null)} />
            </div>
            <div className="upload-field">
              <label>Freight File</label>
              <input type="file" accept=".xlsx,.xls" onChange={(event) => setFreightFile(event.target.files?.[0] ?? null)} />
            </div>
            <div className="upload-field">
              <label>Cost File</label>
              <input type="file" accept=".xlsx,.xls" onChange={(event) => setCostFile(event.target.files?.[0] ?? null)} />
            </div>
            <div className="upload-field">
              <label>Drivers File</label>
              <input type="file" accept=".xlsx,.xls" onChange={(event) => setDriversFile(event.target.files?.[0] ?? null)} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Generating..." : "Generate Dashboard"}
          </button>
          {status.message && (
            <p className={`status-text ${status.type === "error" ? "error" : ""}`}>{status.message}</p>
          )}
        </div>

        {renderPage()}

        <div className="navigation-buttons">
          <button
            className="btn btn-secondary"
            onClick={() => prevPage && setCurrentPage(prevPage)}
            disabled={!prevPage}
            style={{ opacity: prevPage ? 1 : 0.5 }}
          >
            Previous
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => nextPage && setCurrentPage(nextPage)}
            disabled={!nextPage}
            style={{ opacity: nextPage ? 1 : 0.5 }}
          >
            Next
          </button>
        </div>
      </main>
    </div>
  );
}
