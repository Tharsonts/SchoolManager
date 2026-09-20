import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Clock, Users, Target } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

interface EventCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  teacherId?: string;
}

interface ClassOption {
  id: string;
  name: string;
  grade: string;
}

export const EventCreateModal: React.FC<EventCreateModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  teacherId
}) => {
  const queryClient = useQueryClient();
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    type: '',
    classId: '',
    subjectId: '',
    duration: '',
    totalPoints: '',
    grade: '',
    instructions: ''
  });

  // Buscar turmas do professor
  const { data: classesData } = useQuery({
    queryKey: ['teacher-classes-simple', teacherId],
    queryFn: async () => {
      const response = await fetch(`/api/teacher/${teacherId}/classes`, { credentials: 'include' });
      if (!response.ok) throw new Error('Erro ao buscar turmas');
      const data = await response.json();
      
      const simpleClasses = data.data?.map((item: any) => ({
        id: item.classId,
        name: item.className,
        grade: item.className.split(' ')[0] || 'N/A'
      })) || [];
      
      const uniqueClasses = simpleClasses.filter((cls: ClassOption, index: number, self: ClassOption[]) => 
        self.findIndex(c => c.id === cls.id) === index
      );
      
      return { data: uniqueClasses };
    },
    enabled: !!teacherId
  });

  // Buscar disciplinas da turma selecionada
  const { data: subjectsData } = useQuery({
    queryKey: ['teacher-subjects', teacherId, eventData.classId],
    queryFn: async () => {
      const response = await fetch(`/api/teacher/${teacherId}/classes/${eventData.classId}/subjects`, { credentials: 'include' });
      if (!response.ok) throw new Error('Erro ao buscar disciplinas');
      return response.json();
    },
    enabled: !!teacherId && !!eventData.classId
  });

  // Criar evento
  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const response = await fetch('/api/teacher/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...eventData,
          teacherId,
          date: selectedDate?.toISOString().split('T')[0] // Formato YYYY-MM-DD
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar evento');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast.success('Evento criado com sucesso!');
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar evento');
    }
  });

  const handleClose = () => {
    setEventData({
      title: '',
      description: '',
      type: '',
      classId: '',
      subjectId: '',
      duration: '',
      totalPoints: '',
      grade: '',
      instructions: ''
    });
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!eventData.title || !eventData.type || !eventData.classId || !selectedDate) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    createEventMutation.mutate(eventData);
  };

  const classes = classesData?.data || [];
  const subjects = subjectsData?.data || [];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Criar Evento no Calendário
          </DialogTitle>
          {selectedDate && (
            <p className="text-sm text-gray-600">
              Data selecionada: {format(selectedDate, 'dd/MM/yyyy')}
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div>
            <Label htmlFor="title">Título do Evento *</Label>
            <Input
              id="title"
              value={eventData.title}
              onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
              placeholder="Ex: Prova de Matemática"
              required
            />
          </div>

          {/* Tipo de Evento */}
          <div>
            <Label htmlFor="type">Tipo de Evento *</Label>
            <Select 
              value={eventData.type} 
              onValueChange={(value) => setEventData({ ...eventData, type: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exam">
                  <span className="flex items-center gap-2">
                    📝 Prova
                  </span>
                </SelectItem>
                <SelectItem value="activity">
                  <span className="flex items-center gap-2">
                    📋 Atividade
                  </span>
                </SelectItem>
                <SelectItem value="presentation">
                  <span className="flex items-center gap-2">
                    📊 Apresentação
                  </span>
                </SelectItem>
                <SelectItem value="meeting">
                  <span className="flex items-center gap-2">
                    👥 Reunião
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Turma */}
          <div>
            <Label htmlFor="classId">Turma *</Label>
            <Select 
              value={eventData.classId} 
              onValueChange={(value) => setEventData({ ...eventData, classId: value, subjectId: '' })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a turma" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls: ClassOption) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Disciplina (se turma selecionada) */}
          {eventData.classId && (
            <div>
              <Label htmlFor="subjectId">Disciplina</Label>
              <Select 
                value={eventData.subjectId} 
                onValueChange={(value) => setEventData({ ...eventData, subjectId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject: any) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Descrição */}
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={eventData.description}
              onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
              placeholder="Descrição do evento (opcional)"
              rows={3}
            />
          </div>

          {/* Informações específicas por tipo */}
          {(eventData.type === 'exam' || eventData.type === 'activity') && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duração (minutos)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={eventData.duration}
                    onChange={(e) => setEventData({ ...eventData, duration: e.target.value })}
                    placeholder="90"
                  />
                </div>
                
                <div>
                  <Label htmlFor="totalPoints">Pontuação</Label>
                  <Input
                    id="totalPoints"
                    type="number"
                    value={eventData.totalPoints}
                    onChange={(e) => setEventData({ ...eventData, totalPoints: e.target.value })}
                    placeholder="10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="instructions">Instruções</Label>
                <Textarea
                  id="instructions"
                  value={eventData.instructions}
                  onChange={(e) => setEventData({ ...eventData, instructions: e.target.value })}
                  placeholder="Instruções específicas do evento"
                  rows={2}
                />
              </div>
            </>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createEventMutation.isPending}
            >
              {createEventMutation.isPending ? 'Criando...' : 'Criar Evento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
