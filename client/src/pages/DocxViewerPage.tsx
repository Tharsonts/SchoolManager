import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function DocxViewerPage() {
  const { fileId } = useParams<{ fileId: string }>();
  const [, navigate] = useLocation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!fileId) return;
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch(`/api/activities/files/${fileId}/view`, {
          credentials: 'include'
        });
        if (!resp.ok) throw new Error('Falha ao baixar arquivo');
        const blob = await resp.blob();

        // Primeira tentativa: usar mammoth para converter DOCX -> HTML
        try {
          const mammoth = await import('https://esm.sh/mammoth@1.6.0');
          const arrayBuffer = await blob.arrayBuffer();
          const result: any = await (mammoth as any).convertToHtml({ arrayBuffer });
          if (containerRef.current) {
            containerRef.current.innerHTML = `<div class="prose max-w-none">${result.value}</div>`;
            setLoading(false);
            return;
          }
        } catch (merr) {
          // Se mammoth falhar, tenta docx-preview como fallback
          try {
            const docx = await import('https://esm.sh/docx-preview@0.3.1');
            const { renderAsync } = docx as any;
            if (!containerRef.current) return;
            containerRef.current.innerHTML = '';
            await renderAsync(blob, containerRef.current, {
              className: 'docx-view',
              inWrapper: true,
              ignoreWidth: false,
              ignoreHeight: false,
              breakPages: true,
            });
            setLoading(false);
            return;
          } catch (perr) {
            throw perr;
          }
        }
      } catch (e: any) {
        setError(e?.message || 'Não foi possível abrir o documento.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fileId]);

  return (
    <div className="p-4 space-y-4">
      <Button
        variant="outline"
        onClick={() => {
          if (window.history.length > 1) {
            window.history.back();
          } else {
            navigate('/student/activities');
          }
        }}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      {loading && (
        <div className="flex items-center text-gray-600">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Carregando documento...
        </div>
      )}
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}
      <div ref={containerRef} className="bg-white rounded-md shadow p-4 overflow-auto" />
    </div>
  );
}


