export type GameState = 'setup' | 'countdown' | 'racing' | 'finished';

export enum TrackType {
  Oval = 'oval',
  Figure8 = 'figure8',
  RoadCourse = 'roadcourse',
  Speedway = 'speedway',
}

export interface CarConfig {
  id: string;
  color: string;
  number: number;
  isAI: boolean;
  playerIndex?: number;
}

export interface Car extends CarConfig {
  trackProgress: number;
  lane: number;
  laneOffset: number;
  speed: number;
  maxSpeed: number;
  acceleration: number;
  deceleration: number;
  lapsCompleted: number;
  lastCheckpoint: number;
  finished: boolean;
  finishPosition?: number;
  finishTime?: number;
  steeringAngle: number;
  heading: number;
}

export interface PlayerConfig {
  color: string;
  number: number;
  style: number;
}

export interface RaceConfig {
  humanPlayers: number;
  aiRacers: number;
  laps: number;
  playerConfigs: PlayerConfig[];
  trackType: TrackType;
}

export interface Position {
  x: number;
  y: number;
}

export interface PathSegment {
  type: 'straight' | 'curve';
  length: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  startAngle?: number;
  endAngle?: number;
  radius?: number;
  centerX?: number;
  centerY?: number;
}

export interface TrackDimensions {
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
  trackWidth: number;
  laneCount: number;
  pathSegments?: PathSegment[];
  totalLength?: number;
  cumulativeDistances?: number[];
  cachedPath?: Path2D;
}

export interface RaceResults {
  rankings: Car[];
  winner: Car;
}

export interface InputState {
  accelerate: boolean;
  brake: boolean;
  turnLeft: boolean;
  turnRight: boolean;
}

export type PlayerInputs = Record<number, InputState>;
