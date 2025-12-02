export type CelestialBody = {
    id: string;
    name: string;
    type: 'planet' | 'moon' | 'asteroid' | 'dwarf' | 'kuiper';
    emoji: string;
    color: string;
    focusTables: number[];
    fact: string;
};

export type Leg = {
    id: string;
    fromBodyId: string;
    toBodyId: string;
    waypointsRequired: number;
    chapter: 'inner' | 'giants' | 'outer' | 'kuiper';
};

export const celestialBodies: Record<string, CelestialBody> = {
    earth: {
        id: 'earth',
        name: 'Earth',
        type: 'planet',
        emoji: '🌍',
        color: 'hsl(195 100% 50%)',
        focusTables: [1, 2, 3],
        fact: 'Earth is the only planet known to support life, with 71% of its surface covered by water.',
    },
    moon: {
        id: 'moon',
        name: 'Moon',
        type: 'moon',
        emoji: '🌙',
        color: 'hsl(0 0% 75%)',
        focusTables: [2, 3, 4],
        fact: 'The Moon is Earth\'s only natural satellite. It takes 27.3 days to orbit Earth.',
    },
    mars: {
        id: 'mars',
        name: 'Mars',
        type: 'planet',
        emoji: '🔴',
        color: 'hsl(0 70% 50%)',
        focusTables: [3, 4, 5],
        fact: 'Mars is called the Red Planet due to iron oxide (rust) on its surface. A day on Mars is 24.6 hours!',
    },
    ceres: {
        id: 'ceres',
        name: 'Ceres',
        type: 'asteroid',
        emoji: '☄️',
        color: 'hsl(30 50% 50%)',
        focusTables: [4, 5, 6],
        fact: 'Ceres is the largest object in the asteroid belt, containing about one-third of the belt\'s total mass.',
    },
    jupiter: {
        id: 'jupiter',
        name: 'Jupiter',
        type: 'planet',
        emoji: '🪐',
        color: 'hsl(30 70% 60%)',
        focusTables: [5, 6, 7],
        fact: 'Jupiter is the largest planet in our solar system, with 95 known moons. Its Great Red Spot is a storm larger than Earth!',
    },
    europa: {
        id: 'europa',
        name: 'Europa',
        type: 'moon',
        emoji: '🧊',
        color: 'hsl(195 80% 80%)',
        focusTables: [6, 7, 8],
        fact: 'Europa is covered in ice and may have a vast ocean beneath its frozen surface—making it a prime candidate for alien life!',
    },
    saturn: {
        id: 'saturn',
        name: 'Saturn',
        type: 'planet',
        emoji: '💍',
        color: 'hsl(45 60% 70%)',
        focusTables: [7, 8, 9],
        fact: 'Saturn\'s rings are made of billions of ice and rock particles, some as small as dust, others as large as mountains.',
    },
    titan: {
        id: 'titan',
        name: 'Titan',
        type: 'moon',
        emoji: '🟠',
        color: 'hsl(30 80% 50%)',
        focusTables: [7, 8, 9],
        fact: 'Titan is Saturn\'s largest moon and has lakes and rivers—but filled with liquid methane, not water!',
    },
    uranus: {
        id: 'uranus',
        name: 'Uranus',
        type: 'planet',
        emoji: '💎',
        color: 'hsl(180 60% 60%)',
        focusTables: [8, 9, 10],
        fact: 'Uranus rotates on its side at a 98° tilt, likely due to a massive collision billions of years ago.',
    },
    neptune: {
        id: 'neptune',
        name: 'Neptune',
        type: 'planet',
        emoji: '🔵',
        color: 'hsl(220 80% 50%)',
        focusTables: [9, 10, 11],
        fact: 'Neptune has the fastest winds in the solar system, reaching speeds of over 1,200 mph (2,000 km/h)!',
    },
    pluto: {
        id: 'pluto',
        name: 'Pluto',
        type: 'dwarf',
        emoji: '❄️',
        color: 'hsl(200 40% 70%)',
        focusTables: [10, 11, 12],
        fact: 'Pluto was reclassified as a dwarf planet in 2006. It has a heart-shaped glacier called Tombaugh Regio!',
    },
    haumea: {
        id: 'haumea',
        name: 'Haumea',
        type: 'dwarf',
        emoji: '🥚',
        color: 'hsl(0 0% 85%)',
        focusTables: [4, 8, 12],
        fact: 'Haumea is egg-shaped due to its incredibly fast rotation—a day on Haumea is only 4 hours long!',
    },
    makemake: {
        id: 'makemake',
        name: 'Makemake',
        type: 'dwarf',
        emoji: '🔴',
        color: 'hsl(15 60% 55%)',
        focusTables: [3, 6, 9, 12],
        fact: 'Makemake is one of the brightest objects in the Kuiper Belt and is named after the Rapa Nui god of fertility.',
    },
    eris: {
        id: 'eris',
        name: 'Eris',
        type: 'dwarf',
        emoji: '⚪',
        color: 'hsl(0 0% 95%)',
        focusTables: [2, 4, 6, 8, 10, 12],
        fact: 'Eris is slightly smaller than Pluto but more massive. Its discovery led to Pluto being reclassified!',
    },
    arrokoth: {
        id: 'arrokoth',
        name: 'Arrokoth',
        type: 'kuiper',
        emoji: '🥔',
        color: 'hsl(30 30% 50%)',
        focusTables: [4, 5, 6, 7, 8, 9, 10, 11, 12],
        fact: 'Arrokoth is the most distant object ever explored by a spacecraft. It looks like a snowman made of ancient space rock!',
    },
};

