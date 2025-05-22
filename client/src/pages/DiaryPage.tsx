import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, FileText } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function DiaryPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";
  
  // Dados de exemplo - em um sistema real, isso viria do banco de dados
  const [diaryEntries] = useState([
    { 
      id: 1, 
      date: "2023-05-20", 
      className: "1º Ano A", 
      subject: "Matemática", 
      content: "Introdução à álgebra. Conceitos básicos de equações de primeiro grau.",
      homework: "Exercícios 1 a 10 da página 25."
    },
    { 
      id: 2, 
      date: "2023-05-21", 
      className: "2º Ano B", 
      subject: "Português", 
      content: "Análise de texto: crônicas contemporâneas.",
      homework: "Leitura do capítulo 3 do livro."
    },
    { 
      id: 3, 
      date: "2023-05-22", 
      className: "3º Ano C", 
      subject: "Ciências", 
      content: "Sistema respiratório humano: componentes e funcionamento.",
      homework: "Pesquisa sobre doenças respiratórias."
    },
  ]);

  return (
    <MainLayout pageTitle="Diário de Classe">
      <Tabs defaultValue="view">
        <TabsList>
          <TabsTrigger value="view">Visualizar Diário</TabsTrigger>
          {isTeacher && <TabsTrigger value="create">Registrar Aula</TabsTrigger>}
        </TabsList>

        <TabsContent value="view">
          <Card>
            <CardHeader>
              <CardTitle>Registros de Aulas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="w-full md:w-[200px]">
                  <Label htmlFor="class-filter">Turma</Label>
                  <Select defaultValue="all">
                    <SelectTrigger id="class-filter">
                      <SelectValue placeholder="Selecione a turma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as turmas</SelectItem>
                      <SelectItem value="1A">1º Ano A</SelectItem>
                      <SelectItem value="2B">2º Ano B</SelectItem>
                      <SelectItem value="3C">3º Ano C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full md:w-[200px]">
                  <Label htmlFor="subject-filter">Disciplina</Label>
                  <Select defaultValue="all">
                    <SelectTrigger id="subject-filter">
                      <SelectValue placeholder="Selecione a disciplina" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as disciplinas</SelectItem>
                      <SelectItem value="math">Matemática</SelectItem>
                      <SelectItem value="portuguese">Português</SelectItem>
                      <SelectItem value="science">Ciências</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full md:w-[200px]">
                  <Label htmlFor="date-filter">Data</Label>
                  <input 
                    type="date" 
                    id="date-filter"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Turma</TableHead>
                      <TableHead>Disciplina</TableHead>
                      <TableHead>Conteúdo</TableHead>
                      <TableHead>Tarefas</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diaryEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                        <TableCell>{entry.className}</TableCell>
                        <TableCell>{entry.subject}</TableCell>
                        <TableCell>{entry.content}</TableCell>
                        <TableCell>{entry.homework}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-1" />
                            Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isTeacher && (
          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Registrar Nova Aula</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="class">Turma</Label>
                      <Select>
                        <SelectTrigger id="class">
                          <SelectValue placeholder="Selecione a turma" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1A">1º Ano A</SelectItem>
                          <SelectItem value="2B">2º Ano B</SelectItem>
                          <SelectItem value="3C">3º Ano C</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="subject">Disciplina</Label>
                      <Select>
                        <SelectTrigger id="subject">
                          <SelectValue placeholder="Selecione a disciplina" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="math">Matemática</SelectItem>
                          <SelectItem value="portuguese">Português</SelectItem>
                          <SelectItem value="science">Ciências</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="date">Data da Aula</Label>
                      <input 
                        type="date" 
                        id="date"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="content">Conteúdo da Aula</Label>
                    <Textarea 
                      id="content" 
                      placeholder="Descreva o conteúdo abordado na aula" 
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="homework">Tarefas/Deveres</Label>
                    <Textarea 
                      id="homework" 
                      placeholder="Descreva as tarefas ou deveres designados" 
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="observations">Observações</Label>
                    <Textarea 
                      id="observations" 
                      placeholder="Observações adicionais sobre a aula ou alunos" 
                      rows={2}
                    />
                  </div>

                  <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Registrar Aula
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </MainLayout>
  );
}