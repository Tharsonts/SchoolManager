import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  Send, 
  Phone, 
  Video, 
  Info, 
  Paperclip, 
  Smile, 
  Check, 
  CheckCheck,
  MessageSquare,
  Users,
  UserCheck,
  Clock,
  Filter,
  Plus
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: 'teacher' | 'student' | 'parent' | 'coordinator' | 'admin';
  timestamp: string;
  isRead: boolean;
  isEdited?: boolean;
  editedAt?: string;
  attachments?: Array<{
    type: 'file' | 'image' | 'document';
    name: string;
    url: string;
    size?: string;
  }>;
}

interface Chat {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  timestamp?: string;
  unreadCount: number;
  isOnline: boolean;
  participants: string[];
  type: 'direct' | 'group' | 'class';
  role?: 'student' | 'parent' | 'teacher' | 'coordinator';
  className?: string;
  subject?: string;
}

const TeacherChatPage = () => {
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState<string>('');
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data para conversas do professor
  const [chats] = useState<Chat[]>([
    {
      id: 'chat1',
      name: 'Turma 8º A - Matemática',
      avatar: undefined,
      lastMessage: 'Professor, quando será a próxima prova?',
      timestamp: '14:30',
      unreadCount: 3,
      isOnline: true,
      participants: ['teacher1', 'student1', 'student2', 'student3'],
      type: 'class',
      className: '8º A',
      subject: 'Matemática'
    },
    {
      id: 'chat2',
      name: 'Maria Santos (Mãe do Pedro)',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&crop=face',
      lastMessage: 'Gostaria de conversar sobre o desempenho do Pedro',
      timestamp: '13:45',
      unreadCount: 1,
      isOnline: false,
      participants: ['teacher1', 'parent1'],
      type: 'direct',
      role: 'parent'
    },
    {
      id: 'chat3',
      name: 'Ana Silva (Aluna)',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face',
      lastMessage: 'Obrigada pela explicação!',
      timestamp: '12:20',
      unreadCount: 0,
      isOnline: true,
      participants: ['teacher1', 'student4'],
      type: 'direct',
      role: 'student'
    },
    {
      id: 'chat4',
      name: 'Professores - Matemática',
      avatar: undefined,
      lastMessage: 'Vamos alinhar o cronograma da próxima semana',
      timestamp: '11:15',
      unreadCount: 2,
      isOnline: true,
      participants: ['teacher1', 'teacher2', 'teacher3'],
      type: 'group',
      role: 'teacher'
    },
    {
      id: 'chat5',
      name: 'Carlos Oliveira (Pai da Júlia)',
      avatar: undefined,
      lastMessage: 'Quando posso agendar uma reunião?',
      timestamp: '10:30',
      unreadCount: 1,
      isOnline: false,
      participants: ['teacher1', 'parent2'],
      type: 'direct',
      role: 'parent'
    }
  ]);

  // Mock data para mensagens
  useEffect(() => {
    if (selectedChat) {
      const mockMessages: Message[] = [
        {
          id: '1',
          content: 'Bom dia, professor! Tenho uma dúvida sobre o exercício 15 da página 42.',
          senderId: 'student1',
          senderName: 'Pedro Santos',
          senderRole: 'student',
          timestamp: '09:30',
          isRead: true
        },
        {
          id: '2',
          content: 'Bom dia, Pedro! Claro, qual é sua dúvida específica sobre esse exercício?',
          senderId: user?.id || 'teacher1',
          senderName: user?.firstName || 'Professor',
          senderRole: 'teacher',
          timestamp: '09:35',
          isRead: true
        },
        {
          id: '3',
          content: 'Não estou conseguindo entender como aplicar a fórmula de Bhaskara neste caso.',
          senderId: 'student1',
          senderName: 'Pedro Santos',
          senderRole: 'student',
          timestamp: '09:37',
          isRead: true
        },
        {
          id: '4',
          content: 'Entendo. Vou explicar passo a passo: primeiro você precisa identificar os coeficientes a, b e c na equação.',
          senderId: user?.id || 'teacher1',
          senderName: user?.firstName || 'Professor',
          senderRole: 'teacher',
          timestamp: '09:40',
          isRead: false
        }
      ];
      setMessages(mockMessages);
    }
  }, [selectedChat, user]);

  // Filtrar conversas
  const filteredChats = React.useMemo(() => {
    return chats.filter(chat => {
      const matchesSearch = chat.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || 
                           (filterType === 'students' && chat.role === 'student') ||
                           (filterType === 'parents' && chat.role === 'parent') ||
                           (filterType === 'teachers' && chat.role === 'teacher') ||
                           (filterType === 'classes' && chat.type === 'class');
      return matchesSearch && matchesFilter;
    });
  }, [chats, searchTerm, filterType]);

  const currentChat = chats.find(chat => chat.id === selectedChat);

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !selectedChat) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage.trim(),
      senderId: user?.id || "teacher1",
      senderName: user?.firstName || "Professor",
      senderRole: "teacher",
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      isRead: false
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");

    // Scroll para a última mensagem
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [newMessage, selectedChat, user]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'teacher': return 'bg-blue-100 text-blue-800';
      case 'student': return 'bg-green-100 text-green-800';
      case 'parent': return 'bg-purple-100 text-purple-800';
      case 'coordinator': return 'bg-orange-100 text-orange-800';
      case 'admin': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role?: string, type?: string) => {
    if (type === 'class') return <Users className="h-4 w-4" />;
    if (type === 'group') return <MessageSquare className="h-4 w-4" />;
    
    switch (role) {
      case 'student': return <UserCheck className="h-4 w-4" />;
      case 'parent': return <Users className="h-4 w-4" />;
      case 'teacher': return <MessageSquare className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getFilterLabel = (type: string) => {
    switch (type) {
      case 'all': return 'Todas';
      case 'students': return 'Alunos';
      case 'parents': return 'Pais/Responsáveis';
      case 'teachers': return 'Professores';
      case 'classes': return 'Turmas';
      default: return 'Todas';
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-gray-50">
      {/* Lista de Conversas */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header da Lista */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Mensagens</h2>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Nova
            </Button>
          </div>
          
          {/* Busca */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtros */}
          <div className="flex gap-1 overflow-x-auto">
            {['all', 'students', 'parents', 'teachers', 'classes'].map((type) => (
              <Button
                key={type}
                variant={filterType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType(type)}
                className="whitespace-nowrap text-xs"
              >
                {getFilterLabel(type)}
              </Button>
            ))}
          </div>
        </div>

        {/* Lista de Conversas */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat.id)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedChat === chat.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={chat.avatar} />
                    <AvatarFallback className="bg-gray-100 text-gray-600">
                      {chat.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  {chat.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {chat.name}
                      </p>
                      {getRoleIcon(chat.role, chat.type)}
                    </div>
                    <div className="flex items-center gap-2">
                      {chat.timestamp && (
                        <span className="text-xs text-gray-500">{chat.timestamp}</span>
                      )}
                      {chat.unreadCount > 0 && (
                        <Badge className="bg-blue-600 text-white text-xs min-w-[20px] h-5 flex items-center justify-center">
                          {chat.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {chat.className && chat.subject && (
                    <p className="text-xs text-gray-500 mb-1">
                      {chat.className} • {chat.subject}
                    </p>
                  )}
                  
                  {chat.lastMessage && (
                    <p className="text-sm text-gray-600 truncate">
                      {chat.lastMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Área de Conversa */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Header da Conversa */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={currentChat?.avatar} />
                    <AvatarFallback className="bg-gray-100 text-gray-600">
                      {currentChat?.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-gray-900">{currentChat?.name}</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">
                        {currentChat?.isOnline ? 'Online' : 'Offline'}
                      </p>
                      {currentChat?.className && currentChat?.subject && (
                        <Badge variant="outline" className="text-xs">
                          {currentChat.className} • {currentChat.subject}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.senderId === user?.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}>
                    {message.senderId !== user?.id && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">{message.senderName}</span>
                        <Badge className={`text-xs ${getRoleColor(message.senderRole)}`}>
                          {message.senderRole}
                        </Badge>
                      </div>
                    )}
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-xs opacity-70">{message.timestamp}</span>
                      {message.senderId === user?.id && (
                        <div className="flex items-center">
                          {message.isRead ? (
                            <CheckCheck className="h-3 w-3" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de Mensagem */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Selecione uma conversa
              </h3>
              <p className="text-gray-500">
                Escolha uma conversa da lista para começar a trocar mensagens
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherChatPage;