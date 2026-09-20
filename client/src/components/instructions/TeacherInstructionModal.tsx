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
  X
} from 'lucide-react';

interface TeacherInstructionStep {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  visual: React.ReactNode;
  keyPoints: string[];
}

interface TeacherInstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TeacherInstructionModal: React.FC<TeacherInstructionModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: TeacherInstructionStep[] = [
    {
      id: 'welcome',
      title: 'Bem-vindo!',
      subtitle: 'Seu sistema de ensino está pronto',
      icon: <Lightbulb className="h-8 w-8 text-blue-600" />,
      visual: (
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <BookOpen className="h-12 w-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">Tudo configurado!</div>
          <div className="text-gray-600">Você pode começar a usar agora mesmo</div>
        </div>
      ),
      keyPoints: [
        'Sistema 100% funcional',
        'Interface simples e intuitiva',
        'Suporte completo disponível'
      ]
    },
    {
      id: 'dashboard',
      title: 'Seu Painel',
      subtitle: 'Visão geral de tudo',
      icon: <BarChart3 className="h-8 w-8 text-green-600" />,
      visual: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">12</div>
              <div className="text-sm text-blue-600">Atividades</div>
            </div>
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="text-2xl font-bold text-green-600">8</div>
              <div className="text-sm text-green-600">Provas</div>
            </div>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm">3 atividades pendentes</span>
            </div>
          </div>
        </div>
      ),
      keyPoints: [
        'Veja estatísticas importantes',
        'Monitore atividades pendentes',
        'Acesso rápido a tudo'
      ]
    },
    {
      id: 'activities',
      title: 'Criar Atividades',
      subtitle: 'Simples e rápido',
      icon: <FileText className="h-8 w-8 text-purple-600" />,
      visual: (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
              <Plus className="h-6 w-6 text-purple-600" />
              <span className="font-medium text-purple-800">Nova Atividade</span>
            </div>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <ArrowDown className="h-5 w-5 text-gray-400" />
            <div className="p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="space-y-1">
                <div className="h-2 bg-gray-300 rounded w-16"></div>
                <div className="h-2 bg-gray-300 rounded w-12"></div>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>
      ),
      keyPoints: [
        'Clique em "Nova Atividade"',
        'Preencha título e descrição',
        'Defina data de entrega',
        'Publique para os alunos'
      ]
    },
    {
      id: 'exams',
      title: 'Gerenciar Provas',
      subtitle: 'Controle total',
      icon: <Calendar className="h-8 w-8 text-red-600" />,
      visual: (
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-4">
            <div className="p-4 bg-red-50 rounded-xl border border-red-200">
              <div className="text-xl font-bold text-red-600">2</div>
              <div className="text-sm text-red-600">Agendadas</div>
            </div>
            <ArrowRight className="h-6 w-6 text-gray-400" />
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="text-xl font-bold text-green-600">5</div>
              <div className="text-sm text-green-600">Concluídas</div>
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Prova de Matemática</span>
            </div>
            <div className="text-xs text-gray-500">15/10/2024 - 2h</div>
          </div>
        </div>
      ),
      keyPoints: [
        'Crie provas com data/hora',
        'Acompanhe submissões',
        'Marque como concluída',
        'Veja estatísticas'
      ]
    },
    {
      id: 'students',
      title: 'Seus Alunos',
      subtitle: 'Acompanhe o progresso',
      icon: <Users className="h-8 w-8 text-indigo-600" />,
      visual: (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
              <Users className="h-6 w-6 text-indigo-600" />
              <span className="font-medium text-indigo-800">25 Alunos</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-green-700">M</div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">Maria Silva</div>
                <div className="text-xs text-gray-500">Nota: 8.5</div>
              </div>
              <Badge className="bg-green-100 text-green-800 text-xs">Ativa</Badge>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-700">J</div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">João Santos</div>
                <div className="text-xs text-gray-500">Nota: 7.2</div>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pendente</Badge>
            </div>
          </div>
        </div>
      ),
      keyPoints: [
        'Veja lista completa de alunos',
        'Acompanhe notas individuais',
        'Comunique-se diretamente',
        'Monitore entregas'
      ]
    },
    {
      id: 'communication',
      title: 'Comunicação',
      subtitle: 'Mantenha contato',
      icon: <MessageSquare className="h-8 w-8 text-teal-600" />,
      visual: (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3 p-4 bg-teal-50 rounded-xl border border-teal-200">
              <MessageSquare className="h-6 w-6 text-teal-600" />
              <span className="font-medium text-teal-800">Chat Ativo</span>
            </div>
          </div>
          <div className="p-4 bg-white rounded-xl border border-gray-200">
            <div className="space-y-3">
              <div className="text-right">
                <div className="bg-blue-500 text-white text-sm p-2 rounded-lg inline-block">
                  Olá professor! 👋
                </div>
              </div>
              <div className="text-left">
                <div className="bg-gray-100 text-gray-800 text-sm p-2 rounded-lg inline-block">
                  Como posso ajudar? 😊
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      keyPoints: [
        'Chat em tempo real',
        'Conversas com alunos',
        'Anúncios para turmas',
        'Notificações automáticas'
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
              <Badge className="bg-blue-100 text-blue-800">
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
                    <Target className="h-5 w-5 text-blue-600" />
                    Principais funcionalidades:
                  </h4>
                  <div className="space-y-3">
                    {currentStepData.keyPoints.map((point, index) => (
                      <div key={index} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-sm transition-all">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4 text-blue-600" />
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
                      index === currentStep ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                    title={step.title}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {currentStep < steps.length - 1 ? (
                  <Button
                    onClick={nextStep}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
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
                    Começar a usar!
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

export default TeacherInstructionModal;