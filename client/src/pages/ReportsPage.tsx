import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import { DownloadCloud, FileText, Users, BookOpen, AlertCircle } from "lucide-react";
import TeacherLayout from "@/components/layout/TeacherLayout";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

type ReportStudent = {
  id: string;
  name: string;
  birthDate?: string | null;
  averages: { b1: number | null; b2: number | null; b3: number | null; b4: number | null };
  average: number | null;
  frequency: number | null;
  situation: string;
  attendance: { present: number; absent: number; late: number; excused: number; total: number };
  assessments: Array<{ title: string; source: string; date?: string | null; value: number; quarter: number }>;
};

type ReportData = {
  className: string;
  subjectName: string;
  academicYear: string;
  quarter: string;
  students: ReportStudent[];
  summary: { totalStudents: number; average: number | null; attendanceRate: number | null; approvalRate: number | null };
  warnings: string[];
};

const PERIODS = [
  { value: "annual", label: "Anual" },
  { value: "1", label: "1º Bimestre" },
  { value: "2", label: "2º Bimestre" },
  { value: "3", label: "3º Bimestre" },
  { value: "4", label: "4º Bimestre" },
];

const numberLabel = (value: number | null | undefined) => value == null ? "—" : value.toFixed(1);
const percentLabel = (value: number | null | undefined) => value == null ? "—" : `${value.toFixed(1)}%`;
const safeFilePart = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-BR");
}

async function loadLogoData() {
  const response = await fetch(`${import.meta.env.BASE_URL}assets/schoolmanager-report-card-logo.png`);
  if (!response.ok) return undefined;
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return `data:image/png;base64,${btoa(binary)}`;
}

