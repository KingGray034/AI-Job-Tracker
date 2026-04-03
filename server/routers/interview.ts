import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import prisma from "../db";

const interviewRouter = router({
  create: publicProcedure
    .input(
      z.object({
        applicationId: z.string(),
        round: z.number().int().positive(),
        scheduledAt: z.date().optional(),
      }),
    )
    .mutation(({ input }) =>
      prisma.interview.create({
        data: {
          applicationId: input.applicationId,
          type: `Round ${input.round}`,
          scheduledAt: input.scheduledAt ?? new Date(),
          completed: false,
        },
      }),
    ),
});

export { interviewRouter };
