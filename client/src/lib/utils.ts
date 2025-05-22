import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

export function getUserInitials(name: string): string {
  if (!name) return '';
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function getRoleColor(role: string): string {
  switch (role.toLowerCase()) {
    case 'admin':
    case 'administrator':
      return 'bg-blue-500';
    case 'teacher':
    case 'professor':
      return 'bg-green-500';
    case 'student':
    case 'aluno':
      return 'bg-purple-500';
    case 'coordinator':
    case 'coordenador':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
    case 'ativo':
      return 'bg-green-500';
    case 'inactive':
    case 'inativo':
      return 'bg-red-500';
    case 'pending':
    case 'pendente':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
}

export function getRoleTranslation(role: string): string {
  switch (role.toLowerCase()) {
    case 'admin':
    case 'administrator':
      return 'Administrador';
    case 'teacher':
    case 'professor':
      return 'Professor';
    case 'student':
    case 'aluno':
      return 'Aluno';
    case 'coordinator':
    case 'coordenador':
      return 'Coordenador';
    default:
      return role;
  }
}

export function getGradeColor(grade: number): string {
  if (grade >= 7) return 'text-green-500';
  if (grade >= 5) return 'text-yellow-500';
  return 'text-red-500';
}

export function calculateAverageGrade(grades: number[]): number {
  if (!grades.length) return 0;
  const sum = grades.reduce((acc, grade) => acc + grade, 0);
  return parseFloat((sum / grades.length).toFixed(1));
}

export function calculateAttendancePercentage(present: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
}
