import apiClient from '../news/api';
import { ChatSession } from '../../types';

// Store active sessions locally
const activeSessions: { [key: string]: string } = {};

export const chatService = {
  // Iniciar sesión de chat
  startSession: async (articleId: string, userId: string = 'user123'): Promise<ChatSession> => {
    try {
      const { data } = await apiClient.post('/api/chat/start', {
        userId,
        articleId,
        chatType: 'general',
        preferredModel: 'openai'
      });
      
      // Store session ID for this article
      if (data.data?.sessionId) {
        activeSessions[articleId] = data.data.sessionId;
      }
      
      return {
        sessionId: data.data?.sessionId || '',
        messages: data.data?.messages || [],
        articleId,
        userId
      };
    } catch (error) {
      console.error('Error starting chat session:', error);
      // Return a default session
      return { 
        sessionId: `local_${Date.now()}`, 
        messages: [], 
        articleId,
        userId
      };
    }
  },

  // Obtener sesión de chat
  getSession: async (articleId: string, userId: string = 'user123'): Promise<ChatSession> => {
    // If we have an active session, return it
    const sessionId = activeSessions[articleId];
    if (sessionId) {
      try {
        const { data } = await apiClient.get(`/api/chat/${sessionId}/history`);
        return {
          sessionId,
          messages: data.data?.messages || [],
          articleId,
          userId
        };
      } catch (error) {
        console.error('Error getting session history:', error);
      }
    }
    
    // Otherwise start a new session
    return chatService.startSession(articleId, userId);
  },

  // Enviar mensaje
  sendMessage: async (articleId: string, message: string, model?: string): Promise<{
    message: string;
    timestamp: string;
    findings?: any;
  }> => {
    let sessionId = activeSessions[articleId];
    
    // If no session exists, create one
    if (!sessionId) {
      const session = await chatService.startSession(articleId);
      sessionId = session.sessionId || '';
      if (sessionId) {
        activeSessions[articleId] = sessionId;
      }
    }
    
    try {
      const { data } = await apiClient.post(
        `/api/chat/${sessionId}/message`,
        { message, model: model || 'openai' }
      );
      
      return {
        message: data.data?.response || 'No response received',
        timestamp: data.timestamp || new Date().toISOString(),
        findings: data.data?.additionalInfo
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        message: 'Error: Could not send message. Please try again.',
        timestamp: new Date().toISOString()
      };
    }
  },

  // Obtener historial del usuario
  getUserHistory: async (userId: string = 'user123'): Promise<ChatSession[]> => {
    try {
      // For now, return active sessions
      const sessions: ChatSession[] = [];
      for (const [articleId, sessionId] of Object.entries(activeSessions)) {
        sessions.push({
          sessionId,
          articleId,
          messages: [],
          userId
        });
      }
      return sessions;
    } catch (error) {
      console.error('Error getting user history:', error);
      return [];
    }
  },

  // Limpiar sesión
  clearSession: async (articleId: string) => {
    const sessionId = activeSessions[articleId];
    if (sessionId) {
      try {
        await apiClient.post(`/api/chat/${sessionId}/end`, { reason: 'user_cleared' });
        delete activeSessions[articleId];
        return { success: true };
      } catch (error) {
        console.error('Error clearing session:', error);
      }
    }
    return { success: false };
  }
};