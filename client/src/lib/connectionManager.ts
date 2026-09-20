// Gerenciador de conexão híbrido para o app
import { alternativeTunnelManager, type TunnelProvider } from './alternativeTunnels';

export class ConnectionManager {
  private static instance: ConnectionManager;
  private currentBaseUrl: string = '';
  private isConnected: boolean = false;
  private connectionType: 'global' | 'local' | 'dev' | 'unknown' = 'unknown';
  private lastConnectionCheck: number = 0;
  private connectionCheckInterval: number = 30000; // 30 segundos
  private currentTunnelProvider: TunnelProvider | null = null;
  
  // URLs possíveis em ordem de prioridade (incluindo alternativas de túnel)
  private readonly urls = [
    { url: 'https://schoolmanager-demo.trycloudflare.com', type: 'global' as const }, // Cloudflare Tunnel
    { url: 'https://schoolmanager-demo.pinggy.io', type: 'global' as const },         // Pinggy
    { url: 'https://schoolmanager-demo.serveo.net', type: 'global' as const },        // Serveo
    { url: 'https://schoolmanager-demo.loca.lt', type: 'global' as const },           // LocalTunnel (fallback)
    { url: 'http://192.168.2.47:3001', type: 'local' as const },                     // IP local (mesma rede)
    { url: 'http://localhost:3001', type: 'dev' as const }                           // Localhost (desenvolvimento)
  ];

  private constructor() {
    // Inicializar detecção automática de conectividade
    this.startAutoConnectivityCheck();
  }

  public static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  // Inicia verificação automática de conectividade
  private startAutoConnectivityCheck(): void {
    // Verificar conectividade a cada intervalo definido
    setInterval(async () => {
      const now = Date.now();
      if (now - this.lastConnectionCheck > this.connectionCheckInterval) {
        console.log('🔄 Verificação automática de conectividade...');
        await this.findBestConnection();
      }
    }, this.connectionCheckInterval);

    // Verificar conectividade quando a rede muda (se disponível)
    if (typeof window !== 'undefined' && 'navigator' in window && 'onLine' in navigator) {
      window.addEventListener('online', async () => {
        console.log('🌐 Rede online detectada, verificando conectividade...');
        await this.findBestConnection();
      });

      window.addEventListener('offline', () => {
        console.log('📵 Rede offline detectada');
        this.isConnected = false;
        this.connectionType = 'unknown';
      });
    }
  }

  // Testa conectividade com uma URL
  private async testConnection(url: string): Promise<boolean> {
    try {
      console.log(`🔍 Testando conexão com: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
      
      const response = await fetch(`${url}/api/health`, {
        method: 'GET',
        headers: {
          'bypass-tunnel-reminder': 'true',
          'User-Agent': 'SchoolManager-App/1.0',
          'X-Bypass-Tunnel': 'true',
          'X-App-Source': 'mobile-app'
        },
        signal: controller.signal,
        credentials: 'include'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`✅ Conexão bem-sucedida com: ${url}`);
        return true;
      }
      
      console.log(`❌ Falha na conexão com: ${url} (Status: ${response.status})`);
      return false;
    } catch (error) {
      console.log(`❌ Erro ao conectar com: ${url}`, error);
      return false;
    }
  }

  // Encontra a melhor URL disponível
  public async findBestConnection(): Promise<string> {
    console.log('🚀 Iniciando busca pela melhor conexão...');
    this.lastConnectionCheck = Date.now();
    
    // Primeiro, tentar encontrar o melhor provedor de túnel
    const bestTunnelProvider = await alternativeTunnelManager.findBestProvider();
    if (bestTunnelProvider) {
      this.currentTunnelProvider = bestTunnelProvider;
      this.currentBaseUrl = bestTunnelProvider.url;
      this.connectionType = 'global';
      this.isConnected = true;
      
      console.log(`🎯 Usando ${bestTunnelProvider.name}: ${bestTunnelProvider.url}`);
      return this.currentBaseUrl;
    }
    
    // Fallback para URLs locais se nenhum túnel funcionar
    console.log('🔄 Testando conexões locais como fallback...');
    for (const urlConfig of this.urls.filter(u => u.type !== 'global')) {
      const isAvailable = await this.testConnection(urlConfig.url);
      if (isAvailable) {
        this.currentBaseUrl = urlConfig.url;
        this.connectionType = urlConfig.type;
        this.isConnected = true;
        console.log(`🎯 Usando URL: ${urlConfig.url} (Tipo: ${urlConfig.type})`);
        return urlConfig.url;
      }
    }
    
    // Se nenhuma URL funcionar, usar a primeira como fallback
    console.log('⚠️ Nenhuma conexão disponível, usando fallback');
    this.currentBaseUrl = this.urls[0].url;
    this.connectionType = 'unknown';
    this.isConnected = false;
    this.currentTunnelProvider = null;
    return this.currentBaseUrl;
  }

  // Retorna a URL base atual
  public getCurrentBaseUrl(): string {
    return this.currentBaseUrl;
  }

  // Verifica se está conectado
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Retorna o tipo de conexão atual
  public getConnectionType(): 'global' | 'local' | 'dev' | 'unknown' {
    return this.connectionType;
  }

  // Retorna informações detalhadas da conexão
  public getConnectionInfo(): {
    isConnected: boolean;
    url: string;
    type: string;
    lastCheck: number;
    tunnelProvider?: string;
    hasWarningPage?: boolean;
  } {
    return {
      isConnected: this.isConnected,
      url: this.currentBaseUrl,
      type: this.connectionType,
      lastCheck: this.lastConnectionCheck,
      tunnelProvider: this.currentTunnelProvider?.name,
      hasWarningPage: this.currentTunnelProvider?.hasWarningPage || false
    };
  }

  // Força uma nova verificação de conexão
  public async refreshConnection(): Promise<string> {
    console.log('🔄 Atualizando conexão...');
    return await this.findBestConnection();
  }

  // Método para fazer requisições com fallback automático
  public async makeRequest(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<Response> {
    const maxRetries = this.urls.length;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (!this.currentBaseUrl || attempt > 0) {
          await this.findBestConnection();
        }

        const url = `${this.currentBaseUrl}${endpoint}`;
        console.log(`📡 Fazendo requisição para: ${url} (Tipo: ${this.connectionType})`);

        const headers = {
          'bypass-tunnel-reminder': 'true',
          'User-Agent': 'SchoolManager-App/1.0',
          'X-Bypass-Tunnel': 'true',
          'X-App-Source': 'mobile-app',
          ...options.headers
        };

        const response = await fetch(url, {
          ...options,
          headers,
          credentials: 'include'
        });

        if (response.ok) {
          this.isConnected = true;
          return response;
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        console.log(`❌ Tentativa ${attempt + 1} falhou (${this.connectionType}):`, error);
        lastError = error as Error;
        
        // Se não é a última tentativa, tenta próxima URL
        if (attempt < maxRetries - 1) {
          this.isConnected = false;
          this.connectionType = 'unknown';
          continue;
        }
      }
    }

    // Se chegou aqui, todas as tentativas falharam
    this.isConnected = false;
    this.connectionType = 'unknown';
    throw lastError || new Error('Todas as tentativas de conexão falharam');
  }
}

// Instância singleton
export const connectionManager = ConnectionManager.getInstance();