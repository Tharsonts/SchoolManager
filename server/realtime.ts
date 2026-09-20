import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
// Removido import do logger - usando console.log diretamente

export class RealtimeManager {
  private io: SocketIOServer;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.setupEventHandlers();
    console.log('🔌 Sistema de tempo real inicializado');
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Cliente conectado: ${socket.id}`);

      // Autenticar usuário
      socket.on('authenticate', (data: { userId: string, role: string }) => {
        this.connectedUsers.set(data.userId, socket.id);
        socket.join(`user_${data.userId}`);
        socket.join(`role_${data.role}`);
        
        console.log(`👤 Usuário autenticado: ${data.userId} (${data.role})`);
        
        socket.emit('authenticated', { 
          message: 'Autenticado com sucesso',
          userId: data.userId 
        });
      });

      // Desconectar usuário
      socket.on('disconnect', () => {
        // Encontrar e remover usuário desconectado
        for (const [userId, socketId] of this.connectedUsers.entries()) {
          if (socketId === socket.id) {
            this.connectedUsers.delete(userId);
            console.log(`👋 Usuário desconectado: ${userId}`);
            break;
          }
        }
      });

      // Eventos específicos para atividades
      socket.on('join_activity', (activityId: string) => {
        socket.join(`activity_${activityId}`);
        console.log(`📚 Cliente ${socket.id} entrou na atividade ${activityId}`);
      });

      socket.on('leave_activity', (activityId: string) => {
        socket.leave(`activity_${activityId}`);
        console.log(`📚 Cliente ${socket.id} saiu da atividade ${activityId}`);
      });
    });
  }

  // Notificar nova atividade para todos os alunos de uma turma
  public notifyNewActivity(activity: any, classId: string) {
    this.io.to(`role_student`).emit('new_activity', {
      type: 'new_activity',
      activity,
      classId,
      timestamp: new Date().toISOString()
    });
    
    console.log(`📢 Nova atividade notificada para turma ${classId}: ${activity.title}`);
  }

  // Notificar atividade atualizada
  public notifyActivityUpdate(activity: any, classId: string) {
    this.io.to(`role_student`).emit('activity_updated', {
      type: 'activity_updated',
      activity,
      classId,
      timestamp: new Date().toISOString()
    });
    
    console.log(`📝 Atividade atualizada notificada: ${activity.title}`);
  }

  // Notificar atividade removida
  public notifyActivityRemoved(activityId: string, classId: string) {
    this.io.to(`role_student`).emit('activity_removed', {
      type: 'activity_removed',
      activityId,
      classId,
      timestamp: new Date().toISOString()
    });
    
    console.log(`🗑️ Atividade removida notificada: ${activityId}`);
  }

  // Notificar submissão de atividade
  public notifyActivitySubmission(submission: any, activityId: string) {
    this.io.to(`activity_${activityId}`).emit('new_submission', {
      type: 'new_submission',
      submission,
      activityId,
      timestamp: new Date().toISOString()
    });
    
    console.log(`📤 Nova submissão notificada para atividade ${activityId}`);
  }

  // Notificar avaliação de atividade
  public notifyActivityGraded(activityId: string, studentId: string, grade: any) {
    this.io.to(`user_${studentId}`).emit('activity_graded', {
      type: 'activity_graded',
      activityId,
      grade,
      timestamp: new Date().toISOString()
    });
    
    console.log(`⭐ Atividade avaliada notificada para aluno ${studentId}`);
  }

  // Notificar usuário específico
  public notifyUser(userId: string, event: string, data: any) {
    this.io.to(`user_${userId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
    
    console.log(`📨 Notificação enviada para usuário ${userId}: ${event}`);
  }

  // Notificar todos os usuários de uma role
  public notifyRole(role: string, event: string, data: any) {
    this.io.to(`role_${role}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
    
    console.log(`📢 Notificação enviada para role ${role}: ${event}`);
  }

  // Obter estatísticas de conexões
  public getConnectionStats() {
    return {
      totalConnections: this.io.engine.clientsCount,
      connectedUsers: this.connectedUsers.size,
      connectedUserIds: Array.from(this.connectedUsers.keys())
    };
  }
}

let realtimeManager: RealtimeManager | null = null;

export function initializeRealtime(server: HTTPServer): RealtimeManager {
  if (!realtimeManager) {
    realtimeManager = new RealtimeManager(server);
  }
  return realtimeManager;
}

export function getRealtimeManager(): RealtimeManager | null {
  return realtimeManager;
}






