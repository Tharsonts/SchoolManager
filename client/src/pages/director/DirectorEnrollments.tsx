import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  GraduationCap,
  Calendar,
  Users,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Save,
  RefreshCw
} from 'lucide-react';

interface EnrollmentSettings {
  isOpen: boolean;
  startDate: string;
  endDate: string;
  maxStudents: number;
  description: string;
  requirements: string;
  lastUpdated: string;
  updatedBy: string;
}

const DirectorEnrollments = () => {
  const [settings, setSettings] = useState<EnrollmentSettings>({
    isOpen: false,
    startDate: '',
    endDate: '',
    maxStudents: 500,
    description: 'Período de matrículas para o ano letivo 2025',
    requirements: 'Documentos necessários: RG, CPF, Comprovante de residência, Histórico escolar',
    lastUpdated: new Date().toISOString(),
    updatedBy: 'Diretor'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [enrollmentStats, setEnrollmentStats] = useState({
    totalEnrollments: 0,
    pendingApprovals: 0,
    approvedEnrollments: 0,
    rejectedEnrollments: 0
  });

  // Carregar configurações do localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('enrollmentSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    // Simular estatísticas de matrícula
    setEnrollmentStats({
      totalEnrollments: 45,
      pendingApprovals: 12,
      approvedEnrollments: 28,
      rejectedEnrollments: 5
    });
  }, []);

  const handleSaveSettings = async () => {
    setIsLoading(true);
    
    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const updatedSettings = {
      ...settings,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'Diretor'
    };
    
    setSettings(updatedSettings);
    localStorage.setItem('enrollmentSettings', JSON.stringify(updatedSettings));
    
    setIsLoading(false);
    alert('Configurações salvas com sucesso!');
  };

  const handleToggleEnrollment = (isOpen: boolean) => {
    setSettings(prev => ({ ...prev, isOpen }));
  };

  const getStatusInfo = () => {
    if (settings.isOpen) {
      const now = new Date();
      const endDate = new Date(settings.endDate);
      
      if (settings.endDate && now > endDate) {
        return {
          status: 'Expirado',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: XCircle
        };
      }
      
      return {
        status: 'Aberto',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: CheckCircle
      };
    }
    
    return {
      status: 'Fechado',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      icon: XCircle
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Controle de Matrículas</h1>
            </div>
            <p className="text-gray-600 ml-11">
              Gerencie o período de matrículas e configurações relacionadas
            </p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${statusInfo.borderColor} ${statusInfo.bgColor}`}>
            <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
            <span className={`font-semibold ${statusInfo.color}`}>
              {statusInfo.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configurações Principais */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configurações do Período
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Toggle Principal */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">Período de Matrículas</h3>
                  <p className="text-sm text-gray-600">
                    Ativar ou desativar o período de matrículas
                  </p>
                </div>
                <Switch
                  checked={settings.isOpen}
                  onCheckedChange={handleToggleEnrollment}
                />
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Data de Início</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={settings.startDate}
                    onChange={(e) => setSettings(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Data de Término</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={settings.endDate}
                    onChange={(e) => setSettings(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              {/* Limite de Alunos */}
              <div>
                <Label htmlFor="maxStudents">Limite Máximo de Alunos</Label>
                <Input
                  id="maxStudents"
                  type="number"
                  value={settings.maxStudents}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxStudents: parseInt(e.target.value) }))}
                  min="1"
                />
              </div>

              {/* Descrição */}
              <div>
                <Label htmlFor="description">Descrição do Período</Label>
                <Textarea
                  id="description"
                  value={settings.description}
                  onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o período de matrículas..."
                />
              </div>

              {/* Requisitos */}
              <div>
                <Label htmlFor="requirements">Requisitos e Documentos</Label>
                <Textarea
                  id="requirements"
                  value={settings.requirements}
                  onChange={(e) => setSettings(prev => ({ ...prev, requirements: e.target.value }))}
                  placeholder="Liste os documentos e requisitos necessários..."
                />
              </div>

              {/* Botão Salvar */}
              <Button 
                onClick={handleSaveSettings}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Estatísticas e Informações */}
        <div className="space-y-6">
          {/* Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total de Matrículas</span>
                <Badge variant="secondary">{enrollmentStats.totalEnrollments}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pendentes</span>
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  {enrollmentStats.pendingApprovals}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Aprovadas</span>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  {enrollmentStats.approvedEnrollments}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Rejeitadas</span>
                <Badge variant="outline" className="text-red-600 border-red-200">
                  {enrollmentStats.rejectedEnrollments}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Última Atualização
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Data:</strong> {new Date(settings.lastUpdated).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Hora:</strong> {new Date(settings.lastUpdated).toLocaleTimeString('pt-BR')}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Por:</strong> {settings.updatedBy}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Aviso */}
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="w-5 h-5" />
                Importante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-700">
                As alterações nas configurações de matrícula afetam diretamente a página de login. 
                Certifique-se de configurar as datas corretamente.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DirectorEnrollments;