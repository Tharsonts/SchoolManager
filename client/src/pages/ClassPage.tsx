import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, BookOpen, Users, Clock, Info } from "lucide-react";
import { getUserInitials } from "@/lib/utils";
import { useState } from "react";

export default function ClassPage() {
  const [selectedClass] = useState({
    id: "1A",
    name: "1º Ano A",
    level: "Ensino Fundamental",
    year: "2023",
    teacher: "Professor Escola",
    students: 30,
    schedule: [
      { day: "Segunda", time: "07:30 - 09:10", subject: "Matemática" },
      { day: "Segunda", time: "09:30 - 11:10", subject: "Português" },
      { day: "Terça", time: "07:30 - 09:10", subject: "Ciências" },
      { day: "Terça", time: "09:30 - 11:10", subject: "História" },
      { day: "Quarta", time: "07:30 - 09:10", subject: "Geografia" },
      { day: "Quarta", time: "09:30 - 11:10", subject: "Educação Física" },
      { day: "Quinta", time: "07:30 - 09:10", subject: "Artes" },
      { day: "Quinta", time: "09:30 - 11:10", subject: "Inglês" },
      { day: "Sexta", time: "07:30 - 09:10", subject: "Matemática" },
      { day: "Sexta", time: "09:30 - 11:10", subject: "Português" },
    ]
  });

  const [students] = useState([
    { id: 1, name: "Ana Silva", enrollment: "2023001", status: "Ativo" },
    { id: 2, name: "Bruno Oliveira", enrollment: "2023002", status: "Ativo" },
    { id: 3, name: "Carla Santos", enrollment: "2023003", status: "Ativo" },
    { id: 4, name: "Daniel Pereira", enrollment: "2023004", status: "Ativo" },
    { id: 5, name: "Elena Martins", enrollment: "2023005", status: "Ativo" },
    { id: 6, name: "Fábio Costa", enrollment: "2023006", status: "Ativo" },
    { id: 7, name: "Gabriela Lima", enrollment: "2023007", status: "Licença" },
    { id: 8, name: "Henrique Alves", enrollment: "2023008", status: "Ativo" },
    { id: 9, name: "Isabela Ribeiro", enrollment: "2023009", status: "Ativo" },
    { id: 10, name: "João Ferreira", enrollment: "2023010", status: "Ativo" },
  ]);

  const [subjects] = useState([
    { id: 1, name: "Matemática", teacher: "Professor Escola", weeklyHours: 4 },
    { id: 2, name: "Português", teacher: "Professor Escola", weeklyHours: 4 },
    { id: 3, name: "Ciências", teacher: "Professor Escola", weeklyHours: 3 },
    { id: 4, name: "História", teacher: "Professor Escola", weeklyHours: 2 },
    { id: 5, name: "Geografia", teacher: "Professor Escola", weeklyHours: 2 },
    { id: 6, name: "Educação Física", teacher: "Professor Escola", weeklyHours: 2 },
    { id: 7, name: "Artes", teacher: "Professor Escola", weeklyHours: 1 },
    { id: 8, name: "Inglês", teacher: "Professor Escola", weeklyHours: 2 },
  ]);

  return (
    <MainLayout pageTitle={`Turma: ${selectedClass.name}`}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Turma</CardTitle>
              <CardDescription>Detalhes básicos sobre a turma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="mr-4 bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Turma</p>
                    <p className="font-semibold">{selectedClass.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="mr-4 bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
                    <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nível</p>
                    <p className="font-semibold">{selectedClass.level}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="mr-4 bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-full">
                    <CalendarDays className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ano Letivo</p>
                    <p className="font-semibold">{selectedClass.year}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="mr-4 bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full">
                    <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Horário Principal</p>
                    <p className="font-semibold">Segunda à Sexta, 07:30 - 11:10</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="mr-4 bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
                    <Info className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total de Alunos</p>
                    <p className="font-semibold">{selectedClass.students} alunos</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Horário Semanal</CardTitle>
              <CardDescription>Quadro de horários da turma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dia</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead>Disciplina</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedClass.schedule.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.day}</TableCell>
                        <TableCell>{item.time}</TableCell>
                        <TableCell>{item.subject}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="students">
          <TabsList>
            <TabsTrigger value="students">Alunos</TabsTrigger>
            <TabsTrigger value="subjects">Disciplinas</TabsTrigger>
            <TabsTrigger value="performance">Desempenho</TabsTrigger>
          </TabsList>
          
          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Alunos</CardTitle>
                <CardDescription>
                  Alunos matriculados nesta turma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Avatar</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Matrícula</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <Avatar>
                              <AvatarImage src={`https://i.pravatar.cc/150?u=${student.id}`} alt={student.name} />
                              <AvatarFallback>{getUserInitials(student.name)}</AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.enrollment}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline"
                              className={student.status === "Ativo" ? "bg-green-500/10 text-green-600 border-green-500" : "bg-yellow-500/10 text-yellow-600 border-yellow-500"}
                            >
                              {student.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="subjects">
            <Card>
              <CardHeader>
                <CardTitle>Disciplinas</CardTitle>
                <CardDescription>
                  Disciplinas ministradas nesta turma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Disciplina</TableHead>
                        <TableHead>Professor</TableHead>
                        <TableHead>Carga Horária Semanal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjects.map((subject) => (
                        <TableRow key={subject.id}>
                          <TableCell className="font-medium">{subject.name}</TableCell>
                          <TableCell>{subject.teacher}</TableCell>
                          <TableCell>{subject.weeklyHours} horas</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Desempenho da Turma</CardTitle>
                <CardDescription>
                  Resumo de desempenho acadêmico da turma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Média Geral</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">7.5</p>
                    <p className="text-xs text-muted-foreground mt-1">Todas as disciplinas</p>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Frequência Média</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">92%</p>
                    <p className="text-xs text-muted-foreground mt-1">Últimos 30 dias</p>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Taxa de Aprovação</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">87%</p>
                    <p className="text-xs text-muted-foreground mt-1">Previsão atual</p>
                  </div>
                </div>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Disciplina</TableHead>
                        <TableHead className="text-center">Média da Turma</TableHead>
                        <TableHead className="text-center">Melhor Nota</TableHead>
                        <TableHead className="text-center">Taxa de Aprovação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Matemática</TableCell>
                        <TableCell className="text-center">6.8</TableCell>
                        <TableCell className="text-center">9.5</TableCell>
                        <TableCell className="text-center">82%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Português</TableCell>
                        <TableCell className="text-center">7.2</TableCell>
                        <TableCell className="text-center">9.0</TableCell>
                        <TableCell className="text-center">90%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Ciências</TableCell>
                        <TableCell className="text-center">7.5</TableCell>
                        <TableCell className="text-center">9.8</TableCell>
                        <TableCell className="text-center">88%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">História</TableCell>
                        <TableCell className="text-center">7.0</TableCell>
                        <TableCell className="text-center">9.2</TableCell>
                        <TableCell className="text-center">85%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Geografia</TableCell>
                        <TableCell className="text-center">7.3</TableCell>
                        <TableCell className="text-center">9.0</TableCell>
                        <TableCell className="text-center">87%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}