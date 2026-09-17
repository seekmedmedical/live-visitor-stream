import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown } from "lucide-react";
import { getRealtime } from "@/lib/ga-realtime.functions";
import { cn } from "@/lib/utils";

export function LiveVisitorsWidget() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const fetchRealtime = useServerFn(getRealtime);
  const { data, isFetching } = useQuery({
    queryKey: ["realtime"],
    queryFn: () => fetchRealtime(),
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
  });

  const pages = (data?.pages ?? []).slice(0, 8);
  const max = Math.max(1, ...pages.map((p) => p.users));

  return (
    <div className="fixed bottom-5 right-5 z-50 flex w-[min(22rem,calc(100vw-2.5rem))] flex-col items-end gap-2 font-sans">
      {open && (
        <div className="w-full overflow-hidden rounded-2xl border border-border bg-surface/95 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Páginas abertas agora
            </span>
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
              {pages.length}
            </span>
          </div>
          <ul className="max-h-72 divide-y divide-border overflow-y-auto">
            {pages.map((p) => (
              <li key={p.path} className="px-4 py-2.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-[13px] text-foreground">{p.path}</span>
                  <span className="font-mono text-[13px] font-medium tabular-nums text-foreground">
                    {p.users}
                  </span>
                </div>
                <div className="mt-1.5 h-1 rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-live transition-all duration-500"
                    style={{ width: `${Math.round((p.users / max) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
            {pages.length === 0 && (
              <li className="px-4 py-6 text-center text-[13px] text-muted-foreground">
                Ninguém navegando neste momento.
              </li>
            )}
          </ul>
          <div className="flex items-center justify-between border-t border-border px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>
              hoje: {data?.today.users.toLocaleString("pt-BR") ?? "—"} visitantes
            </span>
            <span>
              {data?.updatedAt
                ? new Date(data.updatedAt).toLocaleTimeString("pt-BR")
                : "—"}
            </span>
          </div>
          {data?.demo && (
            <div className="border-t border-border bg-accent/10 px-4 py-2 text-[11px] text-accent">
              Dados de exemplo — falta conectar a chave do Analytics.
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-full border border-border bg-surface/95 py-2 pl-3 pr-3.5 shadow-xl backdrop-blur-xl transition-colors hover:border-live/50"
      >
        <span className="relative flex size-2.5 items-center justify-center">
          <span
            className={cn(
              "absolute size-2.5 rounded-full bg-live/60",
              isFetching && "animate-ping",
            )}
          />
          <span className="relative size-2 rounded-full bg-live" />
        </span>
        <span className="font-mono text-lg font-semibold leading-none tabular-nums text-foreground">
          {mounted && data ? data.activeUsers.toLocaleString("pt-BR") : "—"}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          online
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
    </div>
  );
}
