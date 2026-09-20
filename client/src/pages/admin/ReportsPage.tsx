import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Download,
  FileText,
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  Filter
} from 'lucide-react';

const ReportsPage = () => {
  const [selectedReport, setSelectedReport] = useState<string>('users');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current');

  const reportTypes = [
    { value: 'users', label: 'Relatório de Usuários', icon: Users },
    { value: 'classes', label: 'Relatório de Turmas', icon: GraduationCap },
    { value: 'subjects', label: 'Relatório de Disciplinas', icon: BookOpen },
    { value: 'performance', label: 'Relatório de Desempenho', icon: TrendingUp },
    { value: 'attendance', label: 'Relatório de Frequência', icon: Calendar }
  ];

  const periods = [
    { value: 'current', label: 'Período Atual' },
    { value: 'last_month', label: 'Último Mês' },
    { value: 'last_quarter', label: 'Último Trimestre' },
    { value: 'last_year', label: 'Último Ano' },
    { value: 'custom', label: 'Período Personalizado' }
  ];

  // Mock data para demonstração
  const mockData = {
    users: {
      total: 16,
      byRole: [
        { role: 'Administrador', count: 1, percentage: 6.25 },
        { role: 'Coordenador', count: 1, percentage: 6.25 },
        { role: 'Professor', count: 3, percentage: 18.75 },
        { role: 'Aluno', count: 11, percentage: 68.75 }
      ],
      status: [
        { status: 'Ativo', count: 15, percentage: 93.75 },
        { status: 'Inativo', count: 1, percentage: 6.25 }
      ],
      growth: 12.5
    },
    classes: {
      total: 1,
      byGrade: [
        { grade: '9º Ano', count: 1, percentage: 100 }
      ],
      byStatus: [
        { status: 'Ativa', count: 1, percentage: 100 }
      ],
      capacity: {
        total: 30,
        occupied: 4,
        available: 26
      },
      growth: -5.0
    },
    subjects: {
      total: 5,
      byGrade: [
        { grade: '9º Ano', count: 5, percentage: 100 }
      ],
      byTeacher: [
        { teacher: 'Prof. João Silva', count: 1, percentage: 20 },
        { teacher: 'Prof. Maria Santos', count: 1, percentage: 20 },
        { teacher: 'Prof. Pedro Costa', count: 1, percentage: 20 },
        { teacher: 'Prof. Ana Lima', count: 1, percentage: 20 },
        { teacher: 'Prof. Carlos Oliveira', count: 1, percentage: 20 }
      ],
      growth: 8.0
    },
    performance: {
      average: 7.2,
      byGrade: [
        { grade: '9º Ano', average: 7.2, students: 4 }
      ],
      bySubject: [
        { subject: 'Matemática', average: 8.1, students: 4 },
        { subject: 'Português', average: 7.8, students: 4 },
        { subject: 'História', average: 6.9, students: 4 },
        { subject: 'Geografia', average: 7.5, students: 4 },
        { subject: 'Ciências', average: 6.7, students: 4 }
      ],
      growth: 3.2
    },
    attendance: {
      average: 85.5,
      byGrade: [
        { grade: '9º Ano', average: 85.5, students: 4 }
      ],
      byClass: [
        { class: '9º Ano A', average: 85.5, students: 4 }
      ],
      growth: 2.1
    }
  };

  const getReportData = () => {
    return mockData[selectedReport as keyof typeof mockData];
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4" />;
    if (growth < 0) return <TrendingDown className="h-4 w-4" />;
    return null;
  };

  const renderReportContent = () => {
    const data = getReportData();
    
    switch (selectedReport) {
      case 'users':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Total de Usuários</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{data.total}</div>
                  <div className={`flex items-center gap-1 text-sm mt-1 ${getGrowthColor(data.growth)}`}>
                    {getGrowthIcon(data.growth)}
                    <span>{data.growth > 0 ? '+' : ''}{data.growth}% este mês</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Por Função</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.byRole.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{item.role}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{item.count}</span>
                          <Badge variant="secondary" className="text-xs">
                            {item.percentage}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Por Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.status.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{item.status}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{item.count}</span>
                          <Badge variant="secondary" className="text-xs">
                            {item.percentage}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'classes':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Total de Turmas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{data.total}</div>
                  <div className={`flex items-center gap-1 text-sm mt-1 ${getGrowthColor(data.growth)}`}>
                    {getGrowthIcon(data.growth)}
                    <span>{data.growth > 0 ? '+' : ''}{data.growth}% este mês</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Capacidade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total</span>
                      <span className="text-sm font-medium">{data.capacity.total}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Ocupada</span>
                      <span className="text-sm font-medium text-green-600">{data.capacity.occupied}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Disponível</span>
                      <span className="text-sm font-medium text-blue-600">{data.capacity.available}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Por Série</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.byGrade.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{item.grade}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{item.count}</span>
                          <Badge variant="secondary" className="text-xs">
                            {item.percentage}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'subjects':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Total de Disciplinas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{data.total}</div>
                  <div className={`flex items-center gap-1 text-sm mt-1 ${getGrowthColor(data.growth)}`}>
                    {getGrowthIcon(data.growth)}
                    <span>{data.growth > 0 ? '+' : ''}{data.growth}% este mês</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Por Série</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.byGrade.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{item.grade}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{item.count}</span>
                          <Badge variant="secondary" className="text-xs">
                            {item.percentage}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Por Professor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.byTeacher.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 truncate">{item.teacher}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{item.count}</span>
                          <Badge variant="secondary" className="text-xs">
                            {item.percentage}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'performance':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Média Geral</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{data.average}</div>
                  <div className={`flex items-center gap-1 text-sm mt-1 ${getGrowthColor(data.growth)}`}>
                    {getGrowthIcon(data.growth)}
                    <span>{data.growth > 0 ? '+' : ''}{data.growth}% este mês</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Por Série</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.byGrade.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{item.grade}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{item.average}</span>
                          <Badge variant="secondary" className="text-xs">
                            {item.students} alunos
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Por Disciplina</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.bySubject.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{item.subject}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{item.average}</span>
                          <Badge variant="secondary" className="text-xs">
                            {item.students} alunos
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'attendance':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Frequência Média</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{data.average}%</div>
                  <div className={`flex items-center gap-1 text-sm mt-1 ${getGrowthColor(data.growth)}`}>
                    {getGrowthIcon(data.growth)}
                    <span>{data.growth > 0 ? '+' : ''}{data.growth}% este mês</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Por Série</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.byGrade.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{item.grade}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{item.average}%</span>
                          <Badge variant="secondary" className="text-xs">
                            {item.students} alunos
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Por Turma</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.byClass.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{item.class}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{item.average}%</span>
                          <Badge variant="secondary" className="text-xs">
                            {item.students} alunos
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return <div>Selecione um relatório</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-1">Visualize estatísticas e métricas do sistema</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Report Selection */}
      <Card className="border border-gray-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Tipo de Relatório</label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de relatório" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((report) => (
                    <SelectItem key={report.value} value={report.value}>
                      <div className="flex items-center gap-2">
                        <report.icon className="h-4 w-4" />
                        {report.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Período</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((period) => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <div className="space-y-6">
        {renderReportContent()}
      </div>

      {/* Additional Actions */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Ações Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Gerar Relatório PDF
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Visualizar Gráficos
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Análise Detalhada
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;





