import { sqliteTable, AnySQLiteColumn, foreignKey, text, real, integer, uniqueIndex } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const activities = sqliteTable("activities", {
	id: text().primaryKey().notNull(),
	title: text().notNull(),
	description: text().notNull(),
	subjectId: text().references(() => subjects.id),
	teacherId: text().references(() => users.id),
	classId: text().references(() => classes.id),
	dueDate: text().notNull(),
	maxGrade: real().default(10).notNull(),
	instructions: text(),
	requirements: text(),
	status: text().default("draft").notNull(),
	allowLateSubmission: integer().default(false).notNull(),
	latePenalty: real().notNull(),
	maxFileSize: integer().default(10).notNull(),
	allowedFileTypes: text(),
	createdAt: text().notNull(),
	updatedAt: text().notNull(),
});

export const activityFiles = sqliteTable("activityFiles", {
	id: text().primaryKey().notNull(),
	activityId: text().references(() => activities.id),
	fileName: text().notNull(),
	originalFileName: text().notNull(),
	filePath: text().notNull(),
	fileSize: integer().notNull(),
	fileType: text().notNull(),
	fileCategory: text().notNull(),
	uploadedBy: text().references(() => users.id),
	createdAt: text().notNull(),
});

export const activityRubrics = sqliteTable("activityRubrics", {
	id: text().primaryKey().notNull(),
	activityId: text().references(() => activities.id),
	name: text().notNull(),
	description: text(),
	criteria: text().notNull(),
	totalPoints: real().notNull(),
	createdAt: text().notNull(),
	updatedAt: text().notNull(),
});

export const activitySubmissions = sqliteTable("activitySubmissions", {
	id: text().primaryKey().notNull(),
	activityId: text().references(() => activities.id),
	studentId: text().references(() => users.id),
	submittedAt: text().notNull(),
	comment: text(),
	status: text().default("submitted").notNull(),
	grade: real(),
	maxGrade: real().default(10).notNull(),
	feedback: text(),
	gradedBy: text().references(() => users.id),
	gradedAt: text(),
	isLate: integer().default(false).notNull(),
	latePenaltyApplied: real().notNull(),
	finalGrade: real(),
	createdAt: text().notNull(),
	updatedAt: text().notNull(),
});

export const attendance = sqliteTable("attendance", {
	id: text().primaryKey().notNull(),
	studentId: text().references(() => users.id),
	classSubjectId: text().references(() => classSubjects.id),
	date: text().notNull(),
	status: text().notNull(),
	justification: text(),
	recordedBy: text().references(() => users.id),
	createdAt: text().notNull(),
	updatedAt: text().notNull(),
});

export const classSubjects = sqliteTable("classSubjects", {
	id: text().primaryKey().notNull(),
	classId: text().references(() => classes.id),
	subjectId: text().references(() => subjects.id),
	teacherId: text().references(() => users.id),
	schedule: text(),
	room: text(),
	semester: text(),
	academicYear: text().notNull(),
	status: text().default("active").notNull(),
	createdAt: text().notNull(),
	updatedAt: text().notNull(),
});

export const classes = sqliteTable("classes", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	grade: text().notNull(),
	section: text().notNull(),
	academicYear: text().notNull(),
	capacity: integer().default(30).notNull(),
	currentStudents: integer().default(0).notNull(),
	coordinatorId: text().references(() => users.id),
	status: text().default("active").notNull(),
	createdAt: text().notNull(),
	updatedAt: text().notNull(),
});

export const events = sqliteTable("events", {
	id: text().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	type: text().notNull(),
	startDate: text().notNull(),
	endDate: text(),
	location: text(),
	color: text().default("#3B82F6").notNull(),
	classId: text().references(() => classes.id),
	subjectId: text().references(() => subjects.id),
	createdBy: text().references(() => users.id),
	status: text().default("active").notNull(),
	createdAt: text().notNull(),
	updatedAt: text().notNull(),
});

export const grades = sqliteTable("grades", {
	id: text().primaryKey().notNull(),
	studentId: text().references(() => users.id),
	classSubjectId: text().references(() => classSubjects.id),
	type: text().notNull(),
	title: text().notNull(),
	grade: real().notNull(),
	maxGrade: real().default(10).notNull(),
	weight: real().default(1).notNull(),
	date: text().notNull(),
	comments: text(),
	createdBy: text().references(() => users.id),
	createdAt: text().notNull(),
	updatedAt: text().notNull(),
});

