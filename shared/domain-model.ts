// Tipos de domínio (OO) alinhados ao schema relacional do SchoolManager.
// Servem para documentação forte e para uso em serviços/DTOs.

export type ID = string;

export interface User {
  id: ID;
  email?: string | null;
  password?: string | null;
  firstName: string;
  lastName: string;
  profileImageUrl?: string | null;
  role: 'admin' | 'teacher' | 'student' | 'coordinator';
  status: 'active' | 'inactive' | 'pending';
  lastSeen?: string | null;
  phone?: string | null;
  address?: string | null;
  registrationNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface Class {
  id: ID;
  name: string;
  grade: string;
  section: string;
  academicYear: string;
  capacity: number;
  coordinatorId?: ID | null;
  status: 'active' | 'inactive' | 'completed' | 'pending';
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: ID;
  name: string;
  code: string;
  description?: string | null;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  updatedAt: string;
}

export interface ClassSubject {
  id: ID;
  classId: ID;
  subjectId: ID;
  teacherId?: ID | null;
  schedule?: string | null;
  room?: string | null;
  semester?: string | null;
  academicYear: string;
  status: 'active' | 'inactive' | 'completed' | 'pending';
  createdAt: string;
  updatedAt: string;
}

export interface StudentEnrollment {
  id: ID;
  studentId: ID;
  classId: ID;
  enrollmentDate: string;
  status: 'active' | 'inactive' | 'dropped' | 'completed' | 'pending';
  createdAt: string;
  updatedAt: string;
}

export interface AcademicPeriod {
  id: ID;
  name: string;
  description?: string | null;
  period: number;
  academicYear: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive' | 'completed' | 'pending';
  isCurrent: boolean;
  totalDays?: number | null;
  remainingDays?: number | null;
  createdBy?: ID | null;
  createdAt: string;
  updatedAt: string;
}

export interface Grade {
  id: ID;
  studentId: ID;
  classSubjectId: ID;
  type: 'exam' | 'homework' | 'project' | 'participation' | 'quiz';
  title: string;
  grade: number;
  maxGrade: number;
  weight: number;
  date: string;
  comments?: string | null;
  createdBy?: ID | null;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: ID;
  studentId: ID;
  classId: ID;
  subjectId: ID;
  teacherId: ID;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: ID;
  title: string;
  description?: string | null;
  type: 'exam' | 'homework' | 'meeting' | 'activity' | 'holiday' | 'event' | 'presentation' | 'training' | 'announcement';
  startDate: string;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  color: string;
  classId?: ID | null;
  subjectId?: ID | null;
  createdBy?: ID | null;
  isGlobal: boolean;
  status: 'active' | 'pending' | 'cancelled' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: ID;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'reminder' | 'announcement' | 'grade' | 'assignment';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  senderId?: ID | null;
  recipientId?: ID | null;
  classId?: ID | null;
  subjectId?: ID | null;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Setting {
  id: ID;
  key: string;
  value: string;
  description?: string | null;
  category: 'general' | 'academic' | 'notification' | 'security';
  updatedBy?: ID | null;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: ID;
  title: string;
  description: string;
  subjectId?: ID | null;
  teacherId?: ID | null;
  classId?: ID | null;
  dueDate: string;
  maxGrade: number;
  instructions?: string | null;
  requirements?: string | null;
  status: 'draft' | 'active' | 'expired' | 'archived' | 'pending';
  allowLateSubmission: boolean;
  latePenalty: number;
  maxFileSize: number;
  allowedFileTypes?: string | null; // JSON
  approvedByCoordinator: number; // 0/1
  coordinatorApprovalDate?: string | null;
  coordinatorId?: ID | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityFile {
  id: ID;
  activityId: ID;
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  fileCategory: 'reference' | 'template' | 'example';
  uploadedBy?: ID | null;
  createdAt: string;
}

export interface ActivitySubmission {
  id: ID;
  activityId: ID;
  studentId: ID;
  submittedAt: string;
  comment?: string | null;
  status: 'submitted' | 'late' | 'graded' | 'returned' | 'resubmitted';
  grade?: number | null;
  maxGrade: number;
  feedback?: string | null;
  gradedBy?: ID | null;
  gradedAt?: string | null;
  isLate: boolean;
  latePenaltyApplied: number;
  finalGrade?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionFile {
  id: ID;
  submissionId: ID;
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
}

export interface SubmissionHistory {
  id: ID;
  submissionId: ID;
  action: 'submitted' | 'graded' | 'returned' | 'resubmitted' | 'late_penalty_applied';
  performedBy?: ID | null;
  performedAt: string;
  details?: string | null;
  previousStatus?: string | null;
  newStatus?: string | null;
  gradeChange?: number | null;
}

export interface ActivityRubric {
  id: ID;
  activityId: ID;
  name: string;
  description?: string | null;
  criteria: string; // JSON
  totalPoints: number;
  createdAt: string;
  updatedAt: string;
}

export interface RubricEvaluation {
  id: ID;
  rubricId: ID;
  submissionId: ID;
  evaluatorId: ID;
  criteriaScores: string; // JSON
  totalScore: number;
  comments?: string | null;
  evaluatedAt: string;
}

export interface Message {
  id: ID;
  senderId?: ID | null;
  recipientId?: ID | null;
  subject?: string | null;
  content: string;
  type: 'private' | 'announcement' | 'system';
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  parentMessageId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: ID;
  title: string;
  type: 'academic' | 'attendance' | 'behavior' | 'performance' | 'custom';
  description?: string | null;
  parameters?: string | null; // JSON
  generatedBy?: ID | null;
  filePath?: string | null;
  status: 'generating' | 'completed' | 'error';
  createdAt: string;
  updatedAt: string;
}

export interface SystemLog {
  id: ID;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  action: string;
  description: string;
  userId?: ID | null;
  userName?: string | null;
  userRole?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  locationCity?: string | null;
  locationRegion?: string | null;
  locationCountry?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string | null;
  deviceType?: string | null;
  os?: string | null;
  osVersion?: string | null;
  browser?: string | null;
  browserVersion?: string | null;
  metadata?: string | null;
  code?: string | null;
}

export interface Material {
  id: ID;
  title: string;
  description?: string | null;
  subjectId?: ID | null;
  classId?: ID | null;
  teacherId?: ID | null;
  materialType: 'slide' | 'document' | 'video' | 'link' | 'exercise' | 'other' | 'folder';
  content?: string | null;
  folder?: string | null;
  isPublic: boolean;
  status: 'active' | 'inactive' | 'draft';
  createdAt: string;
  updatedAt: string;
}

export interface MaterialFile {
  id: ID;
  materialId: ID;
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  fileCategory: 'main' | 'attachment' | 'reference';
  uploadedBy?: ID | null;
  createdAt: string;
}

export interface Exam {
  id: ID;
  title: string;
  description?: string | null;
  subjectId: ID;
  classId: ID;
  teacherId: ID;
  examDate: string;
  duration?: number | null;
  totalPoints: number;
  semester: '1' | '2';
  bimonthly: '1' | '2' | '3' | '4';
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface ExamGrade {
  id: ID;
  examId: ID;
  studentId: ID;
  grade?: number | null;
  isPresent: boolean;
  observations?: string | null;
  gradedBy?: ID | null;
  gradedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClassSchedule {
  id: ID;
  classId: ID;
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  subjectId?: ID | null;
  teacherId?: ID | null;
  createdAt: string;
  updatedAt: string;
}