function renderStudentReport(doc: jsPDF, report: ReportData, student: ReportStudent, periodLabel: string, logoData?: string) {
  const left = 15;
  const right = 195;
  const width = right - left;
  // Nove limites para as oito colunas. A versão anterior tinha apenas oito
  // limites, produzindo NaN na coluna "Situação" e interrompendo o jsPDF.
  const columns = [left, 61, 78, 95, 112, 132, 150, 169, right];
  const labels = ["Componente curricular", "1º Bim.", "2º Bim.", "3º Bim.", "4º Bim.", "Média", "Freq.", "Situação"];

  doc.setDrawColor(30, 64, 175);
  doc.setFillColor(30, 64, 175);
  doc.rect(left, 12, width, 24, "F");
  if (logoData) {
    try { doc.addImage(logoData, "PNG", left + 5, 14.5, 19, 19); } catch { /* Logo não impede a emissão. */ }
  } else {
    // Marca neutra para a demonstração quando a escola ainda não configurou logo.
    doc.setFillColor(255, 255, 255);
    doc.circle(left + 15, 24, 8, "F");
    doc.setTextColor(30, 64, 175);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("ESCOLA", left + 15, 26, { align: "center" });
  }
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Boletim de Aproveitamento", 105, 22, { align: "center" });
  doc.setFontSize(10);
  doc.text("Relatório da disciplina emitido pelo professor", 105, 29, { align: "center" });

  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(190, 190, 190);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.roundedRect(left, 42, width, 31, 2, 2, "S");
  doc.text(`Aluno(a): ${student.name}`, left + 4, 50);
  doc.text(`Turma: ${report.className}`, left + 4, 58);
  doc.text(`Disciplina: ${report.subjectName}`, left + 4, 66);
  doc.text(`Ano letivo: ${report.academicYear}`, 112, 50);
  doc.text(`Período: ${periodLabel}`, 112, 58);
  doc.text(`Nascimento: ${formatDate(student.birthDate)}`, 112, 66);

  const top = 83;
  doc.setFillColor(235, 240, 255);
  doc.rect(left, top, width, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  labels.forEach((label, index) => {
    const x = columns[index];
    const columnWidth = columns[index + 1] - x;
    doc.text(label, index === 0 ? x + 2 : x + columnWidth / 2, top + 6.5, index === 0 ? undefined : { align: "center" });
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const rowTop = top + 10;
  doc.rect(left, rowTop, width, 12);
  const values = [report.subjectName, numberLabel(student.averages.b1), numberLabel(student.averages.b2), numberLabel(student.averages.b3), numberLabel(student.averages.b4), numberLabel(student.average), percentLabel(student.frequency), student.situation];
  values.forEach((value, index) => {
    const x = columns[index];
    const columnWidth = columns[index + 1] - x;
    doc.text(value, index === 0 ? x + 2 : x + columnWidth / 2, rowTop + 7.5, index === 0 ? undefined : { align: "center" });
  });
  for (let index = 1; index < columns.length - 1; index++) doc.line(columns[index], top, columns[index], rowTop + 12);
  doc.line(left, rowTop, right, rowTop);

  const attendanceTop = 112;
  doc.setFillColor(248, 250, 252);
  doc.rect(left, attendanceTop, width, 15, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Frequência", left + 3, attendanceTop + 6);
  doc.setFont("helvetica", "normal");
  doc.text(`Presenças: ${student.attendance.present}`, left + 3, attendanceTop + 12);
  doc.text(`Faltas: ${student.attendance.absent}`, 67, attendanceTop + 12);
  doc.text(`Justificadas: ${student.attendance.excused}`, 108, attendanceTop + 12);
  doc.text(`Percentual: ${percentLabel(student.frequency)}`, 155, attendanceTop + 12);

  const assessmentTop = 139;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Avaliações consideradas", left, assessmentTop);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const assessments = student.assessments.slice().sort((first, second) => first.quarter - second.quarter || String(first.date).localeCompare(String(second.date)));
  if (assessments.length === 0) {
    doc.text("Nenhuma nota foi lançada para os filtros selecionados.", left + 2, assessmentTop + 8);
  } else {
    assessments.slice(0, 12).forEach((assessment, index) => {
      doc.text(`${assessment.quarter}º bim. • ${assessment.source}: ${assessment.title} — ${assessment.value.toFixed(1)}`, left + 2, assessmentTop + 8 + index * 5);
    });
    if (assessments.length > 12) doc.text(`+ ${assessments.length - 12} avaliação(ões) no cálculo`, left + 2, assessmentTop + 71);
  }

  doc.setDrawColor(160, 160, 160);
  doc.line(left, 267, left + 60, 267);
  doc.line(120, 267, right, 267);
  doc.setFontSize(8.5);
  doc.text("Professor(a)", left + 20, 272, { align: "center" });
  doc.text("Responsável", 157, 272, { align: "center" });
  doc.setTextColor(90, 90, 90);
  doc.text(`Documento emitido em ${new Date().toLocaleDateString("pt-BR")} • ${report.className} • ${report.subjectName}`, 105, 285, { align: "center" });
  doc.setTextColor(0, 0, 0);
}

export default function ReportsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isTeacher = user?.role === "teacher";
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("annual");
  const [view, setView] = useState<"all" | "student">("all");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [activeTab, setActiveTab] = useState("report-card");
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: classesData, isLoading: isLoadingClasses } = useQuery({
    queryKey: ["teacher-report-classes", user?.id],
    enabled: isTeacher && !!user?.id,
    queryFn: async () => {
      const response = await fetch(`/api/teacher/${user?.id}/classes`, { credentials: "include" });
      if (!response.ok) throw new Error("Não foi possível carregar as turmas.");
      return response.json();
    },
  });

  const assignments = (classesData?.data || []) as Array<{ classId: string; className: string; subjectId: string; subjectName: string }>;
  const classes = useMemo(() => Array.from(new Map(assignments.map((item) => [item.classId, { id: item.classId, name: item.className }])).values()), [assignments]);
  const subjects = useMemo(() => {
    const unique = new Map<string, { id: string; name: string }>();
    assignments.filter((item) => item.classId === selectedClass).forEach((item) => unique.set(item.subjectId, { id: item.subjectId, name: item.subjectName }));
    return Array.from(unique.values());
  }, [assignments, selectedClass]);

  // Em perfis demonstrativos com uma única atribuição, abre o boletim pronto.
  useEffect(() => {
    if (!selectedClass && classes.length === 1) setSelectedClass(classes[0].id);
  }, [classes, selectedClass]);
  useEffect(() => {
    if (!selectedClass) return;
    const stillBelongsToClass = subjects.some((subject) => subject.id === selectedSubjectId);
    if (!stillBelongsToClass) setSelectedSubjectId(subjects.length === 1 ? subjects[0].id : "");
  }, [selectedClass, selectedSubjectId, subjects]);
  useEffect(() => { setSelectedStudentId(""); }, [selectedClass]);
  useEffect(() => setSelectedStudentId(""), [selectedSubjectId, selectedPeriod, view]);

  const reportQuery = useQuery({
    queryKey: ["teacher-consolidated-report", user?.id, selectedClass, selectedSubjectId, selectedPeriod],
    enabled: isTeacher && !!user?.id && !!selectedClass && !!selectedSubjectId,
    queryFn: async (): Promise<{ data: ReportData }> => {
      const params = new URLSearchParams({ classId: selectedClass, subjectId: selectedSubjectId });
      if (selectedPeriod !== "annual") params.set("quarter", selectedPeriod);
      const response = await fetch(`/api/teacher/${user?.id}/reports/report-card?${params.toString()}`, { credentials: "include" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "Não foi possível gerar o relatório.");
      return body;
    },
  });

  const report = reportQuery.data?.data;
  const students = report?.students || [];
  const visibleStudents = view === "student" ? students.filter((student) => student.id === selectedStudentId) : students;
  const periodLabel = PERIODS.find((period) => period.value === selectedPeriod)?.label || "Anual";
  const canDownload = !!report && visibleStudents.length > 0 && !reportQuery.isFetching;

  const downloadReport = async () => {
    if (!report || visibleStudents.length === 0) {
      toast({ title: "Seleção incompleta", description: "Escolha turma, disciplina e, no modo aluno, o aluno desejado." });
      return;
    }
    try {
      setIsDownloading(true);
      const logoData = await loadLogoData().catch(() => undefined);
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      visibleStudents.forEach((student, index) => {
        if (index > 0) doc.addPage();
        renderStudentReport(doc, report, student, periodLabel, logoData);
      });
      const totalPages = doc.getNumberOfPages();
      for (let page = 1; page <= totalPages; page++) {
        doc.setPage(page);
        doc.setFontSize(8);
        doc.setTextColor(90, 90, 90);
        doc.text(`Página ${page} de ${totalPages}`, 105, 291, { align: "center" });
      }
      const subjectName = subjects.find((subject) => subject.id === selectedSubjectId)?.name || report.subjectName;
      const scope = view === "student" ? visibleStudents[0].name : report.className;
      doc.save(`Relatorio_${safeFilePart(scope)}_${safeFilePart(subjectName)}_${safeFilePart(periodLabel)}.pdf`);
      toast({ title: "Relatório baixado", description: "O PDF foi gerado com as notas e a frequência selecionadas." });
    } catch (error) {
      console.error("Erro ao baixar relatório:", error);
      toast({ title: "Falha ao gerar PDF", description: "Tente novamente. Se o problema continuar, verifique os dados da turma.", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const content = (
    <div className="container mx-auto space-y-6 px-4 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios</h1><p className="text-sm text-gray-600 dark:text-gray-300">Notas de provas, atividades avaliadas e frequência da sua disciplina.</p></div>
        <Button onClick={downloadReport} disabled={!canDownload || isDownloading} className="bg-blue-700 hover:bg-blue-800"><DownloadCloud className="mr-2 h-4 w-4" />{isDownloading ? "Gerando PDF..." : "Baixar relatório"}</Button>
      </div>

      <Card><CardContent className="grid grid-cols-1 gap-4 p-5 md:grid-cols-4">
        <div><Label>Turma</Label><Select value={selectedClass} onValueChange={setSelectedClass} disabled={isLoadingClasses}><SelectTrigger><SelectValue placeholder={isLoadingClasses ? "Carregando..." : "Selecione a turma"} /></SelectTrigger><SelectContent>{classes.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Disciplina</Label><Select value={selectedSubjectId} onValueChange={setSelectedSubjectId} disabled={!selectedClass}><SelectTrigger><SelectValue placeholder={selectedClass ? "Selecione a disciplina" : "Escolha a turma primeiro"} /></SelectTrigger><SelectContent>{subjects.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Período</Label><Select value={selectedPeriod} onValueChange={setSelectedPeriod}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PERIODS.map((period) => <SelectItem key={period.value} value={period.value}>{period.label}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Visualização</Label><Select value={view} onValueChange={(value: "all" | "student") => setView(value)} disabled={!report}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os alunos</SelectItem><SelectItem value="student">Um aluno</SelectItem></SelectContent></Select></div>
        {view === "student" && <div className="md:col-span-2"><Label>Aluno</Label><Select value={selectedStudentId} onValueChange={setSelectedStudentId} disabled={!report}><SelectTrigger><SelectValue placeholder="Selecione o aluno" /></SelectTrigger><SelectContent>{students.map((student) => <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>)}</SelectContent></Select></div>}
      </CardContent></Card>

      {!selectedClass || !selectedSubjectId ? (
        <Card><CardContent className="p-8 text-center text-gray-600 dark:text-gray-300"><BookOpen className="mx-auto mb-3 h-8 w-8 text-blue-600" />Selecione a turma e a disciplina para carregar um relatório real.</CardContent></Card>
      ) : reportQuery.isLoading ? (
        <Card><CardContent className="p-8 text-center text-gray-600">Carregando dados do relatório...</CardContent></Card>
      ) : reportQuery.isError ? (
        <Card><CardContent className="p-8 text-center text-red-700">{reportQuery.error instanceof Error ? reportQuery.error.message : "Não foi possível carregar o relatório."}</CardContent></Card>
      ) : report && <>
        {report.warnings.length > 0 && <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20"><CardContent className="flex gap-3 p-4 text-amber-900 dark:text-amber-200"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><div>{report.warnings.map((warning) => <p key={warning}>{warning}</p>)}</div></CardContent></Card>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card><CardContent className="p-5"><p className="text-sm text-gray-500">Alunos</p><p className="text-2xl font-bold">{report.summary.totalStudents}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm text-gray-500">Média da disciplina</p><p className="text-2xl font-bold">{numberLabel(report.summary.average)}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm text-gray-500">Frequência média</p><p className="text-2xl font-bold">{percentLabel(report.summary.attendanceRate)}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm text-gray-500">Aprovação</p><p className="text-2xl font-bold">{percentLabel(report.summary.approvalRate)}</p></CardContent></Card>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="report-card"><FileText className="mr-2 h-4 w-4" />Boletins</TabsTrigger><TabsTrigger value="attendance"><Users className="mr-2 h-4 w-4" />Frequência</TabsTrigger></TabsList>
          <TabsContent value="report-card"><Card><CardHeader><CardTitle>Notas por bimestre — {report.subjectName}</CardTitle></CardHeader><CardContent className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Aluno</TableHead><TableHead>1º</TableHead><TableHead>2º</TableHead><TableHead>3º</TableHead><TableHead>4º</TableHead><TableHead>Média</TableHead><TableHead>Situação</TableHead></TableRow></TableHeader><TableBody>{visibleStudents.length === 0 ? <TableRow><TableCell colSpan={7} className="py-8 text-center text-gray-500">Selecione um aluno para visualizar o boletim.</TableCell></TableRow> : visibleStudents.map((student) => <TableRow key={student.id}><TableCell className="font-medium">{student.name}</TableCell><TableCell>{numberLabel(student.averages.b1)}</TableCell><TableCell>{numberLabel(student.averages.b2)}</TableCell><TableCell>{numberLabel(student.averages.b3)}</TableCell><TableCell>{numberLabel(student.averages.b4)}</TableCell><TableCell>{numberLabel(student.average)}</TableCell><TableCell>{student.situation}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card></TabsContent>
          <TabsContent value="attendance"><Card><CardHeader><CardTitle>Frequência — {report.subjectName}</CardTitle></CardHeader><CardContent className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Aluno</TableHead><TableHead>Presenças</TableHead><TableHead>Faltas</TableHead><TableHead>Justificadas</TableHead><TableHead>Frequência</TableHead></TableRow></TableHeader><TableBody>{visibleStudents.length === 0 ? <TableRow><TableCell colSpan={5} className="py-8 text-center text-gray-500">Selecione um aluno para visualizar a frequência.</TableCell></TableRow> : visibleStudents.map((student) => <TableRow key={student.id}><TableCell className="font-medium">{student.name}</TableCell><TableCell>{student.attendance.present}</TableCell><TableCell>{student.attendance.absent}</TableCell><TableCell>{student.attendance.excused}</TableCell><TableCell>{percentLabel(student.frequency)}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card></TabsContent>
        </Tabs>
        <div className="flex justify-end"><Button onClick={downloadReport} disabled={!canDownload || isDownloading} className="bg-blue-700 hover:bg-blue-800"><DownloadCloud className="mr-2 h-4 w-4" />{view === "student" ? "Baixar boletim do aluno" : "Baixar boletins da turma"}</Button></div>
      </>}
    </div>
  );

  if (isTeacher) return <TeacherLayout>{content}</TeacherLayout>;
  return <MainLayout pageTitle="Relatórios">{content}</MainLayout>;
}
