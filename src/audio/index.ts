// Audio Engine - Main exports
export { audioEngine, AudioEngine } from './AudioEngine';
export { useGameAudio, useSFX, useMusic } from './useGameAudio';
export { SOUNDS, getSoundsByCategory, getAllSoundIds, getBattleMusicForChapter } from './sounds';
export type {
    SoundDefinition,
    PlayOptions,
    MusicOptions,
    CategoryVolumes,
    AudioState,
} from './types';
