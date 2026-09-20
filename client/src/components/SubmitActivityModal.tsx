import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
import { FileText, Upload, X, AlertCircle, Clock, Calendar } from "lucide-react";
import { useSubmitActivity } from "@/hooks/useApi";
import { toast } from "@/hooks/use-toast";
import { SubmissionViewModal } from "./SubmissionViewModal";

interface Activity {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxGrade: number;
  instructions?: string;
  requirements?: string;
  allowLateSubmission: boolean;
}

interface SubmitActivityModalProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SubmitActivityModal({ activity, isOpen, onClose, onSuccess }: SubmitActivityModalProps) {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const submitActivityMutation = useSubmitActivity();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isLate = () => {
    if (!activity) return false;
    return new Date() > new Date(activity.dueDate);
  };

  const getDaysLate = () => {
    if (!activity) return 0;
    const now = new Date();
    const due = new Date(activity.dueDate);
    const diffTime = now.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activity) return;
    
    if (!content.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, adicione um comentário ou descrição do seu trabalho",
        variant: "destructive"
      });
      return;
    }

    if (isLate() && !activity.allowLateSubmission) {
      toast({
        title: "Prazo Expirado",
        description: "O prazo para esta atividade já expirou e entregas atrasadas não são permitidas",
        variant: "destructive"
      });
      return;
    }

    // Mostrar modal de confirmação ao invés de enviar diretamente
    setShowConfirmModal(true);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setContent("");
      setAttachments([]);
      setShowConfirmModal(false);
      onClose();
    }
  };

  const handleConfirmSuccess = () => {
    // Limpar formulário
    setContent("");
    setAttachments([]);
    setShowConfirmModal(false);
    
    onSuccess?.();
    onClose();
  };

  const handleConfirmClose = () => {
    setShowConfirmModal(false);
  };

  if (!activity) return null;

  return (
    <>
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-900">
            <FileText className="h-5 w-5" />
            Enviar Atividade: {activity.title}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações da Atividade */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Prazo: {formatDate(activity.dueDate)}</span>
                </div>
                <div className="text-sm font-medium text-amber-600">
                  Nota Máxima: {activity.maxGrade}
                </div>
              </div>
              
              {isLate() && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <div className="text-sm">
                    <span className="font-medium text-red-800">
                      Entrega Atrasada ({getDaysLate()} {getDaysLate() === 1 ? 'dia' : 'dias'})
                    </span>
                    {activity.allowLateSubmission ? (
                      <p className="text-red-600">Entregas atrasadas são aceitas, mas podem ter penalidade.</p>
                    ) : (
                      <p className="text-red-600">Entregas atrasadas não são permitidas para esta atividade.</p>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-700">{activity.description}</p>
              </div>
              
              {activity.instructions && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Instruções:</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{activity.instructions}</p>
                </div>
              )}
              
              {activity.requirements && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Requisitos:</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{activity.requirements}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Área de Submissão */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content">Descrição do Trabalho *</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Descreva seu trabalho, metodologia utilizada, principais conclusões, etc..."
                rows={6}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Upload de Arquivos */}
            <div className="space-y-2">
              <Label htmlFor="files">Anexos (Opcional)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <div className="text-sm text-gray-600 mb-2">
                    Clique para selecionar arquivos ou arraste aqui
                  </div>
                  <Input
                    id="files"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('files')?.click()}
                    disabled={isSubmitting}
                  >
                    Selecionar Arquivos
                  </Button>
                </div>
              </div>
              
              {/* Lista de Arquivos */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900">Arquivos Selecionados:</h4>
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        disabled={isSubmitting}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || (isLate() && !activity.allowLateSubmission)}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              Revisar e Enviar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* Modal de Confirmação */}
    <SubmissionViewModal
      activity={activity}
      isOpen={showConfirmModal}
      onClose={handleConfirmClose}
      onSuccess={handleConfirmSuccess}
      mode="submit"
      submissionData={{
        content,
        attachments: attachments // Passar os objetos File completos
      }}
    />
  </>
  );
}