import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff,
  Volume2,
  VolumeX,
  Brain,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  AlertCircle,
  CheckCircle,
  Globe,
  Database,
  Search,
  Zap,
  Radio,
  Cpu,
  Network,
  Waves,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { IndicatorsWidget } from '../components/TechnicalIndicators';
import TradingViewWidget from '../components/TradingWidget/TradingViewWidget';
import PreciousMetalsWidget from '../components/TradingWidget/PreciousMetalsWidget';

// Types
interface MarketData {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  high?: number;
  low?: number;
}

interface NewsArticle {
  title: string;
  summary: string;
  sentiment: {
    score: number;
    label: string;
  };
  source: string;
  publishedAt: string;
  url?: string;
}

interface AnalysisResult {
  sentiment: {
    overall: string;
    distribution: {
      positive: number;
      negative: number;
      neutral: number;
    };
    confidence: string;
  };
  sources: number;
}

interface ConversationContext {
  lastTicker?: string;
  lastTopic?: string;
  marketData?: MarketData[];
  news?: NewsArticle[];
  analysis?: AnalysisResult;
}

type DisplayMode = 'conversation' | 'market' | 'news' | 'analysis' | 'chart';

const FuturisticVoice: React.FC = () => {
  const { user } = useAuth();
  
  // State
  const [isConversationActive, setIsConversationActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('conversation');
  const [context, setContext] = useState<ConversationContext>({});
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [voiceWaveform, setVoiceWaveform] = useState<number[]>(Array(20).fill(0));
  const [pulseIntensity, setPulseIntensity] = useState(0);
  const [selectedVoice, setSelectedVoice] = useState<'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'>('shimmer'); // Shimmer es más clara
  const [selectedLanguage, setSelectedLanguage] = useState<'es' | 'en'>('es'); // Español por defecto
  const [compactMode, setCompactMode] = useState(false); // Modo compacto sin scroll
  const [showArticlePanel, setShowArticlePanel] = useState(false); // Panel de artículos
  const [showTechnicalAnalysis, setShowTechnicalAnalysis] = useState(false); // Mostrar análisis técnico
  const [analysisSymbol, setAnalysisSymbol] = useState('AAPL'); // Símbolo para análisis
  const [analysisType, setAnalysisType] = useState<'indicators' | 'chart' | 'forex'>('indicators'); // Tipo de análisis
  
  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConversationActiveRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const hasReceivedResponseRef = useRef(false);
  
  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || 
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }
    
    const userId = user?.uid || 'anonymous';
    const wsUrl = `ws://localhost:3005/api/voice/chat?userId=${userId}&language=${selectedLanguage}`;
    
    console.log('🔌 Attempting WebSocket connection to:', wsUrl);
    
    try {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('✅ Connected to conversational voice service');
        setConnectionStatus('connected');
        // Clear any pending reconnection
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleServerMessage(data);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnectionStatus('error');
      };
      
      wsRef.current.onclose = (event) => {
        console.log(`🔌 WebSocket closed: Code ${event.code}, Reason: ${event.reason}`);
        setConnectionStatus('connecting');
        
        // Only reconnect if not a normal closure
        if (event.code !== 1000 && event.code !== 1001) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Attempting to reconnect...');
            connectWebSocket();
          }, 3000);
        }
      };
    } catch (error) {
      console.error('❌ Connection error:', error);
      setConnectionStatus('error');
      // Try to reconnect after error
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 3000);
    }
  }, [user]);
  
  // Handle server messages
  const handleServerMessage = (data: any) => {
    switch (data.type) {
      case 'connected':
        console.log('Voice service ready');
        break;
        
      case 'transcription':
        setTranscript(data.text);
        setIsProcessing(true);
        break;
        
      case 'tool_result':
        processToolResult(data.tool, data.result);
        break;
        
      case 'response':
        // Filter out noise responses about Amara/subtitles
        if (!data.text.toLowerCase().includes('amara') && 
            !data.text.toLowerCase().includes('subtítulo')) {
          setResponse(data.text);
          analyzeResponseForDisplay(data.text);
        }
        setIsProcessing(false);
        hasReceivedResponseRef.current = true;
        break;
        
      case 'audio':
        console.log('🔊 Received audio from server');
        // Always play audio responses (not just greeting)
        if (audioEnabled && data.data) {
          console.log('🎵 Playing audio response...');
          playAudio(data.data);
        }
        
        // Auto-activate listening after assistant finishes speaking (for fluid conversation)
        if (isConversationActiveRef.current) {
          setTimeout(() => {
            // The continuous recording is already active, just reset the state
            setIsListening(false);
            setIsProcessing(false);
          }, 100);
        }
        break;
        
      case 'error':
        toast.error(data.message);
        setIsProcessing(false);
        break;
    }
  };
  
  // Process tool results to update context
  const processToolResult = (tool: string, result: any) => {
    switch (tool) {
      case 'get_market_data':
        if (result.ticker) {
          console.log('📊 Market data received:', result);
          const marketData: MarketData = {
            ticker: result.ticker,
            price: result.price || result.web?.price || result.database?.price || 0,
            change: result.change || result.web?.change || 0,
            changePercent: result.changePercent || result.web?.changePercent || 0,
            volume: result.volume || result.database?.volume,
            marketCap: result.marketCap || result.database?.marketCap,
            high: result.high,
            low: result.low
          };
          
          setContext(prev => ({
            ...prev,
            lastTicker: result.ticker,
            marketData: [marketData]
          }));
          
          setDisplayMode('market');
        }
        break;
        
      case 'get_technical_indicators':
        if (result.ticker) {
          console.log('📈 Technical indicators received:', result);
          setAnalysisSymbol(result.ticker);
          setAnalysisType('indicators');
          setShowTechnicalAnalysis(true);
          setDisplayMode('analysis');
        }
        break;
        
      case 'get_forex_rate':
      case 'get_forex_analysis':
        if (result.pair) {
          console.log('💱 Forex data received:', result);
          // Extract symbol from pair (e.g., XAU/USD -> XAU)
          const symbol = result.pair.split('/')[0];
          if (symbol === 'XAU' || symbol === 'XAG') {
            setAnalysisSymbol(symbol === 'XAU' ? 'TVC:GOLD' : 'TVC:SILVER');
            setAnalysisType('forex');
          } else {
            setAnalysisSymbol(`FX_IDC:${symbol}${result.pair.split('/')[1]}`);
            setAnalysisType('chart');
          }
          setShowTechnicalAnalysis(true);
          setDisplayMode('analysis');
        }
        break;
        
      case 'search_database':
      case 'search_web':
        if (result.articles || result.results) {
          const articles = (result.articles || result.results || []).map((item: any) => ({
            title: item.title,
            summary: item.summary || item.snippet || item.description,
            sentiment: item.sentiment || { score: 0, label: 'neutral' },
            source: item.source || 'Web',
            publishedAt: item.publishedAt || new Date().toISOString(),
            url: item.url
          }));
          
          setContext(prev => ({
            ...prev,
            news: articles
          }));
          
          setDisplayMode('news');
        }
        break;
        
      case 'analyze_sentiment':
        if (result.sentiment) {
          setContext(prev => ({
            ...prev,
            analysis: result
          }));
          
          setDisplayMode('analysis');
        }
        break;
    }
  };
  
  // Analyze response to determine display mode
  const analyzeResponseForDisplay = (text: string) => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('precio') || lowerText.includes('cotiza') || lowerText.includes('valor')) {
      setDisplayMode('market');
    } else if (lowerText.includes('noticia') || lowerText.includes('última') || lowerText.includes('información')) {
      setDisplayMode('news');
    } else if (lowerText.includes('sentimiento') || lowerText.includes('análisis') || lowerText.includes('tendencia')) {
      setDisplayMode('analysis');
    } else if (lowerText.includes('gráfico') || lowerText.includes('chart')) {
      setDisplayMode('chart');
    }
  };
  
  // Start continuous conversation
  const startConversation = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      setIsConversationActive(true);
      isConversationActiveRef.current = true;
      streamRef.current = stream;
      toast.success('Sistema de voz neural activado');
      
      // Send welcome greeting immediately
      setTimeout(() => {
        const greetings = selectedLanguage === 'es' ? [
          "¡Hola! ¿Qué acción o noticia financiera te interesa?",
          "¡Bienvenido! ¿Qué quieres saber del mercado?",
          "Sistema listo. ¿En qué puedo ayudarte?",
          "¡Hola! Dime qué necesitas analizar.",
          "Asistente activo. ¿Qué buscas hoy?"
        ] : [
          "Hello! What stock or financial news interests you?",
          "Welcome! What do you want to know about the market?",
          "System ready. How can I help you?",
          "Hi! Tell me what you need to analyze.",
          "Assistant active. What are you looking for today?"
        ];
        
        const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
        setResponse(randomGreeting);
        
        // Play greeting audio if enabled (only once)
        if (audioEnabled && wsRef.current?.readyState === WebSocket.OPEN) {
          // Generate TTS for greeting
          const generateGreetingAudio = async () => {
            try {
              const response = await fetch('http://localhost:3005/api/voice/test-tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  text: randomGreeting,
                  voice: selectedVoice
                })
              });
              
              if (response.ok) {
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                
                // Store reference
                currentAudioRef.current = audio;
                
                audio.onended = () => {
                  URL.revokeObjectURL(audioUrl);
                  if (currentAudioRef.current === audio) {
                    currentAudioRef.current = null;
                  }
                };
                
                await audio.play();
              }
            } catch (error) {
              console.error('Error generating greeting audio:', error);
            }
          };
          
          generateGreetingAudio();
        }
      }, 200); // Minimal delay, más rápido
      
      startContinuousRecording(stream);
      
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('No se pudo acceder al micrófono');
    }
  };
  
  // Continuous recording with silence detection and visualization
  const startContinuousRecording = (stream: MediaStream) => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(2048, 1, 1);
    
    analyser.smoothingTimeConstant = 0.3; // Más responsivo
    analyser.fftSize = 512; // Procesamiento más rápido
    
    microphone.connect(analyser);
    analyser.connect(processor);
    processor.connect(audioContext.destination);
    
    analyserRef.current = analyser;
    
    let silenceStart = Date.now();
    let speechStart: number | null = null;
    let mediaRecorder: MediaRecorder | null = null;
    
    processorRef.current = processor;
    audioContextRef.current = audioContext;
    
    // Visualize waveform
    const visualize = () => {
      if (!analyserRef.current) return;
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Create waveform visualization
      const waveform = [];
      const step = Math.floor(dataArray.length / 20);
      for (let i = 0; i < 20; i++) {
        const value = dataArray[i * step] / 255;
        waveform.push(value);
      }
      setVoiceWaveform(waveform);
      
      // Calculate average for intensity
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setPulseIntensity(average / 255);
      
      if (isConversationActiveRef.current) {
        animationFrameRef.current = requestAnimationFrame(visualize);
      }
    };
    visualize();
    
    processor.onaudioprocess = () => {
      if (!isConversationActiveRef.current) return;
      
      const array = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(array);
      const average = array.reduce((a, b) => a + b) / array.length;
      
      // Voice activity detection - ajustado para evitar ruido de fondo
      if (average > 25) { // Speaking detected (umbral más alto para evitar ruido)
        if (!speechStart) {
          speechStart = Date.now();
          silenceStart = Date.now();
          
          // Stop any currently playing audio when user starts speaking
          if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current = null;
          }
          
          // Start recording
          if (!mediaRecorder || mediaRecorder.state === 'inactive') {
            mediaRecorder = new MediaRecorder(stream, {
              mimeType: 'audio/webm;codecs=opus'
            });
            
            audioChunksRef.current = [];
            
            mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
              }
            };
            
            mediaRecorder.onstop = async () => {
              if (audioChunksRef.current.length > 0) {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                sendAudioToServer(audioBlob);
              }
            };
            
            mediaRecorder.start();
            setIsListening(true);
          }
        }
        silenceStart = Date.now();
      } else { // Silence detected
        if (speechStart && Date.now() - silenceStart > 800) { // 0.8 seconds of silence (más rápido)
          if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            setIsListening(false);
          }
          speechStart = null;
        }
      }
    };
    
    if (!mediaRecorderRef.current) {
      mediaRecorderRef.current = mediaRecorder;
    }
  };
  
  // Stop conversation
  const stopConversation = () => {
    setIsConversationActive(false);
    isConversationActiveRef.current = false;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    setIsListening(false);
    setVoiceWaveform(Array(20).fill(0));
    toast.success('Sistema neural desactivado');
  };
  
  // Send audio to server
  const sendAudioToServer = (audioBlob: Blob) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result?.toString().split(',')[1];
        if (base64) {
          wsRef.current?.send(JSON.stringify({
            type: 'audio',
            data: base64,
            format: 'webm',
            voice: selectedVoice, // Include selected voice
            language: selectedLanguage // Include selected language
          }));
        }
      };
      reader.readAsDataURL(audioBlob);
    }
  };

  // Manual voice control functions
  const startListening = () => {
    if (!isConversationActive) {
      startConversation();
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };
  
  // Play audio response
  const playAudio = async (audioBase64: string) => {
    try {
      // Stop any currently playing audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      
      const audioData = atob(audioBase64);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(arrayBuffer);
      
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }
      
      const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // Store reference to current audio
      currentAudioRef.current = audio;
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        if (currentAudioRef.current === audio) {
          currentAudioRef.current = null;
        }
      };
      
      // Handle audio errors
      audio.onerror = () => {
        console.error('Audio playback error');
        if (currentAudioRef.current === audio) {
          currentAudioRef.current = null;
        }
      };
      
      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      currentAudioRef.current = null;
    }
  };
  
  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [connectWebSocket]);
  
  // Render holographic market data
  const renderMarketData = () => {
    if (!context.marketData || context.marketData.length === 0) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 blur-3xl" />
        <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              MARKET DATA STREAM
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {context.marketData.map((data, idx) => (
              <motion.div 
                key={idx} 
                className="relative group"
                whileHover={{ scale: 1.02 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-xl group-hover:blur-2xl transition-all" />
                <div className="relative bg-black/60 backdrop-blur border border-blue-500/30 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                      <h4 className="text-2xl font-bold text-white">{data.ticker}</h4>
                    </div>
                    <div className={`flex items-center gap-1 ${data.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {data.changePercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span className="font-mono font-bold">{data.changePercent.toFixed(2)}%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-cyan-400/60 text-xs uppercase tracking-wider">Price</span>
                      <span className="text-xl font-mono font-bold text-white">${data.price.toFixed(2)}</span>
                    </div>
                    {data.volume && (
                      <div className="flex justify-between items-center">
                        <span className="text-cyan-400/60 text-xs uppercase tracking-wider">Volume</span>
                        <span className="font-mono text-cyan-300">{(data.volume / 1000000).toFixed(2)}M</span>
                      </div>
                    )}
                    <div className="mt-3 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full opacity-50" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  };
  
  // Render holographic news
  const renderNews = () => {
    if (!context.news || context.news.length === 0) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 blur-3xl" />
        <div className="relative bg-black/40 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-purple-400 animate-spin-slow" />
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              NEURAL NEWS FEED
            </h3>
          </div>
          <div className="space-y-3">
            {context.news.slice(0, 5).map((article, idx) => (
              <motion.div 
                key={idx} 
                className="relative"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent rounded-lg" />
                <div className="relative bg-black/50 backdrop-blur border border-purple-500/20 rounded-lg p-4 hover:border-purple-500/40 transition-all">
                  <h4 className="font-semibold text-white mb-2">{article.title}</h4>
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">{article.summary}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-purple-400">{article.source}</span>
                      <div className={`text-xs px-2 py-1 rounded-full border ${
                        article.sentiment.score > 0.1 ? 'bg-green-500/20 border-green-500/50 text-green-400' :
                        article.sentiment.score < -0.1 ? 'bg-red-500/20 border-red-500/50 text-red-400' :
                        'bg-gray-500/20 border-gray-500/50 text-gray-400'
                      }`}>
                        {article.sentiment.score > 0.1 ? '↑ BULLISH' :
                         article.sentiment.score < -0.1 ? '↓ BEARISH' : '→ NEUTRAL'}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(article.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  };
  
  // Render futuristic analysis
  const renderAnalysis = () => {
    // Si se solicitó análisis técnico, mostrarlo en lugar del análisis de sentimiento
    if (showTechnicalAnalysis) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative h-[calc(100vh-120px)] max-h-[800px]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 blur-3xl" />
          <div className="relative bg-black/40 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-4 h-full flex flex-col">
            {/* Header with close button */}
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
                  ANÁLISIS TÉCNICO - {analysisSymbol}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowTechnicalAnalysis(false);
                  setDisplayMode('conversation');
                }}
                className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Analysis Type Selector */}
            <div className="flex gap-2 mb-3 flex-shrink-0">
              <button
                onClick={() => setAnalysisType('indicators')}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  analysisType === 'indicators'
                    ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                    : 'bg-black/30 text-gray-400 border border-gray-600/30 hover:border-purple-500/30'
                }`}
              >
                📊 Indicadores
              </button>
              <button
                onClick={() => setAnalysisType('chart')}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  analysisType === 'chart'
                    ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                    : 'bg-black/30 text-gray-400 border border-gray-600/30 hover:border-blue-500/30'
                }`}
              >
                📈 Gráfico
              </button>
              {(analysisSymbol.includes('GOLD') || analysisSymbol.includes('SILVER')) && (
                <button
                  onClick={() => setAnalysisType('forex')}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    analysisType === 'forex'
                      ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50'
                      : 'bg-black/30 text-gray-400 border border-gray-600/30 hover:border-yellow-500/30'
                  }`}
                >
                  🥇 Metales
                </button>
              )}
            </div>

            {/* Analysis Content - Optimized for single screen view */}
            <div className="flex-1 min-h-0">
              {analysisType === 'indicators' && (
                <div className="h-full overflow-auto">
                  <IndicatorsWidget 
                    ticker={analysisSymbol.replace('TVC:', '').replace('FX_IDC:', '')}
                    onTickerChange={(newTicker) => setAnalysisSymbol(newTicker)}
                  />
                </div>
              )}
              
              {analysisType === 'chart' && (
                <div className="h-full">
                  <TradingViewWidget
                    symbol={analysisSymbol}
                    height="100%"
                    theme="Dark"
                    style="candles"
                    studies={['RSI', 'MACD', 'BB']}
                    locale={selectedLanguage}
                  />
                </div>
              )}
              
              {analysisType === 'forex' && (
                <div className="h-full">
                  <PreciousMetalsWidget
                    symbol={analysisSymbol}
                    height="100%"
                    theme="Dark"
                    locale={selectedLanguage}
                    showAnalysis={true}
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      );
    }
    
    // Análisis de sentimiento original
    if (!context.analysis) return null;
    
    const { sentiment } = context.analysis;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-yellow-500/10 blur-3xl" />
        <div className="relative bg-black/40 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Brain className="w-5 h-5 text-green-400" />
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-yellow-500">
              SENTIMENT ANALYSIS ENGINE
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-transparent rounded-xl blur-xl" />
              <div className="relative bg-black/60 backdrop-blur border border-green-500/30 rounded-xl p-4">
                <h4 className="font-semibold text-green-400 mb-3">OVERALL SENTIMENT</h4>
                <div className={`text-4xl font-bold mb-2 ${
                  sentiment.overall === 'positive' ? 'text-green-400' :
                  sentiment.overall === 'negative' ? 'text-red-400' :
                  'text-yellow-400'
                }`}>
                  {sentiment.overall === 'positive' ? '▲' :
                   sentiment.overall === 'negative' ? '▼' :
                   '■'} {sentiment.overall.toUpperCase()}
                </div>
                <div className="text-sm text-gray-400 font-mono">
                  CONFIDENCE: {sentiment.confidence}
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-transparent rounded-xl blur-xl" />
              <div className="relative bg-black/60 backdrop-blur border border-yellow-500/30 rounded-xl p-4">
                <h4 className="font-semibold text-yellow-400 mb-3">DISTRIBUTION</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-green-400 text-xs w-16">POS</span>
                    <div className="flex-1 h-2 bg-black/50 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-green-500 to-green-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${sentiment.distribution.positive}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                    <span className="text-green-400 font-mono text-sm w-12 text-right">{sentiment.distribution.positive}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-red-400 text-xs w-16">NEG</span>
                    <div className="flex-1 h-2 bg-black/50 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-red-500 to-red-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${sentiment.distribution.negative}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                      />
                    </div>
                    <span className="text-red-400 font-mono text-sm w-12 text-right">{sentiment.distribution.negative}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-yellow-400 text-xs w-16">NEU</span>
                    <div className="flex-1 h-2 bg-black/50 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${sentiment.distribution.neutral}%` }}
                        transition={{ duration: 1, delay: 0.4 }}
                      />
                    </div>
                    <span className="text-yellow-400 font-mono text-sm w-12 text-right">{sentiment.distribution.neutral}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <span className="text-xs text-gray-500 font-mono uppercase tracking-wider">
              Analyzed {context.analysis.sources} data sources
            </span>
          </div>
        </div>
      </motion.div>
    );
  };
  
  return (
    <div className={`${compactMode ? 'h-screen overflow-hidden' : 'min-h-screen'} bg-black text-white ${compactMode ? 'overflow-hidden' : 'overflow-hidden'} relative`}>
      {/* Animated background with gradients */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />
        <div className="absolute inset-0">
          {/* Animated grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
        </div>
        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
              }}
              animate={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
              }}
              transition={{
                duration: 20 + Math.random() * 10,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                boxShadow: '0 0 10px rgba(0,255,255,0.5)'
              }}
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 h-screen flex flex-col">
        {/* Futuristic Header */}
        <header className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-50" />
                <div className="relative flex items-center gap-3 px-4 py-2 bg-black/50 backdrop-blur-xl border border-cyan-500/30 rounded-full">
                  <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
                  <span className="text-sm font-mono text-cyan-300">NEURAL VOICE INTERFACE v2.0</span>
                </div>
              </div>
              
              {/* Connection status */}
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border backdrop-blur-xl ${
                connectionStatus === 'connected' ? 'bg-green-500/10 border-green-500/30' :
                connectionStatus === 'error' ? 'bg-red-500/10 border-red-500/30' :
                'bg-yellow-500/10 border-yellow-500/30'
              }`}>
                <Network className={`w-3 h-3 ${
                  connectionStatus === 'connected' ? 'text-green-400' :
                  connectionStatus === 'error' ? 'text-red-400' :
                  'text-yellow-400 animate-pulse'
                }`} />
                <span className="text-xs font-mono uppercase">
                  {connectionStatus === 'connected' ? 'ONLINE' :
                   connectionStatus === 'error' ? 'ERROR' : 'SYNCING'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Language Selector */}
              <div className="relative group">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-purple-400" />
                  <select
                    value={selectedLanguage}
                    onChange={(e) => {
                      const newLanguage = e.target.value as 'es' | 'en';
                      setSelectedLanguage(newLanguage);
                      
                      // If conversation is active, reconnect WebSocket with new language
                      if (isConversationActive && wsRef.current?.readyState === WebSocket.OPEN) {
                        console.log(`🌍 Language changed to ${newLanguage}, reconnecting WebSocket...`);
                        wsRef.current.close();
                        setTimeout(() => connectWebSocket(), 100);
                      }
                      
                      // Send language update to server if connected
                      if (wsRef.current?.readyState === WebSocket.OPEN) {
                        wsRef.current.send(JSON.stringify({
                          type: 'language_update',
                          language: newLanguage
                        }));
                      }
                    }}
                    className="px-3 py-1.5 bg-black/50 backdrop-blur-xl border border-purple-500/30 rounded-lg hover:border-purple-500/50 transition-all text-xs font-mono text-purple-400 appearance-none pr-8 cursor-pointer"
                    title="Selecciona el idioma"
                  >
                    <option value="es">🇪🇸 Español</option>
                    <option value="en">🇺🇸 English</option>
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Voice Selector */}
              <div className="relative group">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value as any)}
                    className="px-3 py-1.5 bg-black/50 backdrop-blur-xl border border-cyan-500/30 rounded-lg hover:border-cyan-500/50 transition-all text-xs font-mono text-cyan-400 appearance-none pr-8 cursor-pointer"
                    title="Selecciona la voz del asistente"
                  >
                    <option value="shimmer">✨ {selectedLanguage === 'es' ? 'Shimmer - Clara' : 'Shimmer - Clear'}</option>
                    <option value="nova">🌟 {selectedLanguage === 'es' ? 'Nova - Suave' : 'Nova - Smooth'}</option>
                    <option value="alloy">🤖 {selectedLanguage === 'es' ? 'Alloy - Neutral' : 'Alloy - Neutral'}</option>
                    <option value="echo">🎯 {selectedLanguage === 'es' ? 'Echo - Masculina' : 'Echo - Male'}</option>
                    <option value="fable">🎭 {selectedLanguage === 'es' ? 'Fable - Expresiva' : 'Fable - Expressive'}</option>
                    <option value="onyx">🎸 {selectedLanguage === 'es' ? 'Onyx - Profunda' : 'Onyx - Deep'}</option>
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {/* Voice indicator tooltip */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 px-2 py-1 rounded text-xs text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {selectedLanguage === 'es' ? 'Voz' : 'Voice'}: {selectedVoice.charAt(0).toUpperCase() + selectedVoice.slice(1)}
                </div>
              </div>
              
              {/* Compact Mode Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCompactMode(!compactMode)}
                className={`p-2 backdrop-blur-xl border rounded-lg transition-all ${
                  compactMode 
                    ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' 
                    : 'bg-black/50 border-gray-700/50 hover:border-yellow-500/50 text-gray-400'
                }`}
                title={compactMode ? 'Salir modo compacto' : 'Modo compacto sin scroll'}
              >
                {compactMode ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </motion.button>
              
              {/* Article Panel Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowArticlePanel(!showArticlePanel)}
                className={`p-2 backdrop-blur-xl border rounded-lg transition-all ${
                  showArticlePanel 
                    ? 'bg-green-500/20 border-green-500/50 text-green-400' 
                    : 'bg-black/50 border-gray-700/50 hover:border-green-500/50 text-gray-400'
                }`}
                title={showArticlePanel ? 'Ocultar artículos' : 'Mostrar artículos para resumir'}
              >
                {showArticlePanel ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </motion.button>

              {/* Audio Toggle */}
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className="p-2 bg-black/50 backdrop-blur-xl border border-gray-700/50 rounded-lg hover:border-cyan-500/50 transition-all"
              >
                {audioEnabled ? <Volume2 className="w-5 h-5 text-cyan-400" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
              </button>
            </div>
          </div>
        </header>
        
        {/* Main Content Area */}
        <div className={`flex-1 px-6 pb-6 ${compactMode ? 'overflow-hidden' : 'overflow-y-auto'} ${compactMode ? 'grid grid-cols-12 gap-4' : ''}`}>
          {compactMode ? (
            <>
              {/* Articles Panel - Compact Mode */}
              {showArticlePanel && (
                <div className="col-span-4 h-full">
                  <div className="bg-black/40 backdrop-blur-xl border border-green-500/30 rounded-xl p-4 h-full overflow-y-auto">
                    <div className="flex items-center gap-2 mb-4">
                      <Search className="w-5 h-5 text-green-400" />
                      <h3 className="text-lg font-semibold text-white">Artículos</h3>
                      <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full">
                        Click para resumir
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {/* Mock articles for testing */}
                      {[
                        {
                          id: 1,
                          title: "El oro alcanza nuevos máximos históricos",
                          source: "Expansión",
                          date: "2024-01-15",
                          url: "https://expansion.com/oro-maximo-historico"
                        },
                        {
                          id: 2,
                          title: "Bitcoin supera los $50,000 tras aprobación ETF",
                          source: "Bolsamanía",
                          date: "2024-01-15", 
                          url: "https://bolsamania.com/bitcoin-etf"
                        },
                        {
                          id: 3,
                          title: "Las acciones de Tesla suben 15% tras resultados",
                          source: "Financial Times",
                          date: "2024-01-14",
                          url: "https://ft.com/tesla-resultados"
                        }
                      ].map((article) => (
                        <motion.div
                          key={article.id}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => {
                            // Trigger article summary via voice
                            if (wsRef.current?.readyState === WebSocket.OPEN) {
                              setTranscript(`Resume el artículo "${article.title}"`);
                              wsRef.current.send(JSON.stringify({
                                type: 'voice_query',
                                query: `Resume el artículo "${article.title}" de ${article.source}`,
                                articleUrl: article.url,
                                language: selectedLanguage
                              }));
                            }
                          }}
                          className="p-3 bg-black/30 border border-green-500/20 rounded-lg hover:border-green-500/40 cursor-pointer transition-all"
                        >
                          <h4 className="text-sm font-medium text-white mb-1 line-clamp-2">
                            {article.title}
                          </h4>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-green-400">{article.source}</span>
                            <span className="text-gray-400">{article.date}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Main Voice Interface - Compact Mode */}
              <div className={`${showArticlePanel ? 'col-span-8' : 'col-span-12'} h-full flex flex-col`}>
                <div className="bg-black/40 backdrop-blur-xl border border-blue-500/30 rounded-xl p-6 h-full flex flex-col">
                  {/* Compact Voice Controls */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 blur-xl opacity-30" />
                        <Radio className="w-12 h-12 text-blue-400 relative animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Control por Voz</h3>
                        <p className="text-sm text-gray-400">
                          {isListening ? '🎤 Escuchando...' : 'Presiona para hablar'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Quick Commands */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setTranscript('¿Cuáles son las últimas noticias?');
                          if (wsRef.current?.readyState === WebSocket.OPEN) {
                            wsRef.current.send(JSON.stringify({
                              type: 'voice_query',
                              query: '¿Cuáles son las últimas noticias?',
                              language: selectedLanguage
                            }));
                          }
                        }}
                        className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg text-xs text-purple-300 hover:bg-purple-500/30 transition-all"
                      >
                        📰 Noticias
                      </button>
                      <button
                        onClick={() => {
                          setTranscript('¿Cuál es el precio del oro?');
                          if (wsRef.current?.readyState === WebSocket.OPEN) {
                            wsRef.current.send(JSON.stringify({
                              type: 'voice_query',
                              query: '¿Cuál es el precio del oro?',
                              language: selectedLanguage
                            }));
                          }
                        }}
                        className="px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-xs text-yellow-300 hover:bg-yellow-500/30 transition-all"
                      >
                        🥇 Oro
                      </button>
                      <button
                        onClick={() => {
                          setTranscript('Analiza Apple técnicamente');
                          if (wsRef.current?.readyState === WebSocket.OPEN) {
                            wsRef.current.send(JSON.stringify({
                              type: 'voice_query',
                              query: 'Dame los indicadores técnicos de AAPL',
                              language: selectedLanguage
                            }));
                          }
                        }}
                        className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg text-xs text-blue-300 hover:bg-blue-500/30 transition-all"
                      >
                        📊 Análisis
                      </button>
                      <button
                        onClick={() => {
                          setTranscript('Gráfico de Tesla');
                          if (wsRef.current?.readyState === WebSocket.OPEN) {
                            wsRef.current.send(JSON.stringify({
                              type: 'voice_query',
                              query: 'Muestra el gráfico de TSLA con indicadores',
                              language: selectedLanguage
                            }));
                          }
                        }}
                        className="px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-lg text-xs text-green-300 hover:bg-green-500/30 transition-all"
                      >
                        📈 Gráfico
                      </button>
                    </div>
                  </div>

                  {/* Transcript Display */}
                  {transcript && (
                    <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="text-sm text-blue-300">
                        <strong>Tu consulta:</strong> {transcript}
                      </div>
                    </div>
                  )}

                  {/* Response Display */}
                  <div className="flex-1 overflow-y-auto">
                    {response ? (
                      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <div className="text-white whitespace-pre-wrap text-sm">
                          {response}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400 text-center">
                        <div>
                          <Brain className="w-16 h-16 mx-auto mb-4 text-purple-400 animate-pulse" />
                          <p className="text-sm">
                            Sistema listo para consultas financieras
                          </p>
                          <p className="text-xs mt-2">
                            Di "resume este artículo" o haz click en un artículo
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Voice Button - Bottom */}
                  <div className="mt-4 text-center">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onMouseDown={startListening}
                      onMouseUp={stopListening}
                      onMouseLeave={stopListening}
                      onTouchStart={startListening}
                      onTouchEnd={stopListening}
                      className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all ${
                        isListening
                          ? 'bg-red-500/20 border-red-500 shadow-red-500/50 shadow-lg'
                          : 'bg-blue-500/20 border-blue-500 hover:bg-blue-500/30'
                      }`}
                    >
                      <Mic className={`w-8 h-8 ${isListening ? 'text-red-400' : 'text-blue-400'}`} />
                    </motion.button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="max-w-6xl mx-auto space-y-6">
            {/* Display Area */}
            <AnimatePresence mode="wait">
              {displayMode === 'market' && renderMarketData()}
              {displayMode === 'news' && renderNews()}
              {displayMode === 'analysis' && renderAnalysis()}
              {displayMode === 'conversation' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-3xl" />
                  <div className="relative bg-black/40 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-12 min-h-[400px] flex items-center justify-center">
                    <div className="text-center">
                      <div className="relative inline-block mb-6">
                        <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-30" />
                        <Radio className="w-20 h-20 text-blue-400 relative animate-pulse" />
                      </div>
                      <p className="text-gray-400 font-mono text-sm uppercase tracking-wider">
                        Neural System Ready • Ask About Markets • Get Real-Time Data
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Voice Control Center */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 blur-3xl" />
              <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-8">
                <div className="flex flex-col items-center">
                  {!isConversationActive ? (
                    <motion.button
                      onClick={startConversation}
                      disabled={connectionStatus !== 'connected'}
                      className="relative group"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
                      <div className={`relative px-8 py-4 bg-black/50 backdrop-blur-xl border-2 border-cyan-500/50 rounded-full ${
                        connectionStatus !== 'connected' ? 'opacity-50 cursor-not-allowed' : 'hover:border-cyan-400 transition-all'
                      }`}>
                        <div className="flex items-center gap-3">
                          <Zap className="w-6 h-6 text-cyan-400" />
                          <span className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                            ACTIVATE NEURAL VOICE
                          </span>
                        </div>
                      </div>
                    </motion.button>
                  ) : (
                    <div className="text-center w-full">
                      {/* Central orb with waveform */}
                      <div className="relative w-48 h-48 mx-auto mb-6">
                        {/* Outer rings */}
                        <motion.div
                          className="absolute inset-0 rounded-full border border-cyan-500/20"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0.2, 0.5]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        <motion.div
                          className="absolute inset-0 rounded-full border border-purple-500/20"
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.5, 0.2, 0.5]
                          }}
                          transition={{
                            duration: 2,
                            delay: 0.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        
                        {/* Central orb */}
                        <div className={`absolute inset-4 rounded-full transition-all duration-300 ${
                          isListening ? 'bg-gradient-to-br from-red-500 to-orange-500 shadow-[0_0_60px_rgba(239,68,68,0.6)]' :
                          isProcessing ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_0_60px_rgba(168,85,247,0.6)]' :
                          'bg-gradient-to-br from-cyan-500 to-blue-500 shadow-[0_0_40px_rgba(6,182,212,0.4)]'
                        }`}>
                          {/* Waveform visualization */}
                          <div className="absolute inset-0 flex items-center justify-center gap-1">
                            {voiceWaveform.map((value, index) => (
                              <motion.div
                                key={index}
                                className="w-1 bg-white/80 rounded-full"
                                animate={{
                                  height: `${Math.max(8, value * 60)}px`
                                }}
                                transition={{
                                  duration: 0.1,
                                  ease: "easeOut"
                                }}
                              />
                            ))}
                          </div>
                          
                          {/* Center icon */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            {isListening ? (
                              <Waves className="w-12 h-12 text-white/20" />
                            ) : isProcessing ? (
                              <Brain className="w-12 h-12 text-white/20 animate-pulse" />
                            ) : (
                              <Mic className="w-12 h-12 text-white/20" />
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <motion.button
                        onClick={stopConversation}
                        className="px-6 py-2 bg-red-500/20 backdrop-blur-xl border border-red-500/50 rounded-full hover:bg-red-500/30 transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="text-red-400 font-mono text-sm uppercase">Terminate Session</span>
                      </motion.button>
                    </div>
                  )}
                </div>
                
                {/* Status display */}
                <div className="mt-6 text-center">
                  {isConversationActive && (
                    <div className="font-mono text-sm">
                      {isListening && (
                        <span className="text-red-400 animate-pulse">● RECORDING AUDIO STREAM</span>
                      )}
                      {isProcessing && (
                        <span className="text-purple-400">◆ PROCESSING NEURAL DATA</span>
                      )}
                      {!isListening && !isProcessing && (
                        <span className="text-cyan-400">▶ SYSTEM ACTIVE - SPEAK NOW</span>
                      )}
                    </div>
                  )}
                  {!isConversationActive && (
                    <p className="text-gray-500 font-mono text-xs uppercase tracking-wider">
                      Press to initialize neural voice system
                    </p>
                  )}
                </div>
                
                {/* Transcript display */}
                {transcript && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-black/50 backdrop-blur border border-cyan-500/20 rounded-lg"
                  >
                    <div className="flex items-start gap-2">
                      <Activity className="w-4 h-4 text-cyan-400 mt-1" />
                      <p className="text-sm text-cyan-300 font-mono">{transcript}</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
            
            {/* Response display */}
            {response && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 blur-3xl" />
                <div className="relative bg-black/40 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6">
                  <div className="flex items-start gap-3">
                    <Brain className="w-5 h-5 text-purple-400 mt-1" />
                    <div>
                      <h3 className="text-sm font-mono text-purple-400 mb-2 uppercase tracking-wider">Neural Response</h3>
                      <p className="text-gray-300 whitespace-pre-line">{response}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Quick Actions Grid */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { mode: 'market' as DisplayMode, icon: BarChart3, label: 'MARKET', color: 'cyan' },
                { mode: 'news' as DisplayMode, icon: Globe, label: 'NEWS', color: 'purple' },
                { mode: 'analysis' as DisplayMode, icon: Brain, label: 'ANALYSIS', color: 'green' },
                { mode: 'chart' as DisplayMode, icon: LineChart, label: 'CHARTS', color: 'yellow' }
              ].map((action) => (
                <motion.button
                  key={action.mode}
                  onClick={() => setDisplayMode(action.mode)}
                  className={`relative group p-4 bg-black/40 backdrop-blur-xl border rounded-xl transition-all ${
                    displayMode === action.mode 
                      ? `border-${action.color}-500/50 bg-${action.color}-500/10` 
                      : 'border-gray-700/50 hover:border-gray-600/50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r from-${action.color}-500/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <action.icon className={`w-6 h-6 mx-auto mb-2 ${
                    displayMode === action.mode ? `text-${action.color}-400` : 'text-gray-400'
                  }`} />
                  <span className={`text-xs font-mono uppercase tracking-wider ${
                    displayMode === action.mode ? `text-${action.color}-400` : 'text-gray-500'
                  }`}>
                    {action.label}
                  </span>
                </motion.button>
              ))}
            </div>
            </div>
          )}

          {/* Voice Control Button - Always show in normal mode */}
          {!compactMode && (
            <div className="text-center">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onMouseDown={startListening}
                onMouseUp={stopListening}
                onMouseLeave={stopListening}
                onTouchStart={startListening}
                onTouchEnd={stopListening}
                className={`relative w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-red-500/20 border-red-500 shadow-red-500/50 shadow-2xl animate-pulse'
                    : 'bg-blue-500/20 border-blue-500 hover:bg-blue-500/30 shadow-blue-500/30 shadow-lg'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full blur-md" />
                <Mic className={`w-10 h-10 relative z-10 ${isListening ? 'text-red-400' : 'text-blue-400'}`} />
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FuturisticVoice;