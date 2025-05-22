import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  DownloadCloud, 
  BarChart3, 
  FileText, 
  Users, 
  UserRound, 
  BookOpen, 
  GraduationCap,
  AlertCircle
} from "lucide-react";
import { PerformanceChart } from "@/components/charts/PerformanceChart";
import { GradeDistributionChart } from "@/components/charts/GradeDistributionChart";
import { AttendanceChart } from "@/components/charts/AttendanceChart";

// Mock data - in a real application, this would be fetched from the API
const CLASSES = [
  "Todas",
  "9º Ano - A",
  "9º Ano - B",
  "8º Ano - A",
  "8º Ano - B",
  "7º Ano - A",
  "7º Ano - B",
  "7º Ano - C",
  "6º Ano - A",
  "6º Ano - B"
];

const PERIODS = [
  "1º Bimestre",
  "2º Bimestre",
  "3º Bimestre",
  "4º Bimestre",
  "Anual"
];

const SUBJECTS = [
  "Todas",
  "Matemática",
  "Português",
  "Ciências",
  "História",
  "Geografia",
  "Inglês",
  "Artes",
  "Educação Física"
];

// Sample students with low performance
const LOW_PERFORMANCE_STUDENTS = [
  { id: 1, name: "Ana Ferreira", class: "9º Ano - A", average: 4.8, attendance: "75%", subjects: ["Matemática", "Física"] },
  { id: 2, name: "Pedro Santos", class: "8º Ano - C", average: 5.2, attendance: "68%", subjects: ["Português", "História"] },
  { id: 3, name: "João Silva", class: "7º Ano - B", average: 5.5, attendance: "72%", subjects: ["Matemática"] },
  { id: 4, name: "Mariana Oliveira", class: "6º Ano - A", average: 5.8, attendance: "70%", subjects: ["Ciências", "Geografia"] },
  { id: 5, name: "Lucas Costa", class: "9º Ano - B", average: 4.5, attendance: "65%", subjects: ["Matemática", "Física", "Química"] }
];

// Sample attendance issues
const ATTENDANCE_ISSUES = [
  { id: 1, name: "Carlos Mendes", class: "8º Ano - A", attendance: "60%", consecutive_absences: 5, last_attendance: "10/07/2023" },
  { id: 2, name: "Julia Pereira", class: "7º Ano - C", attendance: "65%", consecutive_absences: 4, last_attendance: "12/07/2023" },
  { id: 3, name: "Roberto Lima", class: "9º Ano - B", attendance: "62%", consecutive_absences: 3, last_attendance: "11/07/2023" },
  { id: 4, name: "Camila Ferreira", class: "6º Ano - B", attendance: "68%", consecutive_absences: 4, last_attendance: "13/07/2023" }
];

// Sample class performance data
const CLASS_PERFORMANCE = [
  { class_name: "9º Ano - A", students: 32, average: 7.8, attendance: "92%", passing_rate: "90%" },
  { class_name: "9º Ano - B", students: 30, average: 7.5, attendance: "88%", passing_rate: "87%" },
  { class_name: "8º Ano - A", students: 28, average: 7.9, attendance: "90%", passing_rate: "93%" },
  { class_name: "8º Ano - B", students: 31, average: 7.2, attendance: "85%", passing_rate: "84%" },
  { class_name: "8º Ano - C", students: 29, average: 6.8, attendance: "80%", passing_rate: "75%" },
  { class_name: "7º Ano - A", students: 33, average: 8.0, attendance: "93%", passing_rate: "94%" },
  { class_name: "7º Ano - B", students: 32, average: 7.5, attendance: "89%", passing_rate: "88%" },
  { class_name: "7º Ano - C", students: 30, average: 7.1, attendance: "84%", passing_rate: "82%" },
  { class_name: "6º Ano - A", students: 34, average: 8.2, attendance: "95%", passing_rate: "97%" },
  { class_name: "6º Ano - B", students: 33, average: 7.9, attendance: "91%", passing_rate: "91%" }
];

