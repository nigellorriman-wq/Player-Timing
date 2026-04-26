import React, { useState, useEffect } from 'react';
import { Timer, LayoutGrid, History, ShieldAlert } from 'lucide-react';
import LostBallTimer from './components/LostBallTimer';
import ShotTimer from './components/ShotTimer';
import SessionHistory from './components/SessionHistory';
import { PlayerShotRecord } from './types';
import { useWakeLock } from './hooks/useWakeLock';

export default function App() {
  const [activeTab, setActiveTab] = useState<'lost' | 'shot' | 'history'>('shot');
  const [records, setRecords] = useState<PlayerShotRecord[]>([]);
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

  // Request wake lock on interaction
  const handleInteraction = async () => {
    if (!isWakeLockActive) {
      await requestWakeLock();
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
      <header className="p-4 pt-10 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FFDD00] text-black rounded-lg flex items-center justify-center shadow-lg">
            <Timer size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tighter leading-none italic">Player Timing</h1>
            <span className="text-[10px] font-bold text-[#FFDD00] uppercase tracking-widest">Officiating Tools</span>
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
          {activeTab === 'lost' && <LostBallTimer />}
          {activeTab === 'shot' && <ShotTimer onRecordAdded={handleRecordAdded} records={records} />}
          {activeTab === 'history' && <SessionHistory records={records} onClear={clearHistory} />}
        </div>
      </main>

      {/* Navigation Bar */}
      <nav className="p-4 pb-8 flex items-center justify-around border-t border-zinc-800 bg-zinc-900 bg-opacity-80 backdrop-blur-xl shrink-0">
        <button 
          onClick={() => setActiveTab('lost')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'lost' ? 'text-[#FFDD00] scale-110' : 'text-zinc-500'
          }`}
        >
          <Timer size={24} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Lost Ball</span>
        </button>
        <button 
          onClick={() => setActiveTab('shot')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'shot' ? 'text-[#FFDD00] scale-110' : 'text-zinc-500'
          }`}
        >
          <LayoutGrid size={24} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Shot Clock</span>
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'history' ? 'text-[#FFDD00] scale-110' : 'text-zinc-500'
          }`}
        >
          <div className="relative">
            <History size={24} />
            {records.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-[8px] font-black text-white flex items-center justify-center rounded-full border-2 border-zinc-900">
                {records.length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">History</span>
        </button>
      </nav>
      
      {/* Global CSS for Forced Portrait feel */}
      <style>{`
        body {
          overscroll-behavior-y: contain;
          background: black;
        }
        select {
          appearance: none;
          -webkit-appearance: none;
        }
        @media (orientation: landscape) {
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
