import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Clock, Users, Target, BookOpen, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  classId?: string;
  className?: string;
  subjectName?: string;
  type: 'exam' | 'activity' | 'presentation' | 'meeting' | 'event';
  color?: string;
  icon?: string;
  bimonthly?: number;
  totalPoints?: number;
  duration?: number;
  isGlobal?: boolean;
}

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  onDelete: () => void;
  onEdit?: (event: CalendarEvent) => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  isOpen,
  onClose,
  event,
  onDelete,
  onEdit
}) => {
  if (!event) return null;

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'exam': return 'Prova';
      case 'activity': return 'Atividade';
      case 'presentation': return 'Apresentação';
      case 'meeting': return 'Reunião';
      default: return 'Evento';
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'exam': return 'bg-red-500';
      case 'activity': return 'bg-blue-500';
      case 'presentation': return 'bg-purple-500';
      case 'meeting': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const handleDelete = () => {
    onDelete();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl">
              {event.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{event.title}</h2>
              <p className="text-sm text-gray-500 font-normal">
                {event.isGlobal ? 'Comunicado Geral' : `Evento para ${event.className}`}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tipo e Turma */}
          <div className="flex flex-wrap gap-2">
            <Badge className={`${getEventTypeColor(event.type)} text-white px-3 py-1 text-sm font-medium`}>
              {getEventTypeLabel(event.type)}
            </Badge>
            <Badge 
              variant={event.isGlobal ? "default" : "outline"} 
              className={`px-3 py-1 text-sm font-medium ${
                event.isGlobal 
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white border-0" 
                  : "border-blue-200 text-blue-700 bg-blue-50"
              }`}
            >
              {event.isGlobal ? "🌐 Evento Global" : `🏫 ${event.className}`}
            </Badge>
          </div>

          {/* Data */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {format(new Date(event.startDate || event.date || new Date()), 'EEEE, dd/MM/yyyy', { locale: ptBR })}
              </p>
              <p className="text-sm text-gray-500">
                {event.startTime || format(new Date(event.startDate || event.date || new Date()), 'HH:mm')}
                {event.endTime && ` - ${event.endTime}`}
              </p>
            </div>
          </div>

          {/* Informações específicas */}
          {(event.totalPoints || event.duration) && (
            <div className="grid grid-cols-2 gap-4">
              {event.totalPoints && (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600">
                    <Target className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{event.totalPoints} pontos</p>
                    <p className="text-sm text-gray-500">Total de pontos</p>
                  </div>
                </div>
              )}
              {event.duration && (
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{event.duration} min</p>
                    <p className="text-sm text-gray-500">Duração</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Descrição */}
          {event.description && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-3 text-gray-900 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                Descrição
              </h4>
              <p className="text-sm leading-relaxed text-gray-700">{event.description}</p>
            </div>
          )}

          {/* Disciplina */}
          {event.subjectName && (
            <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{event.subjectName}</p>
                <p className="text-sm text-gray-500">Disciplina</p>
              </div>
            </div>
          )}


          {/* Bimestre */}
          {event.bimonthly && (
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-600">
                <span className="text-sm font-bold">{event.bimonthly}º</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{event.bimonthly}º Bimestre</p>
                <p className="text-sm text-gray-500">Período letivo</p>
              </div>
            </div>
          )}

          {/* Informações do criador */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {event.isGlobal ? 'Coordenador' : 'Professor'}
              </p>
              <p className="text-sm text-gray-500">
                {event.isGlobal ? 'Comunicado oficial' : 'Evento da disciplina'}
              </p>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={onClose} className="px-4">
            Fechar
          </Button>
          {onEdit && (
            <Button variant="outline" size="sm" onClick={() => onEdit(event)} className="px-4 border-blue-200 text-blue-700 hover:bg-blue-50">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
          <Button variant="destructive" size="sm" onClick={handleDelete} className="px-4">
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
