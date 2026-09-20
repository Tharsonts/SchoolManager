import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
}

class Logger {
  private logDir: string;
  private maxLogSize: number = 1024 * 1024; // 1MB
  private maxLogFiles: number = 5;

  constructor() {
    // Usar fileURLToPath para ES modules
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  // Sanitize complex objects to avoid circular JSON errors
  private toSafeData(data?: any) {
    if (data == null) return data;
    const type = typeof data;
    if (type !== 'object') return data;

    // If it's an Express request object, extract safe fields only
    const isReqLike = (
      (data.method && (data.url || data.originalUrl)) ||
      (data.headers && (data.socket || data.connection))
    );
    if (isReqLike) {
      return {
        method: data.method,
        url: data.originalUrl || data.url,
        ip: data.ip || data.remoteAddress,
        userAgent: data.headers?.['user-agent'],
      };
    }

    // Generic circular-safe serializer
    const seen = new WeakSet();
    try {
      return JSON.parse(
        JSON.stringify(data, (_key, value) => {
          if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) return '[Circular]';
            seen.add(value);

            // Remove notoriously circular/heavy props
            if ('socket' in (value as any)) return '[Socket]';
            if ('parser' in (value as any)) return '[HTTPParser]';
          }
          if (typeof value === 'function') return `[Function]`;
          return value;
        })
      );
    } catch {
      return '[Unserializable]';
    }
  }

  private ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getLogFilePath(type: string): string {
    return path.join(this.logDir, `${type}.log`);
  }

  private rotateLogs(type: string) {
    const logFile = this.getLogFilePath(type);
    
    if (fs.existsSync(logFile)) {
      const stats = fs.statSync(logFile);
      
      if (stats.size > this.maxLogSize) {
        // Rotacionar logs antigos
        for (let i = this.maxLogFiles - 1; i > 0; i--) {
          const oldFile = path.join(this.logDir, `${type}.${i}.log`);
          const newFile = path.join(this.logDir, `${type}.${i + 1}.log`);
          
          if (fs.existsSync(oldFile)) {
            if (i === this.maxLogFiles - 1) {
              fs.unlinkSync(oldFile); // Deletar o mais antigo
            } else {
              fs.renameSync(oldFile, newFile);
            }
          }
        }
        
        // Renomear o arquivo atual
        fs.renameSync(logFile, path.join(this.logDir, `${type}.1.log`));
      }
    }
  }

  private writeLog(type: string, entry: LogEntry) {
    this.rotateLogs(type);
    
    const logFile = this.getLogFilePath(type);
    const safeEntry = { ...entry, data: this.toSafeData(entry.data) };
    const logLine = JSON.stringify(safeEntry) + '\n';
    
    fs.appendFileSync(logFile, logLine);
  }

  info(message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      data: this.toSafeData(data)
    };
    
    // Log para console apenas se for importante
    if (message.includes('ERROR') || message.includes('WARN') || message.includes('CRITICAL')) {
      console.log(`[${entry.timestamp}] INFO: ${message}`);
    }
    
    this.writeLog('app', entry);
  }

  warn(message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      data: this.toSafeData(data)
    };
    
    console.warn(`[${entry.timestamp}] WARN: ${message}`);
    this.writeLog('app', entry);
  }

  error(message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      data: this.toSafeData(data)
    };
    
    console.error(`[${entry.timestamp}] ERROR: ${message}`);
    this.writeLog('app', entry);
  }

  debug(message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'debug',
      message,
      data: this.toSafeData(data)
    };
    
    // Debug só vai para arquivo, não para console
    this.writeLog('debug', entry);
  }

  // Log específico para status (com menos frequência)
  status(message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      data: this.toSafeData(data)
    };
    
    // Status só vai para arquivo, não para console
    this.writeLog('status', entry);
  }

  // Terminal virtual para status - mostra apenas no arquivo
  statusTerminal(message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      data: this.toSafeData(data)
    };
    
    // Status vai para arquivo de terminal virtual
    this.writeLog('status-terminal', entry);
  }

  // Método para limpar logs antigos (pode ser chamado periodicamente)
  cleanupOldLogs() {
    const files = fs.readdirSync(this.logDir);
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias
    
    files.forEach(file => {
      const filePath = path.join(this.logDir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`Log antigo removido: ${file}`);
      }
    });
  }

  // Log padronizado de inicialização do sistema
  systemStarted() {
    const now = new Date();
    const payload = {
      startedAt: now.toISOString(),
      startedAtLocal: now.toLocaleString('pt-BR'),
      nodeVersion: process.version
    };
    this.status('SYSTEM_STARTED');
    this.info('Sistema iniciado com sucesso', payload);
  }

  // ====== MÉTODOS DE LOG DE AÇÕES (APIs utilizam estes) ======
  login(user: any, req?: any) {
    this.info('LOGIN', {
      userId: user?.id,
      email: user?.email,
      role: user?.role,
      ip: req?.ip,
      userAgent: req?.headers?.['user-agent']
    });
  }

  logout(user: any) {
    this.info('LOGOUT', { userId: user?.id, email: user?.email, role: user?.role });
  }

  profileUpdated(user: any, changes?: any) {
    this.info('PROFILE_UPDATED', { userId: user?.id, email: user?.email, changes: this.toSafeData(changes) });
  }

  passwordChanged(user: any) {
    this.warn('PASSWORD_CHANGED', { userId: user?.id, email: user?.email });
  }

  dashboardAccessed(user: any, context?: any) {
    this.status('DASHBOARD_ACCESSED', { userId: user?.id, role: user?.role, context });
  }

  activityCreated(user: any, activity?: any) {
    this.info('ACTIVITY_CREATED', { userId: user?.id, role: user?.role, activity });
  }

  activityGraded(user: any, grade?: any) {
    this.info('ACTIVITY_GRADED', { userId: user?.id, role: user?.role, grade });
  }

  activitySubmitted(user: any, submission?: any) {
    this.info('ACTIVITY_SUBMITTED', { userId: user?.id, role: user?.role, submission });
  }

  fileUploaded(user: any, file?: any) {
    this.info('FILE_UPLOADED', { userId: user?.id, role: user?.role, file });
  }

  materialCreated(user: any, material?: any) {
    this.info('MATERIAL_CREATED', { userId: user?.id, role: user?.role, material });
  }

  examCreated(user: any, exam?: any) {
    this.info('EXAM_CREATED', { userId: user?.id, role: user?.role, exam });
  }

  examCompleted(user: any, result?: any) {
    this.info('EXAM_COMPLETED', { userId: user?.id, role: user?.role, result });
  }

  gradeAdded(user: any, payload?: any) {
    this.info('GRADE_ADDED', { userId: user?.id, role: user?.role, payload });
  }

  chatAccessed(user: any, chatId?: any) {
    this.debug('CHAT_ACCESSED', { userId: user?.id, role: user?.role, chatId });
  }

  messageSent(user: any, message?: any) {
    this.debug('MESSAGE_SENT', { userId: user?.id, role: user?.role, message });
  }

  calendarUpdated(user: any, action?: string, req?: any) {
    this.info('CALENDAR_UPDATED', {
      userId: user?.id,
      role: user?.role,
      action,
      ip: req?.ip
    });
  }
}

export const logger = new Logger();