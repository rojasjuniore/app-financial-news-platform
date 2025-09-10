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
  Square,
  Pause,
  Play
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

const VoiceAssistantContinuous: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  
  // State management
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [assistantState, setAssistantState] = useState<AssistantState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [conversationActive, setConversationActive] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [toolsUsed, setToolsUsed] = useState<string[]>([]);
  
  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Animation values
  const [pulseScale, setPulseScale] = useState(1);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // WebSocket connection for continuous conversation
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    setConnectionState('connecting');
    
    const userId = user?.uid || 'anonymous';
    const wsUrl = process.env.NODE_ENV === 'production' 
      ? `wss://your-api.com/api/voice/realtime?userId=${userId}`
      : `ws://localhost:3001/api/voice/realtime?userId=${userId}`;
    
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      console.log('✅ Connected to voice service');
      setConnectionState('connected');
      
      // Ensure WebSocket is ready before sending
      setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          // Send initialization WITHOUT continuous mode (only on button press)
          wsRef.current.send(JSON.stringify({
            type: 'init',
            userId: user?.uid || 'anonymous',
            config: {
              model: 'gpt-4o-realtime',
              voice: 'alloy',
              language: i18n.language, // Use current language
              mode: 'manual', // Manual mode - only start on button press
              vad: false // Disable auto Voice Activity Detection
            }
          }));
          
          // Connection established message (greeting will come from server)
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'system',
            content: t('voiceAssistantContinuous.connectedToService'),
            timestamp: new Date()
          }]);
        }
      }, 100);
    };
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleServerMessage(data);
    };
    
    wsRef.current.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      setConnectionState('error');
      toast.error(t('voiceAssistantContinuous.connectionError'));
    };
    
    wsRef.current.onclose = () => {
      setConnectionState('disconnected');
      setAssistantState('idle');
      setConversationActive(false);
      
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
        // Server connected with greeting message
        console.log('Server connected:', data.message);
        if (data.message) {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'assistant',
            content: data.message,
            timestamp: new Date()
          }]);
        }
        break;
        
      case 'ready':
        // Server is ready, greeting will come soon
        console.log('Server ready for conversation');
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
        setCurrentTranscript('');
        break;
        
      case 'audio':
        console.log('🎵 Audio chunk received in frontend, length:', data.audio ? data.audio.length : 0);
        if (audioEnabled) {
          console.log('🔊 Playing audio chunk...');
          playAudioChunk(data.audio);
        } else {
          console.log('🔇 Audio disabled, skipping playback');
        }
        break;
        
      case 'speech_started':
        setAssistantState('listening');
        break;
        
      case 'speech_stopped':
        if (conversationActive) {
          setAssistantState('idle');
        }
        break;
        
      case 'error':
        toast.error(data.message);
        setAssistantState('idle');
        break;
    }
  };

  // Start continuous conversation with WebRTC
  const startContinuousConversation = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000
        }
      });

      // Create WebRTC peer connection for real-time audio
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      pcRef.current = pc;

      // Add audio track
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer to server to establish WebRTC connection
      wsRef.current?.send(JSON.stringify({
        type: 'webrtc_offer',
        offer: offer.sdp
      }));

      // Wait for answer
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          wsRef.current?.send(JSON.stringify({
            type: 'webrtc_ice',
            candidate: event.candidate
          }));
        }
      };

      setConversationActive(true);
      setAssistantState('listening');
      
      // Add visual feedback
      toast.success(t('voiceAssistantContinuous.conversationStarted'));
      
    } catch (error) {
      console.error('Failed to start conversation:', error);
      toast.error('No se pudo acceder al micrófono');
    }
  };

  // Alternative: Use MediaRecorder for continuous streaming
  const startContinuousStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000,
          channelCount: 1
        }
      });

      // Create audio context for visualization
      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;
      source.connect(analyzer);

      // Visualize audio levels
      const updateLevels = () => {
        if (!conversationActive) return;
        
        const dataArray = new Uint8Array(analyzer.frequencyBinCount);
        analyzer.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average / 255 * 100);
        
        requestAnimationFrame(updateLevels);
      };
      updateLevels();

      // First set conversation as active
      setConversationActive(true);
      setAssistantState('listening');
      
      // Use ScriptProcessor to capture and convert audio to PCM16
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      streamRef.current = stream;
      
      // Buffer for audio accumulation
      let audioBuffer: Float32Array[] = [];
      let lastSendTime = Date.now();
      let isActive = true; // Local flag for the closure
      
      processor.onaudioprocess = (e) => {
        if (!isActive || wsRef.current?.readyState !== WebSocket.OPEN) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Store audio data
        audioBuffer.push(new Float32Array(inputData));
        
        // Send accumulated audio every 100ms
        const now = Date.now();
        if (now - lastSendTime >= 100 && audioBuffer.length > 0) {
          // Combine all buffered audio
          const totalLength = audioBuffer.reduce((acc, arr) => acc + arr.length, 0);
          const combined = new Float32Array(totalLength);
          let offset = 0;
          for (const buffer of audioBuffer) {
            combined.set(buffer, offset);
            offset += buffer.length;
          }
          
          // Convert Float32 to PCM16
          const pcm16Buffer = new ArrayBuffer(combined.length * 2);
          const pcm16View = new DataView(pcm16Buffer);
          for (let i = 0; i < combined.length; i++) {
            const sample = Math.max(-1, Math.min(1, combined[i]));
            pcm16View.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
          }
          
          // Convert to base64
          const bytes = new Uint8Array(pcm16Buffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64Audio = btoa(binary);
          
          // Send to server
          if (base64Audio && base64Audio.length > 0) {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                type: 'audio_continuous',
                data: base64Audio
              }));
            }
          } else {
            console.warn('⚠️ Attempted to send empty audio data');
          }
          
          // Clear buffer
          audioBuffer = [];
          lastSendTime = now;
        }
      };
      
      // Connect audio nodes after everything is set up
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      // Wait a moment before sending start signal to ensure audio is ready
      setTimeout(() => {
        // Send start signal - this will trigger the greeting and enable VAD
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ 
            type: 'conversation_start',
            continuous: true,
            enableVAD: true // Enable Voice Activity Detection now
          }));
          console.log('🎤 Conversation start signal sent');
        } else {
          console.warn('⚠️ WebSocket not ready for conversation start');
        }
      }, 1000);
      
      // Don't show toast, the greeting will be spoken
      
    } catch (error) {
      console.error('Failed to start continuous stream:', error);
      toast.error(t('voiceAssistantContinuous.couldNotStart'));
    }
  };

  // Stop conversation
  const stopConversation = () => {
    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Disconnect processor
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    // Close peer connection if using WebRTC
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setConversationActive(false);
    setAssistantState('idle');
    setAudioLevel(0);
    
    // Send stop signal only if WebSocket is open
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ 
        type: 'conversation_end' 
      }));
    }
    
    toast.success(t('voiceAssistantContinuous.conversationEnded'));
  };

  // Toggle conversation
  const toggleConversation = () => {
    if (conversationActive) {
      stopConversation();
    } else {
      // Use MediaRecorder approach for now (simpler)
      startContinuousStream();
    }
  };

  // Play audio with proper PCM16 handling
  const playAudioChunk = async (audioData: string) => {
    console.log('🎵 Adding audio to queue, length:', audioData ? audioData.length : 0);
    audioQueueRef.current.push(audioData);
    
    if (!isPlayingRef.current) {
      console.log('🎬 Starting audio playback queue');
      processAudioQueue();
    }
  };
  
  const processAudioQueue = async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setAssistantState(conversationActive ? 'listening' : 'idle');
      return;
    }
    
    isPlayingRef.current = true;
    setAssistantState('speaking');
    const audioData = audioQueueRef.current.shift()!;
    
    try {
      const audioContext = new AudioContext({ sampleRate: 24000 });
      const arrayBuffer = base64ToArrayBuffer(audioData);
      
      // Convert PCM16 to Float32
      const pcm16 = new Int16Array(arrayBuffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0;
      }
      
      // Create and play audio buffer
      const audioBuffer = audioContext.createBuffer(1, float32.length, 24000);
      audioBuffer.copyToChannel(float32, 0);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      source.onended = () => {
        processAudioQueue();
      };
      
      source.start();
    } catch (error) {
      console.error('Error playing audio:', error);
      processAudioQueue();
    }
  };

  // Utility function
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
      // Cleanup on unmount
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      // Stop conversation if active
      if (conversationActive) {
        if (pcRef.current) {
          pcRef.current.close();
          pcRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
      }
      // Close WebSocket connection
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  // Pulse animation
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
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 h-screen flex flex-col">
        {/* Header */}
        <header className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-blue-400" />
              <span className="text-lg font-medium">AI Financial Assistant</span>
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
            
            {/* Conversation status */}
            {conversationActive && (
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-800/30 rounded-full">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                <span className="text-xs text-purple-400">Conversación activa</span>
              </div>
            )}
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
          <div className="relative">
            {/* Outer rings */}
            <AnimatePresence>
              {(assistantState !== 'idle' || conversationActive) && (
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
              onClick={toggleConversation}
              disabled={connectionState !== 'connected'}
              animate={{ scale: pulseScale }}
              whileHover={{ scale: pulseScale * 1.05 }}
              whileTap={{ scale: pulseScale * 0.95 }}
              className={`relative w-48 h-48 rounded-full transition-all duration-300 ${
                conversationActive && assistantState === 'listening' ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-[0_0_100px_rgba(239,68,68,0.5)]' :
                assistantState === 'thinking' ? 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-[0_0_100px_rgba(168,85,247,0.5)]' :
                assistantState === 'speaking' ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-[0_0_100px_rgba(34,197,94,0.5)]' :
                'bg-gradient-to-br from-blue-500 to-blue-600 shadow-[0_0_80px_rgba(59,130,246,0.4)]'
              } ${connectionState !== 'connected' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-white/20 to-transparent"></div>
              
              <div className="relative z-10 flex items-center justify-center h-full">
                {conversationActive ? (
                  <Pause className="w-16 h-16 text-white" />
                ) : (
                  <Play className="w-16 h-16 text-white" />
                )}
              </div>

              {/* Audio level indicator */}
              {conversationActive && (
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
                  key={`${assistantState}-${conversationActive}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-gray-400"
                >
                  {!conversationActive && (
                    <div>
                      <p className="text-blue-400 font-medium">{t('voiceAssistantContinuous.pressToStart')}</p>
                      <p className="text-xs text-gray-500 mt-1">{t('voiceAssistantContinuous.assistantWillGreet')}</p>
                    </div>
                  )}
                  {conversationActive && assistantState === 'listening' && (
                    <div>
                      <p className="text-red-400">{t('voiceAssistantContinuous.listeningSpeak')}</p>
                      {currentTranscript && (
                        <p className="text-sm mt-2 text-gray-500 max-w-md">{currentTranscript}</p>
                      )}
                    </div>
                  )}
                  {conversationActive && assistantState === 'thinking' && (
                    <div>
                      <p className="text-purple-400">{t('voiceAssistantContinuous.processing')}</p>
                      {toolsUsed.length > 0 && (
                        <div className="flex items-center gap-2 mt-2 justify-center">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          <span className="text-xs text-gray-500">
                            {t('voiceAssistantContinuous.consulting')}: {toolsUsed.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {conversationActive && assistantState === 'speaking' && (
                    <p className="text-green-400">{t('voiceAssistantContinuous.responding')}</p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Visualizer */}
          {conversationActive && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {[...Array(7)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-full"
                  animate={{
                    height: audioLevel > 5 ? (audioLevel * 0.6) + (Math.sin(Date.now() / 100 + i) * 10) : 4,
                  }}
                  transition={{
                    duration: 0.1,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Messages panel */}
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

        {/* Instructions */}
        {connectionState === 'connected' && !conversationActive && (
          <div className="absolute bottom-6 right-6 text-xs text-gray-600">
            {t('voiceAssistantContinuous.pressToStartInstructions')}
          </div>
        )}
        
        {conversationActive && (
          <div className="absolute bottom-6 right-6 text-xs text-purple-400">
            {t('voiceAssistantContinuous.pressToStop')}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceAssistantContinuous;