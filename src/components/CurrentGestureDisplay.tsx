import { motion, AnimatePresence } from 'framer-motion';
import ConfidenceBar from './ConfidenceBar';

interface CurrentGestureDisplayProps {
  gesture: string | null;
  confidence?: number;
}

const CurrentGestureDisplay = ({ gesture, confidence = 0 }: CurrentGestureDisplayProps) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {gesture ? (
            <motion.div
              key={gesture}
              initial={{ opacity: 0, scale: 0.5, rotateY: -180 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.5, rotateY: 180 }}
              transition={{ 
                duration: 0.5,
                type: "spring",
                stiffness: 200,
                damping: 20
              }}
              className="text-center"
            >
              {/* Glowing Background */}
              <div className="relative">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 blur-3xl opacity-50"
                />
                
                {/* Gesture Text */}
                <motion.div
                  animate={{
                    textShadow: [
                      "0 0 20px rgba(6, 182, 212, 0.5)",
                      "0 0 40px rgba(6, 182, 212, 0.8)",
                      "0 0 20px rgba(6, 182, 212, 0.5)",
                    ]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="relative text-8xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-4"
                >
                  {gesture}
                </motion.div>
              </div>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-slate-400 text-lg font-medium"
              >
                Current Sign
              </motion.p>

              {/* Decorative Elements */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mt-4"
              />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-7xl mb-4"
              >
                👋
              </motion.div>
              <p className="text-slate-400 text-lg">
                Show a sign to begin
              </p>
              <motion.div
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="mt-4 text-sm text-slate-500"
              >
                Waiting for detection...
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confidence Bar */}
      <div className="border-t border-slate-700/50">
        <ConfidenceBar confidence={confidence} gesture={gesture} />
      </div>
    </div>
  );
};

export default CurrentGestureDisplay;
