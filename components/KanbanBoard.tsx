"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { ApplicationCard } from "./ApplicationCard";
import { Status } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type App = {
  id: string;
  status: Status;
  position?: string;
  company?: { name: string };
  location?: string;
  contactEmail?: string;
  [key: string]: unknown;
};

type Column = { id: string; title: string; color: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const COLUMNS: Column[] = [
  { id: "PENDING", title: "To Apply", color: "bg-retro-teal" },
  { id: "APPLIED", title: "Applied", color: "bg-retro-orange" },
  { id: "SCREENING", title: "Screening", color: "bg-retro-yellow" },
  { id: "INTERVIEW", title: "Interview", color: "bg-retro-purple" },
  { id: "OFFER", title: "Offer", color: "bg-retro-green" },
  { id: "REJECTED", title: "Rejected", color: "bg-retro-red" },
];

// ─── DroppableColumn ──────────────────────────────────────────────────────────

function DroppableColumn({ column, apps }: { column: Column; apps: App[] }) {
  const { setNodeRef } = useDroppable({ id: column.id });
  const [currentIndex, setCurrentIndex] = useState(0);

  const hasMultiple = apps.length > 1;
  const currentApp = apps[currentIndex];

  const handlePrev = () =>
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : apps.length - 1));

  const handleNext = () =>
    setCurrentIndex((prev) => (prev < apps.length - 1 ? prev + 1 : 0));

  return (
    <section
      ref={setNodeRef}
      className={`${column.color} border-4 border-retro-border p-6 flex flex-col items-center relative min-h-100`}
    >
      <h3 className="font-serif text-lg font-bold mb-4 uppercase tracking-wider text-retro-border bg-white/30 px-3 py-1 border-2 border-retro-border">
        {column.title}
      </h3>

      <SortableContext
        items={apps.map((app) => app.id)}
        strategy={verticalListSortingStrategy}
      >
        {apps.length === 0 ? (
          <div className="grow flex items-center justify-center">
            <p className="text-sm text-retro-border/50 font-medium">
              No applications
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full grow gap-2">
            {hasMultiple ? (
              <button
                onClick={handlePrev}
                className="size-10 bg-white border-2 border-retro-border flex items-center justify-center hover:bg-primary/10 retro-button-shadow shrink-0"
              >
                <span className="text-2xl">&lt;</span>
              </button>
            ) : (
              <div className="size-10" />
            )}

            <div
              className={`relative w-full h-full flex items-center justify-center ${hasMultiple ? "card-stack" : ""}`}
            >
              {currentApp && (
                <div key={currentIndex} className="card-slide-in w-full">
                  <ApplicationCard
                    application={
                      currentApp as Parameters<
                        typeof ApplicationCard
                      >[0]["application"]
                    }
                    isRejected={column.id === "REJECTED"}
                  />
                </div>
              )}
            </div>

            {hasMultiple ? (
              <button
                onClick={handleNext}
                className="size-10 bg-white border-2 border-retro-border flex items-center justify-center hover:bg-primary/10 retro-button-shadow shrink-0"
              >
                <span className="text-2xl">&gt;</span>
              </button>
            ) : (
              <div className="size-10" />
            )}
          </div>
        )}
      </SortableContext>
    </section>
  );
}

// ─── KanbanBoard ──────────────────────────────────────────────────────────────

function KanbanBoard({ searchTerm = "" }: { searchTerm?: string }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<{
    id: string;
    status: Status;
  } | null>(null);
  const [interviewRound, setInterviewRound] = useState("1");

  const utils = trpc.useUtils();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const { data: groupedApps, isLoading } =
    trpc.application.getByStatus.useQuery();

  const updateStatus = trpc.application.updateStatus.useMutation({
    onSuccess: () => utils.application.getByStatus.invalidate(),
  });

  const createInterview = trpc.interview.create.useMutation();

  const handleDragStart = (event: DragStartEvent) =>
    setActiveId(event.active.id as string);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const appId = active.id as string;
    const allApps = groupedApps ? Object.values(groupedApps).flat() : [];

    const isColumn = COLUMNS.find((col) => col.id === over.id);
    const newStatus = (
      isColumn
        ? over.id
        : (allApps.find((app) => app.id === over.id)?.status ?? null)
    ) as Status | null;

    if (!newStatus) {
      setActiveId(null);
      return;
    }

    const app = allApps.find((a) => a.id === appId);

    if (app && app.status !== newStatus) {
      if (newStatus === "INTERVIEW") {
        setPendingUpdate({ id: appId, status: newStatus });
        setShowInterviewModal(true);
      } else {
        updateStatus.mutate({ id: appId, status: newStatus });
      }
    }

    setActiveId(null);
  };

  const handleInterviewSubmit = () => {
    if (!pendingUpdate) return;
    updateStatus.mutate(pendingUpdate);
    createInterview.mutate({
      applicationId: pendingUpdate.id,
      round: parseInt(interviewRound),
    });
    setShowInterviewModal(false);
    setPendingUpdate(null);
    setInterviewRound("1");
  };

  const filterApps = (apps: App[]) => {
    if (!searchTerm.trim()) return apps;
    const term = searchTerm.toLowerCase();
    return apps.filter((app) =>
      [
        app.position,
        app.company?.name,
        app.location,
        app.status,
        app.id?.slice(-6),
        app.contactEmail,
      ]
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(term)),
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-retro-border">Loading applications...</p>
      </div>
    );
  }

  const allApps = groupedApps ? Object.values(groupedApps).flat() : [];
  const activeApp = allApps.find((app) => app.id === activeId);

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {COLUMNS.map((column) => {
            const apps = groupedApps?.[column.id as Status] || [];
            return (
              <DroppableColumn
                key={column.id}
                column={column}
                apps={filterApps(apps as App[])}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeApp && (
            <div className="rotate-2 opacity-80">
              <ApplicationCard
                application={
                  activeApp as Parameters<
                    typeof ApplicationCard
                  >[0]["application"]
                }
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {showInterviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border-4 border-retro-border p-6 max-w-md w-full retro-card-shadow">
            <h3 className="font-serif text-xl font-bold mb-3 text-center">
              Interview Round
            </h3>
            <p className="mb-4 text-center">What round is this interview?</p>
            <input
              type="number"
              min="1"
              value={interviewRound}
              onChange={(e) => setInterviewRound(e.target.value)}
              className="w-full px-4 py-2 border-2 border-retro-border mb-4"
              placeholder="Round number"
            />
            <div className="flex gap-4">
              <button
                onClick={handleInterviewSubmit}
                className="flex-1 bg-primary text-white px-4 py-2 border-2 border-retro-border font-bold retro-button-shadow hover:bg-primary/90"
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setShowInterviewModal(false);
                  setPendingUpdate(null);
                }}
                className="flex-1 bg-white px-4 py-2 border-2 border-retro-border font-bold retro-button-shadow hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { KanbanBoard };
