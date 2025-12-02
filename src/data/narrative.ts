// Narrative content for Space Math Commander

// ============================================
// OPENING NARRATIVE
// ============================================

export const openingNarrative = {
    title: "INCOMING TRANSMISSION",
    speaker: "COMMANDER",
    message: "Pilot, we've detected an alien armada approaching our solar system. Intelligence confirms their command ship is hiding behind Arrokoth in the Kuiper Belt. Your mission: push through their forces and destroy it before they reach Earth. The fate of humanity rests on your calculations. Good luck.",
};

// ============================================
// VICTORY NARRATIVE (Final boss defeated)
// ============================================

export const victoryNarrative = {
    title: "TRANSMISSION RECEIVED",
    speaker: "COMMANDER",
    message: "The Mothership is destroyed! The invasion is over. You saved humanity, Commander. Welcome home, hero.",
};

// ============================================
// COMMANDER DIALOGUE
// ============================================

// Generic wave encounters (randomly selected)
export const commanderGenericLines = [
    "Sir, I have visuals on a hostile vessel.",
    "Enemy scout ship on approach.",
    "Detecting hostile signatures ahead.",
    "Contact! Single bogey incoming.",
    "We've got company, Commander.",
    "Sensors picking up enemy activity.",
    "Hostile patrol spotted. Engaging.",
    "Enemy vessel detected. Weapons ready.",
];

// Sector-specific lines (selected based on location)
export const commanderSectorLines: Record<string, string[]> = {
    // Inner System
    moon: [
        "Enemy activity detected near lunar orbit.",
        "They've set up positions around the Moon.",
        "Lunar sector hostile. Engage with caution.",
    ],
    mars: [
        "Martian sector compromised. Hostiles inbound.",
        "Mars is crawling with enemy scouts, engage with caution.",
        "Red planet, red alert. Enemy ahead.",
    ],
    ceres: [
        "They're using the asteroid belt as cover.",
        "Navigating the belt. Enemy signatures everywhere.",
        "Asteroid field hostiles detected.",
    ],
    // Gas Giants
    jupiter: [
        "The radiation is interfering with sensors. Stay sharp.",
        "Hostiles hiding in Jupiter's shadow.",
        "Jupiter sector. Massive enemy presence.",
    ],
    europa: [
        "Europa's ice reflects their signals. Hard to track.",
        "Enemy base detected near Europa.",
        "They've fortified Jupiter's moons.",
    ],
    saturn: [
        "Saturn's rings are crawling with enemy scouts.",
        "Ring sector. Multiple contacts.",
        "They're using the rings for cover.",
    ],
    titan: [
        "Titan's atmosphere hiding enemy movements.",
        "Saturn's largest moon. Large enemy presence.",
        "Titan sector compromised.",
    ],
    // Ice Giants & Kuiper Belt
    uranus: [
        "We're in deep space now. No backup.",
        "Uranus sector. We're on our own out here.",
        "Long range sensors detect heavy presence.",
    ],
    neptune: [
        "Neptune sector. The last planet before the Belt.",
        "We're getting closer to their command ship.",
        "Almost there. Stay focused.",
    ],
    pluto: [
        "Pluto sector. Kuiper Belt territory.",
        "Dwarf planet, full-size threat ahead.",
        "We're in their territory now.",
    ],
    haumea: [
        "Deep Kuiper Belt. Heavy resistance expected.",
        "Haumea sector. They know we're coming.",
        "No turning back now, Commander.",
    ],
    makemake: [
        "Makemake sector. The Mothership is close.",
        "Enemy forces concentrated ahead.",
        "Final stretch. Give it everything.",
    ],
    eris: [
        "Eris sector. The edge of the system.",
        "Scattered enemy forces. They're defending something.",
        "Almost at the command ship.",
    ],
    arrokoth: [
        "There it is. The alien Mothership.",
        "All of humanity is counting on you, Commander.",
        "This is it. Everything has led to this moment.",
    ],
};

