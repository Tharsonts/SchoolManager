import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  Image, 
  X, 
  Send, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  Download,
  Eye,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';

interface Activity {
  id: string;
  title: string;
  description: string;
  type: string;
  dueDate: string;
  maxGrade: number;
  allowLateSubmission: boolean;
  latePenalty: number;
  instructions?: string;
  attachments?: Array<{
    id: string;
    fileName: string;
    fileType: string;
    filePath: string;
  }>;
}

interface ExistingSubmission {
  id: string;
  content: string;
  submittedAt: string;
  grade?: number;
  feedback?: string;
  status: 'submitted' | 'late' | 'graded' | 'returned' | 'resubmitted';
  isLate: boolean;
  latePenaltyApplied: number;
  finalGrade?: number;
  files?: Array<{
    id: string;
    fileName: string;
    originalFileName: string;
    fileSize: number;
    fileType: string;
  }>;
}

interface StudentSubmissionFormProps {
  activity: Activity;
  existingSubmission?: ExistingSubmission;
  onSubmissionUpdate: () => void;
}

interface FileWithPreview extends File {
  id: string;
  preview?: string;
  uploadProgress?: number;
  status?: 'pending' | 'uploading' | 'completed' | 'error';
}

export function StudentSubmissionForm({ 
  activity, 
  existingSubmission, 
  onSubmissionUpdate 
}: StudentSubmissionFormProps) {
  const [content, setContent] = useState(existingSubmission?.content || '');
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const isLate = new Date() > new Date(activity.dueDate);
  const canSubmit = !existingSubmission || existingSubmission.status !== 'graded';
  const canResubmit = existingSubmission && existingSubmission.status === 'returned';

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
    // Para todos os tipos de arquivo, usar visualização direta interna
    return `/api/submissions/files/${fileId}/view`;
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file, index) => {
      const fileWithId = file as FileWithPreview;
      fileWithId.id = `${Date.now()}-${index}`;
      fileWithId.status = 'pending';
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        fileWithId.preview = URL.createObjectURL(file);
      }
      
      return fileWithId;
    });
    
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive: dropzoneDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false)
  });

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: FileWithPreview) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-600" />;
    }
    return <FileText className="w-5 h-5 text-gray-600" />;
  };

  const handleSubmit = async () => {
    if (!content.trim() && files.length === 0) {
      toast.error('Por favor, escreva uma resposta ou anexe um arquivo');
      return;
    }

    if (isLate && !activity.allowLateSubmission) {
      toast.error('O prazo de entrega expirou e submissões em atraso não são permitidas');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('content', content);
      
      // Add files to form data
      files.forEach((file, index) => {
        formData.append(`files`, file);
      });

      const response = await fetch(`/api/activities/${activity.id}/submit`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success(canResubmit ? 'Atividade reenviada com sucesso!' : 'Atividade enviada com sucesso!');
        onSubmissionUpdate();
        setContent('');
        setFiles([]);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao enviar atividade');
      }
    } catch (error) {
      toast.error('Erro ao enviar atividade. Tente novamente.');
      console.error('Erro:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUndoSubmission = async () => {
    try {
      const response = await fetch(`/api/activities/${activity.id}/undo-submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Entrega desfeita com sucesso! Você pode enviar novamente.');
        onSubmissionUpdate();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao desfazer entrega');
      }
    } catch (error) {
      toast.error('Erro ao desfazer entrega. Tente novamente.');
      console.error('Erro:', error);
    }
  };

  const getStatusBadge = () => {
    if (!existingSubmission) return null;
    
    const { status, isLate } = existingSubmission;
    
    if (status === 'graded') {
      return <Badge variant="outline" className="text-green-600 border-green-600">
        <CheckCircle className="w-3 h-3 mr-1" />
        Avaliada
      </Badge>;
    }
    
    if (isLate) {
      return <Badge variant="outline" className="text-red-600 border-red-600">
        <AlertCircle className="w-3 h-3 mr-1" />
        Entregue com Atraso
      </Badge>;
    }
    
    return <Badge variant="outline" className="text-blue-600 border-blue-600">
      <Send className="w-3 h-3 mr-1" />
      Entregue
    </Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Informações da Atividade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{activity.title}</span>
            {getStatusBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-gray-700">{activity.description}</p>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-1" />
                  Prazo: {format(new Date(activity.dueDate), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </div>
                <div className="text-gray-600">
                  Pontuação: {activity.maxGrade} pontos
                </div>
              </div>
              
              {isLate && (
                <Badge variant="outline" className="text-red-600 border-red-600">
                  <Clock className="w-3 h-3 mr-1" />
                  Prazo Expirado
                </Badge>
              )}
            </div>

            {activity.instructions && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Instruções:</h4>
                <p className="text-sm text-blue-800">{activity.instructions}</p>
              </div>
            )}

            {isLate && activity.allowLateSubmission && activity.latePenalty > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Submissões em atraso terão desconto de {activity.latePenalty} pontos.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Arquivos da Atividade */}
      {activity.attachments && activity.attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Materiais da Atividade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activity.attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-sm">{attachment.fileName}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/api/activities/files/${attachment.id}/view`, '_blank')}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/api/activities/files/${attachment.id}/download`, '_blank')}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Baixar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submissão Existente */}
      {existingSubmission && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Sua Submissão</span>
              <div className="flex items-center space-x-2">
                {existingSubmission.status !== 'graded' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUndoSubmission}
                  >
                    Desfazer Entrega
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Entregue em:</p>
                <p className="font-medium">
                  {format(new Date(existingSubmission.submittedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </p>
              </div>
              
              {existingSubmission.content && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Resposta:</p>
                  <div className="bg-gray-50 p-3 rounded border">
                    <p className="whitespace-pre-wrap">{existingSubmission.content}</p>
                  </div>
                </div>
              )}
              
              {existingSubmission.files && existingSubmission.files.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Arquivos anexados:</p>
                  <div className="space-y-2">
                    {existingSubmission.files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center space-x-2">
                          {file.fileType.startsWith('image/') ? (
                            <Image className="w-4 h-4 text-blue-600" />
                          ) : (
                            <FileText className="w-4 h-4 text-gray-600" />
                          )}
                          <span className="text-sm">{file.originalFileName}</span>
                          <span className="text-xs text-gray-500">
                            ({formatFileSize(file.fileSize)})
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          {file.fileType.startsWith('image/') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/api/submissions/files/${file.id}/view`, '_blank')}
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
                              link.href = `/api/submissions/files/${file.id}/download`;
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
                </div>
              )}

              {existingSubmission.status === 'graded' && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-green-900">Avaliação</h4>
                    <div className="text-lg font-bold text-green-900">
                      {existingSubmission.finalGrade?.toFixed(1) || existingSubmission.grade?.toFixed(1) || 0}
                      /{activity.maxGrade}
                    </div>
                  </div>
                  
                  {existingSubmission.latePenaltyApplied > 0 && (
                    <p className="text-sm text-red-600 mb-2">
                      Penalidade por atraso: -{existingSubmission.latePenaltyApplied} pontos
                    </p>
                  )}
                  
                  {existingSubmission.feedback && (
                    <div>
                      <p className="text-sm font-medium text-green-900 mb-1">Feedback do Professor:</p>
                      <p className="text-sm text-green-800">{existingSubmission.feedback}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulário de Submissão */}
      {canSubmit && (
        <Card>
          <CardHeader>
            <CardTitle>
              {canResubmit ? 'Reenviar Atividade' : 'Enviar Atividade'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="content">Sua Resposta</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Digite sua resposta aqui..."
                rows={6}
                className="resize-none"
              />
            </div>

            {/* Upload de Arquivos */}
            <div className="space-y-4">
              <Label>Anexar Arquivos (Opcional)</Label>
              
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive || dropzoneDragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Arraste arquivos aqui ou clique para selecionar
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Suporte para imagens, PDFs, documentos Word/PowerPoint (máx. 10MB cada)
                </p>
              </div>

              {/* Lista de Arquivos */}
              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(file)}
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {file.preview && (
                          <div className="w-8 h-8 rounded overflow-hidden">
                            <img
                              src={file.preview}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || (!content.trim() && files.length === 0)}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  'Enviando...'
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {canResubmit ? 'Reenviar Atividade' : 'Entregar Atividade'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

