import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, User, Hash, Flag, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayerShotRecord } from '../types';

interface ShotTimerProps {
  onRecordAdded: (record: PlayerShotRecord) => void;
  records: PlayerShotRecord[];
}

export default function ShotTimer({ onRecordAdded, records }: ShotTimerProps) {
  const [hole, setHole] = useState('1');
  const [group, setGroup] = useState('1');
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [isFirstToPlay, setIsFirstToPlay] = useState(false);
  
  // States: 'idle', 'countdown', 'running', 'finished'
  const [status, setStatus] = useState<'idle' | 'countdown' | 'running' | 'finished'>('idle');
  const [countdown, setCountdown] = useState(3);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const players = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (status === 'countdown') {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setStatus('running');
            return 3;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (status === 'running') {
      interval = setInterval(() => {
        setTimer((prev) => prev + 0.1);
      }, 100);
    }

    return () => clearInterval(interval);
  }, [status]);

  const handleStart = () => {
    if (selectedPlayer === null) return;
    setTimer(0);
    setCountdown(3);
    setStatus('countdown');
  };

  const handleStop = () => {
    if (status !== 'running') return;
    setStatus('finished');
    
    // Get location and save record
    const limit = isFirstToPlay ? 50 : 40;
    
    const saveRecord = (lat?: number, lon?: number) => {
      const record: PlayerShotRecord = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        hole,
        group,
        playerName: players[selectedPlayer!],
        isFirstToPlay,
        timeTaken: timer,
        limit,
        leeway: limit * 0.1,
        isSlow: timer > (limit * 1.1),
        latitude: lat,
        longitude: lon
      };
      onRecordAdded(record);
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          saveRecord(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Geolocation error:', error);
          saveRecord(); // Save without location if it fails
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      saveRecord();
    }
  };

  const handleNewShot = () => {
    setStatus('idle');
    setTimer(0);
  };

  const currentLimit = isFirstToPlay ? 50 : 40;
  const isOverTime = timer > currentLimit;

  return (
    <div className="p-4 flex flex-col h-full bg-[#111] text-white">
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
          <label className="flex items-center gap-2 text-xs text-gray-500 uppercase font-bold mb-2">
            <Hash size={14} /> Hole
          </label>
          <select 
            value={hole} 
            onChange={(e) => setHole(e.target.value)}
            className="w-full bg-transparent text-xl font-bold outline-none"
          >
            {Array.from({ length: 18 }, (_, i) => i + 1).map(n => (
              <option key={n} value={n} className="bg-zinc-900">{n}</option>
            ))}
          </select>
        </div>
        <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
          <label className="flex items-center gap-2 text-xs text-gray-500 uppercase font-bold mb-2">
            <Flag size={14} /> Group
          </label>
          <select 
            value={group} 
            onChange={(e) => setGroup(e.target.value)}
            className="w-full bg-transparent text-xl font-bold outline-none"
          >
            {Array.from({ length: 50 }, (_, i) => i + 1).map(n => (
              <option key={n} value={n} className="bg-zinc-900">{n}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-6">
        <label className="flex items-center gap-2 text-xs text-gray-500 uppercase font-bold mb-3">
          <User size={14} /> Target Player
        </label>
        <div className="grid grid-cols-2 gap-2">
          {players.map((p, idx) => {
            const playerHoleHistory = records.filter(
              r => r.playerName === p && r.hole === hole && r.group === group
            );

            return (
              <button
                key={p}
                onClick={() => setSelectedPlayer(idx)}
                className={`p-4 rounded-xl text-left transition-all border min-h-[80px] flex flex-col justify-between ${
                  selectedPlayer === idx 
                    ? 'bg-[#FFDD00] text-black border-[#FFDD00]' 
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="text-sm font-bold uppercase tracking-tight">{p}</div>
                {playerHoleHistory.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {playerHoleHistory.map((rec) => (
                      <span 
                        key={rec.id} 
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                          rec.isSlow 
                            ? (selectedPlayer === idx ? 'bg-red-700 text-white' : 'bg-red-950 text-red-500') 
                            : (selectedPlayer === idx ? 'bg-zinc-800 text-white' : 'bg-zinc-800 text-gray-400')
                        }`}
                      >
                        {rec.timeTaken.toFixed(0)}s
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between mb-8 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
        <span className="text-sm font-bold text-gray-300">First to play?</span>
        <button 
          onClick={() => setIsFirstToPlay(!isFirstToPlay)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
            isFirstToPlay ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-gray-400'
          }`}
        >
          {isFirstToPlay ? '50s Limit' : '40s Limit'}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative min-h-[300px]">
        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.button
              key="btn-start"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              disabled={selectedPlayer === null}
              onClick={handleStart}
              className={`w-48 h-48 rounded-full flex flex-col items-center justify-center gap-2 shadow-2xl transition-all ${
                selectedPlayer === null ? 'bg-zinc-800 text-gray-600' : 'bg-[#FFDD00] text-black hover:scale-105'
              }`}
            >
              <Play size={64} fill="black" />
              <span className="font-black uppercase tracking-tighter">Ready</span>
            </motion.button>
          )}

          {status === 'countdown' && (
            <motion.div
              key="countdown"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              className="text-8xl font-black text-[#FFDD00]"
            >
              {countdown}
            </motion.div>
          )}

          {status === 'running' && (
            <motion.div
              key="timer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center"
            >
              <div className={`text-9xl font-black tabular-nums transition-colors ${isOverTime ? 'text-red-500' : 'text-white'}`}>
                {timer.toFixed(1)}
              </div>
              <div className="text-gray-500 font-bold uppercase tracking-widest mt-2">
                Seconds taken
              </div>
              <button
                onClick={handleStop}
                className="mt-12 w-32 h-32 bg-red-600 rounded-full flex items-center justify-center shadow-lg hover:bg-red-500 transition-all"
              >
                <Square size={48} fill="white" className="text-white" />
              </button>
            </motion.div>
          )}

          {status === 'finished' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center text-center p-6 bg-zinc-900 rounded-3xl border-2 border-zinc-800 w-full max-w-sm"
            >
              <div className="mb-4">
                {timer <= currentLimit * 1.1 ? (
                  <CheckCircle size={64} className="text-green-500 mx-auto" />
                ) : (
                  <AlertTriangle size={64} className="text-red-500 mx-auto" />
                )}
              </div>
              <h3 className="text-2xl font-bold mb-1">
                {timer.toFixed(1)}s Recorded
              </h3>
              <p className="text-gray-500 mb-6">
                Limit: {currentLimit}s (+{ (currentLimit * 0.1).toFixed(1) }s leeway)
              </p>
              
              <div className={`w-full p-4 rounded-xl mb-6 flex items-center justify-center gap-2 font-bold ${
                timer > currentLimit * 1.1 ? 'bg-red-950 text-red-500' : 'bg-green-950 text-green-500'
              }`}>
                {timer > currentLimit * 1.1 ? 'SLOW PLAY DETECTED' : 'IN TIME'}
              </div>

              <button
                onClick={handleNewShot}
                className="w-full py-4 bg-[#FFDD00] text-black font-bold rounded-xl flex items-center justify-center gap-2"
              >
                Track Next Shot <ChevronRight size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
