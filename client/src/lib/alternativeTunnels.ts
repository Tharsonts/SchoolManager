// Módulo para gerenciar alternativas de túnel mais estáveis
export interface TunnelProvider {
  name: string;
  url: string;
  type: 'cloudflare' | 'pinggy' | 'serveo' | 'custom';
  priority: number;
  isActive: boolean;
  hasWarningPage: boolean;
}

export class AlternativeTunnelManager {
  private static instance: AlternativeTunnelManager;
  private providers: TunnelProvider[] = [];
  
  public static getInstance(): AlternativeTunnelManager {
    if (!AlternativeTunnelManager.instance) {
      AlternativeTunnelManager.instance = new AlternativeTunnelManager();
    }
    return AlternativeTunnelManager.instance;
  }

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Cloudflare Tunnel - Mais estável, sem página de aviso
    this.providers.push({
      name: 'Cloudflare Tunnel',
      url: 'https://schoolmanager-demo.trycloudflare.com', // URL exemplo
      type: 'cloudflare',
      priority: 1,
      isActive: false,
      hasWarningPage: false
    });

    // Pinggy.io - Alternativa gratuita sem página de aviso
    this.providers.push({
      name: 'Pinggy',
      url: 'https://schoolmanager-demo.pinggy.io', // URL exemplo
      type: 'pinggy',
      priority: 2,
      isActive: false,
      hasWarningPage: false
    });

    // Serveo - SSH-based, sem página de aviso
    this.providers.push({
      name: 'Serveo',
      url: 'https://schoolmanager-demo.serveo.net', // URL exemplo
      type: 'serveo',
      priority: 3,
      isActive: false,
      hasWarningPage: false
    });

    // LocalTunnel - Fallback com página de aviso
    this.providers.push({
      name: 'LocalTunnel',
      url: 'https://schoolmanager-demo.loca.lt',
      type: 'custom',
      priority: 4,
      isActive: true, // Atualmente ativo
      hasWarningPage: true
    });
  }

  // Testa conectividade com um provedor
  public async testProvider(provider: TunnelProvider): Promise<boolean> {
    try {
      console.log(`🔍 Testando ${provider.name}: ${provider.url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${provider.url}/api/health`, {
        method: 'GET',
        headers: {
          'User-Agent': 'SchoolManager-App/1.0',
          'X-App-Source': 'mobile-app'
        },
        signal: controller.signal,
        credentials: 'include'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`✅ ${provider.name} está funcionando`);
        return true;
      }
      
      console.log(`❌ ${provider.name} falhou (Status: ${response.status})`);
      return false;
    } catch (error) {
      console.log(`❌ Erro ao testar ${provider.name}:`, error);
      return false;
    }
  }

  // Encontra o melhor provedor disponível
  public async findBestProvider(): Promise<TunnelProvider | null> {
    console.log('🔄 Procurando melhor provedor de túnel...');
    
    // Ordenar por prioridade (menor número = maior prioridade)
    const sortedProviders = [...this.providers].sort((a, b) => a.priority - b.priority);
    
    for (const provider of sortedProviders) {
      const isWorking = await this.testProvider(provider);
      if (isWorking) {
        provider.isActive = true;
        // Desativar outros provedores
        this.providers.forEach(p => {
          if (p !== provider) p.isActive = false;
        });
        
        console.log(`🎯 Melhor provedor encontrado: ${provider.name}`);
        return provider;
      }
    }
    
    console.log('❌ Nenhum provedor de túnel está funcionando');
    return null;
  }

  // Retorna o provedor ativo atual
  public getActiveProvider(): TunnelProvider | null {
    return this.providers.find(p => p.isActive) || null;
  }

  // Retorna todos os provedores
  public getAllProviders(): TunnelProvider[] {
    return [...this.providers];
  }

  // Atualiza a URL de um provedor
  public updateProviderUrl(type: TunnelProvider['type'], newUrl: string): void {
    const provider = this.providers.find(p => p.type === type);
    if (provider) {
      provider.url = newUrl;
      console.log(`🔄 URL do ${provider.name} atualizada para: ${newUrl}`);
    }
  }

  // Adiciona um provedor customizado
  public addCustomProvider(name: string, url: string, hasWarningPage: boolean = false): void {
    const customProvider: TunnelProvider = {
      name,
      url,
      type: 'custom',
      priority: this.providers.length + 1,
      isActive: false,
      hasWarningPage
    };
    
    this.providers.push(customProvider);
    console.log(`➕ Provedor customizado adicionado: ${name}`);
  }

  // Gera instruções para configurar alternativas
  public generateSetupInstructions(): string {
    return `
# 🌐 ALTERNATIVAS AO LOCALTUNNEL

## 1. Cloudflare Tunnel (RECOMENDADO)
- ✅ Gratuito e sem página de aviso
- ✅ Mais estável que LocalTunnel
- ✅ HTTPS automático

### Instalação:
\`\`\`bash
# Instalar cloudflared
npm install -g cloudflared

# Criar túnel
cloudflared tunnel --url http://localhost:3001
\`\`\`

## 2. Pinggy.io
- ✅ Gratuito (60min por sessão)
- ✅ Sem página de aviso
- ✅ Suporte UDP/TCP

### Uso:
\`\`\`bash
ssh -p 443 -R0:localhost:3001 a.pinggy.io
\`\`\`

## 3. Serveo
- ✅ Gratuito
- ✅ SSH-based
- ✅ Sem página de aviso

### Uso:
\`\`\`bash
ssh -R 80:localhost:3001 serveo.net
\`\`\`

## 4. Configuração no App
Após escolher uma alternativa, atualize:
- \`capacitor.config.ts\` com a nova URL
- Execute \`npm run build && npx cap sync android\`
    `;
  }
}

// Instância singleton
export const alternativeTunnelManager = AlternativeTunnelManager.getInstance();