// Gerenciador de conexão para a instalação web e o aplicativo.

export class ConnectionManager {
  private static instance: ConnectionManager;
  private currentBaseUrl: string = '';
  private isConnected: boolean = false;
  private connectionType: 'global' | 'local' | 'dev' | 'unknown' = 'unknown';
  private lastConnectionCheck: number = 0;
  private connectionCheckInterval: number = 30000; // 30 segundos
  // O endereço público permanece disponível mesmo com o computador desligado.
  private readonly urls = [
    { url: 'https://schoolmanager-demo.onrender.com', type: 'global' as const },
    { url: 'http://localhost:3001', type: 'dev' as const }
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
        method: 'GET', signal: controller.signal, credentials: 'include'
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
    
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    if (currentOrigin.startsWith('http') &&
        !window.location.hostname.endsWith('.github.io')) {
      this.currentBaseUrl = currentOrigin;
      this.connectionType = 'global';
      this.isConnected = true;
      return currentOrigin;
    }
    for (const urlConfig of this.urls) {
      const isAvailable = await this.testConnection(urlConfig.url);
      if (isAvailable) {
        this.currentBaseUrl = urlConfig.url;
        this.connectionType = urlConfig.type;
        this.isConnected = true;
        console.log(`🎯 Usando URL: ${urlConfig.url} (Tipo: ${urlConfig.type})`);
        return urlConfig.url;
      }
    }
    
    // Deixar o servidor público como fallback quando ele estiver acordando.
    console.log('⚠️ Nenhuma conexão disponível, usando fallback');
    this.currentBaseUrl = this.urls[0].url;
    this.connectionType = 'unknown';
    this.isConnected = false;
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
      hasWarningPage: false
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
    if (!this.currentBaseUrl) await this.findBestConnection();
    try {
      const response = await fetch(`${this.currentBaseUrl}${endpoint}`, {
        ...options,
        credentials: 'include'
      });
      this.isConnected = true;
      // O chamador precisa receber 401 e outros erros HTTP para tratá-los.
      return response;
    } catch (error) {
      this.isConnected = false;
      throw error;
    }
  }
}

// Instância singleton
export const connectionManager = ConnectionManager.getInstance();
