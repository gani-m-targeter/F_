import { useEffect, useRef, useState } from 'react';
import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { HAND_CONNECTIONS } from '@mediapipe/hands';

interface WebcamCaptureProps {
  onGestureDetected: (gesture: string) => void;
  isActive: boolean;
}

const WebcamCapture = ({ onGestureDetected, isActive }: WebcamCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const handsRef = useRef<Hands | null>(null);
  const cameraRef = useRef<Camera | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const initializeMediaPipe = async () => {
      try {
        const hands = new Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          },
        });

        hands.setOptions({
          maxNumHands: 1,  // Single hand for faster processing
          modelComplexity: 0,  // Lite model for less lag
          minDetectionConfidence: 0.4,
          minTrackingConfidence: 0.4,
        });

        hands.onResults(onResults);
        handsRef.current = hands;

        if (videoRef.current) {
          const camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && handsRef.current) {
                await handsRef.current.send({ image: videoRef.current });
              }
            },
            width: 640,  // Reduced for less lag
            height: 480,
          });
          
          await camera.start();
          cameraRef.current = camera;
          setIsLoading(false);
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
      if (handsRef.current) {
        handsRef.current.close();
      }
    };
  }, [isActive]);

  const onResults = (results: Results) => {
    if (!canvasRef.current) return;

    const canvasCtx = canvasRef.current.getContext('2d');
    if (!canvasCtx) return;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
          color: 'hsl(195, 85%, 55%)',
          lineWidth: 2,
        });
        drawLandmarks(canvasCtx, landmarks, {
          color: 'hsl(180, 65%, 50%)',
          lineWidth: 1,
          radius: 3,
        });

        // Simple gesture recognition based on finger positions
        const gesture = recognizeGesture(landmarks);
        if (gesture) {
          onGestureDetected(gesture);
        }
      }
    }

    canvasCtx.restore();
  };

  const recognizeGesture = (landmarks: any): string | null => {
    // Enhanced ASL word and letter recognition
    
    const thumbTip = landmarks[4];
    const thumbIP = landmarks[3];
    const thumbMCP = landmarks[2];
    
    const indexTip = landmarks[8];
    const indexDIP = landmarks[7];
    const indexPIP = landmarks[6];
    const indexMCP = landmarks[5];
    
    const middleTip = landmarks[12];
    const middleDIP = landmarks[11];
    const middlePIP = landmarks[10];
    const middleMCP = landmarks[9];
    
    const ringTip = landmarks[16];
    const ringDIP = landmarks[15];
    const ringPIP = landmarks[14];
    const ringMCP = landmarks[13];
    
    const pinkyTip = landmarks[20];
    const pinkyDIP = landmarks[19];
    const pinkyPIP = landmarks[18];
    const pinkyMCP = landmarks[17];
    
    const wrist = landmarks[0];
    const palmBase = landmarks[0];

    // Helper functions
    const isFingerExtended = (tip: any, pip: any) => tip.y < pip.y;
    const isFingerCurled = (tip: any, pip: any) => tip.y > pip.y;
    const distance = (p1: any, p2: any) => 
      Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2));
    
    const indexExtended = isFingerExtended(indexTip, indexPIP);
    const middleExtended = isFingerExtended(middleTip, middlePIP);
    const ringExtended = isFingerExtended(ringTip, ringPIP);
    const pinkyExtended = isFingerExtended(pinkyTip, pinkyPIP);
    
    const indexCurled = isFingerCurled(indexTip, indexPIP);
    const middleCurled = isFingerCurled(middleTip, middlePIP);
    const ringCurled = isFingerCurled(ringTip, ringPIP);
    const pinkyCurled = isFingerCurled(pinkyTip, pinkyPIP);

    // COMMON WORDS/PHRASES
    
    // "HELLO" / "HI" - Open hand waving (all fingers extended)
    if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
      const thumbExtended = thumbTip.y < thumbMCP.y;
      if (thumbExtended) {
        return "HELLO";
      }
    }

    // "THANK YOU" - Fingers near chin moving forward (open hand near face)
    if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
      if (indexTip.y < 0.3 && palmBase.y < 0.4) { // Hand near top of frame (face level)
        return "THANK YOU";
      }
    }

    // "PLEASE" - Open hand making circular motion on chest (simplified: open hand centered)
    const handCentered = Math.abs(palmBase.x - 0.5) < 0.2;
    if (indexExtended && middleExtended && ringExtended && pinkyExtended && handCentered) {
      if (palmBase.y > 0.3 && palmBase.y < 0.7) { // Mid-frame (chest area)
        return "PLEASE";
      }
    }

    // "SORRY" / "APOLOGIZE" - Fist making circular motion over chest (simplified: fist at chest)
    if (indexCurled && middleCurled && ringCurled && pinkyCurled) {
      if (palmBase.y > 0.3 && palmBase.y < 0.7 && handCentered) {
        return "SORRY";
      }
    }

    // "I LOVE YOU" - Thumb, index, and pinky extended (Y + I)
    const thumbOut = Math.abs(thumbTip.x - indexMCP.x) > 0.1;
    if (indexExtended && !middleExtended && !ringExtended && pinkyExtended && thumbOut) {
      return "I LOVE YOU";
    }

    // "YES" - Fist nodding (simplified: fist)
    if (indexCurled && middleCurled && ringCurled && pinkyCurled) {
      if (palmBase.y < 0.5) { // Upper half of frame
        return "YES";
      }
    }

    // "NO" - Index and middle finger snapping together (simplified: index + middle extended)
    if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
      const fingersTogether = distance(indexTip, middleTip) < 0.05;
      if (fingersTogether) {
        return "NO";
      }
    }

    // "HELP" - Thumbs up with fist on palm (simplified: thumbs up gesture)
    const thumbUp = thumbTip.y < thumbMCP.y && thumbTip.y < indexMCP.y;
    if (thumbUp && indexCurled && middleCurled && ringCurled && pinkyCurled) {
      return "HELP";
    }

    // "GOOD MORNING" - Arm movement (simplified: hand moving up)
    if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
      if (palmBase.y < 0.3) { // Hand in upper portion
        return "GOOD MORNING";
      }
    }

    // "GOOD NIGHT" - Arm moving down (simplified: hand moving down)
    if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
      if (palmBase.y > 0.6) { // Hand in lower portion
        return "GOOD NIGHT";
      }
    }

    // "YOU'RE WELCOME" - Open hand near chin
    if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
      if (palmBase.y < 0.35) {
        return "YOU'RE WELCOME";
      }
    }

    // "HOW ARE YOU" - Pointing gesture (index pointing)
    if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      const pointingForward = palmBase.y > 0.4 && palmBase.y < 0.6;
      if (pointingForward) {
        return "HOW ARE YOU";
      }
    }

    // "NICE TO MEET YOU" - Open palm showing
    if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
      const palmForward = palmBase.z < indexMCP.z;
      if (palmForward && palmBase.y > 0.35 && palmBase.y < 0.65) {
        return "NICE TO MEET YOU";
      }
    }

    // "EXCUSE ME" - Brushing motion (simplified: hand to side)
    if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
      if (palmBase.x < 0.3 || palmBase.x > 0.7) { // Hand to left or right side
        return "EXCUSE ME";
      }
    }

    // INDIVIDUAL LETTERS (original detection)
    
    // "D" - Index finger pointing up
    if (indexExtended && middleCurled && ringCurled && pinkyCurled) {
      const thumbTouching = distance(thumbTip, middleTip) < 0.08;
      if (thumbTouching) {
        return "D";
      }
    }

    // "V" - Peace sign
    if (indexExtended && middleExtended && ringCurled && pinkyCurled) {
      const fingersSeparated = distance(indexTip, middleTip) > 0.08;
      if (fingersSeparated) {
        return "V";
      }
    }

    // "B" - All fingers extended together
    if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
      const fingersClose = distance(indexTip, middleTip) < 0.05;
      if (fingersClose) {
        return "B";
      }
    }

    // "A" - Fist with thumb to side
    if (indexCurled && middleCurled && ringCurled && pinkyCurled) {
      const thumbToSide = thumbTip.x < indexMCP.x - 0.05 || thumbTip.x > indexMCP.x + 0.05;
      if (thumbToSide && palmBase.y > 0.5) {
        return "A";
      }
    }

    // "C" - Hand forming C shape
    const curvedFingers = !indexExtended && !middleExtended && !ringExtended && !pinkyExtended;
    const thumbAway = distance(thumbTip, indexTip) > 0.1;
    if (curvedFingers && thumbAway) {
      return "C";
    }

    // "O" - Fingers forming circle
    const thumbIndexClose = distance(thumbTip, indexTip) < 0.05;
    if (thumbIndexClose && middleCurled && ringCurled && pinkyCurled) {
      return "O";
    }

    // "L" - L shape with thumb and index
    const thumbExtendedSide = thumbTip.x < thumbMCP.x - 0.08 || thumbTip.x > thumbMCP.x + 0.08;
    if (indexExtended && middleCurled && ringCurled && pinkyCurled && thumbExtendedSide) {
      return "L";
    }

    // "Y" - Thumb and pinky extended
    const thumbExtendedOut = distance(thumbTip, palmBase) > 0.15;
    if (!indexExtended && !middleExtended && !ringExtended && pinkyExtended && thumbExtendedOut) {
      return "Y";
    }

    // MORE ACTIONABLE WORDS

    // "HELP" - Thumbs up gesture
    if (thumbTip.y < thumbMCP.y && indexCurled && middleCurled && ringCurled && pinkyCurled) {
      return "HELP";
    }

    // "GOOD" - Thumbs up
    const isThumbUp = thumbTip.y < wrist.y - 0.1;
    if (isThumbUp && indexCurled && middleCurled && ringCurled && pinkyCurled) {
      return "GOOD";
    }

    // "BAD" - Thumbs down
    const thumbDown = thumbTip.y > wrist.y + 0.1;
    if (thumbDown && indexCurled && middleCurled && ringCurled && pinkyCurled) {
      return "BAD";
    }

    // "STOP" - Open palm facing forward
    if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
      if (palmBase.z < -0.05) {
        return "STOP";
      }
    }

    // "GO" - Point forward
    if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      if (indexTip.z < wrist.z - 0.05) {
        return "GO";
      }
    }

    // "WAIT" - Open hand palm down
    if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
      if (palmBase.y > 0.5) {
        return "WAIT";
      }
    }

    // "COME" - Beckoning gesture (curled index)
    if (indexCurled && !middleExtended && !ringExtended && !pinkyExtended) {
      return "COME";
    }

    // "WATER" - W shape (three fingers)
    if (indexExtended && middleExtended && ringExtended && !pinkyExtended) {
      return "WATER";
    }

    // "FOOD/EAT" - Fingers together near mouth area
    if (indexCurled && middleCurled && ringCurled && pinkyCurled) {
      if (palmBase.y < 0.4) {
        return "FOOD";
      }
    }

    // "MONEY" - Rubbing fingers gesture
    if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
      const fingersTouching = distance(indexTip, middleTip) < 0.03;
      if (fingersTouching && thumbExtendedSide) {
        return "MONEY";
      }
    }

    // "PHONE/CALL" - Thumb and pinky extended (phone shape)
    if (!indexExtended && !middleExtended && !ringExtended && pinkyExtended && thumbExtendedOut) {
      return "PHONE";
    }

    // "LOVE" - Crossed arms/hands on chest (fist)
    if (indexCurled && middleCurled && ringCurled && pinkyCurled) {
      if (Math.abs(palmBase.x - 0.5) < 0.15) {
        return "LOVE";
      }
    }

    // "HAPPY" - Two hands up with spread fingers
    if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
      if (palmBase.y < 0.35) {
        return "HAPPY";
      }
    }

    // "SAD" - Fingers down
    if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
      if (indexTip.y > indexPIP.y && palmBase.y > 0.6) {
        return "SAD";
      }
    }

    // "FINISHED/DONE" - Both hands shaking (open palm twist)
    if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
      if (Math.abs(palmBase.x - 0.5) > 0.3) {
        return "FINISHED";
      }
    }

    // "MORE" - Fingers bunched together
    const allFingersTogether = distance(indexTip, middleTip) < 0.04 && 
                               distance(middleTip, ringTip) < 0.04;
    if (allFingersTogether && indexCurled) {
      return "MORE";
    }

    return null;
  };

  if (!isActive) {
    return (
      <div className="flex items-center justify-center h-full bg-muted rounded-lg">
        <p className="text-muted-foreground">Camera not active</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Initializing camera...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 rounded-lg z-10">
          <p className="text-destructive">{error}</p>
        </div>
      )}
      
      <video
        ref={videoRef}
        className="hidden"
        playsInline
      />
      
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg shadow-[var(--shadow-card)]"
        width={640}
        height={480}
      />
    </div>
  );
};

export default WebcamCapture;
