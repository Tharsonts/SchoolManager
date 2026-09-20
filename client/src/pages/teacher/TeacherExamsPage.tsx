import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Calendar, 
  Plus, 
  BookOpen, 
  Users, 
  FileText, 
  Eye, 
  Edit, 
  Trash2,
  Clock,
  TrendingUp,
  BarChart3,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  Target,
  Award,
  GraduationCap,
  Filter,
  Search,
  Download,
  Upload
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTeacherExams, useCreateExam, useDeleteExam, useClassStudents, useExamDetails, useUpdateExamGrades } from '@/hooks/useApi';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import SimpleGradesModal from '@/components/exams/SimpleGradesModal';

interface Exam {
  id: string;
  title: string;
  description?: string;
  examDate: string;
  duration?: number;
  totalPoints: number;
  semester: string;
  bimonthly: string;
  status: string;
  subjectName?: string;
  className?: string;
  subjectId: string;
  classId: string;
}

export default function TeacherExamsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGradesModal, setShowGradesModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [examToDelete, setExamToDelete] = useState<string | null>(null);
  const [examGrades, setExamGrades] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<{ year: string; bimonthly: string } | null>(null);

  const createExamMutation = useCreateExam();
  const deleteExamMutation = useDeleteExam();
  const updateGradesMutation = useUpdateExamGrades();
  const queryClient = useQueryClient();

  const { data: currentPeriodResponse } = useQuery({
    queryKey: ['current-period'],
    queryFn: async () => {
      const res = await fetch('/api/periods/current', { credentials: 'include' });
      if (!res.ok) throw new Error('Erro ao buscar período atual');
      return res.json();
    }
  });
  const currentPeriod = currentPeriodResponse?.data || null;

  const { data: allPeriodsResponse } = useQuery({
    queryKey: ['all-periods'],
    queryFn: async () => {
      const res = await fetch('/api/periods/all', { credentials: 'include' });
      if (!res.ok) throw new Error('Erro ao buscar períodos');
      return res.json();
    }
  });
  const allPeriods = (allPeriodsResponse?.data || []) as any[];
  const parsePeriod = (p: any) => {
    const name: string = String(p?.name || '');
    const m = name.match(/(\d+)\D*Bimestre\s*(\d{4})/i);
    const year = m ? m[2] : (p?.academicYear ? String(p.academicYear) : (p?.startDate ? String(new Date(p.startDate).getFullYear()) : ''));
    const bimonthly = m ? m[1] : (p?.period ? String(p.period) : '');
    return { year, bimonthly, name };
  };
  const periodFilterOptions = (() => {
    const parsed = allPeriods.map(parsePeriod).filter((opt: any) => opt.year && opt.bimonthly);
    if (parsed.length > 0) return parsed.sort((a: any, b: any) => {
      if (a.year !== b.year) return Number(b.year) - Number(a.year);
      return Number(a.bimonthly) - Number(b.bimonthly);
    });
    const fallbackYear = String(currentPeriod?.academicYear || new Date().getFullYear());
    return ['1','2','3','4'].map((b) => ({ year: fallbackYear, bimonthly: b, name: `${b}º Bimestre ${fallbackYear}` }));
  })();

  const { data: examsData } = useTeacherExams(user?.id);
  
  // Hook para marcar prova como concluída
  const completeExamMutation = useMutation({
    mutationFn: async (examId: string) => {
      const response = await fetch(`/api/exams/${examId}/complete`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao marcar prova como concluída');
      }
      
      return response.json();
    },
    onSuccess: (data, examId) => {
      toast.success('Prova marcada como concluída com sucesso!');
      // Invalidar a query para recarregar os dados
      queryClient.invalidateQueries({ queryKey: ['teacher-exams', user?.id] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao marcar prova como concluída');
    },
  });
  
  // Buscar detalhes da prova selecionada
  const { data: examDetailsData } = useExamDetails(selectedExam?.id);

  // Hook personalizado para buscar turmas do professor
  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ['teacher-classes-custom', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const response = await fetch(`/api/teacher/${user.id}/classes`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar turmas');
      }
      
      const data = await response.json();
      console.log('🔍 Dados recebidos das turmas:', data);
      
      // O endpoint /api/teacher/:teacherId/classes retorna {data: [...]}
      const classesArray = data.data || data;
      
      if (Array.isArray(classesArray)) {
        // Criar lista única de turmas (sem duplicatas)
        const uniqueClasses = classesArray.reduce((acc: any[], item: any) => {
          const existingClass = acc.find(cls => cls.id === item.classId);
          if (!existingClass) {
            acc.push({
              id: item.classId,
              name: item.className || item.name || 'Turma sem nome',
              grade: item.grade || '-'
            });
          }
          return acc;
        }, []);
        console.log('🏫 Turmas processadas:', uniqueClasses);
        return uniqueClasses;
      }
      
      console.log('🚨 Formato de dados não esperado:', data);
      
      // FALLBACK: Dados temporários para teste
      console.log('🔧 Usando dados temporários para teste...');
      return [
        { id: 'class1', name: '9º F', grade: '9' },
        { id: 'class2', name: '9º Ano A', grade: '9' },
        { id: 'class3', name: '8º D', grade: '8' }
      ];
    },
    enabled: !!user?.id,
    retry: 2
  });

  // Hook personalizado para buscar disciplinas do professor
  const { data: subjectsData, isLoading: subjectsLoading } = useQuery({
    queryKey: ['teacher-subjects-custom', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const response = await fetch(`/api/teacher/${user.id}/subjects`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar disciplinas');
      }
      
      const data = await response.json();
      console.log('🔍 Dados recebidos das disciplinas:', data);
      
      // Verificar se retorna formato success/data
      const subjectsArray = data.success ? data.data : data;
      
      // Retornar dados no formato simples esperado
      if (Array.isArray(subjectsArray)) {
        // Criar lista única de disciplinas (sem duplicatas)
        const uniqueSubjects = subjectsArray.reduce((acc: any[], item: any) => {
          const existingSubject = acc.find(subj => subj.id === item.subjectId);
          if (!existingSubject) {
            acc.push({
              id: item.subjectId,
              name: item.subjectName
            });
          }
          return acc;
        }, []);
        
        console.log('📚 Disciplinas processadas:', uniqueSubjects);
        return uniqueSubjects;
      }
      
      console.log('🚨 Formato de dados de disciplinas não esperado:', data);
      
      // FALLBACK: Dados temporários para teste
      console.log('🔧 Usando dados temporários para disciplinas...');
      return [
        { id: 'subj1', name: 'Matemática' },
        { id: 'subj2', name: 'Português' },
        { id: 'subj4', name: 'Ciências' }
      ];
    },
    enabled: !!user?.id,
    retry: 2
  });

  // Garantir que os dados são arrays
  const exams = Array.isArray(examsData) ? examsData : [];
  const classes = Array.isArray(classesData) ? classesData : [];
  const subjects = Array.isArray(subjectsData) ? subjectsData : [];

  // Debug dos dados finais
  console.log('🔍 DADOS FINAIS - Professor ID:', user?.id);
  console.log('🏫 Classes finais:', classes);
  console.log('📚 Subjects finais:', subjects);
  console.log('📋 Exams finais:', exams);

  // Estados do formulário de criação
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    classId: '',
    examDate: '',
    duration: '',
    totalPoints: 10,
    semester: '1',
    bimonthly: '1'
  });

  const activeBimonthly = selectedFilter?.bimonthly || (currentPeriod ? String(currentPeriod.period || '') : '');
  const activeYear = selectedFilter?.year || (currentPeriod ? String(currentPeriod.academicYear || '') : '');
  const filteredExams = exams.filter((exam: Exam) => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.subjectName?.toLowerCase().includes(searchTerm.toLowerCase());
    const examYear = new Date(exam.examDate).getFullYear().toString();
    const matchesPeriod = activeBimonthly && activeYear ? (exam.bimonthly === String(activeBimonthly) && examYear === String(activeYear)) : true;
    return matchesSearch && matchesPeriod;
  });

  // Estatísticas
  const totalExams = exams.length;
  const completedExams = exams.filter((exam: Exam) => exam.status === 'completed').length;
  const scheduledExams = exams.filter((exam: Exam) => exam.status === 'scheduled').length;
  const averagePoints = exams.length > 0 ? exams.reduce((sum, exam) => sum + exam.totalPoints, 0) / exams.length : 0;

  // Obter dados da disciplina selecionada
  const selectedSubjectData = subjects.find((subject: any) => subject.id === selectedSubject);

  // Auto-selecionar disciplina se houver apenas uma
  useEffect(() => {
    if (subjects.length === 1 && !selectedSubject) {
      setSelectedSubject(subjects[0].id);
    }
  }, [subjects, selectedSubject]);

  // Auto-selecionar turma se houver apenas uma
  useEffect(() => {
    if (classes.length === 1 && !formData.classId) {
      setFormData(prev => ({
        ...prev,
        classId: classes[0].id
      }));
    }
  }, [classes, formData.classId]);

  useEffect(() => {
    if (showCreateModal && currentPeriod) {
      setFormData(prev => ({
        ...prev,
        bimonthly: String(currentPeriod.period || '1')
      }));
    }
  }, [showCreateModal, currentPeriod]);

  // Carregar notas quando o modal de notas abrir
  useEffect(() => {
    if (showGradesModal && selectedExam && examDetailsData?.grades) {
      console.log('📊 Carregando notas da prova:', examDetailsData);
      setExamGrades(examDetailsData.grades);
    }
  }, [showGradesModal, selectedExam, examDetailsData]);

  const handleCreateExam = async () => {
    try {
      await createExamMutation.mutateAsync({
        ...formData,
        subjectId: formData.subjectId || selectedSubject || '',
        duration: formData.duration ? parseInt(formData.duration) : null,
        totalPoints: parseFloat(formData.totalPoints.toString()),
        bimonthly: String(formData.bimonthly || currentPeriod?.period || '1')
      });
      
      toast.success('Prova criada com sucesso!');
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        subjectId: selectedSubject || '',
        classId: '',
        examDate: '',
        duration: '',
        totalPoints: 10,
        semester: '1',
        bimonthly: String(formData.bimonthly || currentPeriod?.period || '1')
      });
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao criar prova');
    }
  };

  const handleDeleteExam = async () => {
    if (!examToDelete) return;
    
    try {
      await deleteExamMutation.mutateAsync(examToDelete);
      toast.success('Prova excluída com sucesso!');
      setShowDeleteDialog(false);
      setExamToDelete(null);
    } catch (error) {
      toast.error('Erro ao excluir prova');
    }
  };

  const handleViewExam = (exam: Exam) => {
    setSelectedExam(exam);
    setShowGradesModal(true);
  };

  const handleCompleteExam = async (examId: string) => {
    console.log('🎯 Tentando marcar prova como concluída:', examId);
    try {
      await completeExamMutation.mutateAsync(examId);
    } catch (error) {
      console.error('❌ Erro ao marcar prova como concluída:', error);
      // Erro já é tratado no onError do mutation
    }
  };


  const handleSaveAllGrades = async () => {
    try {
      if (!selectedExam) return;

      // Filtrar apenas notas que foram preenchidas
      const gradesToSave = examGrades.filter(grade => 
        grade.grade !== null && 
        grade.grade !== '' && 
        grade.grade !== '0.0' &&
        parseFloat(grade.grade) > 0
      );

      console.log('📊 Notas para salvar:', gradesToSave);

      if (gradesToSave.length === 0) {
        toast.error('Nenhuma nota válida para salvar');
        return;
      }

      const response = await fetch(`/api/exams/${selectedExam.id}/grades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grades: gradesToSave.map(grade => ({
            studentId: grade.studentId,
            grade: parseFloat(grade.grade),
            observations: grade.observations || '',
            isPresent: grade.isPresent
          }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar notas');
      }

      const result = await response.json();
      console.log('✅ Resposta do servidor:', result);

      toast.success(`${gradesToSave.length} notas salvas com sucesso!`);
      
      // Recarregar dados da prova
      window.location.reload();

    } catch (error) {
      toast.error('Erro ao salvar notas');
      console.error('Erro:', error);
    }
  };

  const getBimonthlyLabel = (bimonthly: string) => {
    const labels = { '1': '1º Bimestre', '2': '2º Bimestre', '3': '3º Bimestre', '4': '4º Bimestre' };
    return labels[bimonthly as keyof typeof labels] || bimonthly;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Clock className="w-3 h-3 mr-1" />Agendada</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Concluída</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><AlertCircle className="w-3 h-3 mr-1" />Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com Estatísticas */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sistema de Provas</h1>
          <p className="text-gray-600 mt-1">
            Gerencie provas, controle notas e acompanhe o desempenho por bimestre
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova Prova
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Provas</p>
                <p className="text-2xl font-bold text-gray-900">{totalExams}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Concluídas</p>
                <p className="text-2xl font-bold text-green-600">{completedExams}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Agendadas</p>
                <p className="text-2xl font-bold text-orange-600">{scheduledExams}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pontuação Média</p>
                <p className="text-2xl font-bold text-purple-600">{averagePoints.toFixed(1)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4" />
          <span className="font-medium text-gray-700">Período atual:</span>
          <Badge variant="secondary" className="text-xs">
            {currentPeriod?.name || 'Nenhum período ativo'}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar provas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-gray-200">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Período</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSelectedFilter(null)}>
                Período Atual
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {periodFilterOptions.map((opt: any) => (
                  <DropdownMenuItem key={`${opt.year}-${opt.bimonthly}`} onClick={() => setSelectedFilter({ year: opt.year, bimonthly: opt.bimonthly })}>
                    {opt.name || `${getBimonthlyLabel(String(opt.bimonthly))} ${opt.year}`}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabela de Provas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Provas do {selectedFilter ? `${getBimonthlyLabel(String(selectedFilter.bimonthly))} ${selectedFilter.year}` : (currentPeriod?.name || 'Período')}
              <Badge variant="secondary" className="ml-2">
                {filteredExams.length} prova(s)
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Importar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredExams.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma prova encontrada
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm 
                  ? 'Tente ajustar os termos de busca'
                  : `Não há provas agendadas no período atual`
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Prova
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-900">Prova</th>
                    <th className="text-left p-4 font-semibold text-gray-900">Disciplina</th>
                    <th className="text-center p-4 font-semibold text-gray-900">Data</th>
                    <th className="text-center p-4 font-semibold text-gray-900">Duração</th>
                    <th className="text-center p-4 font-semibold text-gray-900">Pontos</th>
                    <th className="text-center p-4 font-semibold text-gray-900">Status</th>
                    <th className="text-center p-4 font-semibold text-gray-900">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredExams.map((exam: Exam) => (
                    <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">{exam.title}</h3>
                          {exam.description && (
                            <p className="text-sm text-gray-500 line-clamp-2">{exam.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="font-medium text-gray-900">{exam.subjectName}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-medium text-gray-900">
                            {format(new Date(exam.examDate), 'dd/MM', { locale: ptBR })}
                          </span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(exam.examDate), 'yyyy', { locale: ptBR })}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {exam.duration ? (
                          <div className="flex items-center justify-center gap-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{exam.duration}min</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Target className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{exam.totalPoints}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                        {getStatusBadge(exam.status)}
                          {exam.status !== 'completed' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 px-2 text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300"
                              onClick={() => handleCompleteExam(exam.id)}
                              disabled={completeExamMutation.isPending}
                              title="Marcar como concluída"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Concluir
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleViewExam(exam)}
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Editar">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setExamToDelete(exam.id);
                              setShowDeleteDialog(true);
                            }}
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Footer da Tabela */}
          {filteredExams.length > 0 && (
            <div className="border-t bg-gray-50 px-6 py-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-6">
                  <span>Total: {filteredExams.length} prova(s)</span>
                  <span>•</span>
                  <span>
                    Agendadas: {filteredExams.filter((exam: Exam) => exam.status === 'scheduled').length}
                  </span>
                  <span>•</span>
                  <span>
                    Concluídas: {filteredExams.filter((exam: Exam) => exam.status === 'completed').length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    Última atualização: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Criação */}
      {showCreateModal && (
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Prova</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título da Prova *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Prova de Matemática - Bimestre 1"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição da prova (opcional)"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subjectId">Disciplina *</Label>
                  <Select 
                    value={formData.subjectId || selectedSubject || ''} 
                    onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a disciplina" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectsLoading ? (
                        <SelectItem value="" disabled>Carregando...</SelectItem>
                      ) : subjects.length > 0 ? (
                        subjects.map((subject: any) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>Nenhuma disciplina encontrada</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="classId">Turma *</Label>
                  <Select value={formData.classId} onValueChange={(value) => setFormData({ ...formData, classId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a turma" />
                    </SelectTrigger>
                    <SelectContent>
                      {classesLoading ? (
                        <SelectItem value="" disabled>Carregando...</SelectItem>
                      ) : classes.length > 0 ? (
                        classes.map((classItem: any) => (
                        <SelectItem key={classItem.id} value={classItem.id}>
                          {classItem.name}
                        </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>Nenhuma turma encontrada</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="examDate">Data da Prova *</Label>
                  <Input
                    id="examDate"
                    type="date"
                    min={currentPeriod?.startDate || undefined}
                    max={currentPeriod?.endDate || undefined}
                    value={formData.examDate}
                    onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="duration">Duração (minutos)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="Ex: 90"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalPoints">Pontuação Total *</Label>
                  <Input
                    id="totalPoints"
                    type="number"
                    min={0.5}
                    max={10}
                    step={0.5}
                    value={formData.totalPoints}
                    onChange={(e) => {
                      const raw = e.target.value.replace(',', '.');
                      let val = parseFloat(raw);
                      if (isNaN(val)) val = 0.5;
                      val = Math.round(val * 2) / 2;
                      if (val < 0.5) val = 0.5;
                      if (val > 10) val = 10;
                      setFormData({ ...formData, totalPoints: val });
                    }}
                    placeholder="10"
                  />
                </div>

                <div>
                  <Label htmlFor="period">Período</Label>
                  <Input id="period" readOnly value={currentPeriod?.name || 'Nenhum período ativo'} />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateExam}
                  disabled={!formData.title || !(formData.subjectId || selectedSubject) || !formData.classId || !formData.examDate || createExamMutation.isPending || formData.totalPoints < 0.5 || formData.totalPoints > 10 || Math.round(formData.totalPoints * 2) !== formData.totalPoints * 2}
                >
                  {createExamMutation.isPending ? 'Criando...' : 'Criar Prova'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Novo Modal de Notas Simples */}
      <SimpleGradesModal
        isOpen={showGradesModal}
        onClose={() => setShowGradesModal(false)}
        examId={selectedExam?.id || null}
      />

      {/* Dialog de Confirmação de Exclusão */}
      {showDeleteDialog && (
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Tem certeza que deseja excluir esta prova? Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteExam}
                  disabled={deleteExamMutation.isPending}
                >
                  {deleteExamMutation.isPending ? 'Excluindo...' : 'Excluir'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
