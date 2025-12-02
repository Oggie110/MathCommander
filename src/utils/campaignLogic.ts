import type { CampaignProgress, GameSettings } from '../types/game.ts';
import { campaignLegs, celestialBodies } from '../data/campaignRoute';

export const initializeCampaignProgress = (): CampaignProgress => {
    return {
        currentLegId: 'leg-1',
        currentWaypointIndex: 0,
        completedLegs: [],
        starsEarned: {},
        milestonesSeen: [],
    };
};

// Milestone definitions - which leg triggers each milestone
export const MILESTONE_TRIGGERS: Record<string, 'inner' | 'kuiper'> = {
    'leg-4': 'inner',  // Entering gas giants (ceres → jupiter)
    'leg-10': 'kuiper', // Entering Kuiper Belt (neptune → pluto)
};

/**
 * Check if a milestone should be shown for the current leg
 * Returns the milestone type if one should be shown, null otherwise
 */
export const checkForMilestone = (progress: CampaignProgress): 'inner' | 'kuiper' | null => {
    const milestoneType = MILESTONE_TRIGGERS[progress.currentLegId];
    if (!milestoneType) return null;

    // Only show if at waypoint 0 (just entered this leg) and not already seen
    if (progress.currentWaypointIndex !== 0) return null;

    const seen = progress.milestonesSeen || [];
    if (seen.includes(milestoneType)) return null;

    return milestoneType;
};

/**
 * Mark a milestone as seen
 */
export const markMilestoneSeen = (progress: CampaignProgress, milestone: 'inner' | 'kuiper'): CampaignProgress => {
    const seen = progress.milestonesSeen || [];
    if (seen.includes(milestone)) return progress;

    return {
        ...progress,
        milestonesSeen: [...seen, milestone],
    };
};

export const getLegById = (legId: string) => {
    return campaignLegs.find(l => l.id === legId);
};

export const getLegIndex = (legId: string): number => {
    return campaignLegs.findIndex(l => l.id === legId);
};

export const generateCampaignMission = (legId: string, isBoss: boolean = false): GameSettings => {
    const leg = getLegById(legId);
    if (!leg) throw new Error('Leg not found');

    const toBody = celestialBodies[leg.toBodyId];

    return {
        selectedTables: toBody.focusTables,
        maxMultiplier: 12,
        questionsPerRound: isBoss ? 15 : 10,
    };
};

export const isBossLevel = (waypointIndex: number, totalWaypoints: number): boolean => {
    return waypointIndex === totalWaypoints - 1;
};

export const completeMission = (
    progress: CampaignProgress,
    score: number,
    totalQuestions: number
): CampaignProgress => {
    const newProgress = { ...progress };
    const stars = calculateStars(score, totalQuestions);

    const key = `${progress.currentLegId}_${progress.currentWaypointIndex}`;
    newProgress.starsEarned[key] = Math.max(newProgress.starsEarned[key] || 0, stars);

    const currentLeg = getLegById(progress.currentLegId);
    if (!currentLeg) return newProgress;

    // Only advance if passed (e.g. > 70%)
    if (score / totalQuestions >= 0.7) {
        if (progress.currentWaypointIndex < currentLeg.waypointsRequired - 1) {
            newProgress.currentWaypointIndex++;
        } else {
            // Leg completed
            if (!newProgress.completedLegs.includes(progress.currentLegId)) {
                newProgress.completedLegs.push(progress.currentLegId);
            }

            // Find next leg
            const currentLegIndex = campaignLegs.findIndex(l => l.id === progress.currentLegId);
            if (currentLegIndex < campaignLegs.length - 1) {
                newProgress.currentLegId = campaignLegs[currentLegIndex + 1].id;
                newProgress.currentWaypointIndex = 0;
            }
        }
    }

    return newProgress;
};

export const calculateStars = (score: number, total: number): number => {
    const percentage = score / total;
    if (percentage >= 0.9) return 3;  // 90%+
    if (percentage >= 0.7) return 2;  // 70-89% (pass)
    if (score > 0) return 1;          // 1-69% (fail but tried)
    return 0;                         // 0% = nothing right
};

export const getCompletedWaypointsCount = (progress: CampaignProgress): number => {
    let count = 0;

    // Count fully completed legs
    progress.completedLegs.forEach(legId => {
        const leg = getLegById(legId);
        if (leg) count += leg.waypointsRequired;
    });

    // Add current leg progress (if not already counted in completedLegs)
    if (!progress.completedLegs.includes(progress.currentLegId)) {
        count += progress.currentWaypointIndex;
    }

    return count;
};

export const getTotalWaypoints = (): number => {
    return campaignLegs.reduce((acc, leg) => acc + leg.waypointsRequired, 0);
};

export const getTotalStarsEarned = (progress: CampaignProgress): number => {
    return Object.values(progress.starsEarned).reduce((a, b) => a + b, 0);
};
