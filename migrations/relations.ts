import { relations } from "drizzle-orm/relations";
import { classes, activities, users, subjects, activityFiles, activityRubrics, activitySubmissions, attendance, classSubjects, events, grades, messages, notifications, reports, rubricEvaluations, settings, studentClass, submissionFiles, submissionHistory, systemLogs } from "./schema";

export const activitiesRelations = relations(activities, ({one, many}) => ({
	class: one(classes, {
		fields: [activities.classId],
		references: [classes.id]
	}),
	user: one(users, {
		fields: [activities.teacherId],
		references: [users.id]
	}),
	subject: one(subjects, {
		fields: [activities.subjectId],
		references: [subjects.id]
	}),
	activityFiles: many(activityFiles),
	activityRubrics: many(activityRubrics),
	activitySubmissions: many(activitySubmissions),
}));

export const classesRelations = relations(classes, ({one, many}) => ({
	activities: many(activities),
	classSubjects: many(classSubjects),
	user: one(users, {
		fields: [classes.coordinatorId],
		references: [users.id]
	}),
	events: many(events),
	notifications: many(notifications),
	studentClasses: many(studentClass),
}));

export const usersRelations = relations(users, ({many}) => ({
	activities: many(activities),
	activityFiles: many(activityFiles),
	activitySubmissions_gradedBy: many(activitySubmissions, {
		relationName: "activitySubmissions_gradedBy_users_id"
	}),
	activitySubmissions_studentId: many(activitySubmissions, {
		relationName: "activitySubmissions_studentId_users_id"
	}),
	attendances_recordedBy: many(attendance, {
		relationName: "attendance_recordedBy_users_id"
	}),
	attendances_studentId: many(attendance, {
		relationName: "attendance_studentId_users_id"
	}),
	classSubjects: many(classSubjects),
	classes: many(classes),
	events: many(events),
	grades_createdBy: many(grades, {
		relationName: "grades_createdBy_users_id"
	}),
	grades_studentId: many(grades, {
		relationName: "grades_studentId_users_id"
	}),
	messages_recipientId: many(messages, {
		relationName: "messages_recipientId_users_id"
	}),
	messages_senderId: many(messages, {
		relationName: "messages_senderId_users_id"
	}),
	notifications_recipientId: many(notifications, {
		relationName: "notifications_recipientId_users_id"
	}),
	notifications_senderId: many(notifications, {
		relationName: "notifications_senderId_users_id"
	}),
	reports: many(reports),
	rubricEvaluations: many(rubricEvaluations),
	settings: many(settings),
	studentClasses: many(studentClass),
	subjects: many(subjects),
	submissionHistories: many(submissionHistory),
	systemLogs: many(systemLogs),
}));

export const subjectsRelations = relations(subjects, ({one, many}) => ({
	activities: many(activities),
	classSubjects: many(classSubjects),
	events: many(events),
	notifications: many(notifications),
	user: one(users, {
		fields: [subjects.teacherId],
		references: [users.id]
	}),
}));

export const activityFilesRelations = relations(activityFiles, ({one}) => ({
	user: one(users, {
		fields: [activityFiles.uploadedBy],
		references: [users.id]
	}),
	activity: one(activities, {
		fields: [activityFiles.activityId],
		references: [activities.id]
	}),
}));

export const activityRubricsRelations = relations(activityRubrics, ({one, many}) => ({
	activity: one(activities, {
		fields: [activityRubrics.activityId],
		references: [activities.id]
	}),
	rubricEvaluations: many(rubricEvaluations),
}));

export const activitySubmissionsRelations = relations(activitySubmissions, ({one, many}) => ({
	user_gradedBy: one(users, {
		fields: [activitySubmissions.gradedBy],
		references: [users.id],
		relationName: "activitySubmissions_gradedBy_users_id"
	}),
	user_studentId: one(users, {
		fields: [activitySubmissions.studentId],
		references: [users.id],
		relationName: "activitySubmissions_studentId_users_id"
	}),
	activity: one(activities, {
		fields: [activitySubmissions.activityId],
		references: [activities.id]
	}),
	rubricEvaluations: many(rubricEvaluations),
	submissionFiles: many(submissionFiles),
	submissionHistories: many(submissionHistory),
}));

