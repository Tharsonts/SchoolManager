import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Clock, BookOpen, ChevronLeft, ChevronRight, MapPin, Users, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  classId: string;
  className: string;
  subjectName: string;
  type: 'exam' | 'activity' | 'presentation' | 'meeting' | 'event';
  color: string;
  icon: string;
  bimonthly?: number;
  totalPoints?: number;
  duration?: number;
  isGlobal?: boolean;
}

interface DayEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  events: CalendarEvent[];
}

export const DayEventsModal: React.FC<DayEventsModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  events
}) => {
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  
  if (!selectedDate) return null;

  const handleNextEvent = () => {
    if (currentEventIndex < events.length - 1) {
      setCurrentEventIndex(currentEventIndex + 1);
    }
  };

  const handlePreviousEvent = () => {
    if (currentEventIndex > 0) {
      setCurrentEventIndex(currentEventIndex - 1);
    }
  };

  const currentEvent = events[currentEventIndex];

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
      case 'exam': return 'bg-red-600';
      case 'activity': return 'bg-blue-600';
      case 'presentation': return 'bg-purple-600';
      case 'meeting': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  const getEventTypeLightColor = (type: string) => {
    switch (type) {
      case 'exam': return 'bg-red-100';
      case 'activity': return 'bg-blue-100';
      case 'presentation': return 'bg-purple-100';
      case 'meeting': return 'bg-green-100';
      default: return 'bg-gray-100';
    }
  };

  const getEventTypeTextColor = (type: string) => {
    switch (type) {
      case 'exam': return 'text-red-800';
      case 'activity': return 'text-blue-800';
      case 'presentation': return 'text-purple-800';
      case 'meeting': return 'text-green-800';
      default: return 'text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg -m-6 mb-4 p-6">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xl font-bold">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <CalendarIcon className="h-6 w-6" />
              </div>
              <div>
                <div>{format(selectedDate, 'EEEE, dd/MM/yyyy', { locale: ptBR })}</div>
                <div className="text-blue-100 text-sm font-normal">
                  {events.length > 0 
                    ? `${events.length} evento${events.length > 1 ? 's' : ''} agendado${events.length > 1 ? 's' : ''}`
                    : 'Nenhum evento agendado'
                  }
                </div>
              </div>
            </div>
            
            {/* Navegação para múltiplos eventos */}
            {events.length > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousEvent}
                  disabled={currentEventIndex === 0}
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-white/80 px-2">
                  {currentEventIndex + 1} de {events.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextEvent}
                  disabled={currentEventIndex === events.length - 1}
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="max-h-96 overflow-y-auto">
          {events.length > 0 ? (
            <div className="space-y-6">
              {/* Evento atual */}
              <div className="p-6 rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-lg">
                <div className="flex items-start gap-4">
                  {/* Ícone do evento */}
                  <div className={cn(
                    "flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg",
                    currentEvent.isGlobal 
                      ? 'bg-gradient-to-br from-orange-600 to-orange-700' 
                      : getEventTypeColor(currentEvent.type)
                  )}>
                    {currentEvent.isGlobal ? '🌐' : currentEvent.icon}
                  </div>
                  
                  {/* Conteúdo do evento */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                          {currentEvent.title}
                        </h3>
                        
                        {/* Badge do tipo */}
                        <div className="mb-4">
                          <Badge 
                            className={cn(
                              "text-sm font-medium px-4 py-2 text-white",
                              currentEvent.isGlobal 
                                ? "bg-orange-600" 
                                : getEventTypeColor(currentEvent.type)
                            )}
                          >
                            {currentEvent.isGlobal ? '🌐 Evento Global' : getEventTypeLabel(currentEvent.type)}
                          </Badge>
                        </div>
                        
                        {/* Descrição */}
                        {currentEvent.description && (
                          <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
                            <div className="flex items-start gap-2">
                              <FileText className="h-5 w-5 text-gray-500 mt-0.5" />
                              <p className="text-gray-700 leading-relaxed">
                                {currentEvent.description}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {/* Informações detalhadas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Data e Horário */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <CalendarIcon className="h-4 w-4" />
                              <span className="font-medium">
                                {format(new Date(currentEvent.date), 'dd/MM/yyyy', { locale: ptBR })}
                              </span>
                            </div>
                            
                            {(currentEvent.startTime || currentEvent.endTime) && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="h-4 w-4" />
                                <span className="font-medium">
                                  {currentEvent.startTime || 'Todo o dia'}
                                  {currentEvent.endTime && ` - ${currentEvent.endTime}`}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Turma e Disciplina */}
                          <div className="space-y-2">
                            {currentEvent.className && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Users className="h-4 w-4" />
                                <span className="font-medium">{currentEvent.className}</span>
                              </div>
                            )}
                            
                            {currentEvent.subjectName && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <BookOpen className="h-4 w-4" />
                                <span className="font-medium">{currentEvent.subjectName}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Informações adicionais */}
                        <div className="flex flex-wrap gap-2 mt-4">
                          {currentEvent.totalPoints && (
                            <Badge variant="outline" className="text-sm px-3 py-1 bg-blue-50 text-blue-700 border-blue-200">
                              🎯 {currentEvent.totalPoints} pontos
                            </Badge>
                          )}
                          
                          {currentEvent.duration && (
                            <Badge variant="outline" className="text-sm px-3 py-1 bg-green-50 text-green-700 border-green-200">
                              ⏱️ {currentEvent.duration}min
                            </Badge>
                          )}
                          
                          {currentEvent.bimonthly && (
                            <Badge variant="outline" className="text-sm px-3 py-1 bg-purple-50 text-purple-700 border-purple-200">
                              📊 {currentEvent.bimonthly}º Bimestre
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Lista de todos os eventos para referência */}
              {events.length > 1 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Todos os eventos do dia:</h4>
                  <div className="space-y-2">
                    {events.map((event, index) => (
                      <div
                        key={event.id}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer transition-all duration-200",
                          index === currentEventIndex
                            ? "border-blue-400 bg-blue-50 shadow-md"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        )}
                        onClick={() => setCurrentEventIndex(index)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-3 h-3 rounded-full",
                            event.isGlobal ? 'bg-orange-500' : getEventTypeColor(event.type)
                          )} />
                          <span className="text-sm font-medium text-gray-900">{event.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {event.isGlobal ? 'Global' : getEventTypeLabel(event.type)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <CalendarIcon className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum evento agendado</h3>
              <p className="text-gray-500">
                {format(selectedDate, 'dd/MM/yyyy')} está livre de compromissos
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
