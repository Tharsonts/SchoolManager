import React, { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, 
  ChevronLeft, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Calendar,
  MessageSquare,
  BarChart3,
  Settings,
  UserCheck,
  Activity,
  FileText,
  Clock,
  Target,
  Award,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Search,
  Filter
} from 'lucide-react';

interface InstructionStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  details: string[];
  tips?: string[];
}

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'admin' | 'coordinator' | 'teacher' | 'student';
}

const InstructionsModal: React.FC<InstructionsModalProps> = ({ isOpen, onClose, userRole }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const getInstructionsForRole = (role: string): InstructionStep[] => {
    switch (role) {
      case 'admin':
        return [
          {
            id: 'dashboard',
            title: 'Dashboard Administrativo',
            description: 'Visão geral completa do sistema',
            icon: BarChart3,
            details: [
              'Visualize estatísticas em tempo real',
              'Gerencie usuários com criação integrada',
              'Monitore atividades e performance',
              'Acesse relatórios e análises'
            ],
            tips: [
              'Use o botão "Novo Usuário" para criar rapidamente',
              'Clique nos cards para ver detalhes',
              'Filtros ajudam a encontrar informações específicas'
            ]
          },
          {
            id: 'users',
            title: 'Gerenciamento de Usuários',
            description: 'Crie, edite e gerencie todos os usuários',
            icon: Users,
            details: [
              'Crie professores, alunos e coordenadores',
              'Edite informações e status dos usuários',
              'Exclua usuários com confirmação inteligente',
              'Visualize dependências antes da exclusão'
            ],
            tips: [
              'Emails são automaticamente formatados com @escola.com',
              'Senha padrão é sempre "123"',
              'Matrículas são geradas automaticamente'
            ]
          },
          {
            id: 'classes',
            title: 'Gerenciamento de Turmas',
            description: 'Organize turmas e disciplinas',
            icon: GraduationCap,
            details: [
              'Crie e configure turmas',
              'Vincule disciplinas às turmas',
              'Atribua professores às disciplinas',
              'Monitore capacidade e matrículas'
            ],
            tips: [
              'Cada turma pode ter múltiplas disciplinas',
              'Professores podem lecionar em várias turmas',
              'Capacidade máxima é configurável'
            ]
          },
          {
            id: 'subjects',
            title: 'Gerenciamento de Disciplinas',
            description: 'Configure o currículo escolar',
            icon: BookOpen,
            details: [
              'Crie disciplinas com códigos únicos',
              'Vincule disciplinas a múltiplas turmas',
              'Atribua professores responsáveis',
              'Gerencie carga horária e descrições'
            ],
            tips: [
              'Códigos devem ser únicos',
              'Uma disciplina pode ser lecionada em várias turmas',
              'Professores podem ser alterados a qualquer momento'
            ]
          }
        ];

      case 'coordinator':
        return [
          {
            id: 'dashboard',
            title: 'Dashboard do Coordenador',
            description: 'Monitore toda a escola',
            icon: BarChart3,
            details: [
              'Acompanhe performance dos professores',
              'Monitore atividades e provas',
              'Visualize estatísticas de frequência',
              'Gerencie calendário acadêmico'
            ],
            tips: [
              'Dados são atualizados em tempo real',
              'Use os filtros para análises específicas',
              'Alertas mostram pontos de atenção'
            ]
          },
          {
            id: 'teachers',
            title: 'Monitoramento de Professores',
            description: 'Acompanhe o desempenho docente',
            icon: Users,
            details: [
              'Visualize atividades criadas pelos professores',
              'Monitore provas e avaliações',
              'Acompanhe materiais didáticos',
              'Analise performance individual'
            ],
            tips: [
              'Clique em "Ver Detalhes" para informações completas',
              'Performance é calculada automaticamente',
              'Alertas indicam professores com baixo desempenho'
            ]
          },
          {
            id: 'students',
            title: 'Gerenciamento de Alunos',
            description: 'Monitore frequência e notas',
            icon: UserCheck,
            details: [
              'Visualize todos os alunos da escola',
              'Monitore frequência e presença',
              'Gerencie notas e avaliações',
              'Identifique alunos com baixa frequência'
            ],
            tips: [
              'Use filtros para encontrar alunos específicos',
              'Cores indicam status de performance',
              'Ações rápidas para gerenciar frequência'
            ]
          },
          {
            id: 'activities',
            title: 'Monitoramento de Atividades',
            description: 'Acompanhe atividades pedagógicas',
            icon: Activity,
            details: [
              'Visualize todas as atividades criadas',
              'Monitore prazos e entregas',
              'Acompanhe status de aprovação',
              'Analise engajamento dos alunos'
            ],
            tips: [
              'Filtros por professor, matéria ou turma',
              'Status coloridos indicam situação',
              'Exporte relatórios para análise'
            ]
          },
          {
            id: 'calendar',
            title: 'Calendário Acadêmico',
            description: 'Gerencie eventos escolares',
            icon: Calendar,
            details: [
              'Crie eventos globais da escola',
              'Organize reuniões e apresentações',
              'Gerencie feriados e datas importantes',
              'Compartilhe informações com todos'
            ],
            tips: [
              'Use cores diferentes para tipos de eventos',
              'Eventos globais são visíveis para todos',
              'Legenda ajuda a identificar tipos'
            ]
          }
        ];

      case 'teacher':
        return [
          {
            id: 'dashboard',
            title: 'Dashboard do Professor',
            description: 'Gerencie suas turmas e atividades',
            icon: BarChart3,
            details: [
              'Visualize suas turmas e disciplinas',
              'Monitore atividades e provas',
              'Acompanhe submissões dos alunos',
              'Gerencie materiais didáticos'
            ],
            tips: [
              'Dados são específicos para suas turmas',
              'Notificações mostram atividades pendentes',
              'Acesso rápido às funcionalidades principais'
            ]
          },
          {
            id: 'activities',
            title: 'Criação de Atividades',
            description: 'Desenvolva atividades pedagógicas',
            icon: Activity,
            details: [
              'Crie atividades com descrições detalhadas',
              'Defina prazos e critérios de avaliação',
              'Anexe materiais e recursos',
              'Configure rubricas de avaliação'
            ],
            tips: [
              'Use rubricas para avaliação consistente',
              'Materiais podem ser PDFs, imagens ou links',
              'Prazos são importantes para organização'
            ]
          },
          {
            id: 'exams',
            title: 'Gerenciamento de Provas',
            description: 'Crie e gerencie avaliações',
            icon: FileText,
            details: [
              'Crie provas com datas específicas',
              'Defina duração e pontuação',
              'Marque provas como concluídas',
              'Acompanhe resultados dos alunos'
            ],
            tips: [
              'Marque provas como concluídas após aplicação',
              'Datas são importantes para o calendário',
              'Pontuação ajuda na avaliação'
            ]
          },
          {
            id: 'materials',
            title: 'Materiais Didáticos',
            description: 'Compartilhe recursos educacionais',
            icon: BookOpen,
            details: [
              'Upload de arquivos e documentos',
              'Organize por pastas e categorias',
              'Compartilhe com turmas específicas',
              'Gerencie acesso e visibilidade'
            ],
            tips: [
              'Organize materiais por disciplina',
              'Use pastas para melhor organização',
              'Materiais públicos são visíveis para todos'
            ]
          },
          {
            id: 'chat',
            title: 'Comunicação',
            description: 'Mantenha contato com alunos e colegas',
            icon: MessageSquare,
            details: [
              'Chat em tempo real com alunos',
              'Compartilhe arquivos e links',
              'Gerencie conversas por turma',
              'Histórico de mensagens'
            ],
            tips: [
              'Use para tirar dúvidas dos alunos',
              'Compartilhe materiais rapidamente',
              'Conversas são organizadas por turma'
            ]
          }
        ];

      case 'student':
        return [
          {
            id: 'dashboard',
            title: 'Dashboard do Aluno',
            description: 'Acompanhe suas atividades e notas',
            icon: BarChart3,
            details: [
              'Visualize suas atividades pendentes',
              'Acompanhe suas notas e médias',
              'Monitore frequência e presença',
              'Acesse materiais da turma'
            ],
            tips: [
              'Cores indicam status das atividades',
              'Prazos são importantes para entrega',
              'Médias são calculadas automaticamente'
            ]
          },
          {
            id: 'activities',
            title: 'Atividades e Tarefas',
            description: 'Gerencie suas entregas',
            icon: Activity,
            details: [
              'Visualize atividades pendentes',
              'Faça upload de arquivos',
              'Acompanhe feedback dos professores',
              'Monitore prazos de entrega'
            ],
            tips: [
              'Entregue antes do prazo final',
              'Leia as instruções cuidadosamente',
              'Use o chat para tirar dúvidas'
            ]
          },
          {
            id: 'grades',
            title: 'Notas e Avaliações',
            description: 'Acompanhe seu desempenho',
            icon: Award,
            details: [
              'Visualize notas por disciplina',
              'Acompanhe médias e conceitos',
              'Veja histórico de avaliações',
              'Monitore progresso acadêmico'
            ],
            tips: [
              'Médias são calculadas automaticamente',
              'Conceitos seguem critérios da escola',
              'Histórico mostra evolução'
            ]
          },
          {
            id: 'materials',
            title: 'Materiais de Estudo',
            description: 'Acesse recursos educacionais',
            icon: BookOpen,
            details: [
              'Baixe materiais das disciplinas',
              'Acesse links e recursos online',
              'Organize por disciplina',
              'Mantenha materiais atualizados'
            ],
            tips: [
              'Materiais são organizados por disciplina',
              'Links podem levar a recursos externos',
              'Mantenha downloads organizados'
            ]
          },
          {
            id: 'chat',
            title: 'Comunicação',
            description: 'Converse com professores e colegas',
            icon: MessageSquare,
            details: [
              'Chat com professores da turma',
              'Tire dúvidas sobre atividades',
              'Compartilhe arquivos e links',
              'Mantenha contato com colegas'
            ],
            tips: [
              'Use para esclarecer dúvidas',
              'Seja respeitoso nas conversas',
              'Compartilhe apenas conteúdo relevante'
            ]
          }
        ];

      default:
        return [];
    }
  };

  const instructions = getInstructionsForRole(userRole);
  const currentInstruction = instructions[currentStep];

  const nextStep = () => {
    if (currentStep < instructions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getRoleTitle = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'coordinator': return 'Coordenador';
      case 'teacher': return 'Professor';
      case 'student': return 'Aluno';
      default: return 'Usuário';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'coordinator': return 'bg-purple-100 text-purple-800';
      case 'teacher': return 'bg-blue-100 text-blue-800';
      case 'student': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                Instruções do Sistema
              </DialogTitle>
              <DialogDescription className="mt-2">
                <Badge className={getRoleColor(userRole)}>
                  {getRoleTitle(userRole)}
                </Badge>
                <span className="ml-2">Guia interativo das funcionalidades disponíveis</span>
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {currentStep + 1} de {instructions.length}
              </span>
            </div>
          </div>
        </DialogHeader>

        {currentInstruction && (
          <div className="space-y-6">
            {/* Indicador de Progresso */}
            <div className="flex items-center gap-2">
              {instructions.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    index <= currentStep ? 'bg-purple-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            {/* Conteúdo da Instrução Atual */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-8">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <currentInstruction.icon className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {currentInstruction.title}
                  </h3>
                  <p className="text-gray-600 text-lg mb-6">
                    {currentInstruction.description}
                  </p>

                  {/* Detalhes */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">O que você pode fazer:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {currentInstruction.details.map((detail, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{detail}</span>
                        </div>
                      ))}
                    </div>

                    {/* Dicas */}
                    {currentInstruction.tips && (
                      <div className="mt-6">
                        <h4 className="font-semibold text-gray-900 mb-3">💡 Dicas importantes:</h4>
                        <div className="space-y-2">
                          {currentInstruction.tips.map((tip, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                              <span className="text-yellow-800">{tip}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Navegação */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>

              <div className="flex items-center gap-2">
                {instructions.map((instruction, index) => (
                  <button
                    key={instruction.id}
                    onClick={() => setCurrentStep(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentStep ? 'bg-purple-500' : 'bg-gray-300'
                    }`}
                    title={instruction.title}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                onClick={nextStep}
                disabled={currentStep === instructions.length - 1}
                className="flex items-center gap-2"
              >
                Próximo
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Ações Rápidas */}
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(0)}
                className="flex items-center gap-2"
              >
                <Target className="w-4 h-4" />
                Começar do Início
              </Button>
              <Button
                onClick={onClose}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
              >
                <CheckCircle2 className="w-4 h-4" />
                Entendi, Fechar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InstructionsModal;





