import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import panzoom from "panzoom";

// Diagrama ER em Mermaid (espelha SchoolManager/docs/er.mmd)
const diagramSource = `
%% Mermaid ER diagram for SchoolManager
erDiagram
  USUARIOS {
    string id PK
    string email
    string firstName
    string lastName
    string role
    string status
    string registrationNumber
  }
  TURMAS {
    string id PK
    string name
    string academicYear
    string coordinatorId FK
  }
  DISCIPLINAS {
    string id PK
    string name
    string code
  }
  TURMAS_DISCIPLINAS {
    string id PK
    string classId FK
    string subjectId FK
    string teacherId FK
  }
  ALUNOS_TURMAS {
    string id PK
    string studentId FK
    string classId FK
  }
  ATIVIDADES {
    string id PK
    string classId FK
    string subjectId FK
    string teacherId FK
  }
  ARQUIVOS_ATIVIDADE {
    string id PK
    string activityId FK
  }
  SUBMISSOES_ATIVIDADE {
    string id PK
    string activityId FK
    string studentId FK
    string gradedBy FK
  }
  ARQUIVOS_SUBMISSAO {
    string id PK
    string submissionId FK
  }
  HISTORICO_SUBMISSAO {
    string id PK
    string submissionId FK
    string performedBy FK
  }
  RUBRICAS_ATIVIDADE {
    string id PK
    string activityId FK
  }
  AVALIACOES_RUBRICA {
    string id PK
    string rubricId FK
    string submissionId FK
    string evaluatorId FK
  }
  EVENTOS {
    string id PK
    string classId FK
    string subjectId FK
    string createdBy FK
  }
  NOTIFICACOES {
    string id PK
    string classId FK
    string subjectId FK
    string senderId FK
    string recipientId FK
  }
  NOTAS {
    string id PK
    string studentId FK
    string classSubjectId FK
    string createdBy FK
  }
  FREQUENCIAS {
    string id PK
    string studentId FK
    string classId FK
    string subjectId FK
    string teacherId FK
  }
  MATERIAIS {
    string id PK
    string subjectId FK
    string classId FK
    string teacherId FK
  }
  ARQUIVOS_MATERIAL {
    string id PK
    string materialId FK
  }
  PROVAS {
    string id PK
    string subjectId FK
    string classId FK
    string teacherId FK
  }
  NOTAS_PROVA {
    string id PK
    string examId FK
    string studentId FK
  }
  HORARIOS_TURMA {
    string id PK
    string classId FK
    string subjectId FK
    string teacherId FK
  }
  RELATORIOS {
    string id PK
    string generatedBy FK
  }
  MENSAGENS {
    string id PK
    string senderId FK
    string recipientId FK
  }
  LOGS_SISTEMA {
    string id PK
    string userId FK
  }
  PERIODOS_ACADEMICOS {
    string id PK
    string createdBy FK
  }

  USUARIOS ||--o{ TURMAS : coordinates
  USUARIOS ||--o{ TURMAS_DISCIPLINAS : teaches
  TURMAS ||--o{ TURMAS_DISCIPLINAS : offers
  DISCIPLINAS ||--o{ TURMAS_DISCIPLINAS : includes

  USUARIOS ||--o{ ALUNOS_TURMAS : enrolls
  TURMAS ||--o{ ALUNOS_TURMAS : contains

  TURMAS ||--o{ ATIVIDADES : has
  DISCIPLINAS ||--o{ ATIVIDADES : about
  USUARIOS ||--o{ ATIVIDADES : by
  ATIVIDADES ||--o{ ARQUIVOS_ATIVIDADE : has
  ATIVIDADES ||--o{ SUBMISSOES_ATIVIDADE : receives
  SUBMISSOES_ATIVIDADE ||--o{ ARQUIVOS_SUBMISSAO : includes
  SUBMISSOES_ATIVIDADE ||--o{ HISTORICO_SUBMISSAO : logs
  ATIVIDADES ||--o{ RUBRICAS_ATIVIDADE : defines
  RUBRICAS_ATIVIDADE ||--o{ AVALIACOES_RUBRICA : usedBy

  TURMAS ||--o{ EVENTOS : schedules
  DISCIPLINAS ||--o{ EVENTOS : relates
  USUARIOS ||--o{ EVENTOS : creates

  USUARIOS ||--o{ MENSAGENS : sends
  USUARIOS ||--o{ MENSAGENS : receives

  USUARIOS ||--o{ NOTIFICACOES : sends
  USUARIOS ||--o{ NOTIFICACOES : receives
  TURMAS ||--o{ NOTIFICACOES : targets
  DISCIPLINAS ||--o{ NOTIFICACOES : targets

  TURMAS_DISCIPLINAS ||--o{ NOTAS : produces
  USUARIOS ||--o{ NOTAS : authoredBy
  USUARIOS ||--o{ NOTAS : achievedBy

  USUARIOS ||--o{ FREQUENCIAS : recorded
  TURMAS ||--o{ FREQUENCIAS : forClass
  DISCIPLINAS ||--o{ FREQUENCIAS : forSubject

  DISCIPLINAS ||--o{ MATERIAIS : has
  TURMAS ||--o{ MATERIAIS : has
  USUARIOS ||--o{ MATERIAIS : provides
  MATERIAIS ||--o{ ARQUIVOS_MATERIAL : has

  DISCIPLINAS ||--o{ PROVAS : has
  TURMAS ||--o{ PROVAS : has
  USUARIOS ||--o{ PROVAS : creates
  PROVAS ||--o{ NOTAS_PROVA : grades

  TURMAS ||--o{ HORARIOS_TURMA : schedules
  DISCIPLINAS ||--o{ HORARIOS_TURMA : teaches
  USUARIOS ||--o{ HORARIOS_TURMA : teaches

  USUARIOS ||--o{ RELATORIOS : generates
  USUARIOS ||--o{ LOGS_SISTEMA : logs
  USUARIOS ||--o{ PERIODOS_ACADEMICOS : creates
`;

