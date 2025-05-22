import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Bell, Search, Plus, Trash2, Check, Calendar, Flag, Info, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Mock data - in a real application, this would be fetched from the API
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

const INITIAL_NOTIFICATIONS = [
  { 
    id: 1, 
    title: "Prova de Matemática", 
    message: "Lembrete: Prova de Matemática sobre Equações do 2º Grau amanhã. Não esqueçam de trazer calculadora.", 
    date: new Date(2023, 6, 17), // July 17, 2023 
    sender: "Prof. Marcos Silva",
    target: "9º Ano - A",
    type: "reminder",
    read: false
  },
  { 
    id: 2, 
    title: "Reunião de Pais", 
    message: "Informamos que a reunião de pais ocorrerá no dia 15/07 às 19h no auditório da escola. É importante a presença de todos os responsáveis.", 
    date: new Date(2023, 6, 10), // July 10, 2023
    sender: "Coordenação",
    target: "Todas",
    type: "event",
    read: true
  },
  { 
    id: 3, 
    title: "Trabalho de História", 
    message: "Lembrem-se que o prazo para entrega do trabalho sobre Revolução Industrial é 20/07. O trabalho deve ser entregue impresso e seguir as normas ABNT.", 
    date: new Date(2023, 6, 12), // July 12, 2023
    sender: "Prof. Roberto Lima",
    target: "9º Ano - A",
    type: "assignment",
    read: false
  },
  { 
    id: 4, 
    title: "Alteração no horário", 
    message: "Informamos que na próxima semana as aulas de Educação Física ocorrerão no período da manhã devido à manutenção da quadra à tarde.", 
    date: new Date(2023, 6, 14), // July 14, 2023
    sender: "Coordenação",
    target: "7º Ano - B",
    type: "info",
    read: true
  },
  { 
    id: 5, 
    title: "Feira de Ciências", 
    message: "A Feira de Ciências acontecerá no dia 25/07. Todos os grupos devem montar seus estandes a partir das 7h. A apresentação para os pais começa às 9h.", 
    date: new Date(2023, 6, 18), // July 18, 2023
    sender: "Prof. Carla Mendes",
    target: "Todas",
    type: "event",
    read: false
  },
  { 
    id: 6, 
    title: "Boletins disponíveis", 
    message: "Os boletins do 2º bimestre já estão disponíveis para consulta na plataforma. Qualquer dúvida, entrar em contato com a secretaria.", 
    date: new Date(2023, 6, 15), // July 15, 2023
    sender: "Secretaria",
    target: "Todas",
    type: "info",
    read: true
  },
  { 
    id: 7, 
    title: "Aula de reforço", 
    message: "Comunicamos que as aulas de reforço de Matemática ocorrerão às quartas-feiras, das 14h às 15h30, na sala 5. Os alunos indicados devem comparecer.", 
    date: new Date(2023, 6, 16), // July 16, 2023
    sender: "Prof. Marcos Silva",
    target: "8º Ano - B",
    type: "info",
    read: false
  }
];

