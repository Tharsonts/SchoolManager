import { useState } from "react";
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
import { Plus, Calendar as CalendarIcon, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Define event types with distinctive colors
const EVENT_TYPES = [
  { value: "exam", label: "Prova", color: "bg-red-500" },
  { value: "homework", label: "Tarefa", color: "bg-blue-500" },
  { value: "meeting", label: "Reunião", color: "bg-green-500" },
  { value: "holiday", label: "Feriado", color: "bg-purple-500" },
  { value: "activity", label: "Atividade", color: "bg-yellow-500" },
  { value: "other", label: "Outro", color: "bg-gray-500" }
];

// Mock data - in a real application, this would be fetched from the API
const INITIAL_EVENTS = [
  { 
    id: 1, 
    title: "Prova de Matemática", 
    date: new Date(2023, 6, 18), // July 18, 2023
    description: "Conteúdo: Equações do 2º grau, Trigonometria", 
    type: "exam",
    class: "9º Ano - A"
  },
  { 
    id: 2, 
    title: "Reunião de Pais", 
    date: new Date(2023, 6, 15), // July 15, 2023
    description: "Discussão sobre o desempenho dos alunos no 2º bimestre", 
    type: "meeting",
    class: "Todas"
  },
  { 
    id: 3, 
    title: "Feira de Ciências", 
    date: new Date(2023, 6, 25), // July 25, 2023
    description: "Apresentação dos projetos de ciências de todas as turmas", 
    type: "activity",
    class: "Todas"
  },
  { 
    id: 4, 
    title: "Entrega de Trabalho - História", 
    date: new Date(2023, 6, 20), // July 20, 2023
    description: "Tema: Revolução Industrial", 
    type: "homework",
    class: "9º Ano - A"
  },
  { 
    id: 5, 
    title: "Feriado Municipal", 
    date: new Date(2023, 7, 5), // August 5, 2023
    description: "Aniversário da cidade", 
    type: "holiday",
    class: "Todas"
  }
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
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [date, setDate] = useState<Date>(new Date());
  const [selectedClass, setSelectedClass] = useState<string>("Todas");
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false);
  const [isViewEventDialogOpen, setIsViewEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
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

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, this would call an API
    const eventWithId = {
      id: events.length + 1,
      ...newEvent
    };
    
    setEvents([...events, eventWithId]);
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
  };

  const handleDeleteEvent = (id: number) => {
    const eventToDelete = events.find(event => event.id === id);
    setEvents(events.filter(event => event.id !== id));
    
    toast({
      title: "Evento removido",
      description: `O evento "${eventToDelete?.title}" foi removido com sucesso.`,
      variant: "destructive"
    });
    
    setIsViewEventDialogOpen(false);
  };

  const handleViewEvent = (event: any) => {
    setSelectedEvent(event);
    setIsViewEventDialogOpen(true);
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
    return eventType ? eventType.color : "bg-gray-500";
  };

  const getEventTypeLabel = (type: string) => {
    const eventType = EVENT_TYPES.find(t => t.value === type);
    return eventType ? eventType.label : "Outro";
  };

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
                        
                        <div>
                          <Label htmlFor="description">Descrição</Label>
                          <Textarea 
                            id="description" 
                            name="description" 
                            value={newEvent.description} 
                            onChange={handleInputChange} 
                            placeholder="Descrição do evento" 
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddEventDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">Salvar</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-center">
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
                        fontWeight: 'bold',
                        textDecoration: 'underline',
                        color: 'var(--primary)'
                      }
                    }}
                  />
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Legenda</h3>
                  <div className="space-y-2">
                    {EVENT_TYPES.map((type) => (
                      <div key={type.value} className="flex items-center gap-2">
                        <div className={`h-4 w-4 rounded-full ${type.color}`}></div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{type.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-primary-500" />
                    <span>{format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                  </h2>
                  
                  {canCreateEvent && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setNewEvent({
                          ...newEvent,
                          date: date
                        });
                        setIsAddEventDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  )}
                </div>
                
                {eventsForSelectedDay.length > 0 ? (
                  <div className="space-y-4">
                    {eventsForSelectedDay.map((event) => (
                      <div 
                        key={event.id} 
                        className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors cursor-pointer"
                        onClick={() => handleViewEvent(event)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`h-3 w-3 rounded-full ${getEventTypeColor(event.type)}`}></div>
                            <h3 className="font-medium text-gray-900 dark:text-white">{event.title}</h3>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleViewEvent(event);
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Ver detalhes
                              </DropdownMenuItem>
                              {canCreateEvent && (
                                <DropdownMenuItem 
                                  className="text-red-600 focus:text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteEvent(event.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir evento
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Tipo:</span>{' '}
                            {getEventTypeLabel(event.type)}
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Turma:</span>{' '}
                            {event.class}
                          </div>
                        </div>
                        
                        {event.description && (
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{event.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                    <CalendarIcon className="h-12 w-12 mb-4 opacity-20" />
                    <p>Não há eventos agendados para este dia.</p>
                    {canCreateEvent && (
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => {
                          setNewEvent({
                            ...newEvent,
                            date: date
                          });
                          setIsAddEventDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Evento
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Upcoming Events */}
        <div className="mt-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Próximos Eventos</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredEvents
              .filter(event => event.date >= new Date())
              .sort((a, b) => a.date.getTime() - b.date.getTime())
              .slice(0, 3)
              .map((event) => (
                <Card key={event.id} className="overflow-hidden">
                  <div className={`h-2 ${getEventTypeColor(event.type)}`}></div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{event.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {format(event.date, "d 'de' MMMM", { locale: ptBR })}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.type)} bg-opacity-20 text-${getEventTypeColor(event.type).replace('bg-', '')}`}>
                        {getEventTypeLabel(event.type)}
                      </div>
                    </div>
                    
                    <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{event.description}</p>
                    
                    <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium">Turma:</span> {event.class}
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-4 text-primary-500 hover:text-primary-600 p-0 h-auto"
                      onClick={() => handleViewEvent(event)}
                    >
                      Ver detalhes
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      </div>
      
      {/* View Event Dialog */}
      <Dialog open={isViewEventDialogOpen} onOpenChange={setIsViewEventDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${getEventTypeColor(selectedEvent.type)}`}></div>
                  <DialogTitle>{selectedEvent.title}</DialogTitle>
                </div>
                <DialogDescription>
                  {format(selectedEvent.date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Tipo:</span>{' '}
                    {getEventTypeLabel(selectedEvent.type)}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Turma:</span>{' '}
                    {selectedEvent.class}
                  </div>
                </div>
                
                <div className="mb-4">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Descrição:</span>
                  <p className="mt-1 text-gray-600 dark:text-gray-400">{selectedEvent.description || "Sem descrição."}</p>
                </div>
              </div>
              
              <DialogFooter>
                {canCreateEvent && (
                  <Button 
                    variant="destructive" 
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                )}
                <Button onClick={() => setIsViewEventDialogOpen(false)}>Fechar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
