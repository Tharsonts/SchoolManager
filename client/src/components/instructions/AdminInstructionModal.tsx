import React, { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, 
  ChevronLeft, 
  BookOpen,
  Users,
  FileText,
  MessageSquare,
  Calendar,
  BarChart3,
  CheckCircle2,
  Plus,
  Eye,
  Edit,
  Trash2,
  Upload,
  Download,
  Clock,
  Target,
  Award,
  Lightbulb,
  ArrowRight,
  ArrowDown,
  MousePointer,
  Hand,
  Zap,
  Star,
  Heart,
  Rocket,
  X,
  Shield,
  Settings,
  Database,
  Crown,
  Key,
  Globe
} from 'lucide-react';

interface AdminInstructionStep {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  visual: React.ReactNode;
  keyPoints: string[];
}

interface AdminInstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminInstructionModal: React.FC<AdminInstructionModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: AdminInstructionStep[] = [
    {
      id: 'welcome',
      title: 'Bem-vindo!',
      subtitle: 'Seu painel de administração está pronto',
      icon: <Crown className="h-8 w-8 text-purple-600" />,
      visual: (
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <Shield className="h-12 w-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">Controle total!</div>
          <div className="text-gray-600">Gerencie toda a instituição</div>
        </div>
      ),
      keyPoints: [
        'Sistema 100% funcional',
        'Controle total da instituição',
        'Acesso a todas as funcionalidades'
      ]
    },
    {
      id: 'dashboard',
      title: 'Seu Painel',
      subtitle: 'Visão geral da instituição',
      icon: <BarChart3 className="h-8 w-8 text-blue-600" />,
      visual: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">25</div>
              <div className="text-sm text-blue-600">Professores</div>
            </div>
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="text-2xl font-bold text-green-600">150</div>
              <div className="text-sm text-green-600">Alunos</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">8</div>
              <div className="text-sm text-purple-600">Turmas</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">12</div>
              <div className="text-sm text-orange-600">Disciplinas</div>
            </div>
          </div>
        </div>
      ),
      keyPoints: [
        'Veja estatísticas completas',
        'Monitore toda a instituição',
        'Acompanhe crescimento',
        'Identifique necessidades'
      ]
    },
    {
      id: 'users',
      title: 'Gestão de Usuários',
      subtitle: 'Crie e gerencie todos os usuários',
      icon: <Users className="h-8 w-8 text-indigo-600" />,
      visual: (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl border-2 border-indigo-200">
              <Users className="h-6 w-6 text-indigo-600" />
              <span className="font-medium text-indigo-800">Gestão Completa</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">Criar Usuários</div>
                <div className="text-xs text-gray-500">Professores, alunos, coordenadores</div>
              </div>
              <Badge className="bg-blue-100 text-blue-800 text-xs">Ativo</Badge>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Edit className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">Editar Perfis</div>
                <div className="text-xs text-gray-500">Modificar informações</div>
              </div>
              <Badge className="bg-green-100 text-green-800 text-xs">Disponível</Badge>
            </div>
          </div>
        </div>
      ),
      keyPoints: [
        'Crie novos usuários',
        'Edite perfis existentes',
        'Gerencie permissões',
        'Controle acessos'
      ]
    },
    {
      id: 'classes',
      title: 'Gestão de Turmas',
      subtitle: 'Organize turmas e disciplinas',
      icon: <BookOpen className="h-8 w-8 text-green-600" />,
      visual: (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border-2 border-green-200">
              <BookOpen className="h-6 w-6 text-green-600" />
              <span className="font-medium text-green-800">Organização Acadêmica</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-lg font-bold text-blue-600">8</div>
              <div className="text-sm text-blue-600">Turmas</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-lg font-bold text-purple-600">12</div>
              <div className="text-sm text-purple-600">Disciplinas</div>
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Configure estrutura</span>
            </div>
          </div>
        </div>
      ),
      keyPoints: [
        'Crie e organize turmas',
        'Gerencie disciplinas',
        'Configure estrutura acadêmica',
        'Monitore capacidade'
      ]
    },
    {
      id: 'system',
      title: 'Sistema',
      subtitle: 'Controle total do sistema',
      icon: <Settings className="h-8 w-8 text-gray-600" />,
      visual: (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
              <Settings className="h-6 w-6 text-gray-600" />
              <span className="font-medium text-gray-800">Controle do Sistema</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Database className="h-4 w-4 text-green-600" />
                </div>
                <span className="font-medium text-gray-900">Banco de Dados</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">Online</div>
                <div className="text-xs text-gray-500">Funcionando</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Globe className="h-4 w-4 text-blue-600" />
                </div>
                <span className="font-medium text-gray-900">Servidor</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">Ativo</div>
                <div className="text-xs text-gray-500">Porta 3000</div>
              </div>
            </div>
          </div>
        </div>
      ),
      keyPoints: [
        'Monitore sistema',
        'Gerencie configurações',
        'Controle acessos',
        'Mantenha segurança'
      ]
    },
    {
      id: 'security',
      title: 'Segurança',
      subtitle: 'Proteja sua instituição',
      icon: <Shield className="h-8 w-8 text-red-600" />,
      visual: (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border-2 border-red-200">
              <Shield className="h-6 w-6 text-red-600" />
              <span className="font-medium text-red-800">Segurança Total</span>
            </div>
          </div>
          <div className="p-4 bg-black rounded-xl text-white font-mono text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-green-300">[SECURE]</span>
                <span>Sistema protegido</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-300">[AUTH]</span>
                <span>Autenticação ativa</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-300">[LOGS]</span>
                <span>Monitoramento ativo</span>
              </div>
            </div>
          </div>
        </div>
      ),
      keyPoints: [
        'Proteja dados sensíveis',
        'Monitore acessos',
        'Gerencie permissões',
        'Mantenha logs de segurança'
      ]
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentStepData.icon}
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  {currentStepData.title}
                </DialogTitle>
                <p className="text-gray-600 mt-1">{currentStepData.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-purple-100 text-purple-800">
                {currentStep + 1} de {steps.length}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Main Content */}
          <div className="flex-1 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Visual Side */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 min-h-[300px] flex items-center justify-center">
                  {currentStepData.visual}
                </div>
              </div>

              {/* Key Points Side */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    Principais funcionalidades:
                  </h4>
                  <div className="space-y-3">
                    {currentStepData.keyPoints.map((point, index) => (
                      <div key={index} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-sm transition-all">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="text-gray-800 font-medium">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="border-t border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>

              {/* Progress Indicators */}
              <div className="flex items-center gap-2">
                {steps.map((step, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentStep ? 'bg-purple-500' : 'bg-gray-300'
                    }`}
                    title={step.title}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {currentStep < steps.length - 1 ? (
                  <Button
                    onClick={nextStep}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                  >
                    Próximo
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={onClose}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Começar a administrar!
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminInstructionModal;