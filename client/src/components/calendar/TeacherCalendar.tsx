import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Plus, BookOpen, FileText, Users, BarChart3, Clock, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { EventCreateModal } from './EventCreateModal';
import { EventDetailsModal } from './EventDetailsModal';
import { DayEventsModal } from './DayEventsModal';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  classId: string;
  className: string;
  subjectName: string;
  type: 'exam' | 'activity' | 'presentation' | 'meeting';
  color: string;
  icon: string;
  bimonthly?: number;
  totalPoints?: number;
  duration?: number;
  isGlobal?: boolean; // Adicionar campo para eventos globais
}

interface TeacherCalendarProps {
  className?: string;
}

export const TeacherCalendar: React.FC<TeacherCalendarProps> = ({ className }) => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Helpers para tipos de eventos com cores mais visíveis
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'exam': return 'bg-red-600';
      case 'activity': return 'bg-blue-600';
      case 'presentation': return 'bg-purple-600';
      case 'meeting': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  const getEventTypeBgColor = (type: string, isGlobal?: boolean) => {
    if (isGlobal) return 'bg-gradient-to-br from-orange-100 to-orange-200 ring-2 ring-orange-400 shadow-md';
    
    switch (type) {
      case 'exam': return 'bg-gradient-to-br from-red-100 to-red-200 ring-2 ring-red-400 shadow-md';
      case 'activity': return 'bg-gradient-to-br from-blue-100 to-blue-200 ring-2 ring-blue-400 shadow-md';
      case 'presentation': return 'bg-gradient-to-br from-purple-100 to-purple-200 ring-2 ring-purple-400 shadow-md';
      case 'meeting': return 'bg-gradient-to-br from-green-100 to-green-200 ring-2 ring-green-400 shadow-md';
      default: return 'bg-gradient-to-br from-gray-100 to-gray-200 ring-2 ring-gray-400 shadow-md';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'exam': return '📝';
      case 'activity': return '📋';
      case 'presentation': return '📊';
      case 'meeting': return '👥';
      default: return '📅';
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'exam': return 'Prova';
      case 'activity': return 'Atividade';
      case 'presentation': return 'Apresentação';
      case 'meeting': return 'Reunião';
      default: return 'Evento';
    }
  };

  // Buscar eventos do professor (provas, atividades + eventos globais)
  const { data: teacherEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ['teacher-events', user?.id, currentDate.getFullYear(), currentDate.getMonth()],
    queryFn: async () => {
      // Buscar eventos de um range maior (3 meses antes até 3 meses depois)
      const rangeStart = subMonths(currentDate, 3);
      const rangeEnd = addMonths(currentDate, 3);
      const response = await fetch(
        `/api/teacher/${user?.id}/events?startDate=${format(rangeStart, 'yyyy-MM-dd')}&endDate=${format(rangeEnd, 'yyyy-MM-dd')}`, 
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Erro ao buscar eventos');
      return response.json();
    },
    enabled: !!user?.id
  });

  // Calcular range do mês atual
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Segunda-feira como início da semana
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  // Organizar eventos por data
  const eventsByDate = useMemo(() => {
    const eventsMap: { [key: string]: CalendarEvent[] } = {};
    if (teacherEvents?.data) {
      teacherEvents.data.forEach((event: any) => {
        // Usar startDate para eventos globais ou date para eventos específicos
        const eventDate = event.startDate || event.date;
        const formattedDate = format(new Date(eventDate), 'yyyy-MM-dd');
        
        if (!eventsMap[formattedDate]) {
          eventsMap[formattedDate] = [];
        }
        
        // Determinar se é evento global ou específico do professor
        const isGlobalEvent = event.isGlobal;
        const eventType = event.type || (isGlobalEvent ? 'meeting' : 'activity');
        
        eventsMap[formattedDate].push({
          id: event.id,
          title: event.title,
          description: event.description,
          date: eventDate,
          classId: event.classId || 'global',
          className: event.className || (isGlobalEvent ? 'Evento Global' : 'Turma não definida'),
          subjectName: event.subjectName || (isGlobalEvent ? 'Coordenador' : 'Disciplina não definida'),
          type: eventType,
          color: isGlobalEvent ? 'bg-orange-500' : getEventTypeColor(eventType),
          icon: isGlobalEvent ? '🌐' : getEventTypeIcon(eventType),
          bimonthly: event.bimonthly,
          totalPoints: event.totalPoints,
          duration: event.duration,
          isGlobal: isGlobalEvent
        });
      });
    }
    return eventsMap;
  }, [teacherEvents]);

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

  if (eventsLoading) {
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
              <CardTitle className="text-xl font-semibold">Calendário do Professor</CardTitle>
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
          {/* Legenda dos tipos de eventos melhorada */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Legenda de Eventos</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-red-200">
                <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold">📝</div>
                <span className="text-sm text-gray-700 font-medium">Provas</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-blue-200">
                <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">📋</div>
                <span className="text-sm text-gray-700 font-medium">Atividades</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-purple-200">
                <div className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">📊</div>
                <span className="text-sm text-gray-700 font-medium">Apresentações</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-green-200">
                <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold">👥</div>
                <span className="text-sm text-gray-700 font-medium">Reuniões</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-orange-200">
                <div className="w-4 h-4 bg-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold">🌐</div>
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
      <EventCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        selectedDate={selectedDate}
        teacherId={user?.id}
      />

      <EventDetailsModal
        isOpen={showEventModal && selectedEvent !== null}
        onClose={() => setShowEventModal(false)}
        event={selectedEvent}
        onDelete={() => {
          setShowEventModal(false);
          toast.success('Evento removido com sucesso');
        }}
      />

      <DayEventsModal
        isOpen={showEventModal && selectedEvent === null}
        onClose={() => setShowEventModal(false)}
        selectedDate={selectedDate}
        events={selectedDate ? getEventsForDate(selectedDate) : []}
      />
    </>
  );
};