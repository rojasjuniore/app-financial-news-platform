import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { chatService } from '../services/chatService';
import { ChatMessage } from '../types';

export const useChat = (articleId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Obtener sesión de chat
  const sessionQuery = useQuery({
    queryKey: ['chat-session', articleId],
    queryFn: () => chatService.getSession(articleId),
    enabled: !!articleId
  });

  // Enviar mensaje
  const sendMessageMutation = useMutation({
    mutationFn: ({ message, model }: { message: string; model?: string }) => 
      chatService.sendMessage(articleId, message, model),
    onMutate: ({ message }) => {
      // Agregar mensaje del usuario optimisticamente
      const userMessage: ChatMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);
    },
    onSuccess: (response) => {
      // Agregar respuesta del agente
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: response.timestamp,
        findings: response.findings
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Forzar scroll después de recibir respuesta
      setTimeout(() => {
        const element = document.querySelector('[data-messages-end]');
        element?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 200);
    },
    onError: (error) => {
      // Remover último mensaje en caso de error
      setMessages(prev => prev.slice(0, -1));
      console.error('Error enviando mensaje:', error);
    }
  });

  // Cargar mensajes previos si existen
  useEffect(() => {
    if (sessionQuery.data?.messages) {
      const formattedMessages: ChatMessage[] = [];
      sessionQuery.data.messages.forEach((entry: any) => {
        if (entry.user) {
          formattedMessages.push({
            role: 'user',
            content: entry.user.message,
            timestamp: entry.user.timestamp
          });
        }
        if (entry.agent) {
          formattedMessages.push({
            role: 'assistant',
            content: entry.agent.message,
            timestamp: entry.agent.timestamp,
            findings: entry.agent.findings
          });
        }
      });
      setMessages(formattedMessages);
    }
  }, [sessionQuery.data]);

  const sendMessage = (message: string, model?: string) => {
    sendMessageMutation.mutate({ message, model });
  };

  return {
    messages,
    sendMessage,
    isLoading: sendMessageMutation.isPending,
    session: sessionQuery.data,
    isSessionLoading: sessionQuery.isLoading,
    error: sendMessageMutation.error
  };
};