import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, Clock, MapPin, Users, Target, BookOpen } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
         addMonths, subMonths, isSameMonth, isToday, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarEvent } from '@/types';
import { useCalendarEvents } from '@/hooks/useApi';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { EventDetailsModal } from './EventDetailsModal';
import { DayEventsModal } from './DayEventsModal';

interface DynamicCalendarProps {
  className?: string;
}

const DynamicCalendar: React.FC<DynamicCalendarProps> = ({ className }) => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Calcular range do mês atual
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  // Buscar eventos específicos do aluno (provas e atividades da turma)
  const { data: studentEvents = [], isLoading: studentEventsLoading } = useCalendarEvents(
    format(calendarStart, 'yyyy-MM-dd'),
    format(calendarEnd, 'yyyy-MM-dd')
  );

  // Buscar eventos globais do coordenador
  const { data: globalEvents = [], isLoading: globalEventsLoading } = useQuery({
    queryKey: ['student-global-events', currentDate.getFullYear(), currentDate.getMonth()],
    queryFn: async () => {
      const response = await fetch(
        `/api/student/${user?.id}/events?startDate=${format(calendarStart, 'yyyy-MM-dd')}&endDate=${format(calendarEnd, 'yyyy-MM-dd')}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Erro ao buscar eventos globais');
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!user?.id,
  });

  // Helpers para tipos de eventos
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'exam': return 'bg-red-500';
      case 'activity': return 'bg-blue-500';
      case 'presentation': return 'bg-purple-500';
      case 'meeting': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getEventTypeBgColor = (type: string, isGlobal?: boolean) => {
    if (isGlobal) return 'bg-gradient-to-br from-orange-50 to-orange-100 ring-1 ring-orange-200/60';
    switch (type) {
      case 'exam': return 'bg-gradient-to-br from-red-50 to-red-100 ring-1 ring-red-200/60';
      case 'activity': return 'bg-gradient-to-br from-blue-50 to-blue-100 ring-1 ring-blue-200/60';
      case 'presentation': return 'bg-gradient-to-br from-purple-50 to-purple-100 ring-1 ring-purple-200/60';
      case 'meeting': return 'bg-gradient-to-br from-green-50 to-green-100 ring-1 ring-green-200/60';
      default: return 'bg-gradient-to-br from-gray-50 to-gray-100 ring-1 ring-gray-200/60';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'exam': return '📝';
      case 'activity': return '📋';
      case 'presentation': return '🎤';
      case 'meeting': return '👥';
      default: return '📅';
    }
  };

  const getEventTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'exam': 'Prova',
      'activity': 'Atividade',
      'presentation': 'Apresentação',
      'meeting': 'Reunião',
      'event': 'Evento'
    };
    return labels[type] || 'Evento';
  };

  // Combinar eventos
  const allEvents = useMemo(() => {
    const combined = [...studentEvents, ...globalEvents];
    return combined;
  }, [studentEvents, globalEvents]);

  const isLoading = studentEventsLoading || globalEventsLoading;

  // Organizar eventos por data
  const eventsByDate = useMemo(() => {
    const eventsMap: { [key: string]: CalendarEvent[] } = {};
    allEvents.forEach((event: any) => {
      // Usar startDate para eventos globais ou date para eventos específicos
      const rawDate = event.startDate || event.date;
      const normalizeDate = (s: string) => {
        return /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T12:00` : s;
      };
      const eventDate = normalizeDate(rawDate);
      const formattedDate = format(new Date(eventDate), 'yyyy-MM-dd');
      
      if (!eventsMap[formattedDate]) {
        eventsMap[formattedDate] = [];
      }
      
      // Determinar se é evento global ou específico
      const isGlobalEvent = event.isGlobal;
      const eventType = event.type || (isGlobalEvent ? 'meeting' : 'activity');
      
      eventsMap[formattedDate].push({
        id: event.id,
        title: event.title,
        description: event.description,
        date: eventDate,
        startDate: event.startDate,
        endDate: event.endDate,
        startTime: event.startTime,
        endTime: event.endTime,
        classId: event.classId || 'global',
        className: event.className || (isGlobalEvent ? 'Evento Global' : 'Turma não definida'),
        subjectName: event.subjectName || (isGlobalEvent ? 'Coordenador' : 'Disciplina não definida'),
        type: eventType,
        color: isGlobalEvent ? 'bg-orange-500' : getEventTypeColor(eventType),
        icon: isGlobalEvent ? '🌐' : getEventTypeIcon(eventType),
        isGlobal: isGlobalEvent
      });
    });
    return eventsMap;
  }, [allEvents]);

  // Gerar dias do calendário
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedEvent(null); // Limpar evento selecionado para mostrar todos os eventos do dia
    setShowEventModal(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const getEventsForDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return eventsByDate[dateKey] || [];
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
              <CardTitle className="text-xl font-semibold">Calendário Escolar</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevMonth}
                className="p-2"
              >
                <ChevronLeftIcon className="h-4 w-4" />
            </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextMonth}
                className="p-2"
              >
                <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
          <div className="text-lg font-medium text-gray-800">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </div>
      </CardHeader>

      <CardContent>
          {/* Legenda dos tipos de eventos */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Legenda de Eventos</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-700 font-medium">Provas</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-700 font-medium">Atividades</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-700 font-medium">Apresentações</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700 font-medium">Reuniões</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-700 font-medium">Eventos Globais</span>
              </div>
            </div>
          </div>

          {/* Grade do calendário */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
            {/* Cabeçalhos dos dias da semana */}
            {weekDays.map((day) => (
              <div key={day} className="bg-gray-50 p-3 text-center text-sm font-medium text-gray-700">
              {day}
            </div>
          ))}

        {/* Dias do calendário */}
            {calendarDays.map((date) => {
              const events = getEventsForDate(date);
              const isCurrentMonth = isSameMonth(date, currentDate);
              const isTodayDate = isToday(date);
              
              // Determinar a cor do dia baseada no tipo de evento
              const getDayBackgroundColor = () => {
                if (events.length === 0) return '';
                
                // Se há eventos globais, priorizar laranja
                const hasGlobalEvent = events.some(event => event.isGlobal);
                if (hasGlobalEvent) return getEventTypeBgColor('event', true);
                
                // Se há provas, priorizar vermelho
                const hasExam = events.some(event => event.type === 'exam');
                if (hasExam) return getEventTypeBgColor('exam');
                
                // Se há atividades, usar azul
                const hasActivity = events.some(event => event.type === 'activity');
                if (hasActivity) return getEventTypeBgColor('activity');
                
                // Se há apresentações, usar roxo
                const hasPresentation = events.some(event => event.type === 'presentation');
                if (hasPresentation) return getEventTypeBgColor('presentation');
                
                // Se há reuniões, usar verde
                const hasMeeting = events.some(event => event.type === 'meeting');
                if (hasMeeting) return getEventTypeBgColor('meeting');
                
                return getEventTypeBgColor('event');
              };

            return (
              <div
                  key={date.toISOString()}
                  className={cn(
                    "p-2 min-h-[60px] border-r border-b border-gray-200 hover:shadow-md cursor-pointer relative transition-all duration-200",
                    !isCurrentMonth && "bg-gray-50 text-gray-400",
                    isCurrentMonth && events.length === 0 && "bg-white hover:bg-gray-50",
                    isCurrentMonth && events.length > 0 && getDayBackgroundColor()
                  )}
                  onClick={() => {
                    if (isCurrentMonth) handleDateClick(date);
                  }}
              >
                {/* Número do dia */}
                  <div className="flex items-center justify-center">
                    <div className={cn(
                      "text-sm font-bold",
                      isTodayDate ? "text-white bg-blue-600 rounded-full w-6 h-6 flex items-center justify-center" : "text-gray-900"
                    )}>
                      {format(date, 'd')}
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      </Card>

      {/* Modais */}
      <EventDetailsModal
        isOpen={showEventModal && selectedEvent !== null}
        onClose={() => setShowEventModal(false)}
        event={selectedEvent}
        onDelete={() => {
          setShowEventModal(false);
          // toast.success('Evento removido com sucesso');
        }}
      />

      {/* Modal de eventos do dia - versão melhorada */}
      <Dialog open={showEventModal && selectedEvent === null} onOpenChange={setShowEventModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg -m-6 mb-4 p-6">
            <DialogTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <CalendarIcon className="h-6 w-6" />
              </div>
              <div>
                <div>{selectedDate && format(selectedDate, 'EEEE, dd/MM/yyyy', { locale: ptBR })}</div>
                <div className="text-blue-100 text-sm font-normal">
                  {selectedDate && getEventsForDate(selectedDate).length > 0 
                    ? `${getEventsForDate(selectedDate).length} evento${getEventsForDate(selectedDate).length > 1 ? 's' : ''} agendado${getEventsForDate(selectedDate).length > 1 ? 's' : ''}`
                    : 'Nenhum evento agendado'
                  }
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {selectedDate && getEventsForDate(selectedDate).length > 0 ? (
              getEventsForDate(selectedDate).map((event) => (
                <div
                  key={event.id}
                  className="group p-6 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-gray-50"
                >
                  <div className="flex items-start gap-4">
                    {/* Ícone do evento */}
                    <div className={cn(
                      "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg",
                      event.isGlobal ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'
                    )}>
                      {event.isGlobal ? '🌐' : event.icon}
                </div>
                    
                    {/* Conteúdo do evento */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                            {event.title}
                          </h3>
                          
                          {event.description && (
                            <p className="text-gray-600 mb-3 leading-relaxed">
                              {event.description}
                            </p>
                          )}
                          
                          {/* Informações do evento */}
                          <div className="flex flex-wrap gap-2 mb-3">
                              <Badge 
                                variant="secondary"
                              className={cn(
                                "text-sm font-medium px-3 py-1",
                                event.isGlobal 
                                  ? "bg-orange-100 text-orange-800 border-orange-200" 
                                  : event.type === 'exam'
                                    ? "bg-red-100 text-red-800 border-red-200"
                                    : event.type === 'activity'
                                    ? "bg-blue-100 text-blue-800 border-blue-200"
                                    : event.type === 'presentation'
                                    ? "bg-purple-100 text-purple-800 border-purple-200"
                                    : event.type === 'meeting'
                                    ? "bg-green-100 text-green-800 border-green-200"
                                    : "bg-gray-100 text-gray-800 border-gray-200"
                              )}
                            >
                              {event.isGlobal ? '🌐 Evento Global' : getEventTypeLabel(event.type)}
                            </Badge>
                            
                            {/* Mostrar turma e disciplina apenas para eventos globais */}
                            {event.isGlobal && event.className && (
                              <Badge variant="outline" className="text-sm px-3 py-1">
                                🏫 {event.className}
                              </Badge>
                            )}
                            
                            {event.isGlobal && event.subjectName && (
                              <Badge variant="outline" className="text-sm px-3 py-1">
                                📚 {event.subjectName}
                              </Badge>
                            )}
                            </div>
                          
                          {/* Horário */}
                          {(event.startTime || event.endTime) && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Clock className="h-4 w-4" />
                              <span className="font-medium">
                                {event.startTime}
                                {event.endTime && ` - ${event.endTime}`}
                              </span>
                                </div>
                              )}
                        </div>
                        
                        {/* Indicador visual */}
                        <div className={cn(
                          "w-3 h-3 rounded-full flex-shrink-0 mt-2",
                          event.isGlobal ? 'bg-orange-500' : 'bg-blue-500'
                        )} />
                      </div>
                            </div>
                          </div>
                        </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                  <CalendarIcon className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum evento agendado</h3>
                <p className="text-gray-500">
                  {selectedDate && format(selectedDate, 'dd/MM/yyyy')} está livre de compromissos
                </p>
                </div>
              )}
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DynamicCalendar;
