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
import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGrades } from "@/hooks/useApi";
import { Loader2 } from "lucide-react";

export default function MyGradesPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [selectedYear, setSelectedYear] = useState("2024");
  const { user } = useAuth();
  
  // Buscar notas do aluno usando a API real
  const { data: gradesData, isLoading, error } = useGrades(
    user?.id || "", 
    selectedYear
  );

  // Anos disponíveis (baseado nos dados existentes)
  const availableYears = ["2024", "2023", "2022"];

  // Processar dados das notas para o formato da interface
  const processedGrades = useMemo(() => {
    if (!gradesData?.data) return [];

    // Agrupar notas por disciplina
    const gradesBySubject = gradesData.data.reduce((acc: any, grade: any) => {
      const subjectName = grade.subjectName || "Disciplina";
      const teacherName = grade.teacherName || "Professor";
      
      if (!acc[subjectName]) {
        acc[subjectName] = {
          subject: subjectName,
          teacher: teacherName,
          grades: [],
          average: 0,
          status: "Aprovado"
        };
      }
      
      acc[subjectName].grades.push(grade);
      return acc;
    }, {});

    // Calcular médias por disciplina
    Object.values(gradesBySubject).forEach((subject: any) => {
      if (subject.grades.length > 0) {
        const totalWeight = subject.grades.reduce((sum: number, g: any) => sum + (g.weight || 1), 0);
        const weightedSum = subject.grades.reduce((sum: number, g: any) => sum + (g.grade * (g.weight || 1)), 0);
        subject.average = totalWeight > 0 ? weightedSum / totalWeight : 0;
        subject.status = subject.average >= 6 ? "Aprovado" : "Recuperação";
      }
    });

    return Object.values(gradesBySubject);
  }, [gradesData]);

  // Cálculo da média geral
  const overallAverage = processedGrades.length > 0 
    ? processedGrades.reduce((acc: any, grade: any) => acc + grade.average, 0) / processedGrades.length 
    : 0;

  function renderGradeWithColor(grade: number) {
    return (
      <span className={`font-medium text-${getGradeColor(grade)}-600`}>
        {grade.toFixed(1)}
      </span>
    );
  }

  // Função para obter nota de um bimestre específico
  function getGradeForPeriod(subject: any, period: string) {
    const periodGrades = subject.grades.filter((g: any) => {
      const gradeDate = new Date(g.date);
      const month = gradeDate.getMonth() + 1;
      
      switch (period) {
        case "first": return month >= 1 && month <= 3;   // Jan-Mar
        case "second": return month >= 4 && month <= 6;  // Abr-Jun
        case "third": return month >= 7 && month <= 9;   // Jul-Set
        case "fourth": return month >= 10 && month <= 12; // Out-Dez
        default: return true;
      }
    });
    
    if (periodGrades.length === 0) return "-";
    
    // Calcular média do período
    const totalWeight = periodGrades.reduce((sum: number, g: any) => sum + (g.weight || 1), 0);
    const weightedSum = periodGrades.reduce((sum: number, g: any) => sum + (g.grade * (g.weight || 1)), 0);
    return totalWeight > 0 ? (weightedSum / totalWeight).toFixed(1) : "-";
  }

  if (isLoading) {
    return (
      <MainLayout pageTitle="Minhas Notas">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando notas...</span>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout pageTitle="Minhas Notas">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Erro ao carregar notas</p>
            <p className="text-sm text-gray-600">Tente novamente mais tarde</p>
          </div>
        </div>
      </MainLayout>
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
                {processedGrades.length}
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
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ano Letivo" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year}>
                      Ano Letivo {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>Notas de Todos os Bimestres - {selectedYear}</CardTitle>
              </CardHeader>
              <CardContent>
                {processedGrades.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma nota encontrada para o ano {selectedYear}
                  </div>
                ) : (
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
                        {processedGrades.map((grade: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{grade.subject}</TableCell>
                            <TableCell>{grade.teacher}</TableCell>
                            <TableCell className="text-center">
                              {getGradeForPeriod(grade, "first")}
                            </TableCell>
                            <TableCell className="text-center">
                              {getGradeForPeriod(grade, "second")}
                            </TableCell>
                            <TableCell className="text-center">
                              {getGradeForPeriod(grade, "third")}
                            </TableCell>
                            <TableCell className="text-center">
                              {getGradeForPeriod(grade, "fourth")}
                            </TableCell>
                            <TableCell className="text-center font-bold">
                              {renderGradeWithColor(grade.average)}
                            </TableCell>
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="first">
            <Card>
              <CardHeader>
                <CardTitle>Notas do 1º Bimestre - {selectedYear}</CardTitle>
              </CardHeader>
              <CardContent>
                {processedGrades.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma nota encontrada para o ano {selectedYear}
                  </div>
                ) : (
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
                        {processedGrades.map((grade: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{grade.subject}</TableCell>
                            <TableCell>{grade.teacher}</TableCell>
                            <TableCell className="text-center">
                              {getGradeForPeriod(grade, "first")}
                            </TableCell>
                            <TableCell>
                              {grade.grades.find((g: any) => {
                                const month = new Date(g.date).getMonth() + 1;
                                return month >= 1 && month <= 3;
                              })?.comments || "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="second">
            <Card>
              <CardHeader>
                <CardTitle>Notas do 2º Bimestre - {selectedYear}</CardTitle>
              </CardHeader>
              <CardContent>
                {processedGrades.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma nota encontrada para o ano {selectedYear}
                  </div>
                ) : (
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
                        {processedGrades.map((grade: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{grade.subject}</TableCell>
                            <TableCell>{grade.teacher}</TableCell>
                            <TableCell className="text-center">
                              {getGradeForPeriod(grade, "second")}
                            </TableCell>
                            <TableCell>
                              {grade.grades.find((g: any) => {
                                const month = new Date(g.date).getMonth() + 1;
                                return month >= 4 && month <= 6;
                              })?.comments || "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="third">
            <Card>
              <CardHeader>
                <CardTitle>Notas do 3º Bimestre - {selectedYear}</CardTitle>
              </CardHeader>
              <CardContent>
                {processedGrades.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma nota encontrada para o ano {selectedYear}
                  </div>
                ) : (
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
                        {processedGrades.map((grade: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{grade.subject}</TableCell>
                            <TableCell>{grade.teacher}</TableCell>
                            <TableCell className="text-center">
                              {getGradeForPeriod(grade, "third")}
                            </TableCell>
                            <TableCell>
                              {grade.grades.find((g: any) => {
                                const month = new Date(g.date).getMonth() + 1;
                                return month >= 7 && month <= 9;
                              })?.comments || "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fourth">
            <Card>
              <CardHeader>
                <CardTitle>Notas do 4º Bimestre - {selectedYear}</CardTitle>
              </CardHeader>
              <CardContent>
                {processedGrades.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma nota encontrada para o ano {selectedYear}
                  </div>
                ) : (
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
                        {processedGrades.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-gray-500">
                              Nenhuma nota encontrada para o ano {selectedYear}
                            </TableCell>
                          </TableRow>
                        ) : (
                          processedGrades.map((grade: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{grade.subject}</TableCell>
                              <TableCell>{grade.teacher}</TableCell>
                              <TableCell className="text-center">
                                {getGradeForPeriod(grade, "fourth")}
                              </TableCell>
                              <TableCell>
                                {grade.grades.find((g: any) => {
                                  const month = new Date(g.date).getMonth() + 1;
                                  return month >= 10 && month <= 12;
                                })?.comments || "-"}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}