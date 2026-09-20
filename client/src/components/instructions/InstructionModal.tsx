import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  CheckCircle,
  Users,
  GraduationCap,
  BookOpen,
  UserCheck,
  Settings,
  BarChart3,
  MessageSquare,
  FileText,
  Calendar,
  Award,
  Target,
  TrendingUp,
  Lightbulb
} from 'lucide-react';

interface InstructionStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  details: string[];
  tips?: string[];
  nextAction?: string;
}

interface InstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'admin' | 'teacher' | 'student' | 'coordinator';
}

const instructionData = {
  admin: {
    title: 'Guia do Administrador',
    subtitle: 'Gerencie todo o sistema escolar',
    color: 'bg-blue-600',
    steps: [
      {
        id: 'welcome',
        title: 'Bem-vindo ao Sistema',
        description: 'Como administrador, você tem controle total sobre o sistema escolar',
        icon: Settings,
        details: [
          'Acesso completo a todas as funcionalidades do sistema',
          'Gerenciamento de usuários: coordenadores, professores e alunos',
          'Controle de permissões e configurações do sistema',
          'Visualização de relatórios e estatísticas em tempo real',
          'Configuração de disciplinas, turmas e estrutura acadêmica'
        ],
        tips: [
          'Comece sempre verificando o dashboard para ter uma visão geral do sistema',
          'Mantenha os dados sempre atualizados para garantir a integridade',
          'Configure backups regulares dos dados importantes'
        ],
        nextAction: 'Vamos começar criando os primeiros usuários do sistema'
      },
      {
        id: 'users',
        title: 'Gerenciar Usuários',
        description: 'Crie e gerencie coordenadores, professores e alunos',
        icon: Users,
        details: [
          '1. Acesse "Gestão de Pessoas" no menu lateral esquerdo',
          '2. Escolha entre "Coordenadores", "Professores" ou "Alunos"',
          '3. Clique no botão "+" ou "Adicionar" para criar novos usuários',
          '4. Preencha os dados obrigatórios: nome completo, email institucional, senha temporária',
          '5. Defina o status (ativo/inativo) e permissões específicas',
          '6. Para professores: associe às disciplinas que lecionam',
          '7. Para alunos: defina a turma e série correspondente',
          '8. Envie as credenciais por email ou imprima para entrega'
        ],
        tips: [
          'Use emails institucionais padronizados (@escola.com)',
          'Senhas temporárias devem ser alteradas no primeiro acesso',
          'Mantenha um registro de todos os usuários criados',
          'Desative usuários inativos em vez de excluí-los'
        ],
        nextAction: 'Agora vamos configurar as disciplinas do currículo'
      },
      {
        id: 'subjects',
        title: 'Criar Disciplinas',
        description: 'Configure as matérias que serão lecionadas na escola',
        icon: BookOpen,
        details: [
          '1. Navegue para "Acadêmico" → "Disciplinas" no menu',
          '2. Clique no botão "Nova Disciplina" no canto superior direito',
          '3. Preencha o nome completo da disciplina (ex: Matemática)',
          '4. Defina um código único (ex: MAT001, POR002, HIS003)',
          '5. Adicione uma descrição detalhada da disciplina',
          '6. Configure a carga horária semanal e total',
          '7. Defina se é disciplina obrigatória ou optativa',
          '8. Estabeleça pré-requisitos se necessário',
          '9. Salve e ative a disciplina para uso'
        ],
        tips: [
          'Use códigos padronizados para facilitar a organização',
          'Defina carga horária realista baseada no currículo oficial',
          'Mantenha descrições claras para orientar professores',
          'Revise periodicamente as disciplinas ativas'
        ],
        nextAction: 'Próximo passo: organizar as turmas e associar disciplinas'
      },
      {
        id: 'classes',
        title: 'Organizar Turmas',
        description: 'Crie turmas e associe disciplinas e professores',
        icon: GraduationCap,
        details: [
          '1. Acesse "Acadêmico" → "Turmas" no menu principal',
          '2. Clique em "Nova Turma" para iniciar a criação',
          '3. Defina nome da turma (ex: 1º Ano A, 2º Ano B)',
          '4. Selecione a série/ano correspondente',
          '5. Configure a seção/turno (manhã, tarde, noite)',
          '6. Estabeleça a capacidade máxima de alunos',
          '7. Associe todas as disciplinas obrigatórias à turma',
          '8. Atribua professores específicos para cada disciplina',
          '9. Configure horários de aula se disponível',
          '10. Matricule os alunos na turma criada'
        ],
        tips: [
          'Respeite sempre a capacidade máxima das salas de aula',
          'Verifique conflitos de horário dos professores',
          'Mantenha equilíbrio no número de alunos por turma',
          'Documente mudanças para controle histórico'
        ],
        nextAction: 'Vamos configurar o sistema de monitoramento'
      },
      {
        id: 'monitoring',
        title: 'Monitoramento e Relatórios',
        description: 'Acompanhe o desempenho e gere relatórios administrativos',
        icon: BarChart3,
        details: [
          '1. Use o Dashboard principal para visão geral em tempo real',
          '2. Monitore estatísticas de usuários ativos diariamente',
          '3. Acompanhe o progresso acadêmico das turmas',
          '4. Verifique relatórios de desempenho por disciplina',
          '5. Analise dados de frequência e participação',
          '6. Gere relatórios mensais para direção',
          '7. Exporte dados em formatos Excel/PDF quando necessário',
          '8. Configure alertas para situações que requerem atenção'
        ],
        tips: [
          'Verifique o dashboard pelo menos uma vez por dia',
          'Configure alertas automáticos para situações críticas',
          'Mantenha histórico de relatórios para comparações',
          'Compartilhe insights relevantes com a equipe pedagógica'
        ],
        nextAction: 'Sistema totalmente configurado! Você está pronto para administrar'
      },
      {
         id: 'system-config',
         title: 'Configurações do Sistema',
         description: 'Gerencie configurações avançadas e segurança do sistema',
         icon: Settings,
         details: [
           '1. Acesse "Sistema" → "Configurações Avançadas" no menu',
           '2. Configure parâmetros de segurança e autenticação',
           '3. Defina políticas de senha e tempo de sessão',
           '4. Configure notificações automáticas do sistema',
           '5. Estabeleça limites de armazenamento e performance',
           '6. Configure integração com sistemas externos',
           '7. Defina permissões granulares por perfil de usuário',
           '8. Configure logs de auditoria e monitoramento'
         ],
         tips: [
           'Revise configurações de segurança mensalmente',
           'Mantenha backups das configurações importantes',
           'Teste mudanças em ambiente controlado primeiro',
           'Documente todas as alterações realizadas'
         ],
         nextAction: 'Configure o sistema de logs para monitoramento'
       },
       {
         id: 'system-logs',
         title: 'Logs do Sistema',
         description: 'Monitore atividades e identifique problemas no sistema',
         icon: FileText,
         details: [
           '1. Acesse "Sistema" → "Logs do Sistema" no menu',
           '2. Visualize logs de acesso e autenticação',
           '3. Monitore erros e exceções do sistema',
           '4. Acompanhe atividades de usuários administrativos',
           '5. Analise padrões de uso e performance',
           '6. Configure alertas para eventos críticos',
           '7. Exporte logs para análise externa se necessário',
           '8. Mantenha histórico de logs por período definido'
         ],
         tips: [
           'Verifique logs diariamente para identificar problemas',
           'Configure alertas automáticos para eventos críticos',
           'Mantenha logs organizados por categoria e data',
           'Use filtros para encontrar informações específicas rapidamente'
         ],
         nextAction: 'Configure rotinas de backup automático'
       },
       {
         id: 'backup-restore',
         title: 'Backup & Restauração',
         description: 'Mantenha a segurança e integridade dos dados do sistema',
         icon: Target,
         details: [
           '1. Acesse "Sistema" → "Backup & Restauração" no menu',
           '2. Configure rotinas de backup automático diário',
           '3. Defina locais de armazenamento seguros (local e nuvem)',
           '4. Teste periodicamente a integridade dos backups',
           '5. Configure backup incremental para otimizar espaço',
           '6. Mantenha múltiplas versões de backup (diário, semanal, mensal)',
           '7. Documente procedimentos de restauração de emergência',
           '8. Treine equipe técnica em procedimentos de recuperação'
         ],
         tips: [
           'Realize backups em horários de menor movimento',
           'Teste restauração mensalmente em ambiente separado',
           'Mantenha backups em locais geograficamente distintos',
           'Monitore espaço disponível para armazenamento'
         ],
         nextAction: 'Sistema configurado! Monitore regularmente o funcionamento'
       }
    ]
  },
  teacher: {
    title: 'Guia do Professor',
    subtitle: 'Gerencie suas aulas e alunos',
    color: 'bg-green-600',
    steps: [
      {
        id: 'welcome',
        title: 'Bem-vindo, Professor!',
        description: 'Sua central para gerenciar aulas, atividades e acompanhar alunos',
        icon: GraduationCap,
        details: [
          'Acesso completo às suas turmas e disciplinas atribuídas',
          'Criação, edição e correção de atividades e avaliações',
          'Acompanhamento detalhado do progresso dos alunos',
          'Comunicação direta com alunos e coordenação pedagógica',
          'Visualização de relatórios de desempenho das turmas',
          'Gestão de prazos e cronograma de atividades'
        ],
        tips: [
          'Mantenha seu perfil sempre atualizado com suas informações',
          'Verifique regularmente suas turmas e novos alunos matriculados',
          'Utilize o dashboard para ter uma visão geral das suas atividades'
        ],
        nextAction: 'Vamos conhecer suas turmas e como gerenciá-las'
      },
      {
        id: 'classes',
        title: 'Suas Turmas e Disciplinas',
        description: 'Visualize e gerencie suas turmas e disciplinas',
        icon: Users,
        details: [
          '1. No dashboard principal, visualize todas as suas turmas ativas',
          '2. Clique em uma turma específica para ver detalhes completos',
          '3. Visualize a lista completa de alunos matriculados',
          '4. Acesse informações de contato e dados acadêmicos dos alunos',
          '5. Verifique o histórico de atividades já realizadas',
          '6. Consulte estatísticas de desempenho da turma',
          '7. Monitore frequência e participação dos alunos',
          '8. Acesse relatórios de progresso individual e coletivo'
        ],
        tips: [
          'Conheça bem seus alunos e suas necessidades específicas',
          'Mantenha contato regular com a coordenação pedagógica',
          'Monitore alunos com dificuldades para oferecer suporte',
          'Utilize dados de desempenho para ajustar metodologias'
        ],
        nextAction: 'Agora vamos aprender a criar atividades envolventes'
      },
      {
        id: 'activities',
        title: 'Criar e Gerenciar Atividades',
        description: 'Desenvolva exercícios e avaliações para seus alunos',
        icon: FileText,
        details: [
          '1. Acesse "Atividades" no menu lateral esquerdo',
          '2. Clique em "Nova Atividade" para iniciar a criação',
          '3. Selecione a turma e disciplina correspondente',
          '4. Defina um título claro e descritivo para a atividade',
          '5. Escreva uma descrição detalhada do que é esperado',
          '6. Adicione instruções passo a passo bem claras',
          '7. Configure o prazo de entrega (data e horário)',
          '8. Defina a nota máxima e critérios de avaliação',
          '9. Anexe arquivos de apoio (PDFs, imagens, documentos)',
          '10. Configure se aceita entregas em atraso e penalidades',
          '11. Revise tudo antes de publicar para os alunos'
        ],
        tips: [
          'Seja sempre claro e específico nas instruções',
          'Defina prazos realistas considerando a complexidade',
          'Forneça exemplos quando necessário para esclarecer',
          'Use diferentes tipos de atividades para manter o engajamento'
        ],
        nextAction: 'Vamos ver como acompanhar e corrigir as submissões'
      },
      {
        id: 'grading',
        title: 'Correção e Feedback',
        description: 'Avalie as submissões e forneça feedback construtivo',
        icon: CheckCircle,
        details: [
          '1. Acesse "Atividades" → "Correções Pendentes" no menu',
          '2. Visualize todas as atividades que aguardam correção',
          '3. Clique na atividade específica para ver todas as submissões',
          '4. Selecione uma submissão individual para avaliar',
          '5. Baixe e analise cuidadosamente cada trabalho enviado',
          '6. Atribua uma nota de 0 a 10 baseada nos critérios definidos',
          '7. Escreva feedback detalhado e construtivo',
          '8. Destaque pontos positivos e áreas de melhoria',
          '9. Sugira recursos ou estudos complementares se necessário',
          '10. Salve a correção e notifique o aluno automaticamente'
        ],
        tips: [
          'Feedback construtivo é fundamental para o aprendizado',
          'Seja justo e consistente nas avaliações entre alunos',
          'Corrija em tempo hábil para manter o engajamento',
          'Use comentários específicos em vez de genéricos'
        ],
        nextAction: 'Vamos explorar ferramentas de comunicação e relatórios'
      },
      {
         id: 'lesson-plans',
         title: 'Planos de Aula',
         description: 'Crie e gerencie planos de aula estruturados',
         icon: FileText,
         details: [
           '1. Acesse "Desenvolvimento Profissional" → "Planos de Aula" no menu',
           '2. Clique em "Novo Plano de Aula" para iniciar a criação',
           '3. Defina objetivos de aprendizagem claros e mensuráveis',
           '4. Estruture o conteúdo em introdução, desenvolvimento e conclusão',
           '5. Inclua metodologias e recursos didáticos necessários',
           '6. Defina critérios de avaliação e indicadores de sucesso',
           '7. Adicione cronograma detalhado das atividades',
           '8. Anexe materiais de apoio e recursos complementares',
           '9. Revise e ajuste conforme feedback dos alunos',
           '10. Compartilhe com coordenação pedagógica quando necessário'
         ],
         tips: [
           'Alinhe objetivos com competências curriculares',
           'Varie metodologias para atender diferentes estilos de aprendizagem',
           'Mantenha flexibilidade para ajustes durante a aula',
           'Documente resultados para melhorar próximos planos'
         ],
         nextAction: 'Monitore seu desempenho através das métricas disponíveis'
       },
       {
         id: 'performance',
         title: 'Meu Desempenho',
         description: 'Acompanhe suas métricas e evolução profissional',
         icon: TrendingUp,
         details: [
           '1. Acesse "Desenvolvimento Profissional" → "Meu Desempenho" no menu',
           '2. Visualize estatísticas de engajamento dos alunos',
           '3. Monitore taxas de conclusão de atividades por turma',
           '4. Analise feedback recebido de alunos e coordenação',
           '5. Acompanhe evolução das notas médias das turmas',
           '6. Verifique tempo médio de correção de atividades',
           '7. Monitore participação em atividades de desenvolvimento',
           '8. Compare seu desempenho com períodos anteriores',
           '9. Identifique áreas de melhoria e pontos fortes',
           '10. Defina metas de desenvolvimento profissional'
         ],
         tips: [
           'Use dados para identificar padrões e tendências',
           'Celebre conquistas e progressos alcançados',
           'Busque feedback regular de alunos e pares',
           'Estabeleça metas realistas e mensuráveis'
         ],
         nextAction: 'Explore oportunidades de certificação profissional'
       },
       {
         id: 'certifications',
         title: 'Certificações',
         description: 'Gerencie suas certificações e desenvolvimento contínuo',
         icon: Award,
         details: [
           '1. Acesse "Desenvolvimento Profissional" → "Certificações" no menu',
           '2. Visualize certificações obtidas e em andamento',
           '3. Explore cursos e capacitações disponíveis',
           '4. Inscreva-se em programas de desenvolvimento profissional',
           '5. Acompanhe progresso em cursos em andamento',
           '6. Baixe certificados digitais quando concluídos',
           '7. Compartilhe conquistas com a comunidade escolar',
           '8. Mantenha portfólio atualizado de qualificações',
           '9. Planeje próximas capacitações baseadas em necessidades',
           '10. Aplique conhecimentos adquiridos em sala de aula'
         ],
         tips: [
           'Mantenha-se atualizado com tendências educacionais',
           'Busque certificações alinhadas com sua área de atuação',
           'Participe de comunidades de prática profissional',
           'Documente aplicação prática dos conhecimentos adquiridos'
         ],
         nextAction: 'Excelente! Continue seu desenvolvimento profissional contínuo'
       }
    ]
  },
  student: {
    title: 'Como Usar o Sistema',
    subtitle: 'Guia simples para alunos iniciantes',
    color: 'bg-green-600',
    steps: [
      {
        id: 'welcome',
        title: 'Olá! Seja bem-vindo! 👋',
        description: 'Este é seu sistema escolar. Vamos aprender juntos como usar!',
        icon: Award,
        details: [
          '📚 Aqui você encontra todas as suas matérias e atividades',
          '📝 Pode fazer e entregar seus trabalhos online',
          '📊 Acompanha suas notas e como está indo na escola',
          '💬 Conversa com seus professores quando precisar',
          '📅 Vê quando tem provas e trabalhos para entregar'
        ],
        tips: [
          'Não se preocupe! É mais fácil do que parece 😊',
          'Se tiver dúvida, pode perguntar para seus professores',
          'Use todos os dias para não perder nada importante'
        ],
        nextAction: 'Vamos ver sua página principal!'
      },
      {
        id: 'dashboard',
        title: 'Sua Página Principal 📊',
        description: 'Aqui você vê tudo que precisa saber de uma vez',
        icon: BarChart3,
        details: [
          '1. Esta é sua página principal - sempre comece por aqui quando entrar no sistema',
          '2. No topo da página, você verá um resumo com números coloridos',
          '3. O número azul mostra quantos trabalhos você tem para fazer',
          '4. O número vermelho mostra trabalhos que estão quase no prazo (cuidado!)',
          '5. O número verde mostra trabalhos que você já entregou',
          '6. Abaixo, você verá uma lista dos seus trabalhos mais recentes',
          '7. Trabalhos em vermelho são os que estão quase no prazo!',
          '8. Trabalhos em verde são os que você já entregou',
          '9. Clique em qualquer trabalho para ver mais detalhes',
          '10. Do lado direito, você verá suas notas mais recentes',
          '11. As notas ficam organizadas por matéria',
          '12. Você também verá um calendário com datas importantes',
          '13. Datas em vermelho são provas ou trabalhos com prazo',
          '14. Clique em qualquer data para ver o que tem marcado'
        ],
        tips: [
          'Olhe esta página todo dia quando entrar no sistema',
          'Se vir algo em vermelho, é porque está no prazo!',
          'Suas notas ficam organizadas por matéria',
          'Use esta página para planejar seus estudos',
          'Se não aparecer nada, pode ser que não tenha atividades ainda'
        ],
        nextAction: 'Agora vamos ver como fazer seus trabalhos!'
      },
      {
        id: 'activities',
        title: 'Fazendo Seus Trabalhos 📝',
        description: 'Como encontrar, fazer e entregar suas atividades',
        icon: FileText,
        details: [
          '1. Clique em "Minhas Atividades" no menu do lado esquerdo',
          '2. Você verá uma lista com todos os trabalhos que seus professores passaram',
          '3. Cada trabalho mostra: nome, matéria, prazo e se já foi entregue',
          '4. Trabalhos em vermelho são os que estão quase no prazo!',
          '5. Clique no trabalho que você quer fazer',
          '6. Uma nova página vai abrir com todos os detalhes',
          '7. Leia TUDO que o professor escreveu com muita atenção',
          '8. Se tiver arquivos para baixar, clique nos links ou botões de download',
          '9. Os arquivos vão para a pasta "Downloads" do seu computador',
          '10. Abra os arquivos baixados para entender melhor o trabalho',
          '11. Faça seu trabalho no computador (Word, PowerPoint, etc.)',
          '12. Quando terminar, salve o arquivo com um nome claro (ex: "Trabalho_Matematica_João")',
          '13. Volte para a página da atividade no sistema',
          '14. Procure o botão "Enviar Atividade" ou "Submeter"',
          '15. Clique nesse botão',
          '16. Uma janela vai abrir para escolher o arquivo',
          '17. Navegue até onde salvou seu trabalho e clique nele',
          '18. Clique em "Abrir" ou "Selecionar"',
          '19. Clique em "Enviar" ou "Confirmar"',
          '20. Aguarde a confirmação de que foi enviado com sucesso!'
        ],
        tips: [
          'Sempre leia TUDO antes de começar a fazer',
          'Salve seu trabalho com um nome que você entenda',
          'Envie com tempo, não deixe para a última hora!',
          'Se der erro, tente novamente ou peça ajuda',
          'Mantenha uma cópia do seu trabalho no computador',
          'Se o arquivo for muito grande, pode dar erro no envio'
        ],
        nextAction: 'Vamos ver suas notas!'
      },
      {
        id: 'grades',
        title: 'Suas Notas 📊',
        description: 'Como ver suas notas e o que os professores falaram',
        icon: Award,
        details: [
          '1. Clique em "Notas" no menu do lado esquerdo',
          '2. Você verá uma lista com todas as suas notas',
          '3. As notas ficam organizadas por matéria (Matemática, Português, etc.)',
          '4. Cada nota mostra: nome da atividade, nota que você tirou e data',
          '5. Suas médias aparecem automaticamente em cada matéria',
          '6. Para ver detalhes de uma nota específica, clique nela',
          '7. Uma janela ou nova página vai abrir com mais informações',
          '8. Você verá a nota que tirou (ex: 8,5 de 10)',
          '9. Leia TODOS os comentários que o professor escreveu',
          '10. Os comentários mostram o que você fez bem (pontos positivos)',
          '11. Também mostram o que você pode melhorar (sugestões)',
          '12. Se tiver arquivo corrigido, pode baixar para ver as correções',
          '13. Feche a janela quando terminar de ler',
          '14. Suas médias são calculadas automaticamente pelo sistema'
        ],
        tips: [
          'Os comentários dos professores são para te ajudar a melhorar',
          'Se não entendeu algo, pode perguntar para o professor',
          'Use suas notas para saber em que precisa estudar mais',
          'Notas baixas não são o fim do mundo - use para aprender!',
          'Compare suas notas ao longo do tempo para ver se está melhorando'
        ],
        nextAction: 'Vamos ver como conversar com seus professores!'
      },
      {
        id: 'communication',
        title: 'Conversando com Professores 💬',
        description: 'Como falar com seus professores quando precisar',
        icon: MessageSquare,
        details: [
          '1. Clique em "Chat" no menu do lado esquerdo',
          '2. Na parte de cima da tela, você verá uma barra de pesquisa',
          '3. Digite o nome do professor que você quer conversar (ex: "Maria", "João")',
          '4. Conforme você digita, aparecerão os professores com nomes parecidos',
          '5. Clique no nome do professor correto da lista que apareceu',
          '6. Agora você verá a conversa com esse professor',
          '7. Na parte de baixo da tela, tem uma caixa para escrever',
          '8. Digite sua mensagem nessa caixa',
          '9. Clique no botão "Enviar" (ou aperte Enter) para mandar a mensagem',
          '10. Sua mensagem aparecerá do lado direito da tela',
          '11. Quando o professor responder, a mensagem dele aparecerá do lado esquerdo',
          '12. Para conversar com outro professor, repita o processo de pesquisa'
        ],
        tips: [
          'Seja educado e escreva de forma clara',
          'Use o chat para tirar dúvidas sobre trabalhos',
          'Professores respondem quando podem, tenha paciência',
          'Se não encontrar o professor, verifique se escreveu o nome certo',
          'Você pode conversar com vários professores ao mesmo tempo'
        ],
        nextAction: 'Pronto! Agora você já sabe usar o sistema! 🎉'
      }
    ]
  },
  coordinator: {
    title: 'Guia do Coordenador',
    subtitle: 'Gerencie a instituição e acompanhe o desempenho acadêmico',
    color: 'bg-purple-600',
    steps: [
      {
        id: 'welcome',
        title: 'Bem-vindo, Coordenador!',
        description: 'Sua central de gestão pedagógica e administrativa',
        icon: UserCheck,
        details: [
          'Supervisão completa de todas as atividades acadêmicas da instituição',
          'Gestão de professores, alunos e recursos educacionais',
          'Acompanhamento detalhado do desempenho de turmas e disciplinas',
          'Análise de relatórios e métricas de desempenho institucional',
          'Coordenação de processos pedagógicos e administrativos',
          'Comunicação estratégica com toda a comunidade escolar',
          'Planejamento e execução de políticas educacionais',
          'Monitoramento da qualidade do ensino e aprendizagem'
        ],
        tips: [
          'Mantenha uma visão holística da instituição e seus processos',
          'Use dados e relatórios para tomar decisões estratégicas informadas',
          'Promova comunicação efetiva entre todos os stakeholders',
          'Foque na melhoria contínua da qualidade educacional'
        ],
        nextAction: 'Vamos explorar seu painel de controle institucional'
      },
      {
        id: 'dashboard',
        title: 'Painel de Controle Institucional',
        description: 'Monitore indicadores-chave e métricas de desempenho',
        icon: BarChart3,
        details: [
          '1. Visualize o dashboard principal com métricas institucionais em tempo real',
          '2. Acompanhe indicadores de desempenho acadêmico por turma e disciplina',
          '3. Monitore estatísticas de participação e engajamento dos alunos',
          '4. Analise taxas de conclusão de atividades e prazos cumpridos',
          '5. Verifique distribuição de notas e médias por professor e turma',
          '6. Acompanhe frequência e assiduidade de alunos e professores',
          '7. Monitore uso de recursos e materiais educacionais',
          '8. Visualize tendências e padrões de desempenho ao longo do tempo',
          '9. Identifique rapidamente áreas que necessitam intervenção',
          '10. Acesse alertas e notificações sobre situações críticas'
        ],
        tips: [
          'Revise o dashboard diariamente para manter-se atualizado',
          'Configure alertas para métricas críticas de desempenho',
          'Use filtros para analisar dados por período, turma ou disciplina',
          'Compartilhe insights relevantes com a equipe pedagógica'
        ],
        nextAction: 'Agora vamos ver como gerenciar professores e recursos'
      },
      {
        id: 'management',
        title: 'Gestão de Professores e Recursos',
        description: 'Administre equipe docente e recursos educacionais',
        icon: Users,
        details: [
          '1. Acesse "Gestão de Professores" para visualizar toda a equipe docente',
          '2. Monitore carga horária e distribuição de disciplinas por professor',
          '3. Acompanhe desempenho individual através de métricas específicas',
          '4. Gerencie atribuições de turmas e disciplinas conforme necessário',
          '5. Visualize relatórios de atividades criadas e corrigidas por professor',
          '6. Monitore comunicação e feedback entre professores e alunos',
          '7. Identifique necessidades de capacitação e desenvolvimento profissional',
          '8. Gerencie recursos educacionais e materiais de apoio',
          '9. Coordene reuniões pedagógicas e planejamento curricular',
          '10. Facilite colaboração e troca de experiências entre professores'
        ],
        tips: [
          'Mantenha comunicação regular e construtiva com os professores',
          'Reconheça e valorize boas práticas pedagógicas',
          'Ofereça suporte e recursos para desenvolvimento profissional',
          'Promova ambiente colaborativo e de melhoria contínua'
        ],
        nextAction: 'Vamos aprender a acompanhar o progresso dos alunos'
      },
      {
        id: 'student_monitoring',
        title: 'Acompanhamento de Alunos',
        description: 'Monitore progresso acadêmico e bem-estar estudantil',
        icon: Target,
        details: [
          '1. Acesse "Acompanhamento de Alunos" para visão geral do corpo discente',
          '2. Monitore desempenho acadêmico individual e por turma',
          '3. Identifique alunos com dificuldades ou necessidades especiais',
          '4. Acompanhe frequência, participação e engajamento estudantil',
          '5. Analise padrões de submissão de atividades e cumprimento de prazos',
          '6. Visualize progressão de notas e médias ao longo do período',
          '7. Identifique casos que necessitam intervenção pedagógica',
          '8. Coordene ações de apoio e recuperação acadêmica',
          '9. Monitore comunicação entre alunos e professores',
          '10. Gere relatórios para pais, responsáveis e conselho escolar'
        ],
        tips: [
          'Implemente sistema de alerta precoce para dificuldades acadêmicas',
          'Promova ações preventivas antes que problemas se agravem',
          'Mantenha comunicação transparente com pais e responsáveis',
          'Desenvolva estratégias personalizadas para diferentes perfis de alunos'
        ],
        nextAction: 'Vamos explorar relatórios e análises avançadas'
      },
      {
        id: 'strategic-plan',
        title: 'Plano Estratégico',
        description: 'Desenvolva e implemente estratégias educacionais de longo prazo',
        icon: Target,
        details: [
          '1. Acesse "Liderança Pedagógica" → "Plano Estratégico" no menu',
          '2. Defina objetivos institucionais de curto, médio e longo prazo',
          '3. Estabeleça metas SMART (específicas, mensuráveis, alcançáveis, relevantes, temporais)',
          '4. Alinhe estratégias com missão, visão e valores da instituição',
          '5. Identifique recursos necessários para implementação',
          '6. Defina indicadores de sucesso e marcos de acompanhamento',
          '7. Atribua responsabilidades e prazos para cada iniciativa',
          '8. Monitore progresso através de dashboards específicos',
          '9. Realize revisões periódicas e ajustes estratégicos',
          '10. Comunique planos e resultados para toda comunidade escolar'
        ],
        tips: [
          'Envolva toda equipe pedagógica no planejamento estratégico',
          'Base decisões em dados históricos e tendências educacionais',
          'Mantenha flexibilidade para adaptações conforme necessário',
          'Celebre conquistas e aprenda com desafios encontrados'
        ],
        nextAction: 'Monitore indicadores de qualidade educacional'
      },
      {
        id: 'quality-indicators',
        title: 'Indicadores de Qualidade',
        description: 'Acompanhe métricas de excelência educacional',
        icon: TrendingUp,
        details: [
          '1. Acesse "Liderança Pedagógica" → "Indicadores de Qualidade" no menu',
          '2. Monitore taxa de aprovação e retenção por disciplina',
          '3. Acompanhe evolução das médias de desempenho estudantil',
          '4. Analise satisfação de alunos, professores e pais',
          '5. Verifique cumprimento de cronogramas e planejamentos',
          '6. Monitore eficácia de metodologias pedagógicas aplicadas',
          '7. Acompanhe desenvolvimento profissional da equipe docente',
          '8. Analise uso eficiente de recursos educacionais',
          '9. Compare indicadores com benchmarks educacionais',
          '10. Gere relatórios de qualidade para stakeholders'
        ],
        tips: [
          'Estabeleça metas de qualidade baseadas em dados históricos',
          'Use indicadores para identificar oportunidades de melhoria',
          'Mantenha transparência nos resultados com toda comunidade',
          'Implemente ações corretivas baseadas nos indicadores'
        ],
        nextAction: 'Implemente programa de reconhecimento docente'
      },
      {
        id: 'teacher-recognition',
        title: 'Reconhecimento Docente',
        description: 'Valorize e reconheça excelência no ensino',
        icon: Award,
        details: [
          '1. Acesse "Liderança Pedagógica" → "Reconhecimento Docente" no menu',
          '2. Estabeleça critérios claros para avaliação de desempenho',
          '3. Monitore indicadores de excelência pedagógica por professor',
          '4. Identifique boas práticas e metodologias inovadoras',
          '5. Crie programa de reconhecimento e premiação',
          '6. Promova compartilhamento de experiências exitosas',
          '7. Ofereça oportunidades de desenvolvimento profissional',
          '8. Facilite mentoria entre professores experientes e novatos',
          '9. Organize eventos de celebração e reconhecimento',
          '10. Mantenha registro histórico de conquistas e melhorias'
        ],
        tips: [
          'Reconheça tanto resultados quanto esforços e dedicação',
          'Promova cultura de melhoria contínua e colaboração',
          'Ofereça feedback construtivo e oportunidades de crescimento',
          'Celebre conquistas individuais e coletivas regularmente'
        ],
        nextAction: 'Parabéns! Você está preparado para liderar com excelência pedagógica'
      }
    ]
  }
};

