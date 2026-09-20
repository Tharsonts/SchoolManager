import React, { useMemo, useState } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  data?: any;
}

interface Props {
  label: string;
  placeholder?: string;
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
}

const normalize = (str: string | undefined) => {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[º°•()\-_,.;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export default function ClassSearchMultiSelect({ label, placeholder, options, value, onChange, className }: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const input = normalize(query);
    if (!input) return [];
    const tokens = input.split(' ').filter(Boolean);
    return options.filter(opt => {
      const d = opt.data || {};
      const base = [opt.label, opt.value, d.name, d.section, d.grade, d.room, d.classNumber, d.academicYear]
        .filter(Boolean)
        .join(' ');
      const hay = normalize(base);
      const digits = (hay.match(/\d+/g) || []).join(' ');
      return tokens.every(t => {
        const isNum = /^\d+$/.test(t);
        return isNum ? (hay.includes(t) || digits.includes(t)) : hay.includes(t);
      });
    });
  }, [options, query]);

  const toggle = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter(v => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const clear = (val: string) => onChange(value.filter(v => v !== val));

  return (
    <div className={className || ''}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="space-y-2">
        {value.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {value.map(v => {
              const opt = options.find(o => o.value === v);
              return (
                <Badge key={v} variant="secondary" className="flex items-center gap-1">
                  {opt?.label || v}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => clear(v)} />
                </Badge>
              );
            })}
          </div>
        )}

        <Command className="border rounded-md">
          <CommandInput
            placeholder={placeholder || 'Pesquisar turmas...'}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>{query ? 'Nenhuma turma encontrada' : 'Digite para pesquisar'}</CommandEmpty>
            <CommandGroup>
              {filtered.map(opt => (
                <CommandItem key={opt.value} onSelect={() => toggle(opt.value)}>
                  <span>{opt.label}</span>
                  {value.includes(opt.value) && (
                    <Badge variant="outline" className="ml-auto">Selecionada</Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    </div>
  );
}
