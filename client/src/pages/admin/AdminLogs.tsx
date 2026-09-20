import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Terminal,
  Search,
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
  RefreshCw,
  Download,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

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
  // Novos campos enriquecidos
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

const AdminLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [detailedView, setDetailedView] = useState(true);

  // Hook para buscar logs do terminal
  const { data: logsData, isLoading, error } = useQuery({
    queryKey: ['admin-logs-terminal', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      params.set('limit', '1000');
      const response = await fetch(`/api/admin/logs/terminal?${params.toString()}`);
      if (!response.ok) throw new Error('Erro ao buscar logs');
      return response.json();
    },
    refetchInterval: 2000, // Atualizar a cada 2 segundos
    refetchOnWindowFocus: true
  });

  const logs = logsData?.data?.logs || [];

  

  // Filtrar logs baseado na busca e nível
  const filteredLogs = logs.filter((log: LogEntry) => {
    const matchesSearch = !searchTerm || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.userName && log.userName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    
    return matchesSearch && matchesLevel;
  });

  // Ordena para que os mais novos fiquem no final (visual tipo terminal)
  const orderedLogs = [...filteredLogs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'SUCCESS': return 'text-green-400';
      case 'ERROR': return 'text-red-400';
      case 'WARN': return 'text-yellow-400';
      case 'INFO': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getLevelBorder = (level: string) => {
    switch (level) {
      case 'SUCCESS': return 'border-l-2 border-green-500';
      case 'ERROR': return 'border-l-2 border-red-500';
      case 'WARN': return 'border-l-2 border-yellow-500';
      case 'INFO': return 'border-l-2 border-blue-500';
      default: return 'border-l-2 border-gray-700';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'SUCCESS': return <CheckCircle className="h-3 w-3" />;
      case 'ERROR': return <XCircle className="h-3 w-3" />;
      case 'WARN': return <AlertTriangle className="h-3 w-3" />;
      case 'INFO': return <Info className="h-3 w-3" />;
      default: return <Info className="h-3 w-3" />;
    }
  };

  // Mapeia ações para frases profissionais, usando passado para sucesso/info
  const describeAction = (action: string, level: LogEntry['level']) => {
    const a = action?.toUpperCase() || '';
    const isError = level === 'ERROR';

    // ConstrÃ³i frase: em erro usa "tentou ...", caso contrÃ¡rio usa passado
    const frase = (passado: string, infinitivo?: string) => (
      isError ? `tentou ${infinitivo ?? passado}` : passado
    );

    if (a.includes('LOGIN')) return frase('acessou o sistema', 'acessar o sistema');
    if (a.includes('LOGOUT')) return frase('saiu do sistema', 'sair do sistema');
    if (a.includes('USUARIO') && a.includes('CRIADO')) return frase('criou usuário', 'criar usuário');
    if (a.includes('ARQUIVO') && a.includes('UPLOAD')) return frase('enviou arquivo', 'enviar arquivo');
    if (a.includes('MENSAGEM') && a.includes('ENVIADA')) return frase('enviou mensagem', 'enviar mensagem');
    if (a.includes('ATIVIDADE') && a.includes('CRIADA')) return frase('criou atividade', 'criar atividade');
    if (a.includes('ATIVIDADE') && a.includes('SUBMETIDA')) return frase('submeteu atividade', 'submeter atividade');
    if (a.includes('PROVA') && a.includes('CRIADA')) return frase('criou prova', 'criar prova');
    if (a.includes('PROVA') && a.includes('CONCLUIDA')) return frase('concluiu prova', 'concluir prova');
    if (a.includes('NOTA') && a.includes('LANCADA')) return frase('lançou nota', 'lançar nota');
    if (a.includes('CHAT') && a.includes('ACESSADO')) return frase('acessou o chat', 'acessar o chat');
    if (a.includes('DASHBOARD') && a.includes('ACESSADO')) return frase('acessou o dashboard', 'acessar o dashboard');
    // GenÃ©rico: usa "executou <aÃ§Ã£o>"
    const base = `executou ${action?.toLowerCase()}`;
    return isError ? `tentou ${base}` : base;
  };

  // Extrai contexto/local do log
  const getLocation = (log: LogEntry) => {
    const m = log.metadata || {};
    const fromMeta = m.page || m.module || m.section || m.route || m.endpoint || m.resource || m.context;
    if (fromMeta) return String(fromMeta);
    if (log.userRole) {
      return log.userRole.toLowerCase().includes('admin') ? 'Painel do administrador' : 'Painel do sistema';
    }
    return undefined;
  };

  const formatLogLine = (log: LogEntry) => {
    const timestamp = format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR });
    const email = (log.metadata && (log.metadata.userEmail || log.metadata.email)) || undefined;
    const nome = log.userName || undefined;
    const papel = log.userRole || undefined;
    const quemBase = nome ? nome : 'Usuário';
    const quem = `${quemBase}${email ? ` (${email})` : ''}${papel ? ` [${papel}]` : ''}`;
    const oQue = describeAction(log.action, log.level);
    const onde = getLocation(log);

    return (
      <span className="text-gray-300">
        <span className="text-gray-500">{timestamp}</span>
        <span className={`ml-2 ${getLevelColor(log.level)} flex items-center gap-1`}>
          {getLevelIcon(log.level)}
          {log.level}
        </span>
        <span className="ml-2 text-white">
          {quem} {oQue}{onde ? ` em ${onde}` : ''}.
        </span>
      </span>
    );
  };

  const truncate = (text: string, max = 60) => {
    if (!text) return '';
    return text.length > max ? `${text.slice(0, max)}…` : text;
  };

  const copy = async (value: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label ? label + ' ' : ''}copiado`);
    } catch {
      toast.error('Falha ao copiar');
    }
  };

  const exportLogs = async () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    params.set('limit', 'all');
    const response = await fetch(`/api/admin/logs/terminal?${params.toString()}`);
    if (!response.ok) {
      toast.error('Falha ao exportar logs');
      return;
    }
    const json = await response.json();
    const allLogs: LogEntry[] = json?.data?.logs || [];
    const logsToExport = levelFilter === 'all' ? allLogs : allLogs.filter((l) => l.level === levelFilter);
    const header = 'Timestamp,Level,Action,Description,User,Role,IP,UserAgent,UserId,Code,Metadata';
    const rows = logsToExport.map((log: LogEntry) =>
      `"${log.timestamp}","${log.level}","${log.action}","${log.description}","${log.userName || ''}","${log.userRole || ''}","${log.ipAddress || ''}","${(log.userAgent || '').replace(/"/g,'\"')}","${log.userId || ''}","${log.code || ''}","${log.metadata ? JSON.stringify(log.metadata).replace(/"/g,'\"') : ''}"`
    ).join('\n');
    const csvContent = [header, rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Logs exportados com sucesso!');
  };

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Logs do Sistema</h1>
            <p className="text-gray-600 mt-1">Monitoramento em tempo real das atividades do sistema</p>
          </div>
          <div className="flex items-center gap-3">
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={exportLogs}
              disabled={filteredLogs.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Buscar logs..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="NÃ­vel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                  <SelectItem value="SUCCESS">Sucesso</SelectItem>
                  <SelectItem value="WARN">Aviso</SelectItem>
                  <SelectItem value="ERROR">Erro</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailedView((v) => !v)}
                className="flex items-center gap-2"
              >
                {detailedView ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {detailedView ? 'Ocultar detalhes' : 'Mostrar detalhes'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Terminal */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Terminal de Logs
              <span className="text-sm text-gray-500 ml-auto">
                {filteredLogs.length} entradas
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div 
              className="bg-black text-green-400 font-mono text-sm h-[500px] overflow-y-auto p-4 rounded-md"
            >
              {isLoading ? (
                <div className="text-gray-400">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Carregando logs...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="text-red-400">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-4 w-4" />
                    <span>Erro ao carregar logs</span>
                  </div>
                  <div className="text-gray-500 text-xs">
                    Verifique a conexão e tente novamente</div>
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
                  {orderedLogs.map((log: LogEntry, index: number) => (
                    <div
                      key={log.id}
                      className={`flex items-start gap-2 hover:bg-gray-900 px-2 py-1 rounded ${getLevelBorder(log.level)} ${
                        index === orderedLogs.length - 1 ? 'bg-gray-900/50' : ''
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
                        {detailedView && (
                          <div className="mt-1 ml-0 text-xs text-gray-400 flex flex-wrap gap-2">
                            {/* Detalhe da descrição - mostrar um pouco mais */}
                            <span className="bg-gray-800/80 text-gray-200 px-2 py-0.5 rounded">
                              Detalhe: {truncate(log.description || '', 160)}
                            </span>
                            {/* Email (se disponível no metadata) */}
                            {((log as any).metadata?.userEmail || (log as any).metadata?.email) && (
                              <span className="bg-gray-800/80 text-gray-200 px-2 py-0.5 rounded flex items-center gap-1">
                                Email: {(log as any).metadata.userEmail || (log as any).metadata.email}
                                <button onClick={() => copy((log as any).metadata.userEmail || (log as any).metadata.email, 'Email')} title="Copiar Email">
                                  <Copy className="h-3 w-3" />
                                </button>
                              </span>
                            )}
                            {/* 2) ID do usuÃ¡rio */}
                            {log.userId && (
                              <span className="bg-gray-800/80 text-gray-200 px-2 py-0.5 rounded flex items-center gap-1">
                                ID: {log.userId}
                                <button onClick={() => copy(log.userId, 'ID')} title="Copiar ID">
                                  <Copy className="h-3 w-3" />
                                </button>
                              </span>
                            )}
                            {/* 3) IP completo */}
                            <span className="bg-gray-800/80 text-gray-200 px-2 py-0.5 rounded flex items-center gap-1">
                              IP: {log.ipAddress || 'desconhecido'}
                              {log.ipAddress && (
                                <button onClick={() => copy(log.ipAddress!, 'IP')} title="Copiar IP">
                                  <Copy className="h-3 w-3" />
                                </button>
                              )}
                            </span>
                            {/* 4) Dispositivo (sempre exibir, com fallback) */}
                            <span className="bg-gray-800/80 text-gray-200 px-2 py-0.5 rounded flex items-center gap-1">
                              Dispositivo: {[log.deviceType, log.os, log.browser].filter(Boolean).join(' | ') || 'desconhecido'}
                            </span>
                          </div>
                        )}
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
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <span>Total: {logs.length} logs</span>
            <span>Filtrados: {filteredLogs.length} logs</span>
            {logsData?.data?.lastUpdate && (
              <span>
                Última atualização: {format(new Date(logsData.data.lastUpdate), 'HH:mm:ss', { locale: ptBR })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Sistema ativo</span>
          </div>
        </div>
      </div>
  );
};

export default AdminLogs;
