const isDev = process.env.NODE_ENV === "development";

const logger = {
  error: (message: string, error?: unknown) => {
    console.error(`[ERROR] ${new Date().toISOString()} — ${message}`, error ?? "");
  },
  info: (message: string) => {
    if (isDev) console.log(`[INFO] ${new Date().toISOString()} — ${message}`);
  },
};

export { logger };