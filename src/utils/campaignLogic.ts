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

// Progressive max multiplier based on destination
// Early game: 2-10, Mid game: 2-11, Late game: 2-12
const getMaxMultiplier = (destinationId: string): number => {
    const multiplierByDestination: Record<string, number> = {
        // Early game (Inner System): max x10
        moon: 10,
        mars: 10,
        ceres: 10,
        // Mid game (Gas Giants): max x11
        jupiter: 11,
        europa: 11,
        saturn: 11,
        titan: 11,
        // Late game (Ice Giants + Kuiper): max x12
        // Everything else defaults to 12
    };
    return multiplierByDestination[destinationId] ?? 12;
};

export const generateCampaignMission = (legId: string, isBoss: boolean = false): GameSettings => {
    const leg = getLegById(legId);
    if (!leg) throw new Error('Leg not found');

    const toBody = celestialBodies[leg.toBodyId];

    return {
        selectedTables: toBody.focusTables,
        maxMultiplier: getMaxMultiplier(leg.toBodyId),
        questionsPerRound: isBoss ? 15 : 10,
        destinationId: leg.toBodyId, // Used for progressive x1 frequency
    };
};

export const isBossLevel = (waypointIndex: number, totalWaypoints: number): boolean => {
    return waypointIndex === totalWaypoints - 1;
};

export const completeMission = (
    progress: CampaignProgress,
    score: number,
    totalQuestions: number,
    playedLegId?: string,
    playedWaypointIndex?: number
): CampaignProgress => {
    // Deep copy to avoid mutating original progress
    const newProgress: CampaignProgress = {
        ...progress,
        completedLegs: [...progress.completedLegs],
        starsEarned: { ...progress.starsEarned },
        milestonesSeen: [...(progress.milestonesSeen || [])],
    };
    const stars = calculateStars(score, totalQuestions);

    // Use the actually played leg/waypoint for star tracking
    const actualLegId = playedLegId ?? progress.currentLegId;
    const actualWaypointIndex = playedWaypointIndex ?? progress.currentWaypointIndex;

    // Store stars for the mission that was actually played
    const key = `${actualLegId}_${actualWaypointIndex}`;
    newProgress.starsEarned[key] = Math.max(newProgress.starsEarned[key] || 0, stars);

    // Only advance campaign progress if playing the CURRENT mission (not replaying old ones)
    const isCurrentMission = actualLegId === progress.currentLegId &&
                             actualWaypointIndex === progress.currentWaypointIndex;

    console.log('[completeMission] actualLegId:', actualLegId, 'progress.currentLegId:', progress.currentLegId);
    console.log('[completeMission] actualWaypointIndex:', actualWaypointIndex, 'progress.currentWaypointIndex:', progress.currentWaypointIndex);
    console.log('[completeMission] isCurrentMission:', isCurrentMission);

    if (!isCurrentMission) {
        // Just return with updated stars, don't advance progress
        console.log('[completeMission] NOT current mission, skipping progression');
        return newProgress;
    }

    const currentLeg = getLegById(progress.currentLegId);
    if (!currentLeg) return newProgress;

    // Only advance if passed (e.g. > 70%)
    const passed = score / totalQuestions >= 0.7;
    console.log('[completeMission] Score:', score, '/', totalQuestions, '=', (score / totalQuestions * 100).toFixed(1) + '%', 'Passed:', passed);

    if (passed) {
        if (progress.currentWaypointIndex < currentLeg.waypointsRequired - 1) {
            console.log('[completeMission] Advancing waypoint:', progress.currentWaypointIndex, '->', progress.currentWaypointIndex + 1);
            newProgress.currentWaypointIndex++;
        } else {
            // Leg completed
            console.log('[completeMission] Completing leg:', progress.currentLegId);
            if (!newProgress.completedLegs.includes(progress.currentLegId)) {
                newProgress.completedLegs.push(progress.currentLegId);
            }

            // Find next leg
            const currentLegIndex = campaignLegs.findIndex(l => l.id === progress.currentLegId);
            if (currentLegIndex < campaignLegs.length - 1) {
                const nextLegId = campaignLegs[currentLegIndex + 1].id;
                console.log('[completeMission] Advancing to next leg:', nextLegId);
                newProgress.currentLegId = nextLegId;
                newProgress.currentWaypointIndex = 0;
            } else {
                console.log('[completeMission] Already at last leg!');
            }
        }
    }

    console.log('[completeMission] New progress:', JSON.stringify(newProgress));
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
