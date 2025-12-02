import type { Question, GameSettings, PlayerStats, Rank } from '../types/game.ts';
import { RANKS } from '../types/game.ts';

// Progressive x1 frequency based on destination
// Earth/Moon: 30%, Mars: 15%, Ceres: 10%, Jupiter+: 0%
// Exception: Newly introduced tables get 10% x1 at their introduction destination

// Which table is introduced at which destination
const tableIntroducedAt: Record<number, string> = {
    // 1, 2, 3 are starting tables (earth)
    4: 'moon',
    5: 'mars',
    6: 'ceres',
    7: 'jupiter',
    8: 'europa',
    9: 'saturn',
    10: 'uranus',
    11: 'neptune',
    12: 'pluto',
};

const getX1Frequency = (destinationId: string | undefined, table: number): number => {
    // Check if this table is newly introduced at this destination
    if (tableIntroducedAt[table] === destinationId) {
        return 0.1; // 10% for newly introduced tables
    }

    // Progressive reduction based on destination
    const destinationFrequencies: Record<string, number> = {
        earth: 0.3,
        moon: 0.3,
        mars: 0.15,
        ceres: 0.1,
        // Everything from Jupiter onwards: 0%
    };

    return destinationFrequencies[destinationId || 'earth'] ?? 0;
};


export const generateQuestions = (
    settings: GameSettings,
    stats?: PlayerStats
): Question[] => {
    const questions: Question[] = [];
    const { selectedTables, maxMultiplier, questionsPerRound, destinationId } = settings;

    // Create pool of all possible pairs with weighting
    const allPairs: [number, number][] = [];
    selectedTables.forEach(table => {
        for (let i = 1; i <= maxMultiplier; i++) {
            // Progressive x1 frequency reduction (rarer as you progress)
            if (i === 1) {
                const x1Freq = getX1Frequency(destinationId, table);
                if (Math.random() < x1Freq) {
                    allPairs.push([table, i]);
                }
            // x10 stays at 30% throughout
            } else if (i === 10) {
                if (Math.random() < 0.3) {
                    allPairs.push([table, i]);
                }
            } else {
                allPairs.push([table, i]);
            }
        }
    });

    // Remove duplicates from allPairs (dedupe for selection)
    const uniquePairsMap = new Map<string, [number, number]>();
    const pairWeights = new Map<string, number>();

    allPairs.forEach(pair => {
        const key = `${pair[0]}x${pair[1]}`;
        uniquePairsMap.set(key, pair);
        pairWeights.set(key, (pairWeights.get(key) || 0) + 1);
    });

    const uniquePairs = Array.from(uniquePairsMap.values());

    // Select questions with true random selection (no duplicates)
    const selectedPairs: [number, number][] = [];
    const usedKeys = new Set<string>();
    const tableCount = new Map<number, number>(); // Track how many times each table (num1) appears
    const multiplierCount = new Map<number, number>(); // Track how many times each multiplier (num2) appears

    // Max questions per table/multiplier (ensures variety)
    const maxPerTable = Math.ceil(questionsPerRound / Math.max(selectedTables.length, 3));
    const maxPerMultiplier = Math.ceil(questionsPerRound / Math.max(maxMultiplier - 1, 3)); // -1 because x1 is rare

    // Helper to check if we can add a pair
    const canAddPair = (pair: [number, number]): boolean => {
        const key = `${pair[0]}x${pair[1]}`;
        if (usedKeys.has(key)) return false;
        const tCount = tableCount.get(pair[0]) || 0;
        const mCount = multiplierCount.get(pair[1]) || 0;
        return tCount < maxPerTable && mCount < maxPerMultiplier;
    };

    // Helper to add a pair
    const addPair = (pair: [number, number]) => {
        const key = `${pair[0]}x${pair[1]}`;
        selectedPairs.push(pair);
        usedKeys.add(key);
        tableCount.set(pair[0], (tableCount.get(pair[0]) || 0) + 1);
        multiplierCount.set(pair[1], (multiplierCount.get(pair[1]) || 0) + 1);
    };

    // Separate weak area pairs from regular pairs
    const weakPairs: [number, number][] = [];
    const regularPairs: [number, number][] = [];

    if (stats && Object.keys(stats.weakAreas).length > 0) {
        uniquePairs.forEach(pair => {
            const key = `${pair[0]}x${pair[1]}`;
            if (stats.weakAreas[key] && stats.weakAreas[key] > 0) {
                weakPairs.push(pair);
            } else {
                regularPairs.push(pair);
            }
        });
        // Sort weak pairs by weakness (highest first)
        weakPairs.sort((a, b) => {
            const keyA = `${a[0]}x${a[1]}`;
            const keyB = `${b[0]}x${b[1]}`;
            return (stats.weakAreas[keyB] || 0) - (stats.weakAreas[keyA] || 0);
        });
    } else {
        regularPairs.push(...uniquePairs);
    }

    // 60% from weak areas (if available), rest random
    const weakCount = Math.min(Math.floor(questionsPerRound * 0.6), weakPairs.length);

    // Add weak area questions first (sorted by weakness)
    for (let i = 0; i < weakPairs.length && selectedPairs.length < weakCount; i++) {
        const pair = weakPairs[i];
        if (canAddPair(pair)) {
            addPair(pair);
        }
    }

    // Add remaining questions by true random selection from all available pairs
    const availablePairs = [...regularPairs, ...weakPairs].filter(p => canAddPair(p));

    let attempts = 0;
    const maxAttempts = questionsPerRound * 20; // Prevent infinite loops

    while (selectedPairs.length < questionsPerRound && availablePairs.length > 0 && attempts < maxAttempts) {
        attempts++;
        const randomIndex = Math.floor(Math.random() * availablePairs.length);
        const pair = availablePairs[randomIndex];

        if (canAddPair(pair)) {
            addPair(pair);
        }
        // Always remove the pair from available (either used or can't use)
        availablePairs.splice(randomIndex, 1);
    }

    // Shuffle and create question objects
    const shuffled = selectedPairs.sort(() => Math.random() - 0.5);

    shuffled.forEach(([num1, num2]) => {
        questions.push({
            num1,
            num2,
            answer: num1 * num2,
        });
    });

    return questions;
};

export const calculateXP = (score: number, totalQuestions: number): number => {
    const baseXP = 50;
    const bonusXP = Math.floor((score / totalQuestions) * 100);
    return baseXP + bonusXP;
};

export const updateWeakAreas = (
    questions: Question[],
    currentWeakAreas: Record<string, number>
): Record<string, number> => {
    const updated = { ...currentWeakAreas };

    questions.forEach(q => {
        if (q.correct === false) {
            const key = `${q.num1}x${q.num2}`;
            updated[key] = (updated[key] || 0) + 1;
        }
    });

    return updated;
};

export const loadPlayerStats = (): PlayerStats => {
    const stored = localStorage.getItem('spacemath_stats');
    if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure campaignProgress.starsEarned exists (migration for old save data)
        if (parsed.campaignProgress && !parsed.campaignProgress.starsEarned) {
            parsed.campaignProgress.starsEarned = {};
        }
        return parsed;
    }
    return {
        totalXP: 0,
        weakAreas: {},
    };
};

export const savePlayerStats = (stats: PlayerStats): void => {
    localStorage.setItem('spacemath_stats', JSON.stringify(stats));
};

// Rank system utilities
export const getRankForXP = (xp: number): Rank => {
    return [...RANKS].reverse().find(r => xp >= r.minXP) || RANKS[0];
};

export const getNextRank = (xp: number): Rank | null => {
    const currentRank = getRankForXP(xp);
    const currentIndex = RANKS.findIndex(r => r.id === currentRank.id);
    return currentIndex < RANKS.length - 1 ? RANKS[currentIndex + 1] : null;
};

export const getXPProgress = (xp: number): { current: number; next: number; progress: number } => {
    const currentRank = getRankForXP(xp);
    const nextRank = getNextRank(xp);
    if (!nextRank) return { current: xp, next: xp, progress: 1 };

    const progressXP = xp - currentRank.minXP;
    const totalNeeded = nextRank.minXP - currentRank.minXP;
    return { current: progressXP, next: totalNeeded, progress: progressXP / totalNeeded };
};
