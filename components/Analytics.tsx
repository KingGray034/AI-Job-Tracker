"use client";

import { trpc } from "@/utils/trpc";
import { useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  format,
  subDays,
  subMonths,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from "date-fns";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  PENDING: "#6ba3a3",
  APPLIED: "#d98c5f",
  SCREENING: "#e9d8a6",
  INTERVIEW: "#9b81a1",
  OFFER: "#a3b18a",
  REJECTED: "#c57b7d",
  ACCEPTED: "#a3b18a",
} as const;

type StatusKey = keyof typeof STATUS_COLORS;

const DATE_RANGE_OPTIONS = {
  last_30_days: { label: "LAST 30 DAYS", days: 30, months: null },
  last_3_months: { label: "LAST 3 MONTHS", days: null, months: 3 },
  last_6_months: { label: "LAST 6 MONTHS", days: null, months: 6 },
  last_year: { label: "LAST YEAR", days: null, months: 12 },
  all_time: { label: "ALL TIME", days: null, months: null },
} as const;

type DateRangeKey = keyof typeof DATE_RANGE_OPTIONS;

const TOOLTIP_STYLE = {
  backgroundColor: "white",
  border: "3px solid #1a1a1a",
  borderRadius: "0",
  fontSize: "12px",
  fontWeight: "bold",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-white border-4 border-retro-border retro-card-shadow p-6">
      <p className="text-xs font-bold tracking-[0.2em] uppercase text-retro-border/60 mb-2">
        {label}
      </p>
      <p className={`font-serif text-4xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function CustomPieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { fill: string } }[];
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  return (
    <div
      className="border-2 border-retro-border px-2 py-1"
      style={{ backgroundColor: data.payload.fill }}
    >
      <p className="text-xs font-bold text-white">
        {data.name}: {data.value}
      </p>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDateRange(option: DateRangeKey): { start: Date; end: Date } | null {
  const now = new Date();
  const { days, months } = DATE_RANGE_OPTIONS[option];
  if (!days && !months) return null;
  return {
    start: days ? subDays(now, days) : subMonths(now, months!),
    end: now,
  };
}

function calcRate(count: number, total: number): string {
  return total > 0 ? ((count / total) * 100).toFixed(1) : "0";
}

// ─── Main Component ───────────────────────────────────────────────────────────

function Analytics() {
  const { data: applications } = trpc.application.getAll.useQuery();
  const [dateRangeOption, setDateRangeOption] =
    useState<DateRangeKey>("last_6_months");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
    Object.keys(STATUS_COLORS),
  );

  if (!applications || applications.length === 0) {
    return (
      <div className="bg-white border-4 border-retro-border retro-card-shadow p-12 text-center">
        <p className="text-retro-border font-bold text-lg">
          Add some applications to see analytics!
        </p>
      </div>
    );
  }

  // ─── Filtered Data ──────────────────────────────────────────────────────────

  const dateRange = getDateRange(dateRangeOption);

  const filteredAppsForChart = applications.filter((app) => {
    if (!selectedStatuses.includes(app.status)) return false;
    if (dateRange) {
      const appDate = new Date(app.dateApplied);
      if (
        !isWithinInterval(appDate, {
          start: startOfDay(dateRange.start),
          end: endOfDay(dateRange.end),
        })
      )
        return false;
    }
    return true;
  });

  // ─── Metrics (all applications) ─────────────────────────────────────────────

  const totalApps = applications.length;
  const appliedCount = applications.filter(
    (a) => a.status !== "PENDING",
  ).length;

  const responseRate = calcRate(
    applications.filter(
      (a) => !["PENDING", "APPLIED", "REJECTED"].includes(a.status),
    ).length,
    appliedCount,
  );
  const offerRate = calcRate(
    applications.filter((a) => a.status === "OFFER").length,
    appliedCount,
  );
  const rejectionRate = calcRate(
    applications.filter((a) => a.status === "REJECTED").length,
    appliedCount,
  );

  // ─── Chart Data ─────────────────────────────────────────────────────────────

  const statusData = (Object.keys(STATUS_COLORS) as StatusKey[])
    .map((status) => ({
      name: status,
      value: applications.filter((app) => app.status === status).length,
      fill: STATUS_COLORS[status],
    }))
    .filter((item) => item.value > 0);

  const daysToShow = Math.min(
    DATE_RANGE_OPTIONS[dateRangeOption].days ??
      (DATE_RANGE_OPTIONS[dateRangeOption].months ?? 6) * 30,
    30,
  );

  const chartData = Array.from({ length: daysToShow }, (_, i) => {
    const date = subDays(new Date(), daysToShow - 1 - i);
    const dateStr = format(date, "MMM d");
    const dayApps = filteredAppsForChart.filter(
      (app) =>
        format(new Date(app.dateApplied), "MMM d, yyyy") ===
        format(date, "MMM d, yyyy"),
    );

    return {
      date: dateStr,
      ...(Object.keys(STATUS_COLORS) as StatusKey[]).reduce(
        (acc, status) => ({
          ...acc,
          [status]: dayApps.filter((app) => app.status === status).length,
        }),
        {} as Record<StatusKey, number>,
      ),
    };
  });

  const recentActivity = [...applications]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 5);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const toggleStatus = (status: string) =>
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total Applications"
          value={totalApps}
          color="text-retro-border"
        />
        <MetricCard
          label="Response Rate"
          value={`${responseRate}%`}
          color="text-retro-teal"
        />
        <MetricCard
          label="Offer Rate"
          value={`${offerRate}%`}
          color="text-retro-green"
        />
        <MetricCard
          label="Rejection Rate"
          value={`${rejectionRate}%`}
          color="text-retro-red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border-4 border-retro-border retro-card-shadow p-6">
          <h3 className="font-serif text-2xl font-bold mb-6 uppercase tracking-widest text-retro-border bg-retro-yellow/30 px-4 py-2 border-2 border-retro-border inline-block">
            Application Status
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                }
                outerRadius={80}
                dataKey="value"
                stroke="#1a1a1a"
                strokeWidth={2}
                isAnimationActive={false}
              />
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border-4 border-retro-border retro-card-shadow p-6">
          <h3 className="font-serif text-2xl font-bold mb-4 uppercase tracking-widest text-retro-border bg-retro-orange/30 px-4 py-2 border-2 border-retro-border inline-block">
            Applications Trend
          </h3>

          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={chartData}
              barSize={16}
              barGap={2}
              barCategoryGap="15%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a33" />
              <XAxis
                dataKey="date"
                stroke="#1a1a1a"
                style={{ fontSize: "10px", fontWeight: "bold" }}
              />
              <YAxis
                stroke="#1a1a1a"
                style={{ fontSize: "11px", fontWeight: "bold" }}
                allowDecimals={false}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              {selectedStatuses.map((status) => (
                <Bar
                  key={status}
                  dataKey={status}
                  fill={STATUS_COLORS[status as StatusKey]}
                  stroke="#1a1a1a"
                  strokeWidth={1}
                  name={status}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-4 pt-3 border-t-2 border-retro-border space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-retro-border/60">
                RANGE:
              </span>
              <select
                value={dateRangeOption}
                onChange={(e) =>
                  setDateRangeOption(e.target.value as DateRangeKey)
                }
                className="h-8 border-2 border-retro-border px-3 py-1 text-[11px] font-bold uppercase tracking-wider bg-white focus:outline-none focus:border-primary retro-button-shadow"
              >
                {(
                  Object.entries(DATE_RANGE_OPTIONS) as [
                    DateRangeKey,
                    { label: string },
                  ][]
                ).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(STATUS_COLORS) as StatusKey[]).map((status) => (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)}
                  className={`px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider border-2 border-retro-border retro-button-shadow transition-all hover:scale-105 ${
                    selectedStatuses.includes(status)
                      ? "text-white"
                      : "bg-white text-retro-border opacity-40 hover:opacity-60"
                  }`}
                  style={{
                    backgroundColor: selectedStatuses.includes(status)
                      ? STATUS_COLORS[status]
                      : undefined,
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-4 border-retro-border retro-card-shadow p-6">
        <h3 className="font-serif text-lg font-bold mb-4 uppercase tracking-wider text-retro-border bg-retro-green/30 px-3 py-1 border-2 border-retro-border inline-block">
          Recent Activity
        </h3>
        <div className="space-y-3">
          {recentActivity.map((app) => (
            <div
              key={app.id}
              className="flex items-center justify-between border-l-4 bg-retro-teal/5 pl-4 pr-4 py-3"
              style={{
                borderLeftColor: STATUS_COLORS[app.status as StatusKey],
              }}
            >
              <div className="flex-1">
                <p className="font-bold text-sm text-retro-border">
                  {app.position}
                </p>
                <p className="text-xs text-retro-border/60">
                  {app.company.name} • Updated{" "}
                  {format(new Date(app.updatedAt), "MMM d, h:mm a")}
                </p>
              </div>
              <span
                className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider border-2 border-retro-border text-white"
                style={{
                  backgroundColor: STATUS_COLORS[app.status as StatusKey],
                }}
              >
                {app.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { Analytics };
