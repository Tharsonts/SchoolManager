import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStudentExams } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Clock, BookOpen, Eye, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Exam {
  id: string;
  title: string;
  description: string;
  examDate: string;
  subjectId: string;
  subjectName: string;
  bimonthly: number;
  semester: number;
  totalPoints: number;
  createdAt: string;
  grade: {
    id: string;
    grade: number | null;
    isPresent: boolean;
    observations: string | null;
    gradedAt: string | null;
  } | null;
}

const StudentExamsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBimonthly, setSelectedBimonthly] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showExamModal, setShowExamModal] = useState(false);

  const { data: currentPeriodResponse } = useQuery({
    queryKey: ['current-period'],
    queryFn: async () => {
      const res = await fetch('/api/periods/current', { credentials: 'include' });
      if (!res.ok) throw new Error('Erro ao buscar período atual');
      return res.json();
    }
  });
  const currentPeriod = currentPeriodResponse?.data || null;

  const { data: exams = [], isLoading } = useStudentExams();

  // Filtrar provas
  const filteredExams = useMemo(() => {
    return exams.filter((exam: Exam) => {
      const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           exam.subjectName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubject = selectedSubject === 'all' || exam.subjectId === selectedSubject;
      return matchesSearch && matchesSubject;
    });
  }, [exams, searchTerm, selectedSubject, currentPeriod]);

  const examsByBimonthly = useMemo(() => {
    return { all: filteredExams } as any;
  }, [filteredExams]);

  // Obter disciplinas únicas
  const subjects = useMemo(() => {
    const uniqueSubjects = new Map();
    exams.forEach((exam: Exam) => {
      if (!uniqueSubjects.has(exam.subjectId)) {
        uniqueSubjects.set(exam.subjectId, {
          id: exam.subjectId,
          name: exam.subjectName
        });
      }
    });
    return Array.from(uniqueSubjects.values());
  }, [exams]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = exams.length;
    const completed = exams.filter((exam: Exam) => exam.grade && exam.grade.gradedAt).length;
    const pending = total - completed;
    const average = exams
      .filter((exam: Exam) => exam.grade && exam.grade.grade !== null)
      .reduce((sum, exam) => sum + (exam.grade?.grade || 0), 0) / 
      exams.filter((exam: Exam) => exam.grade && exam.grade.grade !== null).length || 0;

    return { total, completed, pending, average };
  }, [exams]);

  const handleViewExam = (exam: Exam) => {
    setSelectedExam(exam);
    setShowExamModal(true);
  };

  const getStatusBadge = (exam: Exam) => {
    if (!exam.grade) {
      return <Badge variant="secondary">Pendente</Badge>;
    }
    
    if (!exam.grade.isPresent) {
      return <Badge variant="destructive">Faltou</Badge>;
    }
    
    if (exam.grade.grade === null) {
      return <Badge variant="outline">Aguardando</Badge>;
    }
    
    const percentage = (exam.grade.grade / exam.totalPoints) * 100;
    if (percentage >= 70) {
      return <Badge variant="default" className="bg-green-500">Aprovado</Badge>;
    } else if (percentage >= 50) {
      return <Badge variant="default" className="bg-yellow-500">Recuperação</Badge>;
    } else {
      return <Badge variant="destructive">Reprovado</Badge>;
    }
  };

  const getStatusIcon = (exam: Exam) => {
    if (!exam.grade) {
      return <Clock className="h-4 w-4 text-gray-500" />;
    }
    
    if (!exam.grade.isPresent) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    
    if (exam.grade.grade === null) {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
    
    const percentage = (exam.grade.grade / exam.totalPoints) * 100;
    if (percentage >= 70) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (percentage >= 50) {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando provas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Minhas Provas</h1>
          <p className="text-gray-600">Acompanhe suas provas e notas no período atual</p>
        </div>
        
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Provas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Concluídas</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Média Geral</p>
                <p className="text-2xl font-bold text-blue-600">{stats.average.toFixed(1)}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar provas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full md:w-48 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <Badge variant="secondary" className="w-full justify-center">
                {currentPeriod?.name || 'Nenhum período ativo'}
              </Badge>
            </div>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Disciplina" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Disciplinas</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="w-full">
        <TabsContent value="all" className="space-y-4">
          {filteredExams.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma prova encontrada</h3>
                <p className="text-gray-600">Não há provas agendadas no período atual com os filtros selecionados.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredExams.map((exam: Exam) => (
                <Card key={exam.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(exam)}
                          <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
                          {getStatusBadge(exam)}
                        </div>
                        <p className="text-gray-600 mb-2">{exam.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            <span>{exam.subjectName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(exam.examDate), 'dd/MM/yyyy', { locale: ptBR })}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>{exam.totalPoints} pontos</span>
                          </div>
                        </div>
                        {exam.grade && exam.grade.grade !== null && (
                          <div className="mt-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700">Nota:</span>
                              <span className="text-lg font-bold text-blue-600">
                                {exam.grade.grade}/{exam.totalPoints}
                              </span>
                              <span className="text-sm text-gray-500">
                                ({((exam.grade.grade / exam.totalPoints) * 100).toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewExam(exam)}
                        className="ml-4"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes da Prova */}
      <Dialog open={showExamModal} onOpenChange={setShowExamModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {selectedExam?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedExam && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Disciplina</label>
                  <p className="text-gray-900">{selectedExam.subjectName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Data da Prova</label>
                  <p className="text-gray-900">
                    {format(new Date(selectedExam.examDate), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Bimestre</label>
                  <p className="text-gray-900">{selectedExam.bimonthly}º Bimestre</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Pontuação Total</label>
                  <p className="text-gray-900">{selectedExam.totalPoints} pontos</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Descrição</label>
                <p className="text-gray-900 mt-1">{selectedExam.description}</p>
              </div>

              {selectedExam.grade && (
                <div className="border-t pt-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Resultado</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <div className="mt-1">
                        {getStatusBadge(selectedExam)}
                      </div>
                    </div>
                    {selectedExam.grade.grade !== null && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Nota</label>
                        <p className="text-2xl font-bold text-blue-600">
                          {selectedExam.grade.grade}/{selectedExam.totalPoints}
                        </p>
                        <p className="text-sm text-gray-500">
                          ({((selectedExam.grade.grade / selectedExam.totalPoints) * 100).toFixed(1)}%)
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {selectedExam.grade.observations && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-700">Observações</label>
                      <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded-md">
                        {selectedExam.grade.observations}
                      </p>
                    </div>
                  )}
                  
                  {selectedExam.grade.gradedAt && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-700">Data da Avaliação</label>
                      <p className="text-gray-900">
                        {format(new Date(selectedExam.grade.gradedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentExamsPage;

