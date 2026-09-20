import { z } from 'zod';

// Schema para informações pessoais do professor
export const personalInfoSchema = z.object({
  firstName: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres'),
  lastName: z.string()
    .min(2, 'Sobrenome deve ter pelo menos 2 caracteres')
    .max(50, 'Sobrenome deve ter no máximo 50 caracteres'),
  email: z.string()
    .email('Email inválido')
    .min(5, 'Email deve ter pelo menos 5 caracteres'),
  phone: z.string()
    .min(10, 'Telefone deve ter pelo menos 10 dígitos')
    .max(15, 'Telefone deve ter no máximo 15 dígitos')
    .optional(),
});

// Schema para uma atribuição específica (turma + disciplina)
export const assignmentSchema = z.object({
  classId: z.string()
    .min(1, 'Turma é obrigatória'),
  subjectId: z.string()
    .min(1, 'Disciplina é obrigatória'),
  schedule: z.string()
    .min(1, 'Horário é obrigatório')
    .max(100, 'Horário deve ter no máximo 100 caracteres')
    .optional(),
  workload: z.number()
    .min(1, 'Carga horária deve ser pelo menos 1 hora')
    .max(40, 'Carga horária deve ser no máximo 40 horas')
    .optional(),
});

// Schema para permissões do professor
export const permissionsSchema = z.object({
  canCreateActivities: z.boolean().default(true),
  canGradeStudents: z.boolean().default(true),
  canViewReports: z.boolean().default(true),
  canManageStudents: z.boolean().default(false),
  canAccessChat: z.boolean().default(true),
});

// Schema principal para criação de professor
export const createTeacherSchema = z.object({
  personalInfo: personalInfoSchema,
  assignments: z.array(assignmentSchema)
    .min(1, 'Pelo menos uma atribuição é obrigatória')
    .max(10, 'Máximo de 10 atribuições por professor'),
  permissions: permissionsSchema.optional(),
  password: z.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

// Schema para edição de professor (sem senha obrigatória)
export const editTeacherSchema = z.object({
  personalInfo: personalInfoSchema,
  assignments: z.array(assignmentSchema)
    .min(1, 'Pelo menos uma atribuição é obrigatória')
    .max(10, 'Máximo de 10 atribuições por professor'),
  permissions: permissionsSchema.optional(),
  password: z.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres')
    .optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.password && data.confirmPassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

// Tipos TypeScript derivados dos schemas
export type PersonalInfo = z.infer<typeof personalInfoSchema>;
export type Assignment = z.infer<typeof assignmentSchema>;
export type Permissions = z.infer<typeof permissionsSchema>;
export type CreateTeacherData = z.infer<typeof createTeacherSchema>;
export type EditTeacherData = z.infer<typeof editTeacherSchema>;

// Schema para validação de vínculos em lote
export const bulkAssignmentSchema = z.object({
  teacherIds: z.array(z.string())
    .min(1, 'Pelo menos um professor deve ser selecionado'),
  classIds: z.array(z.string())
    .min(1, 'Pelo menos uma turma deve ser selecionada'),
  subjectIds: z.array(z.string())
    .min(1, 'Pelo menos uma disciplina deve ser selecionada'),
  schedule: z.string().optional(),
  workload: z.number().optional(),
});

export type BulkAssignmentData = z.infer<typeof bulkAssignmentSchema>;




