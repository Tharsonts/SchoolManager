import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Mail, Phone, Edit, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { getUserInitials } from "@/lib/utils";

export default function CoordinatorsPage() {
  // Dados de exemplo - em um sistema real, isso viria do backend
  const [coordinators] = useState([
    { 
      id: 1, 
      name: "Ana Silva", 
      email: "ana.silva@escola.com", 
      phone: "(11) 98765-4321",
      area: "Ensino Fundamental",
      status: "Ativo"
    },
    { 
      id: 2, 
      name: "Carlos Oliveira", 
      email: "carlos.oliveira@escola.com", 
      phone: "(11) 91234-5678",
      area: "Ensino Médio",
      status: "Ativo"
    },
    { 
      id: 3, 
      name: "Mariana Santos", 
      email: "mariana.santos@escola.com", 
      phone: "(11) 99876-5432",
      area: "Educação Infantil",
      status: "Licença"
    },
  ]);

  return (
    <MainLayout pageTitle="Coordenadores">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Gerenciamento de Coordenadores</h2>
          <Button className="bg-blue-500 hover:bg-blue-600">
            <PlusCircle className="h-4 w-4 mr-2" />
            Novo Coordenador
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Coordenadores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Foto</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coordinators.map((coordinator) => (
                    <TableRow key={coordinator.id}>
                      <TableCell>
                        <Avatar>
                          <AvatarImage src={`https://i.pravatar.cc/150?u=${coordinator.id}`} alt={coordinator.name} />
                          <AvatarFallback>{getUserInitials(coordinator.name)}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{coordinator.name}</TableCell>
                      <TableCell>{coordinator.area}</TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{coordinator.email}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{coordinator.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={coordinator.status === "Ativo" ? "success" : "secondary"}
                          className={coordinator.status === "Ativo" ? "bg-green-500" : "bg-yellow-500"}
                        >
                          {coordinator.status}
                        </Badge>
                      </TableCell>
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