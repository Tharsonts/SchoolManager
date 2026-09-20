import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Users, Calendar, BookOpen, UserCheck, UserX, Clock, Save, Check, X, BarChart3, TrendingUp, Award, FileText, Download, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSaveGrade, useClassGrades, useClassAverages, useGeneralAverages } from "@/hooks/useApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserInitials } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  registrationNumber: string;
  profileImageUrl?: string;
}

interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  justification?: string;
}

interface GradeRecord {
  studentId: string;
  quarter: 1 | 2 | 3 | 4; // Bimestre
  type: 'exam' | 'homework' | 'project' | 'participation' | 'quiz';
  title: string;
  grade: number;
  maxGrade: number;
  weight: number;
  date: string;
  comments?: string;
}

interface StudentGrades {
  studentId: string;
  quarters: {
    [key: number]: {
      grades: GradeRecord[];
      average: number;
      status: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement' | 'critical';
    };
  };
  yearAverage: number;
  finalStatus: 'approved' | 'recovery' | 'failed';
}

export default function ClassDetailPage() {
  const [, navigate] = useLocation();
  const { classId, tab } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceRecord>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState(tab || "attendance");
  const [selectedQuarter, setSelectedQuarter] = useState<1 | 2 | 3 | 4>(1);
  const [gradesData, setGradesData] = useState<Record<string, StudentGrades>>({});
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'present' | 'absent' | 'late'>('all');
  const [gradeInputs, setGradeInputs] = useState<Record<string, { exam?: string; homework?: string }>>({});

  // Buscar detalhes da turma
  const { data: classData, isLoading: isLoadingClass } = useQuery({
    queryKey: ['class-detail', classId],
    queryFn: async () => {
      const response = await fetch(`/api/classes/${classId}/detail`);
      if (!response.ok) throw new Error('Falha ao carregar turma');
      return response.json();
    },
    enabled: !!classId
  });

  // Buscar alunos da turma
  const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['class-students', classId],
    queryFn: async () => {
      const response = await fetch(`/api/classes/${classId}/students`);
      if (!response.ok) throw new Error('Falha ao carregar alunos');
      return response.json();
    },
    enabled: !!classId
  });

  // Buscar presença do dia selecionado
  const { data: attendanceDataApi, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['class-attendance', classId, selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/classes/${classId}/attendance/${selectedDate}`);
      if (!response.ok && response.status !== 404) throw new Error('Falha ao carregar presença');
      if (response.status === 404) return { data: [] };
      return response.json();
    },
    enabled: !!classId && !!selectedDate
  });

  // Salvar presença
  const saveAttendanceMutation = useMutation({
    mutationFn: async (attendanceRecords: AttendanceRecord[]) => {
      const response = await fetch(`/api/classes/${classId}/attendance/${selectedDate}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: attendanceRecords })
      });
      if (!response.ok) throw new Error('Falha ao salvar presença');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-attendance', classId, selectedDate] });
      toast.success('Presença salva com sucesso!');
      setHasChanges(false);
    },
    onError: () => {
      toast.error('Erro ao salvar presença');
    }
  });

  // Hooks para notas
  const saveGradeMutation = useSaveGrade();
  const { data: classGrades, isLoading: isLoadingGrades } = useClassGrades(classId || '', selectedQuarter);
  const { data: classAverages } = useClassAverages(classId || '', selectedQuarter);
  const { data: generalAverages } = useGeneralAverages(classId || '');
  
  // Log das queries
  console.log('📊 Query classGrades:', { classId, selectedQuarter, data: classGrades?.data, isLoading: isLoadingGrades });
  console.log('📊 Query generalAverages:', { classId, data: generalAverages?.data });
   

  // Atualizar aba quando URL mudar
  useEffect(() => {
    if (tab) {
      setActiveTab(tab);
    }
  }, [tab]);

  // Inicializar dados de presença quando carregar
  useEffect(() => {
    if (attendanceDataApi?.data && studentsData?.data) {
      const attendance: Record<string, AttendanceRecord> = {};
      
      // Inicializar com dados existentes
      attendanceDataApi.data.forEach((record: any) => {
        attendance[record.studentId] = {
          studentId: record.studentId,
          status: record.status,
          justification: record.justification
        };
      });
      
      // Preencher estudantes sem registro como 'present'
      studentsData.data.forEach((student: Student) => {
        if (!attendance[student.id]) {
          attendance[student.id] = {
            studentId: student.id,
            status: 'present',
            justification: ''
          };
        }
      });
      
      setAttendanceData(attendance);
    }
  }, [attendanceDataApi, studentsData]);

  const classInfo = classData?.data;
  const students: Student[] = studentsData?.data || [];

  const handleAttendanceChange = (studentId: string, status: AttendanceRecord['status']) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
    setHasChanges(true);
  };

  const handleJustificationChange = (studentId: string, justification: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        justification
      }
    }));
    setHasChanges(true);
  };

  const handleSaveAttendance = () => {
    const records = Object.values(attendanceData);
    saveAttendanceMutation.mutate(records);
  };

  // Funções para sistema de notas
  const handleGradeChange = (studentId: string, type: 'exam' | 'homework', value: string) => {
    console.log('=== MUDANDO NOTA ===');
    console.log('Student ID:', studentId);
    console.log('Type:', type);
    console.log('Value:', value);
    
    setGradeInputs(prev => {
      const newInputs = {
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [type]: value
        }
      };
      console.log('Novos inputs:', newInputs);
      return newInputs;
    });
  };

  const handleSaveGrade = async (studentId: string, type: 'exam' | 'homework') => {
    console.log('🚀 === INICIANDO SALVAMENTO DE NOTA ===');
    console.log('Student ID:', studentId);
    console.log('Type:', type);
    console.log('Grade Inputs:', gradeInputs);
    console.log('Class ID:', classId);
    console.log('Selected Quarter:', selectedQuarter);
    
    const gradeValue = gradeInputs[studentId]?.[type];
    console.log('Grade Value from inputs:', gradeValue);
    
    if (!gradeValue || gradeValue === '' || !classId) {
      console.log('ERRO: Grade value ou classId não encontrados');
      console.log('Grade value:', gradeValue);
      console.log('Class ID:', classId);
      toast.error('Digite uma nota para salvar');
      return;
    }

    const grade = parseFloat(gradeValue);
    console.log('Parsed grade:', grade);
    
    if (isNaN(grade) || grade < 0 || grade > 10) {
      console.log('ERRO: Nota inválida');
      toast.error('Nota deve estar entre 0 e 10');
      return;
    }

    const title = type === 'exam' ? `Prova - ${selectedQuarter}º Bimestre` : `Trabalho - ${selectedQuarter}º Bimestre`;

    console.log('=== DADOS PARA SALVAMENTO ===');
    console.log('Student ID:', studentId);
    console.log('Type:', type);
    console.log('Grade:', grade);
    console.log('Quarter:', selectedQuarter);
    console.log('Class ID:', classId);
    console.log('Title:', title);

    // Teste direto com fetch
    try {
      console.log('📤 Enviando dados para o servidor...');
      
      const response = await fetch(`/api/classes/${classId}/grades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          studentId,
          quarter: selectedQuarter,
          type,
          grade,
          title
        })
      });
      
      console.log('📊 Status da resposta:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na resposta:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ Resposta do servidor:', result);
      
      // Invalidar queries de todos os bimestres para atualizar o painel de notas
      console.log('🔄 Invalidando queries...');
      await queryClient.invalidateQueries({ queryKey: ['class-grades', classId, 1] });
      await queryClient.invalidateQueries({ queryKey: ['class-grades', classId, 2] });
      await queryClient.invalidateQueries({ queryKey: ['class-grades', classId, 3] });
      await queryClient.invalidateQueries({ queryKey: ['class-grades', classId, 4] });
      await queryClient.invalidateQueries({ queryKey: ['class-averages', classId, 1] });
      await queryClient.invalidateQueries({ queryKey: ['class-averages', classId, 2] });
      await queryClient.invalidateQueries({ queryKey: ['class-averages', classId, 3] });
      await queryClient.invalidateQueries({ queryKey: ['class-averages', classId, 4] });
      await queryClient.invalidateQueries({ queryKey: ['general-averages', classId] });
      
      // Forçar refetch das queries
      console.log('🔄 Forçando refetch das queries...');
      await queryClient.refetchQueries({ queryKey: ['class-grades', classId, selectedQuarter] });
      await queryClient.refetchQueries({ queryKey: ['class-averages', classId, selectedQuarter] });
      await queryClient.refetchQueries({ queryKey: ['general-averages', classId] });
      
      // Não limpar os inputs - eles serão recarregados pelo useEffect
      console.log('✅ Nota salva - inputs serão recarregados automaticamente');
      
      console.log('🎉 Nota salva com sucesso!');
      toast.success('Nota salva com sucesso!');
    } catch (error) {
      console.error('💥 Erro ao salvar nota:', error);
      toast.error('Erro ao salvar nota');
    }
  };

  // Função para obter nota existente
  const getExistingGrade = (studentId: string, type: 'exam' | 'homework') => {
    const grades = classGrades?.data || [];
    const grade = grades.find((g: any) => g.studentId === studentId && g.type === type);
    console.log(`🔍 Buscando nota existente para ${studentId} (${type}) no bimestre ${selectedQuarter}:`, grade);
    return grade?.grade?.toString() || '';
  };

  // Carregar notas existentes nos inputs quando os dados chegarem
  useEffect(() => {
    console.log('🔄 useEffect executado - classGrades:', classGrades?.data);
    console.log('🔄 useEffect executado - students:', students.length);
    console.log('🔄 useEffect executado - selectedQuarter:', selectedQuarter);
    
    if (classGrades?.data && students.length > 0) {
      console.log('📊 Carregando notas existentes nos inputs...');
      console.log('📊 Dados das notas:', classGrades.data);
      const newInputs: any = {};
      
      students.forEach(student => {
        const examGrade = getExistingGrade(student.id, 'exam');
        const homeworkGrade = getExistingGrade(student.id, 'homework');
        
        console.log(`📊 ${student.firstName} ${student.lastName}: exam=${examGrade}, homework=${homeworkGrade}`);
        
        // Sempre definir os inputs, mesmo que sejam vazios
        newInputs[student.id] = {
          exam: examGrade || '',
          homework: homeworkGrade || ''
        };
      });
      
      console.log('✅ Notas carregadas nos inputs:', newInputs);
      setGradeInputs(newInputs); // Substituir completamente ao invés de mesclar
    } else if (students.length > 0) {
      // Se não há notas, limpar os inputs
      console.log('🧹 Limpando inputs - nenhuma nota encontrada');
      const emptyInputs: any = {};
      students.forEach(student => {
        emptyInputs[student.id] = {
          exam: '',
          homework: ''
        };
      });
      setGradeInputs(emptyInputs);
    }
  }, [classGrades?.data, students, selectedQuarter, generalAverages?.data]);

  // Limpar inputs quando trocar de bimestre
  useEffect(() => {
    console.log('🔄 ===== BIMESTRE MUDOU =====');
    console.log('🔄 Novo bimestre:', selectedQuarter);
    console.log('🧹 Limpando inputs para novo bimestre');
    
    if (students.length > 0) {
      const emptyInputs: any = {};
      students.forEach(student => {
        emptyInputs[student.id] = {
          exam: '',
          homework: ''
        };
      });
      setGradeInputs(emptyInputs);
      console.log('✅ Inputs limpos para', students.length, 'estudantes');
    }
  }, [selectedQuarter, students]);

  // Função para calcular média do bimestre atual
  const calculateQuarterAverage = (studentId: string) => {
    // Primeiro tenta buscar nas notas salvas
    const averages = classAverages?.data || [];
    const studentAverage = averages.find((avg: any) => avg.studentId === studentId);
    if (studentAverage?.average) {
      console.log(`📈 Média do bimestre ${selectedQuarter} para ${studentId}:`, studentAverage.average);
      return studentAverage.average;
    }
    
    // Se não encontrar, calcula com base nos inputs atuais
    const examGrade = gradeInputs[studentId]?.exam;
    const homeworkGrade = gradeInputs[studentId]?.homework;
    
    if (examGrade && homeworkGrade) {
      const exam = parseFloat(examGrade);
      const homework = parseFloat(homeworkGrade);
      if (!isNaN(exam) && !isNaN(homework)) {
        const average = (exam + homework) / 2;
        console.log(`🧮 Média calculada para ${studentId}:`, average, `(${exam} + ${homework}) / 2`);
        return average;
      }
    }
    
    console.log(`❌ Sem média para ${studentId} no bimestre ${selectedQuarter}`);
    return null;
  };

  // Função para obter média geral do estudante
  const getGeneralAverage = (studentId: string) => {
    const averages = generalAverages?.data || [];
    const studentAverage = averages.find((avg: any) => avg.studentId === studentId);
    return studentAverage?.generalAverage || 0;
  };

  // Função para obter status do estudante
  const getStudentStatus = (studentId: string) => {
    const averages = generalAverages?.data || [];
    const studentAverage = averages.find((avg: any) => avg.studentId === studentId);
    return studentAverage?.status || 'Pendente';
  };

  // Função para determinar status baseado na média geral
  const getGradeStatus = (average: number | null) => {
    if (average === null || average === 0) return 'pending';
    if (average >= 6.0) return 'approved';
    if (average >= 4.0) return 'recovery';
    return 'failed';
  };

  const getStatusIcon = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present': return <Check className="h-4 w-4 text-green-600" />;
      case 'absent': return <X className="h-4 w-4 text-red-600" />;
      case 'late': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'excused': return <UserCheck className="h-4 w-4 text-blue-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present': return 'bg-green-50 text-green-700 border-green-200';
      case 'absent': return 'bg-red-50 text-red-700 border-red-200';
      case 'late': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'excused': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return '';
    }
  };

  const presentCount = Object.values(attendanceData).filter(a => a.status === 'present').length;
  const absentCount = Object.values(attendanceData).filter(a => a.status === 'absent').length;
  const lateCount = Object.values(attendanceData).filter(a => a.status === 'late').length;

  if (isLoadingClass || isLoadingStudents) {
    return (
      <MainLayout pageTitle="Carregando...">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!classInfo) {
    return (
      <MainLayout pageTitle="Turma não encontrada">
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold mb-4">Turma não encontrada</h2>
          <Button onClick={() => navigate('/my-classes')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar às turmas
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle={classInfo.name}>
      <div className="space-y-6">
        {/* Header Profissional */}
        <div className="bg-gradient-to-r from-slate-900 via-gray-800 to-slate-900 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/class-diary')}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Diário
              </Button>
              
              <div>
                <h1 className="text-4xl font-bold mb-2">{classInfo.name}</h1>
                <div className="flex items-center gap-4 text-lg text-gray-200">
                  <span>{classInfo.grade} • Seção {classInfo.section}</span>
                  <span>•</span>
                  <span>{classInfo.academicYear}</span>
                </div>
                <div className="mt-3 text-sm text-gray-300">
                  Registro acadêmico completo e controle de frequência
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-bold">{students.length}</div>
              <div className="text-gray-200">Estudantes</div>
              <Badge variant="secondary" className="mt-2 bg-white/10 text-white border-white/20">
                Turma Ativa
              </Badge>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="attendance">
              <UserCheck className="h-4 w-4 mr-2" />
              Presença
            </TabsTrigger>
            <TabsTrigger value="grades">
              <BookOpen className="h-4 w-4 mr-2" />
              Notas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-6">
            {/* Header Simples de Presença */}
            <div className="bg-white border rounded-lg p-5 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-1">Registro de Presença</h2>
                  <p className="text-gray-600 text-sm">{classData?.data?.name} • {students.length} alunos</p>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{presentCount}</div>
                    <div className="text-gray-500">Presentes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">{absentCount}</div>
                    <div className="text-gray-500">Faltas</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Controles Simples */}
            <div className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">Data:</label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-auto border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">
                    {format(new Date(selectedDate), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const newData = { ...attendanceData };
                      students.forEach(student => {
                        newData[student.id] = { status: 'present' };
                      });
                      setAttendanceData(newData);
                      setHasChanges(true);
                    }}
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Marcar Todos
                  </Button>
                  
                  <Button 
                    onClick={handleSaveAttendance}
                    disabled={!hasChanges || saveAttendanceMutation.isPending}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {saveAttendanceMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

             {/* Lista de Alunos Compacta */}
             <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
               <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-3">
                 <div className="flex items-center justify-between">
                   <h3 className="text-lg font-semibold text-white">Registro de Presença</h3>
                   <div className="flex items-center gap-4 text-sm">
                     <span className="text-green-300 font-medium">{presentCount} Presentes</span>
                     <span className="text-red-300 font-medium">{absentCount} Faltas</span>
                   </div>
                 </div>
               </div>
               
               <div className="p-3">
                 <div className="space-y-2">
                   {students
                     .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
                     .map((student, index) => {
                       const currentStatus = attendanceData[student.id]?.status || 'present';
                       
                       return (
                         <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                           <div className="flex items-center gap-3">
                             <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                               {index + 1}
                             </div>
                             <span className="font-medium text-gray-900">
                               {student.firstName} {student.lastName}
                             </span>
                           </div>
                           
                           <div className="flex gap-4">
                             <label className="flex items-center gap-2 cursor-pointer">
                               <input
                                 type="radio"
                                 name={`attendance-${student.id}`}
                                 checked={currentStatus === 'present'}
                                 onChange={() => handleAttendanceChange(student.id, 'present')}
                                 className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                               />
                               <span className="text-sm text-gray-700">Presente</span>
                             </label>
                             
                             <label className="flex items-center gap-2 cursor-pointer">
                               <input
                                 type="radio"
                                 name={`attendance-${student.id}`}
                                 checked={currentStatus === 'absent'}
                                 onChange={() => handleAttendanceChange(student.id, 'absent')}
                                 className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                               />
                               <span className="text-sm text-gray-700">Falta</span>
                             </label>
                           </div>
                         </div>
                       );
                     })}
                 </div>
               </div>
             </div>

            {/* Painel de Total de Presenças e Faltas Compacto */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-4 py-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Relatório de Frequência</h3>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-300 font-medium">
                      {students.reduce((acc, student) => {
                        const totalPresent = Math.floor(Math.random() * 20) + 15;
                        return acc + totalPresent;
                      }, 0)} Presenças
                    </span>
                    <span className="text-red-300 font-medium">
                      {students.reduce((acc, student) => {
                        const totalAbsent = Math.floor(Math.random() * 5) + 1;
                        return acc + totalAbsent;
                      }, 0)} Faltas
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-3">
                <div className="space-y-2">
                  {students
                    .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
                    .map((student, index) => {
                      // Simulando dados de presença acumulada (substituir por dados reais da API)
                      const totalPresent = Math.floor(Math.random() * 20) + 15; // Entre 15-35 presenças
                      const totalAbsent = Math.floor(Math.random() * 5) + 1; // Entre 1-6 faltas
                      const totalClasses = totalPresent + totalAbsent;
                      const attendanceRate = ((totalPresent / totalClasses) * 100).toFixed(1);
                      
                      return (
                        <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                              {index + 1}
                            </div>
                            <span className="font-medium text-gray-900">
                              {student.firstName} {student.lastName}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-6 text-sm">
                            <div className="text-center">
                              <div className="text-lg font-bold text-green-600">{totalPresent}</div>
                              <div className="text-xs text-gray-500">Presenças</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-red-500">{totalAbsent}</div>
                              <div className="text-xs text-gray-500">Faltas</div>
                            </div>
                            <div className="text-center">
                              <div className={`text-lg font-bold ${
                                parseFloat(attendanceRate) >= 85 ? 'text-green-600' : 
                                parseFloat(attendanceRate) >= 75 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {attendanceRate}%
                              </div>
                              <div className="text-xs text-gray-500">Frequência</div>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              parseFloat(attendanceRate) >= 85 
                                ? 'bg-green-100 text-green-800' 
                                : parseFloat(attendanceRate) >= 75 
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }`}>
                              {parseFloat(attendanceRate) >= 85 ? 'Excelente' : 
                               parseFloat(attendanceRate) >= 75 ? 'Bom' : 'Atenção'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="grades" className="space-y-6">
            {/* Header Simples de Notas */}
            <div className="bg-white border rounded-lg p-5 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-1">Sistema de Notas</h2>
                  <p className="text-gray-600 text-sm">Bimestre {selectedQuarter} • {students.length} alunos</p>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((quarter) => (
                    <Button
                      key={quarter}
                      size="sm"
                      variant={selectedQuarter === quarter ? 'default' : 'outline'}
                      onClick={() => setSelectedQuarter(quarter)}
                      className={selectedQuarter === quarter ? 'bg-blue-600' : 'border-gray-300'}
                    >
                      {quarter}º
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Lista de Alunos com Notas */}
            <div className="bg-white border rounded-lg shadow-sm">
              <div className="bg-gray-50 border-b p-4">
                <h3 className="font-medium text-gray-800">Lançamento de Notas</h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {students.map((student, index) => {
                    const examGrade = getExistingGrade(student.id, 'exam');
                    const homeworkGrade = getExistingGrade(student.id, 'homework');
                    const quarterAverage = calculateQuarterAverage(student.id);
                    const generalAverage = getGeneralAverage(student.id);
                    const status = getStudentStatus(student.id);
                    return (
                      <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
                            {index + 1}
                          </div>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={student.profileImageUrl} />
                            <AvatarFallback className="bg-gray-300 text-gray-700 text-sm">
                              {getUserInitials(student.firstName + ' ' + student.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-gray-900">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              Média Geral: {generalAverage > 0 ? generalAverage.toFixed(1) : '--'}
                            </div>
                            <div className="text-xs text-gray-400">
                              {selectedQuarter}º Bimestre: {quarterAverage ? quarterAverage.toFixed(1) : '--'}
                            </div>
                            <div className="mt-1">
                              <Badge 
                                variant={status === 'Aprovado' ? 'default' : status === 'Recuperação' ? 'secondary' : 'destructive'}
                                className="text-xs"
                              >
                                {status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600">Prova:</label>
                            <Input 
                              type="number" 
                              className="w-16 h-8 text-center text-sm" 
                              placeholder="0-10"
                              value={gradeInputs[student.id]?.exam || examGrade}
                              onChange={(e) => handleGradeChange(student.id, 'exam', e.target.value)}
                              min="0"
                              max="10"
                              step="0.1"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                              onClick={() => handleSaveGrade(student.id, 'exam')}
                              disabled={!gradeInputs[student.id]?.exam || gradeInputs[student.id]?.exam === ''}
                            >
                              ✓
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600">Trabalho:</label>
                            <Input 
                              type="number" 
                              className="w-16 h-8 text-center text-sm" 
                              placeholder="0-10"
                              value={gradeInputs[student.id]?.homework || homeworkGrade}
                              onChange={(e) => handleGradeChange(student.id, 'homework', e.target.value)}
                              min="0"
                              max="10"
                              step="0.1"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                              onClick={() => handleSaveGrade(student.id, 'homework')}
                              disabled={!gradeInputs[student.id]?.homework || gradeInputs[student.id]?.homework === ''}
                            >
                              ✓
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                 </div>
               </div>
             </div>

           </TabsContent>
         </Tabs>
       </div>
     </MainLayout>
   );
 }
