import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Megaphone, 
  Plus, 
  Send, 
  Clock, 
  Users,
  Calendar,
  FileText,
  CheckCircle,
  AlertCircle,
  Eye,
  XCircle,
  MapPin,
  User,
  ChevronLeft,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, isSameDay, isToday as isTodayFn } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PendingEvent {
  id: string;
  title: string;
  description?: string;
  type: string;
  startDate: string;
  endDate?: string;
  location?: string;
  color: string;
  classId?: string;
  subjectId?: string;
  createdBy: string;
  isGlobal: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  creatorName: string;
  creatorRole: string;
  className?: string;
  subjectName?: string;
}

interface GlobalEvent {
  id: string;
  title: string;
  description?: string;
  type: 'event' | 'meeting' | 'presentation' | 'holiday' | 'training' | 'announcement' | 'other';
  customType?: string;
  startDate: string;
  date?: string; // Campo retornado pela API
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  color: string;
  isGlobal: boolean;
  classId?: string;
  createdBy: string;
  createdAt: string;
  status: string;
  creatorName?: string;
  className?: string;
  subjectName?: string;
}

const DirectorAnnouncements = () => {
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<PendingEvent | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'approvals'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  // Abrir o modal automaticamente via querystring: ?create=true | ?open=create
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const openValues = ['1', 'true', 'yes', 'create'];
      const createParam = params.get('create') || params.get('modal') || params.get('open');
      if (createParam && openValues.includes(createParam.toLowerCase())) {
        setShowCreateModal(true);
      }
      const titleParam = params.get('title');
      const typeParam = params.get('type');
      if (titleParam || typeParam) {
        setNewEvent(prev => ({
          ...prev,
          ...(titleParam ? { title: titleParam } : {}),
          ...(typeParam ? { type: typeParam as any } : {}),
        }));
      }
    } catch (err) {
      // Ignorar erros de leitura da querystring
    }
  }, []);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState<GlobalEvent | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<GlobalEvent | null>(null);
  const [newEvent, setNewEvent] = useState<Partial<GlobalEvent>>({
    title: '',
    description: '',
    type: 'event',
    customType: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    location: '',
    color: '#3B82F6',
    isGlobal: true
  });

  // Inicializar newEvent quando o modal for aberto
  useEffect(() => {
    if (showCreateModal) {
      setNewEvent({
        title: '',
        description: '',
        type: 'event',
        customType: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        startTime: '12:00',
        endTime: '13:00',
        location: '',
        color: '#3B82F6',
        isGlobal: true
      });
    }
  }, [showCreateModal]);

  // Buscar eventos pendentes de aprovação
  const { data: pendingEvents = [], isLoading: eventsLoading } = useQuery<PendingEvent[]>({
    queryKey: ['director-pending-events'],
    queryFn: async () => {
      const response = await fetch('/api/director/pending-events', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Erro ao buscar eventos pendentes');
      const data = await response.json();
      return data.data || [];
    }
  });

  // Buscar eventos do calendário (aprovados)
  const { data: calendarEvents = [], isLoading: calendarLoading } = useQuery<GlobalEvent[]>({
    queryKey: ['director-calendar-events'],
    queryFn: async () => {
      const response = await fetch('/api/director/calendar/events', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Erro ao buscar eventos do calendário');
      const data = await response.json();
      console.log('📊 Eventos carregados:', data.data);
      console.log('🕐 Primeiro evento horários:', data.data?.[0] ? {
        title: data.data[0].title,
        startTime: data.data[0].startTime,
        endTime: data.data[0].endTime
      } : 'Nenhum evento');
      return data.data || [];
    }
  });

  // Aprovar evento
  const approveEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await fetch(`/api/director/events/${eventId}/approve`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Erro ao aprovar evento');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['director-pending-events'] });
      queryClient.invalidateQueries({ queryKey: ['director-calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['coordinator-calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['student-global-events'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-events'] });
      toast.success('Evento aprovado com sucesso!');
      setIsDetailsModalOpen(false);
    },
    onError: () => {
      toast.error('Erro ao aprovar evento');
    }
  });

  // Rejeitar evento
  const rejectEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await fetch(`/api/director/events/${eventId}/reject`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Erro ao rejeitar evento');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['director-pending-events'] });
      toast.success('Evento rejeitado com sucesso!');
      setIsDetailsModalOpen(false);
    },
    onError: () => {
      toast.error('Erro ao rejeitar evento');
    }
  });

  // Mutation para excluir evento
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Erro ao excluir evento');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Evento excluído com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['director-calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['coordinator-calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['student-global-events'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-events'] });
      setShowDeleteConfirmModal(false);
      setEventToDelete(null);
    },
    onError: () => {
      toast.error('Erro ao excluir evento');
    }
  });

  const announcements = [
    {
      id: 1,
      title: 'Reunião de Pais - 1º Bimestre',
      content: 'Convocamos todos os pais para a reunião de entrega de boletins do 1º bimestre...',
      target: 'Todos os pais',
      status: 'sent',
      sentAt: '2025-10-08',
      scheduledFor: null
    },
    {
      id: 2,
      title: 'Suspensão das Aulas - Feriado',
      content: 'Informamos que as aulas estarão suspensas no dia 12 de outubro devido ao feriado...',
      target: 'Escola inteira',
      status: 'scheduled',
      sentAt: null,
      scheduledFor: '2025-10-10'
    },
    {
      id: 3,
      title: 'Campanha de Vacinação',
      content: 'A Secretaria de Saúde realizará campanha de vacinação na escola...',
      target: '3º ano',
      status: 'draft',
      sentAt: null,
      scheduledFor: null
    }
  ];

  const getEventTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'exam': 'Prova',
      'homework': 'Atividade',
      'meeting': 'Reunião',
      'activity': 'Atividade',
      'holiday': 'Feriado',
      'event': 'Evento',
      'presentation': 'Apresentação',
      'training': 'Treinamento',
      'announcement': 'Anúncio'
    };
    return types[type] || 'Evento';
  };

  const getEventTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'exam': 'bg-red-100 text-red-800',
      'homework': 'bg-blue-100 text-blue-800',
      'meeting': 'bg-green-100 text-green-800',
      'activity': 'bg-purple-100 text-purple-800',
      'holiday': 'bg-yellow-100 text-yellow-800',
      'event': 'bg-gray-100 text-gray-800',
      'presentation': 'bg-indigo-100 text-indigo-800',
      'training': 'bg-orange-100 text-orange-800',
      'announcement': 'bg-pink-100 text-pink-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getEventTypeHexColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'exam': '#EF4444',
      'homework': '#3B82F6',
      'meeting': '#10B981',
      'activity': '#8B5CF6',
      'holiday': '#F59E0B',
      'event': '#6B7280',
      'presentation': '#6366F1',
      'training': '#F97316',
      'announcement': '#EC4899'
    };
    return colors[type] || '#3B82F6';
  };

  const formatEventDate = (event: GlobalEvent) => {
    const dateString = event.date || event.startDate;
    if (!dateString) return 'Data não informada';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn('Data inválida:', dateString);
      return 'Data inválida';
    }
    
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  const formatEventTime = (event: GlobalEvent) => {
    console.log('🕐 formatEventTime chamada para:', event.title, {
      startTime: event.startTime,
      endTime: event.endTime
    });
    
    // Fallback automático para eventos antigos sem horário
    const start = (event.startTime && event.startTime.trim()) || '08:00';
    const end = (event.endTime && event.endTime.trim()) || start;

    console.log('🕐 Horários processados:', { start, end });

    if (end && end !== start) return `${start} - ${end}`;
    return start;
  };

  const handleViewEventDetails = (event: PendingEvent) => {
    setSelectedEvent(event);
    setIsDetailsModalOpen(true);
  };

  const handleApproveEvent = () => {
    if (selectedEvent) {
      approveEventMutation.mutate(selectedEvent.id);
    }
  };

  const handleRejectEvent = () => {
    if (selectedEvent) {
      rejectEventMutation.mutate(selectedEvent.id);
    }
  };

  // Funções do calendário
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  const getEventsForDate = (date: Date) => {
    const events = calendarEvents
      .filter(event => {
        const dateString = event.date || event.startDate;
        if (!dateString) return false;
        
        const eventDate = new Date(dateString);
        if (isNaN(eventDate.getTime())) {
          console.warn('Data inválida no evento:', event.id, dateString);
          return false;
        }
        
        return isSameDay(eventDate, date);
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime(); // Mais recente primeiro
      });
    
    // Debug log
    if (events.length > 0) {
      console.log(`📅 Eventos para ${format(date, 'dd/MM/yyyy')}:`, events);
    }
    
    return events;
  };

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const events = getEventsForDate(date);
    if (events.length > 0) {
      setSelectedCalendarEvent(events[0]);
      setShowEventDetailsModal(true);
    } else {
      // Se não há eventos, ainda mostrar o modal com informações do dia
      setSelectedCalendarEvent(null);
      setShowEventDetailsModal(true);
    }
  };

  const handleCreateEvent = async () => {
    try {
      // Normalizar horários para evitar strings vazias indo ao backend
      const normalizedStartTime = (newEvent.startTime || '').trim() || '08:00';
      const normalizedEndTime = (newEvent.endTime || '').trim() || normalizedStartTime;

      const payload = {
        ...newEvent,
        startTime: normalizedStartTime,
        endTime: normalizedEndTime
      } as Partial<GlobalEvent>;

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Erro ao criar evento');

      toast.success('Evento criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['director-calendar-events'] });
      setShowCreateModal(false);
      setNewEvent({
        title: '',
        description: '',
        type: 'event',
        customType: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        startTime: '',
        endTime: '',
        location: '',
        color: '#3B82F6',
        isGlobal: true
      });
    } catch (error) {
      toast.error('Erro ao criar evento');
    }
  };

  const handleDeleteEvent = (event: GlobalEvent) => {
    setEventToDelete(event);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteEvent = () => {
    if (eventToDelete) {
      deleteEventMutation.mutate(eventToDelete.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'draft':
        return <FileText className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calendário de Eventos</h1>
            <p className="text-gray-600 mt-1">Gerencie eventos do calendário e aprovações</p>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === 'calendar' && (
              <Button className="bg-gray-800 hover:bg-gray-900" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Evento
              </Button>
            )}
            {pendingEvents.length > 0 && (
              <Button variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50">
                <Calendar className="h-4 w-4 mr-2" />
                {pendingEvents.length} pendências
              </Button>
            )}
            <Badge variant="outline" className="px-3 py-1">
              <Calendar className="h-4 w-4 mr-2" />
              {calendarEvents.length} eventos
            </Badge>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('calendar')}
              className={cn(
                "py-2 px-1 border-b-2 font-medium text-sm",
                activeTab === 'calendar'
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <Calendar className="h-4 w-4 mr-2 inline" />
              Calendário
            </button>
            <button
              onClick={() => setActiveTab('approvals')}
              className={cn(
                "py-2 px-1 border-b-2 font-medium text-sm",
                activeTab === 'approvals'
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <CheckCircle className="h-4 w-4 mr-2 inline" />
              Aprovar Eventos
              {pendingEvents.length > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  {pendingEvents.length}
                </Badge>
              )}
            </button>
          </nav>
        </div>


        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold">
                  {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                </h2>
                <Button variant="outline" size="sm" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Calendar Grid */}
            <Card>
              <CardContent className="p-0">
                {/* Days of week header */}
                <div className="grid grid-cols-7 text-center text-sm font-semibold text-gray-700 mb-2 bg-gray-50 py-2 rounded-t-lg">
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
                    <div key={day} className="p-2">{day}</div>
                  ))}
                </div>

                {/* Calendar */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => {
                    const events = getEventsForDate(day);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isToday = isTodayFn(day);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);

                    return (
                      <div
                        key={index}
                        className={cn(
                          "min-h-[100px] p-2 border border-gray-200 cursor-pointer transition-colors",
                          isCurrentMonth ? "bg-white hover:bg-gray-50" : "bg-gray-50 text-gray-400",
                          isToday && "bg-blue-100 border-blue-300",
                          isSelected && "ring-2 ring-offset-2 ring-orange-500"
                        )}
                        onClick={() => handleDateClick(day)}
                      >
                        <div className="flex items-center justify-between text-sm font-medium mb-2">
                          <span className={cn(
                            "font-semibold",
                            isToday && "text-blue-600",
                            isSelected && "text-orange-600"
                          )}>
                            {format(day, 'd')}
                          </span>
                          {events.length > 0 && (
                            <div className="flex space-x-1">
                              {events.slice(0, 3).map((event, eventIndex) => (
                                <div
                                  key={eventIndex}
                                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                                  style={{ backgroundColor: event.color || getEventTypeHexColor(event.type) }}
                                  title={event.title}
                                />
                              ))}
                              {events.length > 3 && (
                                <div 
                                  className="w-4 h-4 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 border-2 border-white shadow-sm flex items-center justify-center" 
                                  title={`+${events.length - 3} mais`}
                                >
                                  <span className="text-white text-xs font-bold">+</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {events.length > 0 && (
                          <div className="space-y-1">
                            {events.slice(0, 2).map((event) => (
                              <div
                                key={event.id}
                                className="text-xs p-1 rounded text-white truncate"
                                style={{ backgroundColor: event.color || getEventTypeHexColor(event.type) }}
                                title={event.title}
                              >
                                {event.title}
                              </div>
                            ))}
                            {events.length > 2 && (
                              <div className="text-xs text-gray-500">
                                +{events.length - 2} mais
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
          </div>
        )}

        {/* Approvals Tab */}
        {activeTab === 'approvals' && (
          <div className="space-y-4">
            {pendingEvents.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    Eventos Pendentes de Aprovação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingEvents.map((event) => (
                      <div key={event.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge className={getEventTypeColor(event.type)}>
                                {getEventTypeLabel(event.type)}
                              </Badge>
                              <Badge variant="outline" className="bg-orange-100 text-orange-800">
                                Pendente
                              </Badge>
                              {event.isGlobal && (
                                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                  Global
                                </Badge>
                              )}
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {event.title}
                            </h3>

                            {event.description && (
                              <p className="text-gray-600 mb-3 line-clamp-2">
                                {event.description}
                              </p>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {formatEventDate(event)}
                                  {event.endDate && event.endDate !== (event.date || event.startDate) && 
                                    ` - ${formatEventDate({ ...event, startDate: event.endDate })}`
                                  }
                                </span>
                              </div>

                              {event.location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>{event.location}</span>
                                </div>
                              )}

                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>Solicitado por: {event.creatorName}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {event.createdAt ? format(new Date(event.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'Data não informada'}
                                </span>
                              </div>
                            </div>

                            {(event.className || event.subjectName) && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-600">
                                  {event.className && <span>Turma: {event.className}</span>}
                                  {event.className && event.subjectName && <span> • </span>}
                                  {event.subjectName && <span>Disciplina: {event.subjectName}</span>}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewEventDetails(event)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver Detalhes
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => approveEventMutation.mutate(event.id)}
                              disabled={approveEventMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Aprovar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => rejectEventMutation.mutate(event.id)}
                              disabled={rejectEventMutation.isPending}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Rejeitar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhum evento pendente
                  </h3>
                  <p className="text-gray-600">
                    Todos os eventos foram aprovados ou não há solicitações pendentes.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas de Comunicados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">24</div>
                <div className="text-sm text-gray-600">Total Enviados</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">3</div>
                <div className="text-sm text-gray-600">Agendados</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">1</div>
                <div className="text-sm text-gray-600">Rascunhos</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">98%</div>
                <div className="text-sm text-gray-600">Taxa de Leitura</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modal de Criar Evento */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Evento</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título do Evento</Label>
                <Input
                  id="title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Digite o título do evento"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Digite a descrição do evento"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Tipo de Evento</Label>
                  <Select value={newEvent.type} onValueChange={(value) => setNewEvent({ ...newEvent, type: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event">Evento</SelectItem>
                      <SelectItem value="meeting">Reunião</SelectItem>
                      <SelectItem value="presentation">Apresentação</SelectItem>
                      <SelectItem value="holiday">Feriado</SelectItem>
                      <SelectItem value="training">Treinamento</SelectItem>
                      <SelectItem value="announcement">Anúncio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="color">Cor</Label>
                  <Input
                    id="color"
                    type="color"
                    value={newEvent.color}
                    onChange={(e) => setNewEvent({ ...newEvent, color: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="startDate">Data do Evento</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newEvent.startDate}
                  onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value, endDate: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Horário de Início</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="endTime">Horário de Término</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location">Local (opcional)</Label>
                <Input
                  id="location"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder="Digite o local do evento"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateEvent} className="bg-gray-800 hover:bg-gray-900">
                  Criar Evento
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Detalhes do Evento do Calendário */}
        <Dialog open={showEventDetailsModal} onOpenChange={setShowEventDetailsModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedDate ? `Eventos de ${format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}` : 'Detalhes do Evento'}
              </DialogTitle>
            </DialogHeader>
            
            {selectedDate && (
              <div className="space-y-4">
                {(() => {
                  const dayEvents = getEventsForDate(selectedDate);
                  
                  if (dayEvents.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Nenhum evento agendado para este dia</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {dayEvents.map((event) => (
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
                              <p>{formatEventDate(event)}</p>
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
                  );
                })()}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Detalhes do Evento Pendente */}
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                Detalhes do Evento
              </DialogTitle>
            </DialogHeader>
            
            {selectedEvent && (
              <div className="space-y-6">
                {/* Informações Básicas */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Badge className={getEventTypeColor(selectedEvent.type)}>
                      {getEventTypeLabel(selectedEvent.type)}
                    </Badge>
                    <Badge variant="outline" className="bg-orange-100 text-orange-800">
                      Pendente de Aprovação
                    </Badge>
                    {selectedEvent.isGlobal && (
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        Evento Global
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedEvent.title}
                  </h3>

                  {selectedEvent.description && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-700">{selectedEvent.description}</p>
                    </div>
                  )}
                </div>

                {/* Detalhes do Evento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Data de Início</p>
                        <p className="font-medium">
                          {format(new Date(selectedEvent.startDate), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    </div>

                    {selectedEvent.endDate && selectedEvent.endDate !== selectedEvent.startDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Data de Fim</p>
                          <p className="font-medium">
                            {format(new Date(selectedEvent.endDate), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedEvent.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Local</p>
                          <p className="font-medium">{selectedEvent.location}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Criado por</p>
                        <p className="font-medium">{selectedEvent.creatorName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Criado em</p>
                        <p className="font-medium">
                          {format(new Date(selectedEvent.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                    </div>

                    {(selectedEvent.className || selectedEvent.subjectName) && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Vinculação</p>
                          <p className="font-medium">
                            {selectedEvent.className && `Turma: ${selectedEvent.className}`}
                            {selectedEvent.className && selectedEvent.subjectName && ' • '}
                            {selectedEvent.subjectName && `Disciplina: ${selectedEvent.subjectName}`}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailsModalOpen(false)}
                    disabled={approveEventMutation.isPending || rejectEventMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleRejectEvent}
                    disabled={approveEventMutation.isPending || rejectEventMutation.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rejeitar
                  </Button>
                  <Button
                    onClick={handleApproveEvent}
                    disabled={approveEventMutation.isPending || rejectEventMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aprovar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Confirmação de Exclusão */}
        <Dialog open={showDeleteConfirmModal} onOpenChange={setShowDeleteConfirmModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-600">
                Tem certeza que deseja excluir o evento <strong>"{eventToDelete?.title}"</strong>?
              </p>
              <p className="text-sm text-gray-500">
                Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteConfirmModal(false)}
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
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default DirectorAnnouncements;
