import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import prisma from "../db";
import {
  analyzeResumeMatch,
  generateInterviewQuestions,
  generateCoverLetterTips,
  analyzeJobPosting,
} from "../services/ai";

// ─── Reusable Schemas ─────────────────────────────────────────────────────────

const applicationIdInput = z.object({ applicationId: z.string() });

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getApplicationOrThrow(id: string) {
  const application = await prisma.application.findUnique({
    where: { id },
    include: { company: true },
  });

  if (!application || !application.jobDescription) {
    throw new Error("Application or job description not found");
  }

  return application;
}

async function saveSuggestion(
  applicationId: string,
  type: string,
  content: unknown,
) {
  return prisma.aiSuggestion.create({
    data: {
      applicationId,
      type,
      content: JSON.stringify(content),
    },
  });
}

// ─── Router ───────────────────────────────────────────────────────────────────

const aiRouter = router({
  analyzeResume: publicProcedure
    .input(
      applicationIdInput.extend({
        resumeText: z.string().min(50, "Resume text is too short"),
      }),
    )
    .mutation(async ({ input }) => {
      const application = await getApplicationOrThrow(input.applicationId);
      const analysis = await analyzeResumeMatch(
        input.resumeText,
        application.jobDescription!,
      );
      await saveSuggestion(input.applicationId, "resume_analysis", analysis);
      return analysis;
    }),

  generateQuestions: publicProcedure
    .input(applicationIdInput)
    .mutation(async ({ input }) => {
      const application = await getApplicationOrThrow(input.applicationId);
      const questions = await generateInterviewQuestions(
        application.jobDescription!,
        application.position,
      );
      await saveSuggestion(
        input.applicationId,
        "interview_questions",
        questions,
      );
      return questions;
    }),

  generateCoverLetterTips: publicProcedure
    .input(
      applicationIdInput.extend({
        userBackground: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const application = await getApplicationOrThrow(input.applicationId);
      const tips = await generateCoverLetterTips(
        application.jobDescription!,
        application.position,
        application.company.name,
        input.userBackground,
      );
      await saveSuggestion(input.applicationId, "cover_letter_tips", tips);
      return tips;
    }),

  analyzeJobPosting: publicProcedure
    .input(z.object({ jobDescription: z.string() }))
    .mutation(({ input }) => analyzeJobPosting(input.jobDescription)),

  deleteSuggestion: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) =>
      prisma.aiSuggestion.delete({ where: { id: input.id } }),
    ),

  getSuggestions: publicProcedure
    .input(applicationIdInput)
    .query(async ({ input }) => {
      const suggestions = await prisma.aiSuggestion.findMany({
        where: { applicationId: input.applicationId },
        orderBy: { createdAt: "desc" },
      });
      return suggestions.map((s) => ({
        ...s,
        content: JSON.parse(s.content),
      }));
    }),
});

export { aiRouter };
