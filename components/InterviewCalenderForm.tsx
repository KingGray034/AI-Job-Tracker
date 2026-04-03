"use client";

import { useState } from "react";
import { trpc } from "@/utils/trpc";

// ─── Types ────────────────────────────────────────────────────────────────────

type FormData = {
  date: string;
  time: string;
  duration: string;
  location: string;
};

type Application = {
  position: string;
  jobDescription?: string | null;
  company: { name: string };
};

const DEFAULT_FORM: FormData = {
  date: "",
  time: "",
  duration: "60",
  location: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function openOAuthWindow(url: string, onToken: (token: string) => void) {
  const width = 600;
  const height = 700;
  const left = window.screen.width / 2 - width / 2;
  const top = window.screen.height / 2 - height / 2;

  const authWindow = window.open(
    url,
    "Google Calendar Authorization",
    `width=${width},height=${height},left=${left},top=${top}`,
  );

  const checkAuth = setInterval(() => {
    try {
      if (authWindow?.closed) clearInterval(checkAuth);
      const token = localStorage.getItem("google_access_token");
      if (token) {
        clearInterval(checkAuth);
        onToken(token);
      }
    } catch {
      // Cross-origin — window still open
    }
  }, 500);
}

// ─── Component ────────────────────────────────────────────────────────────────

function InterviewCalendarForm({ application }: { application: Application }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
  const [accessToken, setAccessToken] = useState("");

  const { data: authUrl } = trpc.integrations.getGmailAuthUrl.useQuery();

  const createCalendarEvent = trpc.integrations.createCalendarEvent.useMutation(
    {
      onSuccess: () => {
        setShowForm(false);
        alert("Interview added to Google Calendar!");
      },
    },
  );

  const handleAuth = () => {
    if (!authUrl) return;
    openOAuthWindow(authUrl.url, (token) => {
      setAccessToken(token);
      setShowForm(true);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const [year, month, day] = formData.date.split("-").map(Number);
    const [hours, minutes] = formData.time.split(":").map(Number);
    const startTime = new Date(year, month - 1, day, hours, minutes);

    await createCalendarEvent.mutateAsync({
      accessToken,
      title: `Interview: ${application.position} at ${application.company.name}`,
      description: `Interview for ${application.position}\n\nCompany: ${application.company.name}\nLocation: ${formData.location || "TBD"}\n\nJob Description:\n${application.jobDescription || "N/A"}`,
      startTime,
      duration: parseInt(formData.duration),
      location: formData.location,
    });
  };

  const updateField = (field: keyof FormData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  if (!showForm) {
    return (
      <div className="text-center space-y-4">
        <p className="text-retro-border/70">
          Sync your interview schedule to Google Calendar with automatic
          reminders.
        </p>
        <button
          onClick={handleAuth}
          className="bg-retro-green text-white px-8 py-3 border-4 border-retro-border font-bold retro-button-shadow hover:bg-retro-green/90 uppercase tracking-wider text-sm transition-all"
        >
          Connect Google Calendar
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold tracking-[0.2em] uppercase text-retro-border/60 mb-2">
            Interview Date *
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => updateField("date", e.target.value)}
            required
            className="w-full h-10 border-2 border-retro-border px-3 focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-bold tracking-[0.2em] uppercase text-retro-border/60 mb-2">
            Time *
          </label>
          <input
            type="time"
            value={formData.time}
            onChange={(e) => updateField("time", e.target.value)}
            required
            className="w-full h-10 border-2 border-retro-border px-3 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold tracking-[0.2em] uppercase text-retro-border/60 mb-2">
            Duration (minutes) *
          </label>
          <select
            value={formData.duration}
            onChange={(e) => updateField("duration", e.target.value)}
            className="w-full h-10 border-2 border-retro-border px-3 bg-white focus:outline-none focus:border-primary"
          >
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">1 hour</option>
            <option value="90">1.5 hours</option>
            <option value="120">2 hours</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold tracking-[0.2em] uppercase text-retro-border/60 mb-2">
            Location
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => updateField("location", e.target.value)}
            placeholder="Zoom / Office Address"
            className="w-full h-10 border-2 border-retro-border px-3 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="bg-retro-yellow/20 border-2 border-retro-border p-3">
        <p className="text-xs text-retro-border">
          You'll get an email 1 day before and a popup 30 minutes before the
          interview.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={createCalendarEvent.isPending}
          className="flex-1 bg-retro-green text-white px-6 py-3 border-4 border-retro-border font-bold retro-button-shadow hover:bg-retro-green/90 disabled:bg-gray-400 uppercase tracking-wider text-sm transition-all"
        >
          {createCalendarEvent.isPending ? "Adding..." : "Add to Calendar"}
        </button>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="px-6 py-3 bg-white border-4 border-retro-border font-bold retro-button-shadow uppercase tracking-wider text-sm hover:bg-gray-100 transition-all"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export { InterviewCalendarForm };
