import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { assignmentSchema, Assignment } from '../../schemas/teacherSchemas';
import { Class, Subject } from '../../hooks/useApi';
import AdvancedMultiSelect from './AdvancedMultiSelect';

interface AssignmentManagerProps {
  classes: Class[];
  subjects: Subject[];
  initialAssignments?: Assignment[];
  onChange: (assignments: Assignment[]) => void;
  maxAssignments?: number;
  className?: string;
}

interface AssignmentFormData {
  assignments: Assignment[];
}

const AssignmentManager: React.FC<AssignmentManagerProps> = ({
  classes,
  subjects,
  initialAssignments = [],
  onChange,
  maxAssignments = 10,
  className = ''
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      assignments: initialAssignments
    }
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'assignments'
  });

  const watchedAssignments = watch('assignments');

  // Notificar mudanças para o componente pai
  useEffect(() => {
    onChange(watchedAssignments);
  }, [watchedAssignments, onChange]);

  // Preparar opções para os selects
  const classOptions = classes.map(cls => ({
    value: cls.id,
    label: `${cls.name} - ${cls.year}º ano`,
    data: cls
  }));

  const subjectOptions = subjects.map(subject => ({
    value: subject.id,
    label: `${subject.name} (${subject.code})`,
    data: subject
  }));

  const handleAddAssignment = () => {
    if (fields.length < maxAssignments) {
      append({
        classId: '',
        subjectId: '',
        schedule: '',
        workload: 0
      });
      setEditingIndex(fields.length);
      setIsAddingNew(true);
    }
  };

  const handleEditAssignment = (index: number) => {
    setEditingIndex(index);
    setIsAddingNew(false);
  };

  const handleSaveAssignment = (index: number) => {
    // A validação será feita automaticamente pelo react-hook-form
    setEditingIndex(null);
    setIsAddingNew(false);
  };

  const handleCancelEdit = () => {
    if (isAddingNew) {
      remove(fields.length - 1);
    }
    setEditingIndex(null);
    setIsAddingNew(false);
  };

  const handleRemoveAssignment = (index: number) => {
    remove(index);
    if (editingIndex === index) {
      setEditingIndex(null);
      setIsAddingNew(false);
    }
  };

  const isAssignmentValid = (assignment: Assignment) => {
    return assignment.classId && assignment.subjectId;
  };

  const getAssignmentDisplayName = (assignment: Assignment) => {
    const classItem = classes.find(c => c.id === assignment.classId);
    const subjectItem = subjects.find(s => s.id === assignment.subjectId);
    
    if (!classItem || !subjectItem) return 'Atribuição inválida';
    
    return `${classItem.name} - ${subjectItem.name}`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Atribuições de Turmas e Disciplinas
        </h3>
        <button
          type="button"
          onClick={handleAddAssignment}
          disabled={fields.length >= maxAssignments}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Adicionar
        </button>
      </div>

      {fields.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Nenhuma atribuição adicionada ainda.</p>
          <p className="text-sm">Clique em "Adicionar" para começar.</p>
        </div>
      )}

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className={`border rounded-lg p-4 ${
              editingIndex === index 
                ? 'border-blue-300 bg-blue-50' 
                : 'border-gray-200 bg-white'
            }`}
          >
            {editingIndex === index ? (
              // Modo de edição
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AdvancedMultiSelect
                    label="Turma"
                    placeholder="Selecione uma turma..."
                    options={classOptions}
                    value={watchedAssignments[index]?.classId || ''}
                    onChange={(value) => setValue(`assignments.${index}.classId`, value as string)}
                    isRequired
                    error={errors.assignments?.[index]?.classId?.message}
                  />
                  
                  <AdvancedMultiSelect
                    label="Disciplina"
                    placeholder="Selecione uma disciplina..."
                    options={subjectOptions}
                    value={watchedAssignments[index]?.subjectId || ''}
                    onChange={(value) => setValue(`assignments.${index}.subjectId`, value as string)}
                    isRequired
                    error={errors.assignments?.[index]?.subjectId?.message}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Horário
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Segunda 8h-10h"
                      value={watchedAssignments[index]?.schedule || ''}
                      onChange={(e) => setValue(`assignments.${index}.schedule`, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Carga Horária (horas/semana)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      placeholder="Ex: 4"
                      value={watchedAssignments[index]?.workload || ''}
                      onChange={(e) => setValue(`assignments.${index}.workload`, parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <XMarkIcon className="h-4 w-4 mr-1" />
                    Cancelar
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleSaveAssignment(index)}
                    disabled={!isAssignmentValid(watchedAssignments[index])}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckIcon className="h-4 w-4 mr-1" />
                    Salvar
                  </button>
                </div>
              </div>
            ) : (
              // Modo de visualização
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {getAssignmentDisplayName(watchedAssignments[index])}
                  </h4>
                  {watchedAssignments[index]?.schedule && (
                    <p className="text-sm text-gray-500">
                      Horário: {watchedAssignments[index].schedule}
                    </p>
                  )}
                  {watchedAssignments[index]?.workload && (
                    <p className="text-sm text-gray-500">
                      Carga horária: {watchedAssignments[index].workload}h/semana
                    </p>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleEditAssignment(index)}
                    className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PencilIcon className="h-3 w-3 mr-1" />
                    Editar
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleRemoveAssignment(index)}
                    className="inline-flex items-center px-2 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <TrashIcon className="h-3 w-3 mr-1" />
                    Remover
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {fields.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          {fields.length} de {maxAssignments} atribuições utilizadas
        </div>
      )}

      {errors.assignments && (
        <div className="text-sm text-red-600">
          {errors.assignments.message}
        </div>
      )}
    </div>
  );
};

export default AssignmentManager;




