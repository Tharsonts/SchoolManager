import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import MappingPanel from "@/pages/tcc/MappingPanel";
import NavigationalPanel from "@/pages/tcc/NavigationalPanel";

type NodeType =
  | "actor"
  | "usecase"
  | "entity"
  | "action"
  | "decision"
  | "start"
  | "end"
  | "bar"
  | "lifeline"
  | "fragment";
type NodeItem = { id: string; type: NodeType; label: string; x: number; y: number; w?: number; h?: number; fragmentKind?: "alt" | "opt" | "loop" };
type LinkKind = "association" | "include" | "extends" | "flow" | "message" | "async" | "return";
type LinkItem = { id: string; from: string; to: string; kind: LinkKind; label?: string; y?: number; seq?: number };

type TemplateNode = { type: NodeType; label: string; x?: number; y?: number; w?: number; h?: number; fragmentKind?: "alt" | "opt" | "loop"; fragmentOperands?: string[] };
type TemplateLink = { fromLabel: string; toLabel: string; kind?: LinkKind; label?: string; y?: number };
type TemplateSpec = { name: string; nodes: TemplateNode[]; links: TemplateLink[] };

export default function UseCaseEditor() {
  const diagramRef = useRef<HTMLDivElement>(null);
  const gridSize = 10;

  const [nodes, setNodes] = useState<NodeItem[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [newLinkFrom, setNewLinkFrom] = useState<string>("start-1");
  const [newLinkTo, setNewLinkTo] = useState<string>("uc-1");
  const [newLinkKind, setNewLinkKind] = useState<LinkKind>("flow");
  const [newLinkLabel, setNewLinkLabel] = useState<string>("");
  const [fragmentUiKind, setFragmentUiKind] = useState<"alt" | "opt" | "loop">("alt");
  const [fragmentUiGuard, setFragmentUiGuard] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{nodes: NodeItem[]; links: LinkItem[]}>>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  // Templates sempre substituem o diagrama ao serem aplicados

  const actor = useMemo(() => nodes.find((n) => n.type === "actor"), [nodes]);

  const [diagramMode, setDiagramMode] = useState<"activity" | "sequence" | "mapping" | "navigational">("activity");

  // Removidos os controles individuais (adicionar/renomear) para manter apenas Templates

  const addEntity = () => {
    const id = `ent-${Date.now()}`;
    const y = 140 + (nodes.filter((n) => n.type === "entity").length % 6) * 60;
    setNodes((prev) => [...prev, { id, type: "entity", label: "Nova Entidade", x: 700, y }]);
  };

  const createLink = () => {
    if (!newLinkFrom || !newLinkTo || newLinkFrom === newLinkTo) return;
    const id = `l-${Date.now()}`;
    // Sequência: posicionamento vertical automático e numeração
    if (diagramMode === "sequence" && (newLinkKind === "message" || newLinkKind === "async" || newLinkKind === "return")) {
      const seqCount = links.filter((l) => l.kind === "message" || l.kind === "async" || l.kind === "return").length + 1;
      const baseY = 200; // abaixo do cabeçalho das lifelines
      const stepY = 36;
      const y = baseY + (seqCount - 1) * stepY;
      const labelWithSeq = `${seqCount}. ${newLinkLabel || ""}`.trim();
      setLinks((prev) => [
        ...prev,
        { id, from: newLinkFrom, to: newLinkTo, kind: newLinkKind, label: labelWithSeq || undefined, y, seq: seqCount }
      ]);
    } else {
      setLinks((prev) => [
        ...prev, 
        { id, from: newLinkFrom, to: newLinkTo, kind: newLinkKind, label: newLinkLabel || undefined }
      ]);
    }
    setNewLinkLabel("");
  };

  const nextId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random()*1000)}`;

  const findNodeByLabel = (label: string, type?: NodeType) =>
    nodes.find((n) => n.label === label && (!type || n.type === type));

  const addTemplate = (spec: TemplateSpec) => {
    // Sempre substitui o diagrama atual pelo template selecionado
    const createdIds: Record<string, string> = {};
    let actorCount = 0;
    let activityCount = 0;
    const newNodes: NodeItem[] = spec.nodes.map((t) => {
      const idPrefix =
        t.type === "actor"
          ? "actor"
          : t.type === "usecase"
          ? "uc"
          : t.type === "entity"
          ? "ent"
          : t.type === "start"
          ? "start"
          : t.type === "end"
          ? "end"
          : t.type === "decision"
          ? "dec"
          : t.type === "bar"
          ? "bar"
          : "act";
      const id = nextId(idPrefix);
      const x =
        t.x ??
        (t.type === "actor"
          ? 80
          : 560 + (activityCount % 3) * 140);
      const y =
        t.y ??
        (t.type === "actor" ? 120 + actorCount * 80 : 120 + (activityCount % 8) * 50);
      if (t.type === "actor") actorCount += 1; else activityCount += 1;
      createdIds[t.label] = id;
      return { id, type: t.type, label: t.label, x, y, w: t.w, h: t.h, fragmentKind: t.fragmentKind, fragmentOperands: t.fragmentOperands };
    });
    const newLinks: LinkItem[] = spec.links.map((l, idx) => ({
      id: nextId("l"),
      from: createdIds[l.fromLabel],
      to: createdIds[l.toLabel],
      kind: l.kind ?? "flow",
      label: diagramMode === "sequence" && (l.kind === "message" || l.kind === "return" || l.kind === "async")
        ? `${idx + 1}. ${l.label ?? ""}`
        : l.label,
      y: diagramMode === "sequence" && (l.kind === "message" || l.kind === "return" || l.kind === "async")
        ? (l.y ?? (200 + idx * 36))
        : undefined,
      seq: diagramMode === "sequence" && (l.kind === "message" || l.kind === "return") ? (idx + 1) : undefined,
    })).filter((l) => !!l.from && !!l.to) as LinkItem[];
    setNodes(newNodes);
    setLinks(newLinks);
    setSelectedId(null);
    if (newNodes.length > 0) {
      setNewLinkFrom(newNodes[0].id);
      setNewLinkTo(newNodes[0].id);
    }
    setNewLinkKind(diagramMode === "sequence" ? "message" : "flow");
  };

  const updateNodeLabel = (id: string, label: string) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, label } : n)));
  };

  const onMouseDownNode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDragId(id);
    setSelectedId(id);
  };

  const onMouseUpSvg = () => setDragId(null);

  const onMouseMoveSvg = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragId) return;
    const svg = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - svg.left;
    const y = e.clientY - svg.top;
    // snap to grid
    const sx = Math.round(x / gridSize) * gridSize;
    const sy = Math.round(y / gridSize) * gridSize;
    setNodes((prev) => prev.map((n) => (n.id === dragId ? { ...n, x: sx, y: sy } : n)));
  };

  const exportPNG = useCallback(async () => {
    if (!diagramRef.current) return;
    const canvas = await html2canvas(diagramRef.current, { backgroundColor: "#ffffff", scale: 2, useCORS: true });
    const dataURL = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataURL;
    a.download = "Caso_de_Uso_-_Editor.png";
    a.click();
  }, []);

  const exportSVG = useCallback(() => {
    const svg = document.querySelector("#usecase-editor-svg") as SVGSVGElement | null;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Caso_de_Uso_-_Editor.svg";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Organização rápida do layout (sequência)
  const organizeLayout = useCallback(() => {
    if (diagramMode !== "sequence") return;
    // Margens internas calculadas pela largura dos cabeçalhos das lifelines
    const lifelines = nodes.filter((n) => n.type === "lifeline");
    const headWMax = lifelines.length ? Math.max(...lifelines.map((n) => n.w ?? 220)) : 220;
    const headHalf = Math.round(headWMax / 2);
    const innerMargin = 10; // folga para não encostar na borda
    const systemLeft = 140; const systemRight = 1140;
    const left = systemLeft + headHalf + innerMargin;
    const right = systemRight - headHalf - innerMargin;
    const count = lifelines.length;
    const step = count <= 1 ? 0 : (right - left) / (count - 1);

    // Distribui lifelines igualmente e ajusta cabeçalhos maiores
    const lifelinePositions: Record<string, number> = {};
    lifelines.forEach((n, i) => {
      const nx = Math.round((left + i * step) / gridSize) * gridSize;
      lifelinePositions[n.id] = nx;
    });

    setNodes((prev) => prev.map((n) => {
      if (n.type === "lifeline") {
        const nx = lifelinePositions[n.id] ?? n.x;
        return { ...n, x: nx, w: n.w ?? 220, h: n.h ?? 56 };
      }
      if (n.type === "fragment") {
        // Centraliza e amplia para cobrir bem as colunas
        const newW = n.w ?? 820;
        return { ...n, x: 640, w: newW };
      }
      if (n.type === "action") {
        // Caixas de ação um pouco maiores para caber melhor nos fragmentos
        return { ...n, w: n.w ?? 280, h: n.h ?? 56 };
      }
      return n;
    }));

    // Espaça mensagens verticalmente com passo maior
    const baseY = 200;
    const stepY = 44;
    let seqIndex = 0;
    setLinks((prev) => prev.map((l) => {
      if (l.kind === "message" || l.kind === "async" || l.kind === "return") {
        seqIndex += 1;
        return { ...l, y: baseY + (seqIndex - 1) * stepY };
      }
      return l;
    }));
  }, [diagramMode, gridSize, nodes, links]);

  // Persist state in localStorage and keep history for undo/redo
  useEffect(() => {
    const saved = localStorage.getItem("tcc-diagram-state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as {nodes: NodeItem[]; links: LinkItem[]};
        setNodes(parsed.nodes);
        setLinks(parsed.links);
        setHistory([parsed]);
        setHistoryIndex(0);
      } catch {}
    } else {
      const initial = { nodes, links };
      setHistory([initial]);
      setHistoryIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const current = { nodes, links };
    localStorage.setItem("tcc-diagram-state", JSON.stringify(current));
  }, [nodes, links]);

  const pushHistory = useCallback((next: {nodes: NodeItem[]; links: LinkItem[]}) => {
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, next];
    });
    setHistoryIndex((i) => i + 1);
  }, [historyIndex]);

  // Wrap state updates to push history
  useEffect(() => {
    if (historyIndex >= 0) {
      const current = { nodes, links };
      // avoid pushing duplicates
      const last = history[historyIndex];
      if (!last || JSON.stringify(last) !== JSON.stringify(current)) {
        pushHistory(current);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, links]);

  const undo = () => {
    setHistoryIndex((i) => Math.max(0, i - 1));
    setNodes(history[Math.max(0, historyIndex - 1)]?.nodes || nodes);
    setLinks(history[Math.max(0, historyIndex - 1)]?.links || links);
  };

  const redo = () => {
    const nextIndex = Math.min(history.length - 1, historyIndex + 1);
    setHistoryIndex(nextIndex);
    setNodes(history[nextIndex]?.nodes || nodes);
    setLinks(history[nextIndex]?.links || links);
  };

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "z") {
        ev.preventDefault();
        undo();
      } else if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "y") {
        ev.preventDefault();
        redo();
      } else if (ev.key === "Delete" && selectedId) {
        ev.preventDefault();
        setNodes((prev) => prev.filter((n) => n.id !== selectedId));
        setLinks((prev) => prev.filter((l) => l.from !== selectedId && l.to !== selectedId));
        setSelectedId(null);
      } else if (ev.key === "Escape") {
        setSelectedId(null);
        setDragId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, undo, redo]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Editor de Diagramas</h1>
        {diagramMode !== "mapping" && diagramMode !== "navigational" && (
          <div className="flex gap-2">
            <button onClick={exportPNG} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Exportar PNG</button>
            <button onClick={exportSVG} className="px-3 py-2 bg-slate-700 text-white rounded hover:bg-slate-800">Exportar SVG</button>
            {diagramMode === "sequence" && (
              <button onClick={organizeLayout} className="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">Organizar layout</button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-700">Tipo de diagrama</label>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={diagramMode}
          onChange={(e) => setDiagramMode(e.target.value as "activity" | "sequence" | "mapping" | "navigational")}
        >
          <option value="activity">Atividades</option>
          <option value="sequence">Sequência de eventos</option>
          <option value="mapping">Mapeamento (ER)</option>
          <option value="navigational">Modelo Navegacional</option>
        </select>
      </div>
      {diagramMode === "mapping" && (
        <div className="mt-4">
          <MappingPanel />
        </div>
      )}
      {diagramMode === "navigational" && (
        <div className="mt-4">
          <NavigationalPanel />
        </div>
      )}

      <div className={(diagramMode === "mapping" || diagramMode === "navigational") ? "hidden" : "grid grid-cols-1 md:grid-cols-3 gap-4"}>
        <div className="space-y-2">
          <div className="pt-1 space-y-2">
            {diagramMode === "activity" ? (
            <h3 className="text-xs font-semibold text-slate-700">Templates – Diagramas de Atividades (Figuras 9–15)</h3>
            ) : (
            <h3 className="text-xs font-semibold text-slate-700">Templates – Diagramas de Sequência (Figuras 16–22)</h3>
            )}
            <div className="grid grid-cols-1 gap-2">
              {diagramMode === "activity" && (<>
              <button
                className="px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm"
                onClick={() => addTemplate({
                  name: "Figura 9 – Atividades de Realizar comunicação",
                  nodes: [
                    { type: "start", label: "Inicial", x: 300, y: 100 },
                    { type: "action", label: "Selecionar canal", x: 430, y: 100 },
                    { type: "action", label: "Escrever mensagem", x: 600, y: 100 },
                    { type: "decision", label: "Mensagem válida?", x: 600, y: 180 },
                    { type: "action", label: "Corrigir mensagem", x: 450, y: 260 },
                    { type: "action", label: "Enviar mensagem", x: 780, y: 180 },
                    { type: "action", label: "Confirmar entrega", x: 780, y: 260 },
                    { type: "end", label: "Final", x: 900, y: 340 },
                  ],
                  links: [
                    { fromLabel: "Inicial", toLabel: "Selecionar canal", kind: "flow" },
                    { fromLabel: "Selecionar canal", toLabel: "Escrever mensagem", kind: "flow" },
                    { fromLabel: "Escrever mensagem", toLabel: "Mensagem válida?", kind: "flow" },
                    { fromLabel: "Mensagem válida?", toLabel: "Enviar mensagem", kind: "flow", label: "[sim]" },
                    { fromLabel: "Mensagem válida?", toLabel: "Corrigir mensagem", kind: "flow", label: "[não]" },
                    { fromLabel: "Corrigir mensagem", toLabel: "Escrever mensagem", kind: "flow" },
                    { fromLabel: "Enviar mensagem", toLabel: "Confirmar entrega", kind: "flow" },
                    { fromLabel: "Confirmar entrega", toLabel: "Final", kind: "flow" },
                  ],
                })}
              >Figura 9 – Realizar comunicação</button>

              <button
                className="px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                onClick={() => addTemplate({
                  name: "Figura 10 – Atividades de Gerenciar comunicados no calendário",
                  nodes: [
                    { type: "start", label: "Inicial", x: 300, y: 100 },
                    { type: "action", label: "Criar comunicado", x: 450, y: 100 },
                    { type: "action", label: "Definir data e público", x: 640, y: 100 },
                    { type: "action", label: "Publicar comunicado", x: 820, y: 140 },
                    { type: "action", label: "Notificar destinatários", x: 820, y: 220 },
                    { type: "end", label: "Final", x: 920, y: 300 },
                  ],
                  links: [
                    { fromLabel: "Inicial", toLabel: "Criar comunicado", kind: "flow" },
                    { fromLabel: "Criar comunicado", toLabel: "Definir data e público", kind: "flow" },
                    { fromLabel: "Definir data e público", toLabel: "Publicar comunicado", kind: "flow" },
                    { fromLabel: "Publicar comunicado", toLabel: "Notificar destinatários", kind: "flow" },
                    { fromLabel: "Notificar destinatários", toLabel: "Final", kind: "flow" },
                  ],
                })}
              >Figura 10 – Gerenciar comunicados</button>

              <button
                className="px-3 py-1.5 bg-sky-600 text-white rounded hover:bg-sky-700 text-sm"
                onClick={() => addTemplate({
                  name: "Figura 11 – Atividades de Publicar material",
                  nodes: [
                    { type: "start", label: "Inicial", x: 300, y: 100 },
                    { type: "action", label: "Selecionar aula", x: 460, y: 100 },
                    { type: "action", label: "Anexar arquivo", x: 640, y: 100 },
                    { type: "decision", label: "Upload válido?", x: 640, y: 180 },
                    { type: "action", label: "Corrigir/reenviar", x: 500, y: 260 },
                    { type: "action", label: "Publicar material", x: 820, y: 180 },
                    { type: "action", label: "Notificar alunos", x: 820, y: 260 },
                    { type: "end", label: "Final", x: 920, y: 340 },
                  ],
                  links: [
                    { fromLabel: "Inicial", toLabel: "Selecionar aula", kind: "flow" },
                    { fromLabel: "Selecionar aula", toLabel: "Anexar arquivo", kind: "flow" },
                    { fromLabel: "Anexar arquivo", toLabel: "Upload válido?", kind: "flow" },
                    { fromLabel: "Upload válido?", toLabel: "Publicar material", kind: "flow", label: "[sim]" },
                    { fromLabel: "Upload válido?", toLabel: "Corrigir/reenviar", kind: "flow", label: "[não]" },
                    { fromLabel: "Corrigir/reenviar", toLabel: "Anexar arquivo", kind: "flow" },
                    { fromLabel: "Publicar material", toLabel: "Notificar alunos", kind: "flow" },
                    { fromLabel: "Notificar alunos", toLabel: "Final", kind: "flow" },
                  ],
                })}
              >Figura 11 – Publicar material</button>

              <button
                className="px-3 py-1.5 bg-amber-600 text-white rounded hover:bg-amber-700 text-sm"
                onClick={() => addTemplate({
                  name: "Figura 12 – Atividades de Lançar atividade",
                  nodes: [
                    { type: "start", label: "Inicial", x: 280, y: 100 },
                    { type: "action", label: "Criar atividade", x: 440, y: 100 },
                    { type: "action", label: "Definir prazo", x: 620, y: 100 },
                    { type: "action", label: "Publicar atividade", x: 800, y: 140 },
                    { type: "action", label: "Gerar evento no calendário", x: 800, y: 220 },
                    { type: "end", label: "Final", x: 900, y: 300 },
                  ],
                  links: [
                    { fromLabel: "Inicial", toLabel: "Criar atividade", kind: "flow" },
                    { fromLabel: "Criar atividade", toLabel: "Definir prazo", kind: "flow" },
                    { fromLabel: "Definir prazo", toLabel: "Publicar atividade", kind: "flow" },
                    { fromLabel: "Publicar atividade", toLabel: "Gerar evento no calendário", kind: "flow" },
                    { fromLabel: "Gerar evento no calendário", toLabel: "Final", kind: "flow" },
                  ],
                })}
              >Figura 12 – Lançar atividade</button>

              <button
                className="px-3 py-1.5 bg-teal-600 text-white rounded hover:bg-teal-700 text-sm"
                onClick={() => addTemplate({
                  name: "Figura 13 – Atividades de Realizar atividades",
                  nodes: [
                    { type: "start", label: "Inicial", x: 260, y: 100 },
                    { type: "action", label: "Abrir atividade", x: 420, y: 100 },
                    { type: "action", label: "Preencher respostas", x: 590, y: 100 },
                    { type: "decision", label: "Respostas válidas?", x: 720, y: 170 },
                    { type: "action", label: "Corrigir respostas", x: 520, y: 260 },
                    { type: "action", label: "Enviar respostas", x: 840, y: 170 },
                    { type: "action", label: "Professor corrige", x: 860, y: 240 },
                    { type: "action", label: "Publicar resultado", x: 880, y: 310 },
                    { type: "end", label: "Final", x: 920, y: 380 },
                  ],
                  links: [
                    { fromLabel: "Inicial", toLabel: "Abrir atividade", kind: "flow" },
                    { fromLabel: "Abrir atividade", toLabel: "Preencher respostas", kind: "flow" },
                    { fromLabel: "Preencher respostas", toLabel: "Respostas válidas?", kind: "flow" },
                    { fromLabel: "Respostas válidas?", toLabel: "Enviar respostas", kind: "flow", label: "[sim]" },
                    { fromLabel: "Respostas válidas?", toLabel: "Corrigir respostas", kind: "flow", label: "[não]" },
                    { fromLabel: "Corrigir respostas", toLabel: "Preencher respostas", kind: "flow" },
                    { fromLabel: "Enviar respostas", toLabel: "Professor corrige", kind: "flow" },
                    { fromLabel: "Professor corrige", toLabel: "Publicar resultado", kind: "flow" },
                    { fromLabel: "Publicar resultado", toLabel: "Final", kind: "flow" },
                  ],
                })}
              >Figura 13 – Realizar atividades</button>

              <button
                className="px-3 py-1.5 bg-rose-600 text-white rounded hover:bg-rose-700 text-sm"
                onClick={() => addTemplate({
                  name: "Figura 14 – Atividades de Lançar notas de provas",
                  nodes: [
                    { type: "start", label: "Inicial", x: 280, y: 100 },
                    { type: "action", label: "Selecionar prova", x: 450, y: 100 },
                    { type: "action", label: "Inserir notas", x: 630, y: 100 },
                    { type: "decision", label: "Notas válidas?", x: 630, y: 180 },
                    { type: "action", label: "Ajustar notas", x: 490, y: 260 },
                    { type: "action", label: "Publicar notas", x: 820, y: 180 },
                    { type: "action", label: "Aluno visualiza", x: 820, y: 260 },
                    { type: "end", label: "Final", x: 920, y: 340 },
                  ],
                  links: [
                    { fromLabel: "Inicial", toLabel: "Selecionar prova", kind: "flow" },
                    { fromLabel: "Selecionar prova", toLabel: "Inserir notas", kind: "flow" },
                    { fromLabel: "Inserir notas", toLabel: "Notas válidas?", kind: "flow" },
                    { fromLabel: "Notas válidas?", toLabel: "Publicar notas", kind: "flow", label: "[sim]" },
                    { fromLabel: "Notas válidas?", toLabel: "Ajustar notas", kind: "flow", label: "[não]" },
                    { fromLabel: "Ajustar notas", toLabel: "Inserir notas", kind: "flow" },
                    { fromLabel: "Publicar notas", toLabel: "Aluno visualiza", kind: "flow" },
                    { fromLabel: "Aluno visualiza", toLabel: "Final", kind: "flow" },
                  ],
                })}
              >Figura 14 – Lançar notas</button>

              <button
                className="px-3 py-1.5 bg-violet-600 text-white rounded hover:bg-violet-700 text-sm"
                onClick={() => addTemplate({
                  name: "Figura 15 – Atividades de Consultar assistente de IA",
                  nodes: [
                    { type: "start", label: "Inicial", x: 300, y: 100 },
                    { type: "action", label: "Abrir assistente de IA", x: 470, y: 100 },
                    { type: "action", label: "Escrever pergunta", x: 650, y: 100 },
                    { type: "action", label: "Gerar resposta", x: 820, y: 140 },
                    { type: "action", label: "Mostrar resposta", x: 820, y: 220 },
                    { type: "end", label: "Final", x: 920, y: 300 },
                  ],
                  links: [
                    { fromLabel: "Inicial", toLabel: "Abrir assistente de IA", kind: "flow" },
                    { fromLabel: "Abrir assistente de IA", toLabel: "Escrever pergunta", kind: "flow" },
                    { fromLabel: "Escrever pergunta", toLabel: "Gerar resposta", kind: "flow" },
                    { fromLabel: "Gerar resposta", toLabel: "Mostrar resposta", kind: "flow" },
                    { fromLabel: "Mostrar resposta", toLabel: "Final", kind: "flow" },
                  ],
                })}
              >Figura 15 – Assistente de IA</button>
              </>)}

              {diagramMode === "sequence" && (
              <>
                <button
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm"
                  onClick={() => addTemplate({
                    name: "Figura 16 – Sequência: Realizar comunicação",
                    nodes: [
                      { type: "lifeline", label: "Usuário", x: 340, y: 90 },
                      { type: "lifeline", label: "Sistema de Chat", x: 540, y: 90 },
                      { type: "lifeline", label: "Destinatário", x: 740, y: 90 },
                      { type: "fragment", label: "alt", x: 590, y: 260, w: 620, h: 160, fragmentKind: "alt", fragmentOperands: ["[destinatário online]", "[else]"] },
                      { type: "fragment", label: "opt", x: 590, y: 400, w: 620, h: 120, fragmentKind: "opt", fragmentOperands: ["[anexo presente]"] },
                    ],
                    links: [
                      { fromLabel: "Usuário", toLabel: "Sistema de Chat", kind: "message", label: "novaMensagem()", y: 200 },
                      { fromLabel: "Sistema de Chat", toLabel: "Destinatário", kind: "async", label: "entregarMensagem()", y: 230 },
                      { fromLabel: "Destinatário", toLabel: "Sistema de Chat", kind: "return", label: "recebido()", y: 260 },
                      { fromLabel: "Sistema de Chat", toLabel: "Usuário", kind: "return", label: "confirmarEnvio()", y: 290 },
                      { fromLabel: "Usuário", toLabel: "Sistema de Chat", kind: "message", label: "enviarAnexo()", y: 360 },
                      { fromLabel: "Sistema de Chat", toLabel: "Destinatário", kind: "async", label: "entregarAnexo()", y: 390 },
                      { fromLabel: "Destinatário", toLabel: "Sistema de Chat", kind: "return", label: "ackAnexo()", y: 420 },
                    ],
                  })}
                >Figura 16 – Realizar comunicação</button>

                <button
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                  onClick={() => addTemplate({
                    name: "Figura 17 – Sequência: Gerenciar comunicados",
                    nodes: [
                      { type: "lifeline", label: "Gestor", x: 340, y: 90 },
                      { type: "lifeline", label: "Calendário", x: 540, y: 90 },
                      { type: "lifeline", label: "Aluno", x: 740, y: 90 },
                      { type: "fragment", label: "alt", x: 590, y: 260, w: 620, h: 160, fragmentKind: "alt", fragmentOperands: ["[data disponível]", "[else]"] },
                      { type: "fragment", label: "loop", x: 590, y: 420, w: 620, h: 120, fragmentKind: "loop", fragmentOperands: ["[para cada turma]"] },
                    ],
                    links: [
                      { fromLabel: "Gestor", toLabel: "Calendário", kind: "message", label: "agendarComunicado()", y: 200 },
                      { fromLabel: "Calendário", toLabel: "Gestor", kind: "return", label: "confirmarAgenda()", y: 230 },
                      { fromLabel: "Calendário", toLabel: "Aluno", kind: "async", label: "notificar()", y: 270 },
                      { fromLabel: "Aluno", toLabel: "Calendário", kind: "return", label: "ack()", y: 300 },
                      { fromLabel: "Calendário", toLabel: "Aluno", kind: "async", label: "notificar()", y: 420 },
                      { fromLabel: "Aluno", toLabel: "Calendário", kind: "return", label: "ack()", y: 450 },
                      { fromLabel: "Calendário", toLabel: "Gestor", kind: "return", label: "confirmado()", y: 480 },
                    ],
                  })}
                >Figura 17 – Gerenciar comunicados</button>

                <button
                  className="px-3 py-1.5 bg-sky-600 text-white rounded hover:bg-sky-700 text-sm"
                  onClick={() => addTemplate({
                    name: "Figura 18 – Sequência: Publicar material",
                    nodes: [
                      { type: "lifeline", label: "Professor", x: 320, y: 90 },
                      { type: "lifeline", label: "Materiais", x: 520, y: 90 },
                      { type: "lifeline", label: "Aluno", x: 720, y: 90 },
                      { type: "fragment", label: "opt", x: 590, y: 260, w: 620, h: 160, fragmentKind: "opt", fragmentOperands: ["[revisão pelo coordenador]"] },
                      { type: "fragment", label: "alt", x: 590, y: 410, w: 620, h: 120, fragmentKind: "alt", fragmentOperands: ["[canal preferido]", "[else]"] },
                    ],
                    links: [
                      { fromLabel: "Professor", toLabel: "Materiais", kind: "message", label: "publicarMaterial()", y: 200 },
                      { fromLabel: "Professor", toLabel: "Materiais", kind: "message", label: "enviarParaRevisao()", y: 260 },
                      { fromLabel: "Materiais", toLabel: "Professor", kind: "return", label: "revisado()", y: 290 },
                      { fromLabel: "Materiais", toLabel: "Aluno", kind: "async", label: "notificarMaterial()", y: 410 },
                      { fromLabel: "Aluno", toLabel: "Materiais", kind: "return", label: "ack()", y: 440 },
                    ],
                  })}
                >Figura 18 – Publicar material</button>

                <button
                  className="px-3 py-1.5 bg-amber-600 text-white rounded hover:bg-amber-700 text-sm"
                  onClick={() => addTemplate({
                    name: "Figura 19 – Sequência: Lançar atividade",
                    nodes: [
                      { type: "lifeline", label: "Professor", x: 320, y: 90 },
                      { type: "lifeline", label: "Sistema", x: 520, y: 90 },
                      { type: "lifeline", label: "Aluno", x: 720, y: 90 },
                      { type: "fragment", label: "loop", x: 590, y: 410, w: 620, h: 120, fragmentKind: "loop", fragmentOperands: ["[para cada aluno]"] },
                    ],
                    links: [
                      { fromLabel: "Professor", toLabel: "Sistema", kind: "message", label: "criarAtividade()", y: 200 },
                      { fromLabel: "Sistema", toLabel: "Professor", kind: "return", label: "criado()", y: 230 },
                      { fromLabel: "Sistema", toLabel: "Aluno", kind: "async", label: "disponibilizar()", y: 260 },
                      { fromLabel: "Aluno", toLabel: "Sistema", kind: "return", label: "aberto()", y: 290 },
                      { fromLabel: "Sistema", toLabel: "Aluno", kind: "async", label: "notificar()", y: 410 },
                      { fromLabel: "Aluno", toLabel: "Sistema", kind: "return", label: "recebido()", y: 440 },
                    ],
                  })}
                >Figura 19 – Lançar atividade</button>

                <button
                  className="px-3 py-1.5 bg-teal-600 text-white rounded hover:bg-teal-700 text-sm"
                  onClick={() => addTemplate({
                    name: "Figura 20 – Sequência: Realizar atividades",
                    nodes: [
                      { type: "lifeline", label: "Aluno", x: 300, y: 90 },
                      { type: "lifeline", label: "Sistema", x: 520, y: 90 },
                      { type: "lifeline", label: "Professor", x: 740, y: 90 },
                      { type: "fragment", label: "alt", x: 590, y: 320, w: 620, h: 160, fragmentKind: "alt", fragmentOperands: ["[prazo válido]", "[else]"] },
                    ],
                    links: [
                      { fromLabel: "Aluno", toLabel: "Sistema", kind: "message", label: "obterAtividade()", y: 200 },
                      { fromLabel: "Aluno", toLabel: "Sistema", kind: "message", label: "enviarRespostas()", y: 230 },
                      { fromLabel: "Sistema", toLabel: "Professor", kind: "message", label: "notificarRespostas()", y: 260 },
                      { fromLabel: "Professor", toLabel: "Sistema", kind: "message", label: "corrigir()", y: 290 },
                      { fromLabel: "Sistema", toLabel: "Aluno", kind: "message", label: "publicarResultado()", y: 320 },
                      { fromLabel: "Sistema", toLabel: "Aluno", kind: "message", label: "solicitarReenvio()", y: 360 },
                      { fromLabel: "Aluno", toLabel: "Sistema", kind: "return", label: "justificativa()", y: 390 },
                    ],
                  })}
                >Figura 20 – Realizar atividades</button>

                <button
                  className="px-3 py-1.5 bg-rose-600 text-white rounded hover:bg-rose-700 text-sm"
                  onClick={() => addTemplate({
                    name: "Figura 21 – Sequência: Lançar notas de provas",
                    nodes: [
                      { type: "lifeline", label: "Professor", x: 320, y: 90 },
                      { type: "lifeline", label: "Sistema", x: 520, y: 90 },
                      { type: "lifeline", label: "Aluno", x: 720, y: 90 },
                      { type: "fragment", label: "opt", x: 590, y: 380, w: 620, h: 120, fragmentKind: "opt", fragmentOperands: ["[ajustes manuais]"] },
                    ],
                    links: [
                      { fromLabel: "Professor", toLabel: "Sistema", kind: "message", label: "registrarNotas()", y: 200 },
                      { fromLabel: "Sistema", toLabel: "Professor", kind: "return", label: "validacaoOk()", y: 230 },
                      { fromLabel: "Sistema", toLabel: "Aluno", kind: "message", label: "disponibilizarNotas()", y: 260 },
                      { fromLabel: "Professor", toLabel: "Sistema", kind: "message", label: "ajustarNotas()", y: 380 },
                      { fromLabel: "Sistema", toLabel: "Aluno", kind: "message", label: "republicarNotas()", y: 410 },
                    ],
                  })}
                >Figura 21 – Lançar notas</button>

                <button
                  className="px-3 py-1.5 bg-violet-600 text-white rounded hover:bg-violet-700 text-sm"
                  onClick={() => addTemplate({
                    name: "Figura 22 – Sequência: Consultar assistente de IA",
                    nodes: [
                      { type: "lifeline", label: "Professor", x: 360, y: 90 },
                      { type: "lifeline", label: "Assistente de IA", x: 580, y: 90 },
                      { type: "fragment", label: "loop", x: 590, y: 260, w: 620, h: 140, fragmentKind: "loop", fragmentOperands: ["[refinar pergunta]"] },
                      { type: "fragment", label: "alt", x: 590, y: 440, w: 620, h: 120, fragmentKind: "alt", fragmentOperands: ["[modelo indisponível]", "[else]"] },
                    ],
                    links: [
                      { fromLabel: "Professor", toLabel: "Assistente de IA", kind: "message", label: "perguntar()", y: 200 },
                      { fromLabel: "Assistente de IA", toLabel: "Professor", kind: "return", label: "responder()", y: 230 },
                      { fromLabel: "Professor", toLabel: "Assistente de IA", kind: "message", label: "refinarPergunta()", y: 260 },
                      { fromLabel: "Assistente de IA", toLabel: "Professor", kind: "return", label: "novaResposta()", y: 290 },
                      { fromLabel: "Assistente de IA", toLabel: "Professor", kind: "return", label: "erroModel()", y: 440 },
                      { fromLabel: "Professor", toLabel: "Assistente de IA", kind: "message", label: "tentarFallback()", y: 470 },
                      { fromLabel: "Assistente de IA", toLabel: "Professor", kind: "return", label: "respostaFallback()", y: 500 },
                    ],
                  })}
                >Figura 22 – Assistente de IA</button>
              </>
              )}
            </div>
          </div>

          <div className="pt-3 space-y-2">
            <h3 className="text-xs font-semibold text-slate-700">{diagramMode === "sequence" ? "Criar mensagem" : "Criar fluxo"}</h3>
            <div className="flex items-center gap-2">
              <select className="border rounded px-2 py-1 text-sm" value={newLinkFrom} onChange={(e) => setNewLinkFrom(e.target.value)}>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>{n.label}</option>
                ))}
              </select>
              <span className="text-xs text-slate-600">→</span>
              <select className="border rounded px-2 py-1 text-sm" value={newLinkTo} onChange={(e) => setNewLinkTo(e.target.value)}>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>{n.label}</option>
                ))}
              </select>
              {diagramMode === "sequence" ? (
                <select className="border rounded px-2 py-1 text-sm" value={newLinkKind} onChange={(e) => setNewLinkKind(e.target.value as LinkKind)}>
                  <option value="message">Mensagem (síncrona)</option>
                  <option value="async">Mensagem (assíncrona)</option>
                  <option value="return">Retorno</option>
                </select>
              ) : (
                <select className="border rounded px-2 py-1 text-sm" value={newLinkKind} onChange={(e) => setNewLinkKind(e.target.value as LinkKind)}>
                  <option value="flow">Fluxo</option>
                  <option value="include">include</option>
                  <option value="extends">extends</option>
                </select>
              )}
              {(newLinkKind === "include" || newLinkKind === "extends") && (
                <input
                  className="border rounded px-2 py-1 text-sm"
                  placeholder="rótulo opcional"
                  value={newLinkLabel}
                  onChange={(e) => setNewLinkLabel(e.target.value)}
                />
              )}
              {(diagramMode === "sequence" && (newLinkKind === "message" || newLinkKind === "return" || newLinkKind === "async")) && (
                <input
                  className="border rounded px-2 py-1 text-sm"
                  placeholder="opcional: operação()"
                  value={newLinkLabel}
                  onChange={(e) => setNewLinkLabel(e.target.value)}
                />
              )}
              <button onClick={createLink} className="px-2 py-1 bg-green-600 text-white rounded text-sm">Criar</button>
            </div>
            {diagramMode === "sequence" && (
              <div className="flex items-center gap-2 pt-2">
                <select className="border rounded px-2 py-1 text-sm" value={fragmentUiKind} onChange={(e) => setFragmentUiKind(e.target.value as any)}>
                  <option value="alt">alt</option>
                  <option value="opt">opt</option>
                  <option value="loop">loop</option>
                </select>
                <input className="border rounded px-2 py-1 text-sm" placeholder="guarda: [condição]" value={fragmentUiGuard} onChange={(e) => setFragmentUiGuard(e.target.value)} />
                <button
                  onClick={() => {
                    const id = nextId("frag");
                    const label = `${fragmentUiKind}${fragmentUiGuard ? ` [${fragmentUiGuard}]` : ''}`;
                    setNodes((prev) => ([...prev, { id, type: "fragment", label, x: 640, y: 320, w: 980, h: 240, fragmentKind: fragmentUiKind }]));
                  }}
                  className="px-2 py-1 bg-indigo-600 text-white rounded text-sm"
                >Adicionar fragmento</button>
              </div>
            )}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  setSelectedId(null);
                  setNodes(diagramMode === "sequence"
                    ? [
                        { id: "ll-1", type: "lifeline", label: "Usuário", x: 320, y: 100 },
                        { id: "ll-2", type: "lifeline", label: "Sistema", x: 560, y: 100 },
                      ]
                    : [
                        { id: "start-1", type: "start", label: "Inicial", x: 120, y: 180 },
                      ]
                  );
                  setLinks([]);
                  setNewLinkKind(diagramMode === "sequence" ? "message" : "flow");
                }}
                className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-sm hover:bg-slate-300"
              >
                Limpar
              </button>
              <button
                onClick={undo}
                className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-sm hover:bg-slate-300"
              >
                Undo
              </button>
              <button
                onClick={redo}
                className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-sm hover:bg-slate-300"
              >
                Redo
              </button>
              <button
                onClick={() => {
                  if (!selectedId) return;
                  setNodes((prev) => prev.filter((n) => n.id !== selectedId));
                  setLinks((prev) => prev.filter((l) => l.from !== selectedId && l.to !== selectedId));
                  setSelectedId(null);
                }}
                className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Excluir selecionado
              </button>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div ref={diagramRef} className="bg-white border rounded-md p-2 inline-block">
            <svg
              id="usecase-editor-svg"
              width="1200"
              height="720"
              viewBox="0 0 1200 720"
              xmlns="http://www.w3.org/2000/svg"
              onMouseMove={onMouseMoveSvg}
              onMouseUp={onMouseUpSvg}
            >
              <rect x="0" y="0" width="1200" height="720" fill="#ffffff" />
              {/* Grid */}
              {Array.from({ length: Math.floor(1200 / gridSize) }).map((_, i) => (
                <line key={`gx-${i}`} x1={i * gridSize} y1={0} x2={i * gridSize} y2={720} stroke="#e5e7eb" strokeWidth={i % 10 === 0 ? 1.2 : 0.6} />
              ))}
              {Array.from({ length: Math.floor(720 / gridSize) }).map((_, i) => (
                <line key={`gy-${i}`} x1={0} y1={i * gridSize} x2={1200} y2={i * gridSize} stroke="#e5e7eb" strokeWidth={i % 10 === 0 ? 1.2 : 0.6} />
              ))}

              {/* Fronteira do sistema */}
              <rect x="140" y="40" width="1000" height="620" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" rx="8" />
              <text x="640" y="68" textAnchor="middle" fontSize="16" fill="#0f172a" fontWeight={600}>{diagramMode === "sequence" ? "Diagrama de Sequência" : "Fluxo de Atividades"}</text>

              {/* Fragmentos (fundo) para não cobrir ações/links */}
              {diagramMode === "sequence" && nodes.filter((n) => n.type === "fragment").map((n) => {
                // Largura dinâmica pela distância entre lifelines, com margem mais justa
                const llXs = nodes.filter((m) => m.type === "lifeline").map((m) => m.x);
                const minX = llXs.length ? Math.min(...llXs) : 320;
                const maxX = llXs.length ? Math.max(...llXs) : 880;
                const dynamicW = Math.min(980, (maxX - minX) + 220); // margem mais curtas
                const w = dynamicW; const h = n.h ?? 240; const headerH = 22;
                const x0 = n.x - w/2; const yTop = n.y - h/2;
                const contentMaxY = Math.max(
                  yTop,
                  ...links
                    .filter((l) => (l.kind === "message" || l.kind === "async" || l.kind === "return"))
                    .map((l) => l.y ?? 200)
                    .filter((yy) => yy >= yTop && yy <= yTop + h)
                );
                const calcH = Math.max(h, (contentMaxY - yTop) + 36);
                const y0 = yTop; // expande para baixo mantendo o topo
                const ops = (n.fragmentOperands ?? []).length > 0 ? (n.fragmentOperands as string[]) : (n.fragmentKind === "alt" ? ["[condição]", "[else]"] : n.fragmentKind === "opt" ? ["[condição]"] : n.fragmentKind === "loop" ? ["[condição]"] : []);
                return (
                  <g key={n.id} onMouseDown={(e) => onMouseDownNode(n.id, e)} cursor="move">
                    <rect x={x0} y={y0} width={w} height={calcH} rx={6} fill="#f8fafc" stroke="#0f172a" strokeWidth={2} />
                    <rect x={x0 + 8} y={y0 + 8} width={110} height={headerH} rx={4} fill="#e2e8f0" stroke="#0f172a" strokeWidth={2} />
                    <text x={x0 + 14} y={y0 + 8 + 14} textAnchor="start" fontSize={12} fill="#0f172a" fontWeight={600}>{n.fragmentKind ?? n.label}</text>
                    {ops.length > 1 && Array.from({ length: ops.length - 1 }).map((_, i) => (
                      <line key={`frag-div-${i}`} x1={x0 + 8} y1={y0 + headerH + 24 + (i + 1) * ((calcH - headerH - 32) / ops.length)} x2={x0 + w - 8} y2={y0 + headerH + 24 + (i + 1) * ((calcH - headerH - 32) / ops.length)} stroke="#0f172a" strokeWidth={1.5} />
                    ))}
                    {ops.map((op, idx) => (
                      <text key={`frag-op-${idx}`} x={x0 + 16} y={y0 + headerH + 20 + idx * ((calcH - headerH - 32) / ops.length)} textAnchor="start" fontSize={12} fill="#334155" fontStyle="italic">{op}</text>
                    ))}
                    {selectedId === n.id && (
                      <rect x={x0 - 6} y={y0 - 6} width={w + 12} height={calcH + 12} rx={8} fill="none" stroke="#22c55e" strokeWidth={2} />
                    )}
                  </g>
                );
              })}

              {/* Ligações */}
              {links.map((l) => {
                const from = nodes.find((n) => n.id === l.from);
                const to = nodes.find((n) => n.id === l.to);
                if (!from || !to) return null;
                let fx = from.x;
                let tx = to.x;
                let fy = from.y;
                let ty = to.y;
                let marker = "url(#arrow)";
                let dashed: string | undefined = undefined;
                if (diagramMode === "sequence" && (l.kind === "message" || l.kind === "async" || l.kind === "return")) {
                  const msgY = l.y ?? 200;
                  fy = msgY;
                  ty = msgY;
                  if (l.kind === "return") {
                    dashed = "6 4";
                  }
                  if (l.kind === "async") {
                    marker = "url(#arrow-open)";
                  }
                } else if (l.kind === "include" || l.kind === "extends") {
                  dashed = "6 4";
                }
                const midx = (fx + tx) / 2;
                const midy = (fy + ty) / 2;
                // Ordem visual das mensagens (badge), baseada em Y
                let seqBadge: number | null = null;
                if (diagramMode === "sequence" && (l.kind === "message" || l.kind === "async" || l.kind === "return")) {
                  const ordered = links
                    .filter((m) => m.kind === "message" || m.kind === "async" || m.kind === "return")
                    .slice()
                    .sort((a, b) => (a.y ?? 0) - (b.y ?? 0));
                  const idx = ordered.findIndex((m) => m.id === l.id);
                  if (idx >= 0) seqBadge = idx + 1;
                }
                return (
                  <g key={l.id}>
                    <line
                      x1={fx} y1={fy} x2={tx} y2={ty}
                      stroke="#334155" strokeWidth="2" markerEnd={marker}
                      strokeDasharray={dashed}
                    />
                    {l.label && (
                      <text x={midx} y={midy - 6} textAnchor="middle" fontSize="12" fill="#334155">{l.label}</text>
                    )}
                    {seqBadge && !(l.label || "").match(/^\s*\d+\./) && (
                      <g>
                        <rect x={midx - 10} y={midy - 22} width={20} height={16} rx={6} fill="#e2e8f0" stroke="#334155" strokeWidth={1}/>
                        <text x={midx} y={midy - 10} textAnchor="middle" fontSize="11" fill="#0f172a" fontWeight={600}>{seqBadge}</text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Nós */}
              {nodes.map((n) => {
                // Evita re-renderizar fragmentos aqui: já foram desenhados no fundo acima
                if (n.type === "fragment") return null;
                if (n.type === "actor") {
                  return (
                    <g key={n.id} onMouseDown={(e) => onMouseDownNode(n.id, e)} cursor="move">
                      <circle cx={n.x} cy={n.y - 40} r="16" fill="#ffffff" stroke="#1e293b" strokeWidth="2" />
                      <line x1={n.x} y1={n.y - 24} x2={n.x} y2={n.y + 18} stroke="#1e293b" strokeWidth="2" />
                      <line x1={n.x - 20} y1={n.y - 10} x2={n.x + 20} y2={n.y - 10} stroke="#1e293b" strokeWidth="2" />
                      <line x1={n.x} y1={n.y + 18} x2={n.x - 14} y2={n.y + 40} stroke="#1e293b" strokeWidth="2" />
                      <line x1={n.x} y1={n.y + 18} x2={n.x + 14} y2={n.y + 40} stroke="#1e293b" strokeWidth="2" />
                      {selectedId === n.id && (
                        <circle cx={n.x} cy={n.y - 40} r="20" fill="none" stroke="#22c55e" strokeWidth="2" />
                      )}
                      <text x={n.x} y={n.y + 60} textAnchor="middle" fontSize="12" fill="#0f172a">{n.label}</text>
                    </g>
                  );
                }
                if (n.type === "usecase") {
                  return (
                    <g key={n.id} onMouseDown={(e) => onMouseDownNode(n.id, e)} cursor="move">
                      <ellipse cx={n.x} cy={n.y} rx="130" ry="32" fill="#e2e8f0" stroke="#1e293b" strokeWidth="2" />
                      {selectedId === n.id && (
                        <ellipse cx={n.x} cy={n.y} rx="136" ry="38" fill="none" stroke="#22c55e" strokeWidth="2" />
                      )}
                      <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="13" fill="#0f172a" fontWeight={600}>{n.label}</text>
                    </g>
                  );
                }
                if (n.type === "lifeline") {
                  const headW = n.w ?? 200; const headH = n.h ?? 48;
                  // Barras de ativação com abertura no recebimento e fechamento no retorno
                  const incoming = links.filter((l) => (l.kind === "message" || l.kind === "async") && l.to === n.id).slice().sort((a,b) => (a.y ?? 0) - (b.y ?? 0));
                  const outgoingReturns = links.filter((l) => l.kind === "return" && l.from === n.id).slice().sort((a,b) => (a.y ?? 0) - (b.y ?? 0));
                  const usedReturns: Set<string> = new Set();
                  const bars: Array<{ y: number; h: number }> = [];
                  // Desenha barra de ativação apenas se houver retorno correspondente
                  incoming.forEach((msg) => {
                    const startY = (msg.y ?? 200) - 12;
                    const ret = outgoingReturns.find((r) => !usedReturns.has(r.id) && (r.y ?? 0) >= (msg.y ?? 0));
                    if (!ret) return; // Sem retorno explícito, não desenha barra curta
                    usedReturns.add(ret.id);
                    const endY = (ret.y ?? (startY + 28)) + 12;
                    const height = Math.max(28, endY - startY);
                    if (height >= 28) bars.push({ y: startY, h: height });
                  });
                  return (
                    <g key={n.id} onMouseDown={(e) => onMouseDownNode(n.id, e)} cursor="move">
                      <rect x={n.x - headW/2} y={n.y - headH/2} width={headW} height={headH} rx={10} fill="#e2e8f0" stroke="#1e293b" strokeWidth="2" />
                      <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="13" fill="#0f172a" fontWeight={600}>{n.label}</text>
                      <line x1={n.x} y1={n.y + headH} x2={n.x} y2={640} stroke="#64748b" strokeDasharray="6 4" />
                      {selectedId === n.id && (
                        <rect x={n.x - headW/2 - 6} y={n.y - headH/2 - 6} width={headW + 12} height={headH + 12} rx={12} fill="none" stroke="#22c55e" strokeWidth="2" />
                      )}
                      {/* Barras de ativação reais (abertas em msg/async, fechadas em return) */}
                      {diagramMode === "sequence" && bars.map((b, i) => (
                        <rect key={`act-${n.id}-${i}`} x={n.x - 4} y={b.y} width={8} height={b.h} fill="#1e293b" />
                      ))}
                    </g>
                  );
                }
                // Fragmentos já desenhados no fundo acima
                if (n.type === "start") {
                  return (
                    <g key={n.id} onMouseDown={(e) => onMouseDownNode(n.id, e)} cursor="move">
                      <circle cx={n.x} cy={n.y} r="10" fill="#0f172a" stroke="#0f172a" strokeWidth="2" />
                      {selectedId === n.id && (
                        <circle cx={n.x} cy={n.y} r="14" fill="none" stroke="#22c55e" strokeWidth="2" />
                      )}
                      <text x={n.x} y={n.y + 24} textAnchor="middle" fontSize="12" fill="#0f172a">{n.label}</text>
                    </g>
                  );
                }
                if (n.type === "end") {
                  return (
                    <g key={n.id} onMouseDown={(e) => onMouseDownNode(n.id, e)} cursor="move">
                      <circle cx={n.x} cy={n.y} r="10" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
                      <circle cx={n.x} cy={n.y} r="6" fill="#0f172a" />
                      {selectedId === n.id && (
                        <circle cx={n.x} cy={n.y} r="14" fill="none" stroke="#22c55e" strokeWidth="2" />
                      )}
                      <text x={n.x} y={n.y + 24} textAnchor="middle" fontSize="12" fill="#0f172a">{n.label}</text>
                    </g>
                  );
                }
                if (n.type === "action") {
                  // Oculta qualquer ação dentro de fragmentos no modo de sequência,
                  // evitando a caixa central que tampa conteúdo.
                  if (diagramMode === "sequence") {
                    const fragments = nodes.filter((m) => m.type === "fragment");
                    const insideAny = fragments.some((f) => {
                      const llXs = nodes.filter((m) => m.type === "lifeline").map((m) => m.x);
                      const minX = llXs.length ? Math.min(...llXs) : 320;
                      const maxX = llXs.length ? Math.max(...llXs) : 880;
                      const dynamicW = Math.min(980, (maxX - minX) + 220);
                      const w = dynamicW; const baseH = f.h ?? 240; const headerH = 22;
                      const yTop = f.y - baseH/2;
                      const contentMaxY = Math.max(
                        yTop,
                        ...links
                          .filter((l) => (l.kind === "message" || l.kind === "async" || l.kind === "return"))
                          .map((l) => l.y ?? 200)
                          .filter((yy) => yy >= yTop && yy <= yTop + baseH)
                      );
                      const calcH = Math.max(baseH, (contentMaxY - yTop) + 36);
                      const x0 = f.x - w/2; const y0 = yTop; const y1 = y0 + calcH;
                      return n.x >= x0 && n.x <= x0 + w && n.y >= y0 && n.y <= y1;
                    });
                    if (insideAny) return null;
                  }
                  const boxW = n.w ?? 240; const boxH = n.h ?? 52;
                  return (
                    <g key={n.id} onMouseDown={(e) => onMouseDownNode(n.id, e)} cursor="move">
                      <rect x={n.x - boxW/2} y={n.y - boxH/2} width={boxW} height={boxH} rx={16} fill="#e2e8f0" stroke="#1e293b" strokeWidth="2" />
                      {selectedId === n.id && (
                        <rect x={n.x - boxW/2 - 6} y={n.y - boxH/2 - 6} width={boxW + 12} height={boxH + 12} rx={18} fill="none" stroke="#22c55e" strokeWidth="2" />
                      )}
                      <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="13" fill="#0f172a" fontWeight={600}>{n.label}</text>
                    </g>
                  );
                }
                if (n.type === "decision") {
                  return (
                    <g key={n.id} onMouseDown={(e) => onMouseDownNode(n.id, e)} cursor="move">
                      <polygon points={`${n.x - 30},${n.y} ${n.x},${n.y - 30} ${n.x + 30},${n.y} ${n.x},${n.y + 30}`} fill="#fefce8" stroke="#1e293b" strokeWidth="2" />
                      {selectedId === n.id && (
                        <polygon points={`${n.x - 36},${n.y} ${n.x},${n.y - 36} ${n.x + 36},${n.y} ${n.x},${n.y + 36}`} fill="none" stroke="#22c55e" strokeWidth="2" />
                      )}
                      <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="12" fill="#0f172a" fontWeight={600}>{n.label}</text>
                    </g>
                  );
                }
                if (n.type === "bar") {
                  return (
                    <g key={n.id} onMouseDown={(e) => onMouseDownNode(n.id, e)} cursor="move">
                      <rect x={n.x - 70} y={n.y - 4} width="140" height="8" fill="#334155" />
                      {selectedId === n.id && (
                        <rect x={n.x - 76} y={n.y - 10} width="152" height="20" fill="none" stroke="#22c55e" strokeWidth="2" />
                      )}
                    </g>
                  );
                }
                return (
                  <g key={n.id} onMouseDown={(e) => onMouseDownNode(n.id, e)} cursor="move">
                    <rect x={n.x - 90} y={n.y - 24} width="180" height="48" rx="8" fill="#f1f5f9" stroke="#1e293b" strokeWidth="2" />
                    {selectedId === n.id && (
                      <rect x={n.x - 96} y={n.y - 30} width="192" height="60" rx="10" fill="none" stroke="#22c55e" strokeWidth="2" />
                    )}
                    <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="13" fill="#0f172a" fontWeight={600}>{n.label}</text>
                  </g>
                );
              })}

              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
                </marker>
                <marker id="arrow-open" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 5 L 8 9" fill="none" stroke="#64748b" strokeWidth="2" />
                  <path d="M 0 5 L 8 1" fill="none" stroke="#64748b" strokeWidth="2" />
                </marker>
              </defs>
            </svg>
          </div>
        </div>

        {/* Lista de edição rápida */}
        <div className="md:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-700">Casos de uso</h3>
              {nodes.filter((n) => n.type === "usecase").map((n) => (
                <div key={n.id} className="flex items-center gap-2">
                  <input className="flex-1 border rounded px-2 py-1 text-sm" value={n.label} onChange={(e) => updateNodeLabel(n.id, e.target.value)} />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-700">Entidades</h3>
              {nodes.filter((n) => n.type === "entity").map((n) => (
                <div key={n.id} className="flex items-center gap-2">
                  <input className="flex-1 border rounded px-2 py-1 text-sm" value={n.label} onChange={(e) => updateNodeLabel(n.id, e.target.value)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-500">Fonte: Elaborado pelos autores.</div>
    </div>
  );
}