import { useState } from "react";
import { CheckCircle, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = { isOpen: boolean; onClose: () => void };
type Step = "request" | "verify" | "reset" | "success";

export default function ForgotPasswordModal({ isOpen, onClose }: Props) {
  const [step, setStep] = useState<Step>("request");
  const [identifier, setIdentifier] = useState("");
  const [requestId, setRequestId] = useState("");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  const close = () => { setStep("request"); setIdentifier(""); setCode(""); setDemoCode(""); setPassword(""); setConfirmation(""); onClose(); };
  const post = async (path: string, body: object) => {
    const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Não foi possível concluir a solicitação.");
    return data;
  };

  const requestCode = async () => {
    if (!identifier.trim()) return toast.error("Informe seu e-mail.");
    setLoading(true);
    try {
      const data = await post("/api/auth/recovery/request", { identifier });
      setRequestId(data.requestId); setDemoCode(data.demoCode || ""); setStep("verify");
      toast.success(data.message);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao solicitar o código."); }
    finally { setLoading(false); }
  };

  const verify = async () => {
    setLoading(true);
    try { const data = await post("/api/auth/recovery/verify", { requestId, code }); setResetToken(data.resetToken); setStep("reset"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Código inválido."); }
    finally { setLoading(false); }
  };

  const reset = async () => {
    if (password.length < 8) return toast.error("Use pelo menos 8 caracteres.");
    if (password !== confirmation) return toast.error("As senhas não coincidem.");
    setLoading(true);
    try { await post("/api/auth/recovery/reset", { requestId, resetToken, newPassword: password }); setStep("success"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível redefinir a senha."); }
    finally { setLoading(false); }
  };

  return <Dialog open={isOpen} onOpenChange={close}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-blue-700" />Recuperar senha</DialogTitle></DialogHeader>
    {step === "request" && <div className="space-y-5 py-3">
      <p className="text-sm text-slate-600">Informe o e-mail principal usado para entrar no sistema.</p>
      <div><Label className="flex items-center gap-2"><Mail className="h-4 w-4" />E-mail da conta</Label><Input type="email" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="professor@escola.com" autoComplete="email" /></div>
      <Button className="w-full" onClick={requestCode} disabled={loading}>{loading ? "Gerando..." : "Gerar código"}</Button>
      <p className="text-xs text-slate-500">Demonstração: o código será exibido na próxima etapa.</p>
    </div>}
    {step === "verify" && <div className="space-y-5 py-3"><div className="text-center"><KeyRound className="mx-auto mb-2 h-10 w-10 text-blue-700" /><p className="text-sm text-slate-600">Digite o código de seis dígitos. Ele expira em 10 minutos.</p></div>{demoCode && <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-center text-sm text-blue-900">Código de demonstração: <strong className="text-lg tracking-widest">{demoCode}</strong></div>}<Input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} className="text-center text-2xl tracking-[0.4em]" placeholder="000000" inputMode="numeric" autoComplete="one-time-code" /><Button className="w-full" onClick={verify} disabled={loading || code.length !== 6}>{loading ? "Verificando..." : "Verificar código"}</Button></div>}
    {step === "reset" && <div className="space-y-4 py-3"><div><Label>Nova senha</Label><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo de 8 caracteres" /></div><div><Label>Confirmar senha</Label><Input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></div><Button className="w-full" onClick={reset} disabled={loading}>{loading ? "Salvando..." : "Redefinir senha"}</Button></div>}
    {step === "success" && <div className="space-y-5 py-8 text-center"><CheckCircle className="mx-auto h-14 w-14 text-emerald-600" /><div><h3 className="text-lg font-semibold">Senha redefinida</h3><p className="text-sm text-slate-600">Você já pode entrar com a nova senha.</p></div><Button className="w-full" onClick={close}>Voltar ao login</Button></div>}
  </DialogContent></Dialog>;
}