export function InstructionModal({ isOpen, onClose, userRole }: InstructionModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  // Verificação de segurança para userRole
  if (!userRole || !instructionData[userRole]) {
    return null;
  }
  
  const instructions = instructionData[userRole];
  const totalSteps = instructions.steps.length;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const currentStepData = instructions.steps[currentStep];
  const StepIcon = currentStepData.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className={`${instructions.color} text-white p-6 -m-6 mb-6`}>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <Lightbulb className="w-8 h-8" />
                {instructions.title}
              </DialogTitle>
              <p className="text-white/90 mt-1">{instructions.subtitle}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex gap-6">
          {/* Sidebar com steps */}
          <div className="w-64 flex-shrink-0">
            <div className="space-y-2">
              {instructions.steps.map((step, index) => {
                const StepSideIcon = step.icon;
                return (
                  <button
                    key={step.id}
                    onClick={() => handleStepClick(index)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      index === currentStep
                        ? `${instructions.color} text-white shadow-lg`
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        index === currentStep ? 'bg-white/20' : 'bg-gray-300'
                      }`}>
                        <StepSideIcon className={`w-4 h-4 ${
                          index === currentStep ? 'text-white' : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{step.title}</div>
                        <div className={`text-xs ${
                          index === currentStep ? 'text-white/80' : 'text-gray-500'
                        }`}>
                          Passo {index + 1}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conteúdo principal */}
          <div className="flex-1 overflow-y-auto max-h-[60vh]">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${instructions.color}`}>
                    <StepIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
                    <p className="text-gray-600 mt-1">{currentStepData.description}</p>
                  </div>
                  <Badge variant="secondary" className="ml-auto">
                    {currentStep + 1} de {totalSteps}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Detalhes */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Como fazer:</h4>
                  <ul className="space-y-2">
                    {currentStepData.details.map((detail, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Dicas */}
                {currentStepData.tips && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Dicas importantes:
                    </h4>
                    <ul className="space-y-1">
                      {currentStepData.tips.map((tip, index) => (
                        <li key={index} className="text-yellow-700 text-sm">
                          • {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Próxima ação */}
                {currentStepData.nextAction && (
                  <div className={`${instructions.color} text-white rounded-lg p-4`}>
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      <span className="font-medium">Próximo passo:</span>
                    </div>
                    <p className="mt-1 text-white/90">{currentStepData.nextAction}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Navegação */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </Button>

          <div className="flex items-center gap-2">
            {instructions.steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? instructions.color : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {currentStep < totalSteps - 1 ? (
            <Button
              onClick={handleNext}
              className={`${instructions.color} hover:opacity-90 flex items-center gap-2`}
            >
              Próximo
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={onClose}
              className={`${instructions.color} hover:opacity-90 flex items-center gap-2`}
            >
              Finalizar
              <CheckCircle className="w-4 h-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ...existing code ...