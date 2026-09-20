import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Upload, 
  FileText, 
  X, 
  BookOpen, 
  Link as LinkIcon,
  Folder
} from 'lucide-react';
import { useCreateMaterial, useTeacherFolders } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';

interface CreateMaterialModalProps {
  onClose: () => void;
  onSuccess: () => void;
  currentFolder?: string | null;
}

const materialTypes = [
  { value: 'document', label: 'Documento', icon: BookOpen },
  { value: 'link', label: 'Link', icon: LinkIcon }
];

export function CreateMaterialModal({ onClose, onSuccess, currentFolder }: CreateMaterialModalProps) {
  const { user } = useAuth();
  const [materialType, setMaterialType] = useState('document');
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState('');
  const [folder, setFolder] = useState(currentFolder || '');
  const [files, setFiles] = useState<File[]>([]);
  const [linkUrl, setLinkUrl] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const createMaterialMutation = useCreateMaterial();
  const { data: foldersData } = useTeacherFolders(user?.id);
  
  // Hook para turmas do professor (formato simples para seletores)
  const { data: classesData } = useQuery({
    queryKey: ['teacher-classes-simple', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/teacher/${user?.id}/classes`, { credentials: 'include' });
      if (!response.ok) throw new Error('Erro ao buscar turmas');
      const data = await response.json();
      
      // Transformar dados para formato simples de seletor
      const simpleClasses = data.data?.map((item: any) => ({
        id: item.classId,
        name: item.className,
        grade: item.className.split(' ')[0] || 'N/A'
      })) || [];
      
      // Remover duplicatas por ID
      const uniqueClasses = simpleClasses.filter((cls: any, index: number, self: any[]) => 
        self.findIndex(c => c.id === cls.id) === index
      );
      
      return { data: uniqueClasses };
    },
    enabled: !!user?.id
  });
  
  // Hook para disciplinas do professor (formato simples para seletores)
  const { data: subjectsData } = useQuery({
    queryKey: ['teacher-subjects-simple', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/subjects', { credentials: 'include' });
      if (!response.ok) throw new Error('Erro ao buscar disciplinas');
      const data = await response.json();
      
      // Filtrar disciplinas do professor e transformar para formato simples
      const teacherSubjects = data.filter((subject: any) => {
        return true; // Mostrar todas por enquanto
      }).map((subject: any) => ({
        id: subject.id,
        name: subject.name,
        code: subject.code
      }));
      
      return { data: teacherSubjects };
    },
    enabled: !!user?.id
  });
  
  // Garantir que os dados sejam arrays
  const classes = classesData?.data || [];
  const subjects = subjectsData?.data || [];
  const folders = Array.isArray(foldersData) ? foldersData : (foldersData?.data || []);

  const onDrop = (acceptedFiles: File[]) => {
    setFiles(acceptedFiles); // Apenas um arquivo para documentos
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
    },
    maxFiles: 1, // Apenas 1 arquivo
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const removeFile = () => {
    setFiles([]);
  };

  const handleFolderSelect = (selectedFolder: string) => {
    setFolder(selectedFolder);
    setShowNewFolderInput(false);
    setNewFolderName('');
  };

  const handleCreateNewFolder = () => {
    if (newFolderName.trim()) {
      setFolder(newFolderName.trim());
      setShowNewFolderInput(false);
      setNewFolderName('');
    }
  };

  const handleCancelNewFolder = () => {
    setShowNewFolderInput(false);
    setNewFolderName('');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subjectId) {
      toast.error('Disciplina é obrigatória');
      return;
    }

    if (!classId) {
      toast.error('Turma é obrigatória');
      return;
    }

    // Validações específicas por tipo
    if (materialType === 'document' && files.length === 0) {
      toast.error('Arquivo é obrigatório para documentos');
      return;
    }

    if (materialType === 'link' && !linkUrl.trim()) {
      toast.error('Link é obrigatório');
      return;
    }

    try {
      const formData = new FormData();
      
      // Título baseado no arquivo ou link
      if (materialType === 'document' && files.length > 0) {
        const fileName = files[0].name;
        const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
        formData.append('title', nameWithoutExt);
      } else if (materialType === 'link') {
        formData.append('title', 'Link de Material');
      }
      
      formData.append('description', materialType === 'document' ? 'Documento enviado' : 'Link compartilhado');
      formData.append('subjectId', subjectId);
      formData.append('classId', classId);
      formData.append('materialType', materialType);
      formData.append('content', materialType === 'link' ? linkUrl.trim() : '');
      formData.append('folder', folder.trim());
      formData.append('isPublic', 'true');

      // Adicionar arquivo apenas se for documento
      if (materialType === 'document' && files.length > 0) {
        formData.append('files', files[0]);
      }

      await createMaterialMutation.mutateAsync(formData);
      toast.success('Material criado com sucesso');
      onSuccess();
    } catch (error) {
      toast.error('Erro ao criar material');
    }
  };

  const selectedType = materialTypes.find(t => t.value === materialType);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedType && <selectedType.icon className="w-5 h-5" />}
            Novo Material
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Material */}
          <div className="space-y-2">
            <Label>Tipo de Material *</Label>
            <div className="grid grid-cols-2 gap-3">
              {materialTypes.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setMaterialType(type.value)}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    materialType === type.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <type.icon className="w-6 h-6" />
                    <span className="font-medium">{type.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Disciplina e Turma */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Disciplina *</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Turma *</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pasta (opcional) */}
          <div className="space-y-2">
            <Label>Pasta (opcional)</Label>
            
            {!showNewFolderInput ? (
              <div className="space-y-2">
                {folders.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {folders.map((folderItem: any) => (
                      <button
                        key={folderItem.folder}
                        type="button"
                        onClick={() => handleFolderSelect(folderItem.folder)}
                        className={`p-2 text-left border rounded-lg hover:bg-gray-50 transition-colors ${
                          folder === folderItem.folder 
                            ? 'border-blue-500 bg-blue-50 text-blue-700' 
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Folder className="w-4 h-4" />
                          <span className="text-sm font-medium">{folderItem.folder}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => setShowNewFolderInput(true)}
                  className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <Folder className="w-4 h-4" />
                    <span className="text-sm">+ Criar nova pasta</span>
                  </div>
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Nome da pasta"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleCreateNewFolder}
                  disabled={!newFolderName.trim()}
                  size="sm"
                >
                  Criar
                </Button>
                <Button
                  type="button"
                  onClick={handleCancelNewFolder}
                  variant="outline"
                  size="sm"
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>

          {/* Conteúdo baseado no tipo */}
          {materialType === 'document' && (
            <div className="space-y-2">
              <Label>Arquivo *</Label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                {isDragActive ? (
                  <p className="text-blue-600">Solte o arquivo aqui...</p>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-1">
                      Arraste um arquivo aqui ou clique para selecionar
                    </p>
                    <p className="text-sm text-gray-500">
                      PDF, DOC, DOCX, TXT, imagens, PowerPoint (máx. 10MB)
                    </p>
                  </div>
                )}
              </div>

              {files.length > 0 && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">{files[0].name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(files[0].size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeFile}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {materialType === 'link' && (
            <div className="space-y-2">
              <Label>Link *</Label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://exemplo.com"
                type="url"
              />
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createMaterialMutation.isPending}
            >
              {createMaterialMutation.isPending ? 'Criando...' : 'Criar Material'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
