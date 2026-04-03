"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/utils/trpc";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { InterviewCalendarForm } from "@/components/InterviewCalenderForm";

// ─── Types ────────────────────────────────────────────────────────────────────

type EditForm = {
  position: string;
  location: string;
  salary: string;
  contactEmail: string;
  jobDescription: string;
  notes: string;
};

type AnalysisResult = {
  matchScore: number;
  strengths: string[];
  gaps: string[];
  keywords: string[];
  tips: string[];
};

type InterviewQuestion = {
  question: string;
  type: string;
  tip: string;
};

const DEFAULT_EDIT_FORM: EditForm = {
  position: "",
  location: "",
  salary: "",
  contactEmail: "",
  jobDescription: "",
  notes: "",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex justify-center mb-4">
      <h2
        className={`font-serif text-lg font-bold uppercase tracking-wider text-retro-border ${color} px-3 py-1 border-2 border-retro-border inline-block`}
      >
        {label}
      </h2>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold tracking-[0.2em] uppercase text-retro-border/60 mb-2">
        {label}
      </p>
      <p className="font-bold text-lg text-retro-border">{value}</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationId = params.id as string;
  const returnView = searchParams.get("returnView") || "kanban";

  const [resumeText, setResumeText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>(DEFAULT_EDIT_FORM);

  const utils = trpc.useUtils();

  const { data: application, isLoading } = trpc.application.getById.useQuery({
    id: applicationId,
  });

  const analyzeResume = trpc.ai.analyzeResume.useMutation({
    onSuccess: () => {
      setResumeText("");
      utils.application.getById.invalidate({ id: applicationId });
    },
  });

  const generateQuestions = trpc.ai.generateQuestions.useMutation({
    onSuccess: () =>
      utils.application.getById.invalidate({ id: applicationId }),
  });

  const updateApplication = trpc.application.update.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      utils.application.getById.invalidate({ id: applicationId });
    },
  });

  const deleteSuggestion = trpc.ai.deleteSuggestion.useMutation({
    onSuccess: () =>
      utils.application.getById.invalidate({ id: applicationId }),
  });

  const savedAnalysis = application?.aiSuggestions?.find(
    (s) => s.type === "resume_analysis",
  );
  const savedQuestions = application?.aiSuggestions?.find(
    (s) => s.type === "interview_questions",
  );

  useEffect(() => {
    if (!application) return;
    setEditForm({
      position: application.position || "",
      location: application.location || "",
      salary: application.salary || "",
      contactEmail: application.contactEmail || "",
      jobDescription: application.jobDescription || "",
      notes: application.notes || "",
    });
  }, [application?.id]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const updateField = (field: keyof EditForm, value: string) =>
    setEditForm((prev) => ({ ...prev, [field]: value }));

  const handleAnalyzeResume = async () => {
    if (!resumeText.trim()) {
      alert("Please paste your resume text");
      return;
    }
    await analyzeResume.mutateAsync({ applicationId, resumeText });
  };

  const handleGenerateQuestions = () =>
    generateQuestions.mutateAsync({ applicationId });

  const handleSaveEdit = () =>
    updateApplication.mutate({ id: applicationId, ...editForm });

  const handleDeleteAnalysis = () => {
    if (
      savedAnalysis &&
      confirm("This will delete your current analysis. Continue?")
    )
      deleteSuggestion.mutate({ id: savedAnalysis.id });
  };

  const handleDeleteQuestions = () => {
    if (
      savedQuestions &&
      confirm("This will delete your current questions. Continue?")
    )
      deleteSuggestion.mutate({ id: savedQuestions.id });
  };

  // ─── Loading / Error ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <p className="text-retro-border font-bold text-xl">Loading...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <p className="text-retro-border font-bold text-xl">
          Application not found
        </p>
      </div>
    );
  }

  // ─── Parsed AI Data ─────────────────────────────────────────────────────────

  const parsedAnalysis: AnalysisResult | null = savedAnalysis
    ? JSON.parse(savedAnalysis.content)
    : null;

  const parsedQuestions: { questions: InterviewQuestion[] } | null =
    savedQuestions ? JSON.parse(savedQuestions.content) : null;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background-light">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <button
          onClick={() => router.push(`/?view=${returnView}`)}
          className="mb-6 px-6 py-2 bg-white border-4 border-retro-border font-bold retro-button-shadow hover:bg-retro-yellow/30 text-retro-border uppercase tracking-wider transition-all text-sm"
        >
          &larr; Back to Dashboard
        </button>

        {/* Header Card */}
        <div className="bg-white border-4 border-retro-border retro-card-shadow p-8 mb-8">
          <div className="flex justify-between items-start border-b-2 border-retro-border pb-6 mb-6">
            <div className="flex-1 min-w-0 pr-4">
              <h1 className="font-serif text-4xl font-bold mb-2 text-retro-border wrap-break-word">
                {application.position}
              </h1>
              <p className="text-2xl text-retro-border/70 font-medium">
                {application.company.name}
              </p>
            </div>

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-primary text-white border-4 border-retro-border font-bold retro-button-shadow uppercase tracking-wider text-sm hover:bg-primary/90 transition-all whitespace-nowrap shrink-0"
              >
                Edit Details
              </button>
            ) : (
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handleSaveEdit}
                  disabled={updateApplication.isPending}
                  className="px-4 py-2 bg-retro-green text-white border-4 border-retro-border font-bold retro-button-shadow uppercase tracking-wider text-sm hover:bg-retro-green/90 transition-all"
                >
                  {updateApplication.isPending ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-white border-4 border-retro-border font-bold retro-button-shadow uppercase tracking-wider text-sm hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {!isEditing ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <InfoField label="Status" value={application.status} />
                <InfoField
                  label="Applied"
                  value={format(
                    new Date(application.dateApplied),
                    "MMM d, yyyy",
                  )}
                />
                <InfoField
                  label="Location"
                  value={application.location || "Not specified"}
                />
                <InfoField
                  label="Salary"
                  value={application.salary || "Not specified"}
                />
              </div>

              {application.contactEmail && (
                <div className="mt-6">
                  <p className="text-xs font-bold tracking-[0.2em] uppercase text-retro-border/60 mb-2">
                    Contact Email
                  </p>
                  <p className="font-bold text-lg text-retro-border break-all">
                    {application.contactEmail}
                  </p>
                </div>
              )}

              {application.jobDescription && (
                <div className="mt-8">
                  <div className="flex justify-center mb-4">
                    <h3 className="font-serif text-base font-bold uppercase tracking-wider text-retro-border bg-retro-yellow/30 px-3 py-1 border-2 border-retro-border inline-block">
                      Job Description
                    </h3>
                  </div>
                  <div className="bg-retro-yellow/10 border-2 border-retro-border p-6 text-sm whitespace-pre-wrap">
                    {application.jobDescription}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {(["position", "location"] as const).map((field) => (
                  <div key={field}>
                    <label className="block text-xs font-bold tracking-[0.2em] uppercase text-retro-border/60 mb-2">
                      {field}
                    </label>
                    <input
                      type="text"
                      value={editForm[field]}
                      onChange={(e) => updateField(field, e.target.value)}
                      className="w-full px-4 py-2 border-4 border-retro-border outline-none focus:border-primary"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold tracking-[0.2em] uppercase text-retro-border/60 mb-2">
                    Salary
                  </label>
                  <input
                    type="text"
                    value={editForm.salary}
                    onChange={(e) => updateField("salary", e.target.value)}
                    placeholder="e.g., $100k - $150k"
                    className="w-full px-4 py-2 border-4 border-retro-border outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-[0.2em] uppercase text-retro-border/60 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={editForm.contactEmail}
                    onChange={(e) =>
                      updateField("contactEmail", e.target.value)
                    }
                    placeholder="recruiter@company.com"
                    className="w-full px-4 py-2 border-4 border-retro-border outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold tracking-[0.2em] uppercase text-retro-border/60 mb-2">
                  Job Description
                </label>
                <textarea
                  value={editForm.jobDescription}
                  onChange={(e) =>
                    updateField("jobDescription", e.target.value)
                  }
                  rows={8}
                  className="w-full px-4 py-2 border-4 border-retro-border outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold tracking-[0.2em] uppercase text-retro-border/60 mb-2">
                  Notes
                </label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border-4 border-retro-border outline-none focus:border-primary"
                />
              </div>
            </div>
          )}
        </div>

        {/* AI Features */}
        <div className="space-y-8">
          {/* Resume Analysis */}
          <div className="bg-white border-4 border-retro-border retro-card-shadow p-8">
            <SectionHeader
              label="AI Resume Analysis"
              color="bg-retro-teal/30"
            />

            {!parsedAnalysis ? (
              <>
                <p className="text-retro-border/70 mb-6 text-center">
                  Paste your resume text below and get personalized suggestions
                  to tailor it for this job.
                </p>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume text here..."
                  rows={8}
                  className="w-full border-4 border-retro-border p-4 mb-6 focus:ring-0 focus:border-primary outline-none"
                />
                <div className="flex justify-center">
                  <button
                    onClick={handleAnalyzeResume}
                    disabled={analyzeResume.isPending}
                    className="bg-primary text-white px-8 py-3 border-4 border-retro-border font-bold retro-button-shadow hover:bg-primary/90 disabled:bg-gray-400 uppercase tracking-wider text-sm transition-all"
                  >
                    {analyzeResume.isPending
                      ? "Analyzing..."
                      : "Analyze Resume"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mt-6 space-y-6">
                  <div className="flex justify-center mb-4">
                    <div className="bg-retro-teal/20 border-3 border-retro-border p-4 inline-block">
                      <h3 className="font-serif text-xl font-bold text-retro-border">
                        Match Score: {parsedAnalysis.matchScore}%
                      </h3>
                    </div>
                  </div>

                  {[
                    {
                      label: "Strengths",
                      items: parsedAnalysis.strengths,
                      color: "border-retro-green",
                    },
                    {
                      label: "Gaps",
                      items: parsedAnalysis.gaps,
                      color: "border-retro-orange",
                    },
                    {
                      label: "Tailoring Tips",
                      items: parsedAnalysis.tips,
                      color: "border-retro-purple",
                    },
                  ].map(({ label, items, color }) => (
                    <div key={label} className={`border-4 ${color} p-6`}>
                      <h4 className="font-serif text-base font-bold mb-4 text-retro-border uppercase tracking-wider">
                        {label}
                      </h4>
                      <ul className="list-disc list-inside space-y-2">
                        {items?.map((item, i) => (
                          <li key={i} className="text-retro-border">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  <div className="border-4 border-retro-yellow p-6">
                    <h4 className="font-serif text-base font-bold mb-4 text-retro-border uppercase tracking-wider">
                      Keywords to Add
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {parsedAnalysis.keywords?.map((k, i) => (
                        <span
                          key={i}
                          className="bg-retro-yellow border-2 border-retro-border px-4 py-2 font-bold text-sm"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center mt-6">
                  <button
                    onClick={handleDeleteAnalysis}
                    disabled={deleteSuggestion.isPending}
                    className="bg-white text-retro-border px-8 py-3 border-4 border-retro-border font-bold retro-button-shadow hover:bg-gray-100 uppercase tracking-wider text-sm transition-all"
                  >
                    {deleteSuggestion.isPending
                      ? "Deleting..."
                      : "Re-analyze Resume"}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Interview Questions */}
          <div className="bg-white border-4 border-retro-border retro-card-shadow p-8">
            <SectionHeader
              label="Interview Preparation"
              color="bg-retro-purple/30"
            />

            {!parsedQuestions ? (
              <>
                <p className="text-retro-border/70 mb-6 text-center">
                  Get AI-generated interview questions specific to this role.
                </p>
                <div className="flex justify-center">
                  <button
                    onClick={handleGenerateQuestions}
                    disabled={generateQuestions.isPending}
                    className="bg-retro-purple text-white px-8 py-3 border-4 border-retro-border font-bold retro-button-shadow hover:bg-retro-purple/90 disabled:bg-gray-400 uppercase tracking-wider text-sm transition-all"
                  >
                    {generateQuestions.isPending
                      ? "Generating..."
                      : "Generate Interview Questions"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mt-6 space-y-6">
                  {parsedQuestions.questions?.map((q, i) => (
                    <div
                      key={i}
                      className="border-l-8 border-retro-purple bg-retro-purple/10 pl-6 pr-6 py-4"
                    >
                      <div className="flex gap-3 items-start">
                        <span className="font-serif font-bold text-2xl text-retro-purple">
                          Q{i + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-bold text-lg text-retro-border mb-2">
                            {q.question}
                          </p>
                          <p className="text-sm text-retro-border/60 mb-3">
                            <span className="font-bold uppercase tracking-wider">
                              Type:
                            </span>{" "}
                            {q.type}
                          </p>
                          <p className="text-sm text-retro-border bg-white border-2 border-retro-border p-3">
                            <span className="font-bold">Tip:</span> {q.tip}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center mt-6">
                  <button
                    onClick={handleDeleteQuestions}
                    disabled={deleteSuggestion.isPending}
                    className="bg-white text-retro-border px-8 py-3 border-4 border-retro-border font-bold retro-button-shadow hover:bg-gray-100 uppercase tracking-wider text-sm transition-all"
                  >
                    {deleteSuggestion.isPending
                      ? "Deleting..."
                      : "Generate New Questions"}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Calendar Sync */}
          {application.status === "INTERVIEW" && (
            <div className="bg-white border-4 border-retro-border retro-card-shadow p-8">
              <SectionHeader
                label="Add Interview to Calendar"
                color="bg-retro-green/30"
              />
              <InterviewCalendarForm application={application} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ApplicationDetailPage;
