import React, { useState } from 'react';
import { SparklesIcon, CogIcon } from '@heroicons/react/24/outline';
import TeacherFormModal from './TeacherFormModal';

interface AdvancedTeacherIntegrationProps {
  onTeacherCreated?: () => void;
  className?: string;
}

const AdvancedTeacherIntegration: React.FC<AdvancedTeacherIntegrationProps> = ({
  onTeacherCreated,
  className = ''
}) => {
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false);

  const handleSuccess = () => {
    if (onTeacherCreated) {
      onTeacherCreated();
    }
    setIsAdvancedModalOpen(false);
  };

  return (
    <div className={className}>
      {/* Botão para abrir o formulário avançado */}
      <button
        onClick={() => setIsAdvancedModalOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg transition-all duration-200"
      >
        <SparklesIcon className="h-4 w-4 mr-2" />
        Criar Professor
      </button>

      {/* Modal do formulário avançado */}
      <TeacherFormModal
        isOpen={isAdvancedModalOpen}
        onClose={() => setIsAdvancedModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

// Componente para adicionar ao header da página de professores
export const AdvancedTeacherHeader: React.FC<{ onTeacherCreated?: () => void }> = ({
  onTeacherCreated
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestão de Professores</h1>
        <p className="text-gray-600 mt-1">Gerencie os professores da escola</p>
      </div>
      
      <div className="flex items-center space-x-3">
        {/* Botão do sistema existente (mantido) */}
        <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <CogIcon className="h-4 w-4 mr-2" />
          Novo Professor
        </button>
        
        {/* Botão do sistema avançado (novo) */}
        <AdvancedTeacherIntegration onTeacherCreated={onTeacherCreated} />
      </div>
    </div>
  );
};

export default AdvancedTeacherIntegration;
