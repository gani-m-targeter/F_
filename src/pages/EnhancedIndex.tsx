import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import EnhancedWebcamCapture from '@/components/EnhancedWebcamCapture';
import TranscriptDisplay from '@/components/TranscriptDisplay';
import CurrentGestureDisplay from '@/components/CurrentGestureDisplay';
import AnimatedBackground from '@/components/AnimatedBackground';
import { useToast } from '@/hooks/use-toast';
import wsService from '@/services/websocket';
import { 
  Video, 
  VideoOff, 
  Volume2, 
  VolumeX,
  Trash2, 
  Sparkles,
  Network,
  Wifi,
  WifiOff,
  BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EnhancedIndex = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentGesture, setCurrentGesture] = useState<string | null>(null);
  const [currentConfidence, setCurrentConfidence] = useState<number>(0);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [refinedSentence, setRefinedSentence] = useState<string | null>(null);
  const [useWebSocket, setUseWebSocket] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isRefining, setIsRefining] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const lastGestureRef = useRef<string | null>(null);
  const gestureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
          // Spacebar: Toggle camera
          e.preventDefault();
          toggleCamera();
          break;
        case 'r':
          // R: Refine sentence
          if (!isRefining && transcript.length > 0) {
            refineSentenceWithAI();
          }
          break;
        case 's':
          // S: Speak transcript
          if (transcript.length > 0) {
            speakTranscript();
          }
          break;
        case 'c':
          // C: Clear transcript
          if (transcript.length > 0) {
            clearAll();
          }
          break;
        case 'a':
          // A: Toggle auto-speak
          setIsAudioEnabled(prev => !prev);
          break;
        case 'w':
          // W: Toggle WebSocket
          if (!isActive) {
            setUseWebSocket(prev => !prev);
          }
          break;
        case '?':
          // Show help
          toast({
            title: "⌨️ Keyboard Shortcuts",
            description: (
              <div className="mt-2 space-y-1 text-sm">
                <div><kbd className="px-2 py-1 bg-slate-700 rounded">Space</kbd> Toggle Camera</div>
                <div><kbd className="px-2 py-1 bg-slate-700 rounded">R</kbd> Refine with AI</div>
                <div><kbd className="px-2 py-1 bg-slate-700 rounded">S</kbd> Speak</div>
                <div><kbd className="px-2 py-1 bg-slate-700 rounded">C</kbd> Clear</div>
                <div><kbd className="px-2 py-1 bg-slate-700 rounded">A</kbd> Toggle Auto-speak</div>
                <div><kbd className="px-2 py-1 bg-slate-700 rounded">W</kbd> Toggle AI Server</div>
                <div><kbd className="px-2 py-1 bg-slate-700 rounded">?</kbd> Show this help</div>
              </div>
            ),
          });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isActive, isRefining, transcript, isAudioEnabled, useWebSocket]);

  const handleGestureDetected = useCallback((gesture: string, confidence: number) => {
    // Only update if it's a different gesture or confidence changed significantly
    if (gesture !== lastGestureRef.current) {
      setCurrentGesture(gesture);
      setCurrentConfidence(confidence);
      lastGestureRef.current = gesture;

      // Clear existing timeout
      if (gestureTimeoutRef.current) {
        clearTimeout(gestureTimeoutRef.current);
      }

      // Add to transcript after a short delay to confirm gesture
      gestureTimeoutRef.current = setTimeout(() => {
        setTranscript(prev => [...prev, gesture]);
        
        // Speak the gesture if audio is enabled
        if (isAudioEnabled && 'speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(gesture);
          utterance.rate = 0.9;
          utterance.pitch = 1;
          window.speechSynthesis.speak(utterance);
        }
      }, 500);
    } else {
      // Update confidence even if same gesture
      setCurrentConfidence(confidence);
    }
  }, [isAudioEnabled]);

  const toggleCamera = async () => {
    if (!isActive) {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        setIsActive(true);
        toast({
          title: "📹 Camera activated",
          description: useWebSocket ? "Connected to AI server for enhanced recognition" : "Using local recognition",
        });
      } catch (error) {
        toast({
          title: "❌ Camera access denied",
          description: "Please allow camera access to use ASL recognition",
          variant: "destructive",
        });
      }
    } else {
      setIsActive(false);
      setCurrentGesture(null);
      setCurrentConfidence(0);
      lastGestureRef.current = null;
      if (gestureTimeoutRef.current) {
        clearTimeout(gestureTimeoutRef.current);
      }
      toast({
        title: "Camera stopped",
        description: "Recognition paused",
      });
    }
  };

  const refineSentenceWithAI = async () => {
    if (transcript.length === 0) {
      toast({
        title: "No transcript",
        description: "Add some signs first to refine into a sentence",
      });
      return;
    }

    setIsRefining(true);
    
    try {
      if (useWebSocket && wsService.isConnected()) {
        // Use backend LLM
        wsService.refineSentence(transcript);
        
        // Listen for response
        const unsubscribe = wsService.onMessage((data) => {
          if (data.type === 'refined_sentence') {
            setRefinedSentence(data.refined);
            setIsRefining(false);
            toast({
              title: "✨ Sentence refined!",
              description: "AI has converted your signs into proper English",
            });
            unsubscribe();
          }
        });
      } else {
        // Simple local refinement
        const refined = transcript.join(' ').toLowerCase()
          .replace(/^./, str => str.toUpperCase());
        setRefinedSentence(refined + '.');
        setIsRefining(false);
        toast({
          title: "Sentence created",
          description: "Basic sentence formatting applied",
        });
      }
    } catch (error) {
      console.error('Refinement error:', error);
      setIsRefining(false);
      toast({
        title: "Refinement failed",
        description: "Could not refine sentence. Try again.",
        variant: "destructive",
      });
    }
  };

  const speakTranscript = () => {
    const textToSpeak = refinedSentence || transcript.join(' ');
    
    if (!textToSpeak) {
      toast({
        title: "Nothing to speak",
        description: "Start signing to create a transcript",
      });
      return;
    }

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
      
      toast({
        title: "🔊 Speaking...",
        description: refinedSentence ? "Reading refined sentence" : `Reading ${transcript.length} signs`,
      });
    } else {
      toast({
        title: "Speech not supported",
        description: "Your browser doesn't support text-to-speech",
        variant: "destructive",
      });
    }
  };

  const clearAll = () => {
    setTranscript([]);
    setRefinedSentence(null);
    setCurrentGesture(null);
    setCurrentConfidence(0);
    lastGestureRef.current = null;
    
    if (useWebSocket && wsService.isConnected()) {
      wsService.clearBuffer();
    }
    
    toast({
      title: "🗑️ Cleared",
      description: "Transcript and refined sentence removed",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />

      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2 mb-8"
        >
          <motion.h1
            className="text-6xl font-bold mb-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              ASL Recognition
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-slate-400 text-xl"
          >
            Real-time American Sign Language to Text & Speech with AI
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-4"
          >
            <button
              onClick={() => {
                toast({
                  title: "⌨️ Keyboard Shortcuts",
                  description: (
                    <div className="mt-2 space-y-1 text-sm">
                      <div><kbd className="px-2 py-1 bg-slate-700 rounded">Space</kbd> Toggle Camera</div>
                      <div><kbd className="px-2 py-1 bg-slate-700 rounded">R</kbd> Refine with AI</div>
                      <div><kbd className="px-2 py-1 bg-slate-700 rounded">S</kbd> Speak</div>
                      <div><kbd className="px-2 py-1 bg-slate-700 rounded">C</kbd> Clear</div>
                      <div><kbd className="px-2 py-1 bg-slate-700 rounded">A</kbd> Toggle Auto-speak</div>
                      <div><kbd className="px-2 py-1 bg-slate-700 rounded">W</kbd> Toggle AI Server</div>
                    </div>
                  ),
                });
              }}
              className="text-sm text-slate-500 hover:text-cyan-400 transition-colors underline underline-offset-4"
            >
              Press ? for keyboard shortcuts
            </button>
            <span className="text-slate-600">•</span>
            <Button
              onClick={() => navigate('/signs')}
              variant="ghost"
              size="sm"
              className="text-sm text-slate-500 hover:text-purple-400 transition-colors"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              View All Signs (90+)
            </Button>
          </motion.div>
        </motion.div>

        {/* Control Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          {/* Main Controls */}
          <div className="flex gap-3">
            <Button
              onClick={toggleCamera}
              size="lg"
              variant={isActive ? "destructive" : "default"}
              className="relative group overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                whileHover={{ scale: 1.05 }}
              />
              <span className="relative z-10 flex items-center gap-2">
                {isActive ? (
                  <>
                    <VideoOff className="h-5 w-5" />
                    Stop Camera
                  </>
                ) : (
                  <>
                    <Video className="h-5 w-5" />
                    Start Camera
                  </>
                )}
              </span>
            </Button>

            <Button
              onClick={refineSentenceWithAI}
              size="lg"
              variant="secondary"
              disabled={transcript.length === 0 || isRefining}
              className="group relative overflow-hidden hover:scale-105 transition-all duration-300"
            >
              <Sparkles className="mr-2 h-5 w-5 group-hover:animate-pulse" />
              {isRefining ? 'Refining...' : 'Refine with AI'}
            </Button>

            <Button
              onClick={speakTranscript}
              size="lg"
              variant="outline"
              disabled={transcript.length === 0}
              className="hover:scale-105 transition-all duration-300 border-slate-700 hover:border-cyan-500"
            >
              {isAudioEnabled ? (
                <Volume2 className="mr-2 h-5 w-5" />
              ) : (
                <VolumeX className="mr-2 h-5 w-5" />
              )}
              Speak
            </Button>

            <Button
              onClick={clearAll}
              size="lg"
              variant="outline"
              disabled={transcript.length === 0}
              className="hover:scale-105 transition-all duration-300 border-slate-700 hover:border-red-500"
            >
              <Trash2 className="mr-2 h-5 w-5" />
              Clear
            </Button>
          </div>

          {/* Settings */}
          <div className="flex items-center gap-6 px-6 py-3 bg-slate-900/50 backdrop-blur-xl rounded-full border border-slate-700/50">
            <div className="flex items-center space-x-2">
              <Switch
                id="websocket"
                checked={useWebSocket}
                onCheckedChange={setUseWebSocket}
                disabled={isActive}
              />
              <Label htmlFor="websocket" className="flex items-center gap-2 cursor-pointer text-slate-300">
                {useWebSocket ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-slate-500" />
                )}
                <span className="text-sm">AI Server</span>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="audio"
                checked={isAudioEnabled}
                onCheckedChange={setIsAudioEnabled}
              />
              <Label htmlFor="audio" className="flex items-center gap-2 cursor-pointer text-slate-300">
                {isAudioEnabled ? (
                  <Volume2 className="h-4 w-4 text-cyan-500" />
                ) : (
                  <VolumeX className="h-4 w-4 text-slate-500" />
                )}
                <span className="text-sm">Auto-speak</span>
              </Label>
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Feed */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2"
          >
            <div className="h-[600px]">
              <EnhancedWebcamCapture
                onGestureDetected={handleGestureDetected}
                isActive={isActive}
                useWebSocket={useWebSocket}
              />
            </div>
          </motion.div>

          {/* Right Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-6"
          >
            {/* Current Gesture */}
            <Card className="bg-gradient-to-br from-slate-900/40 to-slate-800/40 backdrop-blur-xl border-slate-700/50 h-[280px] overflow-hidden">
              <CurrentGestureDisplay 
                gesture={currentGesture} 
                confidence={currentConfidence}
              />
            </Card>

            {/* Transcript */}
            <div className="h-[300px]">
              <TranscriptDisplay 
                transcript={transcript}
                refinedSentence={refinedSentence}
              />
            </div>
          </motion.div>
        </div>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8"
        >
          <Card className="p-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-xl border-cyan-500/30 hover:border-cyan-500/50 transition-all duration-300 group cursor-pointer">
            <motion.div whileHover={{ scale: 1.05 }} className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-cyan-500/50 transition-all">
                <Network className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg text-white">Real-time Detection</h3>
              <p className="text-sm text-slate-400">
                Hand gestures are recognized instantly using MediaPipe AI with up to 95% accuracy
              </p>
            </motion.div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 group cursor-pointer">
            <motion.div whileHover={{ scale: 1.05 }} className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-purple-500/50 transition-all">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg text-white">AI Refinement</h3>
              <p className="text-sm text-slate-400">
                Convert raw ASL signs into grammatically correct English sentences using LLM
              </p>
            </motion.div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl border-green-500/30 hover:border-green-500/50 transition-all duration-300 group cursor-pointer">
            <motion.div whileHover={{ scale: 1.05 }} className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-green-500/50 transition-all">
                <Volume2 className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg text-white">Speech Output</h3>
              <p className="text-sm text-slate-400">
                Text-to-speech reads recognized signs aloud automatically in natural voice
              </p>
            </motion.div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default EnhancedIndex;

