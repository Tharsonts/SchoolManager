import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar, 
  Plus, 
  CheckCircle, 
  XCircle,
  Clock,
  Users,
  BookOpen,
  AlertCircle,
  Edit,
  Trash2
} from 'lucide-react';

const DirectorCalendar = () => {
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    type: 'general',
    target: 'all'
  });

  // Carregar dados do localStorage
  useEffect(() => {
    const savedPendingEvents = localStorage.getItem('directorPendingEvents');
    const savedCalendarEvents = localStorage.getItem('directorCalendarEvents');
    
    if (savedPendingEvents) {
      setPendingEvents(JSON.parse(savedPendingEvents));
    } else {
      // Eventos padrão criados pelo coordenador
      const defaultPendingEvents = [
        {
          id: 1,
          title: 'Reunião de Pais - 1º Bimestre',
          description: 'Reunião para entrega de boletins do primeiro bimestre',
          date: '2025-10-15',
          time: '19:00',
          type: 'meeting',
          target: 'parents',
          requestedBy: 'Coordenador Pedagógico',
          status: 'pending',
          createdAt: '2025-10-08'
        },
        {
          id: 2,
          title: 'Prova de Matemática - 3º Ano',
          description: 'Avaliação bimestral de matemática para o 3º ano',
          date: '2025-10-20',
          time: '08:00',
          type: 'exam',
          target: 'students',
          requestedBy: 'Professor João Silva',
          status: 'pending',
          createdAt: '2025-10-07'
        },
        {
          id: 3,
          title: 'Evento Cultural - Feira de Ciências',
          description: 'Apresentação de projetos científicos dos alunos',
          date: '2025-10-25',
          time: '14:00',
          type: 'event',
          target: 'all',
          requestedBy: 'Coordenador Acadêmico',
          status: 'pending',
          createdAt: '2025-10-06'
        }
      ];
      
      setPendingEvents(defaultPendingEvents);
      localStorage.setItem('directorPendingEvents', JSON.stringify(defaultPendingEvents));
    }
    
    if (savedCalendarEvents) {
      setCalendarEvents(JSON.parse(savedCalendarEvents));
    } else {
      // Eventos já aprovados
      const defaultCalendarEvents = [
        {
          id: 1,
          title: 'Início do 2º Bimestre',
          date: '2025-04-16',
          type: 'period',
          status: 'active'
        },
        {
          id: 2,
          title: 'Reunião Pedagógica',
          date: '2025-10-12',
          type: 'meeting',
          status: 'active'
        }
      ];
      
      setCalendarEvents(defaultCalendarEvents);
      localStorage.setItem('directorCalendarEvents', JSON.stringify(defaultCalendarEvents));
    }
  }, []);

  const handleApproveEvent = (eventId: number) => {
    const event = pendingEvents.find(e => e.id === eventId);
    if (event) {
      const approvedEvent = {
        ...event,
        approvedAt: new Date().toISOString(),
        approvedBy: 'Diretor Executivo',
        status: 'active'
      };
      
      const updatedCalendarEvents = [...calendarEvents, approvedEvent];
      const updatedPendingEvents = pendingEvents.filter(e => e.id !== eventId);
      
      setCalendarEvents(updatedCalendarEvents);
      setPendingEvents(updatedPendingEvents);
      
      localStorage.setItem('directorCalendarEvents', JSON.stringify(updatedCalendarEvents));
      localStorage.setItem('directorPendingEvents', JSON.stringify(updatedPendingEvents));
      
      alert(`${event.title} aprovado e adicionado ao calendário!`);
    }
  };

  const handleRejectEvent = (eventId: number) => {
    const event = pendingEvents.find(e => e.id === eventId);
    if (event && confirm(`Tem certeza que deseja rejeitar "${event.title}"?`)) {
      const updatedPendingEvents = pendingEvents.filter(e => e.id !== eventId);
      
      setPendingEvents(updatedPendingEvents);
      localStorage.setItem('directorPendingEvents', JSON.stringify(updatedPendingEvents));
      
      alert(`${event.title} rejeitado.`);
    }
  };

  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.date) {
      alert('Preencha os campos obrigatórios');
      return;
    }
    
    const eventData = {
      id: Date.now(),
      title: newEvent.title,
      description: newEvent.description,
      date: newEvent.date,
      time: newEvent.time,
      type: newEvent.type,
      target: newEvent.target,
      requestedBy: 'Diretor Executivo',
      status: 'active',
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      approvedBy: 'Diretor Executivo'
    };
    
    const updatedCalendarEvents = [...calendarEvents, eventData];
    setCalendarEvents(updatedCalendarEvents);
    localStorage.setItem('directorCalendarEvents', JSON.stringify(updatedCalendarEvents));
    
    setIsCreatingEvent(false);
    setNewEvent({ title: '', description: '', date: '', time: '', type: 'general', target: 'all' });
    alert('Evento criado e adicionado ao calendário!');
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'exam':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'holiday':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'period':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return <Users className="h-4 w-4" />;
      case 'exam':
        return <BookOpen className="h-4 w-4" />;
      case 'holiday':
        return <Calendar className="h-4 w-4" />;
      case 'period':
        return <Calendar className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };


  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calendário Escolar</h1>
            <p className="text-gray-600 mt-1">Gerencie eventos e aprovações do calendário</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              className="bg-gray-800 hover:bg-gray-900"
              onClick={() => setIsCreatingEvent(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Evento
            </Button>
            <Badge variant="outline" className="px-3 py-1">
              <Calendar className="h-4 w-4 mr-2" />
              {pendingEvents.length} pendências
            </Badge>
          </div>
        </div>

        {/* Pending Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Eventos Pendentes de Aprovação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingEvents.filter(event => event.status === 'pending').map((event) => (
                <div key={event.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    {getEventTypeIcon(event.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{event.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Data: {new Date(event.date).toLocaleDateString('pt-BR')}</span>
                          <span>Hora: {event.time}</span>
                          <span>Solicitado por: {event.requestedBy}</span>
                        </div>
                      </div>
                      <Badge className={getEventTypeColor(event.type)}>
                        {event.type === 'meeting' ? 'Reunião' :
                         event.type === 'exam' ? 'Prova' :
                         event.type === 'holiday' ? 'Feriado' : 'Evento'}
                      </Badge>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApproveEvent(event.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aprovar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => handleRejectEvent(event.id)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rejeitar
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Calendar Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Eventos do Calendário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {calendarEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                  <div className="flex-shrink-0">
                    {getEventTypeIcon(event.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{event.title}</h4>
                        <p className="text-sm text-gray-600">
                          {new Date(event.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Badge className={getStatusColor(event.status)}>
                        {event.status === 'active' ? 'Ativo' : 
                         event.status === 'pending' ? 'Pendente' : 'Concluído'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Create Event Modal */}
        {isCreatingEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Criar Novo Evento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Título do Evento *</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Reunião de Pais"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descrição do evento"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Data *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Hora</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreatingEvent(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCreateEvent}
                    className="flex-1 bg-gray-800 hover:bg-gray-900"
                  >
                    Criar Evento
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
  );
};

export default DirectorCalendar;