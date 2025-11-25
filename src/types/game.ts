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
}
