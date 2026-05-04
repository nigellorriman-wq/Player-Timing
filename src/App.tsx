import React, { useState, useEffect } from 'react';
import { Timer, LayoutGrid, History, ShieldAlert, Trophy } from 'lucide-react';
import LostBallTimer from './components/LostBallTimer';
import ShotTimer from './components/ShotTimer';
import SessionHistory from './components/SessionHistory';
import { TournamentSetup } from './components/TournamentSetup';
import { PlayerShotRecord, TournamentInfo } from './types';
import { useWakeLock } from './hooks/useWakeLock';

export default function App() {
  const [activeTab, setActiveTab] = useState<'lost' | 'shot' | 'history' | 'tournament'>('shot');
  const [records, setRecords] = useState<PlayerShotRecord[]>([]);
  const [tournament, setTournament] = useState<TournamentInfo | undefined>(() => {
    const saved = localStorage.getItem('golf-tournament-info');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return undefined;
      }
    }
    return undefined;
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { isSupported, isActive: isWakeLockActive, requestWakeLock } = useWakeLock();

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('golf-officiating-records');
    if (saved) {
      try {
        setRecords(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load records from storage');
      }
    }
  }, []);

  // Save to localStorage whenever records change
  useEffect(() => {
    localStorage.setItem('golf-officiating-records', JSON.stringify(records));
  }, [records]);

  // Save tournament info
  useEffect(() => {
    if (tournament) {
      localStorage.setItem('golf-tournament-info', JSON.stringify(tournament));
    }
  }, [tournament]);

  // Request wake lock and lock orientation on interaction
  const handleInteraction = async () => {
    if (!isWakeLockActive) {
      await requestWakeLock();
    }
    
    // Attempt to lock orientation to portrait if supported
    if (window.screen && window.screen.orientation && (window.screen.orientation as any).lock) {
      try {
        await (window.screen.orientation as any).lock('portrait');
      } catch (err) {
        // Silent fail as it's not always supported or needs fullscreen
        console.warn('Orientation lock failed:', err);
      }
    }
  };

  const handleRecordAdded = (record: PlayerShotRecord) => {
    setRecords(prev => [...prev, record]);
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all records for this session?')) {
      setRecords([]);
      localStorage.removeItem('golf-officiating-records');
    }
  };

  return (
    <div 
      className="fixed inset-0 flex flex-col bg-black text-white font-sans selection:bg-[#FFDD00] selection:text-black"
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
    >
      {/* Header */}
      <header className="p-2 pt-6 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 bg-[#FFDD00] text-black rounded flex items-center justify-center shadow-md">
            <Timer size={14} strokeWidth={3} />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-sm font-black uppercase tracking-tighter leading-none italic">
                {tournament ? tournament.name : 'Player Timing'}
              </h1>
              <span className="text-sm font-black tabular-nums text-[#FFDD00]">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
              </span>
            </div>
            {tournament && (
              <p className="text-[8px] text-gray-500 font-bold uppercase tracking-wider">Round {tournament.round}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSupported && !isWakeLockActive && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-950 text-red-500 text-[10px] font-black uppercase ring-1 ring-red-900 animate-pulse">
              <ShieldAlert size={10} /> Sleep Enabled
            </div>
          )}
          {isWakeLockActive && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-950 text-green-500 text-[10px] font-black uppercase ring-1 ring-green-900">
              <ShieldAlert size={10} /> AWAKE
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 overflow-y-auto">
          {activeTab === 'lost' && (
            <LostBallTimer 
              onRecordAdded={handleRecordAdded} 
              tournamentInfo={tournament} 
            />
          )}
          {activeTab === 'shot' && (
            <ShotTimer 
              onRecordAdded={handleRecordAdded} 
              records={records} 
              tournamentInfo={tournament}
            />
          )}
          {activeTab === 'history' && (
            <SessionHistory 
              records={records} 
              onClear={clearHistory} 
              tournamentInfo={tournament}
            />
          )}
          {activeTab === 'tournament' && (
            <TournamentSetup 
              currentInfo={tournament}
              onSetupComplete={(info) => {
                setTournament(info);
                setActiveTab('shot');
              }} 
            />
          )}
        </div>
      </main>

      {/* Navigation Bar */}
      <nav className="px-1 py-2 pb-6 flex items-center justify-around border-t border-zinc-800 bg-zinc-900 bg-opacity-80 backdrop-blur-xl shrink-0">
        <button 
          onClick={() => setActiveTab('tournament')}
          className={`flex flex-col items-center gap-0.5 transition-all ${
            activeTab === 'tournament' ? 'text-[#FFDD00] scale-105' : 'text-zinc-500'
          }`}
        >
          <Trophy size={20} />
          <span className="text-[9px] font-bold uppercase tracking-widest">Setup</span>
        </button>
        <button 
          onClick={() => setActiveTab('lost')}
          className={`flex flex-col items-center gap-0.5 transition-all ${
            activeTab === 'lost' ? 'text-[#FFDD00] scale-105' : 'text-zinc-500'
          }`}
        >
          <Timer size={20} />
          <span className="text-[9px] font-bold uppercase tracking-widest">Lost Ball</span>
        </button>
        <button 
          onClick={() => setActiveTab('shot')}
          className={`flex flex-col items-center gap-0.5 transition-all ${
            activeTab === 'shot' ? 'text-[#FFDD00] scale-105' : 'text-zinc-500'
          }`}
        >
          <LayoutGrid size={20} />
          <span className="text-[9px] font-bold uppercase tracking-widest">Shot Clock</span>
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-0.5 transition-all ${
            activeTab === 'history' ? 'text-[#FFDD00] scale-105' : 'text-zinc-500'
          }`}
        >
          <div className="relative">
            <History size={20} />
            {records.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-[7px] font-black text-white flex items-center justify-center rounded-full border border-zinc-900">
                {records.length}
              </span>
            )}
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest">History</span>
        </button>
      </nav>
      
      {/* Global CSS for Forced Portrait feel */}
      <style>{`
        body {
          overscroll-behavior-y: contain;
          background: black;
          overflow: hidden;
        }
        select {
          appearance: none;
          -webkit-appearance: none;
        }
        @media screen and (orientation: landscape) {
          .landscape-notice {
            display: flex;
          }
        }
        .landscape-notice {
          display: none;
        }
      `}</style>
      
      {/* Landscape Warning (Optional but helpful based on user request) */}
      <div className="landscape-notice fixed inset-0 z-[100] bg-black flex-col items-center justify-center p-8 text-center sm:hidden">
        <div className="w-20 h-20 bg-[#FFDD00] text-black rounded-full flex items-center justify-center mb-6 animate-bounce">
          <ShieldAlert size={48} />
        </div>
        <h2 className="text-2xl font-black uppercase mb-2">Portrait Only</h2>
        <p className="text-gray-400">This tool is optimized for hand-held portrait use. Please rotate your device.</p>
      </div>
    </div>
  );
}
