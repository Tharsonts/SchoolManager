import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, Calendar, FileText, CheckCircle, AlertTriangle, BarChart3 } from 'lucide-react';

interface CoordinatorInstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CoordinatorInstructionModal({
  isOpen,
  onClose,
}: CoordinatorInstructionModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = useMemo(
    () => [
      {
        title: 'Visão Geral do Sistema',
        subtitle: 'O que você pode fazer como coordenador',
        icon: Users,
        points: [
          'Gerenciar professores e turmas',
          'Criar e gerenciar eventos',
          'Acompanhar desempenho acadêmico',
          'Visualizar relatórios detalhados',
        ],
      },
      {
        title: 'Funcionalidades Principais',
        subtitle: 'Onde encontrar cada recurso',
        icon: FileText,
        points: [
          'Dashboard: estatísticas e desempenho em tempo real',
          'Gerenciamento de Turmas: criação, edição e notas',
          'Calendário Acadêmico: eventos e comunicados',
          'Relatórios: acompanhamento por turma e aluno',
        ],
      },
      {
        title: 'Fluxo de Trabalho',
        subtitle: 'Sequência recomendada para o dia a dia',
        icon: Calendar,
        points: [
          'Acesse o Dashboard',
          'Atualize turmas e professores',
          'Organize o calendário',
          'Revise os relatórios',
        ],
      },
      {
        title: 'Relatórios',
        subtitle: 'Como gerar e interpretar relatórios',
        icon: BarChart3,
        points: [
          'Acesse a seção Relatórios no menu lateral',
          'Filtre por período, turma, disciplina ou aluno',
          'Gere relatórios de frequência, notas e engajamento',
          'Exporte em PDF/CSV para compartilhar com a equipe',
          'Relatórios críticos podem exigir aprovação do diretor',
        ],
      },
      {
        title: 'Dicas Importantes',
        subtitle: 'Boas práticas para agilizar a gestão',
        icon: AlertTriangle,
        points: [
          'Eventos criados por coordenadores podem exigir aprovação do diretor',
          'Monitore presença e desempenho regularmente',
          'Use relatórios para focar em turmas críticas',
          'Mantenha o calendário sempre atualizado',
        ],
      },
    ],
    []
  );

  const isLast = currentStep === steps.length - 1;
  const CurrentIcon = steps[currentStep].icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl sm:max-w-[800px] max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                Instruções para Coordenadores
              </DialogTitle>
              <div className="mt-2">
                <Badge className="bg-red-600 text-white">Coordenador</Badge>
                <span className="ml-2 text-sm text-gray-600">Guia rápido das funcionalidades</span>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {currentStep + 1} de {steps.length}
            </div>
          </div>
        </DialogHeader>

        {steps[currentStep] && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card visual */}
              <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100">
                <CardContent className="p-6 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3 text-red-700">
                    <div className="p-3 bg-red-200/60 rounded-2xl">
                      <CurrentIcon className="h-8 w-8" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-sm">{steps[currentStep].title}</p>
                      <p className="text-xs text-red-800/80">{steps[currentStep].subtitle}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pontos principais */}
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700 text-base">
                    <Calendar className="h-5 w-5 text-red-600" />
                    {steps[currentStep].title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {steps[currentStep].points.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <span className="text-gray-800">{p}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Navegação */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                disabled={currentStep === 0}
              >
                Anterior
              </Button>

              {!isLast ? (
                <Button
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))}
                >
                  Próximo
                </Button>
              ) : (
                <Button className="bg-red-600 hover:bg-red-700" onClick={onClose}>
                  Concluir
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}