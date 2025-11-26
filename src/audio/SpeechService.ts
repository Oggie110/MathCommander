// Speech Service - High-level API for game speech playback
import { audioEngine } from './AudioEngine';
import {
    type BodyId,
    ALIEN_GENERIC_TAUNT_IDS,
    getAlienSectorTauntIds,
    WAVE_GENERIC_IDS,
    getWaveSectorIds,
    getBossEncounterId,
    getAlienBossIntroId,
    getAlienBossDefeatId,
    VICTORY_GENERIC_IDS,
    VICTORY_BOSS_ID,
    VICTORY_FINAL_ID,
    DEFEAT_GENERIC_IDS,
    DEFEAT_BOSS_ID,
    ENCOURAGE_IDS,
    MILESTONE_INNER_ID,
    MILESTONE_KUIPER_ID,
} from './speechSounds';

// Helper to pick random element from array
const randomPick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * SpeechService - Provides game-context-aware speech playback
 *
 * All methods return Promises that resolve when speech finishes (or is skipped).
 * Use stopCurrentSpeech() to skip/interrupt any playing speech.
 */
class SpeechService {
    /**
     * Play a commander wave intro line
     * - For boss battles: plays the specific boss encounter line
     * - For regular waves: 50% chance sector-specific, 50% generic
     */
    async playWaveIntro(bodyId: string, isBoss: boolean): Promise<void> {
        if (isBoss) {
            const soundId = getBossEncounterId(bodyId as BodyId);
            return audioEngine.playSpeech(soundId);
        }

        // 50% chance for sector-specific line
        if (Math.random() > 0.5) {
            const sectorIds = getWaveSectorIds(bodyId as BodyId);
            if (sectorIds.length > 0) {
                return audioEngine.playSpeech(randomPick(sectorIds));
            }
        }

        // Generic wave line
        return audioEngine.playSpeech(randomPick(WAVE_GENERIC_IDS));
    }

    /**
     * Play an alien taunt line (with alien EQ effect)
     * - For boss battles: plays the boss intro line
     * - For regular waves: 50% chance sector-specific, 50% generic
     */
    async playAlienTaunt(bodyId: string, isBoss: boolean): Promise<void> {
        if (isBoss) {
            return this.playBossIntro(bodyId);
        }

        // 50% chance for sector-specific line
        if (Math.random() > 0.5) {
            const sectorIds = getAlienSectorTauntIds(bodyId as BodyId);
            if (sectorIds.length > 0) {
                return audioEngine.playAlienSpeech(randomPick(sectorIds));
            }
        }

        // Generic taunt
        return audioEngine.playAlienSpeech(randomPick(ALIEN_GENERIC_TAUNT_IDS));
    }

    /**
     * Play alien boss intro line (with alien EQ effect)
     */
    async playBossIntro(bodyId: string): Promise<void> {
        const soundId = getAlienBossIntroId(bodyId as BodyId);
        return audioEngine.playAlienSpeech(soundId);
    }

    /**
     * Play alien boss defeat line (with alien EQ effect)
     */
    async playBossDefeat(bodyId: string): Promise<void> {
        const soundId = getAlienBossDefeatId(bodyId as BodyId);
        return audioEngine.playAlienSpeech(soundId);
    }

    /**
     * Play victory line
     * - Final boss: special victory message
     * - Regular boss: boss victory message
     * - Regular enemy: random generic victory
     */
    async playVictory(isBoss: boolean, isFinalBoss: boolean): Promise<void> {
        if (isFinalBoss) {
            return audioEngine.playSpeech(VICTORY_FINAL_ID);
        }
        if (isBoss) {
            return audioEngine.playSpeech(VICTORY_BOSS_ID);
        }
        return audioEngine.playSpeech(randomPick(VICTORY_GENERIC_IDS));
    }

    /**
     * Play defeat line
     * - Boss defeat: special defeat message
     * - Regular defeat: random generic defeat
     */
    async playDefeat(isBoss: boolean): Promise<void> {
        if (isBoss) {
            return audioEngine.playSpeech(DEFEAT_BOSS_ID);
        }
        return audioEngine.playSpeech(randomPick(DEFEAT_GENERIC_IDS));
    }

    /**
     * Play encouragement line (after defeat)
     */
    async playEncouragement(): Promise<void> {
        return audioEngine.playSpeech(randomPick(ENCOURAGE_IDS));
    }

    /**
     * Play milestone line
     * - 'inner': Leaving inner system, entering gas giants
     * - 'kuiper': Entering Kuiper Belt
     */
    async playMilestone(type: 'inner' | 'kuiper'): Promise<void> {
        const soundId = type === 'inner' ? MILESTONE_INNER_ID : MILESTONE_KUIPER_ID;
        return audioEngine.playSpeech(soundId);
    }

    /**
     * Stop currently playing speech immediately
     */
    stopCurrentSpeech(): void {
        audioEngine.stopSpeech();
    }

    /**
     * Check if speech is currently playing
     */
    isSpeaking(): boolean {
        return audioEngine.isSpeechPlaying();
    }

    /**
     * Play a specific speech sound by ID
     * Useful for testing or custom speech triggers
     */
    async playById(soundId: string): Promise<void> {
        return audioEngine.playSpeech(soundId);
    }

    /**
     * Play a specific alien speech sound by ID (with alien EQ effect)
     * Used for alien dialogue in battle scenes
     */
    async playAlienById(soundId: string): Promise<void> {
        return audioEngine.playAlienSpeech(soundId);
    }
}

// Export singleton instance
export const speechService = new SpeechService();

// Export class for testing
export { SpeechService };
