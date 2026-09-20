import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Calendar as CalendarIcon, 
  Download, 
  Save, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn, getUserInitials } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAttendance } from "@/hooks/useApi";
import { Badge } from "@/components/ui/badge";

// Mock data - in a real application, this would be fetched from the API
const STUDENTS_DATA = [
  { 
    id: 1, 
    name: "Lucas Oliveira", 
    registration: "2023001", 
    class: "9º Ano - A", 
    attendance: {
      total: 125,
      present: 120,
      absent: 5,
      percentage: 96,
      dates: {
        "2023-07-10": "present",
        "2023-07-11": "present",
        "2023-07-12": "present",
        "2023-07-13": "absent",
        "2023-07-14": "present",
      }
    },
    avatar: "https://images.unsplash.com/photo-1543269664-56d93c1b41a6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100"
  },
  { 
    id: 2, 
    name: "Mariana Santos", 
    registration: "2023002", 
    class: "9º Ano - A", 
    attendance: {
      total: 125,
      present: 122,
      absent: 3,
      percentage: 98,
      dates: {
        "2023-07-10": "present",
        "2023-07-11": "present",
        "2023-07-12": "present",
        "2023-07-13": "present",
        "2023-07-14": "present",
      }
    },
    avatar: "https://images.unsplash.com/photo-1517256673644-36ad11246d21?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100"
  },
  { 
    id: 3, 
    name: "Pedro Almeida", 
    registration: "2023003", 
    class: "9º Ano - A", 
    attendance: {
      total: 125,
      present: 115,
      absent: 10,
      percentage: 92,
      dates: {
        "2023-07-10": "present",
        "2023-07-11": "absent",
        "2023-07-12": "present",
        "2023-07-13": "present",
        "2023-07-14": "present",
      }
    },
    avatar: "https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100"
  },
  { 
    id: 4, 
    name: "Ana Ferreira", 
    registration: "2023004", 
    class: "9º Ano - A", 
    attendance: {
      total: 125,
      present: 100,
      absent: 25,
      percentage: 80,
      dates: {
        "2023-07-10": "absent",
        "2023-07-11": "present",
        "2023-07-12": "absent",
        "2023-07-13": "present",
        "2023-07-14": "present",
      }
    },
    avatar: null
  },
  { 
    id: 5, 
    name: "Rafael Silva", 
    registration: "2023005", 
    class: "9º Ano - A", 
    attendance: {
      total: 125,
      present: 118,
      absent: 7,
      percentage: 94,
      dates: {
        "2023-07-10": "present",
        "2023-07-11": "present",
        "2023-07-12": "present",
        "2023-07-13": "present",
        "2023-07-14": "absent",
      }
    },
    avatar: null
  },
];

