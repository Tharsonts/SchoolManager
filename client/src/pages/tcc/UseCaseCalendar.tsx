import React, { useCallback, useRef } from "react";
import html2canvas from "html2canvas";

export default function UseCaseCalendar() {
  const diagramRef = useRef<HTMLDivElement>(null);

  const exportPNG = useCallback(async () => {
    if (!diagramRef.current) return;
    const canvas = await html2canvas(diagramRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
    });
    const dataURL = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataURL;
    a.download = "Caso_de_Uso_-_Gerenciar_Comunicados_no_Calendario.png";
    a.click();
  }, []);

  const exportSVG = useCallback(() => {
    const svg = document.querySelector("#usecase-svg") as SVGSVGElement | null;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Caso_de_Uso_-_Gerenciar_Comunicados_no_Calendario.svg";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Caso de Uso: Gerenciar comunicados no calendário
        </h1>
        <div className="flex gap-2">
          <button
            onClick={exportPNG}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Exportar PNG
          </button>
          <button
            onClick={exportSVG}
            className="px-3 py-2 bg-slate-700 text-white rounded hover:bg-slate-800"
          >
            Exportar SVG
          </button>
        </div>
      </div>

      <p className="text-sm text-slate-600">
        Atores: Diretor e Coordenador. Diagrama de caso de uso contendo a
        funcionalidade de gerenciar comunicados no calendário, com associações
        dos atores ao caso de uso.
      </p>

      <div ref={diagramRef} className="bg-white border rounded-md p-4 inline-block">
        {/* SVG desenhado manualmente para garantir portabilidade */}
        <svg
          id="usecase-svg"
          width="900"
          height="520"
          viewBox="0 0 900 520"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Fundo */}
          <rect x="0" y="0" width="900" height="520" fill="#ffffff" />

          {/* Fronteira do sistema */}
          <rect
            x="180"
            y="40"
            width="540"
            height="440"
            fill="#f8fafc"
            stroke="#0f172a"
            strokeWidth="2"
            rx="8"
          />
          <text x="450" y="70" textAnchor="middle" fontSize="18" fill="#0f172a" fontWeight={600}>
            Sistema Escolar
          </text>

          {/* Caso de uso principal (elipse) */}
          <ellipse cx="450" cy="270" rx="180" ry="60" fill="#e2e8f0" stroke="#1e293b" strokeWidth="2" />
          <text x="450" y="260" textAnchor="middle" fontSize="16" fill="#0f172a" fontWeight={600}>
            Gerenciar comunicados
          </text>
          <text x="450" y="280" textAnchor="middle" fontSize="14" fill="#0f172a">
            no calendário
          </text>

          {/* Atores: Diretor (esquerda) e Coordenador (direita) */}
          {/* Diretor - stick figure */}
          <circle cx="70" cy="200" r="20" fill="#ffffff" stroke="#1e293b" strokeWidth="2" />
          <line x1="70" y1="220" x2="70" y2="280" stroke="#1e293b" strokeWidth="2" />
          <line x1="40" y1="240" x2="100" y2="240" stroke="#1e293b" strokeWidth="2" />
          <line x1="70" y1="280" x2="50" y2="320" stroke="#1e293b" strokeWidth="2" />
          <line x1="70" y1="280" x2="90" y2="320" stroke="#1e293b" strokeWidth="2" />
          <text x="70" y="350" textAnchor="middle" fontSize="14" fill="#0f172a">Diretor</text>

          {/* Coordenador - stick figure */}
          <circle cx="830" cy="200" r="20" fill="#ffffff" stroke="#1e293b" strokeWidth="2" />
          <line x1="830" y1="220" x2="830" y2="280" stroke="#1e293b" strokeWidth="2" />
          <line x1="800" y1="240" x2="860" y2="240" stroke="#1e293b" strokeWidth="2" />
          <line x1="830" y1="280" x2="810" y2="320" stroke="#1e293b" strokeWidth="2" />
          <line x1="830" y1="280" x2="850" y2="320" stroke="#1e293b" strokeWidth="2" />
          <text x="830" y="350" textAnchor="middle" fontSize="14" fill="#0f172a">Coordenador</text>

          {/* Associações (linhas) */}
          <line x1="120" y1="240" x2="180" y2="240" stroke="#1e293b" strokeWidth="2" />
          <line x1="720" y1="240" x2="780" y2="240" stroke="#1e293b" strokeWidth="2" />

          {/* Pontos de conexão ao caso de uso */}
          <line x1="180" y1="240" x2="270" y2="260" stroke="#334155" strokeWidth="2" strokeDasharray="4 3" />
          <line x1="720" y1="240" x2="630" y2="260" stroke="#334155" strokeWidth="2" strokeDasharray="4 3" />

          {/* Observações (fora do sistema) */}
          <text x="450" y="480" textAnchor="middle" fontSize="12" fill="#334155">
            Diagrama de Caso de Uso — Atores associados ao caso de uso principal
          </text>
        </svg>
      </div>

      <div className="text-xs text-slate-500">
        Fonte: Elaborado pelos autores.
      </div>
    </div>
  );
}