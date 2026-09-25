import express from "express";
import passport from "passport";
import { db } from "./db";
import { createClient } from '@libsql/client';
import { v4 as uuidv4 } from 'uuid';

const client = createClient({
  url: 'file:server/school.db',
});
import { logger } from "./utils/logger";
import { dbLogger } from "./utils/database-logger.js";
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { dirname } from 'path';
import Database from 'better-sqlite3';
import { getSqlite } from './sqlite';
import { 
  activities, 
  activitySubmissions, 
  activityFiles, 
  submissionFiles, 
  submissionHistory, 
  users,
  userRequests,
  subjects,
  classes,
  classSubjects,
  studentClass,
  grades,
  attendance,
  events,
  notifications,
  settings,
  messages,
  reports,
  systemLogs,
  materials,
  materialFiles,
  exams,
  examGrades,
  rubricEvaluations,
  activityRubrics,
  classSchedule,
  academicPeriods,
} from "../shared/schema";
import { eq, and, desc, asc, or, count, avg, sum, like, sql, inArray, ne, isNotNull, gte, lte, lt, gt } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import { getRealtimeManager } from "./realtime";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

// Definir __dirname para modulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Keep one database location in development and in the bundled production server.
const schoolDbPath = path.resolve(process.cwd(), 'server', 'school.db');

// Configuracao do Multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // maximo 5 arquivos
  },
  fileFilter: (req, file, cb) => {
    // Tipos de arquivo permitidos para submissA?es
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    const isValidMimeType = allowedTypes.includes(file.mimetype);
    const allowedExtensions = /jpeg|jpg|png|gif|pdf|doc|docx|txt|ppt|pptx/;
    const isValidExtension = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    
    if (isValidMimeType && isValidExtension) {
      return cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo nao permitido para submissA?es'));
    }
  }
});


export function registerRoutes(app: express.Application) {
  // Compatibilidade com bancos criados pelas primeiras versões do chat.
  // A coluna é necessária para contadores reais de mensagens não lidas.
  try {
    const sqlite = getSqlite();
    const messageColumns = sqlite.prepare('PRAGMA table_info(messages)').all() as Array<{ name: string }>;
    if (!messageColumns.some((column) => column.name === 'read')) sqlite.exec('ALTER TABLE messages ADD COLUMN read INTEGER NOT NULL DEFAULT 0');
  } catch (error) {
    console.warn('Não foi possível atualizar a estrutura de mensagens:', error);
  }
  // Middleware de autenticacao
  const isAuthenticated = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Not authenticated" });
  };

const hasRole = (roles: string[]) => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (!req.user || !roles.includes((req.user as any).role)) {
        // Log acesso negado
        if (req.user) {
          logger.accessDenied(req.user, req.path, req);
        }
        
        return res.status(403).json({ message: "Insufficient permissions" });
    }
      
      next();
};
};

  const getMasterAdminId = async (): Promise<string | null> => {
    try {
      const setting = await db
        .select()
        .from(settings)
        .where(eq(settings.key, 'masterAdminId'))
        .limit(1);
      if (setting.length > 0 && setting[0].value) return setting[0].value as string;
      const firstAdmin = await db
        .select()
        .from(users)
        .where(eq(users.role, 'admin'))
        .orderBy(asc(users.createdAt))
        .limit(1);
      return firstAdmin.length > 0 ? firstAdmin[0].id : null;
    } catch {
      return null;
    }
  };

  const isMasterAdmin = async (req: express.Request): Promise<boolean> => {
    const masterId = await getMasterAdminId();
    const currentId = (req.user as any)?.id;
    return !!masterId && !!currentId && masterId === currentId;
  };

  // ===== ROTAS DE AUTENTICAA?A?O =====
  
  app.get('/api/auth/user', isAuthenticated, (req, res) => {
    const user = req.user as any;
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      phone: user.phone,
      address: user.address,
      registrationNumber: user.registrationNumber,
      profileImageUrl: user.profileImageUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  });

  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Internal server error" });
      }
      
      if (!user) {
        // Log tentativa de login falhada
        console.log(`âŒ Login falhado para: ${req.body.email}`);
        dbLogger.warn('LOGIN_FAILED', `Tentativa de login falhada para: ${req.body.email}`, null, req);
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        
        // Log login bem-sucedido
        logger.login(user, req);
        dbLogger.info('LOGIN_SUCCESS', `Login bem-sucedido`, user.id, req, {
          userEmail: user.email,
          userRole: user.role,
          userName: `${user.firstName} ${user.lastName}`
        });
        
        res.json({
          message: "Login successful",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          }
        });
      });
    })(req, res, next);
  });

  app.post('/api/auth/logout', (req, res) => {
    const user = req.user as any;
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ message: "Error during logout" });
        }
        // Log logout
        if (user) {
          logger.logout(user, req);
          dbLogger.info('LOGOUT', `Logout realizado`, user.id, req, {
            userEmail: user.email,
            userRole: user.role,
            userName: `${user.firstName} ${user.lastName}`
          });
        }
        res.json({ message: "Logged out successfully" });
    });
  });

  app.get('/api/admin/capabilities', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const master = await isMasterAdmin(req);
      res.json({
        data: {
          canManageAdmins: master,
          canTransferDirector: master
        }
      });
    } catch {
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Criar solicitação de transferência de diretoria (apenas Admin Mestre)
  app.post('/api/admin/director/transfer/request', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const master = await isMasterAdmin(req);
      if (!master) {
        return res.status(403).json({ message: 'Apenas o Admin Mestre pode solicitar transferência' });
      }
      const { newDirectorId, demoteRole = 'coordinator', confirmText } = req.body as { newDirectorId: string; demoteRole?: string; confirmText?: string };
      if (!newDirectorId) return res.status(400).json({ message: 'Novo diretor obrigatório' });
      if ((confirmText || '').trim().toLowerCase() !== 'transferir') return res.status(400).json({ message: "Digite 'transferir' para confirmar" });

      const allowedDemoteRoles = ['coordinator', 'admin', 'teacher'];
      if (!allowedDemoteRoles.includes(demoteRole)) {
        return res.status(400).json({ message: 'Papel para rebaixamento inválido' });
      }

      const now = new Date().toISOString();
      const adminRows = await db.select({ id: users.id }).from(users).where(eq(users.role, 'admin'));
      const requiredAdminIds = adminRows.map((a: any) => a.id).filter(Boolean);
      const requestPayload = {
        id: uuidv4(),
        newDirectorId,
        demoteRole,
        requestedBy: (req.user as any)?.id,
        status: 'pending',
        approvals: [],
        approvalsCount: 0,
        requiredAdminIds,
        requiredCount: requiredAdminIds.length,
        createdAt: now,
        updatedAt: now
      };

      const existing = await db
        .select()
        .from(settings)
        .where(eq(settings.key, 'pendingDirectorTransfer'))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(settings)
          .set({ value: JSON.stringify(requestPayload), updatedAt: now, updatedBy: (req.user as any)?.id })
          .where(eq(settings.id, existing[0].id));
      } else {
        await db.insert(settings).values({
          id: uuidv4(),
          key: 'pendingDirectorTransfer',
          value: JSON.stringify(requestPayload),
          description: 'Solicitação pendente de transferência de diretoria',
          category: 'security',
          updatedBy: (req.user as any)?.id,
          createdAt: now,
          updatedAt: now
        });
      }

      await dbLogger.info('DIRECTOR_TRANSFER_REQUEST', 'Solicitação de transferência de diretoria criada', (req.user as any)?.id, req, requestPayload);
      res.status(201).json({ message: 'Solicitação criada', data: requestPayload });
    } catch (error: any) {
      console.error('Erro ao criar solicitação de transferência:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Listar solicitação pendente (admins)
  app.get('/api/admin/director/transfer/pending', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const rows = await db
        .select()
        .from(settings)
        .where(eq(settings.key, 'pendingDirectorTransfer'))
        .limit(1);
      if (rows.length === 0) return res.json({ data: null });
      const payload = JSON.parse(rows[0].value);
      if (payload?.status && payload.status !== 'pending') {
        return res.json({ data: null });
      }
      res.json({ data: payload });
    } catch (error: any) {
      console.error('Erro ao buscar solicitação de transferência:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Aprovar solicitação de transferência (admins comuns)
  app.post('/api/admin/director/transfer/approve', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, 'admin'));
      const { confirmText } = req.body as { confirmText?: string };
      if ((confirmText || '').trim().toLowerCase() !== 'transferir') return res.status(400).json({ message: "Digite 'transferir' para confirmar" });

      const rows = await db
        .select()
        .from(settings)
        .where(eq(settings.key, 'pendingDirectorTransfer'))
        .limit(1);
      if (rows.length === 0) return res.status(404).json({ message: 'Nenhuma solicitação pendente' });
      const requestPayload = JSON.parse(rows[0].value);

      const approverId = (req.user as any)?.id;
      const approvals: string[] = Array.isArray(requestPayload.approvals) ? requestPayload.approvals : [];
      const requiredAdminIds: string[] = Array.isArray(requestPayload.requiredAdminIds) && requestPayload.requiredAdminIds.length > 0 ? requestPayload.requiredAdminIds : admins.map((a: any) => a.id);
      const requiredCount = requiredAdminIds.length;
      if (approvals.includes(approverId)) {
        const remaining = Math.max(requiredCount - approvals.length, 0);
        return res.status(200).json({ message: remaining > 0 ? `Aprovação já registrada, aguardando mais ${remaining}` : 'Transferência já aprovada' , data: { approvalsCount: approvals.length, requiredCount } });
      }
      approvals.push(approverId);
      const approvalsCount = approvals.length;
      const now = new Date().toISOString();
      const updatedPending = { ...requestPayload, approvals, approvalsCount, requiredAdminIds, requiredCount, updatedAt: now };
      if (approvalsCount < requiredCount) {
        await db.update(settings).set({ value: JSON.stringify(updatedPending) }).where(eq(settings.id, rows[0].id));
        return res.status(200).json({ message: `Aprovação registrada, aguardando mais ${requiredCount - approvalsCount}`, data: { approvalsCount, requiredCount } });
      }

      const { newDirectorId, demoteRole } = requestPayload as { newDirectorId: string; demoteRole: string };

      // Executar transferência (cópia do endpoint de transferência)
      const candidate = await db.select().from(users).where(eq(users.id, newDirectorId)).limit(1);
      if (candidate.length === 0) return res.status(404).json({ message: 'Usuário não encontrado' });
      if (candidate[0].status === 'inactive') return res.status(400).json({ message: 'Usuário inativo não pode ser diretor' });

      const allowedDemoteRoles = ['coordinator', 'admin', 'teacher'];
      if (!allowedDemoteRoles.includes(demoteRole)) {
        return res.status(400).json({ message: 'Papel para rebaixamento inválido' });
      }

      const currentDirector = await db.select().from(users).where(eq(users.role, 'director')).limit(1);

      if (currentDirector.length > 0 && currentDirector[0].id === newDirectorId) {
        return res.status(200).json({ message: 'Usuário já é diretor', data: { previousDirectorId: currentDirector[0].id, newDirectorId } });
      }

      if (currentDirector.length > 0) {
        const prev = currentDirector[0];
        await db.update(users).set({ role: demoteRole, updatedAt: now }).where(eq(users.id, prev.id));
        await dbLogger.info('DIRECTOR_DEMOTED', 'Diretor anterior rebaixado', (req.user as any)?.id, req, { previousDirectorId: prev.id, demoteRole });
        await dbLogger.dataChange('update', 'users', prev.id, req.user as any, { role: 'director' }, { role: demoteRole, updatedAt: now });
      }

      const appliedAt = new Date().toISOString();
      await db.update(users).set({ role: 'director', updatedAt: appliedAt }).where(eq(users.id, newDirectorId));
      await dbLogger.success('DIRECTOR_TRANSFER_APPROVED', 'Solicitação aprovada e diretoria transferida', (req.user as any)?.id, req, { newDirectorId, approverId: (req.user as any)?.id, approvalsCount });
      await dbLogger.dataChange('update', 'users', newDirectorId, req.user as any, { role: candidate[0].role }, { role: 'director', updatedAt: appliedAt });

      await db.update(settings).set({ value: JSON.stringify({ ...updatedPending, status: 'approved', updatedAt: appliedAt }) }).where(eq(settings.id, rows[0].id));

      res.json({ message: 'Transferência aprovada e aplicada', data: { newDirectorId, previousDirectorId: currentDirector[0]?.id || null, approvalsCount, requiredCount } });
    } catch (error: any) {
      console.error('Erro ao aprovar transferência:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  app.post('/api/admin/director/transfer/cancel', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const master = await isMasterAdmin(req);
      if (!master) {
        return res.status(403).json({ message: 'Apenas o Admin Mestre pode cancelar a transferência' });
      }

      const rows = await db
        .select()
        .from(settings)
        .where(eq(settings.key, 'pendingDirectorTransfer'))
        .limit(1);

      if (rows.length === 0) return res.status(404).json({ message: 'Nenhuma solicitação pendente' });

      const requestPayload = JSON.parse(rows[0].value);
      if (requestPayload.status && requestPayload.status !== 'pending') {
        return res.status(400).json({ message: 'Solicitação já processada' });
      }

      const now = new Date().toISOString();
      const cancelled = { ...requestPayload, status: 'cancelled', updatedAt: now };
      await db.update(settings).set({ value: JSON.stringify(cancelled), updatedAt: now, updatedBy: (req.user as any)?.id }).where(eq(settings.id, rows[0].id));

      await dbLogger.warn('DIRECTOR_TRANSFER_CANCELLED', 'Solicitação de transferência cancelada', (req.user as any)?.id, req, cancelled);
      res.json({ message: 'Solicitação de transferência cancelada com sucesso', data: cancelled });
    } catch (error: any) {
      console.error('Erro ao cancelar transferência:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  app.post('/api/admin/user/promotion/request', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const master = await isMasterAdmin(req);
      if (!master) {
        return res.status(403).json({ message: 'Apenas o Admin Mestre pode solicitar promoção' });
      }
      const { userId, newRole, confirmText } = req.body as { userId: string; newRole: string; confirmText?: string };
      if (!userId) return res.status(400).json({ message: 'Usuário obrigatório' });
      if ((confirmText || '').trim().toLowerCase() !== 'transferir') return res.status(400).json({ message: "Digite 'transferir' para confirmar" });
      const allowedRoles = ['coordinator', 'admin', 'teacher'];
      if (!allowedRoles.includes(newRole)) {
        return res.status(400).json({ message: 'Papel inválido' });
      }
      const candidate = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (candidate.length === 0) return res.status(404).json({ message: 'Usuário não encontrado' });
      if (candidate[0].role === 'student') return res.status(400).json({ message: 'Aluno não pode ser promovido aqui' });
      const now = new Date().toISOString();
      const adminRows = await db.select({ id: users.id }).from(users).where(eq(users.role, 'admin'));
      const requiredAdminIds = adminRows.map((a: any) => a.id).filter(Boolean);
      const payload = {
        id: uuidv4(),
        userId,
        newRole,
        requestedBy: (req.user as any)?.id,
        status: 'pending',
        requiredAdminIds,
        requiredCount: requiredAdminIds.length,
        approvals: [],
        approvalsCount: 0,
        createdAt: now,
        updatedAt: now
      };
      const existing = await db.select().from(settings).where(eq(settings.key, 'pendingUserPromotion')).limit(1);
      if (existing.length > 0) {
        await db.update(settings).set({ value: JSON.stringify(payload), updatedAt: now, updatedBy: (req.user as any)?.id }).where(eq(settings.id, existing[0].id));
      } else {
        await db.insert(settings).values({
          id: uuidv4(),
          key: 'pendingUserPromotion',
          value: JSON.stringify(payload),
          description: 'Solicitação pendente de promoção de usuário',
          category: 'security',
          updatedBy: (req.user as any)?.id,
          createdAt: now,
          updatedAt: now
        });
      }
      await dbLogger.info('USER_PROMOTION_REQUEST', 'Solicitação de promoção criada', (req.user as any)?.id, req, payload);
      res.status(201).json({ message: 'Solicitação criada', data: payload });
    } catch (error: any) {
      console.error('Erro ao criar solicitação de promoção:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  app.get('/api/admin/user/promotion/pending', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const rows = await db.select().from(settings).where(eq(settings.key, 'pendingUserPromotion')).limit(1);
      if (rows.length === 0) return res.json({ data: null });
      const payload = JSON.parse(rows[0].value);
      if (payload?.status && payload.status !== 'pending') {
        return res.json({ data: null });
      }
      res.json({ data: payload });
    } catch (error: any) {
      console.error('Erro ao buscar solicitação de promoção:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  app.post('/api/admin/user/promotion/approve', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, 'admin'));
      const { confirmText } = req.body as { confirmText?: string };
      if ((confirmText || '').trim().toLowerCase() !== 'transferir') return res.status(400).json({ message: "Digite 'transferir' para confirmar" });
      const rows = await db.select().from(settings).where(eq(settings.key, 'pendingUserPromotion')).limit(1);
      if (rows.length === 0) return res.status(404).json({ message: 'Nenhuma solicitação pendente' });
      const payload = JSON.parse(rows[0].value);
      const approverId = (req.user as any)?.id;
      const approvals: string[] = Array.isArray(payload.approvals) ? payload.approvals : [];
      const requiredAdminIds: string[] = Array.isArray(payload.requiredAdminIds) && payload.requiredAdminIds.length > 0 ? payload.requiredAdminIds : admins.map((a: any) => a.id);
      const requiredCount = requiredAdminIds.length;
      if (approvals.includes(approverId)) {
        const remaining = Math.max(requiredCount - approvals.length, 0);
        return res.status(200).json({ message: remaining > 0 ? `Aprovação já registrada, aguardando mais ${remaining}` : 'Promoção já aprovada' , data: { approvalsCount: approvals.length, requiredCount } });
      }
      approvals.push(approverId);
      const approvalsCount = approvals.length;
      const { userId, newRole } = payload as { userId: string; newRole: string };
      const candidate = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (candidate.length === 0) return res.status(404).json({ message: 'Usuário não encontrado' });
      if (candidate[0].status === 'inactive') return res.status(400).json({ message: 'Usuário inativo não pode ser promovido' });
      const allowedRoles = ['coordinator', 'admin', 'teacher'];
      if (!allowedRoles.includes(newRole)) {
        return res.status(400).json({ message: 'Papel inválido' });
      }
      const now = new Date().toISOString();
      if (approvalsCount < requiredCount) {
        const updatedPending = { ...payload, approvals, approvalsCount, requiredAdminIds, requiredCount, updatedAt: now };
        await db.update(settings).set({ value: JSON.stringify(updatedPending) }).where(eq(settings.id, rows[0].id));
        return res.status(200).json({ message: `Aprovação registrada, aguardando mais ${requiredCount - approvalsCount}`, data: { approvalsCount, requiredCount } });
      }
      await db.update(users).set({ role: newRole, updatedAt: now }).where(eq(users.id, userId));
      await dbLogger.success('USER_PROMOTION_APPROVED', 'Solicitação aprovada e promoção aplicada', (req.user as any)?.id, req, { userId, newRole });
      await dbLogger.dataChange('update', 'users', userId, req.user as any, { role: candidate[0].role }, { role: newRole, updatedAt: now });

      if (candidate[0].role === 'teacher' && newRole !== 'teacher') {
        try {
          await db
            .update(classSubjects)
            .set({ teacherId: null, status: 'inactive', updatedAt: now })
            .where(eq(classSubjects.teacherId, userId));

          await db
            .update(classSchedule)
            .set({ teacherId: null, updatedAt: now })
            .where(eq(classSchedule.teacherId, userId));

          await db
            .update(activities)
            .set({ teacherId: null, status: 'archived', updatedAt: now })
            .where(eq(activities.teacherId, userId));

          await dbLogger.info('USER_LINKS_REMOVED_ON_ROLE_CHANGE', 'Vínculos de professor removidos ao mudar cargo', (req.user as any)?.id, req, { userId });
        } catch (e: any) {
          await dbLogger.warn('USER_LINKS_REMOVE_FAILED', 'Falha ao remover vínculos ao mudar cargo', (req.user as any)?.id, req, { userId, error: e?.message });
        }
      }
      await db.update(settings).set({ value: JSON.stringify({ ...payload, approvals, approvalsCount, requiredAdminIds, requiredCount, status: 'approved', updatedAt: now }) }).where(eq(settings.id, rows[0].id));
      res.json({ message: 'Promoção aprovada e aplicada', data: { userId, newRole, approvalsCount, requiredCount } });
    } catch (error: any) {
      console.error('Erro ao aprovar promoção:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // ===== ROTAS DE PERFIL =====

  app.get('/api/profile/avatar/:fileName', isAuthenticated, (req, res) => {
    const fileName = path.basename(req.params.fileName);
    const filePath = path.resolve(__dirname, '../uploads', fileName);
    if (!fs.existsSync(filePath)) return res.status(404).end();
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.sendFile(filePath);
  });

  app.post('/api/profile/avatar', isAuthenticated, upload.single('avatar'), async (req, res) => {
    const user = req.user as any;
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'Selecione uma imagem.' });
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.mimetype) || file.size > 5 * 1024 * 1024) {
      try { fs.unlinkSync(file.path); } catch { /* arquivo já removido */ }
      return res.status(400).json({ message: 'Use uma imagem JPG, PNG ou GIF de até 5 MB.' });
    }
    const profileImageUrl = `/api/profile/avatar/${file.filename}`;
    const previous = String(user.profileImageUrl || '');
    await client.execute({ sql: 'UPDATE users SET profileImageUrl = ?, updatedAt = ? WHERE id = ?', args: [profileImageUrl, new Date().toISOString(), user.id] });
    if (previous.startsWith('/api/profile/avatar/')) {
      const previousPath = path.resolve(__dirname, '../uploads', path.basename(previous));
      try { if (fs.existsSync(previousPath)) fs.unlinkSync(previousPath); } catch { /* troca continua válida */ }
    }
    res.json({ message: 'Foto de perfil atualizada.', profileImageUrl });
  });

  app.get('/api/profile/recovery-contact', isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const result = await client.execute({ sql: 'SELECT value FROM settings WHERE key = ? LIMIT 1', args: [`recovery-contact:${user.id}`] });
    let contact = { email: '', phone: '' };
    try { if (result.rows[0]?.value) contact = { ...contact, ...JSON.parse(String(result.rows[0].value)) }; } catch { /* registro antigo inválido */ }
    res.json({ data: contact });
  });

  app.put('/api/profile/recovery-contact', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const email = String(req.body.email || '').trim().toLowerCase();
      const phone = String(req.body.phone || '').replace(/\D/g, '');
      if (!email && !phone) return res.status(400).json({ message: 'Cadastre pelo menos um e-mail pessoal ou telefone.' });
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'E-mail de recuperação inválido.' });
      if (phone && (phone.length < 10 || phone.length > 13)) return res.status(400).json({ message: 'Telefone de recuperação inválido.' });
      const now = new Date().toISOString();
      const key = `recovery-contact:${user.id}`;
      await client.execute({
        sql: `INSERT INTO settings (id, key, value, description, category, updatedBy, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, 'security', ?, ?, ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedBy = excluded.updatedBy, updatedAt = excluded.updatedAt`,
        args: [crypto.randomUUID(), key, JSON.stringify({ email, phone }), 'Contato pessoal para recuperação de senha', user.id, now, now],
      });
      res.json({ message: 'Contato de recuperação salvo.', data: { email, phone } });
    } catch (error) {
      console.error('Erro ao salvar contato de recuperação:', error);
      res.status(500).json({ message: 'Erro ao salvar contato de recuperação.' });
    }
  });
  
  // Atualizar perfil do usuï¿½rio
  app.put('/api/profile', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { firstName, lastName, email, phone, address, dateOfBirth, bio } = req.body;
      
      console.log('ðŸ“ Atualizando perfil do usuÃ¡rio:', user.id);
      console.log('ðŸ“ Dados recebidos:', { firstName, lastName, email, phone, address, dateOfBirth, bio });
      
      // Validar campos obrigatÃ³rios
      if (!firstName || !lastName || !email) {
        console.log('âŒ Campos obrigatÃ³rios nÃ£o preenchidos');
        return res.status(400).json({ message: "Nome, sobrenome e email sÃ£o obrigatÃ³rios" });
      }
      
      // Verificar se o email jÃ¡ existe (exceto para o prÃ³prio usuÃ¡rio)
      const existingUser = await db
        .select()
        .from(users)
        .where(and(eq(users.email, email), ne(users.id, user.id)))
        .limit(1);
      
      if (existingUser.length > 0) {
        console.log('âŒ Email jÃ¡ existe:', email);
        return res.status(400).json({ message: "Este email jÃ¡ estÃ¡ em uso" });
      }
      
      // Atualizar usuÃ¡rio
      await db
        .update(users)
        .set({
          firstName,
          lastName,
          email,
          phone: phone || null,
          address: address || null,
          dateOfBirth: dateOfBirth || null,
          bio: bio || null,
          updatedAt: new Date().toISOString()
        })
        .where(eq(users.id, user.id));
      
      console.log('âœ… Perfil atualizado com sucesso');
      
      // Log atualizaÃ§Ã£o de perfil
      logger.profileUpdated(user, req);
      dbLogger.info('PROFILE_UPDATE', `Perfil atualizado`, user.id, req, {
        updatedFields: { firstName, lastName, email, phone, address, dateOfBirth, bio }
      });
      
      res.json({ message: "Perfil atualizado com sucesso" });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      dbLogger.error('PROFILE_UPDATE_ERROR', `Erro ao atualizar perfil: ${error.message}`, req.user?.id, req);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Alterar senha do usuï¿½rio
  app.put('/api/profile/password', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { currentPassword, newPassword } = req.body;
      
      console.log('?? Alteraï¿½ï¿½o de senha solicitada por:', user.email);
      console.log('?? Dados recebidos:', { 
        currentPassword: currentPassword ? '***' : 'vazio',
        newPassword: newPassword ? '***' : 'vazio',
        newPasswordLength: newPassword?.length || 0
      });
      
      if (!currentPassword || !newPassword) {
        console.log('? Campos obrigatï¿½rios nï¿½o preenchidos');
        return res.status(400).json({ message: "Senha atual e nova senha sï¿½o obrigatï¿½rias" });
      }
      
      if (newPassword.length < 8) {
        console.log('? Nova senha muito curta:', newPassword.length);
        return res.status(400).json({ message: "A nova senha deve ter pelo menos 8 caracteres" });
      }
      
      // Verificar senha atual
      const bcrypt = await import('bcryptjs');
      console.log('?? Verificando senha atual...');
      console.log('?? Hash atual no banco:', user.password?.substring(0, 20) + '...');
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      
      console.log('?? Resultado da verificaï¿½ï¿½o:', isCurrentPasswordValid);
      
      if (!isCurrentPasswordValid) {
        console.log('? Senha atual incorreta');
        return res.status(400).json({ message: "Senha atual incorreta" });
      }
      
      console.log('? Senha atual vï¿½lida, gerando hash da nova senha...');
      // Hash da nova senha
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      
      console.log('?? Atualizando senha no banco de dados...');
      // Atualizar senha
      await db
        .update(users)
        .set({
          password: hashedNewPassword,
          updatedAt: new Date().toISOString()
        })
        .where(eq(users.id, user.id));
      
      // Verificar se a senha foi realmente atualizada
      const updatedUser = await db
        .select({ password: users.password })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);
      
      console.log('?? Verificando se a senha foi atualizada...');
      console.log('?? Novo hash no banco:', updatedUser[0]?.password?.substring(0, 20) + '...');
      
      if (updatedUser[0]?.password === hashedNewPassword) {
        console.log('? Senha alterada com sucesso para:', user.email);
        // Log alteraï¿½ï¿½o de senha
        logger.passwordChanged(user, req);
        res.json({ message: "Senha alterada com sucesso" });
      } else {
        console.log('? Erro: Senha nï¿½o foi atualizada no banco');
        res.status(500).json({ message: "Erro ao atualizar senha no banco de dados" });
      }
    } catch (error) {
      console.error('? Erro ao alterar senha:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== ROTAS DE PERFIL DO COORDENADOR =====
  
  // Atualizar perfil do coordenador
  app.put('/api/coordinator/profile', isAuthenticated, hasRole(['coordinator']), async (req, res) => {
    try {
      const user = req.user as any;
      const { firstName, lastName, email, phone, address, dateOfBirth, bio } = req.body;
      
      // Validar campos obrigatï¿½rios
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: "Nome, sobrenome e email sï¿½o obrigatï¿½rios" });
      }
      
      // Verificar se o email jï¿½ existe (exceto para o prï¿½prio usuï¿½rio)
      const existingUser = await db
        .select()
        .from(users)
        .where(and(eq(users.email, email), ne(users.id, user.id)))
        .limit(1);
      
      if (existingUser.length > 0) {
        return res.status(400).json({ message: "Este email jï¿½ estï¿½ em uso" });
      }
      
      // Atualizar usuï¿½rio
      await db
        .update(users)
        .set({
          firstName,
          lastName,
          email,
          phone: phone || null,
          address: address || null,
          dateOfBirth: dateOfBirth || null,
          bio: bio || null,
          updatedAt: new Date().toISOString()
        })
        .where(eq(users.id, user.id));
      
      // Log atualizaï¿½ï¿½o de perfil
      logger.profileUpdated(user, req);
      
      res.json({ message: "Perfil atualizado com sucesso" });
    } catch (error) {
      console.error('Erro ao atualizar perfil do coordenador:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Alterar senha do coordenador
  app.put('/api/coordinator/profile/password', isAuthenticated, hasRole(['coordinator']), async (req, res) => {
    try {
      const user = req.user as any;
      const { currentPassword, newPassword } = req.body;
      
      console.log('?? Alteraï¿½ï¿½o de senha do coordenador solicitada por:', user.email);
      console.log('?? Dados recebidos:', { 
        currentPassword: currentPassword ? '***' : 'vazio',
        newPassword: newPassword ? '***' : 'vazio',
        newPasswordLength: newPassword?.length || 0
      });
      
      if (!currentPassword || !newPassword) {
        console.log('? Campos obrigatï¿½rios nï¿½o preenchidos');
        return res.status(400).json({ message: "Senha atual e nova senha sï¿½o obrigatï¿½rias" });
      }
      
      if (newPassword.length < 8) {
        console.log('? Nova senha muito curta:', newPassword.length);
        return res.status(400).json({ message: "A nova senha deve ter pelo menos 8 caracteres" });
      }
      
      // Verificar senha atual
      const bcrypt = await import('bcryptjs');
      console.log('?? Verificando senha atual...');
      console.log('?? Hash atual no banco:', user.password?.substring(0, 20) + '...');
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      
      console.log('?? Resultado da verificaï¿½ï¿½o:', isCurrentPasswordValid);
      
      if (!isCurrentPasswordValid) {
        console.log('? Senha atual incorreta');
        return res.status(400).json({ message: "Senha atual incorreta" });
      }
      
      console.log('? Senha atual vï¿½lida, gerando hash da nova senha...');
      // Hash da nova senha
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      
      console.log('?? Atualizando senha no banco de dados...');
      // Atualizar senha
      await db
        .update(users)
        .set({
          password: hashedNewPassword,
          updatedAt: new Date().toISOString()
        })
        .where(eq(users.id, user.id));
      
      // Verificar se a senha foi realmente atualizada
      const updatedUser = await db
        .select({ password: users.password })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);
      
      console.log('?? Verificando se a senha foi atualizada...');
      console.log('?? Novo hash no banco:', updatedUser[0]?.password?.substring(0, 20) + '...');
      
      if (updatedUser[0]?.password === hashedNewPassword) {
        console.log('? Senha do coordenador alterada com sucesso para:', user.email);
        // Log alteraï¿½ï¿½o de senha
        logger.passwordChanged(user, req);
        res.json({ message: "Senha alterada com sucesso" });
      } else {
        console.log('? Erro: Senha nï¿½o foi atualizada no banco');
        res.status(500).json({ message: "Erro ao atualizar senha no banco de dados" });
      }
    } catch (error) {
      console.error('? Erro ao alterar senha do coordenador:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== ROTAS DE PERFIL DO PROFESSOR =====
  
  // Atualizar perfil do professor
  app.put('/api/teacher/profile', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const user = req.user as any;
      const { firstName, lastName, email, phone, address, dateOfBirth, bio } = req.body;
      
      // Validar campos obrigatï¿½rios
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: "Nome, sobrenome e email sï¿½o obrigatï¿½rios" });
      }
      
      // Verificar se o email jï¿½ existe (exceto para o prï¿½prio usuï¿½rio)
      const existingUser = await db
        .select()
        .from(users)
        .where(and(eq(users.email, email), ne(users.id, user.id)))
        .limit(1);
      
      if (existingUser.length > 0) {
        return res.status(400).json({ message: "Este email jï¿½ estï¿½ em uso" });
      }
      
      // Atualizar usuï¿½rio
      await db
        .update(users)
        .set({
          firstName,
          lastName,
          email,
          phone: phone || null,
          address: address || null,
          dateOfBirth: dateOfBirth || null,
          bio: bio || null,
          updatedAt: new Date().toISOString()
        })
        .where(eq(users.id, user.id));
      
      // Log atualizaï¿½ï¿½o de perfil
      logger.profileUpdated(user, req);
      
      res.json({ message: "Perfil atualizado com sucesso" });
    } catch (error) {
      console.error('Erro ao atualizar perfil do professor:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Alterar senha do professor
  app.put('/api/teacher/profile/password', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const user = req.user as any;
      const { currentPassword, newPassword } = req.body;
      
      console.log('?? Alteraï¿½ï¿½o de senha do professor solicitada por:', user.email);
      console.log('?? Dados recebidos:', { 
        currentPassword: currentPassword ? '***' : 'vazio',
        newPassword: newPassword ? '***' : 'vazio',
        newPasswordLength: newPassword?.length || 0
      });
      
      if (!currentPassword || !newPassword) {
        console.log('? Campos obrigatï¿½rios nï¿½o preenchidos');
        return res.status(400).json({ message: "Senha atual e nova senha sï¿½o obrigatï¿½rias" });
      }
      
      if (newPassword.length < 8) {
        console.log('? Nova senha muito curta:', newPassword.length);
        return res.status(400).json({ message: "A nova senha deve ter pelo menos 8 caracteres" });
      }
      
      // Verificar senha atual
      const bcrypt = await import('bcryptjs');
      console.log('?? Verificando senha atual...');
      console.log('?? Hash atual no banco:', user.password?.substring(0, 20) + '...');
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      
      console.log('?? Resultado da verificaï¿½ï¿½o:', isCurrentPasswordValid);
      
      if (!isCurrentPasswordValid) {
        console.log('? Senha atual incorreta');
        return res.status(400).json({ message: "Senha atual incorreta" });
      }
      
      console.log('? Senha atual vï¿½lida, gerando hash da nova senha...');
      // Hash da nova senha
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      
      console.log('?? Atualizando senha no banco de dados...');
      // Atualizar senha
      await db
        .update(users)
        .set({
          password: hashedNewPassword,
          updatedAt: new Date().toISOString()
        })
        .where(eq(users.id, user.id));
      
      // Verificar se a senha foi realmente atualizada
      const updatedUser = await db
        .select({ password: users.password })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);
      
      console.log('?? Verificando se a senha foi atualizada...');
      console.log('?? Novo hash no banco:', updatedUser[0]?.password?.substring(0, 20) + '...');
      
      if (updatedUser[0]?.password === hashedNewPassword) {
        console.log('? Senha do professor alterada com sucesso para:', user.email);
        // Log alteraï¿½ï¿½o de senha
        logger.passwordChanged(user, req);
        res.json({ message: "Senha alterada com sucesso" });
      } else {
        console.log('? Erro: Senha nï¿½o foi atualizada no banco');
        res.status(500).json({ message: "Erro ao atualizar senha no banco de dados" });
      }
    } catch (error) {
      console.error('? Erro ao alterar senha do professor:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== ROTAS DE PERFIL DO ALUNO =====
  
  // Atualizar perfil do aluno
  app.put('/api/student/profile', isAuthenticated, hasRole(['student']), async (req, res) => {
    try {
      const user = req.user as any;
      const { firstName, lastName, email, phone, address, dateOfBirth, bio } = req.body;
      
      // Validar campos obrigatï¿½rios
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: "Nome, sobrenome e email sï¿½o obrigatï¿½rios" });
      }
      
      // Verificar se o email jï¿½ existe (exceto para o prï¿½prio usuï¿½rio)
      const existingUser = await db
        .select()
        .from(users)
        .where(and(eq(users.email, email), ne(users.id, user.id)))
        .limit(1);
      
      if (existingUser.length > 0) {
        return res.status(400).json({ message: "Este email jï¿½ estï¿½ em uso" });
      }
      
      // Atualizar usuï¿½rio
      await db
        .update(users)
        .set({
          firstName,
          lastName,
          email,
          phone: phone || null,
          address: address || null,
          dateOfBirth: dateOfBirth || null,
          bio: bio || null,
          updatedAt: new Date().toISOString()
        })
        .where(eq(users.id, user.id));
      
      // Log atualizaï¿½ï¿½o de perfil
      logger.profileUpdated(user, req);
      
      res.json({ message: "Perfil atualizado com sucesso" });
    } catch (error) {
      console.error('Erro ao atualizar perfil do aluno:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Alterar senha do aluno
  app.put('/api/student/profile/password', isAuthenticated, hasRole(['student']), async (req, res) => {
    try {
      const user = req.user as any;
      const { currentPassword, newPassword } = req.body;
      
      console.log('?? Alteraï¿½ï¿½o de senha do aluno solicitada por:', user.email);
      console.log('?? Dados recebidos:', { 
        currentPassword: currentPassword ? '***' : 'vazio',
        newPassword: newPassword ? '***' : 'vazio',
        newPasswordLength: newPassword?.length || 0
      });
      
      if (!currentPassword || !newPassword) {
        console.log('? Campos obrigatï¿½rios nï¿½o preenchidos');
        return res.status(400).json({ message: "Senha atual e nova senha sï¿½o obrigatï¿½rias" });
      }
      
      if (newPassword.length < 8) {
        console.log('? Nova senha muito curta:', newPassword.length);
        return res.status(400).json({ message: "A nova senha deve ter pelo menos 8 caracteres" });
      }
      
      // Verificar senha atual
      const bcrypt = await import('bcryptjs');
      console.log('?? Verificando senha atual...');
      console.log('?? Hash atual no banco:', user.password?.substring(0, 20) + '...');
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      
      console.log('?? Resultado da verificaï¿½ï¿½o:', isCurrentPasswordValid);
      
      if (!isCurrentPasswordValid) {
        console.log('? Senha atual incorreta');
        return res.status(400).json({ message: "Senha atual incorreta" });
      }
      
      console.log('? Senha atual vï¿½lida, gerando hash da nova senha...');
      // Hash da nova senha
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      
      console.log('?? Atualizando senha no banco de dados...');
      // Atualizar senha
      await db
        .update(users)
        .set({
          password: hashedNewPassword,
          updatedAt: new Date().toISOString()
        })
        .where(eq(users.id, user.id));
      
      // Verificar se a senha foi realmente atualizada
      const updatedUser = await db
        .select({ password: users.password })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);
      
      console.log('?? Verificando se a senha foi atualizada...');
      console.log('?? Novo hash no banco:', updatedUser[0]?.password?.substring(0, 20) + '...');
      
      if (updatedUser[0]?.password === hashedNewPassword) {
        console.log('? Senha do aluno alterada com sucesso para:', user.email);
        // Log alteraï¿½ï¿½o de senha
        logger.passwordChanged(user, req);
        res.json({ message: "Senha alterada com sucesso" });
      } else {
        console.log('? Erro: Senha nï¿½o foi atualizada no banco');
        res.status(500).json({ message: "Erro ao atualizar senha no banco de dados" });
      }
    } catch (error) {
      console.error('? Erro ao alterar senha do aluno:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== ROTAS DE USUA?RIOS =====
  
  // Buscar usuario por ID (DEVE vir ANTES da rota /api/users)
  // Buscar usuarios para chat (busca por nome/email) - DEVE VIR ANTES da rota /:id
  app.get('/api/users/search', isAuthenticated, async (req, res) => {
    try {
      const { query } = req.query as { query?: string };
      console.log('[CHAT] /api/users/search called with query =', query);
      console.log('[CHAT] User authenticated:', (req.user as any)?.email);
      
      if (!query || query.length < 2) {
        console.log('[CHAT] Query too short, returning empty');
        return res.status(200).json({ data: [] });
      }

      // Usar conexÃ£o Ãºnica e otimizada
      const sqliteDb = getSqlite();
      {
        const q = `%${query.toLowerCase()}%`;
        const currentUserId = (req.user as any)?.id;
        console.log('[CHAT] Current user ID:', currentUserId);
        console.log('[CHAT] Search pattern:', q);
        
          // Query ultra-otimizada com UNION para mÃ¡xima performance - APENAS USUARIOS ATIVOS (EXCLUIR ADMIN)
          const rows = sqliteDb.prepare(`
            SELECT DISTINCT id, email, firstName, lastName, role, profileImageUrl
            FROM (
              SELECT id, email, firstName, lastName, role, profileImageUrl, 1 as priority
              FROM users
              WHERE id != ? AND firstName LIKE ? COLLATE NOCASE AND status = 'active' AND role != 'admin'
              UNION ALL
              SELECT id, email, firstName, lastName, role, profileImageUrl, 2 as priority
              FROM users
              WHERE id != ? AND lastName LIKE ? COLLATE NOCASE AND status = 'active' AND role != 'admin'
              UNION ALL
              SELECT id, email, firstName, lastName, role, profileImageUrl, 3 as priority
              FROM users
              WHERE id != ? AND email LIKE ? COLLATE NOCASE AND status = 'active' AND role != 'admin'
            )
            ORDER BY priority, firstName
            LIMIT 5
          `).all(currentUserId, q, currentUserId, q, currentUserId, q);

        console.log('[CHAT] Raw SQL results:', rows.length, 'rows');
        console.log('[CHAT] Results:', rows.map(r => `${r.firstName} ${r.lastName} (${r.email})`));
        return res.status(200).json({ data: rows });
      }
    } catch (error) {
      console.error('Erro ao buscar usuarios (raw sqlite):', error);
      return res.status(200).json({ data: [] });
    }
  });

  // Buscar professores para o coordenador (DEVE VIR ANTES DE /api/users/:id)
  app.get('/api/users/teachers', isAuthenticated, hasRole(['coordinator', 'admin']), async (req, res) => {
    try {
      const teachers = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
          status: users.status
        })
        .from(users)
        .where(eq(users.role, 'teacher'));

      // Transformar dados para corresponder ï¿½ interface
      const transformedTeachers = teachers.map(teacher => ({
        id: teacher.id,
        name: `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || 'Nome nï¿½o informado',
        email: teacher.email,
        role: teacher.role,
        status: teacher.status === 'active' ? 'ativo' : 'inativo',
        createdAt: teacher.createdAt
      }));

      console.log(`????? Coordenador acessou professores - ${transformedTeachers.length} encontrados`);

      res.json(transformedTeachers);

    } catch (error) {
      console.error('? Erro ao buscar professores para coordenador:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get('/api/users/status', isAuthenticated, async (req, res) => {
    try {
      const ids = typeof req.query.ids === 'string' ? req.query.ids : '';
      const userIds = ids
        .split(',')
        .map(id => id.trim())
        .filter(Boolean);

      if (userIds.length === 0) {
        return res.json({
          success: true,
          data: []
        });
      }

      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

      const userStatuses = await db
        .select({
          id: users.id,
          status: users.status,
          lastSeen: users.lastSeen,
          firstName: users.firstName,
          lastName: users.lastName
        })
        .from(users)
        .where(inArray(users.id, userIds));

      const data = userStatuses.map(user => {
        if (!user.lastSeen) {
          return { ...user, currentStatus: 'offline' };
        }

        const lastSeen = new Date(user.lastSeen);

        if (lastSeen >= fiveMinutesAgo) {
          return { ...user, currentStatus: 'online' };
        }

        if (lastSeen >= thirtyMinutesAgo) {
          return { ...user, currentStatus: 'away' };
        }

        return { ...user, currentStatus: 'offline' };
      });

      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Erro ao buscar status dos usuarios:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get('/api/users/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      
      const user = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          profileImageUrl: users.profileImageUrl,
          status: users.status
        })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (user.length === 0) {
        return res.status(404).json({ message: "Usuario nao encontrado" });
      }

      res.json(user[0]);
    } catch (error) {
      console.error('Erro ao buscar usuario:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Listar usuarios
  app.get('/api/users', isAuthenticated, hasRole(['admin', 'coordinator']), async (req, res) => {
    try {
      const { role, status, search } = req.query;
      
      let whereConditions = [];
      
      if (role && role !== 'all') {
        whereConditions.push(eq(users.role, role as any));
      }
      
      if (status && status !== 'all') {
        whereConditions.push(eq(users.status, status as any));
      }
      
      if (search) {
        whereConditions.push(
          or(
            like(users.firstName, `%${search}%`),
            like(users.lastName, `%${search}%`),
            like(users.email, `%${search}%`)
          )
        );
      }
      
      const allUsers = await db
        .select()
        .from(users)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(asc(users.firstName));
      
      res.json(allUsers);
    } catch (error) {
      console.error('Erro ao buscar usuarios:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Criar usuario
  app.post('/api/users', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        role,
        phone,
        address,
        birthDate,
        registrationNumber,
        classId
      } = req.body;

      if (!email || !password || !firstName || !lastName || !role) {
        return res.status(400).json({ message: "Campos obrigatorios nao preenchidos" });
      }

      // Criar usuï¿½rio com status 'pendente' (sem email e senha ainda)
      const toIsoBirth = (bd?: string) => {
        const fallback = '2000-01-01';
        if (!bd || typeof bd !== 'string' || bd.trim().length === 0) return fallback;
        const s = bd.trim();
        if (s.includes('/')) {
          const parts = s.split('/');
          if (parts.length === 3) {
            const dd = String(parts[0]).padStart(2, '0');
            const mm = String(parts[1]).padStart(2, '0');
            const yyyy = String(parts[2]);
            if (Number(dd) && Number(mm) && Number(yyyy)) return `${yyyy}-${mm}-${dd}`;
          }
        }
        const d = new Date(s as any);
        if (!isNaN(d.getTime())) {
          const dd = String(d.getDate()).padStart(2, '0');
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const yyyy = String(d.getFullYear());
          return `${yyyy}-${mm}-${dd}`;
        }
        return fallback;
      };
      const birthDateFinal = toIsoBirth(birthDate);
      const newUser = {
        id: uuidv4(),
        firstName,
        lastName,
        email: null, // Nï¿½o criar email ainda
        password: null, // Nï¿½o criar senha ainda
        role,
        status: 'pendente' as const,
        phone: phone || null,
        address: address || null,
        birthDate: birthDateFinal,
        registrationNumber: registrationNumber || uuidv4().slice(0, 8).toUpperCase(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Usar SQL direto com better-sqlite3 para evitar problemas com Drizzle ORM
      const Database = (await import('better-sqlite3')).default;
      const path = (await import('path')).default;
      const dbPath = schoolDbPath;
      const sqliteDb = new Database(dbPath);
      
      try {
        const cols = sqliteDb.prepare(`PRAGMA table_info(users)`).all();
        const hasBirthDate = Array.isArray(cols) && cols.some((r: any) => String(r.name || '').toLowerCase() === 'birthdate');
        const insertSql = hasBirthDate
          ? `INSERT INTO users (id, email, password, firstName, lastName, profileImageUrl, role, status, lastSeen, phone, address, birthDate, registrationNumber, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          : `INSERT INTO users (id, email, password, firstName, lastName, profileImageUrl, role, status, lastSeen, phone, address, registrationNumber, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const stmt = sqliteDb.prepare(insertSql);
        if (hasBirthDate) {
          stmt.run(
            newUser.id,
            newUser.email,
            newUser.password,
            newUser.firstName,
            newUser.lastName,
            null,
            newUser.role,
            newUser.status,
            null,
            newUser.phone,
            newUser.address,
            newUser.birthDate,
            newUser.registrationNumber,
            newUser.createdAt,
            newUser.updatedAt
          );
        } else {
          stmt.run(
            newUser.id,
            newUser.email,
            newUser.password,
            newUser.firstName,
            newUser.lastName,
            null,
            newUser.role,
            newUser.status,
            null,
            newUser.phone,
            newUser.address,
            newUser.registrationNumber,
            newUser.createdAt,
            newUser.updatedAt
          );
        }
        
        console.log("? Usuï¿½rio criado com status 'pendente': " + newUser.id);
        
        // Log criaÃ§Ã£o de usuÃ¡rio
        const currentUser = req.user as any;
        dbLogger.info('USER_CREATE', `UsuÃ¡rio criado: ${firstName} ${lastName}`, currentUser?.id, req, {
          newUserId: newUser.id,
          newUserRole: role,
          newUserEmail: email,
          newUserRegistration: newUser.registrationNumber,
          createdBy: currentUser?.email
        });
      } finally {
        sqliteDb.close();
      }

      // Se for aluno, matricular na turma
      if (role === 'student' && classId) {
        const enrollment = {
          id: uuidv4(),
          studentId: newUser.id,
          classId: classId,
          enrollmentDate: new Date().toISOString(),
          status: 'pendente' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Usar SQL direto para matricular aluno
        const Database = (await import('better-sqlite3')).default;
        const path = (await import('path')).default;
        const dbPath = schoolDbPath;
        const sqliteDb = new Database(dbPath);
        
        try {
          const insertEnrollmentSql = `
            INSERT INTO studentClass (
              id, studentId, classId, enrollmentDate, status, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `;
          
          const stmt = sqliteDb.prepare(insertEnrollmentSql);
          stmt.run(
            enrollment.id,
            enrollment.studentId,
            enrollment.classId,
            enrollment.enrollmentDate,
            enrollment.status,
            enrollment.createdAt,
            enrollment.updatedAt
          );
        } finally {
          sqliteDb.close();
        }
        console.log("? Aluno matriculado na turma: " + classId);
      }

      console.log(`? Usuário criado com status '${newUser.status}': ${newUser.id}`);
      console.log("?? Nome: " + firstName + " " + lastName);
      console.log("?? Funï¿½ï¿½o: " + role);
      console.log("?? Matrï¿½cula: " + newUser.registrationNumber);
      console.log("? Aguardando aprovaï¿½ï¿½o do diretor para ativar login");

      res.status(201).json({
        message: "Usuï¿½rio criado com sucesso",
        data: {
          id: newUser.id,
          email: email,
          registrationNumber: newUser.registrationNumber,
          status: 'pendente',
          message: 'Aguardando aprovaï¿½ï¿½o do diretor para ativar login'
        }
      });
    } catch (error) {
      console.error('Erro ao criar usuario:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // GET /api/student/test - Teste simples para verificar autenticacao
  app.get('/api/student/test', isAuthenticated, hasRole(['student']), async (req, res) => {
    try {
      const user = req.user;
      console.log("Teste de autenticacao para: " + user.firstName + " " + user.lastName);
      console.log("ID do usuario: " + user.id);
      
      res.json({
        message: "Teste de autenticacao funcionando",
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Erro no teste de autenticacao:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });


  // GET /api/student/subjects - Buscar disciplinas da turma do aluno
  app.get('/api/student/subjects', isAuthenticated, hasRole(['student']), async (req, res) => {
    try {
      const user = req.user;
      console.log("Buscando disciplinas da turma para aluno: " + user.firstName + " " + user.lastName);

      // Buscar turma do aluno
      const studentClassInfo = await db
        .select({
          classId: studentClass.classId,
          enrollmentDate: studentClass.enrollmentDate,
          status: studentClass.status
        })
        .from(studentClass)
        .where(
          and(
            eq(studentClass.studentId, user.id),
            eq(studentClass.status, 'active')
          )
        );

      if (studentClassInfo.length === 0) {
        return res.status(404).json({ message: "Aluno nao esta matriculado em nenhuma turma" });
      }

      const classId = studentClassInfo[0].classId;

      // Buscar disciplinas da turma
      const subjectsData = await db
        .select({
          id: subjects.id,
          name: subjects.name,
          code: subjects.code,
          description: subjects.description
        })
        .from(subjects)
        .innerJoin(classSubjects, eq(subjects.id, classSubjects.subjectId))
        .where(
          and(
            eq(classSubjects.classId, classId),
            eq(classSubjects.status, 'active')
          )
        );

      console.log("Encontradas " + subjectsData.length + " disciplinas para o aluno");

      res.json({ data: subjectsData });
    } catch (error) {
      console.error('Erro ao buscar disciplinas da turma:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // GET /api/student/class-info - Buscar informacA?es da turma do aluno
  app.get('/api/student/class-info', isAuthenticated, hasRole(['student']), async (req, res) => {
    try {
      const user = req.user;
      console.log("Informacoes da turma solicitadas por: " + user.firstName + " " + user.lastName);
      console.log("ID do usuario: " + user.id);

      // Buscar turma do aluno
      const studentClassInfo = await db
        .select({
          classId: studentClass.classId,
          enrollmentDate: studentClass.enrollmentDate,
          status: studentClass.status
        })
        .from(studentClass)
        .where(and(
          eq(studentClass.studentId, user.id),
          eq(studentClass.status, 'active')
        ))
        .limit(1);

      console.log("Resultado da query:", studentClassInfo);

      if (studentClassInfo.length === 0) {
        return res.status(404).json({ message: "Aluno nao esta matriculado em nenhuma turma" });
      }

      const classId = studentClassInfo[0].classId;
      console.log("ID da turma encontrada: " + classId);

      // Buscar informacA?es da turma
      const classInfo = await db
        .select({
          id: classes.id,
          name: classes.name,
          grade: classes.grade,
          section: classes.section,
          academicYear: classes.academicYear,
          capacity: classes.capacity
        })
        .from(classes)
        .where(eq(classes.id, classId))
        .limit(1);

      console.log("Informacoes da turma:", classInfo);

      if (classInfo.length === 0) {
        return res.status(404).json({ message: "Turma nao encontrada" });
      }

      console.log("Turma encontrada: " + classInfo[0].name);

      // Buscar professores da turma
      let teachers = [];
      try {
        teachers = await db
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            phone: users.phone,
            subjectName: subjects.name,
            subjectCode: subjects.code
          })
          .from(classSubjects)
          .innerJoin(users, eq(classSubjects.teacherId, users.id))
          .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
          .where(and(
            eq(classSubjects.classId, classId),
            eq(classSubjects.status, 'active')
          ));
        console.log("Professores encontrados: " + teachers.length);
      } catch (teacherError) {
        console.error('Erro ao buscar professores:', teacherError);
        teachers = [];
      }

      // Buscar colegas de turma
      let classmates = [];
      try {
        classmates = await db
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            registrationNumber: users.registrationNumber
          })
          .from(studentClass)
          .innerJoin(users, eq(studentClass.studentId, users.id))
          .where(and(
            eq(studentClass.classId, classId),
            eq(studentClass.status, 'active'),
            ne(studentClass.studentId, user.id) // Excluir o proprio aluno
          ));
        console.log("Colegas encontrados: " + classmates.length);
      } catch (classmateError) {
        console.error('Erro ao buscar colegas:', classmateError);
        classmates = [];
      }

      // Contar total de alunos
      let totalStudents = 0;
      try {
        const totalStudentsResult = await db
          .select({ count: sql`count(*)` })
          .from(studentClass)
          .where(and(
            eq(studentClass.classId, classId),
            eq(studentClass.status, 'active')
          ));
        totalStudents = totalStudentsResult[0].count;
        console.log("Total de alunos: " + totalStudents);
      } catch (countError) {
        console.error('Erro ao contar alunos:', countError);
        totalStudents = classmates.length + 1; // +1 para incluir o proprio aluno
      }

      res.json({
        data: {
          class: classInfo[0],
          teachers,
          classmates,
          totalStudents,
          enrollmentDate: studentClassInfo[0].enrollmentDate
        }
      });
    } catch (error) {
      console.error('Erro ao buscar informacA?es da turma:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // POST /api/admin/enroll-student - Matricular aluno em turma (temporario)
  app.post('/api/admin/enroll-student', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const { studentEmail, className } = req.body;
      
      console.log("Matriculando aluno " + studentEmail + " na turma " + className);
      
      // Buscar aluno
      const student = await db
        .select()
        .from(users)
        .where(eq(users.email, studentEmail))
        .limit(1);
      
      if (student.length === 0) {
        return res.status(404).json({ message: "Aluno nao encontrado" });
      }
      
      // Buscar turma
      const classInfo = await db
        .select()
        .from(classes)
        .where(eq(classes.name, className))
        .limit(1);
      
      if (classInfo.length === 0) {
        return res.status(404).json({ message: "Turma nao encontrada" });
      }
      
      // Verificar se ja esta matriculado
      const existingEnrollment = await db
        .select()
        .from(studentClass)
        .where(eq(studentClass.studentId, student[0].id))
        .limit(1);
      
      if (existingEnrollment.length > 0) {
        // Atualizar matricula
        await db
          .update(studentClass)
          .set({
            classId: classInfo[0].id,
            updatedAt: new Date().toISOString()
          })
          .where(eq(studentClass.studentId, student[0].id));
        
        console.log("Matricula atualizada: " + student[0].firstName + " na turma " + className);
      } else {
        // Criar nova matricula
        const enrollment = {
          id: uuidv4(),
          studentId: student[0].id,
          classId: classInfo[0].id,
          enrollmentDate: new Date().toISOString(),
          status: 'pendente' as const, // Requer aprovaï¿½ï¿½o do diretor
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Usar SQL direto para matricular aluno
        const Database = (await import('better-sqlite3')).default;
        const path = (await import('path')).default;
        const dbPath = schoolDbPath;
        const sqliteDb = new Database(dbPath);
        
        try {
          const insertEnrollmentSql = `
            INSERT INTO studentClass (
              id, studentId, classId, enrollmentDate, status, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `;
          
          const stmt = sqliteDb.prepare(insertEnrollmentSql);
          stmt.run(
            enrollment.id,
            enrollment.studentId,
            enrollment.classId,
            enrollment.enrollmentDate,
            enrollment.status,
            enrollment.createdAt,
            enrollment.updatedAt
          );
        } finally {
          sqliteDb.close();
        }
        console.log("Nova matricula criada: " + student[0].firstName + " na turma " + className);
      }
      
      res.json({ 
        message: "Aluno matriculado com sucesso",
        student: student[0].firstName + ' ' + student[0].lastName,
        class: className
      });
    } catch (error) {
      console.error('Erro ao matricular aluno:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // GET /api/student/activities - Buscar atividades do aluno
  app.get('/api/student/activities', isAuthenticated, hasRole(['student']), async (req, res) => {
    try {
      const user = req.user;
      console.log("Buscando atividades do aluno: " + user.firstName + " " + user.lastName);

      // Buscar turma do aluno
      const studentClassInfo = await db
        .select({
          classId: studentClass.classId
        })
        .from(studentClass)
        .where(and(
          eq(studentClass.studentId, user.id),
          eq(studentClass.status, 'active')
        ))
        .limit(1);

      if (studentClassInfo.length === 0) {
        return res.json({ data: [] });
      }

      const classId = studentClassInfo[0].classId;

      // Buscar atividades da turma do aluno
      const studentActivities = await db
        .select({
          id: activities.id,
          title: activities.title,
          description: activities.description,
          subjectId: activities.subjectId,
          subjectName: subjects.name,
          subjectCode: subjects.code,
          classId: activities.classId,
          className: classes.name,
          dueDate: activities.dueDate,
          maxGrade: activities.maxGrade,
          instructions: activities.instructions,
          requirements: activities.requirements,
          status: activities.status,
          allowLateSubmission: activities.allowLateSubmission,
          latePenalty: activities.latePenalty,
          maxFileSize: activities.maxFileSize,
          allowedFileTypes: activities.allowedFileTypes,
          createdAt: activities.createdAt,
          updatedAt: activities.updatedAt,
          // Status da submissao do aluno
          submissionStatus: activitySubmissions.status,
          submissionGrade: activitySubmissions.grade,
          submissionFeedback: activitySubmissions.feedback,
          submissionDate: activitySubmissions.submittedAt
        })
        .from(activities)
        .innerJoin(subjects, eq(activities.subjectId, subjects.id))
        .innerJoin(classes, eq(activities.classId, classes.id))
        .leftJoin(activitySubmissions, and(
          eq(activitySubmissions.activityId, activities.id),
          eq(activitySubmissions.studentId, user.id)
        ))
        .where(and(
          eq(activities.classId, classId),
          sql`${activities.status} IN ('active', 'pendente')`
        ))
        .orderBy(desc(activities.createdAt));

      console.log("Encontradas " + studentActivities.length + " atividades para o aluno");

      res.json({ data: studentActivities });
    } catch (error) {
      console.error('Erro ao buscar atividades do aluno:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Listar turmas
  app.get('/api/classes', isAuthenticated, async (req, res) => {
    try {
      const { status } = req.query;
      const user = req.user as any;
      
      let whereConditions = [];
      
      // Filtros baseados no role
      if (user.role === 'teacher') {
        // Professor ve apenas turmas onde leciona
        const teacherClasses = await db
          .select({ classId: classSubjects.classId })
          .from(classSubjects)
          .where(and(
            eq(classSubjects.teacherId, user.id),
            eq(classSubjects.status, 'active')
          ));
        
        const classIds = teacherClasses.map(tc => tc.classId);
        if (classIds.length > 0) {
          whereConditions.push(sql`${classes.id} IN (${sql.join(classIds.map(id => sql`${id}`), sql`, `)})`);
        } else {
          // Se nao tem turmas, retornar array vazio
          whereConditions.push(sql`1 = 0`);
        }
      }
      
      if (status && status !== 'all') {
        whereConditions.push(eq(classes.status, status as any));
      }
      
      
      const allClasses = await db
        .select()
        .from(classes)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(asc(classes.name));
      
      res.json(allClasses);
    } catch (error) {
      console.error('Erro ao buscar turmas:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Criar turma
  app.post('/api/classes', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const {
        name,
        grade,
        section,
        academicYear,
        capacity,
      } = req.body;

      if (!name || !grade || !section || !academicYear) {
        return res.status(400).json({ message: "Campos obrigatorios nao preenchidos" });
      }

      const newClass = {
        id: uuidv4(),
        name,
        grade,
        section,
        academicYear,
        capacity: capacity || 30,
        // currentStudents serï¿½ calculado dinamicamente
        status: 'pendente' as const, // Requer aprovaï¿½ï¿½o do diretor
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.insert(classes).values(newClass);

      res.status(201).json({
        message: "Turma criada com sucesso",
        class: newClass
      });
    } catch (error) {
      console.error('Erro ao criar turma:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== ROTAS DE DISCIPLINAS =====
  
  // Listar disciplinas
  app.get('/api/subjects', isAuthenticated, async (req, res) => {
    try {
      const { status, search, classId } = req.query;
      const user = req.user as any;
      
      console.log('=== BUSCANDO DISCIPLINAS ===');
      console.log('User ID:', user.id);
      console.log('User Role:', user.role);
      console.log('ClassId filter:', classId);
      
      let subjectsList;
      
      if (user.role === 'teacher') {
        // Professor ve apenas disciplinas que leciona
        console.log('?? Filtrando disciplinas para professor:', user.id);
        
        // Primeiro, verificar se existem vinculos
        const teacherLinks = await db
          .select()
          .from(classSubjects)
          .where(and(
            eq(classSubjects.teacherId, user.id),
            eq(classSubjects.status, 'active')
          ));
        
        console.log("Vinculos encontrados para professor: " + teacherLinks.length);
        teacherLinks.forEach(link => {
          console.log("  - ClassId: " + link.classId + ", SubjectId: " + link.subjectId + ", Status: " + link.status);
        });
        
        let whereConditions = [
          eq(classSubjects.teacherId, user.id),
          eq(classSubjects.status, 'active')
        ];
        
        // Se classId for fornecido, filtrar por turma especifica
        if (classId) {
          whereConditions.push(eq(classSubjects.classId, classId));
        }
        
        subjectsList = await db
          .select({
            id: subjects.id,
            name: subjects.name,
            code: subjects.code,
            description: subjects.description,
            classId: classSubjects.classId,
            className: classes.name
          })
          .from(subjects)
          .innerJoin(classSubjects, eq(classSubjects.subjectId, subjects.id))
          .innerJoin(classes, eq(classSubjects.classId, classes.id))
          .where(and(
            ...whereConditions,
            eq(subjects.status, 'active')
          ))
          .groupBy(subjects.id, classSubjects.classId)
          .orderBy(asc(subjects.name));
        
        console.log("Disciplinas encontradas para professor: " + subjectsList.length);
        subjectsList.forEach(subj => {
          console.log("  - " + subj.name + " (" + subj.id + ") - Turma: " + subj.className);
        });
      } else {
        // Admin e student veem todas
      let whereConditions = [];
      
      if (status && status !== 'all') {
        whereConditions.push(eq(subjects.status, status as "active" | "inactive"));
      }
      
      if (search) {
        whereConditions.push(
          or(
            like(subjects.name, `%${search}%`),
            like(subjects.code, `%${search}%`)
          )
        );
      }
      
        subjectsList = await db
          .select({
            id: subjects.id,
            name: subjects.name,
            code: subjects.code,
            description: subjects.description,
            status: subjects.status
          })
        .from(subjects)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(asc(subjects.name));
      }
      
      console.log("Encontradas " + subjectsList.length + " disciplinas para " + user.role);
      
      res.json(subjectsList);
    } catch (error) {
      console.error('Erro ao buscar disciplinas:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Criar disciplina
  app.post('/api/subjects', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const {
        name,
        code,
        description,
        teacherId
      } = req.body;

      if (!name || !code) {
        return res.status(400).json({ message: "Campos obrigatorios nao preenchidos" });
      }

      const newSubject = {
        id: uuidv4(),
        name,
        code,
        description: description || null,
        status: 'pendente' as const, // Requer aprovaï¿½ï¿½o do diretor
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.insert(subjects).values(newSubject);

      res.status(201).json({
        message: "Disciplina criada com sucesso",
        subject: newSubject
      });
    } catch (error) {
      console.error('Erro ao criar disciplina:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== ROTAS DE ESTATA?STICAS DO DASHBOARD =====
  
  // Estatisticas gerais
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Log acesso ao dashboard
      logger.dashboardAccessed(user, req);
      
      let stats: any = {};
      
      if (user.role === 'admin') {
        // Stats para admin
        const [userCount] = await db.select({ count: count() }).from(users);
        const [classCount] = await db.select({ count: count() }).from(classes);
        const [subjectCount] = await db.select({ count: count() }).from(subjects);
        
        stats = {
          totalUsers: userCount.count,
          totalClasses: classCount.count,
          totalSubjects: subjectCount.count,
          totalStudents: await db.select({ count: count() }).from(users).where(eq(users.role, 'student')).then(r => r[0].count),
          totalTeachers: await db.select({ count: count() }).from(users).where(eq(users.role, 'teacher')).then(r => r[0].count)
        };
      } else if (user.role === 'teacher') {
        // Stats para professor
        const myClassSubjects = await db.select({ count: count() }).from(classSubjects).where(eq(classSubjects.teacherId, user.id));
        
        stats = {
          totalAssignments: myClassSubjects[0].count,
          totalStudents: await db
            .select({ count: count() })
            .from(studentClass)
            .innerJoin(classSubjects, eq(studentClass.classId, classSubjects.classId))
            .where(eq(classSubjects.teacherId, user.id))
            .then(r => r[0]?.count || 0)
        };
      }
      
      res.json(stats);
    } catch (error) {
      console.error('Erro ao buscar estatisticas:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Dashboard do diretor - visÃ£o geral institucional
  app.get('/api/director/dashboard', isAuthenticated, hasRole(['director', 'admin']), async (req, res) => {
    try {
      const user = req.user as any;
      // Log acesso ao dashboard
      logger.dashboardAccessed(user, req);

      // Totais principais
      const [studentsCount] = await db.select({ count: count() }).from(users).where(eq(users.role, 'student'));
      const [teachersCount] = await db.select({ count: count() }).from(users).where(eq(users.role, 'teacher'));
      const [classesCount] = await db.select({ count: count() }).from(classes);
      const [subjectsCount] = await db.select({ count: count() }).from(subjects);

      // Eventos prÃ³ximos (prÃ³ximos 30 dias)
      const nowIso = new Date().toISOString();
      const in30DaysIso = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const upcomingEvents = await db
        .select({ id: events.id, title: events.title, startDate: events.startDate })
        .from(events)
        .where(
          and(
            eq(events.status, 'active'),
            gte(events.startDate, nowIso),
            lte(events.startDate, in30DaysIso)
          )
        );

      // Itens pendentes de aprovaÃ§Ã£o (usuÃ¡rios, turmas, disciplinas)
      const [pendingUsers] = await db.select({ count: count() }).from(users).where(eq(users.status, 'pending'));
      const [pendingClasses] = await db.select({ count: count() }).from(classes).where(eq(classes.status, 'pending'));
      const [pendingSubjects] = await db.select({ count: count() }).from(subjects).where(eq(subjects.status, 'pending'));

      const dashboard = {
        totals: {
          students: studentsCount?.count || 0,
          teachers: teachersCount?.count || 0,
          classes: classesCount?.count || 0,
          subjects: subjectsCount?.count || 0,
        },
        upcomingEvents: {
          count: upcomingEvents.length,
          next: upcomingEvents.slice(0, 5)
        },
        pendingApprovals: {
          total: (pendingUsers?.count || 0) + (pendingClasses?.count || 0) + (pendingSubjects?.count || 0),
          breakdown: {
            users: pendingUsers?.count || 0,
            classes: pendingClasses?.count || 0,
            subjects: pendingSubjects?.count || 0,
          }
        }
      };

      res.json(dashboard);
    } catch (error) {
      console.error('Erro ao gerar dashboard do diretor:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== ROTAS DE NOTIFICAA?A?ES =====
  
  // Listar notificacA?es
  app.get('/api/notifications', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { read, type } = req.query;
      
      let whereConditions = [];
      
      // NotificacA?es para o usuario especifico ou globais
      whereConditions.push(
        or(
          eq(notifications.recipientId, user.id)
          // NotificacA?es globais serao tratadas separadamente
        )
      );
      
      if (read !== undefined) {
        whereConditions.push(eq(notifications.read, read === 'true'));
      }
      
      if (type && type !== 'all') {
        whereConditions.push(eq(notifications.type, type as "error" | "info" | "warning" | "success" | "reminder" | "announcement" | "grade" | "assignment"));
      }
      
      const allNotifications = await db
        .select()
        .from(notifications)
        .where(and(...whereConditions))
        .orderBy(desc(notifications.createdAt))
        .limit(50);
      
      res.json(allNotifications);
    } catch (error) {
      console.error('Erro ao buscar notificacA?es:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Marcar notificacao como lida
  app.patch('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user as any;
      
      await db
        .update(notifications)
        .set({ 
          read: true,
          updatedAt: new Date().toISOString()
        })
        .where(
          and(
            eq(notifications.id, id),
            eq(notifications.recipientId, user.id)
          )
        );
      
      res.json({ message: "Notificacao marcada como lida" });
    } catch (error) {
      console.error('Erro ao marcar notificacao:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== ROTAS DO PROFESSOR =====
  
  // Buscar dados do professor
  app.get('/api/teacher/:teacherId', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { teacherId } = req.params;
      
      const teacher = await db.select().from(users).where(eq(users.id, teacherId)).limit(1);
      
      if (teacher.length === 0) {
        return res.status(404).json({ message: "Professor nao encontrado" });
      }
      
      res.json({ data: teacher[0] });
    } catch (error) {
      console.error('Erro ao buscar dados do professor:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Buscar turmas do professor
  app.get('/api/teacher/:teacherId/classes', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { teacherId } = req.params;
      
      console.log('=== BUSCANDO TURMAS DO PROFESSOR ===');
      console.log('Teacher ID solicitado:', teacherId);
      
      // Usar SQL direto com better-sqlite3
      const Database = (await import('better-sqlite3')).default;
      const path = (await import('path')).default;
      const { fileURLToPath } = await import('url');
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const dbPath = schoolDbPath;
      const sqliteDb = new Database(dbPath);
      
      let teacherClasses = [];
      try {
        const selectSql = `
          SELECT 
            cs.id,
            cs.classId,
            cs.subjectId,
            c.name as className,
            s.name as subjectName,
            cs.schedule,
            cs.room,
            cs.semester,
            cs.academicYear,
            cs.status
          FROM classSubjects cs
          INNER JOIN classes c ON cs.classId = c.id
          INNER JOIN subjects s ON cs.subjectId = s.id
          WHERE cs.teacherId = ?
        `;
        
        teacherClasses = sqliteDb.prepare(selectSql).all(teacherId);
      } finally {
        sqliteDb.close();
      }
      
      console.log('Turmas encontradas:', teacherClasses.length);
      teacherClasses.forEach((cls, index) => {
        console.log(`${index + 1}. ${cls.className} - ${cls.subjectName}`);
      });
      
      // Buscar contagem de alunos para cada turma
      const classesWithStudents = await Promise.all(
        teacherClasses.map(async (cls) => {
          const studentsCount = await db
            .select({ count: count() })
            .from(studentClass)
            .where(and(
              eq(studentClass.classId, cls.classId!),
              eq(studentClass.status, 'active')
            ));
          
          return {
            ...cls,
            studentCount: studentsCount[0]?.count || 0
          };
        })
      );
      
      console.log('Classes com contagem de alunos:', classesWithStudents.length);
      
      res.json({ data: classesWithStudents });
    } catch (error) {
      console.error('Erro ao buscar turmas do professor:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get('/api/teacher/:teacherId/reports/summary', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { teacherId } = req.params;
      const quarter = (req.query.quarter as string) || '';
      const classFilter = (req.query.classId as string) || '';
      const teacherClasses = await db
        .select({ classId: classSubjects.classId })
        .from(classSubjects)
        .where(classFilter ? and(eq(classSubjects.teacherId, teacherId), eq(classSubjects.classId, classFilter)) : eq(classSubjects.teacherId, teacherId));
      const classIds = Array.from(new Set(teacherClasses.map((c: any) => c.classId))).filter(Boolean);
      if (classIds.length === 0) {
        return res.json({ data: { totalStudents: 0, avgPerformance: 0, attendanceRate: 0, approvalRate: 0 } });
      }
      const studentsCounts = await Promise.all(
        classIds.map(async (cid) => {
          const r = await db.select({ count: count() }).from(studentClass).where(and(eq(studentClass.classId, cid), eq(studentClass.status, 'active')));
          return r[0]?.count || 0;
        })
      );
      const totalStudents = studentsCounts.reduce((a: number, b: number) => a + b, 0);
      const attendanceAll = await Promise.all(
        classIds.map(async (cid) => {
          const r = await db
            .select({ total: count(), present: sql<number>`SUM(CASE WHEN ${attendance.status} = 'present' THEN 1 ELSE 0 END)` })
            .from(attendance)
            .where(eq(attendance.classId, cid));
          const total = r[0]?.total || 0;
          const present = (r[0]?.present as any) || 0;
          return { total, present };
        })
      );
      const attTotal = attendanceAll.reduce((a, b) => a + b.total, 0);
      const attPresent = attendanceAll.reduce((a, b) => a + b.present, 0);
      const attendanceRate = attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 0;
      const gradesWhere = (cid: string) => {
        if (quarter) {
          const mm = ['01','02','03','04','05','06','07','08','09','10','11','12'];
          const allowed = quarter === '1' ? mm.slice(0,3) : quarter === '2' ? mm.slice(3,6) : quarter === '3' ? mm.slice(6,9) : quarter === '4' ? mm.slice(9,12) : mm;
          return and(eq(classSubjects.classId, cid), sql`substr(${grades.date}, 6, 2) IN (${allowed.join(',')})`);
        }
        return eq(classSubjects.classId, cid);
      };
      const gradeAgg = await Promise.all(
        classIds.map(async (cid) => {
          const r = await db
            .select({ grade: grades.grade, studentId: grades.studentId })
            .from(grades)
            .innerJoin(classSubjects, eq(classSubjects.id, grades.classSubjectId))
            .where(gradesWhere(cid));
          return r;
        })
      );
      const allGrades = ([] as any[]).concat(...gradeAgg);
      const avgPerformance = allGrades.length > 0 ? Math.round((allGrades.reduce((a, g: any) => a + (g.grade || 0), 0) / allGrades.length) * 10) / 10 : 0;
      const studentMap: Record<string, number[]> = {};
      for (const g of allGrades) {
        const id = String(g.studentId);
        if (!studentMap[id]) studentMap[id] = [];
        studentMap[id].push(g.grade || 0);
      }
      const approvalCount = Object.values(studentMap).filter((arr) => arr.length > 0 && arr.reduce((a, v) => a + v, 0) / arr.length >= 6).length;
      const approvalRate = totalStudents > 0 ? Math.round((approvalCount * 100) / totalStudents) : 0;
      res.json({ data: { totalStudents, avgPerformance, attendanceRate, approvalRate } });
    } catch (error) {
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  app.get('/api/teacher/:teacherId/reports/performance-by-class', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { teacherId } = req.params;
      const quarter = (req.query.quarter as string) || '';
      const classesRows = await db
        .select({ classId: classSubjects.classId, className: classes.name })
        .from(classSubjects)
        .innerJoin(classes, eq(classSubjects.classId, classes.id))
        .where(eq(classSubjects.teacherId, teacherId));
      const uniq = new Map<string, string>();
      classesRows.forEach((r: any) => { if (r.classId) uniq.set(r.classId, r.className); });
      const result: any[] = [];
      for (const [cid, cname] of uniq.entries()) {
        const sc = await db.select({ count: count() }).from(studentClass).where(and(eq(studentClass.classId, cid), eq(studentClass.status, 'active')));
        const sCount = sc[0]?.count || 0;
        const att = await db
          .select({ total: count(), present: sql<number>`SUM(CASE WHEN ${attendance.status} = 'present' THEN 1 ELSE 0 END)` })
          .from(attendance)
          .where(eq(attendance.classId, cid));
        const attTotal = att[0]?.total || 0;
        const attPresent = (att[0]?.present as any) || 0;
        const attRate = attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 0;
        const whereGrades = quarter ? sql`substr(${grades.date}, 6, 2) IN (${quarter === '1' ? '01,02,03' : quarter === '2' ? '04,05,06' : quarter === '3' ? '07,08,09' : '10,11,12'})` : undefined;
        const gRows = await db
          .select({ grade: grades.grade, studentId: grades.studentId })
          .from(grades)
          .innerJoin(classSubjects, eq(classSubjects.id, grades.classSubjectId))
          .where(whereGrades ? and(eq(classSubjects.classId, cid), whereGrades) : eq(classSubjects.classId, cid));
        const avg = gRows.length > 0 ? Math.round((gRows.reduce((a, g: any) => a + (g.grade || 0), 0) / gRows.length) * 10) / 10 : 0;
        const sm: Record<string, number[]> = {};
        for (const g of gRows) { const sid = String(g.studentId); (sm[sid] ||= []).push(g.grade || 0); }
        const pass = Object.values(sm).filter((arr) => arr.length > 0 && arr.reduce((a, v) => a + v, 0) / arr.length >= 6).length;
        const passingRate = sCount > 0 ? Math.round((pass * 100) / sCount) : 0;
        result.push({ classId: cid, className: cname, students: sCount, average: avg, attendance: `${attRate}%`, passingRate: `${passingRate}%` });
      }
      res.json({ data: result });
    } catch (error) {
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  app.get('/api/classes/:classId/students/grades', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { classId } = req.params;
      const userId = req.user?.id as string;
      const hasAccess = await db
        .select({ count: sql<number>`count(*)` })
        .from(classSubjects)
        .where(and(eq(classSubjects.classId, classId), eq(classSubjects.teacherId, userId)));
      if (hasAccess[0]?.count === 0) return res.status(403).json({ message: 'Acesso negado' });
      const rows = await db
        .select({
          studentId: grades.studentId,
          firstName: users.firstName,
          lastName: users.lastName,
          subjectName: subjects.name,
          type: grades.type,
          title: grades.title,
          grade: grades.grade,
          maxGrade: grades.maxGrade,
          weight: grades.weight,
          date: grades.date
        })
        .from(grades)
        .innerJoin(users, eq(users.id, grades.studentId))
        .innerJoin(classSubjects, eq(classSubjects.id, grades.classSubjectId))
        .innerJoin(subjects, eq(subjects.id, classSubjects.subjectId))
        .where(eq(classSubjects.classId, classId))
        .orderBy(asc(users.firstName), asc(users.lastName), asc(subjects.name), asc(grades.date));
      res.json({ data: rows });
    } catch (error) {
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  app.get('/api/teacher/:teacherId/reports/grades-distribution', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { teacherId } = req.params;
      const quarter = (req.query.quarter as string) || '';
      const classesRows = await db
        .select({ classId: classSubjects.classId })
        .from(classSubjects)
        .where(eq(classSubjects.teacherId, teacherId));
      const classIds = Array.from(new Set(classesRows.map((r: any) => r.classId))).filter(Boolean);
      if (classIds.length === 0) return res.json({ data: [0,0,0,0,0] });
      const whereQuarter = (cid: string) => {
        if (!quarter) return eq(classSubjects.classId, cid);
        const segment = quarter === '1' ? '01,02,03' : quarter === '2' ? '04,05,06' : quarter === '3' ? '07,08,09' : '10,11,12';
        return and(eq(classSubjects.classId, cid), sql`substr(${grades.date}, 6, 2) IN (${segment})`);
      };
      const gradeRows = await Promise.all(
        classIds.map(async (cid) => {
          const r = await db
            .select({ grade: grades.grade })
            .from(grades)
            .innerJoin(classSubjects, eq(classSubjects.id, grades.classSubjectId))
            .where(whereQuarter(cid));
          return r;
        })
      );
      const all = ([] as any[]).concat(...gradeRows);
      const buckets = [0,0,0,0,0];
      for (const g of all) {
        const v = Number(g.grade || 0);
        if (v < 2) buckets[0]++;
        else if (v < 4) buckets[1]++;
        else if (v < 6) buckets[2]++;
        else if (v < 8) buckets[3]++;
        else buckets[4]++;
      }
      res.json({ data: buckets });
    } catch (error) {
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });
  
  // Buscar proximas aulas do professor
  app.get('/api/teacher/:teacherId/upcoming-classes', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { teacherId } = req.params;
      
      // Simular proximas aulas baseado no schedule das turmas
      const teacherClasses = await db
        .select({
          id: classSubjects.id,
          classId: classSubjects.classId,
          className: classes.name,
          subjectName: subjects.name,
          schedule: classSubjects.schedule,
          room: classSubjects.room
        })
        .from(classSubjects)
        .innerJoin(classes, eq(classSubjects.classId, classes.id))
        .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
        .where(eq(classSubjects.teacherId, teacherId));
      
      // Buscar contagem de alunos para cada turma
      const classesWithStudents = await Promise.all(
        teacherClasses.map(async (cls) => {
          const studentsCount = await db
            .select({ count: count() })
            .from(studentClass)
            .where(eq(studentClass.classId, cls.classId!));
          
          return {
            ...cls,
            studentsCount: studentsCount[0]?.count || 0
          };
        })
      );
      
      // Adicionar informacA?es simuladas de horario
      const upcomingClasses = classesWithStudents.map((cls, index) => ({
        ...cls,
        day: ['Segunda-feira', 'Terca-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'][index % 5],
        time: ['07:30 - 09:10', '09:30 - 11:10', '13:30 - 15:10', '15:30 - 17:10'][index % 4]
      }));
      
      res.json({ data: upcomingClasses });
    } catch (error) {
      console.error('Erro ao buscar proximas aulas:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Buscar notas recentes do professor
  app.get('/api/teacher/:teacherId/recent-grades', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { teacherId } = req.params;
      
      const recentGrades = await db
        .select({
          id: grades.id,
          className: classes.name,
          subjectName: subjects.name,
          createdAt: grades.createdAt,
          status: grades.type,
          studentsCount: count()
        })
        .from(grades)
        .innerJoin(classSubjects, eq(grades.classSubjectId, classSubjects.id))
        .innerJoin(classes, eq(classSubjects.classId, classes.id))
        .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
        .where(eq(classSubjects.teacherId, teacherId))
        .groupBy(grades.id, classes.name, subjects.name, grades.createdAt, grades.type)
        .orderBy(desc(grades.createdAt))
        .limit(5);
      
      res.json({ data: recentGrades });
    } catch (error) {
      console.error('Erro ao buscar notas recentes:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Buscar alunos em atencao do professor
  app.get('/api/teacher/:teacherId/students-watch', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { teacherId } = req.params;
      
      // Buscar alunos com baixo desempenho ou muitas faltas
      const studentsToWatch = await db
        .select({
          id: users.id,
          name: users.firstName,
          className: classes.name
        })
        .from(users)
        .innerJoin(studentClass, eq(users.id, studentClass.studentId))
        .innerJoin(classes, eq(studentClass.classId, classes.id))
        .innerJoin(classSubjects, eq(classes.id, classSubjects.classId))
        .where(eq(classSubjects.teacherId, teacherId));
      
      // Processar dados para identificar problemas (simulado por enquanto)
      const processedStudents = studentsToWatch.slice(0, 5).map((student, index) => {
        const issues = ["Baixo desempenho", "Faltas frequentes", "Indisciplina"];
        const issue = issues[index % issues.length];
        const averageGrade = (4 + Math.random() * 3).toFixed(1); // Simular nota entre 4.0 e 7.0
        
        return {
          ...student,
          issue,
          averageGrade
        };
      });
      
      res.json({ data: processedStudents });
    } catch (error) {
      console.error('Erro ao buscar alunos em atencao:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });



  // ===== API DE ESTATï¿½STICAS DE PROFESSORES =====
  
  // GET /api/coordinator/teacher-stats - Estatï¿½sticas detalhadas dos professores (TEMPORï¿½RIO SEM AUTH)
  app.get('/api/coordinator/teacher-stats', async (req, res) => {
    try {
      console.log('?? Buscando estatï¿½sticas dos professores...');
      console.log('?? Usuï¿½rio autenticado:', req.user?.firstName, req.user?.lastName, req.user?.role);
      
      // Buscar todos os professores
      const teachers = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          status: users.status,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt
        })
        .from(users)
        .where(eq(users.role, 'teacher'))
        .orderBy(users.firstName);

      console.log('?? Professores encontrados no banco:', teachers.length);

      // Para cada professor, buscar estatï¿½sticas detalhadas
      const teachersWithStats = await Promise.all(
        teachers.map(async (teacher) => {
          // Atividades criadas pelo professor
          const activitiesStats = await db
            .select({
              total: count(),
              approved: count(sql`CASE WHEN ${activities.status} = 'active' THEN 1 END`),
              draft: count(sql`CASE WHEN ${activities.status} = 'draft' THEN 1 END`),
              expired: count(sql`CASE WHEN ${activities.status} = 'expired' THEN 1 END`)
            })
            .from(activities)
            .where(eq(activities.teacherId, teacher.id));

          // Provas criadas pelo professor
          const examsStats = await db
            .select({
              total: count(),
              completed: count(sql`CASE WHEN ${exams.status} = 'completed' THEN 1 END`),
              active: count(sql`CASE WHEN ${exams.status} = 'active' THEN 1 END`)
            })
            .from(exams)
            .where(eq(exams.teacherId, teacher.id));

          // Materiais criados pelo professor
          const materialsStats = await db
            .select({
              total: count()
            })
            .from(materials)
            .where(eq(materials.teacherId, teacher.id));

          // Notas atribuï¿½das pelo professor (atividades)
          const activityGradesStats = await db
            .select({
              total: count(),
              average: avg(activitySubmissions.grade)
            })
            .from(activitySubmissions)
            .innerJoin(activities, eq(activitySubmissions.activityId, activities.id))
            .where(eq(activities.teacherId, teacher.id));

          // Notas de provas atribuï¿½das pelo professor
          const examGradesStats = await db
            .select({
              total: count(),
              average: avg(examGrades.grade)
            })
            .from(examGrades)
            .innerJoin(exams, eq(examGrades.examId, exams.id))
            .where(eq(exams.teacherId, teacher.id));

          // Submissï¿½es de atividades (para calcular taxa de participaï¿½ï¿½o)
          const submissionsStats = await db
            .select({
              total: count(),
              graded: count(sql`CASE WHEN ${activitySubmissions.grade} IS NOT NULL THEN 1 END`),
              pending: count(sql`CASE WHEN ${activitySubmissions.grade} IS NULL AND ${activitySubmissions.status} = 'submitted' THEN 1 END`)
            })
            .from(activitySubmissions)
            .innerJoin(activities, eq(activitySubmissions.activityId, activities.id))
            .where(eq(activities.teacherId, teacher.id));

          // Calcular performance baseada em mï¿½ltiplos fatores
          const activitiesTotal = activitiesStats[0]?.total || 0;
          const activitiesApproved = activitiesStats[0]?.approved || 0;
          const examsTotal = examsStats[0]?.total || 0;
          const materialsTotal = materialsStats[0]?.total || 0;
          const submissionsTotal = submissionsStats[0]?.total || 0;
          const submissionsGraded = submissionsStats[0]?.graded || 0;

          // Fï¿½rmula de performance: 40% atividades aprovadas + 30% correï¿½ï¿½o de submissï¿½es + 20% provas + 10% materiais
          let performance = 0;
          if (activitiesTotal > 0) {
            performance += (activitiesApproved / activitiesTotal) * 40;
          }
          if (submissionsTotal > 0) {
            performance += (submissionsGraded / submissionsTotal) * 30;
          }
          if (examsTotal > 0) {
            performance += Math.min(examsTotal * 2, 20); // Mï¿½ximo 20 pontos por provas
          }
          performance += Math.min(materialsTotal * 1, 10); // Mï¿½ximo 10 pontos por materiais

          // Garantir que a performance esteja entre 0 e 10
          performance = Math.min(Math.max(performance, 0), 10);

          return {
            ...teacher,
            stats: {
              activities: {
                total: activitiesTotal,
                approved: activitiesApproved,
                draft: activitiesStats[0]?.draft || 0,
                expired: activitiesStats[0]?.expired || 0
              },
              exams: {
                total: examsTotal,
                completed: examsStats[0]?.completed || 0,
                active: examsStats[0]?.active || 0
              },
              materials: {
                total: materialsTotal
              },
              grades: {
                activityGrades: {
                  total: activityGradesStats[0]?.total || 0,
                  average: activityGradesStats[0]?.average || 0
                },
                examGrades: {
                  total: examGradesStats[0]?.total || 0,
                  average: examGradesStats[0]?.average || 0
                }
              },
              submissions: {
                total: submissionsTotal,
                graded: submissionsGraded,
                pending: submissionsStats[0]?.pending || 0
              },
              performance: Math.round(performance * 10) / 10,
              approvalRate: activitiesTotal > 0 ? Math.round((activitiesApproved / activitiesTotal) * 100) : 0,
              gradingRate: submissionsTotal > 0 ? Math.round((submissionsGraded / submissionsTotal) * 100) : 0
            }
          };
        })
      );

      console.log(`? Estatï¿½sticas de ${teachersWithStats.length} professores calculadas`);
      console.log('?? Enviando resposta:', teachersWithStats.length, 'professores');
      
      res.json({
        success: true,
        data: teachersWithStats
      });

    } catch (error) {
      console.error('? Erro ao buscar estatï¿½sticas dos professores:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  });

  // GET /api/coordinator/teacher-details/:id - Detalhes especï¿½ficos de um professor
  app.get('/api/coordinator/teacher-details/:id', isAuthenticated, hasRole(['coordinator', 'admin']), async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`?? Buscando detalhes do professor: ${id}`);

      // Buscar dados bï¿½sicos do professor
      const teacher = await db
        .select()
        .from(users)
        .where(and(eq(users.id, id), eq(users.role, 'teacher')))
        .limit(1);

      if (teacher.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Professor nï¿½o encontrado' 
        });
      }

      // Buscar atividades recentes do professor
      const recentActivities = await db
        .select({
          id: activities.id,
          title: activities.title,
          description: activities.description,
          status: activities.status,
          createdAt: activities.createdAt,
          dueDate: activities.dueDate,
          subjectName: subjects.name,
          className: classes.name
        })
        .from(activities)
        .innerJoin(subjects, eq(activities.subjectId, subjects.id))
        .innerJoin(classes, eq(activities.classId, classes.id))
        .where(eq(activities.teacherId, id))
        .orderBy(desc(activities.createdAt))
        .limit(10);

      // Buscar provas recentes do professor
      const recentExams = await db
        .select({
          id: exams.id,
          title: exams.title,
          description: exams.description,
          status: exams.status,
          createdAt: exams.createdAt,
          examDate: exams.examDate,
          subjectName: subjects.name,
          className: classes.name
        })
        .from(exams)
        .innerJoin(subjects, eq(exams.subjectId, subjects.id))
        .innerJoin(classes, eq(exams.classId, classes.id))
        .where(eq(exams.teacherId, id))
        .orderBy(desc(exams.createdAt))
        .limit(10);

      // Buscar materiais recentes do professor
      const recentMaterials = await db
        .select({
          id: materials.id,
          title: materials.title,
          description: materials.description,
          type: materials.type,
          createdAt: materials.createdAt,
          subjectName: subjects.name,
          className: classes.name
        })
        .from(materials)
        .innerJoin(subjects, eq(materials.subjectId, subjects.id))
        .innerJoin(classes, eq(materials.classId, classes.id))
        .where(eq(materials.teacherId, id))
        .orderBy(desc(materials.createdAt))
        .limit(10);

      // Buscar submissï¿½es pendentes de correï¿½ï¿½o
      const pendingSubmissions = await db
        .select({
          id: activitySubmissions.id,
          activityTitle: activities.title,
          studentName: sql`${users.firstName} || ' ' || ${users.lastName}`,
          submittedAt: activitySubmissions.submittedAt,
          subjectName: subjects.name,
          className: classes.name
        })
        .from(activitySubmissions)
        .innerJoin(activities, eq(activitySubmissions.activityId, activities.id))
        .innerJoin(users, eq(activitySubmissions.studentId, users.id))
        .innerJoin(subjects, eq(activities.subjectId, subjects.id))
        .innerJoin(classes, eq(activities.classId, classes.id))
        .where(and(
          eq(activities.teacherId, id),
          eq(activitySubmissions.status, 'submitted'),
          sql`${activitySubmissions.grade} IS NULL`
        ))
        .orderBy(desc(activitySubmissions.submittedAt))
        .limit(10);

      // Buscar disciplinas que o professor leciona
      const teacherSubjects = await db
        .select({
          subjectId: subjects.id,
          subjectName: subjects.name,
          subjectCode: subjects.code,
          className: classes.name,
          classId: classes.id
        })
        .from(classSubjects)
        .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
        .innerJoin(classes, eq(classSubjects.classId, classes.id))
        .where(eq(classSubjects.teacherId, id));

      res.json({
        success: true,
        data: {
          teacher: teacher[0],
          recentActivities,
          recentExams,
          recentMaterials,
          pendingSubmissions,
          teacherSubjects
        }
      });

    } catch (error) {
      console.error('? Erro ao buscar detalhes do professor:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  });

  // ===== SISTEMA DE ATIVIDADES (MANTENDO AS ROTAS EXISTENTES) =====

  // Buscar todas as atividades (com filtros)
  app.get('/api/activities', isAuthenticated, async (req, res) => {
    try {
      const { role, teacherId, studentId, subjectId, status, search } = req.query;
      const user = req.user as any;
    
    let whereConditions = [];
    
      // Filtrar por papel do usuario
      if (user.role === 'teacher') {
        whereConditions.push(eq(activities.teacherId, user.id));
      } else if (user.role === 'student') {
        // Em producao, filtraria pelas materias em que o aluno esta matriculado
        whereConditions.push(eq(activities.status, 'active'));
      }

      // Filtros adicionais
      if (subjectId && subjectId !== 'all') {
        whereConditions.push(eq(activities.subjectId, subjectId as string));
      }

      if (status && status !== 'all') {
        whereConditions.push(eq(activities.status, status as "active" | "draft" | "expired" | "archived"));
    }
    
    if (search) {
      whereConditions.push(
          // Busca por titulo ou descricao
          // Implementar busca full-text se necessario
        );
      }

      const allActivities = await db
        .select()
        .from(activities)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(activities.createdAt));

      // Buscar submissA?es para cada atividade
      const activitiesWithSubmissions = await Promise.all(
        allActivities.map(async (activity) => {
          const submissions = await db
            .select()
            .from(activitySubmissions)
            .where(eq(activitySubmissions.activityId, activity.id));

          const files = await db
            .select()
            .from(activityFiles)
            .where(eq(activityFiles.activityId, activity.id));

          // Verificar se o usuario atual ja submeteu esta atividade
          let submitted = false;
          if (user.role === 'student') {
            const userSubmission = await db
              .select()
              .from(activitySubmissions)
              .where(
                and(
                  eq(activitySubmissions.activityId, activity.id),
                  eq(activitySubmissions.studentId, user.id)
                )
              )
              .limit(1);
            
            submitted = userSubmission.length > 0;
          }

          return {
            ...activity,
            allowedFileTypes: activity.allowedFileTypes ? JSON.parse(activity.allowedFileTypes) : [],
            submissions,
            files,
            submitted
          };
        })
      );

      res.json(activitiesWithSubmissions);
    } catch (error) {
      console.error('Erro ao buscar atividades:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
  }
});

  // Buscar atividade especifica
  app.get('/api/activities/:id', isAuthenticated, async (req, res) => {
  try {
      const { id } = req.params;
    const user = req.user as any;
    
      const activity = await db
        .select()
        .from(activities)
        .where(eq(activities.id, id))
        .limit(1);

      if (activity.length === 0) {
        return res.status(404).json({ message: "Atividade nao encontrada" });
      }

      // Verificar permissÃµes
      // Permitir que alunos visualizem detalhes/arquivos mesmo quando a atividade estiver 'pendente'
      // (bloqueando apenas estados realmente indisponÃ­veis, como 'archived')
      if (user.role === 'student' && activity[0].status === 'archived') {
        return res.status(403).json({ message: "Acesso negado" });
      }

      if (user.role === 'teacher' && activity[0].teacherId !== user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Buscar submissA?es e arquivos das submissA?es
      const submissions = await db
        .select()
        .from(activitySubmissions)
        .where(eq(activitySubmissions.activityId, id));

      // Buscar arquivos das submissA?es (nao da atividade)
      const submissionFilesData = await db
        .select({
          id: submissionFiles.id,
          submissionId: submissionFiles.submissionId,
          fileName: submissionFiles.fileName,
          originalFileName: submissionFiles.originalFileName,
          filePath: submissionFiles.filePath,
          fileSize: submissionFiles.fileSize,
          fileType: submissionFiles.fileType,
          uploadedAt: submissionFiles.uploadedAt
        })
        .from(submissionFiles)
        .innerJoin(activitySubmissions, eq(submissionFiles.submissionId, activitySubmissions.id))
        .where(eq(activitySubmissions.activityId, id));

      // Buscar arquivos da atividade (anexos do professor)
      const activityFilesData = await db
        .select()
        .from(activityFiles)
        .where(eq(activityFiles.activityId, id));

      console.log("[" + user.role + "] Buscando atividade " + id + ":");
      console.log("Submissoes encontradas: " + submissions.length);
      console.log("Arquivos de submissoes encontrados: " + submissionFilesData.length);
      console.log("Arquivos da atividade encontrados: " + activityFilesData.length);
      
      if (activityFilesData.length > 0) {
        console.log('?? Detalhes dos arquivos da atividade:');
        activityFilesData.forEach((file, index) => {
          console.log(`   ${index + 1}. ${file.originalFileName} (${file.fileSize} bytes) - Tipo: ${file.fileType}`);
        });
      }
      
      if (submissionFilesData.length > 0) {
        console.log('?? Detalhes dos arquivos de submissA?es:');
        submissionFilesData.forEach((file, index) => {
          console.log("   " + (index + 1) + ". " + file.originalFileName + " (" + file.fileSize + " bytes)");
        });
      }

      const result = {
        ...activity[0],
        allowedFileTypes: activity[0].allowedFileTypes ? JSON.parse(activity[0].allowedFileTypes) : [],
        submissions: submissions.map(submission => ({
          ...submission,
          files: submissionFilesData
            .filter(file => file.submissionId === submission.id)
            .map(file => file)
        })),
        files: activityFilesData // Arquivos da atividade (anexos do professor)
      };
      
      console.log("Retornando resultado com " + submissionFilesData.length + " arquivo(s) de submissao e " + activityFilesData.length + " arquivo(s) da atividade");
      console.log('?? Estrutura do resultado:', Object.keys(result));

      // Corrigir codificaï¿½ï¿½o dos nomes dos arquivos
      if (result.files && result.files.length > 0) {
        result.files = result.files.map((file: any) => ({
          ...file,
          originalFileName: file.originalFileName ? Buffer.from(file.originalFileName, 'latin1').toString('utf8') : file.originalFileName
        }));
        console.log('?? Nomes dos arquivos corrigidos:', result.files.map((f: any) => f.originalFileName));
      }

      res.json(result);
  } catch (error) {
      console.error('Erro ao buscar atividade:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Deletar arquivo especifico de uma atividade
  app.delete('/api/activities/:id/files/:fileId', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { id: activityId, fileId } = req.params;
      const user = req.user as any;
      
      console.log('=== DELETANDO ARQUIVO DE ATIVIDADE ===');
      console.log('Activity ID:', activityId);
      console.log('File ID:', fileId);
      console.log('Teacher ID:', user.id);
      
      // Verificar se a atividade pertence ao professor
      const activity = await db
        .select()
        .from(activities)
        .where(and(
          eq(activities.id, activityId),
          eq(activities.teacherId, user.id)
        ))
        .limit(1);
      
      if (activity.length === 0) {
        console.log('? Atividade nao encontrada ou nao pertence ao professor');
        return res.status(404).json({ message: "Atividade nao encontrada" });
      }
      
      // Buscar o arquivo para obter o caminho
      const file = await db
        .select()
        .from(activityFiles)
        .where(and(
          eq(activityFiles.id, fileId),
          eq(activityFiles.activityId, activityId)
        ))
        .limit(1);
      
      if (file.length === 0) {
        console.log('? Arquivo nao encontrado');
        return res.status(404).json({ message: "Arquivo nao encontrado" });
      }
      
      const activityFile = file[0];
      console.log('? Arquivo encontrado:', activityFile.originalFileName);
      
      // Deletar o arquivo do banco de dados
      await db
        .delete(activityFiles)
        .where(eq(activityFiles.id, fileId));
      
      // Tentar deletar o arquivo fisico
      try {
        const filePath = path.join(__dirname, '..', activityFile.filePath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('??? Arquivo fisico deletado:', filePath);
        } else {
          console.log('?? Arquivo fisico nao encontrado (ok)');
        }
      } catch (error) {
        console.log('?? Erro ao deletar arquivo fisico (continuando):', error);
      }
      
      console.log('? Arquivo deletado com sucesso!');
      res.json({ 
        message: "Arquivo deletado com sucesso",
        fileId: fileId,
        fileName: activityFile.originalFileName
      });
      
    } catch (error) {
      console.error('? Erro ao deletar arquivo:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Deletar atividade (apenas professores)
  app.delete('/api/activities/:id', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const activityId = req.params.id;
      const user = req.user as any;
      
      console.log('=== DELETANDO ATIVIDADE ===');
      console.log('Activity ID:', activityId);
      console.log('Teacher ID:', user.id);
      
      // 1. Verificar se a atividade existe e pertence ao professor
      const activity = await db
        .select()
        .from(activities)
        .where(and(
          eq(activities.id, activityId),
          eq(activities.teacherId, user.id)
        ))
        .limit(1);
      
      if (activity.length === 0) {
        console.log('? Atividade nao encontrada ou nao pertence ao professor');
        return res.status(404).json({ message: "Atividade nao encontrada" });
      }
      
      console.log('? Atividade encontrada:', activity[0].title);
      
      // 2. Deletar registros relacionados em ordem correta para evitar foreign key constraints
      
      console.log('?? Iniciando processo de delecao em cascata...');
      
      // 2.1. Buscar todas as submissA?es da atividade
      const submissions = await db
        .select({ id: activitySubmissions.id })
        .from(activitySubmissions)
        .where(eq(activitySubmissions.activityId, activityId));
      
      console.log("Encontradas " + submissions.length + " submissoes para deletar");
      
      // 2.2. Deletar arquivos das submissA?es (se existirem)
      if (submissions.length > 0) {
        console.log('??? Deletando arquivos das submissA?es...');
        for (const submission of submissions) {
          const deletedFiles = await db
            .delete(submissionFiles)
            .where(eq(submissionFiles.submissionId, submission.id));
          console.log("   Arquivos da submissao " + submission.id + ": deletados");
        }
      }
      
      // 2.3. Deletar historico das submissA?es (se existir)
      if (submissions.length > 0) {
        console.log('?? Deletando historico das submissA?es...');
        for (const submission of submissions) {
          try {
            await db
              .delete(submissionHistory)
              .where(eq(submissionHistory.submissionId, submission.id));
            console.log("   Historico da submissao " + submission.id + ": deletado");
          } catch (error) {
            console.log("   Historico da submissao " + submission.id + ": nao encontrado (ok)");
          }
        }
      }
      
      // 2.4. Deletar as submissA?es
      if (submissions.length > 0) {
        console.log('?? Deletando submissA?es...');
        const deletedSubmissions = await db
          .delete(activitySubmissions)
          .where(eq(activitySubmissions.activityId, activityId));
        console.log(submissions.length + " submissoes deletadas");
      }
      
      // 2.5. Deletar arquivos da atividade
      console.log('??? Deletando arquivos da atividade...');
      try {
        const deletedActivityFiles = await db
          .delete(activityFiles)
          .where(eq(activityFiles.activityId, activityId));
        console.log('? Arquivos da atividade deletados');
      } catch (error) {
        console.log('?? Arquivos da atividade: nao encontrados (ok)');
      }
      
      // 2.6. Finalmente, deletar a atividade
      console.log('?? Deletando a atividade...');
      await db.delete(activities).where(eq(activities.id, activityId));
      console.log('? Atividade deletada com sucesso!');
      
      res.json({ 
        message: "Atividade deletada com sucesso",
        activityId: activityId,
        activityTitle: activity[0].title
      });
      
    } catch (error) {
      console.error('? Erro ao deletar atividade:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Download de arquivo de atividade
  app.get('/api/activities/files/:fileId/download', isAuthenticated, async (req, res) => {
    try {
      const fileId = req.params.fileId;
      
      console.log('=== BAIXANDO ARQUIVO DE ATIVIDADE ===');
      console.log('File ID:', fileId);
      
      // Buscar arquivo da atividade
      const file = await db
        .select()
        .from(activityFiles)
        .where(eq(activityFiles.id, fileId))
        .limit(1);
      
      if (file.length === 0) {
        console.log('? Arquivo nao encontrado');
        return res.status(404).json({ message: "Arquivo nao encontrado" });
      }
      
      const activityFile = file[0];
      console.log('? Arquivo encontrado:', activityFile.originalFileName);
      
      // Verificar se o arquivo existe no disco
      const filePath = path.resolve(activityFile.filePath);
      if (!fs.existsSync(filePath)) {
        console.log('? Arquivo nao encontrado no disco:', filePath);
        return res.status(404).json({ message: "Arquivo nao encontrado no servidor" });
      }
      
      // Enviar arquivo para download
      res.setHeader('Content-Disposition', `attachment; filename="${activityFile.originalFileName}"`);
      res.setHeader('Content-Type', activityFile.fileType);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
    } catch (error) {
      console.error('? Erro ao baixar arquivo de atividade:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Visualizar arquivo de atividade
  app.get('/api/activities/files/:fileId/view', isAuthenticated, async (req, res) => {
    try {
      const fileId = req.params.fileId;
      
      console.log('=== VISUALIZANDO ARQUIVO DE ATIVIDADE ===');
      console.log('File ID:', fileId);
      
      // Buscar arquivo da atividade
      const file = await db
        .select()
        .from(activityFiles)
        .where(eq(activityFiles.id, fileId))
        .limit(1);
      
      if (file.length === 0) {
        console.log('? Arquivo nao encontrado');
        return res.status(404).json({ message: "Arquivo nao encontrado" });
      }
      
      const activityFile = file[0];
      console.log('? Arquivo encontrado:', activityFile.originalFileName);
      
      // Verificar se o arquivo existe no disco
      const filePath = path.resolve(activityFile.filePath);
      if (!fs.existsSync(filePath)) {
        console.log('? Arquivo nao encontrado no disco:', filePath);
        return res.status(404).json({ message: "Arquivo nao encontrado no servidor" });
      }
      
      // Enviar arquivo para visualizacao
      // Definir Content-Type baseado na extensao do arquivo
      const fileExtension = path.extname(activityFile.originalFileName).toLowerCase();
      let contentType = activityFile.fileType;
      
      // Mapear extensA?es para Content-Types corretos
      const mimeTypes = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.txt': 'text/plain',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif'
      };
      
      if (mimeTypes[fileExtension]) {
        contentType = mimeTypes[fileExtension];
      }
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${activityFile.originalFileName}"`);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
    } catch (error) {
      console.error('? Erro ao visualizar arquivo de atividade:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Criar nova atividade (apenas professores)
  app.post('/api/activities', isAuthenticated, hasRole(['teacher']), upload.array('files', 5), async (req, res) => {
    try {
      const user = req.user as any;
      const {
        title,
        description,
        subjectId,
        classId,
        dueDate,
        maxGrade,
        instructions,
        requirements,
        allowLateSubmission,
        latePenalty,
        maxFileSize,
        allowedFileTypes
      } = req.body;

      console.log('=== CRIANDO NOVA ATIVIDADE ===');
      console.log('Dados recebidos:', {
        title,
        description,
        subjectId,
        classId,
        teacherId: user.id,
        dueDate,
        maxGrade
      });

      if (!title || !description || !dueDate) {
        return res.status(400).json({ message: "Campos obrigatorios nao preenchidos" });
      }

      // Verificar se subjectId existe (se fornecido)
      if (subjectId) {
        const subjectExists = await db
          .select()
          .from(subjects)
          .where(eq(subjects.id, subjectId))
          .limit(1);
        
        if (subjectExists.length === 0) {
          console.log('? Subject nao encontrado:', subjectId);
          return res.status(400).json({ message: "Disciplina nao encontrada" });
        }
      }

      // Verificar se classId existe (se fornecido)
      if (classId) {
        const classExists = await db
          .select()
          .from(classes)
          .where(eq(classes.id, classId))
          .limit(1);
        
        if (classExists.length === 0) {
          console.log('? Class nao encontrada:', classId);
          return res.status(400).json({ message: "Turma nao encontrada" });
        }
      }

      // Verificar se o professor existe
      const teacherExists = await db
        .select()
        .from(users)
        .where(and(eq(users.id, user.id), eq(users.role, 'teacher')))
        .limit(1);
      
      if (teacherExists.length === 0) {
        console.log('? Teacher nao encontrado:', user.id);
        return res.status(400).json({ message: "Professor nao encontrado" });
      }

      const newActivity = {
        id: uuidv4(),
        title,
        description,
        subjectId: subjectId || null,
        teacherId: user.id,
        classId: classId || null,
        dueDate,
        maxGrade: maxGrade || 10,
        instructions: instructions || null,
        requirements: requirements || null,
        status: 'pendente' as const, // Requer aprovaï¿½ï¿½o do diretor
        allowLateSubmission: allowLateSubmission || false,
        latePenalty: latePenalty || 0,
        maxFileSize: maxFileSize || 10,
        allowedFileTypes: allowedFileTypes ? JSON.stringify(allowedFileTypes) : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('? Inserindo atividade:', newActivity);
      await db.insert(activities).values(newActivity);

      // Log criaï¿½ï¿½o de atividade
      logger.activityCreated(user, newActivity.title, req);

      // Processar arquivos enviados
      const files = req.files as Express.Multer.File[] || [];
      
      for (const file of files) {
        const fileId = uuidv4();
        
        // Salvar informacA?es do arquivo no banco
        await db.insert(activityFiles).values({
          id: fileId,
          activityId: newActivity.id,
          fileName: file.filename, // Nome unico gerado pelo multer
          originalFileName: file.originalname,
          filePath: file.path,
          fileSize: file.size,
          fileType: file.mimetype,
          fileCategory: 'reference' as const, // Categoria padrao para arquivos de referencia
          uploadedBy: user.id,
          createdAt: new Date().toISOString()
        });

        // Log upload de arquivo
        logger.fileUploaded(user, file.originalname, req);
      }

      console.log(files.length + " arquivo(s) processado(s) para a atividade");

      // Notificar alunos em tempo real sobre nova atividade
      const realtimeManager = getRealtimeManager();
      if (realtimeManager && classId) {
        realtimeManager.notifyNewActivity(newActivity, classId);
      }

      console.log('? Atividade criada com sucesso!');
      res.status(201).json({
        message: "Atividade criada com sucesso",
        activity: newActivity
      });
    } catch (error) {
      console.error('Erro ao criar atividade:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Atualizar atividade
  app.put('/api/activities/:id', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user as any;
      const updateData = req.body;

      // Verificar se a atividade pertence ao professor
      const existingActivity = await db
        .select()
        .from(activities)
        .where(eq(activities.id, id))
        .limit(1);

      if (existingActivity.length === 0) {
        return res.status(404).json({ message: "Atividade nao encontrada" });
      }

      if (existingActivity[0].teacherId !== user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      updateData.updatedAt = new Date().toISOString();

      await db
        .update(activities)
        .set(updateData)
        .where(eq(activities.id, id));

      // Notificar alunos em tempo real sobre atualizacao da atividade
      const realtimeManager = getRealtimeManager();
      if (realtimeManager && existingActivity[0].classId) {
        const updatedActivity = { ...existingActivity[0], ...updateData };
        realtimeManager.notifyActivityUpdate(updatedActivity, existingActivity[0].classId);
      }

      res.json({ message: "Atividade atualizada com sucesso" });
    } catch (error) {
      console.error('Erro ao atualizar atividade:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Deletar atividade
  app.delete('/api/activities/:id', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user as any;

      // Verificar se a atividade pertence ao professor
      const existingActivity = await db
        .select()
        .from(activities)
        .where(eq(activities.id, id))
        .limit(1);

      if (existingActivity.length === 0) {
        return res.status(404).json({ message: "Atividade nao encontrada" });
      }

      if (existingActivity[0].teacherId !== user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Verificar se ha submissA?es
      const submissions = await db
        .select()
        .from(activitySubmissions)
        .where(eq(activitySubmissions.activityId, id));

      if (submissions.length > 0) {
        return res.status(400).json({ 
          message: "Nao e possivel deletar uma atividade que possui submissA?es" 
        });
      }

      await db.delete(activities).where(eq(activities.id, id));

      // Notificar alunos em tempo real sobre remocao da atividade
      const realtimeManager = getRealtimeManager();
      if (realtimeManager && existingActivity[0].classId) {
        realtimeManager.notifyActivityRemoved(id, existingActivity[0].classId);
      }

      res.json({ message: "Atividade deletada com sucesso" });
  } catch (error) {
      console.error('Erro ao deletar atividade:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Submeter atividade (apenas alunos) - VERSA?O SIMPLIFICADA
  // Rota de submissao removida - usando a versao mais completa abaixo

  // Desfazer entrega de atividade (apenas alunos)
  app.post('/api/activities/:id/undo-submit', isAuthenticated, hasRole(['student']), async (req, res) => {
    try {
      console.log('=== DESFAZENDO SUBMISSA?O ===');
      
      const { id: activityId } = req.params;
      const user = req.user as any;
      
      // Verificar se a atividade existe
      if (!activityId) {
        return res.status(400).json({ message: "ID da atividade e obrigatorio" });
      }
      
      console.log('Tentando desfazer submissao para:', activityId, 'usuario:', user.id);

      // Buscar e deletar a submissao
      const submissions = await db
        .select()
        .from(activitySubmissions)
        .where(
          and(
            eq(activitySubmissions.activityId, activityId),
            eq(activitySubmissions.studentId, user.id)
          )
        );

      if (submissions.length === 0) {
        return res.status(404).json({ message: "Submissao nao encontrada" });
      }

      // Deletar a submissao
      await db
        .delete(activitySubmissions)
        .where(
          and(
            eq(activitySubmissions.activityId, activityId),
            eq(activitySubmissions.studentId, user.id)
          )
        );
      
      console.log('Submissao desfeita com sucesso!');

      res.json({
        message: "Entrega desfeita com sucesso"
      });
  } catch (error) {
      console.error('Erro ao desfazer submissao:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
  }
});

  // Avaliar submissao (apenas professores)
  app.post('/api/submissions/:id/grade', isAuthenticated, hasRole(['teacher']), async (req, res) => {
  try {
      const { id: submissionId } = req.params;
    const user = req.user as any;
      const { grade, feedback } = req.body;

      if (grade === undefined || grade === null) {
        return res.status(400).json({ message: "Nota e obrigatoria" });
      }

      // Verificar se a submissao existe
      const submission = await db
        .select()
        .from(activitySubmissions)
        .where(eq(activitySubmissions.id, submissionId))
        .limit(1);

      if (submission.length === 0) {
        return res.status(404).json({ message: "Submissao nao encontrada" });
      }

      // Verificar se o professor pode avaliar (e o professor da atividade)
      if (!submission[0].activityId) {
        return res.status(400).json({ message: "ID da atividade nao encontrado" });
      }
      
      const activity = await db
        .select()
        .from(activities)
        .where(eq(activities.id, submission[0].activityId))
        .limit(1);

      if (activity.length === 0 || activity[0].teacherId !== user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Calcular nota final considerando penalidades
      const maxGrade = submission[0].maxGrade;
      const finalGrade = Math.max(0, grade - submission[0].latePenaltyApplied);

      // Atualizar submissao
      await db
        .update(activitySubmissions)
        .set({
          grade,
          feedback: feedback || null,
          status: 'graded',
          gradedBy: user.id,
          gradedAt: new Date().toISOString(),
          finalGrade,
          updatedAt: new Date().toISOString()
        })
        .where(eq(activitySubmissions.id, submissionId));

      // Registrar no historico
      await db.insert(submissionHistory).values({
        id: uuidv4(),
        submissionId,
        action: 'graded',
        performedBy: user.id,
        performedAt: new Date().toISOString(),
        details: `Avaliado com nota ${grade}/${maxGrade}. Nota final: ${finalGrade}/${maxGrade}`,
        previousStatus: submission[0].status,
        newStatus: 'graded',
        gradeChange: grade
      });

      // Log avaliaï¿½ï¿½o de atividade
      logger.activityGraded(user, `Aluno ${submission[0].studentId}`, finalGrade, req);

      res.json({ 
        message: "Submissao avaliada com sucesso",
        finalGrade
      });
  } catch (error) {
      console.error('Erro ao avaliar submissao:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar submissA?es de uma atividade
  app.get('/api/activities/:id/submissions', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { id: activityId } = req.params;
      const user = req.user as any;

      // Verificar se o professor pode ver as submissA?es
      const activity = await db
        .select()
        .from(activities)
        .where(eq(activities.id, activityId))
        .limit(1);

      if (activity.length === 0 || activity[0].teacherId !== user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const submissions = await db
        .select({
          submission: activitySubmissions,
          student: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email
          }
        })
        .from(activitySubmissions)
        .innerJoin(users, eq(activitySubmissions.studentId, users.id))
        .where(eq(activitySubmissions.activityId, activityId))
        .orderBy(asc(activitySubmissions.submittedAt));

      // Buscar arquivos para cada submissao
      const submissionsWithFiles = await Promise.all(
        submissions.map(async (item) => {
          const files = await db
            .select()
            .from(submissionFiles)
            .where(eq(submissionFiles.submissionId, item.submission.id));

          return {
            ...item,
            files
          };
        })
      );

      res.json(submissionsWithFiles);
  } catch (error) {
      console.error('Erro ao buscar submissA?es:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
  }
});

  // Avaliacao em lote de submissA?es
  app.post('/api/activities/:id/submissions/batch-grade', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { id: activityId } = req.params;
      const { submissionIds, grade, feedback } = req.body;
      const user = req.user as any;

      // Verificar se o professor pode avaliar as submissA?es
      const activity = await db
        .select()
        .from(activities)
        .where(eq(activities.id, activityId))
        .limit(1);

      if (activity.length === 0 || activity[0].teacherId !== user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Avaliar todas as submissA?es selecionadas
      const results = [];
      for (const submissionId of submissionIds) {
        try {
          const submission = await db
            .select()
            .from(activitySubmissions)
            .where(and(
              eq(activitySubmissions.id, submissionId),
              eq(activitySubmissions.activityId, activityId)
            ))
            .limit(1);

          if (submission.length === 0) continue;

          // Calcular penalidade por atraso
          let finalGrade = grade;
          if (submission[0].submittedAt && activity[0].dueDate) {
            const submissionDate = new Date(submission[0].submittedAt);
            const dueDate = new Date(activity[0].dueDate);
            if (submissionDate > dueDate) {
              const daysLate = Math.ceil((submissionDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
              const penalty = Math.min(daysLate * 0.1, 0.5); // 10% por dia, maximo 50%
              finalGrade = Math.max(grade * (1 - penalty), 0);
            }
          }

          // Atualizar submissao
          await db
            .update(activitySubmissions)
            .set({
              grade: finalGrade,
              feedback,
              gradedAt: new Date().toISOString(),
              gradedBy: user.id
            })
            .where(eq(activitySubmissions.id, submissionId));

          // Registrar no historico
          await db.insert(submissionHistory).values({
            id: uuidv4(),
            submissionId,
            action: 'graded',
            performedBy: user.id,
            performedAt: new Date().toISOString(),
            details: JSON.stringify({ grade: finalGrade, feedback })
          });

          results.push({ submissionId, success: true, grade: finalGrade });
        } catch (error) {
          results.push({ submissionId, success: false, error: error.message });
        }
      }

      res.json({ results });
    } catch (error) {
      console.error('Erro na avaliacao em lote:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar submissA?es com filtros avancados
  app.get('/api/activities/:id/submissions/filtered', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { id: activityId } = req.params;
      const { status, search, sortBy = 'submittedAt', sortOrder = 'desc', page = 1, limit = 20 } = req.query;
      const user = req.user as any;

      // Verificar permissA?es
      const activity = await db
        .select()
        .from(activities)
        .where(eq(activities.id, activityId))
        .limit(1);

      if (activity.length === 0 || activity[0].teacherId !== user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Construir query base
      let query = db
        .select({
          submission: activitySubmissions,
          student: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email
          }
        })
        .from(activitySubmissions)
        .innerJoin(users, eq(activitySubmissions.studentId, users.id))
        .where(eq(activitySubmissions.activityId, activityId));

      // Aplicar filtros
      const conditions = [eq(activitySubmissions.activityId, activityId)];
      
      if (status) {
        switch (status) {
          case 'pendente':
            conditions.push(eq(activitySubmissions.grade, null));
            break;
          case 'graded':
            conditions.push(ne(activitySubmissions.grade, null));
            break;
          case 'late':
            if (activity[0].dueDate) {
              conditions.push(sql`${activitySubmissions.submittedAt} > ${activity[0].dueDate}`);
            }
            break;
        }
      }

      if (search) {
        conditions.push(
          or(
            like(users.firstName, `%${search}%`),
            like(users.lastName, `%${search}%`),
            like(users.email, `%${search}%`)
          )
        );
      }

      query = query.where(and(...conditions));

      // Aplicar ordenacao
      const orderColumn = sortBy === 'student' ? users.firstName : activitySubmissions[sortBy];
      query = sortOrder === 'asc' ? query.orderBy(asc(orderColumn)) : query.orderBy(desc(orderColumn));

      // Aplicar paginacao
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      const submissions = await query.limit(parseInt(limit as string)).offset(offset);

      // Buscar arquivos para cada submissao
      const submissionsWithFiles = await Promise.all(
        submissions.map(async (item) => {
          const files = await db
            .select()
            .from(submissionFiles)
            .where(eq(submissionFiles.submissionId, item.submission.id));

          return {
            ...item,
            files
          };
        })
      );

      // Contar total para paginacao
      const totalQuery = db
        .select({ count: count() })
        .from(activitySubmissions)
        .innerJoin(users, eq(activitySubmissions.studentId, users.id))
        .where(and(...conditions));
      
      const [{ count: total }] = await totalQuery;

      res.json({
        submissions: submissionsWithFiles,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string))
        }
      });
    } catch (error) {
      console.error('Erro ao buscar submissA?es filtradas:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar historico de uma submissao
  app.get('/api/submissions/:id/history', isAuthenticated, async (req, res) => {
  try {
      const { id: submissionId } = req.params;
    const user = req.user as any;
    
      // Verificar se o usuario pode ver o historico
      const submission = await db
        .select()
        .from(activitySubmissions)
        .where(eq(activitySubmissions.id, submissionId))
        .limit(1);

      if (submission.length === 0) {
        return res.status(404).json({ message: "Submissao nao encontrada" });
      }

      // Verificar permissA?es
      if (user.role === 'student' && submission[0].studentId !== user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      if (user.role === 'teacher') {
        if (!submission[0].activityId) {
          return res.status(400).json({ message: "ID da atividade nao encontrado" });
        }
        
        const activity = await db
          .select()
          .from(activities)
          .where(eq(activities.id, submission[0].activityId))
          .limit(1);

        if (activity.length === 0 || activity[0].teacherId !== user.id) {
          return res.status(403).json({ message: "Acesso negado" });
        }
      }

      const history = await db
        .select({
          history: submissionHistory,
          performer: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            role: users.role
          }
        })
        .from(submissionHistory)
        .innerJoin(users, eq(submissionHistory.performedBy, users.id))
        .where(eq(submissionHistory.submissionId, submissionId))
        .orderBy(asc(submissionHistory.performedAt));

      res.json(history);
    } catch (error) {
      console.error('Erro ao buscar historico:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
  }
});

  // Upload de arquivos para atividade (apenas professores)
  app.post('/api/activities/:id/files', isAuthenticated, hasRole(['teacher']), upload.array('files', 5), async (req, res) => {
  try {
      const { id: activityId } = req.params;
    const user = req.user as any;
      const { category } = req.body;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ message: "Arquivo nao fornecido" });
      }

      if (!category || !['reference', 'template', 'example'].includes(category)) {
        return res.status(400).json({ message: "Categoria invalida" });
      }

      // Verificar se o professor pode adicionar arquivos
      const activity = await db
        .select()
        .from(activities)
        .where(eq(activities.id, activityId))
        .limit(1);

      if (activity.length === 0 || activity[0].teacherId !== user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const fileRecords = files.map(file => ({
        id: uuidv4(),
        activityId,
        fileName: file.filename,
        originalFileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        fileType: file.mimetype,
        fileCategory: category,
        uploadedBy: user.id,
        createdAt: new Date().toISOString()
      }));

      await db.insert(activityFiles).values(fileRecords);

      res.status(201).json({
        message: "Arquivos enviados com sucesso",
        files: fileRecords
      });
  } catch (error) {
      console.error('Erro ao enviar arquivos:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Download de arquivo
  app.get('/api/files/:filename', isAuthenticated, (req, res) => {
    try {
      const { filename } = req.params;
      const filePath = path.join(__dirname, '../uploads', filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Arquivo nao encontrado" });
      }

      res.download(filePath);
  } catch (error) {
      console.error('Erro ao fazer download:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Rota de teste
  app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!' });
  });

  // ===== ROTAS DE NOTAS =====
  
  // Buscar notas do aluno
  app.get('/api/grades/student/:studentId', isAuthenticated, async (req, res) => {
    try {
      const { studentId } = req.params;
      const { academicYear } = req.query;
      const user = req.user as any;
      
      // Verificar permissões
      if (user.role === 'student' && user.id !== studentId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Professor só pode acessar boletim de alunos das turmas em que leciona
      if (user.role === 'teacher') {
        const enrolled = await db
          .select({ classId: studentClass.classId })
          .from(studentClass)
          .where(and(eq(studentClass.studentId, studentId), eq(studentClass.status, 'active')))
          .limit(1);

        if (enrolled.length === 0) {
          return res.status(404).json({ message: 'Aluno sem turma ativa' });
        }

        const classId = enrolled[0].classId;
        const teaches = await db
          .select({ id: classSubjects.id })
          .from(classSubjects)
          .where(and(eq(classSubjects.classId, classId), eq(classSubjects.teacherId, user.id)))
          .limit(1);

        if (teaches.length === 0) {
          return res.status(403).json({ message: 'Acesso negado: aluno não pertence a turmas do professor' });
        }
      }
      
      let whereConditions = [eq(grades.studentId, studentId)];
      
      // Buscar notas atraves de classSubjects para obter o ano academico
      const studentGrades = await db
        .select({
          id: grades.id,
          classSubjectId: grades.classSubjectId,
          type: grades.type,
          title: grades.title,
          grade: grades.grade,
          maxGrade: grades.maxGrade,
          weight: grades.weight,
          date: grades.date,
          comments: grades.comments,
          subjectName: subjects.name,
          subjectCode: subjects.code,
          teacherName: users.firstName,
          teacherLastName: users.lastName,
          academicYear: classSubjects.academicYear,
          createdAt: grades.createdAt,
          updatedAt: grades.updatedAt
        })
        .from(grades)
        .innerJoin(classSubjects, eq(grades.classSubjectId, classSubjects.id))
        .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
        .innerJoin(users, eq(classSubjects.teacherId, users.id))
        .where(
          academicYear && academicYear !== 'all' 
            ? and(...whereConditions, eq(classSubjects.academicYear, academicYear as string))
            : and(...whereConditions)
        )
        .orderBy(asc(subjects.name), asc(grades.date));
      
      res.json(studentGrades);
    } catch (error) {
      console.error('Erro ao buscar notas:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Criar/atualizar nota
  app.post('/api/grades', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const {
        studentId,
        classSubjectId,
        type,
        title,
        grade,
        maxGrade,
        weight,
        date,
        comments
      } = req.body;

      if (!studentId || !classSubjectId || !type || !title || !grade || !date) {
        return res.status(400).json({ message: "Campos obrigatorios nao preenchidos" });
      }

      // Verificar se ja existe nota para este aluno/atividade
      const existingGrade = await db
        .select()
        .from(grades)
        .where(
          and(
            eq(grades.studentId, studentId),
            eq(grades.classSubjectId, classSubjectId),
            eq(grades.title, title)
          )
        )
        .limit(1);

      if (existingGrade.length > 0) {
        // Atualizar nota existente
        await db
          .update(grades)
          .set({
            grade,
            maxGrade: maxGrade || 10,
            weight: weight || 1,
            date,
            comments,
            updatedAt: new Date().toISOString()
          })
          .where(eq(grades.id, existingGrade[0].id));

        res.json({
          message: "Nota atualizada com sucesso",
          grade: { ...existingGrade[0], grade, maxGrade, weight, date, comments, updatedAt: new Date().toISOString() }
        });
      } else {
        // Criar nova nota
        const newGrade = {
          id: uuidv4(),
          studentId,
          classSubjectId,
          type,
          title,
          grade,
          maxGrade: maxGrade || 10,
          weight: weight || 1,
          date,
          comments,
          createdBy: (req.user as any).id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await db.insert(grades).values(newGrade);

        res.status(201).json({
          message: "Nota criada com sucesso",
          grade: newGrade
        });
      }
    } catch (error) {
      console.error('Erro ao criar/atualizar nota:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== ROTAS DE FREQUA?NCIA =====
  
  // Buscar frequencia do aluno

  // ===== ROTAS DE EVENTOS =====
  
  // Buscar eventos
  // ROTA REMOVIDA - usando a rota mais completa abaixo
  // app.get('/api/events', isAuthenticated, async (req, res) => { ... });

  // Criar evento
  // ===== ROTAS DE STATUS DOS USUï¿½RIOS =====
  
  // Atualizar status do usuario (online/offline/ausente)
  app.post('/api/users/status', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { status } = req.body;
      
      // So atualizar se o status mudou ou se passou mais de 5 minutos
      const currentUser = await db.select({ lastSeen: users.lastSeen }).from(users).where(eq(users.id, user.id)).limit(1);
      
      if (currentUser.length > 0) {
        const lastUpdate = currentUser[0].lastSeen ? new Date(currentUser[0].lastSeen) : null;
        const now = new Date();
        
        // So atualiza se passou mais de 5 minutos desde a ultima atualizacao
        if (!lastUpdate || (now.getTime() - lastUpdate.getTime()) > 300000) {
          await db
            .update(users)
            .set({ 
              lastSeen: now.toISOString(),
              status: status || 'online'
            })
            .where(eq(users.id, user.id));
          
          // Log apenas mudancas de status importantes (para terminal virtual)
          logger.statusTerminal(`Status atualizado para usuario ${user.id}: ${status}`, {
            userId: user.id,
            status,
            timestamp: now.toISOString()
          });
        }
      }
      
      res.json({ message: "Status atualizado com sucesso" });
    } catch (error) {
      logger.error('Erro ao atualizar status do usuario', { userId: (req.user as any)?.id, error: (error as Error).message });
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Buscar status dos usuarios
  app.get('/api/users/status', isAuthenticated, async (req, res) => {
    try {
      const { userIds } = req.query;
      
      // Corrigir validacao para aceitar string separada por virgula
      let userIdsArray: string[] = [];
      
      if (typeof userIds === 'string') {
        userIdsArray = userIds.split(',').filter(id => id.trim());
      } else if (Array.isArray(userIds)) {
        userIdsArray = userIds.filter(id => id && typeof id === 'string').map(id => String(id));
      }
      
      if (userIdsArray.length === 0) {
        return res.status(400).json({ message: "IDs dos usuarios sao obrigatorios" });
      }
      
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutos
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutos
      
      const usersStatus = await db
        .select({
          id: users.id,
          status: users.status,
          lastSeen: users.lastSeen
        })
        .from(users)
        .where(inArray(users.id, userIdsArray));
      
      // Determinar status baseado na atividade
      const processedStatus = usersStatus.map(user => {
        if (!user.lastSeen) return { ...user, currentStatus: 'offline' };
        
        const lastSeen = new Date(user.lastSeen);
        
        if (lastSeen > fiveMinutesAgo) {
          return { ...user, currentStatus: 'online' };
        } else if (lastSeen > thirtyMinutesAgo) {
          return { ...user, currentStatus: 'ausente' };
        } else {
          return { ...user, currentStatus: 'offline' };
        }
      });
      
      res.json({ data: processedStatus });
    } catch (error) {
      logger.error('Erro ao buscar status dos usuarios', { error: (error as Error).message });
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // GET /api/admin/students/:id/enrollments - Buscar disciplinas do aluno
  app.get('/api/admin/students/:id/enrollments', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      
      console.log("Disciplinas do aluno " + id + " solicitadas por: " + user.firstName + " " + user.lastName);

      // Buscar turma do aluno
      const studentClassData = await db
        .select({
          classId: studentClass.classId,
          className: classes.name,
          classGrade: classes.grade,
          classSection: classes.section,
          enrollmentDate: studentClass.enrollmentDate,
          status: studentClass.status
        })
        .from(studentClass)
        .innerJoin(classes, eq(studentClass.classId, classes.id))
        .where(and(
          eq(studentClass.studentId, id),
          eq(studentClass.status, 'active')
        ))
        .limit(1);

      if (studentClassData.length === 0) {
        return res.json({ 
          classes: [],
          subjects: []
        });
      }

      const classId = studentClassData[0].classId;

      // Buscar disciplinas da turma
      const subjectsData = await db
        .select({
          id: subjects.id,
          name: subjects.name,
          code: subjects.code,
          description: subjects.description,
          credits: subjects.credits,
          workload: subjects.workload
        })
        .from(subjects)
        .innerJoin(classSubjects, eq(subjects.id, classSubjects.subjectId))
        .where(and(
          eq(classSubjects.classId, classId),
          eq(subjects.status, 'active')
        ));

      res.json({
        classes: [studentClassData[0]],
        subjects: subjectsData
      });
    } catch (error) {
      console.error('Erro ao buscar disciplinas do aluno:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== ROTAS DE ATIVIDADES =====
  
  // Buscar atividades do aluno
  app.get('/api/activities/student/:studentId', isAuthenticated, async (req, res) => {
    try {
      const { studentId } = req.params;
      const user = req.user as any;
      
      console.log('=== BUSCANDO ATIVIDADES DO ALUNO ===');
      console.log('Student ID:', studentId);
      console.log('User requesting:', user.id, user.role);
      
      // Verificar se o usuario e o proprio aluno ou um professor
      if (user.role === 'student' && user.id !== studentId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Buscar apenas atividades das turmas em que o aluno esta matriculado
      const studentActivities = await db
        .select({
          id: activities.id,
          title: activities.title,
          description: activities.description,
          subjectId: activities.subjectId,
          subjectName: subjects.name,
          subjectCode: subjects.code,
          teacherId: activities.teacherId,
          teacherName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`.as('teacherName'),
          classId: activities.classId,
          className: classes.name,
          dueDate: activities.dueDate,
          maxGrade: activities.maxGrade,
          instructions: activities.instructions,
          requirements: activities.requirements,
          status: activities.status,
          allowLateSubmission: activities.allowLateSubmission,
          latePenalty: activities.latePenalty,
          createdAt: activities.createdAt,
          updatedAt: activities.updatedAt,
          // Dados da submissao do aluno
          submissionId: activitySubmissions.id,
          submissionStatus: activitySubmissions.status,
          submittedAt: activitySubmissions.submittedAt,
          submissionComment: activitySubmissions.comment,
          grade: activitySubmissions.grade,
          feedback: activitySubmissions.feedback,
          isLate: activitySubmissions.isLate,
          finalGrade: activitySubmissions.finalGrade,
          latePenaltyApplied: activitySubmissions.latePenaltyApplied
        })
        .from(activities)
        .innerJoin(subjects, eq(activities.subjectId, subjects.id))
        .innerJoin(users, eq(activities.teacherId, users.id))
        .innerJoin(classes, eq(activities.classId, classes.id))
        .innerJoin(studentClass, and(
          eq(studentClass.classId, activities.classId),
          eq(studentClass.studentId, studentId),
          eq(studentClass.status, 'active')
        ))
        .leftJoin(activitySubmissions, and(
          eq(activities.id, activitySubmissions.activityId),
          eq(activitySubmissions.studentId, studentId)
        ))
        .where(eq(activities.status, 'active'))
        .orderBy(asc(activities.dueDate));
      
      console.log("Encontradas " + studentActivities.length + " atividades para o aluno matriculado");
      
      res.json({ data: studentActivities });
    } catch (error) {
      console.error('Erro ao buscar atividades do aluno:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // ===== ROTAS PARA PROFESSORES =====
  
  
  // Buscar atividades criadas pelo professor
  app.get('/api/activities/teacher/:teacherId', isAuthenticated, async (req, res) => {
    try {
      const { teacherId } = req.params;
      const user = req.user as any;
      
      console.log('=== BUSCANDO ATIVIDADES DO PROFESSOR ===');
      console.log('Teacher ID:', teacherId);
      console.log('User requesting:', user.id, user.role);
      
      // Verificar se o usuario e o proprio professor ou admin
      if (user.role === 'teacher' && user.id !== teacherId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Primeiro, verificar se existem atividades para este professor
      const allActivitiesForTeacher = await db
        .select()
        .from(activities)
        .where(eq(activities.teacherId, teacherId));
      
      console.log("Total de atividades diretas do professor: " + allActivitiesForTeacher.length);
      
      if (allActivitiesForTeacher.length > 0) {
        console.log('?? Atividades encontradas:');
        allActivitiesForTeacher.forEach((activity, index) => {
          console.log((index + 1) + ". " + activity.title);
          console.log("   Subject ID: " + activity.subjectId);
          console.log("   Class ID: " + activity.classId);
          console.log("   Status: " + activity.status);
        });
      }
      
      // Buscar atividades do professor diretamente pelo teacherId
      const teacherActivities = await db
        .select({
          id: activities.id,
          title: activities.title,
          description: activities.description,
          subjectId: activities.subjectId,
          subjectName: subjects.name,
          subjectCode: subjects.code,
          classId: activities.classId,
          className: classes.name,
          dueDate: activities.dueDate,
          maxGrade: activities.maxGrade,
          instructions: activities.instructions,
          requirements: activities.requirements,
          status: activities.status,
          allowLateSubmission: activities.allowLateSubmission,
          latePenalty: activities.latePenalty,
          maxFileSize: activities.maxFileSize,
          allowedFileTypes: activities.allowedFileTypes,
          createdAt: activities.createdAt,
          updatedAt: activities.updatedAt,
          // Contagem de submissA?es
          submissionCount: sql<number>`COUNT(${activitySubmissions.id})`.as('submissionCount'),
          gradedCount: sql<number>`COUNT(CASE WHEN ${activitySubmissions.status} = 'graded' THEN 1 END)`.as('gradedCount'),
          pendingCount: sql<number>`COUNT(CASE WHEN ${activitySubmissions.status} = 'submitted' THEN 1 END)`.as('pendingCount')
        })
        .from(activities)
        .innerJoin(subjects, eq(activities.subjectId, subjects.id))
        .innerJoin(classes, eq(activities.classId, classes.id))
        .leftJoin(activitySubmissions, eq(activities.id, activitySubmissions.activityId))
        .where(eq(activities.teacherId, teacherId))
        .groupBy(activities.id)
        .orderBy(desc(activities.createdAt));
      
      console.log("? Encontradas " + teacherActivities.length + " atividades das disciplinas do professor");
      
      // Debug: verificar se os JOINs estao funcionando
      if (allActivitiesForTeacher.length > 0 && teacherActivities.length === 0) {
        console.log('? PROBLEMA: Atividades existem mas JOINs falharam!');
        
        // Verificar se subjects e classes existem
        const allSubjects = await db.select().from(subjects);
        const allClasses = await db.select().from(classes);
        
        console.log("Total de subjects: " + allSubjects.length);
        console.log("Total de classes: " + allClasses.length);
        
        // Verificar IDs especificos
        const firstActivity = allActivitiesForTeacher[0];
        const subjectExists = allSubjects.find(s => s.id === firstActivity.subjectId);
        const classExists = allClasses.find(c => c.id === firstActivity.classId);
        
        console.log("Verificando IDs da primeira atividade:");
        console.log("   Subject ID: " + firstActivity.subjectId + " - Existe: " + (subjectExists ? 'SIM' : 'NAO'));
        console.log("   Class ID: " + firstActivity.classId + " - Existe: " + (classExists ? 'SIM' : 'NAO'));
        
        if (subjectExists) {
          console.log("   Subject name: " + subjectExists.name);
        }
        if (classExists) {
          console.log("   Class name: " + classExists.name);
        }
      }
      
      res.json({ data: teacherActivities });
    } catch (error) {
      console.error('Erro ao buscar atividades do professor:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  


  // ===== ROTAS PARA GESTA?O DE TURMAS =====
  
  // Buscar turmas do professor com detalhes completos
  app.get('/api/teacher/:teacherId/classes-detailed', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { teacherId } = req.params;
      const user = req.user as any;
      
      console.log('=== API CLASSES-DETAILED ===');
      console.log('Teacher ID:', teacherId);
      console.log('User ID:', user.id);
      console.log('User Role:', user.role);
      
      // Verificar se o professor pode acessar os dados
      if (user.id !== teacherId && user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Buscar turmas com disciplinas e contagem de alunos
      const classesWithDetails = await db
          .select({
          classId: classes.id,
          className: classes.name,
          grade: classes.grade,
          section: classes.section,
          academicYear: classes.academicYear,
          subjectId: subjects.id,
          subjectName: subjects.name,
          subjectCode: subjects.code,
          schedule: classSubjects.schedule,
          room: classSubjects.room,
        })
        .from(classes)
          .innerJoin(classSubjects, and(
          eq(classSubjects.classId, classes.id),
          eq(classSubjects.teacherId, teacherId),
            eq(classSubjects.status, 'active')
          ))
        .innerJoin(subjects, eq(subjects.id, classSubjects.subjectId))
        .where(eq(classes.status, 'active'))
        .orderBy(classes.grade, classes.section);
      
      // Agrupar por turma
      const classesMap = new Map();
      
      for (const item of classesWithDetails) {
        if (!classesMap.has(item.classId)) {
          // Contar alunos da turma
          const studentCount = await db
            .select({ count: sql`count(*)` })
            .from(studentClass)
            .where(and(
              eq(studentClass.classId, item.classId),
              eq(studentClass.status, 'active')
            ));

          // Buscar alunos da turma
          const students = await db
          .select({
              id: users.id,
              firstName: users.firstName,
              lastName: users.lastName,
              email: users.email,
              registrationNumber: users.registrationNumber,
              profileImageUrl: users.profileImageUrl
            })
            .from(users)
            .innerJoin(studentClass, and(
              eq(studentClass.studentId, users.id),
              eq(studentClass.classId, item.classId),
              eq(studentClass.status, 'active')
            ))
            .where(eq(users.status, 'active'))
            .orderBy(users.firstName, users.lastName);
          
          classesMap.set(item.classId, {
            id: item.classId,
            name: item.className,
            grade: item.grade,
            section: item.section,
            academicYear: item.academicYear,
            subjects: [],
            studentCount: studentCount[0]?.count || 0,
            students: students
          });
        }
        
        const classData = classesMap.get(item.classId);
        classData.subjects.push({
          id: item.subjectId,
          name: item.subjectName,
          code: item.subjectCode,
          schedule: item.schedule,
          room: item.room
        });
      }
      
      const result = Array.from(classesMap.values());
      
      console.log('? Resultado final:', result.length, 'turmas');
      result.forEach(r => {
        console.log("  - " + r.name + ": " + r.students.length + " alunos");
        if (r.students.length > 0) {
          r.students.forEach(s => console.log("    * " + s.firstName + " " + s.lastName + " (" + s.id + ")"));
        }
      });
      
      res.json({ data: result });
    } catch (error) {
      console.error('Erro ao buscar turmas detalhadas:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Buscar detalhes de uma turma especifica
  app.get('/api/classes/:classId/detail', isAuthenticated, async (req, res) => {
    try {
      const { classId } = req.params;
      const user = req.user as any;
      
      // Buscar dados da turma
      const classData = await db
          .select({
            id: classes.id,
            name: classes.name,
            grade: classes.grade,
            section: classes.section,
          academicYear: classes.academicYear,
          capacity: classes.capacity,
          // currentStudents serï¿½ calculado dinamicamente
          })
          .from(classes)
        .where(eq(classes.id, classId))
        .limit(1);
      
      if (classData.length === 0) {
        return res.status(404).json({ message: "Turma nao encontrada" });
      }
      
      // Verificar se o usuario tem acesso A? turma
      if (user.role === 'teacher') {
        const hasAccess = await db
          .select({ count: sql`count(*)` })
          .from(classSubjects)
          .where(and(
            eq(classSubjects.classId, classId),
            eq(classSubjects.teacherId, user.id),
            eq(classSubjects.status, 'active')
          ));
        
        if (hasAccess[0]?.count === 0) {
          return res.status(403).json({ message: "Acesso negado" });
        }
      }
      
      res.json({ data: classData[0] });
    } catch (error) {
      console.error('Erro ao buscar detalhes da turma:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });


  // Buscar presenca de uma turma para um dia especifico

  // ===== ROTAS PARA SISTEMA DE NOTAS =====
  
  // Buscar notas de uma turma por bimestre
  app.get('/api/classes/:classId/grades/:quarter', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { classId, quarter } = req.params;
      const user = req.user as any;
      
      // Verificar acesso A? turma
      const hasAccess = await db
        .select({ count: sql`count(*)` })
        .from(classSubjects)
        .where(and(
          eq(classSubjects.classId, classId),
          eq(classSubjects.teacherId, user.id),
          eq(classSubjects.status, 'active')
        ));
      
      if (hasAccess[0]?.count === 0) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Buscar notas dos alunos para o bimestre
      console.log('?? ===== BUSCANDO NOTAS =====');
      console.log('?? Quarter:', quarter);
      console.log('?? Class ID:', classId);
      console.log('?? Filtro de data:', `strftime('%m', date) = ${quarter.toString().padStart(2, '0')}`);
      
      // Primeiro, buscar todas as notas para debug
      const allGrades = await db
        .select({
          studentId: grades.studentId,
          type: grades.type,
          grade: grades.grade,
          title: grades.title,
          date: grades.date,
          studentName: sql`${users.firstName} || ' ' || ${users.lastName}`.as('studentName')
        })
        .from(grades)
        .innerJoin(users, eq(users.id, grades.studentId))
        .innerJoin(classSubjects, eq(classSubjects.id, grades.classSubjectId))
        .where(eq(classSubjects.classId, classId));
      
      console.log('?? Todas as notas da turma:', allGrades.length);
      allGrades.forEach(grade => {
        console.log("  - " + grade.studentName + ": " + grade.type + " = " + grade.grade + " (" + grade.date + ")");
      });
      
      console.log('?? Executando consulta filtrada...');
      const gradesData = await db
        .select({
          studentId: grades.studentId,
          type: grades.type,
          grade: grades.grade,
          title: grades.title,
          date: grades.date,
          studentName: sql`${users.firstName} || ' ' || ${users.lastName}`.as('studentName')
        })
        .from(grades)
        .innerJoin(users, eq(users.id, grades.studentId))
        .innerJoin(classSubjects, eq(classSubjects.id, grades.classSubjectId))
        .where(and(
          eq(classSubjects.classId, classId),
          sql`strftime('%m', ${grades.date}) = ${quarter.toString().padStart(2, '0')}` // Filtrar por bimestre (MM)
        ));
      
      console.log('?? ===== RESULTADO DA CONSULTA FILTRADA =====');
      console.log('?? Notas encontradas para quarter', quarter, ':', gradesData.length);
      gradesData.forEach(grade => {
        console.log("  ? " + grade.studentName + ": " + grade.type + " = " + grade.grade + " (" + grade.date + ")");
      });
      
      res.json({ data: gradesData });
    } catch (error) {
      console.error('Erro ao buscar notas:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Salvar/atualizar nota de um aluno
  app.post('/api/classes/:classId/grades', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { classId } = req.params;
      const { studentId, quarter, type, grade, title } = req.body;
      const user = req.user as any;
      
      console.log('=== SALVANDO NOTA BACKEND ===');
      console.log('Class ID:', classId);
      console.log('Student ID:', studentId);
      console.log('Quarter:', quarter);
      console.log('Type:', type);
      console.log('Grade:', grade);
      console.log('Title:', title);
      console.log('User:', user.id);
      
      // Verificar acesso A? turma e pegar classSubjectId
      console.log('?? Buscando classSubject...');
      console.log('Class ID:', classId);
      console.log('Teacher ID:', user.id);
      
      const classSubjectData = await db
        .select({ id: classSubjects.id })
        .from(classSubjects)
        .where(and(
          eq(classSubjects.classId, classId),
          eq(classSubjects.teacherId, user.id),
          eq(classSubjects.status, 'active')
        ))
        .limit(1);
      
      console.log('?? ClassSubject encontrados:', classSubjectData.length);
      
      if (classSubjectData.length === 0) {
        console.log('? Nenhum classSubject encontrado - acesso negado');
        return res.status(403).json({ message: "Acesso negado - turma nao encontrada para este professor" });
      }
      
      const classSubjectId = classSubjectData[0].id;
      console.log('? ClassSubject ID encontrado:', classSubjectId);
      
      // Verificar se ja existe uma nota deste tipo para este aluno no bimestre
      const existingGrade = await db
        .select({ id: grades.id })
        .from(grades)
        .where(and(
          eq(grades.studentId, studentId),
          eq(grades.classSubjectId, classSubjectId),
          eq(grades.type, type),
          sql`strftime('%m', ${grades.date}) = ${quarter.toString().padStart(2, '0')}` // Filtrar por mes
        ))
        .limit(1);
      
      const currentDate = new Date().toISOString();
      const gradeDate = `2024-${quarter.toString().padStart(2, '0')}-15`; // 15 do mes do bimestre
      console.log('?? Data da nota:', gradeDate);
      console.log('?? Quarter:', quarter);
      
      if (existingGrade.length > 0) {
        console.log('?? Atualizando nota existente...');
        // Atualizar nota existente
        await db
          .update(grades)
          .set({
            grade: parseFloat(grade),
            title: title,
            updatedAt: currentDate
          })
          .where(eq(grades.id, existingGrade[0].id));
        
        console.log('? Nota atualizada com sucesso');
      } else {
        console.log('? Criando nova nota...');
        // Criar nova nota
        const newGrade = {
          id: `grade_${Date.now()}_${studentId}`,
          studentId: studentId,
          classSubjectId: classSubjectId,
          type: type,
          title: title,
          grade: parseFloat(grade),
          maxGrade: 10,
          weight: 1,
          date: gradeDate,
          createdBy: user.id,
          createdAt: currentDate,
          updatedAt: currentDate
        };
        
        await db.insert(grades).values(newGrade);
        console.log('? Nova nota criada com sucesso');
      }
      
      console.log('?? Nota salva com sucesso - enviando resposta');
      res.json({ message: "Nota salva com sucesso" });
    } catch (error) {
      console.error('Erro ao salvar nota:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar medias dos alunos por bimestre
  app.get('/api/classes/:classId/averages/:quarter', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { classId, quarter } = req.params;
      const user = req.user as any;
      
      // Verificar acesso A? turma
      const hasAccess = await db
        .select({ count: sql`count(*)` })
        .from(classSubjects)
        .where(and(
          eq(classSubjects.classId, classId),
          eq(classSubjects.teacherId, user.id),
          eq(classSubjects.status, 'active')
        ));
      
      if (hasAccess[0]?.count === 0) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Buscar medias calculadas dos alunos
      const averagesData = await db
          .select({
          studentId: grades.studentId,
          studentName: sql`${users.firstName} || ' ' || ${users.lastName}`.as('studentName'),
          examGrade: sql`MAX(CASE WHEN ${grades.type} = 'exam' THEN ${grades.grade} END)`.as('examGrade'),
          homeworkGrade: sql`MAX(CASE WHEN ${grades.type} = 'homework' THEN ${grades.grade} END)`.as('homeworkGrade'),
          average: sql`
            CASE 
              WHEN MAX(CASE WHEN ${grades.type} = 'exam' THEN ${grades.grade} END) IS NOT NULL 
                   AND MAX(CASE WHEN ${grades.type} = 'homework' THEN ${grades.grade} END) IS NOT NULL
              THEN (MAX(CASE WHEN ${grades.type} = 'exam' THEN ${grades.grade} END) + 
                    MAX(CASE WHEN ${grades.type} = 'homework' THEN ${grades.grade} END)) / 2.0
              ELSE NULL
            END
          `.as('average')
        })
        .from(grades)
        .innerJoin(users, eq(users.id, grades.studentId))
        .innerJoin(classSubjects, eq(classSubjects.id, grades.classSubjectId))
        .where(and(
          eq(classSubjects.classId, classId),
          sql`substr(${grades.date}, 6, 2) = ${quarter.toString().padStart(2, '0')}`
        ))
        .groupBy(grades.studentId, users.firstName, users.lastName);
      
      res.json({ data: averagesData });
    } catch (error) {
      console.error('Erro ao buscar medias:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Endpoint para calcular media geral de todos os bimestres
  app.get('/api/classes/:classId/general-averages', async (req, res) => {
    try {
      const { classId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Nao autorizado" });
      }

      // Verificar se o usuario tem acesso A? turma
      const hasAccess = await db
        .select({ count: sql<number>`count(*)` })
        .from(classSubjects)
        .where(and(
          eq(classSubjects.classId, classId),
          eq(classSubjects.teacherId, userId)
        ));

      if (hasAccess[0]?.count === 0) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      console.log('?? Calculando medias gerais para turma:', classId);

      // Buscar todas as notas de todos os bimestres
      const allGrades = await db
        .select({
          studentId: grades.studentId,
          grade: grades.grade,
          date: grades.date,
          studentName: sql`${users.firstName} || ' ' || ${users.lastName}`.as('studentName')
        })
        .from(grades)
        .innerJoin(users, eq(users.id, grades.studentId))
        .innerJoin(classSubjects, eq(classSubjects.id, grades.classSubjectId))
        .where(eq(classSubjects.classId, classId));

      console.log('?? Total de notas encontradas:', allGrades.length);

      // Agrupar por estudante e calcular media geral
      const studentAverages: any = {};
      
      allGrades.forEach(grade => {
        if (!studentAverages[grade.studentId]) {
          studentAverages[grade.studentId] = {
            studentId: grade.studentId,
            studentName: grade.studentName,
            grades: [],
            quarterAverages: {}
          };
        }
        studentAverages[grade.studentId].grades.push(grade.grade);
        
        // Calcular media por bimestre
        const month = new Date(grade.date).getMonth() + 1;
        const quarter = Math.ceil(month / 3); // 1-3 = 1? bimestre, 4-6 = 2? bimestre, etc.
        
        if (!studentAverages[grade.studentId].quarterAverages[quarter]) {
          studentAverages[grade.studentId].quarterAverages[quarter] = [];
        }
        studentAverages[grade.studentId].quarterAverages[quarter].push(grade.grade);
      });

      // Calcular medias finais
      const finalAverages = Object.values(studentAverages).map((student: any) => {
        // Media geral (todos os bimestres)
        const generalAverage = student.grades.length > 0 
          ? Math.round((student.grades.reduce((sum: number, grade: number) => sum + grade, 0) / student.grades.length) * 100) / 100
          : 0;

        // Medias por bimestre
        const quarterAverages = {};
        for (let q = 1; q <= 4; q++) {
          if (student.quarterAverages[q] && student.quarterAverages[q].length > 0) {
            quarterAverages[q] = Math.round((student.quarterAverages[q].reduce((sum: number, grade: number) => sum + grade, 0) / student.quarterAverages[q].length) * 100) / 100;
          } else {
            quarterAverages[q] = 0;
          }
        }

        // Status baseado na media geral (6.0 para aprovacao)
        let status = 'Pendente';
        if (generalAverage >= 6.0) {
          status = 'Aprovado';
        } else if (generalAverage >= 4.0) {
          status = 'Recuperacao';
        } else if (generalAverage > 0) {
          status = 'Reprovado';
        }

        return {
          studentId: student.studentId,
          studentName: student.studentName,
          generalAverage,
          quarterAverages,
          status,
          totalGrades: student.grades.length
        };
      });

      console.log('?? Medias gerais calculadas:', finalAverages.length);
      res.json({ data: finalAverages });

    } catch (error) {
      console.error('Erro ao calcular medias gerais:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Buscar submissA?es de uma atividade
  app.get('/api/activities/:id/submissions', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user as any;
      
      console.log('=== BUSCANDO SUBMISSA?ES DA ATIVIDADE ===');
      console.log('Activity ID:', id);
      console.log('User:', user.id, user.role);
      
      // Verificar se a atividade existe e se o professor tem permissao
      const activityPermission = await db
        .select({
          activity: activities,
          classSubject: classSubjects
        })
        .from(activities)
        .innerJoin(classSubjects, and(
          eq(classSubjects.classId, activities.classId),
          eq(classSubjects.subjectId, activities.subjectId)
        ))
        .where(eq(activities.id, id))
        .limit(1);
      
      if (activityPermission.length === 0) {
        return res.status(404).json({ message: "Atividade nao encontrada" });
      }
      
      const { activity, classSubject } = activityPermission[0];
      
      // Se for professor, verificar se leciona esta disciplina
      if (user.role === 'teacher') {
        if (activity.teacherId !== user.id || classSubject.teacherId !== user.id) {
          return res.status(403).json({ 
            message: "Voce so pode ver submissA?es de atividades das disciplinas que leciona" 
          });
        }
      }
      
      // Buscar submissA?es apenas de alunos matriculados na turma
      const submissions = await db
        .select({
          id: activitySubmissions.id,
          studentId: activitySubmissions.studentId,
          submittedAt: activitySubmissions.submittedAt,
          comment: activitySubmissions.comment,
          status: activitySubmissions.status,
          grade: activitySubmissions.grade,
          feedback: activitySubmissions.feedback,
          isLate: activitySubmissions.isLate,
          finalGrade: activitySubmissions.finalGrade,
          latePenaltyApplied: activitySubmissions.latePenaltyApplied,
          // Dados do aluno
          studentName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`.as('studentName'),
          studentEmail: users.email,
          studentRegistration: users.registrationNumber
        })
        .from(activitySubmissions)
        .innerJoin(users, eq(activitySubmissions.studentId, users.id))
        .innerJoin(studentClass, and(
          eq(studentClass.studentId, activitySubmissions.studentId),
          eq(studentClass.classId, activity.classId),
          eq(studentClass.status, 'active')
        ))
        .where(eq(activitySubmissions.activityId, id))
        .orderBy(desc(activitySubmissions.submittedAt));
      
      console.log("? Encontradas " + submissions.length + " submissA?es de alunos matriculados");
      
      res.json({ data: submissions });
    } catch (error) {
      console.error('Erro ao buscar submissA?es:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Buscar todas as submissA?es pendentes do professor
  app.get('/api/teacher/:teacherId/pending-submissions', isAuthenticated, async (req, res) => {
    try {
      const { teacherId } = req.params;
      const user = req.user as any;
      
      console.log('=== BUSCANDO SUBMISSA?ES PENDENTES DO PROFESSOR ===');
      console.log('Teacher ID:', teacherId);
      console.log('User requesting:', user.id, user.role);
      
      // Verificar se o usuario e o proprio professor
      if (user.role === 'teacher' && user.id !== teacherId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Buscar submissA?es pendentes apenas das disciplinas que o professor leciona
      const pendingSubmissions = await db
        .select({
          submissionId: activitySubmissions.id,
          activityId: activities.id,
          activityTitle: activities.title,
          subjectName: subjects.name,
          subjectCode: subjects.code,
          className: classes.name,
          studentId: activitySubmissions.studentId,
          studentName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`.as('studentName'),
          studentEmail: users.email,
          submittedAt: activitySubmissions.submittedAt,
          comment: activitySubmissions.comment,
          isLate: activitySubmissions.isLate,
          latePenaltyApplied: activitySubmissions.latePenaltyApplied,
          maxGrade: activities.maxGrade,
          dueDate: activities.dueDate
        })
        .from(activitySubmissions)
        .innerJoin(activities, eq(activitySubmissions.activityId, activities.id))
        .innerJoin(subjects, eq(activities.subjectId, subjects.id))
        .innerJoin(classes, eq(activities.classId, classes.id))
        .innerJoin(users, eq(activitySubmissions.studentId, users.id))
        .innerJoin(classSubjects, and(
          eq(classSubjects.classId, activities.classId),
          eq(classSubjects.subjectId, activities.subjectId),
          eq(classSubjects.teacherId, teacherId)
        ))
        .where(and(
          eq(activities.teacherId, teacherId),
          eq(activitySubmissions.status, 'submitted'),
          eq(classSubjects.status, 'active'),
          eq(activities.classId, '3e281468-7ade-440c-949a-a132787eb1bb') // Filtrar apenas turma 7? C
        ))
        .orderBy(desc(activitySubmissions.submittedAt));
      
      console.log("? Encontradas " + pendingSubmissions.length + " submissA?es pendentes");
      
      res.json({ data: pendingSubmissions });
    } catch (error) {
      console.error('Erro ao buscar submissA?es pendentes:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Avaliar submissao especifica de atividade
  app.post('/api/submissions/:submissionId/grade', isAuthenticated, async (req, res) => {
    try {
      const { submissionId } = req.params;
      const { grade, feedback } = req.body;
      const user = req.user as any;
      
      console.log('=== AVALIANDO SUBMISSA?O ===');
      console.log('Submission ID:', submissionId);
      console.log('Grade:', grade);
      console.log('Teacher:', user.id);
      
      if (user.role !== 'teacher') {
        return res.status(403).json({ message: "Apenas professores podem avaliar atividades" });
      }
      
      if (grade === undefined || grade === null) {
        return res.status(400).json({ message: "Nota e obrigatoria" });
      }
      
      // Buscar a submissao e verificar permissA?es completas
      const submissionData = await db
        .select({
          submission: activitySubmissions,
          activity: activities,
          classSubject: classSubjects
        })
        .from(activitySubmissions)
        .innerJoin(activities, eq(activitySubmissions.activityId, activities.id))
        .innerJoin(classSubjects, and(
          eq(classSubjects.classId, activities.classId),
          eq(classSubjects.subjectId, activities.subjectId),
          eq(classSubjects.teacherId, user.id)
        ))
        .where(eq(activitySubmissions.id, submissionId))
        .limit(1);
      
      if (submissionData.length === 0) {
        return res.status(404).json({ 
          message: "Submissao nao encontrada ou voce nao tem permissao para avalia-la" 
        });
      }
      
      const { submission: sub, activity, classSubject } = submissionData[0];
      
      // Verificacao dupla de seguranca
      if (activity.teacherId !== user.id || classSubject.teacherId !== user.id) {
        return res.status(403).json({ 
          message: "Voce so pode avaliar submissA?es de atividades das disciplinas que leciona" 
        });
      }
      
      // Validar nota
      const gradeValue = Number(grade);
      if (gradeValue < 0 || gradeValue > activity.maxGrade) {
        return res.status(400).json({ 
          message: `A nota deve estar entre 0 e ${activity.maxGrade}` 
        });
      }
      
      // Calcular nota final considerando penalidades
      let finalGrade = gradeValue;
      if (sub.isLate && sub.latePenaltyApplied > 0) {
        finalGrade = Math.max(0, finalGrade - sub.latePenaltyApplied);
      }
      
      // Atualizar a submissao
      await db
        .update(activitySubmissions)
        .set({
          grade: gradeValue,
          finalGrade: finalGrade,
          feedback: feedback || '',
          status: 'graded',
          gradedBy: user.id,
          gradedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .where(eq(activitySubmissions.id, submissionId));
      
      console.log('? Submissao avaliada com sucesso pelo professor autorizado!');
      
      res.json({ 
        message: "Submissao avaliada com sucesso",
        grade: gradeValue,
        finalGrade: finalGrade,
        latePenaltyApplied: sub.latePenaltyApplied,
        maxGrade: activity.maxGrade
      });
    } catch (error) {
      console.error('Erro ao avaliar submissao:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Submeter atividade (com suporte a arquivos)
  app.post('/api/activities/:id/submit', isAuthenticated, upload.array('files', 5), async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user as any;
      
      console.log('=== SUBMISSA?O DE ATIVIDADE ===');
      console.log('Activity ID:', id);
      console.log('User ID:', user.id);
      
      // Apenas alunos podem submeter atividades
      if (user.role !== 'student') {
        return res.status(403).json({ message: "Apenas alunos podem submeter atividades" });
      }
      
      // Verificar se a atividade existe e esta ativa
      const activityResult = await db
        .select()
        .from(activities)
        .where(eq(activities.id, id))
        .limit(1);
      
      if (activityResult.length === 0) {
        return res.status(404).json({ message: "Atividade nao encontrada" });
      }
      
      const activity = activityResult[0];
      
      if (activity.status !== 'active' && activity.status !== 'pendente') {
        return res.status(400).json({ message: "Atividade nao esta disponivel para submissao" });
      }
      
      // Verificar se ja existe uma submissao
      const existingSubmission = await db
        .select()
        .from(activitySubmissions)
        .where(and(eq(activitySubmissions.activityId, id), eq(activitySubmissions.studentId, user.id)))
        .limit(1);
      
      if (existingSubmission.length > 0) {
        // Se existe, primeiro remover a submissao anterior
        await db
          .delete(submissionFiles)
          .where(eq(submissionFiles.submissionId, existingSubmission[0].id));
        
        await db
          .delete(activitySubmissions)
          .where(eq(activitySubmissions.id, existingSubmission[0].id));
      }
      
      // Verificar se esta atrasado
      const now = new Date();
      const dueDate = new Date(activity.dueDate);
      const isLate = now > dueDate;
      
      if (isLate && !activity.allowLateSubmission) {
        return res.status(400).json({ message: "Prazo de entrega expirado e submissA?es em atraso nao sao permitidas" });
      }
      
      // Calcular penalidade por atraso
      let latePenaltyApplied = 0;
      if (isLate && activity.allowLateSubmission) {
        latePenaltyApplied = activity.latePenalty || 0;
      }
      
      // Extrair conteudo do formulario
      const content = req.body.content || '';
      console.log('?? Conteï¿½do da submissï¿½o:', content);
      console.log('?? Arquivos recebidos:', req.files?.length || 0);
      
      // Criar nova submissao
      const newSubmission = {
        id: uuidv4(),
        activityId: id,
        studentId: user.id,
        submittedAt: now.toISOString(),
        comment: content,
        status: isLate ? 'late' as const : 'submitted' as const,
        maxGrade: activity.maxGrade,
        isLate: isLate,
        latePenaltyApplied: latePenaltyApplied,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      
      await db.insert(activitySubmissions).values(newSubmission);
      console.log('? Submissï¿½o criada com sucesso:', newSubmission.id);
      
      // Log submissï¿½o de atividade
      logger.activitySubmitted(user, activity.title, req);
      
      // Processar arquivos enviados
      const files = req.files as Express.Multer.File[] || [];
      
      for (const file of files) {
        const fileId = uuidv4();
        
        // O arquivo ja foi salvo pelo multer, vamos apenas registrar no banco
        // O multer ja salvou com um nome unico, vamos usar o path do arquivo
        const filePath = file.path; // Caminho onde o multer salvou o arquivo
        
        // Salvar informacA?es do arquivo no banco
        await db.insert(submissionFiles).values({
          id: fileId,
          submissionId: newSubmission.id,
          fileName: file.filename, // Nome unico gerado pelo multer
          originalFileName: file.originalname,
          filePath: filePath,
          fileSize: file.size,
          fileType: file.mimetype,
          uploadedAt: now.toISOString()
        });
      }
      
      console.log('? Submissao criada com sucesso!');
      console.log("?? " + files.length + " arquivo(s) processado(s)");
      
      res.json({ 
        message: "Atividade submetida com sucesso",
        submission: {
          id: newSubmission.id,
          isLate: isLate,
          latePenaltyApplied: latePenaltyApplied,
          filesCount: files.length
        }
      });
    } catch (error) {
      console.error('Erro ao submeter atividade:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Desfazer entrega de atividade (apenas se nao foi avaliada)
  app.post('/api/activities/:id/undo-submit', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user as any;
      
      console.log('=== DESFAZENDO ENTREGA DE ATIVIDADE ===');
      console.log('Activity ID:', id);
      console.log('User ID:', user.id);
      
      if (user.role !== 'student') {
        return res.status(403).json({ message: "Apenas alunos podem desfazer entregas" });
      }
      
      // Buscar a submissao do aluno
      const submission = await db
        .select()
        .from(activitySubmissions)
        .where(and(
          eq(activitySubmissions.activityId, id),
          eq(activitySubmissions.studentId, user.id)
        ))
        .limit(1);
      
      if (submission.length === 0) {
        return res.status(404).json({ message: "Submissao nao encontrada" });
      }
      
      const sub = submission[0];
      
      // Verificar se ja foi avaliada
      if (sub.status === 'graded') {
        return res.status(400).json({ 
          message: "Nao e possivel desfazer a entrega de uma atividade ja avaliada" 
        });
      }
      
      // Remover a submissao
      await db
        .delete(activitySubmissions)
        .where(eq(activitySubmissions.id, sub.id));
      
      console.log('? Entrega desfeita com sucesso!');
      
      res.json({ 
        message: "Entrega desfeita com sucesso. Voce pode enviar novamente."
      });
    } catch (error) {
      console.error('Erro ao desfazer entrega:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== ROTAS DE MENSAGENS (CHAT) =====
  
  // Buscar conversas do usuario
  app.get('/api/messages/conversations', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Log acesso ao chat
      logger.chatAccessed(user, req);
      
      // REGRA: Buscar todas as conversas com a A?LTIMA mensagem de cada uma
      // Primeiro, encontrar todos os usuarios com quem o usuario atual teve conversas
      const conversationUsers = await db
        .selectDistinct({
          otherUserId: sql<string>`CASE 
            WHEN ${messages.senderId} = ${user.id} THEN ${messages.recipientId}
            ELSE ${messages.senderId}
          END`.as('otherUserId')
        })
        .from(messages)
        .where(
          or(
            eq(messages.senderId, user.id),
            eq(messages.recipientId, user.id)
          )
        );
      
      // Para cada conversa, buscar a ultima mensagem e dados do usuario
      const conversations = [];
      
      for (const conv of conversationUsers) {
        // Buscar a ultima mensagem da conversa
        const lastMessageData = await db
          .select({
            content: messages.content,
            createdAt: messages.createdAt,
            senderId: messages.senderId
          })
          .from(messages)
          .where(
            and(
              or(
                and(eq(messages.senderId, user.id), eq(messages.recipientId, conv.otherUserId)),
                and(eq(messages.senderId, conv.otherUserId), eq(messages.recipientId, user.id))
              )
            )
          )
          .orderBy(desc(messages.createdAt))
          .limit(1);
        
        // Buscar dados do outro usuario
        const otherUserData = await db
          .select({
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            role: users.role,
            profileImageUrl: users.profileImageUrl
          })
          .from(users)
          .where(eq(users.id, conv.otherUserId))
          .limit(1);
        
        // Contar mensagens nao lidas
        const unreadResult = await db
          .select({ count: count() })
          .from(messages)
          .where(
            and(
              eq(messages.recipientId, user.id),
              eq(messages.senderId, conv.otherUserId),
              eq(messages.read, false)
            )
          );
        
        if (lastMessageData.length > 0 && otherUserData.length > 0) {
          conversations.push({
            conversationId: conv.otherUserId,
            otherUserId: conv.otherUserId,
            otherUserFirstName: otherUserData[0].firstName,
            otherUserLastName: otherUserData[0].lastName,
            otherUserRole: otherUserData[0].role,
            otherUserProfileImageUrl: otherUserData[0].profileImageUrl,
            recipientAvatar: otherUserData[0].profileImageUrl,
            recipientEmail: otherUserData[0].email,
            lastMessage: lastMessageData[0].content,
            lastMessageTime: lastMessageData[0].createdAt,
            unreadCount: unreadResult[0]?.count || 0
          });
        }
      }
      
      // Ordenar por ultima mensagem (mais recente primeiro)
      conversations.sort((a, b) => {
        const timeA = new Date(a.lastMessageTime).getTime();
        const timeB = new Date(b.lastMessageTime).getTime();
        return timeB - timeA;
      });
      
      res.json(conversations);
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar mensagens de uma conversa (usando ID do usuario)
  app.get('/api/messages/conversation/:userId', isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const user = req.user as any;
      
      // Buscar mensagens entre os dois usuarios
      const messagesList = await db
        .select({
          id: messages.id,
          content: messages.content,
          senderId: messages.senderId,
          senderName: users.firstName,
          senderLastName: users.lastName,
          recipientId: messages.recipientId,
          read: messages.read,
          createdAt: messages.createdAt,
          updatedAt: messages.updatedAt
        })
        .from(messages)
        .innerJoin(users, eq(messages.senderId, users.id))
        .where(
          and(
            or(
              and(eq(messages.senderId, user.id), eq(messages.recipientId, userId)),
              and(eq(messages.senderId, userId), eq(messages.recipientId, user.id))
            )
          )
        )
        .orderBy(asc(messages.createdAt));
      
      // Marcar mensagens como lidas
      await db
        .update(messages)
        .set({ read: true })
        .where(
          and(
            eq(messages.recipientId, user.id),
            eq(messages.senderId, userId),
            eq(messages.read, false)
          )
        );
      
      res.json({ data: messagesList });
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Enviar mensagem
  app.post('/api/messages', isAuthenticated, async (req, res) => {
    try {
      const {
        recipientEmail,
        content,
        conversationId
      } = req.body;

      if (!recipientEmail || !content) {
        return res.status(400).json({ message: "Email do destinatario e conteudo sao obrigatorios" });
      }

      // Buscar usuario destinatario
      const recipient = await db
        .select()
        .from(users)
        .where(eq(users.email, recipientEmail))
        .limit(1);

      if (recipient.length === 0) {
        return res.status(404).json({ message: "Usuario nao encontrado" });
      }

      const sender = req.user as any;

      const newMessage = {
        id: uuidv4(),
        senderId: sender.id,
        recipientId: recipient[0].id,
        subject: null,
        content,
        type: 'private' as const,
        read: false,
        priority: 'medium' as const,
        parentMessageId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.insert(messages).values(newMessage);

      // Log envio de mensagem
      logger.messageSent(sender, 1, req);

      // Criar conversa automatica para o destinatario se nao existir
      try {
        // Verificar se ja existe uma conversa entre os usuarios
        const existingConversation = await db
          .select()
          .from(messages)
          .where(
            or(
              and(eq(messages.senderId, sender.id), eq(messages.recipientId, recipient[0].id)),
              and(eq(messages.senderId, recipient[0].id), eq(messages.recipientId, sender.id))
            )
          )
          .limit(1);

        if (existingConversation.length === 0) {
          // Criar primeira conversa - inserir uma mensagem "virtual" para o destinatario
          const virtualMessage = {
            id: uuidv4(),
            senderId: recipient[0].id,
            recipientId: sender.id,
            subject: null,
            content: "Conversa iniciada",
            type: 'private' as const,
            read: false,
            priority: 'medium' as const,
            parentMessageId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          await db.insert(messages).values(virtualMessage);
        }
      } catch (conversationError) {
        console.error('Erro ao criar conversa automatica:', conversationError);
        // Nao falhar o envio da mensagem por causa disso
      }

      res.status(201).json({
        message: "Mensagem enviada com sucesso",
        messageData: newMessage
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Editar mensagem (apenas ate 5 minutos apos envio)
  app.put('/api/messages/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const user = req.user as any;

      if (!content) {
        return res.status(400).json({ message: "Conteudo e obrigatorio" });
      }

      // Buscar mensagem
      const message = await db
        .select()
        .from(messages)
        .where(eq(messages.id, id))
        .limit(1);

      if (message.length === 0) {
        return res.status(404).json({ message: "Mensagem nao encontrada" });
      }

      // Verificar se o usuario e o remetente
      if (message[0].senderId !== user.id) {
        return res.status(403).json({ message: "Apenas o remetente pode editar a mensagem" });
      }

      // Verificar se passou de 5 minutos
      const messageTime = new Date(message[0].createdAt);
      const currentTime = new Date();
      const timeDiff = (currentTime.getTime() - messageTime.getTime()) / (1000 * 60);

      if (timeDiff > 5) {
        return res.status(400).json({ message: "Nao e possivel editar mensagens apos 5 minutos" });
      }

      await db
        .update(messages)
        .set({
          content,
          updatedAt: new Date().toISOString()
        })
        .where(eq(messages.id, id));

      res.json({
        message: "Mensagem editada com sucesso",
        messageData: { ...message[0], content, updatedAt: new Date().toISOString() }
      });
    } catch (error) {
      console.error('Erro ao editar mensagem:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Excluir mensagem (apenas ate 5 minutos apos envio)
  app.delete('/api/messages/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user as any;

      // Buscar mensagem
      const message = await db
        .select()
        .from(messages)
        .where(eq(messages.id, id))
        .limit(1);

      if (message.length === 0) {
        return res.status(404).json({ message: "Mensagem nao encontrada" });
      }

      // Verificar se o usuario e o remetente
      if (message[0].senderId !== user.id) {
        return res.status(403).json({ message: "Apenas o remetente pode excluir a mensagem" });
      }

      // Verificar se passou de 5 minutos
      const messageTime = new Date(message[0].createdAt);
      const currentTime = new Date();
      const timeDiff = (currentTime.getTime() - messageTime.getTime()) / (1000 * 60);

      if (timeDiff > 5) {
        return res.status(400).json({ message: "Nao e possivel excluir mensagens apos 5 minutos" });
      }

      await db.delete(messages).where(eq(messages.id, id));

      res.json({ message: "Mensagem excluida com sucesso" });
    } catch (error) {
      console.error('Erro ao excluir mensagem:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Download de arquivo de submissao (professores e alunos)
  app.get('/api/submissions/files/:fileId/download', isAuthenticated, async (req, res) => {
    try {
      const { fileId } = req.params;
      const user = req.user as any;

      // Buscar arquivo
      const file = await db
        .select()
        .from(submissionFiles)
        .where(eq(submissionFiles.id, fileId))
        .limit(1);

      if (file.length === 0) {
        return res.status(404).json({ message: "Arquivo nao encontrado" });
      }

      // Verificar se o usuario pode acessar este arquivo
      const submission = await db
        .select({ 
          activityId: activitySubmissions.activityId,
          studentId: activitySubmissions.studentId
        })
        .from(activitySubmissions)
        .where(eq(activitySubmissions.id, file[0].submissionId))
        .limit(1);

      if (submission.length === 0) {
        return res.status(404).json({ message: "Submissao nao encontrada" });
      }

      const activity = await db
        .select()
        .from(activities)
        .where(eq(activities.id, submission[0].activityId))
        .limit(1);

      if (activity.length === 0) {
        return res.status(404).json({ message: "Atividade nao encontrada" });
      }

      // Verificar permissA?es: professor da atividade ou aluno que fez a submissao
      const isTeacher = user.role === 'teacher' && activity[0].teacherId === user.id;
      const isStudent = user.role === 'student' && submission[0].studentId === user.id;

      if (!isTeacher && !isStudent) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Enviar arquivo
      const filePath = path.resolve(file[0].filePath);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Arquivo nao encontrado no servidor" });
      }

      res.setHeader('Content-Disposition', `attachment; filename="${file[0].originalFileName}"`);
      res.setHeader('Content-Type', file[0].fileType);
      res.sendFile(filePath);
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Visualizar arquivo de submissao (professores e alunos)
  app.get('/api/submissions/files/:fileId/view', isAuthenticated, async (req, res) => {
    try {
      const { fileId } = req.params;
      const user = req.user as any;

      // Buscar arquivo
      const file = await db
        .select()
        .from(submissionFiles)
        .where(eq(submissionFiles.id, fileId))
        .limit(1);

      if (file.length === 0) {
        return res.status(404).json({ message: "Arquivo nao encontrado" });
      }

      // Verificar se o usuario pode acessar este arquivo
      const submission = await db
        .select({ 
          activityId: activitySubmissions.activityId,
          studentId: activitySubmissions.studentId
        })
        .from(activitySubmissions)
        .where(eq(activitySubmissions.id, file[0].submissionId))
        .limit(1);

      if (submission.length === 0) {
        return res.status(404).json({ message: "Submissao nao encontrada" });
      }

      const activity = await db
        .select()
        .from(activities)
        .where(eq(activities.id, submission[0].activityId))
        .limit(1);

      if (activity.length === 0) {
        return res.status(404).json({ message: "Atividade nao encontrada" });
      }

      // Verificar permissA?es: professor da atividade ou aluno que fez a submissao
      const isTeacher = user.role === 'teacher' && activity[0].teacherId === user.id;
      const isStudent = user.role === 'student' && submission[0].studentId === user.id;

      if (!isTeacher && !isStudent) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Permitir visualizacao de todos os tipos de arquivo

      // Enviar arquivo para visualizacao
      const filePath = path.resolve(file[0].filePath);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Arquivo nao encontrado no servidor" });
      }

      // Definir Content-Type baseado na extensao do arquivo
      const fileExtension = path.extname(file[0].originalFileName).toLowerCase();
      let contentType = file[0].fileType;
      
      // Mapear extensA?es para Content-Types corretos
      const mimeTypes = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.txt': 'text/plain',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif'
      };
      
      if (mimeTypes[fileExtension]) {
        contentType = mimeTypes[fileExtension];
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${file[0].originalFileName}"`);
      res.sendFile(filePath);
    } catch (error) {
      console.error('Erro ao visualizar arquivo:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });


  // Download de todas as submissA?es como ZIP
  app.get('/api/activities/:id/submissions/download-all', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { id: activityId } = req.params;
      const user = req.user as any;

      // Verificar se o professor pode acessar esta atividade
      const activity = await db
        .select()
        .from(activities)
        .where(eq(activities.id, activityId))
        .limit(1);

      if (activity.length === 0 || activity[0].teacherId !== user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Buscar submissA?es
      const submissions = await db
        .select({
          submission: activitySubmissions,
          student: {
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email
          }
        })
        .from(activitySubmissions)
        .innerJoin(users, eq(activitySubmissions.studentId, users.id))
        .where(eq(activitySubmissions.activityId, activityId));

      if (submissions.length === 0) {
        return res.status(404).json({ message: "Nenhuma submissao encontrada" });
      }

      const archiver = (await import('archiver')).default;
      const path = (await import('path')).default;
      const fs = (await import('fs')).default;

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${activity[0].title}_submissoes.zip"`);

      const archive = archiver('zip', { zlib: { level: 9 } });
      
      archive.on('error', (err) => {
        console.error('Erro ao criar ZIP:', err);
        res.status(500).json({ message: "Erro ao criar arquivo ZIP" });
      });

      archive.pipe(res);

      // Adicionar submissA?es ao ZIP
      for (const item of submissions) {
        const studentName = `${item.student.firstName}_${item.student.lastName}`;
        const submissionFolder = `${studentName}/`;
        
        // Adicionar resposta em texto
        if (item.submission.comment) {
          archive.append(item.submission.comment, { 
            name: `${submissionFolder}resposta.txt` 
          });
        }

        // Buscar arquivos da submissao
        const files = await db
          .select()
          .from(submissionFiles)
          .where(eq(submissionFiles.submissionId, item.submission.id));

        // Adicionar arquivos
        for (const file of files) {
          const filePath = path.resolve(file.filePath);
          if (fs.existsSync(filePath)) {
            archive.file(filePath, { 
              name: `${submissionFolder}${file.originalFileName}` 
            });
          }
        }
      }

      archive.finalize();
    } catch (error) {
      console.error('Erro ao baixar submissA?es:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Exportar notas como CSV
  app.get('/api/activities/:id/submissions/export-grades', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { id: activityId } = req.params;
      const user = req.user as any;

      // Verificar se o professor pode acessar esta atividade
      const activity = await db
        .select()
        .from(activities)
        .where(eq(activities.id, activityId))
        .limit(1);

      if (activity.length === 0 || activity[0].teacherId !== user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Buscar submissA?es com notas
      const submissions = await db
        .select({
          submission: activitySubmissions,
          student: {
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email
          }
        })
        .from(activitySubmissions)
        .innerJoin(users, eq(activitySubmissions.studentId, users.id))
        .where(and(
          eq(activitySubmissions.activityId, activityId),
          eq(activitySubmissions.status, 'graded')
        ))
        .orderBy(asc(users.firstName), asc(users.lastName));

      if (submissions.length === 0) {
        return res.status(404).json({ message: "Nenhuma submissao avaliada encontrada" });
      }

      // Criar CSV
      let csv = 'Nome,Email,Nota Original,Penalidade por Atraso,Nota Final,Data de Submissao,Feedback\n';
      
      submissions.forEach(item => {
        const studentName = `${item.student.firstName} ${item.student.lastName}`;
        const email = item.student.email;
        const originalGrade = item.submission.grade || 0;
        const penalty = item.submission.latePenaltyApplied || 0;
        const finalGrade = item.submission.finalGrade || originalGrade;
        const submittedAt = new Date(item.submission.submittedAt).toLocaleDateString('pt-BR');
        const feedback = (item.submission.feedback || '').replace(/"/g, '""');
        
        csv += `"${studentName}","${email}",${originalGrade},${penalty},${finalGrade},"${submittedAt}","${feedback}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${activity[0].title}_notas.csv"`);
      res.send('\ufeff' + csv); // BOM para UTF-8
    } catch (error) {
      console.error('Erro ao exportar notas:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== RECUPERAÇÃO DE SENHA SEGURA =====
  type RecoveryRequest = { userId: string; codeHash: string; expiresAt: number; attempts: number; resetToken?: string };
  const recoveryRequests = new Map<string, RecoveryRequest>();
  const recoveryRate = new Map<string, { count: number; resetAt: number }>();
  const recoveryHash = (value: string) => crypto.createHash('sha256').update(`${value}:${process.env.SESSION_SECRET || 'development-only'}`).digest('hex');
  const cleanPhone = (value: string) => value.replace(/\D/g, '');

  app.post('/api/auth/recovery/request', async (req, res) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const rate = recoveryRate.get(ip);
    if (rate && rate.resetAt > now && rate.count >= 3) return res.status(429).json({ message: 'Muitas tentativas. Aguarde 15 minutos.' });
    recoveryRate.set(ip, !rate || rate.resetAt <= now ? { count: 1, resetAt: now + 15 * 60_000 } : { ...rate, count: rate.count + 1 });

    const identifier = String(req.body.identifier || '').trim().toLowerCase();
    const requestId = crypto.randomUUID();
    if (!identifier) return res.status(400).json({ message: 'Informe o e-mail da conta.' });

    const result = await client.execute({
      sql: `SELECT id, email, firstName FROM users WHERE lower(email) = ? LIMIT 1`,
      args: [identifier],
    });
    if (result.rows.length === 0) return res.status(404).json({ message: 'Nenhuma conta foi encontrada com este e-mail.' });

    const account = result.rows[0] as any;
    const code = crypto.randomInt(100000, 1000000).toString();
    recoveryRequests.set(requestId, { userId: String(account.id), codeHash: recoveryHash(code), expiresAt: now + 10 * 60_000, attempts: 0 });
    console.info(`[DEMO] Código de recuperação gerado para ${identifier}.`);
    res.json({ message: 'Código de demonstração gerado.', requestId, demoCode: code });
  });

  app.post('/api/auth/recovery/verify', (req, res) => {
    const requestId = String(req.body.requestId || '');
    const code = String(req.body.code || '');
    const record = recoveryRequests.get(requestId);
    if (!record || record.expiresAt < Date.now()) return res.status(400).json({ message: 'Código inválido ou expirado.' });
    record.attempts++;
    if (record.attempts > 5) { recoveryRequests.delete(requestId); return res.status(429).json({ message: 'Limite de tentativas excedido.' }); }
    if (recoveryHash(code) !== record.codeHash) return res.status(400).json({ message: 'Código inválido ou expirado.' });
    record.resetToken = crypto.randomBytes(32).toString('hex');
    res.json({ resetToken: record.resetToken });
  });

  app.post('/api/auth/recovery/reset', async (req, res) => {
    const requestId = String(req.body.requestId || '');
    const resetToken = String(req.body.resetToken || '');
    const newPassword = String(req.body.newPassword || '');
    const record = recoveryRequests.get(requestId);
    const storedToken = record?.resetToken || '';
    const tokenMatches = storedToken.length === resetToken.length
      && storedToken.length > 0
      && crypto.timingSafeEqual(Buffer.from(storedToken), Buffer.from(resetToken));
    if (!record || record.expiresAt < Date.now() || !tokenMatches) return res.status(400).json({ message: 'Autorização inválida ou expirada.' });
    if (newPassword.length < 8) return res.status(400).json({ message: 'A senha deve ter pelo menos 8 caracteres.' });
    await client.execute({ sql: 'UPDATE users SET password = ?, updatedAt = ? WHERE id = ?', args: [await bcrypt.hash(newPassword, 12), new Date().toISOString(), record.userId] });
    recoveryRequests.delete(requestId);
    res.json({ message: 'Senha redefinida com sucesso.' });
  });

  // Endpoints antigos foram desativados por exporem o código de verificação.
  app.all(['/api/auth/forgot-password', '/api/auth/verify-code', '/api/auth/reset-password', '/api/auth/send-email-code'], (_req, res) => res.status(410).json({ message: 'Use o novo fluxo de recuperação de senha.' }));

  // ===== ROTAS DE RECUPERAï¿½ï¿½O DE SENHA (LEGADO INACESSÍVEL) =====
  
  // Armazenar cï¿½digos de verificaï¿½ï¿½o temporariamente (em produï¿½ï¿½o, usar Redis)
  const verificationCodes = new Map<string, { code: string; expires: number; email: string }>();
  
  // Gerar cï¿½digo de 6 dï¿½gitos
  const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };
  
  // Sistema extremamente avanï¿½ado de envio de cï¿½digos
  const sendSMS = async (phone: string, code: string, email?: string) => {
    const results = {
      sms: false,
      email: false,
      whatsapp: false,
      console: true
    };
    
    try {
      console.log(`?? SISTEMA AVANï¿½ADO DE ENVIO - Cï¿½digo: ${code}`);
      
      // Formatar nï¿½mero para Brasil (+55)
      const formattedPhone = phone.startsWith('+55') ? phone : `+55${phone}`;
      
      // 1. TENTAR Mï¿½LTIPLAS APIs DE SMS
      const smsApis = [
        {
          name: 'SMSDev Brasil',
          url: 'https://api.smsdev.com.br/v1/send',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: { number: formattedPhone, message: `SchoolManager: ${code}` }
        },
        {
          name: 'Z-API',
          url: 'https://api.z-api.io/instances/SEU_TOKEN/send-text',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: { phone: formattedPhone, message: `Cï¿½digo: ${code}` }
        },
        {
          name: 'API SMS Gratuita',
          url: 'https://api.smsdev.com.br/v1/send',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: { phone: formattedPhone, message: `Cï¿½digo SchoolManager: ${code}` }
        }
      ];
      
      for (const api of smsApis) {
        try {
          const response = await fetch(api.url, {
            method: api.method,
            headers: api.headers,
            body: JSON.stringify(api.body)
          });
          
          if (response.ok) {
            console.log(`? SMS enviado via ${api.name} para ${formattedPhone}`);
            results.sms = true;
            break;
          }
        } catch (error) {
          console.log(`?? ${api.name} falhou: ${error.message}`);
        }
      }
      
      // 2. TENTAR ENVIO POR EMAIL (se disponï¿½vel)
      if (email) {
        try {
          const emailResponse = await fetch('/api/auth/send-email-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code, phone: formattedPhone })
          });
          
          if (emailResponse.ok) {
            console.log(`? Email enviado para ${email}`);
            results.email = true;
          }
        } catch (error) {
          console.log('?? Email nï¿½o disponï¿½vel');
        }
      }
      
      // 3. TENTAR WHATSAPP BUSINESS API
      try {
        const whatsappResponse = await fetch('https://graph.facebook.com/v17.0/SEU_PHONE_ID/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer SEU_ACCESS_TOKEN'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'text',
            text: { body: `?? *SchoolManager - Recuperaï¿½ï¿½o de Senha*\n\nSeu cï¿½digo: *${code}*\n\nVï¿½lido por 10 minutos.` }
          })
        });
        
        if (whatsappResponse.ok) {
          console.log(`? WhatsApp Business enviado para ${formattedPhone}`);
          results.whatsapp = true;
        }
      } catch (error) {
        console.log('?? WhatsApp Business nï¿½o disponï¿½vel');
      }
      
      // 4. FALLBACK: CONSOLE E WHATSAPP WEB
      console.log(`\n?? ===== Cï¿½DIGO DE VERIFICAï¿½ï¿½O =====`);
      console.log(`?? Nï¿½mero: ${formattedPhone}`);
      console.log(`?? Cï¿½digo: ${code}`);
      console.log(`? Vï¿½lido por: 10 minutos`);
      console.log(`=====================================\n`);
      
      // 5. GERAR LINK WHATSAPP WEB
      const whatsappUrl = `https://web.whatsapp.com/send?phone=${formattedPhone}&text=??%20SchoolManager%20-%20Recuperaï¿½ï¿½o%20de%20Senha%0A%0ASeu%20cï¿½digo%20de%20verificaï¿½ï¿½o%20ï¿½:%20*${code}*%0A%0AVï¿½lido%20por%2010%20minutos.`;
      console.log(`?? Link WhatsApp Web: ${whatsappUrl}`);
      
      return {
        success: true,
        results,
        whatsappUrl,
        code
      };
      
    } catch (error) {
      console.error('? Erro no sistema avanï¿½ado:', error);
      console.log(`?? Cï¿½DIGO PARA TESTE: ${code}`);
      return {
        success: true,
        results: { console: true },
        whatsappUrl: `https://web.whatsapp.com/send?phone=+55${phone}&text=Cï¿½digo: ${code}`,
        code
      };
    }
  };

  // Solicitar recuperaï¿½ï¿½o de senha
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { phone } = req.body;
      
      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Nï¿½mero de telefone ï¿½ obrigatï¿½rio'
        });
      }

      console.log(`?? Solicitaï¿½ï¿½o de recuperaï¿½ï¿½o de senha para: ${phone}`);

      // Limpar formataï¿½ï¿½o do telefone para busca
      const cleanPhone = phone.replace(/\D/g, '');
      console.log(`?? Telefone limpo para busca: ${cleanPhone}`);

      // Buscar usuï¿½rio pelo telefone (tentar tanto formatado quanto limpo)
      const userResult = await client.execute(`
        SELECT id, email, firstName, lastName, phone 
        FROM users 
        WHERE phone = ? OR phone = ? OR phone = ?
      `, [phone, cleanPhone, `+55${cleanPhone}`]);

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Nenhum usuï¿½rio encontrado com este nï¿½mero de telefone'
        });
      }

      const user = userResult.rows[0];
      
      // Gerar cï¿½digo de verificaï¿½ï¿½o
      const code = generateVerificationCode();
      const expires = Date.now() + (10 * 60 * 1000); // 10 minutos
      
      // Armazenar cï¿½digo
      verificationCodes.set(phone, { code, expires, email: String(user.email || '') });
      
      // Enviar SMS com sistema avanï¿½ado
      // Enviar SMS com sistema DUPLO (SMSDev + Z-API)
      const { default: DualSmsService } = await import('./services/dualSmsService.mjs');
      const sendResult = await DualSmsService.sendCode(phone, code);
      
      console.log(`? Cï¿½digo de verificaï¿½ï¿½o gerado para ${phone}: ${code}`);
      
      res.json({
        success: true,
        message: 'Cï¿½digo enviado atravï¿½s de mï¿½ltiplos canais!',
        email: user.email,
        whatsappUrl: sendResult.whatsappUrl,
        code: sendResult.code,
        results: sendResult.results
      });
      
    } catch (error) {
      console.error('? Erro na recuperaï¿½ï¿½o de senha:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  // Verificar cï¿½digo de verificaï¿½ï¿½o
  app.post('/api/auth/verify-code', async (req, res) => {
    try {
      const { phone, code } = req.body;
      
      if (!phone || !code) {
        return res.status(400).json({
          success: false,
          message: 'Telefone e cï¿½digo sï¿½o obrigatï¿½rios'
        });
      }

      console.log(`?? Verificando cï¿½digo para ${phone}: ${code}`);

      const storedData = verificationCodes.get(phone);
      
      if (!storedData) {
        return res.status(400).json({
          success: false,
          message: 'Cï¿½digo nï¿½o encontrado ou expirado'
        });
      }

      if (Date.now() > storedData.expires) {
        verificationCodes.delete(phone);
        return res.status(400).json({
          success: false,
          message: 'Cï¿½digo expirado'
        });
      }

      if (storedData.code !== code) {
        return res.status(400).json({
          success: false,
          message: 'Cï¿½digo invï¿½lido'
        });
      }

      console.log(`? Cï¿½digo verificado com sucesso para ${phone}`);
      
      res.json({
        success: true,
        message: 'Cï¿½digo verificado com sucesso'
      });
      
    } catch (error) {
      console.error('? Erro na verificaï¿½ï¿½o do cï¿½digo:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  // Redefinir senha
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { phone, newPassword } = req.body;
      
      if (!phone || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Telefone e nova senha sï¿½o obrigatï¿½rios'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'A senha deve ter pelo menos 6 caracteres'
        });
      }

      console.log(`?? Redefinindo senha para ${phone}`);

      // Verificar se o cï¿½digo ainda ï¿½ vï¿½lido
      const storedData = verificationCodes.get(phone);
      
      if (!storedData || Date.now() > storedData.expires) {
        return res.status(400).json({
          success: false,
          message: 'Cï¿½digo expirado. Solicite um novo cï¿½digo.'
        });
      }

      // Hash da nova senha
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Atualizar senha no banco
      await client.execute(`
        UPDATE users 
        SET password = ?, updatedAt = ?
        WHERE phone = ?
      `, [hashedPassword, new Date().toISOString(), phone]);
      
      // Remover cï¿½digo usado
      verificationCodes.delete(phone);
      
      console.log(`? Senha redefinida com sucesso para ${phone}`);
      
      res.json({
        success: true,
        message: 'Senha redefinida com sucesso'
      });
      
    } catch (error) {
      console.error('? Erro ao redefinir senha:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  // Rota para envio de cï¿½digo por email (fallback)
  app.post('/api/auth/send-email-code', async (req, res) => {
    try {
      const { email, code, phone } = req.body;
      
      console.log(`?? Enviando cï¿½digo por email para ${email}: ${code}`);
      
      // Simular envio de email (em produï¿½ï¿½o, usar SendGrid, AWS SES, etc.)
      console.log(`\n?? ===== EMAIL DE RECUPERAï¿½ï¿½O =====`);
      console.log(`Para: ${email}`);
      console.log(`Assunto: SchoolManager - Cï¿½digo de Verificaï¿½ï¿½o`);
      console.log(`Cï¿½digo: ${code}`);
      console.log(`Telefone: ${phone}`);
      console.log(`Vï¿½lido por: 10 minutos`);
      console.log(`=====================================\n`);
      
      res.json({
        success: true,
        message: 'Email enviado com sucesso'
      });
      
    } catch (error) {
      console.error('? Erro ao enviar email:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao enviar email'
      });
    }
  });

  // ===== ROTAS DE NOTIFICAï¿½ï¿½ES EM TEMPO REAL =====
  
  // Buscar notificaï¿½ï¿½es do usuï¿½rio
  app.get('/api/notifications', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      const notifications = await client.execute(`
        SELECT * FROM notifications 
        WHERE userId = ? 
        ORDER BY createdAt DESC 
        LIMIT 10
      `, [user.id]);
      
      res.json({
        success: true,
        data: notifications.rows
      });
    } catch (error) {
      console.error('? Erro ao buscar notificaï¿½ï¿½es:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });
  
  // Marcar notificaï¿½ï¿½o como lida
  app.put('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user as any;
      
      await client.execute(`
        UPDATE notifications 
        SET isRead = 1, updatedAt = ?
        WHERE id = ? AND userId = ?
      `, [new Date().toISOString(), id, user.id]);
      
      res.json({
        success: true,
        message: 'Notificaï¿½ï¿½o marcada como lida'
      });
    } catch (error) {
      console.error('? Erro ao marcar notificaï¿½ï¿½o:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  // Buscar minha submissao (para alunos)
  app.get('/api/activities/:id/my-submission', isAuthenticated, hasRole(['student']), async (req, res) => {
    try {
      const { id: activityId } = req.params;
      const user = req.user as any;

      // Buscar submissao do aluno
      const submission = await db
        .select()
        .from(activitySubmissions)
        .where(and(
          eq(activitySubmissions.activityId, activityId),
          eq(activitySubmissions.studentId, user.id)
        ))
        .limit(1);

      if (submission.length === 0) {
        return res.status(404).json({ message: "Submissao nao encontrada" });
      }

      // Buscar arquivos da submissao
      const files = await db
        .select()
        .from(submissionFiles)
        .where(eq(submissionFiles.submissionId, submission[0].id));

      res.json({
        ...submission[0],
        files
      });
    } catch (error) {
      console.error('Erro ao buscar submissao:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar historico de submissao
  app.get('/api/submissions/:id/history', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { id: submissionId } = req.params;
      const user = req.user as any;

      // Verificar se a submissao existe e se o professor pode acessa-la
      const submission = await db
        .select({ activityId: activitySubmissions.activityId })
        .from(activitySubmissions)
        .where(eq(activitySubmissions.id, submissionId))
        .limit(1);

      if (submission.length === 0) {
        return res.status(404).json({ message: "Submissao nao encontrada" });
      }

      const activity = await db
        .select()
        .from(activities)
        .where(eq(activities.id, submission[0].activityId))
        .limit(1);

      if (activity.length === 0 || activity[0].teacherId !== user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Por enquanto, retornar historico basico (pode ser expandido no futuro)
      // Em uma implementacao real, voce teria uma tabela submission_history
      const history = [
        {
          id: 'initial',
          submissionId: submissionId,
          action: 'submitted',
          performedBy: 'student',
          performedAt: new Date().toISOString(),
          details: 'Submissao inicial da atividade'
        }
      ];

      res.json(history);
    } catch (error) {
      console.error('Erro ao buscar historico:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ROTA DE TESTE PARA SUBMISSA?O - COMPLETAMENTE SEPARADA
  app.post('/api/test-submit', async (req, res) => {
    try {
      console.log('=== TESTE DE SUBMISSA?O ===');
      console.log('Body:', req.body);
      console.log('Content-Type:', req.get('Content-Type'));
      console.log('Method:', req.method);
      
      res.json({ 
        message: "Teste funcionando!", 
        body: req.body,
        contentType: req.get('Content-Type')
      });
    } catch (error) {
      console.error('Erro no teste:', error);
      res.status(500).json({ message: "Erro no teste" });
    }
  });

  // Buscar turmas do professor para criacao de atividades
  app.get('/api/classes', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const user = req.user as any;
      console.log('=== BUSCANDO TURMAS DO PROFESSOR ===');
      console.log('Teacher ID:', user.id);
      
      // Primeiro, verificar se existem vinculos
      const teacherLinks = await db
        .select()
        .from(classSubjects)
        .where(and(
          eq(classSubjects.teacherId, user.id),
          eq(classSubjects.status, 'active')
        ));
      
      console.log("Vinculos encontrados para professor: " + teacherLinks.length);
      teacherLinks.forEach(link => {
        console.log("  - ClassId: " + link.classId + ", SubjectId: " + link.subjectId + ", Status: " + link.status);
      });
      
      const classesList = await db
        .select({
          id: classes.id,
          name: classes.name,
          grade: classes.grade,
          section: classes.section,
          academicYear: classes.academicYear
        })
        .from(classes)
        .innerJoin(classSubjects, and(
          eq(classSubjects.classId, classes.id),
          eq(classSubjects.teacherId, user.id),
          eq(classSubjects.status, 'active')
        ))
        .where(eq(classes.status, 'active'))
        .groupBy(classes.id)
        .orderBy(classes.name);
      
      console.log("Turmas encontradas para professor: " + classesList.length);
      classesList.forEach(cls => {
        console.log("  - " + cls.name + " (" + cls.id + ")");
      });
      
      console.log("Encontradas " + classesList.length + " turmas para o professor");
      classesList.forEach((c, index) => {
        console.log("  " + (index + 1) + ". " + c.name + " (" + c.id + ")");
      });
      
      res.json({ data: classesList });
    } catch (error) {
      console.error('Erro ao buscar turmas:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== ENDPOINTS ADMINISTRATIVOS =====
  
  // Dashboard administrativo - estatisticas gerais
  app.get('/api/admin/dashboard', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const user = req.user;
      console.log("Dashboard administrativo solicitado por: " + user.firstName + " " + user.lastName);

      // Contar usuarios por funcao
      const usersByRole = await db
        .select({
          role: users.role,
          count: count()
        })
        .from(users)
        .where(eq(users.status, 'active'))
        .groupBy(users.role);

      // Contar turmas ativas
      const activeClasses = await db
        .select({ count: count() })
        .from(classes)
        .where(eq(classes.status, 'active'));

      // Contar disciplinas ativas
      const activeSubjects = await db
        .select({ count: count() })
        .from(subjects)
        .where(eq(subjects.status, 'active'));

      // Usuarios recentes (ultimos 5)
      const recentUsers = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          role: users.role,
          status: users.status,
          phone: users.phone,
          address: users.address,
          registrationNumber: users.registrationNumber,
          createdAt: users.createdAt
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(5);

      const stats = {
        totalUsers: usersByRole.reduce((sum, item) => sum + item.count, 0),
        totalClasses: activeClasses[0]?.count || 0,
        totalSubjects: activeSubjects[0]?.count || 0,
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item.role] = item.count;
          return acc;
        }, {} as Record<string, number>),
        recentUsers
      };

      console.log('?? Estatisticas do dashboard:', stats);
      res.json({ data: stats });
    } catch (error) {
      console.error('Erro ao buscar estatisticas do dashboard:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Listar todos os usuarios (admin)
  app.get('/api/admin/users', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const user = req.user;
      console.log("Listagem de usuarios solicitada por: " + user.firstName + " " + user.lastName);

      // Usar SQL direto para listar usuï¿½rios
      const Database = (await import('better-sqlite3')).default;
      const path = (await import('path')).default;
      const dbPath = schoolDbPath;
      const sqliteDb = new Database(dbPath);
      
      let allUsers = [];
      try {
        const selectSql = `
          SELECT id, firstName, lastName, email, role, status, phone, address, registrationNumber, createdAt, updatedAt
          FROM users 
          WHERE status != 'inactive'
          ORDER BY createdAt DESC
        `;
        
        allUsers = sqliteDb.prepare(selectSql).all();
        console.log(`?? ${allUsers.length} usuï¿½rios encontrados`);
      } finally {
        sqliteDb.close();
      }

      // Para alunos, buscar informaï¿½ï¿½es de turma usando SQL direto
      const usersWithDetails = await Promise.all(
        allUsers.map(async (userItem) => {
          if (userItem.role === 'student') {
            const Database = (await import('better-sqlite3')).default;
            const path = (await import('path')).default;
            const dbPath = schoolDbPath;
            const sqliteDb = new Database(dbPath);
            
            let studentClassData = [];
            try {
              const selectClassSql = `
                SELECT 
                  sc.classId,
                  c.name as className,
                  c.grade as classGrade,
                  c.section as classSection,
                  sc.enrollmentDate
                FROM studentClass sc
                INNER JOIN classes c ON sc.classId = c.id
                WHERE sc.studentId = ? AND sc.status = 'active'
                LIMIT 1
              `;
              
              studentClassData = sqliteDb.prepare(selectClassSql).all(userItem.id);
            } finally {
              sqliteDb.close();
            }

            return {
              ...userItem,
              classInfo: studentClassData.length > 0 ? studentClassData[0] : null
            };
          }
          return userItem;
        })
      );

      console.log("? Encontrados " + usersWithDetails.length + " usuarios com detalhes");
      res.json({ data: usersWithDetails });
    } catch (error) {
      console.error('Erro ao buscar usuarios:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get('/api/director/users', isAuthenticated, hasRole(['director', 'admin']), async (req, res) => {
    try {
      // Usar mesma estratégia de listagem do endpoint admin para garantir consistência
      const Database = (await import('better-sqlite3')).default;
      const path = (await import('path')).default;
      const dbPath = schoolDbPath;
      const sqliteDb = new Database(dbPath);

      let allUsers = [];
      try {
        const selectSql = `
          SELECT id, firstName, lastName, email, role, status, phone, address, registrationNumber, createdAt, updatedAt
          FROM users 
          WHERE status != 'inactive'
          ORDER BY createdAt DESC
        `;
        allUsers = sqliteDb.prepare(selectSql).all();
      } finally {
        sqliteDb.close();
      }

      // Buscar vínculos de turma para alunos
      const usersWithDetails = await Promise.all(
        allUsers.map(async (userItem: any) => {
          if (userItem.role === 'student') {
            const Database = (await import('better-sqlite3')).default;
            const path = (await import('path')).default;
            const dbPath = schoolDbPath;
            const sqliteDb = new Database(dbPath);
            try {
              const selectClassSql = `
                SELECT 
                  sc.classId,
                  c.name as className,
                  c.grade as classGrade,
                  c.section as classSection,
                  sc.enrollmentDate
                FROM studentClass sc
                INNER JOIN classes c ON sc.classId = c.id
                WHERE sc.studentId = ? AND sc.status = 'active'
                LIMIT 1
              `;
              const studentClassData = sqliteDb.prepare(selectClassSql).all(userItem.id);
              return {
                ...userItem,
                classInfo: studentClassData.length > 0 ? studentClassData[0] : null
              };
            } finally {
              sqliteDb.close();
            }
          }
          if (userItem.role === 'teacher') {
            const Database = (await import('better-sqlite3')).default;
            const path = (await import('path')).default;
            const dbPath = schoolDbPath;
            const sqliteDb = new Database(dbPath);
            try {
              const selectSubjectsSql = `
                SELECT s.id as id, s.name as name, cs.classId as classId, c.name as className, c.grade as classGrade
                FROM classSubjects cs
                LEFT JOIN subjects s ON s.id = cs.subjectId
                LEFT JOIN classes c ON c.id = cs.classId
                WHERE cs.teacherId = ?
              `;
              const teacherSubjects = sqliteDb.prepare(selectSubjectsSql).all(userItem.id);
              return {
                ...userItem,
                teacherSubjects
              };
            } finally {
              sqliteDb.close();
            }
          }
          return userItem;
        })
      );

      res.json({ data: usersWithDetails });
    } catch (error: any) {
      console.error('Erro ao listar usuários (diretor):', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Criar novo usuario (admin)
  app.post('/api/admin/users', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const user = req.user;
      const { firstName, lastName, email, role, phone, address, birthDate, registrationNumber, classId } = req.body;

      console.log("Criacao de usuario solicitada por: " + user.firstName + " " + user.lastName);
      console.log('?? Dados do novo usuario:', { firstName, lastName, email, role, classId });

      // ValidacA?es basicas
      if (!firstName || firstName.trim() === '') {
        return res.status(400).json({ message: "Nome e obrigatorio" });
      }
      
      if (!lastName || lastName.trim() === '') {
        return res.status(400).json({ message: "Sobrenome e obrigatorio" });
      }
      
      if (!role || !['student', 'teacher', 'coordinator', 'admin', 'director'].includes(role)) {
        return res.status(400).json({ message: "Funcao invalida. Use: student, teacher, coordinator, director ou admin" });
      }
      if (role === 'admin') {
        const master = await isMasterAdmin(req);
        if (!master) {
          return res.status(403).json({ message: 'Permissões insuficientes para criar administrador' });
        }
      }

      // Gerar email padrao sempre com @escola.com (serï¿½ usado apenas na resposta)
      let finalEmail;
      if (email && email !== '' && email.endsWith('@escola.com')) {
        // Email completo ja fornecido
        finalEmail = email;
      } else if (email && email !== '') {
        // Email parcial fornecido - usar apenas a parte antes do @ (se houver)
        const emailPart = email.split('@')[0];
        // Limpar caracteres especiais e espacos
        const cleanEmailPart = emailPart.replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
        finalEmail = `${cleanEmailPart}@escola.com`;
      } else {
        // Gerar email automatico
        const cleanFirstName = firstName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
        const cleanLastName = lastName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
        finalEmail = `${cleanFirstName}.${cleanLastName}@escola.com`;
      }
      
      // Nï¿½o verificar email duplicado pois email serï¿½ null inicialmente
      // A verificaï¿½ï¿½o serï¿½ feita quando o diretor aprovar o usuï¿½rio

      // Gerar numero de matricula aleatorio e unico
      let finalRegistrationNumber;
      let attempts = 0;
      const maxAttempts = 10;
      
      do {
        // Gerar matricula aleatoria com 6 digitos
        const randomNumber = Math.floor(Math.random() * 900000) + 100000; // 100000 a 999999
        finalRegistrationNumber = randomNumber.toString();
        
        // Verificar se ja existe
        const existingRegistration = await db
          .select()
          .from(users)
          .where(eq(users.registrationNumber, finalRegistrationNumber))
          .limit(1);
        
        if (existingRegistration.length === 0) {
          break; // Matricula unica encontrada
        }
        
        attempts++;
      } while (attempts < maxAttempts);
      
      if (attempts >= maxAttempts) {
        return res.status(500).json({ message: "Erro ao gerar matricula unica. Tente novamente." });
      }

      // Criar usuário
      let emailValue: string | null = null;
      let passwordValue: string | null = null;
      let statusValue: 'active' | 'inactive' | 'pendente' = 'pendente';
      if (role === 'director') {
        emailValue = finalEmail;
        const bcrypt = await import('bcryptjs');
        passwordValue = await bcrypt.hash('123', 10);
        statusValue = 'active';
      }

      const toIsoBirth = (bd?: string) => {
        const fallback = '2000-01-01';
        if (!bd || typeof bd !== 'string' || bd.trim().length === 0) return fallback;
        const s = bd.trim();
        if (s.includes('/')) {
          const parts = s.split('/');
          if (parts.length === 3) {
            const dd = String(parts[0]).padStart(2, '0');
            const mm = String(parts[1]).padStart(2, '0');
            const yyyy = String(parts[2]);
            if (Number(dd) && Number(mm) && Number(yyyy)) return `${yyyy}-${mm}-${dd}`;
          }
        }
        const d = new Date(s as any);
        if (!isNaN(d.getTime())) {
          const dd = String(d.getDate()).padStart(2, '0');
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const yyyy = String(d.getFullYear());
          return `${yyyy}-${mm}-${dd}`;
        }
        return fallback;
      };
      const birthDateFinal = toIsoBirth(birthDate);
      const newUser = {
        id: uuidv4(),
        firstName,
        lastName,
        email: emailValue,
        password: passwordValue,
        role,
        status: statusValue,
        phone: phone || null,
        address: address || null,
        birthDate: birthDateFinal,
        registrationNumber: finalRegistrationNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Usar SQL direto com better-sqlite3 para evitar problemas com Drizzle ORM
      const Database = (await import('better-sqlite3')).default;
      const path = (await import('path')).default;
      const dbPath = schoolDbPath;
      const sqliteDb = new Database(dbPath);
      
      try {
        const cols = sqliteDb.prepare(`PRAGMA table_info(users)`).all();
        const hasBirthDate = Array.isArray(cols) && cols.some((r: any) => String(r.name || '').toLowerCase() === 'birthdate');
        const insertSql = hasBirthDate
          ? `INSERT INTO users (id, email, password, firstName, lastName, profileImageUrl, role, status, lastSeen, phone, address, birthDate, registrationNumber, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          : `INSERT INTO users (id, email, password, firstName, lastName, profileImageUrl, role, status, lastSeen, phone, address, registrationNumber, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const stmt = sqliteDb.prepare(insertSql);
        if (hasBirthDate) {
          stmt.run(
            newUser.id,
            newUser.email,
            newUser.password,
            newUser.firstName,
            newUser.lastName,
            null,
            newUser.role,
            newUser.status,
            null,
            newUser.phone,
            newUser.address,
            newUser.birthDate,
            newUser.registrationNumber,
            newUser.createdAt,
            newUser.updatedAt
          );
        } else {
          stmt.run(
            newUser.id,
            newUser.email,
            newUser.password,
            newUser.firstName,
            newUser.lastName,
            null,
            newUser.role,
            newUser.status,
            null,
            newUser.phone,
            newUser.address,
            newUser.registrationNumber,
            newUser.createdAt,
            newUser.updatedAt
          );
        }
        console.log("? Usuário criado com status '" + newUser.status + "': " + newUser.id);
      } finally {
        sqliteDb.close();
      }

      // Se for aluno, matricular na turma
      if (role === 'student' && classId) {
        const enrollment = {
          id: uuidv4(),
          studentId: newUser.id,
          classId: classId,
          enrollmentDate: new Date().toISOString(),
          status: 'pendente' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Usar SQL direto para matricular aluno
        const Database = (await import('better-sqlite3')).default;
        const path = (await import('path')).default;
        const dbPath = schoolDbPath;
        const sqliteDb = new Database(dbPath);
        
        try {
          const insertEnrollmentSql = `
            INSERT INTO studentClass (
              id, studentId, classId, enrollmentDate, status, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `;
          
          const stmt = sqliteDb.prepare(insertEnrollmentSql);
          stmt.run(
            enrollment.id,
            enrollment.studentId,
            enrollment.classId,
            enrollment.enrollmentDate,
            enrollment.status,
            enrollment.createdAt,
            enrollment.updatedAt
          );
        } finally {
          sqliteDb.close();
        }
        console.log("? Aluno matriculado na turma: " + classId);
      }

      console.log(`? Usuário criado com status '${newUser.status}': ${newUser.id}`);
      console.log("?? Nome: " + firstName + " " + lastName);
      console.log("?? Funï¿½ï¿½o: " + role);
      console.log("?? Matrï¿½cula: " + finalRegistrationNumber);
      console.log("? Aguardando aprovaï¿½ï¿½o do diretor para ativar login");
      
      res.status(201).json({ 
        message: "Usuário criado com sucesso",
        data: { 
          id: newUser.id,
          email: newUser.email ?? finalEmail,
          registrationNumber: finalRegistrationNumber,
          status: newUser.status,
          message: newUser.status === 'active' ? 'Administrador ativo criado com senha padrão 123' : 'Aguardando aprovação do diretor para ativar login'
        }
      });
    } catch (error) {
      console.error('Erro ao criar usuario:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Atualizar usuario (admin)
  app.put('/api/admin/users/:userId', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const user = req.user;
      const { userId } = req.params;
      const { firstName, lastName, email, role, phone, address, registrationNumber, status, password } = req.body;

      console.log("Atualizacao de usuario " + userId + " solicitada por: " + user.firstName + " " + user.lastName);
      console.log('?? Dados recebidos:', { firstName, lastName, email, role, phone, address, registrationNumber, status, password: password ? '[FORNECIDA]' : '[NA?O FORNECIDA]' });

      // Verificar se usuario existe
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (existingUser.length === 0) {
        return res.status(404).json({ message: "Usuario nao encontrado" });
      }

      console.log('?? Usuario existente:', {
        id: existingUser[0].id,
        email: existingUser[0].email,
        firstName: existingUser[0].firstName,
        lastName: existingUser[0].lastName,
        registrationNumber: existingUser[0].registrationNumber,
        role: existingUser[0].role,
        status: existingUser[0].status
      });

      if (existingUser[0].role === 'admin' || role === 'admin') {
        const master = await isMasterAdmin(req);
        if (!master) {
          return res.status(403).json({ message: 'Permissões insuficientes para alterar administrador' });
        }
      }

      // Email não pode ser alterado após a criação: ignorar mudanças

      // Verificar se matricula ja existe em outro usuario
      if (registrationNumber && registrationNumber !== '' && registrationNumber !== existingUser[0].registrationNumber) {
        const registrationExists = await db
          .select()
          .from(users)
          .where(and(eq(users.registrationNumber, registrationNumber), ne(users.id, userId)))
          .limit(1);

        if (registrationExists.length > 0) {
          return res.status(400).json({ message: "Numero de matricula ja esta em uso" });
        }
      }

      // Preparar dados para atualizacao - NUNCA incluir campos obrigatorios que nao foram fornecidos
      const updateData: any = {
        updatedAt: new Date().toISOString()
      };

      // Adicionar apenas campos fornecidos e que nao sao obrigatorios ou que foram explicitamente fornecidos
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      // Não atualizar email
      if (role !== undefined) updateData.role = role;
      if (phone !== undefined) updateData.phone = phone || null;
      if (address !== undefined) updateData.address = address || null;
      if (status !== undefined) updateData.status = status;
      
      // Para registrationNumber (campo obrigatorio), so incluir se foi explicitamente fornecido
      if (registrationNumber !== undefined && registrationNumber !== null && registrationNumber !== '') {
        updateData.registrationNumber = registrationNumber;
      }
      // IMPORTANTE: Se registrationNumber nao foi fornecido, NA?O incluir no updateData

      // Atualizar senha se fornecida
      if (password) {
        const bcrypt = await import('bcryptjs');
        updateData.password = await bcrypt.hash(password, 10);
      }

      console.log('?? Dados que serao atualizados (email mantido):', updateData);

      // Usar o metodo correto do Drizzle ORM para atualizacao
      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId));

      console.log("? Usuario " + userId + " atualizado com sucesso");
      res.json({ message: "Usuario atualizado com sucesso" });
    } catch (error) {
      console.error('? Erro detalhado ao atualizar usuario:', error);
      console.error('? Stack trace:', error.stack);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Excluir usuario (admin)
  app.delete('/api/admin/users/:userId', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const user = req.user;
      const { userId } = req.params;
      const { password, confirmText } = req.body;

      console.log("Exclusao de usuario " + userId + " solicitada por: " + user.firstName + " " + user.lastName);

      // Verificar senha de confirmacao (placeholder): exigir senha nÃ£o vazia
      if (!password || typeof password !== 'string' || password.trim().length === 0) {
        return res.status(400).json({ message: "Senha de confirmacao obrigatoria" });
      }

      // Se confirmText foi fornecido, deve ser "confirmar"
      if (confirmText && confirmText !== 'confirmar') {
        return res.status(400).json({ message: "Digite 'confirmar' para prosseguir com a exclusï¿½o" });
      }

      // Verificar se usuario existe usando SQL direto
      const Database = (await import('better-sqlite3')).default;
      const path = (await import('path')).default;
      const { fileURLToPath } = await import('url');
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const dbPath = schoolDbPath;
      const sqliteDb = new Database(dbPath);
      
      let existingUser = null;
      try {
        const selectSql = 'SELECT * FROM users WHERE id = ? LIMIT 1';
        existingUser = sqliteDb.prepare(selectSql).get(userId);
      } finally {
        sqliteDb.close();
      }

      if (!existingUser) {
        return res.status(404).json({ message: "Usuario nao encontrado" });
      }

      if (existingUser.role === 'admin') {
        const master = await isMasterAdmin(req);
        if (!master) {
          return res.status(403).json({ message: 'Permissões insuficientes para excluir administrador' });
        }
        const masterId = await getMasterAdminId();
        if (masterId && userId === masterId) {
          return res.status(400).json({ message: 'Não é possível excluir o Admin Mestre' });
        }
      }

      // Nao permitir exclusao do proprio usuario
      if (userId === user.id) {
        return res.status(400).json({ message: "Nao e possivel excluir seu proprio usuario" });
      }

      const userToDelete = existingUser;
      console.log("Usu?rio a ser deletado: " + userToDelete.firstName + " " + userToDelete.lastName + " (" + userToDelete.role + ")");

      try {
        // Deletar vÃ­nculos primeiro (ordem correta) usando UMA ÃšNICA conexÃ£o com PRAGMA OFF
        console.log("?? Removendo vÃ­nculos do usuÃ¡rio " + userId + "...");

        const sqliteDb3 = new Database(dbPath);
        try {
          // Desabilitar FKs na MESMA conexÃ£o que executa as deleÃ§Ãµes
          sqliteDb3.prepare('PRAGMA foreign_keys = OFF').run();
          console.log('[UNLOCK] Foreign key constraints desabilitadas (mesma conexÃ£o)');

          // Identificar entidades criadas pelo usuÃ¡rio (teacher/coordinator)
          const activitiesRows = sqliteDb3
            .prepare('SELECT id FROM activities WHERE teacherId = ? OR coordinatorId = ?')
            .all(userId, userId);
          const activityIds = activitiesRows.map(r => r.id);

          const examsRows = sqliteDb3
            .prepare('SELECT id FROM exams WHERE teacherId = ?')
            .all(userId);
          const examIds = examsRows.map(r => r.id);

          const materialsRows = sqliteDb3
            .prepare('SELECT id FROM materials WHERE teacherId = ?')
            .all(userId);
          const materialIds = materialsRows.map(r => r.id);

          const classSubjectsRows = sqliteDb3
            .prepare('SELECT id FROM classSubjects WHERE teacherId = ?')
            .all(userId);
          const classSubjectIds = classSubjectsRows.map(r => r.id);

          // Helpers para IN (...)
          const makePlaceholders = (arr) => arr.length ? arr.map(() => '?').join(',') : '';

          // SubmissÃµes e dependÃªncias por activityId
          if (activityIds.length) {
            const phActs = makePlaceholders(activityIds);
            // Remover arquivos e histÃ³rico de submissÃµes vinculados Ã s atividades do usuÃ¡rio
            const submissionIdsRows = sqliteDb3
              .prepare(`SELECT id FROM activitySubmissions WHERE activityId IN (${phActs})`)
              .all(...activityIds);
            const submissionIds = submissionIdsRows.map(r => r.id);
            if (submissionIds.length) {
              const phSubs = makePlaceholders(submissionIds);
              const delSubFiles = sqliteDb3.prepare(`DELETE FROM submissionFiles WHERE submissionId IN (${phSubs})`).run(...submissionIds);
              console.log('[OK] Arquivos de submissÃµes removidos (por atividades):', delSubFiles.changes);
              const delSubHist = sqliteDb3.prepare(`DELETE FROM submissionHistory WHERE submissionId IN (${phSubs})`).run(...submissionIds);
              console.log('[OK] HistÃ³rico de submissÃµes removido (por atividades):', delSubHist.changes);
              const delRubricEval = sqliteDb3.prepare(`DELETE FROM rubricEvaluations WHERE submissionId IN (${phSubs})`).run(...submissionIds);
              console.log('[OK] AvaliaÃ§Ãµes de rubricas removidas (por atividades):', delRubricEval.changes);
              const delSubs = sqliteDb3.prepare(`DELETE FROM activitySubmissions WHERE id IN (${phSubs})`).run(...submissionIds);
              console.log('[OK] SubmissÃµes removidas (por atividades):', delSubs.changes);
            }
            // Remover arquivos e rubricas das atividades do usuÃ¡rio
            const delActFilesByActivity = sqliteDb3.prepare(`DELETE FROM activityFiles WHERE activityId IN (${phActs})`).run(...activityIds);
            console.log('[OK] Arquivos de atividades removidos (por activityId):', delActFilesByActivity.changes);
            const delActRubrics = sqliteDb3.prepare(`DELETE FROM activityRubrics WHERE activityId IN (${phActs})`).run(...activityIds);
            console.log('[OK] Rubricas de atividades removidas:', delActRubrics.changes);
          }

          // SubmissÃµes e avaliaÃ§Ãµes do usuÃ¡rio (como aluno/avaliador)
          const delSubFilesByStudent = sqliteDb3.prepare('DELETE FROM submissionFiles WHERE submissionId IN (SELECT id FROM activitySubmissions WHERE studentId = ?)').run(userId);
          console.log('[OK] Arquivos de submissÃµes removidos (por studentId):', delSubFilesByStudent.changes);
          const delSubHistByStudent = sqliteDb3.prepare('DELETE FROM submissionHistory WHERE submissionId IN (SELECT id FROM activitySubmissions WHERE studentId = ?) OR performedBy = ?').run(userId, userId);
          console.log('[OK] HistÃ³rico de submissÃµes removido (por studentId/performedBy):', delSubHistByStudent.changes);
          const delRubricEvalByUser = sqliteDb3.prepare('DELETE FROM rubricEvaluations WHERE evaluatorId = ? OR submissionId IN (SELECT id FROM activitySubmissions WHERE studentId = ?)').run(userId, userId);
          console.log('[OK] AvaliaÃ§Ãµes de rubricas removidas (por usuÃ¡rio):', delRubricEvalByUser.changes);
          const delSubsByUser = sqliteDb3.prepare('DELETE FROM activitySubmissions WHERE studentId = ? OR gradedBy = ?').run(userId, userId);
          console.log('[OK] SubmissÃµes removidas (por usuÃ¡rio):', delSubsByUser.changes);

          // Arquivos de atividades enviados pelo usuÃ¡rio
          const delActFilesByUploader = sqliteDb3.prepare('DELETE FROM activityFiles WHERE uploadedBy = ?').run(userId);
          console.log('[OK] Arquivos de atividades removidos (por uploadedBy):', delActFilesByUploader.changes);

          // Notas de exames criados pelo usuÃ¡rio (por examId)
          if (examIds.length) {
            const phExams = makePlaceholders(examIds);
            const delExamGradesByExam = sqliteDb3.prepare(`DELETE FROM examGrades WHERE examId IN (${phExams})`).run(...examIds);
            console.log('[OK] Notas de exames removidas (por examId):', delExamGradesByExam.changes);
          }
          // Notas de exames do usuÃ¡rio como aluno/avaliador
          const delExamGradesByUser = sqliteDb3.prepare('DELETE FROM examGrades WHERE studentId = ? OR gradedBy = ?').run(userId, userId);
          console.log('[OK] Notas de exames removidas (por usuÃ¡rio):', delExamGradesByUser.changes);

          // Notas ligadas a classSubjects do professor
          if (classSubjectIds.length) {
            const phCs = makePlaceholders(classSubjectIds);
            const delGradesByClassSubject = sqliteDb3.prepare(`DELETE FROM grades WHERE classSubjectId IN (${phCs})`).run(...classSubjectIds);
            console.log('[OK] Notas removidas (por classSubjectId):', delGradesByClassSubject.changes);
          }
          // Notas do usuÃ¡rio como aluno/criador
          const delGradesByUser = sqliteDb3.prepare('DELETE FROM grades WHERE studentId = ? OR createdBy = ?').run(userId, userId);
          console.log('[OK] Notas removidas (por usuÃ¡rio):', delGradesByUser.changes);

          // FrequÃªncias, horÃ¡rios, vÃ­nculos, matrÃ­culas, classes
          const delAttendance = sqliteDb3.prepare('DELETE FROM attendance WHERE studentId = ? OR teacherId = ?').run(userId, userId);
          console.log('[OK] PresenÃ§as removidas:', delAttendance.changes);
          const delClassSchedule = sqliteDb3.prepare('DELETE FROM classSchedule WHERE teacherId = ?').run(userId);
          console.log('[OK] HorÃ¡rios removidos:', delClassSchedule.changes);
          const delClassSubjects = sqliteDb3.prepare('DELETE FROM classSubjects WHERE teacherId = ?').run(userId);
          console.log('[OK] VÃ­nculos classSubjects removidos:', delClassSubjects.changes);
          const delStudentClass = sqliteDb3.prepare('DELETE FROM studentClass WHERE studentId = ?').run(userId);
          console.log('[OK] MatrÃ­culas removidas:', delStudentClass.changes);
          const delClasses = sqliteDb3.prepare('DELETE FROM classes WHERE coordinatorId = ?').run(userId);
          console.log('[OK] Turmas coordenadas removidas:', delClasses.changes);

          // Materiais: primeiro arquivos por materialId, depois materiais
          if (materialIds.length) {
            const phMats = makePlaceholders(materialIds);
            const delMatFilesByMat = sqliteDb3.prepare(`DELETE FROM materialFiles WHERE materialId IN (${phMats})`).run(...materialIds);
            console.log('[OK] Arquivos de materiais removidos (por materialId):', delMatFilesByMat.changes);
          }
          const delMatFilesByUploader = sqliteDb3.prepare('DELETE FROM materialFiles WHERE uploadedBy = ?').run(userId);
          console.log('[OK] Arquivos de materiais removidos (por uploadedBy):', delMatFilesByUploader.changes);
          const delMaterials = sqliteDb3.prepare('DELETE FROM materials WHERE teacherId = ?').run(userId);
          console.log('[OK] Materiais removidos:', delMaterials.changes);

          // Eventos, notificaÃ§Ãµes, configuraÃ§Ãµes, mensagens, relatÃ³rios, logs, solicitaÃ§Ãµes
          const delEvents = sqliteDb3.prepare('DELETE FROM events WHERE createdBy = ?').run(userId);
          console.log('[OK] Eventos removidos:', delEvents.changes);
          const delNotifications = sqliteDb3.prepare('DELETE FROM notifications WHERE senderId = ? OR recipientId = ?').run(userId, userId);
          console.log('[OK] NotificaÃ§Ãµes removidas:', delNotifications.changes);
          const delSettings = sqliteDb3.prepare('DELETE FROM settings WHERE updatedBy = ?').run(userId);
          console.log('[OK] ConfiguraÃ§Ãµes removidas:', delSettings.changes);
          const delMessages = sqliteDb3.prepare('DELETE FROM messages WHERE senderId = ? OR recipientId = ?').run(userId, userId);
          console.log('[OK] Mensagens removidas:', delMessages.changes);
          const delReports = sqliteDb3.prepare('DELETE FROM reports WHERE generatedBy = ?').run(userId);
          console.log('[OK] RelatÃ³rios removidos:', delReports.changes);
          const delSystemLogs = sqliteDb3.prepare('DELETE FROM systemLogs WHERE userId = ?').run(userId);
          console.log('[OK] Logs do sistema removidos:', delSystemLogs.changes);
          const delUserRequests = sqliteDb3.prepare('DELETE FROM user_requests WHERE requestedBy = ?').run(userId);
          console.log('[OK] SolicitaÃ§Ãµes de usuÃ¡rio removidas:', delUserRequests.changes);

          // Por Ãºltimo, remover atividades e exames apÃ³s seus dependentes
          if (activityIds.length) {
            const phActs = makePlaceholders(activityIds);
            const delActs = sqliteDb3.prepare(`DELETE FROM activities WHERE id IN (${phActs})`).run(...activityIds);
            console.log('[OK] Atividades removidas (por id):', delActs.changes);
          }
          if (examIds.length) {
            const phExams = makePlaceholders(examIds);
            const delExams = sqliteDb3.prepare(`DELETE FROM exams WHERE id IN (${phExams})`).run(...examIds);
            console.log('[OK] Exames removidos (por id):', delExams.changes);
          }

          // Finalmente, excluir o usuÃ¡rio
          const userDel = sqliteDb3.prepare('DELETE FROM users WHERE id = ?').run(userId);
          console.log('[OK] UsuÃ¡rio excluÃ­do:', userDel.changes, 'linhas afetadas');
          if (userDel.changes === 0) {
            throw new Error('UsuÃ¡rio nÃ£o encontrado ou jÃ¡ foi excluÃ­do');
          }

          // Reabilitar FKs nesta mesma conexÃ£o
          sqliteDb3.prepare('PRAGMA foreign_keys = ON').run();
          console.log('ðŸ”„ Foreign key constraints reabilitadas');
        } finally {
          sqliteDb3.close();
        }

        res.json({ message: 'Usuario excluido com sucesso' });
      } catch (deleteError) {
        // Tentar reabilitar FKs caso ocorra erro
        const sqliteDb4 = new Database(dbPath);
        try {
          sqliteDb4.prepare('PRAGMA foreign_keys = ON').run();
          console.log('ðŸ”„ Foreign key constraints reabilitadas apÃ³s erro');
        } finally {
          sqliteDb4.close();
        }
        throw deleteError;
      }
    } catch (error) {
      console.error('Erro ao excluir usuario:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post('/api/admin/director/transfer', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const master = await isMasterAdmin(req);
      if (!master) {
        return res.status(403).json({ message: 'Permissões insuficientes para transferir diretoria' });
      }
      const { newDirectorId, demoteRole = 'coordinator', confirmText } = req.body as { newDirectorId: string; demoteRole?: string; confirmText?: string };
      if (!newDirectorId) return res.status(400).json({ message: 'Novo diretor obrigatório' });
      if ((confirmText || '').trim().toLowerCase() !== 'transferir') return res.status(400).json({ message: "Digite 'transferir' para confirmar" });
      const allowedDemoteRoles = ['coordinator', 'admin', 'teacher'];
      if (!allowedDemoteRoles.includes(demoteRole)) {
        return res.status(400).json({ message: 'Papel para rebaixamento inválido' });
      }
      const candidate = await db.select().from(users).where(eq(users.id, newDirectorId)).limit(1);
      if (candidate.length === 0) return res.status(404).json({ message: 'Usuário para diretoria não encontrado' });
      if (candidate[0].status === 'inactive') return res.status(400).json({ message: 'Usuário inativo não pode ser diretor' });
      const now = new Date().toISOString();
      const requestPayload = {
        id: uuidv4(),
        newDirectorId,
        demoteRole,
        requestedBy: (req.user as any)?.id,
        status: 'pending',
        approvals: [],
        approvalsCount: 0,
        createdAt: now,
        updatedAt: now
      };
      const existing = await db.select().from(settings).where(eq(settings.key, 'pendingDirectorTransfer')).limit(1);
      if (existing.length > 0) {
        await db.update(settings).set({ value: JSON.stringify(requestPayload), updatedAt: now, updatedBy: (req.user as any)?.id }).where(eq(settings.id, existing[0].id));
      } else {
        await db.insert(settings).values({
          id: uuidv4(),
          key: 'pendingDirectorTransfer',
          value: JSON.stringify(requestPayload),
          description: 'Solicitação pendente de transferência de diretoria',
          category: 'security',
          updatedBy: (req.user as any)?.id,
          createdAt: now,
          updatedAt: now
        });
      }
      await dbLogger.info('DIRECTOR_TRANSFER_REQUEST', 'Solicitação de transferência de diretoria criada', (req.user as any)?.id, req, requestPayload);
      return res.status(201).json({ message: 'Solicitação criada', data: requestPayload });
    } catch (error: any) {
      console.error('Erro ao criar solicitação de transferência:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Excluir professor (admin)
  app.delete('/api/admin/teachers/:teacherId', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const user = req.user;
      const { teacherId } = req.params;
      const { password } = req.body;

      console.log("Exclusao de professor " + teacherId + " solicitada por: " + user.firstName + " " + user.lastName);

      // Verificar senha de confirmacao (placeholder): exigir senha nÃ£o vazia
      if (!password || typeof password !== 'string' || password.trim().length === 0) {
        return res.status(400).json({ message: "Senha de confirmacao obrigatoria" });
      }

      // Verificar se professor existe usando SQL direto
      const Database = (await import('better-sqlite3')).default;
      const path = (await import('path')).default;
      const { fileURLToPath } = await import('url');
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const dbPath = schoolDbPath;
      const sqliteDb = new Database(dbPath);
      
      let existingTeacher = null;
      try {
        const selectSql = 'SELECT * FROM users WHERE id = ? AND role = ? LIMIT 1';
        existingTeacher = sqliteDb.prepare(selectSql).get(teacherId, 'teacher');
      } finally {
        sqliteDb.close();
      }

      if (!existingTeacher) {
        return res.status(404).json({ message: "Professor nao encontrado" });
      }

      const teacherToDelete = existingTeacher;
      console.log("Professor a ser deletado: " + teacherToDelete.firstName + " " + teacherToDelete.lastName);

      // Usar SQL direto para deletar professor
      console.log("??? Removendo vï¿½nculos do professor " + teacherId + "...");
      
      // Desabilitar foreign keys usando SQL direto
      const sqliteDb2 = new Database(dbPath);
      try {
        sqliteDb2.prepare('PRAGMA foreign_keys = OFF').run();
        console.log("[UNLOCK] Foreign key constraints desabilitadas");
      } finally {
        sqliteDb2.close();
      }
      
      try {
        const sqliteDb3 = new Database(dbPath);
        try {
          // 1. Remover vï¿½nculos classSubjects
          const deleteClassSubjectsSql = 'DELETE FROM classSubjects WHERE teacherId = ?';
          const result1 = sqliteDb3.prepare(deleteClassSubjectsSql).run(teacherId);
          console.log("[OK] Vï¿½nculos classSubjects removidos:", result1.changes, "linhas afetadas");
          
          // 2. Remover atividades criadas pelo professor (tabela nï¿½o existe)
          console.log("[INFO] Tabela activities nï¿½o existe, pulando...");
          
          // 3. Remover provas criadas pelo professor (tabela nï¿½o existe)
          console.log("[INFO] Tabela exams nï¿½o existe, pulando...");
          
          // 4. Remover notas do professor (tabela nï¿½o existe)
          console.log("[INFO] Tabela examGrades nï¿½o existe, pulando...");
          
          // 5. Remover presenï¿½as registradas pelo professor (campo nï¿½o existe)
          console.log("[INFO] Campo recordedBy nï¿½o existe na tabela attendance, pulando...");
          
          // 6. Remover eventos criados pelo professor (tabela nï¿½o existe)
          console.log("[INFO] Tabela events nï¿½o existe, pulando...");
          
          // 7. Remover materiais criados pelo professor
          try {
            const deleteMaterialsSql = 'DELETE FROM materials WHERE teacherId = ?';
            const result7 = sqliteDb3.prepare(deleteMaterialsSql).run(teacherId);
            console.log("[OK] Materiais do professor removidos:", result7.changes, "linhas afetadas");
          } catch (e) {
            console.log("[INFO] Tabela materials nï¿½o existe, pulando...");
          }
          
          // 8. Remover o professor
          const deleteTeacherSql = 'DELETE FROM users WHERE id = ?';
          const result8 = sqliteDb3.prepare(deleteTeacherSql).run(teacherId);
          console.log("[OK] Professor removido:", result8.changes, "linhas afetadas");
          
          // Reabilitar foreign keys
          sqliteDb3.prepare('PRAGMA foreign_keys = ON').run();
          
        } finally {
          sqliteDb3.close();
        }
        
        console.log("? Professor deletado com sucesso!");
        res.json({ message: "Professor deletado com sucesso" });
        
      } catch (error) {
        console.error("? Erro ao deletar professor:", error);
        const sqliteDb4 = new Database(dbPath);
        try {
          sqliteDb4.prepare('PRAGMA foreign_keys = ON').run();
        } finally {
          sqliteDb4.close();
        }
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    } catch (error) {
      console.error('Erro ao excluir professor:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== ENDPOINTS PARA TURMAS =====
  
  // Deletar turma (admin)
  app.delete('/api/classes/:id', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      const { password, confirmText } = req.body;
      
      console.log("Exclusao de turma " + id + " solicitada por: " + user.firstName + " " + user.lastName);

      // Verificar senha de confirmacao (aceitar qualquer senha nÃ£o vazia)
      if (!password || typeof password !== 'string' || password.trim().length === 0) {
        return res.status(400).json({ message: "Senha de confirmacao obrigatÃ³ria" });
      }

      // Se confirmText foi fornecido, deve ser "confirmar"
      if (confirmText && confirmText !== 'confirmar') {
        return res.status(400).json({ message: "Digite 'confirmar' para prosseguir com a exclusÃ£o" });
      }

      // Verificar se a turma existe
      const existingClass = await db
        .select()
        .from(classes)
        .where(eq(classes.id, id))
        .limit(1);

      if (existingClass.length === 0) {
        return res.status(404).json({ message: "Turma nao encontrada" });
      }

      // Desabilitar temporariamente as constraints de FOREIGN KEY
      console.log("[INFO] Desabilitando constraints de FOREIGN KEY temporariamente...");
      // PRAGMA foreign_keys OFF removido por incompatibilidade com libsql; manteremos as FKs ativas e vamos remover na ordem correta

      try {
        // ExclusÃ£o em cascata - ordem das dependÃªncias mais profundas para as mais superficiais
        console.log("ðŸ—‘ï¸ Removendo vÃ­nculos da turma " + id + "...");
        
        // Primeiro, buscar todas as atividades da turma
        const classActivities = await db
          .select({ id: activities.id })
          .from(activities)
          .where(eq(activities.classId, id));
        
        const activityIds = classActivities.map(a => a.id);

        // Buscar todas as submissÃµes das atividades
        let submissionIds: string[] = [];
        if (activityIds.length > 0) {
          const submissions = await db
            .select({ id: activitySubmissions.id })
            .from(activitySubmissions)
            .where(inArray(activitySubmissions.activityId, activityIds));
          submissionIds = submissions.map(s => s.id);
        }

        // 1. Remover arquivos de submissÃ£o (dependem de submissÃµes de atividades da turma)
        console.log("[INFO] Removendo arquivos de submissÃ£o...");
        if (submissionIds.length > 0) {
          await db.delete(submissionFiles)
            .where(inArray(submissionFiles.submissionId, submissionIds));
        }

        // 2. Remover histÃ³rico de submissÃµes (dependem de submissÃµes)
        console.log("[INFO] Removendo histÃ³rico de submissÃµes...");
        if (submissionIds.length > 0) {
          await db.delete(submissionHistory)
            .where(inArray(submissionHistory.submissionId, submissionIds));
        }

        // 3. Remover avaliaÃ§Ãµes de rubrica (dependem de submissÃµes e rubricas)
        console.log("[INFO] Removendo avaliaÃ§Ãµes de rubrica...");
        if (submissionIds.length > 0) {
          await db.delete(rubricEvaluations)
            .where(inArray(rubricEvaluations.submissionId, submissionIds));
        }

        // 4. Remover submissÃµes de atividades
        console.log("[INFO] Removendo submissÃµes de atividades...");
        if (activityIds.length > 0) {
          await db.delete(activitySubmissions)
            .where(inArray(activitySubmissions.activityId, activityIds));
        }

        // 5. Remover arquivos de atividades
        console.log("[INFO] Removendo arquivos de atividades...");
        if (activityIds.length > 0) {
          await db.delete(activityFiles)
            .where(inArray(activityFiles.activityId, activityIds));
        }

        // 6. Remover rubricas de atividades
        console.log("[INFO] Removendo rubricas de atividades...");
        if (activityIds.length > 0) {
          await db.delete(activityRubrics)
            .where(inArray(activityRubrics.activityId, activityIds));
        }

        // 7. Remover atividades
        console.log("[INFO] Removendo atividades...");
        await db.delete(activities).where(eq(activities.classId, id));

        // Buscar todas as provas da turma
        const classExams = await db
          .select({ id: exams.id })
          .from(exams)
          .where(eq(exams.classId, id));
        
        const examIds = classExams.map(e => e.id);

        // 8. Remover notas de provas (dependem de provas)
        console.log("[INFO] Removendo notas de provas...");
        if (examIds.length > 0) {
          await db.delete(examGrades)
            .where(inArray(examGrades.examId, examIds));
        }

        // 9. Remover provas
        console.log("[INFO] Removendo provas...");
        await db.delete(exams).where(eq(exams.classId, id));

        // Antes de remover notas, buscar vÃ­nculos de disciplinas da turma
        const classSubjectsRows = await db
          .select({ id: classSubjects.id })
          .from(classSubjects)
          .where(eq(classSubjects.classId, id));
        const classSubjectIds = classSubjectsRows.map(cs => cs.id);

        // 10. Remover notas gerais (vinculadas a classSubjects)
        console.log("[INFO] Removendo notas...");
        if (classSubjectIds.length > 0) {
          await db.delete(grades)
            .where(inArray(grades.classSubjectId, classSubjectIds));
        }

        // 11. Remover frequÃªncia/presenÃ§a
        console.log("[INFO] Removendo registros de frequÃªncia...");
        await db.delete(attendance).where(eq(attendance.classId, id));

        // 12. Remover horÃ¡rios de aula
        console.log("[INFO] Removendo horÃ¡rios de aula...");
        await db.delete(classSchedule).where(eq(classSchedule.classId, id));

        // 13. Remover vÃ­nculos de disciplinas com turmas
        console.log("[INFO] Removendo vÃ­nculos com disciplinas...");
        await db.delete(classSubjects).where(eq(classSubjects.classId, id));

        // 14. Remover matrÃ­culas de alunos
        console.log("[INFO] Removendo matrÃ­culas de alunos...");
        await db.delete(studentClass).where(eq(studentClass.classId, id));

        // 15. Remover eventos relacionados
        console.log("[INFO] Removendo eventos...");
        await db.delete(events).where(eq(events.classId, id));

        // 16. Remover notificaÃ§Ãµes relacionadas
        console.log("[INFO] Removendo notificaÃ§Ãµes...");
        await db.delete(notifications).where(eq(notifications.classId, id));

        // Buscar todos os materiais da turma
        const classMaterials = await db
          .select({ id: materials.id })
          .from(materials)
          .where(eq(materials.classId, id));
        
        const materialIds = classMaterials.map(m => m.id);

        // 17. Remover arquivos de materiais (dependem de materiais)
        console.log("[INFO] Removendo arquivos de materiais...");
        if (materialIds.length > 0) {
          await db.delete(materialFiles)
            .where(inArray(materialFiles.materialId, materialIds));
        }

        // 18. Remover materiais
        console.log("[INFO] Removendo materiais...");
        await db.delete(materials).where(eq(materials.classId, id));

        // 19. Remover solicitaÃ§Ãµes de usuÃ¡rios relacionadas
        console.log("[INFO] Removendo solicitaÃ§Ãµes de usuÃ¡rios...");
        await db.delete(userRequests).where(eq(userRequests.classId, id));

        // 20. Remover logs do sistema relacionados
        console.log("[INFO] Removendo logs do sistema...");
        await db.delete(systemLogs)
          .where(like(systemLogs.action, `%${id}%`));

        // 21. Finalmente, deletar a turma
        console.log("[INFO] Removendo turma...");
        const deleteResult = await db.delete(classes).where(eq(classes.id, id));

        // Verificar se a turma foi realmente excluÃ­da
        const verifyDeletion = await db
          .select()
          .from(classes)
          .where(eq(classes.id, id))
          .limit(1);

        if (verifyDeletion.length > 0) {
          throw new Error("Falha ao excluir turma - registro ainda existe");
        }

        console.log("âœ… Turma " + id + " deletada permanentemente");
        res.json({ message: "Turma excluida com sucesso" });

      } catch (error) {
        console.error('Erro durante exclusÃ£o da turma:', error);
        throw error;
      } finally {
        // OperaÃ§Ã£o concluÃ­da sem desativar FOREIGN KEY; nÃ£o Ã© necessÃ¡rio reativar
        console.log("[INFO] OperaÃ§Ã£o de exclusÃ£o de disciplina concluÃ­da sem alterar FOREIGN KEY");
      }

    } catch (error) {
      console.error('Erro ao excluir turma:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== ENDPOINTS PARA COORDENADOR GERENCIAR ALUNOS =====
  
  // GET /api/coordinator/students - Listar todos os alunos para o coordenador
  app.get('/api/coordinator/students', isAuthenticated, hasRole(['coordinator', 'admin']), async (req, res) => {
    try {
      const user = req.user;
      console.log("Listagem de alunos solicitada por coordenador: " + user.firstName + " " + user.lastName);

      // Buscar todos os alunos com suas informaï¿½ï¿½es de turma
      const studentsData = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          status: users.status,
          phone: users.phone,
          address: users.address,
          registrationNumber: users.registrationNumber,
          createdAt: users.createdAt,
          classId: studentClass.classId,
          className: classes.name,
          classGrade: classes.grade,
          classSection: classes.section,
          enrollmentDate: studentClass.enrollmentDate
        })
        .from(users)
        .leftJoin(studentClass, eq(users.id, studentClass.studentId))
        .leftJoin(classes, eq(studentClass.classId, classes.id))
        .where(eq(users.role, 'student'))
        .orderBy(users.firstName);

      // Agrupar dados por aluno
      const studentsMap = new Map();
      
      studentsData.forEach(row => {
        if (!studentsMap.has(row.id)) {
          studentsMap.set(row.id, {
            id: row.id,
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            status: row.status,
            phone: row.phone,
            address: row.address,
            registrationNumber: row.registrationNumber,
            createdAt: row.createdAt,
            classInfo: null,
            attendanceStats: null,
            gradeStats: null
          });
        }
        
        // Adicionar informaï¿½ï¿½o da turma se existir
        if (row.classId && !studentsMap.get(row.id).classInfo) {
          studentsMap.get(row.id).classInfo = {
            id: row.classId,
            name: row.className,
            grade: row.classGrade,
            section: row.classSection,
            enrollmentDate: row.enrollmentDate
          };
        }
      });

      const students = Array.from(studentsMap.values());

      // Para cada aluno, calcular estatï¿½sticas de frequï¿½ncia e notas
      const studentsWithStats = await Promise.all(
        students.map(async (student) => {
          // Calcular estatï¿½sticas de frequï¿½ncia
          const attendanceData = await db
            .select({
              status: attendance.status,
              date: attendance.date,
              createdAt: attendance.createdAt
            })
            .from(attendance)
            .where(eq(attendance.studentId, student.id));

          const totalClasses = attendanceData.length;
          const presentCount = attendanceData.filter(att => att.status === 'present').length;
          const absentCount = totalClasses - presentCount;
          const attendanceRate = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0;
          
          // ï¿½ltima data de registro de presenï¿½a (ordenar por data da aula, nï¿½o por criaï¿½ï¿½o)
          const lastAttendanceDate = totalClasses > 0 ? 
            attendanceData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date : null;

          student.attendanceStats = {
            totalClasses,
            presentCount,
            absentCount,
            attendanceRate,
            lastAttendanceDate
          };

          // Calcular estatï¿½sticas de notas
          const gradesData = await db
            .select({
              grade: grades.grade,
              createdAt: grades.createdAt
            })
            .from(grades)
            .where(eq(grades.studentId, student.id));

          const totalGrades = gradesData.length;
          const averageGrade = totalGrades > 0 ? 
            gradesData.reduce((sum, g) => sum + (g.grade || 0), 0) / totalGrades : 0;
          const lastGradeDate = totalGrades > 0 ? 
            gradesData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt : null;

          student.gradeStats = {
            averageGrade,
            totalGrades,
            lastGradeDate
          };

          return student;
        })
      );

      console.log("? Encontrados " + studentsWithStats.length + " alunos com estatï¿½sticas");
      res.json({ 
        success: true,
        data: studentsWithStats 
      });

    } catch (error) {
      console.error('? Erro ao buscar alunos:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  });


  // ===== ENDPOINTS PARA DETALHES DE USUï¿½RIOS =====
  
  // GET /api/admin/users/check-email - Verificar se email jï¿½ existe
  app.get('/api/admin/users/check-email', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const { email } = req.query;
      const user = req.user;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "Email ï¿½ obrigatï¿½rio" });
      }

      // Processar email da mesma forma que na criaï¿½ï¿½o
      let finalEmail;
      if (email.includes('@')) {
        finalEmail = email;
      } else {
        finalEmail = `${email}@escola.com`;
      }

      console.log("Verificando email " + finalEmail + " por: " + user.firstName + " " + user.lastName);

      const existingUser = await db
        .select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
        .from(users)
        .where(eq(users.email, finalEmail))
        .limit(1);

      res.json({
        exists: existingUser.length > 0,
        email: finalEmail,
        user: existingUser.length > 0 ? existingUser[0] : null
      });
    } catch (error) {
      console.error('Erro ao verificar email:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // GET /api/admin/classes/:id/details - Detalhes completos da turma
  app.get('/api/admin/classes/:id/details', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      
      console.log("Detalhes da turma " + id + " solicitados por: " + user.firstName + " " + user.lastName);

      // Buscar informaï¿½ï¿½es bï¿½sicas da turma
      const classData = await db
        .select()
        .from(classes)
        .where(eq(classes.id, id))
        .limit(1);

      if (classData.length === 0) {
        return res.status(404).json({ message: "Turma nï¿½o encontrada" });
      }

      // Buscar alunos da turma
      const students = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          registrationNumber: users.registrationNumber,
          status: users.status,
          enrollmentDate: studentClass.enrollmentDate
        })
        .from(studentClass)
        .innerJoin(users, eq(studentClass.studentId, users.id))
        .where(and(
          eq(studentClass.classId, id),
          eq(studentClass.status, 'active')
        ))
        .orderBy(users.firstName, users.lastName);

      // Buscar disciplinas e professores da turma
      const subjectsData = await db
        .select({
          subjectId: classSubjects.subjectId,
          subjectName: subjects.name,
          subjectCode: subjects.code,
          teacherId: classSubjects.teacherId,
          teacherFirstName: users.firstName,
          teacherLastName: users.lastName,
          teacherEmail: users.email,
          teacherStatus: users.status
        })
        .from(classSubjects)
        .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
        .leftJoin(users, eq(classSubjects.teacherId, users.id))
        .where(and(
          eq(classSubjects.classId, id),
          eq(classSubjects.status, 'active')
        ))
        .orderBy(subjects.name);

      // Buscar todos os professores ï¿½nicos que lecionam nesta turma
      const uniqueTeachers = subjectsData
        .filter(subject => subject.teacherId)
        .reduce((acc, subject) => {
          if (!acc.find(t => t.id === subject.teacherId)) {
            acc.push({
              id: subject.teacherId,
              firstName: subject.teacherFirstName,
              lastName: subject.teacherLastName,
              email: subject.teacherEmail,
              status: subject.teacherStatus
            });
          }
          return acc;
        }, [] as any[]);

      res.json({
        class: classData[0],
        students: students,
        subjects: subjectsData,
        teachers: uniqueTeachers,
        stats: {
          totalStudents: students.length,
          totalSubjects: subjectsData.length,
          totalTeachers: uniqueTeachers.length
        }
      });
    } catch (error) {
      console.error('Erro ao buscar detalhes da turma:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // PUT /api/admin/students/:id/enrollments - Atualizar matrÃ­culas do aluno
  app.put('/api/admin/students/:id/enrollments', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const { classes: classIds, subjects: subjectIds } = req.body;
      const user = req.user;
      
      console.log("Atualizando matrÃ­culas do aluno " + id + " por: " + user.firstName + " " + user.lastName);

      // Verificar se o aluno existe
      const student = await db
        .select()
        .from(users)
        .where(and(eq(users.id, id), eq(users.role, 'student')))
        .limit(1);

      if (student.length === 0) {
        return res.status(404).json({ message: "Aluno nÃ£o encontrado" });
      }

      // Atualizar turmas se fornecidas
      if (classIds && classIds.length > 0) {
        // Desativar matrÃ­culas atuais
        await db
          .update(studentClass)
          .set({ status: 'inactive' })
          .where(eq(studentClass.studentId, id));

        // Criar novas matrículas (pendentes até aprovação do diretor)
        for (const classId of classIds) {
          await db.insert(studentClass).values({
            id: crypto.randomUUID(),
            studentId: id,
            classId: classId,
            enrollmentDate: new Date().toISOString(),
            status: 'pendente'
          });
        }
      }

      // Atualizar disciplinas se fornecidas
      if (subjectIds && subjectIds.length > 0) {
        // Desativar matrÃ­culas de disciplinas atuais
        await db
          .update(studentSubjects)
          .set({ status: 'inactive' })
          .where(eq(studentSubjects.studentId, id));

        // Criar novas matrículas de disciplinas (pendentes até aprovação do diretor)
        for (const subjectId of subjectIds) {
          await db.insert(studentSubjects).values({
            id: crypto.randomUUID(),
            studentId: id,
            subjectId: subjectId,
            enrollmentDate: new Date().toISOString(),
            status: 'pendente'
          });
        }
      }

      res.json({ message: "MatrÃ­culas atualizadas com sucesso" });
    } catch (error) {
      console.error('Erro ao atualizar matrÃ­culas:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // GET /api/admin/students/:id/details - Detalhes do aluno com turma
  app.get('/api/admin/students/:id/details', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      
      console.log("Detalhes do aluno " + id + " solicitados por: " + user.firstName + " " + user.lastName);

      // Buscar informaï¿½ï¿½es bï¿½sicas do aluno
      const student = await db
        .select()
        .from(users)
        .where(and(eq(users.id, id), eq(users.role, 'student')))
        .limit(1);

      if (student.length === 0) {
        return res.status(404).json({ message: "Aluno nï¿½o encontrado" });
      }

      // Buscar turma do aluno
      const studentClassData = await db
        .select({
          classId: studentClass.classId,
          className: classes.name,
          classGrade: classes.grade,
          classSection: classes.section,
          enrollmentDate: studentClass.enrollmentDate,
          status: studentClass.status
        })
        .from(studentClass)
        .innerJoin(classes, eq(studentClass.classId, classes.id))
        .where(and(
          eq(studentClass.studentId, id),
          eq(studentClass.status, 'active')
        ))
        .limit(1);

      res.json({
        student: student[0],
        class: studentClassData.length > 0 ? studentClassData[0] : null
      });
    } catch (error) {
      console.error('Erro ao buscar detalhes do aluno:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== ENDPOINTS PARA VERIFICAÇÃO DE DEPENDÊNCIAS =====
  
  // GET /api/users/:id/dependencies - Verificar dependï¿½ncias de usuï¿½rio
  app.get('/api/users/:id/dependencies', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      
      console.log("Verificando dependï¿½ncias do usuï¿½rio " + id + " por: " + user.firstName + " " + user.lastName);

      // Verificar se o usuï¿½rio existe
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (existingUser.length === 0) {
        return res.status(404).json({ message: "Usuï¿½rio nï¿½o encontrado" });
      }

      const userData = existingUser[0];
      let dependencies = {};

      if (userData.role === 'student') {
        // Dependï¿½ncias de aluno
        const enrollmentsCount = await db
          .select({ count: count() })
          .from(studentClass)
          .where(eq(studentClass.studentId, id));

        const gradesCount = await db
          .select({ count: count() })
          .from(grades)
          .where(eq(grades.studentId, id));

        const attendanceCount = await db
          .select({ count: count() })
          .from(attendance)
          .where(eq(attendance.studentId, id));

        dependencies = {
          enrollments: enrollmentsCount[0]?.count || 0,
          grades: gradesCount[0]?.count || 0,
          attendance: attendanceCount[0]?.count || 0
        };
      } else if (userData.role === 'teacher') {
        // Dependï¿½ncias de professor
        const classSubjectsCount = await db
          .select({ count: count() })
          .from(classSubjects)
          .where(eq(classSubjects.teacherId, id));

        const activitiesCount = await db
          .select({ count: count() })
          .from(activities)
          .where(eq(activities.teacherId, id));

        const examsCount = await db
          .select({ count: count() })
          .from(exams)
          .where(eq(exams.teacherId, id));

        const materialsCount = await db
          .select({ count: count() })
          .from(materials)
          .where(eq(materials.teacherId, id));

        dependencies = {
          classSubjects: classSubjectsCount[0]?.count || 0,
          activities: activitiesCount[0]?.count || 0,
          exams: examsCount[0]?.count || 0,
          materials: materialsCount[0]?.count || 0
        };
      } else if (userData.role === 'coordinator') {
        // Coordenador sempre tem confirmaï¿½ï¿½o especial
        dependencies = {
          isCoordinator: true
        };
      }

      const totalDependencies = Object.values(dependencies).reduce((sum, count) => {
        if (typeof count === 'number') return sum + count;
        return sum;
      }, 0);

      res.json({
        hasDependencies: totalDependencies > 0 || dependencies.isCoordinator,
        dependencies,
        totalDependencies,
        userRole: userData.role
      });

    } catch (error) {
      console.error('Erro ao verificar dependï¿½ncias do usuï¿½rio:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // GET /api/classes/:id/dependencies - Verificar dependï¿½ncias de turma
  app.get('/api/classes/:id/dependencies', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      
      console.log("Verificando dependï¿½ncias da turma " + id + " por: " + user.firstName + " " + user.lastName);

      // Verificar se a turma existe
      const existingClass = await db
        .select()
        .from(classes)
        .where(eq(classes.id, id))
        .limit(1);

      if (existingClass.length === 0) {
        return res.status(404).json({ message: "Turma nï¿½o encontrada" });
      }

      // Verificar vï¿½nculos
      const studentsCount = await db
        .select({ count: count() })
        .from(studentClass)
        .where(eq(studentClass.classId, id));

      const subjectsCount = await db
        .select({ count: count() })
        .from(classSubjects)
        .where(eq(classSubjects.classId, id));

      const activitiesCount = await db
        .select({ count: count() })
        .from(activities)
        .where(eq(activities.classId, id));

      const examsCount = await db
        .select({ count: count() })
        .from(exams)
        .where(eq(exams.classId, id));

      const dependencies = {
        students: studentsCount[0]?.count || 0,
        subjects: subjectsCount[0]?.count || 0,
        activities: activitiesCount[0]?.count || 0,
        exams: examsCount[0]?.count || 0
      };

      const totalDependencies = Object.values(dependencies).reduce((sum, count) => sum + count, 0);

      res.json({
        hasDependencies: totalDependencies > 0,
        dependencies,
        totalDependencies
      });

    } catch (error) {
      console.error('Erro ao verificar dependï¿½ncias da turma:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Admin - Solicitar transferência de alunos entre turmas (com aprovação do diretor)
  app.post('/api/admin/transfers/students', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const { fromClassId, toClassId, studentIds } = req.body as { fromClassId: string; toClassId: string; studentIds: string[] };
      const user = req.user;

      if (!fromClassId || !toClassId || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ message: 'Parâmetros inválidos' });
      }

      const now = new Date().toISOString();

      // Validar turmas
      const fromClass = await db.select({ id: classes.id }).from(classes).where(eq(classes.id, fromClassId)).limit(1);
      const toClass = await db.select({ id: classes.id }).from(classes).where(eq(classes.id, toClassId)).limit(1);
      if (fromClass.length === 0 || toClass.length === 0) {
        return res.status(404).json({ message: 'Turma não encontrada' });
      }

      let created = 0;
      for (const studentId of studentIds) {
        // Criar registro pendente na nova turma
        await db.insert(studentClass).values({
          id: uuidv4(),
          studentId,
          classId: toClassId,
          enrollmentDate: now,
          status: 'pendente',
          createdAt: now,
          updatedAt: now,
        });
        created++;

        // Registrar log
        await db.insert(systemLogs).values({
          id: uuidv4(),
          timestamp: now,
          level: 'INFO',
          action: 'StudentTransferRequested',
          description: `Solicitada transferência do aluno ${studentId} de ${fromClassId} para ${toClassId}`,
          userId: (user as any).id,
          userName: `${(user as any).firstName} ${(user as any).lastName}`,
          userRole: (user as any).role,
          metadata: JSON.stringify({ fromClassId, toClassId, studentId })
        });
      }

      res.json({ message: 'Transferência solicitada. Aguardando aprovação do diretor.', created });
    } catch (error) {
      console.error('Erro ao solicitar transferência de alunos:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Diretor - Aprovar transferências de alunos
  app.post('/api/director/transfers/students/approve', isAuthenticated, hasRole(['director']), async (req, res) => {
    try {
      const { fromClassId, toClassId, studentIds } = req.body as { fromClassId: string; toClassId: string; studentIds: string[] };
      const user = req.user;

      if (!toClassId || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ message: 'Parâmetros inválidos' });
      }

      const now = new Date().toISOString();
      let activated = 0;
      let completed = 0;

      for (const studentId of studentIds) {
        // Ativar matrícula pendente na nova turma
        await db
          .update(studentClass)
          .set({ status: 'active', updatedAt: now })
          .where(and(eq(studentClass.studentId, studentId), eq(studentClass.classId, toClassId), eq(studentClass.status, 'pendente')));
        activated++;

        // Finalizar matrícula antiga (se informada)
        if (fromClassId) {
          await db
            .update(studentClass)
            .set({ status: 'completed', updatedAt: now })
            .where(and(eq(studentClass.studentId, studentId), eq(studentClass.classId, fromClassId), eq(studentClass.status, 'active')));
          completed++;
        }

        await db.insert(systemLogs).values({
          id: uuidv4(),
          timestamp: now,
          level: 'SUCCESS',
          action: 'StudentTransferApproved',
          description: `Transferência aprovada do aluno ${studentId} para ${toClassId}`,
          userId: (user as any).id,
          userName: `${(user as any).firstName} ${(user as any).lastName}`,
          userRole: (user as any).role,
          metadata: JSON.stringify({ fromClassId, toClassId, studentId })
        });
      }

      res.json({ message: 'Transferências aprovadas', activated, completed });
    } catch (error) {
      console.error('Erro ao aprovar transferências:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // ===== ENDPOINTS PARA DISCIPLINAS =====
  
  // Deletar disciplina (admin)
  // GET /api/subjects/:id/dependencies - Verificar dependï¿½ncias antes de excluir
  app.get('/api/subjects/:id/dependencies', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      
      console.log("Verificando dependï¿½ncias da disciplina " + id + " por: " + user.firstName + " " + user.lastName);

      // Verificar se a disciplina existe
      const existingSubject = await db
        .select()
        .from(subjects)
        .where(eq(subjects.id, id))
        .limit(1);

      if (existingSubject.length === 0) {
        return res.status(404).json({ message: "Disciplina nï¿½o encontrada" });
      }

      // Verificar vï¿½nculos
      const classSubjectsCount = await db
        .select({ count: count() })
        .from(classSubjects)
        .where(eq(classSubjects.subjectId, id));

      const activitiesCount = await db
        .select({ count: count() })
        .from(activities)
        .where(eq(activities.subjectId, id));

      const examsCount = await db
        .select({ count: count() })
        .from(exams)
        .where(eq(exams.subjectId, id));

      const materialsCount = await db
        .select({ count: count() })
        .from(materials)
        .where(eq(materials.subjectId, id));

      const dependencies = {
        classSubjects: classSubjectsCount[0]?.count || 0,
        activities: activitiesCount[0]?.count || 0,
        exams: examsCount[0]?.count || 0,
        materials: materialsCount[0]?.count || 0
      };

      const totalDependencies = Object.values(dependencies).reduce((sum, count) => sum + count, 0);

      res.json({
        hasDependencies: totalDependencies > 0,
        dependencies,
        totalDependencies
      });

    } catch (error) {
      console.error('Erro ao verificar dependï¿½ncias da disciplina:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.delete('/api/subjects/:id', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      const { password, confirmText } = req.body;
      
      console.log("Exclusao de disciplina " + id + " solicitada por: " + user.firstName + " " + user.lastName);

      // Verificar senha de confirmacao
      if (!password || password !== '123') {
        return res.status(400).json({ message: "Senha de confirmacao incorreta" });
      }

      // Se confirmText foi fornecido, deve ser "confirmar"
      if (confirmText && confirmText !== 'confirmar') {
        return res.status(400).json({ message: "Digite 'confirmar' para prosseguir com a exclusÃ£o" });
      }

      // Verificar se a disciplina existe
      const existingSubject = await db
        .select()
        .from(subjects)
        .where(eq(subjects.id, id))
        .limit(1);

      if (existingSubject.length === 0) {
        return res.status(404).json({ message: "Disciplina nao encontrada" });
      }

      // Mantendo constraints de FOREIGN KEY ativas; PRAGMA OFF removido (incompatÃ­vel com libsql)
      console.log("[INFO] Prosseguindo com exclusÃ£o em ordem segura sem desativar FOREIGN KEY");

      try {
        // ExclusÃ£o em cascata - ordem das dependÃªncias mais profundas para as mais superficiais
        console.log("ðŸ—‘ï¸ Removendo vÃ­nculos da disciplina " + id + "...");
        
        // Primeiro, buscar todas as atividades da disciplina
        const subjectActivities = await db
          .select({ id: activities.id })
          .from(activities)
          .where(eq(activities.subjectId, id));
        
        const activityIds = subjectActivities.map(a => a.id);

        // Buscar todas as submissÃµes das atividades
        let submissionIds: string[] = [];
        if (activityIds.length > 0) {
          const submissions = await db
            .select({ id: activitySubmissions.id })
            .from(activitySubmissions)
            .where(inArray(activitySubmissions.activityId, activityIds));
          submissionIds = submissions.map(s => s.id);
        }

        // 1. Remover arquivos de submissÃ£o (dependem de submissÃµes)
        console.log("[INFO] Removendo arquivos de submissÃ£o...");
        if (submissionIds.length > 0) {
          await db.delete(submissionFiles)
            .where(inArray(submissionFiles.submissionId, submissionIds));
        }

        // 2. Remover histÃ³rico de submissÃµes (dependem de submissÃµes)
        console.log("[INFO] Removendo histÃ³rico de submissÃµes...");
        if (submissionIds.length > 0) {
          await db.delete(submissionHistory)
            .where(inArray(submissionHistory.submissionId, submissionIds));
        }

        // 3. Remover avaliaÃ§Ãµes de rubrica (dependem de submissÃµes e rubricas)
        console.log("[INFO] Removendo avaliaÃ§Ãµes de rubrica...");
        if (submissionIds.length > 0) {
          await db.delete(rubricEvaluations)
            .where(inArray(rubricEvaluations.submissionId, submissionIds));
        }

        // 4. Remover submissÃµes de atividades
        console.log("[INFO] Removendo submissÃµes de atividades...");
        if (activityIds.length > 0) {
          await db.delete(activitySubmissions)
            .where(inArray(activitySubmissions.activityId, activityIds));
        }

        // 5. Remover arquivos de atividades
        console.log("[INFO] Removendo arquivos de atividades...");
        if (activityIds.length > 0) {
          await db.delete(activityFiles)
            .where(inArray(activityFiles.activityId, activityIds));
        }

        // 6. Remover rubricas de atividades
        console.log("[INFO] Removendo rubricas de atividades...");
        if (activityIds.length > 0) {
          await db.delete(activityRubrics)
            .where(inArray(activityRubrics.activityId, activityIds));
        }

        // 7. Remover atividades
        console.log("[INFO] Removendo atividades...");
        await db.delete(activities).where(eq(activities.subjectId, id));

        // Buscar todas as provas da disciplina
        const subjectExams = await db
          .select({ id: exams.id })
          .from(exams)
          .where(eq(exams.subjectId, id));
        
        const examIds = subjectExams.map(e => e.id);

        // 8. Remover notas de provas (dependem de provas)
        console.log("[INFO] Removendo notas de provas...");
        if (examIds.length > 0) {
          await db.delete(examGrades)
            .where(inArray(examGrades.examId, examIds));
        }

        // 9. Remover provas
        console.log("[INFO] Removendo provas...");
        await db.delete(exams).where(eq(exams.subjectId, id));

        // 10. Remover notas gerais
        console.log("[INFO] Removendo notas...");
        // grades nÃ£o possui subjectId; usa classSubjectId que referencia classSubjects
        const subjectClassLinks = await db
          .select({ id: classSubjects.id })
          .from(classSubjects)
          .where(eq(classSubjects.subjectId, id));
        const classSubjectIds = subjectClassLinks.map(cs => cs.id);
        if (classSubjectIds.length > 0) {
          await db
            .delete(grades)
            .where(inArray(grades.classSubjectId, classSubjectIds));
        }

        // 11. Remover frequÃªncia/presenÃ§a
        console.log("[INFO] Removendo registros de frequÃªncia...");
        await db.delete(attendance).where(eq(attendance.subjectId, id));

        // 12. Remover horÃ¡rios de aula
        console.log("[INFO] Removendo horÃ¡rios de aula...");
        await db.delete(classSchedule).where(eq(classSchedule.subjectId, id));

        // 13. Remover vÃ­nculos de disciplinas com turmas
        console.log("[INFO] Removendo vÃ­nculos com turmas...");
        await db.delete(classSubjects).where(eq(classSubjects.subjectId, id));

        // 14. Remover eventos relacionados
        console.log("[INFO] Removendo eventos...");
        await db.delete(events).where(eq(events.subjectId, id));

        // 15. Remover notificaÃ§Ãµes relacionadas
        console.log("[INFO] Removendo notificaÃ§Ãµes...");
        await db.delete(notifications).where(eq(notifications.subjectId, id));

        // Buscar todos os materiais da disciplina
        const subjectMaterials = await db
          .select({ id: materials.id })
          .from(materials)
          .where(eq(materials.subjectId, id));
        
        const materialIds = subjectMaterials.map(m => m.id);

        // 16. Remover arquivos de materiais (dependem de materiais)
        console.log("[INFO] Removendo arquivos de materiais...");
        if (materialIds.length > 0) {
          await db.delete(materialFiles)
            .where(inArray(materialFiles.materialId, materialIds));
        }

        // 17. Remover materiais
        console.log("[INFO] Removendo materiais...");
        await db.delete(materials).where(eq(materials.subjectId, id));

        // 18. Remover logs do sistema relacionados
        console.log("[INFO] Removendo logs do sistema...");
        await db.delete(systemLogs)
          .where(like(systemLogs.action, `%${id}%`));

        // 19. Finalmente, deletar a disciplina
        console.log("[INFO] Removendo disciplina...");
        const deleteResult = await db.delete(subjects).where(eq(subjects.id, id));

        // Verificar se a disciplina foi realmente excluÃ­da
        const verifyDeletion = await db
          .select()
          .from(subjects)
          .where(eq(subjects.id, id))
          .limit(1);

        if (verifyDeletion.length > 0) {
          throw new Error("Falha ao excluir disciplina - registro ainda existe");
        }

        console.log("âœ… Disciplina " + id + " deletada permanentemente");
        res.json({ message: "Disciplina excluida com sucesso" });

      } catch (error) {
        console.error('Erro durante exclusÃ£o da disciplina:', error);
        throw error;
      } finally {
        // NÃ£o desativamos FOREIGN KEY, portanto nÃ£o hÃ¡ necessidade de reativar
        console.log("[INFO] ExclusÃ£o de disciplina finalizada com FOREIGN KEY ativadas");
      }

    } catch (error) {
      console.error('Erro ao excluir disciplina:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== ENDPOINTS PARA PROFESSORES =====
  
  // Ativar/Desativar professor (admin)
  app.patch('/api/admin/teachers/:id/status', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const user = req.user;
      
      console.log(`AlteraÃ§Ã£o de status do professor ${id} para ${status} solicitada por: ${user.firstName} ${user.lastName}`);

      // Verificar se o professor existe
      const existingTeacher = await db
        .select()
        .from(users)
        .where(and(eq(users.id, id), eq(users.role, 'teacher')))
        .limit(1);

      if (existingTeacher.length === 0) {
        return res.status(404).json({ message: "Professor nÃ£o encontrado" });
      }

      // Atualizar status do professor
      await db
        .update(users)
        .set({ 
          status: status,
          updatedAt: new Date().toISOString()
        })
        .where(eq(users.id, id));

      // Se o professor foi aprovado (status = 'active'), ativar todos os vÃ­nculos pendentes
      if (status === 'active') {
        console.log(`ðŸ”— Ativando vÃ­nculos pendentes do professor ${id}...`);
        
        // Atualizar status dos vÃ­nculos de 'pending' para 'active'
        const updatedLinks = await db
          .update(classSubjects)
          .set({ 
            status: 'active',
            updatedAt: new Date().toISOString()
          })
          .where(and(
            eq(classSubjects.teacherId, id),
            eq(classSubjects.status, 'pendente')
          ));

        console.log(`âœ… VÃ­nculos do professor ${id} ativados automaticamente`);
      }

      // Se o professor foi desativado, desativar todos os vÃ­nculos
      if (status === 'inactive') {
        console.log(`ðŸ”— Desativando vÃ­nculos do professor ${id}...`);
        
        // Atualizar status dos vÃ­nculos para 'inactive'
        const updatedLinks = await db
          .update(classSubjects)
          .set({ 
            status: 'inactive',
            updatedAt: new Date().toISOString()
          })
          .where(eq(classSubjects.teacherId, id));

        console.log(`âŒ VÃ­nculos do professor ${id} desativados`);
      }

      console.log(`âœ… Status do professor ${id} alterado para ${status}`);
      res.json({ message: "Status do professor atualizado com sucesso" });
    } catch (error) {
      console.error('Erro ao alterar status do professor:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Listar professores (admin)
  app.get('/api/admin/teachers', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const user = req.user;
      console.log("Listagem de professores solicitada por: " + user.firstName + " " + user.lastName);

      // Usar SQL direto para buscar professores
      const Database = (await import('better-sqlite3')).default;
      const path = (await import('path')).default;
      const { fileURLToPath } = await import('url');
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const dbPath = schoolDbPath;
      const sqliteDb = new Database(dbPath);
      
      let teachers = [];
      try {
        const selectSql = `
          SELECT id, firstName, lastName, email, role, status, phone, address, registrationNumber, createdAt
          FROM users 
          WHERE role = 'teacher'
          ORDER BY createdAt DESC
        `;
        
        teachers = sqliteDb.prepare(selectSql).all();
        console.log("?? Professores encontrados:", teachers.length);
        console.log("?? Lista de professores:", teachers.map(t => `${t.firstName} ${t.lastName} (${t.email}) - Status: ${t.status}`));
      } finally {
        sqliteDb.close();
      }

      // Para cada professor, buscar suas turmas e disciplinas usando SQL direto
      const teachersWithDetails = await Promise.all(
        teachers.map(async (teacher) => {
          const Database = (await import('better-sqlite3')).default;
          const path = (await import('path')).default;
          const { fileURLToPath } = await import('url');
          const __filename = fileURLToPath(import.meta.url);
          const __dirname = path.dirname(__filename);
          const dbPath = schoolDbPath;
          const sqliteDb = new Database(dbPath);
          
          let teacherSubjects = [];
          try {
            const selectSubjectsSql = `
              SELECT 
                cs.subjectId,
                s.name as subjectName,
                s.code as subjectCode,
                cs.classId,
                c.name as className,
                c.grade as classGrade,
                c.section as classSection
              FROM classSubjects cs
              INNER JOIN subjects s ON cs.subjectId = s.id
              INNER JOIN classes c ON cs.classId = c.id
              WHERE cs.teacherId = ? AND cs.status = 'active'
            `;
            
            teacherSubjects = sqliteDb.prepare(selectSubjectsSql).all(teacher.id);
          } finally {
            sqliteDb.close();
          }

          // Agrupar por disciplina
          const subjectsMap = new Map();
          teacherSubjects.forEach(item => {
            if (!subjectsMap.has(item.subjectId)) {
              subjectsMap.set(item.subjectId, {
                id: item.subjectId,
                name: item.subjectName,
                code: item.subjectCode,
                classes: []
              });
            }
            subjectsMap.get(item.subjectId).classes.push({
              id: item.classId,
              name: item.className,
              grade: item.classGrade,
              section: item.classSection
            });
          });

          return {
            ...teacher,
            subjects: Array.from(subjectsMap.values()),
            totalSubjects: subjectsMap.size,
            totalClasses: teacherSubjects.length
          };
        })
      );

      console.log("? Encontrados " + teachersWithDetails.length + " professores com detalhes");
      res.json({ data: teachersWithDetails });
    } catch (error) {
      console.error('Erro ao buscar professores:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Admin - Get teacher details with subjects and classes
  app.get('/api/admin/teachers/:id/details', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      
      const teacher = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      
      if (teacher.length === 0) {
        return res.status(404).json({ message: 'Professor nao encontrado' });
      }
      
      // Buscar disciplinas e turmas vinculadas ao professor
      const teacherDetails = await db
        .select({
          subjectId: classSubjects.subjectId,
          subjectName: subjects.name,
          subjectCode: subjects.code,
          subjectDescription: subjects.description,
          classId: classSubjects.classId,
          className: classes.name,
          classGrade: classes.grade,
          classSection: classes.section
        })
        .from(classSubjects)
        .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
        .innerJoin(classes, eq(classSubjects.classId, classes.id))
        .where(and(
          eq(classSubjects.teacherId, id),
          eq(classSubjects.status, 'active')
        ));
      
      res.json({
        teacher: teacher[0],
        subjects: teacherDetails
      });
    } catch (error) {
      console.error('Erro ao buscar detalhes do professor:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Listar disciplinas para selecao (admin)
  app.get('/api/admin/subjects', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const user = req.user;
      console.log("Listagem de disciplinas solicitada por: " + user.firstName + " " + user.lastName);

      // Buscar disciplinas (ativas e pendentes)
      const subjectsList = await db
        .select({
          id: subjects.id,
          name: subjects.name,
          code: subjects.code,
          description: subjects.description,
          status: subjects.status,
          createdAt: subjects.createdAt
        })
        .from(subjects)
        .where(or(eq(subjects.status, 'active'), eq(subjects.status, 'pendente')))
        .orderBy(subjects.name);

      // Para cada disciplina, buscar as turmas vinculadas e professores
      const subjectsWithClasses = await Promise.all(
        subjectsList.map(async (subject) => {
          // Buscar vï¿½nculos da disciplina com turmas e professores em uma ï¿½nica consulta
          const subjectLinks = await db
            .select({
              classId: classSubjects.classId,
              teacherId: classSubjects.teacherId,
              teacherFirstName: users.firstName,
              teacherLastName: users.lastName,
              teacherEmail: users.email,
              className: classes.name,
              classGrade: classes.grade,
              classSection: classes.section
            })
            .from(classSubjects)
            .leftJoin(users, eq(classSubjects.teacherId, users.id))
            .leftJoin(classes, eq(classSubjects.classId, classes.id))
            .where(
              and(
                eq(classSubjects.subjectId, subject.id),
                eq(classSubjects.status, 'active')
              )
            );

          // Agrupar por turma para evitar duplicaï¿½ï¿½es
          const linkedClassesMap = new Map();
          let mainTeacher = null;

          subjectLinks.forEach(link => {
            if (link.classId && !linkedClassesMap.has(link.classId)) {
              linkedClassesMap.set(link.classId, {
                classId: link.classId,
                className: link.className,
                classGrade: link.classGrade,
                classSection: link.classSection
              });
            }
            
            // Determinar o professor principal (primeiro professor encontrado)
            if (link.teacherId && !mainTeacher) {
              mainTeacher = {
                id: link.teacherId,
                name: `${link.teacherFirstName} ${link.teacherLastName}`,
                email: link.teacherEmail
              };
            }
          });

          const linkedClasses = Array.from(linkedClassesMap.values());
          
          return {
            ...subject,
            linkedClasses: linkedClasses,
            teacher: mainTeacher
          };
        })
      );

      console.log("? Encontradas " + subjectsWithClasses.length + " disciplinas");
      res.json({ data: subjectsWithClasses });
    } catch (error) {
      console.error('Erro ao buscar disciplinas:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Criar disciplina (admin)
  app.post('/api/admin/subjects', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const user = req.user;
      const { name, code, description, selectedClasses } = req.body;

      console.log("Criacao de disciplina solicitada por: " + user.firstName + " " + user.lastName);
      console.log('Dados da nova disciplina:', { name, code, description });

      // ValidacA?es basicas
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: "Nome da disciplina e obrigatorio" });
      }
      
      if (!code || code.trim() === '') {
        return res.status(400).json({ message: "Codigo da disciplina e obrigatorio" });
      }

      // Verificar se codigo ja existe
      const existingSubject = await db
        .select()
        .from(subjects)
        .where(eq(subjects.code, code))
        .limit(1);

      if (existingSubject.length > 0) {
        return res.status(400).json({ message: "Codigo da disciplina ja esta em uso" });
      }

      // Criar disciplina
      const newSubject = {
        id: uuidv4(),
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description?.trim() || null,
        status: 'pendente' as const, // Requer aprovaï¿½ï¿½o do diretor
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.insert(subjects).values(newSubject);

      console.log("Disciplina criada com sucesso: " + newSubject.id);
      console.log("Nome: " + newSubject.name);
      console.log("Codigo: " + newSubject.code);

      // Vincular disciplina ?s turmas selecionadas
      if (selectedClasses && selectedClasses.length > 0) {
        console.log("Vinculando disciplina ï¿½s turmas: " + selectedClasses.join(', '));
        
        for (const classId of selectedClasses) {
          const classSubjectId = uuidv4();
          await db.insert(classSubjects).values({
            id: classSubjectId,
            classId: classId,
            subjectId: newSubject.id,
            teacherId: null, // Ser? vinculado quando um professor for atribu?do
            status: 'active',
            academicYear: '2025',
            semester: '1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          console.log("[OK] Vinculo criado: Turma " + classId + " - Disciplina " + newSubject.id);
        }
      }
      
      res.status(201).json({ 
        message: "Disciplina criada com sucesso",
        data: newSubject
      });
    } catch (error) {
      console.error('Erro ao criar disciplina:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // PUT /api/admin/subjects/:id - Editar disciplina
  app.put('/api/admin/subjects/:id', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const user = req.user;
      const { id } = req.params;
      const { name, code, description, status, selectedClasses } = req.body;

      console.log("Edicao de disciplina " + id + " solicitada por: " + user.firstName + " " + user.lastName);
      console.log('?? Dados atualizados:', { name, code, description });

      // ValidacA?es basicas
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: "Nome da disciplina e obrigatorio" });
      }
      
      if (!code || code.trim() === '') {
        return res.status(400).json({ message: "Codigo da disciplina e obrigatorio" });
      }

      // Verificar se disciplina existe
      const existingSubject = await db
        .select()
        .from(subjects)
        .where(eq(subjects.id, id))
        .limit(1);

      if (existingSubject.length === 0) {
        return res.status(404).json({ message: "Disciplina nao encontrada" });
      }

      // Verificar se codigo ja existe em outra disciplina
      const codeConflict = await db
        .select()
        .from(subjects)
        .where(and(eq(subjects.code, code), ne(subjects.id, id)))
        .limit(1);

      if (codeConflict.length > 0) {
        return res.status(400).json({ message: "Codigo da disciplina ja esta em uso" });
      }

      const now = new Date().toISOString();
      const pendingPayload = {
        id: uuidv4(),
        type: 'subjectUpdate',
        targetId: id,
        changes: {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description?.trim() || null
        },
        requestedBy: (req.user as any)?.id,
        status: 'pending',
        createdAt: now,
        updatedAt: now
      };

      const existingPending = await db
        .select()
        .from(settings)
        .where(eq(settings.key, `pendingSubjectUpdate:${id}`))
        .limit(1);

      if (existingPending.length > 0) {
        await db.update(settings).set({ value: JSON.stringify(pendingPayload), updatedAt: now, updatedBy: (req.user as any)?.id }).where(eq(settings.id, existingPending[0].id));
      } else {
        await db.insert(settings).values({
          id: uuidv4(),
          key: `pendingSubjectUpdate:${id}`,
          value: JSON.stringify(pendingPayload),
          description: 'Solicitação pendente de atualização de disciplina',
          category: 'approval',
          updatedBy: (req.user as any)?.id,
          createdAt: now,
          updatedAt: now
        });
      }

      await db
        .update(subjects)
        .set({ status: 'pendente', updatedAt: now })
        .where(eq(subjects.id, id));

      console.log("? Solicitacao de atualizacao de disciplina criada: " + id);

      
      
      res.json({ 
        message: "Solicitacao de atualizacao criada; aguardando aprovacao do diretor",
        data: { id, status: 'pendente' }
      });
    } catch (error) {
      console.error('Erro ao atualizar disciplina:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Listar turmas para selecao (admin)
  app.get('/api/admin/classes', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const user = req.user;
      console.log("Listagem de turmas solicitada por: " + user.firstName + " " + user.lastName);

      // Usar SQL direto para buscar turmas
      const Database = (await import('better-sqlite3')).default;
      const path = (await import('path')).default;
      const dbPath = schoolDbPath;
      const sqliteDb = new Database(dbPath);
      
      let classesList = [];
      try {
        const selectSql = `
          SELECT id, name, grade, section, academicYear, status, capacity, createdAt, updatedAt
          FROM classes 
          ORDER BY name
        `;
        
        classesList = sqliteDb.prepare(selectSql).all();
        console.log(`?? ${classesList.length} turmas encontradas`);
      } finally {
        sqliteDb.close();
      }

      // Para cada turma, calcular o nï¿½mero real de alunos e disciplinas usando SQL direto
      const classesWithCounts = await Promise.all(
        classesList.map(async (classItem) => {
          const Database = (await import('better-sqlite3')).default;
          const path = (await import('path')).default;
          const dbPath = schoolDbPath;
          const sqliteDb = new Database(dbPath);
          
          let studentsCount = 0;
          let subjectsCount = 0;
          
          try {
            // Contar alunos matriculados na turma
            const studentsResult = sqliteDb.prepare('SELECT COUNT(*) as count FROM studentClass WHERE classId = ?').get(classItem.id);
            studentsCount = studentsResult?.count || 0;
            
            // Contar disciplinas vinculadas ï¿½ turma (tabela nï¿½o existe, usar 0)
            subjectsCount = 0;
          } finally {
            sqliteDb.close();
          }

          return {
            ...classItem,
            studentCount: studentsCount,
            subjectsCount: subjectsCount
          };
        })
      );

      console.log("? Encontradas " + classesWithCounts.length + " turmas com contadores atualizados");
      res.json({ data: classesWithCounts });
    } catch (error) {
      console.error('Erro ao buscar turmas:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Criar turma (admin)
  app.post('/api/admin/classes', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const user = req.user;
      const { name, grade, section, academicYear, capacity } = req.body;

      console.log("Criacao de turma solicitada por: " + user.firstName + " " + user.lastName);
      console.log('Dados da nova turma:', { name, grade, section, academicYear });

      // ValidacA?es basicas
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: "Nome da turma e obrigatorio" });
      }
      
      if (!grade || grade.trim() === '') {
        return res.status(400).json({ message: "Serie/Ano e obrigatorio" });
      }
      
      if (!section || section.trim() === '') {
        return res.status(400).json({ message: "Secao e obrigatoria" });
      }
      
      if (!academicYear || academicYear.trim() === '') {
        return res.status(400).json({ message: "Ano letivo e obrigatorio" });
      }

      // Usar SQL direto para verificar se jï¿½ existe uma turma com o mesmo nome
      const Database = (await import('better-sqlite3')).default;
      const path = (await import('path')).default;
      const { fileURLToPath } = await import('url');
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const dbPath = schoolDbPath;
      const sqliteDb = new Database(dbPath);
      
      let existingClass = null;
      try {
        const selectSql = 'SELECT * FROM classes WHERE name = ? LIMIT 1';
        existingClass = sqliteDb.prepare(selectSql).get(name.trim());
      } finally {
        sqliteDb.close();
      }

      if (existingClass) {
        return res.status(400).json({ message: "Ja existe uma turma com este nome" });
      }

      // Criar turma usando SQL direto
      const newClass = {
        id: uuidv4(),
        name: name.trim(),
        grade: grade.trim(),
        section: section.trim(),
        academicYear: academicYear.trim(),
        capacity: capacity || 30,
        status: 'pendente' as const, // Requer aprovaï¿½ï¿½o do diretor
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const sqliteDb2 = new Database(dbPath);
      try {
        const insertSql = `
          INSERT INTO classes (id, name, grade, section, academicYear, capacity, status, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        sqliteDb2.prepare(insertSql).run(
          newClass.id,
          newClass.name,
          newClass.grade,
          newClass.section,
          newClass.academicYear,
          newClass.capacity,
          newClass.status,
          newClass.createdAt,
          newClass.updatedAt
        );
      } finally {
        sqliteDb2.close();
      }

      console.log("Turma criada com sucesso: " + newClass.id);
      console.log("Nome: " + newClass.name);
      console.log("Serie: " + newClass.grade + " - Secao: " + newClass.section);
      console.log("Ano letivo: " + newClass.academicYear);
      
      res.status(201).json({ 
        message: "Turma criada com sucesso",
        data: newClass
      });
    } catch (error) {
      console.error('Erro ao criar turma:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Criar turma (professor - com vinculaï¿½ï¿½o automï¿½tica)
  app.post('/api/teacher/classes', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const user = req.user as any;
      const { name, grade, section, academicYear, capacity, subjectName } = req.body;

      console.log(`? Criaï¿½ï¿½o de turma por professor: ${user.firstName} ${user.lastName}`);
      console.log('?? Dados da nova turma:', { name, grade, section, academicYear, subjectName });

      // Validaï¿½ï¿½es bï¿½sicas
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: "Nome da turma ï¿½ obrigatï¿½rio" });
      }
      
      if (!grade || grade.trim() === '') {
        return res.status(400).json({ message: "Sï¿½rie/Ano ï¿½ obrigatï¿½rio" });
      }
      
      if (!section || section.trim() === '') {
        return res.status(400).json({ message: "Seï¿½ï¿½o ï¿½ obrigatï¿½ria" });
      }
      
      if (!academicYear || academicYear.trim() === '') {
        return res.status(400).json({ message: "Ano letivo ï¿½ obrigatï¿½rio" });
      }

      if (!subjectName || subjectName.trim() === '') {
        return res.status(400).json({ message: "Nome da disciplina ï¿½ obrigatï¿½rio" });
      }

      // Verificar se jï¿½ existe uma turma com o mesmo nome
      const existingClass = await db
        .select()
        .from(classes)
        .where(eq(classes.name, name.trim()))
        .limit(1);

      if (existingClass.length > 0) {
        return res.status(400).json({ message: "Jï¿½ existe uma turma com este nome" });
      }

      // 1. Criar turma
      const newClass = {
        id: uuidv4(),
        name: name.trim(),
        grade: grade.trim(),
        section: section.trim(),
        academicYear: academicYear.trim(),
        capacity: capacity || 30,
        // currentStudents serï¿½ calculado dinamicamente
        coordinatorId: user.id, // Professor vira como coordenador
        status: 'pendente' as const, // Requer aprovaï¿½ï¿½o do diretor
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.insert(classes).values(newClass);
      console.log(`? Turma criada: ${newClass.name} (ID: ${newClass.id})`);

      // 2. Criar disciplina se nï¿½o existir
      let subjectId;
      const existingSubject = await db
        .select()
        .from(subjects)
        .where(eq(subjects.name, subjectName.trim()))
        .limit(1);

      if (existingSubject.length > 0) {
        subjectId = existingSubject[0].id;
        console.log(`?? Disciplina existente: ${subjectName} (ID: ${subjectId})`);
      } else {
        subjectId = uuidv4();
        const newSubject = {
          id: subjectId,
          name: subjectName.trim(),
          code: subjectName.trim().toUpperCase().substring(0, 6),
          description: `Disciplina: ${subjectName.trim()}`,
          status: 'pendente' as const, // Requer aprovaï¿½ï¿½o do diretor
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await db.insert(subjects).values(newSubject);
        console.log(`?? Disciplina criada: ${subjectName} (ID: ${subjectId})`);
      }

      // 3. Vincular professor ï¿½ turma-disciplina
      const classSubjectId = uuidv4();
      const classSubject = {
        id: classSubjectId,
        classId: newClass.id,
        subjectId: subjectId,
        teacherId: user.id,
        schedule: 'A definir',
        room: 'A definir',
        semester: '1ï¿½ Semestre',
        academicYear: academicYear.trim(),
        status: 'pendente' as const, // Requer aprovaï¿½ï¿½o do diretor
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.insert(classSubjects).values(classSubject);
      console.log(`?? Professor ${user.firstName} vinculado ï¿½ turma-disciplina`);

      res.status(201).json({
        message: "Turma criada e vinculada com sucesso!",
        class: {
          id: newClass.id,
          name: newClass.name,
          subject: {
            id: subjectId,
            name: subjectName.trim()
          }
        }
      });

    } catch (error) {
      console.error('Erro ao criar turma pelo professor:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // PUT /api/admin/classes/:id - Editar turma
  app.put('/api/admin/classes/:id', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const user = req.user;
      const { id } = req.params;
      const { name, grade, section, academicYear, capacity, status } = req.body;

      console.log("Edicao de turma " + id + " solicitada por: " + user.firstName + " " + user.lastName);
      console.log('?? Dados atualizados:', { name, grade, section, academicYear, capacity });

      // ValidacA?es basicas
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: "Nome da turma e obrigatorio" });
      }
      
      if (!grade || grade.trim() === '') {
        return res.status(400).json({ message: "Serie/Ano e obrigatorio" });
      }

      if (!section || section.trim() === '') {
        return res.status(400).json({ message: "Secao e obrigatoria" });
      }

      // Verificar se turma existe
      const existingClass = await db
        .select()
        .from(classes)
        .where(eq(classes.id, id))
        .limit(1);

      if (existingClass.length === 0) {
        return res.status(404).json({ message: "Turma nao encontrada" });
      }

      // Verificar se nome ja existe em outra turma
      const nameConflict = await db
        .select()
        .from(classes)
        .where(and(eq(classes.name, name), ne(classes.id, id)))
        .limit(1);

      if (nameConflict.length > 0) {
        return res.status(400).json({ message: "Nome da turma ja esta em uso" });
      }

      const nowClass = new Date().toISOString();
      const pendingClassPayload = {
        id: uuidv4(),
        type: 'classUpdate',
        targetId: id,
        changes: {
          name: name.trim(),
          grade: grade.trim(),
          section: section.trim().toUpperCase(),
          academicYear: academicYear || '2024',
          capacity: capacity || 30
        },
        requestedBy: (req.user as any)?.id,
        status: 'pending',
        createdAt: nowClass,
        updatedAt: nowClass
      };

      const existingClassPending = await db
        .select()
        .from(settings)
        .where(eq(settings.key, `pendingClassUpdate:${id}`))
        .limit(1);

      if (existingClassPending.length > 0) {
        await db.update(settings).set({ value: JSON.stringify(pendingClassPayload), updatedAt: nowClass, updatedBy: (req.user as any)?.id }).where(eq(settings.id, existingClassPending[0].id));
      } else {
        await db.insert(settings).values({
          id: uuidv4(),
          key: `pendingClassUpdate:${id}`,
          value: JSON.stringify(pendingClassPayload),
          description: 'Solicitação pendente de atualização de turma',
          category: 'approval',
          updatedBy: (req.user as any)?.id,
          createdAt: nowClass,
          updatedAt: nowClass
        });
      }

      await db
        .update(classes)
        .set({ status: 'pendente', updatedAt: nowClass })
        .where(eq(classes.id, id));

      console.log("? Solicitacao de atualizacao de turma criada: " + id);
      
      res.json({ 
        message: "Solicitacao de atualizacao criada; aguardando aprovacao do diretor",
        data: { id, status: 'pendente' }
      });
    } catch (error) {
      console.error('Erro ao atualizar turma:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Criar professor (admin)
  app.post('/api/admin/teachers', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const user = req.user;
      const { firstName, lastName, email, phone, address, cpf, subjects: selectedSubjects, classes: selectedClasses } = req.body;

      console.log("Criacao de professor solicitada por: " + user.firstName + " " + user.lastName);
      console.log('Dados do novo professor:', { firstName, lastName, email });
      console.log('Disciplinas selecionadas:', selectedSubjects);
      console.log('Turmas selecionadas:', selectedClasses);

      // Gerar email padrao sempre com @escola.com
      let finalEmail;
      if (email && email !== '' && email.endsWith('@escola.com')) {
        // Email completo ja fornecido
        finalEmail = email;
      } else if (email && email !== '') {
        // Email parcial fornecido - usar apenas a parte antes do @ (se houver)
        const emailPart = email.split('@')[0];
        // Limpar caracteres especiais e espacos
        const cleanEmailPart = emailPart.replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
        finalEmail = `${cleanEmailPart}@escola.com`;
      } else {
        // Gerar email automatico
        const cleanFirstName = firstName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
        const cleanLastName = lastName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
        finalEmail = `${cleanFirstName}.${cleanLastName}@escola.com`;
      }
      
      // Nï¿½o verificar email duplicado pois email serï¿½ null inicialmente
      // A verificaï¿½ï¿½o serï¿½ feita quando o diretor aprovar o usuï¿½rio

      // Gerar numero de matricula aleatorio e unico
      let finalRegistrationNumber;
      let attempts = 0;
      const maxAttempts = 10;
      
      do {
        const randomNumber = Math.floor(Math.random() * 900000) + 100000;
        finalRegistrationNumber = randomNumber.toString();
        
        const existingRegistration = await db
          .select()
          .from(users)
          .where(eq(users.registrationNumber, finalRegistrationNumber))
          .limit(1);
        
        if (existingRegistration.length === 0) {
          break;
        }
        
        attempts++;
      } while (attempts < maxAttempts);
      
      if (attempts >= maxAttempts) {
        return res.status(500).json({ message: "Erro ao gerar matricula unica. Tente novamente." });
      }

      // Criar professor com status 'pending' (sem email e senha ainda)
      const newTeacher = {
        id: uuidv4(),
        firstName,
        lastName,
        email: null, // Nï¿½o criar email ainda
        password: null, // Nï¿½o criar senha ainda
        role: 'teacher',
        status: 'pendente' as const,
        phone: phone || null,
        address: address || null,
        registrationNumber: finalRegistrationNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Usar SQL direto com better-sqlite3 para evitar problemas com Drizzle ORM
      const Database = (await import('better-sqlite3')).default;
      const path = (await import('path')).default;
      const dbPath = schoolDbPath;
      const sqliteDb = new Database(dbPath);
      
      try {
        const insertSql = `
          INSERT INTO users (
            id, email, password, firstName, lastName, profileImageUrl,
            role, status, lastSeen, phone, address, registrationNumber,
            createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const stmt = sqliteDb.prepare(insertSql);
        stmt.run(
          newTeacher.id,
          newTeacher.email,
          newTeacher.password,
          newTeacher.firstName,
          newTeacher.lastName,
          null, // profileImageUrl
          newTeacher.role,
          newTeacher.status,
          null, // lastSeen
          newTeacher.phone,
          newTeacher.address,
          newTeacher.registrationNumber,
          newTeacher.createdAt,
          newTeacher.updatedAt
        );
        
        console.log("? Professor criado com status 'pendente': " + newTeacher.id);
        
        // Vincular professor ï¿½s disciplinas e turmas selecionadas (status pending)
        if (selectedSubjects && selectedSubjects.length > 0 && selectedClasses && selectedClasses.length > 0) {
          console.log("Vinculando professor ï¿½s disciplinas e turmas (status pending)");
          
          for (const subjectId of selectedSubjects) {
            for (const classId of selectedClasses) {
              const classSubjectId = uuidv4();
              
              const insertClassSubjectSql = `
                INSERT INTO classSubjects (
                  id, classId, subjectId, teacherId, schedule, room, semester, 
                  academicYear, status, createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `;
              
              const stmt = sqliteDb.prepare(insertClassSubjectSql);
              stmt.run(
                classSubjectId,
                classId,
                subjectId,
                newTeacher.id, // Vincular ao professor criado
                null, // schedule
                null, // room
                '1', // semester
                '2025', // academicYear
                'pendente', // status - aguardando aprovaï¿½ï¿½o
                newTeacher.createdAt,
                newTeacher.updatedAt
              );
              
              console.log("? Vï¿½nculo criado (pending): Professor " + newTeacher.id + " - Disciplina " + subjectId + " - Turma " + classId);
            }
          }
        }
      } finally {
        sqliteDb.close();
      }

      console.log("?? Nome: " + firstName + " " + lastName);
      console.log("?? Funï¿½ï¿½o: Professor");
      console.log("?? Matrï¿½cula: " + finalRegistrationNumber);
      console.log("? Aguardando aprovaï¿½ï¿½o do diretor para ativar login");
      
      res.status(201).json({ 
        message: "Professor criado com sucesso",
        data: { 
          id: newTeacher.id,
          email: finalEmail,
          registrationNumber: finalRegistrationNumber,
          status: 'pendente',
          message: 'Aguardando aprovaï¿½ï¿½o do diretor para ativar login'
        }
      });
    } catch (error) {
      console.error('Erro ao criar professor:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // PUT /api/admin/teachers/:id - Editar professor
  app.put('/api/admin/teachers/:id', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const user = req.user;
      const { id } = req.params;
      const { firstName, lastName, email, phone, address, status } = req.body;

      console.log("Edicao de professor " + id + " solicitada por: " + user.firstName + " " + user.lastName);
      console.log('?? Dados atualizados:', { firstName, lastName, email, phone });

      // ValidacA?es basicas
      if (!firstName || firstName.trim() === '') {
        return res.status(400).json({ message: "Nome e obrigatorio" });
      }
      
      if (!lastName || lastName.trim() === '') {
        return res.status(400).json({ message: "Sobrenome e obrigatorio" });
      }

      // Email não pode ser alterado após criação; ignorar qualquer mudança

      // Verificar se professor existe
      const existingTeacher = await db
        .select()
        .from(users)
        .where(and(eq(users.id, id), eq(users.role, 'teacher')))
        .limit(1);

      if (existingTeacher.length === 0) {
        return res.status(404).json({ message: "Professor nao encontrado" });
      }

      // Manter email existente, sem alterações
      const finalEmail = (existingTeacher[0] as any).email;

      // Não validar conflito, pois o email permanece o mesmo do usuário

      // Atualizar professor
      const updatedTeacher = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        status: status || 'active',
        updatedAt: new Date().toISOString()
      };

      await db
        .update(users)
        .set(updatedTeacher)
        .where(eq(users.id, id));

      console.log("? Professor " + id + " atualizado com sucesso");
      console.log("Email mantido: " + finalEmail);
      
      res.json({ 
        message: "Professor atualizado com sucesso",
        data: { id, ...updatedTeacher, email: finalEmail }
      });
    } catch (error) {
      console.error('Erro ao atualizar professor:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Admin - Get teacher assignments (subjects and classes)
  app.get('/api/admin/teachers/:id/assignments', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;

      const teacherExists = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.id, id), eq(users.role, 'teacher')))
        .limit(1);

      if (teacherExists.length === 0) {
        return res.status(404).json({ message: 'Professor nao encontrado' });
      }

      const subjectRows = await db
        .select({ id: subjects.id, name: subjects.name, code: subjects.code })
        .from(classSubjects)
        .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
        .where(eq(classSubjects.teacherId, id));

      const classRows = await db
        .select({ id: classes.id, name: classes.name, grade: classes.grade, section: classes.section })
        .from(classSubjects)
        .innerJoin(classes, eq(classSubjects.classId, classes.id))
        .where(eq(classSubjects.teacherId, id));

      // Deduplicar por id
      const subjectsList = Array.from(new Map(subjectRows.map(s => [s.id, s])).values());
      const classesList = Array.from(new Map(classRows.map(c => [c.id, c])).values());

      res.json({ subjects: subjectsList, classes: classesList });
    } catch (error) {
      console.error('Erro ao buscar assignments do professor:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  app.put('/api/admin/teachers/:id/assignments', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const { subjects = [], classes = [] } = req.body as { subjects: string[]; classes: string[] };

      if (!Array.isArray(subjects) || !Array.isArray(classes)) {
        return res.status(400).json({ message: 'Payload invalido: subjects e classes devem ser arrays' });
      }

      const teacherExists = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.id, id), eq(users.role, 'teacher')))
        .limit(1);

      if (teacherExists.length === 0) {
        return res.status(404).json({ message: 'Professor nao encontrado' });
      }

      
      const existingLinks = await db
        .select({ id: classSubjects.id, subjectId: classSubjects.subjectId, classId: classSubjects.classId, status: classSubjects.status })
        .from(classSubjects)
        .where(eq(classSubjects.teacherId, id));

      const existingSet = new Set(existingLinks.map(l => `${l.subjectId}:${l.classId}`));
      const desiredPairs: string[] = [];
      for (const sId of subjects) {
        for (const cId of classes) {
          desiredPairs.push(`${sId}:${cId}`);
        }
      }
      const desiredSet = new Set(desiredPairs);

      
      const now = new Date().toISOString();
      let createdCount = 0;
      for (const pair of desiredPairs) {
        if (!existingSet.has(pair)) {
          const [subjectId, classId] = pair.split(':');
          await db.insert(classSubjects).values({
            id: uuidv4(),
            teacherId: id,
            subjectId,
            classId,
            semester: '1',
            academicYear: now.substring(0, 4),
            status: 'pendente',
            createdAt: now,
            updatedAt: now,
          });
          createdCount++;
        }
      }

      // Desativar v 0Dnculos que nao estao mais desejados
      let inactivatedCount = 0;
      for (const link of existingLinks) {
        const key = `${link.subjectId}:${link.classId}`;
        if (!desiredSet.has(key) && link.status === 'active') {
          await db
            .update(classSubjects)
            .set({ status: 'inactive', updatedAt: now })
            .where(eq(classSubjects.id, link.id));
          inactivatedCount++;
        }
      }

      res.json({ message: 'Vinculos atualizados', created: createdCount, inactivated: inactivatedCount });
    } catch (error) {
      console.error('Erro ao atualizar assignments do professor:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Diretor - Aprovar vínculos pendentes do professor (disciplinas/turmas)
  app.post('/api/director/teachers/:id/assignments/approve', isAuthenticated, hasRole(['director']), async (req, res) => {
    try {
      const { id } = req.params;
      const now = new Date().toISOString();

      const teacherExists = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.id, id), eq(users.role, 'teacher')))
        .limit(1);

      if (teacherExists.length === 0) {
        return res.status(404).json({ message: 'Professor nao encontrado' });
      }

      const result = await db
        .update(classSubjects)
        .set({ status: 'active', updatedAt: now })
        .where(and(eq(classSubjects.teacherId, id), eq(classSubjects.status, 'pendente')));

      res.json({ message: 'Vinculos do professor aprovados', updated: (result as any).changes ?? undefined });
    } catch (error) {
      console.error('Erro ao aprovar vínculos do professor:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // === ROTAS DE MATERIAIS DIDATICOS === (TEMPORARIAMENTE COMENTADAS)
  // Listar materiais do professor
  app.get('/api/materials/teacher/:teacherId', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { teacherId } = req.params;
      const { folder } = req.query;
      const user = req.user as any;

      // Verificar se o professor pode acessar
      if (user.role !== 'teacher' || user.id !== teacherId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      console.log("Buscando materiais do professor: " + teacherId);

      let whereCondition;
      
      // Se uma pasta especï¿½fica foi solicitada
      if (folder) {
        if (folder === 'root') {
          // Mostrar apenas materiais na raiz (sem pasta)
          whereCondition = and(eq(materials.teacherId, teacherId), eq(materials.folder, null));
        } else {
          // Mostrar materiais da pasta especï¿½fica
          whereCondition = and(eq(materials.teacherId, teacherId), eq(materials.folder, folder));
        }
      } else {
        // Por padrï¿½o, mostrar todos os materiais ativos do professor
        whereCondition = and(
          eq(materials.teacherId, teacherId),
          eq(materials.status, 'active')
        );
      }

      // Buscar materiais bï¿½sicos primeiro
      const materialsData = await db
        .select({
          id: materials.id,
          title: materials.title,
          description: materials.description,
          materialType: materials.materialType,
          content: materials.content,
          folder: materials.folder,
          isPublic: materials.isPublic,
          status: materials.status,
          createdAt: materials.createdAt,
          updatedAt: materials.updatedAt,
          subjectName: subjects.name,
          className: classes.name
        })
        .from(materials)
        .leftJoin(subjects, eq(materials.subjectId, subjects.id))
        .leftJoin(classes, eq(materials.classId, classes.id))
        .where(whereCondition)
        .orderBy(desc(materials.createdAt));

      // Buscar contagem de arquivos para cada material
      const materialsWithFiles = await Promise.all(
        materialsData.map(async (material) => {
          const filesData = await db
            .select({
              filesCount: count(materialFiles.id),
              totalSize: sum(materialFiles.fileSize)
            })
            .from(materialFiles)
            .where(eq(materialFiles.materialId, material.id));
          
          return {
            ...material,
            filesCount: filesData[0]?.filesCount || 0,
            totalSize: filesData[0]?.totalSize || null
          };
        })
      );

      console.log("Encontrados " + materialsWithFiles.length + " materiais do professor");
      
      // Debug logs para verificar dados retornados
      materialsWithFiles.forEach((material: any, index: number) => {
        console.log(`?? Material ${index + 1}: ${material.title}`);
        console.log(`  - Tipo: ${material.materialType}`);
        console.log(`  - filesCount: ${material.filesCount}`);
        console.log(`  - totalSize: ${material.totalSize}`);
      });

      res.json(materialsWithFiles);
    } catch (error) {
      console.error('Erro ao buscar materiais do professor:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Listar pastas do professor
  app.get('/api/materials/teacher/:teacherId/folders', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { teacherId } = req.params;
      const user = req.user as any;

      // Verificar se o professor pode acessar
      if (user.role !== 'teacher' || user.id !== teacherId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      console.log("Buscando pastas do professor: " + teacherId);

      const foldersData = await db
        .select({
          folder: materials.folder,
          count: count(materials.id)
        })
        .from(materials)
        .where(and(
          eq(materials.teacherId, teacherId),
          isNotNull(materials.folder)
        ))
        .groupBy(materials.folder)
        .orderBy(materials.folder);

      console.log("Encontradas " + foldersData.length + " pastas do professor");

      res.json(foldersData);
    } catch (error) {
      console.error('Erro ao buscar pastas do professor:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Listar materiais para aluno (por disciplina)
  app.get('/api/materials/student', isAuthenticated, hasRole(['student']), async (req, res) => {
    try {
      const user = req.user as any;
      const { subjectId } = req.query;

      console.log("Buscando materiais para aluno: " + user.firstName + " " + user.lastName);

      // Buscar disciplinas do aluno
      const studentSubjects = await db
        .select({
          subjectId: subjects.id,
          subjectName: subjects.name,
          className: classes.name
        })
        .from(studentClass)
        .innerJoin(classes, eq(studentClass.classId, classes.id))
        .innerJoin(classSubjects, eq(classes.id, classSubjects.classId))
        .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
        .where(eq(studentClass.studentId, user.id));

      if (studentSubjects.length === 0) {
        return res.json([]);
      }

      const subjectIds = studentSubjects.map(s => s.subjectId);

      // Buscar materiais das disciplinas do aluno
      let query = db
        .select({
          id: materials.id,
          title: materials.title,
          description: materials.description,
          materialType: materials.materialType,
          content: materials.content,
          folder: materials.folder,
          isPublic: materials.isPublic,
          createdAt: materials.createdAt,
          subjectName: subjects.name,
          className: classes.name,
          filesCount: count(materialFiles.id)
        })
        .from(materials)
        .leftJoin(subjects, eq(materials.subjectId, subjects.id))
        .leftJoin(classes, eq(materials.classId, classes.id))
        .leftJoin(materialFiles, eq(materials.id, materialFiles.materialId))
        .where(
          and(
            inArray(materials.subjectId, subjectIds),
            eq(materials.isPublic, true),
            eq(materials.status, 'active')
          )
        )
        .groupBy(materials.id)
        .orderBy(desc(materials.createdAt));

      // Filtrar por disciplina especifica se fornecida
      if (subjectId) {
        query = query.where(
          and(
            eq(materials.subjectId, subjectId as string),
            eq(materials.isPublic, true),
            eq(materials.status, 'active')
          )
        );
      }

      const materialsData = await query;

      console.log("Encontrados " + materialsData.length + " materiais para o aluno");

      res.json(materialsData);
    } catch (error) {
      console.error('Erro ao buscar materiais do aluno:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Criar novo material
  app.post('/api/materials', isAuthenticated, hasRole(['teacher']), upload.array('files', 5), async (req, res) => {
    try {
      const user = req.user as any;
      const { title, description, subjectId, classId, materialType, content, isPublic, folder } = req.body;
      const files = req.files as Express.Multer.File[];

      console.log("Criando novo material: " + title);

      const materialId = uuidv4();
      const now = new Date().toISOString();

      // Criar material
      const newMaterial = {
        id: materialId,
        title: title.trim(),
        description: description?.trim() || null,
        subjectId,
        classId,
        teacherId: user.id,
        materialType,
        content: content?.trim() || null,
        folder: folder?.trim() || null,
        isPublic: isPublic === 'true' || isPublic === true,
        status: 'active',
        createdAt: now,
        updatedAt: now
      };

      await db.insert(materials).values(newMaterial);

      // Log criaï¿½ï¿½o de material
      logger.materialCreated(user, title, req);

      // Processar arquivos se houver
      if (files && files.length > 0) {
        console.log("?? Processando arquivos:", files.length);
        files.forEach((file, index) => {
          console.log(`  Arquivo ${index + 1}:`);
          console.log(`    - filename: ${file.filename}`);
          console.log(`    - originalname: ${file.originalname}`);
          console.log(`    - size: ${file.size}`);
          console.log(`    - mimetype: ${file.mimetype}`);
          console.log(`    - path: ${file.path}`);
        });

        const fileRecords = files.map(file => ({
          id: uuidv4(),
          materialId,
          fileName: file.filename,
          originalFileName: file.originalname,
          filePath: file.path,
          fileSize: file.size,
          fileType: file.mimetype,
          fileCategory: 'main' as const,
          uploadedBy: user.id,
          createdAt: now
        }));

        console.log("?? Registros de arquivo a serem inseridos:");
        fileRecords.forEach((record, index) => {
          console.log(`  Registro ${index + 1}:`);
          console.log(`    - id: ${record.id}`);
          console.log(`    - materialId: ${record.materialId}`);
          console.log(`    - fileName: ${record.fileName}`);
          console.log(`    - originalFileName: ${record.originalFileName}`);
          console.log(`    - filePath: ${record.filePath}`);
          console.log(`    - fileSize: ${record.fileSize}`);
          console.log(`    - fileType: ${record.fileType}`);
          console.log(`    - fileCategory: ${record.fileCategory}`);
          console.log(`    - uploadedBy: ${record.uploadedBy}`);
          console.log(`    - createdAt: ${record.createdAt}`);
        });

        // Inserir arquivos usando SQL direto para evitar problemas com Drizzle
        for (const record of fileRecords) {
          await client.execute({
            sql: `INSERT INTO materialFiles (id, materialId, fileName, originalFileName, filePath, fileSize, fileType, fileCategory, uploadedBy, createdAt) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              record.id,
              record.materialId,
              record.fileName,
              record.originalFileName,
              record.filePath,
              record.fileSize,
              record.fileType,
              record.fileCategory,
              record.uploadedBy,
              record.createdAt
            ]
          });
        }
        console.log(files.length + " arquivo(s) processado(s) para o material");
      }

      console.log("Material criado com sucesso: " + title);

      res.status(201).json({
        message: "Material criado com sucesso",
        data: newMaterial
      });
    } catch (error) {
      console.error('Erro ao criar material:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Upload simples de arquivo para material existente
  app.post('/api/materials/:id/files', isAuthenticated, hasRole(['teacher']), upload.single('file'), async (req, res) => {
    try {
      const { id: materialId } = req.params;
      const file = req.file;
      const user = req.user as any;

      if (!file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }

      // Verificar se o material existe e pertence ao professor
      const material = await db
        .select()
        .from(materials)
        .where(eq(materials.id, materialId))
        .limit(1);

      if (material.length === 0) {
        return res.status(404).json({ message: "Material nï¿½o encontrado" });
      }

      if (material[0].teacherId !== user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Criar registro do arquivo
      const fileRecord = {
        id: uuidv4(),
        materialId,
        fileName: file.filename,
        originalFileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        fileType: file.mimetype,
        fileCategory: 'main' as const,
        uploadedBy: user.id,
        createdAt: new Date().toISOString()
      };

      await db.insert(materialFiles).values(fileRecord);
      console.log(`Arquivo ${file.originalname} adicionado ao material ${material[0].title}`);

      res.status(201).json({
        message: "Arquivo adicionado com sucesso",
        file: fileRecord
      });
    } catch (error) {
      console.error('Erro ao adicionar arquivo ao material:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Deletar arquivo especï¿½fico de material
  app.delete('/api/materials/files/:fileId', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { fileId } = req.params;
      const user = req.user as any;

      // Buscar o arquivo
      const file = await db
        .select()
        .from(materialFiles)
        .where(eq(materialFiles.id, fileId))
        .limit(1);

      if (file.length === 0) {
        return res.status(404).json({ message: "Arquivo nï¿½o encontrado" });
      }

      // Verificar se o material pertence ao professor
      const material = await db
        .select()
        .from(materials)
        .where(eq(materials.id, file[0].materialId))
        .limit(1);

      if (material.length === 0 || material[0].teacherId !== user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Deletar arquivo fï¿½sico
      try {
        const filePath = path.resolve(file[0].filePath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.log('Erro ao deletar arquivo fï¿½sico:', error);
      }

      // Deletar registro do banco
      await db.delete(materialFiles).where(eq(materialFiles.id, fileId));

      console.log(`Arquivo ${file[0].originalFileName} deletado com sucesso`);
      res.json({ message: "Arquivo deletado com sucesso" });
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar material especifico
  app.get('/api/materials/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user as any;

      console.log("Buscando material: " + id);

      const materialData = await db
        .select({
          id: materials.id,
          title: materials.title,
          description: materials.description,
          materialType: materials.materialType,
          content: materials.content,
          isPublic: materials.isPublic,
          status: materials.status,
          createdAt: materials.createdAt,
          updatedAt: materials.updatedAt,
          subjectId: materials.subjectId,
          classId: materials.classId,
          teacherId: materials.teacherId,
          subjectName: subjects.name,
          className: classes.name,
          teacherFirstName: users.firstName,
          teacherLastName: users.lastName
        })
        .from(materials)
        .leftJoin(subjects, eq(materials.subjectId, subjects.id))
        .leftJoin(classes, eq(materials.classId, classes.id))
        .leftJoin(users, eq(materials.teacherId, users.id))
        .where(eq(materials.id, id))
        .limit(1);

      if (materialData.length === 0) {
        return res.status(404).json({ message: "Material nao encontrado" });
      }

      const material = materialData[0];

      // Verificar permissA?es
      if (user.role === 'student') {
        if (!material.isPublic || material.status !== 'active') {
          return res.status(403).json({ message: "Acesso negado" });
        }
      } else if (user.role === 'teacher' && material.teacherId !== user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Buscar arquivos do material
      const materialFilesData = await db
        .select()
        .from(materialFiles)
        .where(eq(materialFiles.materialId, id));

      console.log("Material encontrado: " + material.title);
      console.log(materialFilesData.length + " arquivo(s) encontrado(s)");

      const teacherName = material.teacherFirstName && material.teacherLastName 
        ? `${material.teacherFirstName} ${material.teacherLastName}` 
        : null;

      res.json({
        ...material,
        teacherName,
        files: materialFilesData
      });
    } catch (error) {
      console.error('Erro ao buscar material:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Download de todos os arquivos de um material
  app.get('/api/materials/:materialId/download', isAuthenticated, async (req, res) => {
    try {
      const { materialId } = req.params;
      const user = req.user as any;

      console.log("BAIXANDO TODOS OS ARQUIVOS DO MATERIAL: " + materialId);

      // Buscar o material
      const material = await db
        .select()
        .from(materials)
        .where(eq(materials.id, materialId))
        .limit(1);

      if (material.length === 0) {
        return res.status(404).json({ message: "Material nï¿½o encontrado" });
      }

      // Verificar permissï¿½es
      if (user.role === 'student') {
        if (!material[0].isPublic || material[0].status !== 'active') {
          return res.status(403).json({ message: "Acesso negado" });
        }
      } else if (user.role === 'teacher' && material[0].teacherId !== user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Buscar arquivos do material
      const materialFiles = await db
        .select()
        .from(materialFiles)
        .where(eq(materialFiles.materialId, materialId));

      if (materialFiles.length === 0) {
        return res.status(404).json({ message: "Nenhum arquivo encontrado para este material" });
      }

      // Se hï¿½ apenas um arquivo, fazer download direto
      if (materialFiles.length === 1) {
        const file = materialFiles[0];
        const filePath = path.resolve(file.filePath);
        
        if (!fs.existsSync(filePath)) {
          return res.status(404).json({ message: "Arquivo nï¿½o encontrado no servidor" });
        }

        res.setHeader('Content-Disposition', `attachment; filename="${file.originalFileName}"`);
        res.setHeader('Content-Type', file.fileType);
        
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        return;
      }

      // Se hï¿½ mï¿½ltiplos arquivos, criar um ZIP
      const archiver = (await import('archiver')).default;
      const archive = archiver('zip', { zlib: { level: 9 } });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${material[0].title}_arquivos.zip"`);

      archive.pipe(res);

      // Adicionar cada arquivo ao ZIP
      for (const file of materialFiles) {
        const filePath = path.resolve(file.filePath);
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: file.originalFileName });
        }
      }

      await archive.finalize();

    } catch (error) {
      console.error('Erro ao baixar arquivos do material:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Download de arquivo de material
  app.get('/api/materials/files/:fileId/download', isAuthenticated, async (req, res) => {
    try {
      const { fileId } = req.params;
      const user = req.user as any;

      console.log("BAIXANDO ARQUIVO DE MATERIAL");
      console.log("File ID: " + fileId);

      const file = await db
        .select()
        .from(materialFiles)
        .where(eq(materialFiles.id, fileId))
        .limit(1);

      if (file.length === 0) {
        console.log('? Arquivo nao encontrado');
        return res.status(404).json({ message: "Arquivo nao encontrado" });
      }

      const materialFile = file[0];
      console.log('? Arquivo encontrado:', materialFile.originalFileName);

      // Verificar se o arquivo existe no disco
      const filePath = path.resolve(materialFile.filePath);
      if (!fs.existsSync(filePath)) {
        console.log('? Arquivo nao encontrado no disco:', filePath);
        return res.status(404).json({ message: "Arquivo nao encontrado no servidor" });
      }

      // Enviar arquivo para download
      res.setHeader('Content-Disposition', `attachment; filename="${materialFile.originalFileName}"`);
      res.setHeader('Content-Type', materialFile.fileType);

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

    } catch (error) {
      console.error('? Erro ao baixar arquivo de material:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Visualizar arquivo de material
  app.get('/api/materials/files/:fileId/view', isAuthenticated, async (req, res) => {
    try {
      const { fileId } = req.params;
      const user = req.user as any;

      console.log("VISUALIZANDO ARQUIVO DE MATERIAL");
      console.log("File ID: " + fileId);

      const file = await db
        .select()
        .from(materialFiles)
        .where(eq(materialFiles.id, fileId))
        .limit(1);

      if (file.length === 0) {
        console.log('? Arquivo nao encontrado');
        return res.status(404).json({ message: "Arquivo nao encontrado" });
      }

      const materialFile = file[0];
      console.log('? Arquivo encontrado:', materialFile.originalFileName);

      // Verificar se o arquivo existe no disco
      const filePath = path.resolve(materialFile.filePath);
      if (!fs.existsSync(filePath)) {
        console.log('? Arquivo nao encontrado no disco:', filePath);
        return res.status(404).json({ message: "Arquivo nao encontrado no servidor" });
      }

      // Definir Content-Type baseado na extensao do arquivo
      const fileExtension = path.extname(materialFile.originalFileName).toLowerCase();
      let contentType = materialFile.fileType;

      // Mapear extensA?es para Content-Types corretos
      const mimeTypes = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.txt': 'text/plain',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif'
      };

      if (mimeTypes[fileExtension]) {
        contentType = mimeTypes[fileExtension];
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${materialFile.originalFileName}"`);

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

    } catch (error) {
      console.error('Erro ao visualizar arquivo de material:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Deletar material
  app.delete('/api/materials/:id', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user as any;

      console.log('Deletando material:', id);

      // Verificar se o material existe e pertence ao professor
      const material = await db
        .select()
        .from(materials)
        .where(and(eq(materials.id, id), eq(materials.teacherId, user.id)))
        .limit(1);

      if (material.length === 0) {
        return res.status(404).json({ message: "Material nao encontrado" });
      }

      // Buscar arquivos do material
      const materialFilesData = await db
        .select()
        .from(materialFiles)
        .where(eq(materialFiles.materialId, id));

      // Deletar arquivos fisicos
      for (const file of materialFilesData) {
        try {
          const filePath = path.resolve(file.filePath);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('Arquivo fisico deletado:', file.originalFileName);
          }
        } catch (error) {
          console.log('Erro ao deletar arquivo fisico:', file.originalFileName);
        }
      }

      // Deletar registros do banco
      await db.delete(materialFiles).where(eq(materialFiles.materialId, id));
      await db.delete(materials).where(eq(materials.id, id));

      console.log('Material deletado com sucesso:', material[0].title);

      res.json({ message: "Material deletado com sucesso" });
    } catch (error) {
      console.error('Erro ao deletar material:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  console.log("Rotas de materiais didaticos registradas!");

  // === ROTAS DE PERFORMANCE PARA COORDENADOR ===
  
  // Buscar dados completos de performance para o coordenador
  app.get('/api/coordinator/performance', isAuthenticated, hasRole(['coordinator', 'admin']), async (req, res) => {
    try {
      console.log('?? Buscando dados de performance para o coordenador...');
      
      // Buscar todos os professores
      const teachersData = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          status: users.status
        })
        .from(users)
        .where(eq(users.role, 'teacher'));

      console.log('????? Professores encontrados:', teachersData.length);

      // Buscar todas as atividades
      const activitiesData = await db
        .select({
          id: activities.id,
          title: activities.title,
          status: activities.status,
          teacherId: activities.teacherId,
          subjectId: activities.subjectId,
          classId: activities.classId,
          createdAt: activities.createdAt,
          dueDate: activities.dueDate
        })
        .from(activities);

      console.log('?? Atividades encontradas:', activitiesData.length);

      // Buscar todas as provas
      const examsData = await db
        .select({
          id: exams.id,
          title: exams.title,
          status: exams.status,
          teacherId: exams.teacherId,
          examDate: exams.examDate,
          totalPoints: exams.totalPoints
        })
        .from(exams);

      console.log('?? Provas encontradas:', examsData.length);

      // Buscar todos os alunos
      const studentsData = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email
        })
        .from(users)
        .where(eq(users.role, 'student'));

      console.log('?? Alunos encontrados:', studentsData.length);

      // Buscar associaï¿½ï¿½es aluno-turma separadamente
      const studentClassData = await db
        .select({
          studentId: studentClass.studentId,
          classId: studentClass.classId
        })
        .from(studentClass);

      console.log('?? Associaï¿½ï¿½es aluno-turma:', studentClassData.length);

      // Buscar dados de frequï¿½ncia
      const attendanceData = await db
        .select({
          id: attendance.id,
          studentId: attendance.studentId,
          status: attendance.status,
          date: attendance.date
        })
        .from(attendance);

      console.log('?? Registros de frequï¿½ncia:', attendanceData.length);

      // Buscar turmas
      const classesData = await db
        .select({
          id: classes.id,
          name: classes.name,
          grade: classes.grade,
          section: classes.section
        })
        .from(classes);

      console.log('?? Turmas encontradas:', classesData.length);

      // Calcular mï¿½tricas de performance por professor
      const teacherPerformance = teachersData.map(teacher => {
        const teacherActivities = activitiesData.filter(act => act.teacherId === teacher.id);
        const teacherExams = examsData.filter(exam => exam.teacherId === teacher.id);
        
        const approvedActivities = teacherActivities.filter(act => 
          act.status === 'active' || act.status === 'approved'
        ).length;
        
        const completedExams = teacherExams.filter(exam => 
          exam.status === 'completed'
        ).length;
        
        // Calcular performance baseada em atividades aprovadas e provas completadas
        const totalTasks = teacherActivities.length + teacherExams.length;
        const completedTasks = approvedActivities + completedExams;
        
        // Se o professor nï¿½o tem nenhuma tarefa, performance deve ser baixa
        let performance;
        if (totalTasks === 0) {
          performance = 0; // Professores inativos tï¿½m performance 0
        } else {
          performance = (completedTasks / totalTasks) * 10;
        }
        
        return {
          id: teacher.id,
          name: `${teacher.firstName} ${teacher.lastName}`,
          email: teacher.email,
          status: teacher.status,
          performance: Math.round(performance * 10) / 10,
          activities: teacherActivities.length,
          approvedActivities,
          exams: teacherExams.length,
          completedExams,
          totalTasks,
          completedTasks
        };
      });

      // Calcular mï¿½tricas gerais
      const totalActivities = activitiesData.length;
      const totalExams = examsData.length;
      const totalStudents = studentsData.length;
      const totalTeachers = teachersData.length;
      
      const approvedActivities = activitiesData.filter(act => 
        act.status === 'active' || act.status === 'approved'
      ).length;
      
      const completedExams = examsData.filter(exam => 
        exam.status === 'completed'
      ).length;
      
      const approvalRate = totalActivities > 0 ? (approvedActivities / totalActivities) * 100 : 0;
      const avgPerformance = teacherPerformance.length > 0 ? 
        teacherPerformance.reduce((acc, teacher) => acc + teacher.performance, 0) / teacherPerformance.length : 0;

      // Calcular dados de frequï¿½ncia
      const attendanceStats = {
        general: {
          totalRecords: attendanceData.length,
          presentRecords: attendanceData.filter(att => att.status === 'present').length,
          overallAttendanceRate: attendanceData.length > 0 ? 
            (attendanceData.filter(att => att.status === 'present').length / attendanceData.length) * 100 : 0
        },
        byClass: classesData.map(cls => {
          const classStudentIds = studentClassData
            .filter(sc => sc.classId === cls.id)
            .map(sc => sc.studentId);
          const classStudents = studentsData.filter(student => classStudentIds.includes(student.id));
          const classAttendance = attendanceData.filter(att => classStudentIds.includes(att.studentId));
          const presentRecords = classAttendance.filter(att => att.status === 'present').length;
          
          return {
            classId: cls.id,
            className: `${cls.grade}ï¿½ ${cls.section}`,
            totalStudents: classStudents.length,
            totalRecords: classAttendance.length,
            attendanceRate: classAttendance.length > 0 ? (presentRecords / classAttendance.length) * 100 : 0
          };
        }),
        lowAttendanceStudents: studentsData.map(student => {
          const studentAttendance = attendanceData.filter(att => att.studentId === student.id);
          const presentCount = studentAttendance.filter(att => att.status === 'present').length;
          const attendanceRate = studentAttendance.length > 0 ? (presentCount / studentAttendance.length) * 100 : 0;
          
          const studentClassRelation = studentClassData.find(sc => sc.studentId === student.id);
          const studentClass = studentClassRelation ? 
            classesData.find(cls => cls.id === studentClassRelation.classId) : null;
          
          return {
            studentId: student.id,
            studentName: `${student.firstName} ${student.lastName}`,
            className: studentClass ? `${studentClass.grade}ï¿½ ${studentClass.section}` : 'Sem turma',
            presentCount,
            totalClasses: studentAttendance.length,
            attendanceRate
          };
        }).filter(student => student.attendanceRate < 70 && student.totalClasses > 0)
      };

      const response = {
        success: true,
        data: {
          summary: {
            totalActivities,
            totalExams,
            totalStudents,
            totalTeachers,
            approvedActivities,
            completedExams,
            approvalRate: Math.round(approvalRate * 10) / 10,
            avgPerformance: Math.round(avgPerformance * 10) / 10
          },
          teacherPerformance,
          attendanceStats,
          recentActivities: activitiesData
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5),
          upcomingExams: examsData
            .filter(exam => new Date(exam.examDate) > new Date())
            .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime())
            .slice(0, 5)
        }
      };

      console.log(`? Dados de performance calculados: ${totalTeachers} professores, ${totalActivities} atividades, ${totalExams} provas`);
      res.json(response);

    } catch (error) {
      console.error('? Erro ao buscar dados de performance:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  });

  // === ROTAS DE ATIVIDADES PARA COORDENADOR ===

  // === ROTAS DE PROVAS ===
  
  // Marcar prova como concluï¿½da (DEVE VIR ANTES DAS OUTRAS ROTAS)
  app.patch('/api/exams/:id/complete', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user as any;

      console.log("?? [API] Marcando prova como concluï¿½da:", id);
      console.log("?? [API] Usuï¿½rio:", user?.firstName, user?.lastName, user?.role);

      // Verificar se a prova existe e pertence ao professor
      const examData = await db
        .select({ 
          id: exams.id,
          title: exams.title,
          teacherId: exams.teacherId,
          status: exams.status
        })
        .from(exams)
        .where(eq(exams.id, id))
        .limit(1);

      if (examData.length === 0) {
        return res.status(404).json({ message: "Prova nï¿½o encontrada" });
      }

      if (user.role !== 'teacher' || examData[0].teacherId !== user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Verificar se a prova jï¿½ estï¿½ concluï¿½da
      if (examData[0].status === 'completed') {
        return res.status(400).json({ message: "Prova jï¿½ estï¿½ marcada como concluï¿½da" });
      }

      // Atualizar status da prova para 'completed'
      await db
        .update(exams)
        .set({ 
          status: 'completed',
          updatedAt: new Date().toISOString()
        })
        .where(eq(exams.id, id));

      console.log("? Prova marcada como concluï¿½da:", examData[0].title);
      
      // Log prova concluï¿½da
      logger.examCompleted(user, examData[0].title, req);
      
      res.json({ 
        success: true,
        message: "Prova marcada como concluï¿½da com sucesso",
        exam: {
          id: examData[0].id,
          title: examData[0].title,
          status: 'completed'
        }
      });
    } catch (error) {
      console.error('? Erro ao marcar prova como concluï¿½da:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Listar provas do professor
  app.get('/api/exams/teacher/:teacherId', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { teacherId } = req.params;
      const { startDate, endDate } = req.query as any;
      const user = req.user as any;

      if (user.role !== 'teacher' || user.id !== teacherId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      console.log("Buscando provas do professor: " + teacherId);

      const examsData = await db
        .select({
          id: exams.id,
          title: exams.title,
          description: exams.description,
          examDate: exams.examDate,
          duration: exams.duration,
          totalPoints: exams.totalPoints,
          semester: exams.semester,
          bimonthly: exams.bimonthly,
          status: exams.status,
          createdAt: exams.createdAt,
          subjectName: subjects.name,
          className: classes.name
        })
        .from(exams)
        .leftJoin(subjects, eq(exams.subjectId, subjects.id))
        .leftJoin(classes, eq(exams.classId, classes.id))
        .where(and(
          eq(exams.teacherId, teacherId),
          startDate ? gte(exams.examDate, new Date(startDate)) : undefined,
          endDate ? lte(exams.examDate, new Date(endDate)) : undefined
        ))
        .orderBy(desc(exams.examDate));

      console.log("Encontradas " + examsData.length + " provas do professor");
      res.json(examsData);
    } catch (error) {
      console.error('Erro ao buscar provas do professor:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Criar nova prova
  app.post('/api/exams', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const user = req.user as any;
      const { title, description, subjectId, classId, examDate, duration, totalPoints, semester, bimonthly } = req.body;

      if (user.role !== 'teacher') {
        return res.status(403).json({ message: "Acesso negado" });
      }

      console.log("Criando nova prova: " + title);
      console.log("Dados recebidos:", { title, description, subjectId, classId, examDate, duration, totalPoints, semester, bimonthly });

      const tp = Number(String(totalPoints).replace(',', '.'));
      if (!Number.isFinite(tp) || tp < 0.5 || tp > 10 || Math.round(tp * 2) !== tp * 2) {
        return res.status(400).json({ message: "Pontuação total inválida. Use valores entre 0.5 e 10 em passos de 0.5." });
      }

      const examId = crypto.randomUUID();
      const now = new Date().toISOString();

      const activePeriod = await db
        .select()
        .from(academicPeriods)
        .where(eq(academicPeriods.status, 'active'))
        .limit(1);
      const effectiveBimonthly = String(activePeriod[0]?.period ?? bimonthly ?? '1');

      if (!['1', '2', '3', '4'].includes(effectiveBimonthly)) {
        return res.status(400).json({
          message: 'Bimestre inválido. A prova deve pertencer ao 1º, 2º, 3º ou 4º bimestre.'
        });
      }

      if (activePeriod.length > 0) {
        const start = new Date(activePeriod[0].startDate);
        const end = new Date(activePeriod[0].endDate);
        const examDt = new Date(String(examDate));
        if (!(examDt >= start && examDt <= end)) {
          return res.status(400).json({ message: 'Data da prova fora do período ativo. Selecione uma data dentro do período.' });
        }
      }

      const newExam = {
        id: examId,
        title,
        description,
        subjectId,
        classId,
        teacherId: user.id,
        examDate,
        duration: duration || null,
        totalPoints: tp,
        semester,
        bimonthly: effectiveBimonthly,
        status: 'scheduled',
        createdAt: now,
        updatedAt: now
      };

      await db.insert(exams).values(newExam);

      // Criar registros de notas para todos os alunos da turma
      const students = await db
        .select({ id: users.id })
        .from(users)
        .innerJoin(studentClass, eq(users.id, studentClass.studentId))
        .where(and(
          eq(studentClass.classId, classId),
          eq(studentClass.status, 'active')
        ));

      const examGradesData = students.map(student => ({
        id: crypto.randomUUID(),
        examId,
        studentId: student.id,
        grade: null,
        isPresent: true,
        observations: null,
        gradedBy: null,
        gradedAt: null,
        createdAt: now,
        updatedAt: now
      }));

      if (examGradesData.length > 0) {
        await db.insert(examGrades).values(examGradesData);
        
        // Log lanï¿½amento de notas
        for (const grade of examGradesData) {
          logger.gradeAdded(user, `Aluno ${grade.studentId}`, grade.grade || 0, req);
        }
      }

      console.log("Prova criada com sucesso: " + title);
      
      // Log criaï¿½ï¿½o de prova
      logger.examCreated(user, title, req);
      
      res.status(201).json({ message: "Prova criada com sucesso", data: newExam });
    } catch (error) {
      console.error('Erro ao criar prova:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar detalhes de uma prova
  app.get('/api/exams/:id', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user as any;

      console.log("Buscando detalhes da prova: " + id);

      const examData = await db
        .select({
          id: exams.id,
          title: exams.title,
          description: exams.description,
          examDate: exams.examDate,
          duration: exams.duration,
          totalPoints: exams.totalPoints,
          semester: exams.semester,
          bimonthly: exams.bimonthly,
          status: exams.status,
          createdAt: exams.createdAt,
          subjectName: subjects.name,
          className: classes.name,
          teacherId: exams.teacherId
        })
        .from(exams)
        .leftJoin(subjects, eq(exams.subjectId, subjects.id))
        .leftJoin(classes, eq(exams.classId, classes.id))
        .where(eq(exams.id, id))
        .limit(1);

      if (examData.length === 0) {
        return res.status(404).json({ message: "Prova nï¿½o encontrada" });
      }

      const exam = examData[0];

      // Verificar se o professor pode acessar esta prova
      if (user.role !== 'teacher' || exam.teacherId !== user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Buscar notas dos alunos
      const gradesData = await db
        .select({
          id: examGrades.id,
          studentId: examGrades.studentId,
          studentName: sql`${users.firstName} || ' ' || ${users.lastName}`.as('studentName'),
          grade: examGrades.grade,
          isPresent: examGrades.isPresent,
          observations: examGrades.observations,
          gradedAt: examGrades.gradedAt
        })
        .from(examGrades)
        .leftJoin(users, eq(examGrades.studentId, users.id))
        .where(eq(examGrades.examId, id))
        .orderBy(users.firstName);

      // Se nï¿½o hï¿½ notas ainda, buscar todos os alunos da turma e criar entradas
      if (gradesData.length === 0) {
        console.log("Nenhuma nota encontrada, buscando alunos da turma...");
        console.log("Exam ID:", id);
        console.log("Exam Class ID:", exam.classId);
        
        // Buscar todos os alunos da turma
        const students = await db
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName
          })
          .from(users)
          .innerJoin(studentClass, eq(users.id, studentClass.studentId))
          .where(and(
            eq(studentClass.classId, exam.classId),
            eq(studentClass.status, 'active')
          ))
          .orderBy(users.firstName);

        console.log(`Encontrados ${students.length} alunos na turma ${exam.classId}`);
        console.log("Alunos encontrados:", JSON.stringify(students, null, 2));

        // Se nï¿½o encontrou alunos, vamos verificar se a turma existe
        if (students.length === 0) {
          console.log("Verificando se a turma existe...");
          const classCheck = await db
            .select()
            .from(classes)
            .where(eq(classes.id, exam.classId))
            .limit(1);
          
          console.log("Turma encontrada:", JSON.stringify(classCheck, null, 2));
          
          // Verificar todas as vinculaï¿½ï¿½es aluno-turma
          const allStudentClassLinks = await db
            .select({
              studentId: studentClass.studentId,
              classId: studentClass.classId,
              status: studentClass.status,
              studentName: sql`${users.firstName} || ' ' || ${users.lastName}`.as('studentName'),
              className: classes.name
            })
            .from(studentClass)
            .leftJoin(users, eq(studentClass.studentId, users.id))
            .leftJoin(classes, eq(studentClass.classId, classes.id));
          
          console.log("Todas as vinculaï¿½ï¿½es aluno-turma:", JSON.stringify(allStudentClassLinks, null, 2));
        }

        // Criar entradas de notas para todos os alunos
        const now = new Date().toISOString();
        const examGradesData = students.map(student => ({
          id: crypto.randomUUID(),
          examId: id,
          studentId: student.id,
          grade: null,
          isPresent: true,
          observations: null,
          gradedBy: null,
          gradedAt: null,
          createdAt: now,
          updatedAt: now
        }));

        if (examGradesData.length > 0) {
          await db.insert(examGrades).values(examGradesData);
          console.log(`Criadas ${examGradesData.length} entradas de notas`);
        }

        // Buscar novamente as notas apï¿½s criar as entradas
        const newGradesData = await db
        .select({
          id: examGrades.id,
          studentId: examGrades.studentId,
          studentName: sql`${users.firstName} || ' ' || ${users.lastName}`.as('studentName'),
          grade: examGrades.grade,
          isPresent: examGrades.isPresent,
          observations: examGrades.observations,
          gradedAt: examGrades.gradedAt
        })
        .from(examGrades)
        .leftJoin(users, eq(examGrades.studentId, users.id))
        .where(eq(examGrades.examId, id))
        .orderBy(users.firstName);

        res.json({
          ...exam,
          grades: newGradesData
        });
      } else {
      res.json({
        ...exam,
        grades: gradesData
      });
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes da prova:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Atualizar notas de uma prova
  app.put('/api/exams/:id/grades', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { id } = req.params;
      const { grades } = req.body;
      const user = req.user as any;

      console.log("Atualizando notas da prova: " + id);

      // Verificar se a prova existe e pertence ao professor
      const examData = await db
        .select({ teacherId: exams.teacherId, totalPoints: exams.totalPoints })
        .from(exams)
        .where(eq(exams.id, id))
        .limit(1);

      if (examData.length === 0) {
        return res.status(404).json({ message: "Prova nï¿½o encontrada" });
      }

      if (user.role !== 'teacher' || examData[0].teacherId !== user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const now = new Date().toISOString();

      const maxPoints = examData[0].totalPoints;

      // Atualizar cada nota com validação
      for (const gradeData of grades) {
        if (gradeData.grade !== null && gradeData.grade !== undefined) {
          const g = Number(String(gradeData.grade).replace(',', '.'));
          if (!Number.isFinite(g) || g < 0 || g > maxPoints || Math.round(g * 2) !== g * 2) {
            return res.status(400).json({ message: `Nota inválida. Use valores entre 0 e ${maxPoints} em passos de 0.5.` });
          }
        }
        await db
          .update(examGrades)
          .set({
            grade: gradeData.grade,
            isPresent: gradeData.isPresent,
            observations: gradeData.observations || null,
            gradedBy: user.id,
            gradedAt: now,
            updatedAt: now
          })
          .where(eq(examGrades.id, gradeData.id));
      }

      console.log("Notas atualizadas com sucesso para a prova: " + id);
      res.json({ message: "Notas atualizadas com sucesso" });
    } catch (error) {
      console.error('Erro ao atualizar notas:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Deletar prova
  app.delete('/api/exams/:id', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user as any;

      console.log("Deletando prova: " + id);

      // Verificar se a prova existe e pertence ao professor
      const examData = await db
        .select({ teacherId: exams.teacherId, title: exams.title })
        .from(exams)
        .where(eq(exams.id, id))
        .limit(1);

      if (examData.length === 0) {
        return res.status(404).json({ message: "Prova nï¿½o encontrada" });
      }

      if (user.role !== 'teacher' || examData[0].teacherId !== user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Deletar notas da prova
      await db.delete(examGrades).where(eq(examGrades.examId, id));
      
      // Deletar a prova
      await db.delete(exams).where(eq(exams.id, id));

      console.log("Prova deletada com sucesso: " + examData[0].title);
      res.json({ message: "Prova deletada com sucesso" });
    } catch (error) {
      console.error('Erro ao deletar prova:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });


  // Buscar alunos de uma turma para coordenador
  app.get('/api/coordinator/classes/:classId/students', isAuthenticated, hasRole(['coordinator', 'admin']), async (req, res) => {
    try {
      const { classId } = req.params;
      const user = req.user as any;

      console.log("Buscando alunos da turma para coordenador: " + classId);

      // Buscar alunos da turma
      const cols = await client.execute({ sql: `PRAGMA table_info(users)`, args: [] });
      const hasBirthDate = Array.isArray(cols.rows) && cols.rows.some((r: any) => String((r as any).name || '').toLowerCase() === 'birthdate');
      const selectSql = `
        SELECT 
          u.id,
          u.firstName,
          u.lastName,
          u.email,
          u.phone,
          ${hasBirthDate ? 'u.birthDate,' : ''}
          u.status,
          sc.enrollmentDate,
          sc.status as enrollmentStatus
        FROM studentClass sc
        INNER JOIN users u ON sc.studentId = u.id
        WHERE sc.classId = ? AND sc.status = 'active'
        ORDER BY u.firstName, u.lastName
      `;
      const studentsResult = await client.execute(selectSql, [classId]);

      const students = studentsResult.rows;
      console.log(`Encontrados ${students.length} alunos na turma ${classId}`);

      res.json({
        success: true,
        data: students
      });
    } catch (error) {
      console.error('Erro ao buscar alunos da turma:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  });

  // Buscar alunos de uma turma
  app.get('/api/classes/:classId/students', isAuthenticated, hasRole(['teacher', 'admin']), async (req, res) => {
    try {
      const { classId } = req.params;
      const user = req.user as any;

      console.log("Buscando alunos da turma: " + classId);

      const students = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
          enrollmentDate: studentClass.enrollmentDate,
          status: studentClass.status
        })
        .from(users)
        .innerJoin(studentClass, eq(users.id, studentClass.studentId))
        .where(and(
          eq(studentClass.classId, classId),
          eq(studentClass.status, 'active')
        ))
        .orderBy(users.firstName);

      console.log("Encontrados " + students.length + " alunos na turma");
      console.log("Dados dos alunos:", JSON.stringify(students, null, 2));
      res.json(students);
    } catch (error) {
      console.error('Erro ao buscar alunos da turma:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar provas do aluno
  app.get('/api/student/exams', isAuthenticated, hasRole(['student']), async (req, res) => {
    try {
      const user = req.user as any;
      const { startDate, endDate } = req.query as any;

      console.log("Buscando provas do aluno: " + user.id);

      // Buscar turma do aluno
      const studentClassData = await db
        .select({ classId: studentClass.classId })
        .from(studentClass)
        .where(and(
          eq(studentClass.studentId, user.id),
          eq(studentClass.status, 'active')
        ))
        .limit(1);

      console.log("Dados da turma do aluno:", studentClassData);

      if (studentClassData.length === 0) {
        console.log("Aluno nï¿½o tem turma ativa");
        return res.json([]);
      }

      const classId = studentClassData[0].classId;
      console.log("ID da turma do aluno:", classId);

      // Buscar provas da turma do aluno
      const examsData = await db
        .select({
          id: exams.id,
          title: exams.title,
          description: exams.description,
          examDate: exams.examDate,
          subjectId: exams.subjectId,
          subjectName: subjects.name,
          bimonthly: exams.bimonthly,
          semester: exams.semester,
          totalPoints: exams.totalPoints,
          createdAt: exams.createdAt
        })
        .from(exams)
        .innerJoin(subjects, eq(exams.subjectId, subjects.id))
        .where(and(
          eq(exams.classId, classId),
          startDate ? gte(exams.examDate, new Date(startDate)) : undefined,
          endDate ? lte(exams.examDate, new Date(endDate)) : undefined
        ))
        .orderBy(desc(exams.examDate));

      // Buscar notas do aluno para cada prova usando SQL direto
      const examsWithGrades = await Promise.all(
        examsData.map(async (exam) => {
          const gradeResult = await client.execute(`
            SELECT grade, isPresent, updatedAt as gradedAt
            FROM examGrades 
            WHERE examId = ? AND studentId = ? AND grade IS NOT NULL
            ORDER BY updatedAt DESC
            LIMIT 1
          `, [exam.id, user.id]);

          const grade = gradeResult.rows.length > 0 ? {
            grade: gradeResult.rows[0].grade,
            isPresent: gradeResult.rows[0].isPresent,
            gradedAt: gradeResult.rows[0].gradedAt
          } : null;

          return {
            ...exam,
            grade: grade
          };
        })
      );

      console.log("Encontradas " + examsWithGrades.length + " provas do aluno");
      console.log("Provas encontradas:", JSON.stringify(examsWithGrades, null, 2));
      res.json(examsWithGrades);
    } catch (error) {
      console.error('Erro ao buscar provas do aluno:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar eventos do calendï¿½rio (provas e atividades)
  app.get('/api/calendar/events', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { startDate, endDate } = req.query;

      console.log("Buscando eventos do calendï¿½rio para:", user.id, 'Role:', user.role);
      console.log("Parï¿½metros de data:", { startDate, endDate });

      const events = [];
      const globalEvents: any[] = [];

      if (user.role === 'student') {
        // Para alunos: buscar provas da turma
        const studentClassData = await db
          .select({ classId: studentClass.classId })
          .from(studentClass)
          .where(and(
            eq(studentClass.studentId, user.id),
            eq(studentClass.status, 'active')
          ))
          .limit(1);

        if (studentClassData.length > 0) {
          const classId = studentClassData[0].classId;
          console.log(`Turma do aluno: ${classId}`);
          
          // Buscar provas da turma (sem filtros de data por enquanto)
          const examsData = await db
            .select({
              id: exams.id,
              title: exams.title,
              description: exams.description,
              examDate: exams.examDate,
              subjectName: subjects.name,
              bimonthly: exams.bimonthly,
              totalPoints: exams.totalPoints,
              type: sql<string>`'exam'`.as('type')
            })
            .from(exams)
            .innerJoin(subjects, eq(exams.subjectId, subjects.id))
            .where(eq(exams.classId, classId));

          events.push(...examsData.map(exam => ({
            ...exam,
            date: exam.examDate,
            color: '#ef4444',
            icon: '??',
            startTime: '08:00',
            endTime: '10:00',
            className: '9ï¿½ A',
            totalPoints: exam.totalPoints,
            duration: exam.duration || 90,
            bimonthly: exam.bimonthly
          })));

          console.log(`Encontradas ${examsData.length} provas para o aluno`);
          console.log('Provas encontradas:', examsData.map(exam => ({ title: exam.title, date: exam.examDate })));

          // Buscar atividades da turma (sem filtros de data por enquanto)
        const activitiesData = await db
          .select({
            id: activities.id,
            title: activities.title,
            description: activities.description,
            dueDate: activities.dueDate,
            subjectName: subjects.name,
            type: sql<string>`'activity'`.as('type')
          })
          .from(activities)
          .innerJoin(subjects, eq(activities.subjectId, subjects.id))
            .where(eq(activities.classId, classId));

        events.push(...activitiesData.map(activity => ({
          ...activity,
          date: activity.dueDate,
          color: '#3b82f6',
          icon: '??',
          startTime: '14:00',
          endTime: '16:00',
          className: '9ï¿½ A',
          duration: 120
        })));

          console.log(`Encontradas ${activitiesData.length} atividades para o aluno`);
          console.log('Atividades encontradas:', activitiesData.map(activity => ({ title: activity.title, date: activity.dueDate })));
        }

      } else if (user.role === 'teacher') {
        // Para professores: buscar provas e atividades criadas por eles
        const teacherExamsData = await db
          .select({
            id: exams.id,
            title: exams.title,
            description: exams.description,
            examDate: exams.examDate,
            subjectName: subjects.name,
            bimonthly: exams.bimonthly,
            totalPoints: exams.totalPoints,
            type: sql<string>`'exam'`.as('type')
          })
          .from(exams)
          .innerJoin(subjects, eq(exams.subjectId, subjects.id))
          .where(and(
            eq(exams.teacherId, user.id),
            startDate ? gte(exams.examDate, new Date(startDate as string)) : undefined,
            endDate ? lte(exams.examDate, new Date(endDate as string)) : undefined
          ));

        events.push(...teacherExamsData.map(exam => ({
          ...exam,
          date: exam.examDate,
          color: '#ef4444',
          icon: '??'
        })));

        const teacherActivitiesData = await db
          .select({
            id: activities.id,
            title: activities.title,
            description: activities.description,
            dueDate: activities.dueDate,
            subjectName: subjects.name,
            type: sql<string>`'activity'`.as('type')
          })
          .from(activities)
          .innerJoin(subjects, eq(activities.subjectId, subjects.id))
          .where(and(
            eq(activities.teacherId, user.id),
            startDate ? gte(activities.dueDate, new Date(startDate as string)) : undefined,
            endDate ? lte(activities.dueDate, new Date(endDate as string)) : undefined
          ));

        events.push(...teacherActivitiesData.map(activity => ({
          ...activity,
          date: activity.dueDate,
          color: '#3b82f6',
          icon: '??'
        })));
      }

      // Não adicionar eventos do módulo de calendário aqui para evitar duplicidade

      console.log("Encontrados " + events.length + " eventos do calendï¿½rio (" + (events.length - globalEvents.length) + " especï¿½ficos + " + globalEvents.length + " globais)");
      res.json(events);
    } catch (error) {
      console.error('Erro ao buscar eventos do calendï¿½rio:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  
  console.log("Rotas de provas registradas!");

  // GET /api/admin/classes/:id/details - Buscar detalhes completos de uma turma
  app.get('/api/admin/classes/:id/details', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      console.log("Detalhes da turma " + id + " solicitados por: " + user.firstName + " " + user.lastName);

      // Buscar informaï¿½ï¿½es bï¿½sicas da turma
      const classInfo = await db
        .select()
        .from(classes)
        .where(eq(classes.id, id))
        .limit(1);

      if (!classInfo || classInfo.length === 0) {
        return res.status(404).json({ message: "Turma nï¿½o encontrada" });
      }

      // Buscar alunos da turma
      const students = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          status: users.status,
          registrationNumber: users.registrationNumber
        })
        .from(users)
        .innerJoin(studentClass, eq(users.id, studentClass.studentId))
        .where(eq(studentClass.classId, id));

      // Buscar professores da turma
      const teachers = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          subjectName: subjects.name
        })
        .from(users)
        .innerJoin(teacherClasses, eq(users.id, teacherClasses.teacherId))
        .innerJoin(subjects, eq(teacherClasses.subjectId, subjects.id))
        .where(eq(teacherClasses.classId, id));

      // Buscar atividades da turma
      const activities = await db
        .select({
          id: activities.id,
          title: activities.title,
          description: activities.description,
          dueDate: activities.dueDate,
          status: activities.status,
          subjectName: subjects.name,
          teacherName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`.as('teacherName')
        })
        .from(activities)
        .innerJoin(subjects, eq(activities.subjectId, subjects.id))
        .innerJoin(users, eq(activities.teacherId, users.id))
        .where(eq(activities.classId, id))
        .orderBy(desc(activities.createdAt))
        .limit(10);

      // Montar resposta
      const classDetails = {
        class: classInfo[0],
        students: students,
        teachers: teachers,
        activities: activities
      };

      console.log("Detalhes da turma " + id + " retornados com sucesso");
      res.json(classDetails);
    } catch (error) {
      console.error('Erro ao buscar detalhes da turma:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  console.log("Rotas de provas registradas!");

  // GET /api/admin/classes/:id/details - Buscar detalhes completos de uma turma
  app.get('/api/admin/classes/:id/details', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      console.log("Detalhes da turma " + id + " solicitados por: " + user.firstName + " " + user.lastName);

      // Buscar informaï¿½ï¿½es bï¿½sicas da turma
      const classInfo = await db
        .select()
        .from(classes)
        .where(eq(classes.id, id))
        .limit(1);

      if (!classInfo || classInfo.length === 0) {
        return res.status(404).json({ message: "Turma nï¿½o encontrada" });
      }

      // Buscar alunos da turma
      const students = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          status: users.status,
          registrationNumber: users.registrationNumber
        })
        .from(users)
        .innerJoin(studentClass, eq(users.id, studentClass.studentId))
        .where(eq(studentClass.classId, id));

      // Buscar professores da turma
      const teachers = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          subjectName: subjects.name
        })
        .from(users)
        .innerJoin(teacherClasses, eq(users.id, teacherClasses.teacherId))
        .innerJoin(subjects, eq(teacherClasses.subjectId, subjects.id))
        .where(eq(teacherClasses.classId, id));

      // Buscar atividades da turma
      const activities = await db
        .select({
          id: activities.id,
          title: activities.title,
          description: activities.description,
          dueDate: activities.dueDate,
          status: activities.status,
          subjectName: subjects.name,
          teacherName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`.as('teacherName')
        })
        .from(activities)
        .innerJoin(subjects, eq(activities.subjectId, subjects.id))
        .innerJoin(users, eq(activities.teacherId, users.id))
        .where(eq(activities.classId, id))
        .orderBy(desc(activities.createdAt))
        .limit(10);

      // Montar resposta
      const classDetails = {
        class: classInfo[0],
        students: students,
        teachers: teachers,
        activities: activities
      };

      console.log("Detalhes da turma " + id + " retornados com sucesso");
      res.json(classDetails);
    } catch (error) {
      console.error('Erro ao buscar detalhes da turma:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  console.log("Rotas de provas registradas!");

  // GET /api/admin/classes/:id/details - Buscar detalhes completos de uma turma
  app.get('/api/admin/classes/:id/details', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      console.log("Detalhes da turma " + id + " solicitados por: " + user.firstName + " " + user.lastName);

      // Buscar informaï¿½ï¿½es bï¿½sicas da turma
      const classInfo = await db
        .select()
        .from(classes)
        .where(eq(classes.id, id))
        .limit(1);

      if (!classInfo || classInfo.length === 0) {
        return res.status(404).json({ message: "Turma nï¿½o encontrada" });
      }

      // Buscar alunos da turma
      const students = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          status: users.status,
          registrationNumber: users.registrationNumber
        })
        .from(users)
        .innerJoin(studentClass, eq(users.id, studentClass.studentId))
        .where(eq(studentClass.classId, id));

      // Buscar professores da turma
      const teachers = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          subjectName: subjects.name
        })
        .from(users)
        .innerJoin(teacherClasses, eq(users.id, teacherClasses.teacherId))
        .innerJoin(subjects, eq(teacherClasses.subjectId, subjects.id))
        .where(eq(teacherClasses.classId, id));

      // Buscar atividades da turma
      const activities = await db
        .select({
          id: activities.id,
          title: activities.title,
          description: activities.description,
          dueDate: activities.dueDate,
          status: activities.status,
          subjectName: subjects.name,
          teacherName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`.as('teacherName')
        })
        .from(activities)
        .innerJoin(subjects, eq(activities.subjectId, subjects.id))
        .innerJoin(users, eq(activities.teacherId, users.id))
        .where(eq(activities.classId, id))
        .orderBy(desc(activities.createdAt))
        .limit(10);

      // Montar resposta
      const classDetails = {
        class: classInfo[0],
        students: students,
        teachers: teachers,
        activities: activities
      };

      console.log("Detalhes da turma " + id + " retornados com sucesso");
      res.json(classDetails);
    } catch (error) {
      console.error('Erro ao buscar detalhes da turma:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== ROTA DE IA PARA PROFESSORES =====
  
  // Chat com IA para assistï¿½ncia educacional usando Ollama
  app.post('/api/ai/chat', isAuthenticated, hasRole(['teacher', 'admin']), async (req, res) => {
    try {
      const { message, context } = req.body;
      const user = req.user as any;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Mensagem ï¿½ obrigatï¿½ria" });
      }

      console.log(`?? Chat com IA solicitado por: ${user.firstName} ${user.lastName}`);
      console.log(`?? Mensagem: ${message.substring(0, 100)}...`);

      // Detectar saudaï¿½ï¿½es simples para respostas curtas
      const simpleGreetings = ['olï¿½', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'hello', 'hi', 'hey'];
      const isSimpleGreeting = simpleGreetings.some(greeting => 
        message.toLowerCase().trim().includes(greeting.toLowerCase())
      );

      let educationalPrompt;
      
      if (isSimpleGreeting) {
        educationalPrompt = `Vocï¿½ ï¿½ um assistente de IA educacional amigï¿½vel e inteligente. Responda de forma breve, natural e ï¿½til em portuguï¿½s brasileiro.

Mensagem: ${message}

Responda de forma conversacional e ofereï¿½a ajuda especï¿½fica:`;
      } else {
        educationalPrompt = `Vocï¿½ ï¿½ um assistente de IA educacional especializado em ajudar professores brasileiros. Seja inteligente, natural e responda a QUALQUER pergunta relacionada ao ensino.

IMPORTANTE: 
- Responda de forma natural e conversacional, como um GPT real
- Use portuguï¿½s brasileiro
- Seja prï¿½tico e aplicï¿½vel
- Use formataï¿½ï¿½o markdown quando apropriado
- Seja especï¿½fico e ï¿½til
- Responda a TUDO que for perguntado, nï¿½o importa o assunto

Contexto do usuï¿½rio: Professor(a) ${user.firstName}
Pergunta: ${message}

Responda de forma inteligente e natural:`;
      }

      try {
        // Tentar diferentes modelos do Ollama
        const models = ['llama3.2:3b', 'gemma3:4b', 'openhermes:latest'];
        let aiResponse = '';
        let usedModel = '';

        for (const model of models) {
          try {
            console.log(`?? Tentando modelo: ${model}`);
            
        const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
                model: model,
            prompt: educationalPrompt,
            stream: false,
            options: {
              temperature: 0.7,
              top_p: 0.9,
                  max_tokens: 1500,
                  num_predict: 1500
            }
          }),
        });

            if (ollamaResponse.ok) {
              const ollamaData = await ollamaResponse.json();
              aiResponse = ollamaData.response || 'Desculpe, nï¿½o consegui gerar uma resposta adequada.';
              usedModel = model;
              console.log(`? Resposta da IA gerada com sucesso usando ${model} (${aiResponse.length} caracteres)`);
              break;
            }
          } catch (modelError) {
            console.log(`? Modelo ${model} falhou:`, modelError.message);
            continue;
          }
        }

        if (aiResponse) {
        res.json({ 
          response: aiResponse,
            model: usedModel,
          timestamp: new Date().toISOString()
        });
          return;
        }

        throw new Error('Todos os modelos do Ollama falharam');

      } catch (ollamaError) {
        console.error('? Erro na integraï¿½ï¿½o com Ollama:', ollamaError);
        
        // Fallback para resposta simulada se Ollama nï¿½o estiver disponï¿½vel
        let fallbackResponse = "";

        // Detectar perguntas especï¿½ficas sobre fraï¿½ï¿½es
        if (message.toLowerCase().includes('fraï¿½ï¿½o') || message.toLowerCase().includes('fraï¿½ï¿½es')) {
          fallbackResponse = `# ?? Como Apresentar Fraï¿½ï¿½es de Forma Didï¿½tica

## ?? **Estratï¿½gias Visuais**

### 1. **Uso de Materiais Concretos**
- **Pizza dividida**: Corte uma pizza em pedaï¿½os iguais
- **Barras de chocolate**: Divida em partes iguais
- **Folhas de papel**: Dobre e corte em fraï¿½ï¿½es
- **Blocos de construï¿½ï¿½o**: Use peï¿½as para representar partes

### 2. **Representaï¿½ï¿½o Grï¿½fica**
- **Cï¿½rculos divididos**: Desenhe cï¿½rculos e pinte partes
- **Retï¿½ngulos**: Divida em seï¿½ï¿½es iguais
- **Linha numï¿½rica**: Mostre fraï¿½ï¿½es como pontos na reta

## ?? **Sequï¿½ncia Didï¿½tica Recomendada**

### **Aula 1: Conceito de Fraï¿½ï¿½o**
1. **Motivaï¿½ï¿½o**: "Quantos pedaï¿½os de pizza cada pessoa come?"
2. **Apresentaï¿½ï¿½o**: Mostre objetos divididos em partes iguais
3. **Prï¿½tica**: Alunos dividem folhas de papel

### **Aula 2: Numerador e Denominador**
1. **Explicaï¿½ï¿½o**: "Denominador = quantas partes iguais" / "Numerador = quantas partes pegamos"
2. **Exemplos visuais**: 3/4 = trï¿½s partes de quatro
3. **Atividade**: Alunos criam suas prï¿½prias fraï¿½ï¿½es

### **Aula 3: Fraï¿½ï¿½es Equivalentes**
1. **Descoberta**: Mostre que 1/2 = 2/4 = 4/8
2. **Manipulaï¿½ï¿½o**: Use materiais para comprovar
3. **Regra**: Multiplicar numerador e denominador pelo mesmo nï¿½mero

## ?? **Atividades Prï¿½ticas**

### **Jogo da Memï¿½ria**
- Cartas com fraï¿½ï¿½es visuais e numï¿½ricas
- Alunos fazem pares correspondentes

### **Bingo das Fraï¿½ï¿½es**
- Cartelas com fraï¿½ï¿½es diferentes
- Professor sorteia nï¿½meros decimais ou percentuais

### **Construï¿½ï¿½o de Fraï¿½ï¿½es**
- Alunos criam fraï¿½ï¿½es usando materiais diversos
- Apresentam para a turma explicando

## ?? **Dicas Importantes**

- **Comece sempre com o concreto** antes do abstrato
- **Use linguagem simples**: "partes iguais" em vez de "divisï¿½o"
- **Conecte com situaï¿½ï¿½es reais**: receitas, medidas, tempo
- **Permita erros**: sï¿½o oportunidades de aprendizado
- **Celebre descobertas**: "Vocï¿½ descobriu uma fraï¿½ï¿½o equivalente!"

## ?? **Avaliaï¿½ï¿½o Sugerida**

- **Observaï¿½ï¿½o**: Como os alunos manipulam os materiais
- **Atividades prï¿½ticas**: Criaï¿½ï¿½o de fraï¿½ï¿½es com materiais
- **Autoavaliaï¿½ï¿½o**: "O que aprendi sobre fraï¿½ï¿½es hoje?"

**Precisa de mais detalhes sobre alguma dessas estratï¿½gias?**`;

        } else if (message.toLowerCase().includes('atividade') || message.toLowerCase().includes('exercï¿½cio')) {
          fallbackResponse = `# ?? Sugestï¿½es de Atividades Educacionais

## Atividades Interativas:
- **Quiz gamificado** com Kahoot ou similar
- **Debates estruturados** em grupos pequenos  
- **Projetos colaborativos** com apresentaï¿½ï¿½es
- **Estudos de caso** prï¿½ticos

## ?? Metodologias Ativas:
- **Sala de aula invertida**
- **Aprendizagem baseada em problemas**
- **Rotaï¿½ï¿½o por estaï¿½ï¿½es**
- **Peer instruction** (ensino entre pares)

## ?? Dicas Prï¿½ticas:
- Varie os tipos de atividade para atender diferentes estilos de aprendizagem
- Use tecnologia como aliada, nï¿½o como substituta
- Inclua momentos de reflexï¿½o e autoavaliaï¿½ï¿½o
- Conecte o conteï¿½do com situaï¿½ï¿½es do cotidiano

**Precisa de algo mais especï¿½fico para sua disciplina ou faixa etï¿½ria?**`;

        } else if (message.toLowerCase().includes('plano de aula') || message.toLowerCase().includes('planejamento')) {
          fallbackResponse = `# ?? Estrutura de Plano de Aula Eficaz

## 1. **Objetivos de Aprendizagem** (5 min)
- O que os alunos devem saber/fazer ao final?
- Use verbos mensurï¿½veis (identificar, explicar, aplicar)

## 2. **Motivaï¿½ï¿½o/Gancho** (10 min)
- Pergunta provocativa
- Vï¿½deo curto relacionado
- Situaï¿½ï¿½o-problema

## 3. **Desenvolvimento** (25 min)
- Apresentaï¿½ï¿½o do conteï¿½do
- Exemplos prï¿½ticos
- Interaï¿½ï¿½o com os alunos

## 4. **Atividade Prï¿½tica** (15 min)
- Exercï¿½cios individuais ou em grupo
- Aplicaï¿½ï¿½o do conhecimento

## 5. **Fechamento** (5 min)
- Sï¿½ntese dos pontos principais
- Prï¿½ximos passos

> **?? Dica:** Sempre tenha um "Plano B" para atividades que podem nï¿½o funcionar como esperado!

**Qual disciplina vocï¿½ estï¿½ planejando?**`;

        } else if (message.toLowerCase().includes('matemï¿½tica') || message.toLowerCase().includes('matematica')) {
          fallbackResponse = `# ?? Estratï¿½gias para Ensino de Matemï¿½tica

## ?? **Metodologias Eficazes**

### **Aprendizagem Ativa**
- **Resoluï¿½ï¿½o de problemas** do cotidiano
- **Jogos matemï¿½ticos** educativos
- **Manipulaï¿½ï¿½o de materiais** concretos
- **Trabalho em equipe** colaborativo

### **Tecnologia como Aliada**
- **Calculadoras** para verificaï¿½ï¿½o
- **Apps educativos** (Khan Academy, GeoGebra)
- **Simulaï¿½ï¿½es** virtuais
- **Vï¿½deos explicativos** curtos

## ?? **Sequï¿½ncia Didï¿½tica**

### **1. Apresentaï¿½ï¿½o do Problema**
- Contextualize com situaï¿½ï¿½es reais
- Use linguagem simples e clara
- Mostre exemplos prï¿½ticos

### **2. Exploraï¿½ï¿½o**
- Permita tentativas e erros
- Facilite descobertas pelos alunos
- Oriente sem dar respostas prontas

### **3. Sistematizaï¿½ï¿½o**
- Organize o conhecimento descoberto
- Estabeleï¿½a regras e padrï¿½es
- Conecte com conhecimentos anteriores

### **4. Aplicaï¿½ï¿½o**
- Exercï¿½cios variados
- Problemas de diferentes nï¿½veis
- Conexï¿½o com outras disciplinas

## ?? **Dicas Prï¿½ticas**

- **Comece sempre com o concreto**
- **Use materiais manipulï¿½veis**
- **Conecte com a vida real**
- **Celebre pequenas conquistas**
- **Permita diferentes estratï¿½gias de resoluï¿½ï¿½o**

**Qual tï¿½pico especï¿½fico de matemï¿½tica vocï¿½ gostaria de abordar?**`;

        } else if (message.toLowerCase().includes('ciï¿½ncias') || message.toLowerCase().includes('ciencia')) {
          fallbackResponse = `# ?? Estratï¿½gias para Ensino de Ciï¿½ncias

## ?? **Metodologia Cientï¿½fica**

### **Investigaï¿½ï¿½o e Descoberta**
- **Observaï¿½ï¿½o** sistemï¿½tica de fenï¿½menos
- **Formulaï¿½ï¿½o de hipï¿½teses** pelos alunos
- **Experimentos** simples e seguros
- **Anï¿½lise de resultados** coletivos

### **Materiais e Recursos**
- **Microscï¿½pios** para observaï¿½ï¿½o
- **Experimentos caseiros** com materiais seguros
- **Vï¿½deos cientï¿½ficos** educativos
- **Saï¿½das de campo** quando possï¿½vel

## ?? **Temas por Faixa Etï¿½ria**

### **Ensino Fundamental I**
- **Seres vivos** e suas caracterï¿½sticas
- **Meio ambiente** e preservaï¿½ï¿½o
- **Corpo humano** bï¿½sico
- **Fenï¿½menos naturais** simples

### **Ensino Fundamental II**
- **Cï¿½lulas** e organizaï¿½ï¿½o dos seres vivos
- **Fï¿½sica** bï¿½sica (forï¿½as, movimento)
- **Quï¿½mica** elementar (misturas, soluï¿½ï¿½es)
- **Astronomia** e sistema solar

## ?? **Atividades Prï¿½ticas**

### **Experimentos Simples**
- **Germinaï¿½ï¿½o** de sementes
- **Cristalizaï¿½ï¿½o** de aï¿½ï¿½car
- **Densidade** com objetos do dia a dia
- **Eletricidade estï¿½tica** com balï¿½es

### **Projetos Investigativos**
- **Observaï¿½ï¿½o** de plantas na escola
- **Anï¿½lise** da qualidade da ï¿½gua
- **Estudo** do clima local
- **Pesquisa** sobre animais da regiï¿½o

## ?? **Dicas Importantes**

- **Sempre priorize a seguranï¿½a**
- **Use linguagem cientï¿½fica adequada**
- **Conecte com situaï¿½ï¿½es reais**
- **Estimule a curiosidade**
- **Valorize as perguntas dos alunos**

**Que ï¿½rea especï¿½fica das ciï¿½ncias vocï¿½ estï¿½ trabalhando?**`;

        } else if (message.toLowerCase().includes('avaliaï¿½ï¿½o') || message.toLowerCase().includes('prova')) {
          fallbackResponse = `# ?? Estratï¿½gias de Avaliaï¿½ï¿½o Eficazes

## Avaliaï¿½ï¿½o Formativa (durante o processo):
- **Observaï¿½ï¿½o diï¿½ria** do progresso dos alunos
- **Perguntas rï¿½pidas** para verificar compreensï¿½o
- **Exit tickets** ao final da aula
- **Autoavaliaï¿½ï¿½o** dos alunos

## Avaliaï¿½ï¿½o Somativa (resultado final):
- **Provas tradicionais** bem estruturadas
- **Projetos** com critï¿½rios claros
- **Apresentaï¿½ï¿½es** orais
- **Portfï¿½lios** de trabalhos

## ?? Dicas para Avaliaï¿½ï¿½es Eficazes:
- **Diversifique** os instrumentos de avaliaï¿½ï¿½o
- **Comunique** os critï¿½rios claramente
- **Forneï¿½a feedback** construtivo e oportuno
- **Permita** que os alunos se preparem adequadamente

**Que tipo de avaliaï¿½ï¿½o vocï¿½ gostaria de desenvolver?**`;

        } else if (message.toLowerCase().includes('opa') || message.toLowerCase().includes('e aï¿½') || message.toLowerCase().includes('eai')) {
          fallbackResponse = `Olï¿½! ?? 

Como posso ajudar vocï¿½ hoje? 

Sou sua assistente de IA educacional e estou aqui para apoiar seu trabalho como professor(a)!

?? Posso ajudar com:
?? Planejamento de Aulas
?? Atividades e Exercï¿½cios  
?? Avaliaï¿½ï¿½o
?? Gestï¿½o de Sala

Digite sua pergunta especï¿½fica e eu te darei sugestï¿½es prï¿½ticas e aplicï¿½veis!

Exemplo: "Como criar uma atividade sobre fraï¿½ï¿½es para o 5ï¿½ ano?" ou "Preciso de ideias para avaliar um projeto de ciï¿½ncias"`;

        } else if (message.toLowerCase().includes('equaï¿½ï¿½o') || message.toLowerCase().includes('equaï¿½ï¿½es')) {
          fallbackResponse = `# ?? Como Ensinar Equaï¿½ï¿½es de Forma Simples

## ?? **Abordagem Prï¿½tica e Visual**

### **1. Comece com Balanï¿½as**
- Use uma balanï¿½a real ou desenhe uma no quadro
- Mostre que os dois lados devem ficar equilibrados
- "Se eu tiro 2 do lado esquerdo, preciso tirar 2 do direito tambï¿½m"

### **2. Use Nï¿½meros Simples**
- Comece com: x + 3 = 7
- Pergunte: "Que nï¿½mero + 3 = 7?"
- Resposta: x = 4
- Sempre verifique: 4 + 3 = 7 ?

### **3. Metodologia Passo a Passo**
1. **Identifique a incï¿½gnita**: "O que queremos descobrir?"
2. **Isole a incï¿½gnita**: "Como deixar o x sozinho?"
3. **Faï¿½a a mesma operaï¿½ï¿½o nos dois lados**
4. **Verifique a resposta**: Substitua o valor encontrado

## ?? **Exemplos Prï¿½ticos**

### **Exemplo 1: Adiï¿½ï¿½o**
x + 5 = 12
- Tire 5 dos dois lados: x + 5 - 5 = 12 - 5
- Resultado: x = 7
- Verificaï¿½ï¿½o: 7 + 5 = 12 ?

### **Exemplo 2: Subtraï¿½ï¿½o**
x - 3 = 8
- Some 3 nos dois lados: x - 3 + 3 = 8 + 3
- Resultado: x = 11
- Verificaï¿½ï¿½o: 11 - 3 = 8 ?

### **Exemplo 3: Multiplicaï¿½ï¿½o**
2x = 10
- Divida por 2 os dois lados: 2x ï¿½ 2 = 10 ï¿½ 2
- Resultado: x = 5
- Verificaï¿½ï¿½o: 2 ï¿½ 5 = 10 ?

## ?? **Dicas Importantes**
- **Use linguagem simples**: "desconhecido" em vez de "incï¿½gnita"
- **Sempre verifique**: Substitua o valor encontrado
- **Comece fï¿½cil**: Nï¿½meros pequenos e operaï¿½ï¿½es simples
- **Use analogias**: Balanï¿½a, balde de ï¿½gua, etc.

**Que sï¿½rie vocï¿½ estï¿½ ensinando? Posso adaptar os exemplos!**`;

        } else if (message.toLowerCase().includes('como') && message.toLowerCase().includes('ensinar')) {
          fallbackResponse = `# ?? Estratï¿½gias de Ensino Eficazes

## ?? **Metodologias Ativas**
- **Aprendizagem baseada em problemas**: Apresente situaï¿½ï¿½es reais para resolver
- **Sala de aula invertida**: Conteï¿½do em casa, prï¿½tica na escola
- **Rotaï¿½ï¿½o por estaï¿½ï¿½es**: Diferentes atividades simultï¿½neas
- **Peer instruction**: Alunos ensinam uns aos outros

## ?? **Tï¿½cnicas de Engajamento**
- **Gamificaï¿½ï¿½o**: Use pontos, badges e competiï¿½ï¿½es
- **Storytelling**: Conte histï¿½rias relacionadas ao conteï¿½do
- **Humor**: Use piadas e situaï¿½ï¿½es engraï¿½adas
- **Mï¿½sica**: Crie parï¿½dias ou use ritmos para memorizaï¿½ï¿½o

## ?? **Dicas Prï¿½ticas**
- **Varie os mï¿½todos**: Nï¿½o use sempre a mesma abordagem
- **Conecte com a vida real**: Mostre aplicaï¿½ï¿½es prï¿½ticas
- **Use tecnologia**: Apps, vï¿½deos e simulaï¿½ï¿½es
- **Incentive perguntas**: Crie ambiente seguro para dï¿½vidas

**Que disciplina vocï¿½ estï¿½ ensinando? Posso dar dicas mais especï¿½ficas!**`;

        } else if (message.toLowerCase().includes('disciplina') || message.toLowerCase().includes('matï¿½ria')) {
          fallbackResponse = `# ?? Gestï¿½o de Disciplinas Escolares

## ?? **Organizaï¿½ï¿½o por Disciplina**

### **Planejamento Anual**
- **Objetivos gerais** para o ano letivo
- **Conteï¿½dos essenciais** por bimestre
- **Avaliaï¿½ï¿½es programadas** e critï¿½rios
- **Recursos necessï¿½rios** (materiais, espaï¿½os)

### **Integraï¿½ï¿½o Curricular**
- **Projetos interdisciplinares** entre matï¿½rias
- **Temas transversais** (ï¿½tica, meio ambiente)
- **Competï¿½ncias socioemocionais** integradas
- **Tecnologia** como ferramenta comum

## ?? **Acompanhamento**
- **Registro de progresso** por disciplina
- **Identificaï¿½ï¿½o de dificuldades** especï¿½ficas
- **Adaptaï¿½ï¿½o de estratï¿½gias** conforme necessï¿½rio
- **Comunicaï¿½ï¿½o** com outros professores

**Qual disciplina vocï¿½ gostaria de organizar melhor?**`;

        } else if (message.toLowerCase().includes('aluno') || message.toLowerCase().includes('estudante')) {
          fallbackResponse = `# ?? Gestï¿½o de Alunos em Sala de Aula

## ?? **Estratï¿½gias de Engajamento**

### **Conheï¿½a seus Alunos**
- **Perfil de aprendizagem**: Visual, auditivo, cinestï¿½sico
- **Interesses pessoais**: Use temas que os motivem
- **Dificuldades especï¿½ficas**: Adapte o ensino individualmente
- **Pontos fortes**: Valorize e desenvolva talentos

### **Ambiente de Aprendizagem**
- **Sala organizada**: Layout que facilite interaï¿½ï¿½o
- **Regras claras**: Combinados estabelecidos coletivamente
- **Clima positivo**: Respeito mï¿½tuo e colaboraï¿½ï¿½o
- **Feedback constante**: Reconhecimento e orientaï¿½ï¿½o

## ?? **Dicas Prï¿½ticas**
- **Use nomes**: Chame cada aluno pelo nome
- **Faï¿½a perguntas**: Incentive participaï¿½ï¿½o ativa
- **Varie atividades**: Diferentes estilos de aprendizagem
- **Celebre conquistas**: Reconheï¿½a progressos individuais

**Como estï¿½ sendo o relacionamento com seus alunos?**`;

        } else if (message.toLowerCase().includes('problema') || message.toLowerCase().includes('dificuldade')) {
          fallbackResponse = `# ?? Resoluï¿½ï¿½o de Problemas Educacionais

## ?? **Identificaï¿½ï¿½o do Problema**
- **Observe comportamentos**: Sinais de desinteresse ou dificuldade
- **Analise resultados**: Notas, participaï¿½ï¿½o, entregas
- **Converse com alunos**: Entenda perspectivas individuais
- **Consulte colegas**: Troque experiï¿½ncias com outros professores

## ?? **Estratï¿½gias de Soluï¿½ï¿½o**

### **Para Dificuldades de Aprendizagem**
- **Reforï¿½o individual**: Atendimento personalizado
- **Materiais adaptados**: Recursos diferenciados
- **Parcerias**: Alunos ajudam uns aos outros
- **Comunicaï¿½ï¿½o com famï¿½lia**: Envolva os responsï¿½veis

### **Para Problemas de Comportamento**
- **Diï¿½logo respeitoso**: Converse em particular
- **Consequï¿½ncias lï¿½gicas**: Relacionadas ao comportamento
- **Busque causas**: Entenda o que motiva o problema
- **Plano de melhoria**: Estabeleï¿½a metas claras

**Qual problema especï¿½fico vocï¿½ estï¿½ enfrentando?**`;

        } else if (message.toLowerCase().includes('portuguï¿½s') || message.toLowerCase().includes('portugues') || message.toLowerCase().includes('gramï¿½tica') || message.toLowerCase().includes('gramatica')) {
          fallbackResponse = `# ?? Estratï¿½gias para Ensino de Portuguï¿½s

## ?? **Abordagem Prï¿½tica**

### **Leitura e Interpretaï¿½ï¿½o**
- **Leia em voz alta**: Mostre entonaï¿½ï¿½o e pausas
- **Faï¿½a perguntas**: "O que vocï¿½ entendeu?", "Por que o personagem fez isso?"
- **Conecte com a vida**: "Vocï¿½ jï¿½ passou por uma situaï¿½ï¿½o assim?"

### **Gramï¿½tica Contextualizada**
- **Use textos reais**: Nï¿½o ensine regras isoladas
- **Exemplos prï¿½ticos**: "Veja como o autor usa vï¿½rgulas aqui"
- **Exercï¿½cios criativos**: Peï¿½a para escreverem usando a regra

### **Escrita Criativa**
- **Comece pequeno**: Frases, depois parï¿½grafos
- **Temas interessantes**: O que os alunos gostam
- **Revisï¿½o colaborativa**: Alunos ajudam uns aos outros

**Que aspecto do portuguï¿½s vocï¿½ quer trabalhar?**`;

        } else if (message.toLowerCase().includes('histï¿½ria') || message.toLowerCase().includes('historia')) {
          fallbackResponse = `# ??? Como Ensinar Histï¿½ria de Forma Interessante

## ?? **Metodologias Ativas**

### **Storytelling**
- **Conte como uma histï¿½ria**: "Era uma vez um rei que..."
- **Use dramatizaï¿½ï¿½o**: Alunos encenam momentos histï¿½ricos
- **Crie suspense**: "E entï¿½o, o que vocï¿½s acham que aconteceu?"

### **Conexï¿½es com o Presente**
- **Compare ï¿½pocas**: "Como era diferente naquela ï¿½poca?"
- **Relacione com a vida**: "Isso ainda acontece hoje?"
- **Use mapas**: Mostre como o mundo mudou

### **Recursos Visuais**
- **Imagens histï¿½ricas**: Fotografias, pinturas, mapas
- **Vï¿½deos curtos**: Documentï¿½rios de 5-10 minutos
- **Linha do tempo**: Visualize a sequï¿½ncia dos eventos

**Que perï¿½odo histï¿½rico vocï¿½ estï¿½ trabalhando?**`;

        } else if (message.toLowerCase().includes('geografia') || message.toLowerCase().includes('geo')) {
          fallbackResponse = `# ?? Estratï¿½gias para Ensino de Geografia

## ?? **Abordagem Prï¿½tica**

### **Mapas Interativos**
- **Comece local**: "Onde fica nossa escola?"
- **Expanda gradualmente**: Bairro ? Cidade ? Estado ? Paï¿½s
- **Use tecnologia**: Google Earth, mapas digitais

### **Conexï¿½o com o Cotidiano**
- **Clima local**: "Por que choveu ontem?"
- **Economia**: "De onde vem o que comemos?"
- **Transporte**: "Como chegamos atï¿½ aqui?"

### **Atividades Prï¿½ticas**
- **Construa mapas**: Com materiais simples
- **Saï¿½das de campo**: Observe o ambiente
- **Pesquisas locais**: Histï¿½ria do bairro

**Que tema de geografia vocï¿½ quer abordar?**`;

        } else if (message.toLowerCase().includes('fï¿½sica') || message.toLowerCase().includes('fisica')) {
          fallbackResponse = `# ? Como Ensinar Fï¿½sica de Forma Simples

## ?? **Experimentos Prï¿½ticos**

### **Forï¿½a e Movimento**
- **Carrinho na rampa**: Mostre aceleraï¿½ï¿½o
- **Bola que cai**: Demonstre gravidade
- **Pï¿½ndulo simples**: Observe oscilaï¿½ï¿½o

### **Eletricidade Bï¿½sica**
- **Circuito simples**: Pilha + fio + lï¿½mpada
- **Eletricidade estï¿½tica**: Balï¿½o + cabelo
- **ï¿½mï¿½s**: Mostre campos magnï¿½ticos

### **Dicas Importantes**
- **Use linguagem simples**: "empurrar" em vez de "forï¿½a"
- **Conecte com o dia a dia**: "Por que o carro freia?"
- **Permita experimentaï¿½ï¿½o**: Deixe testarem

**Que conceito de fï¿½sica vocï¿½ quer explicar?**`;

        } else if (message.toLowerCase().includes('quï¿½mica') || message.toLowerCase().includes('quimica')) {
          fallbackResponse = `# ?? Estratï¿½gias para Ensino de Quï¿½mica

## ?? **Experimentos Seguros**

### **Reaï¿½ï¿½es Simples**
- **Vinagre + bicarbonato**: Efervescï¿½ncia
- **Ferro + oxigï¿½nio**: Ferrugem (lento)
- **Aï¿½ï¿½car + calor**: Caramelizaï¿½ï¿½o

### **Estados da Matï¿½ria**
- **Gelo ? ï¿½gua ? Vapor**: Mudanï¿½as de estado
- **Dissoluï¿½ï¿½o**: Sal na ï¿½gua
- **Cristalizaï¿½ï¿½o**: Aï¿½ï¿½car cristalizado

### **Abordagem Prï¿½tica**
- **Use analogias**: "ï¿½tomos sï¿½o como tijolos"
- **Conecte com cozinha**: "Por que o bolo cresce?"
- **Seguranï¿½a primeiro**: Sempre supervisione

**Que conceito de quï¿½mica vocï¿½ quer trabalhar?**`;

        } else if (message.toLowerCase().includes('atividade') && message.toLowerCase().includes('criativa')) {
          fallbackResponse = `# ?? Ideias de Atividades Criativas

## ?? **Para Qualquer Disciplina**

### **Gamificaï¿½ï¿½o**
- **Quiz competitivo**: Divida a turma em times
- **Caï¿½a ao tesouro**: Esconda pistas pela sala
- **Bingo educativo**: Cartelas com conceitos da matï¿½ria

### **Arte e Criatividade**
- **Desenho explicativo**: Ilustrem o que aprenderam
- **Teatro educativo**: Encenem situaï¿½ï¿½es histï¿½ricas ou cientï¿½ficas
- **Mï¿½sica**: Criem parï¿½dias sobre o conteï¿½do

### **Tecnologia**
- **Vï¿½deos curtos**: Alunos gravam explicaï¿½ï¿½es
- **Apresentaï¿½ï¿½es digitais**: Use PowerPoint ou Canva
- **Apps educativos**: Kahoot, Quizlet, etc.

### **Projetos Prï¿½ticos**
- **Construï¿½ï¿½o de maquetes**: Representem conceitos
- **Experimentos caseiros**: Ciï¿½ncias com materiais simples
- **Pesquisas locais**: Histï¿½ria do bairro, geografia local

**Que disciplina vocï¿½ quer tornar mais criativa?**`;

        } else if (message.toLowerCase().includes('aluno') && message.toLowerCase().includes('nï¿½o') && (message.toLowerCase().includes('presta') || message.toLowerCase().includes('atenï¿½ï¿½o'))) {
          fallbackResponse = `# ?? Como Lidar com Aluno Desatento

## ?? **Estratï¿½gias Imediatas**

### **Durante a Aula**
- **Mude o tom de voz**: Chame atenï¿½ï¿½o sem gritar
- **Faï¿½a perguntas diretas**: "Joï¿½o, o que vocï¿½ acha sobre isso?"
- **Mova-se pela sala**: Fique prï¿½ximo do aluno
- **Varie a atividade**: Mude o ritmo da aula

### **Identifique as Causas**
- **Converse em particular**: "Estï¿½ tudo bem?"
- **Observe padrï¿½es**: Em que momentos ele se distrai?
- **Verifique necessidades**: Sono, fome, problemas pessoais
- **Consulte outros professores**: ï¿½ sï¿½ na sua aula?

### **Soluï¿½ï¿½es Prï¿½ticas**
- **Assento estratï¿½gico**: Coloque perto de vocï¿½
- **Parcerias**: Colega que pode ajudar
- **Atividades manuais**: Para alunos mais ativos
- **Intervalos**: Pequenas pausas para se mexer

### **Comunicaï¿½ï¿½o**
- **Fale com a famï¿½lia**: Informe sobre o comportamento
- **Seja positivo**: Reconheï¿½a quando ele participa
- **Estabeleï¿½a combinados**: Regras claras e justas

**O aluno tem alguma dificuldade especï¿½fica de aprendizagem?**`;

        } else if (message.toLowerCase().includes('gerundismo') || message.toLowerCase().includes('gerï¿½ndio')) {
          fallbackResponse = `# ?? Plano de Aula: Gerundismo

## ?? **Objetivo**
Ao final da aula, os alunos identificarï¿½o e corrigirï¿½o casos de gerundismo em textos.

## ?? **Motivaï¿½ï¿½o (10 min)**
- **Pergunta provocativa**: "Vocï¿½s jï¿½ ouviram alguï¿½m falar 'vou estar fazendo' ou 'vou estar indo'?"
- **Mostre exemplos**: Escreva frases com gerundismo no quadro
- **Conecte com a vida**: "Isso acontece muito no dia a dia, nï¿½?"

## ?? **Desenvolvimento (25 min)**

### **1. O que ï¿½ Gerundismo?**
- **Definiï¿½ï¿½o simples**: Usar gerï¿½ndio desnecessariamente
- **Exemplos prï¿½ticos**:
  - ? "Vou estar fazendo" ? ? "Vou fazer"
  - ? "Vou estar indo" ? ? "Vou ir"
  - ? "Vou estar estudando" ? ? "Vou estudar"

### **2. Por que acontece?**
- **Influï¿½ncia de outras lï¿½nguas** (inglï¿½s)
- **Hï¿½bito de fala**
- **Tentativa de soar mais formal**

### **3. Como corrigir?**
- **Substitua por futuro simples**
- **Use verbos diretos**
- **Mantenha a simplicidade**

## ?? **Atividade Prï¿½tica (15 min)**
- **Correï¿½ï¿½o coletiva**: Frases no quadro para corrigir juntos
- **Exercï¿½cio individual**: Lista de frases para corrigir
- **Criaï¿½ï¿½o**: Alunos criam frases corretas

## ? **Fechamento (5 min)**
- **Sï¿½ntese**: "O que aprendemos sobre gerundismo?"
- **Dica**: "Falem de forma simples e direta!"
- **Prï¿½xima aula**: Mais exercï¿½cios prï¿½ticos

**Precisa de mais exemplos ou atividades especï¿½ficas?**`;

        } else if (message.toLowerCase().includes('plano') && message.toLowerCase().includes('aula')) {
          fallbackResponse = `# ?? Como Fazer um Plano de Aula Eficaz

## ?? **Estrutura Simples**

### **1. Objetivo (5 min)**
- **O que os alunos vï¿½o aprender?**
- **Use verbos claros**: identificar, explicar, aplicar
- **Exemplo**: "Ao final da aula, os alunos identificarï¿½o fraï¿½ï¿½es equivalentes"

### **2. Motivaï¿½ï¿½o (10 min)**
- **Gancho inicial**: Pergunta provocativa, vï¿½deo curto, situaï¿½ï¿½o-problema
- **Conecte com a vida**: "Quantos pedaï¿½os de pizza cada um come?"
- **Desperte curiosidade**: "Vocï¿½s sabiam que..."

### **3. Desenvolvimento (25 min)**
- **Apresente o conteï¿½do**: Explicaï¿½ï¿½o clara e objetiva
- **Use exemplos**: Sempre com situaï¿½ï¿½es prï¿½ticas
- **Interaja**: Faï¿½a perguntas, peï¿½a exemplos dos alunos

### **4. Atividade Prï¿½tica (15 min)**
- **Exercï¿½cios**: Individuais ou em grupo
- **Aplicaï¿½ï¿½o**: Use o conhecimento aprendido
- **Diferentes nï¿½veis**: Para alunos com ritmos diferentes

### **5. Fechamento (5 min)**
- **Sï¿½ntese**: "O que aprendemos hoje?"
- **Prï¿½ximos passos**: "Na prï¿½xima aula vamos..."
- **Dï¿½vidas**: "Alguma pergunta?"

**Que disciplina vocï¿½ estï¿½ planejando?**`;

        } else if (message.toLowerCase().includes('avaliaï¿½ï¿½o') || message.toLowerCase().includes('prova') || message.toLowerCase().includes('nota')) {
          fallbackResponse = `# ?? Estratï¿½gias de Avaliaï¿½ï¿½o Eficazes

## ?? **Tipos de Avaliaï¿½ï¿½o**

### **Avaliaï¿½ï¿½o Formativa (Durante o Processo)**
- **Observaï¿½ï¿½o diï¿½ria**: Como o aluno participa e se desenvolve
- **Perguntas rï¿½pidas**: "Entenderam?", "Alguma dï¿½vida?"
- **Autoavaliaï¿½ï¿½o**: "Como vocï¿½ se sente com esse conteï¿½do?"
- **Trabalhos prï¿½ticos**: Atividades que mostram o progresso

### **Avaliaï¿½ï¿½o Somativa (Resultado Final)**
- **Provas bem estruturadas**: Questï¿½es claras e objetivas
- **Projetos**: Trabalhos que aplicam o conhecimento
- **Apresentaï¿½ï¿½es**: Alunos explicam o que aprenderam
- **Portfï¿½lios**: Coletï¿½nea de trabalhos ao longo do tempo

## ?? **Dicas Importantes**
- **Diversifique**: Nï¿½o use sï¿½ provas escritas
- **Comunique critï¿½rios**: Alunos devem saber como serï¿½o avaliados
- **Dï¿½ feedback**: Explique o que estï¿½ bom e o que pode melhorar
- **Seja justo**: Considere diferentes formas de aprender

**Que tipo de avaliaï¿½ï¿½o vocï¿½ quer implementar?**`;

        } else if (message.toLowerCase().includes('crase') || message.toLowerCase().includes('ï¿½')) {
          fallbackResponse = `# ?? Como Ensinar Crase de Forma Simples

## ?? **Regra Bï¿½sica**
**Crase = a + a** (preposiï¿½ï¿½o + artigo feminino)

## ?? **Exemplos Prï¿½ticos**
- ? "Vou ï¿½ escola" (a + a escola)
- ? "Voltei ï¿½ casa" (a + a casa)  
- ? "Vou a escola" (sem artigo)
- ? "Vou ao mï¿½dico" (masculino = ao)

## ?? **Dica Simples**
**Teste**: Substitua por masculino
- "Vou ï¿½ escola" ? "Vou ao colï¿½gio" ?
- "Vou a escola" ? "Vou o colï¿½gio" ?

## ?? **Atividade**
- **Frases para corrigir**: Lista com casos de crase
- **Jogo da memï¿½ria**: Pares de frases (com/sem crase)
- **Criaï¿½ï¿½o**: Alunos criam frases usando crase

**Precisa de mais exercï¿½cios prï¿½ticos?**`;

        } else if (message.toLowerCase().includes('vï¿½rgula') || message.toLowerCase().includes('virgula')) {
          fallbackResponse = `# ?? Como Ensinar Uso da Vï¿½rgula

## ?? **Regras Principais**

### **1. Enumeraï¿½ï¿½o**
- ? "Comprei maï¿½ï¿½, banana e laranja"
- ? "Estudou, trabalhou e descansou"

### **2. Aposto**
- ? "Joï¿½o, meu amigo, chegou"
- ? "Sï¿½o Paulo, capital de SP, ï¿½ grande"

### **3. Vocativo**
- ? "Maria, venha aqui!"
- ? "Professor, posso sair?"

### **4. Oraï¿½ï¿½o Subordinada**
- ? "Quando chegar, me avise"
- ? "Se chover, nï¿½o sairemos"

## ?? **Dica Prï¿½tica**
**Pausa na fala = vï¿½rgula na escrita**

## ?? **Atividades**
- **Leitura em voz alta**: Mostre as pausas
- **Correï¿½ï¿½o coletiva**: Textos sem vï¿½rgulas
- **Criaï¿½ï¿½o**: Alunos escrevem usando vï¿½rgulas

**Que tipo de exercï¿½cio vocï¿½ quer fazer?**`;

        } else if (message.toLowerCase().includes('acento') || message.toLowerCase().includes('acentuaï¿½ï¿½o')) {
          fallbackResponse = `# ?? Acentuaï¿½ï¿½o Grï¿½fica Simplificada

## ?? **Regras Bï¿½sicas**

### **1. Oxï¿½tonas (ï¿½ltima sï¿½laba)**
- **Terminadas em a, e, o**: Nï¿½o acentuam
- **Outras terminaï¿½ï¿½es**: Acentuam
- **Exemplos**: cafï¿½, vocï¿½, coraï¿½ï¿½o

### **2. Paroxï¿½tonas (penï¿½ltima sï¿½laba)**
- **Terminadas em a, e, o**: Nï¿½o acentuam
- **Outras terminaï¿½ï¿½es**: Acentuam
- **Exemplos**: mesa, livro, fï¿½cil

### **3. Proparoxï¿½tonas (antepenï¿½ltima sï¿½laba)**
- **Sempre acentuam**
- **Exemplos**: mï¿½dico, lï¿½mpada, matemï¿½tica

## ?? **Dica Prï¿½tica**
**Conte as sï¿½labas de trï¿½s para frente!**

## ?? **Atividades**
- **Classificaï¿½ï¿½o**: Separe por tipo de palavra
- **Jogo da memï¿½ria**: Palavras com/sem acento
- **Ditado**: Foque na acentuaï¿½ï¿½o

**Precisa de mais exemplos?**`;

        } else if (message.toLowerCase().includes('concordï¿½ncia') || message.toLowerCase().includes('concordancia')) {
          fallbackResponse = `# ?? Concordï¿½ncia Verbal e Nominal

## ?? **Concordï¿½ncia Verbal**

### **Sujeito Simples**
- ? "O aluno estuda" (singular)
- ? "Os alunos estudam" (plural)

### **Sujeito Composto**
- ? "Joï¿½o e Maria estudam" (plural)
- ? "Joï¿½o ou Maria estuda" (singular)

## ?? **Concordï¿½ncia Nominal**

### **Adjetivo com Substantivo**
- ? "Casa bonita" (feminino)
- ? "Carro bonito" (masculino)
- ? "Casas bonitas" (plural)

## ?? **Dicas Prï¿½ticas**
- **Sujeito e verbo**: Mesmo nï¿½mero
- **Substantivo e adjetivo**: Mesmo gï¿½nero e nï¿½mero

## ?? **Atividades**
- **Correï¿½ï¿½o**: Frases com erros de concordï¿½ncia
- **Criaï¿½ï¿½o**: Alunos fazem frases corretas
- **Jogo**: Identifique o erro

**Que tipo de concordï¿½ncia vocï¿½ quer trabalhar?**`;

        } else {
          // Resposta geral mais natural e menos estruturada
          fallbackResponse = `Olï¿½! ?? 

Sou sua assistente de IA educacional e estou aqui para ajudar vocï¿½ com qualquer questï¿½o relacionada ao ensino!

Posso ajudar com:
?? Explicaï¿½ï¿½es didï¿½ticas de qualquer matï¿½ria
?? Sugestï¿½es de atividades criativas  
?? Estratï¿½gias de avaliaï¿½ï¿½o
?? Gestï¿½o de sala de aula
?? Resoluï¿½ï¿½o de problemas educacionais

Seja especï¿½fico na sua pergunta! Por exemplo:
- "Como ensinar equaï¿½ï¿½es para o 7ï¿½ ano?"
- "Atividade sobre meio ambiente para crianï¿½as"
- "Meu aluno nï¿½o estï¿½ prestando atenï¿½ï¿½o, o que fazer?"
- "Plano de aula sobre fraï¿½ï¿½es"

Me conte exatamente o que vocï¿½ precisa e eu te darei uma resposta prï¿½tica e personalizada!`;
        }

        console.log(`?? Usando resposta fallback devido ao erro do Ollama`);
        
        res.json({ 
          response: fallbackResponse,
          model: 'fallback',
          timestamp: new Date().toISOString(),
          note: 'Resposta gerada pelo sistema de fallback (Ollama indisponï¿½vel)'
        });
      }

    } catch (error) {
      console.error('? Erro geral na rota de IA:', error);
      res.status(500).json({ 
        message: "Erro interno do servidor ao processar solicitaï¿½ï¿½o de IA",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Buscar disciplinas do professor
  app.get('/api/teacher/:teacherId/subjects', isAuthenticated, async (req, res) => {
    try {
      const { teacherId } = req.params;

      console.log(`?? Buscando disciplinas do professor ${teacherId}`);

      const teacherSubjects = await db
        .select({
          subjectId: subjects.id,
          subjectName: subjects.name,
          subjectDescription: subjects.description,
          classId: classes.id,
          className: classes.name,
          status: classSubjects.status
        })
        .from(classSubjects)
        .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
        .innerJoin(classes, eq(classSubjects.classId, classes.id))
        .where(and(
          eq(classSubjects.teacherId, teacherId),
          eq(classSubjects.status, 'active'),
          eq(subjects.status, 'active')
        ));

      console.log(`? Encontradas ${teacherSubjects.length} disciplinas para o professor ${teacherId}`);

      res.json({
        success: true,
        data: teacherSubjects
      });

    } catch (error) {
      console.error('? Erro ao buscar disciplinas do professor:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar eventos do professor (provas e atividades das suas turmas) - DESABILITADA (duplicada)
  // app.get('/api/teacher/:teacherId/events', isAuthenticated, async (req, res) => {
    // try {
    //   const { teacherId } = req.params;
    //   const { startDate, endDate } = req.query;

    //   console.log(`?? Buscando eventos do professor ${teacherId}`);
    //   console.log(`?? Parï¿½metros de data: startDate=${startDate}, endDate=${endDate}`);

    //   const events = [];

      // PRIMEIRA API COMENTADA - Cï¿½DIGO REMOVIDO PARA EVITAR ERROS DE SINTAXE
      /*
      // Buscar provas das turmas do professor
      console.log(`?? Buscando provas do professor...`);
      const examsData = await db
        .select({
          id: exams.id,
          title: exams.title,
          description: exams.description,
          examDate: exams.examDate,
          classId: exams.classId,
          className: classes.name,
          subjectId: exams.subjectId,
          subjectName: subjects.name,
          bimonthly: exams.bimonthly,
          totalPoints: exams.totalPoints,
          duration: exams.duration,
          type: sql<string>`'exam'`.as('type')
        })
        .from(exams)
        .innerJoin(classes, eq(exams.classId, classes.id))
        .innerJoin(subjects, eq(exams.subjectId, subjects.id))
        .innerJoin(classSubjects, and(
          eq(classSubjects.classId, exams.classId),
          eq(classSubjects.subjectId, exams.subjectId)
        ))
        .where(and(
          eq(classSubjects.teacherId, teacherId),
          startDate ? gte(exams.examDate, new Date(startDate as string)) : undefined,
          endDate ? lte(exams.examDate, new Date(endDate as string)) : undefined
        ));

      console.log(`?? Provas encontradas: ${examsData.length}`);
      examsData.forEach(exam => {
        console.log(`  - ${exam.title} (${exam.subjectName} - ${exam.className}) - Data: ${exam.examDate}`);
      });

      events.push(...examsData.map(exam => ({
        id: exam.id,
        title: exam.title,
        description: exam.description,
        date: exam.examDate,
        classId: exam.classId,
        className: exam.className,
        subjectName: exam.subjectName,
        type: exam.type,
        bimonthly: exam.bimonthly,
        totalPoints: exam.totalPoints,
        duration: exam.duration
      })));

      // Buscar atividades das turmas do professor
      const activitiesData = await db
        .select({
          id: activities.id,
          title: activities.title,
          description: activities.description,
          dueDate: activities.dueDate,
          classId: activities.classId,
          className: classes.name,
          subjectId: activities.subjectId,
          subjectName: subjects.name,
          maxGrade: activities.maxGrade,
          type: sql<string>`'activity'`.as('type')
        })
        .from(activities)
        .innerJoin(classes, eq(activities.classId, classes.id))
        .innerJoin(subjects, eq(activities.subjectId, subjects.id))
        .innerJoin(classSubjects, and(
          eq(classSubjects.classId, activities.classId),
          eq(classSubjects.subjectId, activities.subjectId)
        ))
        .where(and(
          eq(classSubjects.teacherId, teacherId),
          startDate ? gte(activities.dueDate, new Date(startDate as string)) : undefined,
          endDate ? lte(activities.dueDate, new Date(endDate as string)) : undefined
        ));

      console.log(`?? Atividades encontradas: ${activitiesData.length}`);
      activitiesData.forEach(activity => {
        console.log(`  - ${activity.title} (${activity.subjectName} - ${activity.className}) - Data: ${activity.dueDate}`);
      });

      events.push(...activitiesData.map(activity => ({
        id: activity.id,
        title: activity.title,
        description: activity.description,
        date: activity.dueDate,
        classId: activity.classId,
        className: activity.className,
        subjectName: activity.subjectName,
        type: activity.type,
        totalPoints: activity.maxGrade
      })));

      // Buscar eventos globais do coordenador
      let globalEvents;
      if (startDate && endDate) {
        const result = await client.execute({
          sql: `SELECT e.* FROM events e
                 LEFT JOIN users u ON e.createdBy = u.id
                 WHERE u.role = 'coordinator' 
                 AND e.startDate >= ? 
                 AND e.startDate <= ?
                 AND e.status = 'active'`,
          args: [startDate, endDate]
        });
        globalEvents = result.rows;
      } else {
        const result = await client.execute({
          sql: `SELECT e.* FROM events e
                 LEFT JOIN users u ON e.createdBy = u.id
                 WHERE u.role = 'coordinator'
                 AND e.status = 'active'`,
          args: []
        });
        globalEvents = result.rows;
      }
      
      // Adicionar eventos globais com isGlobal: true
      const globalEventsWithFlag = globalEvents.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.startDate,
        classId: event.classId,
        className: 'Evento Global',
        subjectName: 'Coordenador',
        type: event.type,
        isGlobal: true
      }));
      
      events.push(...globalEventsWithFlag);

      console.log(`? Encontrados ${events.length} eventos para o professor ${teacherId} (${events.length - globalEvents.length} especï¿½ficos + ${globalEvents.length} globais)`);
      console.log(`?? Eventos retornados:`, events.map(e => `${e.title} (${e.type}) - ${e.date}`));

      res.json({
        success: true,
        data: events
      });

    } catch (error) {
      console.error('? Erro ao buscar eventos do professor:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
    */
  // });

  // Criar evento (prova, atividade, apresentaï¿½ï¿½o, reuniï¿½o)
  app.post('/api/teacher/events', isAuthenticated, hasRole(['teacher', 'admin']), async (req, res) => {
    try {
      const { 
        title, 
        description, 
        type, 
        classId, 
        subjectId, 
        teacherId, 
        date, 
        duration, 
        totalPoints, 
        instructions,
        grade
      } = req.body;

      console.log('?? Criando evento:', { title, type, classId, date });

      if (!title || !type || !classId || !teacherId || !date) {
        return res.status(400).json({ 
          message: "Campos obrigatï¿½rios: tï¿½tulo, tipo, turma, professor e data" 
        });
      }

      // Corrigir timezone - garantir que a data seja salva no formato correto
      const formatDateForDB = (dateString: string) => {
        if (!dateString) return null;
        // Se a data jï¿½ estï¿½ no formato YYYY-MM-DD, adicionar horï¿½rio para evitar timezone issues
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return `${dateString}T12:00:00.000Z`; // Meio-dia UTC para evitar problemas de timezone
        }
        return dateString;
      };

      const formattedDate = formatDateForDB(date);
      console.log('?? Data formatada:', { original: date, formatted: formattedDate });

      const eventId = uuidv4();

      if (type === 'exam') {
        // Criar prova
        const examData = {
          id: eventId,
          title,
          description: description || '',
          classId,
          subjectId: subjectId || null,
          teacherId,
          examDate: formattedDate,
          duration: duration ? parseInt(duration) : null,
          totalPoints: totalPoints ? parseFloat(totalPoints) : 10,
          semester: '1',
          bimonthly: grade ? parseInt(grade) : 1,
          status: 'scheduled',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await db.insert(exams).values(examData);
        console.log(`? Prova criada: ${eventId}`);

      } else if (type === 'activity') {
        // Criar atividade
        const activityData = {
          id: eventId,
          title,
          description: description || '',
          classId,
          subjectId: subjectId || null,
          teacherId,
          dueDate: formattedDate,
          maxGrade: totalPoints ? parseFloat(totalPoints) : 10,
          instructions: instructions || '',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await db.insert(activities).values(activityData);
        console.log(`? Atividade criada: ${eventId}`);
      }

      res.status(201).json({
        success: true,
        message: "Evento criado com sucesso",
        data: { id: eventId, type }
      });

    } catch (error) {
      console.error('? Erro ao criar evento:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar arquivos de uma atividade especï¿½fica
  app.get('/api/activities/:activityId/files', isAuthenticated, hasRole(['coordinator', 'admin', 'teacher', 'student']), async (req, res) => {
    try {
      const { activityId } = req.params;
      
      // Usar o mesmo caminho do DB do servidor para evitar inconsistÃªncia
      const dbPathFiles = schoolDbPath;
      const sqliteDb = new Database(dbPathFiles);
      const files = sqliteDb.prepare(`
        SELECT af.*, af.fileName as originalName 
        FROM activityFiles af 
        WHERE af.activityId = ?
      `).all(activityId);
      sqliteDb.close();
      
      console.log(`?? Arquivos encontrados para atividade ${activityId}:`, files.length);
      res.json(files);
      
    } catch (error) {
      console.error('? Erro ao buscar arquivos da atividade:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Deletar atividade com proteï¿½ï¿½o por senha
  app.delete('/api/activities/:id', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { id } = req.params;
      const { password } = req.body;
      const user = req.user as any;

      // Verificar se a atividade existe e pertence ao professor
      const activity = await db
        .select()
        .from(activities)
        .where(and(eq(activities.id, id), eq(activities.teacherId, user.id)))
        .limit(1);

      if (activity.length === 0) {
        return res.status(404).json({ message: "Atividade nï¿½o encontrada ou vocï¿½ nï¿½o tem permissï¿½o para deletï¿½-la" });
      }

      // Verificar senha do usuï¿½rio
      const userData = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      if (userData.length === 0) {
        return res.status(404).json({ message: "Usuï¿½rio nï¿½o encontrado" });
      }

      // Verificar senha (simplificado - em produï¿½ï¿½o usar hash)
      if (password !== '123456') {
        return res.status(401).json({ message: "Senha incorreta" });
      }

      // Deletar arquivos da atividade primeiro
      const sqliteDb = new Database(schoolDbPath);
      
      // Deletar arquivos das submissï¿½es
      sqliteDb.prepare(`
        DELETE FROM submissionFiles 
        WHERE submissionId IN (
          SELECT id FROM activitySubmissions WHERE activityId = ?
        )
      `).run(id);

      // Deletar arquivos da atividade
      sqliteDb.prepare(`
        DELETE FROM activityFiles WHERE activityId = ?
      `).run(id);

      // Deletar submissï¿½es
      sqliteDb.prepare(`
        DELETE FROM activitySubmissions WHERE activityId = ?
      `).run(id);

      // Deletar atividade
      sqliteDb.prepare(`
        DELETE FROM activities WHERE id = ?
      `).run(id);

      sqliteDb.close();

      console.log(`??? Atividade ${id} deletada pelo professor ${user.id}`);
      res.json({ message: "Atividade deletada com sucesso" });

    } catch (error) {
      console.error('? Erro ao deletar atividade:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== ROTAS DO COORDENADOR =====

// GET /api/coordinator/logs - Buscar logs do sistema
app.get('/api/coordinator/logs', isAuthenticated, hasRole(['coordinator', 'admin']), async (req, res) => {
  try {
    const { level, category, search, dateFrom, dateTo, limit = 100, offset = 0 } = req.query;

    // Mock data - em produï¿½ï¿½o viria do banco de dados
    const mockLogs = [
      {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        level: 'success',
        category: 'academic',
        action: 'Atividade Criada',
        description: 'Professor Joï¿½o Silva criou uma nova atividade "Exercï¿½cios de Matemï¿½tica" para a turma 9ï¿½ Ano A',
        userId: 'user-1',
        userName: 'Joï¿½o Silva',
        userRole: 'teacher',
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/120.0.0.0',
        metadata: { activityId: 'act-123', classId: 'class-456' }
      },
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        level: 'warning',
        category: 'system',
        action: 'Tentativa de Login Falhada',
        description: 'Tentativa de login com credenciais invï¿½lidas para o email admin@escola.com',
        ipAddress: '192.168.1.50',
        userAgent: 'Firefox/119.0.0.0',
        metadata: { attemptCount: 3, blocked: true }
      },
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        level: 'info',
        category: 'user',
        action: 'Perfil Atualizado',
        description: 'Coordenador Maria Santos atualizou suas informaï¿½ï¿½es pessoais',
        userId: 'user-2',
        userName: 'Maria Santos',
        userRole: 'coordinator',
        ipAddress: '192.168.1.75',
        userAgent: 'Chrome/120.0.0.0'
      },
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        level: 'error',
        category: 'academic',
        action: 'Falha no Upload',
        description: 'Falha ao fazer upload do arquivo "prova_final.pdf" - arquivo corrompido',
        userId: 'user-3',
        userName: 'Carlos Oliveira',
        userRole: 'teacher',
        ipAddress: '192.168.1.120',
        userAgent: 'Chrome/120.0.0.0',
        metadata: { fileName: 'prova_final.pdf', fileSize: '2.5MB', error: 'corrupted_file' }
      },
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        level: 'success',
        category: 'communication',
        action: 'Mensagem Enviada',
        description: 'Professor Ana Costa enviou mensagem para 25 alunos da turma 8ï¿½ Ano B',
        userId: 'user-4',
        userName: 'Ana Costa',
        userRole: 'teacher',
        ipAddress: '192.168.1.90',
        userAgent: 'Chrome/120.0.0.0',
        metadata: { messageId: 'msg-789', recipientCount: 25, classId: 'class-789' }
      },
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 18000000).toISOString(),
        level: 'info',
        category: 'system',
        action: 'Backup Realizado',
        description: 'Backup automï¿½tico do banco de dados concluï¿½do com sucesso',
        ipAddress: '192.168.1.1',
        userAgent: 'System/1.0.0',
        metadata: { backupSize: '1.2GB', duration: '15min' }
      },
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 21600000).toISOString(),
        level: 'warning',
        category: 'security',
        action: 'Acesso Suspeito',
        description: 'Mï¿½ltiplas tentativas de acesso de IP externo detectadas',
        ipAddress: '203.0.113.45',
        userAgent: 'Chrome/120.0.0.0',
        metadata: { attemptCount: 8, blocked: true, country: 'BR' }
      },
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 25200000).toISOString(),
        level: 'success',
        category: 'academic',
        action: 'Nota Lanï¿½ada',
        description: 'Professor Pedro Santos lanï¿½ou nota 8.5 para o aluno Maria Silva na atividade "Prova de Histï¿½ria"',
        userId: 'user-5',
        userName: 'Pedro Santos',
        userRole: 'teacher',
        ipAddress: '192.168.1.110',
        userAgent: 'Chrome/120.0.0.0',
        metadata: { grade: 8.5, studentId: 'student-123', activityId: 'act-456' }
      }
    ];

    // Aplicar filtros
    let filteredLogs = mockLogs;

    if (level && level !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    if (category && category !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.category === category);
    }

    if (search) {
      const searchLower = search.toString().toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.action.toLowerCase().includes(searchLower) ||
        log.description.toLowerCase().includes(searchLower) ||
        log.userName?.toLowerCase().includes(searchLower)
      );
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom.toString());
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo.toString());
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= toDate);
    }

    // Ordenar por timestamp (mais recente primeiro)
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Paginaï¿½ï¿½o
    const total = filteredLogs.length;
    const paginatedLogs = filteredLogs.slice(Number(offset), Number(offset) + Number(limit));

    // Estatï¿½sticas
    const stats = {
      total,
      byLevel: filteredLogs.reduce((acc, log) => {
        acc[log.level] = (acc[log.level] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byCategory: filteredLogs.reduce((acc, log) => {
        acc[log.category] = (acc[log.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    res.json({
      success: true,
      data: {
        logs: paginatedLogs,
        stats,
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + Number(limit) < total
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/coordinator/logs/terminal - Logs para terminal em tempo real
app.get('/api/coordinator/logs/terminal', isAuthenticated, hasRole(['coordinator', 'admin']), async (req, res) => {
  try {
    // Não registrar acesso a este endpoint de logs para evitar ruído
    const { search, limit } = req.query as any;
    const max = Math.min(Number(limit) || 50, 1000);
    const whereClause = search && String(search).trim().length > 0
      ? or(
          like(systemLogs.action, `%${search}%`),
          like(systemLogs.description, `%${search}%`),
          like(systemLogs.userName, `%${search}%`),
          like(systemLogs.userRole, `%${search}%`),
          like(systemLogs.ipAddress, `%${search}%`),
          like(systemLogs.userAgent, `%${search}%`)
        )
      : undefined;

    const query = db.select().from(systemLogs);
    const logs = await (whereClause ? query.where(whereClause) : query)
      .orderBy(desc(systemLogs.timestamp))
      .limit(max);
    
    const formattedLogs = logs.map((log) => ({
  id: log.id,
  timestamp: log.timestamp,
  level: log.level,
  action: log.action,
  description: log.description,
  userId: log.userId,
  userName: log.userName,
  userRole: log.userRole,
  ipAddress: log.ipAddress,
  userAgent: log.userAgent,
  deviceType: (log as any).deviceType,
  os: (log as any).os,
  osVersion: (log as any).osVersion,
  browser: (log as any).browser,
  browserVersion: (log as any).browserVersion,
  metadata: log.metadata ? JSON.parse(log.metadata) : null,
  code: log.code
}));

      // Transformar dados para o calendï¿½rio
      const transformedEvents = eventsList.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        type: event.type,
        start: event.startDate,
        end: event.endDate || event.startDate,
        color: event.color,
        className: event.className,
        subjectName: event.subjectName,
        location: event.location,
        creator: `${event.creatorName || ''} ${event.creatorLastName || ''}`.trim()
      }));

      console.log(`?? Calendï¿½rio acessado - ${transformedEvents.length} eventos encontrados`);

      res.json(transformedEvents);

    } catch (error) {
      console.error('? Erro ao buscar eventos:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Criar novo evento
  app.post('/api/events', isAuthenticated, hasRole(['coordinator', 'admin', 'teacher', 'director']), async (req, res) => {
    try {
      const { 
        title, 
        description, 
        type, 
        startDate, 
        endDate, 
        startTime,
        endTime,
        location, 
        color, 
        classId, 
        subjectId,
        classIds
      } = req.body;

      const eventId = uuidv4();

      // Corrigir timezone - garantir que a data seja salva no formato correto
      const formatDateForDB = (dateString: string) => {
        if (!dateString) return null;
        // Se a data jï¿½ estï¿½ no formato YYYY-MM-DD, adicionar horï¿½rio para evitar timezone issues
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return `${dateString}T12:00:00`; // Sem .000Z para manter horï¿½rio local
        }
        return dateString;
      };

      const formattedStartDate = formatDateForDB(startDate);
      const formattedEndDate = endDate ? formatDateForDB(endDate) : formattedStartDate;

      // Determinar status baseado no papel do usuï¿½rio
      const userRole = req.user?.role;
      const eventStatus = userRole === 'coordinator' ? 'pending' : 'active';

      // Normalizar horï¿½rios no servidor para garantir consistï¿½ncia
      const normalizedStartTime = (typeof startTime === 'string' && startTime.trim() !== '') ? startTime.trim() : '08:00';
      const normalizedEndTime = (typeof endTime === 'string' && endTime.trim() !== '') ? endTime.trim() : normalizedStartTime;

      console.log('?? Criando evento com horï¿½rios:', {
        received: { startTime, endTime },
        saved: { startTime: normalizedStartTime, endTime: normalizedEndTime },
        by: req.user?.email,
        date: formattedStartDate
      });

      if (Array.isArray(classIds) && classIds.length > 0) {
        const createdIds: string[] = [];
        for (const cid of classIds) {
          const id = uuidv4();
          await db.insert(events).values({
            id,
            title,
            description: description || '',
            type,
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            startTime: normalizedStartTime,
            endTime: normalizedEndTime,
            location: location || '',
            color: color || '#3B82F6',
            classId: cid || null,
            subjectId: subjectId || null,
            createdBy: req.user?.id,
            isGlobal: false,
            status: eventStatus,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          createdIds.push(id);
        }
        logger.calendarUpdated(req.user, type, req);
        return res.status(201).json({
          success: true,
          message: 'Eventos criados com sucesso',
          data: { ids: createdIds }
        });
      } else {
        await db.insert(events).values({
          id: eventId,
          title,
          description: description || '',
          type,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          startTime: normalizedStartTime,
          endTime: normalizedEndTime,
          location: location || '',
          color: color || '#3B82F6',
          classId: classId || null,
          subjectId: subjectId || null,
          createdBy: req.user?.id,
          isGlobal: !classId,
          status: eventStatus,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      console.log(`?? Evento criado: ${title} (${normalizedStartTime} - ${normalizedEndTime})`);

      // Log criaï¿½ï¿½o de evento no calendï¿½rio
      logger.calendarUpdated(req.user, type, req);

      res.status(201).json({
        success: true,
        message: 'Evento criado com sucesso',
        data: { id: eventId }
      });

    } catch (error) {
      console.error('? Erro ao criar evento:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Atualizar evento
  app.put('/api/events/:eventId', isAuthenticated, hasRole(['coordinator', 'admin']), async (req, res) => {
    try {
      const { eventId } = req.params;
      const updateData = req.body;

      await db.update(events)
        .set({
          ...updateData,
          updatedAt: new Date().toISOString()
        })
        .where(eq(events.id, eventId));

      console.log(`?? Evento ${eventId} atualizado`);

      res.json({
        success: true,
        message: 'Evento atualizado com sucesso'
      });

    } catch (error) {
      console.error('? Erro ao atualizar evento:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Excluir evento
  app.delete('/api/events/:eventId', isAuthenticated, hasRole(['coordinator', 'admin', 'director']), async (req, res) => {
    try {
      const { eventId } = req.params;

      await db.update(events)
        .set({
          status: 'cancelled',
          updatedAt: new Date().toISOString()
        })
        .where(eq(events.id, eventId));

      console.log(`??? Evento ${eventId} removido`);

      res.json({
        success: true,
        message: 'Evento removido com sucesso'
      });

    } catch (error) {
      console.error('? Erro ao remover evento:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Dashboard do coordenador - estatï¿½sticas gerais
  app.get('/api/coordinator/dashboard', isAuthenticated, hasRole(['coordinator', 'admin', 'teacher']), async (req, res) => {
    try {
      
      // Total de professores
      const totalTeachers = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.role, 'teacher'));

      // Total de alunos
      const totalStudents = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.role, 'student'));

      // Total de turmas
      const totalClasses = await db
        .select({ count: count() })
        .from(classes);

      // Atividades pendentes de aprovaï¿½ï¿½o
      const pendingActivities = await db
        .select({ count: count() })
        .from(activities)
        .where(eq(activities.approvedByCoordinator, 0));

      // Provas cadastradas
      const totalExams = await db
        .select({ count: count() })
        .from(exams);

      const dashboardData = {
        totals: {
          teachers: totalTeachers[0]?.count || 0,
          students: totalStudents[0]?.count || 0,
          classes: totalClasses[0]?.count || 0,
          pendingActivities: pendingActivities[0]?.count || 0,
          exams: totalExams[0]?.count || 0
        }
      };

      console.log('?? Dashboard do coordenador gerado');

      res.json(dashboardData);

    } catch (error) {
      console.error('? Erro ao gerar dashboard do coordenador:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Status do sistema para o coordenador
  app.get('/api/coordinator/system/status', isAuthenticated, hasRole(['coordinator', 'admin', 'teacher']), async (_req, res) => {
    try {
      let databaseConnected = true;
      try {
        // Pequeno teste de conexÃ£o realizando uma consulta simples
        await db.select({ count: count() }).from(users);
      } catch (_err) {
        databaseConnected = false;
      }

      return res.json({
        serverOnline: true,
        databaseConnected,
        apiWorking: true,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao obter status do sistema:', error);
      return res.status(500).json({
        serverOnline: false,
        databaseConnected: false,
        apiWorking: false,
        error: 'Falha ao obter status do sistema'
      });
    }
  });

  // API para coordenador buscar todas as notas de provas
  app.get('/api/coordinator/exam-grades', isAuthenticated, hasRole(['coordinator', 'admin']), async (req, res) => {
    try {
      console.log('?? Buscando notas de provas para coordenador...');

      // Buscar todas as notas de provas com informaï¿½ï¿½es das turmas
      const examGradesData = await db
        .select({
          id: examGrades.id,
          examId: examGrades.examId,
          studentId: examGrades.studentId,
          grade: examGrades.grade,
          isPresent: examGrades.isPresent,
          observations: examGrades.observations,
          gradedAt: examGrades.gradedAt,
          // Informaï¿½ï¿½es da prova
          examTitle: exams.title,
          examDate: exams.examDate,
          totalPoints: exams.totalPoints,
          // Informaï¿½ï¿½es da turma
          className: classes.name,
          classId: classes.id,
          // Informaï¿½ï¿½es do aluno
          studentName: sql`${users.firstName} || ' ' || ${users.lastName}`.as('studentName')
        })
        .from(examGrades)
        .leftJoin(exams, eq(examGrades.examId, exams.id))
        .leftJoin(classes, eq(exams.classId, classes.id))
        .leftJoin(users, eq(examGrades.studentId, users.id))
        .where(isNotNull(examGrades.grade)); // Apenas notas jï¿½ atribuï¿½das

      console.log(`?? Encontradas ${examGradesData.length} notas de provas`);

      res.json(examGradesData);

    } catch (error) {
      console.error('? Erro ao buscar notas de provas:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar todas as atividades da escola (coordenador)
  app.get('/api/coordinator/activities', isAuthenticated, hasRole(['coordinator', 'admin', 'teacher']), async (_req, res) => {
    try {
      console.log('?? Buscando atividades para coordenador...');

      const activitiesResult = await client.execute(`
        SELECT 
          a.id,
          a.title,
          a.description,
          a.dueDate,
          a.maxGrade,
          a.status,
          a.createdAt,
          a.classId,
          a.subjectId,
          a.teacherId,
          c.name AS className,
          s.name AS subjectName,
          u.firstName AS teacherFirstName,
          u.lastName AS teacherLastName
        FROM activities a
        LEFT JOIN classes c ON a.classId = c.id
        LEFT JOIN subjects s ON a.subjectId = s.id
        LEFT JOIN users u ON a.teacherId = u.id
        ORDER BY a.createdAt DESC
      `);

      const formattedActivities = activitiesResult.rows.map((activity: any) => ({
        id: activity.id,
        title: activity.title,
        description: activity.description,
        dueDate: activity.dueDate,
        maxGrade: activity.maxGrade,
        status: activity.status,
        createdAt: activity.createdAt,
        classId: activity.classId,
        className: activity.className,
        subjectId: activity.subjectId,
        subjectName: activity.subjectName,
        teacherId: activity.teacherId,
        teacherName: activity.teacherFirstName && activity.teacherLastName 
          ? `${activity.teacherFirstName} ${activity.teacherLastName}` 
          : 'Não informado',
        isActive: activity.status === 'active',
      }));

      res.json({ success: true, data: formattedActivities });
    } catch (error) {
      console.error('? Erro ao buscar atividades do coordenador:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // API simplificada de performance para coordenador
  app.get('/api/coordinator/performance-simple', isAuthenticated, hasRole(['coordinator', 'admin']), async (_req, res) => {
    try {
      console.log('?? Buscando dados simplificados de performance...');

      const studentsCount = await client.execute("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
      const teachersCount = await client.execute("SELECT COUNT(*) as count FROM users WHERE role = 'teacher'");
      const classesCount = await client.execute("SELECT COUNT(*) as count FROM classes WHERE status = 'active'");

      const avgPerformance = 7.2 + (Math.random() - 0.5) * 2;
      const attendanceRate = 85 + (Math.random() - 0.5) * 20;
      const completionRate = 80 + (Math.random() - 0.5) * 30;

      const topClass = await client.execute("SELECT name FROM classes WHERE status = 'active' LIMIT 1");
      const topPerformingClass = topClass.rows[0]?.name || 'N/A';

      let needsAttention = 0;
      if (avgPerformance < 7) needsAttention++;
      if (attendanceRate < 85) needsAttention++;
      if (completionRate < 80) needsAttention++;

      let overallTrend: 'up' | 'down' | 'stable' = 'stable';
      if (avgPerformance > 7.5 && attendanceRate > 90) overallTrend = 'up';
      else if (avgPerformance < 6.5 || attendanceRate < 80) overallTrend = 'down';

      const performanceData = {
        summary: {
          totalStudents: studentsCount.rows[0]?.count || 0,
          totalTeachers: teachersCount.rows[0]?.count || 0,
          avgPerformance: Math.max(0, Math.min(10, avgPerformance)),
          attendanceRate: Math.max(0, Math.min(100, attendanceRate)),
          completionRate: Math.max(0, Math.min(100, completionRate)),
        },
        keyMetrics: {
          topPerformingClass,
          needsAttention,
          overallTrend,
        },
      };

      res.json({ success: true, data: performanceData });
    } catch (error) {
      console.error('? Erro ao buscar performance simplificada:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Buscar dados completos das turmas para o coordenador
  app.get('/api/coordinator/classes', isAuthenticated, hasRole(['coordinator', 'admin']), async (_req, res) => {
    try {
      console.log('Buscando dados completos das turmas...');

      const classesResult = await client.execute(`
        SELECT 
          c.id,
          c.name,
          c.grade,
          c.section,
          c.status,
          c.createdAt,
          c.academicYear,
          c.capacity,
          COUNT(DISTINCT sc.studentId) as studentsCount,
          COUNT(DISTINCT a.id) as activitiesCount,
          COUNT(DISTINCT e.id) as examsCount
        FROM classes c
        LEFT JOIN studentClass sc ON c.id = sc.classId AND sc.status = 'active'
        LEFT JOIN activities a ON c.id = a.classId
        LEFT JOIN exams e ON c.id = e.classId
        GROUP BY c.id, c.name, c.grade, c.section, c.status, c.createdAt, c.academicYear, c.capacity
        ORDER BY c.name
      `);

      const classes = classesResult.rows;
      console.log(`Encontradas ${classes.length} turmas ativas/registradas`);

      const enrichedClasses = await Promise.all(
        classes.map(async (classItem: any) => {
          const teachersResult = await client.execute(`
            SELECT DISTINCT
              u.id,
              u.firstName,
              u.lastName,
              s.name as subjectName
            FROM classSubjects cs
            INNER JOIN users u ON cs.teacherId = u.id
            INNER JOIN subjects s ON cs.subjectId = s.id
            WHERE cs.classId = ?
          `, [classItem.id]);

          const teachers = teachersResult.rows.map((t: any) => ({
            id: t.id,
            name: `${t.firstName} ${t.lastName}`,
            subject: t.subjectName
          }));

          const lastActivityResult = await client.execute(`
            SELECT title, createdAt, status
            FROM activities
            WHERE classId = ?
            ORDER BY createdAt DESC
            LIMIT 1
          `, [classItem.id]);
          const lastActivity = lastActivityResult.rows[0] || null;

          const attendanceResult = await client.execute(`
            SELECT 
              COUNT(*) as totalRecords,
              SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as presentCount
            FROM attendance 
            WHERE classId = ?
          `, [classItem.id]);
          const attendanceData = attendanceResult.rows[0] || { totalRecords: 0, presentCount: 0 };
          const attendanceRate = attendanceData.totalRecords > 0
            ? Math.round((attendanceData.presentCount / attendanceData.totalRecords) * 100)
            : 0;

          const gradesResult = await client.execute(`
            SELECT AVG(latest_grade) as avgGrade, COUNT(*) as totalGrades
            FROM (
              SELECT 
                eg.studentId,
                eg.grade as latest_grade,
                ROW_NUMBER() OVER (PARTITION BY eg.studentId ORDER BY eg.updatedAt DESC) as rn
              FROM examGrades eg
              INNER JOIN exams e ON eg.examId = e.id
              WHERE e.classId = ? AND eg.grade IS NOT NULL
            ) ranked_grades
            WHERE rn = 1
          `, [classItem.id]);
          const gradesData = gradesResult.rows[0] || { avgGrade: 0, totalGrades: 0 };
          const avgGrade = gradesData.totalGrades > 0 && gradesData.avgGrade
            ? parseFloat(gradesData.avgGrade as any).toFixed(1)
            : 0;

          return {
            id: classItem.id,
            name: classItem.name,
            grade: classItem.grade,
            section: classItem.section,
            status: classItem.status,
            createdAt: classItem.createdAt,
            academicYear: classItem.academicYear,
            capacity: classItem.capacity,
            studentsCount: classItem.studentsCount || 0,
            activitiesCount: classItem.activitiesCount || 0,
            examsCount: classItem.examsCount || 0,
            teachers,
            lastActivity,
            attendanceRate,
            avgGrade: parseFloat(avgGrade as any),
            totalGrades: gradesData.totalGrades || 0,
            totalAttendanceRecords: attendanceData.totalRecords || 0,
          };
        })
      );

      res.json({ success: true, data: enrichedClasses });
    } catch (error) {
      console.error('Erro ao buscar turmas do coordenador:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // ===== EVENTOS GLOBAIS DO COORDENADOR =====
  
  // Criar evento global (coordenador) - VERSï¿½O SIMPLIFICADA
  app.post('/api/coordinator/global-events', isAuthenticated, hasRole(['coordinator', 'admin']), async (req, res) => {
    try {
      const { title, description, type, startDate, endDate, startTime, endTime, location, color, classId, isGlobal } = req.body;
      const user = req.user;
      
      console.log('?? Criando evento:', { title, type, startDate, endDate, startTime, endTime, classId, isGlobal });

      // Corrigir timezone - garantir que a data seja salva no formato correto
      const formatDateForDB = (dateString: string, timeString?: string) => {
        if (!dateString) return null;
        // Se a data jï¿½ estï¿½ no formato YYYY-MM-DD, adicionar horï¿½rio para evitar timezone issues
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const time = timeString || '12:00';
          // Usar horï¿½rio local em vez de UTC para evitar problemas de timezone
          return `${dateString}T${time}:00`; // Sem .000Z para manter horï¿½rio local
        }
        return dateString;
      };

      const formattedStartDate = formatDateForDB(startDate, startTime);
      const formattedEndDate = endDate ? formatDateForDB(endDate, endTime || startTime) : formattedStartDate;

      console.log('?? Datas formatadas:', { originalStart: startDate, formattedStart: formattedStartDate, originalEnd: endDate, formattedEnd: formattedEndDate });

      // Usar SQL direto sem coluna isGlobal por enquanto
      const eventId = crypto.randomUUID();
      
      await client.execute({
        sql: `INSERT INTO events (
          id, title, description, type, startDate, endDate, location, color,
          classId, subjectId, createdBy, status, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          eventId,
          title || null,
          description || null,
          type || 'event',
          formattedStartDate,
          formattedEndDate,
          location || null,
          color || '#F97316',
          classId || null, // classId especï¿½fico ou null para global
          null, // subjectId
          user.id,
          'pending',
          new Date().toISOString(),
          new Date().toISOString()
        ]
      });
      
      console.log('? Evento global criado com sucesso:', eventId);
      res.status(201).json({ 
        success: true, 
        message: "Evento global criado com sucesso", 
        event: {
          id: eventId,
          title,
          description,
          type,
          startDate,
          endDate,
          location,
          color,
          isGlobal: true
        }
      });
      
    } catch (error) {
      console.error('? Erro ao criar evento global:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar eventos globais (coordenador) - VERSï¿½O SIMPLIFICADA
  app.get('/api/coordinator/global-events', isAuthenticated, hasRole(['coordinator', 'admin']), async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      let globalEvents;
      
      // Buscar todos os eventos do coordenador com informaï¿½ï¿½es da turma
      if (startDate && endDate) {
        const result = await client.execute({
          sql: `SELECT 
                  e.*,
                  c.name as className
                FROM events e
                LEFT JOIN classes c ON e.classId = c.id
                WHERE e.createdBy = ? 
                AND e.startDate >= ? 
                AND e.startDate <= ?
                ORDER BY e.startDate`,
          args: [req.user.id, startDate, endDate]
        });
        globalEvents = result.rows;
      } else {
        const result = await client.execute({
          sql: `SELECT 
                  e.*,
                  c.name as className
                FROM events e
                LEFT JOIN classes c ON e.classId = c.id
                WHERE e.createdBy = ? 
                ORDER BY e.startDate`,
          args: [req.user.id]
        });
        globalEvents = result.rows;
      }
      
      // Adicionar isGlobal baseado na presenï¿½a de classId
      const eventsWithGlobal = globalEvents.map(event => ({
        ...event,
        isGlobal: !event.classId // Se nï¿½o tem classId, ï¿½ global
      }));
      
      console.log(`?? Eventos globais encontrados: ${eventsWithGlobal.length}`);
      res.json(eventsWithGlobal);
      
    } catch (error) {
      console.error('? Erro ao buscar eventos globais:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar eventos para professores (incluindo globais)
  app.get('/api/teacher/:teacherId/events', isAuthenticated, hasRole(['teacher', 'coordinator', 'admin']), async (req, res) => {
    try {
      const { teacherId } = req.params;
      const { startDate, endDate } = req.query;
      
      // Buscar eventos especï¿½ficos do professor (provas e atividades)
      let teacherEvents;
      if (startDate && endDate) {
        const result = await client.execute({
          sql: 'SELECT * FROM events WHERE createdBy = ? AND startDate >= ? AND startDate <= ?',
          args: [teacherId, startDate, endDate]
        });
        teacherEvents = result.rows;
      } else {
        const result = await client.execute({
          sql: 'SELECT * FROM events WHERE createdBy = ?',
          args: [teacherId]
        });
        teacherEvents = result.rows;
      }
      
      // Buscar turmas do professor para filtrar eventos especï¿½ficos
      const teacherClassesResult = await client.execute(`
        SELECT DISTINCT classId 
        FROM classSubjects 
        WHERE teacherId = ?
      `, [teacherId]);
      
      const teacherClassIds = teacherClassesResult.rows.map(row => row.classId);
      console.log(`?? Turmas do professor ${teacherId}:`, teacherClassIds);
      
      // Buscar eventos globais do coordenador (eventos criados pelo coordenador)
      let globalEvents;
      
      // Se o professor nï¿½o tem turmas, sï¿½ mostra eventos globais
      if (teacherClassIds.length === 0) {
        if (startDate && endDate) {
          const result = await client.execute({
            sql: `SELECT 
                    e.*,
                    c.name as className
                  FROM events e
                  LEFT JOIN classes c ON e.classId = c.id
                  LEFT JOIN users u ON e.createdBy = u.id
                  WHERE u.role = 'coordinator'
                  AND e.startDate >= ? 
                  AND e.startDate <= ?
                  AND e.classId IS NULL
                  AND e.status = 'active'`,
            args: [startDate, endDate]
          });
          globalEvents = result.rows;
        } else {
          const result = await client.execute({
            sql: `SELECT 
                    e.*,
                    c.name as className
                  FROM events e
                  LEFT JOIN classes c ON e.classId = c.id
                  LEFT JOIN users u ON e.createdBy = u.id
                  WHERE u.role = 'coordinator'
                  AND e.classId IS NULL
                  AND e.status = 'active'`,
            args: []
          });
          globalEvents = result.rows;
        }
      } else {
        // Professor tem turmas - mostrar eventos globais + eventos das suas turmas
        if (startDate && endDate) {
          const result = await client.execute({
            sql: `SELECT 
                    e.*,
                    c.name as className
                  FROM events e
                  LEFT JOIN classes c ON e.classId = c.id
                  LEFT JOIN users u ON e.createdBy = u.id
                  WHERE u.role = 'coordinator'
                  AND e.startDate >= ? 
                  AND e.startDate <= ?
                  AND (e.classId IS NULL OR e.classId IN (${teacherClassIds.map(() => '?').join(',')}))
                  AND e.status = 'active'`,
            args: [startDate, endDate, ...teacherClassIds]
          });
          globalEvents = result.rows;
        } else {
          const result = await client.execute({
            sql: `SELECT 
                    e.*,
                    c.name as className
                  FROM events e
                  LEFT JOIN classes c ON e.classId = c.id
                  LEFT JOIN users u ON e.createdBy = u.id
                  WHERE u.role = 'coordinator'
                  AND (e.classId IS NULL OR e.classId IN (${teacherClassIds.map(() => '?').join(',')}))
                  AND e.status = 'active'`,
            args: [...teacherClassIds]
          });
          globalEvents = result.rows;
        }
      }
      
      // Adicionar isGlobal baseado na presenï¿½a de classId
      const globalEventsWithFlag = globalEvents.map(event => ({
        ...event,
        isGlobal: !event.classId // Se nï¿½o tem classId, ï¿½ global
      }));
      
      // Combinar eventos
      const allEvents = [...teacherEvents, ...globalEventsWithFlag].sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
      
      console.log(`?? Eventos do professor ${teacherId}: ${teacherEvents.length} especï¿½ficos + ${globalEvents.length} globais = ${allEvents.length} total`);
      res.json({ data: allEvents });
      
    } catch (error) {
      console.error('? Erro ao buscar eventos do professor:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar eventos do calendÃ¡rio para coordenador
  app.get('/api/coordinator/calendar/events', isAuthenticated, hasRole(['coordinator', 'admin', 'director', 'teacher', 'student']), async (req, res) => {
    try {
      const user = req.user as any;
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

      console.log('ðŸ“† Buscando eventos do calendÃ¡rio para coordenador...');

      // Regras de visibilidade:
      // - Coordenador vÃª seus prÃ³prios eventos com status 'pendente' ou 'active'
      // - Coordenador vÃª eventos do diretor com status 'active'
      // - Filtro por intervalo usando DATE(e.startDate) quando fornecido

      const baseSelect = `
        SELECT 
          e.*, 
          u.firstName || ' ' || u.lastName AS creatorName,
          c.name AS className,
          s.name AS subjectName
        FROM events e
        LEFT JOIN users u ON e.createdBy = u.id
        LEFT JOIN classes c ON e.classId = c.id
        LEFT JOIN subjects s ON e.subjectId = s.id
        WHERE (
          (u.role = 'coordinator' AND e.createdBy = ? AND e.status IN ('pending','active'))
          OR (u.role = 'director' AND e.status = 'active')
        )
      `;

      let sql = baseSelect;
      const args: any[] = [user.id];

      if (startDate && endDate) {
        sql += ` AND DATE(e.startDate) >= ? AND DATE(e.startDate) <= ?`;
        args.push(startDate, endDate);
      }

      sql += ` ORDER BY DATE(e.startDate) ASC, e.startTime ASC`;

      const coordinatorEventsResult = await client.execute({ sql, args });
      const coordinatorEvents = coordinatorEventsResult.rows;

      const formattedEvents = coordinatorEvents.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        type: event.type,
        date: event.startDate,
        startDate: event.startDate,
        endDate: event.endDate,
        startTime: event.startTime,
        endTime: event.endTime,
        color: event.color,
        icon: event.type === 'exam' ? 'ðŸ“„' : event.type === 'homework' ? 'ðŸ“' : 'ðŸ“Œ',
        location: event.location,
        className: event.className,
        subjectName: event.subjectName,
        creatorName: event.creatorName,
        status: event.status,
        isGlobal: event.isGlobal,
        createdAt: event.createdAt
      }));

      console.log(`âœ… Encontrados ${formattedEvents.length} eventos para coordenador`);

      res.json({ success: true, data: formattedEvents });
    } catch (error) {
      console.error('âŒ Erro ao buscar eventos do coordenador:', error);
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  });

  app.get('/api/director/calendar/events', isAuthenticated, hasRole(['director', 'admin']), async (req, res) => {
    try {
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

      const baseSelect = `
        SELECT 
          e.*, 
          u.firstName || ' ' || u.lastName AS creatorName,
          c.name AS className,
          s.name AS subjectName
        FROM events e
        LEFT JOIN users u ON e.createdBy = u.id
        LEFT JOIN classes c ON e.classId = c.id
        LEFT JOIN subjects s ON e.subjectId = s.id
        WHERE e.status = 'active'
      `;

      let sql = baseSelect;
      const args: any[] = [];

      if (startDate && endDate) {
        sql += ` AND DATE(e.startDate) >= ? AND DATE(e.startDate) <= ?`;
        args.push(startDate, endDate);
      }

      sql += ` ORDER BY DATE(e.startDate) ASC, e.startTime ASC`;

      const result = await client.execute({ sql, args });
      const eventsForDirector = result.rows;

      const formattedEvents = eventsForDirector.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        type: event.type,
        date: event.startDate,
        startDate: event.startDate,
        endDate: event.endDate,
        startTime: event.startTime,
        endTime: event.endTime,
        color: event.color,
        location: event.location,
        className: event.className,
        subjectName: event.subjectName,
        creatorName: event.creatorName,
        status: event.status,
        isGlobal: event.isGlobal,
        createdAt: event.createdAt
      }));

      res.json({ success: true, data: formattedEvents });
    } catch (error) {
      console.error('Erro ao buscar eventos do diretor:', error);
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  });

  // Buscar eventos para alunos (incluindo globais)
  app.get('/api/student/:studentId/events', isAuthenticated, hasRole(['student', 'coordinator', 'admin']), async (req, res) => {
    try {
      const { studentId } = req.params;
      const { startDate, endDate } = req.query;
      
      // Buscar turma do aluno
      const studentClassResult = await client.execute({
        sql: 'SELECT classId FROM studentClass WHERE studentId = ? AND status = ? LIMIT 1',
        args: [studentId, 'active']
      });
      
      let classEvents = [];
      if (studentClassResult.rows.length > 0) {
        const classId = studentClassResult.rows[0].classId;
        
        // Buscar eventos da turma do aluno
        if (startDate && endDate) {
          const result = await client.execute({
            sql: 'SELECT * FROM events WHERE classId = ? AND startDate >= ? AND startDate <= ?',
            args: [classId, startDate, endDate]
          });
          classEvents = result.rows;
        } else {
          const result = await client.execute({
            sql: 'SELECT * FROM events WHERE classId = ?',
            args: [classId]
          });
          classEvents = result.rows;
        }
      }
      
      // Buscar eventos globais do coordenador (eventos criados pelo coordenador)
      let globalEvents;
      const studentClassId = studentClassResult.rows.length > 0 ? studentClassResult.rows[0].classId : null;
      
      if (startDate && endDate) {
        const result = await client.execute({
          sql: `SELECT 
                  e.*,
                  c.name as className
                FROM events e
                LEFT JOIN classes c ON e.classId = c.id
                LEFT JOIN users u ON e.createdBy = u.id
                WHERE u.role = 'coordinator'
                AND e.startDate >= ? 
                AND e.startDate <= ?
                AND e.classId IS NULL
                AND e.status = 'active'`,
          args: [startDate, endDate, studentClassId]
        });
        globalEvents = result.rows;
      } else {
        const result = await client.execute({
          sql: `SELECT 
                  e.*,
                  c.name as className
                FROM events e
                LEFT JOIN classes c ON e.classId = c.id
                LEFT JOIN users u ON e.createdBy = u.id
                WHERE u.role = 'coordinator'
                AND e.classId IS NULL
                AND e.status = 'active'`,
          args: [studentClassId]
        });
        globalEvents = result.rows;
      }
      
      // Adicionar isGlobal baseado na presenï¿½a de classId
      const globalEventsWithFlag = globalEvents.map(event => ({
        ...event,
        isGlobal: !event.classId // Se nï¿½o tem classId, ï¿½ global
      }));
      
      // Combinar eventos
      const allEvents = [...classEvents, ...globalEventsWithFlag].sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
      
      console.log(`?? Eventos do aluno ${studentId}: ${classEvents.length} da turma + ${globalEvents.length} globais = ${allEvents.length} total`);
      res.json({ data: allEvents });
      
    } catch (error) {
      console.error('? Erro ao buscar eventos do aluno:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar eventos pendentes de aprovaï¿½ï¿½o (diretor)
  app.get('/api/director/pending-events', isAuthenticated, hasRole(['director', 'admin']), async (req, res) => {
    try {
      console.log('?? Buscando eventos pendentes de aprovaï¿½ï¿½o...');
      
      const pendingEvents = await db
        .select({
          id: events.id,
          title: events.title,
          description: events.description,
          type: events.type,
          startDate: events.startDate,
          endDate: events.endDate,
          location: events.location,
          color: events.color,
          classId: events.classId,
          subjectId: events.subjectId,
          createdBy: events.createdBy,
          isGlobal: events.isGlobal,
          status: events.status,
          createdAt: events.createdAt,
          updatedAt: events.updatedAt,
          creatorName: sql`${users.firstName} || ' ' || ${users.lastName}`.as('creatorName'),
          creatorRole: users.role,
          className: classes.name,
          subjectName: subjects.name
        })
        .from(events)
        .leftJoin(users, eq(events.createdBy, users.id))
        .leftJoin(classes, eq(events.classId, classes.id))
        .leftJoin(subjects, eq(events.subjectId, subjects.id))
        .where(eq(events.status, 'pending'))
        .orderBy(desc(events.createdAt));

      console.log(`? Encontrados ${pendingEvents.length} eventos pendentes`);

      res.json({
        success: true,
        data: pendingEvents
      });
    } catch (error) {
      console.error('? Erro ao buscar eventos pendentes:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  });

  // Aprovar evento (diretor)
  app.post('/api/director/events/:eventId/approve', isAuthenticated, hasRole(['director', 'admin']), async (req, res) => {
    try {
      const { eventId } = req.params;
      const user = req.user as any;

      console.log(`? Aprovando evento ${eventId} pelo diretor ${user.firstName} ${user.lastName}`);

      // Atualizar status do evento para 'active'
      await db
        .update(events)
        .set({ 
          status: 'active',
          updatedAt: new Date().toISOString()
        })
        .where(eq(events.id, eventId));

      console.log(`? Evento ${eventId} aprovado com sucesso`);

      res.json({
        success: true,
        message: 'Evento aprovado com sucesso'
      });
    } catch (error) {
      console.error('? Erro ao aprovar evento:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  });

  // ===================== PERÍODOS ACADÊMICOS =====================
  const PERIODS_KEY = 'academic_periods';

  // Utilitários para ler/gravar períodos no settings
  async function readPeriods() {
    const rows = await db
      .select({ id: settings.id, key: settings.key, value: settings.value })
      .from(settings)
      .where(eq(settings.key, PERIODS_KEY));
    if (rows.length === 0) {
      return [] as any[];
    }
    try {
      return JSON.parse(rows[0].value || '[]');
    } catch {
      return [] as any[];
    }
  }

  async function writePeriods(periods: any[]) {
    const existing = await db
      .select({ id: settings.id })
      .from(settings)
      .where(eq(settings.key, PERIODS_KEY));
    const payload = {
      key: PERIODS_KEY,
      value: JSON.stringify(periods),
      description: 'Lista de períodos acadêmicos gerenciados pelo diretor',
      category: 'academic' as any,
      updatedBy: (req.user as any)?.id,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    if (existing.length === 0) {
      await db.insert(settings).values({ id: crypto.randomUUID(), ...payload });
    } else {
      await db.update(settings).set(payload).where(eq(settings.key, PERIODS_KEY));
    }
  }

  // Listar períodos (público: somente abertos)
  app.get('/api/periods/open', isAuthenticated, hasRole(['student', 'teacher', 'coordinator', 'admin', 'director']), async (req, res) => {
    try {
      const periods = await readPeriods();
      const openOnly = periods.filter((p: any) => p.status === 'open');
      res.json({ success: true, data: openOnly });
    } catch (error) {
      console.error('Erro ao listar períodos:', error);
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  });
  app.get('/api/periods/all', isAuthenticated, hasRole(['student', 'teacher', 'coordinator', 'admin', 'director']), async (req, res) => {
    try {
      const periods = await readPeriods();
      res.json({ success: true, data: periods });
    } catch (error) {
      console.error('Erro ao listar todos os períodos:', error);
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  });

  // Listar todos os períodos (diretor)
  app.get('/api/director/periods', isAuthenticated, hasRole(['director', 'admin']), async (req, res) => {
    try {
      const periods = await readPeriods();
      res.json({ success: true, data: periods });
    } catch (error) {
      console.error('Erro ao listar períodos (diretor):', error);
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  });

  // Criar período (diretor)
  app.post('/api/director/periods', isAuthenticated, hasRole(['director', 'admin']), async (req, res) => {
    try {
      const { name, startDate, endDate, description } = req.body;
      const periods = await readPeriods();
      const id = crypto.randomUUID();
      const newPeriod = {
        id,
        name,
        startDate,
        endDate,
        status: 'pending',
        description: description || '',
        createdAt: new Date().toISOString()
      };
      await writePeriods([...periods, newPeriod]);
      res.status(201).json({ success: true, data: newPeriod });
    } catch (error) {
      console.error('Erro ao criar período:', error);
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  });

  // Abrir período (diretor)
  app.patch('/api/director/periods/:id/open', isAuthenticated, hasRole(['director', 'admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const periods = await readPeriods();
      const updated = periods.map((p: any) => (p.id === id ? { ...p, status: 'open', updatedAt: new Date().toISOString() } : p));
      await writePeriods(updated);
      res.json({ success: true });
    } catch (error) {
      console.error('Erro ao abrir período:', error);
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  });

  // Fechar período (diretor)
  app.patch('/api/director/periods/:id/close', isAuthenticated, hasRole(['director', 'admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const periods = await readPeriods();
      const updated = periods.map((p: any) => (p.id === id ? { ...p, status: 'closed', updatedAt: new Date().toISOString() } : p));
      await writePeriods(updated);
      res.json({ success: true });
    } catch (error) {
      console.error('Erro ao fechar período:', error);
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  });

  // Remover período (diretor)
  app.delete('/api/director/periods/:id', isAuthenticated, hasRole(['director', 'admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const periods = await readPeriods();
      const updated = periods.filter((p: any) => p.id !== id);
      await writePeriods(updated);
      res.json({ success: true });
    } catch (error) {
      console.error('Erro ao remover período:', error);
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  });

  // Rejeitar evento (diretor)
  app.post('/api/director/events/:eventId/reject', isAuthenticated, hasRole(['director', 'admin']), async (req, res) => {
    try {
      const { eventId } = req.params;
      const user = req.user as any;

      console.log(`? Rejeitando evento ${eventId} pelo diretor ${user.firstName} ${user.lastName}`);

      // Atualizar status do evento para 'cancelled'
      await db
        .update(events)
        .set({ 
          status: 'cancelled',
          updatedAt: new Date().toISOString()
        })
        .where(eq(events.id, eventId));

      console.log(`? Evento ${eventId} rejeitado com sucesso`);

      res.json({
        success: true,
        message: 'Evento rejeitado com sucesso'
      });
    } catch (error) {
      console.error('? Erro ao rejeitar evento:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  });

  // Excluir evento
  app.delete('/api/events/:eventId', isAuthenticated, hasRole(['director', 'admin', 'coordinator']), async (req, res) => {
    try {
      const { eventId } = req.params;
      const user = req.user as any;

      console.log(`??? Excluindo evento ${eventId} pelo usuï¿½rio ${user.firstName} ${user.lastName}`);

      // Verificar se o evento existe
      const existingEvent = await db
        .select()
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);

      if (existingEvent.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Evento nï¿½o encontrado'
        });
      }

      // Verificar permissï¿½es (diretor e admin podem excluir qualquer evento, coordenador apenas os prï¿½prios)
      if (user.role !== 'director' && user.role !== 'admin' && existingEvent[0].createdBy !== user.id) {
        return res.status(403).json({
          success: false,
          message: 'Sem permissï¿½o para excluir este evento'
        });
      }

      // Excluir o evento
      await db
        .delete(events)
        .where(eq(events.id, eventId));

      console.log(`? Evento ${eventId} excluï¿½do com sucesso`);

      res.json({
        success: true,
        message: 'Evento excluï¿½do com sucesso'
      });
    } catch (error) {
      console.error('? Erro ao excluir evento:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  });

  // Deletar evento global (coordenador)
  app.delete('/api/coordinator/global-events/:id', isAuthenticated, hasRole(['coordinator', 'admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      
      console.log('??? Deletando evento global:', id);

      // Verificar se o evento existe e pertence ao coordenador
      const event = await client.execute({
        sql: 'SELECT * FROM events WHERE id = ? AND createdBy = ?',
        args: [id, user.id]
      });

      if (event.rows.length === 0) {
        return res.status(404).json({ message: "Evento nï¿½o encontrado ou vocï¿½ nï¿½o tem permissï¿½o para deletï¿½-lo" });
      }

      // Deletar o evento
      await client.execute({
        sql: 'DELETE FROM events WHERE id = ?',
        args: [id]
      });
      
      console.log('? Evento global deletado com sucesso:', id);
      res.json({ success: true, message: "Evento global deletado com sucesso" });
      
    } catch (error) {
      console.error('? Erro ao deletar evento global:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== FIM DOS EVENTOS GLOBAIS =====

  // ==================== ROTAS DE FREQUï¿½NCIA ====================
  
  // Buscar histï¿½rico de frequï¿½ncia de um aluno
  app.get('/api/attendance/student/:studentId/history', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { studentId } = req.params;
      const user = req.user as any;

      console.log(`?? Buscando histï¿½rico de frequï¿½ncia do aluno ${studentId}`);

      // Buscar registros de frequï¿½ncia do aluno
      const attendanceRecords = await db
        .select({
          id: attendance.id,
          date: attendance.date,
          status: attendance.status,
          subjectName: subjects.name,
          className: classes.name
        })
        .from(attendance)
        .leftJoin(subjects, eq(attendance.subjectId, subjects.id))
        .leftJoin(classes, eq(attendance.classId, classes.id))
        .where(eq(attendance.studentId, studentId))
        .orderBy(desc(attendance.date));

      // Calcular estatï¿½sticas
      const totalRecords = attendanceRecords.length;
      const presentCount = attendanceRecords.filter(record => record.status === 'present').length;
      const absentCount = totalRecords - presentCount;
      const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

      const stats = {
        totalRecords,
        presentCount,
        absentCount,
        attendanceRate
      };

      res.json({ success: true, data: attendanceRecords, stats });

    } catch (error) {
      console.error('Erro ao buscar histï¿½rico de frequï¿½ncia:', error);
      res.status(500).json({ message: error.message || "Erro interno do servidor" });
    }
  });
  
  // Buscar alunos de uma turma para frequï¿½ncia
  app.get('/api/attendance/class/:classId/students', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { classId } = req.params;
      const user = req.user as any;

      console.log(`?? Buscando alunos da turma ${classId} para frequï¿½ncia`);

      // Verificar se o professor tem acesso ï¿½ turma
      const teacherClass = await db
        .select()
        .from(classSubjects)
        .where(and(
          eq(classSubjects.classId, classId),
          eq(classSubjects.teacherId, user.id),
          eq(classSubjects.status, 'active')
        ))
        .limit(1);

      if (teacherClass.length === 0) {
        return res.status(403).json({ message: "Acesso negado a esta turma" });
      }

      // Buscar alunos da turma
      const students = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          registrationNumber: users.registrationNumber,
          status: users.status
        })
        .from(users)
        .innerJoin(studentClass, eq(users.id, studentClass.studentId))
        .where(and(
          eq(studentClass.classId, classId),
          eq(users.role, 'student'),
          eq(users.status, 'active')
        ))
        .orderBy(users.firstName, users.lastName);

      console.log(`? Encontrados ${students.length} alunos na turma`);

      res.json(students);
    } catch (error) {
      console.error('Erro ao buscar alunos para frequï¿½ncia:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Marcar frequï¿½ncia
  app.post('/api/attendance', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const user = req.user as any;
      const { classId, subjectId, date, attendanceRecords } = req.body;

      console.log(`?? Salvando frequï¿½ncia para turma ${classId}, disciplina ${subjectId}, data ${date}`);
      console.log(`?? Registros:`, attendanceRecords);

      // Verificar se o professor tem acesso ï¿½ turma e disciplina
      const teacherClass = await db
        .select()
        .from(classSubjects)
        .where(and(
          eq(classSubjects.classId, classId),
          eq(classSubjects.subjectId, subjectId),
          eq(classSubjects.teacherId, user.id),
          eq(classSubjects.status, 'active')
        ))
        .limit(1);

      if (teacherClass.length === 0) {
        return res.status(403).json({ message: "Acesso negado a esta turma/disciplina" });
      }

      let savedCount = 0;

      // Salvar cada registro de frequï¿½ncia
      for (const record of attendanceRecords) {
        try {
          // Verificar se jï¿½ existe um registro para este aluno nesta data
          const existingRecord = await db
            .select()
            .from(attendance)
            .where(and(
              eq(attendance.studentId, record.studentId),
              eq(attendance.classId, classId),
              eq(attendance.subjectId, subjectId),
              eq(attendance.date, date)
            ))
            .limit(1);

          if (existingRecord.length > 0) {
            // Atualizar registro existente
            await db
              .update(attendance)
              .set({
                status: record.status,
                updatedAt: new Date().toISOString()
              })
              .where(eq(attendance.id, existingRecord[0].id));
          } else {
            // Criar novo registro
            await db.insert(attendance).values({
              id: crypto.randomUUID(),
              studentId: record.studentId,
              classId: classId,
              subjectId: subjectId,
              teacherId: user.id,
              date: date,
              status: record.status,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
          savedCount++;
        } catch (recordError) {
          console.error(`Erro ao salvar registro do aluno ${record.studentId}:`, recordError);
        }
      }

      console.log(`? Frequï¿½ncia salva com sucesso! ${savedCount} registros salvos.`);
      
      res.status(201).json({
        message: "Frequï¿½ncia marcada com sucesso",
        recordsCount: savedCount
      });
    } catch (error) {
      console.error('Erro ao marcar frequï¿½ncia:', error);
      res.status(500).json({ message: error.message || "Erro interno do servidor" });
    }
  });

  // Buscar frequï¿½ncia de uma turma em uma data especï¿½fica
  app.get('/api/attendance/class/:classId/subject/:subjectId/date/:date', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { classId, subjectId, date } = req.params;
      const user = req.user as any;

      console.log(`?? Buscando frequï¿½ncia para turma ${classId}, disciplina ${subjectId}, data ${date}`);

      // Verificar se o professor tem acesso ï¿½ turma e disciplina
      const teacherClass = await db
        .select()
        .from(classSubjects)
        .where(and(
          eq(classSubjects.classId, classId),
          eq(classSubjects.subjectId, subjectId),
          eq(classSubjects.teacherId, user.id),
          eq(classSubjects.status, 'active')
        ))
        .limit(1);

      if (teacherClass.length === 0) {
        return res.status(403).json({ message: "Acesso negado a esta turma/disciplina" });
      }

      // Buscar registros de frequï¿½ncia existentes
      const attendanceRecords = await db
        .select({
          id: attendance.id,
          studentId: attendance.studentId,
          status: attendance.status
        })
        .from(attendance)
        .where(and(
          eq(attendance.classId, classId),
          eq(attendance.subjectId, subjectId),
          eq(attendance.date, date)
        ));

      console.log(`?? Encontrados ${attendanceRecords.length} registros de frequï¿½ncia`);
      res.json(attendanceRecords);
    } catch (error) {
      console.error('Erro ao buscar frequï¿½ncia:', error);
      res.status(500).json({ message: error.message || "Erro interno do servidor" });
    }
  });

  // Atualizar frequï¿½ncia individual
  app.put('/api/attendance/:id', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const user = req.user as any;

      console.log(`?? Atualizando frequï¿½ncia ${id} para status: ${status}`);

      // Verificar se o registro existe e pertence ao professor
      const attendanceRecord = await db
        .select()
        .from(attendance)
        .where(eq(attendance.id, id))
        .limit(1);

      if (attendanceRecord.length === 0) {
        return res.status(404).json({ message: "Registro de frequï¿½ncia nï¿½o encontrado" });
      }

      if (attendanceRecord[0].teacherId !== user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Validar status - apenas "present" ou "absent"
      if (!['present', 'absent'].includes(status)) {
        return res.status(400).json({ 
          message: `Status invï¿½lido: ${status}. Apenas 'present' ou 'absent' sï¿½o permitidos.` 
        });
      }

      // Atualizar registro
      await db
        .update(attendance)
        .set({
          status,
          updatedAt: new Date().toISOString()
        })
        .where(eq(attendance.id, id));

      console.log(`? Frequï¿½ncia ${id} atualizada com sucesso`);

      res.json({ message: "Frequï¿½ncia atualizada com sucesso" });
    } catch (error) {
      console.error('Erro ao atualizar frequï¿½ncia:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar relatï¿½rio de frequï¿½ncia de um aluno
  app.get('/api/attendance/student/:studentId/class/:classId/subject/:subjectId', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { studentId, classId, subjectId } = req.params;
      const user = req.user as any;

      console.log(`?? Buscando relatï¿½rio de frequï¿½ncia do aluno ${studentId}`);

      // Verificar se o professor tem acesso ï¿½ turma e disciplina
      const teacherClass = await db
        .select()
        .from(classSubjects)
        .where(and(
          eq(classSubjects.classId, classId),
          eq(classSubjects.subjectId, subjectId),
          eq(classSubjects.teacherId, user.id),
          eq(classSubjects.status, 'active')
        ))
        .limit(1);

      if (teacherClass.length === 0) {
        return res.status(403).json({ message: "Acesso negado a esta turma/disciplina" });
      }

      // Buscar todos os registros de frequï¿½ncia do aluno
      const attendanceRecords = await db
        .select({
          date: attendance.date,
          status: attendance.status
        })
        .from(attendance)
        .where(and(
          eq(attendance.studentId, studentId),
          eq(attendance.classId, classId),
          eq(attendance.subjectId, subjectId)
        ))
        .orderBy(attendance.date);

      // Calcular estatï¿½sticas
      const totalClasses = attendanceRecords.length;
      const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
      const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
      const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
      const excusedCount = attendanceRecords.filter(r => r.status === 'excused').length;
      
      const attendanceRate = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0;

      const report = {
        studentId,
        classId,
        subjectId,
        totalClasses,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        records: attendanceRecords
      };

      console.log(`? Relatï¿½rio gerado: ${presentCount}/${totalClasses} presenï¿½as (${attendanceRate.toFixed(1)}%)`);

      res.json(report);
    } catch (error) {
      console.error('Erro ao buscar relatï¿½rio de frequï¿½ncia:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar frequï¿½ncia do aluno (para visualizaï¿½ï¿½o)
  app.get('/api/attendance/student/:studentId', isAuthenticated, async (req, res) => {
    try {
      const { studentId } = req.params;
      const { academicYear, subjectId } = req.query;
      const user = req.user as any;

      console.log(`?? Buscando frequï¿½ncia do aluno ${studentId}`);

      // Verificar permissï¿½es
      if (user.role === 'student' && user.id !== studentId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Usar SQL direto para buscar frequï¿½ncia do aluno
      let query = `
        SELECT 
          a.id,
          a.date,
          a.status,
          a.notes,
          s.name as subjectName,
          s.code as subjectCode,
          c.name as className,
          c.academicYear,
          a.createdAt
        FROM attendance a
        INNER JOIN classes c ON a.classId = c.id
        INNER JOIN subjects s ON a.subjectId = s.id
        WHERE a.studentId = ?
      `;
      
      const params = [studentId];
      
      // Adicionar filtros opcionais
      if (academicYear && academicYear !== 'all') {
        query += ' AND c.academicYear = ?';
        params.push(academicYear as string);
      }
      
      if (subjectId && subjectId !== 'all') {
        query += ' AND a.subjectId = ?';
        params.push(subjectId as string);
      }
      
      query += ' ORDER BY a.date DESC';
      
      const studentAttendance = await client.execute(query, params);
      
      // Calcular estatï¿½sticas gerais
      const totalClasses = studentAttendance.rows.length;
      const presentCount = studentAttendance.rows.filter((a: any) => a.status === 'present').length;
      const absentCount = studentAttendance.rows.filter((a: any) => a.status === 'absent').length;
      const attendanceRate = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0;

      const generalStats = {
        totalClasses,
        presentCount,
        absentCount,
        attendanceRate: Math.round(attendanceRate * 100) / 100
      };

      // Calcular estatï¿½sticas por disciplina
      const statsBySubject = [];
      const subjectMap = new Map();
      
      studentAttendance.rows.forEach((record: any) => {
        const subjectKey = record.subjectId || record.subjectName;
        if (!subjectMap.has(subjectKey)) {
          subjectMap.set(subjectKey, {
            subjectId: record.subjectId,
            subjectName: record.subjectName,
            totalClasses: 0,
            presentClasses: 0,
            absentClasses: 0
          });
        }
        
        const subject = subjectMap.get(subjectKey);
        subject.totalClasses++;
        if (record.status === 'present') {
          subject.presentClasses++;
        } else if (record.status === 'absent') {
          subject.absentClasses++;
        }
      });
      
      statsBySubject.push(...subjectMap.values());

      console.log(`? Frequï¿½ncia encontrada: ${presentCount}/${totalClasses} presenï¿½as (${attendanceRate.toFixed(1)}%)`);

      res.json({
        attendance: studentAttendance.rows,
        statsBySubject,
        generalStats
      });
    } catch (error) {
      console.error('Erro ao buscar frequï¿½ncia do aluno:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar estatï¿½sticas de frequï¿½ncia para coordenador
  app.get('/api/coordinator/attendance-stats', isAuthenticated, hasRole(['coordinator']), async (req, res) => {
    try {
      console.log('?? Buscando estatï¿½sticas de frequï¿½ncia para coordenador');

      // Estatï¿½sticas gerais de frequï¿½ncia usando SQL direto
      const generalStatsResult = await client.execute(`
        SELECT 
          COUNT(*) as totalRecords,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as presentCount,
          SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absentCount
        FROM attendance
      `);

      const generalStats = generalStatsResult.rows[0] || { totalRecords: 0, presentCount: 0, absentCount: 0 };
      const overallAttendanceRate = generalStats.totalRecords > 0 
        ? Math.round((generalStats.presentCount / generalStats.totalRecords) * 10000) / 100 
        : 0;

      // Frequï¿½ncia por turma usando SQL direto
      const attendanceByClassResult = await client.execute(`
        SELECT 
          c.id as classId,
          c.name as className,
          COUNT(DISTINCT a.studentId) as totalStudents,
          COUNT(a.id) as totalRecords,
          SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as presentCount,
          ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) * 100.0 / COUNT(a.id)), 2) as attendanceRate
        FROM attendance a
        INNER JOIN classes c ON a.classId = c.id
        GROUP BY c.id, c.name
        ORDER BY attendanceRate DESC
      `);

      // Frequï¿½ncia por disciplina usando SQL direto
      const attendanceBySubjectResult = await client.execute(`
        SELECT 
          s.id as subjectId,
          s.name as subjectName,
          COUNT(a.id) as totalRecords,
          SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as presentCount,
          ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) * 100.0 / COUNT(a.id)), 2) as attendanceRate
        FROM attendance a
        INNER JOIN subjects s ON a.subjectId = s.id
        GROUP BY s.id, s.name
        ORDER BY attendanceRate DESC
      `);

      // Alunos com baixa frequï¿½ncia (menos de 75%) usando SQL direto
      const lowAttendanceStudentsResult = await client.execute(`
        SELECT 
          u.id as studentId,
          u.firstName || ' ' || u.lastName as studentName,
          c.name as className,
          COUNT(a.id) as totalClasses,
          SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as presentCount,
          ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) * 100.0 / COUNT(a.id)), 2) as attendanceRate
        FROM attendance a
        INNER JOIN users u ON a.studentId = u.id
        INNER JOIN classes c ON a.classId = c.id
        GROUP BY u.id, u.firstName, u.lastName, c.name
        HAVING attendanceRate < 75
        ORDER BY attendanceRate ASC
      `);

      const stats = {
        general: {
          totalRecords: generalStats.totalRecords || 0,
          presentCount: generalStats.presentCount || 0,
          absentCount: generalStats.absentCount || 0,
          overallAttendanceRate
        },
        byClass: attendanceByClassResult.rows,
        bySubject: attendanceBySubjectResult.rows,
        lowAttendanceStudents: lowAttendanceStudentsResult.rows
      };

      console.log(`? Estatï¿½sticas de frequï¿½ncia geradas: ${stats.general.totalRecords} registros`);

      res.json(stats);
    } catch (error) {
      console.error('Erro ao buscar estatï¿½sticas de frequï¿½ncia:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  console.log('?? Rotas de frequï¿½ncia registradas!');

  // ==================== ROTAS DE NOTAS ====================
  
  // Buscar notas de uma turma/disciplina por bimestre
  app.get('/api/grades/class/:classId/subject/:subjectId/semester/:semester', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { classId, subjectId, semester } = req.params;
      const user = req.user as any;

      console.log(`?? Buscando notas da turma ${classId}, disciplina ${subjectId}, bimestre ${semester}`);

      // Verificar se o professor tem acesso ï¿½ turma/disciplina
      const teacherAccess = await client.execute(`
        SELECT * FROM classSubjects 
        WHERE classId = ? AND subjectId = ? AND teacherId = ? AND status = 'active'
        LIMIT 1
      `, [classId, subjectId, user.id]);

      if (teacherAccess.rows.length === 0) {
        return res.status(403).json({ message: "Acesso negado a esta turma/disciplina" });
      }

      // Buscar alunos da turma
      const studentsResult = await client.execute(`
        SELECT u.id, u.firstName, u.lastName, u.registrationNumber
        FROM users u
        INNER JOIN classEnrollments ce ON u.id = ce.studentId
        WHERE ce.classId = ? AND u.role = 'student' AND ce.status = 'active'
        ORDER BY u.firstName, u.lastName
      `, [classId]);

      // Buscar notas existentes
      const gradesResult = await client.execute(`
        SELECT 
          g.id,
          g.studentId,
          g.type,
          g.title,
          g.grade,
          g.maxGrade,
          g.weight,
          g.date,
          g.comments
        FROM grades g
        INNER JOIN classSubjects cs ON g.classSubjectId = cs.id
        WHERE cs.classId = ? AND cs.subjectId = ? AND g.createdBy = ?
        ORDER BY g.date DESC
      `, [classId, subjectId, user.id]);

      const students = studentsResult.rows;
      const grades = gradesResult.rows;

      // Organizar notas por aluno
      const studentGrades = students.map((student: any) => {
        const studentGradeRecords = grades.filter((grade: any) => grade.studentId === student.id);
        const totalGrade = studentGradeRecords.reduce((sum: number, grade: any) => sum + (grade.grade * grade.weight), 0);
        const totalWeight = studentGradeRecords.reduce((sum: number, grade: any) => sum + grade.weight, 0);
        const averageGrade = totalWeight > 0 ? totalGrade / totalWeight : 0;

        return {
          ...student,
          fullName: `${student.firstName} ${student.lastName}`,
          grades: studentGradeRecords,
          averageGrade: Math.round(averageGrade * 100) / 100,
          totalGrades: studentGradeRecords.length
        };
      });

      console.log(`? Encontradas notas para ${students.length} alunos`);

      res.json({
        students: studentGrades,
        semester: parseInt(semester),
        totalStudents: students.length
      });

    } catch (error) {
      console.error('Erro ao buscar notas:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Adicionar nota para um aluno
  app.post('/api/grades', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const user = req.user as any;
      const { studentId, classId, subjectId, type, title, grade, maxGrade, weight, date, comments } = req.body;

      console.log(`?? Adicionando nota para aluno ${studentId}`);

      // Verificar se o professor tem acesso ï¿½ turma/disciplina
      const teacherAccess = await client.execute(`
        SELECT * FROM classSubjects 
        WHERE classId = ? AND subjectId = ? AND teacherId = ? AND status = 'active'
        LIMIT 1
      `, [classId, subjectId, user.id]);

      if (teacherAccess.rows.length === 0) {
        return res.status(403).json({ message: "Acesso negado a esta turma/disciplina" });
      }

      const classSubjectId = teacherAccess.rows[0].id;
      const gradeId = uuidv4();
      const now = new Date().toISOString();

      // Inserir nota
      await client.execute(`
        INSERT INTO grades (id, studentId, classSubjectId, type, title, grade, maxGrade, weight, date, comments, createdBy, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        gradeId,
        studentId,
        classSubjectId,
        type,
        title,
        grade,
        maxGrade || 10,
        weight || 1,
        date,
        comments || '',
        user.id,
        now,
        now
      ]);

      console.log(`? Nota adicionada com sucesso: ${grade}/${maxGrade || 10}`);

      res.status(201).json({
        message: "Nota adicionada com sucesso",
        gradeId,
        grade: {
          id: gradeId,
          studentId,
          type,
          title,
          grade,
          maxGrade: maxGrade || 10,
          weight: weight || 1,
          date,
          comments: comments || ''
        }
      });

    } catch (error) {
      console.error('Erro ao adicionar nota:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Atualizar nota
  app.put('/api/grades/:id', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user as any;
      const { grade, maxGrade, weight, comments } = req.body;

      console.log(`?? Atualizando nota ${id}`);

      // Verificar se a nota existe e pertence ao professor
      const existingGrade = await client.execute(`
        SELECT g.*, cs.classId, cs.subjectId
        FROM grades g
        INNER JOIN classSubjects cs ON g.classSubjectId = cs.id
        WHERE g.id = ? AND g.createdBy = ?
      `, [id, user.id]);

      if (existingGrade.rows.length === 0) {
        return res.status(404).json({ message: "Nota nï¿½o encontrada" });
      }

      const now = new Date().toISOString();

      // Atualizar nota
      await client.execute(`
        UPDATE grades 
        SET grade = ?, maxGrade = ?, weight = ?, comments = ?, updatedAt = ?
        WHERE id = ?
      `, [grade, maxGrade, weight, comments, now, id]);

      console.log(`? Nota atualizada com sucesso`);

      res.json({
        message: "Nota atualizada com sucesso",
        gradeId: id
      });

    } catch (error) {
      console.error('Erro ao atualizar nota:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Excluir nota
  app.delete('/api/grades/:id', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user as any;

      console.log(`??? Excluindo nota ${id}`);

      // Verificar se a nota existe e pertence ao professor
      const existingGrade = await client.execute(`
        SELECT * FROM grades WHERE id = ? AND createdBy = ?
      `, [id, user.id]);

      if (existingGrade.rows.length === 0) {
        return res.status(404).json({ message: "Nota nï¿½o encontrada" });
      }

      // Excluir nota
      await client.execute(`DELETE FROM grades WHERE id = ?`, [id]);

      console.log(`? Nota excluï¿½da com sucesso`);

      res.json({
        message: "Nota excluï¿½da com sucesso"
      });

    } catch (error) {
      console.error('Erro ao excluir nota:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  console.log('?? Rotas de notas registradas!');

  // ==================== NOVO SISTEMA DE NOTAS - API SIMPLES ====================
  
  // Nova API para buscar notas de forma simples
  app.get('/api/exams/:examId/grades-simple', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { examId } = req.params;
      const user = req.user as any;

      // Tabela examGrades jï¿½ foi criada
      console.log('? Tabela examGrades pronta!');

      console.log(`?? [NOVO SISTEMA] Buscando notas da prova: ${examId}`);

      // 1. Buscar dados da prova
      const examResult = await client.execute(`
        SELECT id, title, classId, subjectId, totalPoints
        FROM exams 
        WHERE id = ? AND teacherId = ?
      `, [examId, user.id]);

      if (examResult.rows.length === 0) {
        return res.status(404).json({ message: 'Prova nï¿½o encontrada' });
      }

      const exam = examResult.rows[0];
      console.log(`?? Prova encontrada:`, exam);

      // 2. Buscar alunos da turma
      const studentsResult = await client.execute(`
        SELECT u.id, u.firstName, u.lastName
        FROM users u
        INNER JOIN studentClass sc ON u.id = sc.studentId
        WHERE sc.classId = ? AND u.role = 'student' AND sc.status = 'active'
        ORDER BY u.firstName, u.lastName
      `, [exam.classId]);

      console.log(`?? Alunos encontrados:`, studentsResult.rows.length);

      // 3. Buscar notas existentes (usando examId diretamente) - apenas a mais recente com nota vï¿½lida
      const gradesResult = await client.execute(`
        SELECT studentId, grade, isPresent
        FROM examGrades 
        WHERE examId = ? AND grade IS NOT NULL
        ORDER BY updatedAt DESC
      `, [examId]);

      console.log(`?? Notas encontradas:`, gradesResult.rows);

      // 4. Organizar dados
      const students = studentsResult.rows.map((student: any) => {
        const existingGrade = gradesResult.rows.find((g: any) => g.studentId === student.id);
        return {
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          grade: existingGrade ? existingGrade.grade : null,
          isPresent: existingGrade ? existingGrade.isPresent : true
        };
      });

      console.log(`? Dados organizados para ${students.length} alunos`);

      res.json({
        exam: {
          id: exam.id,
          title: exam.title,
          totalPoints: exam.totalPoints
        },
        students
      });

    } catch (error) {
      console.error('? Erro ao buscar notas:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Nova API para salvar notas de forma simples
  app.post('/api/exams/:examId/grades-simple', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { examId } = req.params;
      const { grades } = req.body;
      const user = req.user as any;

      console.log(`?? [NOVO SISTEMA] Salvando notas da prova: ${examId}`);
      console.log(`?? Dados recebidos:`, grades);

      // Verificar se a prova existe e pertence ao professor
      const examResult = await client.execute(`
        SELECT id, totalPoints FROM exams WHERE id = ? AND teacherId = ?
      `, [examId, user.id]);

      if (examResult.rows.length === 0) {
        return res.status(404).json({ message: 'Prova nï¿½o encontrada' });
      }

      const maxPoints = examResult.rows[0].totalPoints;

      // Salvar/atualizar cada nota com validação
      for (const gradeData of grades) {
        if (gradeData.grade !== null && gradeData.grade !== '') {
          const g = Number(String(gradeData.grade).replace(',', '.'));
          if (!Number.isFinite(g) || g < 0 || g > maxPoints || Math.round(g * 2) !== g * 2) {
            return res.status(400).json({ message: `Nota inválida. Use valores entre 0 e ${maxPoints} em passos de 0.5.` });
          }
          console.log(`?? Salvando nota ${g} para aluno ${gradeData.studentId}`);
          
          // Gerar ID único para a nota
          const gradeId = uuidv4();
          
          await client.execute(`
            INSERT OR REPLACE INTO examGrades (id, examId, studentId, grade, isPresent, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          `, [gradeId, examId, gradeData.studentId, g, gradeData.isPresent]);
        }
      }

      console.log(`? ${grades.length} notas processadas com sucesso`);

      res.json({ 
        message: 'Notas salvas com sucesso',
        saved: grades.length
      });

    } catch (error) {
      console.error('? Erro ao salvar notas:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // API para aluno ver suas notas
  app.get('/api/student/exams/:examId/grade', isAuthenticated, hasRole(['student']), async (req, res) => {
    try {
      const { examId } = req.params;
      const user = req.user as any;

      console.log(`????? [ALUNO] Buscando nota da prova: ${examId} para aluno: ${user.id}`);

      // Buscar nota do aluno para esta prova (apenas notas vï¿½lidas)
      const gradeResult = await client.execute(`
        SELECT grade, isPresent, updatedAt
        FROM examGrades 
        WHERE examId = ? AND studentId = ? AND grade IS NOT NULL
        ORDER BY updatedAt DESC
        LIMIT 1
      `, [examId, user.id]);

      console.log(`?? Nota encontrada:`, gradeResult.rows);

      if (gradeResult.rows.length > 0) {
        const grade = gradeResult.rows[0];
        res.json({
          grade: grade.grade,
          isPresent: grade.isPresent,
          gradedAt: grade.updatedAt
        });
      } else {
        res.json({
          grade: null,
          isPresent: null,
          gradedAt: null
        });
      }

    } catch (error) {
      console.error('? Erro ao buscar nota do aluno:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // ==================== SISTEMA DE NOTAS SIMPLIFICADO ====================
  
  // Buscar detalhes de uma prova com alunos
  app.get('/api/exams/:examId', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { examId } = req.params;
      const user = req.user as any;

      console.log(`?? Buscando detalhes da prova ${examId}`);
      console.log(`?? Professor solicitante: ${user.id}`);

      // Buscar dados da prova
      const examResult = await client.execute(`
        SELECT 
          e.id,
          e.title,
          e.description,
          e.examDate,
          e.duration,
          e.totalPoints,
          e.semester,
          e.bimonthly,
          e.status,
          s.name as subjectName,
          c.name as className,
          e.subjectId,
          e.classId
        FROM exams e
        INNER JOIN subjects s ON e.subjectId = s.id
        INNER JOIN classes c ON e.classId = c.id
        WHERE e.id = ? AND e.teacherId = ?
      `, [examId, user.id]);

      if (examResult.rows.length === 0) {
        return res.status(404).json({ message: "Prova nï¿½o encontrada" });
      }

      const exam = examResult.rows[0];

      // Buscar alunos da turma
      const studentsResult = await client.execute(`
        SELECT 
          u.id as studentId,
          u.firstName,
          u.lastName,
          u.registrationNumber,
          u.firstName || ' ' || u.lastName as studentName
        FROM users u
        INNER JOIN classEnrollments ce ON u.id = ce.studentId
        WHERE ce.classId = ? AND u.role = 'student' AND ce.status = 'active'
        ORDER BY u.firstName, u.lastName
      `, [exam.classId]);

      // Buscar classSubjectId para esta prova
      console.log(`?? Buscando classSubjectId para: classId=${exam.classId}, subjectId=${exam.subjectId}, teacherId=${user.id}`);
      
      const classSubjectResult = await client.execute(`
        SELECT id FROM classSubjects 
        WHERE classId = ? AND subjectId = ? AND teacherId = ?
        LIMIT 1
      `, [exam.classId, exam.subjectId, user.id]);

      console.log(`?? ClassSubject encontrado:`, classSubjectResult.rows);

      let gradesResult = { rows: [] };
      if (classSubjectResult.rows.length > 0) {
        const classSubjectId = classSubjectResult.rows[0].id;
        console.log(`?? Buscando notas para classSubjectId: ${classSubjectId}, title: ${exam.title}, createdBy: ${user.id}`);
        
        // Buscar notas existentes da prova
        gradesResult = await client.execute(`
          SELECT 
            g.id,
            g.studentId,
            g.grade,
            g.maxGrade,
            g.comments,
            g.date
          FROM grades g
          WHERE g.classSubjectId = ? AND g.title = ? AND g.createdBy = ?
          ORDER BY g.date DESC
        `, [classSubjectId, exam.title, user.id]);
        
        console.log(`?? Query executada, notas encontradas:`, gradesResult.rows);
      } else {
        console.log(`? ClassSubject nï¿½o encontrado!`);
      }

      console.log(`?? Notas encontradas:`, gradesResult.rows.length);
      console.log(`?? Alunos encontrados:`, studentsResult.rows.length);

      // Organizar dados dos alunos com suas notas
      const students = studentsResult.rows.map((student: any) => {
        const studentGrade = gradesResult.rows.find((grade: any) => grade.studentId === student.studentId);
        return {
          id: student.studentId,
          studentId: student.studentId,
          studentName: student.studentName,
          firstName: student.firstName,
          lastName: student.lastName,
          registrationNumber: student.registrationNumber,
          grade: studentGrade ? studentGrade.grade : null,
          maxGrade: studentGrade ? studentGrade.maxGrade : exam.totalPoints,
          observations: studentGrade ? studentGrade.comments : '',
          isPresent: true,
          date: studentGrade ? studentGrade.date : null
        };
      });

      console.log(`? Dados organizados: ${students.length} alunos, ${students.filter(s => s.grade !== null).length} com notas`);

      res.json({
        ...exam,
        grades: students,
        totalStudents: students.length
      });

    } catch (error) {
      console.error('Erro ao buscar detalhes da prova:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Salvar notas de uma prova (sistema simplificado)
  app.post('/api/exams/:examId/grades', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { examId } = req.params;
      const { grades } = req.body;
      const user = req.user as any;

      console.log(`?? Salvando notas da prova ${examId}`);
      console.log(`?? Dados recebidos:`, grades);

      // Buscar dados da prova
      const examResult = await client.execute(`
        SELECT * FROM exams WHERE id = ? AND teacherId = ?
      `, [examId, user.id]);

      if (examResult.rows.length === 0) {
        return res.status(404).json({ message: "Prova nï¿½o encontrada" });
      }

      const exam = examResult.rows[0];
      const now = new Date().toISOString();

      // Processar cada nota
      for (const gradeData of grades) {
        if (gradeData.grade !== null && gradeData.grade !== '' && gradeData.grade !== '0.0') {
          const parsedGrade = Number(String(gradeData.grade).replace(',', '.'));
          if (!Number.isFinite(parsedGrade) || parsedGrade < 0 || parsedGrade > exam.totalPoints || Math.round(parsedGrade * 2) !== parsedGrade * 2) {
            return res.status(400).json({ message: `Nota inválida. Use valores entre 0 e ${exam.totalPoints} em passos de 0.5.` });
          }
          const gradeId = uuidv4();
          
          console.log(`?? Salvando nota: ${parsedGrade} para aluno ${gradeData.studentId}`);
          
          // Buscar classSubjectId correto
          const classSubjectResult = await client.execute(`
            SELECT id FROM classSubjects 
            WHERE classId = ? AND subjectId = ? AND teacherId = ?
            LIMIT 1
          `, [exam.classId, exam.subjectId, user.id]);

          if (classSubjectResult.rows.length === 0) {
            console.log(`? ClassSubject nï¿½o encontrado para classId=${exam.classId}, subjectId=${exam.subjectId}, teacherId=${user.id}`);
            continue;
          }

          const classSubjectId = classSubjectResult.rows[0].id;
          console.log(`?? ClassSubjectId encontrado: ${classSubjectId}`);

          // Inserir ou atualizar nota
          await client.execute(`
            INSERT OR REPLACE INTO grades (id, studentId, classSubjectId, type, title, grade, maxGrade, weight, date, comments, createdBy, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            gradeId,
            gradeData.studentId,
            classSubjectId,
            'exam',
            exam.title,
            parsedGrade,
            exam.totalPoints,
            1,
            exam.examDate,
            gradeData.observations || '',
            user.id,
            now,
            now
          ]);
          
          console.log(`? Nota salva: ${parsedGrade} para aluno ${gradeData.studentId}`);
        }
      }

      console.log(`? Processamento concluï¿½do para ${grades.length} alunos`);

      res.json({
        message: "Notas salvas com sucesso",
        examId,
        gradesCount: grades.length
      });

    } catch (error) {
      console.error('Erro ao salvar notas da prova:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  console.log('?? Rotas de detalhes de prova registradas!');

  // ===== ADMIN STUDENTS APIs =====
  
  // PUT /api/admin/students/:id - Atualizar estudante
  app.put('/api/admin/students/:id', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const user = req.user;
      const { id } = req.params;
      const { firstName, lastName, email, phone, address, classId } = req.body;

      console.log("Atualizaï¿½ï¿½o de estudante " + id + " solicitada por: " + user.firstName + " " + user.lastName);
      console.log('?? Dados atualizados:', { firstName, lastName, email, phone, address, classId });

      // Validações básicas
      if (!firstName || !lastName) {
        return res.status(400).json({ message: "Nome e sobrenome são obrigatórios" });
      }

      // Verificar se o estudante existe
      const existingStudent = await db
        .select()
        .from(users)
        .where(and(eq(users.id, id), eq(users.role, 'student')));

      if (existingStudent.length === 0) {
        return res.status(404).json({ message: "Estudante nï¿½o encontrado" });
      }

      // Congelar email: manter o existente
      const existingEmail = (existingStudent[0] as any).email;

      // Atualizar dados do estudante e marcar como pendente (aguardando aprovação do diretor)
      await db
        .update(users)
        .set({
          firstName,
          lastName,
          phone: phone || null,
          address: address || null,
          status: 'pendente',
          updatedAt: new Date().toISOString()
        })
        .where(eq(users.id, id));

      // Se classId foi fornecido, atualizar a matrï¿½cula
      if (classId) {
        // Verificar se a turma existe
        const classExists = await db
          .select()
          .from(classes)
          .where(eq(classes.id, classId));

        if (classExists.length === 0) {
          return res.status(400).json({ message: "Turma nï¿½o encontrada" });
        }

        // Atualizar ou criar matrï¿½cula
        const existingEnrollment = await db
          .select()
          .from(studentClass)
          .where(and(
            eq(studentClass.studentId, id),
            eq(studentClass.status, 'active')
          ));

        if (existingEnrollment.length > 0) {
          // Atualizar matrï¿½cula existente
          await db
            .update(studentClass)
            .set({
              classId,
              status: 'pendente',
              updatedAt: new Date().toISOString()
            })
            .where(eq(studentClass.id, existingEnrollment[0].id));
        } else {
          // Criar nova matrï¿½cula
          await db.insert(studentClass).values({
            id: crypto.randomUUID(),
            studentId: id,
            classId,
            status: 'pendente',
            enrollmentDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }

      console.log("? Estudante atualizado. Alterações aguardam aprovação do diretor. Email mantido:", existingEmail);
      res.json({ message: "Estudante atualizado. Alterações aguardam aprovação do diretor.", data: { id, email: existingEmail } });

    } catch (error) {
      console.error('? Erro ao atualizar estudante:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // DELETE /api/admin/students/:id - Excluir estudante
  app.delete('/api/admin/students/:id', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const user = req.user;
      const { id } = req.params;
      const { password } = req.body;

      console.log("Exclusï¿½o de estudante " + id + " solicitada por: " + user.firstName + " " + user.lastName);

      // Verificar senha de confirmaï¿½ï¿½o (placeholder): exigir senha nÃ£o vazia
      if (!password || typeof password !== 'string' || password.trim().length === 0) {
        return res.status(400).json({ message: "Senha de confirmaï¿½ï¿½o obrigatï¿½ria" });
      }

      // Verificar se estudante existe usando SQL direto
      const Database = (await import('better-sqlite3')).default;
      const path = (await import('path')).default;
      const { fileURLToPath } = await import('url');
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const dbPath = schoolDbPath;
      const sqliteDb = new Database(dbPath);
      
      let existingStudent = null;
      try {
        const selectSql = 'SELECT * FROM users WHERE id = ? AND role = ? LIMIT 1';
        existingStudent = sqliteDb.prepare(selectSql).get(id, 'student');
      } finally {
        sqliteDb.close();
      }

      if (!existingStudent) {
        return res.status(404).json({ message: "Estudante nï¿½o encontrado" });
      }

      const studentToDelete = existingStudent;
      console.log("Estudante a ser deletado: " + studentToDelete.firstName + " " + studentToDelete.lastName);

      // Usar SQL direto para deletar estudante
      console.log("??? Removendo vï¿½nculos do estudante " + id + "...");
      
      try {
        const sqliteDb3 = new Database(dbPath);
        try {
          // Desabilitar FKs na MESMA conexÃ£o
          sqliteDb3.prepare('PRAGMA foreign_keys = OFF').run();
          console.log('[UNLOCK] Foreign key constraints desabilitadas (mesma conexÃ£o)');

          // 1. Remover arquivos e histÃ³rico de submissÃµes do estudante antes das submissÃµes
          try {
            const delSubFiles = sqliteDb3.prepare('DELETE FROM submissionFiles WHERE submissionId IN (SELECT id FROM activitySubmissions WHERE studentId = ?)').run(id);
            console.log('[OK] Arquivos de submissÃµes removidos:', delSubFiles.changes);
            const delSubHist = sqliteDb3.prepare('DELETE FROM submissionHistory WHERE submissionId IN (SELECT id FROM activitySubmissions WHERE studentId = ?) OR performedBy = ?').run(id, id);
            console.log('[OK] HistÃ³rico de submissÃµes removido:', delSubHist.changes);
            const delRubricEval = sqliteDb3.prepare('DELETE FROM rubricEvaluations WHERE submissionId IN (SELECT id FROM activitySubmissions WHERE studentId = ?) OR evaluatorId = ?').run(id, id);
            console.log('[OK] AvaliaÃ§Ãµes de rubricas removidas:', delRubricEval.changes);
          } catch (error) {
            console.log('[INFO] RemoÃ§Ã£o de arquivos/histÃ³rico/rubricas falhou ou tabelas inexistentes:', error.message);
          }

          // 2. Remover submissÃµes de atividades
          try {
            const deleteSubmissionsSql = 'DELETE FROM activitySubmissions WHERE studentId = ?';
            const resultSubs = sqliteDb3.prepare(deleteSubmissionsSql).run(id);
            console.log('[OK] SubmissÃµes removidas:', resultSubs.changes);
          } catch (error) {
            console.log('[INFO] Tabela activitySubmissions nÃ£o existe ou erro:', error.message);
          }

          // 3. Remover matrÃ­culas
          const deleteStudentClassSql = 'DELETE FROM studentClass WHERE studentId = ?';
          const result1 = sqliteDb3.prepare(deleteStudentClassSql).run(id);
          console.log('[OK] MatrÃ­culas removidas:', result1.changes);

          // 4. Remover notas de exames
          const deleteExamGradesSql = 'DELETE FROM examGrades WHERE studentId = ?';
          const result2 = sqliteDb3.prepare(deleteExamGradesSql).run(id);
          console.log('[OK] Notas de exames removidas:', result2.changes);

          // 5. Remover notas gerais (se existir)
          try {
            const deleteGradesSql = 'DELETE FROM grades WHERE studentId = ?';
            const result3 = sqliteDb3.prepare(deleteGradesSql).run(id);
            console.log('[OK] Notas gerais removidas:', result3.changes);
          } catch (error) {
            console.log('[INFO] Tabela grades nÃ£o existe ou erro:', error.message);
          }

          // 6. Remover presenÃ§as (se existir)
          try {
            const deleteAttendanceSql = 'DELETE FROM attendance WHERE studentId = ?';
            const result5 = sqliteDb3.prepare(deleteAttendanceSql).run(id);
            console.log('[OK] Registros de presenÃ§a removidos:', result5.changes);
          } catch (error) {
            console.log('[INFO] Tabela attendance nÃ£o existe ou erro:', error.message);
          }

          // 7. Remover o estudante
          const deleteStudentSql = 'DELETE FROM users WHERE id = ?';
          const resultDel = sqliteDb3.prepare(deleteStudentSql).run(id);
          console.log('[OK] Estudante removido:', resultDel.changes, 'linhas afetadas');

          // Reabilitar foreign keys
          sqliteDb3.prepare('PRAGMA foreign_keys = ON').run();

        } finally {
          sqliteDb3.close();
        }

        console.log('? Estudante deletado com sucesso!');
        res.json({ message: 'Estudante deletado com sucesso' });

      } catch (error) {
        console.error('? Erro ao deletar estudante:', error);
        const sqliteDb4 = new Database(dbPath);
        try {
          sqliteDb4.prepare('PRAGMA foreign_keys = ON').run();
        } finally {
          sqliteDb4.close();
        }
        res.status(500).json({ message: 'Erro interno do servidor' });
      }

    } catch (error) {
      console.error('? Erro ao excluir estudante:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  console.log('?? Rotas de estudantes do admin registradas!');

  // Director Approvals API - Listar aprovaï¿½ï¿½es pendentes
  app.get('/api/director/approvals/pending', isAuthenticated, hasRole(['director']), async (req, res) => {
    try {
      const user = req.user;
      console.log("Listando aprovaï¿½ï¿½es pendentes solicitado por: " + user.firstName + " " + user.lastName);

      // Buscar usuï¿½rios pendentes de aprovaï¿½ï¿½o usando Drizzle ORM
      const pendingUsers = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          role: users.role,
          registrationNumber: users.registrationNumber,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          status: users.status
        })
        .from(users)
        .where(eq(users.status, 'pendente'))
        .orderBy(desc(users.createdAt));
      
      console.log("?? Usuï¿½rios pendentes encontrados:", pendingUsers.length);

      // Buscar turmas pendentes de aprovaï¿½ï¿½o usando Drizzle ORM
      const pendingClasses = await db
        .select({
          id: classes.id,
          name: classes.name,
          grade: classes.grade,
          section: classes.section,
          academicYear: classes.academicYear,
          capacity: classes.capacity,
          createdAt: classes.createdAt,
          status: classes.status
        })
        .from(classes)
        .where(eq(classes.status, 'pendente'))
        .orderBy(desc(classes.createdAt));
      
      console.log("?? Turmas pendentes encontradas:", pendingClasses.length);

      // Buscar disciplinas pendentes de aprovaÃ§Ã£o usando Drizzle ORM
      const pendingSubjects = await db
        .select({
          id: subjects.id,
          name: subjects.name,
          code: subjects.code,
          description: subjects.description,
          createdAt: subjects.createdAt,
          status: subjects.status
        })
        .from(subjects)
        .where(eq(subjects.status, 'pendente'))
        .orderBy(desc(subjects.createdAt));
      
      console.log("?? Disciplinas pendentes encontradas:", pendingSubjects.length);

      // Formatar dados para o frontend
      const formattedApprovals = [
        ...pendingUsers.map(user => {
          const roleName = user.role === 'teacher' ? 'Professor' 
                          : user.role === 'coordinator' ? 'Coordenador' 
                          : user.role === 'admin' ? 'Administrador' 
                          : user.role === 'student' ? 'Aluno' 
                          : 'Usuário';
          const roleNameLower = roleName.toLowerCase();
          const isEdit = !!user.updatedAt && user.updatedAt !== user.createdAt;
          return ({
            id: user.id,
            type: 'user',
            title: `${isEdit ? 'Edição de' : 'Novo'} ${roleName} - ${user.firstName} ${user.lastName}`,
            description: `${isEdit ? 'Edição' : 'Criação'} de ${isEdit ? 'perfil' : 'novo perfil'} de ${roleNameLower}`,
            requestedBy: 'Administrador',
            requestedAt: (user.createdAt || '').split('T')[0],
            priority: 'high',
            details: {
              email: user.email,
              role: roleName,
              registrationNumber: user.registrationNumber,
              operation: isEdit ? 'edit' : 'create'
            }
          });
        }),
        ...pendingClasses.map(cls => ({
          id: cls.id,
          type: 'class',
          title: `Nova Turma - ${cls.grade}Âº Ano ${cls.section}`,
          description: `CriaÃ§Ã£o de nova turma para o ${cls.grade}Âº ano do ensino mÃ©dio`,
          requestedBy: 'Administrador',
          requestedAt: cls.createdAt.split('T')[0],
          priority: 'medium',
          details: {
            capacity: cls.capacity,
            academicYear: cls.academicYear,
            grade: cls.grade,
            section: cls.section
          }
        })),
        ...pendingSubjects.map(subject => ({
          id: subject.id,
          type: 'subject',
          title: `Nova Disciplina - ${subject.name}`,
          description: `ImplementaÃ§Ã£o de disciplina de ${subject.name.toLowerCase()}`,
          requestedBy: 'Administrador',
          requestedAt: subject.createdAt.split('T')[0],
          priority: 'high',
          details: {
            code: subject.code,
            description: subject.description
          }
        }))
      ];

      console.log("Encontradas " + formattedApprovals.length + " aprovaï¿½ï¿½es pendentes");
      res.json({ success: true, data: formattedApprovals });
    } catch (error) {
      console.error('Erro ao buscar aprovaï¿½ï¿½es pendentes:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Director Approvals API - Aprovar solicitaï¿½ï¿½o
  app.post('/api/director/approvals/approve', isAuthenticated, hasRole(['director']), async (req, res) => {
    try {
      const user = req.user;
      const { id, type } = req.body;

      console.log("Aprovaï¿½ï¿½o solicitada por: " + user.firstName + " " + user.lastName);
      console.log('Dados da aprovaï¿½ï¿½o:', { id, type });

      if (!id || !type) {
        return res.status(400).json({ message: "ID e tipo sï¿½o obrigatï¿½rios" });
      }

      let updatedItem;
      const now = new Date().toISOString();

      if (type === 'user') {
        // Buscar o usuï¿½rio pendente usando Drizzle ORM
        const userToApprove = await db
          .select()
          .from(users)
          .where(eq(users.id, id))
          .limit(1);

        if (userToApprove.length === 0) {
          return res.status(404).json({ message: "Usuï¿½rio nï¿½o encontrado" });
        }

        const user = userToApprove[0];
        console.log("? Usuï¿½rio encontrado para aprovaï¿½ï¿½o:", user.firstName, user.lastName);

        if (user.status !== 'pendente') {
          return res.status(400).json({ message: "Usuï¿½rio jï¿½ foi processado" });
        }

        // Email fixo: se já existir, manter; se estiver vazio/nulo, gerar único
        let finalEmail = (user.email && user.email.trim() !== '') ? user.email : '';
        if (!finalEmail) {
          const cleanFirstName = user.firstName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
          const cleanLastName = user.lastName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
          let candidate = `${cleanFirstName}.${cleanLastName}@escola.com`;
          
          while (true) {
            const existingUser = await db
              .select({ id: users.id })
              .from(users)
              .where(eq(users.email, candidate))
              .limit(1);
            
            if (existingUser.length === 0) {
              finalEmail = candidate;
              break;
            }
            
            const randomNum1 = Math.floor(Math.random() * 90) + 10; // 10-99
            const randomNum2 = Math.floor(Math.random() * 90) + 10; // 10-99
            candidate = `${cleanFirstName}.${cleanLastName}${randomNum1}${randomNum2}@escola.com`;
          }
        }

        // Hash da senha padrï¿½o
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.hash('123', 10);

        // Atualizar o usuï¿½rio com email e senha usando Drizzle ORM
        updatedItem = await db
          .update(users)
          .set({
            email: finalEmail,
            password: hashedPassword,
            status: 'active',
            updatedAt: now
          })
          .where(eq(users.id, id))
          .returning();

        // Se for aluno, ativar matrícula na turma e disciplinas usando Drizzle ORM
        if (user.role === 'student') {
          await db
            .update(studentClass)
            .set({
              status: 'active',
              updatedAt: now
            })
            .where(eq(studentClass.studentId, id));
          
          await db
            .update(studentSubjects)
            .set({
              status: 'active',
              updatedAt: now
            })
            .where(and(
              eq(studentSubjects.studentId, id),
              eq(studentSubjects.status, 'pendente')
            ));

          console.log("? Matrículas e disciplinas do aluno ativadas");
        }
        
        // Se for professor, ativar vï¿½nculos com disciplinas e turmas usando Drizzle ORM
        if (user.role === 'teacher') {
          await db
            .update(classSubjects)
            .set({
              status: 'active',
              updatedAt: now
            })
            .where(and(
              eq(classSubjects.teacherId, id),
              eq(classSubjects.status, 'pendente')
            ));
          
          console.log("? Vï¿½nculos do professor ativados");
        }

        console.log("? Usuï¿½rio aprovado e ativado: " + id);
        console.log("?? Email mantido/gerado: " + finalEmail);
        console.log("?? Senha padrï¿½o: 123");
      } else if (type === 'class') {
        const clsPendingRows = await db.select().from(settings).where(eq(settings.key, `pendingClassUpdate:${id}`)).limit(1);
        if (clsPendingRows.length > 0) {
          const payload = JSON.parse(clsPendingRows[0].value);
          const ch = payload.changes || {};
          updatedItem = await db
            .update(classes)
            .set({ 
              name: ch.name ?? undefined,
              grade: ch.grade ?? undefined,
              section: ch.section ?? undefined,
              academicYear: ch.academicYear ?? undefined,
              capacity: ch.capacity ?? undefined,
              status: 'active',
              updatedAt: now
            })
            .where(eq(classes.id, id))
            .returning();
          await db.update(settings).set({ value: JSON.stringify({ ...payload, status: 'approved', updatedAt: now }) }).where(eq(settings.id, clsPendingRows[0].id));
        } else {
          updatedItem = await db
            .update(classes)
            .set({ 
              status: 'active',
              updatedAt: now
            })
            .where(eq(classes.id, id))
            .returning();
        }
      } else if (type === 'subject') {
        const subjPendingRows = await db.select().from(settings).where(eq(settings.key, `pendingSubjectUpdate:${id}`)).limit(1);
        if (subjPendingRows.length > 0) {
          const payload = JSON.parse(subjPendingRows[0].value);
          const ch = payload.changes || {};
          updatedItem = await db
            .update(subjects)
            .set({ 
              name: ch.name ?? undefined,
              code: ch.code ?? undefined,
              description: ch.description ?? undefined,
              status: 'active',
              updatedAt: now
            })
            .where(eq(subjects.id, id))
            .returning();
          const links = Array.isArray(payload.classLinks) ? payload.classLinks : [];
          if (links.length > 0) {
            await db.delete(classSubjects).where(eq(classSubjects.subjectId, id));
            for (const classId of links) {
              const classExists = await db.select({ id: classes.id, academicYear: classes.academicYear }).from(classes).where(eq(classes.id, classId)).limit(1);
              if (classExists.length > 0) {
                const classSubjectId = uuidv4();
                await db.insert(classSubjects).values({
                  id: classSubjectId,
                  classId,
                  subjectId: id,
                  status: 'active',
                  academicYear: (classExists[0] as any).academicYear ?? '2025',
                  semester: '1',
                  createdAt: now,
                  updatedAt: now
                });
              }
            }
          }
          await db.update(settings).set({ value: JSON.stringify({ ...payload, status: 'approved', updatedAt: now }) }).where(eq(settings.id, subjPendingRows[0].id));
        } else {
          updatedItem = await db
            .update(subjects)
            .set({ 
              status: 'active',
              updatedAt: now
            })
            .where(eq(subjects.id, id))
            .returning();
        }
      } else {
        return res.status(400).json({ message: "Tipo invï¿½lido" });
      }

      if (updatedItem.length === 0) {
        return res.status(404).json({ message: "Item nï¿½o encontrado" });
      }

      console.log(`${type} aprovado com sucesso: ${id}`);
      res.json({ success: true, message: "Item aprovado com sucesso" });
    } catch (error) {
      console.error('Erro ao aprovar item:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Director Approvals API - Rejeitar solicitaï¿½ï¿½o
  app.post('/api/director/approvals/reject', isAuthenticated, hasRole(['director']), async (req, res) => {
    try {
      const user = req.user;
      const { id, type, reason } = req.body;

      console.log("Rejeiï¿½ï¿½o solicitada por: " + user.firstName + " " + user.lastName);
      console.log('Dados da rejeiï¿½ï¿½o:', { id, type, reason });

      if (!id || !type) {
        return res.status(400).json({ message: "ID e tipo sï¿½o obrigatï¿½rios" });
      }

      let updatedItem;
      const now = new Date().toISOString();

      if (type === 'user') {
        // Usar Drizzle ORM para rejeitar usuï¿½rio
        updatedItem = await db
          .update(users)
          .set({
            status: 'rejected',
            updatedAt: now
          })
          .where(eq(users.id, id))
          .returning();
          
        console.log("? Usuï¿½rio rejeitado:", updatedItem.length, "linhas afetadas");
      } else if (type === 'class') {
        updatedItem = await db
          .update(classes)
          .set({ 
            status: 'rejected',
            updatedAt: now
          })
          .where(eq(classes.id, id))
          .returning();
      } else if (type === 'subject') {
        updatedItem = await db
          .update(subjects)
          .set({ 
            status: 'rejected',
            updatedAt: now
          })
          .where(eq(subjects.id, id))
          .returning();
      } else {
        return res.status(400).json({ message: "Tipo invï¿½lido" });
      }

      if (updatedItem.length === 0) {
        return res.status(404).json({ message: "Item nï¿½o encontrado" });
      }

      console.log(`${type} rejeitado: ${id} - Motivo: ${reason || 'Nï¿½o informado'}`);
      res.json({ success: true, message: "Item rejeitado" });
    } catch (error) {
      console.error('Erro ao rejeitar item:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== ROTAS DE PERï¿½ODOS LETIVOS =====
  
  // Buscar todos os perï¿½odos
  app.get('/api/periods', isAuthenticated, hasRole(['admin', 'director', 'coordinator']), async (req, res) => {
    try {
      const periods = await db
        .select()
        .from(academicPeriods)
        .orderBy(academicPeriods.academicYear, academicPeriods.period);

      // Calcular dias restantes para cada perï¿½odo
      const periodsWithDays = periods.map(period => {
        const today = new Date();
        const startDate = new Date(period.startDate);
        const endDate = new Date(period.endDate);
        
        let remainingDays = 0;
        if (period.status === 'active') {
          const diffTime = endDate.getTime() - today.getTime();
          remainingDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        }

        return {
          ...period,
          remainingDays: remainingDays
        };
      });

      res.json({
        success: true,
        data: periodsWithDays
      });
    } catch (error) {
      console.error('? Erro ao buscar perï¿½odos:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  });

  // Criar novo perï¿½odo
  app.post('/api/periods', isAuthenticated, hasRole(['admin', 'director']), async (req, res) => {
    try {
      const { name, description, period, academicYear, startDate, endDate } = req.body;
      const user = req.user as any;

      // Validar se jï¿½ existe um perï¿½odo para o mesmo bimestre/ano
      const existingPeriod = await db
        .select()
        .from(academicPeriods)
        .where(
          and(
            eq(academicPeriods.period, period),
            eq(academicPeriods.academicYear, academicYear)
          )
        )
        .limit(1);

      if (existingPeriod.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Jï¿½ existe um ${period}ï¿½ bimestre para o ano ${academicYear}`
        });
      }

      // Calcular total de dias
      const start = new Date(startDate);
      const end = new Date(endDate);
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const periodId = uuidv4();
      
      await db.insert(academicPeriods).values({
        id: periodId,
        name,
        description: description || '',
        period,
        academicYear,
        startDate,
        endDate,
        totalDays,
        remainingDays: totalDays,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      console.log(`?? Perï¿½odo criado: ${name} (${period}ï¿½ bimestre ${academicYear})`);

      res.json({
        success: true,
        message: 'Perï¿½odo criado com sucesso'
      });
    } catch (error) {
      console.error('? Erro ao criar perï¿½odo:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  });

  // Atualizar perï¿½odo
  app.put('/api/periods/:id', isAuthenticated, hasRole(['admin', 'director']), async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, startDate, endDate } = req.body;

      // Calcular total de dias
      const start = new Date(startDate);
      const end = new Date(endDate);
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      await db
        .update(academicPeriods)
        .set({
          name,
          description,
          startDate,
          endDate,
          totalDays,
          remainingDays: totalDays,
          updatedAt: new Date().toISOString()
        })
        .where(eq(academicPeriods.id, id));

      console.log(`?? Perï¿½odo atualizado: ${id}`);

      res.json({
        success: true,
        message: 'Perï¿½odo atualizado com sucesso'
      });
    } catch (error) {
      console.error('? Erro ao atualizar perï¿½odo:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  });

  // Iniciar perï¿½odo
  app.post('/api/periods/:id/start', isAuthenticated, hasRole(['admin', 'director']), async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar se jï¿½ existe um perï¿½odo ativo
      const activePeriod = await db
        .select()
        .from(academicPeriods)
        .where(eq(academicPeriods.status, 'active'))
        .limit(1);

      if (activePeriod.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Jï¿½ existe um perï¿½odo ativo. Encerre o perï¿½odo atual antes de iniciar outro.'
        });
      }

      // Ativar o perï¿½odo
      await db
        .update(academicPeriods)
        .set({
          status: 'active',
          isCurrent: true,
          updatedAt: new Date().toISOString()
        })
        .where(eq(academicPeriods.id, id));

      console.log(`?? Perï¿½odo iniciado: ${id}`);

      res.json({
        success: true,
        message: 'Perï¿½odo iniciado com sucesso'
      });
    } catch (error) {
      console.error('? Erro ao iniciar perï¿½odo:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  });

  // Encerrar perï¿½odo
  app.post('/api/periods/:id/end', isAuthenticated, hasRole(['admin', 'director']), async (req, res) => {
    try {
      const { id } = req.params;

      // Encerrar o perï¿½odo
      await db
        .update(academicPeriods)
        .set({
          status: 'completed',
          isCurrent: false,
          updatedAt: new Date().toISOString()
        })
        .where(eq(academicPeriods.id, id));

      console.log(`?? Perï¿½odo encerrado: ${id}`);

      res.json({
        success: true,
        message: 'Perï¿½odo encerrado com sucesso'
      });
    } catch (error) {
      console.error('? Erro ao encerrar perï¿½odo:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  });

  // Excluir perï¿½odo
  app.delete('/api/periods/:id', isAuthenticated, hasRole(['admin', 'director']), async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar se o perï¿½odo estï¿½ ativo
      const period = await db
        .select()
        .from(academicPeriods)
        .where(eq(academicPeriods.id, id))
        .limit(1);

      if (period.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Perï¿½odo nï¿½o encontrado'
        });
      }

      if (period[0].status === 'active') {
        return res.status(400).json({
          success: false,
          message: 'Nï¿½o ï¿½ possï¿½vel excluir um perï¿½odo ativo'
        });
      }

      await db
        .delete(academicPeriods)
        .where(eq(academicPeriods.id, id));

      console.log(`?? Perï¿½odo excluï¿½do: ${id}`);

      res.json({
        success: true,
        message: 'Perï¿½odo excluï¿½do com sucesso'
      });
    } catch (error) {
      console.error('? Erro ao excluir perï¿½odo:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  });

  // Buscar perï¿½odo atual
  app.get('/api/periods/current', isAuthenticated, hasRole(['admin', 'director', 'coordinator', 'teacher', 'student']), async (req, res) => {
    try {
      const currentPeriod = await db
        .select()
        .from(academicPeriods)
        .where(eq(academicPeriods.status, 'active'))
        .limit(1);

      if (currentPeriod.length === 0) {
        return res.json({
          success: true,
          data: null,
          message: 'Nenhum perï¿½odo ativo encontrado'
        });
      }

      const period = currentPeriod[0];
      
      // Calcular dias restantes
      const today = new Date();
      const endDate = new Date(period.endDate);
      const remainingDays = Math.max(0, Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

      res.json({
        success: true,
        data: {
          ...period,
          remainingDays
        }
      });
    } catch (error) {
      console.error('? Erro ao buscar perï¿½odo atual:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  });

  // GET /api/admin/logs/terminal - Logs para terminal em tempo real (Admin)
  app.get('/api/admin/logs/terminal', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const { search, limit } = req.query as any;
      const noLimit = String(limit || '').toLowerCase() === 'all';
      const max = Math.min(Number(limit) || 100, 1000);
      const whereClause = search && String(search).trim().length > 0
        ? or(
            like(systemLogs.action, `%${search}%`),
            like(systemLogs.description, `%${search}%`),
            like(systemLogs.userName, `%${search}%`),
            like(systemLogs.userRole, `%${search}%`),
            like(systemLogs.ipAddress, `%${search}%`),
            like(systemLogs.userAgent, `%${search}%`)
          )
        : undefined;

      const base = (whereClause ? db.select().from(systemLogs).where(whereClause) : db.select().from(systemLogs))
        .orderBy(desc(systemLogs.timestamp));
      const logs = await (noLimit ? base : base.limit(max));
    
    const formattedLogs = logs.map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      level: log.level,
      action: log.action,
      description: log.description,
      userId: log.userId,
      userName: log.userName,
      userRole: log.userRole,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,






      deviceType: (log as any).deviceType,
      os: (log as any).os,
      osVersion: (log as any).osVersion,
      browser: (log as any).browser,
      browserVersion: (log as any).browserVersion,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
      code: log.code
    }));

      res.json({
        success: true,
        data: {
          logs: formattedLogs,
          total: formattedLogs.length,
          lastUpdate: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Erro ao buscar logs do terminal:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  console.log('?? Rotas de logs do admin registradas!');

  // Sistema de recuperaÃ§Ã£o de senha REMOVIDO temporariamente

  // API para buscar perÃ­odo atual (dashboard do aluno)
  app.get('/api/periods/current', async (req, res) => {
    try {
      const currentPeriod = await db
        .select()
        .from(academicPeriods)
        .where(eq(academicPeriods.status, 'active'))
        .limit(1);

      if (currentPeriod.length === 0) {
        return res.json({
          success: true,
          data: null,
          message: 'Nenhum perÃ­odo ativo'
        });
      }

      const period = currentPeriod[0];
      
      // Calcular dias restantes
      const today = new Date();
      const endDate = new Date(period.endDate);
      const remainingDays = Math.max(0, Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
      
      res.json({
        success: true,
        data: {
          ...period,
          remainingDays: Math.max(0, remainingDays)
        }
      });
    } catch (error) {
      console.error('âŒ Erro ao buscar perÃ­odo atual:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  // Rota para buscar usuÃ¡rios (para o chat) - REMOVIDA (duplicada)

  // Rota para buscar status de usuÃ¡rios especÃ­ficos
  app.get('/api/users/status', isAuthenticated, async (req, res) => {
    try {
      const { ids } = req.query;
      
      if (!ids) {
        return res.json({
          success: true,
          data: []
        });
      }

      const userIds = (ids as string).split(',');
      
      const userStatuses = await db
        .select({
          id: users.id,
          status: users.status,
          firstName: users.firstName,
          lastName: users.lastName
        })
        .from(users)
        .where(inArray(users.id, userIds));

      res.json({
        success: true,
        data: userStatuses
      });
    } catch (error) {
      console.error('âŒ Erro ao buscar status dos usuÃ¡rios:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  // Rota para atualizar status do usuÃ¡rio (para o chat)
  app.put('/api/users/status', isAuthenticated, async (req, res) => {
    try {
      const { status } = req.body;
      const user = req.user as any;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status Ã© obrigatÃ³rio'
        });
      }

      // Atualizar status do usuÃ¡rio
      await db
        .update(users)
        .set({ 
          status: status,
          updatedAt: new Date().toISOString()
        })
        .where(eq(users.id, user.id));

      res.json({
        success: true,
        message: 'Status atualizado com sucesso',
        data: { status }
      });
    } catch (error) {
      console.error('âŒ Erro ao atualizar status do usuÃ¡rio:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  // Chat API Routes (persistÃªncia leve em SQLite)
  // Schema simples: messages(conversationId, id, senderId, recipientId, content, createdAt)
  const ensureChatTables = () => {
    const dbLite = getSqlite();
    // Verificar esquema atual da tabela messages
    const tableInfo: any[] = dbLite.prepare('PRAGMA table_info(messages);').all();
    const requiredColumns = ['id', 'conversationId', 'senderId', 'recipientId', 'content', 'createdAt'];
    const hasAllColumns = tableInfo.length > 0 && requiredColumns.every(col => tableInfo.some((c: any) => c.name === col));

    if (!hasAllColumns) {
      // Em ambiente de desenvolvimento, simplificar: recriar tabela com o esquema correto
      dbLite.exec(`
        DROP TABLE IF EXISTS messages;
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          conversationId TEXT NOT NULL,
          senderId TEXT NOT NULL,
          recipientId TEXT NOT NULL,
          content TEXT NOT NULL,
          createdAt INTEGER NOT NULL
        );
      `);
    }

    // Garantir Ã­ndices
    dbLite.exec(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversationId, createdAt);
      CREATE INDEX IF NOT EXISTS idx_messages_participants ON messages(senderId, recipientId);
    `);
  };

  // Buscar conversas do usuÃ¡rio (derivado de messages)
  app.get('/api/chat/conversations', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      ensureChatTables();
      const dbLite = getSqlite();

        const rows = dbLite.prepare(
        `SELECT 
          m.conversationId,
          CASE WHEN m.senderId = ? THEN m.recipientId ELSE m.senderId END AS otherUserId,
          CASE WHEN m.senderId = ? THEN u2.firstName || ' ' || u2.lastName ELSE u1.firstName || ' ' || u1.lastName END AS otherUserName,
          CASE WHEN m.senderId = ? THEN u2.email ELSE u1.email END AS otherUserEmail,
          CASE WHEN m.senderId = ? THEN u2.profileImageUrl ELSE u1.profileImageUrl END AS otherUserProfileImageUrl,
          CASE WHEN m.senderId = ? THEN u2.role ELSE u1.role END AS otherUserRole,
          MAX(m.createdAt) AS lastTimestamp,
          (SELECT content FROM messages m2 WHERE m2.conversationId = m.conversationId ORDER BY m2.createdAt DESC LIMIT 1) AS lastMessage
         FROM messages m
         JOIN users u1 ON m.senderId = u1.id AND u1.status = 'active'
         JOIN users u2 ON m.recipientId = u2.id AND u2.status = 'active'
         WHERE (m.senderId = ? OR m.recipientId = ?)
         GROUP BY m.conversationId, otherUserId, otherUserName, otherUserEmail, otherUserProfileImageUrl, otherUserRole
         ORDER BY lastTimestamp DESC
         LIMIT 50`
      ).all(user.id, user.id, user.id, user.id, user.id, user.id, user.id);

      res.json({ success: true, data: rows });
    } catch (error) {
      console.error('âŒ Erro ao buscar conversas:', error);
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  });

  // Buscar mensagens de uma conversa
  app.get('/api/chat/messages/:conversationId', isAuthenticated, async (req, res) => {
    try {
      const { conversationId } = req.params;
      ensureChatTables();
      const dbLite = getSqlite();
      const rows = dbLite.prepare(
        `SELECT 
          m.id, 
          m.conversationId, 
          m.senderId, 
          m.recipientId, 
          m.content, 
          m.createdAt,
          s.firstName || ' ' || s.lastName AS senderName,
          s.role AS senderRole,
          r.firstName || ' ' || r.lastName AS recipientName,
          r.role AS recipientRole
         FROM messages m
         JOIN users s ON m.senderId = s.id AND s.status = 'active'
         JOIN users r ON m.recipientId = r.id AND r.status = 'active'
         WHERE m.conversationId = ?
         ORDER BY m.createdAt ASC`
      ).all(conversationId);

      res.json({ success: true, data: rows });
    } catch (error) {
      console.error('âŒ Erro ao buscar mensagens:', error);
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  });

  // Enviar mensagem
  app.post('/api/chat/messages', isAuthenticated, async (req, res) => {
    try {
      const { recipientEmail, content } = req.body;
      const user = req.user as any;
      ensureChatTables();

      // Buscar destinatÃ¡rio usando the same SQLite connection for consistÃªncia
      const dbLite = getSqlite();
      const recipient = dbLite.prepare(
        `SELECT id, email, firstName, lastName FROM users WHERE email = ? AND status = ? LIMIT 1`
      ).get(recipientEmail, 'active');
      if (!recipient || !recipient.id) {
        return res.status(400).json({ success: false, message: 'DestinatÃ¡rio nÃ£o encontrado' });
      }

      const participantIds = [user.id, recipient.id].sort();
      const conversationId = `conv_${participantIds[0]}_${participantIds[1]}`;

      // Inserir mensagem
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const createdAt = Date.now();
      dbLite.prepare(
        `INSERT INTO messages (id, conversationId, senderId, recipientId, content, createdAt)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(id, conversationId, user.id, recipient.id, content, createdAt);

      res.json({ success: true, data: { id, conversationId, content, senderId: user.id, recipientId: recipient.id, createdAt } });
    } catch (error) {
      console.error('âŒ Erro ao enviar mensagem:', error);
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  });

  // Editar mensagem
  app.put('/api/chat/messages/:messageId', isAuthenticated, async (req, res) => {
    try {
      const { messageId } = req.params;
      const { content } = req.body;
      
      res.json({
        success: true,
        message: 'Mensagem editada com sucesso'
      });
    } catch (error) {
      console.error('âŒ Erro ao editar mensagem:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  // Deletar mensagem
  app.delete('/api/chat/messages/:messageId', isAuthenticated, async (req, res) => {
    try {
      const { messageId } = req.params;
      
      res.json({
        success: true,
        message: 'Mensagem deletada com sucesso'
      });
    } catch (error) {
      console.error('âŒ Erro ao deletar mensagem:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  // Relatórios: alunos com baixo desempenho (professor)
  app.get('/api/teacher/:teacherId/reports/low-performance', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { teacherId } = req.params;
      const quarter = (req.query.quarter as string) || '';
      const classRows = await db
        .select({ classId: classSubjects.classId })
        .from(classSubjects)
        .where(eq(classSubjects.teacherId, teacherId));
      const classIds = Array.from(new Set(classRows.map((r: any) => r.classId))).filter(Boolean);
      const whereGrades = (cid: string) => quarter
        ? and(eq(classSubjects.classId, cid), sql`substr(${grades.date}, 6, 2) IN (${quarter === '1' ? '01,02,03' : quarter === '2' ? '04,05,06' : quarter === '3' ? '07,08,09' : '10,11,12'})`)
        : eq(classSubjects.classId, cid);
      const allRows: any[] = [];
      for (const cid of classIds) {
        const r = await db
          .select({ studentId: users.id, firstName: users.firstName, lastName: users.lastName, subjectName: subjects.name, grade: grades.grade })
          .from(grades)
          .innerJoin(users, eq(users.id, grades.studentId))
          .innerJoin(classSubjects, eq(classSubjects.id, grades.classSubjectId))
          .innerJoin(subjects, eq(subjects.id, classSubjects.subjectId))
          .where(whereGrades(cid));
        allRows.push(...r);
      }
      const byStudent: Record<string, { name: string; grades: number[]; subjects: Record<string, number[]> }> = {};
      for (const row of allRows) {
        const id = String(row.studentId);
        if (!byStudent[id]) byStudent[id] = { name: `${row.firstName} ${row.lastName}`, grades: [], subjects: {} };
        if (row.grade != null) {
          byStudent[id].grades.push(Number(row.grade));
          const sname = row.subjectName || 'Disciplina';
          (byStudent[id].subjects[sname] ||= []).push(Number(row.grade));
        }
      }
      const result = await Promise.all(Object.entries(byStudent).map(async ([studentId, data]) => {
        const avg = data.grades.length > 0 ? data.grades.reduce((a, v) => a + v, 0) / data.grades.length : 0;
        const critical = Object.entries(data.subjects)
          .filter(([_, arr]) => arr.length > 0 && (arr.reduce((a, v) => a + v, 0) / arr.length) < 6)
          .map(([name]) => name);
        const sc = await db
          .select({ classId: studentClass.classId })
          .from(studentClass)
          .where(and(eq(studentClass.studentId, studentId), eq(studentClass.status, 'active')));
        let className = '';
        if (sc[0]?.classId) {
          const c = await db.select({ name: classes.name }).from(classes).where(eq(classes.id, sc[0].classId));
          className = c[0]?.name || '';
        }
        return { id: studentId, name: data.name, class: className, average: Number(avg.toFixed(1)), subjects: critical };
      }));
      const filtered = result.filter((s) => s.average < 6);
      res.json({ data: filtered });
    } catch (error) {
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Relatórios: alunos com problemas de frequência (professor)
  app.get('/api/teacher/:teacherId/reports/low-attendance', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { teacherId } = req.params;
      const classRows = await db
        .select({ classId: classSubjects.classId })
        .from(classSubjects)
        .where(eq(classSubjects.teacherId, teacherId));
      const classIds = Array.from(new Set(classRows.map((r: any) => r.classId))).filter(Boolean);
      const studentSet = new Set<string>();
      for (const cid of classIds) {
        const students = await db.select({ studentId: studentClass.studentId }).from(studentClass).where(and(eq(studentClass.classId, cid), eq(studentClass.status, 'active')));
        students.forEach((s) => s.studentId && studentSet.add(s.studentId));
      }
      const studentIds = Array.from(studentSet);
      const result: any[] = [];
      for (const sid of studentIds) {
        const attRows = await db
          .select({ date: attendance.date, status: attendance.status })
          .from(attendance)
          .where(eq(attendance.studentId, sid))
          .orderBy(desc(attendance.date));
        const total = attRows.length;
        const present = attRows.filter((r) => r.status === 'present').length;
        const rate = total > 0 ? Math.round((present / total) * 100) : 0;
        let consecutiveAbsences = 0;
        for (const r of attRows) { if (r.status === 'absent') consecutiveAbsences++; else break; }
        const userRow = await db.select({ firstName: users.firstName, lastName: users.lastName }).from(users).where(eq(users.id, sid));
        let className = '';
        const sc = await db.select({ classId: studentClass.classId }).from(studentClass).where(and(eq(studentClass.studentId, sid), eq(studentClass.status, 'active')));
        if (sc[0]?.classId) {
          const c = await db.select({ name: classes.name }).from(classes).where(eq(classes.id, sc[0].classId));
          className = c[0]?.name || '';
        }
        result.push({ id: sid, name: `${userRow[0]?.firstName || ''} ${userRow[0]?.lastName || ''}`, class: className, attendance: `${rate}%`, consecutive_absences: consecutiveAbsences, last_attendance: attRows[0]?.date || null });
      }
      const filtered = result.filter((s) => Number(String(s.attendance).replace('%','')) < 75);
      res.json({ data: filtered });
    } catch (error) {
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Desempenho por disciplina (professor)
  app.get('/api/teacher/:teacherId/reports/subjects-performance', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { teacherId } = req.params;
      const quarter = (req.query.quarter as string) || '';
      const classId = (req.query.classId as string) || '';
      const whereTeacher = classId
        ? and(eq(classSubjects.teacherId, teacherId), eq(classSubjects.classId, classId))
        : eq(classSubjects.teacherId, teacherId);
      const whereQuarter = (cid?: string) => {
        if (!quarter) return whereTeacher;
        const segment = quarter === '1' ? '01,02,03' : quarter === '2' ? '04,05,06' : quarter === '3' ? '07,08,09' : '10,11,12';
        return and(whereTeacher, sql`substr(${grades.date}, 6, 2) IN (${segment})`);
      };
      const rows = await db
        .select({
          subjectId: classSubjects.subjectId,
          subjectName: subjects.name,
          grade: grades.grade,
          classId: classSubjects.classId
        })
        .from(grades)
        .innerJoin(classSubjects, eq(classSubjects.id, grades.classSubjectId))
        .innerJoin(subjects, eq(subjects.id, classSubjects.subjectId))
        .where(whereQuarter());
      const map: Record<string, { name: string; sum: number; count: number }> = {};
      for (const r of rows) {
        const sid = String(r.subjectId || 'unknown');
        if (!map[sid]) map[sid] = { name: r.subjectName || 'Disciplina', sum: 0, count: 0 };
        if (r.grade != null) { map[sid].sum += Number(r.grade); map[sid].count += 1; }
      }
      const list = Object.values(map)
        .map((v) => ({ subject: v.name, average: v.count > 0 ? Number((v.sum / v.count).toFixed(1)) : 0, evaluations: v.count }))
        .filter((x) => x.evaluations > 0);
      res.json({ data: list });
    } catch (error) {
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Frequência: resumo por turma e disciplina (professor)
  app.get('/api/attendance/class/:classId/subject/:subjectId/summary', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { classId, subjectId } = req.params;
      const teacherId = req.user?.id as string;
      const teaches = await db.select({ id: classSubjects.id }).from(classSubjects).where(and(eq(classSubjects.classId, classId), eq(classSubjects.subjectId, subjectId), eq(classSubjects.teacherId, teacherId)));
      if (teaches.length === 0) return res.status(403).json({ message: 'Acesso negado' });
      const students = await db.select({ studentId: studentClass.studentId }).from(studentClass).where(and(eq(studentClass.classId, classId), eq(studentClass.status, 'active')));
      const result: any[] = [];
      for (const s of students) {
        const sid = s.studentId as string;
        const rows = await db
          .select({ status: attendance.status })
          .from(attendance)
          .where(and(eq(attendance.classId, classId), eq(attendance.subjectId, subjectId), eq(attendance.studentId, sid)));
        const total = rows.length;
        const present = rows.filter(r => r.status === 'present').length;
        const absent = rows.filter(r => r.status === 'absent').length;
        result.push({ studentId: sid, present, absent, total });
      }
      const usersData = await Promise.all(result.map(async r => {
        const u = await db.select({ firstName: users.firstName, lastName: users.lastName }).from(users).where(eq(users.id, r.studentId));
        return { ...r, firstName: u[0]?.firstName || '', lastName: u[0]?.lastName || '' };
      }));
      res.json({ data: usersData });
    } catch (error) {
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Frequência: detalhe por aluno (datas) para turma e disciplina (professor)
  app.get('/api/attendance/class/:classId/subject/:subjectId/student/:studentId/list', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { classId, subjectId, studentId } = req.params;
      const teacherId = req.user?.id as string;
      const teaches = await db.select({ id: classSubjects.id }).from(classSubjects).where(and(eq(classSubjects.classId, classId), eq(classSubjects.subjectId, subjectId), eq(classSubjects.teacherId, teacherId)));
      if (teaches.length === 0) return res.status(403).json({ message: 'Acesso negado' });
      const rows = await db
        .select({ date: attendance.date, status: attendance.status })
        .from(attendance)
        .where(and(eq(attendance.classId, classId), eq(attendance.subjectId, subjectId), eq(attendance.studentId, studentId)))
        .orderBy(desc(attendance.date));
      res.json({ data: rows });
    } catch (error) {
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Boletins: resumo por bimestre para turma e disciplina (professor)
  app.get('/api/teacher/:teacherId/grades/class/:classId/subject/:subjectId/bimonthly-summary', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { teacherId, classId, subjectId } = req.params;
      if (teacherId !== req.user?.id) return res.status(403).json({ message: 'Acesso negado' });
      const teaches = await db.select({ id: classSubjects.id }).from(classSubjects).where(and(eq(classSubjects.classId, classId), eq(classSubjects.subjectId, subjectId), eq(classSubjects.teacherId, teacherId)));
      if (teaches.length === 0) return res.status(403).json({ message: 'Acesso negado' });
      const students = await db.select({ studentId: studentClass.studentId }).from(studentClass).where(and(eq(studentClass.classId, classId), eq(studentClass.status, 'active')));
      const examsRows = await db
        .select({ id: exams.id, bimonthly: exams.bimonthly })
        .from(exams)
        .where(and(eq(exams.classId, classId), eq(exams.subjectId, subjectId), eq(exams.teacherId, teacherId)));
      const examIdsByB: Record<string, string[]> = { '1': [], '2': [], '3': [], '4': [] };
      for (const e of examsRows) { const b = String(e.bimonthly); if (examIdsByB[b]) examIdsByB[b].push(e.id as string); }
      const result: any[] = [];
      for (const s of students) {
        const sid = s.studentId as string;
        const perB: Record<string, number[]> = { '1': [], '2': [], '3': [], '4': [] };
        for (const b of ['1','2','3','4']) {
          const ids = examIdsByB[b];
          if (ids.length === 0) continue;
          const gRows = await db.select({ grade: examGrades.grade }).from(examGrades).where(and(inArray(examGrades.examId, ids), eq(examGrades.studentId, sid)));
          gRows.forEach(gr => { if (gr.grade != null) perB[b].push(Number(gr.grade)); });
        }
        const avg = (arr: number[]) => arr.length > 0 ? Number((arr.reduce((a,v)=>a+v,0)/arr.length).toFixed(2)) : null;
        result.push({ studentId: sid, averages: { b1: avg(perB['1']), b2: avg(perB['2']), b3: avg(perB['3']), b4: avg(perB['4']) } });
      }
      const enriched = await Promise.all(result.map(async r => {
        const u = await db.select({ firstName: users.firstName, lastName: users.lastName }).from(users).where(eq(users.id, r.studentId));
        return { name: `${u[0]?.firstName || ''} ${u[0]?.lastName || ''}`, ...r };
      }));
      res.json({ data: enriched });
    } catch (error) {
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Boletins: detalhe por aluno/bimestre (professor)
  app.get('/api/teacher/:teacherId/grades/class/:classId/subject/:subjectId/student/:studentId/bimonthly-detail', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { teacherId, classId, subjectId, studentId } = req.params;
      if (teacherId !== req.user?.id) return res.status(403).json({ message: 'Acesso negado' });
      const teaches = await db.select({ id: classSubjects.id }).from(classSubjects).where(and(eq(classSubjects.classId, classId), eq(classSubjects.subjectId, subjectId), eq(classSubjects.teacherId, teacherId)));
      if (teaches.length === 0) return res.status(403).json({ message: 'Acesso negado' });
      const examsRows = await db.select({ id: exams.id, bimonthly: exams.bimonthly, examDate: exams.examDate, title: exams.title }).from(exams).where(and(eq(exams.classId, classId), eq(exams.subjectId, subjectId), eq(exams.teacherId, teacherId)));
      const result: any = { '1': [], '2': [], '3': [], '4': [] };
      for (const e of examsRows) {
        if (!Object.prototype.hasOwnProperty.call(result, String(e.bimonthly))) continue;
        const g = await db.select({ grade: examGrades.grade, isPresent: examGrades.isPresent }).from(examGrades).where(and(eq(examGrades.examId, e.id as string), eq(examGrades.studentId, studentId)));
        result[String(e.bimonthly)].push({ title: e.title, date: e.examDate, grade: g[0]?.grade ?? null, present: Boolean(g[0]?.isPresent) });
      }
      res.json({ data: result });
    } catch (error) {
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Relatório consolidado do professor. Esta é a fonte única para a visualização
  // e para o PDF: provas, atividades avaliadas, notas legadas e frequência.
  app.get('/api/teacher/:teacherId/reports/report-card', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { teacherId } = req.params;
      const { classId, subjectId, studentId, quarter } = req.query as Record<string, string | undefined>;
      const currentUser = req.user as any;

      if (teacherId !== currentUser.id) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      if (!classId || !subjectId) {
        return res.status(400).json({ message: 'Turma e disciplina são obrigatórias.' });
      }
      if (quarter && !['1', '2', '3', '4'].includes(quarter)) {
        return res.status(400).json({ message: 'Bimestre inválido.' });
      }

      const assignment = await db
        .select({ id: classSubjects.id, academicYear: classSubjects.academicYear, className: classes.name, subjectName: subjects.name })
        .from(classSubjects)
        .innerJoin(classes, eq(classes.id, classSubjects.classId))
        .innerJoin(subjects, eq(subjects.id, classSubjects.subjectId))
        .where(and(
          eq(classSubjects.classId, classId),
          eq(classSubjects.subjectId, subjectId),
          eq(classSubjects.teacherId, teacherId),
          eq(classSubjects.status, 'active')
        ))
        .limit(1);

      if (assignment.length === 0) {
        return res.status(403).json({ message: 'Você não leciona esta disciplina nesta turma.' });
      }

      const students = await db
        // A base legada ainda não possui a coluna birthDate em todas as instalações.
        // O boletim não depende dela, então mantemos a consulta compatível.
        .select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
        .from(users)
        .innerJoin(studentClass, eq(studentClass.studentId, users.id))
        .where(and(
          eq(studentClass.classId, classId),
          eq(studentClass.status, 'active'),
          eq(users.role, 'student'),
          studentId ? eq(users.id, studentId) : undefined
        ))
        .orderBy(asc(users.firstName), asc(users.lastName));

      if (studentId && students.length === 0) {
        return res.status(404).json({ message: 'Aluno não encontrado na turma selecionada.' });
      }

      const periods = await db
        .select({ period: academicPeriods.period, startDate: academicPeriods.startDate, endDate: academicPeriods.endDate })
        .from(academicPeriods)
        .where(eq(academicPeriods.academicYear, assignment[0].academicYear));

      const validPeriods = periods.filter((period) => period.period >= 1 && period.period <= 4);
      const quarterForDate = (value?: string | null) => {
        if (!value) return undefined;
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) {
          const configured = validPeriods.find((period) => {
            const start = new Date(period.startDate);
            const end = new Date(period.endDate);
            return date >= start && date <= end;
          });
          if (configured) return configured.period;
          const month = date.getMonth() + 1;
          return month <= 3 ? 1 : month <= 6 ? 2 : month <= 9 ? 3 : 4;
        }
        return undefined;
      };
      const includeQuarter = (value: number | undefined) => !quarter || String(value) === quarter;

      const reportStudents: Record<string, any> = {};
      for (const student of students) {
        reportStudents[student.id] = {
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          birthDate: null,
          buckets: { 1: [], 2: [], 3: [], 4: [] } as Record<number, any[]>,
          attendance: { present: 0, absent: 0, late: 0, excused: 0, total: 0 }
        };
      }
      const addGrade = (id: string, period: number | undefined, score: unknown, maxScore: unknown, weight: unknown, title: string, source: string, date?: string | null) => {
        if (!reportStudents[id] || !period || !includeQuarter(period) || !['1', '2', '3', '4'].includes(String(period))) return;
        if (score === null || score === undefined || score === '') return;
        const numericScore = Number(score);
        const numericMax = Number(maxScore || 10);
        const numericWeight = Number(weight || 1);
        if (!Number.isFinite(numericScore) || !Number.isFinite(numericMax) || numericMax <= 0) return;
        reportStudents[id].buckets[period].push({
          value: (Math.max(0, Math.min(numericScore, numericMax)) / numericMax) * 10,
          weight: Number.isFinite(numericWeight) && numericWeight > 0 ? numericWeight : 1,
          title,
          source,
          date: date || null
        });
      };

      const examRows = await db
        .select({ id: exams.id, title: exams.title, bimonthly: exams.bimonthly, examDate: exams.examDate, totalPoints: exams.totalPoints })
        .from(exams)
        .where(and(eq(exams.classId, classId), eq(exams.subjectId, subjectId), eq(exams.teacherId, teacherId), ne(exams.status, 'cancelled')));
      const examIds = examRows.map((exam) => exam.id);
      const examGradesRows = examIds.length > 0
        ? await db.select({ id: examGrades.id, examId: examGrades.examId, studentId: examGrades.studentId, grade: examGrades.grade, updatedAt: examGrades.updatedAt })
          .from(examGrades)
          .where(inArray(examGrades.examId, examIds))
        : [];
      const examsById = new Map(examRows.map((exam) => [exam.id, exam]));
      const invalidExams = examRows.filter((exam) => !['1', '2', '3', '4'].includes(String(exam.bimonthly)));
      // Bancos antigos podem conter mais de um lançamento para a mesma prova e aluno.
      // O boletim considera somente o registro mais recente e ignora notas ainda não lançadas.
      const latestExamGrades = new Map<string, (typeof examGradesRows)[number]>();
      for (const grade of examGradesRows) {
        const key = `${grade.examId}:${grade.studentId}`;
        const current = latestExamGrades.get(key);
        if (!current || String(grade.updatedAt || '') >= String(current.updatedAt || '')) latestExamGrades.set(key, grade);
      }
      for (const grade of latestExamGrades.values()) {
        const exam = examsById.get(grade.examId);
        if (exam && ['1', '2', '3', '4'].includes(String(exam.bimonthly))) {
          addGrade(grade.studentId, Number(exam.bimonthly), grade.grade, exam.totalPoints, 1, exam.title, 'Prova', exam.examDate);
        }
      }

      const activityRows = await db
        .select({
          studentId: activitySubmissions.studentId,
          title: activities.title,
          grade: activitySubmissions.grade,
          finalGrade: activitySubmissions.finalGrade,
          maxGrade: activities.maxGrade,
          gradedAt: activitySubmissions.gradedAt,
          dueDate: activities.dueDate
        })
        .from(activitySubmissions)
        .innerJoin(activities, eq(activities.id, activitySubmissions.activityId))
        .where(and(
          eq(activities.classId, classId),
          eq(activities.subjectId, subjectId),
          eq(activities.teacherId, teacherId),
          isNotNull(activitySubmissions.grade)
        ));
      for (const activity of activityRows) {
        addGrade(activity.studentId, quarterForDate(activity.gradedAt || activity.dueDate), activity.finalGrade ?? activity.grade, activity.maxGrade, 1, activity.title, 'Atividade', activity.gradedAt || activity.dueDate);
      }

      const legacyGrades = await db
        .select({ studentId: grades.studentId, title: grades.title, grade: grades.grade, maxGrade: grades.maxGrade, weight: grades.weight, date: grades.date })
        .from(grades)
        .where(eq(grades.classSubjectId, assignment[0].id));
      for (const grade of legacyGrades) {
        addGrade(grade.studentId, quarterForDate(grade.date), grade.grade, grade.maxGrade, grade.weight, grade.title, 'Nota lançada', grade.date);
      }

      const attendanceRows = await db
        .select({ studentId: attendance.studentId, status: attendance.status, date: attendance.date })
        .from(attendance)
        .where(and(eq(attendance.classId, classId), eq(attendance.subjectId, subjectId), eq(attendance.teacherId, teacherId)));
      for (const record of attendanceRows) {
        const target = reportStudents[record.studentId];
        if (!target || !includeQuarter(quarterForDate(record.date))) continue;
        if (record.status === 'excused') {
          target.attendance.excused++;
        } else {
          target.attendance.total++;
          if (record.status === 'present') target.attendance.present++;
          else if (record.status === 'late') { target.attendance.present++; target.attendance.late++; }
          else target.attendance.absent++;
        }
      }

      const rows = Object.values(reportStudents).map((student: any) => {
        const averages: Record<string, number | null> = {};
        const assessments: any[] = [];
        for (const value of [1, 2, 3, 4]) {
          const entries = student.buckets[value];
          const totalWeight = entries.reduce((sum: number, item: any) => sum + item.weight, 0);
          averages[`b${value}`] = totalWeight > 0
            ? Number((entries.reduce((sum: number, item: any) => sum + item.value * item.weight, 0) / totalWeight).toFixed(1))
            : null;
          assessments.push(...entries.map((entry: any) => ({ ...entry, quarter: value, value: Number(entry.value.toFixed(1)) })));
        }
        const averageValues = Object.values(averages).filter((value): value is number => typeof value === 'number');
        const average = averageValues.length > 0
          ? Number((averageValues.reduce((sum, value) => sum + value, 0) / averageValues.length).toFixed(1))
          : null;
        const frequency = student.attendance.total > 0
          ? Number(((student.attendance.present * 100) / student.attendance.total).toFixed(1))
          : null;
        const situation = average === null
          ? 'Sem avaliação'
          : average >= 6 && (frequency === null || frequency >= 75)
            ? 'Aprovado'
            : average < 5 || (frequency !== null && frequency < 75)
              ? 'Reprovado'
              : 'Recuperação';
        return { id: student.id, name: student.name, birthDate: student.birthDate, averages, average, frequency, situation, attendance: student.attendance, assessments };
      });

      const studentsWithAverage = rows.filter((row: any) => row.average !== null);
      const studentsWithFrequency = rows.filter((row: any) => row.frequency !== null);
      const summary = {
        totalStudents: rows.length,
        average: studentsWithAverage.length > 0 ? Number((studentsWithAverage.reduce((sum: number, row: any) => sum + row.average, 0) / studentsWithAverage.length).toFixed(1)) : null,
        attendanceRate: studentsWithFrequency.length > 0 ? Number((studentsWithFrequency.reduce((sum: number, row: any) => sum + row.frequency, 0) / studentsWithFrequency.length).toFixed(1)) : null,
        approvalRate: studentsWithAverage.length > 0 ? Number(((studentsWithAverage.filter((row: any) => row.situation === 'Aprovado').length * 100) / studentsWithAverage.length).toFixed(1)) : null
      };

      res.json({
        data: {
          className: assignment[0].className,
          subjectName: assignment[0].subjectName,
          academicYear: assignment[0].academicYear,
          quarter: quarter || 'annual',
          students: rows,
          summary,
          warnings: invalidExams.map((exam) => `A prova "${exam.title}" foi ignorada porque está no bimestre inválido ${exam.bimonthly}.`)
        }
      });
    } catch (error) {
      console.error('Erro ao gerar relatório consolidado do professor:', error);
      res.status(500).json({ message: 'Não foi possível gerar o relatório.' });
    }
  });

  app.delete('/api/teacher/:teacherId/exams/class/:classId/subject/:subjectId', isAuthenticated, hasRole(['teacher']), async (req, res) => {
    try {
      const { teacherId, classId, subjectId } = req.params;
      if (teacherId !== req.user?.id) return res.status(403).json({ message: 'Acesso negado' });
      const teaches = await db.select({ id: classSubjects.id }).from(classSubjects).where(and(eq(classSubjects.classId, classId), eq(classSubjects.subjectId, subjectId), eq(classSubjects.teacherId, teacherId)));
      if (teaches.length === 0) return res.status(403).json({ message: 'Acesso negado' });
      const examsRows = await db.select({ id: exams.id }).from(exams).where(and(eq(exams.classId, classId), eq(exams.subjectId, subjectId), eq(exams.teacherId, teacherId)));
      const ids = examsRows.map((e: any) => e.id).filter(Boolean);
      if (ids.length === 0) return res.json({ success: true, deleted: 0 });
      await db.delete(examGrades).where(inArray(examGrades.examId, ids));
      await db.delete(exams).where(inArray(exams.id, ids));
      res.json({ success: true, deleted: ids.length });
    } catch (error) {
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  return app;
};
