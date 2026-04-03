"use client";

import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { Status } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type FormFields = {
  position: string;
  companyName: string;
  companyWebsite: string;
  status: Status;
  jobDescription: string;
  salary: string;
  location: string;
  contactEmail: string;
  jobUrl: string;
  notes: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFormFields(form: HTMLFormElement): FormFields {
  const d = new FormData(form);
  return {
    position: d.get("position") as string,
    companyName: d.get("companyName") as string,
    companyWebsite: d.get("companyWebsite") as string,
    status: (d.get("status") as Status) || Status.PENDING,
    jobDescription: d.get("jobDescription") as string,
    salary: d.get("salary") as string,
    location: d.get("location") as string,
    contactEmail: d.get("contactEmail") as string,
    jobUrl: d.get("jobUrl") as string,
    notes: d.get("notes") as string,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

function ApplicationForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const utils = trpc.useUtils();

  const createApplication = trpc.application.create.useMutation({
    onSuccess: () => {
      utils.application.getAll.invalidate();
      utils.application.getByStatus.invalidate();
      setIsOpen(false);
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createApplication.mutate(getFormFields(e.currentTarget));
  };

  return (
    <div>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-primary text-white px-5 py-2 border-4 border-retro-border font-serif font-bold retro-button-shadow flex items-center gap-2 hover:bg-primary/90 transition-all whitespace-nowrap text-sm uppercase tracking-wider"
        >
          <span>+</span>
          Add Application
        </button>
      ) : (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white border-4 border-retro-border retro-card-shadow p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-center mb-8">
              <h2 className="font-serif text-xl font-bold uppercase tracking-wider text-retro-border bg-retro-yellow/30 px-4 py-2 border-2 border-retro-border inline-block">
                New Application
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold tracking-[0.2em] uppercase text-retro-border/60 mb-2">
                  Position *
                </label>
                <input
                  name="position"
                  required
                  className="w-full h-10 border-2 border-retro-border px-3 focus:outline-none focus:border-primary"
                  placeholder="Software Engineer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold tracking-[0.2em] uppercase text-retro-border/60 mb-2">
                  Company *
                </label>
                <input
                  name="companyName"
                  required
                  className="w-full h-10 border-2 border-retro-border px-3 focus:outline-none focus:border-primary"
                  placeholder="Google"
                />
              </div>

              <div>
                <label className="block text-xs font-bold tracking-[0.2em] uppercase text-retro-border/60 mb-2">
                  Company Website
                </label>
                <input
                  name="companyWebsite"
                  type="url"
                  className="w-full h-10 border-2 border-retro-border px-3 focus:outline-none focus:border-primary"
                  placeholder="https://google.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold tracking-[0.2em] uppercase text-retro-border/60 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  className="w-full h-10 border-2 border-retro-border px-3 focus:outline-none focus:border-primary bg-white"
                >
                  <option value="PENDING">Pending</option>
                  <option value="APPLIED">Applied</option>
                  <option value="SCREENING">Screening</option>
                  <option value="INTERVIEW">Interview</option>
                  <option value="OFFER">Offer</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold tracking-[0.2em] uppercase text-retro-border/60 mb-2">
                  Salary
                </label>
                <input
                  name="salary"
                  className="w-full h-10 border-2 border-retro-border px-3 focus:outline-none focus:border-primary"
                  placeholder="$100k - $150k"
                />
              </div>

              <div>
                <label className="block text-xs font-bold tracking-[0.2em] uppercase text-retro-border/60 mb-2">
                  Location
                </label>
                <input
                  name="location"
                  className="w-full h-10 border-2 border-retro-border px-3 focus:outline-none focus:border-primary"
                  placeholder="Remote / Lagos, Lagos"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold tracking-[0.2em] uppercase text-retro-border/60 mb-2">
                  Contact Email
                </label>
                <input
                  name="contactEmail"
                  type="email"
                  className="w-full h-10 border-2 border-retro-border px-3 focus:outline-none focus:border-primary"
                  placeholder="recruiter@company.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold tracking-[0.2em] uppercase text-retro-border/60 mb-2">
                  Job URL
                </label>
                <input
                  name="jobUrl"
                  type="url"
                  className="w-full h-10 border-2 border-retro-border px-3 focus:outline-none focus:border-primary"
                  placeholder="https://company.com/careers/123"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold tracking-[0.2em] uppercase text-retro-border/60 mb-2">
                  Job Description
                </label>
                <textarea
                  name="jobDescription"
                  rows={4}
                  className="w-full border-2 border-retro-border px-3 py-2 focus:outline-none focus:border-primary"
                  placeholder="Paste the full job description here..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold tracking-[0.2em] uppercase text-retro-border/60 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  className="w-full border-2 border-retro-border px-3 py-2 focus:outline-none focus:border-primary"
                  placeholder="Any additional notes..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                disabled={createApplication.isPending}
                className="flex-1 bg-primary text-white px-6 py-3 border-2 border-retro-border font-bold retro-button-shadow disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider hover:bg-primary/90 transition-all"
              >
                {createApplication.isPending ? "Saving..." : "Save Application"}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 bg-white px-6 py-3 border-2 border-retro-border font-bold retro-button-shadow uppercase tracking-wider hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
            </div>

            {createApplication.error && (
              <div className="mt-4 p-4 bg-retro-red/20 border-2 border-retro-red">
                <p className="text-red-700 font-bold">
                  Error: {createApplication.error.message}
                </p>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}

export { ApplicationForm };
