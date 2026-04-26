import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function LostBallTimer() {
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Play a sound or vibrate if possible?
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(180);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isExpired = timeLeft === 0;

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 bg-black text-white">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold uppercase tracking-widest text-[#FFDD00]">Lost Ball Timer</h2>
        <p className="text-sm text-gray-400">Rule 18.2a: 3 Minutes Search Time</p>
      </div>

      <motion.div 
        initial={false}
        animate={{ 
          scale: isActive ? 1.02 : 1,
          color: isExpired ? '#FF0000' : (timeLeft < 30 ? '#FFDD00' : '#FFFFFF')
        }}
        className="text-[24vw] sm:text-[10rem] font-black leading-none font-mono mb-8 tabular-nums tracking-tighter"
      >
        {formatTime(timeLeft)}
      </motion.div>

      <div className="flex gap-8">
        <button
          onClick={toggleTimer}
          className={`p-8 rounded-full transition-all ${
            isActive 
              ? 'bg-zinc-800 text-white' 
              : 'bg-[#FFDD00] text-black'
          }`}
        >
          {isActive ? <Pause size={48} /> : <Play size={48} fill="currentColor" />}
        </button>
        <button
          onClick={resetTimer}
          className="p-8 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 transition-all border border-zinc-700"
        >
          <RotateCcw size={48} />
        </button>
      </div>

      <AnimatePresence>
        {isExpired && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 p-6 bg-red-600 text-white rounded-lg text-center"
          >
            <h3 className="text-2xl font-bold uppercase">Ball Lost</h3>
            <p>The 3-minute search period has ended.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
