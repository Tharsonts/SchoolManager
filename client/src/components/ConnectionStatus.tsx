import React, { useState, useEffect } from 'react';
import { connectionManager } from '@/lib/connectionManager';
import { Wifi, WifiOff, RefreshCw, Globe, Home, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const ConnectionStatus: React.FC = () => {
  const [connectionInfo, setConnectionInfo] = useState({
    connected: false,
    url: '',
    type: 'unknown' as 'global' | 'local' | 'dev' | 'unknown',
    lastCheck: 0
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const updateConnectionStatus = () => {
    const info = connectionManager.getConnectionInfo();
    setConnectionInfo(info);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await connectionManager.refreshConnection();
      updateConnectionStatus();
    } catch (error) {
      console.error('Erro ao atualizar conexão:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Inicializar conexão
    const initConnection = async () => {
      await connectionManager.findBestConnection();
      updateConnectionStatus();
    };

    initConnection();

    // Verificar conexão periodicamente
    const interval = setInterval(updateConnectionStatus, 5000); // 5 segundos para UI mais responsiva

    return () => clearInterval(interval);
  }, []);

  const getConnectionTypeInfo = () => {
    switch (connectionInfo.type) {
      case 'global':
        return { 
          type: 'Global', 
          color: 'bg-green-500', 
          icon: Globe,
          description: 'Acesso via LocalTunnel (qualquer internet)'
        };
      case 'local':
        return { 
          type: 'Local', 
          color: 'bg-blue-500', 
          icon: Home,
          description: 'Acesso via IP local (mesma rede)'
        };
      case 'dev':
        return { 
          type: 'Dev', 
          color: 'bg-purple-500', 
          icon: Monitor,
          description: 'Acesso via localhost (desenvolvimento)'
        };
      default:
        return { 
          type: 'Desconhecido', 
          color: 'bg-gray-500', 
          icon: WifiOff,
          description: 'Tipo de conexão não identificado'
        };
    }
  };

  const connectionTypeInfo = getConnectionTypeInfo();
  const StatusIcon = connectionInfo.connected ? Wifi : WifiOff;
  const TypeIcon = connectionTypeInfo.icon;

  const formatLastCheck = () => {
    if (!connectionInfo.lastCheck) return 'Nunca';
    const now = Date.now();
    const diff = now - connectionInfo.lastCheck;
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s atrás`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m atrás`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h atrás`;
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
      {/* Status da conexão */}
      <div className="flex items-center gap-2">
        <StatusIcon 
          className={`w-4 h-4 ${connectionInfo.connected ? 'text-green-400' : 'text-red-400'}`} 
        />
        <Badge 
          variant={connectionInfo.connected ? 'default' : 'destructive'}
          className={`${connectionInfo.connected ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'} border-0`}
        >
          {connectionInfo.connected ? 'Conectado' : 'Desconectado'}
        </Badge>
      </div>

      {/* Tipo de conexão */}
      <div className="flex items-center gap-1">
        <TypeIcon className="w-4 h-4 text-gray-300" />
        <Badge 
          variant="outline" 
          className={`${connectionTypeInfo.color}/20 text-white border-white/20`}
        >
          {connectionTypeInfo.type}
        </Badge>
      </div>

      {/* URL atual (truncada) */}
      <div className="text-xs text-gray-300 max-w-32 truncate" title={connectionInfo.url}>
        {connectionInfo.url || 'Nenhuma URL'}
      </div>

      {/* Última verificação */}
      <div className="text-xs text-gray-400">
        {formatLastCheck()}
      </div>

      {/* Botão de atualizar */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="h-6 w-6 p-0 hover:bg-white/10"
        title={connectionTypeInfo.description}
      >
        <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
};