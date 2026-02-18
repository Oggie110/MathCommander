import { useEffect, useMemo } from 'react';
import { loadPlayerStats, generateQuestions } from '@/utils/gameLogic';
import { initializeCampaignProgress, generateCampaignMission, isBossLevel, getLegById } from '@/utils/campaignLogic';
import { isFinalBoss as checkIsFinalBoss } from '@/data/narrative';
import { audioEngine } from '@/audio';
import { getBattleMusicForChapter } from '@/audio/sounds';
import { selectWaveLine, selectAlienLine, selectVictoryLine, selectDefeatLine, selectEncourageLine, selectBossDefeatLine, type BodyId } from '@/audio/speechSounds';
import { hashStringToSeed } from '@/utils/seededRandom';
import type { Question } from '@/types/game.ts';

// Planet background mapping for boss battles
// Using new custom boss landscape for all boss fights
const planetBackgrounds: Record<string, string> = {
    moon: '/assets/images/backgrounds/boss-landscape/barren2c.png',
    mars: '/assets/images/backgrounds/boss-landscape/barren2c.png',
    ceres: '/assets/images/backgrounds/boss-landscape/barren2c.png',
    jupiter: '/assets/images/backgrounds/boss-landscape/barren2c.png',
    europa: '/assets/images/backgrounds/boss-landscape/barren2c.png',
    saturn: '/assets/images/backgrounds/boss-landscape/barren2c.png',
    titan: '/assets/images/backgrounds/boss-landscape/barren2c.png',
    uranus: '/assets/images/backgrounds/boss-landscape/barren2c.png',
    neptune: '/assets/images/backgrounds/boss-landscape/barren2c.png',
    pluto: '/assets/images/backgrounds/boss-landscape/barren2c.png',
    haumea: '/assets/images/backgrounds/boss-landscape/barren2c.png',
    makemake: '/assets/images/backgrounds/boss-landscape/barren2c.png',
    eris: '/assets/images/backgrounds/boss-landscape/barren2c.png',
    arrokoth: '/assets/images/backgrounds/boss-landscape/barren2c.png',
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
    // Intro dialogue
    commanderLine: string;
    commanderSoundId: string;
    alienLine: string;
    alienSoundId: string;
    alienSpeaker: string | undefined;
    // Victory/defeat dialogue (pre-selected for preloading)
    victoryLine: string;
    victorySoundId: string;
    defeatLine: string;
    defeatSoundId: string;
    encourageLine: string;
    encourageSoundId: string;
    bossDefeatLine: string | undefined;
    bossDefeatSoundId: string | undefined;
    // Meta
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
    const legIdFromState = locationState?.legId;
    const waypointFromState = locationState?.waypointIndex;
    const isReplayFromState = locationState?.isReplay;

    const result = useMemo(() => {
        const stats = loadPlayerStats();
        const progress = stats.campaignProgress || initializeCampaignProgress();

        const activeLegId = legIdFromState || progress.currentLegId;
        const activeWaypointIndex = waypointFromState ?? progress.currentWaypointIndex;
        const isReplay = isReplayFromState || false;

        const currentLeg = getLegById(activeLegId);
        if (!currentLeg) return null;

        const isBoss = isBossLevel(activeWaypointIndex, currentLeg.waypointsRequired);
        const isFinal = checkIsFinalBoss(currentLeg.toBodyId, isBoss);

        // Generate questions
        const settings = generateCampaignMission(activeLegId, isBoss);
        const newQuestions = generateQuestions(settings, stats);

        // Generate all dialogue upfront so we can preload the exact sounds needed
        const waveDialogue = selectWaveLine(currentLeg.toBodyId as BodyId, isBoss);
        const alienDialogue = selectAlienLine(currentLeg.toBodyId as BodyId, isBoss);
        const victoryDialogue = selectVictoryLine(isBoss, isFinal);
        const defeatDialogue = selectDefeatLine(isBoss);
        const encourageDialogue = selectEncourageLine();
        const bossDefeatDialogue = isBoss && !isFinal
            ? selectBossDefeatLine(currentLeg.toBodyId as BodyId)
            : undefined;

        // Determine background
        const backgroundImage = isBoss
            ? planetBackgrounds[currentLeg.toBodyId] || '/assets/helianthus/Landscapes/Barren/4.png'
            : '/assets/images/backgrounds/base/dark-blue-purple.png';

        // Determine enemy ship (stable per leg/waypoint)
        const seed = hashStringToSeed(`${activeLegId}:${activeWaypointIndex}`);
        const enemyImage = isBoss
            ? '/assets/images/ships/boss-ship.png'
            : enemyShips[seed % enemyShips.length];

        return {
            questions: newQuestions,
            isBossBattle: isBoss,
            isFinalBoss: isFinal,
            currentBodyId: currentLeg.toBodyId,
            backgroundImage,
            enemyImage,
            // Intro dialogue
            commanderLine: waveDialogue.text,
            commanderSoundId: waveDialogue.soundId,
            alienLine: alienDialogue.text,
            alienSoundId: alienDialogue.soundId,
            alienSpeaker: alienDialogue.name,
            // Victory/defeat dialogue
            victoryLine: victoryDialogue.text,
            victorySoundId: victoryDialogue.soundId,
            defeatLine: defeatDialogue.text,
            defeatSoundId: defeatDialogue.soundId,
            encourageLine: encourageDialogue.text,
            encourageSoundId: encourageDialogue.soundId,
            bossDefeatLine: bossDefeatDialogue?.text,
            bossDefeatSoundId: bossDefeatDialogue?.soundId,
            // Meta
            activeLegId,
            activeWaypointIndex,
            isReplay,
        };
    }, [legIdFromState, waypointFromState, isReplayFromState]);

    useEffect(() => {
        if (!result) return;

        const currentLeg = getLegById(result.activeLegId);
        if (!currentLeg) return;

        // Start battle music + ambience
        const battleMusicId = result.isFinalBoss
            ? 'zorathFightMusic'
            : result.isBossBattle
                ? 'bossFightMusic'
                : getBattleMusicForChapter(currentLeg.chapter);
        audioEngine.playMusic(battleMusicId);
        audioEngine.stopAmbience('menuAmbience');
        audioEngine.startAmbience('spaceAmbience');

        // Preload all needed sounds (don't await - let them load in background)
        const soundsToPreload = [
            result.commanderSoundId,
            result.alienSoundId,
            result.victorySoundId,
            result.defeatSoundId,
            result.encourageSoundId,
            result.bossDefeatSoundId,
            // Result screen sounds (preload early for iOS reliability)
            'resultPercentage',
            'resultStarPop1',
            'resultStarPop2',
            'resultStarPop3',
            'resultCorrectCount',
            'resultXP',
        ].filter((id): id is string => !!id);

        audioEngine.preloadAll(soundsToPreload).catch(() => {});
    }, [result]);

    return result;
}
