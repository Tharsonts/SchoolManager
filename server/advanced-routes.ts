import express from "express";
import { db } from "./db";
import { logger } from "./utils/logger";
import { eq, and, desc, asc, or, count, avg, sum, like, sql, inArray, ne, isNotNull } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

// Middleware de autenticação
const isAuthenticated = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
};

const hasRole = (roles: string[]) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.user || !roles.includes((req.user as any).role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
};

export function registerAdvancedRoutes(app: express.Application) {
  // ===== ROTAS DE TIPOS DE ATIVIDADE =====
  
  // Listar tipos de atividade
  app.get('/api/activity-types', isAuthenticated, async (req, res) => {
    try {
      const result = await db.all(`
        SELECT * FROM activity_types 
        WHERE is_active = 1 
        ORDER BY name
      `);
      
      res.json(result);
    } catch (error) {
      console.error('Erro ao buscar tipos de atividade:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Criar configuração de atividade
  app.post('/api/activities/:id/config', isAuthenticated, hasRole(['teacher', 'admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const { typeId, configData } = req.body;
      const user = req.user as any;

      // Verificar se a atividade existe e se o usuário tem permissão
      const activity = await db.get(`
        SELECT * FROM activities 
        WHERE id = ? AND created_by = ?
      `, [id, user.id]);

      if (!activity) {
        return res.status(404).json({ message: "Atividade não encontrada" });
      }

      const configId = uuidv4();
      const now = new Date().toISOString();

      await db.run(`
        INSERT OR REPLACE INTO activity_configs 
        (id, activity_id, type_id, config_data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [configId, id, typeId, JSON.stringify(configData), now, now]);

      res.json({ 
        message: "Configuração salva com sucesso",
        configId 
      });
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar configuração de atividade
  app.get('/api/activities/:id/config', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      
      const config = await db.get(`
        SELECT ac.*, at.name as type_name, at.icon as type_icon
        FROM activity_configs ac
        JOIN activity_types at ON ac.type_id = at.id
        WHERE ac.activity_id = ?
      `, [id]);

      if (!config) {
        return res.status(404).json({ message: "Configuração não encontrada" });
      }

      res.json({
        ...config,
        config_data: JSON.parse(config.config_data)
      });
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== ROTAS DE RUBRICAS =====
  
  // Listar rubricas
  app.get('/api/rubrics', isAuthenticated, hasRole(['teacher', 'admin']), async (req, res) => {
    try {
      const user = req.user as any;
      const { template } = req.query;
      
      let query = `
        SELECT r.*, u.firstName || ' ' || u.lastName as creator_name
        FROM rubrics r
        LEFT JOIN users u ON r.created_by = u.id
        WHERE (r.created_by = ? OR r.is_template = 1)
      `;
      
      const params = [user.id];
      
      if (template === 'true') {
        query += ` AND r.is_template = 1`;
      }
      
      query += ` ORDER BY r.is_template DESC, r.name`;
      
      const rubrics = await db.all(query, params);
      
      const result = rubrics.map(rubric => ({
        ...rubric,
        criteria: JSON.parse(rubric.criteria)
      }));
      
      res.json(result);
    } catch (error) {
      console.error('Erro ao buscar rubricas:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Criar rubrica
  app.post('/api/rubrics', isAuthenticated, hasRole(['teacher', 'admin']), async (req, res) => {
    try {
      const { name, description, criteria, maxScore, weightedScoring, autoGradingEnabled, isTemplate } = req.body;
      const user = req.user as any;
      
      if (!name || !criteria) {
        return res.status(400).json({ message: "Nome e critérios são obrigatórios" });
      }

      const rubricId = uuidv4();
      const now = new Date().toISOString();

      await db.run(`
        INSERT INTO rubrics 
        (id, name, description, criteria, max_score, weighted_scoring, auto_grading_enabled, created_by, is_template, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        rubricId, name, description, JSON.stringify(criteria), 
        maxScore || 100, weightedScoring ? 1 : 0, autoGradingEnabled ? 1 : 0,
        user.id, isTemplate ? 1 : 0, now, now
      ]);

      res.json({ 
        message: "Rubrica criada com sucesso",
        rubricId 
      });
    } catch (error) {
      console.error('Erro ao criar rubrica:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Associar rubrica à atividade
  app.post('/api/activities/:id/rubrics', isAuthenticated, hasRole(['teacher', 'admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const { rubricId, weight, isPrimary } = req.body;
      const user = req.user as any;

      // Verificar se a atividade existe e se o usuário tem permissão
      const activity = await db.get(`
        SELECT * FROM activities 
        WHERE id = ? AND created_by = ?
      `, [id, user.id]);

      if (!activity) {
        return res.status(404).json({ message: "Atividade não encontrada" });
      }

      const associationId = uuidv4();
      const now = new Date().toISOString();

      await db.run(`
        INSERT OR REPLACE INTO activity_rubrics 
        (id, activity_id, rubric_id, weight, is_primary, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [associationId, id, rubricId, weight || 1.0, isPrimary ? 1 : 0, now]);

      res.json({ 
        message: "Rubrica associada com sucesso",
        associationId 
      });
    } catch (error) {
      console.error('Erro ao associar rubrica:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar rubricas de uma atividade
  app.get('/api/activities/:id/rubrics', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      
      const rubrics = await db.all(`
        SELECT r.*, ar.weight, ar.is_primary
        FROM activity_rubrics ar
        JOIN rubrics r ON ar.rubric_id = r.id
        WHERE ar.activity_id = ?
        ORDER BY ar.is_primary DESC, r.name
      `, [id]);
      
      const result = rubrics.map(rubric => ({
        ...rubric,
        criteria: JSON.parse(rubric.criteria)
      }));
      
      res.json(result);
    } catch (error) {
      console.error('Erro ao buscar rubricas da atividade:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== ROTAS DE AVALIAÇÃO DETALHADA =====
  
  // Criar avaliação detalhada
  app.post('/api/submissions/:id/detailed-evaluation', isAuthenticated, hasRole(['teacher', 'admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const { rubricId, criterionScores, feedback, autoGenerated } = req.body;
      const user = req.user as any;

      // Calcular pontuação total
      const rubric = await db.get(`
        SELECT criteria, max_score FROM rubrics WHERE id = ?
      `, [rubricId]);

      if (!rubric) {
        return res.status(404).json({ message: "Rubrica não encontrada" });
      }

      const criteria = JSON.parse(rubric.criteria);
      let totalScore = 0;
      let maxPossibleScore = 0;

      criteria.criteria.forEach((criterion: any) => {
        const score = criterionScores[criterion.id] || 0;
        const weight = criterion.weight || 1;
        totalScore += score * weight;
        maxPossibleScore += 4 * weight; // Assumindo escala de 1-4
      });

      // Normalizar para a pontuação máxima da rubrica
      const normalizedScore = (totalScore / maxPossibleScore) * rubric.max_score;

      const evaluationId = uuidv4();
      const now = new Date().toISOString();

      await db.run(`
        INSERT INTO detailed_evaluations 
        (id, submission_id, rubric_id, criterion_scores, total_score, auto_generated, evaluator_id, feedback, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        evaluationId, id, rubricId, JSON.stringify(criterionScores),
        normalizedScore, autoGenerated ? 1 : 0, user.id, feedback, now, now
      ]);

      // Atualizar pontuação da submissão
      await db.run(`
        UPDATE activity_submissions 
        SET score = ?, updated_at = ?
        WHERE id = ?
      `, [normalizedScore, now, id]);

      res.json({ 
        message: "Avaliação criada com sucesso",
        evaluationId,
        totalScore: normalizedScore
      });
    } catch (error) {
      console.error('Erro ao criar avaliação:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== ROTAS DE EQUIPES =====
  
  // Criar equipe
  app.post('/api/activities/:id/teams', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, maxMembers } = req.body;
      const user = req.user as any;

      if (!name) {
        return res.status(400).json({ message: "Nome da equipe é obrigatório" });
      }

      const teamId = uuidv4();
      const now = new Date().toISOString();

      // Criar equipe
      await db.run(`
        INSERT INTO teams 
        (id, activity_id, name, description, max_members, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [teamId, id, name, description, maxMembers || 4, user.id, now, now]);

      // Adicionar criador como líder
      const memberId = uuidv4();
      await db.run(`
        INSERT INTO team_members 
        (id, team_id, user_id, role, joined_at)
        VALUES (?, ?, ?, 'leader', ?)
      `, [memberId, teamId, user.id, now]);

      res.json({ 
        message: "Equipe criada com sucesso",
        teamId 
      });
    } catch (error) {
      console.error('Erro ao criar equipe:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Listar equipes de uma atividade
  app.get('/api/activities/:id/teams', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      
      const teams = await db.all(`
        SELECT t.*, 
               u.firstName || ' ' || u.lastName as creator_name,
               COUNT(tm.id) as member_count
        FROM teams t
        LEFT JOIN users u ON t.created_by = u.id
        LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.status = 'active'
        WHERE t.activity_id = ? AND t.status = 'active'
        GROUP BY t.id
        ORDER BY t.created_at DESC
      `, [id]);
      
      res.json(teams);
    } catch (error) {
      console.error('Erro ao buscar equipes:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Entrar em equipe
  app.post('/api/teams/:id/join', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user as any;

      // Verificar se a equipe existe e tem vagas
      const team = await db.get(`
        SELECT t.*, COUNT(tm.id) as member_count
        FROM teams t
        LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.status = 'active'
        WHERE t.id = ? AND t.status = 'active'
        GROUP BY t.id
      `, [id]);

      if (!team) {
        return res.status(404).json({ message: "Equipe não encontrada" });
      }

      if (team.member_count >= team.max_members) {
        return res.status(400).json({ message: "Equipe está cheia" });
      }

      // Verificar se já é membro
      const existingMember = await db.get(`
        SELECT * FROM team_members 
        WHERE team_id = ? AND user_id = ? AND status = 'active'
      `, [id, user.id]);

      if (existingMember) {
        return res.status(400).json({ message: "Você já é membro desta equipe" });
      }

      const memberId = uuidv4();
      const now = new Date().toISOString();

      await db.run(`
        INSERT INTO team_members 
        (id, team_id, user_id, role, joined_at)
        VALUES (?, ?, ?, 'member', ?)
      `, [memberId, id, user.id, now]);

      res.json({ 
        message: "Entrou na equipe com sucesso",
        memberId 
      });
    } catch (error) {
      console.error('Erro ao entrar na equipe:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== ROTAS DE CONQUISTAS =====
  
  // Listar conquistas do usuário
  app.get('/api/user/achievements', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      const achievements = await db.all(`
        SELECT a.*, ua.earned_at, ua.points_earned
        FROM user_achievements ua
        JOIN achievements a ON ua.achievement_id = a.id
        WHERE ua.user_id = ?
        ORDER BY ua.earned_at DESC
      `, [user.id]);
      
      res.json(achievements);
    } catch (error) {
      console.error('Erro ao buscar conquistas:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar pontuação total do usuário
  app.get('/api/user/points', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      const result = await db.get(`
        SELECT COALESCE(SUM(points), 0) as total_points
        FROM user_points
        WHERE user_id = ?
      `, [user.id]);
      
      const recentPoints = await db.all(`
        SELECT * FROM user_points
        WHERE user_id = ?
        ORDER BY earned_at DESC
        LIMIT 10
      `, [user.id]);
      
      res.json({
        totalPoints: result.total_points,
        recentPoints
      });
    } catch (error) {
      console.error('Erro ao buscar pontos:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== ROTAS DE ANALYTICS =====
  
  // Registrar evento de analytics
  app.post('/api/activities/:id/analytics', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { eventType, eventData, sessionId } = req.body;
      const user = req.user as any;

      const analyticsId = uuidv4();
      const now = new Date().toISOString();

      await db.run(`
        INSERT INTO activity_analytics 
        (id, activity_id, user_id, event_type, event_data, session_id, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [analyticsId, id, user.id, eventType, JSON.stringify(eventData), sessionId, now]);

      res.json({ message: "Evento registrado" });
    } catch (error) {
      console.error('Erro ao registrar analytics:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar analytics de uma atividade
  app.get('/api/activities/:id/analytics', isAuthenticated, hasRole(['teacher', 'admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const { startDate, endDate, eventType } = req.query;
      
      let query = `
        SELECT aa.*, u.firstName || ' ' || u.lastName as user_name
        FROM activity_analytics aa
        JOIN users u ON aa.user_id = u.id
        WHERE aa.activity_id = ?
      `;
      
      const params = [id];
      
      if (startDate) {
        query += ` AND aa.timestamp >= ?`;
        params.push(startDate as string);
      }
      
      if (endDate) {
        query += ` AND aa.timestamp <= ?`;
        params.push(endDate as string);
      }
      
      if (eventType) {
        query += ` AND aa.event_type = ?`;
        params.push(eventType as string);
      }
      
      query += ` ORDER BY aa.timestamp DESC LIMIT 1000`;
      
      const analytics = await db.all(query, params);
      
      const result = analytics.map(item => ({
        ...item,
        event_data: item.event_data ? JSON.parse(item.event_data) : null
      }));
      
      res.json(result);
    } catch (error) {
      console.error('Erro ao buscar analytics:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  console.log('🚀 Rotas avançadas de atividades registradas!');
}