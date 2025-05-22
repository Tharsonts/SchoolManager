import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Badge } from "@/components/ui/badge";
import { getGradeColor } from "@/lib/utils";
import { useState } from "react";

export default function MyGradesPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  
  // Dados de exemplo - em um sistema real, isso viria do backend
  const grades = [
    { 
      subject: "Matemática", 
      teacher: "Professor Escola",
      first: 8.5, 
      second: 7.0, 
      third: 9.0, 
      fourth: 8.0,
      average: 8.1,
      status: "Aprovado"
    },
    { 
      subject: "Português", 
      teacher: "Professor Escola",
      first: 7.0, 
      second: 6.5, 
      third: 8.0, 
      fourth: 7.5,
      average: 7.3,
      status: "Aprovado"
    },
    { 
      subject: "Ciências", 
      teacher: "Professor Escola",
      first: 6.0, 
      second: 5.5, 
      third: 7.0, 
      fourth: 6.0,
      average: 6.1,
      status: "Aprovado"
    },
    { 
      subject: "História", 
      teacher: "Professor Escola",
      first: 5.0, 
      second: 4.5, 
      third: 6.0, 
      fourth: 5.5,
      average: 5.3,
      status: "Recuperação"
    },
    { 
      subject: "Geografia", 
      teacher: "Professor Escola",
      first: 7.5, 
      second: 8.0, 
      third: 7.0, 
      fourth: 8.5,
      average: 7.8,
      status: "Aprovado"
    },
    { 
      subject: "Educação Física", 
      teacher: "Professor Escola",
      first: 9.0, 
      second: 9.5, 
      third: 9.0, 
      fourth: 9.5,
      average: 9.3,
      status: "Aprovado"
    },
    { 
      subject: "Artes", 
      teacher: "Professor Escola",
      first: 8.0, 
      second: 7.5, 
      third: 9.0, 
      fourth: 8.5,
      average: 8.3,
      status: "Aprovado"
    },
    { 
      subject: "Inglês", 
      teacher: "Professor Escola",
      first: 6.5, 
      second: 7.0, 
      third: 6.0, 
      fourth: 7.5,
      average: 6.8,
      status: "Aprovado"
    },
  ];

  // Cálculo da média geral
  const overallAverage = grades.reduce((acc, grade) => acc + grade.average, 0) / grades.length;

  function renderGradeWithColor(grade: number) {
    return (
      <span className={`font-medium text-${getGradeColor(grade)}-600`}>
        {grade.toFixed(1)}
      </span>
    );
  }

  return (
    <MainLayout pageTitle="Minhas Notas">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Média Geral</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-center">
                <span className={`text-${getGradeColor(overallAverage)}-600`}>
                  {overallAverage.toFixed(1)}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Disciplinas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-center">
                {grades.length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-center">
                {overallAverage >= 6 ? (
                  <Badge className="text-lg py-1 px-3 bg-green-500">Aprovado</Badge>
                ) : (
                  <Badge className="text-lg py-1 px-3 bg-yellow-500">Recuperação</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="all" onClick={() => setSelectedPeriod("all")}>Todos os Bimestres</TabsTrigger>
              <TabsTrigger value="first" onClick={() => setSelectedPeriod("first")}>1º Bimestre</TabsTrigger>
              <TabsTrigger value="second" onClick={() => setSelectedPeriod("second")}>2º Bimestre</TabsTrigger>
              <TabsTrigger value="third" onClick={() => setSelectedPeriod("third")}>3º Bimestre</TabsTrigger>
              <TabsTrigger value="fourth" onClick={() => setSelectedPeriod("fourth")}>4º Bimestre</TabsTrigger>
            </TabsList>

            <div className="hidden md:block">
              <Select defaultValue="2023">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ano Letivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2023">Ano Letivo 2023</SelectItem>
                  <SelectItem value="2022">Ano Letivo 2022</SelectItem>
                  <SelectItem value="2021">Ano Letivo 2021</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>Notas de Todos os Bimestres</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Disciplina</TableHead>
                        <TableHead>Professor</TableHead>
                        <TableHead className="text-center">1º Bim</TableHead>
                        <TableHead className="text-center">2º Bim</TableHead>
                        <TableHead className="text-center">3º Bim</TableHead>
                        <TableHead className="text-center">4º Bim</TableHead>
                        <TableHead className="text-center">Média</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grades.map((grade, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{grade.subject}</TableCell>
                          <TableCell>{grade.teacher}</TableCell>
                          <TableCell className="text-center">{renderGradeWithColor(grade.first)}</TableCell>
                          <TableCell className="text-center">{renderGradeWithColor(grade.second)}</TableCell>
                          <TableCell className="text-center">{renderGradeWithColor(grade.third)}</TableCell>
                          <TableCell className="text-center">{renderGradeWithColor(grade.fourth)}</TableCell>
                          <TableCell className="text-center font-bold">{renderGradeWithColor(grade.average)}</TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              className={grade.status === "Aprovado" ? "bg-green-500" : "bg-yellow-500"}
                            >
                              {grade.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="first">
            <Card>
              <CardHeader>
                <CardTitle>Notas do 1º Bimestre</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Disciplina</TableHead>
                        <TableHead>Professor</TableHead>
                        <TableHead className="text-center">Nota</TableHead>
                        <TableHead>Observações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grades.map((grade, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{grade.subject}</TableCell>
                          <TableCell>{grade.teacher}</TableCell>
                          <TableCell className="text-center">{renderGradeWithColor(grade.first)}</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="second">
            <Card>
              <CardHeader>
                <CardTitle>Notas do 2º Bimestre</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Disciplina</TableHead>
                        <TableHead>Professor</TableHead>
                        <TableHead className="text-center">Nota</TableHead>
                        <TableHead>Observações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grades.map((grade, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{grade.subject}</TableCell>
                          <TableCell>{grade.teacher}</TableCell>
                          <TableCell className="text-center">{renderGradeWithColor(grade.second)}</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="third">
            <Card>
              <CardHeader>
                <CardTitle>Notas do 3º Bimestre</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Disciplina</TableHead>
                        <TableHead>Professor</TableHead>
                        <TableHead className="text-center">Nota</TableHead>
                        <TableHead>Observações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grades.map((grade, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{grade.subject}</TableCell>
                          <TableCell>{grade.teacher}</TableCell>
                          <TableCell className="text-center">{renderGradeWithColor(grade.third)}</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fourth">
            <Card>
              <CardHeader>
                <CardTitle>Notas do 4º Bimestre</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Disciplina</TableHead>
                        <TableHead>Professor</TableHead>
                        <TableHead className="text-center">Nota</TableHead>
                        <TableHead>Observações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grades.map((grade, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{grade.subject}</TableCell>
                          <TableCell>{grade.teacher}</TableCell>
                          <TableCell className="text-center">{renderGradeWithColor(grade.fourth)}</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}