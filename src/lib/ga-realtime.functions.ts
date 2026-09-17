import { createServerFn } from "@tanstack/react-start";
import type { RealtimePayload } from "./ga-types";

export const getRealtime = createServerFn({ method: "GET" }).handler(
  async (): Promise<RealtimePayload> => {
    const { fetchRealtime } = await import("./ga-realtime.server");
    return fetchRealtime();
  },
);
