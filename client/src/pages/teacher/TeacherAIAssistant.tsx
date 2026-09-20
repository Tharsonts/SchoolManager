import React, { useState } from 'react';
import { useLocation } from 'wouter';
import TeacherLayout from '@/components/layout/TeacherLayout';
import TeacherAIChat from '@/components/TeacherAIChat';

const TeacherAIAssistant = () => {
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [, navigate] = useLocation();

  const handleClose = () => {
    setIsChatOpen(false);
    // Voltar para o dashboard quando fechar
    navigate('/teacher/dashboard');
  };

  return (
    <TeacherLayout immersive>
      <TeacherAIChat 
        isOpen={isChatOpen} 
        onClose={handleClose} 
      />
    </TeacherLayout>
  );
};

export default TeacherAIAssistant;
