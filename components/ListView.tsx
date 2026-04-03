"use client";

import { trpc } from "@/utils/trpc";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type ListViewProps = {
  searchTerm?: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_BADGE_COLORS: Record<string, string> = {
  PENDING: "bg-retro-teal text-retro-border",
  APPLIED: "bg-retro-orange text-retro-border",
  SCREENING: "bg-retro-yellow text-retro-border",
  INTERVIEW: "bg-retro-purple text-white",
  OFFER: "bg-retro-green text-retro-border",
  REJECTED: "bg-retro-red text-white",
};

// ─── Component ────────────────────────────────────────────────────────────────

function ListView({ searchTerm = "" }: ListViewProps) {
  const router = useRouter();
  const { data: applications, isLoading } = trpc.application.getAll.useQuery();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-retro-border">Loading applications...</p>
      </div>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <div className="bg-white border-4 border-retro-border retro-card-shadow p-12 text-center">
        <p className="text-retro-border text-lg font-bold">
          No applications yet!
        </p>
      </div>
    );
  }

  const filteredApps = applications.filter((app) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return [
      app.position,
      app.company?.name,
      app.location,
      app.status,
      app.contactEmail,
      app.id?.slice(-6),
    ]
      .filter(Boolean)
      .some((val) => String(val).toLowerCase().includes(term));
  });

  const handleRowClick = (appId: string) => {
    const params = new URLSearchParams(window.location.search);
    const currentView = params.get("view") || "list";
    router.push(`/application/${appId}?returnView=${currentView}`);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-retro-border text-white">
            <tr>
              {[
                "Position",
                "Company",
                "Contact",
                "Location",
                "Salary",
                "Status",
                "Applied Date",
              ].map((header) => (
                <th
                  key={header}
                  className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-retro-border">
            {filteredApps.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-8 text-center text-retro-border font-medium"
                >
                  No applications match your search
                </td>
              </tr>
            ) : (
              filteredApps.map((app) => (
                <tr
                  key={app.id}
                  onClick={() => handleRowClick(app.id)}
                  className="hover:bg-retro-yellow/30 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">
                      {app.position}
                    </div>
                    <div className="text-xs text-gray-500">
                      REF #{app.id.slice(-6).toUpperCase()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {app.company.name}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {app.contactEmail || "-"}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {app.location || "-"}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {app.salary || (
                      <span className="text-gray-400 italic">
                        Not specified
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border-2 border-retro-border ${
                        STATUS_BADGE_COLORS[app.status] ??
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {format(new Date(app.dateApplied), "MMM d, yyyy")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { ListView };
