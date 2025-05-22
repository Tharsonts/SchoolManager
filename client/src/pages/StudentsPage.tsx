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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Download, Plus, MoreHorizontal, FileText, Edit, Trash2, Filter } from "lucide-react";
import { getUserInitials } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Mock data - in a real application, this would be fetched from the API
const STUDENTS_DATA = [
  { 
    id: 1, 
    name: "Lucas Oliveira", 
    registration: "2023001", 
    grade: "9º Ano - A", 
    email: "lucas.oliveira@escola.com", 
    phone: "(11) 97777-8888",
    status: "active", 
    attendance: "92%", 
    average: "8.5",
    avatar: "https://images.unsplash.com/photo-1543269664-56d93c1b41a6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100"
  },
  { 
    id: 2, 
    name: "Mariana Santos", 
    registration: "2023002", 
    grade: "7º Ano - C", 
    email: "mariana.santos@escola.com", 
    phone: "(11) 96666-7777",
    status: "active", 
    attendance: "96%", 
    average: "9.0",
    avatar: "https://images.unsplash.com/photo-1517256673644-36ad11246d21?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100"
  },
  { 
    id: 3, 
    name: "Pedro Almeida", 
    registration: "2023003", 
    grade: "8º Ano - B", 
    email: "pedro.almeida@escola.com", 
    phone: "(11) 95555-6666",
    status: "active", 
    attendance: "88%", 
    average: "7.5",
    avatar: "https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100"
  },
  { 
    id: 4, 
    name: "Ana Ferreira", 
    registration: "2023004", 
    grade: "6º Ano - A", 
    email: "ana.ferreira@escola.com", 
    phone: "(11) 94444-5555",
    status: "inactive", 
    attendance: "75%", 
    average: "6.0",
    avatar: ""
  },
  { 
    id: 5, 
    name: "Rafael Silva", 
    registration: "2023005", 
    grade: "9º Ano - B", 
    email: "rafael.silva@escola.com", 
    phone: "(11) 93333-4444",
    status: "active", 
    attendance: "94%", 
    average: "8.2",
    avatar: ""
  },
];

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState(STUDENTS_DATA);
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    phone: "",
    grade: "",
    registration: ""
  });
  
  const { toast } = useToast();

  // Filter students based on search term and selected grade
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        student.registration.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGrade = selectedGrade ? student.grade === selectedGrade : true;
    
    return matchesSearch && matchesGrade;
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (value: string) => {
    setSelectedGrade(value);
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, this would call an API
    const newStudentWithId = {
      id: students.length + 1,
      ...newStudent,
      status: "active",
      attendance: "100%",
      average: "0.0",
      avatar: ""
    };
    
    setStudents([...students, newStudentWithId]);
    setIsAddDialogOpen(false);
    setNewStudent({
      name: "",
      email: "",
      phone: "",
      grade: "",
      registration: ""
    });
    
    toast({
      title: "Aluno adicionado",
      description: `${newStudent.name} foi adicionado com sucesso.`,
    });
  };

  const handleDeleteStudent = (id: number) => {
    const studentToDelete = students.find(student => student.id === id);
    setStudents(students.filter(student => student.id !== id));
    
    toast({
      title: "Aluno removido",
      description: `${studentToDelete?.name} foi removido com sucesso.`,
      variant: "destructive"
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewStudent({
      ...newStudent,
      [name]: value
    });
  };

  return (
    <MainLayout pageTitle="Alunos">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciamento de Alunos</h1>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4 sm:mt-0 w-full sm:w-auto">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Aluno
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Aluno</DialogTitle>
                  <DialogDescription>
                    Preencha os dados abaixo para cadastrar um novo aluno no sistema.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleAddStudent}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input 
                          id="name" 
                          name="name" 
                          value={newStudent.name} 
                          onChange={handleInputChange} 
                          placeholder="Nome do aluno" 
                          required 
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email">E-mail</Label>
                        <Input 
                          id="email" 
                          name="email" 
                          type="email" 
                          value={newStudent.email} 
                          onChange={handleInputChange} 
                          placeholder="email@exemplo.com" 
                          required 
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">Telefone</Label>
                        <Input 
                          id="phone" 
                          name="phone" 
                          value={newStudent.phone} 
                          onChange={handleInputChange} 
                          placeholder="(00) 00000-0000" 
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="registration">Matrícula</Label>
                        <Input 
                          id="registration" 
                          name="registration" 
                          value={newStudent.registration} 
                          onChange={handleInputChange} 
                          placeholder="Número de matrícula" 
                          required 
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="grade">Turma</Label>
                        <Select name="grade" onValueChange={(value) => setNewStudent({...newStudent, grade: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a turma" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="6º Ano - A">6º Ano - A</SelectItem>
                            <SelectItem value="6º Ano - B">6º Ano - B</SelectItem>
                            <SelectItem value="7º Ano - A">7º Ano - A</SelectItem>
                            <SelectItem value="7º Ano - B">7º Ano - B</SelectItem>
                            <SelectItem value="7º Ano - C">7º Ano - C</SelectItem>
                            <SelectItem value="8º Ano - A">8º Ano - A</SelectItem>
                            <SelectItem value="8º Ano - B">8º Ano - B</SelectItem>
                            <SelectItem value="9º Ano - A">9º Ano - A</SelectItem>
                            <SelectItem value="9º Ano - B">9º Ano - B</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Salvar</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
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
              
              <div className="flex gap-2">
                <Select onValueChange={handleFilterChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por turma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as turmas</SelectItem>
                    <SelectItem value="6º Ano - A">6º Ano - A</SelectItem>
                    <SelectItem value="7º Ano - C">7º Ano - C</SelectItem>
                    <SelectItem value="8º Ano - B">8º Ano - B</SelectItem>
                    <SelectItem value="9º Ano - A">9º Ano - A</SelectItem>
                    <SelectItem value="9º Ano - B">9º Ano - B</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Frequência</TableHead>
                    <TableHead>Média</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={student.avatar} alt={student.name} />
                              <AvatarFallback className="bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300">
                                {getUserInitials(student.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{student.name}</div>
                              <div className="text-sm text-muted-foreground">{student.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{student.registration}</TableCell>
                        <TableCell>{student.grade}</TableCell>
                        <TableCell>{student.attendance}</TableCell>
                        <TableCell>
                          <span className={
                            parseFloat(student.average) >= 7
                              ? "text-green-600 dark:text-green-400"
                              : parseFloat(student.average) >= 5
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-red-600 dark:text-red-400"
                          }>
                            {student.average}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            student.status === "active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}>
                            {student.status === "active" ? "Ativo" : "Inativo"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-5 w-5" />
                                <span className="sr-only">Abrir menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                                <FileText className="h-4 w-4" /> Ver detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                                <Edit className="h-4 w-4" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="flex items-center gap-2 text-red-600 focus:text-red-600 cursor-pointer"
                                onClick={() => handleDeleteStudent(student.id)}
                              >
                                <Trash2 className="h-4 w-4" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        Nenhum resultado encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive>1</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">2</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">3</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
