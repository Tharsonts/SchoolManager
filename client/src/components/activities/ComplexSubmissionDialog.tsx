import { useState, useRef, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Upload, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Info,
  Eye,
  Download,
  Trash2,
  Plus,
  Send,
  Calendar,
  User,
  BookOpen,
  Target,
  Award,
  AlertTriangle
} from "lucide-react";

interface Activity {
  id: string;
  title: string;
  description: string;
  subject: string;
  teacherName: string;
  dueDate: string;
  maxGrade: number;
  instructions?: string;
  requirements?: string;
  allowLateSubmission: boolean;
  latePenalty: number;
  maxFileSize: number;
  allowedFileTypes?: string[];
  referenceFiles?: Array<{
    id: string;
    fileName: string;
    originalFileName: string;
    fileType: string;
    fileSize: number;
  }>;
}

interface SubmissionData {
  comment: string;
  files: File[];
  acknowledgments: {
    readInstructions: boolean;
    understoodRequirements: boolean;
    originalWork: boolean;
    properCitation: boolean;
  };
  estimatedTime: string;
  collaboration: string;
  challenges: string;
  improvements: string;
}

interface ComplexSubmissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SubmissionData) => void;
  activity: Activity;
  isLate: boolean;
}

export function ComplexSubmissionDialog({
  isOpen,
  onClose,
  onSubmit,
  activity,
  isLate
}: ComplexSubmissionDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionData, setSubmissionData] = useState<SubmissionData>({
    comment: "",
    files: [],
    acknowledgments: {
      readInstructions: false,
      understoodRequirements: false,
      originalWork: false,
      properCitation: false
    },
    estimatedTime: "",
    collaboration: "",
    challenges: "",
    improvements: ""
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileErrors, setFileErrors] = useState<string[]>([]);

  const totalSteps = 2;
  const maxFileSizeMB = activity.maxFileSize;
  const allowedTypes = Array.isArray(activity.allowedFileTypes) ? activity.allowedFileTypes : ['pdf', 'doc', 'docx', 'jpg', 'png', 'zip'];

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []);
    validateAndAddFiles(newFiles);
  };

  const validateAndAddFiles = (newFiles: File[]) => {
    const errors: string[] = [];
    const validFiles: File[] = [];

    newFiles.forEach(file => {
      // Verificar tamanho
      if (file.size > maxFileSizeMB * 1024 * 1024) {
        errors.push(`${file.name}: Arquivo muito grande (máx: ${maxFileSizeMB}MB)`);
        return;
      }

      // Verificar tipo
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!allowedTypes.includes(fileExtension || '')) {
        errors.push(`${file.name}: Tipo de arquivo não permitido`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      setFileErrors(errors);
      setTimeout(() => setFileErrors([]), 5000);
    }

    setSubmissionData(prev => ({
      ...prev,
      files: [...prev.files, ...validFiles]
    }));
  };

  const removeFile = (index: number) => {
    setSubmissionData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      validateAndAddFiles(newFiles);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // Permitir entrega sem arquivos e sem comentários
    onSubmit(submissionData);
    setIsSubmitted(true);
    
    // Fechar o modal automaticamente após 3 segundos
    setTimeout(() => {
      onClose();
      setIsSubmitted(false);
      setCurrentStep(1);
    }, 3000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png': return '🖼️';
      case 'zip':
      case 'rar': return '📦';
      case 'ppt':
      case 'pptx': return '📊';
      default: return '📎';
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <BookOpen className="h-16 w-16 mx-auto text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Revisar Atividade</h3>
              <p className="text-gray-600">Confirme os detalhes antes de prosseguir</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Detalhes da Atividade</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Título</label>
                  <p className="text-sm text-gray-900">{activity.title}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Descrição</label>
                  <p className="text-sm text-gray-900">{activity.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Matéria</label>
                    <p className="text-sm text-gray-900">{activity.subject}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Professor</label>
                    <p className="text-sm text-gray-900">{activity.teacherName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Data de Entrega</label>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p className={`text-sm ${isLate ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                        {new Date(activity.dueDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Nota Máxima</label>
                    <p className="text-sm text-gray-900">{activity.maxGrade}/10</p>
                  </div>
                </div>

                {isLate && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="text-sm font-medium text-red-800">⚠️ Prazo Expirado</p>
                        <p className="text-sm text-red-700">
                          Penalidade por atraso: {activity.latePenalty} pontos por dia
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activity.instructions && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Instruções Específicas</label>
                    <p className="text-sm text-gray-900 bg-blue-50 p-3 rounded-lg">
                      {activity.instructions}
                    </p>
                  </div>
                )}

                {activity.requirements && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Requisitos</label>
                    <p className="text-sm text-gray-900 bg-yellow-50 p-3 rounded-lg">
                      {activity.requirements}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {activity.referenceFiles && activity.referenceFiles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Download className="h-5 w-5" />
                    <span>Arquivos de Referência</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {activity.referenceFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getFileIcon(file.fileName)}</span>
                          <div>
                            <p className="text-sm font-medium">{file.originalFileName}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.fileSize)} • {file.fileType.toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Baixar
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

             case 2:
         if (isSubmitted) {
           return (
             <div className="space-y-6 text-center">
               <div className="text-center">
                 <CheckCircle className="h-20 w-20 mx-auto text-green-600 mb-6" />
                 <h3 className="text-2xl font-bold text-green-800 mb-4">🎉 Atividade Entregue com Sucesso!</h3>
                 <p className="text-lg text-gray-700 mb-6">
                   Sua atividade foi enviada e está sendo processada pelo professor.
                 </p>
                 
                 <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
                   <h4 className="font-semibold text-green-800 mb-3">📋 Resumo da Entrega:</h4>
                   <div className="text-left space-y-2 text-sm">
                     <p><span className="font-medium">Atividade:</span> {activity.title}</p>
                                            <p><span className="font-medium">Arquivos:</span> Temporariamente desabilitados</p>
                     <p><span className="font-medium">Comentário:</span> {submissionData.comment ? 'Sim' : 'Não'}</p>
                     <p><span className="font-medium">Data:</span> {new Date().toLocaleDateString('pt-BR')}</p>
                   </div>
                 </div>
                 
                 <div className="mt-6">
                   <Button onClick={onClose} className="bg-green-600 hover:bg-green-700 px-8">
                     Fechar
                   </Button>
                 </div>
               </div>
             </div>
           );
         }
         
         return (
           <div className="space-y-6">
             <div className="text-center">
               <Upload className="h-16 w-16 mx-auto text-green-600 mb-4" />
               <h3 className="text-xl font-semibold mb-2">Enviar Arquivos</h3>
               <p className="text-gray-600">Selecione os arquivos da sua atividade</p>
             </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Comentário (opcional)</label>
                <Textarea
                  placeholder="Adicione observações sobre sua entrega, dificuldades encontradas, ou qualquer informação relevante..."
                  rows={4}
                  value={submissionData.comment}
                  onChange={(e) => setSubmissionData(prev => ({ ...prev, comment: e.target.value }))}
                />
              </div>

                             <div>
                 <label className="text-sm font-medium text-gray-700">
                   Arquivos da Atividade (temporariamente desabilitado)
                 </label>
                 <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
                   <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                   <p className="text-lg font-medium text-gray-900 mb-2">
                     Upload de arquivos temporariamente desabilitado
                   </p>
                   <p className="text-sm text-gray-500 mb-4">
                     Por enquanto, você pode entregar apenas com comentário
                   </p>
                   <p className="text-sm text-blue-600 font-medium">
                     💡 Funcionalidade será restaurada em breve
                   </p>
                 </div>
               </div>

              {fileErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-800">Erros encontrados:</span>
                  </div>
                  <ul className="text-sm text-red-700 space-y-1">
                    {fileErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

                             {/* Arquivos temporariamente desabilitados */}

              
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
         <Dialog open={isOpen} onOpenChange={onClose}>
               <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto relative !fixed !left-[50%] !top-[50%] !transform !-translate-x-1/2 !-translate-y-1/2">
          {/* Botão de fechar no canto superior direito - só aparece quando não foi enviado */}
          {!isSubmitted && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="absolute top-4 right-4 z-20"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
         
                   <DialogHeader>
            <DialogTitle>
              {isSubmitted ? "Entrega Concluída" : `Entrega de Atividade - Passo ${currentStep} de ${totalSteps}`}
            </DialogTitle>
          </DialogHeader>

                 <div className="space-y-6">
           {/* Progress Bar - só aparece quando não foi enviado */}
           {!isSubmitted && (
             <div className="w-full bg-gray-200 rounded-full h-2">
               <div 
                 className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                 style={{ width: `${(currentStep / totalSteps) * 100}%` }}
               />
             </div>
           )}

          {/* Step Content */}
          {renderStepContent()}

                     {/* Navigation - só aparece quando não foi enviado */}
           {!isSubmitted && (
             <div className="flex justify-between pt-4 border-t">
               <Button
                 variant="outline"
                 onClick={prevStep}
                 disabled={currentStep === 1}
               >
                 Anterior
               </Button>

               <div className="flex space-x-2">
                 {currentStep === 1 ? (
                   <Button onClick={nextStep}>
                     Próximo
                   </Button>
                 ) : (
                   <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                     <Send className="h-4 w-4 mr-2" />
                     Enviar Atividade
                   </Button>
                 )}
               </div>
             </div>
           )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

