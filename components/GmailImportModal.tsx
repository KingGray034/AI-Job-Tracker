"use client";

import { useState } from "react";
import { trpc } from "@/utils/trpc";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "auth" | "import";

type GmailEmail = {
  from: string;
  subject: string;
  date: Date;
  position: string;
  companyName: string;
  body: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function openOAuthWindow(url: string, onSuccess: () => void) {
  const width = 600;
  const height = 700;
  const left = window.screen.width / 2 - width / 2;
  const top = window.screen.height / 2 - height / 2;

  window.open(
    url,
    "Gmail Authorization",
    `width=${width},height=${height},left=${left},top=${top}`,
  );

  const handler = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    if (event.data?.type === "GOOGLE_AUTH_SUCCESS") {
      window.removeEventListener("message", handler);
      onSuccess();
    }
  };

  window.addEventListener("message", handler);
}

// ─── Component ────────────────────────────────────────────────────────────────

function GmailImportModal({ onCloseAction }: { onCloseAction: () => void }) {
  const [step, setStep] = useState<Step>("auth");
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  const utils = trpc.useUtils();
  const { data: authUrl } = trpc.integrations.getGmailAuthUrl.useQuery();

  const searchGmail = trpc.integrations.searchGmail.useMutation();

  const createApplication = trpc.application.create.useMutation({
    onSuccess: () => {
      utils.application.getAll.invalidate();
      utils.application.getByStatus.invalidate();
    },
  });

  const handleAuth = () => {
    if (!authUrl) return;
    openOAuthWindow(authUrl.url, () => {
      setStep("import");
      searchGmail.mutate();
    });
  };

  const handleImport = async () => {
    if (!searchGmail.data) return;

    const emailsToImport = searchGmail.data.filter((email: GmailEmail) =>
      selectedEmails.includes(email.from),
    );

    for (const email of emailsToImport) {
      await createApplication.mutateAsync({
        position: email.position,
        companyName: email.companyName,
        companyWebsite: "",
        jobUrl: "",
        status: "APPLIED",
        jobDescription: email.body,
        notes: `Imported from Gmail: ${email.subject}`,
      });
    }

    onCloseAction();
  };

  const toggleEmail = (from: string) => {
    setSelectedEmails((prev) =>
      prev.includes(from) ? prev.filter((e) => e !== from) : [...prev, from],
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-retro-border retro-card-shadow max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-retro-teal border-b-4 border-retro-border p-6">
          <div className="flex justify-between items-center">
            <h2 className="font-serif text-2xl font-bold text-white uppercase tracking-wider">
              Import from Gmail
            </h2>
            <button
              onClick={onCloseAction}
              className="text-white hover:text-retro-yellow text-3xl leading-none"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="p-6">
          {step === "auth" && (
            <div className="text-center space-y-6">
              <p className="text-retro-border/70 text-lg">
                Connect your Gmail to automatically import job application
                confirmation emails.
              </p>

              <div className="bg-retro-yellow/20 border-2 border-retro-border p-4">
                <p className="text-sm text-retro-border">
                  We'll search for emails with subjects like "application
                  received" or "thank you for applying" and extract job details.
                </p>
              </div>

              <button
                onClick={handleAuth}
                disabled={!authUrl}
                className="bg-retro-teal text-white px-8 py-3 border-4 border-retro-border font-bold retro-button-shadow hover:bg-retro-teal/90 disabled:bg-gray-400 uppercase tracking-wider text-sm transition-all"
              >
                {authUrl ? "Connect Gmail Account" : "Loading..."}
              </button>
            </div>
          )}

          {step === "import" && (
            <div className="space-y-6">
              {searchGmail.isPending && (
                <div className="text-center py-8">
                  <p className="text-retro-border font-bold">
                    Searching your emails...
                  </p>
                </div>
              )}

              {searchGmail.data && searchGmail.data.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-retro-border">
                    No application confirmation emails found in the last 30
                    days.
                  </p>
                </div>
              )}

              {searchGmail.data && searchGmail.data.length > 0 && (
                <>
                  <p className="text-retro-border font-bold">
                    Found {searchGmail.data.length} application emails. Select
                    which to import:
                  </p>

                  <div className="space-y-3">
                    {searchGmail.data.map((email: GmailEmail) => (
                      <label
                        key={email.from}
                        className="flex items-start gap-3 p-4 border-2 border-retro-border bg-white hover:bg-retro-yellow/10 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEmails.includes(email.from)}
                          onChange={() => toggleEmail(email.from)}
                          className="mt-1 size-5 border-2 border-retro-border"
                        />
                        <div className="flex-1">
                          <p className="font-bold text-retro-border">
                            {email.position} at {email.companyName}
                          </p>
                          <p className="text-sm text-retro-border/60">
                            From: {email.from}
                          </p>
                          <p className="text-sm text-retro-border/60">
                            Date: {email.date.toLocaleDateString()}
                          </p>
                          <p className="text-xs text-retro-border/50 mt-2">
                            {email.body.substring(0, 150)}...
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleImport}
                      disabled={
                        selectedEmails.length === 0 ||
                        createApplication.isPending
                      }
                      className="flex-1 bg-retro-green text-white px-6 py-3 border-4 border-retro-border font-bold retro-button-shadow hover:bg-retro-green/90 disabled:bg-gray-400 uppercase tracking-wider text-sm transition-all"
                    >
                      {createApplication.isPending
                        ? "Importing..."
                        : `Import ${selectedEmails.length} Selected`}
                    </button>
                    <button
                      onClick={onCloseAction}
                      className="px-6 py-3 bg-white border-4 border-retro-border font-bold retro-button-shadow uppercase tracking-wider text-sm hover:bg-gray-100 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { GmailImportModal };