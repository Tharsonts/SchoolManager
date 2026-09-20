import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { FileText, Calendar, Users, BookOpen, CheckCircle, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface Activity {
  title: string;
  description: string;
  subjectId: string;
  classId: string;
  dueDate: string;
  maxGrade: number;
  instructions?: string;
  requirements?: string;
  allowLateSubmission: boolean;
  latePenalty: number;
}

interface AttachedFile {
  name: string;
  size: number;
  type: string;
}

interface TeacherActivityConfirmModalProps {
  activity: Activity | null;
  attachedFiles: AttachedFile[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  subjectName?: string;
  className?: string;
}

export default function TeacherActivityConfirmModal({
  activity,
  attachedFiles,
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
  subjectName,
  className
}: TeacherActivityConfirmModalProps) {
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

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-900">
            <Send className="h-5 w-5" />
            Confirmar Envio da Atividade
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações da Atividade */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{activity.title}</h3>
                <Badge className="bg-blue-100 text-blue-800">
                  Nota Máxima: {activity.maxGrade}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <BookOpen className="h-4 w-4" />
                  <span>Disciplina: {subjectName || 'Não especificada'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>Turma: {className || 'Não especificada'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Prazo: {formatDate(activity.dueDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Entregas atrasadas: {activity.allowLateSubmission ? 'Permitidas' : 'Não permitidas'}</span>
                </div>
              </div>
              

              
              {activity.instructions && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Instruções:</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                    {activity.instructions}
                  </p>
                </div>
              )}
              
              {activity.requirements && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Requisitos:</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap bg-amber-50 p-3 rounded border-l-4 border-amber-400">
                    {activity.requirements}
                  </p>
                </div>
              )}
              
              {attachedFiles.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Arquivos Anexados:</h4>
                  <div className="space-y-2">
                    {attachedFiles.map((file, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {activity.allowLateSubmission && activity.latePenalty > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-sm text-orange-800">
                    <strong>Penalidade por atraso:</strong> {activity.latePenalty} ponto(s) por dia
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Aviso de confirmação */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Send className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Confirmar Envio</h4>
                <p className="text-sm text-blue-700">
                  Ao confirmar, esta atividade será enviada para os alunos da turma selecionada. 
                  Eles poderão visualizar e enviar suas respostas até o prazo estabelecido.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          
          <Button 
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Confirmar Envio
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}