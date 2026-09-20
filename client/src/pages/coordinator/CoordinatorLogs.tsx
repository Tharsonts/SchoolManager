import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import MainLayout from '@/components/layout/MainLayout';
import { 
  Terminal,
  Search,
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  action: string;
  description: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  locationCity?: string;
  locationRegion?: string;
  locationCountry?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  deviceType?: string;
  os?: string;
  osVersion?: string;
  browser?: string;
  browserVersion?: string;
  metadata?: any;
  code?: string;
}

const CoordinatorLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Hook para buscar logs do terminal
  const { data: logsData, isLoading, error, refetch } = useQuery({
    queryKey: ['coordinator-logs-terminal'],
    queryFn: async () => {
      const response = await fetch('/api/coordinator/logs/terminal');
      if (!response.ok) throw new Error('Erro ao buscar logs');
      return response.json();
    },
    refetchInterval: 2000, // Atualizar a cada 2 segundos
    refetchOnWindowFocus: true
  });

  const logs = logsData?.data?.logs || [];

  // Auto scroll para o final
  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Filtrar logs baseado na busca e inverter ordem (mais recentes primeiro)
  const filteredLogs = logs.filter((log: LogEntry) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
    // Busca por nome do usuÃ¡rio (com ou sem @)
    const userNameMatch = log.userName?.toLowerCase().includes(searchLower) || 
                         (log.userName && `@${log.userName.toLowerCase()}`.includes(searchLower));
    
    // Busca por IP (com ou sem mascaramento)
    const ipMatch = log.ipAddress?.toLowerCase().includes(searchLower) ||
                   (log.ipAddress && log.ipAddress.replace(/\.\*\*\*\.\*\*\*/g, '').toLowerCase().includes(searchLower));
    
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.description.toLowerCase().includes(searchLower) ||
      userNameMatch ||
      log.code?.toLowerCase().includes(searchLower) ||
      ipMatch ||
      // Busca por palavras-chave especÃ­ficas
      (searchLower.includes('login') && log.action === 'LOGIN') ||
      (searchLower.includes('logout') && log.action === 'LOGOUT') ||
      (searchLower.includes('mensagem') && log.action === 'MENSAGEM_ENVIADA') ||
      (searchLower.includes('atividade') && (log.action === 'ATIVIDADE_CRIADA' || log.action === 'ATIVIDADE_SUBMETIDA')) ||
      (searchLower.includes('prova') && (log.action === 'PROVA_CRIADA' || log.action === 'PROVA_CONCLUIDA')) ||
      (searchLower.includes('nota') && log.action === 'NOTA_LANCADA') ||
      (searchLower.includes('arquivo') && log.action === 'ARQUIVO_UPLOAD') ||
      (searchLower.includes('chat') && log.action === 'CHAT_ACESSADO') ||
      (searchLower.includes('dashboard') && log.action === 'DASHBOARD_ACESSADO')
    );
  }).reverse(); // Inverter ordem para mostrar mais recentes primeiro

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'SUCCESS': return 'text-green-300';
      case 'WARN': return 'text-yellow-300';
      case 'ERROR': return 'text-red-300';
      case 'INFO': return 'text-blue-300';
      default: return 'text-gray-300';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'SUCCESS': return <CheckCircle className="h-4 w-4" />;
      case 'WARN': return <AlertTriangle className="h-4 w-4" />;
      case 'ERROR': return <XCircle className="h-4 w-4" />;
      case 'INFO': return <Info className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  // Mapeia ação para frase e possível local
  const describeAction = (action: string, level: LogEntry['level']) => {
    const a = action?.toUpperCase() || '';
    const tentativa = level === 'ERROR' ? 'tentou ' : '';
    const sufixo = level === 'SUCCESS' ? ' com sucesso' : level === 'WARN' ? ' com alerta' : '';
    if (a.includes('LOGIN')) return `${tentativa}fazer login${sufixo}`;
    if (a.includes('LOGOUT')) return `${tentativa}sair do sistema${sufixo}`;
    if (a.includes('MENSAGEM') && a.includes('ENVIADA')) return `${tentativa}enviar mensagem${sufixo}`;
    if (a.includes('ATIVIDADE') && a.includes('CRIADA')) return `${tentativa}criar atividade${sufixo}`;
    if (a.includes('ATIVIDADE') && a.includes('SUBMETIDA')) return `${tentativa}submeter atividade${sufixo}`;
    if (a.includes('PROVA') && a.includes('CRIADA')) return `${tentativa}criar prova${sufixo}`;
    if (a.includes('PROVA') && a.includes('CONCLUIDA')) return `${tentativa}concluir prova${sufixo}`;
    if (a.includes('NOTA') && a.includes('LANCADA')) return `${tentativa}lançar nota${sufixo}`;
    if (a.includes('ARQUIVO') && a.includes('UPLOAD')) return `${tentativa}enviar arquivo${sufixo}`;
    if (a.includes('CHAT') && a.includes('ACESSADO')) return `${tentativa}acessar o chat${sufixo}`;
    if (a.includes('DASHBOARD') && a.includes('ACESSADO')) return `${tentativa}acessar o dashboard${sufixo}`;
    return `${tentativa}executar ${action?.toLowerCase()}${sufixo}`;
  };

  const inferLocation = (action: string) => {
    const a = action?.toUpperCase() || '';
    if (a.includes('CHAT')) return 'Chat';
    if (a.includes('DASHBOARD')) return 'Dashboard';
    if (a.includes('ATIVIDADE')) return 'Atividades';
    if (a.includes('PROVA')) return 'Provas';
    if (a.includes('ARQUIVO')) return 'Arquivos';
    if (a.includes('MENSAGEM')) return 'Mensagens';
    return undefined;
  };

  const formatLogLine = (log: LogEntry) => {
    const timestamp = format(new Date(log.timestamp), 'HH:mm:ss', { locale: ptBR });
    const email = (log.metadata && (log.metadata.userEmail || log.metadata.email)) || undefined;
    const quem = log.userName 
      ? `${log.userName}${email ? ` (${email})` : ''}${log.userRole ? ` [${log.userRole}]` : ''}` 
      : 'Usuário';
    const oQue = describeAction(log.action, log.level);
    const onde = inferLocation(log.action);
    const fraseBase = `${timestamp} ${log.level} • ${quem} ${oQue}${onde ? ` em ${onde}` : ''}.`;
    return `${fraseBase}${log.description ? ` — ${log.description}` : ''}`;
  };

  return (
    <MainLayout pageTitle="Terminal de Logs">
      <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-black rounded-lg flex items-center justify-center">
          <Terminal className="h-6 w-6 text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Terminal de Logs</h1>
          <p className="text-gray-600">Monitoramento em tempo real do sistema</p>
        </div>
      </div>

      {/* Filtro de Busca */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome (@teste), aÃ§Ã£o (login), cÃ³digo (AUTH-001), IP (192.168)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* EstatÃ­sticas da Busca */}
          {searchTerm && (
            <div className="mt-3 text-sm text-gray-600">
              {filteredLogs.length === 0 ? (
                <span className="text-red-500">Nenhum resultado encontrado para "{searchTerm}"</span>
              ) : (
                <span>
                  {filteredLogs.length} resultado{filteredLogs.length !== 1 ? 's' : ''} encontrado{filteredLogs.length !== 1 ? 's' : ''} para "{searchTerm}"
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Terminal */}
      <Card className="h-[700px]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Terminal className="h-5 w-5" />
            Console de Logs ({filteredLogs.length} entradas)
            {isLoading && (
              <div className="ml-2 h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div
            ref={terminalRef}
            className="h-[600px] bg-black text-white font-mono text-sm p-4 overflow-y-auto rounded-b-lg"
            style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace' }}
          >
            {error ? (
              <div className="text-red-300">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-4 w-4" />
                  <span>ERRO: Falha ao carregar logs</span>
                </div>
                <div className="text-gray-400">Verifique a conexão e tente novamente</div>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-gray-400">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4" />
                  <span>Nenhum log encontrado</span>
                </div>
                <div className="text-gray-500">Aguardando atividade do sistema...</div>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredLogs.map((log: LogEntry, index: number) => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-2 hover:bg-gray-900 px-2 py-1 rounded ${
                      index === filteredLogs.length - 1 ? 'bg-gray-900/50' : ''
                    }`}
                  >
                    <span className="text-gray-400 text-xs w-8">
                      {String(index + 1).padStart(3, '0')}
                    </span>
                    <span className={`${getLevelColor(log.level)} flex items-center gap-1`}>
                      {getLevelIcon(log.level)}
                    </span>
                    <span className="flex-1">
                      {formatLogLine(log)}
                      <div className="mt-1 ml-0 text-xs text-gray-300 flex flex-wrap gap-2">
                        {/* Removido campo de Local para evitar exposição */}
                        {/* ID do usuÃ¡rio (se houver) */}
                        {log.userId && (
                          <span className="bg-gray-800/80 text-gray-200 px-2 py-0.5 rounded">
                            ID: {log.userId}
                          </span>
                        )}
                        {/* IP completo */}
                        <span className="bg-gray-800/80 text-gray-200 px-2 py-0.5 rounded flex items-center gap-1">
                          IP: {log.ipAddress || 'desconhecido'}
                        </span>
                        {/* Dispositivo (sempre exibir) */}
                        <span className="bg-gray-800/80 text-gray-200 px-2 py-0.5 rounded">
                          Dispositivo: {[log.deviceType, log.os, log.browser].filter(Boolean).join(' | ') || 'desconhecido'}
                        </span>
                      </div>
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Cursor piscando */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-white">$</span>
              <div className="h-4 w-2 bg-white animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Bar */}
      <div className="flex items-center justify-between text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span>Última atualização: {format(new Date(), 'HH:mm:ss', { locale: ptBR })}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>UsuÃ¡rios ativos: {new Set(logs.map((l: LogEntry) => l.userId).filter(Boolean)).size}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>IPs Ãºnicos: {new Set(logs.map((l: LogEntry) => l.ipAddress).filter(Boolean)).size}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Sistema Online</span>
          </div>
        </div>
      </div>
      </div>
    </MainLayout>
  );
};

export default CoordinatorLogs;