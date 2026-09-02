import type { IncomingMessage, ServerResponse } from "node:http";
import app from "./app";

// Vercel Node runtime invokes functions as `(request, response)` handlers.
// The Express app is callable directly, so routing/middleware behave exactly as in the
// long-running server (see `src/index.ts` for the listen-based variant).
export default function handler(req: IncomingMessage, res: ServerResponse): void {
  app(req as never, res as never);
}