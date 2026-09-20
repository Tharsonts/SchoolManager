import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, BookOpen, CheckCircle2, Copy, Cpu, Download, Lightbulb, PenTool, Send, ShieldCheck, Target, Trash2, User, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { askLocalTeacherAI, loadLocalTeacherAI, LOCAL_AI_VRAM_MB, supportsLocalAI, unloadLocalTeacherAI, type LocalAIProgress } from "@/lib/localTeacherAI";

type Message = { id: string; role: "user" | "assistant"; content: string; timestamp: Date };
type TeacherAIChatProps = { isOpen: boolean; onClose: () => void };

const quickSuggestions = [
  { icon: Lightbulb, text: "Atividade criativa", prompt: "Crie uma atividade prática para ensinar frações ao 5º ano, com materiais simples e duração de 40 minutos." },
  { icon: BookOpen, text: "Plano de aula", prompt: "Monte um plano de aula sobre sistema solar para alunos de 8 a 10 anos, com objetivos, etapas e avaliação." },
  { icon: PenTool, text: "Exercícios com gabarito", prompt: "Crie cinco exercícios progressivos de interpretação de texto e apresente o gabarito separado." },
  { icon: Target, text: "Métodos de avaliação", prompt: "Sugira uma avaliação formativa para uma aula sobre meio ambiente e explique os critérios." },
];

function CodeBlock({ children }: { children: React.ReactNode }) {
  const text = String(children).replace(/\n$/, "");
  const [copied, setCopied] = useState(false);
  return <div className="group relative my-4 overflow-hidden rounded-lg bg-slate-950 text-slate-100">
    <Button type="button" size="sm" variant="ghost" className="absolute right-2 top-2 h-8 bg-slate-800 text-xs text-white hover:bg-slate-700" onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}><Copy className="mr-1 h-3.5 w-3.5" />{copied ? "Copiado" : "Copiar"}</Button>
    <pre className="overflow-x-auto p-4 pr-24 text-sm"><code>{text}</code></pre>
  </div>;
}

const markdownComponents = {
  h1: ({ children }: any) => <h1 className="mb-3 text-xl font-bold text-slate-900">{children}</h1>,
  h2: ({ children }: any) => <h2 className="mb-2 text-lg font-semibold text-slate-900">{children}</h2>,
  h3: ({ children }: any) => <h3 className="mb-2 font-semibold text-slate-800">{children}</h3>,
  p: ({ children }: any) => <p className="mb-3 leading-relaxed text-slate-700">{children}</p>,
  ul: ({ children }: any) => <ul className="mb-3 list-disc space-y-1 pl-5 text-slate-700">{children}</ul>,
  ol: ({ children }: any) => <ol className="mb-3 list-decimal space-y-1 pl-5 text-slate-700">{children}</ol>,
  pre: ({ children }: any) => <CodeBlock>{children?.props?.children ?? children}</CodeBlock>,
  code: ({ children, className }: any) => className ? <code className={className}>{children}</code> : <code className="rounded bg-slate-200 px-1 py-0.5 text-sm">{children}</code>,
  blockquote: ({ children }: any) => <blockquote className="my-3 border-l-4 border-blue-500 bg-blue-50 py-2 pl-4 italic text-slate-700">{children}</blockquote>,
};

function welcome(firstName?: string) {
  return `# Olá${firstName ? `, ${firstName}` : ""}! 👋

Sou um **assistente pedagógico local**. Posso ajudar com planos de aula, explicações, atividades, exercícios, avaliações, inclusão e gestão de sala.

O modelo é executado no seu navegador: as perguntas não são enviadas para uma API externa. Para proteger os estudantes, não informe nomes, documentos, diagnósticos ou outros dados pessoais.`;
}

