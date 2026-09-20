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
import { Button } from "@/components/ui/button";
import { CalendarDays, BookOpen, Users, Clock, Info, MapPin, User, Calendar } from "lucide-react";
import { getUserInitials } from "@/lib/utils";
import { useState } from "react";

interface ScheduleItem {
  id: string;
  subjectName: string;
  teacherName: string;
  classroom: string;
  startTime: string;
  endTime: string;
  dayOfWeek: number; // 0 = Domingo, 1 = Segunda, etc.
  color?: string;
}

interface DaySchedule {
  dayName: string;
  dayNumber: number;
  items: ScheduleItem[];
}

export default function ClassPage() {
  const [activeScheduleTab, setActiveScheduleTab] = useState('today');
  
  const daysOfWeek = [
    { name: 'Domingo', number: 0 },
    { name: 'Segunda-feira', number: 1 },
    { name: 'Terça-feira', number: 2 },
    { name: 'Quarta-feira', number: 3 },
    { name: 'Quinta-feira', number: 4 },
    { name: 'Sexta-feira', number: 5 },
    { name: 'Sábado', number: 6 }
  ];

  const subjectColors = {
    'Matemática': 'bg-blue-100 text-blue-800 border-blue-200',
    'Português': 'bg-green-100 text-green-800 border-green-200',
    'História': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Geografia': 'bg-purple-100 text-purple-800 border-purple-200',
    'Ciências': 'bg-red-100 text-red-800 border-red-200',
    'Inglês': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Educação Física': 'bg-orange-100 text-orange-800 border-orange-200',
    'Artes': 'bg-pink-100 text-pink-800 border-pink-200'
  };

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

  const [detailedSchedule] = useState<ScheduleItem[]>([
    {
      id: '1',
      subjectName: 'Matemática',
      teacherName: 'Prof. João Silva',
      classroom: 'Sala 101',
      startTime: '07:30',
      endTime: '09:10',
      dayOfWeek: 1
    },
    {
      id: '2',
      subjectName: 'Português',
      teacherName: 'Prof. Ana Santos',
      classroom: 'Sala 102',
      startTime: '09:30',
      endTime: '11:10',
      dayOfWeek: 1
    },
    {
      id: '3',
      subjectName: 'Ciências',
      teacherName: 'Prof. Pedro Oliveira',
      classroom: 'Lab. Ciências',
      startTime: '07:30',
      endTime: '09:10',
      dayOfWeek: 2
    },
    {
      id: '4',
      subjectName: 'História',
      teacherName: 'Prof. Carlos Lima',
      classroom: 'Sala 103',
      startTime: '09:30',
      endTime: '11:10',
      dayOfWeek: 2
    },
    {
      id: '5',
      subjectName: 'Geografia',
      teacherName: 'Prof. Maria Costa',
      classroom: 'Sala 104',
      startTime: '07:30',
      endTime: '09:10',
      dayOfWeek: 3
    },
    {
      id: '6',
      subjectName: 'Educação Física',
      teacherName: 'Prof. Roberto Santos',
      classroom: 'Quadra',
      startTime: '09:30',
      endTime: '11:10',
      dayOfWeek: 3
    },
    {
      id: '7',
      subjectName: 'Artes',
      teacherName: 'Prof. Lucia Fernandes',
      classroom: 'Sala de Arte',
      startTime: '07:30',
      endTime: '09:10',
      dayOfWeek: 4
    },
    {
      id: '8',
      subjectName: 'Inglês',
      teacherName: 'Prof. Sarah Johnson',
      classroom: 'Sala 105',
      startTime: '09:30',
      endTime: '11:10',
      dayOfWeek: 4
    },
    {
      id: '9',
      subjectName: 'Matemática',
      teacherName: 'Prof. João Silva',
      classroom: 'Sala 101',
      startTime: '07:30',
      endTime: '09:10',
      dayOfWeek: 5
    },
    {
      id: '10',
      subjectName: 'Português',
      teacherName: 'Prof. Ana Santos',
      classroom: 'Sala 102',
      startTime: '09:30',
      endTime: '11:10',
      dayOfWeek: 5
    }
  ]);

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

  // Funções auxiliares para manipulação de horários
  const getScheduleByDay = (): DaySchedule[] => {
    return daysOfWeek.map(day => ({
      dayName: day.name,
      dayNumber: day.number,
      items: detailedSchedule
        .filter(item => item.dayOfWeek === day.number)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
    }));
  };

  const getTodaySchedule = (): ScheduleItem[] => {
    const today = new Date().getDay();
    return detailedSchedule
      .filter(item => item.dayOfWeek === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getCurrentClass = (): ScheduleItem | null => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const today = now.getDay();
    
    const todayClasses = detailedSchedule.filter(item => item.dayOfWeek === today);
    
    return todayClasses.find(item => 
      currentTime >= item.startTime && currentTime <= item.endTime
    ) || null;
  };

  const getNextClass = (): ScheduleItem | null => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const today = now.getDay();
    
    const todayClasses = detailedSchedule
      .filter(item => item.dayOfWeek === today && item.startTime > currentTime)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    return todayClasses[0] || null;
  };

  const getSubjectColor = (subjectName: string): string => {
    return subjectColors[subjectName as keyof typeof subjectColors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Dados calculados
  const currentClass = getCurrentClass();
  const nextClass = getNextClass();
  const todaySchedule = getTodaySchedule();
  const weekSchedule = getScheduleByDay();

  return (
    <MainLayout pageTitle={`Turma: ${selectedClass.name}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Coluna Esquerda - Informações da Turma */}
        <div className="space-y-6">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-2xl">📊 Informações da Turma</CardTitle>
              <CardDescription>Detalhes básicos sobre a turma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <div className="mr-4 bg-blue-500 p-3 rounded-full">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-600">Turma</p>
                    <p className="font-bold text-blue-800">{selectedClass.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                  <div className="mr-4 bg-purple-500 p-3 rounded-full">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-600">Nível</p>
                    <p className="font-bold text-purple-800">{selectedClass.level}</p>
                  </div>
                </div>
                
                <div className="flex items-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
                  <div className="mr-4 bg-emerald-500 p-3 rounded-full">
                    <CalendarDays className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-600">Ano Letivo</p>
                    <p className="font-bold text-emerald-800">{selectedClass.year}</p>
                  </div>
                </div>
                
                <div className="flex items-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200">
                  <div className="mr-4 bg-amber-500 p-3 rounded-full">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-600">Horário Principal</p>
                    <p className="font-bold text-amber-800">Segunda à Sexta, 07:30 - 11:10</p>
                  </div>
                </div>
                
                <div className="flex items-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
                  <div className="mr-4 bg-red-500 p-3 rounded-full">
                    <Info className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-600">Total de Alunos</p>
                    <p className="font-bold text-red-800">{selectedClass.students} alunos</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita - 3 Abas */}
        <div className="space-y-6">
          <Tabs defaultValue="students">
            <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm border border-amber-200 rounded-xl p-1 shadow-lg">
              <TabsTrigger 
                value="students" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg"
              >
                <Users className="w-4 h-4 mr-2" />
                Alunos
              </TabsTrigger>
              <TabsTrigger 
                value="subjects" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Disciplinas
              </TabsTrigger>
              <TabsTrigger 
                value="schedule" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg"
              >
                <Clock className="w-4 h-4 mr-2" />
                Horário
              </TabsTrigger>
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
            
            <TabsContent value="schedule">
              <div className="space-y-6">
                {/* Header do Horário */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">Horários da Turma</h2>
                  <p className="text-gray-600">Acompanhe a programação de aulas e status atual</p>
                </div>

                {/* Status atual */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {currentClass && (
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-green-800 flex items-center space-x-2">
                          <Clock className="h-5 w-5" />
                          <span>Aula Atual</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg text-green-900">{currentClass.subjectName}</h3>
                          <div className="flex items-center space-x-2 text-green-700">
                            <User className="h-4 w-4" />
                            <span>{currentClass.teacherName}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-green-700">
                            <MapPin className="h-4 w-4" />
                            <span>{currentClass.classroom}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-green-700">
                            <Clock className="h-4 w-4" />
                            <span>{currentClass.startTime} - {currentClass.endTime}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {nextClass && (
                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-blue-800 flex items-center space-x-2">
                          <Calendar className="h-5 w-5" />
                          <span>Próxima Aula</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg text-blue-900">{nextClass.subjectName}</h3>
                          <div className="flex items-center space-x-2 text-blue-700">
                            <User className="h-4 w-4" />
                            <span>{nextClass.teacherName}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-blue-700">
                            <MapPin className="h-4 w-4" />
                            <span>{nextClass.classroom}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-blue-700">
                            <Clock className="h-4 w-4" />
                            <span>{nextClass.startTime} - {nextClass.endTime}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {!currentClass && !nextClass && (
                    <Card className="md:col-span-2">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Calendar className="h-5 w-5" />
                          <span>Status Atual</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600">Não há aulas no momento. Aproveite o tempo livre!</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Sub-abas de horários */}
                <Tabs value={activeScheduleTab} onValueChange={setActiveScheduleTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="today">Hoje</TabsTrigger>
                    <TabsTrigger value="week">Semana Completa</TabsTrigger>
                  </TabsList>

                  <TabsContent value="today" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Calendar className="h-5 w-5" />
                          <span>Horários de Hoje</span>
                        </CardTitle>
                        <CardDescription>
                          {daysOfWeek.find(day => day.number === new Date().getDay())?.name}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {todaySchedule.length > 0 ? (
                          <div className="space-y-3">
                            {todaySchedule.map((item) => (
                              <div key={item.id} className={`p-4 rounded-lg border-2 ${getSubjectColor(item.subjectName)}`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <BookOpen className="h-5 w-5" />
                                    <div>
                                      <h3 className="font-semibold">{item.subjectName}</h3>
                                      <p className="text-sm opacity-75">{item.teacherName}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">{item.startTime} - {item.endTime}</p>
                                    <p className="text-sm opacity-75">{item.classroom}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600">Não há aulas hoje</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="week" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {weekSchedule.map((day) => (
                        <Card key={day.dayNumber} className={day.dayNumber === new Date().getDay() ? 'ring-2 ring-amber-500' : ''}>
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center space-x-2">
                              <Calendar className="h-5 w-5" />
                              <span>{day.dayName}</span>
                              {day.dayNumber === new Date().getDay() && (
                                <Badge variant="secondary" className="ml-2">Hoje</Badge>
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {day.items.length > 0 ? (
                              <div className="space-y-2">
                                {day.items.map((item) => (
                                  <div key={item.id} className={`p-3 rounded-md border ${getSubjectColor(item.subjectName)}`}>
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <h4 className="font-medium text-sm">{item.subjectName}</h4>
                                        <p className="text-xs opacity-75">{item.classroom}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-xs font-medium">{item.startTime}</p>
                                        <p className="text-xs opacity-75">{item.endTime}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-4">
                                <p className="text-sm text-gray-500">Sem aulas</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}