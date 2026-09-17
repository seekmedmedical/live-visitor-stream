import { createFileRoute } from "@tanstack/react-router";
import { LiveVisitorsWidget } from "@/components/LiveVisitorsWidget";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ao Vivo · Visitantes do site em tempo real" },
      {
        name: "description",
        content:
          "Bloco flutuante que mostra quantas pessoas estão no seu site agora e quais páginas elas estão vendo, atualizando sozinho.",
      },
      { property: "og:title", content: "Ao Vivo · Visitantes em tempo real" },
      {
        property: "og:description",
        content:
          "Quantas pessoas estão no seu site agora e em quais páginas, atualizando a cada 15 segundos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function downloadExtension() {
  fetch("/monitor-ao-vivo.zip")
    .then((res) => {
      if (!res.ok) throw new Error(`Falha no download: ${res.status}`);
      return res.blob();
    })
    .then((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "monitor-ao-vivo.zip";
      a.click();
      URL.revokeObjectURL(a.href);
    })
    .catch((err) => alert(err.message));
}

function Index() {
  return (
    <main className="relative min-h-screen bg-background font-sans text-foreground">
      <div className="mx-auto max-w-2xl px-6 py-20">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-live">
          ao vivo
        </span>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">
          Monitor de visitantes
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          O bloco no canto da tela mostra quantas pessoas estão no site neste
          momento. Clique nele para ver em quais páginas elas estão. Atualiza
          sozinho a cada 15 segundos — deixe esta aba aberta o dia inteiro.
        </p>

        <div className="mt-10 rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold">Ver dentro do Chrome</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            A extensão coloca o número de pessoas online direto no ícone da barra
            do Chrome, visível em qualquer aba. Clique no ícone para abrir a lista
            de páginas.
          </p>
          <button
            onClick={downloadExtension}
            className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Baixar extensão
          </button>
          <ol className="mt-4 list-decimal space-y-1 pl-5 text-[13px] text-muted-foreground">
            <li>Descompacte o arquivo baixado.</li>
            <li>
              Abra <span className="font-mono">chrome://extensions</span> no Chrome.
            </li>
            <li>Ative o "Modo do desenvolvedor" no canto superior direito.</li>
            <li>
              Clique em "Carregar sem compactação" e escolha a pasta
              descompactada.
            </li>
          </ol>
        </div>
      </div>

      <LiveVisitorsWidget />
    </main>
  );
}
