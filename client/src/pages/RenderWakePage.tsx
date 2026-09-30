import { useEffect, useMemo, useState } from "react";
import { GraduationCap } from "lucide-react";

const RENDER_URL = "https://schoolmanager-demo.onrender.com";
const HEALTH_URL = `${RENDER_URL}/api/health`;

type WakeStatus = "checking" | "ready" | "waiting";

const statusLines = [
  "Chamando o servidor",
  "Ligando o sistema",
  "Preparando o banco de dados",
  "Montando os paineis",
  "Abrindo a demonstracao",
];

function getStatusText(elapsedSeconds: number, status: WakeStatus) {
  if (status === "ready") return "Sistema pronto. Abrindo...";
  if (elapsedSeconds < 4) return statusLines[0];
  if (elapsedSeconds < 10) return statusLines[1];
  if (elapsedSeconds < 18) return statusLines[2];
  if (elapsedSeconds < 28) return statusLines[3];
  return "Ajustando os ultimos detalhes";
}

function getStatusPhaseStart(elapsedSeconds: number) {
  if (elapsedSeconds < 4) return 0;
  if (elapsedSeconds < 10) return 4;
  if (elapsedSeconds < 18) return 10;
  if (elapsedSeconds < 28) return 18;
  return 28;
}

export default function RenderWakePage() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [status, setStatus] = useState<WakeStatus>("checking");
  const [attempts, setAttempts] = useState(0);

  const progress = useMemo(() => {
    if (status === "ready") return 100;
    return Math.min(94, 7 + elapsedSeconds * 3 + attempts * 5);
  }, [attempts, elapsedSeconds, status]);

  const statusText = getStatusText(elapsedSeconds, status);
  const typedStatusText = useMemo(() => {
    const phaseElapsed = Math.max(0, elapsedSeconds - getStatusPhaseStart(elapsedSeconds));
    const visibleLetters = Math.max(1, Math.min(statusText.length, phaseElapsed * 10 + attempts * 2));
    return status === "ready" ? statusText : statusText.slice(0, visibleLetters);
  }, [attempts, elapsedSeconds, status, statusText]);

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
    <main className="min-h-dvh overflow-hidden bg-[#07152f] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(59,130,246,0.36),transparent_32%),radial-gradient(circle_at_80%_80%,rgba(20,184,166,0.28),transparent_30%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-cyan-200/50" />

      <div className="relative flex min-h-dvh items-center justify-center px-6 py-10">
        <section className="w-full max-w-xl text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-2xl shadow-blue-950/40">
            <GraduationCap className="h-8 w-8" />
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
            School Manager
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-5xl">
            Carregando sistema
          </h1>

          <div className="mx-auto mt-10 w-full max-w-lg">
            <div className="mb-4 flex items-end justify-between gap-4">
              <p className="min-h-7 text-left text-lg font-semibold text-slate-100 sm:text-xl">
                {typedStatusText}
                {status !== "ready" && <span className="animate-pulse text-cyan-300">_</span>}
              </p>
              <span className="shrink-0 text-2xl font-bold tabular-nums text-cyan-100">
                {progress}%
              </span>
            </div>

            <div className="relative h-5 overflow-hidden rounded-full border border-cyan-200/20 bg-slate-950/60 shadow-2xl shadow-cyan-950/40">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-300 transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.42),transparent)] opacity-60" />
            </div>

            <p className="mt-4 text-sm text-slate-300">
              A tela avanca junto com a resposta do servidor.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
