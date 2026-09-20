import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CreateButton from '@/components/ui/create-button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus,
  Search,
  Edit,
  Eye,
  Trash2,
  GraduationCap,
  Users,
  BookOpen,
  User,
  Mail,
  Calendar,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdminClasses, useCreateClass, useDeleteClass, useUpdateClass, useCheckClassDependencies, useClassDetails } from '@/hooks/useAdminApi';
import { PasswordConfirmationDialog } from '@/components/ui/PasswordConfirmationDialog';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

// Componente para o conteúdo detalhado da turma
const ClassDetailsContent = ({ classId }: { classId: string }) => {
  const { data: classDetails, isLoading } = useClassDetails(classId);
  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'subjects'>('students');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['students', 'teachers', 'subjects']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!classDetails) {
    return (
      <div className="text-center py-12 text-gray-500">
        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
        <p>Erro ao carregar detalhes da turma</p>
      </div>
    );
  }

  const { class: classInfo, students, teachers, subjects, stats } = classDetails;

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{classInfo.name}</h3>
            <p className="text-gray-600">Ano Letivo {classInfo.academicYear}</p>
          </div>
          <Badge className={classInfo.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
            {classInfo.status === 'active' ? 'Ativa' : 'Inativa'}
          </Badge>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.totalStudents}</div>
            <div className="text-sm text-gray-600">Alunos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalTeachers}</div>
            <div className="text-sm text-gray-600">Professores</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.totalSubjects}</div>
            <div className="text-sm text-gray-600">Disciplinas</div>
          </div>
        </div>
      </div>

      {/* Seletor de Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('students')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'students'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="h-4 w-4 inline mr-2" />
          Alunos ({stats.totalStudents})
        </button>
        <button
          onClick={() => setActiveTab('teachers')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'teachers'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <User className="h-4 w-4 inline mr-2" />
          Professores ({stats.totalTeachers})
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'subjects'
              ? 'bg-white text-green-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <BookOpen className="h-4 w-4 inline mr-2" />
          Disciplinas ({stats.totalSubjects})
        </button>
      </div>

      {/* Conteúdo das Tabs */}
      <div className="min-h-[400px]">
        {activeTab === 'students' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Lista de Alunos
              </h4>
              <Badge variant="outline" className="text-purple-600 border-purple-300">
                {students.length} aluno(s)
              </Badge>
            </div>
            
            {students.length > 0 ? (
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {students.map((student: any) => (
                  <div key={student.id} className="group relative overflow-hidden border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-purple-600" />
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                            {student.firstName[0]}{student.lastName[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-semibold text-gray-900 truncate">
                                {student.firstName} {student.lastName}
                              </h5>
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                {student.status === 'active' ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                <span className="truncate">{student.email}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>Matrícula: {student.registrationNumber}</span>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Matriculado em: {new Date(student.enrollmentDate).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm font-medium">Nenhum aluno matriculado</p>
                <p className="text-xs text-gray-400 mt-1">Os alunos aparecerão aqui quando forem matriculados na turma</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'teachers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Professores da Turma
              </h4>
              <Badge variant="outline" className="text-blue-600 border-blue-300">
                {teachers.length} professor(es)
              </Badge>
            </div>
            
            {teachers.length > 0 ? (
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {teachers.map((teacher: any) => (
                  <div key={teacher.id} className="group relative overflow-hidden border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-600" />
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                            {teacher.firstName[0]}{teacher.lastName[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-semibold text-gray-900 truncate">
                                {teacher.firstName} {teacher.lastName}
                              </h5>
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                {teacher.status === 'active' ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Mail className="w-3 h-3" />
                              <span className="truncate">{teacher.email}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm font-medium">Nenhum professor atribuído</p>
                <p className="text-xs text-gray-400 mt-1">Os professores aparecerão aqui quando forem atribuídos às disciplinas</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-green-600" />
                Disciplinas da Turma
              </h4>
              <Badge variant="outline" className="text-green-600 border-green-300">
                {subjects.length} disciplina(s)
              </Badge>
            </div>
            
            {subjects.length > 0 ? (
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {subjects.map((subject: any) => (
                  <div key={subject.subjectId} className="group relative overflow-hidden border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 to-green-600" />
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-semibold text-sm">
                            {subject.subjectCode}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-semibold text-gray-900 truncate">
                                {subject.subjectName}
                              </h5>
                              <Badge variant="secondary" className="text-xs">
                                {subject.subjectCode}
                              </Badge>
                            </div>
                            {subject.teacherEmail ? (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Mail className="w-3 h-3" />
                                <span className="truncate">{subject.teacherEmail}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-sm text-orange-600">
                                <AlertCircle className="w-3 h-3" />
                                <span>Nenhum professor atribuído</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {subject.teacherEmail ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-orange-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm font-medium">Nenhuma disciplina vinculada</p>
                <p className="text-xs text-gray-400 mt-1">As disciplinas aparecerão aqui quando forem criadas e vinculadas à turma</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface Class {
  id: string;
  name: string;
  grade: string;
  section: string;
  academicYear: string;
  capacity: number;
  currentStudents: number;
  subjectsCount: number;
  status: 'active' | 'inactive' | 'closed';
  coordinatorId?: string;
  createdAt: string;
  updatedAt: string;
}

const ClassesPage = () => {
  const { data: classesData, isLoading, error } = useAdminClasses();
  const classes = classesData?.data || [];
  const createClassMutation = useCreateClass();
  const updateClassMutation = useUpdateClass();
  const deleteClassMutation = useDeleteClass();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  
  // Hook para buscar detalhes da turma selecionada
  const { data: classDetailsData, isLoading: detailsLoading } = useClassDetails(selectedClass?.id);
  const classDetails = classDetailsData?.data;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<Class | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isDependenciesDialogOpen, setIsDependenciesDialogOpen] = useState(false);
  const [dependenciesData, setDependenciesData] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    section: '',
    academicYear: '',
    capacity: 30,
    status: 'active' as 'active' | 'inactive' | 'closed'
  });

  // Contagens reais por turma (alunos e disciplinas)
  const [accurateCounts, setAccurateCounts] = useState<Record<string, { students: number; subjects: number }>>({});

  useEffect(() => {
    if (!classes || classes.length === 0) return;
    let cancelled = false;
  
    (async () => {
      try {
        const results = await Promise.all(classes.map(async (cls: any) => {
          const res = await fetch(`/api/admin/classes/${cls.id}/details`, { credentials: 'include' });
          if (!res.ok) return { id: cls.id, students: cls.currentStudents ?? 0, subjects: cls.subjectsCount ?? 0 };
          const data = await res.json();
          const studentsCount = Array.isArray(data?.students) ? data.students.length : (cls.currentStudents ?? 0);
          const subjectsCount = Array.isArray(data?.subjects) ? new Set((data.subjects as any[]).map((s: any) => s.subjectId)).size : (cls.subjectsCount ?? 0);
          return { id: cls.id, students: studentsCount, subjects: subjectsCount };
        }));
  
        if (cancelled) return;
        const map: Record<string, { students: number; subjects: number }> = {};
        results.forEach(r => { map[r.id] = { students: r.students, subjects: r.subjects }; });
        setAccurateCounts(map);
      } catch (err) {
        console.error('Erro ao carregar contagens precisas das turmas:', err);
      }
    })();
  
    return () => { cancelled = true; };
  }, [classes]);

  // Escutar notificações de atualização de professores
  useEffect(() => {
    const handleTeacherUpdate = () => {
      console.log('🔄 Professor criado/atualizado, atualizando turmas...');
      // Invalidar cache do React Query para forçar refresh
      window.location.reload();
    };

    // Escutar eventos customizados
    window.addEventListener('teacherCreated', handleTeacherUpdate);
    
    // Verificar localStorage para atualizações perdidas
    const checkForUpdates = () => {
      const lastUpdate = localStorage.getItem('lastTeacherUpdate');
      if (lastUpdate) {
        const updateTime = parseInt(lastUpdate);
        const now = Date.now();
        // Se a atualização foi feita nos últimos 30 segundos, atualizar
        if (now - updateTime < 30000) {
          console.log('🔄 Atualização de professor detectada, atualizando turmas...');
          window.location.reload();
        }
      }
    };

    // Verificar a cada 5 segundos
    const interval = setInterval(checkForUpdates, 5000);
    
    // Verificar imediatamente
    checkForUpdates();

    return () => {
      window.removeEventListener('teacherCreated', handleTeacherUpdate);
      clearInterval(interval);
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'closed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'inactive': return 'Inativa';
      case 'closed': return 'Fechada';
      default: return 'Desconhecido';
    }
  };

  const filteredClasses = classes.filter(classItem => {
    const matchesSearch = classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classItem.grade.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || classItem.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });



  const handleEditClass = (classItem: Class) => {
    setSelectedClass(classItem);
    setFormData({
      name: classItem.name,
      grade: classItem.grade,
      section: classItem.section,
      academicYear: classItem.academicYear,
      capacity: classItem.capacity,
      status: classItem.status
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateClass = async () => {
    if (!selectedClass) return;

    if (!formData.name) {
      toast.error('Preencha o nome da turma');
      return;
    }

    updateClassMutation.mutate({
      classId: selectedClass.id,
      classData: {
        name: formData.name,
        grade: formData.grade,
        section: formData.section,
        academicYear: formData.academicYear,
        capacity: formData.capacity,
        status: formData.status
      }
    }, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setSelectedClass(null);
        toast.success('Turma atualizada com sucesso!');
      }
    });
  };

  const handleDeleteClass = async (classItem: Class) => {
    setClassToDelete(classItem);
    
    try {
      // Verificar dependências
      const response = await fetch(`/api/classes/${classItem.id}/dependencies`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.hasDependencies) {
          // Tem vínculos - mostrar modal com dependências
          setDependenciesData(data);
          setIsDependenciesDialogOpen(true);
        } else {
          // Sem vínculos - exclusão simples
          setIsPasswordDialogOpen(true);
        }
      } else {
        // Erro na verificação - usar exclusão simples
        setIsPasswordDialogOpen(true);
      }
    } catch (error) {
      console.error('Erro ao verificar dependências:', error);
      // Em caso de erro, usar exclusão simples
      setIsPasswordDialogOpen(true);
    }
  };

  const confirmDeleteClass = async (password: string, confirmText?: string) => {
    if (!classToDelete) return;
    
    try {
      await deleteClassMutation.mutateAsync({ 
        id: classToDelete.id, 
        password: password,
        confirmText: confirmText
      });
      setIsPasswordDialogOpen(false);
      setIsDependenciesDialogOpen(false);
      setClassToDelete(null);
      setDependenciesData(null);
      toast.success('Turma excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir turma:', error);
      toast.error('Erro ao excluir turma. Verifique sua senha.');
    }
  };

  const handleCreateClass = async () => {
    if (!formData.grade || !formData.section) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Gerar nome da turma automaticamente
    const gradeNumber = parseInt(formData.grade);
    const gradeText = isNaN(gradeNumber) ? formData.grade : `${gradeNumber}º`;
    const className = `${gradeText} ${formData.section}`;

    createClassMutation.mutate({
      name: className,
      grade: formData.grade,
      section: formData.section,
      academicYear: '2024',
      capacity: 30
    }, {
      onSuccess: () => {
        // Limpar formulário
        setFormData({
          grade: '',
          section: ''
        });
        
        setIsCreateDialogOpen(false);
      }
    });
  };

  const handleViewClass = (classItem: Class) => {
    setSelectedClass(classItem);
    setIsViewDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Turmas</h1>
          <p className="text-gray-600 mt-1">Crie e gerencie turmas da escola</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <CreateButton loading={createClassMutation.isPending}>
              Nova Turma
            </CreateButton>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Nova Turma</DialogTitle>
              <DialogDescription>
                Preencha apenas a série e seção. Nome, ano letivo e capacidade serão definidos automaticamente.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="grade">Série/Ano *</Label>
                  <Input
                    id="grade"
                    placeholder="Ex: 8"
                    value={formData.grade}
                    onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="section">Seção *</Label>
                  <Input
                    id="section"
                    placeholder="Ex: C"
                    value={formData.section}
                    onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <CreateButton 
                onClick={handleCreateClass} 
                loading={createClassMutation.isPending}
                size="md"
              >
                {createClassMutation.isPending ? 'Criando...' : 'Criar Turma'}
              </CreateButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Buscar turmas..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="inactive">Inativas</SelectItem>
                <SelectItem value="closed">Fechadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card className="border border-gray-200">
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Carregando turmas...</h3>
            <p className="text-gray-600">Aguarde enquanto buscamos as turmas do sistema.</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border border-red-200">
          <CardContent className="text-center py-12">
            <div className="text-red-500 mb-4">
              <GraduationCap className="h-12 w-12 mx-auto mb-2" />
            </div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Erro ao carregar turmas</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button 
              className="bg-red-600 hover:bg-red-700"
              onClick={() => window.location.reload()}
            >
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Classes List */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((classItem) => (
          <Card key={classItem.id} className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{classItem.name}</CardTitle>
                  <p className="text-sm text-gray-500">{classItem.grade} • {classItem.section}</p>
                </div>
                <Badge className={getStatusColor(classItem.status)}>
                  {getStatusText(classItem.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                  <div className="text-lg font-semibold text-blue-600">{(accurateCounts[classItem.id]?.students ?? classItem.currentStudents ?? 0)}</div>
                  <div className="text-xs text-blue-600">alunos</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <BookOpen className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <div className="text-lg font-semibold text-green-600">{(accurateCounts[classItem.id]?.subjects ?? classItem.subjectsCount ?? 0)}</div>
                  <div className="text-xs text-green-600">disciplinas</div>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <strong>Ano Letivo:</strong> {classItem.academicYear}
              </div>

              <div className="text-sm text-gray-500">
                <strong>Criada em:</strong> {classItem.createdAt ? new Date(classItem.createdAt).toLocaleDateString('pt-BR') : 'Data não disponível'}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleViewClass(classItem)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleEditClass(classItem)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleDeleteClass(classItem)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredClasses.length === 0 && (
        <Card className="border border-gray-200">
          <CardContent className="text-center py-12">
            <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma turma encontrada</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando sua primeira turma'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <Button 
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Turma
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* View Class Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-purple-600" />
              Detalhes da Turma
            </DialogTitle>
            <DialogDescription>
              Informações completas sobre a turma, alunos, professores e disciplinas
            </DialogDescription>
          </DialogHeader>
          
          {selectedClass && (
            <ClassDetailsContent classId={selectedClass.id} />
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Class Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Turma</DialogTitle>
            <DialogDescription>
              Atualize os dados da turma {selectedClass?.name}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-name">Nome da Turma *</Label>
              <Input
                id="edit-name"
                placeholder="Ex: 5º A"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
          </div>
            
            <div className="grid grid-cols-2 gap-4">
            
              <div>
                <Label htmlFor="edit-academicYear">Ano Letivo</Label>
                <Input
                  id="edit-academicYear"
                  placeholder="Ex: 2024"
                  value={formData.academicYear}
                  onChange={(e) => setFormData(prev => ({ ...prev, academicYear: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-capacity">Capacidade</Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  min="1"
                  max="50"
                  placeholder="30"
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 30 }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'active' | 'inactive' | 'closed' }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="inactive">Inativa</SelectItem>
                    <SelectItem value="closed">Fechada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateClass} 
              className="bg-purple-600 hover:bg-purple-700"
              disabled={updateClassMutation.isPending}
            >
              {updateClassMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Dependências */}
      <Dialog open={isDependenciesDialogOpen} onOpenChange={setIsDependenciesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">⚠️ Exclusão com Vínculos</DialogTitle>
            <DialogDescription>
              Esta turma possui vínculos no sistema que serão removidos:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            {dependenciesData?.dependencies.students > 0 && (
              <div className="flex justify-between">
                <span>Alunos matriculados:</span>
                <span className="font-semibold">{dependenciesData.dependencies.students}</span>
              </div>
            )}
            {dependenciesData?.dependencies.subjects > 0 && (
              <div className="flex justify-between">
                <span>Disciplinas vinculadas:</span>
                <span className="font-semibold">{dependenciesData.dependencies.subjects}</span>
              </div>
            )}
            {dependenciesData?.dependencies.activities > 0 && (
              <div className="flex justify-between">
                <span>Atividades:</span>
                <span className="font-semibold">{dependenciesData.dependencies.activities}</span>
              </div>
            )}
            {dependenciesData?.dependencies.exams > 0 && (
              <div className="flex justify-between">
                <span>Provas:</span>
                <span className="font-semibold">{dependenciesData.dependencies.exams}</span>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDependenciesDialogOpen(false);
                setClassToDelete(null);
                setDependenciesData(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                setIsDependenciesDialogOpen(false);
                setIsPasswordDialogOpen(true);
              }}
            >
              Continuar com Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PasswordConfirmationDialog
        isOpen={isPasswordDialogOpen}
        onClose={() => {
          setIsPasswordDialogOpen(false);
          setClassToDelete(null);
        }}
        onConfirm={(password) => {
          // Se tem dependências, precisa do confirmText
          if (dependenciesData?.hasDependencies) {
            // Mostrar campo adicional para "confirmar"
            const confirmText = prompt('Digite "confirmar" para prosseguir com a exclusão:');
            if (confirmText === 'confirmar') {
              confirmDeleteClass(password, confirmText);
            } else if (confirmText !== null) {
              toast.error('Digite exatamente "confirmar" para prosseguir');
            }
          } else {
            confirmDeleteClass(password);
          }
        }}
        title="Excluir Turma"
        description="Para excluir esta turma, confirme sua senha de administrador."
        itemName={classToDelete?.name}
        isLoading={deleteClassMutation.isPending}
        confirmText="Excluir"
        cancelText="Cancelar"
      />

    </div>
  );
};

export default ClassesPage;