const CLASSES = [
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

const SUBJECTS = [
  "Matemática",
  "Português",
  "Ciências",
  "História",
  "Geografia",
  "Inglês",
  "Artes",
  "Educação Física"
];

export default function AttendancePage() {
  const [selectedClass, setSelectedClass] = useState<string>("9º Ano - A");
  const [selectedSubject, setSelectedSubject] = useState<string>("Matemática");
  const [date, setDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState(STUDENTS_DATA);
  const [attendanceRecord, setAttendanceRecord] = useState<Record<number, boolean>>({});
  const [selectedYear, setSelectedYear] = useState("2024");
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Get user type from the authenticated user
  const userType = user?.role || 'admin';
  const isTeacherOrAdmin = userType === 'teacher' || userType === 'admin' || userType === 'coordinator';
  const isStudent = userType === 'student';

  // Buscar frequência do aluno usando a API real
  const { data: attendanceData, isLoading, error } = useAttendance(
    user?.id || "",
    selectedYear
  );

  // Anos disponíveis
  const availableYears = ["2024", "2023", "2022"];

  // Processar dados de frequência para o formato da interface
  const processedAttendance = useMemo(() => {
    if (!attendanceData?.data) return [];

    // Agrupar frequência por disciplina
    const attendanceBySubject = attendanceData.data.reduce((acc: any, record: any) => {
      const subjectName = record.subjectName || "Disciplina";
      
      if (!acc[subjectName]) {
        acc[subjectName] = {
          subjectName,
          records: [],
          totalClasses: 0,
          presentClasses: 0,
          absentClasses: 0,
          percentage: 0
        };
      }
      
      acc[subjectName].records.push(record);
      return acc;
    }, {});

    // Calcular estatísticas por disciplina
    Object.values(attendanceBySubject).forEach((subject: any) => {
      if (subject.records.length > 0) {
        subject.totalClasses = subject.records.length;
        subject.presentClasses = subject.records.filter((r: any) => r.status === 'present').length;
        subject.absentClasses = subject.records.filter((r: any) => r.status === 'absent').length;
        subject.percentage = Math.round((subject.presentClasses / subject.totalClasses) * 100);
      }
    });

    return Object.values(attendanceBySubject);
  }, [attendanceData]);

  // Filter students based on selected class and search term
  const filteredStudents = students.filter(student => {
    const matchesClass = student.class === selectedClass;
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         student.registration.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesClass && matchesSearch;
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleAttendanceChange = (studentId: number, checked: boolean) => {
    setAttendanceRecord({
      ...attendanceRecord,
      [studentId]: checked
    });
  };

  const handleSaveAttendance = () => {
    // In a real app, this would call an API
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    // Create a copy of the students array
    const updatedStudents = students.map(student => {
      // If this student has a recorded attendance
      if (attendanceRecord[student.id] !== undefined) {
        // Create a deep copy of the student
        const updatedStudent = { ...student };
        
        // Update the attendance record for the selected date
        updatedStudent.attendance = { 
          ...updatedStudent.attendance,
          dates: {
            ...updatedStudent.attendance.dates,
            [formattedDate]: attendanceRecord[student.id] ? "present" : "absent"
          }
        };
        
        // Recalculate attendance totals
        const dates = updatedStudent.attendance.dates;
        const present = Object.values(dates).filter(status => status === "present").length;
        const absent = Object.values(dates).filter(status => status === "absent").length;
        const total = present + absent;
        const percentage = Math.round((present / total) * 100);
        
        updatedStudent.attendance.present = present;
        updatedStudent.attendance.absent = absent;
        updatedStudent.attendance.total = total;
        updatedStudent.attendance.percentage = percentage;
        
        return updatedStudent;
      }
      
      return student;
    });
    
    setStudents(updatedStudents);
    setAttendanceRecord({});
    
    toast({
      title: "Frequência registrada",
      description: `A frequência de ${format(date, 'dd/MM/yyyy')} foi registrada com sucesso.`,
    });
  };

  const handleExportAttendance = () => {
    toast({
      title: "Exportando frequência",
      description: "O relatório de frequência está sendo exportado para PDF.",
    });
  };

  // For student view - get student's own attendance data
  const studentData = isStudent ? 
    students.find(s => s.id === 1) : // Mock - in a real app would use the logged-in student's ID
    null;

  if (isStudent && isLoading) {
    return (
      <MainLayout pageTitle="Minha Frequência">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando frequência...</span>
        </div>
      </MainLayout>
    );
  }

  if (isStudent && error) {
    return (
      <MainLayout pageTitle="Minha Frequência">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Erro ao carregar frequência</p>
            <p className="text-sm text-gray-600">Tente novamente mais tarde</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle="Frequência">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isStudent ? "Minha Frequência" : "Controle de Frequência"}
          </h1>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4 sm:mt-0 w-full sm:w-auto">
            {isStudent && (
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ano Letivo" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year}>
                      Ano Letivo {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <Button variant="outline" className="flex items-center gap-2" onClick={handleExportAttendance}>
              <Download className="h-4 w-4" />
              Exportar Relatório
            </Button>
            
            {isTeacherOrAdmin && (
              <Button 
                className="flex items-center gap-2"
                onClick={handleSaveAttendance}
                disabled={Object.keys(attendanceRecord).length === 0}
              >
                <Save className="h-4 w-4" />
                Salvar Frequência
              </Button>
            )}
          </div>
        </div>
        
        {!isStudent && (
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
            
            <Card>
              <CardContent className="p-4">
                <Label htmlFor="date-select" className="mb-2 block">Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date-select"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(date) => date && setDate(date)}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>
          </div>
        )}
        
        {!isStudent && (
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <Input
                    placeholder="Buscar alunos..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </div>
                
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {format(date, "'Registrando frequência para' dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </div>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Frequência Total</TableHead>
                      {isTeacherOrAdmin && (
                        <TableHead>Presente</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => {
                        // Get the current attendance status for this date
                        const formattedDate = format(date, 'yyyy-MM-dd');
                        const currentStatus = student.attendance.dates[formattedDate];
                        
                        // Set initial checkbox state based on current status
                        const initialChecked = currentStatus === "present";
                        
                        return (
                          <TableRow key={student.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage src={student.avatar} alt={student.name} />
                                  <AvatarFallback className="bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300">
                                    {getUserInitials(student.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="font-medium">{student.name}</div>
                              </div>
                            </TableCell>
                            <TableCell>{student.registration}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <div 
                                  className={`h-2.5 w-2.5 rounded-full mr-2 ${
                                    student.attendance.percentage >= 90 ? "bg-green-500" :
                                    student.attendance.percentage >= 75 ? "bg-yellow-500" :
                                    "bg-red-500"
                                  }`}
                                ></div>
                                <span className="font-medium">{student.attendance.percentage}%</span>
                                <span className="text-gray-500 dark:text-gray-400 ml-2">
                                  ({student.attendance.present}/{student.attendance.total})
                                </span>
                              </div>
                            </TableCell>
                            {isTeacherOrAdmin && (
                              <TableCell>
                                <Checkbox
                                  checked={
                                    attendanceRecord[student.id] !== undefined 
                                      ? attendanceRecord[student.id] 
                                      : initialChecked
                                  }
                                  onCheckedChange={(checked) => 
                                    handleAttendanceChange(student.id, checked as boolean)
                                  }
                                />
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={isTeacherOrAdmin ? 4 : 3} className="h-24 text-center">
                          Nenhum aluno encontrado nesta turma.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
        
        {isStudent && (
          <div>
            {/* Resumo geral da frequência */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center h-24 w-24 rounded-full bg-primary-100 dark:bg-primary-900 mb-4">
                      <span className="text-4xl font-bold text-primary-600 dark:text-primary-300">
                        {processedAttendance.length > 0 
                          ? Math.round(processedAttendance.reduce((acc: any, subj: any) => acc + subj.percentage, 0) / processedAttendance.length)
                          : 0}%
                      </span>
                    </div>
                    <h3 className="text-lg font-medium">Frequência Geral</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Média de todas as disciplinas
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Total de Aulas</h3>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-blue-500" />
                        <span className="text-2xl font-bold">
                          {processedAttendance.reduce((acc: any, subj: any) => acc + subj.totalClasses, 0)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="bg-gray-200 dark:bg-gray-700 h-2 rounded-full">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: "100%" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Disciplinas</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{processedAttendance.length}</span>
                        <span className="text-sm text-gray-500">matérias</span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="bg-gray-200 dark:bg-gray-700 h-2 rounded-full">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: "100%" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Frequência por disciplina */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4">Frequência por Disciplina - {selectedYear}</h3>
                
                {processedAttendance.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum registro de frequência encontrado para o ano {selectedYear}
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Disciplina</TableHead>
                          <TableHead className="text-center">Total de Aulas</TableHead>
                          <TableHead className="text-center">Presentes</TableHead>
                          <TableHead className="text-center">Ausentes</TableHead>
                          <TableHead className="text-center">Percentual</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {processedAttendance.map((subject: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{subject.subjectName}</TableCell>
                            <TableCell className="text-center">{subject.totalClasses}</TableCell>
                            <TableCell className="text-center text-green-600">
                              <div className="flex items-center justify-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                {subject.presentClasses}
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-red-600">
                              <div className="flex items-center justify-center gap-2">
                                <XCircle className="h-4 w-4" />
                                {subject.absentClasses}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div 
                                  className={`h-2.5 w-2.5 rounded-full ${
                                    subject.percentage >= 90 ? "bg-green-500" :
                                    subject.percentage >= 75 ? "bg-yellow-500" :
                                    "bg-red-500"
                                  }`}
                                ></div>
                                <span className="font-medium">{subject.percentage}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge 
                                className={
                                  subject.percentage >= 75 ? "bg-green-500" : "bg-red-500"
                                }
                              >
                                {subject.percentage >= 75 ? "Regular" : "Crítico"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                
                <div className="mt-6">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded-md p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-500">Atenção</h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                          Lembre-se que a frequência mínima necessária para aprovação é de 75%. 
                          Evite faltas desnecessárias e justifique as ausências quando necessário.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
