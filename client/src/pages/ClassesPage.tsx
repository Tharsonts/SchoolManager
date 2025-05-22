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
import { Label } from "@/components/ui/label";
import { Search, Download, Plus, MoreHorizontal, FileText, Edit, Trash2, UserRound, Book, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data - in a real application, this would be fetched from the API
const CLASSES_DATA = [
  { 
    id: 1, 
    name: "6º Ano - A", 
    grade: "Ensino Fundamental", 
    students: 32, 
    teacher: "Ana Ferreira",
    subjects: ["Português", "Matemática", "Ciências", "História", "Geografia", "Inglês", "Artes", "Educação Física"],
    room: "Sala 101",
    status: "active"
  },
  { 
    id: 2, 
    name: "7º Ano - A", 
    grade: "Ensino Fundamental", 
    students: 28, 
    teacher: "Marcos Silva",
    subjects: ["Português", "Matemática", "Ciências", "História", "Geografia", "Inglês", "Artes", "Educação Física"],
    room: "Sala 102",
    status: "active"
  },
  { 
    id: 3, 
    name: "7º Ano - B", 
    grade: "Ensino Fundamental", 
    students: 30, 
    teacher: "Carla Mendes",
    subjects: ["Português", "Matemática", "Ciências", "História", "Geografia", "Inglês", "Artes", "Educação Física"],
    room: "Sala 103",
    status: "active"
  },
  { 
    id: 4, 
    name: "8º Ano - A", 
    grade: "Ensino Fundamental", 
    students: 29, 
    teacher: "Roberto Lima",
    subjects: ["Português", "Matemática", "Ciências", "História", "Geografia", "Inglês", "Artes", "Educação Física"],
    room: "Sala 104",
    status: "active"
  },
  { 
    id: 5, 
    name: "9º Ano - A", 
    grade: "Ensino Fundamental", 
    students: 31, 
    teacher: "Pedro Santos",
    subjects: ["Português", "Matemática", "Ciências", "História", "Geografia", "Inglês", "Artes", "Educação Física"],
    room: "Sala 105",
    status: "active"
  },
];

export default function ClassesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [classes, setClasses] = useState(CLASSES_DATA);
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newClass, setNewClass] = useState({
    name: "",
    grade: "",
    room: "",
    teacher: ""
  });
  
  const { toast } = useToast();

  // Filter classes based on search term and selected grade
  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          cls.teacher.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGrade = selectedGrade ? cls.grade === selectedGrade : true;
    
    return matchesSearch && matchesGrade;
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (value: string) => {
    setSelectedGrade(value);
  };

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, this would call an API
    const newClassWithId = {
      id: classes.length + 1,
      ...newClass,
      status: "active",
      students: 0,
      subjects: ["Português", "Matemática", "Ciências", "História", "Geografia", "Inglês", "Artes", "Educação Física"]
    };
    
    setClasses([...classes, newClassWithId]);
    setIsAddDialogOpen(false);
    setNewClass({
      name: "",
      grade: "",
      room: "",
      teacher: ""
    });
    
    toast({
      title: "Turma adicionada",
      description: `A turma ${newClass.name} foi adicionada com sucesso.`,
    });
  };

  const handleDeleteClass = (id: number) => {
    const classToDelete = classes.find(cls => cls.id === id);
    setClasses(classes.filter(cls => cls.id !== id));
    
    toast({
      title: "Turma removida",
      description: `A turma ${classToDelete?.name} foi removida com sucesso.`,
      variant: "destructive"
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewClass({
      ...newClass,
      [name]: value
    });
  };

  return (
    <MainLayout pageTitle="Turmas">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciamento de Turmas</h1>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4 sm:mt-0 w-full sm:w-auto">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Turma
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Adicionar Nova Turma</DialogTitle>
                  <DialogDescription>
                    Preencha os dados abaixo para cadastrar uma nova turma no sistema.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleAddClass}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="name">Nome da Turma</Label>
                        <Input 
                          id="name" 
                          name="name" 
                          value={newClass.name} 
                          onChange={handleInputChange} 
                          placeholder="Ex: 6º Ano - A" 
                          required 
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="grade">Nível</Label>
                        <Select name="grade" onValueChange={(value) => setNewClass({...newClass, grade: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o nível" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Ensino Fundamental">Ensino Fundamental</SelectItem>
                            <SelectItem value="Ensino Médio">Ensino Médio</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="room">Sala</Label>
                        <Input 
                          id="room" 
                          name="room" 
                          value={newClass.room} 
                          onChange={handleInputChange} 
                          placeholder="Ex: Sala 101" 
                          required 
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <Label htmlFor="teacher">Professor Responsável</Label>
                        <Select name="teacher" onValueChange={(value) => setNewClass({...newClass, teacher: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o professor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Ana Ferreira">Ana Ferreira</SelectItem>
                            <SelectItem value="Marcos Silva">Marcos Silva</SelectItem>
                            <SelectItem value="Carla Mendes">Carla Mendes</SelectItem>
                            <SelectItem value="Roberto Lima">Roberto Lima</SelectItem>
                            <SelectItem value="Pedro Santos">Pedro Santos</SelectItem>
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
                  placeholder="Buscar turmas..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
              
              <div className="flex gap-2">
                <Select onValueChange={handleFilterChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os níveis</SelectItem>
                    <SelectItem value="Ensino Fundamental">Ensino Fundamental</SelectItem>
                    <SelectItem value="Ensino Médio">Ensino Médio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Turma</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Alunos</TableHead>
                    <TableHead>Professor</TableHead>
                    <TableHead>Sala</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClasses.length > 0 ? (
                    filteredClasses.map((cls) => (
                      <TableRow key={cls.id}>
                        <TableCell className="font-medium">{cls.name}</TableCell>
                        <TableCell>{cls.grade}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <UserRound className="h-4 w-4 mr-2 text-gray-500" />
                            {cls.students} alunos
                          </div>
                        </TableCell>
                        <TableCell>{cls.teacher}</TableCell>
                        <TableCell>{cls.room}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            cls.status === "active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}>
                            {cls.status === "active" ? "Ativa" : "Inativa"}
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
                                <UserRound className="h-4 w-4" /> Ver alunos
                              </DropdownMenuItem>
                              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                                <Book className="h-4 w-4" /> Ver disciplinas
                              </DropdownMenuItem>
                              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                                <Edit className="h-4 w-4" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="flex items-center gap-2 text-red-600 focus:text-red-600 cursor-pointer"
                                onClick={() => handleDeleteClass(cls.id)}
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
                    <PaginationNext href="#" />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <UserRound className="h-6 w-6 text-blue-500 dark:text-blue-300" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Total de Alunos</h3>
                  <p className="text-2xl font-bold">{classes.reduce((sum, cls) => sum + cls.students, 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                  <GraduationCap className="h-6 w-6 text-green-500 dark:text-green-300" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Total de Turmas</h3>
                  <p className="text-2xl font-bold">{classes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                  <Book className="h-6 w-6 text-purple-500 dark:text-purple-300" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Média de Alunos por Turma</h3>
                  <p className="text-2xl font-bold">
                    {classes.length > 0 
                      ? Math.round(classes.reduce((sum, cls) => sum + cls.students, 0) / classes.length) 
                      : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
