import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, GraduationCap } from "lucide-react";

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
  if (status === "ready") return "Sistema pronto";
  if (elapsedSeconds < 4) return statusLines[0];
  if (elapsedSeconds < 10) return statusLines[1];
  if (elapsedSeconds < 18) return statusLines[2];
  if (elapsedSeconds < 28) return statusLines[3];
  return "Ajustando os ultimos detalhes";
}

export default function RenderWakePage() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [status, setStatus] = useState<WakeStatus>("checking");
  const [attempts, setAttempts] = useState(0);

  const progress = useMemo(() => {
    if (status === "ready") return 100;
    return Math.min(92, 12 + elapsedSeconds * 4 + attempts * 3);
  }, [attempts, elapsedSeconds, status]);

  const gaugeStyle = useMemo(
    () => ({
      background: `conic-gradient(from -130deg, #67e8f9 0deg, #38bdf8 ${progress * 2.6}deg, rgba(148, 163, 184, 0.18) ${progress * 2.6}deg, rgba(148, 163, 184, 0.18) 260deg, transparent 260deg)`,
    }),
    [progress],
  );

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
            Inicializando
          </h1>

          <div className="mx-auto mt-10 flex h-64 w-64 items-center justify-center rounded-full p-3 shadow-2xl shadow-cyan-950/50 sm:h-72 sm:w-72" style={gaugeStyle}>
            <div className="relative flex h-full w-full items-center justify-center rounded-full bg-[#07152f]">
              <div className="absolute inset-5 rounded-full border border-cyan-200/10" />
              <div className="absolute bottom-10 h-1 w-24 rounded-full bg-cyan-200/20" />
              <div
                className="absolute bottom-10 h-1 w-24 origin-right rounded-full bg-cyan-200 transition-transform duration-700"
                style={{ transform: `rotate(${Math.min(130, -130 + progress * 2.6)}deg)` }}
              />
              <div className="space-y-2">
                <div className="text-5xl font-bold tabular-nums">{progress}%</div>
                <div className="mx-auto h-1.5 w-14 rounded-full bg-cyan-300" />
              </div>
            </div>
          </div>

          <div className="mt-8 min-h-16">
            <div className="flex items-center justify-center gap-2 text-lg font-semibold text-slate-100">
              {status === "ready" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              ) : (
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-300" />
              )}
              <span>{getStatusText(elapsedSeconds, status)}</span>
            </div>
            <p className="mt-2 text-sm text-slate-300">
              Aguarde um instante. Voce sera redirecionado automaticamente.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
