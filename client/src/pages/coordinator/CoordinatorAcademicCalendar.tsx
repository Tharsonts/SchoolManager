import React, { useState, useMemo, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Clock, MapPin, Trash2, User, Book, BookOpen } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import AdvancedMultiSelect from '@/components/admin/AdvancedMultiSelect';
import ClassSearchMultiSelect from '@/components/admin/ClassSearchMultiSelect';
import { Textarea } from '@/components/ui/textarea';

interface GlobalEvent {
  id: string;
  title: string;
  description?: string;
  type: 'event' | 'meeting' | 'presentation' | 'holiday' | 'training' | 'announcement' | 'other';
  customType?: string; // Para quando type = 'other'
  startDate: string;
  endDate?: string; // Opcional - se não fornecido, usa startDate
  startTime?: string;
  endTime?: string;
  location?: string;
  color: string;
  isGlobal: boolean;
  classId?: string; // ID da turma específica (opcional)
  classIds?: string[]; // IDs de múltiplas turmas (opcional, para criação)
  createdBy: string;
  createdAt: string;
}

export default function CoordinatorAcademicCalendar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date()); // Mês atual
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<GlobalEvent | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<GlobalEvent | null>(null);
  const [newEvent, setNewEvent] = useState<Partial<GlobalEvent>>({
    title: '',
    description: '',
    type: 'event',
    customType: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    startTime: '12:00',
    endTime: '13:00',
    location: '',
    color: '#F97316',
    isGlobal: true,
    classId: undefined,
    classIds: []
  });

  // Buscar turmas para o seletor
  const { data: classesData } = useQuery({
    queryKey: ['coordinator-classes'],
    queryFn: async () => {
      const response = await fetch('/api/coordinator/classes');
      if (!response.ok) throw new Error('Erro ao buscar turmas');
      return response.json();
    }
  });

  const classes = classesData?.data || [];

  // Buscar eventos globais
  const { data: globalEvents = [], isLoading: eventsLoading, error: eventsError } = useQuery<GlobalEvent[]>({
    queryKey: ['coordinator-calendar-events', currentDate.getFullYear(), currentDate.getMonth()],
    queryFn: async () => {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const response = await fetch(
        `/api/coordinator/calendar/events?startDate=${format(monthStart, 'yyyy-MM-dd')}&endDate=${format(monthEnd, 'yyyy-MM-dd')}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Erro ao buscar eventos globais');
      const data = await response.json();
      console.log('📅 Eventos globais recebidos:', data);
      return data.data || [];
    },
    enabled: !!user?.id,
  });

  // Criar evento global
  const createEventMutation = useMutation({
    mutationFn: async (eventData: Partial<GlobalEvent>) => {
      console.log('📤 Criando evento global:', eventData);
      const normalizedStartTime = (eventData.startTime || '').trim() || '08:00';
      const normalizedEndTime = (eventData.endTime || '').trim() || normalizedStartTime;

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...eventData,
          startTime: normalizedStartTime,
          endTime: normalizedEndTime
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao criar evento: ${response.status} - ${errorText}`);
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['coordinator-calendar-events'] });
      setShowCreateModal(false);
      setNewEvent({
        title: '',
        description: '',
        type: 'event',
        customType: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        startTime: '12:00',
        endTime: '13:00',
        location: '',
        color: '#F97316',
        isGlobal: true,
        classId: undefined,
        classIds: []
      });
      const isBulk = (variables?.classIds || []).length > 0 && !variables?.isGlobal;
      toast.success(isBulk ? 'Eventos criados para turmas selecionadas!' : 'Evento global criado com sucesso!');
    },
    onError: (error) => {
      console.error('❌ Erro ao criar evento global:', error);
      toast.error('Erro ao criar evento global.');
    }
  });

  // Deletar evento global
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      console.log('🗑️ Deletando evento global:', eventId);
      const response = await fetch(`/api/coordinator/global-events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao deletar evento: ${response.status} - ${errorText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coordinator-calendar-events'] });
      toast.success('Evento deletado com sucesso!');
      setShowDeleteConfirmModal(false);
      setEventToDelete(null);
    },
    onError: (error) => {
      console.error('❌ Erro ao deletar evento global:', error);
      toast.error('Erro ao deletar evento.');
    }
  });

  // Função para confirmar exclusão
  const handleDeleteEvent = (event: GlobalEvent) => {
    setEventToDelete(event);
    setShowDeleteConfirmModal(true);
  };

  // Função para executar a exclusão após confirmação
  const confirmDeleteEvent = () => {
    if (eventToDelete) {
      deleteEventMutation.mutate(eventToDelete.id);
    }
  };

  // Inicializar newEvent quando o modal for aberto
  useEffect(() => {
    if (showCreateModal) {
      setNewEvent({
        title: '',
        description: '',
        type: 'event',
        customType: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        startTime: '12:00',
        endTime: '13:00',
        location: '',
        color: '#F97316',
        isGlobal: true,
        classId: undefined,
        classIds: []
      });
    }
  }, [showCreateModal]);

  // Funções auxiliares
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'event': return '#F97316'; // Laranja vibrante
      case 'meeting': return '#3B82F6'; // Azul profissional
      case 'presentation': return '#8B5CF6'; // Roxo elegante
      case 'holiday': return '#10B981'; // Verde sucesso
      case 'training': return '#6366F1'; // Índigo moderno
      case 'announcement': return '#EF4444'; // Vermelho alerta
      case 'other': return '#F59E0B'; // Âmbar para eventos personalizados
      default: return '#6B7280'; // Cinza neutro
    }
  };

  const getEventTypeGradient = (type: string) => {
    switch (type) {
      case 'event': return 'from-orange-500 to-orange-600';
      case 'meeting': return 'from-blue-500 to-blue-600';
      case 'presentation': return 'from-purple-500 to-purple-600';
      case 'holiday': return 'from-green-500 to-green-600';
      case 'training': return 'from-indigo-500 to-indigo-600';
      case 'announcement': return 'from-red-500 to-red-600';
      case 'other': return 'from-amber-500 to-amber-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getEventTypeLabel = (type: string, customType?: string) => {
    if (type === 'other' && customType) {
      return customType;
    }
    
    switch (type) {
      case 'event': return 'Evento';
      case 'meeting': return 'Reunião';
      case 'presentation': return 'Apresentação';
      case 'holiday': return 'Feriado';
      case 'training': return 'Treinamento';
      case 'announcement': return 'Aviso';
      case 'other': return 'Outro';
      default: return 'Evento';
    }
  };

  const formatEventTime = (event: GlobalEvent) => {
    // Fallback automático para eventos sem horário
    const start = (event.startTime && event.startTime.trim()) || '08:00';
    const end = (event.endTime && event.endTime.trim()) || start;
    return end !== start ? `${start} - ${end}` : start;
  };



  // Calendário
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Organizar eventos por data
  const eventsByDate = useMemo(() => {
    console.log('📅 Calculando eventsByDate com', globalEvents.length, 'eventos');
    const eventsMap: { [key: string]: GlobalEvent[] } = {};
    
    if (!globalEvents || globalEvents.length === 0) {
      console.log('📅 Nenhum evento encontrado');
      return eventsMap;
    }
    
    globalEvents.forEach((event) => {
      try {
        const start = new Date(event.startDate);
        const end = event.endDate ? new Date(event.endDate) : start;
        
        console.log(`📅 Processando evento "${event.title}" de ${format(start, 'yyyy-MM-dd')} até ${format(end, 'yyyy-MM-dd')}`);
        
        eachDayOfInterval({ start, end }).forEach(day => {
          const dayStr = format(day, 'yyyy-MM-dd');
          if (!eventsMap[dayStr]) {
            eventsMap[dayStr] = [];
          }
          eventsMap[dayStr].push(event);
          console.log(`📅 Adicionado evento "${event.title}" ao dia ${dayStr}`);
        });
      } catch (error) {
        console.error(`❌ Erro ao processar evento ${event.title}:`, error);
      }
    });
    
    console.log('📅 EventsByDate final:', eventsMap);
    return eventsMap;
  }, [globalEvents]);

  // Navegação do calendário
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
  };

  // Clique no dia
  const handleDayClick = (day: Date) => {
    console.log('📅 Dia clicado:', format(day, 'yyyy-MM-dd'));
    console.log('📅 Eventos disponíveis:', eventsByDate);
    console.log('📅 Eventos para este dia:', eventsByDate[format(day, 'yyyy-MM-dd')]);
    
    setSelectedDate(day);
    const dayEvents = eventsByDate[format(day, 'yyyy-MM-dd')] || [];
    
    if (dayEvents.length > 0) {
      console.log('📅 Abrindo modal de detalhes com', dayEvents.length, 'eventos');
      setShowEventDetailsModal(true);
    } else {
      console.log('📅 Abrindo modal de criação');
      setNewEvent(prev => ({
        ...prev,
        startDate: format(day, 'yyyy-MM-dd'),
        endDate: format(day, 'yyyy-MM-dd'),
        customType: '',
      }));
      setShowCreateModal(true);
    }
  };

  // Próximos eventos
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return globalEvents
      .filter(event => new Date(event.endDate || event.startDate) >= now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 5);
  }, [globalEvents]);

  // Estatísticas
  const totalEvents = globalEvents.length;
  const eventTypesCount = useMemo(() => {
    const counts: { [key: string]: number } = {};
    globalEvents.forEach(event => {
      counts[event.type] = (counts[event.type] || 0) + 1;
    });
    return counts;
  }, [globalEvents]);

  return (
    <MainLayout pageTitle="Calendário Acadêmico">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calendário Acadêmico</h1>
            <p className="text-gray-600 mt-2">
              Gerencie eventos globais que aparecem para todos os usuários da escola
            </p>
          </div>
          <Button 
            className="bg-orange-600 hover:bg-orange-700" 
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Evento Global
          </Button>
        </div>

        {/* Calendário Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-3 p-6">
            <CardHeader className="p-0 pb-4">
              <div className="flex justify-between items-center">
                <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-xl">
                  {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              {/* Legenda de Eventos */}
              <div className="mb-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Legenda de Eventos</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
                  {[
                    { type: 'event', label: 'Evento Geral' },
                    { type: 'meeting', label: 'Reunião' },
                    { type: 'presentation', label: 'Apresentação' },
                    { type: 'holiday', label: 'Feriado' },
                    { type: 'training', label: 'Treinamento' },
                    { type: 'announcement', label: 'Aviso' },
                    { type: 'other', label: 'Outro' }
                  ].map(({ type, label }) => (
                    <div key={type} className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full shadow-sm border-2 border-white"
                        style={{ backgroundColor: getEventTypeColor(type) }}
                      />
                      <span className="text-xs font-medium text-gray-600">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dias da semana */}
              <div className="grid grid-cols-7 text-center text-sm font-semibold text-gray-700 mb-2 bg-gray-50 py-2 rounded-t-lg">
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
                  <div key={day} className="p-2">{day}</div>
                ))}
              </div>

              {/* Calendário */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  const dayEvents = eventsByDate[format(day, 'yyyy-MM-dd')] || [];
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isCurrentDay = isToday(day);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);

                  return (
                    <div
                      key={index}
                      className={cn(
                        "min-h-[100px] p-2 border border-gray-200 cursor-pointer transition-colors",
                        isCurrentMonth ? "bg-white hover:bg-gray-50" : "bg-gray-50 text-gray-400",
                        isCurrentDay && "bg-blue-100 border-blue-300",
                        isSelected && "ring-2 ring-offset-2 ring-orange-500"
                      )}
                      onClick={() => handleDayClick(day)}
                    >
                      <div className="flex items-center justify-between text-sm font-medium mb-2">
                        <span className={cn(
                          "font-semibold",
                          isCurrentDay && "text-blue-600",
                          isSelected && "text-orange-600"
                        )}>
                          {format(day, 'd')}
                        </span>
                        {dayEvents.length > 0 && (
                          <div className="flex space-x-1">
                            {dayEvents.slice(0, 3).map((event, eventIndex) => (
                              <div
                                key={eventIndex}
                                className={cn(
                                  "w-4 h-4 rounded-full border-2 border-white shadow-sm",
                                  (event as any).status === 'pending' && "opacity-60"
                                )}
                                style={{ backgroundColor: getEventTypeColor(event.type) }}
                                title={`${getEventTypeLabel(event.type, event.customType)}: ${event.title}`}
                              />
                            ))}
                            {dayEvents.length > 3 && (
                              <div 
                                className="w-4 h-4 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 border-2 border-white shadow-sm flex items-center justify-center" 
                                title={`+${dayEvents.length - 3} mais`}
                              >
                                <span className="text-white text-xs font-bold">+</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {dayEvents.length > 0 && (
                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map(event => (
                            <div 
                              key={event.id} 
                              className={cn(
                                "text-xs font-medium px-2 py-1 rounded-md truncate shadow-sm",
                                "text-white border border-white/20",
                                (event as any).status === 'pending' && "opacity-70"
                              )}
                              style={{ 
                                backgroundColor: getEventTypeColor(event.type),
                                backgroundImage: `linear-gradient(135deg, ${getEventTypeColor(event.type)}, ${getEventTypeColor(event.type)}dd)`
                              }}
                              title={`${getEventTypeLabel(event.type, event.customType)}: ${event.title}`}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-md text-center">
                              +{dayEvents.length - 2} mais
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Eventos do dia selecionado */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : 'Selecione uma data'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDate && eventsByDate[format(selectedDate, 'yyyy-MM-dd')]?.length > 0 ? (
                  <div className="space-y-3">
                    {eventsByDate[format(selectedDate, 'yyyy-MM-dd')].map(event => (
                      <div key={event.id} className="group relative overflow-hidden border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: getEventTypeColor(event.type) }} />
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1 min-w-0">
                              <div 
                                className="w-5 h-5 rounded-full mt-0.5 flex-shrink-0 shadow-sm"
                                style={{ backgroundColor: getEventTypeColor(event.type) }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-gray-900 truncate">{event.title}</h4>
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs px-2 py-0.5"
                                    style={{ 
                                      borderColor: getEventTypeColor(event.type),
                                      color: getEventTypeColor(event.type)
                                    }}
                                  >
                                    {getEventTypeLabel(event.type, event.customType)}
                                  </Badge>
                                  {event.status === 'pending' && (
                                    <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200 text-[10px] px-1.5 py-0.5">
                                      Pendente
                                    </Badge>
                                  )}
                                </div>
                                {event.description && (
                                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{event.description}</p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  {event.startTime && event.endTime && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      <span>{event.startTime} - {event.endTime}</span>
                                    </div>
                                  )}
                                  {event.location && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      <span className="truncate">{event.location}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteEvent(event)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5"
                              disabled={deleteEventMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Nenhum evento neste dia</p>
                )}
              </CardContent>
            </Card>

            {/* Próximos eventos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Próximos Eventos</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingEvents.map(event => (
                      <div key={event.id} className="group relative overflow-hidden border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: getEventTypeColor(event.type) }} />
                        <div className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1 min-w-0">
                              <div 
                                className="w-4 h-4 rounded-full mt-0.5 flex-shrink-0 shadow-sm"
                                style={{ backgroundColor: getEventTypeColor(event.type) }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-gray-900 text-sm truncate">{event.title}</h4>
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs px-1.5 py-0.5"
                                    style={{ 
                                      borderColor: getEventTypeColor(event.type),
                                      color: getEventTypeColor(event.type)
                                    }}
                                  >
                                    {getEventTypeLabel(event.type, event.customType)}
                                  </Badge>
                                  {event.status === 'pending' && (
                                    <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200 text-[10px] px-1.5 py-0.5">
                                      Pendente
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <CalendarIcon className="w-3 h-3" />
                                  <span>{format(new Date(event.startDate), 'dd/MM/yyyy')}</span>
                                  {event.startTime && (
                                    <>
                                      <Clock className="w-3 h-3" />
                                      <span>{event.startTime}</span>
                                    </>
                                  )}
                                </div>
                                {event.location && (
                                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                                    <MapPin className="w-3 h-3" />
                                    <span className="truncate">{event.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteEvent(event)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                              disabled={deleteEventMutation.isPending}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Nenhum evento próximo</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard 
            title="Total de Eventos" 
            value={totalEvents} 
            icon={CalendarIcon} 
            color="orange" 
          />
          <StatCard 
            title="Reuniões" 
            value={eventTypesCount.meeting || 0} 
            icon={Clock} 
            color="blue" 
          />
          <StatCard 
            title="Feriados" 
            value={eventTypesCount.holiday || 0} 
            icon={CalendarIcon} 
            color="green" 
          />
          <StatCard 
            title="Treinamentos" 
            value={eventTypesCount.training || 0} 
            icon={CalendarIcon} 
            color="indigo" 
          />
        </div>
      </div>

      {/* Modal de Criação de Evento */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[760px]">
          <DialogHeader>
            <DialogTitle>
              {newEvent.classId ? 'Criar Evento para Turma' : 'Criar Evento Global'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label htmlFor="title">Título do Evento</Label>
              <Input
                id="title"
                value={newEvent.title}
                onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Nome do evento"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detalhes do evento"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Tipo de Evento</Label>
                <Select
                  value={newEvent.type}
                  onValueChange={(value) => setNewEvent(prev => ({ ...prev, type: value as GlobalEvent['type'] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="event">Evento Geral</SelectItem>
                    <SelectItem value="meeting">Reunião</SelectItem>
                    <SelectItem value="presentation">Apresentação</SelectItem>
                    <SelectItem value="holiday">Feriado</SelectItem>
                    <SelectItem value="training">Treinamento</SelectItem>
                    <SelectItem value="announcement">Aviso</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Campo personalizado para tipo "Outro" */}
              {newEvent.type === 'other' && (
                <div>
                  <Label htmlFor="customType">Especifique o tipo de evento</Label>
                  <Input
                    id="customType"
                    value={newEvent.customType || ''}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, customType: e.target.value }))}
                    placeholder="Ex: Workshop, Palestra, Cerimônia..."
                  />
                </div>
              )}
              
              <div>
                <Label>Destino do Evento</Label>
                <div className="mt-2 space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="all-classes"
                      checked={!!newEvent.isGlobal}
                      onCheckedChange={(checked) => {
                        const isGlobal = !!checked;
                        setNewEvent(prev => ({
                          ...prev,
                          isGlobal,
                          classId: undefined,
                          classIds: isGlobal ? [] : (prev.classIds || [])
                        }));
                      }}
                    />
                    <Label htmlFor="all-classes">🌐 Enviar para todas as turmas</Label>
                  </div>

                  {!newEvent.isGlobal && (
                    <ClassSearchMultiSelect
                      label="Turmas"
                      placeholder="Pesquisar (ex.: 8, D, 8 D, sala 3)"
                      options={classes.map((c: any) => ({
                        value: c.id,
                        label: `${c.name}${c.section ? ` - ${c.section}` : ''}${c.grade ? ` (${c.grade})` : ''}${typeof c.studentsCount !== 'undefined' ? ` • ${c.studentsCount} alunos` : ''}`.trim(),
                        data: c
                      }))}
                      value={newEvent.classIds || []}
                      onChange={(vals) => {
                        const v = Array.isArray(vals) ? vals : [];
                        setNewEvent(prev => ({
                          ...prev,
                          isGlobal: false,
                          classId: undefined,
                          classIds: v
                        }));
                      }}
                      className=""
                    />
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="startDate">Data do Evento</Label>
              <Input
                id="startDate"
                type="date"
                value={newEvent.startDate}
                onChange={(e) => setNewEvent(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Horário de Início</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={newEvent.startTime || ''}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endTime">Horário de Fim</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={newEvent.endTime || ''}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="location">Local (Opcional)</Label>
              <Input
                id="location"
                value={newEvent.location}
                onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Local do evento"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => createEventMutation.mutate(newEvent)} 
                disabled={
                  createEventMutation.isPending || 
                  !newEvent.title || 
                  (newEvent.type === 'other' && !newEvent.customType) ||
                  (!newEvent.isGlobal && (!(newEvent.classIds) || newEvent.classIds.length === 0))
                }
                className="bg-orange-600 hover:bg-orange-700"
              >
                {createEventMutation.isPending 
                  ? 'Criando...' 
                  : (newEvent?.isGlobal ? 'Criar Evento Global' : (newEvent?.classIds && newEvent.classIds.length > 0 ? 'Criar Evento para Turmas' : 'Criar Evento'))
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes do Evento */}
      <Dialog open={showEventDetailsModal} onOpenChange={setShowEventDetailsModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Eventos do Dia</DialogTitle>
          </DialogHeader>
          {selectedDate && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {format(selectedDate, 'dd/MM/yyyy')}
              </h3>
              {eventsByDate[format(selectedDate, 'yyyy-MM-dd')]?.map(event => (
                <div key={event.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: event.color || '#3B82F6' }}
                      />
                      <Badge className={getEventTypeColor(event.type)}>
                        {getEventTypeLabel(event.type)}
                      </Badge>
                      {event.isGlobal && (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">
                          Evento Global
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteEvent(event)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <h3 className="text-lg font-bold">{event.title}</h3>

                  {event.description && (
                    <p className="text-gray-600">{event.description}</p>
                  )}

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Data:</span>
                      <p>{format(new Date(event.startDate), 'dd/MM/yyyy')}</p>
                    </div>
                    <div>
                      <span className="font-medium">Início:</span>
                      <p>{(event.startTime && event.startTime.trim()) || '08:00'}</p>
                    </div>
                    <div>
                      <span className="font-medium">Fim:</span>
                      <p>{(event.endTime && event.endTime.trim()) || ((event.startTime && event.startTime.trim()) || '08:00')}</p>
                    </div>
                    {event.location && (
                      <div>
                        <span className="font-medium">Local:</span>
                        <p>{event.location}</p>
                      </div>
                    )}
                    {event.creatorName && (
                      <div>
                        <span className="font-medium">Criado por:</span>
                        <p>{event.creatorName}</p>
                      </div>
                    )}
                    {event.className && (
                      <div>
                        <span className="font-medium">Turma:</span>
                        <p>{event.className}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowEventDetailsModal(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={showDeleteConfirmModal} onOpenChange={setShowDeleteConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Tem certeza que deseja excluir o evento <strong>"{eventToDelete?.title}"</strong>?
            </p>
            <p className="text-sm text-gray-500">
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setEventToDelete(null);
                }}
                disabled={deleteEventMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteEvent}
                disabled={deleteEventMutation.isPending}
              >
                {deleteEventMutation.isPending ? 'Excluindo...' : 'Excluir'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

// Componente de estatísticas
const StatCard = ({ title, value, icon: Icon, color = "blue" }: {
  title: string;
  value: number;
  icon: any;
  color?: string;
}) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600", 
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
    red: "bg-red-50 text-red-600",
    indigo: "bg-indigo-50 text-indigo-600"
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`${colorClasses[color]} p-3 rounded-full`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}
