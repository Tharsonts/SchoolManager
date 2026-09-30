import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, GraduationCap, ServerCog, ShieldCheck, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";

const RENDER_URL = "https://schoolmanager-demo.onrender.com";
const HEALTH_URL = `${RENDER_URL}/api/health`;

type WakeStatus = "checking" | "ready" | "waiting";

const statusLines = [
  "Verificando o servidor da demonstracao",
  "Acordando a instancia gratuita",
  "Preparando banco de dados e sessoes",
  "Carregando painel escolar",
  "Abrindo School Manager",
];

function getStatusText(elapsedSeconds: number, status: WakeStatus) {
  if (status === "ready") return "Sistema pronto. Abrindo...";
  if (elapsedSeconds < 4) return statusLines[0];
  if (elapsedSeconds < 10) return statusLines[1];
  if (elapsedSeconds < 18) return statusLines[2];
  if (elapsedSeconds < 28) return statusLines[3];
  return "Ainda acordando o servidor gratuito";
}

export default function RenderWakePage() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [status, setStatus] = useState<WakeStatus>("checking");
  const [attempts, setAttempts] = useState(0);

  const progress = useMemo(() => {
    if (status === "ready") return 100;
    return Math.min(92, 12 + elapsedSeconds * 4 + attempts * 3);
  }, [attempts, elapsedSeconds, status]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;

    async function checkServer() {
      setAttempts((current) => current + 1);

      try {
        const controller = new AbortController();
        const abortId = window.setTimeout(() => controller.abort(), 8000);

        const response = await fetch(`${HEALTH_URL}?wake=${Date.now()}`, {
          method: "GET",
          cache: "no-store",
          credentials: "omit",
          signal: controller.signal,
        });

        window.clearTimeout(abortId);

        if (!cancelled && response.ok) {
          setStatus("ready");
          window.setTimeout(() => {
            window.location.replace(RENDER_URL);
          }, 900);
          return;
        }
      } catch {
        if (!cancelled) setStatus("waiting");
      }

      if (!cancelled) {
        timeoutId = window.setTimeout(checkServer, elapsedSeconds < 20 ? 2500 : 4000);
      }
    }

    checkServer();

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <main className="min-h-dvh overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.35),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.22),transparent_30%)]" />
      <div className="relative flex min-h-dvh items-center px-5 py-8 sm:px-8">
        <section className="mx-auto w-full max-w-4xl">
          <div className="grid gap-6 md:grid-cols-[1.05fr_0.95fr] md:items-center">
            <div className="space-y-7">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-2xl shadow-blue-950/40">
                  <GraduationCap className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">
                    School Manager
                  </p>
                  <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
                    Inicializando o sistema
                  </h1>
                </div>
              </div>

              <p className="max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
                A demonstracao gratuita fica hospedada no Render. Quando ela passa um tempo sem uso,
                o servidor precisa acordar antes de abrir o painel.
              </p>

              <div className="rounded-lg border border-white/10 bg-white/10 p-4 shadow-2xl shadow-slate-950/30 backdrop-blur">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-slate-100">
                    {getStatusText(elapsedSeconds, status)}
                  </span>
                  <span className="shrink-0 text-sm text-slate-300">{progress}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-300 transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                  {status === "ready" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  ) : (
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-300" />
                  )}
                  <span>
                    Tempo medio em hospedagem gratuita: cerca de 20 segundos apos um periodo parado.
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  className="h-12 bg-white px-5 text-slate-950 hover:bg-slate-100"
                  onClick={() => window.location.assign(RENDER_URL)}
                >
                  Abrir agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-12 border-white/25 bg-white/5 px-5 text-white hover:bg-white/10 hover:text-white"
                  onClick={() => window.location.reload()}
                >
                  Verificar novamente
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-slate-900/70 p-5 shadow-2xl shadow-slate-950/40 backdrop-blur">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Status do ambiente</p>
                  <p className="text-xl font-semibold">Demo online</p>
                </div>
                <ServerCog className="h-8 w-8 text-cyan-300" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-lg bg-white/10 p-3">
                  <Wifi className="h-5 w-5 text-blue-300" />
                  <div>
                    <p className="font-medium">Conexao publica</p>
                    <p className="text-sm text-slate-400">Render + GitHub Pages</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-white/10 p-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-300" />
                  <div>
                    <p className="font-medium">Tela limpa para visitantes</p>
                    <p className="text-sm text-slate-400">Sem expor a tela tecnica de inicializacao</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-lg bg-slate-950/70 p-4 font-mono text-xs leading-6 text-slate-300">
                <p>&gt; request recebido</p>
                <p>&gt; preparando School Manager</p>
                <p className="text-cyan-300">&gt; aguardando servidor responder</p>
                <p className="text-emerald-300">&gt; redirecionamento automatico</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
