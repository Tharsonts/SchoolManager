import { useQuery } from '@tanstack/react-query';
import { apiCall } from './useApi';

export interface StudentGrade {
  id: string;
  classSubjectId: string;
  type: string;
  title: string;
  grade: number;
  maxGrade: number;
  weight: number;
  date: string;
  comments?: string;
  subjectName: string;
  className: string;
  academicYear: string;
  createdAt: string;
  updatedAt: string;
}

export const useStudentGrades = (studentId: string) => {
  return useQuery({
    queryKey: ['student-grades', studentId],
    queryFn: async (): Promise<StudentGrade[]> => {
      const response = await apiCall(`/grades/student/${studentId}`, { 
        method: 'GET' 
      });
      return response;
    },
    enabled: !!studentId,
  });
};