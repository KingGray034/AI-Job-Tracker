"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type Interview = { scheduledAt: Date; type: string };

type Application = {
  id: string;
  position: string;
  company: { name: string };
  dateApplied: Date;
  salary?: string | null;
  location?: string | null;
  contactEmail?: string | null;
  status: string;
  interviews?: Interview[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBorderColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: "border-retro-teal",
    APPLIED: "border-retro-orange",
    SCREENING: "border-retro-yellow",
    INTERVIEW: "border-retro-purple",
    OFFER: "border-retro-green",
    REJECTED: "border-retro-red",
  };
  return map[status] ?? "border-retro-border";
}

function getStatusLabel(
  status: string,
  dateApplied: Date,
  interviews?: Interview[],
): string {
  const date = format(new Date(dateApplied), "MMM d, yyyy").toUpperCase();

  if (status === "INTERVIEW") {
    const firstInterview = interviews?.[0];
    const round = firstInterview?.type
      ? parseInt(firstInterview.type.replace("Round ", ""), 10) || 1
      : 1;
    const interviewDate = firstInterview?.scheduledAt
      ? format(
          new Date(firstInterview.scheduledAt),
          "MMM d, yyyy",
        ).toUpperCase()
      : date;
    return `ROUND ${round}: ${interviewDate}`;
  }

  const labels: Record<string, string> = {
    PENDING: `POSTED: ${date}`,
    APPLIED: `APPLIED: ${date}`,
    SCREENING: `CALL: ${date}`,
    OFFER: `OFFER RECEIVED: ${date}`,
    REJECTED: `CLOSED: ${date}`,
  };

  return labels[status] ?? `POSTED: ${date}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

function ApplicationCard({
  application,
  isRejected,
}: {
  application: Application;
  isRejected?: boolean;
}) {
  const router = useRouter();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: application.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const statusLabel = getStatusLabel(
    application.status,
    application.dateApplied,
    application.interviews,
  );

  const borderColor = getBorderColor(application.status);

  const handleClick = () => {
    if (!isDragging) {
      const params = new URLSearchParams(window.location.search);
      const currentView = params.get("view") || "kanban";
      router.push(`/application/${application.id}?returnView=${currentView}`);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative bg-white border-4 ${borderColor} p-6 w-full min-h-80 flex flex-col justify-between retro-card-shadow cursor-grab active:cursor-grabbing ${
        isRejected ? "bg-slate-50 opacity-70" : ""
      }`}
      onClick={handleClick}
    >
      <div className="space-y-4">
        <span className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">
          REF #{application.id.slice(-6)}
        </span>

        <h4
          className={`text-xl font-bold leading-tight ${isRejected ? "line-through" : ""}`}
        >
          {application.position}
        </h4>

        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-2">
            <span>🏢</span> {application.company.name}
          </p>
          {application.location && (
            <p className="text-sm text-slate-600 flex items-center gap-2">
              <span>📍</span> {application.location}
            </p>
          )}
          {application.contactEmail && (
            <p className="text-sm text-slate-600 flex items-center gap-2 break-all">
              <span>✉️</span> {application.contactEmail}
            </p>
          )}
          {application.salary ? (
            <p className="text-sm text-slate-600 flex items-center gap-2">
              <span>💰</span> {application.salary}
            </p>
          ) : (
            <p className="text-sm text-slate-400 italic flex items-center gap-2">
              <span>💰</span> Salary not specified
            </p>
          )}
        </div>
      </div>

      <div
        className={`pt-4 mt-4 ${
          application.status === "OFFER"
            ? "border-t-2 border-primary"
            : "border-t border-dashed border-retro-border/30"
        }`}
      >
        <p
          className={`text-[11px] font-bold ${
            application.status === "OFFER"
              ? "text-primary"
              : application.status === "REJECTED"
                ? "text-red-700"
                : "text-slate-500"
          }`}
        >
          {statusLabel}
        </p>
      </div>
    </div>
  );
}

export { ApplicationCard };
