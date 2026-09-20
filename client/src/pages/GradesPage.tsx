import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Download, Save, BookOpen, GraduationCap } from "lucide-react";
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
    avatar: null
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gerenciamento de Notas</h1>
          </div>
          
          <div className="flex gap-3 mt-4 sm:mt-0">
            <Button variant="outline" onClick={handleExportGrades}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            
            {isTeacherOrAdmin && (
              <Button 
                onClick={handleSaveGrades}
                disabled={Object.keys(editedGrades).length === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex flex-col gap-2">
            <Label htmlFor="class-select" className="text-sm font-medium">Turma</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger id="class-select" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLASSES.map((cls) => (
                  <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col gap-2">
            <Label htmlFor="subject-select" className="text-sm font-medium">Disciplina</Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger id="subject-select" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((subject) => (
                  <SelectItem key={subject} value={subject}>{SUBJECT_NAMES[subject]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Período para Edição</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grade1">1º Bimestre</SelectItem>
                <SelectItem value="grade2">2º Bimestre</SelectItem>
                <SelectItem value="grade3">3º Bimestre</SelectItem>
                <SelectItem value="grade4">4º Bimestre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Lista de Notas */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {SUBJECT_NAMES[selectedSubject]} - {selectedClass}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filteredStudents.length} alunos encontrados
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Aluno</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead className="text-center">1º Bim</TableHead>
                  <TableHead className="text-center">2º Bim</TableHead>
                  <TableHead className="text-center">3º Bim</TableHead>
                  <TableHead className="text-center">4º Bim</TableHead>
                  <TableHead className="text-center">Média</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => {
                    const subjectGrades = student.grades[selectedSubject as keyof typeof student.grades];
                    
                    return (
                      <TableRow key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={student.avatar} alt={student.name} />
                              <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                                {getUserInitials(student.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{student.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-400">
                          {student.registration}
                        </TableCell>
                        <TableCell className="text-center">
                          {period === "grade1" && isTeacherOrAdmin ? (
                            <Input
                              value={editedGrades[student.id] !== undefined ? editedGrades[student.id] : subjectGrades.grade1}
                              onChange={(e) => handleGradeChange(student.id, e.target.value)}
                              className="w-16 text-center"
                              placeholder="0.0"
                            />
                          ) : (
                            <span className={`font-semibold ${getGradeColor(subjectGrades.grade1)}`}>
                              {subjectGrades.grade1}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {period === "grade2" && isTeacherOrAdmin ? (
                            <Input
                              value={editedGrades[student.id] !== undefined ? editedGrades[student.id] : subjectGrades.grade2}
                              onChange={(e) => handleGradeChange(student.id, e.target.value)}
                              className="w-16 text-center"
                              placeholder="0.0"
                            />
                          ) : (
                            <span className={`font-semibold ${getGradeColor(subjectGrades.grade2)}`}>
                              {subjectGrades.grade2}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {period === "grade3" && isTeacherOrAdmin ? (
                            <Input
                              value={editedGrades[student.id] !== undefined ? editedGrades[student.id] : subjectGrades.grade3}
                              onChange={(e) => handleGradeChange(student.id, e.target.value)}
                              className="w-16 text-center"
                              placeholder="0.0"
                            />
                          ) : (
                            <span className={`font-semibold ${getGradeColor(subjectGrades.grade3)}`}>
                              {subjectGrades.grade3}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {period === "grade4" && isTeacherOrAdmin ? (
                            <Input
                              value={editedGrades[student.id] !== undefined ? editedGrades[student.id] : subjectGrades.grade4}
                              onChange={(e) => handleGradeChange(student.id, e.target.value)}
                              className="w-16 text-center"
                              placeholder="0.0"
                            />
                          ) : (
                            <span className={`font-semibold ${getGradeColor(subjectGrades.grade4)}`}>
                              {subjectGrades.grade4}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`font-bold text-lg ${getGradeColor(subjectGrades.final)}`}>
                            {subjectGrades.final}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <BookOpen className="h-8 w-8 text-gray-400" />
                        <span>Nenhum aluno encontrado nesta turma</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        
        {/* Seção do Estudante */}
        {userType === 'student' && (
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              Meu Boletim
            </h2>
            
            <div className="space-y-4">
              {SUBJECTS.map((subject) => {
                const studentData = students[0]; // Mock student data
                const subjectGrades = studentData.grades[subject as keyof typeof studentData.grades];
                
                return (
                  <div key={subject} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {SUBJECT_NAMES[subject]}
                      </h3>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Bimestres: {subjectGrades.grade1} • {subjectGrades.grade2} • {subjectGrades.grade3} • {subjectGrades.grade4}
                      </div>
                    </div>
                    <div className={`text-2xl font-bold ${getGradeColor(subjectGrades.final)}`}>
                      {subjectGrades.final}
                    </div>
                  </div>
                );
              })}
              
              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Média Geral:</span>
                  <span className="text-2xl font-bold text-green-600">8.0</span>
                </div>
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Boletim Completo
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
