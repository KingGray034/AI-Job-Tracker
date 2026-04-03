"use client";

import { ApplicationForm } from "@/components/ApplicationForm";
import { KanbanBoard } from "@/components/KanbanBoard";
import { ListView } from "@/components/ListView";
import { Analytics } from "@/components/Analytics";
import { SearchBar } from "@/components/SearchBar";
import { StatsFooter } from "@/components/StatsFooter";
import { GmailImportModal } from "@/components/GmailImportModal";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type View = "kanban" | "list" | "analytics";

function HomeContent() {
  const searchParams = useSearchParams();
  const returnView = searchParams.get("view") as View | null;

  const [view, setView] = useState<View>(returnView || "kanban");
  const [activeSearch, setActiveSearch] = useState("");
  const [showGmailImport, setShowGmailImport] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("view", view);
    window.history.replaceState({}, "", url);
  }, [view]);

  return (
    <main className="min-h-screen bg-background-light">
      <div className="max-w-300 mx-auto px-6 py-8">
        <header className="flex flex-col items-center gap-8 mb-12">
          <div className="w-full flex justify-between items-center border-b-4 border-retro-border pb-6">
            <h1 className="font-serif text-4xl font-bold tracking-tight">
              Job Application Tracker
            </h1>

            <div className="flex items-center gap-6">
              <nav className="flex gap-6">
                {(["kanban", "list", "analytics"] as View[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-5 py-2 bg-white border-4 border-retro-border font-serif font-bold uppercase tracking-wider text-sm retro-button-shadow hover:bg-retro-yellow transition-colors ${
                      view === v ? "text-retro-border" : "text-retro-border/50"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </nav>

              <div className="h-8 w-0.5 bg-retro-border/20" />

              <button
                onClick={() => setShowGmailImport(true)}
                className="px-5 py-2 bg-retro-teal text-white border-4 border-retro-border font-serif font-bold uppercase tracking-wider text-sm retro-button-shadow hover:bg-retro-teal/90 transition-all whitespace-nowrap"
              >
                Import from Gmail
              </button>

              <ApplicationForm />
            </div>
          </div>

          {view !== "analytics" && <SearchBar onSearch={setActiveSearch} />}
        </header>

        {view === "kanban" && <KanbanBoard searchTerm={activeSearch} />}
        {view === "list" && <ListView searchTerm={activeSearch} />}
        {view === "analytics" && <Analytics />}

        <StatsFooter />
      </div>

      {showGmailImport && (
        <GmailImportModal onCloseAction={() => setShowGmailImport(false)} />
      )}
    </main>
  );
}

function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background-light flex items-center justify-center">
          <p className="text-retro-border font-bold text-xl">Loading...</p>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}

export default Home;
