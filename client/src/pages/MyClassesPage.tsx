import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Clock, Calendar, Users, ExternalLink, MapPin, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

export default function MyClassesPage() {
  const [activeTab, setActiveTab] = useState("schedule");
  const { user } = useAuth();
  
  // Buscar dados da turma do aluno
  const { data: classData, isLoading: isLoadingClass } = useQuery({
    queryKey: ['student-class', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/student-class/${user?.id}`);
      if (!response.ok) throw new Error('Falha ao carregar dados da turma');
      return response.json();
    },
    enabled: !!user?.id
  });

  // Buscar dados das disciplinas da turma
  const { data: subjectsData, isLoading: isLoadingSubjects } = useQuery({
    queryKey: ['class-subjects', classData?.data?.classId],
    queryFn: async () => {
      const response = await fetch(`/api/class-subjects/${classData?.data?.classId}`);
      if (!response.ok) throw new Error('Falha ao carregar disciplinas');
      return response.json();
    },
    enabled: !!classData?.data?.classId
  });

  // Processar dados para o cronograma semanal
  const weeklySchedule = useMemo(() => {
    if (!subjectsData?.data) return [];

    const days = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];
    const schedule: any[] = [];

    days.forEach(day => {
      const daySubjects = subjectsData.data.filter((subject: any) => 
        subject.schedule?.includes(day)
      );

      if (daySubjects.length > 0) {
        schedule.push({
          day,
          subjects: daySubjects.sort((a: any, b: any) => {
            // Extrair horário do schedule (assumindo formato "Segunda-feira 8:00-9:30")
            const timeA = a.schedule?.match(/(\d{1,2}):(\d{2})/)?.[0] || '00:00';
            const timeB = b.schedule?.match(/(\d{1,2}):(\d{2})/)?.[0] || '00:00';
            return timeA.localeCompare(timeB);
          })
        });
      }
    });

    return schedule;
  }, [subjectsData]);

  // Dados de exemplo para turmas anteriores (em um sistema real, viria da API)
  const pastClasses = [
    {
      id: "1A-2022",
      name: "1º Ano A",
      level: "Ensino Fundamental",
      year: "2022",
      subjects: ["Matemática", "Ciências"],
      students: 32,
      schedule: "Segunda e Quarta, 07:30 - 11:10",
      color: "gray"
    },
    {
      id: "2B-2022",
      name: "2º Ano B",
      level: "Ensino Fundamental",
      year: "2022",
      subjects: ["Português", "História"],
      students: 30,
      schedule: "Terça e Quinta, 07:30 - 11:10",
      color: "gray"
    },
  ];

  function getColorClass(color: string) {
    const colorMap: Record<string, string> = {
      blue: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
      green: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
      purple: "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800",
      amber: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",
      red: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
      gray: "bg-gray-50 border-gray-200 dark:bg-gray-800/20 dark:border-gray-700"
    };
    
    return colorMap[color] || colorMap.blue;
  }

  function getSubjectColor(subjectName: string) {
    const colors = [
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
    ];
    
    const index = subjectName.length % colors.length;
    return colors[index];
  }

  if (isLoadingClass || isLoadingSubjects) {
    return (
      <MainLayout pageTitle="Minha Turma">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando dados da turma...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle="Minha Turma">
      <Tabs defaultValue="schedule" onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="schedule">Cronograma Semanal</TabsTrigger>
            <TabsTrigger value="info">Informações da Turma</TabsTrigger>
            <TabsTrigger value="past">Turmas Anteriores</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Cronograma Semanal</CardTitle>
              <CardDescription>
                Horários das suas aulas organizados por dia da semana
              </CardDescription>
            </CardHeader>
            <CardContent>
              {weeklySchedule.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum horário encontrado para esta turma
                </div>
              ) : (
                <div className="space-y-6">
                  {weeklySchedule.map((daySchedule, dayIndex) => (
                    <div key={dayIndex} className="border rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                        {daySchedule.day}
                      </h3>
                      <div className="grid gap-3">
                        {daySchedule.subjects.map((subject: any, subjectIndex: number) => (
                          <div 
                            key={subjectIndex}
                            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${getSubjectColor(subject.subjectName)}`}></div>
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                  {subject.subjectName}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Prof. {subject.teacherName || "Professor"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{subject.schedule?.match(/(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/)?.[0] || "Horário não definido"}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                <span>{subject.room || "Sala não definida"}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info">
          {classData?.data ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-2 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{classData.data.name}</CardTitle>
                      <CardDescription>Turma Atual</CardDescription>
                    </div>
                    <Badge className="bg-blue-500">{classData.data.academicYear}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">
                        {subjectsData?.data?.length || 0} disciplinas
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">
                        {classData.data.currentStudents || 0} alunos
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">
                        Ano letivo {classData.data.academicYear}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button className="w-full bg-blue-500 hover:bg-blue-600" disabled>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Turma Atual
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Disciplinas</CardTitle>
                  <CardDescription>Matérias que você cursa</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {subjectsData?.data?.map((subject: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800/50">
                        <span className="font-medium">{subject.subjectName}</span>
                        <Badge variant="outline" className={getSubjectColor(subject.subjectName)}>
                          {subject.teacherName || "Professor"}
                        </Badge>
                      </div>
                    )) || (
                      <div className="text-center py-4 text-gray-500">
                        Nenhuma disciplina encontrada
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Próximas Aulas</CardTitle>
                  <CardDescription>Suas próximas aulas de hoje</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {weeklySchedule.length > 0 ? (
                      weeklySchedule[0]?.subjects?.slice(0, 2).map((subject: any, index: number) => (
                        <div key={index} className="flex items-center p-2 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                          <Calendar className="h-6 w-6 text-blue-500 mr-3" />
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{subject.subjectName}</h4>
                            <p className="text-xs text-muted-foreground">
                              {subject.schedule?.match(/(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/)?.[0] || "Horário não definido"}
                            </p>
                          </div>
                          <Badge className="ml-2 bg-blue-500 text-xs">Hoje</Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        Nenhuma aula hoje
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhuma turma encontrada para este aluno
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastClasses.map((classItem) => (
              <Card 
                key={classItem.id}
                className={`border-2 ${getColorClass(classItem.color)}`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{classItem.name}</CardTitle>
                      <CardDescription>{classItem.level}</CardDescription>
                    </div>
                    <Badge variant="outline">{classItem.year}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">
                        Disciplinas: {classItem.subjects.join(", ")}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">
                        {classItem.students} alunos
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">
                        {classItem.schedule}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Link href={`/class?id=${classItem.id}`}>
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver Histórico
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}