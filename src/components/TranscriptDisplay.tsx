import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';

interface TranscriptDisplayProps {
  transcript: string[];
  refinedSentence?: string | null;
}

const TranscriptDisplay = ({ transcript, refinedSentence }: TranscriptDisplayProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <Card className="h-full bg-gradient-to-br from-slate-900/40 to-slate-800/40 backdrop-blur-xl border-slate-700/50 overflow-hidden">
      {/* Header with Gradient */}
      <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Transcript</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {transcript.length} sign{transcript.length !== 1 ? 's' : ''} detected
            </p>
          </div>
        </div>
      </div>
      
      <ScrollArea className="h-[calc(100%-112px)]">
        <div ref={scrollRef} className="p-6 space-y-4">
          {/* Raw Words */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Detected Signs
            </h3>
            {transcript.length === 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-slate-500 italic"
              >
                Start signing to see the transcript...
              </motion.p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {transcript.map((word, index) => (
                    <motion.div
                      key={`${word}-${index}`}
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="px-3 py-1.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 rounded-lg border border-cyan-500/30 font-medium text-sm hover:from-cyan-500/30 hover:to-blue-500/30 transition-all duration-200"
                    >
                      {word}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Refined Sentence */}
          {refinedSentence && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                  AI Refined
                </h3>
              </div>
              <p className="text-slate-200 leading-relaxed">
                {refinedSentence}
              </p>
            </motion.div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default TranscriptDisplay;
