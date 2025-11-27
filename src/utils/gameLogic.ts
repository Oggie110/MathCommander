import type { Question, GameSettings, PlayerStats, Rank } from '../types/game.ts';
import { RANKS } from '../types/game.ts';

export const generateQuestions = (
    settings: GameSettings,
    stats?: PlayerStats
): Question[] => {
    const questions: Question[] = [];
    const { selectedTables, maxMultiplier, questionsPerRound } = settings;

    // Create pool of all possible pairs with weighting
    const allPairs: [number, number][] = [];
    selectedTables.forEach(table => {
        for (let i = 1; i <= maxMultiplier; i++) {
            // Reduce frequency of x1 and x10 (only include 30% of the time)
            if (i === 1 || i === 10) {
                if (Math.random() < 0.3) {
                    allPairs.push([table, i]);
                }
            } else {
                allPairs.push([table, i]);
            }
        }
    });

    // Sort pairs by weakness (if stats available)
    if (stats && Object.keys(stats.weakAreas).length > 0) {
        allPairs.sort((a, b) => {
            const keyA = `${a[0]}x${a[1]}`;
            const keyB = `${b[0]}x${b[1]}`;
            const weaknessA = stats.weakAreas[keyA] || 0;
            const weaknessB = stats.weakAreas[keyB] || 0;
            return weaknessB - weaknessA; // Higher weakness first
        });
    }

    // Select questions with bias towards weak areas
    const selectedPairs: [number, number][] = [];

    // 60% weak areas, 40% random
    const weakCount = Math.floor(questionsPerRound * 0.6);
    const randomCount = questionsPerRound - weakCount;

    // Add weak area questions
    for (let i = 0; i < weakCount && i < allPairs.length; i++) {
        selectedPairs.push(allPairs[i]);
    }

    // Add random questions
    const remainingPairs = allPairs.slice(weakCount);
    for (let i = 0; i < randomCount; i++) {
        const randomIndex = Math.floor(Math.random() * remainingPairs.length);
        selectedPairs.push(remainingPairs[randomIndex]);
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
        return JSON.parse(stored);
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
