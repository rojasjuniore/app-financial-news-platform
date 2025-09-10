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
  Sparkles,
  Circle,
  Square
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import '../styles/voice-assistant.css';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    articles?: any[];
    sentiment?: string;
    confidence?: number;
    tools?: string[];
  };
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';
type AssistantState = 'idle' | 'listening' | 'thinking' | 'speaking';

const VoiceAssistant: React.FC = () => {
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
  const [toolsUsed, setToolsUsed] = useState<string[]>([]);
  
  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioBufferRef = useRef<Float32Array[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  
  // Animation values
  const [pulseScale, setPulseScale] = useState(1);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    setConnectionState('connecting');
    
    const userId = user?.uid || 'anonymous';
    const wsUrl = process.env.NODE_ENV === 'production' 
      ? `wss://api-financial-news-platform-production.up.railway.app/api/voice/realtime?userId=${userId}`
      : `ws://localhost:3001/api/voice/realtime?userId=${userId}`;
    
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      console.log('✅ Connected to voice service');
      setConnectionState('connected');
      
      // Send initialization
      wsRef.current?.send(JSON.stringify({
        type: 'init',
        userId: user?.uid || 'anonymous',
        config: {
          model: 'gpt-4o-realtime',
          voice: 'alloy',
          language: 'es'
        }
      }));
      
      // Welcome message
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'system',
        content: 'Asistente financiero conectado. Puedes preguntarme sobre el mercado, noticias y análisis.',
        timestamp: new Date()
      }]);
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
      case 'stop_audio':
        // Stop any current audio playback immediately (barge-in)
        try {
          // Close existing audio context if any to stop playback
          if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
          }
        } catch (e) {
          console.error('Error stopping audio:', e);
        }
        setAssistantState('listening');
        break;
      case 'transcription':
        setCurrentTranscript(data.text);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'user',
          content: data.text,
          timestamp: new Date()
        }]);
        setAssistantState('thinking');
        break;
        
      case 'tool_use':
        // Show which MCP tools are being used
        setToolsUsed(prev => [...prev, data.tool]);
        break;
        
      case 'response':
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'assistant',
          content: data.text,
          timestamp: new Date(),
          metadata: data.metadata
        }]);
        setAssistantState('speaking');
        setToolsUsed([]);
        
        // Stop speaking animation after a delay
        setTimeout(() => {
          if (assistantState === 'speaking') {
            setAssistantState('idle');
          }
        }, 3000);
        break;
        
      case 'audio':
        if (audioEnabled) {
          playAudioChunk(data.audio);
        }
        break;
        
      case 'error':
        toast.error(data.message);
        setAssistantState('idle');
        break;
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      mediaStreamRef.current = stream;
      audioBufferRef.current = [];
      recordingStartTimeRef.current = Date.now();
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000
      });
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      processor.onaudioprocess = (e) => {
        if (isRecording && wsRef.current?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          
          // Calculate audio level for visualization
          let sum = 0;
          for (let i = 0; i < inputData.length; i++) {
            sum += Math.abs(inputData[i]);
          }
          setAudioLevel((sum / inputData.length) * 100);
          
          // Store audio data for later
          audioBufferRef.current.push(new Float32Array(inputData));
          
          // Send audio chunks every 100ms to avoid small buffer issues
          const recordingTime = Date.now() - recordingStartTimeRef.current;
          if (recordingTime >= 100 && audioBufferRef.current.length > 0) {
            // Combine all buffered audio
            const totalLength = audioBufferRef.current.reduce((acc, arr) => acc + arr.length, 0);
            const combinedBuffer = new Float32Array(totalLength);
            let offset = 0;
            for (const buffer of audioBufferRef.current) {
              combinedBuffer.set(buffer, offset);
              offset += buffer.length;
            }
            
            // Convert to PCM16 and send
            const pcm16 = float32ToPCM16(combinedBuffer);
            wsRef.current.send(JSON.stringify({
              type: 'audio',
              data: arrayBufferToBase64(pcm16)
            }));
            
            // Clear buffer after sending
            audioBufferRef.current = [];
            recordingStartTimeRef.current = Date.now();
          }
        }
      };
      
      source.connect(processor);
      processor.connect(audioContext.destination);
      
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
    // Send any remaining buffered audio
    if (audioBufferRef.current.length > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
      const totalLength = audioBufferRef.current.reduce((acc, arr) => acc + arr.length, 0);
      const combinedBuffer = new Float32Array(totalLength);
      let offset = 0;
      for (const buffer of audioBufferRef.current) {
        combinedBuffer.set(buffer, offset);
        offset += buffer.length;
      }
      
      const pcm16 = float32ToPCM16(combinedBuffer);
      wsRef.current.send(JSON.stringify({
        type: 'audio',
        data: arrayBufferToBase64(pcm16)
      }));
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsRecording(false);
    setAssistantState('thinking');
    setAudioLevel(0);
    audioBufferRef.current = [];
    
    // Send end of audio signal to commit the buffer
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'audio_end' }));
    }
  };

  // Toggle recording
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Play audio chunk
  const playAudioChunk = async (audioData: string) => {
    try {
      const audioContext = new AudioContext();
      const audioBuffer = base64ToArrayBuffer(audioData);
      const decodedAudio = await audioContext.decodeAudioData(audioBuffer);
      
      const source = audioContext.createBufferSource();
      source.buffer = decodedAudio;
      source.connect(audioContext.destination);
      source.start();
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  // Utility functions
  const float32ToPCM16 = (float32Array: Float32Array): ArrayBuffer => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    
    for (let i = 0; i < float32Array.length; i++) {
      const sample = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    }
    
    return buffer;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
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
      stopRecording();
    };
  }, [connectWebSocket]);

  // Pulse animation for orb
  useEffect(() => {
    const interval = setInterval(() => {
      if (assistantState === 'listening') {
        setPulseScale(1 + (audioLevel / 100) * 0.3);
      } else if (assistantState === 'thinking') {
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
        {/* Animated grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 h-screen flex flex-col">
        {/* Header */}
        <header className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-blue-400" />
              <span className="text-lg font-medium">Financial AI Assistant</span>
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
            title={audioEnabled ? 'Desactivar audio' : 'Activar audio'}
          >
            {audioEnabled ? (
              <Volume2 className="w-5 h-5 text-gray-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </header>

        {/* Main orb area */}
        <div className="flex-1 flex items-center justify-center relative">
          {/* Central orb */}
          <div className="relative">
            {/* Outer rings */}
            <AnimatePresence>
              {assistantState !== 'idle' && (
                <>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: pulseScale * 1.5, opacity: 0.1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="absolute inset-0 w-64 h-64 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2"
                  >
                    <div className="w-full h-full rounded-full border border-blue-400/20"></div>
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: pulseScale * 1.3, opacity: 0.2 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ delay: 0.1 }}
                    className="absolute inset-0 w-56 h-56 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2"
                  >
                    <div className="w-full h-full rounded-full border border-blue-400/30"></div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Main orb button */}
            <motion.button
              onClick={toggleRecording}
              disabled={connectionState !== 'connected'}
              animate={{ scale: pulseScale }}
              whileHover={{ scale: pulseScale * 1.05 }}
              whileTap={{ scale: pulseScale * 0.95 }}
              className={`relative w-48 h-48 rounded-full transition-all duration-300 ${
                assistantState === 'listening' ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-[0_0_100px_rgba(239,68,68,0.5)]' :
                assistantState === 'thinking' ? 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-[0_0_100px_rgba(168,85,247,0.5)]' :
                assistantState === 'speaking' ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-[0_0_100px_rgba(34,197,94,0.5)]' :
                'bg-gradient-to-br from-blue-500 to-blue-600 shadow-[0_0_80px_rgba(59,130,246,0.4)]'
              } ${connectionState !== 'connected' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {/* Inner gradient overlay */}
              <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-white/20 to-transparent"></div>
              
              {/* Icon */}
              <div className="relative z-10 flex items-center justify-center h-full">
                {assistantState === 'listening' ? (
                  <MicOff className="w-16 h-16 text-white" />
                ) : assistantState === 'thinking' ? (
                  <Brain className="w-16 h-16 text-white animate-pulse" />
                ) : assistantState === 'speaking' ? (
                  <Activity className="w-16 h-16 text-white" />
                ) : (
                  <Mic className="w-16 h-16 text-white" />
                )}
              </div>

              {/* Audio level indicator */}
              {assistantState === 'listening' && (
                <div className="absolute inset-0 rounded-full">
                  <svg className="w-full h-full">
                    <circle
                      cx="96"
                      cy="96"
                      r="94"
                      fill="none"
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="2"
                      strokeDasharray={`${audioLevel * 5.9} 590`}
                      className="transition-all duration-100"
                      transform="rotate(-90 96 96)"
                    />
                  </svg>
                </div>
              )}
            </motion.button>

            {/* Status text */}
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={assistantState}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-gray-400"
                >
                  {assistantState === 'idle' && (
                    <p>Toca para hablar</p>
                  )}
                  {assistantState === 'listening' && (
                    <div>
                      <p className="text-red-400">Escuchando...</p>
                      {currentTranscript && (
                        <p className="text-sm mt-2 text-gray-500 max-w-md">{currentTranscript}</p>
                      )}
                    </div>
                  )}
                  {assistantState === 'thinking' && (
                    <div>
                      <p className="text-purple-400">Analizando...</p>
                      {toolsUsed.length > 0 && (
                        <div className="flex items-center gap-2 mt-2 justify-center">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          <span className="text-xs text-gray-500">
                            Consultando: {toolsUsed.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {assistantState === 'speaking' && (
                    <p className="text-green-400">{t('voiceAssistant.responding')}</p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Visualizer bars */}
          {assistantState === 'listening' && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-red-400/50 rounded-full"
                  animate={{
                    height: isRecording ? Math.random() * 40 + 10 : 4,
                  }}
                  transition={{
                    duration: 0.2,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Messages panel (subtle, at the bottom) */}
        <div className="absolute bottom-0 left-0 right-0 max-h-48 overflow-y-auto bg-gradient-to-t from-black/80 to-transparent p-6">
          <AnimatePresence>
            {messages.slice(-3).map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`mb-2 text-sm ${
                  message.type === 'user' ? 'text-blue-400' :
                  message.type === 'assistant' ? 'text-green-400' :
                  'text-gray-500'
                }`}
              >
                <span className="opacity-60">
                  {message.type === 'user' ? '▶ ' : 
                   message.type === 'assistant' ? '◀ ' : '● '}
                </span>
                {message.content}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Keyboard shortcut hint */}
        {connectionState === 'connected' && assistantState === 'idle' && (
          <div className="absolute bottom-6 right-6 text-xs text-gray-600">
            {t('voiceAssistant.pressSpaceToTalk').split('Space').map((part, i) => 
              i === 0 ? <span key={i}>{part}</span> : 
              <span key={i}><kbd className="px-2 py-1 bg-gray-800 rounded">Space</kbd>{part}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceAssistant;