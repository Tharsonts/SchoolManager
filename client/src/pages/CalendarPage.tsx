import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ptBR } from "date-fns/locale";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Calendar as CalendarIcon, MoreHorizontal, Edit, Trash2, Loader2, Clock, MapPin, ChevronLeft, ChevronRight, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEvents, useCreateEvent } from "@/hooks/useApi";
import { format } from "date-fns";

// Define event types with distinctive colors and icons
const EVENT_TYPES = [
  { value: "exam", label: "Prova", color: "bg-red-600", lightColor: "bg-red-100", textColor: "text-red-800", icon: "📝" },
  { value: "homework", label: "Tarefa", color: "bg-blue-600", lightColor: "bg-blue-100", textColor: "text-blue-800", icon: "📚" },
  { value: "meeting", label: "Reunião", color: "bg-green-600", lightColor: "bg-green-100", textColor: "text-green-800", icon: "👥" },
  { value: "holiday", label: "Feriado", color: "bg-purple-600", lightColor: "bg-purple-100", textColor: "text-purple-800", icon: "🎉" },
  { value: "activity", label: "Atividade", color: "bg-yellow-600", lightColor: "bg-yellow-100", textColor: "text-yellow-800", icon: "🎯" },
  { value: "other", label: "Outro", color: "bg-gray-600", lightColor: "bg-gray-100", textColor: "text-gray-800", icon: "📅" }
];

const CLASSES = [
  "Todas",
  "9º Ano - A",
  "9º Ano - B",
  "8º Ano - A",
  "8º Ano - B",
  "7º Ano - A",
  "7º Ano - B",
  "7º Ano - C",
  "6º Ano - A",
  "6º Ano - B"
];

