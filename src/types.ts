export enum TimerType {
  LOST_BALL = 'LOST_BALL',
  SHOT_TIME = 'SHOT_TIME'
}

export interface PlayerShotRecord {
  id: string;
  timestamp: number;
  hole: string;
  group: string;
  playerName: string;
  isFirstToPlay: boolean;
  timeTaken: number; // in seconds
  limit: number; // 50 or 40
  leeway: number; // 10%
  isSlow: boolean;
  latitude?: number;
  longitude?: number;
}

export interface SessionData {
  records: PlayerShotRecord[];
}
