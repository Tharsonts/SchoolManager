export const LOCAL_AI_MODEL = "Qwen3.5-4B-q4f16_1-MLC";
export const LOCAL_AI_VRAM_MB = 3868;

export type LocalAIProgress = { progress: number; text: string };
type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

let enginePromise: Promise<any> | null = null;
let loadedEngine: any | null = null;

export function isMobileAIBlocked() {
  if (typeof navigator === "undefined") return false;
  const agent = navigator.userAgent || "";
  return /Android|iPhone|iPod|Mobile/i.test(agent) ||
    (typeof window !== "undefined" && window.matchMedia("(max-width: 767px) and (pointer: coarse)").matches);
}

export function supportsLocalAI() {
  return !isMobileAIBlocked() && typeof navigator !== "undefined" && "gpu" in navigator;
}

export async function loadLocalTeacherAI(onProgress?: (progress: LocalAIProgress) => void) {
  if (isMobileAIBlocked()) {
    throw new Error("O assistente local está indisponível em celulares. Use um computador para ativá-lo.");
  }
  if (!supportsLocalAI()) {
    throw new Error("Este navegador não oferece WebGPU. Abra a demonstração em uma versão recente do Chrome ou Edge.");
  }

  if (!enginePromise) {
    enginePromise = import("@mlc-ai/web-llm")
      .then(({ CreateMLCEngine }) => CreateMLCEngine(LOCAL_AI_MODEL, {
        initProgressCallback: (report: { progress: number; text: string }) => onProgress?.({
          progress: Math.max(0, Math.min(1, report.progress || 0)),
          text: report.text || "Preparando o modelo local...",
        }),
      })).then((engine) => {
        loadedEngine = engine;
        return engine;
      })
      .catch((error) => {
        enginePromise = null;
        throw error;
      });
  }
  return enginePromise;
}

const EDUCATIONAL_SYSTEM_PROMPT = `Você é o Assistente Pedagógico do SchoolManager, executado localmente no navegador do professor.

Responda sempre em português brasileiro, com linguagem clara, prática e respeitosa. Seu objetivo é apoiar professores em planejamento de aula, explicação de conteúdos escolares, atividades, avaliações, rubricas, feedback, gestão de sala, inclusão, acessibilidade e comunicação pedagógica.

Regras:
1. Mantenha o foco educacional. Para pedidos claramente fora desse contexto, diga brevemente que foi configurado para apoio pedagógico e ofereça ajuda relacionada ao ensino.
2. Não invente fatos, normas ou referências. Quando não souber, diga isso e sugira como verificar.
3. Não solicite nem exponha dados pessoais de alunos. Oriente o usuário a anonimizar nomes, notas, diagnósticos, telefones e documentos.
4. Não tome decisões disciplinares, médicas, psicológicas ou jurídicas. Ofereça orientação geral e recomende apoio profissional quando necessário.
5. Não produza conteúdo perigoso, discriminatório, sexual envolvendo menores, nem instruções de fraude ou violência.
6. Seja conciso por padrão, mas entregue etapas e exemplos quando isso ajudar.
7. Ao criar uma avaliação, inclua objetivo, nível de dificuldade e gabarito separado quando solicitado.
8. Entregue somente a resposta final. Nunca mostre raciocínio interno, análise, rascunho, "thinking process" ou tags <think>.
9. Use Markdown bem organizado quando útil: títulos curtos, listas e negrito. Todo código ou comando deve ficar em bloco cercado por três crases, com a linguagem indicada (html, css, javascript, typescript, bash etc.). Não misture código solto com o texto.`;

function visibleAnswer(raw: string, finished = false) {
  let value = raw;
  const lastThinkStart = value.lastIndexOf("<think>");
  const lastThinkEnd = value.lastIndexOf("</think>");
  if (lastThinkStart >= 0 && lastThinkEnd < lastThinkStart) return finished ? "" : "";
  if (lastThinkEnd >= 0) value = value.slice(lastThinkEnd + 8);
  value = value.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/<\/?think>/gi, "");
  value = value.replace(/^\s*(?:Thinking Process|Processo de pensamento|Raciocínio interno)\s*:\s*[\s\S]*?(?=\n#{1,3}\s|\nResposta(?: final)?\s*:)/i, "");
  return value.trimStart();
}

export async function askLocalTeacherAI(
  conversation: ChatMessage[],
  onProgress?: (progress: LocalAIProgress) => void,
  onToken?: (visibleText: string) => void,
) {
  const engine = await loadLocalTeacherAI(onProgress);
  const recent: ChatMessage[] = [];
  let contextCharacters = 0;
  for (const message of conversation.slice(-10).reverse()) {
    const content = message.content.slice(-6000);
    if (contextCharacters + content.length > 8000 && recent.length > 0) break;
    recent.unshift({ ...message, content });
    contextCharacters += content.length;
  }
  const stream = await engine.chat.completions.create({
    messages: [{ role: "system", content: EDUCATIONAL_SYSTEM_PROMPT }, ...recent],
    temperature: 0.65,
    top_p: 0.9,
    max_tokens: 1800,
    repetition_penalty: 1.08,
    stream: true,
  });
  let raw = "";
  for await (const chunk of stream) {
    raw += chunk?.choices?.[0]?.delta?.content || "";
    const visible = visibleAnswer(raw);
    if (visible) onToken?.(visible);
  }
  const content = visibleAnswer(raw, true).trim();
  if (!content) throw new Error("O modelo local não retornou uma resposta.");
  return content;
}

export async function unloadLocalTeacherAI() {
  const engine = loadedEngine || (enginePromise ? await enginePromise.catch(() => null) : null);
  if (engine?.unload) await engine.unload();
  loadedEngine = null;
  enginePromise = null;
}