export const attendanceRelations = relations(attendance, ({one}) => ({
	user_recordedBy: one(users, {
		fields: [attendance.recordedBy],
		references: [users.id],
		relationName: "attendance_recordedBy_users_id"
	}),
	classSubject: one(classSubjects, {
		fields: [attendance.classSubjectId],
		references: [classSubjects.id]
	}),
	user_studentId: one(users, {
		fields: [attendance.studentId],
		references: [users.id],
		relationName: "attendance_studentId_users_id"
	}),
}));

export const classSubjectsRelations = relations(classSubjects, ({one, many}) => ({
	attendances: many(attendance),
	user: one(users, {
		fields: [classSubjects.teacherId],
		references: [users.id]
	}),
	subject: one(subjects, {
		fields: [classSubjects.subjectId],
		references: [subjects.id]
	}),
	class: one(classes, {
		fields: [classSubjects.classId],
		references: [classes.id]
	}),
	grades: many(grades),
}));

export const eventsRelations = relations(events, ({one}) => ({
	user: one(users, {
		fields: [events.createdBy],
		references: [users.id]
	}),
	subject: one(subjects, {
		fields: [events.subjectId],
		references: [subjects.id]
	}),
	class: one(classes, {
		fields: [events.classId],
		references: [classes.id]
	}),
}));

export const gradesRelations = relations(grades, ({one}) => ({
	user_createdBy: one(users, {
		fields: [grades.createdBy],
		references: [users.id],
		relationName: "grades_createdBy_users_id"
	}),
	classSubject: one(classSubjects, {
		fields: [grades.classSubjectId],
		references: [classSubjects.id]
	}),
	user_studentId: one(users, {
		fields: [grades.studentId],
		references: [users.id],
		relationName: "grades_studentId_users_id"
	}),
}));

export const messagesRelations = relations(messages, ({one}) => ({
	user_recipientId: one(users, {
		fields: [messages.recipientId],
		references: [users.id],
		relationName: "messages_recipientId_users_id"
	}),
	user_senderId: one(users, {
		fields: [messages.senderId],
		references: [users.id],
		relationName: "messages_senderId_users_id"
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	subject: one(subjects, {
		fields: [notifications.subjectId],
		references: [subjects.id]
	}),
	class: one(classes, {
		fields: [notifications.classId],
		references: [classes.id]
	}),
	user_recipientId: one(users, {
		fields: [notifications.recipientId],
		references: [users.id],
		relationName: "notifications_recipientId_users_id"
	}),
	user_senderId: one(users, {
		fields: [notifications.senderId],
		references: [users.id],
		relationName: "notifications_senderId_users_id"
	}),
}));

export const reportsRelations = relations(reports, ({one}) => ({
	user: one(users, {
		fields: [reports.generatedBy],
		references: [users.id]
	}),
}));

export const rubricEvaluationsRelations = relations(rubricEvaluations, ({one}) => ({
	user: one(users, {
		fields: [rubricEvaluations.evaluatorId],
		references: [users.id]
	}),
	activitySubmission: one(activitySubmissions, {
		fields: [rubricEvaluations.submissionId],
		references: [activitySubmissions.id]
	}),
	activityRubric: one(activityRubrics, {
		fields: [rubricEvaluations.rubricId],
		references: [activityRubrics.id]
	}),
}));

export const settingsRelations = relations(settings, ({one}) => ({
	user: one(users, {
		fields: [settings.updatedBy],
		references: [users.id]
	}),
}));

export const studentClassRelations = relations(studentClass, ({one}) => ({
	class: one(classes, {
		fields: [studentClass.classId],
		references: [classes.id]
	}),
	user: one(users, {
		fields: [studentClass.studentId],
		references: [users.id]
	}),
}));

export const submissionFilesRelations = relations(submissionFiles, ({one}) => ({
	activitySubmission: one(activitySubmissions, {
		fields: [submissionFiles.submissionId],
		references: [activitySubmissions.id]
	}),
}));

export const submissionHistoryRelations = relations(submissionHistory, ({one}) => ({
	user: one(users, {
		fields: [submissionHistory.performedBy],
		references: [users.id]
	}),
	activitySubmission: one(activitySubmissions, {
		fields: [submissionHistory.submissionId],
		references: [activitySubmissions.id]
	}),
}));

export const systemLogsRelations = relations(systemLogs, ({one}) => ({
	user: one(users, {
		fields: [systemLogs.userId],
		references: [users.id]
	}),
}));