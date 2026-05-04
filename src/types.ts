export enum TimerType {
  LOST_BALL = 'LOST_BALL',
  SHOT_TIME = 'SHOT_TIME'
}

export interface PlayerShotRecord {
  id: string;
  type: TimerType;
  timestamp: number;
  hole: string;
  group: string;
  playerName: string;
  isFirstToPlay?: boolean;
  timeTaken: number; // in seconds
  limit: number; // 50, 40, or 180 for search
  leeway?: number; // 10%
  isSlow?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface HolePace {
  hole: number;
  minutes: number;
}

export interface GroupData {
  groupNumber: string;
  startTime: string; // "HH:MM"
  startingTee: number; // 1 or 10
  players: string[];
}

export interface TournamentInfo {
  name: string;
  round: string;
  paceOfPlay: HolePace[];
  groups: GroupData[];
}

export interface SessionData {
  records: PlayerShotRecord[];
  tournament?: {
    name: string;
    round: string;
  };
}
