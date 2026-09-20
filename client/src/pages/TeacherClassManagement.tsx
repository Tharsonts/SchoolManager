import { useState } from "react";
import { useLocation } from "wouter";
import { Users, ChevronRight, GraduationCap, Calendar, BookOpen, Loader2, UserCheck, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserInitials } from "@/lib/utils";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  registrationNumber: string;
  profileImageUrl?: string;
}

interface ClassInfo {
  id: string;
  name: string;
  grade: string;
  section: string;
  academicYear: string;
  subjects: Array<{
    id: string;
    name: string;
    code: string;
    schedule?: string;
    room?: string;
  }>;
  studentCount: number;
  students: Student[];
}

export default function TeacherClassManagement() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // Buscar turmas do professor com detalhes
  const { data: classesData, isLoading } = useQuery({
    queryKey: ['teacher-class-management', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/teacher/${user?.id}/classes-detailed`);
      if (!response.ok) throw new Error('Falha ao carregar turmas');
      return response.json();
    },
    enabled: !!user?.id
  });

  const classes: ClassInfo[] = (classesData?.data || []).map(classInfo => ({
    ...classInfo,
    students: classInfo.students || []
  }));

  if (isLoading) {
    return (
      <MainLayout pageTitle="Gestão de Turmas">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle="Gestão de Turmas">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Minhas Turmas</h1>
            <p className="text-muted-foreground">
              Gerencie presença, notas e informações dos seus alunos
            </p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {classes.length} turma{classes.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Lista de Turmas */}
        {classes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <GraduationCap className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma turma encontrada</h3>
              <p className="text-muted-foreground text-center">
                Você ainda não possui turmas atribuídas neste período letivo.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classInfo) => (
              <Card 
                key={classInfo.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/class-detail/${classInfo.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{classInfo.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {classInfo.grade} - Turma {classInfo.section}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Informações básicas */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {classInfo.studentCount} aluno{classInfo.studentCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <Badge variant="outline">
                      {classInfo.academicYear}
                    </Badge>
                  </div>

                  {/* Disciplinas */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Disciplinas:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {classInfo.subjects.slice(0, 3).map((subject) => (
                        <Badge key={subject.id} variant="secondary" className="text-xs">
                          {subject.code}
                        </Badge>
                      ))}
                      {classInfo.subjects.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{classInfo.subjects.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Horários */}
                  {classInfo.subjects.some(s => s.schedule) && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Próxima aula: {classInfo.subjects.find(s => s.schedule)?.schedule}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Lista de Alunos */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Alunos:</span>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {classInfo.students.length === 0 ? (
                        <div className="text-xs text-muted-foreground text-center py-2">
                          Nenhum aluno matriculado
                        </div>
                      ) : (
                        <>
                          {classInfo.students.slice(0, 4).map((student) => (
                            <div key={student.id} className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={student.profileImageUrl} />
                                <AvatarFallback className="text-xs">
                                  {getUserInitials(student.firstName + ' ' + student.lastName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium truncate">
                                  {student.firstName} {student.lastName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {student.registrationNumber}
                                </div>
                              </div>
                            </div>
                          ))}
                          {classInfo.students.length > 4 && (
                            <div className="text-xs text-muted-foreground text-center py-1">
                              +{classInfo.students.length - 4} aluno{classInfo.students.length - 4 !== 1 ? 's' : ''}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Ações rápidas */}
                  <div className="flex gap-2 pt-3 border-t">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/class-detail/${classInfo.id}/attendance`);
                      }}
                    >
                      <UserCheck className="h-3 w-3 mr-1" />
                      Presença
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/class-detail/${classInfo.id}/grades`);
                      }}
                    >
                      <ClipboardList className="h-3 w-3 mr-1" />
                      Notas
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
