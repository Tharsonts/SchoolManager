import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  boolean,
  serial,
  date,
  time,
  decimal,
  json,
  integer
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  password: varchar("password"), // Added password for local authentication
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("student").notNull(), // admin, coordinator, teacher, student
  status: varchar("status").default("active").notNull(), // active, inactive
  phone: varchar("phone"),
  address: varchar("address"),
  registrationNumber: varchar("registration_number"),
  classId: varchar("class_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Classes (Turmas)
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  grade: varchar("grade").notNull(), // Ensino Fundamental, Ensino Médio
  year: varchar("year").notNull(),
  teacherId: varchar("teacher_id").references(() => users.id),
  room: varchar("room"),
  status: varchar("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subjects (Disciplinas)
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  teacherId: varchar("teacher_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Class-Subject relationship
export const classSubjects = pgTable("class_subjects", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").references(() => classes.id).notNull(),
  subjectId: integer("subject_id").references(() => subjects.id).notNull(),
  teacherId: varchar("teacher_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Grades (Notas)
export const grades = pgTable("grades", {
  id: serial("id").primaryKey(),
  studentId: varchar("student_id").references(() => users.id).notNull(),
  classId: integer("class_id").references(() => classes.id).notNull(),
  subjectId: integer("subject_id").references(() => subjects.id).notNull(),
  period: varchar("period").notNull(), // 1º Bimestre, 2º Bimestre, etc.
  value: decimal("value", { precision: 4, scale: 2 }).notNull(),
  teacherId: varchar("teacher_id").references(() => users.id),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Attendance (Presença)
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  studentId: varchar("student_id").references(() => users.id).notNull(),
  classId: integer("class_id").references(() => classes.id).notNull(),
  subjectId: integer("subject_id").references(() => subjects.id),
  date: date("date").notNull(),
  status: varchar("status").notNull(), // present, absent, late
  teacherId: varchar("teacher_id").references(() => users.id),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Events (Eventos)
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  date: date("date").notNull(),
  startTime: time("start_time"),
  endTime: time("end_time"),
  location: varchar("location"),
  type: varchar("type").notNull(), // exam, meeting, activity, holiday
  classId: integer("class_id").references(() => classes.id), // null for school-wide events
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Diary (Diário de Classe)
export const diary = pgTable("diary", {
  id: serial("id").primaryKey(),
  teacherId: varchar("teacher_id").references(() => users.id).notNull(),
  classId: integer("class_id").references(() => classes.id).notNull(),
  subjectId: integer("subject_id").references(() => subjects.id).notNull(),
  date: date("date").notNull(),
  content: text("content").notNull(),
  attachments: json("attachments"), // URLs or references to attachments
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications/Messages (Recados)
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type").notNull(), // info, event, reminder, assignment, alert
  senderId: varchar("sender_id").references(() => users.id),
  targetId: varchar("target_id").notNull(), // user ID or 'all' for all users
  targetType: varchar("target_type").notNull(), // user, class, role, all
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertClass = typeof classes.$inferInsert;
export type Class = typeof classes.$inferSelect;

export type InsertSubject = typeof subjects.$inferInsert;
export type Subject = typeof subjects.$inferSelect;

export type InsertClassSubject = typeof classSubjects.$inferInsert;
export type ClassSubject = typeof classSubjects.$inferSelect;

export type InsertGrade = typeof grades.$inferInsert;
export type Grade = typeof grades.$inferSelect;

export type InsertAttendance = typeof attendance.$inferInsert;
export type Attendance = typeof attendance.$inferSelect;

export type InsertEvent = typeof events.$inferInsert;
export type Event = typeof events.$inferSelect;

export type InsertDiaryEntry = typeof diary.$inferInsert;
export type DiaryEntry = typeof diary.$inferSelect;

export type InsertNotification = typeof notifications.$inferInsert;
export type Notification = typeof notifications.$inferSelect;

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const insertClassSchema = createInsertSchema(classes);
export const insertSubjectSchema = createInsertSchema(subjects);
export const insertClassSubjectSchema = createInsertSchema(classSubjects);
export const insertGradeSchema = createInsertSchema(grades);
export const insertAttendanceSchema = createInsertSchema(attendance);
export const insertEventSchema = createInsertSchema(events);
export const insertDiaryEntrySchema = createInsertSchema(diary);
export const insertNotificationSchema = createInsertSchema(notifications);
