import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { cookies } from "next/headers";
import { router, publicProcedure } from "../trpc";
import { getGmailAuthUrl, searchApplicationEmails } from "../services/gmail";
import { createInterviewEvent } from "../services/calender";

// ─── Router ───────────────────────────────────────────────────────────────────

const integrationsRouter = router({
  getGmailAuthUrl: publicProcedure.query(() => ({
    url: getGmailAuthUrl(),
  })),

  searchGmail: publicProcedure.mutation(async () => {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("google_access_token")?.value;
    if (!accessToken)
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Not authenticated with Google",
      });
    return await searchApplicationEmails(accessToken);
  }),

  createCalendarEvent: publicProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        startTime: z.date(),
        duration: z.number(),
        location: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const cookieStore = await cookies();
      const accessToken = cookieStore.get("google_access_token")?.value;
      if (!accessToken)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated with Google",
        });
      const endTime = new Date(
        input.startTime.getTime() + input.duration * 60000,
      );
      return await createInterviewEvent(accessToken, {
        title: input.title,
        description: input.description,
        startTime: input.startTime,
        endTime,
        location: input.location,
      });
    }),
});

export { integrationsRouter };