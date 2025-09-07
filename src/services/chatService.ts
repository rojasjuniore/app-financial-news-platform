import apiClient from './api';
import { ChatSession } from '../types';

export const chatService = {
  // Obtener sesión de chat
  getSession: async (articleId: string): Promise<ChatSession> => {
    const { data } = await apiClient.get(`/api/chat/article/${articleId}`);
    return data.session;
  },

  // Enviar mensaje
  sendMessage: async (articleId: string, message: string, model?: string): Promise<{
    message: string;
    timestamp: string;
    findings?: any;
  }> => {
    const { data } = await apiClient.post(
      `/api/chat/article/${articleId}/message`,
      { message, model }
    );
    return data.response;
  },

  // Obtener historial del usuario
  getUserHistory: async (): Promise<ChatSession[]> => {
    const { data } = await apiClient.get('/api/chat/user/history');
    return data.history || data.sessions || [];
  },

  // Limpiar sesión
  clearSession: async (articleId: string) => {
    const { data } = await apiClient.delete(`/api/chat/article/${articleId}`);
    return data;
  }
};