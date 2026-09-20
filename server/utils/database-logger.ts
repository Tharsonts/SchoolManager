import { db } from '../db.js';
import { systemLogs } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';
// Geolocalização desativada por padrão; habilite com ENABLE_GEO=true
const GEO_ENABLED = process.env.ENABLE_GEO === 'true';

interface LogData {
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  action: string;
  description: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  code?: string;
}

class DatabaseLogger {
  // Sanitize complex data and avoid circular references
  private toSafeData(data?: any) {
    if (data == null) return data;
    if (typeof data !== 'object') return data;
    const seen = new WeakSet();
    try {
      return JSON.parse(
        JSON.stringify(data, (_k, v) => {
          if (typeof v === 'object' && v !== null) {
            if (seen.has(v)) return '[Circular]';
            seen.add(v);
            if ('socket' in (v as any)) return '[Socket]';
            if ('parser' in (v as any)) return '[HTTPParser]';
          }
          if (typeof v === 'function') return '[Function]';
          return v;
        })
      );
    } catch {
      return '[Unserializable]';
    }
  }

  private extractIp(req?: any): string | null {
    if (!req) return null;
    const xff = req?.headers?.['x-forwarded-for'];
    const candidate = Array.isArray(xff) ? xff[0] : (typeof xff === 'string' ? xff.split(',')[0] : undefined);
    return (candidate || req?.ip || null) as string | null;
  }

  private reqInfo(req?: any) {
    if (!req) return { ipAddress: null, rawIp: null, userAgent: null };
    let rawIp = this.extractIp(req);
    // Permitir override de IP em desenvolvimento para testes de geolocalização
    try {
      const devHeader = req?.headers?.['x-dev-ip'] || req?.headers?.['x-test-ip'];
      const devQuery = req?.query?.devIp || req?.query?.ip;
      if (process.env.NODE_ENV === 'development') {
        const candidate = (typeof devHeader === 'string' && devHeader.trim())
          ? String(devHeader).trim()
          : (typeof devQuery === 'string' && devQuery.trim()) ? String(devQuery).trim() : null;
        if (candidate) rawIp = candidate;
      }
    } catch {}
    // Exibir IP completo conforme solicitado; manter também rawIp para geo
    return {
      ipAddress: rawIp || req?.ip || null,
      rawIp,
      userAgent: req?.headers?.['user-agent'] || null,
    };
  }

