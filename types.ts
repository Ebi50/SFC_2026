export enum EventType {
  EZF = 'EZF',
  MZF = 'MZF',
  BZF = 'BZF',
  Handicap = 'Handicap',
}

export enum PerfClass {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
}

export enum Gender {
  Male = 'm',
  Female = 'w',
}

export enum GroupLabel {
  Hobby = 'Hobby',
  Ambitious = 'Ambitioniert',
  Women = 'Frauen',
}

export interface EventNotes {
  [GroupLabel.Hobby]?: string;
  [GroupLabel.Ambitious]?: string;
  [GroupLabel.Women]?: string;
}

export interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  birthYear: number;
  perfClass: PerfClass;
  gender: Gender;
  isRsvMember: boolean;
  club?: string;
  startNumber?: string;
  nationality?: string;
  raceId?: string;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  eventType: EventType;
  notes: string;
  finished: boolean;
  season: number;
}

export interface Result {
  id: string;
  eventId: string;
  participantId: string;
  rankOverall?: number;
  timeSeconds?: number;
  winnerRank?: 1 | 2 | 3;
  finisherGroup?: number;
  dnf: boolean;
  points: number;
  hasAeroBars?: boolean;
  hasTTEquipment?: boolean;
}

export interface Team {
  id: string;
  eventId: string;
  name: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  participantId: string;
  penaltyMinus2: boolean;
}

export interface MaterialHandicapSetting {
  enabled: boolean;
  seconds: number;
}

export interface HandicapRule {
  enabled: boolean;
  seconds: number;
}

export interface AgeHandicapRule extends HandicapRule {
  minAge: number;
  maxAge: number;
}

export interface Settings {
  timeTrialBonuses: {
    aeroBars: MaterialHandicapSetting;
    ttEquipment: MaterialHandicapSetting;
  };
  winnerPoints: number[];
  handicapBasePoints: Record<PerfClass, number>;
  dropScores: number;
  closedSeasons: number[];
  pageViews?: number;
  defaultGroupMapping: {
    hobby: PerfClass;
    ambitious: PerfClass;
  };
  handicapSettings: {
    gender: {
      female: HandicapRule;
    };
    ageBrackets: AgeHandicapRule[];
    perfClass: {
      hobby: HandicapRule;
    };
  };
}

export type View = 'reglement' | 'participants' | 'events' | 'strecken' | 'standings' | 'settings' | 'eventDetail';
