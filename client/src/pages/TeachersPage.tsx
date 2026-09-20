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
import { Search, Download, Plus, MoreHorizontal, FileText, Edit, Trash2, Filter } from "lucide-react";
import { getUserInitials } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Mock data - in a real application, this would be fetched from the API
const TEACHERS_DATA = [
  { 
    id: 1, 
    name: "Marcos Silva", 
    registration: "PROF001", 
    subjects: "Matemática", 
    email: "marcos.silva@escola.com", 
    phone: "(11) 97777-8888",
    classes: ["9º Ano - A", "9º Ano - B", "8º Ano - A"],
    status: "active", 
    avatar: null
  },
  { 
    id: 2, 
    name: "Carla Mendes", 
    registration: "PROF002", 
    subjects: "Ciências", 
    email: "carla.mendes@escola.com", 
    phone: "(11) 96666-7777",
    classes: ["7º Ano - A", "7º Ano - B", "7º Ano - C"],
    status: "active", 
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&h=100&q=80"
  },
  { 
    id: 3, 
    name: "Roberto Lima", 
    registration: "PROF003", 
    subjects: "História", 
    email: "roberto.lima@escola.com", 
    phone: "(11) 95555-6666",
    classes: ["8º Ano - B", "9º Ano - A", "9º Ano - B"],
    status: "active",
     avatar: null
  },
  { 
    id: 4, 
    name: "Ana Ferreira", 
    registration: "PROF004", 
    subjects: "Português", 
    email: "ana.ferreira@escola.com", 
    phone: "(11) 94444-5555",
    classes: ["6º Ano - A", "6º Ano - B", "7º Ano - A"],
    status: "inactive", 
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&h=100&q=80"
  },
  { 
    id: 5, 
    name: "Pedro Santos", 
    registration: "PROF005", 
    subjects: "Geografia", 
    email: "pedro.santos@escola.com", 
    phone: "(11) 93333-4444",
    classes: ["8º Ano - A", "8º Ano - B", "9º Ano - A"],
    status: "active",
    avatar: null
  },
];

export default function TeachersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [teachers, setTeachers] = useState(TEACHERS_DATA);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    name: "",
    email: "",
    phone: "",
    subjects: "",
    registration: ""
  });
  
  const { toast } = useToast();

  // Filter teachers based on search term and selected subject
  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (teacher.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        teacher.registration.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = selectedSubject ? teacher.subjects === selectedSubject : true;
    
    return matchesSearch && matchesSubject;
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (value: string) => {
    setSelectedSubject(value);
  };

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, this would call an API
    const newTeacherWithId = {
      id: teachers.length + 1,
      ...newTeacher,
      status: "active",
      classes: [],
      avatar: ""
    };
    
    setTeachers([...teachers, newTeacherWithId]);
    setIsAddDialogOpen(false);
    setNewTeacher({
      name: "",
      email: "",
      phone: "",
      subjects: "",
      registration: ""
    });
    
    toast({
      title: "Professor adicionado",
      description: `${newTeacher.name} foi adicionado com sucesso.`,
    });
  };

  const handleDeleteTeacher = (id: number) => {
    const teacherToDelete = teachers.find(teacher => teacher.id === id);
    setTeachers(teachers.filter(teacher => teacher.id !== id));
    
    toast({
      title: "Professor removido",
      description: `${teacherToDelete?.name} foi removido com sucesso.`,
      variant: "destructive"
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTeacher({
      ...newTeacher,
      [name]: value
    });
  };

  return (
    <MainLayout pageTitle="Professores">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciamento de Professores</h1>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4 sm:mt-0 w-full sm:w-auto">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Professor
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Professor</DialogTitle>
                  <DialogDescription>
                    Preencha os dados abaixo para cadastrar um novo professor no sistema.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleAddTeacher}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input 
                          id="name" 
                          name="name" 
                          value={newTeacher.name} 
                          onChange={handleInputChange} 
                          placeholder="Nome do professor" 
                          required 
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email">E-mail</Label>
                        <Input 
                          id="email" 
                          name="email" 
                          type="email" 
                          value={newTeacher.email} 
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
                          value={newTeacher.phone} 
                          onChange={handleInputChange} 
                          placeholder="(00) 00000-0000" 
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="registration">Registro</Label>
                        <Input 
                          id="registration" 
                          name="registration" 
                          value={newTeacher.registration} 
                          onChange={handleInputChange} 
                          placeholder="Número de registro" 
                          required 
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="subjects">Disciplina</Label>
                        <Select name="subjects" onValueChange={(value) => setNewTeacher({...newTeacher, subjects: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a disciplina" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Matemática">Matemática</SelectItem>
                            <SelectItem value="Português">Português</SelectItem>
                            <SelectItem value="Ciências">Ciências</SelectItem>
                            <SelectItem value="História">História</SelectItem>
                            <SelectItem value="Geografia">Geografia</SelectItem>
                            <SelectItem value="Inglês">Inglês</SelectItem>
                            <SelectItem value="Educação Física">Educação Física</SelectItem>
                            <SelectItem value="Artes">Artes</SelectItem>
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
                  placeholder="Buscar professores..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
              
              <div className="flex gap-2">
                <Select onValueChange={handleFilterChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por disciplina" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as disciplinas</SelectItem>
                    <SelectItem value="Matemática">Matemática</SelectItem>
                    <SelectItem value="Português">Português</SelectItem>
                    <SelectItem value="Ciências">Ciências</SelectItem>
                    <SelectItem value="História">História</SelectItem>
                    <SelectItem value="Geografia">Geografia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Professor</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead>Disciplina</TableHead>
                    <TableHead>Turmas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers.length > 0 ? (
                    filteredTeachers.map((teacher) => (
                      <TableRow key={teacher.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={teacher.avatar} alt={teacher.name} />
                              <AvatarFallback className="bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300">
                                {getUserInitials(teacher.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{teacher.name}</div>
                              <div className="text-sm text-muted-foreground">{teacher.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{teacher.registration}</TableCell>
                        <TableCell>{teacher.subjects}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {teacher.classes.map((cls, index) => (
                              <span 
                                key={index} 
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              >
                                {cls}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            teacher.status === "active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}>
                            {teacher.status === "active" ? "Ativo" : "Inativo"}
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
                                onClick={() => handleDeleteTeacher(teacher.id)}
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
                      <TableCell colSpan={6} className="h-24 text-center">
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
