import React from 'react';
import Select, { MultiValue, SingleValue, ActionMeta } from 'react-select';
import { Class, Subject } from '../../hooks/useApi';

interface Option {
  value: string;
  label: string;
  isDisabled?: boolean;
  data?: any;
}

interface AdvancedMultiSelectProps {
  label: string;
  placeholder: string;
  options: Option[];
  value: string[] | string;
  onChange: (value: string[] | string) => void;
  isMulti?: boolean;
  isRequired?: boolean;
  error?: string;
  isDisabled?: boolean;
  className?: string;
  helpText?: string;
  maxSelections?: number;
}

const AdvancedMultiSelect: React.FC<AdvancedMultiSelectProps> = ({
  label,
  placeholder,
  options,
  value,
  onChange,
  isMulti = false,
  isRequired = false,
  error,
  isDisabled = false,
  className = '',
  helpText,
  maxSelections
}) => {
  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      minHeight: '42px',
      borderColor: error ? '#ef4444' : state.isFocused ? '#3b82f6' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
      '&:hover': {
        borderColor: error ? '#ef4444' : '#9ca3af'
      }
    }),
    multiValue: (provided: any) => ({
      ...provided,
      backgroundColor: '#e0e7ff',
      borderRadius: '6px'
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      color: '#3730a3',
      fontSize: '14px',
      fontWeight: '500'
    }),
    multiValueRemove: (provided: any) => ({
      ...provided,
      color: '#3730a3',
      '&:hover': {
        backgroundColor: '#c7d2fe',
        color: '#1e1b4b'
      }
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? '#3b82f6' 
        : state.isFocused 
        ? '#e0e7ff' 
        : 'white',
      color: state.isSelected ? 'white' : '#374151',
      '&:hover': {
        backgroundColor: state.isSelected ? '#2563eb' : '#e0e7ff'
      }
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: '#9ca3af',
      fontSize: '14px'
    })
  };

  const handleChange = (
    selectedOption: MultiValue<Option> | SingleValue<Option>,
    actionMeta: ActionMeta<Option>
  ) => {
    if (isMulti) {
      const multiValue = selectedOption as MultiValue<Option>;
      const values = multiValue ? multiValue.map(option => option.value) : [];
      
      // Verificar limite máximo de seleções
      if (maxSelections && values.length > maxSelections) {
        return; // Não permitir seleção além do limite
      }
      
      onChange(values);
    } else {
      const singleValue = selectedOption as SingleValue<Option>;
      onChange(singleValue ? singleValue.value : '');
    }
  };

  const getValue = () => {
    if (isMulti) {
      const multiValue = value as string[];
      return options.filter(option => multiValue.includes(option.value));
    } else {
      const singleValue = value as string;
      return options.find(option => option.value === singleValue) || null;
    }
  };

  const normalize = (str: string | undefined) => {
    return (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[º°•()\-_,.;:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const filterOption = (candidate: { label: string; value: string; data?: any }, rawInput: string) => {
    const input = normalize(rawInput);
    if (!input) return true;
    const tokens = input.split(' ').filter(Boolean);
    const d = candidate.data || {};
    const base = [candidate.label, candidate.value, d.name, d.section, d.grade, d.room, d.classNumber, d.academicYear]
      .filter(Boolean)
      .join(' ');
    const hay = normalize(base);
    const digits = (hay.match(/\d+/g) || []).join(' ');

    return tokens.every((t) => {
      const isNum = /^\d+$/.test(t);
      if (isNum) {
        return hay.includes(t) || digits.includes(t);
      }
      return hay.includes(t);
    });
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <Select
        styles={customStyles}
        options={options}
        value={getValue()}
        onChange={handleChange}
        placeholder={placeholder}
        isMulti={isMulti}
        isDisabled={isDisabled}
        isClearable
        isSearchable
        filterOption={filterOption}
        noOptionsMessage={() => "Nenhuma opção encontrada"}
        loadingMessage={() => "Carregando..."}
        maxMenuHeight={200}
        menuPlacement="auto"
        className="react-select-container"
        classNamePrefix="react-select"
      />
      
      {helpText && (
        <p className="text-xs text-gray-500 mt-1">{helpText}</p>
      )}
      
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
      
      {isMulti && maxSelections && (
        <p className="text-xs text-gray-500 mt-1">
          Máximo de {maxSelections} seleções
        </p>
      )}
    </div>
  );
};

// Componente específico para seleção de turmas
interface ClassSelectProps {
  classes: Class[];
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  isDisabled?: boolean;
  maxSelections?: number;
}

export const ClassSelect: React.FC<ClassSelectProps> = ({
  classes,
  value,
  onChange,
  error,
  isDisabled,
  maxSelections = 5
}) => {
  const classOptions = classes.map(cls => ({
    value: cls.id,
    label: `${cls.name} - ${cls.year}º ano`,
    data: cls
  }));

  return (
    <AdvancedMultiSelect
      label="Turmas"
      placeholder="Selecione as turmas..."
      options={classOptions}
      value={value}
      onChange={onChange}
      isMulti
      isRequired
      error={error}
      isDisabled={isDisabled}
      maxSelections={maxSelections}
      helpText="Selecione as turmas onde o professor irá lecionar"
    />
  );
};

// Componente específico para seleção de disciplinas
interface SubjectSelectProps {
  subjects: Subject[];
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  isDisabled?: boolean;
  maxSelections?: number;
}

export const SubjectSelect: React.FC<SubjectSelectProps> = ({
  subjects,
  value,
  onChange,
  error,
  isDisabled,
  maxSelections = 10
}) => {
  const subjectOptions = subjects.map(subject => ({
    value: subject.id,
    label: `${subject.name} (${subject.code})`,
    data: subject
  }));

  return (
    <AdvancedMultiSelect
      label="Disciplinas"
      placeholder="Selecione as disciplinas..."
      options={subjectOptions}
      value={value}
      onChange={onChange}
      isMulti
      isRequired
      error={error}
      isDisabled={isDisabled}
      maxSelections={maxSelections}
      helpText="Selecione as disciplinas que o professor irá lecionar"
    />
  );
};

export default AdvancedMultiSelect;




