import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Printer } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getGradeColor } from "@/lib/utils";
import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useStudentGrades } from "@/hooks/useStudentGrades";
import { useStudentClassInfo } from "@/hooks/useStudentApi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function ReportCardPage() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const contentRef = useRef<HTMLDivElement>(null);
  const { data: classInfo } = useStudentClassInfo();
  const { data: gradesData } = useStudentGrades(user?.id || "");
  const { data: attendanceData } = useQuery({
    queryKey: ['student-attendance', user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/attendance/student/${user?.id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Erro ao buscar frequência');
      return res.json();
    },
    enabled: !!user?.id
  });

  const toQuarter = (dateStr: string) => {
    const d = new Date(dateStr);
    const m = d.getMonth() + 1;
    if (m <= 3) return 1;
    if (m <= 6) return 2;
    if (m <= 9) return 3;
    return 4;
  };

  const subjects = useMemo(() => {
    const set = new Set<string>();
    (gradesData || []).forEach((g: any) => set.add(g.subjectName));
    (attendanceData?.statsBySubject || []).forEach((s: any) => set.add(s.subjectName));
    return Array.from(set);
  }, [gradesData, attendanceData]);

  const attendanceMap = useMemo(() => {
    const map = new Map<string, { totalClasses: number; presentClasses: number; absentClasses: number; attendanceRate: number }>();
    (attendanceData?.statsBySubject || []).forEach((s: any) => {
      map.set(s.subjectName, {
        totalClasses: s.totalClasses || 0,
        presentClasses: s.presentClasses || 0,
        absentClasses: s.absentClasses || 0,
        attendanceRate: s.totalClasses > 0 ? Math.round((s.presentClasses / s.totalClasses) * 100) : 0
      });
    });
    return map;
  }, [attendanceData]);

  const reportRows = useMemo(() => {
    return subjects.map((subjectName) => {
      const subjectGrades = (gradesData || []).filter((g: any) => g.subjectName === subjectName);
      const q1 = subjectGrades.filter((g: any) => toQuarter(g.date) === 1);
      const q2 = subjectGrades.filter((g: any) => toQuarter(g.date) === 2);
      const q3 = subjectGrades.filter((g: any) => toQuarter(g.date) === 3);
      const q4 = subjectGrades.filter((g: any) => toQuarter(g.date) === 4);

      const weighted = (list: any[]) => {
        if (!list.length) return undefined;
        const sum = list.reduce((acc, it) => acc + (Number(it.grade || 0) * Number(it.weight || 1)), 0);
        const w = list.reduce((acc, it) => acc + Number(it.weight || 1), 0);
        return Number((sum / (w || 1)).toFixed(1));
      };

      const first = weighted(q1);
      const second = weighted(q2);
      const third = weighted(q3);
      const fourth = weighted(q4);
      const parts = [first, second, third, fourth].filter((n) => typeof n === 'number') as number[];
      const average = parts.length ? Number((parts.reduce((a, b) => a + b, 0) / parts.length).toFixed(1)) : undefined;
      const att = attendanceMap.get(subjectName)?.attendanceRate ?? 0;
      const status = average !== undefined && average >= 6 && att >= 75 ? 'Aprovado' : (average !== undefined && average < 5 || att < 75) ? 'Reprovado' : 'Recuperação';

      return { subject: subjectName, first, second, third, fourth, average, attendance: att, status };
    });
  }, [subjects, gradesData, attendanceMap]);

  const overallAverage = useMemo(() => {
    const vals = reportRows.map((r) => r.average).filter((n): n is number => typeof n === 'number');
    if (!vals.length) return 0;
    return Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1));
  }, [reportRows]);

  const overallAttendance = useMemo(() => {
    const gen = attendanceData?.generalStats || attendanceData?.general;
    if (gen && typeof gen.attendanceRate === 'number') return Number(gen.attendanceRate.toFixed(1));
    const vals = reportRows.map((r) => r.attendance || 0);
    if (!vals.length) return 0;
    return Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1));
  }, [attendanceData, reportRows]);

  const renderGradeWithColor = (grade?: number) => {
    if (grade === undefined || grade === null) return <span>-</span>;
    return <span className={`font-medium ${getGradeColor(grade)}`}>{grade.toFixed(1)}</span>;
  };

  const downloadPDF = async () => {
    if (!contentRef.current) return;
    const canvas = await html2canvas(contentRef.current);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const ratio = Math.min(pageWidth / imgProps.width, pageHeight / imgProps.height);
    pdf.addImage(imgData, 'PNG', 0, 0, imgProps.width * ratio, imgProps.height * ratio);
    pdf.save('boletim.pdf');
  };

  return (
    <MainLayout pageTitle="Boletim Escolar">
      <div className="space-y-6">
        <Card className="border-2 border-blue-500 print:border-none">
          <CardHeader className="bg-blue-50 dark:bg-blue-900/20 print:bg-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <img src="/assets/logo.png" alt="Logo" className="h-16 w-16 object-contain" />
                <div>
                  <CardTitle className="text-2xl">Boletim Escolar</CardTitle>
                  <CardDescription>{classInfo?.data?.className || 'Turma'}</CardDescription>
                </div>
              </div>
              <div className="print:hidden flex space-x-2">
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
                <Button className="bg-blue-500 hover:bg-blue-600" onClick={downloadPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6" ref={contentRef}>
            <div className="border-b pb-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Aluno</p>
                  <p className="font-semibold">{`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Aluno'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Matrícula</p>
                  <p>{user?.id || ''}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Turma</p>
                  <p>{classInfo?.data?.className || 'Turma'}</p>
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
                    {selectedPeriod === 'all' && (
                      <>
                        <TableHead className="text-center" colSpan={4}>Notas Bimestrais</TableHead>
                        <TableHead className="text-center" rowSpan={2}>Média Final</TableHead>
                        <TableHead className="text-center" rowSpan={2}>Frequência (%)</TableHead>
                        <TableHead className="text-center" rowSpan={2}>Situação</TableHead>
                      </>
                    )}
                    {selectedPeriod !== 'all' && (
                      <>
                        <TableHead className="text-center">Nota</TableHead>
                        <TableHead className="text-center">Frequência (%)</TableHead>
                        <TableHead className="text-center">Situação</TableHead>
                      </>
                    )}
                  </TableRow>
                  {selectedPeriod === 'all' && (
                    <TableRow>
                      <TableHead className="text-center">1º</TableHead>
                      <TableHead className="text-center">2º</TableHead>
                      <TableHead className="text-center">3º</TableHead>
                      <TableHead className="text-center">4º</TableHead>
                    </TableRow>
                  )}
                </TableHeader>
                <TableBody>
                  {reportRows.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.subject}</TableCell>
                      {selectedPeriod === 'all' && (
                        <>
                          <TableCell className="text-center">{renderGradeWithColor(row.first)}</TableCell>
                          <TableCell className="text-center">{renderGradeWithColor(row.second)}</TableCell>
                          <TableCell className="text-center">{renderGradeWithColor(row.third)}</TableCell>
                          <TableCell className="text-center">{renderGradeWithColor(row.fourth)}</TableCell>
                          <TableCell className="text-center font-bold">{renderGradeWithColor(row.average)}</TableCell>
                          <TableCell className="text-center">{Number(row.attendance || 0).toFixed(1)}%</TableCell>
                          <TableCell className="text-center">
                            <Badge className={row.status === 'Aprovado' ? 'bg-green-500' : row.status === 'Reprovado' ? 'bg-red-500' : 'bg-yellow-500'}>
                              {row.status}
                            </Badge>
                          </TableCell>
                        </>
                      )}
                      {selectedPeriod === 'first' && (
                        <>
                          <TableCell className="text-center">{renderGradeWithColor(row.first)}</TableCell>
                          <TableCell className="text-center">{Number(row.attendance || 0).toFixed(1)}%</TableCell>
                          <TableCell className="text-center">
                            <Badge className={(row.first ?? 0) >= 6 && (row.attendance ?? 0) >= 75 ? 'bg-green-500' : 'bg-yellow-500'}>
                              {(row.first ?? 0) >= 6 && (row.attendance ?? 0) >= 75 ? 'Aprovado' : 'Recuperação'}
                            </Badge>
                          </TableCell>
                        </>
                      )}
                      {selectedPeriod === 'second' && (
                        <>
                          <TableCell className="text-center">{renderGradeWithColor(row.second)}</TableCell>
                          <TableCell className="text-center">{Number(row.attendance || 0).toFixed(1)}%</TableCell>
                          <TableCell className="text-center">
                            <Badge className={(row.second ?? 0) >= 6 && (row.attendance ?? 0) >= 75 ? 'bg-green-500' : 'bg-yellow-500'}>
                              {(row.second ?? 0) >= 6 && (row.attendance ?? 0) >= 75 ? 'Aprovado' : 'Recuperação'}
                            </Badge>
                          </TableCell>
                        </>
                      )}
                      {selectedPeriod === 'third' && (
                        <>
                          <TableCell className="text-center">{renderGradeWithColor(row.third)}</TableCell>
                          <TableCell className="text-center">{Number(row.attendance || 0).toFixed(1)}%</TableCell>
                          <TableCell className="text-center">
                            <Badge className={(row.third ?? 0) >= 6 && (row.attendance ?? 0) >= 75 ? 'bg-green-500' : 'bg-yellow-500'}>
                              {(row.third ?? 0) >= 6 && (row.attendance ?? 0) >= 75 ? 'Aprovado' : 'Recuperação'}
                            </Badge>
                          </TableCell>
                        </>
                      )}
                      {selectedPeriod === 'fourth' && (
                        <>
                          <TableCell className="text-center">{renderGradeWithColor(row.fourth)}</TableCell>
                          <TableCell className="text-center">{Number(row.attendance || 0).toFixed(1)}%</TableCell>
                          <TableCell className="text-center">
                            <Badge className={(row.fourth ?? 0) >= 6 && (row.attendance ?? 0) >= 75 ? 'bg-green-500' : 'bg-yellow-500'}>
                              {(row.fourth ?? 0) >= 6 && (row.attendance ?? 0) >= 75 ? 'Aprovado' : 'Recuperação'}
                            </Badge>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-bold">MÉDIA GERAL</TableCell>
                    {selectedPeriod === 'all' && (
                      <>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-center font-bold">{renderGradeWithColor(overallAverage)}</TableCell>
                        <TableCell className="text-center font-bold">{overallAttendance.toFixed(1)}%</TableCell>
                        <TableCell className="text-center">
                          <Badge className={overallAverage >= 6 && overallAttendance >= 75 ? 'bg-green-500' : overallAverage < 5 || overallAttendance < 75 ? 'bg-red-500' : 'bg-yellow-500'}>
                            {overallAverage >= 6 && overallAttendance >= 75 ? 'Aprovado' : overallAverage < 5 || overallAttendance < 75 ? 'Reprovado' : 'Recuperação'}
                          </Badge>
                        </TableCell>
                      </>
                    )}
                    {selectedPeriod !== 'all' && (
                      <>
                        <TableCell className="text-center font-bold">
                          {selectedPeriod === 'first' && renderGradeWithColor(Number((reportRows.map(r => r.first ?? 0).reduce((a,b)=>a+b,0) / (reportRows.length || 1)).toFixed(1)))}
                          {selectedPeriod === 'second' && renderGradeWithColor(Number((reportRows.map(r => r.second ?? 0).reduce((a,b)=>a+b,0) / (reportRows.length || 1)).toFixed(1)))}
                          {selectedPeriod === 'third' && renderGradeWithColor(Number((reportRows.map(r => r.third ?? 0).reduce((a,b)=>a+b,0) / (reportRows.length || 1)).toFixed(1)))}
                          {selectedPeriod === 'fourth' && renderGradeWithColor(Number((reportRows.map(r => r.fourth ?? 0).reduce((a,b)=>a+b,0) / (reportRows.length || 1)).toFixed(1)))}
                        </TableCell>
                        <TableCell className="text-center font-bold">{overallAttendance.toFixed(1)}%</TableCell>
                        <TableCell className="text-center">
                          <Badge className={overallAverage >= 6 && overallAttendance >= 75 ? 'bg-green-500' : overallAverage < 5 || overallAttendance < 75 ? 'bg-red-500' : 'bg-yellow-500'}>
                            {overallAverage >= 6 && overallAttendance >= 75 ? 'Aprovado' : overallAverage < 5 || overallAttendance < 75 ? 'Reprovado' : 'Recuperação'}
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
                    <p><span className="inline-block w-4 h-4 mr-2 bg-green-500 rounded-full"></span> Aprovado: média ≥ 6,0 e frequência ≥ 75%</p>
                    <p><span className="inline-block w-4 h-4 mr-2 bg-yellow-500 rounded-full"></span> Recuperação: média entre 5,0 e 6,0</p>
                    <p><span className="inline-block w-4 h-4 mr-2 bg-red-500 rounded-full"></span> Reprovado: média menor que 5,0 ou frequência menor que 75%</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Observações</h4>
                  <div className="space-y-1 text-sm">
                    <p>• Frequência mínima exigida: 75% do total de aulas.</p>
                    <p>• Para aprovação, é necessário média igual ou superior a 6,0.</p>
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
