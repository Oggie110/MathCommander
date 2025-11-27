export interface Question {
    num1: number;
    num2: number;
    answer: number;
    userAnswer?: number;
    correct?: boolean;
}

export interface GameSettings {
    selectedTables: number[];
    maxMultiplier: number;
    questionsPerRound: number;
}

export interface PlayerStats {
    totalXP: number;
    weakAreas: Record<string, number>;
    campaignProgress?: CampaignProgress;
}

export interface CampaignProgress {
    currentLegId: string;
    currentWaypointIndex: number;
    completedLegs: string[];
    starsEarned: Record<string, number>; // legId_waypointIndex -> stars (1-3)
    milestonesSeen?: string[]; // 'inner' | 'kuiper' - tracks which milestones have been shown
}

export interface Rank {
    id: string;
    name: string;
    minXP: number;
}

export const RANKS: Rank[] = [
    { id: 'cadet', name: 'Space Cadet', minXP: 0 },
    { id: 'captain', name: 'Space Captain', minXP: 500 },
    { id: 'commander', name: 'Space Commander', minXP: 2000 },
    { id: 'admiral', name: 'Fleet Admiral', minXP: 5000 },
    { id: 'marshal', name: 'Star Marshal', minXP: 10000 },
    { id: 'guardian', name: 'Cosmic Guardian', minXP: 25000 },
    { id: 'legend', name: 'Galactic Legend', minXP: 50000 },
];
