import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Mic, 
  MicOff,
  Volume2,
  VolumeX,
  Brain,
  Activity,
  Search,
  Database,
  Globe,
  TrendingUp,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import '../styles/voice-assistant.css';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  metadata?: {
    tools?: string[];
    sources?: any[];
  };
}

interface ToolStatus {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: any;
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';
type AssistantState = 'idle' | 'listening' | 'processing' | 'speaking';

const StableVoiceAssistant: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // State management
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [assistantState, setAssistantState] = useState<AssistantState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [activeTools, setActiveTools] = useState<ToolStatus[]>([]);
  const [streamingText, setStreamingText] = useState('');
  
  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Animation values
  const [pulseScale, setPulseScale] = useState(1);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // WebSocket connection to stable voice service
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    setConnectionState('connecting');
    
    const userId = user?.uid || 'anonymous';
    const wsUrl = process.env.NODE_ENV === 'production' 
      ? `wss://api-financial-news-platform-production.up.railway.app/api/voice/chat?userId=${userId}`
      : `ws://localhost:3005/api/voice/chat?userId=${userId}`;
    
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      console.log('✅ Connected to stable voice service');
      setConnectionState('connected');
      
      // Welcome message handled by server
    };
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleServerMessage(data);
    };
    
    wsRef.current.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      setConnectionState('error');
      toast.error('Error de conexión');
    };
    
    wsRef.current.onclose = () => {
      setConnectionState('disconnected');
      setAssistantState('idle');
      
      // Auto-reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 3000);
    };
  }, [user]);

  // Handle server messages
  const handleServerMessage = (data: any) => {
    console.log('📨 Server message:', data.type);
    
    switch (data.type) {
      case 'connected':
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'system',
          content: `🤖 Asistente financiero conectado con herramientas avanzadas:\n• 🌐 Búsqueda web en tiempo real\n• 📊 Base de datos financiera\n• 📈 Datos de mercado\n• 💡 Análisis de sentimiento`,
          timestamp: new Date()
        }]);
        break;
        
      case 'transcription':
        setCurrentTranscript(data.text);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'user',
          content: data.text,
          timestamp: new Date()
        }]);
        setAssistantState('processing');
        setStreamingText('');
        break;
        
      case 'text_delta':
        // Streaming response text
        setStreamingText(prev => prev + data.text);
        setAssistantState('processing');
        break;
        
      case 'tool_use':
        // Tool being used
        setActiveTools(prev => {
          const existing = prev.find(t => t.name === data.tool);
          if (existing) {
            return prev.map(t => 
              t.name === data.tool 
                ? { ...t, status: 'running' }
                : t
            );
          }
          return [...prev, { name: data.tool, status: 'running' }];
        });
        break;
        
      case 'tool_result':
        // Tool completed
        setActiveTools(prev => prev.map(t => 
          t.name === data.tool 
            ? { ...t, status: 'completed', result: data.result }
            : t
        ));
        break;
        
      case 'response':
        // Final response
        if (streamingText) {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'assistant',
            content: streamingText,
            timestamp: new Date(),
            metadata: {
              tools: activeTools.map(t => t.name)
            }
          }]);
        } else {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'assistant',
            content: data.text,
            timestamp: new Date(),
            metadata: {
              tools: activeTools.map(t => t.name)
            }
          }]);
        }
        
        setStreamingText('');
        setActiveTools([]);
        setAssistantState('speaking');
        
        // Reset to idle after speaking
        setTimeout(() => {
          setAssistantState('idle');
        }, 2000);
        break;
        
      case 'audio':
        if (audioEnabled) {
          playAudioResponse(data.data);
        }
        break;
        
      case 'error':
        toast.error(data.message);
        setAssistantState('idle');
        setActiveTools([]);
        break;
    }
  };

  // Start recording with MediaRecorder API
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Create audio context for visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // Visualize audio levels
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      const updateLevel = () => {
        if (analyserRef.current && isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255 * 100);
          requestAnimationFrame(updateLevel);
        }
      };
      updateLevel();
      
      // Start recording
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendAudioToServer(audioBlob);
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        setAudioLevel(0);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setAssistantState('listening');
      setCurrentTranscript('');
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('No se pudo acceder al micrófono');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAssistantState('processing');
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    }
  };

  // Send audio to server
  const sendAudioToServer = async (audioBlob: Blob) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      toast.error('No hay conexión con el servidor');
      return;
    }
    
    // Convert blob to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result?.toString().split(',')[1];
      if (base64) {
        wsRef.current?.send(JSON.stringify({
          type: 'audio',
          data: base64,
          format: 'webm'
        }));
      }
    };
    reader.readAsDataURL(audioBlob);
  };

  // Play audio response
  const playAudioResponse = async (audioBase64: string) => {
    try {
      const audioData = atob(audioBase64);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(arrayBuffer);
      
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }
      
      const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  // Send text message
  const sendTextMessage = (text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'text',
        text
      }));
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'user',
        content: text,
        timestamp: new Date()
      }]);
      
      setAssistantState('processing');
    }
  };

  // Helper functions
  const getToolDisplayName = (toolName: string) => {
    const toolNames: Record<string, string> = {
      'search_web': '🌐 Búsqueda Web',
      'search_database': '📊 Base de Datos',
      'get_market_data': '📈 Datos de Mercado',
      'analyze_sentiment': '💡 Análisis de Sentimiento'
    };
    return toolNames[toolName] || toolName;
  };

  const getToolIcon = (toolName: string) => {
    switch(toolName) {
      case 'search_web': return Globe;
      case 'search_database': return Database;
      case 'get_market_data': return TrendingUp;
      case 'analyze_sentiment': return Brain;
      default: return Search;
    }
  };

  // Initialize connection
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  // Pulse animation
  useEffect(() => {
    const interval = setInterval(() => {
      if (assistantState === 'listening') {
        setPulseScale(1 + (audioLevel / 100) * 0.3);
      } else if (assistantState === 'processing') {
        setPulseScale(prev => prev === 1 ? 1.1 : 1);
      } else if (assistantState === 'speaking') {
        setPulseScale(prev => prev === 1 ? 1.05 : 1);
      } else {
        setPulseScale(1);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [assistantState, audioLevel]);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 h-screen flex flex-col">
        {/* Header */}
        <header className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-blue-400" />
              <span className="text-lg font-medium">AI Financial Assistant (Stable)</span>
            </div>
            
            {/* Connection status */}
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-800/50 rounded-full">
              <div className={`w-2 h-2 rounded-full ${
                connectionState === 'connected' ? 'bg-green-400' :
                connectionState === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                connectionState === 'error' ? 'bg-red-400' :
                'bg-gray-400'
              }`} />
              <span className="text-xs text-gray-400">
                {connectionState === 'connected' ? 'Connected' :
                 connectionState === 'connecting' ? 'Connecting...' :
                 connectionState === 'error' ? 'Error' :
                 'Disconnected'}
              </span>
            </div>
          </div>

          {/* Audio toggle */}
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
          >
            {audioEnabled ? (
              <Volume2 className="w-5 h-5 text-gray-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </header>

        {/* Messages area */}
        <div className="flex-1 px-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-lg px-4 py-2 rounded-lg ${
                  message.type === 'user' ? 'bg-blue-600' :
                  message.type === 'assistant' ? 'bg-gray-800' :
                  message.type === 'tool' ? 'bg-purple-900/30' :
                  'bg-gray-700'
                }`}>
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                  {message.metadata?.tools && message.metadata.tools.length > 0 && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {message.metadata.tools.map((tool, idx) => (
                        <span key={idx} className="text-xs bg-black/30 px-2 py-1 rounded">
                          {getToolDisplayName(tool)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            
            {/* Streaming response */}
            {streamingText && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="max-w-lg px-4 py-2 rounded-lg bg-gray-800">
                  <p className="text-sm whitespace-pre-line">{streamingText}<span className="animate-pulse">▊</span></p>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Active tools indicator */}
        {activeTools.length > 0 && (
          <div className="px-6 py-3">
            <div className="max-w-3xl mx-auto">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span className="text-sm text-gray-400">Usando herramientas:</span>
                  <div className="flex gap-2">
                    {activeTools.map((tool, idx) => {
                      const Icon = getToolIcon(tool.name);
                      return (
                        <div key={idx} className="flex items-center gap-1">
                          <Icon className={`w-4 h-4 ${
                            tool.status === 'completed' ? 'text-green-400' :
                            tool.status === 'running' ? 'text-purple-400 animate-pulse' :
                            'text-gray-400'
                          }`} />
                          {tool.status === 'completed' && (
                            <CheckCircle className="w-3 h-3 text-green-400" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="p-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4">
              {/* Voice button */}
              <motion.button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                disabled={connectionState !== 'connected'}
                animate={{ scale: pulseScale }}
                className={`relative w-16 h-16 rounded-full transition-all ${
                  assistantState === 'listening' ? 'bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]' :
                  assistantState === 'processing' ? 'bg-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.5)]' :
                  assistantState === 'speaking' ? 'bg-green-500 shadow-[0_0_30px_rgba(34,197,94,0.5)]' :
                  'bg-blue-500 hover:bg-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                } ${connectionState !== 'connected' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {assistantState === 'listening' ? (
                  <MicOff className="w-6 h-6 text-white mx-auto" />
                ) : assistantState === 'processing' ? (
                  <Loader2 className="w-6 h-6 text-white mx-auto animate-spin" />
                ) : assistantState === 'speaking' ? (
                  <Activity className="w-6 h-6 text-white mx-auto" />
                ) : (
                  <Mic className="w-6 h-6 text-white mx-auto" />
                )}
                
                {/* Audio level indicator */}
                {assistantState === 'listening' && (
                  <div className="absolute inset-0 rounded-full">
                    <svg className="w-full h-full">
                      <circle
                        cx="32"
                        cy="32"
                        r="30"
                        fill="none"
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth="2"
                        strokeDasharray={`${audioLevel * 1.88} 188`}
                        transform="rotate(-90 32 32)"
                      />
                    </svg>
                  </div>
                )}
              </motion.button>

              {/* Text input */}
              <input
                type="text"
                placeholder="O escribe tu pregunta aquí..."
                className="flex-1 bg-gray-800/50 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    sendTextMessage(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
                disabled={connectionState !== 'connected'}
              />
            </div>
            
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500">
                {assistantState === 'idle' && 'Mantén presionado el botón para hablar o escribe tu pregunta'}
                {assistantState === 'listening' && 'Escuchando... Suelta para enviar'}
                {assistantState === 'processing' && 'Procesando tu consulta...'}
                {assistantState === 'speaking' && 'Respondiendo...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StableVoiceAssistant;