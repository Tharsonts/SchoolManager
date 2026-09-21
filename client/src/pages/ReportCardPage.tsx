import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Printer } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getGradeColor } from "@/lib/utils";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useStudentGrades } from "@/hooks/useStudentGrades";
import { useStudentClassInfo } from "@/hooks/useStudentApi";
import jsPDF from "jspdf";

const REPORT_LOGO_URL = `${import.meta.env.BASE_URL}assets/schoolmanager-report-card-logo.png`;
const numberLabel = (value?: number | null) => value == null ? '—' : value.toFixed(1);

async function loadReportLogo() {
  const response = await fetch(REPORT_LOGO_URL);
  if (!response.ok) return undefined;
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return `data:image/png;base64,${btoa(binary)}`;
}

export default function ReportCardPage() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("all");
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
    const pdf = new jsPDF('p', 'mm', 'a4');
    const logoData = await loadReportLogo();
    const left = 15;
    const right = 195;
    const width = right - left;
    const periodLabel = selectedPeriod === 'all'
      ? 'Ano completo'
      : `${selectedPeriod === 'first' ? '1º' : selectedPeriod === 'second' ? '2º' : selectedPeriod === 'third' ? '3º' : '4º'} Bimestre`;

    pdf.setFillColor(35, 71, 185);
    pdf.rect(left, 12, width, 26, 'F');
    if (logoData) {
      try { pdf.addImage(logoData, 'PNG', left + 5, 15, 20, 20); } catch { /* A emissão continua sem logo. */ }
    }
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text('Boletim Escolar', 108, 23, { align: 'center' });
    pdf.setFontSize(9.5);
    pdf.text('SchoolManager • Demonstrativo de desempenho acadêmico', 108, 30, { align: 'center' });

    pdf.setTextColor(20, 20, 20);
    pdf.setDrawColor(195, 201, 212);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.roundedRect(left, 44, width, 30, 2, 2, 'S');
    pdf.setFont('helvetica', 'bold');
    pdf.text('Aluno(a)', left + 4, 51);
    pdf.text('Matrícula', 108, 51);
    pdf.text('Turma', left + 4, 64);
    pdf.text('Período', 108, 64);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Aluno', left + 4, 56);
    pdf.text(user?.id || '—', 108, 56);
    pdf.text(classInfo?.data?.className || 'Turma não informada', left + 4, 69);
    pdf.text(periodLabel, 108, 69);

    const annual = selectedPeriod === 'all';
    const columns = annual
      ? [left, 60, 76, 92, 108, 124, 144, 164, right]
      : [left, 86, 122, 158, right];
    const labels = annual
      ? ['Disciplina', '1º', '2º', '3º', '4º', 'Média', 'Freq.', 'Situação']
      : ['Disciplina', 'Nota', 'Frequência', 'Situação'];
    const tableTop = 82;
    const headerHeight = 11;
    const rowHeight = 10;
    pdf.setFillColor(232, 238, 255);
    pdf.rect(left, tableTop, width, headerHeight, 'F');
    pdf.setDrawColor(190, 198, 215);
    pdf.rect(left, tableTop, width, headerHeight);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.2);
    labels.forEach((label, index) => {
      const x = columns[index];
      const cellWidth = columns[index + 1] - x;
      pdf.text(label, index === 0 ? x + 2 : x + cellWidth / 2, tableTop + 7, index === 0 ? undefined : { align: 'center' });
    });

    const filteredGrade = (row: typeof reportRows[number]) => {
      if (selectedPeriod === 'first') return row.first;
      if (selectedPeriod === 'second') return row.second;
      if (selectedPeriod === 'third') return row.third;
      return row.fourth;
    };
    const rows = reportRows.length ? reportRows : [{ subject: 'Nenhuma disciplina encontrada', first: undefined, second: undefined, third: undefined, fourth: undefined, average: undefined, attendance: 0, status: 'Sem dados' }];
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    rows.forEach((row, rowIndex) => {
      const y = tableTop + headerHeight + rowIndex * rowHeight;
      if (rowIndex % 2 === 1) {
        pdf.setFillColor(248, 250, 253);
        pdf.rect(left, y, width, rowHeight, 'F');
      }
      pdf.setDrawColor(218, 222, 230);
      pdf.rect(left, y, width, rowHeight);
      const values = annual
        ? [row.subject, numberLabel(row.first), numberLabel(row.second), numberLabel(row.third), numberLabel(row.fourth), numberLabel(row.average), `${Number(row.attendance || 0).toFixed(1)}%`, row.status]
        : [row.subject, numberLabel(filteredGrade(row)), `${Number(row.attendance || 0).toFixed(1)}%`, row.status];
      values.forEach((value, index) => {
        const x = columns[index];
        const cellWidth = columns[index + 1] - x;
        pdf.text(String(value), index === 0 ? x + 2 : x + cellWidth / 2, y + 6.5, index === 0 ? undefined : { align: 'center' });
      });
    });
    const summaryY = tableTop + headerHeight + rows.length * rowHeight;
    pdf.setFillColor(239, 243, 249);
    pdf.rect(left, summaryY, width, rowHeight, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.text('MÉDIA GERAL', left + 2, summaryY + 6.5);
    if (annual) {
      pdf.text(overallAverage.toFixed(1), (columns[5] + columns[6]) / 2, summaryY + 6.5, { align: 'center' });
      pdf.text(`${overallAttendance.toFixed(1)}%`, (columns[6] + columns[7]) / 2, summaryY + 6.5, { align: 'center' });
      pdf.text(overallAverage >= 6 && overallAttendance >= 75 ? 'Aprovado' : overallAverage < 5 || overallAttendance < 75 ? 'Reprovado' : 'Recuperação', (columns[7] + columns[8]) / 2, summaryY + 6.5, { align: 'center' });
    }

    const notesY = Math.max(summaryY + 20, 150);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('Critérios acadêmicos', left, notesY);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.text('• Aprovação: média igual ou superior a 6,0 e frequência mínima de 75%.', left, notesY + 7);
    pdf.text('• Recuperação: média entre 5,0 e 6,0, respeitando as regras da instituição.', left, notesY + 13);
    pdf.text('• As informações refletem os lançamentos disponíveis na data de emissão.', left, notesY + 19);

    pdf.setDrawColor(125, 125, 125);
    pdf.line(left + 5, 258, left + 70, 258);
    pdf.line(125, 258, right - 5, 258);
    pdf.setFontSize(8.5);
    pdf.text('Secretaria / Professor(a)', left + 37.5, 264, { align: 'center' });
    pdf.text('Responsável', 157.5, 264, { align: 'center' });
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(7.5);
    pdf.text(`Emitido em ${new Date().toLocaleDateString('pt-BR')} • SchoolManager`, 105, 285, { align: 'center' });

    pdf.save(`boletim-${(user?.firstName || 'aluno').toLowerCase()}.pdf`);
  };

  return (
      <div className="space-y-6">
        <Card className="border-2 border-blue-500 print:border-none">
          <CardHeader className="bg-blue-50 dark:bg-blue-900/20 print:bg-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <img
                  src={REPORT_LOGO_URL}
                  alt="Emblema acadêmico do SchoolManager"
                  className="h-16 w-16 object-contain drop-shadow-sm"
                />
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
          <CardContent className="pt-6">
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

            <div className="mt-10 grid grid-cols-1 gap-10 border-t pt-12 text-center sm:grid-cols-2 print:mt-12 print:gap-16 print:pt-10">
              <div className="border-t border-dashed pt-2">
                <p className="text-sm text-muted-foreground">Secretaria / Professor(a)</p>
              </div>
              <div className="border-t border-dashed pt-2">
                <p className="text-sm text-muted-foreground">Responsável</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
