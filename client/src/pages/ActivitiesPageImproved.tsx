import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import TeacherActivitiesFlowSimplified from './TeacherActivitiesFlowSimplified';
import StudentActivitiesFlow from './StudentActivitiesFlow';

export default function ActivitiesPageImproved() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Redirecionar para a página apropriada baseada no role
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Para professores, usar o fluxo completo de atividades
    if (user.role === 'teacher') {
      // Renderizar diretamente o componente TeacherActivitiesFlow
      return;
    }

    // Para alunos, usar o fluxo de atividades do aluno
    if (user.role === 'student') {
      // Renderizar diretamente o componente StudentActivitiesFlow
      return;
    }

    // Para outros roles, redirecionar para dashboard
    navigate('/dashboard');
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  // Renderizar o componente apropriado baseado no role
  if (user.role === 'teacher') {
    return <TeacherActivitiesFlowSimplified />;
  }

  if (user.role === 'student') {
    return <StudentActivitiesFlow />;
  }

  return null;
}
