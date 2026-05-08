import React, { useState } from 'react';
import { Flag, Hash, Clock, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayerShotRecord, TournamentInfo, TimerType } from '../types';
import { calculateTargetTime } from '../utils/paceUtils';

interface FlagInTimerProps {
  onRecordAdded: (record: PlayerShotRecord) => void;
  tournamentInfo?: TournamentInfo;
  hole: string;
  setHole: (hole: string) => void;
  group: string;
  setGroup: (group: string) => void;
}

export const FlagInTimer: React.FC<FlagInTimerProps> = ({ 
  onRecordAdded, 
  tournamentInfo,
  hole,
  setHole,
  group,
  setGroup
}) => {
  const [showSuccess, setShowSuccess] = useState(false);

  // Format names compactly
  const formatCompactName = (fullName: string) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(' ');
    if (parts.length <= 1) return fullName;
    const lastName = parts[parts.length - 1];
    const initial = parts[0][0];
    return `${initial}. ${lastName}`;
  };

  const handleRecordFlagIn = () => {
    const now = new Date();
    // Rounded to the last completed minute
    const actualH = now.getHours();
    const actualM = now.getMinutes();
    const actualFormatted = `${actualH.toString().padStart(2, '0')}:${actualM.toString().padStart(2, '0')}`;
    
    const target = calculateTargetTime(group, hole, tournamentInfo);
    const [targetH, targetM] = target.time.split(':').map(Number);
    
    // Calculate difference in minutes
    const actualMinutesTotal = actualH * 60 + actualM;
    const targetMinutesTotal = targetH * 60 + targetM;
    const diff = actualMinutesTotal - targetMinutesTotal;

    const record: PlayerShotRecord = {
      id: Math.random().toString(36).substr(2, 9),
      type: TimerType.FLAG_IN,
      timestamp: Date.now(),
      hole,
      group,
      playerName: `Group ${group}`,
      timeTaken: diff,
      limit: target.minutes,
      actualTime: actualFormatted,
      targetTime: target.time,
      isSlow: diff > 0
    };

    onRecordAdded(record);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const targetInfo = calculateTargetTime(group, hole, tournamentInfo);

  return (
    <div className="flex flex-col h-full p-4 bg-[#111] text-white overflow-y-auto">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold uppercase tracking-widest text-[#FFDD00]">Flag-In Record</h2>
        <p className="text-[10px] text-gray-400 uppercase font-bold">Record group completion of a hole</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
          <label className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase font-black mb-1.5">
            <Hash size={12} className="text-[#FFDD00]" /> Hole
          </label>
          <select 
            value={hole} 
            onChange={(e) => setHole(e.target.value)}
            className="w-full bg-transparent text-xl font-black outline-none cursor-pointer appearance-none"
          >
            {Array.from({ length: 18 }, (_, i) => String(i + 1)).map(n => (
              <option key={n} value={n} className="bg-zinc-900">{n}</option>
            ))}
          </select>
        </div>
        <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
          <label className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase font-black mb-1.5">
            <Flag size={12} className="text-[#FFDD00]" /> Group
          </label>
          <select 
            value={group} 
            onChange={(e) => setGroup(e.target.value)}
            className="w-full bg-transparent text-xl font-black outline-none cursor-pointer appearance-none"
          >
            {tournamentInfo && tournamentInfo.groups.length > 0 ? (
              tournamentInfo.groups.map(g => {
                const target = calculateTargetTime(g.groupNumber, hole, tournamentInfo);
                return (
                  <option key={g.groupNumber} value={g.groupNumber} className="bg-zinc-900">
                    G{g.groupNumber} (@{g.startTime} → {target.time}) - {g.players.map(p => formatCompactName(p)).join(', ')}
                  </option>
                );
              })
            ) : (
              Array.from({ length: 50 }, (_, i) => String(i + 1)).map(n => (
                <option key={n} value={n} className="bg-zinc-900">G{n}</option>
              ))
            )}
          </select>
        </div>
      </div>

      <div className="bg-black/40 p-4 rounded-xl border border-zinc-800/50 mb-8">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-zinc-900 rounded-lg">
            <Clock size={16} className="text-[#FFDD00]" />
          </div>
          <div className="flex-1">
            <h4 className="text-[10px] text-gray-500 uppercase font-black tracking-widest leading-none mb-1 text-center">Required Time of Finish</h4>
            <div className="text-4xl font-black text-center tabular-nums leading-tight">
              {targetInfo.time}
            </div>
            <p className="text-[9px] text-gray-400 text-center uppercase font-bold mt-1">
              (Cumulative Pace: {targetInfo.minutes} mins)
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <button
          onClick={handleRecordFlagIn}
          className="group relative flex flex-col items-center justify-center p-12 bg-[#FFDD00] text-black rounded-full shadow-[0_0_30px_rgba(255,221,0,0.2)] hover:scale-105 active:scale-95 transition-all w-48 h-48"
        >
          <Flag size={48} className="mb-2" />
          <span className="text-sm font-black uppercase tracking-tighter">Record Flag-In</span>
          
          <div className="absolute inset-0 rounded-full border-4 border-black/10 scale-90 group-hover:scale-100 transition-transform"></div>
        </button>

        <p className="mt-8 text-[11px] text-gray-500 font-bold uppercase text-center max-w-[200px]">
          Press when the group's flag is placed in the hole. Time will be rounded to the last completed minute.
        </p>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute bottom-24 left-4 right-4 p-4 bg-green-600 text-white rounded-xl flex items-center gap-3 shadow-xl z-50"
          >
            <CheckCircle2 size={24} />
            <div>
              <p className="text-xs font-black uppercase">Flag-In Recorded</p>
              <p className="text-[10px] opacity-90">Timing history has been updated.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