// Boss encounter lines (story moments)
export const commanderBossLines: Record<string, string> = {
    moon: "Commander, this one's different. Larger signature. Looks like an alien Squadron Leader. Take it out.",
    mars: "Intel was right—they've established a forward base on Mars. That's their Sector Commander. Destroy it and we break their inner system hold.",
    ceres: "A Command Cruiser in the asteroid belt. They're protecting their supply lines. End it.",
    jupiter: "Massive energy readings. That's no scout... it's a Fleet Captain's warship. This won't be easy.",
    europa: "They've got a commander stationed on Europa. Take them down.",
    saturn: "We've reached Saturn. Their War General commands this region. If we take him down, the outer system is ours.",
    titan: "Titan's defender. Another commander. Show them what you're made of.",
    uranus: "Deep space command ship. They didn't expect us to get this far.",
    neptune: "The High Admiral. One of their top commanders. Beyond him lies only the command ship. Make it count.",
    pluto: "Kuiper Belt Commander. They're throwing everything at us now.",
    haumea: "Elite guard. The Mothership's protectors. Break through.",
    makemake: "Last line of defense before the Mothership. This one's tough.",
    eris: "Supreme Guard Commander. Zorath's personal defender.",
    arrokoth: "There it is. The Mothership. Zorath himself commands it. End this invasion, Commander. For Earth.",
};

// Milestone messages
export const milestoneMessages: Record<string, { title: string; message: string }> = {
    leavingInnerSystem: {
        title: "MILESTONE REACHED",
        message: "Inner system secured. Pushing into gas giant territory. The enemy knows we're coming.",
    },
    reachingKuiperBelt: {
        title: "MILESTONE REACHED",
        message: "We've entered the Kuiper Belt. The command ship is close. Prepare for heavy resistance.",
    },
};

// ============================================
// ALIEN DIALOGUE
// ============================================

// Generic alien taunts (randomly selected) - matches audio files
export const alienGenericTaunts = [
    "Human vessel detected. Calculating your destruction.",
    "You dare enter our space? A critical miscalculation.",
    "Your primitive ship is no match for us.",
    "Turn back now, or be reduced to zero.",
    "Another human fool. Probability of survival: negligible.",
    "You will not reach the Mothership. The odds are against you.",
    "Earth will fall. We have run the numbers.",
    "Your numbers mean nothing to us.",
    "We have conquered a thousand worlds. Yours is next.",
    "Your mathematics cannot save you, human.",
    "Flee while you can, insect.",
    "The Armada is infinite. You are but one variable.",
    "We solve for X. X equals your annihilation.",
    "By our calculations, you have zero chance.",
];

// Sector-specific alien lines - matches audio files
export const alienSectorTaunts: Record<string, string[]> = {
    // Inner System
    moon: [
        "You defend a dying world. The equation is already solved.",
        "Earth's moon was just the beginning.",
        "Your homeworld is within our grasp.",
    ],
    mars: [
        "Mars was easy to claim. So will Earth be.",
        "The red planet runs red with defeat. Your losses multiply.",
        "You fight for dust and rocks.",
    ],
    ceres: [
        "The belt belongs to us now.",
        "Your asteroids make excellent cover... for us.",
        "Nowhere to hide, human. We've mapped every coordinate.",
    ],
    // Gas Giants
    jupiter: [
        "You've come far. But distance is just a number.",
        "The gas giants bow to us.",
        "Your courage is... a statistical anomaly.",
    ],
    europa: [
        "The ice will be your tomb.",
        "Jupiter's moons are our staging ground. Calculated perfectly.",
        "You minus life equals zero.",
    ],
    saturn: [
        "The rings will be your grave marker. Count them as you fall.",
        "Saturn's beauty masks your doom.",
        "The outer planets are ours. The sum is complete.",
    ],
    titan: [
        "Titan's clouds hide our true numbers.",
        "You persist against the odds. How... tedious.",
        "Each victory brings you closer to defeat.",
    ],
    // Ice Giants & Kuiper Belt
    uranus: [
        "So far from home. So alone. The distance is astronomical.",
        "No reinforcements will reach you here.",
        "The void will swallow you.",
    ],
    neptune: [
        "The last planet. Your final chance to recalculate.",
        "Beyond lies only death.",
        "You're far from home, human. No one will find your wreckage.",
    ],
    pluto: [
        "The Kuiper Belt welcomes no humans.",
        "Dwarf planet, giant mistake coming here.",
        "You've entered the domain of the Mothership. Factor in your doom.",
    ],
    haumea: [
        "The Mothership awaits. As does your final equation.",
        "So close, yet you will fail.",
        "Our supreme commander will divide you by zero.",
    ],
    makemake: [
        "Last warning, human. Turn back.",
        "The Armada's elite guard await. Overwhelming numbers.",
        "You will never reach the command ship. Statistically impossible.",
    ],
    eris: [
        "Zorath knows you're coming. He's already calculated your end.",
        "The Supreme Commander awaits. Your variables are limited.",
        "Your journey ends at the Mothership.",
    ],
    arrokoth: [
        "You've reached the end, human. Sum total: nothing.",
        "The Mothership will crush you like the insect you are.",
        "Zorath himself will solve the problem of your existence.",
    ],
};

// Boss alien dialogue (story moments) - matches audio files
export const alienBossIntros: Record<string, { name: string; line: string }> = {
    moon: {
        name: "SQUADRON LEADER",
        line: "I am the first wall, you will not pass. Prepare to be subtracted from existence, human.",
    },
    mars: {
        name: "SECTOR COMMANDER KRIX",
        line: "You destroyed my scouts? Impressive. But I am the remainder you cannot divide.",
    },
    ceres: {
        name: "SUPPLY MASTER VORN",
        line: "The asteroid belt is mine. You'll be just another piece of debris.",
    },
    jupiter: {
        name: "FLEET CAPTAIN THAX",
        line: "A Fleet Captain does not fall to a single human. I've crushed armadas greater than your entire species.",
    },
    europa: {
        name: "ICE COMMANDER CRYSTOS",
        line: "Europa's cold is nothing compared to the chill of death I bring.",
    },
    saturn: {
        name: "WAR GENERAL VRAX",
        line: "I am War General Vrax. I have ended civilizations. You are merely... a rounding error.",
    },
    titan: {
        name: "SHADOW COMMANDER NEXIS",
        line: "Titan's clouds hide many secrets. Your death is a simple equation.",
    },
    uranus: {
        name: "VOID ADMIRAL ZETH",
        line: "So deep into space... so far from hope. I admire your futile mathematics.",
    },
    neptune: {
        name: "HIGH ADMIRAL VORAXIS",
        line: "The High Admiral speaks. You have fought well, human. But this is where equations come to die.",
    },
    pluto: {
        name: "KUIPER WARDEN KRYOS",
        line: "The Belt is my domain. None pass. None survive.",
    },
    haumea: {
        name: "ELITE GUARD CAPTAIN NEXAR",
        line: "The Mothership's elite guard. Your luck is a variable we've eliminated.",
    },
    makemake: {
        name: "SUPREME GUARD ZYNN",
        line: "Divide and conquer... that is the Armada's way. I am the division.",
    },
    eris: {
        name: "ROYAL DEFENDER OMNIX",
        line: "Zorath's personal defender. I have never miscalculated. I will not start with you.",
    },
    arrokoth: {
        name: "SUPREME COMMANDER ZORATH",
        line: "I am Zorath, Supreme Commander of the Armada. You destroyed my generals? Insignificant variables. I am the final equation, unsolvable.",
    },
};

// Boss defeat lines - matches audio files
export const alienBossDefeats: Record<string, string> = {
    moon: "Impossible... my calculations were—",
    mars: "The Armada will avenge me...",
    ceres: "My supplies... the fleet will starve...",
    jupiter: "A Fleet Captain... divided by ONE ship?!",
    europa: "The ice... it melts...",
    saturn: "You... you are no ordinary human...",
    titan: "The shadows... my calculations... wrong...",
    uranus: "The void... subtracts me...",
    neptune: "The Supreme Commander will destroy you... this changes nothing...",
    pluto: "The Kuiper Belt... will remember...",
    haumea: "Zorath... I have miscalculated...",
    makemake: "The prime factor... reduced to nothing...",
    eris: "I was... undefeated... my formula... flawed...",
    arrokoth: "NO! The Armada... my infinite power... humanity was supposed to equal NOTHING—",
};

// ============================================
// RESULT SCREEN MESSAGES
// ============================================

export const victoryMessages = {
    generic: [
        "Target neutralized.",
        "Hostile eliminated. Sector clear.",
        "Good shooting, Commander.",
        "Area secure. Moving on.",
        "Enemy destroyed. Proceeding to next target.",
        "Excellent work. One step closer.",
    ],
    boss: "Commander vessel destroyed! A major victory for humanity.",
    finalBoss: "THE MOTHERSHIP IS DESTROYED! The invasion is over. You saved humanity, Commander!",
};

export const defeatMessages = {
    generic: [
        "We took heavy damage. Retreating for repairs.",
        "Hull breach! Falling back.",
        "That one got us. Regroup and try again.",
        "Damage critical. Mission failed.",
    ],
    boss: "The enemy commander was too powerful. Regroup and try again.",
    encouragement: [
        "Don't give up, Commander. Earth is counting on you.",
        "Every failure is a lesson. Try again.",
        "The Armada is tough, but so are you.",
    ],
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getRandomElement = <T>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
};

export const getCommanderLine = (bodyId: string, isBoss: boolean): string => {
    if (isBoss) {
        return commanderBossLines[bodyId] || commanderBossLines.moon;
    }

    // 50% chance for sector-specific, 50% for generic
    const sectorLines = commanderSectorLines[bodyId];
    if (sectorLines && Math.random() > 0.5) {
        return getRandomElement(sectorLines);
    }
    return getRandomElement(commanderGenericLines);
};

export const getAlienLine = (bodyId: string, isBoss: boolean): { name?: string; line: string } => {
    if (isBoss) {
        const bossIntro = alienBossIntros[bodyId];
        if (bossIntro) {
            return { name: bossIntro.name, line: bossIntro.line };
        }
    }

    // 50% chance for sector-specific, 50% for generic
    const sectorTaunts = alienSectorTaunts[bodyId];
    if (sectorTaunts && Math.random() > 0.5) {
        return { line: getRandomElement(sectorTaunts) };
    }
    return { line: getRandomElement(alienGenericTaunts) };
};

export const getVictoryMessage = (_bodyId: string, isBoss: boolean, isFinalBoss: boolean): string => {
    if (isFinalBoss) {
        return victoryMessages.finalBoss;
    }
    if (isBoss) {
        return victoryMessages.boss;
    }
    return getRandomElement(victoryMessages.generic);
};

export const getDefeatMessage = (isBoss: boolean): { message: string; encouragement: string } => {
    return {
        message: isBoss ? defeatMessages.boss : getRandomElement(defeatMessages.generic),
        encouragement: getRandomElement(defeatMessages.encouragement),
    };
};

export const getBossDefeatLine = (bodyId: string): string | null => {
    return alienBossDefeats[bodyId] || null;
};

// Check if this is the final boss (Arrokoth mothership)
export const isFinalBoss = (bodyId: string, isBoss: boolean): boolean => {
    return bodyId === 'arrokoth' && isBoss;
};
