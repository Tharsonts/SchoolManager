import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { 
  FileText, 
  Calendar, 
  Clock, 
  User, 
  BookOpen, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Star,
  MessageSquare,
  Eye,
  Download,
  ExternalLink
} from "lucide-react";
import { SubmitActivityModal } from "./SubmitActivityModal";
import { SubmissionViewModal } from "./SubmissionViewModal";
import { toast } from "@/hooks/use-toast";

interface Activity {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  requirements?: string;
  dueDate: string;
  maxGrade: number;
  status: 'active' | 'inactive' | 'completed';
  allowLateSubmission: boolean;
  lateSubmissionPenalty?: number;
  subject?: {
    name: string;
    color: string;
  };
  teacher?: {
    name: string;
  };
  class?: {
    name: string;
  };
  files?: Array<{
    id: string;
    originalFileName: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    filePath: string;
  }>;
}

interface ActivitySubmission {
  id: string;
  submittedAt: string;
  comment: string;
  status: 'submitted' | 'graded' | 'returned';
  grade?: number;
  feedback?: string;
  attachments?: string[];
}

interface ActivityDetailsModalProps {
  activity: Activity | null;
  submission?: ActivitySubmission | null;
  isOpen: boolean;
  onClose: () => void;
  canSubmit?: boolean;
  onSubmissionSuccess?: () => void;
}

