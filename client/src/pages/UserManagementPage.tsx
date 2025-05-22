import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Search, Edit, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { getUserInitials, getRoleTranslation, getRoleColor } from "@/lib/utils";

export default function UserManagementPage() {
  // Dados de exemplo - em um sistema real, isso viria do backend
  const [users] = useState([
    { 
      id: "admin1", 
      firstName: "Admin", 
      lastName: "Sistema", 
      email: "admin@escola.com", 
      role: "admin",
      status: "Ativo",
      lastLogin: "2023-05-21 14:30"
    },
    { 
      id: "coord1", 
      firstName: "Coordenador", 
      lastName: "Escola", 
      email: "coord@escola.com", 
      role: "coordinator",
      status: "Ativo",
      lastLogin: "2023-05-20 09:45"
    },
    { 
      id: "prof1", 
      firstName: "Professor", 
      lastName: "Escola", 
      email: "prof@escola.com", 
      role: "teacher",
      status: "Ativo",
      lastLogin: "2023-05-22 08:15"
    },
    { 
      id: "aluno1", 
      firstName: "Aluno", 
      lastName: "Escola", 
      email: "aluno@escola.com", 
      role: "student",
      status: "Ativo",
      lastLogin: "2023-05-21 10:20"
    },
  ]);

  return (
    <MainLayout pageTitle="Gerenciamento de Usuários">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Usuários do Sistema</h2>
          <Button className="bg-blue-500 hover:bg-blue-600">
            <PlusCircle className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Todos os Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative w-full md:w-[300px]">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Pesquisar usuários..." className="pl-8" />
                </div>
                <Button variant="outline">
                  <Search className="h-4 w-4 mr-1" />
                  Buscar
                </Button>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <Select defaultValue="all">
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filtrar por papel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os papéis</SelectItem>
                    <SelectItem value="admin">Administradores</SelectItem>
                    <SelectItem value="coordinator">Coordenadores</SelectItem>
                    <SelectItem value="teacher">Professores</SelectItem>
                    <SelectItem value="student">Alunos</SelectItem>
                  </SelectContent>
                </Select>

                <Select defaultValue="active">
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Avatar</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Último Acesso</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Avatar>
                          <AvatarImage src={`https://i.pravatar.cc/150?u=${user.id}`} alt={`${user.firstName} ${user.lastName}`} />
                          <AvatarFallback>{getUserInitials(`${user.firstName} ${user.lastName}`)}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{`${user.firstName} ${user.lastName}`}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`bg-${getRoleColor(user.role)} bg-opacity-10 text-${getRoleColor(user.role)}`}
                        >
                          {getRoleTranslation(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.status === "Ativo" ? "success" : "secondary"}
                          className={user.status === "Ativo" ? "bg-green-500" : "bg-yellow-500"}
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.lastLogin}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button variant="destructive" size="sm">
                            <Trash className="h-4 w-4 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}