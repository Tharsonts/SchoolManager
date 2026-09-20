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
  BarChart3,
  TrendingUp,
  FileText,
  GraduationCap,
  MessageSquare,
  Target,
  CheckCircle2,
  Shield,
  Lightbulb
} from 'lucide-react';

interface DirectorInstructionStep {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  visual: React.ReactNode;
  keyPoints: string[];
}

interface DirectorInstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DirectorInstructionModal: React.FC<DirectorInstructionModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: DirectorInstructionStep[] = [
    {
      id: 'welcome',
      title: 'Bem-vindo, Diretor! 👋',
      subtitle: 'Seu painel de gestão institucional',
      icon: <Shield className="h-8 w-8 text-purple-600" />,
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
        'Visão geral do desempenho acadêmico',
        'Aprovações e comunicações centralizadas',
        'Gestão de períodos e matrículas'
      ]
    },
    {
      id: 'dashboard',
      title: 'Dashboard do Diretor',
      subtitle: 'Acompanhe indicadores e métricas',
      icon: <BarChart3 className="h-8 w-8 text-blue-600" />,
      visual: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">Alunos</div>
              <div className="text-sm text-blue-600">Média de frequência</div>
            </div>
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="text-2xl font-bold text-green-600">Professores</div>
              <div className="text-sm text-green-600">Atividades e avaliações</div>
            </div>
          </div>
        </div>
      ),
      keyPoints: [
        'Indicadores em tempo real',
        'Acesso rápido a áreas críticas',
        'Alertas e tendências'
      ]
    },
    {
      id: 'periods',
      title: 'Períodos Acadêmicos',
      subtitle: 'Configure e acompanhe etapas do ano letivo',
      icon: <TrendingUp className="h-8 w-8 text-orange-600" />,
      visual: (
        <div className="space-y-4">
          <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
            <div className="text-lg font-semibold text-orange-700">Período atual</div>
            <div className="text-sm text-orange-600">Datas, status e progresso</div>
          </div>
        </div>
      ),
      keyPoints: [
        'Criar e editar períodos',
        'Definir status e janelas de avaliação',
        'Monitorar progresso institucional'
      ]
    },
    {
      id: 'approvals',
      title: 'Aprovações',
      subtitle: 'Valide solicitações e publicações',
      icon: <FileText className="h-8 w-8 text-indigo-600" />,
      visual: (
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
            <div className="text-lg font-semibold text-indigo-700">Solicitações pendentes</div>
            <div className="text-sm text-indigo-600">Publicações, materiais e avisos</div>
          </div>
        </div>
      ),
      keyPoints: [
        'Revisar e aprovar conteúdos',
        'Garantir conformidade institucional',
        'Histórico de decisões'
      ]
    },
    {
      id: 'chat',
      title: 'Chat Institucional',
      subtitle: 'Converse com equipes e responda rapidamente',
      icon: <MessageSquare className="h-8 w-8 text-pink-600" />,
      visual: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-pink-50 rounded-xl border border-pink-200">
              <div className="text-lg font-semibold text-pink-700">Conversas</div>
              <div className="text-sm text-pink-600">Diretor, Coordenadores e Professores</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
              <div className="text-lg font-semibold text-purple-700">Canais</div>
              <div className="text-sm text-purple-600">Anúncios e temas institucionais</div>
            </div>
          </div>
        </div>
      ),
      keyPoints: [
        'Iniciar conversas com coordenadores e professores',
        'Fixar e destacar mensagens importantes',
        'Criar canais para comunicados oficiais',
        'Pesquisar e filtrar histórico de mensagens'
      ]
    }
  ];

  const currentStepData = steps[currentStep];

  const nextStep = () => setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-white" />
                </div>
                Instruções do Diretor
              </DialogTitle>
              <div className="mt-2">
                <Badge className="bg-purple-600 text-white">Diretor</Badge>
                <span className="ml-2 text-sm text-gray-600">Guia interativo das funcionalidades</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {currentStep + 1} de {steps.length}
              </span>
            </div>
          </div>
        </DialogHeader>

        {currentStepData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Visual Side */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 min-h-[300px] flex items-center justify-center">
                {currentStepData.visual}
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
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DirectorInstructionModal;