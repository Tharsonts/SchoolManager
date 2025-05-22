import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash } from "lucide-react";
import { useState } from "react";

export default function SubjectsPage() {
  // Dados de exemplo - em um sistema real, isso viria do backend
  const [subjects] = useState([
    { id: 1, name: "Matemática", description: "Álgebra, geometria e cálculo", teacher: "Professor Escola" },
    { id: 2, name: "Português", description: "Gramática e literatura", teacher: "Professor Escola" },
    { id: 3, name: "Ciências", description: "Física, química e biologia", teacher: "Professor Escola" },
    { id: 4, name: "História", description: "História mundial e do Brasil", teacher: "Professor Escola" }
  ]);

  return (
    <MainLayout pageTitle="Disciplinas">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Gerenciamento de Disciplinas</h2>
          <Button className="bg-blue-500 hover:bg-blue-600">
            <PlusCircle className="h-4 w-4 mr-2" />
            Nova Disciplina
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Disciplinas Cadastradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end mb-4">
              <Select defaultValue="all">
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por série" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as séries</SelectItem>
                  <SelectItem value="1">1º ano</SelectItem>
                  <SelectItem value="2">2º ano</SelectItem>
                  <SelectItem value="3">3º ano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Professor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell className="font-medium">{subject.name}</TableCell>
                      <TableCell>{subject.description}</TableCell>
                      <TableCell>{subject.teacher}</TableCell>
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