export default function MappingPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const panzoomRef = useRef<any>(null);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: "default" });
    const renderDiagram = async () => {
      try {
        const { svg } = await mermaid.render("schoolmanager-er", diagramSource);
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
          const svgEl = containerRef.current.querySelector("svg");
          if (svgEl) {
            // Habilita pan e zoom via roda do mouse e arrasto
            panzoomRef.current = panzoom(svgEl, {
              maxZoom: 8,
              minZoom: 0.2,
              zoomSpeed: 0.065,
            });
          }
        }
      } catch (e: any) {
        console.error("Mermaid render error", e);
        setError("Falha ao renderizar diagrama ER.");
      }
    };
    renderDiagram();

    return () => {
      if (panzoomRef.current) {
        try { panzoomRef.current.dispose(); } catch {}
        panzoomRef.current = null;
      }
    };
  }, []);

  const getSvgEl = (): SVGSVGElement | null => {
    const el = containerRef.current?.querySelector("svg") as SVGSVGElement | null;
    return el || null;
  };

  const downloadSVG = () => {
    const svgEl = getSvgEl();
    if (!svgEl) return;
    const cloned = svgEl.cloneNode(true) as SVGSVGElement;
    cloned.style.transform = "";
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(cloned);
    if (!source.match(/^<svg[^>]+xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/)) {
      source = source.replace(
        /^<svg/,
        '<svg xmlns="http://www.w3.org/2000/svg"'
      );
    }
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mapeamento-er.svg";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const downloadPNG = (scale = 2) => {
    const svgEl = getSvgEl();
    if (!svgEl) return;
    const vb = svgEl.viewBox?.baseVal;
    const width = vb?.width || svgEl.getBoundingClientRect().width || 800;
    const height = vb?.height || svgEl.getBoundingClientRect().height || 600;
    const cloned = svgEl.cloneNode(true) as SVGSVGElement;
    cloned.style.transform = "";
    cloned.setAttribute("width", String(width));
    cloned.setAttribute("height", String(height));
    if (!cloned.getAttribute("xmlns")) cloned.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    if (!cloned.getAttribute("xmlns:xlink")) cloned.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(cloned);
    const dataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      try {
        const pngUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = "mapeamento-er.png";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch (err) {
        console.error("Canvas toDataURL falhou (tainted)", err);
        downloadSVG();
      }
    };
    img.onerror = () => {
      console.error("Falha ao converter SVG para PNG.");
      downloadSVG();
    };
    img.src = dataUrl;
  };

  const zoomIn = () => {
    if (!panzoomRef.current) return;
    try { panzoomRef.current.zoomBy(1.2); } catch {}
  };
  const zoomOut = () => {
    if (!panzoomRef.current) return;
    try { panzoomRef.current.zoomBy(0.8); } catch {}
  };
  const resetZoom = () => {
    if (!panzoomRef.current) return;
    try {
      panzoomRef.current.zoomAbs(0, 0, 1);
      panzoomRef.current.moveTo(0, 0);
    } catch {}
  };
  const fitWidth = () => {
    if (!containerRef.current) return;
    const svgEl = containerRef.current.querySelector("svg");
    if (!svgEl || !panzoomRef.current) return;
    const vb = (svgEl as SVGSVGElement).viewBox?.baseVal;
    const svgWidth = vb?.width || svgEl.getBoundingClientRect().width || 0;
    const containerWidth = containerRef.current.clientWidth || 0;
    if (!svgWidth || !containerWidth) return;
    const targetScale = Math.max(0.2, Math.min(8, containerWidth / svgWidth));
    try {
      panzoomRef.current.zoomAbs(0, 0, targetScale);
      panzoomRef.current.moveTo(0, 0);
    } catch {}
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Mapeamento OO-Relacional — Diagrama ER</h2>
        <a
          className="text-sm text-blue-600 hover:underline"
          href="/docs/OO-Relational-Mapping.md"
          target="_blank"
          rel="noreferrer"
        >Abrir documento</a>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => downloadPNG(2)} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Baixar PNG</button>
        <button onClick={downloadSVG} className="px-3 py-2 bg-slate-700 text-white rounded hover:bg-slate-800 text-sm">Baixar SVG</button>
        <span className="text-xs text-gray-500 ml-2">Use a roda do mouse para zoom e arraste para mover.</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={zoomOut} className="px-2 py-1 text-sm rounded border">− Zoom</button>
        <button onClick={zoomIn} className="px-2 py-1 text-sm rounded border">+ Zoom</button>
        <button onClick={resetZoom} className="px-2 py-1 text-sm rounded border">Reset</button>
        <button onClick={fitWidth} className="px-2 py-1 text-sm rounded border">Ajustar à largura</button>
      </div>
      {error ? (
        <div className="text-red-600 text-sm">{error}</div>
      ) : (
        <div
          ref={containerRef}
          className="bg-white rounded border border-gray-200 p-4 overflow-hidden"
          style={{ minHeight: 500, height: "70vh" }}
        />
      )}
    </div>
  );
}