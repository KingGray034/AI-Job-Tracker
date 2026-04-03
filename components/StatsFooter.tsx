"use client";

import { trpc } from "@/utils/trpc";

// ─── Sub-components ───────────────────────────────────────────────────────────

function Stat({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <span className={`font-serif text-4xl font-bold ${color ?? ""}`}>
        {value}
      </span>
      <span className="text-xs font-bold tracking-[0.2em] uppercase text-retro-border/60">
        {label}
      </span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

function StatsFooter() {
  const { data: groupedApps } = trpc.application.getByStatus.useQuery();

  const totalApps = groupedApps ? Object.values(groupedApps).flat().length : 0;
  const activeScreenings = groupedApps?.SCREENING?.length ?? 0;
  const offers = groupedApps?.OFFER?.length ?? 0;

  return (
    <footer className="mt-16 pt-8 border-t-4 border-retro-border flex flex-wrap gap-12 justify-center">
      <Stat value={totalApps} label="Total Apps" />
      <Stat
        value={activeScreenings}
        label="Active Screens"
        color="text-retro-teal"
      />
      <Stat value={offers} label="Offers" color="text-primary" />
    </footer>
  );
}

export { StatsFooter };
