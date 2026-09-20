import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useConversations } from './useApi';

export const useChatNotifications = () => {
  const { user } = useAuth();
  const { data: conversationsData, refetch: refetchConversations } = useConversations();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || !conversationsData?.data) {
      setUnreadCount(0);
      return;
    }

    // Calcular total de mensagens não lidas
    const totalUnread = conversationsData.data.reduce((total: number, conv: any) => {
      // Só contar mensagens não lidas (não mensagens enviadas por nós)
      if (conv.unreadCount && conv.unreadCount > 0) {
        return total + conv.unreadCount;
      }
      
      return total;
    }, 0);

    setUnreadCount(totalUnread);
  }, [user, conversationsData]);

  // Forçar atualização das notificações a cada 3 segundos
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      refetchConversations();
    }, 3000);

    return () => clearInterval(interval);
  }, [user, refetchConversations]);

  return unreadCount;
};
