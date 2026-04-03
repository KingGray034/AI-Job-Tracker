import { router } from "../trpc";
import { applicationRouter } from "./application";
import { aiRouter } from "./ai";
import { integrationsRouter } from "./integrations";
import { interviewRouter } from "./interview";

const appRouter = router({
  application: applicationRouter,
  ai: aiRouter,
  integrations: integrationsRouter,
  interview: interviewRouter,
});

type AppRouter = typeof appRouter;

export { appRouter };
export type { AppRouter };