// Sample teacher performance data
const TEACHER_PERFORMANCE = [
  { teacher: "Marcos Silva", subject: "Matemática", classes: 5, students: 150, average: 7.5, approval_rate: "85%" },
  { teacher: "Carla Mendes", subject: "Ciências", classes: 6, students: 180, average: 7.8, approval_rate: "88%" },
  { teacher: "Roberto Lima", subject: "História", classes: 4, students: 120, average: 8.0, approval_rate: "90%" },
  { teacher: "Ana Ferreira", subject: "Português", classes: 5, students: 150, average: 7.7, approval_rate: "87%" },
  { teacher: "Pedro Santos", subject: "Geografia", classes: 4, students: 120, average: 7.9, approval_rate: "89%" }
];

export default function ReportsPage() {
  const [selectedClass, setSelectedClass] = useState<string>("Todas");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("Anual");
  const [selectedSubject, setSelectedSubject] = useState<string>("Todas");
  const [activeTab, setActiveTab] = useState<string>("performance");
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Get user type from the authenticated user
  const userType = user?.role || 'admin';
  const isCoordinatorOrAdmin = userType === 'admin' || userType === 'coordinator';

  const handleExportReport = () => {
    toast({
      title: "Exportando relatório",
      description: "O relatório está sendo gerado e será baixado em instantes.",
    });
  };

  return (
    <MainLayout pageTitle="Relatórios">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios e Análises</h1>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2 mt-4 sm:mt-0"
            onClick={handleExportReport}
          >
            <DownloadCloud className="h-4 w-4" />
            Exportar Relatório
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-4">
              <Label htmlFor="class-select" className="mb-2 block">Turma</Label>
              <Select 
                value={selectedClass} 
                onValueChange={setSelectedClass}
              >
                <SelectTrigger id="class-select">
                  <SelectValue placeholder="Selecione uma turma" />
                </SelectTrigger>
                <SelectContent>
                  {CLASSES.map((cls) => (
                    <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <Label htmlFor="period-select" className="mb-2 block">Período</Label>
              <Select 
                value={selectedPeriod} 
                onValueChange={setSelectedPeriod}
              >
                <SelectTrigger id="period-select">
                  <SelectValue placeholder="Selecione um período" />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map((period) => (
                    <SelectItem key={period} value={period}>{period}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <Label htmlFor="subject-select" className="mb-2 block">Disciplina</Label>
              <Select 
                value={selectedSubject} 
                onValueChange={setSelectedSubject}
              >
                <SelectTrigger id="subject-select">
                  <SelectValue placeholder="Selecione uma disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((subject) => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Users className="h-6 w-6 text-blue-500 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total de Alunos</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">586</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <GraduationCap className="h-6 w-6 text-green-500 dark:text-green-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Média Geral</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">7.5</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                <UserRound className="h-6 w-6 text-yellow-500 dark:text-yellow-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Taxa de Frequência</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">88%</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <BookOpen className="h-6 w-6 text-purple-500 dark:text-purple-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Taxa de Aprovação</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">85%</h3>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Report Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-1 md:grid-cols-4 h-auto">
            <TabsTrigger value="performance" className="flex items-center gap-2 py-3">
              <BarChart3 className="h-4 w-4" />
              <span>Desempenho</span>
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-2 py-3">
              <Users className="h-4 w-4" />
              <span>Frequência</span>
            </TabsTrigger>
            <TabsTrigger value="class" className="flex items-center gap-2 py-3">
              <BookOpen className="h-4 w-4" />
              <span>Turmas</span>
            </TabsTrigger>
            {isCoordinatorOrAdmin && (
              <TabsTrigger value="teacher" className="flex items-center gap-2 py-3">
                <GraduationCap className="h-4 w-4" />
                <span>Professores</span>
              </TabsTrigger>
            )}
          </TabsList>
          
          {/* Performance Tab */}
          <TabsContent value="performance">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Desempenho por Turma</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-80">
                    <PerformanceChart />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Distribuição de Notas</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-80">
                    <GradeDistributionChart />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Alunos com Baixo Desempenho
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Turma</TableHead>
                        <TableHead>Média</TableHead>
                        <TableHead>Frequência</TableHead>
                        <TableHead>Disciplinas Críticas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {LOW_PERFORMANCE_STUDENTS.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.class}</TableCell>
                          <TableCell className="text-red-600 dark:text-red-400">{student.average}</TableCell>
                          <TableCell>{student.attendance}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {student.subjects.map((subject, index) => (
                                <span 
                                  key={index} 
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                >
                                  {subject}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Attendance Tab */}
          <TabsContent value="attendance">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Frequência por Série</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-80">
                    <AttendanceChart />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    Alunos com Problemas de Frequência
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Aluno</TableHead>
                          <TableHead>Turma</TableHead>
                          <TableHead>Frequência</TableHead>
                          <TableHead>Faltas Consecutivas</TableHead>
                          <TableHead>Último Comparecimento</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ATTENDANCE_ISSUES.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell>{student.class}</TableCell>
                            <TableCell className="text-red-600 dark:text-red-400">{student.attendance}</TableCell>
                            <TableCell>{student.consecutive_absences}</TableCell>
                            <TableCell>{student.last_attendance}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Análise de Frequência por Período</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Período</TableHead>
                        <TableHead>Dias Letivos</TableHead>
                        <TableHead>Frequência Média</TableHead>
                        <TableHead>Maior Frequência</TableHead>
                        <TableHead>Menor Frequência</TableHead>
                        <TableHead>Alunos Abaixo de 75%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">1º Bimestre</TableCell>
                        <TableCell>52</TableCell>
                        <TableCell>90%</TableCell>
                        <TableCell>6º Ano A (95%)</TableCell>
                        <TableCell>8º Ano C (82%)</TableCell>
                        <TableCell>5</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">2º Bimestre</TableCell>
                        <TableCell>48</TableCell>
                        <TableCell>88%</TableCell>
                        <TableCell>6º Ano A (93%)</TableCell>
                        <TableCell>8º Ano C (80%)</TableCell>
                        <TableCell>8</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">3º Bimestre</TableCell>
                        <TableCell>50</TableCell>
                        <TableCell>87%</TableCell>
                        <TableCell>7º Ano A (92%)</TableCell>
                        <TableCell>9º Ano B (78%)</TableCell>
                        <TableCell>10</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">4º Bimestre</TableCell>
                        <TableCell>45</TableCell>
                        <TableCell>85%</TableCell>
                        <TableCell>6º Ano A (90%)</TableCell>
                        <TableCell>8º Ano C (75%)</TableCell>
                        <TableCell>12</TableCell>
                      </TableRow>
                      <TableRow className="font-medium">
                        <TableCell className="font-bold">Anual</TableCell>
                        <TableCell>195</TableCell>
                        <TableCell>88%</TableCell>
                        <TableCell>6º Ano A (93%)</TableCell>
                        <TableCell>8º Ano C (79%)</TableCell>
                        <TableCell>9 (média)</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Classes Tab */}
          <TabsContent value="class">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Desempenho por Turma</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Turma</TableHead>
                        <TableHead>Alunos</TableHead>
                        <TableHead>Média Geral</TableHead>
                        <TableHead>Frequência</TableHead>
                        <TableHead>Taxa de Aprovação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {CLASS_PERFORMANCE.map((cls) => (
                        <TableRow key={cls.class_name}>
                          <TableCell className="font-medium">{cls.class_name}</TableCell>
                          <TableCell>{cls.students}</TableCell>
                          <TableCell className={cls.average >= 7 ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}>
                            {cls.average}
                          </TableCell>
                          <TableCell>{cls.attendance}</TableCell>
                          <TableCell>{cls.passing_rate}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Disciplinas com Melhor Desempenho</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <span className="font-medium">Educação Física</span>
                      </div>
                      <span className="font-bold">8.7</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <span className="font-medium">Artes</span>
                      </div>
                      <span className="font-bold">8.5</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <span className="font-medium">Ciências</span>
                      </div>
                      <span className="font-bold">8.2</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <span className="font-medium">História</span>
                      </div>
                      <span className="font-bold">7.9</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <span className="font-medium">Geografia</span>
                      </div>
                      <span className="font-bold">7.8</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Disciplinas com Desempenho Crítico</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-red-500"></div>
                        <span className="font-medium">Matemática</span>
                      </div>
                      <span className="font-bold">6.5</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-red-500"></div>
                        <span className="font-medium">Física</span>
                      </div>
                      <span className="font-bold">6.7</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                        <span className="font-medium">Química</span>
                      </div>
                      <span className="font-bold">7.0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                        <span className="font-medium">Português</span>
                      </div>
                      <span className="font-bold">7.2</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                        <span className="font-medium">Inglês</span>
                      </div>
                      <span className="font-bold">7.3</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Teachers Tab (only for admin and coordinator) */}
          {isCoordinatorOrAdmin && (
            <TabsContent value="teacher">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Desempenho por Professor</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Professor</TableHead>
                          <TableHead>Disciplina</TableHead>
                          <TableHead>Turmas</TableHead>
                          <TableHead>Alunos</TableHead>
                          <TableHead>Média das Turmas</TableHead>
                          <TableHead>Taxa de Aprovação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {TEACHER_PERFORMANCE.map((teacher, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{teacher.teacher}</TableCell>
                            <TableCell>{teacher.subject}</TableCell>
                            <TableCell>{teacher.classes}</TableCell>
                            <TableCell>{teacher.students}</TableCell>
                            <TableCell className={teacher.average >= 7.5 ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}>
                              {teacher.average}
                            </TableCell>
                            <TableCell>{teacher.approval_rate}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-medium">Observações e Recomendações</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Áreas de Atenção</h4>
                        <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400 text-sm">
                          <li>Matemática apresenta o menor desempenho geral, com média de 6.5.</li>
                          <li>A turma 8º Ano C apresenta a menor frequência (80%) e taxa de aprovação (75%).</li>
                          <li>14 alunos estão com frequência abaixo de 75% e precisam de atenção imediata.</li>
                          <li>Observa-se queda de frequência no 4º bimestre (85%) em comparação ao 1º bimestre (90%).</li>
                        </ul>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Recomendações</h4>
                        <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400 text-sm">
                          <li>Implementar reforço escolar para alunos com baixo desempenho em Matemática e Física.</li>
                          <li>Realizar reunião específica com responsáveis de alunos com baixa frequência.</li>
                          <li>Desenvolver estratégias para manter o engajamento dos alunos no 4º bimestre.</li>
                          <li>Analisar práticas pedagógicas da turma 6º Ano A para replicar nas demais (melhor desempenho).</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-medium">Comparativo Anual</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Média Geral</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span>2023</span>
                            <span className="font-medium">7.5</span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                            <div className="h-2 bg-blue-500 rounded-full" style={{ width: "75%" }}></div>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm">
                            <span>2022</span>
                            <span className="font-medium">7.2</span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                            <div className="h-2 bg-blue-500 rounded-full" style={{ width: "72%" }}></div>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm">
                            <span>2021</span>
                            <span className="font-medium">7.0</span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                            <div className="h-2 bg-blue-500 rounded-full" style={{ width: "70%" }}></div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Taxa de Aprovação</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span>2023</span>
                            <span className="font-medium">85%</span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                            <div className="h-2 bg-green-500 rounded-full" style={{ width: "85%" }}></div>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm">
                            <span>2022</span>
                            <span className="font-medium">82%</span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                            <div className="h-2 bg-green-500 rounded-full" style={{ width: "82%" }}></div>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm">
                            <span>2021</span>
                            <span className="font-medium">80%</span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                            <div className="h-2 bg-green-500 rounded-full" style={{ width: "80%" }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
        
        <div className="mt-6 flex justify-end">
          <Button className="flex items-center gap-2" onClick={handleExportReport}>
            <FileText className="h-4 w-4" />
            Gerar Relatório Completo
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
