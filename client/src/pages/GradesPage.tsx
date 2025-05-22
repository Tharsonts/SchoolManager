import { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Download, Plus, FileText, Save, BookOpen } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserInitials, getGradeColor } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

// Mock data - in a real application, this would be fetched from the API
const STUDENTS_DATA = [
  { 
    id: 1, 
    name: "Lucas Oliveira", 
    registration: "2023001", 
    class: "9º Ano - A", 
    grades: {
      math: { grade1: 8.5, grade2: 7.5, grade3: 8.0, grade4: 9.0, final: 8.3 },
      portuguese: { grade1: 7.0, grade2: 8.0, grade3: 7.5, grade4: 8.5, final: 7.8 },
      science: { grade1: 9.0, grade2: 8.5, grade3: 9.5, grade4: 8.0, final: 8.8 },
      history: { grade1: 7.5, grade2: 8.0, grade3: 7.0, grade4: 8.5, final: 7.8 },
      geography: { grade1: 8.0, grade2: 7.5, grade3: 8.5, grade4: 7.0, final: 7.8 }
    },
    avatar: "https://images.unsplash.com/photo-1543269664-56d93c1b41a6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100"
  },
  { 
    id: 2, 
    name: "Mariana Santos", 
    registration: "2023002", 
    class: "9º Ano - A", 
    grades: {
      math: { grade1: 9.5, grade2: 9.0, grade3: 9.5, grade4: 9.0, final: 9.3 },
      portuguese: { grade1: 8.5, grade2: 9.0, grade3: 8.5, grade4: 9.0, final: 8.8 },
      science: { grade1: 8.0, grade2: 8.5, grade3: 8.0, grade4: 8.5, final: 8.3 },
      history: { grade1: 9.0, grade2: 9.5, grade3: 9.0, grade4: 9.5, final: 9.3 },
      geography: { grade1: 8.5, grade2: 9.0, grade3: 8.5, grade4: 9.0, final: 8.8 }
    },
    avatar: "https://images.unsplash.com/photo-1517256673644-36ad11246d21?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100"
  },
  { 
    id: 3, 
    name: "Pedro Almeida", 
    registration: "2023003", 
    class: "9º Ano - A", 
    grades: {
      math: { grade1: 7.0, grade2: 6.5, grade3: 7.5, grade4: 7.0, final: 7.0 },
      portuguese: { grade1: 6.5, grade2: 7.0, grade3: 6.0, grade4: 7.5, final: 6.8 },
      science: { grade1: 8.0, grade2: 7.5, grade3: 8.0, grade4: 7.5, final: 7.8 },
      history: { grade1: 7.5, grade2: 7.0, grade3: 7.5, grade4: 7.0, final: 7.3 },
      geography: { grade1: 7.0, grade2: 7.5, grade3: 7.0, grade4: 7.5, final: 7.3 }
    },
    avatar: "https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100"
  },
  { 
    id: 4, 
    name: "Ana Ferreira", 
    registration: "2023004", 
    class: "9º Ano - A", 
    grades: {
      math: { grade1: 6.0, grade2: 5.5, grade3: 6.5, grade4: 6.0, final: 6.0 },
      portuguese: { grade1: 7.0, grade2: 6.5, grade3: 7.0, grade4: 6.5, final: 6.8 },
      science: { grade1: 6.5, grade2: 6.0, grade3: 6.5, grade4: 6.0, final: 6.3 },
      history: { grade1: 6.0, grade2: 6.5, grade3: 6.0, grade4: 6.5, final: 6.3 },
      geography: { grade1: 6.5, grade2: 6.0, grade3: 6.5, grade4: 6.0, final: 6.3 }
    },
    avatar: ""
  },
  { 
    id: 5, 
    name: "Rafael Silva", 
    registration: "2023005", 
    class: "9º Ano - A", 
    grades: {
      math: { grade1: 8.0, grade2: 8.5, grade3: 8.0, grade4: 8.5, final: 8.3 },
      portuguese: { grade1: 7.5, grade2: 8.0, grade3: 7.5, grade4: 8.0, final: 7.8 },
      science: { grade1: 8.5, grade2: 8.0, grade3: 8.5, grade4: 8.0, final: 8.3 },
      history: { grade1: 8.0, grade2: 7.5, grade3: 8.0, grade4: 7.5, final: 7.8 },
      geography: { grade1: 7.5, grade2: 8.0, grade3: 7.5, grade4: 8.0, final: 7.8 }
    },
    avatar: ""
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
  "math",
  "portuguese",
  "science",
  "history",
  "geography"
];

const SUBJECT_NAMES: Record<string, string> = {
  math: "Matemática",
  portuguese: "Português",
  science: "Ciências",
  history: "História",
  geography: "Geografia"
};

export default function GradesPage() {
  const [selectedClass, setSelectedClass] = useState<string>("9º Ano - A");
  const [selectedSubject, setSelectedSubject] = useState<string>("math");
  const [students, setStudents] = useState(STUDENTS_DATA);
  const [period, setPeriod] = useState<string>("grade1");
  const [editedGrades, setEditedGrades] = useState<Record<number, string>>({});
  const [isAddGradeDialogOpen, setIsAddGradeDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Get user type from the authenticated user
  const userType = user?.role || 'admin';
  const isTeacherOrAdmin = userType === 'teacher' || userType === 'admin' || userType === 'coordinator';

  // Filter students based on selected class
  const filteredStudents = students.filter(student => student.class === selectedClass);

  const handleGradeChange = (studentId: number, value: string) => {
    setEditedGrades({
      ...editedGrades,
      [studentId]: value
    });
  };

  const handleSaveGrades = () => {
    // Create a copy of the students array
    const updatedStudents = students.map(student => {
      // If this student has edited grades
      if (editedGrades[student.id]) {
        // Create a deep copy of the student
        const updatedStudent = { ...student };
        
        // Update the grade for the selected period
        const gradeValue = parseFloat(editedGrades[student.id]);
        if (!isNaN(gradeValue) && gradeValue >= 0 && gradeValue <= 10) {
          updatedStudent.grades = { 
            ...updatedStudent.grades,
            [selectedSubject]: {
              ...updatedStudent.grades[selectedSubject as keyof typeof updatedStudent.grades],
              [period]: gradeValue
            }
          };
          
          // Recalculate final grade
          const subjectGrades = updatedStudent.grades[selectedSubject as keyof typeof updatedStudent.grades];
          const grades = [
            subjectGrades.grade1,
            subjectGrades.grade2,
            subjectGrades.grade3,
            subjectGrades.grade4
          ];
          const sum = grades.reduce((acc, grade) => acc + grade, 0);
          const final = parseFloat((sum / grades.length).toFixed(1));
          
          updatedStudent.grades[selectedSubject as keyof typeof updatedStudent.grades].final = final;
        }
        
        return updatedStudent;
      }
      
      return student;
    });
    
    setStudents(updatedStudents);
    setEditedGrades({});
    
    toast({
      title: "Notas salvas",
      description: `As notas de ${SUBJECT_NAMES[selectedSubject]} foram salvas com sucesso.`,
    });
  };

  const handleExportGrades = () => {
    toast({
      title: "Exportando notas",
      description: "As notas estão sendo exportadas para PDF.",
    });
  };

  return (
    <MainLayout pageTitle="Notas">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciamento de Notas</h1>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4 sm:mt-0 w-full sm:w-auto">
            <Button variant="outline" className="flex items-center gap-2" onClick={handleExportGrades}>
              <Download className="h-4 w-4" />
              Exportar Boletim
            </Button>
            
            {isTeacherOrAdmin && (
              <Button 
                className="flex items-center gap-2"
                onClick={handleSaveGrades}
                disabled={Object.keys(editedGrades).length === 0}
              >
                <Save className="h-4 w-4" />
                Salvar Notas
              </Button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
                    <SelectItem key={subject} value={subject}>{SUBJECT_NAMES[subject]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardContent className="p-4">
              <Label className="mb-2 block">Período</Label>
              <Tabs defaultValue="grade1" value={period} onValueChange={setPeriod} className="w-full">
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="grade1">1º Bimestre</TabsTrigger>
                  <TabsTrigger value="grade2">2º Bimestre</TabsTrigger>
                  <TabsTrigger value="grade3">3º Bimestre</TabsTrigger>
                  <TabsTrigger value="grade4">4º Bimestre</TabsTrigger>
                  <TabsTrigger value="final">Final</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>1º Bimestre</TableHead>
                    <TableHead>2º Bimestre</TableHead>
                    <TableHead>3º Bimestre</TableHead>
                    <TableHead>4º Bimestre</TableHead>
                    <TableHead>Média Final</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => {
                      const subjectGrades = student.grades[selectedSubject as keyof typeof student.grades];
                      
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
                            {period === "grade1" && isTeacherOrAdmin ? (
                              <Input
                                value={editedGrades[student.id] !== undefined ? editedGrades[student.id] : subjectGrades.grade1}
                                onChange={(e) => handleGradeChange(student.id, e.target.value)}
                                className="w-20"
                              />
                            ) : (
                              <span className={getGradeColor(subjectGrades.grade1)}>{subjectGrades.grade1}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {period === "grade2" && isTeacherOrAdmin ? (
                              <Input
                                value={editedGrades[student.id] !== undefined ? editedGrades[student.id] : subjectGrades.grade2}
                                onChange={(e) => handleGradeChange(student.id, e.target.value)}
                                className="w-20"
                              />
                            ) : (
                              <span className={getGradeColor(subjectGrades.grade2)}>{subjectGrades.grade2}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {period === "grade3" && isTeacherOrAdmin ? (
                              <Input
                                value={editedGrades[student.id] !== undefined ? editedGrades[student.id] : subjectGrades.grade3}
                                onChange={(e) => handleGradeChange(student.id, e.target.value)}
                                className="w-20"
                              />
                            ) : (
                              <span className={getGradeColor(subjectGrades.grade3)}>{subjectGrades.grade3}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {period === "grade4" && isTeacherOrAdmin ? (
                              <Input
                                value={editedGrades[student.id] !== undefined ? editedGrades[student.id] : subjectGrades.grade4}
                                onChange={(e) => handleGradeChange(student.id, e.target.value)}
                                className="w-20"
                              />
                            ) : (
                              <span className={getGradeColor(subjectGrades.grade4)}>{subjectGrades.grade4}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={getGradeColor(subjectGrades.final)}>
                              {subjectGrades.final}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        Nenhum aluno encontrado nesta turma.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        
        {userType === 'student' && (
          <div className="mt-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Meu Boletim</h2>
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary-500" />
                      Desempenho por Disciplina
                    </h3>
                    
                    <div className="space-y-6">
                      {SUBJECTS.map((subject) => {
                        const studentData = students[0]; // Mock student data for demonstration
                        const subjectGrades = studentData.grades[subject as keyof typeof studentData.grades];
                        const gradeColor = getGradeColor(subjectGrades.final);
                        
                        return (
                          <div key={subject} className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{SUBJECT_NAMES[subject]}</p>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Bimestres: {subjectGrades.grade1} • {subjectGrades.grade2} • {subjectGrades.grade3} • {subjectGrades.grade4}
                              </div>
                            </div>
                            <div className={`text-lg font-bold ${gradeColor}`}>
                              {subjectGrades.final}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary-500" />
                      Relatório de Desempenho
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="font-medium">Média Geral</p>
                        <p className="text-lg font-bold text-green-500">8.0</p>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <p className="font-medium">Frequência</p>
                        <p className="text-lg font-bold text-green-500">96%</p>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <p className="font-medium">Posição na Turma</p>
                        <p className="text-lg font-bold">3º de 32</p>
                      </div>
                      
                      <div className="mt-6">
                        <Button className="w-full">
                          <Download className="h-4 w-4 mr-2" />
                          Baixar Boletim Completo
                        </Button>
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
