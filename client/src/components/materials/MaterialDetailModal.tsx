import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BookOpen, 
  FileText, 
  Video, 
  Link, 
  Edit3, 
  Download, 
  Eye, 
  ExternalLink,
  Calendar,
  User,
  Globe,
  Lock,
  Upload,
  X,
  Trash2
} from 'lucide-react';
import { useMaterial } from '@/hooks/useApi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface Material {
  id: string;
  title: string;
  description: string;
  materialType: 'slide' | 'document' | 'video' | 'link' | 'exercise' | 'other';
  content: string;
  isPublic: boolean;
  status: 'active' | 'inactive' | 'draft';
  createdAt: string;
  updatedAt: string;
  subjectName: string;
  className: string;
  filesCount: number;
}

interface MaterialDetailModalProps {
  material: Material;
  onClose: () => void;
  onDelete: () => void;
  showDeleteButton?: boolean;
}

const materialTypeIcons = {
  slide: FileText,
  document: BookOpen,
  video: Video,
  link: ExternalLink,
  exercise: Edit3,
  other: FileText
};

const materialTypeLabels = {
  slide: 'Slide',
  document: 'Documento',
  video: 'Vídeo',
  link: 'Link',
  exercise: 'Exercício',
  other: 'Outro'
};

export function MaterialDetailModal({ material, onClose, onDelete, showDeleteButton = true }: MaterialDetailModalProps) {
  const { data: materialDetail, isLoading, refetch } = useMaterial(material.id);
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
    return `/api/materials/files/${fileId}/view`;
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    // Processar arquivos um por vez
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch(`/api/materials/${material.id}/files`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Erro ao adicionar arquivo");
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: `Erro ao adicionar ${file.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          variant: "destructive"
        });
        setIsUploading(false);
        return;
      }
    }

    toast({
      title: "Sucesso",
      description: `${files.length} arquivo(s) adicionado(s) com sucesso!`
    });
    refetch(); // Recarregar dados do material
    setIsUploading(false);
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {

    try {
      const response = await fetch(`/api/materials/files/${fileId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Arquivo excluído com sucesso!"
        });
        refetch(); // Recarregar dados do material
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.message || "Erro ao excluir arquivo",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir arquivo",
        variant: "destructive"
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const IconComponent = materialTypeIcons[material.materialType];

  if (isLoading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <IconComponent className="w-6 h-6 text-purple-600" />
            {material.title}
            <Badge variant="secondary">
              {materialTypeLabels[material.materialType]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Material */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações do Material</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Disciplina:</span>
                  <span className="font-medium">{material.subjectName}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Turma:</span>
                  <span className="font-medium">{material.className}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Criado em:</span>
                  <span className="font-medium">
                    {format(new Date(material.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {material.isPublic ? (
                    <Globe className="w-4 h-4 text-green-500" />
                  ) : (
                    <Lock className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm text-gray-600">Visibilidade:</span>
                  <span className="font-medium">
                    {material.isPublic ? 'Público' : 'Privado'}
                  </span>
                </div>
              </div>

              {material.description && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Descrição:</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{material.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conteúdo Textual */}
          {materialDetail?.content && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Conteúdo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap text-gray-700">
                    {materialDetail.content}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Arquivos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Arquivos ({materialDetail?.files?.length || 0})</span>
                {user?.role === 'teacher' && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                      id="file-upload"
                      disabled={isUploading}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      disabled={isUploading}
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      {isUploading ? 'Enviando...' : 'Adicionar Arquivos'}
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Área de Drop para Upload */}
              {user?.role === 'teacher' && (
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center mb-4 transition-colors ${
                    dragOver 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Arraste arquivos aqui ou clique em "Adicionar Arquivos"
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, DOC, DOCX, TXT, PPT, PPTX, JPG, PNG, GIF (máx. 10MB cada)
                  </p>
                </div>
              )}

              {/* Lista de Arquivos */}
              {materialDetail?.files && materialDetail.files.length > 0 ? (
                <div className="space-y-3">
                  {materialDetail.files.map((file: any) => (
                    <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium">{file.originalFileName}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.fileSize)} • {file.fileCategory}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = `/api/materials/files/${file.id}/download`;
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
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p>Nenhum arquivo anexado</p>
                  {user?.role === 'teacher' && (
                    <p className="text-sm">Use o botão "Adicionar Arquivos" para enviar arquivos</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            {showDeleteButton && (
              <Button 
                variant="destructive" 
                onClick={onDelete}
              >
                Excluir Material
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}





