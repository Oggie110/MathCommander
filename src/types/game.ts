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
    lastSeenRankId?: string; // Track which rank the player has seen the rank-up modal for
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
    badge: string;
}

export const RANKS: Rank[] = [
    { id: 'cadet', name: 'Space Cadet', minXP: 0, badge: '/assets/1NewStuff/NewBadges/rank-cadet.png' },
    { id: 'captain', name: 'Space Captain', minXP: 500, badge: '/assets/1NewStuff/NewBadges/rank-captain.png' },
    { id: 'commander', name: 'Space Commander', minXP: 2000, badge: '/assets/1NewStuff/NewBadges/rank-commander.png' },
    { id: 'admiral', name: 'Fleet Admiral', minXP: 5000, badge: '/assets/1NewStuff/NewBadges/rank-fleet-admiral.png' },
    { id: 'marshal', name: 'Star Marshal', minXP: 10000, badge: '/assets/1NewStuff/NewBadges/rank-star-marshal.png' },
    { id: 'guardian', name: 'Cosmic Guardian', minXP: 25000, badge: '/assets/1NewStuff/NewBadges/rank-cosmic-guardian.png' },
    { id: 'legend', name: 'Galactic Legend', minXP: 50000, badge: '/assets/1NewStuff/NewBadges/rank-galactic-legend.png' },
];
