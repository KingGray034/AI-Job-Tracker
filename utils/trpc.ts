import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/routers/_app";

const trpc = createTRPCReact<AppRouter>();

export { trpc };
