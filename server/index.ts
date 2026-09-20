import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import session from "express-session";
import passport from "passport";
import LocalStrategy from "passport-local";
import cors from "cors";
import bcrypt from "bcrypt";
import { registerRoutes } from "./routes";
import { registerAdvancedRoutes } from "./advanced-routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "./db";
import { logger } from "./utils/logger";
import { dbLogger } from "./utils/database-logger.js";
import { eq } from "drizzle-orm";
import { users } from "../shared/schema";
import { initializeRealtime } from "./realtime";

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://192.168.2.47:3001', 'http://localhost:3001', 'https://khaki-friends-add.loca.lt'],
  credentials: true
}));

// LocalTunnel bypass middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  // Set headers to bypass LocalTunnel warning page
  res.setHeader('bypass-tunnel-reminder', 'true');
  res.setHeader('User-Agent', 'SchoolManager-App/1.0');
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // set to true if using https
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
}));

// Passport configuration
passport.use(new LocalStrategy.Strategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email, password, done) => {
    try {
      console.log('🔐 Tentativa de login:', { email, password: '***' });
      
      // Usar SQL direto para buscar usuário
      const Database = (await import('better-sqlite3')).default;
      const path = (await import('path')).default;
      const dbPath = path.resolve(process.cwd(), 'server', 'school.db');
      const sqliteDb = new Database(dbPath);
      
      let user = null;
      try {
        const selectSql = 'SELECT * FROM users WHERE email = ? AND (status = ? OR status = ?)';
        user = sqliteDb.prepare(selectSql).get(email, 'active', 'online');
      } finally {
        sqliteDb.close();
      }
      
      if (!user) {
        console.log('❌ Usuário não encontrado:', email);
        return done(null, false, { message: 'Invalid credentials' });
      }
      
      // Verify password using bcrypt
       const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        console.log('❌ Senha incorreta para:', email);
        return done(null, false, { message: 'Invalid credentials' });
      }
      
      console.log('✅ Login bem-sucedido:', user.email, user.role);
      return done(null, user);
    } catch (error) {
      console.error('Passport strategy error:', error);
      return done(error);
    }
  }
));

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    // Usar SQL direto para buscar usuário
    const Database = (await import('better-sqlite3')).default;
    const path = (await import('path')).default;
    const dbPath = path.resolve(process.cwd(), 'server', 'school.db');
    const sqliteDb = new Database(dbPath);
    
    let user = null;
    try {
      const selectSql = 'SELECT * FROM users WHERE id = ?';
      user = sqliteDb.prepare(selectSql).get(id);
    } finally {
      sqliteDb.close();
    }
    
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      // NÃO mostrar logs de status no console principal
      if (!path.includes('/api/users/status')) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }

        log(logLine);
      }
      
      // Log para arquivo apenas erros e warnings
      if (res.statusCode >= 400) {
        // Se for erro de status, vai para terminal virtual
        if (path.includes('/api/users/status')) {
          console.log(`Status API Error: ${req.method} ${path} ${res.statusCode}`, {
            method: req.method,
            path,
            statusCode: res.statusCode,
            duration,
            response: capturedJsonResponse
          });
        } else {
          // Outros erros vão para log normal
          console.warn(`API Error: ${req.method} ${path} ${res.statusCode}`, {
            method: req.method,
            path,
            statusCode: res.statusCode,
            duration,
            response: capturedJsonResponse
          });
        }
      }
    }
  });

  next();
});

(async () => {
  // Health check endpoint (deve vir antes das outras rotas)
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      server: 'SchoolManager'
    });
  });

  // Register API routes first
  console.log('Registering API routes...');
  registerRoutes(app);
  registerAdvancedRoutes(app);
  console.log('API routes registered successfully');

  app.get('/assets/logo.png', async (_req: Request, res: Response) => {
    const pathMod = (await import('path')).default;
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = pathMod.dirname(__filename);
    const logoPath = pathMod.join(__dirname, '..', 'pngtree-school-logo-png-image_3977360.png');
    res.sendFile(logoPath);
  });

  app.get('/assets/logo-transparent.png', async (_req: Request, res: Response) => {
    const pathMod = (await import('path')).default;
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = pathMod.dirname(__filename);
    const logoPath = pathMod.join(__dirname, '..', 'logo-transparente.png');
    res.sendFile(logoPath);
  });

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Create HTTP server
  const server = createServer(app);

  // Initialize realtime system
  const realtimeManager = initializeRealtime(server);
  console.log('🔌 Sistema de tempo real inicializado');
  
  // Get port before logging
  const port = process.env.PORT || 3001;
  
  // Log sistema iniciado
  logger.systemStarted();
  dbLogger.success('SYSTEM_START', 'Sistema iniciado com sucesso', null, null, {
    port: port.toString(),
    environment: app.get("env"),
    timestamp: new Date().toISOString()
  });

  // Setup Vite in development mode
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Setup limpeza automática de logs (a cada 24 horas)
  setInterval(() => {
    try {
      // logger.cleanupOldLogs(); // Comentado temporariamente
    } catch (error) {
      console.error('Erro ao limpar logs antigos:', error);
    }
  }, 24 * 60 * 60 * 1000); // 24 horas

  // Start server
  server.listen(port, '0.0.0.0', () => {
    log(`serving on port ${port}`);
    console.log(`Servidor iniciado na porta ${port} - Acessível em todas as interfaces de rede`);
    console.log(`🌐 Acesse via: http://localhost:${port} ou http://192.168.2.47:${port}`);
  });
})();
