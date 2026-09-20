import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { FileText, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { useSubmitActivity } from "@/hooks/useApi";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

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

interface SubmissionViewModalProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mode: 'view' | 'submit'; // 'view' para ver detalhes, 'submit' para enviar
  submissionData?: {
    content: string;
    attachments: File[];
    submittedAt?: string;
    isLate?: boolean;
  };
}

export function SubmissionViewModal({ 
  activity, 
  isOpen, 
  onClose, 
  onSuccess, 
  mode,
  submissionData 
}: SubmissionViewModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitActivityMutation = useSubmitActivity();

  if (!activity) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isLate = () => {
    if (submissionData?.submittedAt) {
      return new Date(submissionData.submittedAt) > new Date(activity.dueDate);
    }
    return new Date() > new Date(activity.dueDate);
  };

  const getDaysLate = () => {
    const submissionDate = submissionData?.submittedAt ? new Date(submissionData.submittedAt) : new Date();
    const due = new Date(activity.dueDate);
    const diffTime = submissionDate.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleConfirmSubmission = async () => {
    if (!submissionData) return;
    
    setIsSubmitting(true);
    
    try {
      console.log('🚀 Iniciando submissão de atividade...');
      console.log('Activity ID:', activity.id);
      console.log('Content:', submissionData.content);
      console.log('Attachments:', submissionData.attachments.length);
      
      await submitActivityMutation.mutateAsync({
        activityId: activity.id,
        submission: {
          content: submissionData.content,
          attachments: submissionData.attachments
        }
      });
      
      console.log('✅ Submissão realizada com sucesso!');
      
      toast({
        title: "Sucesso!",
        description: "Atividade enviada com sucesso",
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('❌ Erro na submissão:', error);
      
      toast({
        title: "Erro",
        description: "Erro ao enviar atividade. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-900">
            <FileText className="h-5 w-5" />
            {mode === 'submit' ? 'Confirmar Envio:' : 'Detalhes:'} {activity.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
              
              {(mode === 'submit' && isLate()) && (
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

          {/* Dados da Submissão (somente leitura) */}
          {submissionData && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="font-medium text-gray-900">Seu Trabalho</h3>
                  {submissionData.submittedAt && (
                    <Badge className={isLate() ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                      {isLate() ? 'Enviado com Atraso' : 'Enviado no Prazo'}
                    </Badge>
                  )}
                </div>
                
                {submissionData.submittedAt && (
                  <div className="text-sm text-gray-600 mb-3">
                    <span className="font-medium">Enviado em:</span> {formatDate(submissionData.submittedAt)}
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Descrição do Trabalho:</h4>
                  <div className="bg-gray-50 p-3 rounded border">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{submissionData.content}</p>
                  </div>
                </div>
                
                {submissionData.attachments.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Anexos ({submissionData.attachments.length}):</h4>
                    <div className="space-y-2">
                      {submissionData.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-700">{attachment.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Para arquivos de submissão, precisamos do ID do arquivo
                              // Por enquanto, apenas mostrar toast
                              toast({
                                title: "Arquivo",
                                description: `Arquivo: ${attachment.name}`,
                              });
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Baixar
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            {mode === 'submit' ? 'Cancelar' : 'Fechar'}
          </Button>
          
          {mode === 'submit' && submissionData && (
            <Button 
              onClick={handleConfirmSubmission}
              disabled={isSubmitting || (isLate() && !activity.allowLateSubmission)}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Confirmar Envio
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}