import { useState } from "react";
import { useLocation } from "wouter";
import { BookOpen, Users, Calendar, Clock, MapPin, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

export default function TeacherClassesPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("classes");

  // Buscar turmas do professor
  const { data: classesData, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['teacher-classes', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/teacher/${user?.id}/classes`);
      if (!response.ok) throw new Error('Falha ao carregar turmas');
      return response.json();
    },
    enabled: !!user?.id
  });

  // Buscar próximas aulas
  const { data: upcomingClassesData, isLoading: isLoadingUpcoming } = useQuery({
    queryKey: ['teacher-upcoming-classes', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/teacher/${user?.id}/upcoming-classes`);
      if (!response.ok) throw new Error('Falha ao carregar próximas aulas');
      return response.json();
    },
    enabled: !!user?.id
  });

  const classes = classesData?.data || [];
  const upcomingClasses = upcomingClassesData?.data || [];

  // Agrupar turmas por classe
  const groupedClasses = classes.reduce((acc: any, cls: any) => {
    const key = cls.classId;
    if (!acc[key]) {
      acc[key] = {
        classId: cls.classId,
        className: cls.className,
        currentStudents: cls.currentStudents,
        subjects: []
      };
    }
    acc[key].subjects.push({
      id: cls.id,
      subjectId: cls.subjectId,
      subjectName: cls.subjectName,
      schedule: cls.schedule,
      room: cls.room,
      semester: cls.semester,
      academicYear: cls.academicYear,
      status: cls.status
    });
    return acc;
  }, {});

  const classesArray = Object.values(groupedClasses);

  if (isLoadingClasses) {
    return (
      <MainLayout pageTitle="Minhas Turmas">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando turmas...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle="Minhas Turmas">
      <Tabs defaultValue="classes" onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="classes">Minhas Turmas</TabsTrigger>
            <TabsTrigger value="schedule">Cronograma</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate('/attendance')} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Frequência
            </Button>
            <Button 
              onClick={() => navigate('/grades')} 
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Lançar Notas
            </Button>
          </div>
        </div>

        <TabsContent value="classes">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classesArray.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Nenhuma turma encontrada
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Você ainda não foi atribuído a nenhuma turma.
                </p>
              </div>
            ) : (
              classesArray.map((classGroup: any) => (
                <Card key={classGroup.classId} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{classGroup.className}</CardTitle>
                      <Badge variant="outline">
                        {classGroup.currentStudents} alunos
                      </Badge>
                    </div>
                    <CardDescription>
                      {classGroup.subjects.length} disciplina{classGroup.subjects.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {classGroup.subjects.map((subject: any) => (
                        <div key={subject.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{subject.subjectName}</div>
                            {subject.schedule && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {subject.schedule}
                              </div>
                            )}
                            {subject.room && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {subject.room}
                              </div>
                            )}
                          </div>
                          <Badge 
                            variant={subject.status === 'active' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {subject.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => navigate(`/class/${classGroup.classId}`)}
                      >
                        Ver Detalhes
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Cronograma Semanal</CardTitle>
              <CardDescription>
                Suas próximas aulas organizadas por horário
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUpcoming ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Carregando cronograma...</span>
                </div>
              ) : upcomingClasses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Nenhuma aula agendada</p>
                  <p className="text-sm">Você não tem aulas nos próximos dias</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingClasses.map((cls: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg">
                          <BookOpen className="h-6 w-6 text-primary-600 dark:text-primary-300" />
                        </div>
                        <div>
                          <div className="font-medium">{cls.className} - {cls.subjectName}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                            <Calendar className="h-4 w-4 mr-1" />
                            {cls.day}, {cls.time}
                          </div>
                          {cls.room && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                              <MapPin className="h-4 w-4 mr-1" />
                              {cls.room}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-2">
                          {cls.studentsCount || 0} alunos
                        </Badge>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="h-4 w-4 inline mr-1" />
                          {cls.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}