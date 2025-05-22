import {
  users,
  type User,
  type UpsertUser,
  classes,
  type Class,
  type InsertClass,
  subjects,
  type Subject,
  type InsertSubject,
  grades,
  type Grade,
  type InsertGrade,
  attendance,
  type Attendance,
  type InsertAttendance,
  events,
  type Event,
  type InsertEvent,
  diary,
  type DiaryEntry,
  type InsertDiaryEntry,
  notifications,
  type Notification,
  type InsertNotification
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, inArray } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUsersByRole(role: string): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Class operations
  getClass(id: string): Promise<Class | undefined>;
  getAllClasses(): Promise<Class[]>;
  createClass(classData: InsertClass): Promise<Class>;
  
  // Subject operations
  getSubject(id: string): Promise<Subject | undefined>;
  getAllSubjects(): Promise<Subject[]>;
  createSubject(subjectData: InsertSubject): Promise<Subject>;
  
  // Grade operations
  getGrade(id: string): Promise<Grade | undefined>;
  getGradesByStudent(studentId: string): Promise<Grade[]>;
  getGradesByClass(classId: string): Promise<Grade[]>;
  getGradesByClassAndSubject(classId: string, subjectId: string): Promise<Grade[]>;
  createGrade(gradeData: InsertGrade): Promise<Grade>;
  
  // Attendance operations
  getAttendance(id: string): Promise<Attendance | undefined>;
  getAttendanceByStudent(studentId: string): Promise<Attendance[]>;
  getAttendanceByClass(classId: string): Promise<Attendance[]>;
  getAttendanceByClassAndDate(classId: string, date: string): Promise<Attendance[]>;
  createAttendance(attendanceData: InsertAttendance): Promise<Attendance>;
  
  // Event operations
  getEvent(id: string): Promise<Event | undefined>;
  getAllEvents(): Promise<Event[]>;
  getEventsByClass(classId: string): Promise<Event[]>;
  createEvent(eventData: InsertEvent): Promise<Event>;
  
  // Diary operations
  getDiaryEntry(id: string): Promise<DiaryEntry | undefined>;
  getDiaryEntriesByTeacher(teacherId: string): Promise<DiaryEntry[]>;
  getDiaryEntriesByClass(classId: string): Promise<DiaryEntry[]>;
  getDiaryEntriesByClassAndSubject(classId: string, subjectId: string): Promise<DiaryEntry[]>;
  createDiaryEntry(diaryData: InsertDiaryEntry): Promise<DiaryEntry>;
  
  // Notification operations
  getNotification(id: string): Promise<Notification | undefined>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  createNotification(notificationData: InsertNotification): Promise<Notification>;
  markNotificationAsRead(notificationId: string): Promise<Notification>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Class operations
  async getClass(id: string): Promise<Class | undefined> {
    const [classItem] = await db.select().from(classes).where(eq(classes.id, id));
    return classItem;
  }

  async getAllClasses(): Promise<Class[]> {
    return await db.select().from(classes);
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const [classItem] = await db
      .insert(classes)
      .values(classData)
      .returning();
    return classItem;
  }

  // Subject operations
  async getSubject(id: string): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subject;
  }

  async getAllSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects);
  }

  async createSubject(subjectData: InsertSubject): Promise<Subject> {
    const [subject] = await db
      .insert(subjects)
      .values(subjectData)
      .returning();
    return subject;
  }

  // Grade operations
  async getGrade(id: string): Promise<Grade | undefined> {
    const [grade] = await db.select().from(grades).where(eq(grades.id, id));
    return grade;
  }

  async getGradesByStudent(studentId: string): Promise<Grade[]> {
    return await db.select().from(grades).where(eq(grades.studentId, studentId));
  }

  async getGradesByClass(classId: string): Promise<Grade[]> {
    return await db.select().from(grades).where(eq(grades.classId, classId));
  }

  async getGradesByClassAndSubject(classId: string, subjectId: string): Promise<Grade[]> {
    return await db
      .select()
      .from(grades)
      .where(
        and(
          eq(grades.classId, classId),
          eq(grades.subjectId, subjectId)
        )
      );
  }

  async createGrade(gradeData: InsertGrade): Promise<Grade> {
    const [grade] = await db
      .insert(grades)
      .values(gradeData)
      .returning();
    return grade;
  }

  // Attendance operations
  async getAttendance(id: string): Promise<Attendance | undefined> {
    const [attendance] = await db.select().from(attendance).where(eq(attendance.id, id));
    return attendance;
  }

  async getAttendanceByStudent(studentId: string): Promise<Attendance[]> {
    return await db.select().from(attendance).where(eq(attendance.studentId, studentId));
  }

  async getAttendanceByClass(classId: string): Promise<Attendance[]> {
    return await db.select().from(attendance).where(eq(attendance.classId, classId));
  }

  async getAttendanceByClassAndDate(classId: string, date: string): Promise<Attendance[]> {
    return await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.classId, classId),
          eq(attendance.date, date)
        )
      );
  }

  async createAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const [attendanceRecord] = await db
      .insert(attendance)
      .values(attendanceData)
      .returning();
    return attendanceRecord;
  }

  // Event operations
  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async getAllEvents(): Promise<Event[]> {
    return await db.select().from(events);
  }

  async getEventsByClass(classId: string): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .where(
        and(
          eq(events.classId, classId)
        )
      );
  }

  async createEvent(eventData: InsertEvent): Promise<Event> {
    const [event] = await db
      .insert(events)
      .values(eventData)
      .returning();
    return event;
  }

  // Diary operations
  async getDiaryEntry(id: string): Promise<DiaryEntry | undefined> {
    const [diaryEntry] = await db.select().from(diary).where(eq(diary.id, id));
    return diaryEntry;
  }

  async getDiaryEntriesByTeacher(teacherId: string): Promise<DiaryEntry[]> {
    return await db.select().from(diary).where(eq(diary.teacherId, teacherId));
  }

  async getDiaryEntriesByClass(classId: string): Promise<DiaryEntry[]> {
    return await db.select().from(diary).where(eq(diary.classId, classId));
  }

  async getDiaryEntriesByClassAndSubject(classId: string, subjectId: string): Promise<DiaryEntry[]> {
    return await db
      .select()
      .from(diary)
      .where(
        and(
          eq(diary.classId, classId),
          eq(diary.subjectId, subjectId)
        )
      );
  }

  async createDiaryEntry(diaryData: InsertDiaryEntry): Promise<DiaryEntry> {
    const [diaryEntry] = await db
      .insert(diary)
      .values(diaryData)
      .returning();
    return diaryEntry;
  }

  // Notification operations
  async getNotification(id: string): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification;
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    // Get notifications for specific user or for all users (where targetUsers is null)
    return await db
      .select()
      .from(notifications)
      .where(
        or(
          eq(notifications.targetId, userId),
          eq(notifications.targetId, 'all')
        )
      );
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(notificationData)
      .returning();
    return notification;
  }

  async markNotificationAsRead(notificationId: string): Promise<Notification> {
    const [notification] = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, notificationId))
      .returning();
    return notification;
  }
}

export const storage = new DatabaseStorage();