  private async fetchGeoFromApi(ip?: string | null) {
    if (!ip) return null;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const url = `http://ip-api.com/json/${ip}?fields=status,message,country,region,regionName,city,lat,lon,timezone`;
      const useFetch = typeof fetch === 'function' ? fetch : (await import('node-fetch')).default as unknown as typeof fetch;
      const res = await useFetch(url, { signal: controller.signal } as any);
      clearTimeout(timeout);
      if (!res || !(res as any).ok) return null;
      const data: any = await (res as any).json();
      if (data.status !== 'success') return null;
      return {
        locationCity: data.city || null,
        locationRegion: data.regionName || data.region || null,
        locationCountry: data.country || null,
        latitude: data.lat ?? null,
        longitude: data.lon ?? null,
        timezone: data.timezone || null,
      };
    } catch {
      return null;
    }
  }

  private async lookupGeo(ip?: string | null) {
    if (!ip) return null;
    try {
      const g = geoip.lookup(ip);
      let result: any = null;
      if (g) {
        const [latitude, longitude] = Array.isArray(g.ll) ? g.ll : [undefined, undefined];
        result = {
          locationCity: g.city || null,
          locationRegion: g.region || null,
          locationCountry: g.country || null,
          latitude: latitude ?? null,
          longitude: longitude ?? null,
          timezone: null as string | null,
        };
      }
      // Se não há cidade via geoip-lite, tenta API externa
      if (!result || !result.locationCity) {
        const apiGeo = await this.fetchGeoFromApi(ip);
        if (apiGeo) return apiGeo;
      }
      return result;
    } catch {
      return null;
    }
  }

  // Método público para resolver geolocalização (usado nas rotas quando necessário)
  async resolveGeo(ip?: string | null) {
    return await this.lookupGeo(ip);
  }

  private parseUA(userAgent?: string | null) {
    if (!userAgent) return null;
    try {
      const parser = new UAParser(userAgent);
      const os = parser.getOS();
      const browser = parser.getBrowser();
      const device = parser.getDevice();
      return {
        deviceType: device?.type || null,
        os: os?.name || null,
        osVersion: os?.version || null,
        browser: browser?.name || null,
        browserVersion: browser?.version || null,
      };
    } catch {
      return null;
    }
  }
  
  async log(data: LogData & { rawIp?: string }) {
    try {
      const geo = GEO_ENABLED ? await this.lookupGeo(data.rawIp ?? data.ipAddress ?? null) : ({} as any);
      const dev = this.parseUA(data.userAgent ?? null) || {} as any;
      const logEntry = {
        id: nanoid(),
        timestamp: new Date().toISOString(),
        level: data.level,
        action: data.action,
        description: data.description,
        userId: data.userId || null,
        userName: data.userName || null,
        userRole: data.userRole || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        locationCity: geo.locationCity ?? null,
        locationRegion: geo.locationRegion ?? null,
        locationCountry: geo.locationCountry ?? null,
        latitude: geo.latitude ?? null,
        longitude: geo.longitude ?? null,
        timezone: geo.timezone ?? null,
        deviceType: dev.deviceType ?? null,
        os: dev.os ?? null,
        osVersion: dev.osVersion ?? null,
        browser: dev.browser ?? null,
        browserVersion: dev.browserVersion ?? null,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        code: data.code || null
      };

      await db.insert(systemLogs).values(logEntry);
      
      // Também log no console para debug
      console.log(`[${logEntry.timestamp}] ${logEntry.level}: ${logEntry.action} - ${logEntry.description}`);
      
    } catch (error) {
      console.error('Erro ao inserir log no banco:', error);
    }
  }

  async info(action: string, description: string, userOrUserId?: any, req?: any, metadata?: any) {
    const userId = typeof userOrUserId === 'string' ? userOrUserId : userOrUserId?.id;
    const userName = userOrUserId && typeof userOrUserId === 'object' ? `${userOrUserId.firstName ?? ''} ${userOrUserId.lastName ?? ''}`.trim() : undefined;
    const userRole = userOrUserId && typeof userOrUserId === 'object' ? userOrUserId.role : undefined;
    const { ipAddress, userAgent, rawIp } = this.reqInfo(req);

    await this.log({
      level: 'INFO',
      action,
      description,
      userId,
      userName,
      userRole,
      ipAddress,
      rawIp,
      userAgent,
      metadata: this.toSafeData(metadata)
    });
  }

  async warn(action: string, description: string, userOrUserId?: any, req?: any, metadata?: any) {
    const userId = typeof userOrUserId === 'string' ? userOrUserId : userOrUserId?.id;
    const userName = userOrUserId && typeof userOrUserId === 'object' ? `${userOrUserId.firstName ?? ''} ${userOrUserId.lastName ?? ''}`.trim() : undefined;
    const userRole = userOrUserId && typeof userOrUserId === 'object' ? userOrUserId.role : undefined;
    const { ipAddress, userAgent, rawIp } = this.reqInfo(req);

    await this.log({
      level: 'WARN',
      action,
      description,
      userId,
      userName,
      userRole,
      ipAddress,
      rawIp,
      userAgent,
      metadata: this.toSafeData(metadata)
    });
  }

  async error(action: string, description: string, userOrUserId?: any, req?: any, metadata?: any) {
    const userId = typeof userOrUserId === 'string' ? userOrUserId : userOrUserId?.id;
    const userName = userOrUserId && typeof userOrUserId === 'object' ? `${userOrUserId.firstName ?? ''} ${userOrUserId.lastName ?? ''}`.trim() : undefined;
    const userRole = userOrUserId && typeof userOrUserId === 'object' ? userOrUserId.role : undefined;
    const { ipAddress, userAgent, rawIp } = this.reqInfo(req);

    await this.log({
      level: 'ERROR',
      action,
      description,
      userId,
      userName,
      userRole,
      ipAddress,
      rawIp,
      userAgent,
      metadata: this.toSafeData(metadata)
    });
  }

  async success(action: string, description: string, userOrUserId?: any, req?: any, metadata?: any) {
    const userId = typeof userOrUserId === 'string' ? userOrUserId : userOrUserId?.id;
    const userName = userOrUserId && typeof userOrUserId === 'object' ? `${userOrUserId.firstName ?? ''} ${userOrUserId.lastName ?? ''}`.trim() : undefined;
    const userRole = userOrUserId && typeof userOrUserId === 'object' ? userOrUserId.role : undefined;
    const { ipAddress, userAgent, rawIp } = this.reqInfo(req);

    await this.log({
      level: 'SUCCESS',
      action,
      description,
      userId,
      userName,
      userRole,
      ipAddress,
      rawIp,
      userAgent,
      metadata: this.toSafeData(metadata)
    });
  }

  // Métodos específicos para ações do sistema
  async userLogin(user: any, req?: any) {
    const { ipAddress, userAgent, rawIp } = this.reqInfo(req);
    await this.log({
      level: 'INFO',
      action: 'USER_LOGIN',
      description: `Usuário ${user.firstName} ${user.lastName} fez login`,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userRole: user.role,
      ipAddress,
      rawIp,
      userAgent,
      code: 'AUTH-001'
    });
  }

  async userLogout(user: any) {
    await this.log({
      level: 'INFO',
      action: 'USER_LOGOUT',
      description: `Usuário ${user.firstName} ${user.lastName} fez logout`,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userRole: user.role,
      code: 'AUTH-002'
    });
  }

  async systemStart() {
    await this.log({
      level: 'SUCCESS',
      action: 'SYSTEM_START',
      description: 'Sistema iniciado com sucesso',
      metadata: {
        nodeVersion: process.version,
        startTime: new Date().toISOString()
      },
      code: 'SYS-001'
    });
  }

  async apiAccess(endpoint: string, method: string, user?: any, req?: any) {
    // Evitar ruído: ignorar endpoints de logs
    const ignore = [
      '/api/admin/logs/terminal',
      '/api/coordinator/logs/terminal',
      '/api/admin/logs',
      '/api/coordinator/logs'
    ];
    if (ignore.some(e => endpoint.includes(e))) return;
    const { ipAddress, userAgent, rawIp } = this.reqInfo(req);
    await this.log({
      level: 'INFO',
      action: 'API_ACCESS',
      description: `${method} ${endpoint}`,
      userId: user?.id,
      userName: user ? `${user.firstName} ${user.lastName}` : null,
      userRole: user?.role,
      ipAddress,
      rawIp,
      userAgent,
      metadata: {
        endpoint,
        method,
        timestamp: new Date().toISOString()
      }
    });
  }

  async dataChange(action: string, table: string, recordId: string, user?: any, oldData?: any, newData?: any) {
    await this.log({
      level: 'INFO',
      action: action.toUpperCase(),
      description: `${action} realizada na tabela ${table}`,
      userId: user?.id,
      userName: user ? `${user.firstName} ${user.lastName}` : null,
      userRole: user?.role,
      metadata: {
        table,
        recordId,
        oldData,
        newData,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Mascarar IP para privacidade
  private maskIP(ip?: string): string | null {
    if (!ip) return null;
    
    // Mascarar IP (ex: 192.168.1.100 -> 192.168.***.***) 
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***.**`;
    }
    
    return ip;
  }

  // Limpar logs antigos (manter apenas últimos 1000)
  async cleanupOldLogs() {
    try {
      const totalLogs = await db.select().from(systemLogs);
      
      if (totalLogs.length > 1000) {
        // Manter apenas os 1000 mais recentes
        const logsToDelete = totalLogs
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(1000);
        
        for (const log of logsToDelete) {
          await db.delete(systemLogs).where(eq(systemLogs.id, log.id));
        }
        
        console.log(`Limpeza de logs: ${logsToDelete.length} logs antigos removidos`);
      }
    } catch (error) {
      console.error('Erro na limpeza de logs:', error);
    }
  }
}

export const dbLogger = new DatabaseLogger();