export default function TeacherAIChat({ isOpen, onClose }: TeacherAIChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);
  const [modelError, setModelError] = useState("");
  const [modelProgress, setModelProgress] = useState<LocalAIProgress>({ progress: 0, text: "" });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const webGPUAvailable = useMemo(() => supportsLocalAI(), []);

  useEffect(() => {
    if (!isOpen || messages.length > 0) return;
    setMessages([{ id: "welcome", role: "assistant", content: welcome(user?.firstName), timestamp: new Date() }]);
  }, [isOpen, messages.length, user?.firstName]);
  // Sempre retorne undefined no efeito. Alguns navegadores/polyfills retornam um
  // objeto em scrollIntoView, que o React interpreta incorretamente como cleanup.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  useEffect(() => { if (isOpen) inputRef.current?.focus(); }, [isOpen]);

  const prepareModel = async () => {
    setModelError("");
    try {
      await loadLocalTeacherAI(setModelProgress);
      setIsModelReady(true);
      setModelProgress({ progress: 1, text: "Modelo pronto para uso local." });
    } catch (error) {
      setModelError(error instanceof Error ? error.message : "Não foi possível carregar o modelo local.");
    }
  };

  const sendMessage = async (text = inputMessage) => {
    const cleanText = text.trim();
    if (!cleanText || isGenerating || !isModelReady) return;
    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: cleanText, timestamp: new Date() };
    const conversation = [...messages.filter((item) => item.id !== "welcome"), userMessage].map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, userMessage]);
    setInputMessage("");
    const assistantId = crypto.randomUUID();
    setIsGenerating(true);
    setModelError("");
    try {
      setMessages((current) => [...current, { id: assistantId, role: "assistant", content: "", timestamp: new Date() }]);
      const response = await askLocalTeacherAI(conversation, setModelProgress, (visibleText) => {
        setMessages((current) => current.map((item) => item.id === assistantId ? { ...item, content: visibleText } : item));
      });
      setMessages((current) => current.map((item) => item.id === assistantId ? { ...item, content: response } : item));
    } catch (error) {
      setModelError(error instanceof Error ? error.message : "Não foi possível gerar a resposta.");
    } finally {
      setIsGenerating(false);
    }
  };

  const clearChat = () => {
    setMessages([{ id: crypto.randomUUID(), role: "assistant", content: welcome(user?.firstName), timestamp: new Date() }]);
    setModelError("");
  };

  const closeAndUnload = async () => {
    setIsGenerating(false);
    await unloadLocalTeacherAI().catch(() => undefined);
    setIsModelReady(false);
    onClose();
  };

  if (!isOpen) return null;
  const isLoadingModel = modelProgress.progress > 0 && modelProgress.progress < 1 && !modelError;

  return (
    <div className="flex h-full w-full flex-col">
      <Card className="flex h-full w-full flex-col overflow-hidden rounded-none border-0 bg-white shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b bg-gradient-to-r from-blue-700 to-violet-700 text-white">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-white/20 p-3"><Bot className="h-8 w-8" /></div>
            <div><CardTitle className="text-2xl">Assistente Pedagógico Local</CardTitle><p className="text-sm text-blue-100">Processado com privacidade no dispositivo do visitante</p></div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={clearChat} className="text-white hover:bg-white/20" title="Apagar histórico da conversa"><Trash2 className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" onClick={closeAndUnload} className="text-white hover:bg-white/20" title="Fechar e descarregar o modelo da memória"><X className="h-5 w-5" /></Button>
          </div>
        </CardHeader>

        <div className="grid gap-3 border-b bg-slate-50 px-5 py-4 md:grid-cols-3">
          <div className="flex items-center gap-2 text-sm"><ShieldCheck className="h-4 w-4 text-emerald-600" /><span>Sem API key e sem envio de mensagens</span></div>
          <div className="flex items-center gap-2 text-sm"><Cpu className="h-4 w-4 text-blue-600" /><span>WebGPU • ~{(LOCAL_AI_VRAM_MB / 1024).toFixed(1)} GB de memória</span></div>
          <div className="flex items-center gap-2 text-sm"><Download className="h-4 w-4 text-violet-600" /><span>Baixado uma vez e armazenado pelo navegador</span></div>
        </div>

        {!isModelReady && <div className="border-b bg-amber-50 px-5 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div><p className="font-medium text-amber-950">Ative o modelo local antes da primeira pergunta</p><p className="text-sm text-amber-800">O download é grande e pode levar alguns minutos. Recomendado: Chrome ou Edge recente e conexão Wi-Fi.</p></div>
            <Button onClick={prepareModel} disabled={!webGPUAvailable || isLoadingModel}><Download className="mr-2 h-4 w-4" />{isLoadingModel ? "Carregando..." : "Ativar IA local"}</Button>
          </div>
          {!webGPUAvailable && <p className="mt-2 text-sm font-medium text-red-700">WebGPU não está disponível neste navegador.</p>}
          {modelProgress.progress > 0 && <div className="mt-3"><Progress value={modelProgress.progress * 100} /><p className="mt-1 text-xs text-slate-600">{modelProgress.text}</p></div>}
        </div>}
        {modelError && <div className="border-b bg-red-50 px-5 py-3 text-sm text-red-800">{modelError}</div>}

        <CardContent className="flex min-h-0 flex-1 flex-col p-0">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
            {messages.map((message) => <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-violet-600"><Bot className="h-4 w-4 text-white" /></div>}
              <div className={`max-w-[85%] p-3 ${message.role === "user" ? "rounded-xl bg-blue-700 text-white" : "bg-transparent"}`}>
                {message.role === "assistant" ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{message.content}</ReactMarkdown> : <div className="whitespace-pre-wrap">{message.content}</div>}
              </div>
              {message.role === "user" && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-700"><User className="h-4 w-4 text-white" /></div>}
            </div>)}
            {isGenerating && !messages.some((message) => message.role === "assistant" && message.content === "") && <div className="flex items-center gap-2 text-sm text-slate-600"><span className="inline-flex gap-1"><i className="h-2 w-2 animate-bounce rounded-full bg-blue-500" /><i className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:120ms]" /><i className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:240ms]" /></span>Preparando resposta...</div>}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 1 && <div className="grid gap-3 border-t bg-blue-50/60 p-5 md:grid-cols-2">
            {quickSuggestions.map(({ icon: Icon, text, prompt }) => <Button key={text} variant="outline" className="h-auto justify-start p-4 text-left" onClick={() => sendMessage(prompt)} disabled={!isModelReady || isGenerating}><Icon className="mr-2 h-4 w-4 text-blue-700" />{text}</Button>)}
          </div>}

          <div className="border-t bg-white p-5">
            <div className="flex gap-3">
              <Input ref={inputRef} value={inputMessage} onChange={(event) => setInputMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); sendMessage(); } }} placeholder={isModelReady ? "Pergunte sobre planejamento, conteúdo, atividades ou avaliação..." : "Ative a IA local para começar"} disabled={!isModelReady || isGenerating} className="h-12" />
              <Button onClick={() => sendMessage()} disabled={!isModelReady || !inputMessage.trim() || isGenerating} className="h-12 px-6"><Send className="h-5 w-5" /></Button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <Badge variant="outline"><CheckCircle2 className="mr-1 h-3 w-3" />Assistente local ativo</Badge><span>Não informe dados pessoais de estudantes. As respostas podem conter erros e devem ser revisadas pelo professor.</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
