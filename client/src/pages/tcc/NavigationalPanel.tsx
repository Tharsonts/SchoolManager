import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import panzoom from "panzoom";

// Modelo Navegacional em Mermaid
const diagramSource = `
%% Mermaid Flowchart for SchoolManager Navigational Model
flowchart LR
  %% Subgrupos (títulos simples nas linhas 'subgraph')
  subgraph Autenticacao
    direction LR
    login[Login]
    recuperar[Recuperar senha]
    perfil[Perfil]
    logout[Logout]
  end

  subgraph PainelPrincipal
    direction LR
    dashboard[Dashboard]
    home[Home]
    ajuda[Ajuda]
  end

  subgraph Academico
    direction LR
    turmas[Turmas]
    disciplinas[Disciplinas]
    periodos[Períodos]
  end

  subgraph Comunicacao
    direction LR
    mensagens[Mensagens]
    notificacoes[Notificações]
  end

  subgraph Conteudos
    direction LR
    materiais[Materiais]
    publicacoes[Publicações]
    arquivos[Arquivos]
  end

  subgraph Avaliacao
    direction LR
    atividades[Atividades]
    submissao[Submissões]
    provas[Provas]
    rubricas[Rubricas]
    notas[Notas]
  end

  subgraph Agenda
    direction LR
    calendario[Calendário]
    eventos[Eventos]
    horarios[Horários]
  end

  subgraph Administracao
    direction LR
    usuarios[Usuários]
    perfis[Perfis]
    configuracoes[Configurações]
  end

  subgraph Relatorios
    direction LR
    relatorios[Relatórios]
  end

  subgraph Suporte
    direction LR
    logs[Logs do Sistema]
  end

  %% Entradas e navegação principal
  login --> dashboard
  recuperar -.-> login
  dashboard --> home
  home --> Academico
  home --> Comunicacao
  home --> Conteudos
  home --> Avaliacao
  home --> Agenda
  home --> Administracao
  home --> Relatorios
  home --> perfil

  %% Painel principal encurta caminhos
  dashboard --> calendario
  dashboard --> mensagens
  dashboard --> materiais
  dashboard --> atividades
  dashboard --> notas
  dashboard --> notificacoes

  %% Relações contextuais entre módulos
  turmas --> atividades
  turmas --> provas
  turmas --> horarios
  disciplinas --> materiais
  disciplinas --> atividades
  periodos --> calendario

  atividades --> submissao
  submissao --> notas
  provas --> notas
  rubricas --> notas

  calendario --> eventos
  eventos --> horarios

  mensagens --> notificacoes
  notificacoes --> mensagens

  perfil --> configuracoes
  perfil --> logout
  logout --> login

  %% Administração e relatórios
  usuarios --> perfis
  administracao --> usuarios
  administracao --> configuracoes
  notas --> relatorios
  frequencia[Frequência] --> relatorios
`;

export default function NavigationalPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const panzoomRef = useRef<any>(null);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: "default" });
    const renderDiagram = async () => {
      try {
        const { svg } = await mermaid.render("schoolmanager-nav", diagramSource);
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
        setError("Falha ao renderizar modelo navegacional.");
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
    // Remover transformações de pan/zoom ao exportar
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
    a.download = "modelo-navegacional.svg";
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
    // Usar Data URL evita problemas de origem e canvas 'tainted'
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
        a.download = "modelo-navegacional.png";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch (err) {
        console.error("Canvas toDataURL falhou (tainted)", err);
        // Fallback imediato: baixa SVG
        downloadSVG();
      }
    };
    img.onerror = () => {
      console.error("Falha ao converter SVG para PNG.");
      downloadSVG();
    };
    img.src = dataUrl;
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Modelo Navegacional — Fluxo de Telas</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => downloadPNG(2)} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Baixar PNG</button>
          <button onClick={downloadSVG} className="px-3 py-2 bg-slate-700 text-white rounded hover:bg-slate-800 text-sm">Baixar SVG</button>
        </div>
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
      <div className="text-xs text-slate-500">Use a roda do mouse para zoom e arraste para mover.</div>
    </div>
  );
}