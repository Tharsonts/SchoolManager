import { sqliteTable, text, integer, real, blob } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique(), // Removido notNull para permitir null quando pending
  password: text("password"), // Removido notNull para permitir null quando pending
  firstName: text("firstName").notNull(),
  lastName: text("lastName").notNull(),
  profileImageUrl: text("profileImageUrl"),
  role: text("role", { enum: ["admin", "teacher", "student", "coordinator", "director"] }).notNull(),
  status: text("status", { enum: ["active", "inactive", "pending"] }).notNull().default("active"),
  lastSeen: text("lastSeen"), // Último acesso do usuário para status online/offline
  phone: text("phone"),
  address: text("address"),
  birthDate: text("birthDate"),
  registrationNumber: text("registrationNumber").notNull().unique(),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export const userRequests = sqliteTable("user_requests", {
  id: text("id").primaryKey(),
  firstName: text("firstName").notNull(),
  lastName: text("lastName").notNull(),
  email: text("email").notNull(),
  role: text("role", { enum: ["admin", "teacher", "student", "coordinator", "director"] }).notNull(),
  phone: text("phone"),
  address: text("address"),
  registrationNumber: text("registrationNumber").notNull(),
  classId: text("classId"),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  requestedBy: text("requestedBy").notNull().references(() => users.id),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export const systemLogs = sqliteTable("systemLogs", {
  id: text("id").primaryKey(),
  timestamp: text("timestamp").notNull(),
  level: text("level", { enum: ["INFO", "WARN", "ERROR", "SUCCESS"] }).notNull(),
  action: text("action").notNull(),
  description: text("description").notNull(),
  userId: text("userId").references(() => users.id),
  userName: text("userName"),
  userRole: text("userRole"),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  // Campos enriquecidos de localização e dispositivo
  locationCity: text("locationCity"),
  locationRegion: text("locationRegion"),
  locationCountry: text("locationCountry"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  timezone: text("timezone"),
  deviceType: text("deviceType"),
  os: text("os"),
  osVersion: text("osVersion"),
  browser: text("browser"),
  browserVersion: text("browserVersion"),
  metadata: text("metadata"), // JSON string
  code: text("code"), // Código para ações sensíveis
});

export const subjects = sqliteTable("subjects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  status: text("status", { enum: ["active", "inactive", "pending"] }).notNull().default("active"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export const classes = sqliteTable("classes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  grade: text("grade").notNull(), // Ex: "9º Ano", "1º Ano EM"
  section: text("section").notNull(), // Ex: "A", "B", "C"
  academicYear: text("academicYear").notNull(), // Ex: "2024"
  capacity: integer("capacity").notNull().default(30),
  coordinatorId: text("coordinatorId").references(() => users.id),
  status: text("status", { enum: ["active", "inactive", "completed", "pending"] }).notNull().default("active"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

// Relacionamento entre turma, disciplina e professor
export const classSubjects = sqliteTable("classSubjects", {
  id: text("id").primaryKey(),
  classId: text("classId").references(() => classes.id),
  subjectId: text("subjectId").references(() => subjects.id),
  teacherId: text("teacherId").references(() => users.id),
  schedule: text("schedule"), // Ex: "Segunda-feira 8:00-9:30"
  room: text("room"), // Ex: "Sala 101"
  semester: text("semester"), // Ex: "1º Semestre"
  academicYear: text("academicYear").notNull(),
  status: text("status", { enum: ["active", "inactive", "completed", "pending"] }).notNull().default("active"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

// Matrícula dos alunos nas turmas
export const studentClass = sqliteTable("studentClass", {
  id: text("id").primaryKey(),
  studentId: text("studentId").references(() => users.id),
  classId: text("classId").references(() => classes.id),
  enrollmentDate: text("enrollmentDate").notNull(),
  status: text("status", { enum: ["active", "inactive", "dropped", "completed", "pending"] }).notNull().default("active"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

// Períodos acadêmicos (bimestres/semestres)
export const academicPeriods = sqliteTable("academicPeriods", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // Ex: "1º Bimestre", "2º Semestre"
  description: text("description"),
  period: integer("period").notNull(), // 1, 2, 3, 4 para bimestres ou 1, 2 para semestres
  academicYear: text("academicYear").notNull(), // Ex: "2024"
  startDate: text("startDate").notNull(),
  endDate: text("endDate").notNull(),
  status: text("status", { enum: ["active", "inactive", "completed", "pending"] }).notNull().default("pending"),
  isCurrent: integer("isCurrent", { mode: "boolean" }).notNull().default(false),
  totalDays: integer("totalDays"),
  remainingDays: integer("remainingDays"),
  createdBy: text("createdBy").references(() => users.id), // Quem criou o período
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

// Sistema de notas
export const grades = sqliteTable("grades", {
  id: text("id").primaryKey(),
  studentId: text("studentId").references(() => users.id),
  classSubjectId: text("classSubjectId").references(() => classSubjects.id),
  type: text("type", { enum: ["exam", "homework", "project", "participation", "quiz"] }).notNull(),
  title: text("title").notNull(),
  grade: real("grade").notNull(),
  maxGrade: real("maxGrade").notNull().default(10),
  weight: real("weight").notNull().default(1),
  date: text("date").notNull(),
  comments: text("comments"),
  createdBy: text("createdBy").references(() => users.id),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

// Sistema de presença
export const attendance = sqliteTable("attendance", {
  id: text("id").primaryKey(),
  studentId: text("studentId").references(() => users.id).notNull(),
  classId: text("classId").references(() => classes.id).notNull(),
  subjectId: text("subjectId").references(() => subjects.id).notNull(),
  teacherId: text("teacherId").references(() => users.id).notNull(),
  date: text("date").notNull(),
  status: text("status", { enum: ["present", "absent", "late", "excused"] }).notNull().default("present"),
  notes: text("notes"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

// Sistema de eventos e calendário
export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type", { enum: ["exam", "homework", "meeting", "activity", "holiday", "event", "presentation", "training", "announcement"] }).notNull(),
  startDate: text("startDate").notNull(),
  endDate: text("endDate"),
  startTime: text("startTime"), // Horário de início
  endTime: text("endTime"), // Horário de fim
  location: text("location"),
  color: text("color").notNull().default("#3B82F6"),
  classId: text("classId").references(() => classes.id),
  subjectId: text("subjectId").references(() => subjects.id),
  createdBy: text("createdBy").references(() => users.id),
  isGlobal: integer("isGlobal", { mode: "boolean" }).notNull().default(false), // Evento global do coordenador
  status: text("status", { enum: ["active", "pending", "cancelled", "completed"] }).notNull().default("active"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

// Sistema de notificações
export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type", { enum: ["info", "warning", "error", "success", "reminder", "announcement", "grade", "assignment"] }).notNull(),
  priority: text("priority", { enum: ["low", "medium", "high", "urgent"] }).notNull().default("medium"),
  senderId: text("senderId").references(() => users.id),
  recipientId: text("recipientId").references(() => users.id), // null = todos
  classId: text("classId").references(() => classes.id), // notificação para uma turma específica
  subjectId: text("subjectId").references(() => subjects.id), // notificação para uma disciplina específica
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

// Configurações do sistema
export const settings = sqliteTable("settings", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  category: text("category", { enum: ["general", "academic", "notification", "security"] }).notNull().default("general"),
  updatedBy: text("updatedBy").references(() => users.id),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

// === SISTEMA DE ATIVIDADES COMPLETO ===

export const activities = sqliteTable("activities", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  subjectId: text("subjectId").references(() => subjects.id),
  teacherId: text("teacherId").references(() => users.id),
  classId: text("classId").references(() => classes.id), // Adicionado para vincular à turma
  dueDate: text("dueDate").notNull(),
  maxGrade: real("maxGrade").notNull().default(10),
  instructions: text("instructions"),
  requirements: text("requirements"),
  status: text("status", { enum: ["draft", "active", "expired", "archived", "pending"] }).notNull().default("draft"),
  allowLateSubmission: integer("allowLateSubmission", { mode: "boolean" }).notNull().default(false),
  latePenalty: real("latePenalty").notNull().default(0),
  maxFileSize: integer("maxFileSize").notNull().default(10), // MB
  allowedFileTypes: text("allowedFileTypes"), // JSON array
  approvedByCoordinator: integer("approvedByCoordinator").notNull().default(0),
  coordinatorApprovalDate: text("coordinatorApprovalDate"),
  coordinatorId: text("coordinatorId").references(() => users.id),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export const activityFiles = sqliteTable("activityFiles", {
  id: text("id").primaryKey(),
  activityId: text("activityId").references(() => activities.id),
  fileName: text("fileName").notNull(),
  originalFileName: text("originalFileName").notNull(),
  filePath: text("filePath").notNull(),
  fileSize: integer("fileSize").notNull(),
  fileType: text("fileType").notNull(),
  fileCategory: text("fileCategory", { enum: ["reference", "template", "example"] }).notNull(),
  uploadedBy: text("uploadedBy").references(() => users.id),
  createdAt: text("createdAt").notNull(),
});

export const activitySubmissions = sqliteTable("activitySubmissions", {
  id: text("id").primaryKey(),
  activityId: text("activityId").references(() => activities.id),
  studentId: text("studentId").references(() => users.id),
  submittedAt: text("submittedAt").notNull(),
  comment: text("comment"),
  status: text("status", { enum: ["submitted", "late", "graded", "returned", "resubmitted"] }).notNull().default("submitted"),
  grade: real("grade"),
  maxGrade: real("maxGrade").notNull().default(10),
  feedback: text("feedback"),
  gradedBy: text("gradedBy").references(() => users.id),
  gradedAt: text("gradedAt"),
  isLate: integer("isLate", { mode: "boolean" }).notNull().default(false),
  latePenaltyApplied: real("latePenaltyApplied").notNull().default(0),
  finalGrade: real("finalGrade"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export const submissionFiles = sqliteTable("submissionFiles", {
  id: text("id").primaryKey(),
  submissionId: text("submissionId").references(() => activitySubmissions.id),
  fileName: text("fileName").notNull(),
  originalFileName: text("originalFileName").notNull(),
  filePath: text("filePath").notNull(),
  fileSize: integer("fileSize").notNull(),
  fileType: text("fileType").notNull(),
  uploadedAt: text("uploadedAt").notNull(),
});

export const submissionHistory = sqliteTable("submissionHistory", {
  id: text("id").primaryKey(),
  submissionId: text("submissionId").references(() => activitySubmissions.id),
  action: text("action", { enum: ["submitted", "graded", "returned", "resubmitted", "late_penalty_applied"] }).notNull(),
  performedBy: text("performedBy").references(() => users.id),
  performedAt: text("performedAt").notNull(),
  details: text("details"),
  previousStatus: text("previousStatus"),
  newStatus: text("newStatus"),
  gradeChange: real("gradeChange"),
});

export const activityRubrics = sqliteTable("activityRubrics", {
  id: text("id").primaryKey(),
  activityId: text("activityId").references(() => activities.id),
  name: text("name").notNull(),
  description: text("description"),
  criteria: text("criteria").notNull(), // JSON array of criteria
  totalPoints: real("totalPoints").notNull(),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export const rubricEvaluations = sqliteTable("rubricEvaluations", {
  id: text("id").primaryKey(),
  rubricId: text("rubricId").references(() => activityRubrics.id),
  submissionId: text("submissionId").references(() => activitySubmissions.id),
  evaluatorId: text("evaluatorId").references(() => users.id),
  criteriaScores: text("criteriaScores").notNull(), // JSON object
  totalScore: real("totalScore").notNull(),
  comments: text("comments"),
  evaluatedAt: text("evaluatedAt").notNull(),
});

// === SISTEMA DE COMUNICAÇÃO ===

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  senderId: text("senderId").references(() => users.id),
  recipientId: text("recipientId").references(() => users.id),
  subject: text("subject"),
  content: text("content").notNull(),
  type: text("type", { enum: ["private", "announcement", "system"] }).notNull().default("private"),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  priority: text("priority", { enum: ["low", "medium", "high"] }).notNull().default("medium"),
  parentMessageId: text("parentMessageId"), // Para respostas (referência será adicionada depois)
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

// === SISTEMA DE RELATÓRIOS ===

export const reports = sqliteTable("reports", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type", { enum: ["academic", "attendance", "behavior", "performance", "custom"] }).notNull(),
  description: text("description"),
  parameters: text("parameters"), // JSON com parâmetros do relatório
  generatedBy: text("generatedBy").references(() => users.id),
  filePath: text("filePath"), // Caminho do arquivo gerado
  status: text("status", { enum: ["generating", "completed", "error"] }).notNull().default("generating"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

// === SISTEMA DE BACKUP/LOGS ===

// Materiais didáticos
export const materials = sqliteTable("materials", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  subjectId: text("subjectId").references(() => subjects.id),
  classId: text("classId").references(() => classes.id),
  teacherId: text("teacherId").references(() => users.id),
  materialType: text("materialType", { enum: ["slide", "document", "video", "link", "exercise", "other", "folder"] }).notNull(),
  content: text("content"), // Conteúdo textual do material
  folder: text("folder"), // Nome da pasta para organizar materiais
  isPublic: integer("isPublic", { mode: "boolean" }).notNull().default(true),
  status: text("status", { enum: ["active", "inactive", "draft"] }).notNull().default("active"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

// Arquivos de materiais
export const materialFiles = sqliteTable("materialFiles", {
  id: text("id").primaryKey(),
  materialId: text("materialId").references(() => materials.id),
  fileName: text("fileName").notNull(),
  originalFileName: text("originalFileName").notNull(),
  filePath: text("filePath").notNull(),
  fileSize: integer("fileSize").notNull(),
  fileType: text("fileType").notNull(),
  fileCategory: text("fileCategory", { enum: ["main", "attachment", "reference"] }).notNull().default("main"),
  uploadedBy: text("uploadedBy").references(() => users.id),
  createdAt: text("createdAt").notNull(),
});

// Provas
export const exams = sqliteTable("exams", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  subjectId: text("subjectId").references(() => subjects.id).notNull(),
  classId: text("classId").references(() => classes.id).notNull(),
  teacherId: text("teacherId").references(() => users.id).notNull(),
  examDate: text("examDate").notNull(),
  duration: integer("duration"), // em minutos
  totalPoints: real("totalPoints").notNull().default(10),
  semester: text("semester", { enum: ["1", "2"] }).notNull(), // 1º ou 2º semestre
  bimonthly: text("bimonthly", { enum: ["1", "2", "3", "4"] }).notNull(), // 1º, 2º, 3º ou 4º bimestre
  status: text("status", { enum: ["scheduled", "completed", "cancelled"] }).notNull().default("scheduled"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

// Notas das provas
export const examGrades = sqliteTable("examGrades", {
  id: text("id").primaryKey(),
  examId: text("examId").references(() => exams.id).notNull(),
  studentId: text("studentId").references(() => users.id).notNull(),
  grade: real("grade"), // Nota obtida (pode ser null se ainda não foi avaliada)
  isPresent: integer("isPresent", { mode: "boolean" }).notNull().default(true),
  observations: text("observations"),
  gradedBy: text("gradedBy").references(() => users.id),
  gradedAt: text("gradedAt"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

// Horários das turmas
export const classSchedule = sqliteTable("classSchedule", {
  id: text("id").primaryKey(),
  classId: text("classId").references(() => classes.id).notNull(),
  day: text("day", { enum: ["monday", "tuesday", "wednesday", "thursday", "friday"] }).notNull(),
  startTime: text("startTime").notNull(), // Formato HH:MM
  endTime: text("endTime").notNull(), // Formato HH:MM
  subjectId: text("subjectId").references(() => subjects.id),
  teacherId: text("teacherId").references(() => users.id),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});
