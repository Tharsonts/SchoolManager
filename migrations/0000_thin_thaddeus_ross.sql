-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`subjectId` text,
	`teacherId` text,
	`classId` text,
	`dueDate` text NOT NULL,
	`maxGrade` real DEFAULT 10 NOT NULL,
	`instructions` text,
	`requirements` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`allowLateSubmission` integer DEFAULT false NOT NULL,
	`latePenalty` real DEFAULT 0 NOT NULL,
	`maxFileSize` integer DEFAULT 10 NOT NULL,
	`allowedFileTypes` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teacherId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `activityFiles` (
	`id` text PRIMARY KEY NOT NULL,
	`activityId` text,
	`fileName` text NOT NULL,
	`originalFileName` text NOT NULL,
	`filePath` text NOT NULL,
	`fileSize` integer NOT NULL,
	`fileType` text NOT NULL,
	`fileCategory` text NOT NULL,
	`uploadedBy` text,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`activityId`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `activityRubrics` (
	`id` text PRIMARY KEY NOT NULL,
	`activityId` text,
	`name` text NOT NULL,
	`description` text,
	`criteria` text NOT NULL,
	`totalPoints` real NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`activityId`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `activitySubmissions` (
	`id` text PRIMARY KEY NOT NULL,
	`activityId` text,
	`studentId` text,
	`submittedAt` text NOT NULL,
	`comment` text,
	`status` text DEFAULT 'submitted' NOT NULL,
	`grade` real,
	`maxGrade` real DEFAULT 10 NOT NULL,
	`feedback` text,
	`gradedBy` text,
	`gradedAt` text,
	`isLate` integer DEFAULT false NOT NULL,
	`latePenaltyApplied` real DEFAULT 0 NOT NULL,
	`finalGrade` real,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`gradedBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`studentId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`activityId`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `attendance` (
	`id` text PRIMARY KEY NOT NULL,
	`studentId` text,
	`classSubjectId` text,
	`date` text NOT NULL,
	`status` text NOT NULL,
	`justification` text,
	`recordedBy` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`recordedBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`classSubjectId`) REFERENCES `classSubjects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`studentId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `classSubjects` (
	`id` text PRIMARY KEY NOT NULL,
	`classId` text,
	`subjectId` text,
	`teacherId` text,
	`schedule` text,
	`room` text,
	`semester` text,
	`academicYear` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`teacherId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`grade` text NOT NULL,
	`section` text NOT NULL,
	`academicYear` text NOT NULL,
	`capacity` integer DEFAULT 30 NOT NULL,
	`currentStudents` integer DEFAULT 0 NOT NULL,
	`coordinatorId` text,
	`status` text DEFAULT 'active' NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`coordinatorId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`startDate` text NOT NULL,
	`endDate` text,
	`location` text,
	`color` text DEFAULT '#3B82F6' NOT NULL,
	`classId` text,
	`subjectId` text,
	`createdBy` text,
	`status` text DEFAULT 'active' NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `grades` (
	`id` text PRIMARY KEY NOT NULL,
	`studentId` text,
	`classSubjectId` text,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`grade` real NOT NULL,
	`maxGrade` real DEFAULT 10 NOT NULL,
	`weight` real DEFAULT 1 NOT NULL,
	`date` text NOT NULL,
	`comments` text,
	`createdBy` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`classSubjectId`) REFERENCES `classSubjects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`studentId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`senderId` text,
	`recipientId` text,
	`subject` text,
	`content` text NOT NULL,
	`type` text DEFAULT 'private' NOT NULL,
	`read` integer DEFAULT false NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`parentMessageId` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`recipientId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`type` text NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`senderId` text,
	`recipientId` text,
	`classId` text,
	`subjectId` text,
	`read` integer DEFAULT false NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recipientId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`description` text,
	`parameters` text,
	`generatedBy` text,
	`filePath` text,
	`status` text DEFAULT 'generating' NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`generatedBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `rubricEvaluations` (
	`id` text PRIMARY KEY NOT NULL,
	`rubricId` text,
	`submissionId` text,
	`evaluatorId` text,
	`criteriaScores` text NOT NULL,
	`totalScore` real NOT NULL,
	`comments` text,
	`evaluatedAt` text NOT NULL,
	FOREIGN KEY (`evaluatorId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`submissionId`) REFERENCES `activitySubmissions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`rubricId`) REFERENCES `activityRubrics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`description` text,
	`category` text DEFAULT 'general' NOT NULL,
	`updatedBy` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`updatedBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_key_unique` ON `settings` (`key`);--> statement-breakpoint
CREATE TABLE `studentClass` (
	`id` text PRIMARY KEY NOT NULL,
	`studentId` text,
	`classId` text,
	`enrollmentDate` text NOT NULL,
	`status` text DEFAULT 'enrolled' NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`studentId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`description` text,
	`credits` integer DEFAULT 0 NOT NULL,
	`workload` integer DEFAULT 0 NOT NULL,
	`teacherId` text,
	`status` text DEFAULT 'active' NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`teacherId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subjects_code_unique` ON `subjects` (`code`);--> statement-breakpoint
CREATE TABLE `submissionFiles` (
	`id` text PRIMARY KEY NOT NULL,
	`submissionId` text,
	`fileName` text NOT NULL,
	`originalFileName` text NOT NULL,
	`filePath` text NOT NULL,
	`fileSize` integer NOT NULL,
	`fileType` text NOT NULL,
	`uploadedAt` text NOT NULL,
	FOREIGN KEY (`submissionId`) REFERENCES `activitySubmissions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `submissionHistory` (
	`id` text PRIMARY KEY NOT NULL,
	`submissionId` text,
	`action` text NOT NULL,
	`performedBy` text,
	`performedAt` text NOT NULL,
	`details` text,
	`previousStatus` text,
	`newStatus` text,
	`gradeChange` real,
	FOREIGN KEY (`performedBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`submissionId`) REFERENCES `activitySubmissions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `systemLogs` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text,
	`action` text NOT NULL,
	`table` text,
	`recordId` text,
	`oldValues` text,
	`newValues` text,
	`ipAddress` text,
	`userAgent` text,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`firstName` text NOT NULL,
	`lastName` text NOT NULL,
	`profileImageUrl` text,
	`role` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`lastSeen` text,
	`phone` text,
	`address` text,
	`registrationNumber` text NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_registrationNumber_unique` ON `users` (`registrationNumber`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
*/