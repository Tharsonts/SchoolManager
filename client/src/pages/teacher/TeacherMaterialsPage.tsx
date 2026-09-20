import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  BookOpen, 
  FileText, 
  Video, 
  Link, 
  Edit3, 
  Trash2,
  Eye,
  Download,
  ExternalLink,
  Filter,
  Folder
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTeacherMaterials, useTeacherFolders, useDeleteMaterial } from '@/hooks/useApi';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CreateMaterialModal } from '@/components/materials/CreateMaterialModal';
import { MaterialDetailModal } from '@/components/materials/MaterialDetailModal';
import { PasswordConfirmationDialog } from '@/components/ui/PasswordConfirmationDialog';

interface Material {
  id: string;
  title: string;
  description: string;
  materialType: 'slide' | 'document' | 'video' | 'link' | 'exercise' | 'other' | 'folder';
  content: string;
  folder?: string;
  isPublic: boolean;
  status: 'active' | 'inactive' | 'draft';
  createdAt: string;
  updatedAt: string;
  subjectName: string;
  className: string;
  filesCount: number;
  totalSize?: number;
}

const materialTypeIcons = {
  slide: FileText,
  document: BookOpen,
  video: Video,
  link: ExternalLink,
  exercise: Edit3,
  other: FileText,
  folder: Folder
};

const materialTypeLabels = {
  slide: 'Slide',
  document: 'Documento',
  video: 'Vídeo',
  link: 'Link',
  exercise: 'Exercício',
  other: 'Outro',
  folder: 'Pasta'
};

export function TeacherMaterialsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<string[]>([]);

  const { data: materials = [], isLoading, refetch } = useTeacherMaterials(user?.id, currentFolder);
  const { data: folders = [] } = useTeacherFolders(user?.id);
  const deleteMaterialMutation = useDeleteMaterial();

  // Funções de navegação de pastas
  const navigateToFolder = (folderName: string) => {
    setCurrentFolder(folderName);
    setFolderPath([...folderPath, folderName]);
  };

  const navigateBack = () => {
    if (folderPath.length > 0) {
      const newPath = folderPath.slice(0, -1);
      setFolderPath(newPath);
      setCurrentFolder(newPath.length > 0 ? newPath[newPath.length - 1] : null);
    } else {
      setCurrentFolder(null);
    }
  };

  const navigateToRoot = () => {
    setCurrentFolder(null);
    setFolderPath([]);
  };

  const filteredMaterials = materials.filter((material: Material) => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.subjectName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === 'all' || material.materialType === selectedType;

    // Evitar duplicação: na raiz mostra só itens sem pasta; dentro da pasta mostra só os itens daquela pasta
    const matchesFolder = currentFolder ? material.folder === currentFolder : !material.folder;

    return matchesSearch && matchesType && matchesFolder;
  });

  const handleDeleteMaterial = async (password: string) => {
    if (password !== '123') {
      toast.error('Senha incorreta');
      return;
    }

    if (!materialToDelete) return;

    try {
      await deleteMaterialMutation.mutateAsync(materialToDelete);
      toast.success('Material deletado com sucesso');
      setShowDeleteDialog(false);
      setMaterialToDelete(null);
    } catch (error) {
      toast.error('Erro ao deletar material');
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Materiais Didáticos</h1>
            <p className="text-gray-600 mt-1">
              Gerencie slides, documentos e conteúdos de aula
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Material
          </Button>
        </div>

        {/* Breadcrumb do Explorador */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={navigateToRoot}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50"
              >
                <Folder className="w-4 h-4" />
                Materiais
              </button>
              {folderPath.map((folder, index) => (
                <React.Fragment key={index}>
                  <span className="text-gray-400">&gt;</span>
                  <button
                    onClick={() => {
                      const newPath = folderPath.slice(0, index + 1);
                      setFolderPath(newPath);
                      setCurrentFolder(folder);
                    }}
                    className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                  >
                    {folder}
                  </button>
                </React.Fragment>
              ))}
              {currentFolder && (
                <>
                  <span className="text-gray-400">&gt;</span>
                  <span className="text-gray-900 font-medium px-2 py-1">{currentFolder}</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar materiais..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">Todos os tipos</option>
                  <option value="slide">Slides</option>
                  <option value="document">Documentos</option>
                  <option value="video">Vídeos</option>
                  <option value="link">Links</option>
                  <option value="exercise">Exercícios</option>
                  <option value="other">Outros</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interface do Explorador de Arquivos */}
        <Card>
          <CardContent className="p-0">
            {/* Cabeçalho das Colunas */}
            <div className="border-b bg-gray-50 px-4 py-2">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-600">
                <div className="col-span-5">Nome</div>
                <div className="col-span-2">Tipo</div>
                <div className="col-span-2">Data de modificação</div>
                <div className="col-span-2">Tamanho</div>
                <div className="col-span-1">Ações</div>
              </div>
            </div>

            {/* Lista de Itens */}
            <div className="divide-y">
              {/* Pastas primeiro */}
              {!currentFolder && folders.map((folder: any) => (
                <div
                  key={folder.folder}
                  onClick={() => navigateToFolder(folder.folder)}
                  className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors items-center"
                >
                  <div className="col-span-5 flex items-center gap-3">
                    <Folder className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-900">{folder.folder}</span>
                  </div>
                  <div className="col-span-2 text-sm text-gray-600">Pasta de arquivos</div>
                  <div className="col-span-2 text-sm text-gray-600">-</div>
                  <div className="col-span-2 text-sm text-gray-600">{folder.count} itens</div>
                  <div className="col-span-1"></div>
                </div>
              ))}

              {/* Materiais */}
              {filteredMaterials.map((material: Material) => {
                const IconComponent = materialTypeIcons[material.materialType];
                
                // Debug logs
                console.log('🔍 Material:', material.title);
                console.log('  - Tipo:', material.materialType);
                console.log('  - filesCount:', material.filesCount);
                console.log('  - totalSize:', material.totalSize);
                console.log('  - Condição download:', material.materialType === 'document' && material.filesCount > 0);
                
                return (
                  <div
                    key={material.id}
                    className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 transition-colors items-center"
                  >
                    <div className="col-span-5 flex items-center gap-3">
                      <IconComponent className="w-5 h-5 text-purple-600" />
                      <div className="flex-1">
                        {material.materialType === 'link' ? (
                          <button
                            onClick={() => {
                              if (material.content) {
                                window.open(material.content, '_blank');
                              }
                            }}
                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                          >
                            {material.title}
                          </button>
                        ) : (
                          <span className="font-medium text-gray-900">{material.title}</span>
                        )}
                        {material.description && (
                          <p className="text-sm text-gray-500 truncate">{material.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2 text-sm text-gray-600">
                      {materialTypeLabels[material.materialType]}
                    </div>
                    <div className="col-span-2 text-sm text-gray-600">
                      {format(new Date(material.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </div>
                    <div className="col-span-2 text-sm text-gray-600">
                      {material.filesCount > 0 ? formatFileSize(material.totalSize || 0) : '-'}
                    </div>
                    <div className="col-span-1 flex items-center gap-1">
                      {/* Ver detalhes: abre o modal */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedMaterial(material)}
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setMaterialToDelete(material.id);
                          setShowDeleteDialog(true);
                        }}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              {/* Estado vazio */}
              {filteredMaterials.length === 0 && folders.length === 0 && (
                <div className="px-4 py-12 text-center">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum material encontrado
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || selectedType !== 'all' 
                      ? 'Tente ajustar os filtros de busca'
                      : 'Comece criando seu primeiro material didático'
                    }
                  </p>
                  {!searchTerm && selectedType === 'all' && (
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Material
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modais */}
      {showCreateModal && (
        <CreateMaterialModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            refetch();
          }}
          currentFolder={currentFolder}
        />
      )}

      {selectedMaterial && (
        <MaterialDetailModal
          material={selectedMaterial}
          onClose={() => setSelectedMaterial(null)}
          onDelete={() => {
            setMaterialToDelete(selectedMaterial.id);
            setShowDeleteDialog(true);
            setSelectedMaterial(null);
          }}
          showDeleteButton={false}
        />
      )}

      {showDeleteDialog && (
        <PasswordConfirmationDialog
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setMaterialToDelete(null);
          }}
          onConfirm={handleDeleteMaterial}
          title="Confirmar Exclusão"
          message="Digite a senha para confirmar a exclusão do material:"
          isLoading={deleteMaterialMutation.isPending}
        />
      )}
    </div>
  );
}


