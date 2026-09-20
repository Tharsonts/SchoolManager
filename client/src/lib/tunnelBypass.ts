// Módulo para bypass automático da interface do LocalTunnel
export class TunnelBypass {
  private static instance: TunnelBypass;
  
  public static getInstance(): TunnelBypass {
    if (!TunnelBypass.instance) {
      TunnelBypass.instance = new TunnelBypass();
    }
    return TunnelBypass.instance;
  }

  // Detecta se estamos na página de aviso do LocalTunnel
  public isOnTunnelWarningPage(): boolean {
    if (typeof window === 'undefined') return false;
    
    const url = window.location.href;
    const title = document.title;
    const bodyText = document.body?.textContent || '';
    
    // Detectores da página de aviso do LocalTunnel
    const tunnelIndicators = [
      url.includes('loca.lt'),
      title.includes('localtunnel'),
      bodyText.includes('You are about to visit'),
      bodyText.includes('localtunnel'),
      bodyText.includes('Click to continue'),
      bodyText.includes('bypass-tunnel-reminder'),
      document.querySelector('button[onclick*="continue"]') !== null
    ];
    
    return tunnelIndicators.some(indicator => indicator);
  }

  // Bypass automático da página de aviso
  public async bypassTunnelWarning(): Promise<boolean> {
    if (!this.isOnTunnelWarningPage()) {
      return false;
    }

    console.log('🚀 Detectada página de aviso do LocalTunnel, fazendo bypass...');

    try {
      // Método 1: Procurar e clicar no botão "Continue"
      const continueButton = document.querySelector('button[onclick*="continue"]') as HTMLButtonElement;
      if (continueButton) {
        console.log('✅ Clicando no botão Continue...');
        continueButton.click();
        return true;
      }

      // Método 2: Procurar por link direto
      const directLink = document.querySelector('a[href*="bypass"]') as HTMLAnchorElement;
      if (directLink) {
        console.log('✅ Redirecionando via link direto...');
        window.location.href = directLink.href;
        return true;
      }

      // Método 3: Tentar bypass via JavaScript
      if (typeof (window as any).continueToSite === 'function') {
        console.log('✅ Executando função continueToSite...');
        (window as any).continueToSite();
        return true;
      }

      // Método 4: Manipular URL diretamente
      const currentUrl = window.location.href;
      if (currentUrl.includes('loca.lt') && !currentUrl.includes('bypass')) {
        const bypassUrl = currentUrl + (currentUrl.includes('?') ? '&' : '?') + 'bypass=true';
        console.log('✅ Redirecionando com parâmetro bypass...');
        window.location.href = bypassUrl;
        return true;
      }

      // Método 5: Forçar redirecionamento para a aplicação
      const appUrl = currentUrl.replace(/\?.*$/, '') + '/';
      if (appUrl !== currentUrl) {
        console.log('✅ Redirecionando para URL da aplicação...');
        window.location.href = appUrl;
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Erro no bypass do LocalTunnel:', error);
      return false;
    }
  }

  // Inicia o monitoramento automático
  public startAutoBypass(): void {
    if (typeof window === 'undefined') return;

    console.log('🔄 Iniciando monitoramento automático do LocalTunnel...');

    // Verificação imediata
    if (this.isOnTunnelWarningPage()) {
      setTimeout(() => this.bypassTunnelWarning(), 1000);
    }

    // Monitoramento contínuo
    const checkInterval = setInterval(() => {
      if (this.isOnTunnelWarningPage()) {
        this.bypassTunnelWarning().then(success => {
          if (success) {
            clearInterval(checkInterval);
          }
        });
      }
    }, 2000);

    // Observer para mudanças no DOM
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(() => {
        if (this.isOnTunnelWarningPage()) {
          setTimeout(() => this.bypassTunnelWarning(), 500);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    // Listener para mudanças de URL
    window.addEventListener('popstate', () => {
      setTimeout(() => {
        if (this.isOnTunnelWarningPage()) {
          this.bypassTunnelWarning();
        }
      }, 1000);
    });
  }

  // Injeta CSS para ocultar a interface do LocalTunnel
  public injectBypassCSS(): void {
    if (typeof document === 'undefined') return;

    const style = document.createElement('style');
    style.textContent = `
      /* Ocultar elementos da interface do LocalTunnel */
      body:has([onclick*="continue"]) {
        display: none !important;
      }
      
      /* Ocultar avisos específicos */
      div:contains("You are about to visit"),
      div:contains("localtunnel"),
      div:contains("Click to continue") {
        display: none !important;
      }
      
      /* Ocultar botões de aviso */
      button[onclick*="continue"] {
        display: none !important;
      }
      
      /* Mostrar apenas o conteúdo da aplicação */
      #root,
      .app,
      main {
        display: block !important;
        visibility: visible !important;
      }
    `;
    
    document.head.appendChild(style);
    console.log('🎨 CSS de bypass do LocalTunnel injetado');
  }
}

// Instância singleton
export const tunnelBypass = TunnelBypass.getInstance();

// Auto-inicialização quando o módulo é carregado
if (typeof window !== 'undefined') {
  // Aguardar o DOM estar pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      tunnelBypass.injectBypassCSS();
      tunnelBypass.startAutoBypass();
    });
  } else {
    tunnelBypass.injectBypassCSS();
    tunnelBypass.startAutoBypass();
  }
}