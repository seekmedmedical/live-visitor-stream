import { createFileRoute } from "@tanstack/react-router";
import { fetchRealtime } from "@/lib/ga-realtime.server";

// Endpoint público somente-leitura (contagens agregadas, sem dados pessoais).
// Usado pela extensão do Chrome para atualizar o número no ícone.
export const Route = createFileRoute("/api/public/realtime")({
  server: {
    handlers: {
      GET: async () => {
        const data = await fetchRealtime();
        return new Response(JSON.stringify(data), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
            "Access-Control-Allow-Origin": "*",
          },
        });
      },
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
          },
        }),
    },
  },
});
