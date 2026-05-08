import { TournamentInfo } from '../types';

export const calculateTargetTime = (groupNum: string, holeNum: string, tournamentInfo?: TournamentInfo): { time: string; minutes: number; date: Date } => {
  if (!tournamentInfo) return { time: '00:00', minutes: 0, date: new Date() };
  
  const grp = tournamentInfo.groups.find(g => g.groupNumber === groupNum);
  if (!grp) return { time: '00:00', minutes: 0, date: new Date() };

  const targetHoleIdx = parseInt(holeNum);
  
  let totalMinutes = 0;
  // Calculate cumulative pace based on starting tee
  if (grp.startingTee === 1) {
    for (let i = 1; i <= targetHoleIdx; i++) {
      const pace = tournamentInfo.paceOfPlay.find(p => p.hole === i);
      if (pace) totalMinutes += pace.minutes;
    }
  } else {
    // Starting from 10
    const sequence = [10,11,12,13,14,15,16,17,18,1,2,3,4,5,6,7,8,9];
    const targetIdxInSeq = sequence.indexOf(targetHoleIdx);
    if (targetIdxInSeq !== -1) {
      for (let i = 0; i <= targetIdxInSeq; i++) {
        const pace = tournamentInfo.paceOfPlay.find(p => p.hole === sequence[i]);
        if (pace) totalMinutes += pace.minutes;
      }
    }
  }

  const [startH, startM] = grp.startTime.split(':').map(Number);
  const date = new Date();
  date.setHours(startH, startM + totalMinutes, 0, 0);
  
  return {
    time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    minutes: totalMinutes,
    date
  };
};