export default function CalendarPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedClass, setSelectedClass] = useState<string>("Todas");
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false);
  const [isViewEventDialogOpen, setIsViewEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<any>(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: new Date(),
    description: "",
    type: "other",
    class: "Todas"
  });

  const { toast } = useToast();
  const { user } = useAuth();
  
  // Get user type from the authenticated user
  const userType = user?.role || 'admin';
  const canCreateEvent = userType === 'admin' || userType === 'coordinator' || userType === 'teacher';

  // Buscar eventos usando a API real
  const { data: eventsData, isLoading, error } = useEvents();
  const createEventMutation = useCreateEvent();

  // Processar eventos da API para o formato da interface
  const events = useMemo(() => {
    if (!eventsData?.data) return [];
    
    return eventsData.data.map((event: any) => ({
      id: event.id,
      title: event.title,
      date: new Date(event.startDate),
      description: event.description || "",
      type: event.type || "other",
      class: event.classId ? `${event.classId}` : "Todas",
      location: event.location,
      color: event.color || "#3B82F6"
    }));
  }, [eventsData]);

  // Filter events based on selected class
  const filteredEvents = events.filter(event => 
    selectedClass === "Todas" || event.class === "Todas" || event.class === selectedClass
  );

  // Get events for the current month to highlight in the calendar
  const eventsInCalendar = filteredEvents.filter(event => {
    const eventDate = event.date;
    return eventDate.getMonth() === date.getMonth() && eventDate.getFullYear() === date.getFullYear();
  });

  // Days with events should be highlighted in the calendar
  const daysWithEvents = eventsInCalendar.map(event => event.date);

  // Get events for the selected day
  const eventsForSelectedDay = eventsInCalendar.filter(event => 
    event.date.getDate() === date.getDate()
  );

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createEventMutation.mutateAsync({
        title: newEvent.title,
        description: newEvent.description,
        type: newEvent.type,
        startDate: format(newEvent.date, 'yyyy-MM-dd'),
        endDate: format(newEvent.date, 'yyyy-MM-dd'),
        location: "",
        color: "#3B82F6",
        classId: newEvent.class === "Todas" ? undefined : newEvent.class,
        subjectId: undefined
      });
      
      setIsAddEventDialogOpen(false);
      setNewEvent({
        title: "",
        date: new Date(),
        description: "",
        type: "other",
        class: "Todas"
      });
      
      toast({
        title: "Evento adicionado",
        description: `O evento "${newEvent.title}" foi adicionado com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao adicionar evento",
        description: "Ocorreu um erro ao tentar adicionar o evento.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteEvent = (id: number) => {
    const eventToDelete = events.find(event => event.id === id);
    setEventToDelete(eventToDelete);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteEvent = () => {
    if (eventToDelete) {
      // Em um sistema real, aqui seria feita uma chamada para a API de delete
      
      toast({
        title: "Evento removido",
        description: `O evento "${eventToDelete?.title}" foi removido com sucesso.`,
        variant: "destructive"
      });
      
      setIsViewEventDialogOpen(false);
      setShowDeleteConfirmModal(false);
      setEventToDelete(null);
    }
  };

  const handleViewEvent = (event: any) => {
    const eventIndex = eventsForSelectedDay.findIndex(e => e.id === event.id);
    setCurrentEventIndex(eventIndex >= 0 ? eventIndex : 0);
    setSelectedEvent(event);
    setIsViewEventDialogOpen(true);
  };

  const handleNextEvent = () => {
    if (currentEventIndex < eventsForSelectedDay.length - 1) {
      const nextIndex = currentEventIndex + 1;
      setCurrentEventIndex(nextIndex);
      setSelectedEvent(eventsForSelectedDay[nextIndex]);
    }
  };

  const handlePreviousEvent = () => {
    if (currentEventIndex > 0) {
      const prevIndex = currentEventIndex - 1;
      setCurrentEventIndex(prevIndex);
      setSelectedEvent(eventsForSelectedDay[prevIndex]);
    }
  };

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewEvent({
      ...newEvent,
      [name]: value
    });
  };

  const getEventTypeColor = (type: string) => {
    const eventType = EVENT_TYPES.find(t => t.value === type);
    return eventType ? eventType.color : "bg-gray-600";
  };

  const getEventTypeLightColor = (type: string) => {
    const eventType = EVENT_TYPES.find(t => t.value === type);
    return eventType ? eventType.lightColor : "bg-gray-100";
  };

  const getEventTypeTextColor = (type: string) => {
    const eventType = EVENT_TYPES.find(t => t.value === type);
    return eventType ? eventType.textColor : "text-gray-800";
  };

  const getEventTypeIcon = (type: string) => {
    const eventType = EVENT_TYPES.find(t => t.value === type);
    return eventType ? eventType.icon : "📅";
  };

  const getEventTypeLabel = (type: string) => {
    const eventType = EVENT_TYPES.find(t => t.value === type);
    return eventType ? eventType.label : "Outro";
  };

  if (isLoading) {
    return (
      <MainLayout pageTitle="Calendário">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando calendário...</span>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout pageTitle="Calendário">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Erro ao carregar calendário</p>
            <p className="text-sm text-gray-600">Tente novamente mais tarde</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle="Calendário">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendário Escolar</h1>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4 sm:mt-0 w-full sm:w-auto">
            <Select 
              value={selectedClass} 
              onValueChange={setSelectedClass}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione uma turma" />
              </SelectTrigger>
              <SelectContent>
                {CLASSES.map((cls) => (
                  <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {canCreateEvent && (
              <Dialog open={isAddEventDialogOpen} onOpenChange={setIsAddEventDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Evento
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[550px]">
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Evento</DialogTitle>
                    <DialogDescription>
                      Preencha os dados abaixo para adicionar um novo evento ao calendário.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleAddEvent}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-4">
                        <div>
                          <Label htmlFor="title">Título do Evento</Label>
                          <Input 
                            id="title" 
                            name="title" 
                            value={newEvent.title} 
                            onChange={handleInputChange} 
                            placeholder="Ex: Prova de Matemática" 
                            required 
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="date">Data</Label>
                            <div className="relative">
                              <Input 
                                id="date" 
                                name="date" 
                                type="date"
                                value={format(newEvent.date, 'yyyy-MM-dd')}
                                onChange={(e) => {
                                  const selectedDate = e.target.value ? new Date(e.target.value) : new Date();
                                  setNewEvent({
                                    ...newEvent,
                                    date: selectedDate
                                  });
                                }}
                                required 
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="type">Tipo de Evento</Label>
                            <Select 
                              name="type" 
                              value={newEvent.type}
                              onValueChange={(value) => setNewEvent({...newEvent, type: value})}
                            >
                              <SelectTrigger id="type">
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                {EVENT_TYPES.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    <div className="flex items-center gap-2">
                                      <div className={`h-3 w-3 rounded-full ${type.color}`}></div>
                                      <span>{type.label}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="description">Descrição</Label>
                          <Textarea 
                            id="description" 
                            name="description" 
                            value={newEvent.description} 
                            onChange={handleInputChange} 
                            placeholder="Descreva o evento..." 
                            rows={3}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="class">Turma</Label>
                          <Select 
                            name="class" 
                            value={newEvent.class}
                            onValueChange={(value) => setNewEvent({...newEvent, class: value})}
                          >
                            <SelectTrigger id="class">
                              <SelectValue placeholder="Selecione a turma" />
                            </SelectTrigger>
                            <SelectContent>
                              {CLASSES.map((cls) => (
                                <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsAddEventDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createEventMutation.isPending}
                      >
                        {createEventMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Adicionando...
                          </>
                        ) : (
                          "Adicionar Evento"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
        
        {/* Legend */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Legenda de Eventos</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {EVENT_TYPES.map((type) => (
                <div key={type.value} className="flex items-center gap-2">
                  <div className={`h-4 w-4 rounded-full ${type.color} flex items-center justify-center text-white text-xs font-bold`}>
                    {type.icon}
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{type.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateSelect}
                  className="rounded-md border"
                  locale={ptBR}
                  modifiers={{
                    event: daysWithEvents
                  }}
                  modifiersStyles={{
                    event: { 
                      backgroundColor: "#EFF6FF", 
                      color: "#1E40AF",
                      fontWeight: "bold",
                      border: "2px solid #3B82F6",
                      borderRadius: "6px"
                    }
                  }}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Events for selected day */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Eventos de {format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </h3>
                  {eventsForSelectedDay.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{eventsForSelectedDay.length} evento(s)</span>
                    </div>
                  )}
                </div>
                
                {eventsForSelectedDay.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Nenhum evento para esta data.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {eventsForSelectedDay.map((event, index) => (
                      <div 
                        key={event.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                          getEventTypeLightColor(event.type)
                        } border-l-4 ${getEventTypeColor(event.type)}`}
                        onClick={() => handleViewEvent(event)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">{getEventTypeIcon(event.type)}</span>
                              <span className={`text-sm font-medium px-2 py-1 rounded-full ${getEventTypeTextColor(event.type)} ${getEventTypeLightColor(event.type)}`}>
                                {getEventTypeLabel(event.type)}
                              </span>
                            </div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                              {event.title}
                            </h4>
                            
                            {/* Event Details */}
                            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>Todo o dia</span>
                              </div>
                              
                              {event.location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>{event.location}</span>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>{event.class}</span>
                              </div>
                            </div>
                            
                            {event.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewEvent(event)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              {canCreateEvent && (
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteEvent(event.id)}
                                  className="text-red-600 dark:text-red-400"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Upcoming events */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Próximos Eventos</h3>
                
                {events.length === 0 ? (
                  <p className="text-gray-500 text-sm">Nenhum evento agendado.</p>
                ) : (
                  <div className="space-y-2">
                    {events
                      .filter(event => event.date > new Date())
                      .sort((a, b) => a.date.getTime() - b.date.getTime())
                      .slice(0, 5)
                      .map((event) => (
                        <div 
                          key={event.id}
                          className="p-2 rounded border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                          onClick={() => handleViewEvent(event)}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`h-2 w-2 rounded-full ${getEventTypeColor(event.type)}`}></div>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {getEventTypeLabel(event.type)}
                            </span>
                          </div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {event.title}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {format(new Date(event.date + 'T00:00:00'), "dd/MM/yyyy")}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* View Event Dialog */}
        <Dialog open={isViewEventDialogOpen} onOpenChange={setIsViewEventDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg -m-6 mb-4 p-6">
              <DialogTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xl font-bold">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <CalendarIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <div>{selectedEvent && format(new Date(selectedEvent.date + 'T00:00:00'), 'EEEE, dd/MM/yyyy', { locale: ptBR })}</div>
                    <div className="text-blue-100 text-sm font-normal">
                      {eventsForSelectedDay.length > 0 
                        ? `${eventsForSelectedDay.length} evento${eventsForSelectedDay.length > 1 ? 's' : ''} agendado${eventsForSelectedDay.length > 1 ? 's' : ''}`
                        : 'Nenhum evento agendado'
                      }
                    </div>
                  </div>
                </div>
                
                {/* Navigation for multiple events */}
                {eventsForSelectedDay.length > 1 && (
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
                      {currentEventIndex + 1} de {eventsForSelectedDay.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextEvent}
                      disabled={currentEventIndex === eventsForSelectedDay.length - 1}
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </DialogTitle>
            </DialogHeader>
            
            <div className="max-h-96 overflow-y-auto">
              {selectedEvent && (
                <div className="space-y-6">
                  {/* Evento atual */}
                  <div className="p-6 rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-lg">
                    <div className="flex items-start gap-4">
                      {/* Ícone do evento */}
                      <div className={`flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg ${getEventTypeColor(selectedEvent.type)}`}>
                        {getEventTypeIcon(selectedEvent.type)}
                      </div>
                      
                      {/* Conteúdo do evento */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-3">
                              {selectedEvent.title}
                            </h3>
                            
                            {/* Badge do tipo */}
                            <div className="mb-4">
                              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium text-white ${getEventTypeColor(selectedEvent.type)}`}>
                                {getEventTypeLabel(selectedEvent.type)}
                              </span>
                            </div>
                            
                            {/* Descrição */}
                            {selectedEvent.description && (
                              <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
                                <div className="flex items-start gap-2">
                                  <div className="text-gray-500 mt-0.5">📄</div>
                                  <p className="text-gray-700 leading-relaxed">
                                    {selectedEvent.description}
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
                                    {format(new Date(selectedEvent.date + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Clock className="h-4 w-4" />
                                  <span className="font-medium">
                                    {selectedEvent.startTime || 'Todo o dia'}
                                    {selectedEvent.endTime && ` - ${selectedEvent.endTime}`}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Turma e Disciplina */}
                              <div className="space-y-2">
                                {selectedEvent.className && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Users className="h-4 w-4" />
                                    <span className="font-medium">{selectedEvent.className}</span>
                                  </div>
                                )}
                                
                                {selectedEvent.subjectName && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <div className="h-4 w-4 flex items-center justify-center">📚</div>
                                    <span className="font-medium">{selectedEvent.subjectName}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Informações adicionais */}
                            <div className="flex flex-wrap gap-2 mt-4">
                              {selectedEvent.totalPoints && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-200">
                                  🎯 {selectedEvent.totalPoints} pontos
                                </span>
                              )}
                              
                              {selectedEvent.duration && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-50 text-green-700 border border-green-200">
                                  ⏱️ {selectedEvent.duration}min
                                </span>
                              )}
                              
                              {selectedEvent.bimonthly && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-50 text-purple-700 border border-purple-200">
                                  📊 {selectedEvent.bimonthly}º Bimestre
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Lista de todos os eventos para referência */}
                    {eventsForSelectedDay.length > 1 && (
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Todos os eventos do dia:</h4>
                        <div className="space-y-2">
                          {eventsForSelectedDay.map((event, index) => (
                            <div
                              key={event.id}
                              className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                                index === currentEventIndex
                                  ? "border-blue-400 bg-blue-50 shadow-md"
                                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                              }`}
                              onClick={() => setCurrentEventIndex(index)}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${getEventTypeColor(event.type)}`} />
                                <span className="text-sm font-medium text-gray-900">{event.title}</span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                                  {getEventTypeLabel(event.type)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="flex justify-between">
              <div className="flex gap-2">
                {canCreateEvent && (
                  <Button 
                    variant="destructive" 
                    onClick={() => selectedEvent && handleDeleteEvent(selectedEvent.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Evento
                  </Button>
                )}
              </div>
              <Button variant="outline" onClick={() => setIsViewEventDialogOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
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
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteEvent}
                >
                  Excluir
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}