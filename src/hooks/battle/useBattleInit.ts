import { useState, useEffect } from 'react';
import { loadPlayerStats, generateQuestions } from '@/utils/gameLogic';
import { initializeCampaignProgress, generateCampaignMission, isBossLevel, getLegById } from '@/utils/campaignLogic';
import { isFinalBoss as checkIsFinalBoss } from '@/data/narrative';
import { audioEngine } from '@/audio';
import { getBattleMusicForChapter } from '@/audio/sounds';
import { selectWaveLine, selectAlienLine, type BodyId } from '@/audio/speechSounds';
import type { Question } from '@/types/game.ts';

// Planet background mapping for boss battles
const planetBackgrounds: Record<string, string> = {
    moon: '/assets/helianthus/Landscapes/Barren/1.png',
    mars: '/assets/helianthus/Landscapes/Desert/1.png',
    ceres: '/assets/helianthus/Landscapes/Barren/2.png',
    jupiter: '/assets/helianthus/Landscapes/Gas_giant_rings/1.png',
    europa: '/assets/helianthus/Landscapes/Arctic/1.png',
    saturn: '/assets/helianthus/Landscapes/Gas_giant_rings/2.png',
    titan: '/assets/helianthus/Landscapes/Terran/1.png',
    uranus: '/assets/helianthus/Landscapes/Gas_giant_rings/3.png',
    neptune: '/assets/helianthus/Landscapes/Gas_giant_rings/4.png',
    pluto: '/assets/helianthus/Landscapes/Tundra/1.png',
    haumea: '/assets/helianthus/Landscapes/Arctic/1.png',
    makemake: '/assets/helianthus/Landscapes/Lava/1.png',
    eris: '/assets/helianthus/Landscapes/Tundra/1.png',
    arrokoth: '/assets/helianthus/Landscapes/Barren/3.png',
};

// Enemy ship pool for regular enemies
const enemyShips = [
    '/assets/helianthus/ShooterFull/Ships/2/Pattern1/Red/Left/1.png',
    '/assets/helianthus/ShooterFull/Ships/2/Pattern2/Blue/Left/1.png',
    '/assets/helianthus/ShooterFull/Ships/3/Pattern1/Green/Left/1.png',
    '/assets/helianthus/ShooterFull/Ships/3/Pattern2/Red/Left/1.png',
    '/assets/helianthus/ShooterFull/Ships/4/Pattern1/Blue/Left/1.png',
    '/assets/helianthus/ShooterFull/Ships/4/Pattern2/Green/Left/1.png',
    '/assets/helianthus/ShooterFull/Ships/5/Pattern1/Red/Left/1.png',
    '/assets/helianthus/ShooterFull/Ships/5/Pattern2/Blue/Left/1.png',
    '/assets/helianthus/ShooterFull/Ships/6/Pattern1/Green/Left/1.png',
    '/assets/helianthus/ShooterFull/Ships/6/Pattern2/Red/Left/1.png',
];

export interface LocationState {
    legId?: string;
    waypointIndex?: number;
    isReplay?: boolean;
}

export interface BattleInitResult {
    questions: Question[];
    isBossBattle: boolean;
    isFinalBoss: boolean;
    currentBodyId: string;
    backgroundImage: string;
    enemyImage: string;
    commanderLine: string;
    commanderSoundId: string;
    alienLine: string;
    alienSoundId: string;
    alienSpeaker: string | undefined;
    activeLegId: string;
    activeWaypointIndex: number;
    isReplay: boolean;
}

/**
 * Initializes the battle state based on location state or saved progress.
 * Handles:
 * - Loading/generating questions
 * - Determining boss status
 * - Setting up background and enemy images
 * - Starting battle music and ambience
 * - Generating dialogue lines
 */
export function useBattleInit(locationState: LocationState | null): BattleInitResult | null {
    const [result, setResult] = useState<BattleInitResult | null>(null);

    useEffect(() => {
        const stats = loadPlayerStats();
        const progress = stats.campaignProgress || initializeCampaignProgress();

        const activeLegId = locationState?.legId || progress.currentLegId;
        const activeWaypointIndex = locationState?.waypointIndex ?? progress.currentWaypointIndex;
        const isReplay = locationState?.isReplay || false;

        const currentLeg = getLegById(activeLegId);
        if (!currentLeg) return;

        const isBoss = isBossLevel(activeWaypointIndex, currentLeg.waypointsRequired);
        const isFinal = checkIsFinalBoss(currentLeg.toBodyId, isBoss);

        // Generate questions
        const settings = generateCampaignMission(activeLegId, isBoss);
        const newQuestions = generateQuestions(settings, stats);

        // Start battle music
        const battleMusicId = isFinal
            ? 'zorathFightMusic'
            : isBoss
                ? 'bossFightMusic'
                : getBattleMusicForChapter(currentLeg.chapter);
        audioEngine.playMusic(battleMusicId);
        audioEngine.stopAmbience('menuAmbience');
        audioEngine.startAmbience('spaceAmbience');

        // Generate dialogue
        const waveDialogue = selectWaveLine(currentLeg.toBodyId as BodyId, isBoss);
        const alienDialogue = selectAlienLine(currentLeg.toBodyId as BodyId, isBoss);

        // Determine background
        const backgroundImage = isBoss
            ? planetBackgrounds[currentLeg.toBodyId] || '/assets/helianthus/Landscapes/Barren/4.png'
            : '/assets/images/backgrounds/base/dark-blue-purple.png';

        // Determine enemy ship
        const enemyImage = isBoss
            ? '/assets/images/ships/boss-ship.png'
            : enemyShips[Math.floor(Math.random() * enemyShips.length)];

        setResult({
            questions: newQuestions,
            isBossBattle: isBoss,
            isFinalBoss: isFinal,
            currentBodyId: currentLeg.toBodyId,
            backgroundImage,
            enemyImage,
            commanderLine: waveDialogue.text,
            commanderSoundId: waveDialogue.soundId,
            alienLine: alienDialogue.text,
            alienSoundId: alienDialogue.soundId,
            alienSpeaker: alienDialogue.name,
            activeLegId,
            activeWaypointIndex,
            isReplay,
        });
    }, [locationState]);

    return result;
}
