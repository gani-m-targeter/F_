import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

interface ConfidenceBarProps {
  confidence: number;
  gesture: string | null;
}

const ConfidenceBar = ({ confidence, gesture }: ConfidenceBarProps) => {
  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'from-green-500 to-emerald-500';
    if (conf >= 0.6) return 'from-yellow-500 to-amber-500';
    return 'from-red-500 to-orange-500';
  };

  const getConfidenceText = (conf: number) => {
    if (conf >= 0.8) return 'High Confidence';
    if (conf >= 0.6) return 'Medium Confidence';
    return 'Low Confidence';
  };

  if (!gesture) {
    return (
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Confidence</span>
          <span className="text-sm text-muted-foreground">--</span>
        </div>
        <Progress value={0} className="h-2" />
        <p className="text-xs text-muted-foreground text-center">
          No gesture detected
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 p-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Confidence</span>
        <motion.span
          key={confidence}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className="text-sm font-bold text-foreground"
        >
          {Math.round(confidence * 100)}%
        </motion.span>
      </div>

      {/* Animated Progress Bar */}
      <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${confidence * 100}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`h-full bg-gradient-to-r ${getConfidenceColor(confidence)} rounded-full relative`}
        >
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </motion.div>
      </div>

      {/* Confidence Label */}
      <motion.p
        key={`${confidence}-${gesture}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-xs font-medium text-center"
        style={{
          color: confidence >= 0.8 ? 'hsl(142, 76%, 36%)' :
                 confidence >= 0.6 ? 'hsl(38, 92%, 50%)' :
                 'hsl(0, 84%, 60%)'
        }}
      >
        {getConfidenceText(confidence)}
      </motion.p>
    </motion.div>
  );
};

export default ConfidenceBar;