export const campaignLegs: Leg[] = [
    // Chapter 1: Inner System
    { id: 'leg-1', fromBodyId: 'earth', toBodyId: 'moon', waypointsRequired: 4, chapter: 'inner' },
    { id: 'leg-2', fromBodyId: 'moon', toBodyId: 'mars', waypointsRequired: 4, chapter: 'inner' },
    { id: 'leg-3', fromBodyId: 'mars', toBodyId: 'ceres', waypointsRequired: 4, chapter: 'inner' },

    // Chapter 2: Giants
    { id: 'leg-4', fromBodyId: 'ceres', toBodyId: 'jupiter', waypointsRequired: 4, chapter: 'giants' },
    { id: 'leg-5', fromBodyId: 'jupiter', toBodyId: 'europa', waypointsRequired: 4, chapter: 'giants' },
    { id: 'leg-6', fromBodyId: 'europa', toBodyId: 'saturn', waypointsRequired: 4, chapter: 'giants' },
    { id: 'leg-7', fromBodyId: 'saturn', toBodyId: 'titan', waypointsRequired: 4, chapter: 'giants' },

    // Chapter 3: Outer Reaches
    { id: 'leg-8', fromBodyId: 'titan', toBodyId: 'uranus', waypointsRequired: 4, chapter: 'outer' },
    { id: 'leg-9', fromBodyId: 'uranus', toBodyId: 'neptune', waypointsRequired: 4, chapter: 'outer' },

    // Chapter 4: Kuiper Belt
    { id: 'leg-10', fromBodyId: 'neptune', toBodyId: 'pluto', waypointsRequired: 4, chapter: 'kuiper' },
    { id: 'leg-11', fromBodyId: 'pluto', toBodyId: 'haumea', waypointsRequired: 4, chapter: 'kuiper' },
    { id: 'leg-12', fromBodyId: 'haumea', toBodyId: 'makemake', waypointsRequired: 4, chapter: 'kuiper' },
    { id: 'leg-13', fromBodyId: 'makemake', toBodyId: 'eris', waypointsRequired: 4, chapter: 'kuiper' },
    { id: 'leg-14', fromBodyId: 'eris', toBodyId: 'arrokoth', waypointsRequired: 4, chapter: 'kuiper' },
];

export const getChapterName = (chapter: Leg['chapter']): string => {
    const names = {
        inner: 'Inner System',
        giants: 'Gas Giants',
        outer: 'Ice Giants',
        kuiper: 'Kuiper Belt',
    };
    return names[chapter];
};
