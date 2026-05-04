import React, { useState } from 'react';
import Papa from 'papaparse';
import { Upload, X, Check, FileText, Trophy, Calendar } from 'lucide-react';
import { TournamentInfo, HolePace, GroupData } from '../types';

interface TournamentSetupProps {
  onSetupComplete: (data: TournamentInfo) => void;
  currentInfo?: TournamentInfo;
}

export const TournamentSetup: React.FC<TournamentSetupProps> = ({ onSetupComplete, currentInfo }) => {
  const [name, setName] = useState(currentInfo?.name || '');
  const [round, setRound] = useState(currentInfo?.round || '');
  const [paceData, setPaceData] = useState<HolePace[]>(currentInfo?.paceOfPlay || []);
  const [groups, setGroups] = useState<GroupData[]>(currentInfo?.groups || []);

  const normalizeTime = (timeStr: string): string => {
    if (!timeStr) return "00:00";
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return timeStr;
    let h = parseInt(match[1]);
    const m = match[2];
    const mer = match[3]?.toUpperCase();

    if (mer === 'PM' && h < 12) h += 12;
    if (mer === 'AM' && h === 12) h = 0;

    return `${h.toString().padStart(2, '0')}:${m.padStart(2, '0')}`;
  };

  const handlePaceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          const parsed = results.data
            .filter((row: any) => {
              const hasHole = 'Hole' in row || 'hole' in row;
              const hasMin = 'Time' in row || 'time' in row || 'Minutes' in row || 'minutes' in row || 'Mins' in row || 'mins' in row;
              return hasHole && hasMin;
            })
            .map((row: any) => ({
              hole: Number(row.Hole || row.hole),
              minutes: Number(row.Time || row.time || row.Minutes || row.minutes || row.Mins || row.mins)
            }))
            .filter(item => !isNaN(item.hole) && !isNaN(item.minutes));
          
          if (parsed.length > 0) {
            setPaceData(parsed);
          } else {
            alert('No valid Pace of Play data found. Check your CSV headers (Hole, Time).');
          }
        }
      });
    }
  };

  const handleGroupsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          const parsed: GroupData[] = results.data
            .filter((row: any) => {
              const hasGroup = 'GROUP NO' in row || 'Group' in row || 'group' in row;
              const hasTime = 'TIME' in row || 'StartTime' in row || 'startTime' in row || 'Time' in row || 'time' in row;
              return hasGroup && hasTime;
            })
            .map((row: any) => {
              const g = row['GROUP NO'] || row.Group || row.group;
              const st = row.TIME || row.StartTime || row.startTime || row.Time || row.time;
              const tee = row['Start Tee'] || row.Tee || row.tee || 1;
              const p1 = row['PLAYER 1'] || row.Player1 || row.player1;
              const p2 = row['PLAYER 2'] || row.Player2 || row.player2;
              const p3 = row['PLAYER 3'] || row.Player3 || row.player3;
              const p4 = row['PLAYER 4'] || row.Player4 || row.player4;

              return {
                groupNumber: String(g),
                startTime: normalizeTime(st),
                startingTee: Number(tee),
                players: [p1, p2, p3, p4].filter(p => p !== undefined && p !== null && String(p).trim() !== '') as string[]
              };
            });
          
          if (parsed.length > 0) {
            setGroups(parsed);
          } else {
            alert('No valid Group data found. Check your CSV headers (TIME, GROUP NO, PLAYER 1...).');
          }
        }
      });
    }
  };

  const isComplete = name && round && paceData.length > 0 && groups.length > 0;

  return (
    <div className="p-4 bg-[#111] text-white flex flex-col h-full overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2 text-[#FFDD00]">
          <Trophy size={20} /> Tournament Setup
        </h2>
        <p className="text-gray-500 text-xs mt-1">Import pace of play and starting draw records.</p>
      </div>

      <div className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800 focus-within:border-[#FFDD00] transition-colors">
            <label className="text-[10px] text-gray-500 uppercase font-black mb-1 block">Tournament Name</label>
            <input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Masters"
              className="w-full bg-transparent outline-none font-bold text-sm"
            />
          </div>
          <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800 focus-within:border-[#FFDD00] transition-colors">
            <label className="text-[10px] text-gray-500 uppercase font-black mb-1 block">Round Number</label>
            <input 
              value={round}
              onChange={(e) => setRound(e.target.value)}
              placeholder="e.g. 1"
              className="w-full bg-transparent outline-none font-bold text-sm"
            />
          </div>
        </div>

        {/* CSV Imports */}
        <div className="space-y-3">
          <div className={`p-4 rounded-xl border-2 border-dashed transition-all ${paceData.length > 0 ? 'bg-green-950/20 border-green-900/50' : 'bg-zinc-900/30 border-zinc-800'}`}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold flex items-center gap-2">
                <FileText size={14} className="text-[#FFDD00]" /> Pace of Play (Time Per Hole CSV)
              </label>
              {paceData.length > 0 && <Check size={14} className="text-green-500" />}
            </div>
            <p className="text-[10px] text-gray-500 mb-3">Required: Hole, Minutes</p>
            <label className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 transition-colors rounded text-[10px] font-bold cursor-pointer w-fit">
              <Upload size={12} /> {paceData.length > 0 ? 'Change File' : 'Upload CSV'}
              <input type="file" accept=".csv" onChange={handlePaceUpload} className="hidden" />
            </label>
            {paceData.length > 0 && <span className="text-[9px] text-green-400 mt-2 block">{paceData.length} holes loaded</span>}
          </div>

          <div className={`p-4 rounded-xl border-2 border-dashed transition-all ${groups.length > 0 ? 'bg-green-950/20 border-green-900/50' : 'bg-zinc-900/30 border-zinc-800'}`}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold flex items-center gap-2">
                <Calendar size={14} className="text-[#FFDD00]" /> Starting Draw (Groups CSV)
              </label>
              {groups.length > 0 && <Check size={14} className="text-green-500" />}
            </div>
            <p className="text-[10px] text-gray-500 mb-3">Required: Group, StartTime, Tee, Player1, Player2...</p>
            <label className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 transition-colors rounded text-[10px] font-bold cursor-pointer w-fit">
              <Upload size={12} /> {groups.length > 0 ? 'Change File' : 'Upload CSV'}
              <input type="file" accept=".csv" onChange={handleGroupsUpload} className="hidden" />
            </label>
            {groups.length > 0 && <span className="text-[9px] text-green-400 mt-2 block">{groups.length} groups loaded</span>}
          </div>
        </div>

        <button
          disabled={!isComplete}
          onClick={() => onSetupComplete({ name, round, paceOfPlay: paceData, groups })}
          className={`w-full py-4 rounded-xl font-black text-sm uppercase transition-all flex items-center justify-center gap-2 ${
            isComplete 
              ? 'bg-[#FFDD00] text-black shadow-lg shadow-yellow-500/10' 
              : 'bg-zinc-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          {currentInfo ? 'Update Tournament Data' : 'Save Tournament Data'}
        </button>

        {currentInfo && (
           <p className="text-center text-[9px] text-gray-600 mt-4 italic">
            Current: {currentInfo.name} - Round {currentInfo.round}
           </p>
        )}
      </div>
    </div>
  );
};
