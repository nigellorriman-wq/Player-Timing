import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer, Hash, Flag, User, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayerShotRecord, TournamentInfo, TimerType } from '../types';

interface LostBallTimerProps {
  onRecordAdded: (record: PlayerShotRecord) => void;
  tournamentInfo?: TournamentInfo;
}

export default function LostBallTimer({ onRecordAdded, tournamentInfo }: LostBallTimerProps) {
  const [hole, setHole] = useState('1');
  const [group, setGroup] = useState('1');
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);

  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const getPlayersByGroup = () => {
    if (tournamentInfo) {
      const g = tournamentInfo.groups.find(g => g.groupNumber === group);
      if (g && g.players.length > 0) return g.players;
    }
    return ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
  };

  const players = getPlayersByGroup();

  useEffect(() => {
    setSelectedPlayer(null);
  }, [group]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
      saveSearchRecord();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const captureLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => console.error('Error capturing location:', error),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  const toggleTimer = () => {
    if (!isActive && timeLeft === 180) {
      captureLocation();
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(180);
    setLocation(null);
  };

  const saveSearchRecord = () => {
    const record: PlayerShotRecord = {
      id: Math.random().toString(36).substr(2, 9),
      type: TimerType.LOST_BALL,
      timestamp: Date.now(),
      hole,
      group,
      playerName: selectedPlayer !== null ? players[selectedPlayer] : 'Unknown Player',
      timeTaken: 180 - timeLeft,
      limit: 180,
      latitude: location?.lat,
      longitude: location?.lon
    };
    onRecordAdded(record);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isExpired = timeLeft === 0;

  return (
    <div className="flex flex-col h-full p-4 bg-[#111] text-white overflow-y-auto">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold uppercase tracking-widest text-[#FFDD00]">Lost Ball Timer</h2>
        <p className="text-[10px] text-gray-400 uppercase font-bold">Rule 18.2a: 3 Minutes Search Time</p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-zinc-900 p-2 px-3 rounded-lg border border-zinc-800">
          <label className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase font-bold mb-1">
            <Hash size={12} /> Hole
          </label>
          <select 
            value={hole} 
            onChange={(e) => setHole(e.target.value)}
            className="w-full bg-transparent text-lg font-bold outline-none cursor-pointer"
          >
            {Array.from({ length: 18 }, (_, i) => String(i + 1)).map(n => (
              <option key={n} value={n} className="bg-zinc-900">{n}</option>
            ))}
          </select>
        </div>
        <div className="bg-zinc-900 p-2 px-3 rounded-lg border border-zinc-800">
          <label className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase font-bold mb-1">
            <Flag size={12} /> Group
          </label>
          <select 
            value={group} 
            onChange={(e) => setGroup(e.target.value)}
            className="w-full bg-transparent text-lg font-bold outline-none cursor-pointer"
          >
            {tournamentInfo && tournamentInfo.groups.length > 0 ? (
              tournamentInfo.groups.map(g => (
                <option key={g.groupNumber} value={g.groupNumber} className="bg-zinc-900">{g.groupNumber}</option>
              ))
            ) : (
              Array.from({ length: 50 }, (_, i) => String(i + 1)).map(n => (
                <option key={n} value={n} className="bg-zinc-900">{n}</option>
              ))
            )}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase font-bold mb-2">
          <User size={12} /> Player
        </label>
        <div className="grid grid-cols-2 gap-2">
          {players.map((p, idx) => (
            <button
              key={p}
              onClick={() => setSelectedPlayer(idx)}
              className={`p-2 rounded-lg text-left transition-all border text-xs font-bold uppercase tracking-tight ${
                selectedPlayer === idx 
                  ? 'bg-[#FFDD00] text-black border-[#FFDD00]' 
                  : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div 
          initial={false}
          animate={{ 
            scale: isActive ? 1.05 : 1,
            color: isExpired ? '#FF0000' : (timeLeft < 30 ? '#FFDD00' : '#FFFFFF')
          }}
          className="text-8xl sm:text-[10rem] font-black leading-none font-mono mb-8 tabular-nums tracking-tighter"
        >
          {formatTime(timeLeft)}
        </motion.div>

        {location && (
          <div className="mb-4 flex items-center gap-1.5 text-[10px] text-[#FFDD00] font-bold uppercase">
            <MapPin size={12} /> Search Location Captured
          </div>
        )}

        <div className="flex gap-8">
          <button
            onClick={toggleTimer}
            className={`p-8 rounded-full transition-all shadow-xl ${
              isActive 
                ? 'bg-zinc-800 text-white' 
                : 'bg-[#FFDD00] text-black hover:scale-105'
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
      </div>

      <AnimatePresence>
        {isExpired && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-red-600 text-white rounded-xl text-center shadow-lg"
          >
            <h3 className="text-xl font-bold uppercase tracking-tighter">Ball Lost</h3>
            <p className="text-xs opacity-90">The 3-minute search period has ended.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {!isExpired && !isActive && timeLeft < 180 && (
        <button
          onClick={saveSearchRecord}
          className="mt-6 w-full py-4 bg-zinc-800 text-white font-bold rounded-xl border border-zinc-700 uppercase text-xs tracking-widest hover:bg-zinc-700 transition-colors"
        >
          Confirm Search Ended
        </button>
      )}
    </div>
  );
}