export function ActivityDetailsModal({ 
  activity, 
  submission, 
  isOpen, 
  onClose, 
  canSubmit = true,
  onSubmissionSuccess 
}: ActivityDetailsModalProps) {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [activityFiles, setActivityFiles] = useState<Activity["files"]>(activity?.files ?? []);

  // Ao abrir o modal, caso a lista/grade não tenha enviado os arquivos da atividade,
  // buscamos os detalhes completos para preencher os anexos do professor.
  useEffect(() => {
    const loadFilesIfMissing = async () => {
      if (!isOpen || !activity?.id) return;

      if (activity.files && activity.files.length > 0) {
        setActivityFiles(activity.files);
        return;
      }

      try {
        const resp = await fetch(`/api/activities/${activity.id}`, { credentials: 'include' });
        if (resp.ok) {
          const full = await resp.json();
          if (full.files && full.files.length > 0) {
            setActivityFiles(full.files);
            return;
          }
        }

        // Se a primeira rota falhar (ex.: 403 por status "pending")
        // ou vier sem arquivos, tenta a rota dedicada de arquivos
        const filesResp = await fetch(`/api/activities/${activity.id}/files`, { credentials: 'include' });
        if (filesResp.ok) {
          const onlyFiles = await filesResp.json();
          setActivityFiles(Array.isArray(onlyFiles) ? onlyFiles : []);
        } else {
          setActivityFiles([]);
        }
      } catch {
        setActivityFiles([]);
      }
    };

    loadFilesIfMissing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activity?.id]);

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

  const canViewOnline = (fileType: string, fileName: string) => {
    const onlineViewableTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/html'
    ];
    
    const onlineViewableExtensions = ['.pdf', '.doc', '.docx', '.txt', '.html'];
    const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    
    return onlineViewableTypes.includes(fileType) || onlineViewableExtensions.includes(fileExtension);
  };

  const getViewerUrl = (fileId: string, fileName: string) => {
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    const directUrl = `/api/activities/files/${fileId}/view`;
    if (ext === '.doc' || ext === '.docx') {
      return `/viewer/docx/${fileId}`;
    }
    return directUrl;
  };

  const isLate = () => {
    return new Date() > new Date(activity.dueDate);
  };

  const getDaysLate = () => {
    const now = new Date();
    const due = new Date(activity.dueDate);
    const diffTime = now.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusBadge = () => {
    if (submission) {
      switch (submission.status) {
        case 'submitted':
          return <Badge className="bg-blue-100 text-blue-800">Enviada</Badge>;
        case 'graded':
          return <Badge className="bg-green-100 text-green-800">Avaliada</Badge>;
        case 'returned':
          return <Badge className="bg-yellow-100 text-yellow-800">Devolvida</Badge>;
      }
    }
    
    if (isLate()) {
      return <Badge variant="destructive">Atrasada</Badge>;
    }
    
    return <Badge className="bg-amber-100 text-amber-800">Pendente</Badge>;
  };

  const getStatusIcon = () => {
    if (submission) {
      switch (submission.status) {
        case 'submitted':
          return <Clock className="h-4 w-4 text-blue-600" />;
        case 'graded':
          return <CheckCircle className="h-4 w-4 text-green-600" />;
        case 'returned':
          return <XCircle className="h-4 w-4 text-yellow-600" />;
      }
    }
    
    if (isLate()) {
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
    
    return <Clock className="h-4 w-4 text-amber-600" />;
  };

  const canSubmitActivity = () => {
    if (submission) return false; // Já foi submetida
    if (!canSubmit) return false;
    if (isLate() && !activity.allowLateSubmission) return false;
    return activity.status === 'active';
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-900">
              <FileText className="h-5 w-5" />
              {activity.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header com Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon()}
                {getStatusBadge()}
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Nota Máxima</div>
                <div className="text-lg font-semibold text-amber-600">{activity.maxGrade}</div>
              </div>
            </div>

            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações da Atividade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activity.subject && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Disciplina:</span>
                      <Badge 
                        style={{ backgroundColor: activity.subject.color + '20', color: activity.subject.color }}
                      >
                        {activity.subject.name}
                      </Badge>
                    </div>
                  )}
                  
                  {activity.teacher && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Professor:</span>
                      <span className="text-sm font-medium">{activity.teacher.name}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Prazo:</span>
                    <span className={`text-sm font-medium ${
                      isLate() ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {formatDate(activity.dueDate)}
                    </span>
                  </div>
                  
                  {activity.class && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Turma:</span>
                      <span className="text-sm font-medium">{activity.class.name}</span>
                    </div>
                  )}
                </div>
                
                {isLate() && !submission && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <div className="text-sm">
                      <span className="font-medium text-red-800">
                        Atividade atrasada em {getDaysLate()} {getDaysLate() === 1 ? 'dia' : 'dias'}
                      </span>
                      {activity.allowLateSubmission && activity.lateSubmissionPenalty && (
                        <p className="text-red-600">
                          Penalidade por atraso: -{activity.lateSubmissionPenalty}% da nota
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Descrição:</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{activity.description}</p>
                </div>
                
                {activity.instructions && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Instruções:</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{activity.instructions}</p>
                  </div>
                )}
                
                {activity.requirements && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Requisitos:</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{activity.requirements}</p>
                  </div>
                )}

                {/* Arquivos da Atividade */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Arquivos da Atividade:</h4>
                  {activityFiles && activityFiles.length > 0 ? (
                    <div className="space-y-2">
                      {activityFiles.map((file: any) => (
                        <div key={file.id} className="flex items-center justify-between p-3 border border-blue-200 bg-blue-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div>
                              <span className="text-sm font-medium text-blue-900">{file.originalFileName}</span>
                              <span className="text-xs text-blue-600 block">
                                {file.fileSize && `${(file.fileSize / 1024 / 1024).toFixed(2)} MB`} • {file.fileType}
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {file.fileType && file.fileType.startsWith('image/') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`/api/activities/files/${file.id}/view`, '_blank')}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Ver
                              </Button>
                            )}
                            {canViewOnline(file.fileType, file.originalFileName) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const viewerUrl = getViewerUrl(file.id, file.originalFileName);
                                  window.open(viewerUrl, '_blank');
                                }}
                              >
                                <ExternalLink className="w-4 h-4 mr-1" />
                                Ver Online
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = `/api/activities/files/${file.id}/download`;
                                link.download = file.originalFileName;
                                link.click();
                              }}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Baixar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 border border-gray-200 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Nenhum arquivo anexado pelo professor</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submissão */}
            {submission ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Sua Submissão
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Enviada em:</span>
                      <p className="font-medium">{formatDate(submission.submittedAt)}</p>
                    </div>
                    
                    {submission.grade !== undefined && (
                      <div>
                        <span className="text-sm text-gray-600">Nota:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-amber-600">
                            {submission.grade}/{activity.maxGrade}
                          </span>
                          <div className="flex items-center">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < (submission.grade! / activity.maxGrade) * 5
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Seu Trabalho:</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                      {submission.comment}
                    </p>
                  </div>
                  
                  {submission.feedback && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Feedback do Professor:
                      </h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                        {submission.feedback}
                      </p>
                    </div>
                  )}
                  
                  {submission.attachments && submission.attachments.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Anexos ({submission.attachments.length}):</h4>
                      <div className="space-y-2">
                        {submission.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-gray-700">{attachment}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Simular download ou visualização do arquivo
                                toast({
                                  title: "Arquivo",
                                  description: `Visualizando: ${attachment}`,
                                });
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Ver Arquivo
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                </CardContent>
              </Card>
            ) : (
              canSubmitActivity() && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="space-y-4">
                      <div>
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <h3 className="text-lg font-medium text-gray-900">Atividade Pendente</h3>
                        <p className="text-sm text-gray-600">
                          Você ainda não enviou esta atividade.
                        </p>
                      </div>
                      
                      <Button 
                        onClick={() => setShowSubmitModal(true)}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Enviar Atividade
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Submissão */}
      <SubmitActivityModal
        activity={activity}
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onSuccess={() => {
          setShowSubmitModal(false);
          onSubmissionSuccess?.();
        }}
      />
      
      {/* Modal de Visualização Detalhada */}
      {submission && (
        <SubmissionViewModal
          activity={activity}
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          mode="view"
          submissionData={{
            content: submission.comment,
            attachments: submission.attachments || [],
            submittedAt: submission.submittedAt
          }}
        />
      )}
    </>
  );
}