export const messages = sqliteTable("messages", {
	id: text().primaryKey().notNull(),
	senderId: text().references(() => users.id),
	recipientId: text().references(() => users.id),
	subject: text(),
	content: text().notNull(),
	type: text().default("private").notNull(),
	read: integer().default(false).notNull(),
	priority: text().default("medium").notNull(),
	parentMessageId: text(),
	createdAt: text().notNull(),
	updatedAt: text().notNull(),
});

export const notifications = sqliteTable("notifications", {
	id: text().primaryKey().notNull(),
	title: text().notNull(),
	message: text().notNull(),
	type: text().notNull(),
	priority: text().default("medium").notNull(),
	senderId: text().references(() => users.id),
	recipientId: text().references(() => users.id),
	classId: text().references(() => classes.id),
	subjectId: text().references(() => subjects.id),
	read: integer().default(false).notNull(),
	createdAt: text().notNull(),
	updatedAt: text().notNull(),
});

export const reports = sqliteTable("reports", {
	id: text().primaryKey().notNull(),
	title: text().notNull(),
	type: text().notNull(),
	description: text(),
	parameters: text(),
	generatedBy: text().references(() => users.id),
	filePath: text(),
	status: text().default("generating").notNull(),
	createdAt: text().notNull(),
	updatedAt: text().notNull(),
});

export const rubricEvaluations = sqliteTable("rubricEvaluations", {
	id: text().primaryKey().notNull(),
	rubricId: text().references(() => activityRubrics.id),
	submissionId: text().references(() => activitySubmissions.id),
	evaluatorId: text().references(() => users.id),
	criteriaScores: text().notNull(),
	totalScore: real().notNull(),
	comments: text(),
	evaluatedAt: text().notNull(),
});

export const settings = sqliteTable("settings", {
	id: text().primaryKey().notNull(),
	key: text().notNull(),
	value: text().notNull(),
	description: text(),
	category: text().default("general").notNull(),
	updatedBy: text().references(() => users.id),
	createdAt: text().notNull(),
	updatedAt: text().notNull(),
},
(table) => [
	uniqueIndex("settings_key_unique").on(table.key),
]);

export const studentClass = sqliteTable("studentClass", {
	id: text().primaryKey().notNull(),
	studentId: text().references(() => users.id),
	classId: text().references(() => classes.id),
	enrollmentDate: text().notNull(),
	status: text().default("enrolled").notNull(),
	createdAt: text().notNull(),
	updatedAt: text().notNull(),
});

export const subjects = sqliteTable("subjects", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	code: text().notNull(),
	description: text(),
	credits: integer().default(0).notNull(),
	workload: integer().default(0).notNull(),
	teacherId: text().references(() => users.id),
	status: text().default("active").notNull(),
	createdAt: text().notNull(),
	updatedAt: text().notNull(),
},
(table) => [
	uniqueIndex("subjects_code_unique").on(table.code),
]);

export const submissionFiles = sqliteTable("submissionFiles", {
	id: text().primaryKey().notNull(),
	submissionId: text().references(() => activitySubmissions.id),
	fileName: text().notNull(),
	originalFileName: text().notNull(),
	filePath: text().notNull(),
	fileSize: integer().notNull(),
	fileType: text().notNull(),
	uploadedAt: text().notNull(),
});

export const submissionHistory = sqliteTable("submissionHistory", {
	id: text().primaryKey().notNull(),
	submissionId: text().references(() => activitySubmissions.id),
	action: text().notNull(),
	performedBy: text().references(() => users.id),
	performedAt: text().notNull(),
	details: text(),
	previousStatus: text(),
	newStatus: text(),
	gradeChange: real(),
});

export const systemLogs = sqliteTable("systemLogs", {
	id: text().primaryKey().notNull(),
	userId: text().references(() => users.id),
	action: text().notNull(),
	table: text(),
	recordId: text(),
	oldValues: text(),
	newValues: text(),
	ipAddress: text(),
	userAgent: text(),
	createdAt: text().notNull(),
});

export const users = sqliteTable("users", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	password: text().notNull(),
	firstName: text().notNull(),
	lastName: text().notNull(),
	profileImageUrl: text(),
	role: text().notNull(),
	status: text().default("active").notNull(),
	lastSeen: text(),
	phone: text(),
	address: text(),
	registrationNumber: text().notNull(),
	createdAt: text().notNull(),
	updatedAt: text().notNull(),
},
(table) => [
	uniqueIndex("users_registrationNumber_unique").on(table.registrationNumber),
	uniqueIndex("users_email_unique").on(table.email),
]);

