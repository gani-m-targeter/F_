import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import WebcamCapture from '@/components/WebcamCapture';
import TranscriptDisplay from '@/components/TranscriptDisplay';
import CurrentGestureDisplay from '@/components/CurrentGestureDisplay';
import { useToast } from '@/hooks/use-toast';
import { Video, VideoOff, Volume2, Trash2 } from 'lucide-react';

const Index = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentGesture, setCurrentGesture] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string[]>([]);
  const { toast } = useToast();
  const lastGestureRef = useRef<string | null>(null);
  const gestureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleGestureDetected = useCallback((gesture: string) => {
    // Only update if it's a different gesture
    if (gesture !== lastGestureRef.current) {
      setCurrentGesture(gesture);
      lastGestureRef.current = gesture;

      // Clear existing timeout
      if (gestureTimeoutRef.current) {
        clearTimeout(gestureTimeoutRef.current);
      }

      // Add to transcript after a short delay to confirm gesture
      gestureTimeoutRef.current = setTimeout(() => {
        setTranscript(prev => [...prev, gesture]);
        
        // Speak the gesture
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(gesture);
          utterance.rate = 0.9;
          utterance.pitch = 1;
          window.speechSynthesis.speak(utterance);
        }
      }, 500);
    }
  }, []);

  const toggleCamera = async () => {
    if (!isActive) {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        setIsActive(true);
        toast({
          title: "Camera activated",
          description: "Start signing to see real-time recognition",
        });
      } catch (error) {
        toast({
          title: "Camera access denied",
          description: "Please allow camera access to use ASL recognition",
          variant: "destructive",
        });
      }
    } else {
      setIsActive(false);
      setCurrentGesture(null);
      lastGestureRef.current = null;
      if (gestureTimeoutRef.current) {
        clearTimeout(gestureTimeoutRef.current);
      }
    }
  };

  const speakTranscript = () => {
    if (transcript.length === 0) {
      toast({
        title: "No transcript",
        description: "Start signing to create a transcript",
      });
      return;
    }

    if ('speechSynthesis' in window) {
      const text = transcript.join(' ');
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
      
      toast({
        title: "Speaking transcript",
        description: `Reading ${transcript.length} signs`,
      });
    } else {
      toast({
        title: "Speech not supported",
        description: "Your browser doesn't support text-to-speech",
        variant: "destructive",
      });
    }
  };

  const clearTranscript = () => {
    setTranscript([]);
    setCurrentGesture(null);
    lastGestureRef.current = null;
    toast({
      title: "Transcript cleared",
      description: "Ready for new signs",
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            ASL Recognition
          </h1>
          <p className="text-muted-foreground text-lg">
            Real-time American Sign Language to Text & Speech
          </p>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={toggleCamera}
            size="lg"
            variant={isActive ? "destructive" : "default"}
            className="transition-all duration-300"
          >
            {isActive ? (
              <>
                <VideoOff className="mr-2 h-5 w-5" />
                Stop Camera
              </>
            ) : (
              <>
                <Video className="mr-2 h-5 w-5" />
                Start Camera
              </>
            )}
          </Button>
          
          <Button
            onClick={speakTranscript}
            size="lg"
            variant="secondary"
            disabled={transcript.length === 0}
            className="transition-all duration-300"
          >
            <Volume2 className="mr-2 h-5 w-5" />
            Speak Transcript
          </Button>

          <Button
            onClick={clearTranscript}
            size="lg"
            variant="outline"
            disabled={transcript.length === 0}
            className="transition-all duration-300"
          >
            <Trash2 className="mr-2 h-5 w-5" />
            Clear
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Feed */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden bg-card border-border h-[600px]">
              <WebcamCapture
                onGestureDetected={handleGestureDetected}
                isActive={isActive}
              />
            </Card>
          </div>

          {/* Right Panel */}
          <div className="space-y-6">
            {/* Current Gesture */}
            <Card className="bg-card border-border h-[280px]">
              <CurrentGestureDisplay gesture={currentGesture} />
            </Card>

            {/* Transcript */}
            <div className="h-[300px]">
              <TranscriptDisplay transcript={transcript} />
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Card className="p-6 bg-card border-border">
            <h3 className="font-semibold text-lg mb-2 text-foreground">Real-time Detection</h3>
            <p className="text-sm text-muted-foreground">
              Hand gestures are recognized instantly using MediaPipe AI
            </p>
          </Card>
          
          <Card className="p-6 bg-card border-border">
            <h3 className="font-semibold text-lg mb-2 text-foreground">Text Conversion</h3>
            <p className="text-sm text-muted-foreground">
              ASL signs are converted to text and displayed in the transcript
            </p>
          </Card>
          
          <Card className="p-6 bg-card border-border">
            <h3 className="font-semibold text-lg mb-2 text-foreground">Speech Output</h3>
            <p className="text-sm text-muted-foreground">
              Text-to-speech reads recognized signs aloud automatically
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