const NOTIFICATION_TYPES = [
  { value: "all", label: "Todos os tipos" },
  { value: "info", label: "Informativo", icon: <Info className="h-4 w-4" /> },
  { value: "event", label: "Evento", icon: <Calendar className="h-4 w-4" /> },
  { value: "reminder", label: "Lembrete", icon: <Bell className="h-4 w-4" /> },
  { value: "assignment", label: "Tarefa", icon: <Flag className="h-4 w-4" /> },
  { value: "alert", label: "Alerta", icon: <AlertCircle className="h-4 w-4" /> }
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("Todas");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    target: "Todas",
    type: "info"
  });
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Get user type from the authenticated user
  const userType = user?.role || 'admin';
  const canCreateNotification = userType === 'admin' || userType === 'coordinator' || userType === 'teacher';
  const isStudent = userType === 'student';

  // Filter notifications based on search term, selected class, type, and read status
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = selectedClass === "Todas" || notification.target === "Todas" || notification.target === selectedClass;
    
    const matchesType = selectedType === "all" || notification.type === selectedType;
    
    const matchesTab = activeTab === "all" || 
                      (activeTab === "unread" && !notification.read) || 
                      (activeTab === "read" && notification.read);
    
    return matchesSearch && matchesClass && matchesType && matchesTab;
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleAddNotification = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, this would call an API
    const newNotificationWithId = {
      id: notifications.length + 1,
      ...newNotification,
      date: new Date(),
      sender: user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Sistema',
      read: false
    };
    
    setNotifications([newNotificationWithId, ...notifications]);
    setIsAddDialogOpen(false);
    setNewNotification({
      title: "",
      message: "",
      target: "Todas",
      type: "info"
    });
    
    toast({
      title: "Recado enviado",
      description: `O recado "${newNotification.title}" foi enviado com sucesso.`,
    });
  };

  const handleDeleteNotification = (id: number) => {
    const notificationToDelete = notifications.find(notification => notification.id === id);
    setNotifications(notifications.filter(notification => notification.id !== id));
    
    toast({
      title: "Recado removido",
      description: `O recado "${notificationToDelete?.title}" foi removido com sucesso.`,
      variant: "destructive"
    });
  };

  const handleMarkAsRead = (id: number) => {
    const updatedNotifications = notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    );
    
    setNotifications(updatedNotifications);
    
    toast({
      title: "Recado marcado como lido",
      description: "O recado foi marcado como lido com sucesso.",
    });
  };

  const handleMarkAllAsRead = () => {
    const updatedNotifications = notifications.map(notification => 
      !notification.read ? { ...notification, read: true } : notification
    );
    
    setNotifications(updatedNotifications);
    
    toast({
      title: "Todos os recados marcados como lidos",
      description: "Todos os recados foram marcados como lidos com sucesso.",
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewNotification({
      ...newNotification,
      [name]: value
    });
  };

  const getNotificationTypeIcon = (type: string) => {
    const notificationType = NOTIFICATION_TYPES.find(t => t.value === type);
    return notificationType ? notificationType.icon : <Info className="h-4 w-4" />;
  };

  const getNotificationTypeLabel = (type: string) => {
    const notificationType = NOTIFICATION_TYPES.find(t => t.value === type);
    return notificationType ? notificationType.label : "Informativo";
  };

  return (
    <MainLayout pageTitle="Recados">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recados e Notificações</h1>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4 sm:mt-0 w-full sm:w-auto">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleMarkAllAsRead}
            >
              <Check className="h-4 w-4" />
              Marcar todos como lidos
            </Button>
            
            {canCreateNotification && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Recado
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[550px]">
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Recado</DialogTitle>
                    <DialogDescription>
                      Preencha os dados abaixo para enviar um novo recado.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleAddNotification}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-4">
                        <div>
                          <Label htmlFor="title">Título</Label>
                          <Input 
                            id="title" 
                            name="title" 
                            value={newNotification.title} 
                            onChange={handleInputChange} 
                            placeholder="Ex: Reunião de Pais" 
                            required 
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="target">Para</Label>
                            <Select 
                              name="target" 
                              value={newNotification.target}
                              onValueChange={(value) => setNewNotification({...newNotification, target: value})}
                            >
                              <SelectTrigger id="target">
                                <SelectValue placeholder="Selecione o destinatário" />
                              </SelectTrigger>
                              <SelectContent>
                                {CLASSES.map((cls) => (
                                  <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="type">Tipo</Label>
                            <Select 
                              name="type" 
                              value={newNotification.type}
                              onValueChange={(value) => setNewNotification({...newNotification, type: value})}
                            >
                              <SelectTrigger id="type">
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                {NOTIFICATION_TYPES.slice(1).map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    <div className="flex items-center gap-2">
                                      {type.icon}
                                      <span>{type.label}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="message">Mensagem</Label>
                          <Textarea 
                            id="message" 
                            name="message" 
                            value={newNotification.message} 
                            onChange={handleInputChange} 
                            placeholder="Digite a mensagem do recado..." 
                            rows={5}
                            required 
                          />
                        </div>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">Enviar</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardContent className="p-4 space-y-6">
                <div className="relative w-full">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <Input
                    placeholder="Buscar recados..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </div>
                
                <div>
                  <Label htmlFor="class-select" className="mb-2 block">Turma</Label>
                  <Select 
                    value={selectedClass} 
                    onValueChange={setSelectedClass}
                  >
                    <SelectTrigger id="class-select">
                      <SelectValue placeholder="Selecione uma turma" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASSES.map((cls) => (
                        <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="type-select" className="mb-2 block">Tipo</Label>
                  <Select 
                    value={selectedType} 
                    onValueChange={setSelectedType}
                  >
                    <SelectTrigger id="type-select">
                      <SelectValue placeholder="Selecione um tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {NOTIFICATION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            {type.icon && type.icon}
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Estatísticas</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400">Total de recados</span>
                      <span className="font-medium">{notifications.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400">Não lidos</span>
                      <span className="font-medium">{notifications.filter(n => !n.read).length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400">Lidos</span>
                      <span className="font-medium">{notifications.filter(n => n.read).length}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  <TabsList className="grid grid-cols-3">
                    <TabsTrigger value="all">
                      Todos
                    </TabsTrigger>
                    <TabsTrigger value="unread">
                      Não lidos <span className="ml-2 bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 px-2 py-0.5 rounded-full text-xs">
                        {notifications.filter(n => !n.read).length}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value="read">
                      Lidos
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all" className="space-y-4">
                    {renderNotifications(filteredNotifications)}
                  </TabsContent>
                  
                  <TabsContent value="unread" className="space-y-4">
                    {renderNotifications(filteredNotifications)}
                  </TabsContent>
                  
                  <TabsContent value="read" className="space-y-4">
                    {renderNotifications(filteredNotifications)}
                  </TabsContent>
                </Tabs>
                
                {filteredNotifications.length > 0 && (
                  <div className="mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious href="#" />
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationLink href="#" isActive>1</PaginationLink>
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationNext href="#" />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );

  function renderNotifications(notificationsList: typeof INITIAL_NOTIFICATIONS) {
    if (notificationsList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
          <Bell className="h-12 w-12 mb-4 opacity-20" />
          <p>Nenhum recado encontrado.</p>
        </div>
      );
    }

    return notificationsList.map((notification) => (
      <div 
        key={notification.id} 
        className={`p-4 border rounded-lg transition-colors ${
          notification.read ? 'bg-white dark:bg-dark-600' : 'bg-blue-50 dark:bg-blue-900/20'
        }`}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              {getNotificationTypeIcon(notification.type)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900 dark:text-white">{notification.title}</h3>
                {!notification.read && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Novo
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{notification.message}</p>
              
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <span className="font-medium">De:</span> {notification.sender}
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">Para:</span> {notification.target}
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">Tipo:</span> {getNotificationTypeLabel(notification.type)}
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">Data:</span> {format(notification.date, 'dd/MM/yyyy')}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            {!notification.read && (
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => handleMarkAsRead(notification.id)}
                title="Marcar como lido"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            
            {canCreateNotification && (
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => handleDeleteNotification(notification.id)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Excluir recado"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    ));
  }
}
