import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { getGmailAuthUrl, searchApplicationEmails } from "../services/gmail";
import { createInterviewEvent } from "../services/calender";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const calendarEventInput = z.object({
  accessToken: z.string(),
  title: z.string(),
  description: z.string(),
  startTime: z.date(),
  duration: z.number(),
  location: z.string().optional(),
});

// ─── Router ───────────────────────────────────────────────────────────────────

const integrationsRouter = router({
  getGmailAuthUrl: publicProcedure.query(() => ({
    url: getGmailAuthUrl(),
  })),

  searchGmail: publicProcedure
    .input(z.object({ accessToken: z.string() }))
    .mutation(({ input }) => searchApplicationEmails(input.accessToken)),

  createCalendarEvent: publicProcedure
    .input(calendarEventInput)
    .mutation(({ input }) => {
      const endTime = new Date(
        input.startTime.getTime() + input.duration * 60000,
      );
      return createInterviewEvent(input.accessToken, {
        title: input.title,
        description: input.description,
        startTime: input.startTime,
        endTime,
        location: input.location,
      });
    }),
});

export { integrationsRouter };
