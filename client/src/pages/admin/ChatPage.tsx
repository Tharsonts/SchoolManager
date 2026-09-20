import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare,
  Send,
  Users,
  Search,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  UserPlus
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdminUsers } from '@/hooks/useAdminApi';

interface Message {
  id: string;
  sender: string;
  senderId: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  avatar?: string;
  chatId?: string;
}

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  avatar?: string;
  isOnline: boolean;
  userId: string;
  role: string;
}

const ChatPage = () => {
  const { data: usersData, isLoading, error } = useAdminUsers();
  const [selectedChat, setSelectedChat] = useState<string>('');
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Carregar dados salvos do localStorage
  useEffect(() => {
    const savedChats = localStorage.getItem('admin-chats');
    const savedMessages = localStorage.getItem('admin-messages');
    
    if (savedChats) {
      setChats(JSON.parse(savedChats));
    }
    
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  // Salvar chats no localStorage sempre que mudarem
  useEffect(() => {
    localStorage.setItem('admin-chats', JSON.stringify(chats));
  }, [chats]);

  // Salvar mensagens no localStorage sempre que mudarem
  useEffect(() => {
    localStorage.setItem('admin-messages', JSON.stringify(messages));
  }, [messages]);

  // Não carregar usuários automaticamente - apenas quando pesquisar
  const availableUsers = usersData?.data?.filter(user => user.role !== 'admin') || [];

  // Função para buscar usuários ou conversas
  const handleSearch = (query: string) => {
    if (query.length >= 2) {
      // Primeiro, buscar em conversas existentes
      const filteredChats = chats.filter(chat =>
        chat.name.toLowerCase().includes(query.toLowerCase()) ||
        chat.role.toLowerCase().includes(query.toLowerCase())
      );
      
      // Se não encontrar conversas, buscar usuários
      if (filteredChats.length === 0) {
        const filteredUsers = availableUsers.filter(user => 
          !chats.some(chat => chat.userId === user.id) &&
          `${user.firstName} ${user.lastName}`.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(filteredUsers);
        setShowUserSearch(true);
      } else {
        setSearchResults([]);
        setShowUserSearch(false);
      }
    } else {
      setSearchResults([]);
      setShowUserSearch(false);
    }
  };

  // Filtrar chats baseado na busca
  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentChat = chats.find(chat => chat.id === selectedChat);
  const currentMessages = messages.filter(msg => msg.chatId === selectedChat);

  const handleSendMessage = () => {
    if (!message.trim() || !selectedChat) return;
    
    // Simular envio de mensagem
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'Admin',
      senderId: 'admin_001',
      content: message,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
      chatId: selectedChat
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Atualizar última mensagem do chat
    setChats(prev => prev.map(chat => 
      chat.id === selectedChat 
        ? { ...chat, lastMessage: message, timestamp: 'Agora' }
        : chat
    ));
    
    setMessage('');
    toast.success('Mensagem enviada!');
  };

  const handleStartChat = (user: any) => {
    const newChat: Chat = {
      id: `chat_${user.id}`,
      name: `${user.firstName} ${user.lastName}`,
      lastMessage: 'Conversa iniciada',
      timestamp: 'Agora',
      unread: 0,
      isOnline: Math.random() > 0.5,
      userId: user.id,
      role: user.role
    };
    
    setChats(prev => [...prev, newChat]);
    setSelectedChat(newChat.id);
    setShowUserSearch(false);
    setSearchTerm('');
    setSearchResults([]);
    toast.success(`Conversa iniciada com ${newChat.name}`);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Coordenador': return 'text-orange-600';
      case 'Professor': return 'text-green-600';
      case 'Aluno': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chat</h1>
          <p className="text-gray-600 mt-1">Comunicação com professores, alunos e coordenadores</p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="border border-gray-200">
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Carregando usuários...</h3>
            <p className="text-gray-600">Aguarde enquanto buscamos os usuários do sistema.</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border border-red-200">
          <CardContent className="text-center py-12">
            <div className="text-red-500 mb-4">
              <MessageSquare className="h-12 w-12 mx-auto mb-2" />
            </div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Erro ao carregar usuários</h3>
            <p className="text-red-600 mb-4">{error?.message || 'Erro desconhecido'}</p>
            <Button 
              className="bg-red-600 hover:bg-red-700"
              onClick={() => window.location.reload()}
            >
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Chat Interface */}
      {!isLoading && !error && (
        <div className="flex h-[calc(100vh-200px)] bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Chat List - Lado Esquerdo */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                <h2 className="text-lg font-semibold">Chat</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUserSearch(!showUserSearch)}
                className="text-purple-600 hover:text-purple-700"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Barra de busca única */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Buscar conversas ou usuários..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleSearch(e.target.value);
                }}
              />
            </div>
          </div>
          {/* Lista de usuários disponíveis */}
          {showUserSearch && searchResults.length > 0 && (
            <div className="border-b border-gray-200 p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Usuários Encontrados</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => handleStartChat(user)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getUserInitials(`${user.firstName} ${user.lastName}`)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className={`text-xs ${getRoleColor(user.role)}`}>
                        {user.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Lista de conversas */}
          <div className="flex-1 overflow-y-auto">
            {filteredChats.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm">Nenhuma conversa iniciada</p>
                <p className="text-xs mt-1">Busque por usuários para iniciar uma conversa</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 border-l-4 transition-colors ${
                    selectedChat === chat.id 
                      ? 'bg-purple-50 border-purple-500' 
                      : 'border-transparent'
                  }`}
                  onClick={() => setSelectedChat(chat.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={chat.avatar} />
                        <AvatarFallback>
                          {getUserInitials(chat.name)}
                        </AvatarFallback>
                      </Avatar>
                      {chat.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900 truncate">{chat.name}</p>
                        <span className="text-xs text-gray-500">{chat.timestamp}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                          <span className={`text-xs ${getRoleColor(chat.role)}`}>
                            {chat.role}
                          </span>
                        </div>
                        {chat.unread > 0 && (
                          <Badge className="bg-purple-600 text-white text-xs">
                            {chat.unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area - Lado Direito */}
        <div className="flex-1 flex flex-col">
          {currentChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={currentChat.avatar} />
                        <AvatarFallback>
                          {getUserInitials(currentChat.name)}
                        </AvatarFallback>
                      </Avatar>
                      {currentChat.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{currentChat.name}</h3>
                      <p className={`text-sm ${getRoleColor(currentChat.role)}`}>
                        {currentChat.role}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {currentMessages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-sm">Nenhuma mensagem ainda</p>
                    <p className="text-xs mt-1">Envie uma mensagem para iniciar a conversa</p>
                  </div>
                ) : (
                  currentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    {!msg.isOwn && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={msg.avatar} />
                        <AvatarFallback className="text-xs">
                          {getUserInitials(msg.sender)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.isOwn
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${
                        msg.isOwn ? 'text-purple-200' : 'text-gray-500'
                      }`}>
                        {msg.timestamp}
                      </p>
                    </div>
                    {msg.isOwn && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-purple-600 text-white">
                          {getUserInitials('Admin')}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    onClick={handleSendMessage}
                    className="bg-purple-600 hover:bg-purple-700"
                    disabled={!message.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Selecione uma conversa</h3>
                <p className="text-gray-600">Busque por usuários para iniciar uma conversa</p>
              </div>
            </div>
          )}
        </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && chats.length === 0 && (
        <div className="flex h-[calc(100vh-200px)] bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="w-80 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                  <h2 className="text-lg font-semibold">Chat</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUserSearch(!showUserSearch)}
                  className="text-purple-600 hover:text-purple-700"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Buscar conversas ou usuários..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    handleSearch(e.target.value);
                  }}
                />
              </div>
            </div>
            
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm">Nenhuma conversa iniciada</p>
                <p className="text-xs mt-1">Busque por usuários para iniciar uma conversa</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Bem-vindo ao Chat</h3>
              <p className="text-gray-600">Busque por usuários para iniciar uma conversa</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
