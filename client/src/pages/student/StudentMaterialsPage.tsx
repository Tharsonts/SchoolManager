import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  BookOpen, 
  FileText, 
  Video, 
  Link, 
  Edit3, 
  Eye,
  Download,
  ExternalLink,
  Filter,
  Calendar,
  User,
  ArrowLeft,
  Library,
  Folder
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useStudentMaterials, useStudentSubjects } from '@/hooks/useApi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MaterialDetailModal } from '@/components/materials/MaterialDetailModal';

interface Material {
  id: string;
  title: string;
  description: string;
  materialType: 'slide' | 'document' | 'video' | 'link' | 'exercise' | 'other' | 'folder';
  content: string;
  folder?: string;
  isPublic: boolean;
  createdAt: string;
  subjectName: string;
  className: string;
  filesCount: number;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
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
  video: 'VÃ­deo',
  link: 'Link',
  exercise: 'ExercÃ­cio',
  other: 'Outro',
  folder: 'Pasta'
};

export function StudentMaterialsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<string[]>([]);

  const { data: subjectsData = [], isLoading: subjectsLoading } = useStudentSubjects();
  const subjects = Array.isArray(subjectsData) ? subjectsData : [];
  const { data: materials = [], isLoading: materialsLoading } = useStudentMaterials(selectedSubject?.id);

  // FunÃ§Ãµes de navegaÃ§Ã£o de pastas
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
                         material.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtrar por pasta atual
    const matchesFolder = currentFolder === null 
      ? !material.folder // Mostrar materiais na raiz
      : material.folder === currentFolder; // Mostrar materiais da pasta atual
    
    return matchesSearch && matchesFolder;
  });

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

  if (subjectsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Se nÃ£o hÃ¡ disciplinas, mostrar mensagem
  if (subjects.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Library className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma disciplina encontrada
          </h3>
          <p className="text-gray-600">
            VocÃª nÃ£o estÃ¡ matriculado em nenhuma turma com disciplinas ativas.
          </p>
        </div>
      </div>
    );
  }

  // Se uma disciplina estÃ¡ selecionada, mostrar materiais
  if (selectedSubject) {
    return (
      <div>
        <div className="space-y-6">
          {/* Header com botÃ£o voltar */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedSubject(null)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {selectedSubject.name}
              </h1>
              <p className="text-gray-600 mt-1">
                Materiais e conteÃºdos da disciplina
              </p>
            </div>
          </div>

          {/* NavegaÃ§Ã£o de pastas */}
          {(currentFolder || folderPath.length > 0) && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={navigateToRoot}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Folder className="w-4 h-4 mr-1" />
                    Raiz
                  </Button>
                  {folderPath.map((folder, index) => (
                    <React.Fragment key={index}>
                      <span className="text-gray-400">/</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newPath = folderPath.slice(0, index + 1);
                          setFolderPath(newPath);
                          setCurrentFolder(folder);
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Folder className="w-4 h-4 mr-1" />
                        {folder}
                      </Button>
                    </React.Fragment>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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
              </div>
            </CardContent>
          </Card>

          {/* Interface do Explorador de Arquivos */}
          <Card>
            <CardContent className="p-0">
              {/* CabeÃ§alho das Colunas */}
              <div className="border-b bg-gray-50 px-4 py-2">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-600">
                  <div className="col-span-5">Nome</div>
                  <div className="col-span-2">Tipo</div>
                  <div className="col-span-2">Data de modificaÃ§Ã£o</div>
                  <div className="col-span-2">Tamanho</div>
                  <div className="col-span-1">AÃ§Ãµes</div>
                </div>
              </div>

              {/* Lista de Itens */}
              <div className="divide-y">
                {materialsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : (Array.from(new Set(materials.map(m => m.folder).filter(Boolean))).length === 0 && filteredMaterials.length === 0) ? (
                  <div className="px-4 py-12 text-center">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchTerm ? 'Nenhum material encontrado' : 'Nenhum material disponÃ­vel'}
                    </h3>
                    <p className="text-gray-600">
                      {searchTerm 
                        ? 'Tente ajustar os termos de busca'
                        : 'Ainda nÃ£o hÃ¡ materiais postados para esta disciplina'
                      }
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Mostrar pastas disponÃ­veis na pasta atual */}
                    {currentFolder === null && (
                      <>
                        {Array.from(new Set(materials.map(m => m.folder).filter(Boolean))).map((folderName) => {
                          const folderMaterials = materials.filter(m => m.folder === folderName);
                          return (
                            <div
                              key={`folder-${folderName}`}
                              className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 transition-colors items-center cursor-pointer"
                              onClick={() => navigateToFolder(folderName!)}
                            >
                              <div className="col-span-5 flex items-center gap-3">
                                <Folder className="w-5 h-5 text-blue-600" />
                                <div className="flex-1">
                                  <span className="font-medium text-gray-900">{folderName}</span>
                                  <p className="text-sm text-gray-500 truncate">
                                    Pasta com {folderMaterials.length} material(is)
                                  </p>
                                </div>
                              </div>
                              <div className="col-span-2 text-sm text-gray-600">
                                Pasta
                              </div>
                              <div className="col-span-2 text-sm text-gray-600">
                                -
                              </div>
                              <div className="col-span-2 text-sm text-gray-600">
                                {folderMaterials.length} item(ns)
                              </div>
                              <div className="col-span-1 flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigateToFolder(folderName!);
                                  }}
                                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                  title="Abrir pasta"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                    
                    {/* Mostrar materiais da pasta atual */}
                    {filteredMaterials.map((material: Material) => {
                      const IconComponent = materialTypeIcons[material.materialType];
                      
                      return (
                        <div
                          key={material.id}
                          className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 transition-colors items-center"
                        >
                          <div className="col-span-5 flex items-center gap-3">
                            <IconComponent className="w-5 h-5 text-purple-600" />
                            <div className="flex-1">
                              <span className="font-medium text-gray-900">{material.title}</span>
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
                            {material.filesCount > 0 ? `${material.filesCount} arquivo(s)` : '-'}
                          </div>
                          <div className="col-span-1 flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedMaterial(material)}
                              className="h-8 w-8 p-0"
                              title="Visualizar"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {material.filesCount > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // Baixar todos os arquivos do material
                                  window.open(`/api/materials/${material.id}/download`, '_blank');
                                }}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                title="Baixar arquivos"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* EstatÃ­sticas */}
          {materials.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {materials.length}
                    </div>
                    <div className="text-sm text-gray-600">Total de Materiais</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {materials.reduce((acc: number, m: Material) => acc + m.filesCount, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Arquivos</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Modal de Detalhes */}
        {selectedMaterial && (
          <MaterialDetailModal
            material={selectedMaterial}
            onClose={() => setSelectedMaterial(null)}
            onDelete={() => setSelectedMaterial(null)}
            showDeleteButton={false}
          />
        )}
      </div>
    );
  }

  // Tela principal - mostrar disciplinas em cards
  return (
    <div>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Materiais DidÃ¡ticos</h1>
          <p className="text-gray-600 mt-1">
            Selecione uma disciplina para acessar os materiais
          </p>
        </div>

        {/* Cards de Disciplinas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject: Subject) => (
            <Card 
              key={subject.id} 
              className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-purple-300"
              onClick={() => setSelectedSubject(subject)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <BookOpen className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{subject.name}</CardTitle>
                    {subject.code && (
                      <p className="text-sm text-gray-500 mt-1">
                        CÃ³digo: {subject.code}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {subject.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {subject.description}
                  </p>
                )}
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => setSelectedSubject(subject)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Materiais
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* EstatÃ­sticas Gerais */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {subjects.length}
                </div>
                <div className="text-sm text-gray-600">Disciplinas DisponÃ­veis</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {subjects.length > 0 ? 'Ativo' : 'Inativo'}
                </div>
                <div className="text-sm text-gray-600">Status da MatrÃ­cula</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default StudentMaterialsPage;
