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

interface StudentInstructionStep {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  visual: React.ReactNode;
  keyPoints: string[];
}

interface StudentInstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const StudentInstructionModal: React.FC<StudentInstructionModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: StudentInstructionStep[] = [
    {
      id: 'welcome',
      title: 'Bem-vindo!',
      subtitle: 'Seu espaço de estudos está pronto',
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
          <div className="text-gray-600">Você pode começar a estudar agora mesmo</div>
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
              <div className="text-2xl font-bold text-blue-600">5</div>
              <div className="text-sm text-blue-600">Atividades</div>
            </div>
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="text-2xl font-bold text-green-600">3</div>
              <div className="text-sm text-green-600">Provas</div>
            </div>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm">2 atividades pendentes</span>
            </div>
          </div>
        </div>
      ),
      keyPoints: [
        'Veja suas atividades pendentes',
        'Acompanhe suas notas',
        'Monitore sua frequência'
      ]
    },
    {
      id: 'class',
      title: 'Minha Turma',
      subtitle: 'Informações da sua turma',
      icon: <Users className="h-8 w-8 text-purple-600" />,
      visual: (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
              <Users className="h-6 w-6 text-purple-600" />
              <span className="font-medium text-purple-800">3º Ano A</span>
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
        'Veja seus professores',
        'Conheça seus colegas',
        'Acesse informações da turma'
      ]
    },
    {
      id: 'materials',
      title: 'Materiais',
      subtitle: 'Acesse seus materiais didáticos',
      icon: <FileText className="h-8 w-8 text-orange-600" />,
      visual: (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl border-2 border-orange-200">
              <FileText className="h-6 w-6 text-orange-600" />
              <span className="font-medium text-orange-800">Materiais</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium text-sm">Apostila Matemática</div>
                <div className="text-xs text-gray-600">PDF • 2.5 MB</div>
              </div>
              <Download className="h-4 w-4 text-blue-600 ml-auto" />
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200 flex items-center gap-3">
              <FileText className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-sm">Exercícios Física</div>
                <div className="text-xs text-gray-600">DOC • 1.2 MB</div>
              </div>
              <Download className="h-4 w-4 text-green-600 ml-auto" />
            </div>
          </div>
        </div>
      ),
      keyPoints: [
        'Baixe materiais das disciplinas',
        'Organizados por matéria',
        'Sempre atualizados'
      ]
    },
    {
      id: 'activities',
      title: 'Atividades',
      subtitle: 'Gerencie suas tarefas',
      icon: <BookOpen className="h-8 w-8 text-indigo-600" />,
      visual: (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl border-2 border-indigo-200">
              <BookOpen className="h-6 w-6 text-indigo-600" />
              <span className="font-medium text-indigo-800">Minhas Atividades</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-sm">Exercícios de Matemática</div>
                <Badge variant="secondary" className="text-xs">Pendente</Badge>
              </div>
              <div className="text-xs text-gray-600">Prazo: 15/10/2024</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-sm">Redação de Português</div>
                <Badge className="bg-green-100 text-green-800 text-xs">Entregue</Badge>
              </div>
              <div className="text-xs text-gray-600">Nota: 8.5</div>
            </div>
          </div>
        </div>
      ),
      keyPoints: [
        'Veja atividades pendentes',
        'Envie suas respostas',
        'Acompanhe suas notas'
      ]
    },
    {
      id: 'exams',
      title: 'Provas',
      subtitle: 'Acompanhe suas avaliações',
      icon: <Award className="h-8 w-8 text-red-600" />,
      visual: (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border-2 border-red-200">
              <Award className="h-6 w-6 text-red-600" />
              <span className="font-medium text-red-800">Provas</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-sm">Prova de Física</div>
                <Badge variant="destructive" className="text-xs">Amanhã</Badge>
              </div>
              <div className="text-xs text-gray-600">15/10/2024 às 14:00</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-sm">Prova de História</div>
                <Badge className="bg-green-100 text-green-800 text-xs">Concluída</Badge>
              </div>
              <div className="text-xs text-gray-600">Nota: 9.2</div>
            </div>
          </div>
        </div>
      ),
      keyPoints: [
        'Calendário de provas',
        'Resultados e notas',
        'Histórico de avaliações'
      ]
    },
    {
      id: 'attendance',
      title: 'Frequência',
      subtitle: 'Monitore sua presença',
      icon: <Clock className="h-8 w-8 text-cyan-600" />,
      visual: (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3 p-4 bg-cyan-50 rounded-xl border-2 border-cyan-200">
              <Clock className="h-6 w-6 text-cyan-600" />
              <span className="font-medium text-cyan-800">Frequência</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
              <div className="text-2xl font-bold text-green-600">85%</div>
              <div className="text-xs text-green-600">Frequência Geral</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
              <div className="text-2xl font-bold text-blue-600">12</div>
              <div className="text-xs text-blue-600">Faltas</div>
            </div>
          </div>
        </div>
      ),
      keyPoints: [
        'Acompanhe presenças e faltas',
        'Veja frequência por disciplina',
        'Receba alertas importantes'
      ]
    },
    {
      id: 'communication',
      title: 'Comunicação',
      subtitle: 'Converse com professores e colegas',
      icon: <MessageSquare className="h-8 w-8 text-pink-600" />,
      visual: (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3 p-4 bg-pink-50 rounded-xl border-2 border-pink-200">
              <MessageSquare className="h-6 w-6 text-pink-600" />
              <span className="font-medium text-pink-800">Chat</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">P</div>
                <div className="font-medium text-sm">Prof. João</div>
                <Badge className="bg-blue-100 text-blue-800 text-xs ml-auto">Nova</Badge>
              </div>
              <div className="text-xs text-gray-600">"Dúvida sobre o exercício 5..."</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">A</div>
                <div className="font-medium text-sm">Ana Silva</div>
              </div>
              <div className="text-xs text-gray-600">"Alguém tem a resposta da questão 3?"</div>
            </div>
          </div>
        </div>
      ),
      keyPoints: [
        'Chat com professores',
        'Grupos de estudo',
        'Notificações em tempo real'
      ]
    },
    {
      id: 'calendar',
      title: 'Calendário',
      subtitle: 'Acompanhe eventos e prazos',
      icon: <Calendar className="h-8 w-8 text-teal-600" />,
      visual: (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3 p-4 bg-teal-50 rounded-xl border-2 border-teal-200">
              <Calendar className="h-6 w-6 text-teal-600" />
              <span className="font-medium text-teal-800">Calendário</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-red-600" />
                <div className="font-medium text-sm">Prova de Matemática</div>
              </div>
              <div className="text-xs text-gray-600">15/10/2024</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-blue-600" />
                <div className="font-medium text-sm">Entrega de Trabalho</div>
              </div>
              <div className="text-xs text-gray-600">20/10/2024</div>
            </div>
          </div>
        </div>
      ),
      keyPoints: [
        'Eventos escolares',
        'Prazos de atividades',
        'Feriados e recessos'
      ]
    },
    {
      id: 'tips',
      title: 'Dicas Importantes',
      subtitle: 'Para um melhor aproveitamento',
      icon: <Star className="h-8 w-8 text-yellow-600" />,
      visual: (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200">
              <Star className="h-6 w-6 text-yellow-600" />
              <span className="font-medium text-yellow-800">Dicas</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="mt-0.5">1</Badge>
              <div>
                <div className="font-medium text-sm">Mantenha-se Atualizado</div>
                <div className="text-xs text-gray-600">Verifique regularmente o dashboard</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="mt-0.5">2</Badge>
              <div>
                <div className="font-medium text-sm">Respeite os Prazos</div>
                <div className="text-xs text-gray-600">Entregue atividades no prazo</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="mt-0.5">3</Badge>
              <div>
                <div className="font-medium text-sm">Comunique-se</div>
                <div className="text-xs text-gray-600">Use o chat para tirar dúvidas</div>
              </div>
            </div>
          </div>
        </div>
      ),
      keyPoints: [
        'Acesse o sistema regularmente',
        'Participe das atividades',
        'Mantenha boa frequência'
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3">
            {currentStepData.icon}
            <div>
              <div className="text-xl font-bold">{currentStepData.title}</div>
              <div className="text-sm text-gray-600 font-normal">{currentStepData.subtitle}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6">
            {/* Visual Section */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border">
              {currentStepData.visual}
            </div>

            {/* Key Points */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                O que você pode fazer:
              </h3>
              <div className="space-y-2">
                {currentStepData.keyPoints.map((point, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={nextStep}
              disabled={currentStep === steps.length - 1}
              className="flex items-center gap-2"
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700">
              {currentStep === steps.length - 1 ? 'Finalizar' : 'Pular'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentInstructionModal;