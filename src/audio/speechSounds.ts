// Speech Sound Registry - All 166 dialogue audio files
import type { SoundDefinition } from './types';

const ALIENS_TAUNTS = '/assets/audio-assets/speech/aliens/taunts';
const ALIENS_BOSS = '/assets/audio-assets/speech/aliens/boss';
const HUMANS_COMMANDER = '/assets/audio-assets/speech/humans/commander';
const HUMANS_WAVES = '/assets/audio-assets/speech/humans/waves';

// Helper to create speech sound definition
const speech = (id: string, src: string, volume = 0.8): SoundDefinition => ({
    id,
    src,
    category: 'speech',
    volume,
});

// Alien speech at lower volume
const alienSpeech = (id: string, src: string) => speech(id, src, 0.5);

// ============================================
// ALIEN TAUNTS (56 total)
// ============================================

// Generic alien taunts (14)
const ALIEN_GENERIC_TAUNTS: Record<string, SoundDefinition> = {
    taunt_01_calculating: alienSpeech('taunt_01_calculating', `${ALIENS_TAUNTS}/taunt_01_calculating.wav`),
    taunt_02_miscalculation: alienSpeech('taunt_02_miscalculation', `${ALIENS_TAUNTS}/taunt_02_miscalculation.wav`),
    taunt_03_primitive: alienSpeech('taunt_03_primitive', `${ALIENS_TAUNTS}/taunt_03_primitive.wav`),
    taunt_04_zero: alienSpeech('taunt_04_zero', `${ALIENS_TAUNTS}/taunt_04_zero.wav`),
    taunt_05_probability: alienSpeech('taunt_05_probability', `${ALIENS_TAUNTS}/taunt_05_probability.wav`),
    taunt_06_odds: alienSpeech('taunt_06_odds', `${ALIENS_TAUNTS}/taunt_06_odds.wav`),
    taunt_07_numbers: alienSpeech('taunt_07_numbers', `${ALIENS_TAUNTS}/taunt_07_numbers.wav`),
    taunt_08_mean_nothing: alienSpeech('taunt_08_mean_nothing', `${ALIENS_TAUNTS}/taunt_08_mean_nothing.wav`),
    taunt_09_thousand: alienSpeech('taunt_09_thousand', `${ALIENS_TAUNTS}/taunt_09_thousand.wav`),
    taunt_10_mathematics: alienSpeech('taunt_10_mathematics', `${ALIENS_TAUNTS}/taunt_10_mathematics.wav`),
    taunt_11_flee: alienSpeech('taunt_11_flee', `${ALIENS_TAUNTS}/taunt_11_flee.wav`),
    taunt_12_variable: alienSpeech('taunt_12_variable', `${ALIENS_TAUNTS}/taunt_12_variable.wav`),
    taunt_13_solve_x: alienSpeech('taunt_13_solve_x', `${ALIENS_TAUNTS}/taunt_13_solve_x.wav`),
    taunt_14_zero_chance: alienSpeech('taunt_14_zero_chance', `${ALIENS_TAUNTS}/taunt_14_zero_chance.wav`),
};

// Sector-specific alien taunts (42: 14 sectors × 3 lines each)
const ALIEN_SECTOR_TAUNTS: Record<string, SoundDefinition> = {
    // Moon (3)
    moon_01: alienSpeech('moon_01', `${ALIENS_TAUNTS}/moon_01.wav`),
    moon_02: alienSpeech('moon_02', `${ALIENS_TAUNTS}/moon_02.wav`),
    moon_03: alienSpeech('moon_03', `${ALIENS_TAUNTS}/moon_03.wav`),
    // Mars (3)
    mars_01: alienSpeech('mars_01', `${ALIENS_TAUNTS}/mars_01.wav`),
    mars_02: alienSpeech('mars_02', `${ALIENS_TAUNTS}/mars_02.wav`),
    mars_03: alienSpeech('mars_03', `${ALIENS_TAUNTS}/mars_03.wav`),
    // Ceres (3)
    ceres_01: alienSpeech('ceres_01', `${ALIENS_TAUNTS}/ceres_01.wav`),
    ceres_02: alienSpeech('ceres_02', `${ALIENS_TAUNTS}/ceres_02.wav`),
    ceres_03: alienSpeech('ceres_03', `${ALIENS_TAUNTS}/ceres_03.wav`),
    // Jupiter (3)
    jupiter_01: alienSpeech('jupiter_01', `${ALIENS_TAUNTS}/jupiter_01.wav`),
    jupiter_02: alienSpeech('jupiter_02', `${ALIENS_TAUNTS}/jupiter_02.wav`),
    jupiter_03: alienSpeech('jupiter_03', `${ALIENS_TAUNTS}/jupiter_03.wav`),
    // Europa (3)
    europa_01: alienSpeech('europa_01', `${ALIENS_TAUNTS}/europa_01.wav`),
    europa_02: alienSpeech('europa_02', `${ALIENS_TAUNTS}/europa_02.wav`),
    europa_03: alienSpeech('europa_03', `${ALIENS_TAUNTS}/europa_03.wav`),
    // Saturn (3)
    saturn_01: alienSpeech('saturn_01', `${ALIENS_TAUNTS}/saturn_01.wav`),
    saturn_02: alienSpeech('saturn_02', `${ALIENS_TAUNTS}/saturn_02.wav`),
    saturn_03: alienSpeech('saturn_03', `${ALIENS_TAUNTS}/saturn_03.wav`),
    // Titan (3)
    titan_01: alienSpeech('titan_01', `${ALIENS_TAUNTS}/titan_01.wav`),
    titan_02: alienSpeech('titan_02', `${ALIENS_TAUNTS}/titan_02.wav`),
    titan_03: alienSpeech('titan_03', `${ALIENS_TAUNTS}/titan_03.wav`),
    // Uranus (3)
    uranus_01: alienSpeech('uranus_01', `${ALIENS_TAUNTS}/uranus_01.wav`),
    uranus_02: alienSpeech('uranus_02', `${ALIENS_TAUNTS}/uranus_02.wav`),
    uranus_03: alienSpeech('uranus_03', `${ALIENS_TAUNTS}/uranus_03.wav`),
    // Neptune (3)
    neptune_01: alienSpeech('neptune_01', `${ALIENS_TAUNTS}/neptune_01.wav`),
    neptune_02: alienSpeech('neptune_02', `${ALIENS_TAUNTS}/neptune_02.wav`),
    neptune_03: alienSpeech('neptune_03', `${ALIENS_TAUNTS}/neptune_03.wav`),
    // Pluto (3)
    pluto_01: alienSpeech('pluto_01', `${ALIENS_TAUNTS}/pluto_01.wav`),
    pluto_02: alienSpeech('pluto_02', `${ALIENS_TAUNTS}/pluto_02.wav`),
    pluto_03: alienSpeech('pluto_03', `${ALIENS_TAUNTS}/pluto_03.wav`),
    // Haumea (3)
    haumea_01: alienSpeech('haumea_01', `${ALIENS_TAUNTS}/haumea_01.wav`),
    haumea_02: alienSpeech('haumea_02', `${ALIENS_TAUNTS}/haumea_02.wav`),
    haumea_03: alienSpeech('haumea_03', `${ALIENS_TAUNTS}/haumea_03.wav`),
    // Makemake (3)
    makemake_01: alienSpeech('makemake_01', `${ALIENS_TAUNTS}/makemake_01.wav`),
    makemake_02: alienSpeech('makemake_02', `${ALIENS_TAUNTS}/makemake_02.wav`),
    makemake_03: alienSpeech('makemake_03', `${ALIENS_TAUNTS}/makemake_03.wav`),
    // Eris (3)
    eris_01: alienSpeech('eris_01', `${ALIENS_TAUNTS}/eris_01.wav`),
    eris_02: alienSpeech('eris_02', `${ALIENS_TAUNTS}/eris_02.wav`),
    eris_03: alienSpeech('eris_03', `${ALIENS_TAUNTS}/eris_03.wav`),
    // Arrokoth (3)
    arrokoth_01: alienSpeech('arrokoth_01', `${ALIENS_TAUNTS}/arrokoth_01.wav`),
    arrokoth_02: alienSpeech('arrokoth_02', `${ALIENS_TAUNTS}/arrokoth_02.wav`),
    arrokoth_03: alienSpeech('arrokoth_03', `${ALIENS_TAUNTS}/arrokoth_03.wav`),
};

// ============================================
// ALIEN BOSS LINES (28 total)
// ============================================

// Boss intros (14)
const ALIEN_BOSS_INTROS: Record<string, SoundDefinition> = {
    boss_moon: alienSpeech('boss_moon', `${ALIENS_BOSS}/boss_moon.wav`),
    boss_mars: alienSpeech('boss_mars', `${ALIENS_BOSS}/boss_mars.wav`),
    boss_ceres: alienSpeech('boss_ceres', `${ALIENS_BOSS}/boss_ceres.wav`),
    boss_jupiter: alienSpeech('boss_jupiter', `${ALIENS_BOSS}/boss_jupiter.wav`),
    boss_europa: alienSpeech('boss_europa', `${ALIENS_BOSS}/boss_europa.wav`),
    boss_saturn: alienSpeech('boss_saturn', `${ALIENS_BOSS}/boss_saturn.wav`),
    boss_titan: alienSpeech('boss_titan', `${ALIENS_BOSS}/boss_titan.wav`),
    boss_uranus: alienSpeech('boss_uranus', `${ALIENS_BOSS}/boss_uranus.wav`),
    boss_neptune: alienSpeech('boss_neptune', `${ALIENS_BOSS}/boss_neptune.wav`),
    boss_pluto: alienSpeech('boss_pluto', `${ALIENS_BOSS}/boss_pluto.wav`),
    boss_haumea: alienSpeech('boss_haumea', `${ALIENS_BOSS}/boss_haumea.wav`),
    boss_makemake: alienSpeech('boss_makemake', `${ALIENS_BOSS}/boss_makemake.wav`),
    boss_eris: alienSpeech('boss_eris', `${ALIENS_BOSS}/boss_eris.wav`),
    boss_arrokoth: alienSpeech('boss_arrokoth', `${ALIENS_BOSS}/boss_arrokoth.wav`),
};

// Boss defeats (14)
const ALIEN_BOSS_DEFEATS: Record<string, SoundDefinition> = {
    defeat_moon: alienSpeech('defeat_moon', `${ALIENS_BOSS}/defeat_moon.wav`),
    defeat_mars: alienSpeech('defeat_mars', `${ALIENS_BOSS}/defeat_mars.wav`),
    defeat_ceres: alienSpeech('defeat_ceres', `${ALIENS_BOSS}/defeat_ceres.wav`),
    defeat_jupiter: alienSpeech('defeat_jupiter', `${ALIENS_BOSS}/defeat_jupiter.wav`),
    defeat_europa: alienSpeech('defeat_europa', `${ALIENS_BOSS}/defeat_europa.wav`),
    defeat_saturn: alienSpeech('defeat_saturn', `${ALIENS_BOSS}/defeat_saturn.wav`),
    defeat_titan: alienSpeech('defeat_titan', `${ALIENS_BOSS}/defeat_titan.wav`),
    defeat_uranus: alienSpeech('defeat_uranus', `${ALIENS_BOSS}/defeat_uranus.wav`),
    defeat_neptune: alienSpeech('defeat_neptune', `${ALIENS_BOSS}/defeat_neptune.wav`),
    defeat_pluto: alienSpeech('defeat_pluto', `${ALIENS_BOSS}/defeat_pluto.wav`),
    defeat_haumea: alienSpeech('defeat_haumea', `${ALIENS_BOSS}/defeat_haumea.wav`),
    defeat_makemake: alienSpeech('defeat_makemake', `${ALIENS_BOSS}/defeat_makemake.wav`),
    defeat_eris: alienSpeech('defeat_eris', `${ALIENS_BOSS}/defeat_eris.wav`),
    defeat_arrokoth: alienSpeech('defeat_arrokoth', `${ALIENS_BOSS}/defeat_arrokoth.wav`),
};

// ============================================
// HUMAN COMMANDER LINES (18 total)
// ============================================

// Victory lines (8)
const COMMANDER_VICTORY: Record<string, SoundDefinition> = {
    victory_01: speech('victory_01', `${HUMANS_COMMANDER}/victory_01.wav`),
    victory_02: speech('victory_02', `${HUMANS_COMMANDER}/victory_02.wav`),
    victory_03: speech('victory_03', `${HUMANS_COMMANDER}/victory_03.wav`),
    victory_04: speech('victory_04', `${HUMANS_COMMANDER}/victory_04.wav`),
    victory_05: speech('victory_05', `${HUMANS_COMMANDER}/victory_05.wav`),
    victory_06: speech('victory_06', `${HUMANS_COMMANDER}/victory_06.wav`),
    victory_boss: speech('victory_boss', `${HUMANS_COMMANDER}/victory_boss.wav`),
    victory_final: speech('victory_final', `${HUMANS_COMMANDER}/victory_final.wav`),
};

// Defeat lines (5)
const COMMANDER_DEFEAT: Record<string, SoundDefinition> = {
    defeat_cmd_01: alienSpeech('defeat_cmd_01', `${HUMANS_COMMANDER}/defeat_cmd_01.wav`),
    defeat_cmd_02: alienSpeech('defeat_cmd_02', `${HUMANS_COMMANDER}/defeat_cmd_02.wav`),
    defeat_cmd_03: alienSpeech('defeat_cmd_03', `${HUMANS_COMMANDER}/defeat_cmd_03.wav`),
    defeat_cmd_04: alienSpeech('defeat_cmd_04', `${HUMANS_COMMANDER}/defeat_cmd_04.wav`),
    defeat_cmd_boss: alienSpeech('defeat_cmd_boss', `${HUMANS_COMMANDER}/defeat_cmd_boss.wav`),
};

// Encouragement lines (3)
const COMMANDER_ENCOURAGE: Record<string, SoundDefinition> = {
    encourage_01: speech('encourage_01', `${HUMANS_COMMANDER}/encourage_01.wav`),
    encourage_02: speech('encourage_02', `${HUMANS_COMMANDER}/encourage_02.wav`),
    encourage_03: speech('encourage_03', `${HUMANS_COMMANDER}/encourage_03.wav`),
};

// Milestone lines (2)
const COMMANDER_MILESTONE: Record<string, SoundDefinition> = {
    milestone_inner: speech('milestone_inner', `${HUMANS_COMMANDER}/milestone_inner.wav`),
    milestone_kuiper: speech('milestone_kuiper', `${HUMANS_COMMANDER}/milestone_kuiper.wav`),
};

// ============================================
// HUMAN WAVE ENCOUNTER LINES (64 total)
// ============================================

// Generic wave encounters (8)
const WAVE_GENERIC: Record<string, SoundDefinition> = {
    wave_generic_01: speech('wave_generic_01', `${HUMANS_WAVES}/wave_generic_01.wav`),
    wave_generic_02: speech('wave_generic_02', `${HUMANS_WAVES}/wave_generic_02.wav`),
    wave_generic_03: speech('wave_generic_03', `${HUMANS_WAVES}/wave_generic_03.wav`),
    wave_generic_04: speech('wave_generic_04', `${HUMANS_WAVES}/wave_generic_04.wav`),
    wave_generic_05: speech('wave_generic_05', `${HUMANS_WAVES}/wave_generic_05.wav`),
    wave_generic_06: speech('wave_generic_06', `${HUMANS_WAVES}/wave_generic_06.wav`),
    wave_generic_07: speech('wave_generic_07', `${HUMANS_WAVES}/wave_generic_07.wav`),
    wave_generic_08: speech('wave_generic_08', `${HUMANS_WAVES}/wave_generic_08.wav`),
};

// Sector-specific wave encounters (42: 14 sectors × 3 lines each)
const WAVE_SECTOR: Record<string, SoundDefinition> = {
    // Moon (3)
    wave_moon_01: speech('wave_moon_01', `${HUMANS_WAVES}/wave_moon_01.wav`),
    wave_moon_02: speech('wave_moon_02', `${HUMANS_WAVES}/wave_moon_02.wav`),
    wave_moon_03: speech('wave_moon_03', `${HUMANS_WAVES}/wave_moon_03.wav`),
    // Mars (3)
    wave_mars_01: speech('wave_mars_01', `${HUMANS_WAVES}/wave_mars_01.wav`),
    wave_mars_02: speech('wave_mars_02', `${HUMANS_WAVES}/wave_mars_02.wav`),
    wave_mars_03: speech('wave_mars_03', `${HUMANS_WAVES}/wave_mars_03.wav`),
    // Ceres (3)
    wave_ceres_01: speech('wave_ceres_01', `${HUMANS_WAVES}/wave_ceres_01.wav`),
    wave_ceres_02: speech('wave_ceres_02', `${HUMANS_WAVES}/wave_ceres_02.wav`),
    wave_ceres_03: speech('wave_ceres_03', `${HUMANS_WAVES}/wave_ceres_03.wav`),
    // Jupiter (3)
    wave_jupiter_01: speech('wave_jupiter_01', `${HUMANS_WAVES}/wave_jupiter_01.wav`),
    wave_jupiter_02: speech('wave_jupiter_02', `${HUMANS_WAVES}/wave_jupiter_02.wav`),
    wave_jupiter_03: speech('wave_jupiter_03', `${HUMANS_WAVES}/wave_jupiter_03.wav`),
    // Europa (3)
    wave_europa_01: speech('wave_europa_01', `${HUMANS_WAVES}/wave_europa_01.wav`),
    wave_europa_02: speech('wave_europa_02', `${HUMANS_WAVES}/wave_europa_02.wav`),
    wave_europa_03: speech('wave_europa_03', `${HUMANS_WAVES}/wave_europa_03.wav`),
    // Saturn (3)
    wave_saturn_01: speech('wave_saturn_01', `${HUMANS_WAVES}/wave_saturn_01.wav`),
    wave_saturn_02: speech('wave_saturn_02', `${HUMANS_WAVES}/wave_saturn_02.wav`),
    wave_saturn_03: speech('wave_saturn_03', `${HUMANS_WAVES}/wave_saturn_03.wav`),
    // Titan (3)
    wave_titan_01: speech('wave_titan_01', `${HUMANS_WAVES}/wave_titan_01.wav`),
    wave_titan_02: speech('wave_titan_02', `${HUMANS_WAVES}/wave_titan_02.wav`),
    wave_titan_03: speech('wave_titan_03', `${HUMANS_WAVES}/wave_titan_03.wav`),
    // Uranus (3)
    wave_uranus_01: speech('wave_uranus_01', `${HUMANS_WAVES}/wave_uranus_01.wav`),
    wave_uranus_02: speech('wave_uranus_02', `${HUMANS_WAVES}/wave_uranus_02.wav`),
    wave_uranus_03: speech('wave_uranus_03', `${HUMANS_WAVES}/wave_uranus_03.wav`),
    // Neptune (3)
    wave_neptune_01: speech('wave_neptune_01', `${HUMANS_WAVES}/wave_neptune_01.wav`),
    wave_neptune_02: speech('wave_neptune_02', `${HUMANS_WAVES}/wave_neptune_02.wav`),
    wave_neptune_03: speech('wave_neptune_03', `${HUMANS_WAVES}/wave_neptune_03.wav`),
    // Pluto (3)
    wave_pluto_01: speech('wave_pluto_01', `${HUMANS_WAVES}/wave_pluto_01.wav`),
    wave_pluto_02: speech('wave_pluto_02', `${HUMANS_WAVES}/wave_pluto_02.wav`),
    wave_pluto_03: speech('wave_pluto_03', `${HUMANS_WAVES}/wave_pluto_03.wav`),
    // Haumea (3)
    wave_haumea_01: speech('wave_haumea_01', `${HUMANS_WAVES}/wave_haumea_01.wav`),
    wave_haumea_02: speech('wave_haumea_02', `${HUMANS_WAVES}/wave_haumea_02.wav`),
    wave_haumea_03: speech('wave_haumea_03', `${HUMANS_WAVES}/wave_haumea_03.wav`),
    // Makemake (3)
    wave_makemake_01: speech('wave_makemake_01', `${HUMANS_WAVES}/wave_makemake_01.wav`),
    wave_makemake_02: speech('wave_makemake_02', `${HUMANS_WAVES}/wave_makemake_02.wav`),
    wave_makemake_03: speech('wave_makemake_03', `${HUMANS_WAVES}/wave_makemake_03.wav`),
    // Eris (3)
    wave_eris_01: speech('wave_eris_01', `${HUMANS_WAVES}/wave_eris_01.wav`),
    wave_eris_02: speech('wave_eris_02', `${HUMANS_WAVES}/wave_eris_02.wav`),
    wave_eris_03: speech('wave_eris_03', `${HUMANS_WAVES}/wave_eris_03.wav`),
    // Arrokoth (3)
    wave_arrokoth_01: speech('wave_arrokoth_01', `${HUMANS_WAVES}/wave_arrokoth_01.wav`),
    wave_arrokoth_02: speech('wave_arrokoth_02', `${HUMANS_WAVES}/wave_arrokoth_02.wav`),
    wave_arrokoth_03: speech('wave_arrokoth_03', `${HUMANS_WAVES}/wave_arrokoth_03.wav`),
};

// Boss encounter lines (14)
const WAVE_BOSS_ENCOUNTER: Record<string, SoundDefinition> = {
    boss_encounter_moon: alienSpeech('boss_encounter_moon', `${HUMANS_WAVES}/boss_encounter_moon.wav`),
    boss_encounter_mars: alienSpeech('boss_encounter_mars', `${HUMANS_WAVES}/boss_encounter_mars.wav`),
    boss_encounter_ceres: alienSpeech('boss_encounter_ceres', `${HUMANS_WAVES}/boss_encounter_ceres.wav`),
    boss_encounter_jupiter: alienSpeech('boss_encounter_jupiter', `${HUMANS_WAVES}/boss_encounter_jupiter.wav`),
    boss_encounter_europa: alienSpeech('boss_encounter_europa', `${HUMANS_WAVES}/boss_encounter_europa.wav`),
    boss_encounter_saturn: alienSpeech('boss_encounter_saturn', `${HUMANS_WAVES}/boss_encounter_saturn.wav`),
    boss_encounter_titan: alienSpeech('boss_encounter_titan', `${HUMANS_WAVES}/boss_encounter_titan.wav`),
    boss_encounter_uranus: alienSpeech('boss_encounter_uranus', `${HUMANS_WAVES}/boss_encounter_uranus.wav`),
    boss_encounter_neptune: alienSpeech('boss_encounter_neptune', `${HUMANS_WAVES}/boss_encounter_neptune.wav`),
    boss_encounter_pluto: alienSpeech('boss_encounter_pluto', `${HUMANS_WAVES}/boss_encounter_pluto.wav`),
    boss_encounter_haumea: alienSpeech('boss_encounter_haumea', `${HUMANS_WAVES}/boss_encounter_haumea.wav`),
    boss_encounter_makemake: alienSpeech('boss_encounter_makemake', `${HUMANS_WAVES}/boss_encounter_makemake.wav`),
    boss_encounter_eris: alienSpeech('boss_encounter_eris', `${HUMANS_WAVES}/boss_encounter_eris.wav`),
    boss_encounter_arrokoth: alienSpeech('boss_encounter_arrokoth', `${HUMANS_WAVES}/boss_encounter_arrokoth.wav`),
};

// ============================================
// COMBINED EXPORT
// ============================================

export const SPEECH_SOUNDS: Record<string, SoundDefinition> = {
    // Alien taunts (56)
    ...ALIEN_GENERIC_TAUNTS,
    ...ALIEN_SECTOR_TAUNTS,
    // Alien boss (28)
    ...ALIEN_BOSS_INTROS,
    ...ALIEN_BOSS_DEFEATS,
    // Human commander (18)
    ...COMMANDER_VICTORY,
    ...COMMANDER_DEFEAT,
    ...COMMANDER_ENCOURAGE,
    ...COMMANDER_MILESTONE,
    // Human waves (64)
    ...WAVE_GENERIC,
    ...WAVE_SECTOR,
    ...WAVE_BOSS_ENCOUNTER,
};

// ============================================
// LOOKUP HELPERS
// ============================================

// All celestial body IDs in game order
export const BODY_IDS = [
    'moon', 'mars', 'ceres',
    'jupiter', 'europa', 'saturn', 'titan',
    'uranus', 'neptune',
    'pluto', 'haumea', 'makemake', 'eris', 'arrokoth',
] as const;

export type BodyId = typeof BODY_IDS[number];

// Get alien generic taunt IDs
export const ALIEN_GENERIC_TAUNT_IDS = Object.keys(ALIEN_GENERIC_TAUNTS);

// Get alien sector taunt IDs for a body
export const getAlienSectorTauntIds = (bodyId: BodyId): string[] => [
    `${bodyId}_01`,
    `${bodyId}_02`,
    `${bodyId}_03`,
];

// Get commander wave IDs (generic)
export const WAVE_GENERIC_IDS = Object.keys(WAVE_GENERIC);

// Get commander wave IDs for a body
export const getWaveSectorIds = (bodyId: BodyId): string[] => [
    `wave_${bodyId}_01`,
    `wave_${bodyId}_02`,
    `wave_${bodyId}_03`,
];

// Get boss encounter ID for a body
export const getBossEncounterId = (bodyId: BodyId): string => `boss_encounter_${bodyId}`;

// Get alien boss intro ID for a body
export const getAlienBossIntroId = (bodyId: BodyId): string => `boss_${bodyId}`;

// Get alien boss defeat ID for a body
export const getAlienBossDefeatId = (bodyId: BodyId): string => `defeat_${bodyId}`;

// Get victory IDs
export const VICTORY_GENERIC_IDS = ['victory_01', 'victory_02', 'victory_03', 'victory_04', 'victory_05', 'victory_06'];
export const VICTORY_BOSS_ID = 'victory_boss';
export const VICTORY_FINAL_ID = 'victory_final';

// Get defeat IDs
export const DEFEAT_GENERIC_IDS = ['defeat_cmd_01', 'defeat_cmd_02', 'defeat_cmd_03', 'defeat_cmd_04'];
export const DEFEAT_BOSS_ID = 'defeat_cmd_boss';

// Get encouragement IDs
export const ENCOURAGE_IDS = ['encourage_01', 'encourage_02', 'encourage_03'];

// Get milestone IDs
export const MILESTONE_INNER_ID = 'milestone_inner';
export const MILESTONE_KUIPER_ID = 'milestone_kuiper';

// ============================================
// TEXT MAPPING - Maps sound IDs to their dialogue text
// ============================================

// Victory text (matches audio exactly)
export const VICTORY_TEXT: Record<string, string> = {
    victory_01: "Target neutralized.",
    victory_02: "Hostile eliminated. Sector clear.",
    victory_03: "Good shooting, Commander.",
    victory_04: "Area secure. Moving on.",
    victory_05: "Enemy destroyed. Proceeding to next target.",
    victory_06: "Excellent work. One step closer.",
    victory_boss: "Commander vessel destroyed! A major victory for humanity.",
    victory_final: "The Mothership is destroyed! The invasion is over. You saved humanity, Commander!",
};

// Defeat text (matches audio exactly)
export const DEFEAT_TEXT: Record<string, string> = {
    defeat_cmd_01: "We took heavy damage. Retreating for repairs.",
    defeat_cmd_02: "That one got us. Regroup and try again.",
    defeat_cmd_03: "Hull breach! Falling back.",
    defeat_cmd_04: "Damage critical. Mission failed.",
    defeat_cmd_boss: "The enemy commander was too powerful. Regroup and try again.",
};

// Encouragement text (matches audio exactly)
export const ENCOURAGE_TEXT: Record<string, string> = {
    encourage_01: "Don't give up, Commander. Earth is counting on you.",
    encourage_02: "Every failure is a lesson. Try again.",
    encourage_03: "The Armada is tough, but so are you.",
};

// Milestone text (matches audio exactly)
export const MILESTONE_TEXT: Record<string, string> = {
    milestone_inner: "Inner system secured. Pushing into gas giant territory. The enemy knows we're coming.",
    milestone_kuiper: "We've entered the Kuiper Belt. The command ship is close. Prepare for heavy resistance.",
};

// Alien generic taunts text (matches audio exactly)
export const ALIEN_TAUNT_TEXT: Record<string, string> = {
    taunt_01_calculating: "Human vessel detected. Calculating your destruction.",
    taunt_02_miscalculation: "You dare enter our space? A critical miscalculation.",
    taunt_03_primitive: "Your primitive ship is no match for us.",
    taunt_04_zero: "Turn back now, or be reduced to zero.",
    taunt_05_probability: "Another human fool. Probability of survival: negligible.",
    taunt_06_odds: "You will not reach the Mothership. The odds are against you.",
    taunt_07_numbers: "Earth will fall. We have run the numbers.",
    taunt_08_mean_nothing: "Your numbers mean nothing to us.",
    taunt_09_thousand: "We have conquered a thousand worlds. Yours is next.",
    taunt_10_mathematics: "Your mathematics cannot save you, human.",
    taunt_11_flee: "Flee while you can, insect.",
    taunt_12_variable: "The Armada is infinite. You are but one variable.",
    taunt_13_solve_x: "We solve for X. X equals your annihilation.",
    taunt_14_zero_chance: "By our calculations, you have zero chance.",
};

// Alien sector taunts text
export const ALIEN_SECTOR_TEXT: Record<string, string> = {
    // Inner System
    moon_01: "By our calculations, you have zero chance.",
    moon_02: "You defend a dying world. The equation is already solved.",
    moon_03: "Your homeworld is within our grasp.",
    mars_01: "Mars was easy to claim. So will Earth be.",
    mars_02: "The red planet runs red with defeat. Your losses multiply.",
    mars_03: "You fight for dust and rocks.",
    ceres_01: "The belt belongs to us now.",
    ceres_02: "Your asteroids make excellent cover... for us.",
    ceres_03: "Nowhere to hide, human. We've mapped every coordinate.",
    // Gas Giants
    jupiter_01: "You've come far. But distance is just a number.",
    jupiter_02: "The gas giants bow to us.",
    jupiter_03: "Your courage is... a statistical anomaly.",
    europa_01: "The ice will be your tomb.",
    europa_02: "Jupiter's moons are our staging ground. Calculated perfectly.",
    europa_03: "You minus life equals zero.",
    saturn_01: "The rings will be your grave marker. Count them as you fall.",
    saturn_02: "Saturn's beauty masks your doom.",
    saturn_03: "The outer planets are ours. The sum is complete.",
    titan_01: "Titan's clouds hide our true numbers.",
    titan_02: "You persist against the odds. How... tedious.",
    titan_03: "Each victory brings you closer to defeat.",
    // Kuiper Belt
    uranus_01: "So far from home. So alone. The distance is astronomical.",
    uranus_02: "No reinforcements will reach you here.",
    uranus_03: "The void will swallow you.",
    neptune_01: "The last planet. Your final chance to recalculate.",
    neptune_02: "Beyond lies only death.",
    neptune_03: "You're far from home, human. No one will find your wreckage.",
    pluto_01: "The Kuiper Belt welcomes no humans.",
    pluto_02: "Dwarf planet, giant mistake coming here.",
    pluto_03: "You've entered the domain of the Mothership. Factor in your doom.",
    haumea_01: "The Mothership awaits. As does your final equation.",
    haumea_02: "So close, yet you will fail.",
    haumea_03: "Our supreme commander will divide you by zero.",
    makemake_01: "Last warning, human. Turn back.",
    makemake_02: "The Armada's elite guard await. Overwhelming numbers.",
    makemake_03: "You will never reach the command ship. Statistically impossible.",
    eris_01: "Zorath knows you're coming. He's already calculated your end.",
    eris_02: "The Supreme Commander awaits. Your variables are limited.",
    eris_03: "Your journey ends at the Mothership.",
    arrokoth_01: "You've reached the end, human. Sum total: nothing.",
    arrokoth_02: "The Mothership will crush you like the insect you are.",
    arrokoth_03: "Zorath himself will solve the problem of your existence.",
};

// Alien boss intro text with names
export const ALIEN_BOSS_TEXT: Record<string, { name: string; line: string }> = {
    boss_moon: { name: "SQUADRON LEADER", line: "I am the first wall, you will not pass. Prepare to be subtracted from existence, human." },
    boss_mars: { name: "SECTOR COMMANDER KRIX", line: "You destroyed my scouts? Impressive. But I am the remainder you cannot divide." },
    boss_ceres: { name: "SUPPLY MASTER VORN", line: "The asteroid belt is mine. You'll be just another piece of debris." },
    boss_jupiter: { name: "FLEET CAPTAIN THAX", line: "A Fleet Captain does not fall to a single human. I've crushed armadas greater than your entire species." },
    boss_europa: { name: "ICE COMMANDER CRYSTOS", line: "Europa's cold is nothing compared to the chill of death I bring." },
    boss_saturn: { name: "WAR GENERAL VRAX", line: "I am War General Vrax. I have ended civilizations. You are merely... a rounding error." },
    boss_titan: { name: "SHADOW COMMANDER NEXIS", line: "Titan's clouds hide many secrets. Your death is a simple equation." },
    boss_uranus: { name: "VOID ADMIRAL ZETH", line: "So deep into space... so far from hope. I admire your futile mathematics." },
    boss_neptune: { name: "HIGH ADMIRAL VORAXIS", line: "The High Admiral speaks. You have fought well, human. But this is where equations come to die." },
    boss_pluto: { name: "KUIPER WARDEN KRYOS", line: "The Belt is my domain. None pass. None survive." },
    boss_haumea: { name: "ELITE GUARD CAPTAIN NEXAR", line: "The Mothership's elite guard. Your luck is a variable we've eliminated." },
    boss_makemake: { name: "SUPREME GUARD ZYNN", line: "Divide and conquer... that is the Armada's way. I am the division." },
    boss_eris: { name: "ROYAL DEFENDER OMNIX", line: "Zorath's personal defender. I have never miscalculated. I will not start with you." },
    boss_arrokoth: { name: "SUPREME COMMANDER ZORATH", line: "I am Zorath, Supreme Commander of the Armada. You destroyed my generals? Insignificant variables. I am the final equation, unsolvable." },
};

// Alien boss defeat text (dying words)
export const ALIEN_BOSS_DEFEAT_TEXT: Record<string, string> = {
    defeat_moon: "Impossible... my calculations were—",
    defeat_mars: "The Armada will avenge me...",
    defeat_ceres: "My supplies... the fleet will starve...",
    defeat_jupiter: "A Fleet Captain... divided by ONE ship?!",
    defeat_europa: "The ice... it melts...",
    defeat_saturn: "You... you are no ordinary human...",
    defeat_titan: "The shadows... my calculations... wrong...",
    defeat_uranus: "The void... subtracts me...",
    defeat_neptune: "The Supreme Commander will destroy you... this changes nothing...",
    defeat_pluto: "The Kuiper Belt... will remember...",
    defeat_haumea: "Zorath... I have miscalculated...",
    defeat_makemake: "The prime factor... reduced to nothing...",
    defeat_eris: "I was... undefeated... my formula... flawed...",
    defeat_arrokoth: "NO! The Armada... my infinite power... humanity was supposed to equal NOTHING—",
};

// Commander wave text
export const WAVE_TEXT: Record<string, string> = {
    // Generic
    wave_generic_01: "Sir, I have visuals on a hostile vessel.",
    wave_generic_02: "Enemy scout ship on approach.",
    wave_generic_03: "Detecting hostile signatures ahead.",
    wave_generic_04: "Contact! Single bogey incoming.",
    wave_generic_05: "We've got company, Commander.",
    wave_generic_06: "Sensors picking up enemy activity.",
    wave_generic_07: "Hostile patrol spotted. Engaging.",
    wave_generic_08: "Enemy vessel detected. Weapons ready.",
    // Sector-specific
    wave_moon_01: "Enemy activity detected near lunar orbit.",
    wave_moon_02: "They've set up positions around the Moon.",
    wave_moon_03: "Lunar section hostile.",
    wave_mars_01: "Martian sector compromised. Hostiles inbound.",
    wave_mars_02: "Mars is crawling with enemy scouts, engage with caution.",
    wave_mars_03: "Red planet, red alert. Enemy ahead.",
    wave_ceres_01: "They're using the asteroid belt as cover.",
    wave_ceres_02: "Navigating the belt. Enemy signatures everywhere.",
    wave_ceres_03: "Asteroid field hostiles detected.",
    wave_jupiter_01: "The radiation is interfering with sensors. Stay sharp.",
    wave_jupiter_02: "Hostiles hiding in Jupiter's shadow.",
    wave_jupiter_03: "Jupiter sector. Massive enemy presence.",
    wave_europa_01: "Europa's ice reflects their signals. Hard to track.",
    wave_europa_02: "Enemy base detected near Europa.",
    wave_europa_03: "They've fortified Jupiter's moons.",
    wave_saturn_01: "Saturn's rings are crawling with enemy scouts.",
    wave_saturn_02: "Ring sector. Multiple contacts.",
    wave_saturn_03: "They're using the rings for cover.",
    wave_titan_01: "Titan's atmosphere hiding enemy movements.",
    wave_titan_02: "Saturn's largest moon. Large enemy presence.",
    wave_titan_03: "Titan sector compromised.",
    wave_uranus_01: "We're in deep space now. No backup.",
    wave_uranus_02: "Uranus sector. We're on our own out here.",
    wave_uranus_03: "Long range sensors detect heavy presence.",
    wave_neptune_01: "Neptune sector. The last planet before the Belt.",
    wave_neptune_02: "We're getting closer to their command ship.",
    wave_neptune_03: "Almost there. Stay focused.",
    wave_pluto_01: "Pluto sector. Kuiper Belt territory.",
    wave_pluto_02: "Dwarf planet, full-size threat ahead.",
    wave_pluto_03: "We're in their territory now.",
    wave_haumea_01: "Deep Kuiper Belt. Heavy resistance expected.",
    wave_haumea_02: "Haumea sector. They know we're coming.",
    wave_haumea_03: "No turning back now, Commander.",
    wave_makemake_01: "Makemake sector. The Mothership is close.",
    wave_makemake_02: "Enemy forces concentrated ahead.",
    wave_makemake_03: "Final stretch. Give it everything.",
    wave_eris_01: "Eris sector. The edge of the system.",
    wave_eris_02: "Scattered enemy forces. They're defending something.",
    wave_eris_03: "Almost at the command ship.",
    wave_arrokoth_01: "There it is. The alien Mothership.",
    wave_arrokoth_02: "All of humanity is counting on you, Commander.",
    wave_arrokoth_03: "This is it. Everything has led to this moment.",
};

// Commander boss encounter text
export const BOSS_ENCOUNTER_TEXT: Record<string, string> = {
    boss_encounter_moon: "Commander, this one's different. Larger signature. Looks like an alien Squadron Leader. Take it out.",
    boss_encounter_mars: "Intel was right—they've established a forward base on Mars. That's their Sector Commander. Destroy it and we break their inner system hold.",
    boss_encounter_ceres: "A Command Cruiser in the asteroid belt. They're protecting their supply lines. End it.",
    boss_encounter_jupiter: "Massive energy readings. That's no scout... it's a Fleet Captain's warship. This won't be easy.",
    boss_encounter_europa: "They've got a commander stationed on Europa. Take them down.",
    boss_encounter_saturn: "We've reached Saturn. Their War General commands this region. If we take him down, the outer system is ours.",
    boss_encounter_titan: "Titan's defender. Another commander. Show them what you're made of.",
    boss_encounter_uranus: "Deep space command ship. They didn't expect us to get this far.",
    boss_encounter_neptune: "The High Admiral. One of their top commanders. Beyond him lies only the command ship. Make it count.",
    boss_encounter_pluto: "Kuiper Belt Commander. They're throwing everything at us now.",
    boss_encounter_haumea: "Elite guard. The Mothership's protectors. Break through.",
    boss_encounter_makemake: "Last line of defense before the Mothership. This one's tough.",
    boss_encounter_eris: "Supreme Guard Commander. Zorath's personal defender.",
    boss_encounter_arrokoth: "There it is. The Mothership. Zorath himself commands it. End this invasion, Commander. For Earth.",
};

// ============================================
// UNIFIED SELECTION FUNCTIONS
// These return both sound ID and text for synced playback
// ============================================

const randomPick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export interface DialogueLine {
    soundId: string;
    text: string;
    name?: string; // For boss intros
}

/**
 * Select a commander wave line (returns sound ID and text)
 * For boss battles: specific boss encounter line
 * For regular waves: 50% sector-specific, 50% generic
 */
export const selectWaveLine = (bodyId: BodyId, isBoss: boolean): DialogueLine => {
    if (isBoss) {
        const soundId = getBossEncounterId(bodyId);
        return { soundId, text: BOSS_ENCOUNTER_TEXT[soundId] || '' };
    }

    // 50% chance for sector-specific
    if (Math.random() > 0.5) {
        const sectorIds = getWaveSectorIds(bodyId);
        const soundId = randomPick(sectorIds);
        return { soundId, text: WAVE_TEXT[soundId] || '' };
    }

    // Generic
    const soundId = randomPick(WAVE_GENERIC_IDS);
    return { soundId, text: WAVE_TEXT[soundId] || '' };
};

/**
 * Select an alien taunt line (returns sound ID and text)
 * For boss battles: specific boss intro with name
 * For regular waves: 50% sector-specific, 50% generic
 */
export const selectAlienLine = (bodyId: BodyId, isBoss: boolean): DialogueLine => {
    if (isBoss) {
        const soundId = getAlienBossIntroId(bodyId);
        const boss = ALIEN_BOSS_TEXT[soundId];
        return { soundId, text: boss?.line || '', name: boss?.name };
    }

    // 50% chance for sector-specific
    if (Math.random() > 0.5) {
        const sectorIds = getAlienSectorTauntIds(bodyId);
        const soundId = randomPick(sectorIds);
        return { soundId, text: ALIEN_SECTOR_TEXT[soundId] || '' };
    }

    // Generic
    const soundId = randomPick(ALIEN_GENERIC_TAUNT_IDS);
    return { soundId, text: ALIEN_TAUNT_TEXT[soundId] || '' };
};

/**
 * Select a victory line (returns sound ID and text)
 * - Final boss: special victory message
 * - Regular boss: boss victory message
 * - Regular enemy: random generic victory
 */
export const selectVictoryLine = (isBoss: boolean, isFinalBoss: boolean): DialogueLine => {
    if (isFinalBoss) {
        return { soundId: VICTORY_FINAL_ID, text: VICTORY_TEXT[VICTORY_FINAL_ID] || '' };
    }
    if (isBoss) {
        return { soundId: VICTORY_BOSS_ID, text: VICTORY_TEXT[VICTORY_BOSS_ID] || '' };
    }
    const soundId = randomPick(VICTORY_GENERIC_IDS);
    return { soundId, text: VICTORY_TEXT[soundId] || '' };
};

/**
 * Select a defeat line (returns sound ID and text)
 * - Boss defeat: special defeat message
 * - Regular defeat: random generic defeat
 */
export const selectDefeatLine = (isBoss: boolean): DialogueLine => {
    if (isBoss) {
        return { soundId: DEFEAT_BOSS_ID, text: DEFEAT_TEXT[DEFEAT_BOSS_ID] || '' };
    }
    const soundId = randomPick(DEFEAT_GENERIC_IDS);
    return { soundId, text: DEFEAT_TEXT[soundId] || '' };
};

/**
 * Select an encouragement line (returns sound ID and text)
 * Played after defeat to motivate the player
 */
export const selectEncourageLine = (): DialogueLine => {
    const soundId = randomPick(ENCOURAGE_IDS);
    return { soundId, text: ENCOURAGE_TEXT[soundId] || '' };
};

/**
 * Select a boss defeat line (returns sound ID and text)
 * The boss's dying words when player defeats them
 */
export const selectBossDefeatLine = (bodyId: BodyId): DialogueLine => {
    const soundId = getAlienBossDefeatId(bodyId);
    return { soundId, text: ALIEN_BOSS_DEFEAT_TEXT[soundId] || '' };
};
