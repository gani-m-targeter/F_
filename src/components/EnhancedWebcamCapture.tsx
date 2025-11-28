import { useEffect, useRef, useState, memo } from 'react';
import { Holistic, Results as HolisticResults } from '@mediapipe/holistic';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { 
  HAND_CONNECTIONS, 
  FACEMESH_TESSELATION,
  POSE_CONNECTIONS 
} from '@mediapipe/holistic';
import { motion } from 'framer-motion';
import wsService from '@/services/websocket';

interface EnhancedWebcamCaptureProps {
  onGestureDetected: (gesture: string, confidence: number) => void;
  isActive: boolean;
  useWebSocket?: boolean;
}

const EnhancedWebcamCapture = memo(({ 
  onGestureDetected, 
  isActive,
  useWebSocket = false
}: EnhancedWebcamCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const holisticRef = useRef<Holistic | null>(null);
  const cameraRef = useRef<Camera | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const initializeMediaPipe = async () => {
      try {
        // Use Holistic for hand + face + pose detection
        const holistic = new Holistic({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
          },
        });

        // Optimized settings for SPEED - reduced lag
        holistic.setOptions({
          modelComplexity: 0,  // Lite model for fastest speed
          smoothLandmarks: false,  // Disable for less lag
          enableSegmentation: false,
          smoothSegmentation: false,
          refineFaceLandmarks: false,  // Disable for speed
          minDetectionConfidence: 0.4,
          minTrackingConfidence: 0.4,
        });

        holistic.onResults(onResults);
        holisticRef.current = holistic;

        if (videoRef.current) {
          const camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && holisticRef.current) {
                await holisticRef.current.send({ image: videoRef.current });
              }
            },
            width: 640,  // Reduced for less lag
            height: 480,
          });
          
          await camera.start();
          cameraRef.current = camera;
          setIsLoading(false);
        }

        // Connect to WebSocket if enabled
        if (useWebSocket) {
          try {
            await wsService.connect();
            setWsConnected(true);
            
            // Listen for predictions
            wsService.onMessage((data) => {
              if (data.type === 'prediction' && data.gesture) {
                onGestureDetected(data.gesture, data.confidence);
              }
            });
          } catch (err) {
            console.error('WebSocket connection failed:', err);
            setWsConnected(false);
          }
        }
      } catch (err) {
        setError('Failed to initialize camera. Please check permissions.');
        console.error(err);
        setIsLoading(false);
      }
    };

    initializeMediaPipe();

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (holisticRef.current) {
        holisticRef.current.close();
      }
      if (useWebSocket) {
        wsService.disconnect();
        setWsConnected(false);
      }
    };
  }, [isActive, useWebSocket]);

  const onResults = (results: HolisticResults) => {
    if (!canvasRef.current) return;

    const canvasCtx = canvasRef.current.getContext('2d');
    if (!canvasCtx) return;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

    // Draw face mesh (subtle, for context)
    if (results.faceLandmarks) {
      drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_TESSELATION, {
        color: '#4ade80',
        lineWidth: 0.5,
      });
    }

    // Draw pose (optional, for body context)
    if (results.poseLandmarks) {
      drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
        color: '#f59e0b',
        lineWidth: 2,
      });
      drawLandmarks(canvasCtx, results.poseLandmarks, {
        color: '#fb923c',
        lineWidth: 1,
        radius: 2,
      });
    }

    // Draw hands (primary focus)
    if (results.leftHandLandmarks) {
      drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS, {
        color: '#06b6d4',
        lineWidth: 3,
      });
      drawLandmarks(canvasCtx, results.leftHandLandmarks, {
        color: '#22d3ee',
        lineWidth: 2,
        radius: 4,
        fillColor: '#06b6d4',
      });
    }

    if (results.rightHandLandmarks) {
      drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS, {
        color: '#a855f7',
        lineWidth: 3,
      });
      drawLandmarks(canvasCtx, results.rightHandLandmarks, {
        color: '#c084fc',
        lineWidth: 2,
        radius: 4,
        fillColor: '#a855f7',
      });
    }

    // Gesture recognition with face + hand context
    const handLandmarks = results.rightHandLandmarks || results.leftHandLandmarks;
    if (handLandmarks) {
      // Send landmarks to backend via WebSocket
      if (useWebSocket && wsConnected) {
        const landmarkData = {
          hand: handLandmarks.map((lm: any) => ({ x: lm.x, y: lm.y, z: lm.z })),
          face: results.faceLandmarks?.slice(0, 10).map((lm: any) => ({ x: lm.x, y: lm.y, z: lm.z })) || [],
          pose: results.poseLandmarks?.slice(0, 5).map((lm: any) => ({ x: lm.x, y: lm.y, z: lm.z })) || []
        };
        wsService.sendLandmarks(landmarkData.hand);
      } else {
        // Use local gesture recognition with face context
        const gesture = recognizeGestureWithFace(handLandmarks, results.faceLandmarks, results.poseLandmarks);
        if (gesture) {
          const confidence = 0.85;
          onGestureDetected(gesture, confidence);
        }
      }
    }

    canvasCtx.restore();
  };

  // Enhanced gesture recognition with face and pose context
  const recognizeGestureWithFace = (
    handLandmarks: any, 
    faceLandmarks: any,
    poseLandmarks: any
  ): string | null => {
    if (!handLandmarks) return null;

    // Face landmark indices (MediaPipe Face Mesh)
    const CHIN = 152;  // Bottom of chin
    const FOREHEAD = 10;  // Center forehead
    const LEFT_CHEEK = 234;
    const RIGHT_CHEEK = 454;
    const NOSE_TIP = 1;

    // Pose landmark indices
    const LEFT_SHOULDER = 11;
    const RIGHT_SHOULDER = 12;
    const CHEST_CENTER = 0;  // Approximate

    // Hand landmarks
    const wrist = handLandmarks[0];
    const thumbTip = handLandmarks[4];
    const indexTip = handLandmarks[8];
    const middleTip = handLandmarks[12];
    const ringTip = handLandmarks[16];
    const pinkyTip = handLandmarks[20];

    // Helper function
    const distance = (p1: any, p2: any) => {
      if (!p1 || !p2) return Infinity;
      return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    };

    // FACE + HAND GESTURES (Check these first!)
    if (faceLandmarks && faceLandmarks.length > 200) {
      const chin = faceLandmarks[CHIN];
      const forehead = faceLandmarks[FOREHEAD];
      const noseTip = faceLandmarks[NOSE_TIP];
      const leftCheek = faceLandmarks[LEFT_CHEEK];
      const rightCheek = faceLandmarks[RIGHT_CHEEK];

      // MOTHER - Hand at chin (thumb tapping chin)
      const chinDist = distance(thumbTip, chin);
      if (chinDist < 0.08) {
        return "MOTHER";
      }

      // FATHER - Hand at forehead (thumb tapping forehead)
      const foreheadDist = distance(thumbTip, forehead);
      if (foreheadDist < 0.08) {
        return "FATHER";
      }

      // THANK YOU - Hand near chin/mouth area with open palm
      const chinHandDist = distance(indexTip, chin);
      if (chinHandDist < 0.12) {
        // Check if hand is open (fingers extended)
        const isHandOpen = indexTip.y < wrist.y && middleTip.y < wrist.y;
        if (isHandOpen) {
          return "THANK_YOU";
        }
      }

      // KNOW - Hand at forehead/temple (fingertips touching forehead)
      const templeDistIndex = distance(indexTip, forehead);
      if (templeDistIndex < 0.1) {
        return "KNOW";
      }

      // SORRY / PLEASE - Hand on chest area
      if (poseLandmarks && poseLandmarks.length > 12) {
        const leftShoulder = poseLandmarks[LEFT_SHOULDER];
        const rightShoulder = poseLandmarks[RIGHT_SHOULDER];
        
        // Calculate chest center
        const chestX = (leftShoulder.x + rightShoulder.x) / 2;
        const chestY = (leftShoulder.y + rightShoulder.y) / 2;
        const chestCenter = { x: chestX, y: chestY };

        const chestDist = distance(indexTip, chestCenter);
        if (chestDist < 0.15) {
          // If hand is flat, it's PLEASE, if fist it's SORRY
          const isFlat = Math.abs(indexTip.y - middleTip.y) < 0.05;
          return isFlat ? "PLEASE" : "SORRY";
        }
      }

      // EAT - Hand near mouth
      const mouthDist = distance(thumbTip, chin);
      if (mouthDist < 0.06) {
        // Fingers together (pinched)
        const fingersTogether = distance(thumbTip, indexTip) < 0.03;
        if (fingersTogether) {
          return "EAT";
        }
      }

      // DRINK - Thumb near mouth (cup gesture)
      const drinkDist = distance(thumbTip, noseTip);
      if (drinkDist < 0.12 && thumbTip.y < wrist.y) {
        return "DRINK";
      }
    }

    // Fallback to regular hand-only gestures
    return recognizeGesture(handLandmarks);
  };

  const recognizeGesture = (landmarks: any): string | null => {
    // Enhanced gesture recognition with more ASL signs
    const wrist = landmarks[0];
    const thumbCMC = landmarks[1];
    const thumbMCP = landmarks[2];
    const thumbIP = landmarks[3];
    const thumbTip = landmarks[4];
    const indexMCP = landmarks[5];
    const indexPIP = landmarks[6];
    const indexDIP = landmarks[7];
    const indexTip = landmarks[8];
    const middleMCP = landmarks[9];
    const middlePIP = landmarks[10];
    const middleDIP = landmarks[11];
    const middleTip = landmarks[12];
    const ringMCP = landmarks[13];
    const ringPIP = landmarks[14];
    const ringDIP = landmarks[15];
    const ringTip = landmarks[16];
    const pinkyMCP = landmarks[17];
    const pinkyPIP = landmarks[18];
    const pinkyDIP = landmarks[19];
    const pinkyTip = landmarks[20];
    
    // Helper functions
    const isFingerExtended = (tip: any, pip: any) => tip.y < pip.y;
    const isCurled = (tip: any, pip: any) => tip.y > pip.y;
    const distance = (p1: any, p2: any) => 
      Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2 + (p1.z - p2.z) ** 2);
    
    const indexExtended = isFingerExtended(indexTip, indexPIP);
    const middleExtended = isFingerExtended(middleTip, middlePIP);
    const ringExtended = isFingerExtended(ringTip, ringPIP);
    const pinkyExtended = isFingerExtended(pinkyTip, pinkyPIP);
    
    // Fixed thumb detection - check if thumb is extended away from palm
    const thumbExtended = Math.abs(thumbTip.x - thumbMCP.x) > 0.08;
    
    const indexCurled = isCurled(indexTip, indexPIP);
    const middleCurled = isCurled(middleTip, middlePIP);
    const ringCurled = isCurled(ringTip, ringPIP);
    const pinkyCurled = isCurled(pinkyTip, pinkyPIP);
    
    // Count extended fingers (including thumb for accurate counting)
    const extendedCount = [indexExtended, middleExtended, ringExtended, pinkyExtended].filter(Boolean).length;
    const totalExtendedWithThumb = thumbExtended ? extendedCount + 1 : extendedCount;
    
    // PRIORITY ORDER: Check more specific gestures first
    
    // FIST/CLOSED - All fingers curled (for punctuation/pause)
    if (indexCurled && middleCurled && ringCurled && pinkyCurled) {
      return "STOP";
    }
    
    // THUMBS UP - Thumb up, fingers curled
    if (thumbTip.y < wrist.y && indexCurled && middleCurled) {
      return "YES";
    }
    
    // THUMBS DOWN - Thumb down, fingers curled
    if (thumbTip.y > wrist.y && indexCurled && middleCurled) {
      return "NO";
    }
    
    // OK SIGN - Thumb and index touching, other fingers extended
    const thumbIndexDist = distance(thumbTip, indexTip);
    if (thumbIndexDist < 0.05 && middleExtended && ringExtended && pinkyExtended) {
      return "OK";
    }
    
    // POINT (YOU/ME/I) - Only index extended
    if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      if (indexTip.x < wrist.x - 0.1) {
        return "YOU";
      } else {
        return "I";
      }
    }
    
    // PEACE/V/TWO - Index and middle extended only
    if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
      return "TWO";
    }
    
    // THREE - Index, middle, ring extended
    if (indexExtended && middleExtended && ringExtended && !pinkyExtended) {
      return "THREE";
    }
    
    // FOUR - All four fingers extended (no thumb)
    if (indexExtended && middleExtended && ringExtended && pinkyExtended && !thumbExtended) {
      return "FOUR";
    }
    
    // FIVE/HELLO - All fingers extended including thumb  
    if (indexExtended && middleExtended && ringExtended && pinkyExtended && thumbExtended) {
      return "HELLO";
    }
    
    // If 4 fingers but thumb state unclear, default to FOUR
    if (indexExtended && middleExtended && ringExtended && pinkyExtended && !thumbExtended) {
      return "FOUR";
    }
    
    // LOVE/Y - Thumb, index, and pinky extended (I LOVE YOU sign)
    if (thumbExtended && indexCurled && middleCurled && ringCurled && pinkyExtended) {
      return "LOVE";
    }
    
    // CALL ME - Thumb and pinky extended (phone gesture)
    if (thumbExtended && indexCurled && middleCurled && ringCurled && pinkyExtended) {
      return "CALL";
    }
    
    // THANK YOU - Hand at chin level, moving forward (approximated by palm facing up)
    if (extendedCount >= 3 && wrist.y < 0.5) {
      return "THANKS";
    }
    
    // PLEASE - Hand on chest, circular motion (approximated by hand near center)
    if (extendedCount >= 3 && Math.abs(wrist.x - 0.5) < 0.15 && wrist.y > 0.4 && wrist.y < 0.7) {
      return "PLEASE";
    }
    
    // HELP - Thumbs up on flat palm (approximated)
    if (thumbTip.y < indexMCP.y && extendedCount <= 2) {
      return "HELP";
    }
    
    // GO - Pointing forward/away
    if (indexExtended && !middleExtended && wrist.z < -0.1) {
      return "GO";
    }
    
    // WANT - Open hands pulling toward body (approximated by all fingers spread)
    if (extendedCount === 4 && Math.abs(thumbTip.x - pinkyTip.x) > 0.15) {
      return "WANT";
    }
    
    // SORRY - Fist rotating on chest (approximated by closed fist in center)
    if (indexCurled && middleCurled && Math.abs(wrist.x - 0.5) < 0.2) {
      return "SORRY";
    }
    
    return null;
  };

  if (!isActive) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50">
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
              <svg className="w-12 h-12 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </motion.div>
          <p className="text-slate-400 text-lg">Camera not active</p>
          <p className="text-slate-500 text-sm">Click "Start Camera" to begin</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full group">
      {/* Loading State */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl rounded-2xl z-10 border border-slate-700/50"
        >
          <div className="text-center space-y-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full mx-auto"
            />
            <p className="text-slate-300 font-medium">Initializing camera...</p>
            {useWebSocket && (
              <p className="text-slate-500 text-sm">
                {wsConnected ? '✓ Connected to AI server' : 'Connecting to AI server...'}
              </p>
            )}
          </div>
        </motion.div>
      )}
      
      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-900/20 to-rose-900/20 backdrop-blur-xl rounded-2xl z-10 border border-red-500/50"
        >
          <div className="text-center space-y-2 p-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-red-400 font-medium">{error}</p>
          </div>
        </motion.div>
      )}
      
      {/* WebSocket Status Indicator */}
      {useWebSocket && !isLoading && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-2 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/50"
        >
          <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs font-medium text-slate-300">
            {wsConnected ? 'AI Connected' : 'AI Offline'}
          </span>
        </motion.div>
      )}
      
      {/* Hidden video element */}
      <video
        ref={videoRef}
        className="hidden"
        playsInline
      />
      
      {/* Canvas with Glassmorphism Container */}
      <div className="relative w-full h-full rounded-2xl overflow-hidden">
        {/* Animated Gradient Border Effect with Glow */}
        <motion.div 
          className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-2xl opacity-75 blur-lg"
          animate={{
            opacity: [0.75, 1, 0.75],
            scale: [0.98, 1.02, 0.98],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Additional Glow Layer */}
        <motion.div 
          className="absolute -inset-2 bg-gradient-to-r from-cyan-400/30 via-purple-400/30 to-pink-400/30 rounded-2xl blur-2xl"
          animate={{
            rotate: [0, 180, 360],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Glass Container */}
        <div className="relative w-full h-full bg-gradient-to-br from-slate-900/40 to-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl shadow-cyan-500/20">
          <canvas
            ref={canvasRef}
            className="w-full h-full object-cover"
            width={640}
            height={480}
          />
          
          {/* Animated Shine Overlay */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none"
            animate={{
              x: ['-100%', '100%'],
              y: ['-100%', '100%'],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          
          {/* Grid Overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
            backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.5) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }} />
        </div>
      </div>

      {/* Enhanced Corner Accents with Animation */}
      <motion.div 
        className="absolute top-0 left-0 w-24 h-24 border-t-2 border-l-2 border-cyan-500/70 rounded-tl-2xl pointer-events-none"
        animate={{
          borderColor: ['rgba(6, 182, 212, 0.7)', 'rgba(168, 85, 247, 0.7)', 'rgba(6, 182, 212, 0.7)'],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="absolute top-2 left-2 w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
      </motion.div>
      
      <motion.div 
        className="absolute top-0 right-0 w-24 h-24 border-t-2 border-r-2 border-purple-500/70 rounded-tr-2xl pointer-events-none"
        animate={{
          borderColor: ['rgba(168, 85, 247, 0.7)', 'rgba(236, 72, 153, 0.7)', 'rgba(168, 85, 247, 0.7)'],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      >
        <div className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
      </motion.div>
      
      <motion.div 
        className="absolute bottom-0 left-0 w-24 h-24 border-b-2 border-l-2 border-blue-500/70 rounded-bl-2xl pointer-events-none"
        animate={{
          borderColor: ['rgba(59, 130, 246, 0.7)', 'rgba(6, 182, 212, 0.7)', 'rgba(59, 130, 246, 0.7)'],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      >
        <div className="absolute bottom-2 left-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      </motion.div>
      
      <motion.div 
        className="absolute bottom-0 right-0 w-24 h-24 border-b-2 border-r-2 border-pink-500/70 rounded-br-2xl pointer-events-none"
        animate={{
          borderColor: ['rgba(236, 72, 153, 0.7)', 'rgba(6, 182, 212, 0.7)', 'rgba(236, 72, 153, 0.7)'],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3
        }}
      >
        <div className="absolute bottom-2 right-2 w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
      </motion.div>
      
      {/* Scanning Line Effect */}
      {isActive && !isLoading && (
        <motion.div
          className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent pointer-events-none"
          animate={{
            top: ['0%', '100%'],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      )}
    </div>
  );
});

EnhancedWebcamCapture.displayName = 'EnhancedWebcamCapture';

export default EnhancedWebcamCapture;

