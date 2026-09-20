import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EyeIcon, EyeSlashIcon, UserIcon, AcademicCapIcon, KeyIcon } from '@heroicons/react/24/outline';
import { createTeacherSchema, CreateTeacherData, Assignment } from '../../schemas/teacherSchemas';
import { useClasses, useSubjects } from '../../hooks/useApi';
import { useCreateTeacher } from '../../hooks/useAdminApi';
import AssignmentManager from './AssignmentManager';

interface AdvancedTeacherFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

const AdvancedTeacherForm: React.FC<AdvancedTeacherFormProps> = ({
  onSuccess,
  onCancel,
  className = ''
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const { data: classesData, isLoading: classesLoading } = useClasses();
  const { data: subjectsData, isLoading: subjectsLoading } = useSubjects();
  const createTeacherMutation = useCreateTeacher();

  const classes = classesData || [];
  const subjects = subjectsData || [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch
  } = useForm<CreateTeacherData>({
    resolver: zodResolver(createTeacherSchema),
    defaultValues: {
      personalInfo: {
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
      },
      assignments: [],
      permissions: {
        canCreateActivities: true,
        canGradeStudents: true,
        canViewReports: true,
        canManageStudents: false,
        canAccessChat: true
      },
      password: '',
      confirmPassword: ''
    }
  });

  const watchedPermissions = watch('permissions');

  const onSubmit = async (data: CreateTeacherData) => {
    try {
      // Preparar dados para envio
      const teacherData = {
        firstName: data.personalInfo.firstName,
        lastName: data.personalInfo.lastName,
        email: data.personalInfo.email,
        phone: data.personalInfo.phone || '',
        password: data.password,
        subjects: assignments.map(a => a.subjectId),
        classes: assignments.map(a => a.classId),
        permissions: data.permissions
      };

      await createTeacherMutation.mutateAsync(teacherData);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao criar professor:', error);
    }
  };

  const handleAssignmentsChange = (newAssignments: Assignment[]) => {
    setAssignments(newAssignments);
    setValue('assignments', newAssignments);
  };

  if (classesLoading || subjectsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando...</span>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Informações Pessoais */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <UserIcon className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Informações Pessoais</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome *
              </label>
              <input
                {...register('personalInfo.firstName')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite o nome"
              />
              {errors.personalInfo?.firstName && (
                <p className="text-xs text-red-500 mt-1">{errors.personalInfo.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sobrenome *
              </label>
              <input
                {...register('personalInfo.lastName')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite o sobrenome"
              />
              {errors.personalInfo?.lastName && (
                <p className="text-xs text-red-500 mt-1">{errors.personalInfo.lastName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                {...register('personalInfo.email')}
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite o email"
              />
              {errors.personalInfo?.email && (
                <p className="text-xs text-red-500 mt-1">{errors.personalInfo.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                {...register('personalInfo.phone')}
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="(11) 99999-9999"
                onChange={handlePhoneInputChange}
              />
              {errors.personalInfo?.phone && (
                <p className="text-xs text-red-500 mt-1">{errors.personalInfo.phone.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Atribuições */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <AcademicCapIcon className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Atribuições</h2>
          </div>
          
          <AssignmentManager
            classes={classes}
            subjects={subjects}
            initialAssignments={assignments}
            onChange={handleAssignmentsChange}
            maxAssignments={10}
          />
          
          {errors.assignments && (
            <p className="text-xs text-red-500 mt-2">{errors.assignments.message}</p>
          )}
        </div>

        {/* Permissões */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Permissões</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center">
              <input
                {...register('permissions.canCreateActivities')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Criar atividades</span>
            </label>

            <label className="flex items-center">
              <input
                {...register('permissions.canGradeStudents')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Avaliar estudantes</span>
            </label>

            <label className="flex items-center">
              <input
                {...register('permissions.canViewReports')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Visualizar relatórios</span>
            </label>

            <label className="flex items-center">
              <input
                {...register('permissions.canManageStudents')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Gerenciar estudantes</span>
            </label>

            <label className="flex items-center">
              <input
                {...register('permissions.canAccessChat')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Acessar chat</span>
            </label>
          </div>
        </div>

        {/* Senha */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <KeyIcon className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Senha de Acesso</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha *
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite a senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Senha *
              </label>
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirme a senha"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
          )}
          
          <button
            type="submit"
            disabled={isSubmitting || createTeacherMutation.isPending}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting || createTeacherMutation.isPending ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Criando...
              </div>
            ) : (
              'Criar Professor'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdvancedTeacherForm;
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setValue('personalInfo.phone', formatted, { shouldValidate: true });
  };
