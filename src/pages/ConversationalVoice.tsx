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
  Search
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

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

const ConversationalVoice: React.FC = () => {
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
  
  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConversationActiveRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    const userId = user?.uid || 'anonymous';
    const wsUrl = `ws://localhost:3005/api/voice/chat?userId=${userId}`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('✅ Connected to conversational voice service');
        setConnectionStatus('connected');
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
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };
      
      wsRef.current.onclose = () => {
        setConnectionStatus('connecting');
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
      };
    } catch (error) {
      console.error('Connection error:', error);
      setConnectionStatus('error');
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
        // Process tool results and update display
        processToolResult(data.tool, data.result);
        break;
        
      case 'response':
        setResponse(data.text);
        setIsProcessing(false);
        
        // Determine what to display based on response
        analyzeResponseForDisplay(data.text);
        break;
        
      case 'audio':
        if (audioEnabled) {
          playAudio(data.data);
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
          const marketData: MarketData = {
            ticker: result.ticker,
            price: result.web?.price || result.database?.price || 0,
            change: result.web?.change || 0,
            changePercent: result.web?.changePercent || 0,
            volume: result.database?.volume,
            marketCap: result.database?.marketCap
          };
          
          setContext(prev => ({
            ...prev,
            lastTicker: result.ticker,
            marketData: [marketData]
          }));
          
          setDisplayMode('market');
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
      toast.success('Conversación iniciada. Puedes hablar cuando quieras.');
      
      // Setup continuous recording with voice activity detection
      startContinuousRecording(stream);
      
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('No se pudo acceder al micrófono');
    }
  };
  
  // Continuous recording with silence detection
  const startContinuousRecording = (stream: MediaStream) => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(2048, 1, 1);
    
    analyser.smoothingTimeConstant = 0.8;
    analyser.fftSize = 1024;
    
    microphone.connect(analyser);
    analyser.connect(processor);
    processor.connect(audioContext.destination);
    
    let silenceStart = Date.now();
    let speechStart: number | null = null;
    let mediaRecorder: MediaRecorder | null = null;
    
    processorRef.current = processor;
    audioContextRef.current = audioContext;
    
    processor.onaudioprocess = () => {
      if (!isConversationActiveRef.current) return;
      
      const array = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(array);
      const average = array.reduce((a, b) => a + b) / array.length;
      
      // Voice activity detection
      if (average > 20) { // Speaking detected
        if (!speechStart) {
          speechStart = Date.now();
          silenceStart = Date.now();
          
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
        if (speechStart && Date.now() - silenceStart > 1500) { // 1.5 seconds of silence
          if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            setIsListening(false);
          }
          speechStart = null;
        }
      }
    };
    
    // Store the media recorder reference at the end
    if (!mediaRecorderRef.current) {
      mediaRecorderRef.current = mediaRecorder;
    }
  };
  
  // Stop conversation
  const stopConversation = () => {
    setIsConversationActive(false);
    isConversationActiveRef.current = false;
    
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
    toast.success('Conversación finalizada');
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
            format: 'webm'
          }));
        }
      };
      reader.readAsDataURL(audioBlob);
    }
  };
  
  // Play audio response
  const playAudio = async (audioBase64: string) => {
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
      
      audio.onended = () => URL.revokeObjectURL(audioUrl);
      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
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
    };
  }, [connectWebSocket]);
  
  // Render market data
  const renderMarketData = () => {
    if (!context.marketData || context.marketData.length === 0) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Datos del Mercado
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {context.marketData.map((data, idx) => (
            <div key={idx} className="bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-2xl font-bold">{data.ticker}</h4>
                <div className={`flex items-center gap-1 ${data.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {data.changePercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="font-semibold">{data.changePercent.toFixed(2)}%</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Precio</span>
                  <span className="text-xl font-bold">${data.price.toFixed(2)}</span>
                </div>
                {data.volume && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Volumen</span>
                    <span>{(data.volume / 1000000).toFixed(2)}M</span>
                  </div>
                )}
                {data.marketCap && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cap. Mercado</span>
                    <span>${(data.marketCap / 1000000000).toFixed(2)}B</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  };
  
  // Render news articles
  const renderNews = () => {
    if (!context.news || context.news.length === 0) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Noticias Recientes
        </h3>
        <div className="space-y-4">
          {context.news.slice(0, 5).map((article, idx) => (
            <div key={idx} className="bg-gray-700 rounded-lg p-4">
              <h4 className="font-semibold mb-2">{article.title}</h4>
              <p className="text-sm text-gray-400 mb-3">{article.summary}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{article.source}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    article.sentiment.score > 0.1 ? 'bg-green-900 text-green-300' :
                    article.sentiment.score < -0.1 ? 'bg-red-900 text-red-300' :
                    'bg-gray-600 text-gray-300'
                  }`}>
                    {article.sentiment.score > 0.1 ? 'Positivo' :
                     article.sentiment.score < -0.1 ? 'Negativo' : 'Neutral'}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(article.publishedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  };
  
  // Render sentiment analysis
  const renderAnalysis = () => {
    if (!context.analysis) return null;
    
    const { sentiment } = context.analysis;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Análisis de Sentimiento
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="font-semibold mb-3">Sentimiento General</h4>
            <div className={`text-3xl font-bold ${
              sentiment.overall === 'positive' ? 'text-green-400' :
              sentiment.overall === 'negative' ? 'text-red-400' :
              'text-yellow-400'
            }`}>
              {sentiment.overall === 'positive' ? '📈 Positivo' :
               sentiment.overall === 'negative' ? '📉 Negativo' :
               '➡️ Neutral'}
            </div>
            <div className="mt-2 text-sm text-gray-400">
              Confianza: {sentiment.confidence}
            </div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="font-semibold mb-3">Distribución</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-green-400">Positivo</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-green-400 h-2 rounded-full"
                      style={{ width: `${sentiment.distribution.positive}%` }}
                    />
                  </div>
                  <span className="text-sm">{sentiment.distribution.positive}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-red-400">Negativo</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-red-400 h-2 rounded-full"
                      style={{ width: `${sentiment.distribution.negative}%` }}
                    />
                  </div>
                  <span className="text-sm">{sentiment.distribution.negative}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-yellow-400">Neutral</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${sentiment.distribution.neutral}%` }}
                    />
                  </div>
                  <span className="text-sm">{sentiment.distribution.neutral}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-400">
          Basado en {context.analysis.sources} fuentes analizadas
        </div>
      </motion.div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl font-bold">Asistente Financiero Conversacional</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-900' :
              connectionStatus === 'error' ? 'bg-red-900' :
              'bg-yellow-900'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-400' :
                connectionStatus === 'error' ? 'bg-red-400' :
                'bg-yellow-400 animate-pulse'
              }`} />
              <span className="text-xs">
                {connectionStatus === 'connected' ? 'Conectado' :
                 connectionStatus === 'error' ? 'Error' : 'Conectando...'}
              </span>
            </div>
            
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Conversation Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Display Area */}
            <AnimatePresence mode="wait">
              {displayMode === 'market' && renderMarketData()}
              {displayMode === 'news' && renderNews()}
              {displayMode === 'analysis' && renderAnalysis()}
              {displayMode === 'conversation' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-gray-800 rounded-xl p-6 min-h-[400px] flex items-center justify-center"
                >
                  <div className="text-center">
                    <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">
                      Pregúntame sobre mercados, acciones o noticias financieras
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Voice Control */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-center">
                {!isConversationActive ? (
                  <button
                    onClick={startConversation}
                    disabled={connectionStatus !== 'connected'}
                    className={`relative px-8 py-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(59,130,246,0.3)] ${
                      connectionStatus !== 'connected' ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Mic className="w-6 h-6 text-white" />
                      <span className="text-lg font-semibold">Iniciar Conversación</span>
                    </div>
                  </button>
                ) : (
                  <div className="text-center">
                    <div className={`relative w-32 h-32 rounded-full mx-auto mb-4 ${
                      isListening ? 'bg-red-500 shadow-[0_0_50px_rgba(239,68,68,0.5)] animate-pulse' :
                      isProcessing ? 'bg-purple-500 shadow-[0_0_50px_rgba(168,85,247,0.5)] animate-pulse' :
                      'bg-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]'
                    }`}>
                      <div className="flex items-center justify-center h-full">
                        {isListening ? (
                          <Activity className="w-12 h-12 text-white animate-pulse" />
                        ) : isProcessing ? (
                          <Brain className="w-12 h-12 text-white animate-pulse" />
                        ) : (
                          <Mic className="w-12 h-12 text-white" />
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={stopConversation}
                      className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
                    >
                      Finalizar Conversación
                    </button>
                  </div>
                )}
              </div>
              
              <div className="mt-4 text-center">
                {isConversationActive && (
                  <div>
                    {isListening && (
                      <p className="text-red-400 animate-pulse">🎤 Escuchando...</p>
                    )}
                    {isProcessing && (
                      <p className="text-purple-400">🧠 Procesando...</p>
                    )}
                    {!isListening && !isProcessing && (
                      <p className="text-green-400">✅ Habla cuando quieras</p>
                    )}
                  </div>
                )}
                {!isConversationActive && (
                  <p className="text-gray-400">Presiona el botón para comenzar</p>
                )}
              </div>
              
              {transcript && (
                <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-300">📝 {transcript}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Response Panel */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Respuesta del Asistente</h3>
              {response ? (
                <div className="text-gray-300 whitespace-pre-line">
                  {response}
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  Las respuestas aparecerán aquí...
                </p>
              )}
            </div>
            
            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDisplayMode('market')}
                  className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <BarChart3 className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs">Mercado</span>
                </button>
                <button
                  onClick={() => setDisplayMode('news')}
                  className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <Globe className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs">Noticias</span>
                </button>
                <button
                  onClick={() => setDisplayMode('analysis')}
                  className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <Brain className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs">Análisis</span>
                </button>
                <button
                  onClick={() => setDisplayMode('chart')}
                  className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <LineChart className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs">Gráficos</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationalVoice;