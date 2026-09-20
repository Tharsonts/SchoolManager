import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Send, 
  Paperclip, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  UserPlus,
  MessageCircle,
  MessageSquare,
  Clock,
  Check,
  CheckCheck,
  Loader2,
  Mail
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { UserStatus } from "@/components/ui/UserStatus";
import { 
  useConversations, 
  useMessages, 
  useSendMessage, 
  useEditMessage, 
  useDeleteMessage,
  useSearchUsers,
  useUsersStatus,
  useUpdateUserStatus
} from "@/hooks/useApi";
import { useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MainLayout } from "@/components/layout/MainLayout";

// Hook personalizado para debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function CoordinatorChat() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Debug: Log do usuário
  console.log('🔍 CoordinatorChat - User:', user);
  console.log('🔍 CoordinatorChat - isAuthenticated:', isAuthenticated);
  console.log('🔍 CoordinatorChat - authLoading:', authLoading);
  
  // Estados
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditMessageDialogOpen, setIsEditMessageDialogOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<any[]>([]);
  const [recentConversations, setRecentConversations] = useState<any[]>([]);

  // Debounce da busca de usuários (espera 500ms após parar de digitar)
  const debouncedUserSearchQuery = useDebounce(userSearchQuery, 500);

  // Buscar conversas e mensagens
  const { data: conversationsData, isLoading: isLoadingConversations, error: conversationsError } = useConversations({
    // Atualizar conversas a cada 5 segundos
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true
  });
  
  // Debug: Log detalhado dos dados
  console.log('🔍 DEBUG useConversations:');
  console.log('  - conversationsData:', conversationsData);
  console.log('  - isLoadingConversations:', isLoadingConversations);
  console.log('  - conversationsError:', conversationsError);
  console.log('  - conversationsData?.data:', conversationsData?.data);
  console.log('  - conversationsData?.data?.length:', conversationsData?.data?.length);
  // Calcular conversationId determinístico com base nos dois participantes
  const currentConversationId = useMemo(() => {
    if (!selectedConversation?.otherUserId || !user?.id) return "";
    const pair = [user.id, selectedConversation.otherUserId].sort();
    return `conv_${pair[0]}_${pair[1]}`;
  }, [selectedConversation?.otherUserId, user?.id]);

  const { data: messagesData, isLoading: isLoadingMessages, refetch: refetchMessages } = useMessages(
    currentConversationId,
    {
      // Atualizar mensagens a cada 2 segundos quando uma conversa estiver ativa
      refetchInterval: selectedConversation ? 2000 : false,
      refetchIntervalInBackground: true,
      // Forçar refetch quando a conversa mudar
      refetchOnMount: true,
      refetchOnWindowFocus: true
    }
  );
  
  // Buscar usuários para novo chat (com debounce)
  const { data: searchResults, isLoading: isLoadingUsers, error: searchError } = useSearchUsers(debouncedUserSearchQuery);
  
  // Debug: Log dos resultados da busca
  console.log('🔍 CoordinatorChat - searchResults:', searchResults);
  console.log('🔍 CoordinatorChat - isLoadingUsers:', isLoadingUsers);
  console.log('🔍 CoordinatorChat - searchError:', searchError);
  console.log('🔍 CoordinatorChat - debouncedUserSearchQuery:', debouncedUserSearchQuery);
  
  // Gerenciar status dos usuários
  const updateStatusMutation = useUpdateUserStatus();
  
  // Mutations
  const sendMessageMutation = useSendMessage();
  const editMessageMutation = useEditMessage();
  const deleteMessageMutation = useDeleteMessage();

  // Processar conversas
  const conversations = useMemo(() => {
    console.log('🔄 Processando conversas...');
    console.log('📊 Dados do banco:', conversationsData);
    console.log('📊 Dados do banco (data):', conversationsData?.data);
    console.log('📊 Dados do banco (length):', conversationsData?.data?.length);
    
    // CORREÇÃO: A API retorna array diretamente, não { data: [...] }
    let rawData = conversationsData;
    if (Array.isArray(conversationsData)) {
      rawData = conversationsData;
    } else if (conversationsData?.data && Array.isArray(conversationsData.data)) {
      rawData = conversationsData.data;
    }
    
    console.log('🔧 Dados processados:', rawData);
    
    // REGRA: Se não há dados, retornar array vazio
    if (!rawData || rawData.length === 0) {
      console.log('🧹 Nenhum dado - retornando array vazio');
      return [];
    }
    
    // Se há dados, usar eles (fonte da verdade)
    let allConversations = [...rawData];
    console.log('📋 Conversas do banco (antes do sort):', allConversations);
    
    // Ordenar por última mensagem (mais recente primeiro)
    const sorted = allConversations.sort((a: any, b: any) => {
      // Usar lastMessageTime se disponível, senão usar createdAt da última mensagem
      let timeA = 0;
      let timeB = 0;
      
      if (a.lastMessageTime) {
        timeA = new Date(a.lastMessageTime).getTime();
      } else if (a.lastMessage && a.lastMessage.createdAt) {
        timeA = new Date(a.lastMessage.createdAt).getTime();
      }
      
      if (b.lastMessageTime) {
        timeB = new Date(b.lastMessageTime).getTime();
      } else if (b.lastMessage && b.lastMessage.createdAt) {
        timeB = new Date(b.lastMessage.createdAt).getTime();
      }
      
      return timeB - timeA; // Mais recente primeiro
    });
    
    // Normalizar campos para garantir nome/email exibidos
    const normalized = sorted.map((c: any) => {
      const fullName = c.otherUserName || c.recipientName || '';
      const [first, ...rest] = fullName.split(' ').filter(Boolean);
      const last = rest.join(' ');
      return {
        ...c,
        otherUserFirstName: c.otherUserFirstName || first || c.firstName || 'Usuário',
        otherUserLastName: c.otherUserLastName || last || c.lastName || '',
        recipientName: c.recipientName || fullName || `${first || 'Usuário'} ${last || ''}`.trim(),
        recipientEmail: c.recipientEmail || c.otherUserEmail || c.email || '',
      };
    });

    console.log('✅ Conversas finais processadas:', normalized);
    return normalized;
  }, [conversationsData]);
  
  // Buscar status dos usuários das conversas
  const conversationUserIds = conversations.map((conv: any) => conv.otherUserId);
  const { data: usersStatusData } = useUsersStatus(conversationUserIds);

  // Processar mensagens
  const messages = useMemo(() => {
    const dbMessages = messagesData?.data || [];
    const allMessages = [...dbMessages, ...optimisticMessages];
    
    return allMessages.sort((a: any, b: any) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : a.timestamp || 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : b.timestamp || 0;
      return timeA - timeB;
    });
  }, [messagesData, optimisticMessages]);

  // Filtrar conversas por busca
  const filteredConversations = conversations.filter((conv: any) => {
    console.log('🔍 Filtrando conversa:', conv);
    const searchLower = searchTerm.toLowerCase();
    const matches = (
      `${conv.otherUserFirstName} ${conv.otherUserLastName}`.toLowerCase().includes(searchLower) ||
      conv.lastMessage?.toLowerCase().includes(searchLower)
    );
    console.log('✅ Conversa passa no filtro?', matches);
    return matches;
  });
  
  console.log('📊 filteredConversations após filtro:', filteredConversations);

  // Verificar se mensagem pode ser editada (dentro de 5 minutos)
  const canEditMessage = (message: any) => {
    if (message.senderId !== user?.id) return false;
    const messageTime = new Date(message.createdAt).getTime();
    const currentTime = new Date().getTime();
    const fiveMinutes = 5 * 60 * 1000;
    return (currentTime - messageTime) < fiveMinutes;
  };

  // Verificar se mensagem pode ser deletada (dentro de 5 minutos)
  const canDeleteMessage = (message: any) => {
    if (message.senderId !== user?.id) return false;
    const messageTime = new Date(message.createdAt).getTime();
    const currentTime = new Date().getTime();
    const fiveMinutes = 5 * 60 * 1000;
    return (currentTime - messageTime) < fiveMinutes;
  };

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Forçar atualização quando a conversa mudar
  useEffect(() => {
    if (selectedConversation) {
      console.log('🔄 Conversa selecionada mudou, forçando atualização...');
      refetchMessages();
      queryClient.refetchQueries({ queryKey: ['conversations'] });
    }
  }, [selectedConversation?.conversationId, refetchMessages, queryClient]);

  // Limpar mensagens otimistas quando mudar de conversa
  useEffect(() => {
    setOptimisticMessages([]);
  }, [selectedConversation?.otherUserId]);

  // Carregar conversas recentes do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentConversations');
    if (saved) {
      try {
        setRecentConversations(JSON.parse(saved));
      } catch (error) {
        console.error('Erro ao carregar conversas recentes:', error);
      }
    }
  }, []);

  // Limpar localStorage quando banco estiver vazio
  useEffect(() => {
    if (conversationsData?.data && conversationsData.data.length === 0) {
      console.log('🧹 Banco vazio - limpando localStorage e conversas recentes');
      localStorage.removeItem('localConversations');
      localStorage.removeItem('recentConversations');
      setRecentConversations([]);
    }
  }, [conversationsData?.data]);

  // Atualizar conversas quando receber novas mensagens
  useEffect(() => {
    if (messagesData?.data && messagesData.data.length > 0) {
      // Invalidar cache de conversas para atualizar notificações
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      // Se há mensagens e uma conversa selecionada, atualizar conversas recentes
      if (selectedConversation && messagesData.data.length > 0) {
        const lastMessage = messagesData.data[messagesData.data.length - 1];
        if (lastMessage.senderId !== user?.id) {
          // Mensagem recebida, adicionar às conversas recentes
          addToRecentConversations(selectedConversation, lastMessage.content);
        }
      }
    }
  }, [messagesData, queryClient, selectedConversation, user]);

  // Atualizar status do usuário quando entrar no chat
  useEffect(() => {
    if (user?.id) {
      // updateStatusMutation.mutate({ status: 'online' }); // Desabilitado temporariamente
    }
  }, [user, updateStatusMutation]);

  // Atualizar status quando sair da página
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user?.id) {
        // updateStatusMutation.mutate({ status: 'offline' }); // Desabilitado temporariamente
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user, updateStatusMutation]);

  // Limpar conversas antigas (mais de 7 dias)
  useEffect(() => {
    const cleanOldConversations = () => {
      // Limpar conversas locais antigas
      const localConversations = JSON.parse(localStorage.getItem('localConversations') || '[]');
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const filteredLocal = localConversations.filter((conv: any) => {
        if (!conv.lastMessageTime) return true; // Manter conversas sem mensagens
        return new Date(conv.lastMessageTime) > sevenDaysAgo;
      });
      
      if (filteredLocal.length !== localConversations.length) {
        localStorage.setItem('localConversations', JSON.stringify(filteredLocal));
      }

      // Limpar conversas recentes antigas
      setRecentConversations(prev => {
        const filteredRecent = prev.filter((conv: any) => {
          if (!conv.lastMessageTime) return true;
          return new Date(conv.lastMessageTime) > sevenDaysAgo;
        });
        
        if (filteredRecent.length !== prev.length) {
          localStorage.setItem('recentConversations', JSON.stringify(filteredRecent));
        }
        
        return filteredRecent;
      });
    };

    cleanOldConversations();
  }, []);

  // Função para adicionar/atualizar conversas recentes
  const addToRecentConversations = (conversation: any, messageContent: string) => {
    console.log('🔄 Adicionando conversa recente:', { conversation, messageContent });
    
    const now = new Date().toISOString();
    
    // Determinar informações do usuário correto
    let conversationInfo;
    
    if (conversation.otherUserId === user?.id) {
      // Se estamos conversando com nós mesmos (não deveria acontecer)
      return;
    } else {
      // Conversa com outro usuário
      conversationInfo = {
        id: conversation.otherUserId || conversation.id,
        otherUserId: conversation.otherUserId || conversation.id,
        otherUserFirstName: conversation.otherUserFirstName || conversation.recipientName?.split(' ')[0] || 'Usuário',
        otherUserLastName: conversation.otherUserLastName || conversation.recipientName?.split(' ').slice(1).join(' ') || '',
        recipientEmail: conversation.recipientEmail || conversation.email,
        recipientName: conversation.recipientName || `${conversation.otherUserFirstName} ${conversation.otherUserLastName}`,
        recipientAvatar: conversation.recipientAvatar || conversation.profileImageUrl,
        lastMessage: messageContent,
        lastMessageTime: now,
        unreadCount: messageContent ? 1 : 0,
        conversationId: conversation.conversationId || `local_${conversation.otherUserId || conversation.id}`
      };
    }

    console.log('📝 Conversa processada:', conversationInfo);

    setRecentConversations(prev => {
      console.log('📋 Conversas anteriores:', prev);
      
      // Remover conversa existente se houver
      const filtered = prev.filter(conv => conv.otherUserId !== conversationInfo.otherUserId);
      
      // Adicionar nova conversa no topo
      const updated = [conversationInfo, ...filtered];
      
      // Limitar a 6 conversas
      const limited = updated.slice(0, 6);
      
      console.log('✅ Conversas atualizadas:', limited);
      
      // Salvar no localStorage
      localStorage.setItem('recentConversations', JSON.stringify(limited));
      
      return limited;
    });
  };

  // Handlers
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const messageContent = newMessage; // Definir fora do try-catch
    
    try {
      setNewMessage(""); // Limpar imediatamente para melhor UX
      
      // Criar mensagem otimista (aparece instantaneamente)
      const optimisticMessage = {
        id: `optimistic_${Date.now()}`,
        content: messageContent,
        senderId: user?.id,
        recipientId: selectedConversation.otherUserId,
        createdAt: new Date().toISOString(),
        timestamp: Date.now(),
        isOptimistic: true,
        status: 'sending'
      };
      
      // Adicionar mensagem otimista à lista
      setOptimisticMessages(prev => [...prev, optimisticMessage]);
      
      // CORREÇÃO: Buscar email do destinatário baseado no otherUserId
      let recipientEmail = selectedConversation.recipientEmail;
      
      // Se não tem email, buscar pelo otherUserId
      if (!recipientEmail && selectedConversation.otherUserId) {
        // Buscar usuário pelo ID para obter o email
        const userResponse = await fetch(`/api/users/${selectedConversation.otherUserId}`, {
          credentials: 'include'
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          recipientEmail = userData.email;
        }
      }
      
      if (!recipientEmail) {
        throw new Error('Email do destinatário não encontrado');
      }
      
      // Enviar mensagem para o servidor
      const result = await sendMessageMutation.mutateAsync({
        recipientEmail,
        content: messageContent
      });
      
      // Remover mensagem otimista e atualizar com a real
      setOptimisticMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      
      // Adicionar/atualizar conversa recente para o remetente
      console.log('🚀 Chamando addToRecentConversations com:', { selectedConversation, messageContent });
      addToRecentConversations(selectedConversation, messageContent);
      
      // Forçar atualização imediata das mensagens e conversas
      console.log('🔄 Forçando atualização imediata...');
      
      // Aguardar um pouco para o banco processar
      setTimeout(() => {
        // Refetch imediato das mensagens
        refetchMessages();
        
        // Refetch imediato das conversas
        queryClient.refetchQueries({ queryKey: ['conversations'] });
        
        // Invalidar caches para garantir sincronização
        queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation.otherUserId] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        
        console.log('✅ Atualizações forçadas executadas');
      }, 100);
      
      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada com sucesso."
      });
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      
      // Remover mensagem otimista específica
      setOptimisticMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      
      // Restaurar mensagem no input
      setNewMessage(messageContent);
      
      // Mostrar erro específico
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao enviar mensagem",
        description: `Não foi possível enviar a mensagem: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };



  const handleEditMessage = async () => {
    if (!editingMessage || !editingMessage.content.trim()) return;

    try {
      await editMessageMutation.mutateAsync({
        id: editingMessage.id,
        content: editingMessage.content
      });
      
      setIsEditMessageDialogOpen(false);
      setEditingMessage(null);
      toast({
        title: "Mensagem editada",
        description: "Sua mensagem foi editada com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro ao editar mensagem",
        description: "Ocorreu um erro ao tentar editar a mensagem.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessageMutation.mutateAsync(messageId);
      toast({
        title: "Mensagem deletada",
        description: "Sua mensagem foi deletada com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro ao deletar mensagem",
        description: "Ocorreu um erro ao tentar deletar a mensagem.",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoadingConversations) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando conversas...</span>
      </div>
    );
  }

  return (
    <MainLayout pageTitle="Chat">
      <div className="flex h-[calc(100vh-200px)] gap-4 bg-transparent">
         {/* Lista de conversas - Integrada no layout principal */}
         <div className="w-80 flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm">
           <div className="p-4 border-b border-gray-200 bg-white rounded-t-lg">
             <div className="mb-3">
               <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                 <MessageSquare className="h-5 w-5 text-amber-600" />
                 Chat - Coordenador
               </h2>
               <p className="text-sm text-gray-600">Converse com professores e colegas</p>
             </div>
               
               <div className="relative">
                 <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                 <Input
                   placeholder="Buscar conversas ou usuários..."
                   className="pl-9 pr-3 py-2 text-sm bg-gray-50 border-gray-300 focus:border-amber-500 focus:ring-amber-500 rounded-lg"
                   value={searchTerm}
                   onChange={(e) => {
                     setSearchTerm(e.target.value);
                     setUserSearchQuery(e.target.value);
                     setShowUserSearch(e.target.value.length >= 2);
                   }}
                   onFocus={() => setShowUserSearch(searchTerm.length >= 2)}
                 />
               
               {/* Dropdown de busca de usuários */}
               {showUserSearch && searchTerm.length >= 2 && (
                 <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                   {isLoadingUsers ? (
                     <div className="p-3 text-center text-gray-500">
                       <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                       Buscando...
                     </div>
                   ) : searchError ? (
                     <div className="p-3 text-center text-red-500">
                       Erro ao buscar usuários
                     </div>
                   ) : searchResults?.data && searchResults.data.length > 0 ? (
                     <div>
                       <div className="p-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                         Usuários encontrados ({searchResults.data.length})
                       </div>
                         {searchResults.data.map((user: any) => (
                           <button
                             key={user.id}
                            onClick={() => {
                              // Criar conversa virtual e abrir chat com conversationId determinístico
                              const pair = [user?.id, user.id ? user.id : undefined].filter(Boolean) as string[];
                              // pair[0] é o coordenador logado, pair[1] deve ser o usuário encontrado
                              const computedConvId = (() => {
                                const ids = [user?.id as string, user.id as string].filter(Boolean);
                                const sorted = ids.sort();
                                return `conv_${sorted[0]}_${sorted[1]}`;
                              })();

                              const newConversation = {
                                 id: `new_${Date.now()}`,
                                 otherUserId: user.id,
                                 otherUserFirstName: user.firstName,
                                 otherUserLastName: user.lastName,
                                 otherUserRole: user.role,
                                 recipientEmail: user.email,
                                 recipientName: user.firstName + ' ' + user.lastName,
                                 recipientAvatar: user.profileImageUrl,
                                 lastMessage: "",
                                 lastMessageTime: null,
                                 unreadCount: 0,
                                conversationId: computedConvId
                               };
                               
                               // Salvar conversa localmente
                               const localConversations = JSON.parse(localStorage.getItem('localConversations') || '[]');
                               const exists = localConversations.find((conv: any) => conv.otherUserId === user.id);
                               if (!exists) {
                                 localConversations.push(newConversation);
                                 localStorage.setItem('localConversations', JSON.stringify(localConversations));
                               }
                               
                               // Adicionar às conversas recentes
                               addToRecentConversations(newConversation, "");
                               
                               setSelectedConversation(newConversation);
                               setSearchTerm("");
                               setUserSearchQuery("");
                               setShowUserSearch(false);
                               
                               toast({
                                 title: "Chat aberto",
                                 description: `Chat iniciado com ${user.firstName} ${user.lastName}`
                               });
                             }}
                             className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                           >
                             <Avatar className="h-8 w-8">
                               <AvatarImage src={user.profileImageUrl} />
                               <AvatarFallback className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-sm">
                                 {user.firstName?.charAt(0) || user.email?.charAt(0)}
                               </AvatarFallback>
                             </Avatar>
                             <div className="flex-1 min-w-0">
                               <p className="text-sm font-medium text-gray-900 truncate">
                                 {user.firstName} {user.lastName}
                               </p>
                               <p className="text-xs text-gray-500 truncate">
                                 {user.email}
                               </p>
                               <div className="flex items-center justify-between">
                               <p className="text-xs text-gray-400 capitalize">
                                 {user.role === 'admin' && 'Administrador'}
                                 {user.role === 'coordinator' && 'Coordenador'}
                                 {user.role === 'teacher' && 'Professor'}
                                 {user.role === 'student' && 'Aluno'}
                               </p>
                               {/* Status do usuário (simulado para busca) */}
                               <UserStatus status="online" size="sm" />
                             </div>
                             </div>
                           </button>
                         ))}
                       </div>
                     ) : (
                       <div className="p-3 text-center text-gray-500">
                         Nenhum usuário encontrado
                       </div>
                     )}
                   </div>
                 )}
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  {searchTerm ? "Nenhuma conversa encontrada" : "Nenhuma conversa ainda"}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredConversations.map((conversation: any) => (
                    <div
                      key={conversation.conversationId}
                      className={`p-3 cursor-pointer hover:bg-gray-50 transition-all duration-200 border-l-4 rounded-r-lg ${
                        selectedConversation?.otherUserId === conversation.otherUserId 
                          ? "bg-amber-50 border-l-amber-500 shadow-sm" 
                          : "border-l-transparent hover:border-l-amber-300"
                      }`}
                      onClick={() => setSelectedConversation(conversation)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conversation.recipientAvatar} />
                          <AvatarFallback className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-sm">
                            {conversation.otherUserFirstName?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">
                                {conversation.otherUserFirstName} {conversation.otherUserLastName}
                              </h4>
                              {/* Status do usuário */}
                              {usersStatusData?.data && (
                                <UserStatus 
                                  status={usersStatusData.data.find((u: any) => u.id === conversation.otherUserId)?.currentStatus || 'offline'} 
                                  size="sm"
                                />
                              )}
                            </div>
                            {conversation.unreadCount > 0 && (
                              <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs bg-amber-500 hover:bg-amber-600">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Email do usuário */}
                          <div className="flex items-center gap-1 mb-1">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <p className="text-xs text-gray-600 dark:text-gray-500 truncate font-mono">
                              {conversation.recipientEmail}
                            </p>
                          </div>
                          
                          {/* Última mensagem e horário em linha única */}
                          <div className="flex items-center justify-between">
                             <p className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1 mr-2">
                               {conversation.lastMessage ? 
                                 (conversation.lastMessage.length > 30 ? 
                                   conversation.lastMessage.substring(0, 30) + '...' : 
                                   conversation.lastMessage
                                 ) : 
                                 "Nenhuma mensagem ainda"
                               }
                             </p>
                             {conversation.lastMessageTime && (
                               <p className="text-xs text-gray-400 whitespace-nowrap">
                                 {formatDistanceToNow(new Date(conversation.lastMessageTime), { 
                                   addSuffix: true, 
                                   locale: ptBR 
                                 })}
                               </p>
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

                     {/* Área principal - Chat */}
           <div className="flex-1 flex flex-col h-full">
            {selectedConversation ? (
              <>
                {/* Header da conversa */}
                <div className="p-4 border-b border-gray-200 bg-white shadow-sm">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-amber-100">
                      <AvatarImage src={selectedConversation.recipientAvatar} />
                      <AvatarFallback className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-sm font-semibold">
                        {selectedConversation.recipientName?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {selectedConversation.recipientName || "Usuário"}
                      </h3>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-600">
                          {selectedConversation.recipientEmail}
                        </p>
                        {/* Status do usuário */}
                        {usersStatusData?.data && (
                          <UserStatus 
                            status={usersStatusData.data.find((u: any) => u.id === selectedConversation.otherUserId)?.currentStatus || 'offline'} 
                            size="sm"
                            showText={true}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mensagens */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 min-h-0">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                      <span className="ml-2 text-gray-700">Carregando mensagens...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-700 py-12">
                      <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-200">
                        <MessageCircle className="h-10 w-10 text-amber-500" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhuma mensagem ainda</h3>
                      <p className="text-sm text-gray-600">Inicie a conversa enviando uma mensagem!</p>
                    </div>
                  ) : (
                   messages.map((message: any) => (
                     <div
                       key={message.id}
                       className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                     >
                       <div className={`max-w-xs lg:max-w-md ${
          message.senderId === user?.id 
            ? message.isOptimistic 
              ? 'bg-amber-500 text-white shadow-md opacity-80' 
              : 'bg-amber-500 text-white shadow-md'
            : 'bg-white text-gray-800 shadow-sm border border-gray-200'
        } rounded-lg px-4 py-3 ${message.isOptimistic ? 'animate-pulse' : ''}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-sm">{message.content}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs opacity-70">
                                  {format(new Date(message.createdAt), 'HH:mm')}
                                </span>
                                {message.senderId === user?.id && (
                                  <span className="text-xs opacity-70">
                                    {message.isOptimistic ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : message.read ? (
                                      <CheckCheck className="h-3 w-3" />
                                    ) : (
                                      <Check className="h-3 w-3" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {message.senderId === user?.id && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {canEditMessage(message) && (
                                    <DropdownMenuItem onClick={() => {
                                      setEditingMessage(message);
                                      setIsEditMessageDialogOpen(true);
                                    }}>
                                      <Edit className="h-3 w-3 mr-2" />
                                      Editar
                                    </DropdownMenuItem>
                                  )}
                                  {canDeleteMessage(message) && (
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteMessage(message.id)}
                                      className="text-red-600 dark:text-red-400"
                                    >
                                      <Trash2 className="h-3 w-3 mr-2" />
                                      Deletar
                                    </DropdownMenuItem>
                                  )}
                                  {!canEditMessage(message) && !canDeleteMessage(message) && (
                                    <DropdownMenuItem disabled>
                                      <Clock className="h-3 w-3 mr-2" />
                                      Tempo expirado
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input de mensagem */}
                <div className="p-4 border-t border-gray-200 bg-white shadow-sm">
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <Textarea
                        placeholder="Digite sua mensagem..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="min-h-[40px] max-h-24 resize-none border-gray-300 focus:border-amber-500 focus:ring-amber-500 rounded-lg text-sm"
                        rows={1}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute right-2 top-2 h-6 w-6 p-0 hover:bg-gray-100 rounded-lg"
                      >
                        <Paperclip className="h-3 w-3 text-gray-500" />
                      </Button>
                    </div>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-md text-sm"
                    >
                      {sendMessageMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
                             <div className="flex-1 flex items-center justify-center bg-gray-50 h-full">
                 <div className="text-center text-gray-600">
                   <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-200">
                     <MessageCircle className="h-10 w-10 text-gray-400" />
                   </div>
                   <h3 className="text-xl font-semibold text-gray-800 mb-2">Bem-vindo ao Chat!</h3>
                   <p className="text-sm text-gray-600">Escolha uma conversa da lista ou digite o nome de alguém para iniciar uma nova conversa</p>
                  </div>
                </div>
            )}
          </div>
        </div>

      {/* Dialog de edição de mensagem */}
      <Dialog open={isEditMessageDialogOpen} onOpenChange={setIsEditMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Mensagem</DialogTitle>
            <DialogDescription>
              Edite sua mensagem (apenas nos primeiros 5 minutos)
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Digite sua mensagem..."
              value={editingMessage?.content || ""}
              onChange={(e) => setEditingMessage({
                ...editingMessage,
                content: e.target.value
              })}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditMessageDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleEditMessage}
              disabled={editMessageMutation.isPending}
            >
              {editMessageMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Editando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
