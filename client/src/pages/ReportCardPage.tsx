import { MainLayout } from "@/components/layout/MainLayout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Printer } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getGradeColor } from "@/lib/utils";
import { useState } from "react";

export default function ReportCardPage() {
  const { user } = useAuth();
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
      attendance: 95,
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
      attendance: 90,
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
      attendance: 85,
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
      attendance: 80,
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
      attendance: 92,
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
      attendance: 98,
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
      attendance: 96,
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
      attendance: 88,
      status: "Aprovado"
    },
  ];

  // Cálculo da média geral
  const overallAverage = grades.reduce((acc, grade) => acc + grade.average, 0) / grades.length;
  // Cálculo da frequência média
  const overallAttendance = grades.reduce((acc, grade) => acc + grade.attendance, 0) / grades.length;

  function renderGradeWithColor(grade: number) {
    return (
      <span className={`font-medium text-${getGradeColor(grade)}-600`}>
        {grade.toFixed(1)}
      </span>
    );
  }

  return (
    <MainLayout pageTitle="Boletim Escolar">
      <div className="space-y-6">
        <Card className="border-2 border-blue-500 print:border-none">
          <CardHeader className="bg-blue-50 dark:bg-blue-900/20 print:bg-white">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl">Boletim Escolar - Ano Letivo 2023</CardTitle>
                <CardDescription>Escola Modelo</CardDescription>
              </div>
              <div className="print:hidden flex space-x-2">
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
                <Button className="bg-blue-500 hover:bg-blue-600">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="border-b pb-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Aluno</p>
                  <p className="font-semibold">{`${user?.firstName || "Aluno"} ${user?.lastName || "Escola"}`}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Matrícula</p>
                  <p>{user?.id || "A12345"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Turma</p>
                  <p>9º Ano - Ensino Fundamental</p>
                </div>
              </div>
            </div>

            <div className="print:hidden mb-6">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Ano completo</SelectItem>
                  <SelectItem value="first">1º Bimestre</SelectItem>
                  <SelectItem value="second">2º Bimestre</SelectItem>
                  <SelectItem value="third">3º Bimestre</SelectItem>
                  <SelectItem value="fourth">4º Bimestre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead rowSpan={2}>Disciplina</TableHead>
                    {selectedPeriod === "all" && (
                      <>
                        <TableHead className="text-center" colSpan={4}>Notas Bimestrais</TableHead>
                        <TableHead className="text-center" rowSpan={2}>Média Final</TableHead>
                        <TableHead className="text-center" rowSpan={2}>Frequência (%)</TableHead>
                        <TableHead className="text-center" rowSpan={2}>Situação</TableHead>
                      </>
                    )}
                    {selectedPeriod !== "all" && (
                      <>
                        <TableHead className="text-center">Nota</TableHead>
                        <TableHead className="text-center">Frequência (%)</TableHead>
                        <TableHead className="text-center">Situação</TableHead>
                      </>
                    )}
                  </TableRow>
                  {selectedPeriod === "all" && (
                    <TableRow>
                      <TableHead className="text-center">1º</TableHead>
                      <TableHead className="text-center">2º</TableHead>
                      <TableHead className="text-center">3º</TableHead>
                      <TableHead className="text-center">4º</TableHead>
                    </TableRow>
                  )}
                </TableHeader>
                <TableBody>
                  {grades.map((grade, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{grade.subject}</TableCell>
                      
                      {selectedPeriod === "all" && (
                        <>
                          <TableCell className="text-center">{renderGradeWithColor(grade.first)}</TableCell>
                          <TableCell className="text-center">{renderGradeWithColor(grade.second)}</TableCell>
                          <TableCell className="text-center">{renderGradeWithColor(grade.third)}</TableCell>
                          <TableCell className="text-center">{renderGradeWithColor(grade.fourth)}</TableCell>
                          <TableCell className="text-center font-bold">{renderGradeWithColor(grade.average)}</TableCell>
                          <TableCell className="text-center">{grade.attendance}%</TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              className={grade.status === "Aprovado" ? "bg-green-500" : "bg-yellow-500"}
                            >
                              {grade.status}
                            </Badge>
                          </TableCell>
                        </>
                      )}
                      
                      {selectedPeriod === "first" && (
                        <>
                          <TableCell className="text-center">{renderGradeWithColor(grade.first)}</TableCell>
                          <TableCell className="text-center">{grade.attendance}%</TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              className={grade.first >= 6 ? "bg-green-500" : "bg-yellow-500"}
                            >
                              {grade.first >= 6 ? "Aprovado" : "Recuperação"}
                            </Badge>
                          </TableCell>
                        </>
                      )}
                      
                      {selectedPeriod === "second" && (
                        <>
                          <TableCell className="text-center">{renderGradeWithColor(grade.second)}</TableCell>
                          <TableCell className="text-center">{grade.attendance}%</TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              className={grade.second >= 6 ? "bg-green-500" : "bg-yellow-500"}
                            >
                              {grade.second >= 6 ? "Aprovado" : "Recuperação"}
                            </Badge>
                          </TableCell>
                        </>
                      )}
                      
                      {selectedPeriod === "third" && (
                        <>
                          <TableCell className="text-center">{renderGradeWithColor(grade.third)}</TableCell>
                          <TableCell className="text-center">{grade.attendance}%</TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              className={grade.third >= 6 ? "bg-green-500" : "bg-yellow-500"}
                            >
                              {grade.third >= 6 ? "Aprovado" : "Recuperação"}
                            </Badge>
                          </TableCell>
                        </>
                      )}
                      
                      {selectedPeriod === "fourth" && (
                        <>
                          <TableCell className="text-center">{renderGradeWithColor(grade.fourth)}</TableCell>
                          <TableCell className="text-center">{grade.attendance}%</TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              className={grade.fourth >= 6 ? "bg-green-500" : "bg-yellow-500"}
                            >
                              {grade.fourth >= 6 ? "Aprovado" : "Recuperação"}
                            </Badge>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                  
                  {/* Linha de totais */}
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-bold">MÉDIA GERAL</TableCell>
                    
                    {selectedPeriod === "all" && (
                      <>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-center font-bold">{renderGradeWithColor(overallAverage)}</TableCell>
                        <TableCell className="text-center font-bold">{overallAttendance.toFixed(1)}%</TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            className={overallAverage >= 6 ? "bg-green-500" : "bg-yellow-500"}
                          >
                            {overallAverage >= 6 ? "Aprovado" : "Recuperação"}
                          </Badge>
                        </TableCell>
                      </>
                    )}
                    
                    {selectedPeriod !== "all" && (
                      <>
                        <TableCell className="text-center font-bold">
                          {selectedPeriod === "first" && renderGradeWithColor(grades.reduce((acc, grade) => acc + grade.first, 0) / grades.length)}
                          {selectedPeriod === "second" && renderGradeWithColor(grades.reduce((acc, grade) => acc + grade.second, 0) / grades.length)}
                          {selectedPeriod === "third" && renderGradeWithColor(grades.reduce((acc, grade) => acc + grade.third, 0) / grades.length)}
                          {selectedPeriod === "fourth" && renderGradeWithColor(grades.reduce((acc, grade) => acc + grade.fourth, 0) / grades.length)}
                        </TableCell>
                        <TableCell className="text-center font-bold">{overallAttendance.toFixed(1)}%</TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            className={overallAverage >= 6 ? "bg-green-500" : "bg-yellow-500"}
                          >
                            {overallAverage >= 6 ? "Aprovado" : "Recuperação"}
                          </Badge>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Legenda</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="inline-block w-4 h-4 mr-2 bg-green-500 rounded-full"></span> Aprovado: Média igual ou superior a 6,0</p>
                    <p><span className="inline-block w-4 h-4 mr-2 bg-yellow-500 rounded-full"></span> Recuperação: Média inferior a 6,0</p>
                    <p><span className="inline-block w-4 h-4 mr-2 bg-red-500 rounded-full"></span> Reprovado: Média final inferior a 5,0 ou frequência abaixo de 75%</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Observações</h4>
                  <div className="space-y-1 text-sm">
                    <p>• Para aprovação, é necessário média igual ou superior a 6,0 em cada disciplina.</p>
                    <p>• Frequência mínima exigida: 75% do total de aulas.</p>
                    <p>• Este boletim é um documento oficial da escola e não deve ser adulterado.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t text-center print:mt-32">
              <div className="pt-8 mt-8 border-t border-dashed mx-auto w-64">
                <p className="text-sm text-muted-foreground">Assinatura do Responsável</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}