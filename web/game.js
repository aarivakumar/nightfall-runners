// Nightfall Runners — browser edition (Three.js)
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const CFG = {
  N: 20, C: 26,
  roundTime: 300, headStart: 15,
  keysToSpawn: 8, keysNeeded: 5, drinks: 7,
  maxHunters: 3,
  enragedBonus: 2, frenzyTime: 45,
  hiddenRange: 7, catchRadius: 3.0, catchHeight: 10,
  walk: 16, sprint: 26, maxStamina: 170, drain: 17, regen: 22,
  padBonus: 12, padDuration: 3,
  gravity: 90, jumpVel: 33, wallJumpVel: 32, wallKick: 9, maxWallJumps: 3,
  rewards: { key: 15, escape: 60, participation: 10 },
  upgrades: {
    stamina: { max: 5, base: 100, step: 75, per: 20, label: 'Lungs', desc: '+20 max stamina', icon: '🫁' },
    speed: { max: 5, base: 150, step: 100, per: 1, label: 'Sneakers', desc: '+1 sprint speed', icon: '👟' },
  },
};
const DIFF = {
  // pack: how far away the other monsters hear the howl when one of them spots you
  easy: { chase: 17, patrol: 12, pack: 0, mult: 0.75 },
  normal: { chase: 19.5, patrol: 14, pack: 170, mult: 1 },
  hard: { chase: 21.5, patrol: 16, pack: 320, mult: 1.5 },
};
// Rig options: posture (upright | crawl | float), eyes, extraArms, spikes, horns, robe, hood, boneFace, face,
// longClaws, flicker, bulk, fur, antlers, clown, jester, strings, hair, legsVisible, ribs. voice = sound pitches.
const MONSTERS = {
  // ---- Level 1: Nightfall City
  stalker: { name: 'The Stalker', emoji: '👹', eye: 0xff1428, eyeCss: '#ff4d5e', body: 0x120c10, scale: 1.3, speed: 0, sight: 110, hear: 18, posture: 'upright', headY: 8.5, lunge: 7.2,
    horns: true, spikes: 4, voice: { roar: 140, scream: 700, growl: 52 }, caption: 'The Stalker bent down and smiled at you.' },
  crawler: { name: 'The Crawler', emoji: '🕷', eye: 0x5dff3a, eyeCss: '#7dff6a', body: 0x0d160e, bone: 0xb8c49a, scale: 0.95, speed: 1.5, sight: 70, hear: 14, posture: 'crawl', headY: 4.6, lunge: 3.8,
    eyes: 6, extraArms: true, spikes: 6, spikeLen: 1.5, horns: true, voice: { roar: 260, scream: 900, growl: 95, click: true }, caption: 'The Crawler dragged you into the dark.' },
  wraith: { name: 'The Wraith', emoji: '👻', eye: 0xc46bff, eyeCss: '#cf8bff', body: 0x2a1840, scale: 1.15, speed: -1.5, sight: 110, hear: 34, posture: 'float', headY: 9.8, lunge: 4.6,
    ghost: 0x25083f, robe: 0x0c0612, hood: 0x0c0612, boneFace: true, longClaws: true, flicker: true, spikes: 4, voice: { roar: 520, scream: 1300, growl: 170, wail: true }, caption: 'The Wraith passed right through you.' },
  // ---- Level 2: Frostbite Hollow
  frostmaw: { name: 'The Frostmaw', emoji: '🦍', eye: 0x3ad8ff, eyeCss: '#7ae4ff', body: 0xaebccb, bone: 0x2a3440, scale: 1.5, speed: -0.5, sight: 100, hear: 24, posture: 'upright', headY: 8.5, lunge: 8,
    bulk: 1.5, fur: 0xe4ecf2, lightK: 0.2, horns: true, spikes: 0, voice: { roar: 85, scream: 480, growl: 38 }, caption: 'The Frostmaw crushed you into the snow.' },
  antlered: { name: 'The Antlered', emoji: '🦌', eye: 0xf4f6ff, eyeCss: '#ffffff', body: 0x1e1a18, bone: 0xe6dccb, scale: 1.05, speed: 2.2, sight: 80, hear: 14, posture: 'crawl', headY: 4.6, lunge: 3.8,
    antlers: true, boneFace: true, lightK: 0.45, spikes: 5, spikeLen: 1.2, voice: { roar: 330, scream: 1100, growl: 120, click: true }, caption: 'The Antlered ran you down in the trees.' },
  palelady: { name: 'The Pale Lady', emoji: '🥶', eye: 0x9af0ff, eyeCss: '#bff6ff', body: 0xd6e2ea, scale: 1.15, speed: -1, sight: 120, hear: 34, posture: 'float', headY: 9.8, lunge: 4.6,
    ghost: 0x10202a, robe: 0xc8d4dc, lightK: 0.2, hair: 0x050505, longClaws: true, flicker: true, ribs: false, spikes: 0, voice: { roar: 620, scream: 1500, growl: 210, wail: true }, caption: 'The Pale Lady pulled you into the cold.' },
  // ---- Level 3: Carnival of Screams
  grinner: { name: 'The Grinner', emoji: '🤡', eye: 0xffe23a, eyeCss: '#ffe866', body: 0x5a1426, face: 0xf2ede4, scale: 1.3, speed: 0.5, sight: 110, hear: 20, posture: 'upright', headY: 8.5, lunge: 7.2,
    clown: true, lightK: 0.5, ribs: false, spikes: 0, voice: { roar: 180, scream: 900, growl: 70, laugh: true }, caption: 'The Grinner wanted to play.' },
  jester: { name: 'The Jester', emoji: '🃏', eye: 0xff8a1e, eyeCss: '#ffaa55', body: 0x341448, face: 0xeee8e0, scale: 1.0, speed: 1.8, sight: 70, hear: 16, posture: 'crawl', headY: 4.6, lunge: 3.8,
    extraArms: true, jester: true, ribs: false, spikes: 0, voice: { roar: 300, scream: 1000, growl: 110, laugh: true }, caption: 'The Jester got the last laugh.' },
  marionette: { name: 'The Marionette', emoji: '🎭', eye: 0xff4ae0, eyeCss: '#ff7ae8', body: 0x7a4a2c, bone: 0xece0cc, scale: 1.2, speed: -1, sight: 120, hear: 32, posture: 'float', headY: 9.8, lunge: 4.6,
    strings: true, legsVisible: true, lightK: 0.6, boneFace: true, ribs: false, spikes: 0, voice: { roar: 450, scream: 1400, growl: 160, creak: true }, caption: 'The Marionette tangled you in its strings.' },
  // ---- Level 4: Titan Wasteland (GIANTS)
  colossus: { name: 'The Colossus', emoji: '🗿', eye: 0xff6a1a, eyeCss: '#ff9a5a', body: 0x2a2422, bone: 0x6a5a4a, scale: 4.2, speed: -2.5, sight: 160, hear: 30, posture: 'upright', headY: 8.5, lunge: 20,
    giant: true, bulk: 1.3, horns: true, spikes: 6, spikeLen: 1.4, voice: { roar: 48, scream: 300, growl: 26 }, caption: 'The Colossus stepped on you.' },
  behemoth: { name: 'The Behemoth', emoji: '🦖', eye: 0x9aff2a, eyeCss: '#b4ff6a', body: 0x1a2416, scale: 3.4, speed: -1, sight: 120, hear: 26, posture: 'crawl', headY: 4.6, lunge: 13,
    giant: true, eyes: 6, extraArms: true, spikes: 8, spikeLen: 2, horns: true, voice: { roar: 90, scream: 500, growl: 45, click: true }, caption: 'The Behemoth swallowed you whole.' },
  titanwraith: { name: 'The Titan Wraith', emoji: '☠️', eye: 0xff2a6a, eyeCss: '#ff6a9a', body: 0x2a0a20, scale: 3.8, speed: -3, sight: 160, hear: 60, posture: 'float', headY: 9.8, lunge: 16,
    giant: true, ghost: 0x30061a, robe: 0x0a0408, hood: 0x0a0408, boneFace: true, longClaws: true, flicker: true, spikes: 0, voice: { roar: 160, scream: 700, growl: 70, wail: true }, caption: 'The Titan Wraith blotted out the sky.' },
  // ---- Level 5: Sands of the Dead
  mummy: { name: 'The Mummy', emoji: '🧟', eye: 0x6aff4a, eyeCss: '#8aff6a', body: 0xb8a888, scale: 1.25, speed: 0, sight: 110, hear: 18, posture: 'upright', headY: 8.5, lunge: 7.2,
    mummy: true, ribs: false, spikes: 0, lightK: 0.4, voice: { roar: 120, scream: 650, growl: 48 }, caption: 'The Mummy wrapped you up forever.' },
  scorpion: { name: 'The Sand Stinger', emoji: '🦂', eye: 0xff3a2a, eyeCss: '#ff6a5a', body: 0x3a2414, bone: 0xd8a860, scale: 1.05, speed: 2, sight: 75, hear: 15, posture: 'crawl', headY: 4.6, lunge: 3.8,
    eyes: 6, extraArms: true, tail: true, spikes: 0, voice: { roar: 280, scream: 1000, growl: 100, click: true }, caption: 'The Sand Stinger got you.' },
  dustphantom: { name: 'The Dust Phantom', emoji: '🌪', eye: 0xffc83a, eyeCss: '#ffd86a', body: 0x8a6a40, scale: 1.15, speed: -1, sight: 120, hear: 34, posture: 'float', headY: 9.8, lunge: 4.6,
    ghost: 0x3a2a10, robe: 0xb89058, hood: 0x8a6a40, boneFace: true, longClaws: true, flicker: true, spikes: 0, lightK: 0.6, voice: { roar: 480, scream: 1200, growl: 180, wail: true }, caption: 'The Dust Phantom buried you in sand.' },
  // ---- Level 6: Sunken Depths
  angler: { name: 'The Angler', emoji: '🐟', eye: 0x3affe0, eyeCss: '#6affe8', body: 0x14202a, bone: 0xe8f0e0, scale: 1.1, speed: 1.5, sight: 80, hear: 16, posture: 'crawl', headY: 4.6, lunge: 3.8,
    lure: true, eyeSize: 1.6, spikes: 5, spikeLen: 1.3, ribs: false, voice: { roar: 200, scream: 800, growl: 70, click: true }, caption: 'The Angler lured you in.' },
  drowned: { name: 'The Drowned Sailor', emoji: '🧜', eye: 0x5aff9a, eyeCss: '#8affb4', body: 0x2a4440, scale: 1.3, speed: 0, sight: 110, hear: 18, posture: 'upright', headY: 8.5, lunge: 7.2,
    ghost: 0x0a3020, hair: 0x0a2a1a, spikes: 0, lightK: 0.6, voice: { roar: 110, scream: 600, growl: 45, wail: true }, caption: 'The Drowned Sailor pulled you under.' },
  jelly: { name: 'The Jelly Phantom', emoji: '🪼', eye: 0xff6ae8, eyeCss: '#ff9af0', body: 0x8a5aff, scale: 1.2, speed: -1, sight: 120, hear: 34, posture: 'float', headY: 9.8, lunge: 4.6,
    ghost: 0x6a1aa0, tentacles: true, flicker: true, ribs: false, spikes: 0, lightK: 0.5, voice: { roar: 560, scream: 1400, growl: 190, wail: true }, caption: 'The Jelly Phantom stung you.' },
  // ---- Level 7: Planet X
  grey: { name: 'The Grey', emoji: '👽', eye: 0x4aff6a, eyeCss: '#7aff8a', body: 0x8a9aa0, scale: 1.3, speed: 0.5, sight: 120, hear: 20, posture: 'upright', headY: 8.5, lunge: 7.2,
    bigHead: true, eyeSize: 2, ribs: false, spikes: 0, lightK: 0.5, voice: { roar: 300, scream: 1100, growl: 120, wail: true }, caption: 'The Grey took you to its ship.' },
  xeno: { name: 'The Xeno', emoji: '🦠', eye: 0xff2a6a, eyeCss: '#ff6a9a', body: 0x1a0a1e, bone: 0x6a4a7a, scale: 1.1, speed: 2, sight: 75, hear: 16, posture: 'crawl', headY: 4.6, lunge: 3.8,
    eyes: 6, tail: true, spikes: 7, spikeLen: 1.8, voice: { roar: 240, scream: 950, growl: 90, click: true }, caption: 'The Xeno got you.' },
  voidwisp: { name: 'The Void Wisp', emoji: '🌌', eye: 0x9a6aff, eyeCss: '#b49aff', body: 0x1a0a3a, scale: 1.2, speed: -1, sight: 130, hear: 36, posture: 'float', headY: 9.8, lunge: 4.6,
    ghost: 0x2a0a6a, robe: 0x0a0420, hood: 0x0a0420, boneFace: true, longClaws: true, flicker: true, spikes: 0, voice: { roar: 600, scream: 1500, growl: 220, wail: true }, caption: 'The Void Wisp pulled you into the stars.' },
  // ---- Level 8: Sweet Screams
  gingerbrute: { name: 'The Gingerbrute', emoji: '🍪', eye: 0xff3a3a, eyeCss: '#ff6a6a', body: 0xa8642a, face: 0xb87438, scale: 1.4, speed: 0, sight: 110, hear: 20, posture: 'upright', headY: 8.5, lunge: 7.5,
    bulk: 1.25, clownButtons: true, ribs: false, spikes: 0, lightK: 0.6, voice: { roar: 130, scream: 700, growl: 50, laugh: true }, caption: 'The Gingerbrute took a bite.' },
  candyspider: { name: 'The Candy Spider', emoji: '🍭', eye: 0x3affff, eyeCss: '#7affff', body: 0xd02a6a, bone: 0xf8f0f0, scale: 1.0, speed: 1.8, sight: 70, hear: 15, posture: 'crawl', headY: 4.6, lunge: 3.8,
    eyes: 6, extraArms: true, spikes: 6, spikeLen: 1.2, ribs: false, voice: { roar: 320, scream: 1000, growl: 110, click: true }, caption: 'The Candy Spider wrapped you in sugar.' },
  sugarghost: { name: 'The Sugar Specter', emoji: '🧁', eye: 0xff2a8a, eyeCss: '#ff6aaa', body: 0xffb0d8, scale: 1.15, speed: -1, sight: 120, hear: 34, posture: 'float', headY: 9.8, lunge: 4.6,
    ghost: 0x6a1a40, robe: 0xffc0e0, hood: 0xff90c8, longClaws: true, flicker: true, ribs: false, spikes: 0, lightK: 0.3, voice: { roar: 640, scream: 1500, growl: 230, laugh: true }, caption: 'The Sugar Specter melted you like candy.' },
  // ---- Level 9: Haunted Manor
  vampire: { name: 'The Vampire', emoji: '🧛', eye: 0xff1a2a, eyeCss: '#ff5a6a', body: 0x1a0a14, face: 0xe8e0e8, scale: 1.3, speed: 0.5, sight: 115, hear: 20, posture: 'upright', headY: 8.5, lunge: 7.2,
    robe: 0x3a0012, legsVisible: true, ribs: false, spikes: 0, lightK: 0.5, voice: { roar: 160, scream: 800, growl: 60, laugh: true }, caption: 'The Vampire had a midnight snack.' },
  werewolf: { name: 'The Werewolf', emoji: '🐺', eye: 0xffd21a, eyeCss: '#ffe05a', body: 0x2a1e14, scale: 1.15, speed: 2, sight: 85, hear: 22, posture: 'crawl', headY: 4.6, lunge: 3.8,
    fur: 0x4a3a2a, bulk: 1.15, horns: true, spikes: 0, voice: { roar: 220, scream: 900, growl: 80 }, caption: 'The Werewolf caught your scent.' },
  banshee: { name: 'The Banshee', emoji: '😱', eye: 0x9affff, eyeCss: '#c0ffff', body: 0xc8d0e0, scale: 1.15, speed: -1, sight: 120, hear: 40, posture: 'float', headY: 9.8, lunge: 4.6,
    ghost: 0x1a2a3a, robe: 0xd0d8e8, hair: 0x0a0a0a, longClaws: true, flicker: true, ribs: false, spikes: 0, lightK: 0.25, voice: { roar: 700, scream: 1700, growl: 250, wail: true }, caption: 'The Banshee screamed you away.' },
  // ---- Level 10: Jungle Temple
  serpent: { name: 'The Serpent', emoji: '🐍', eye: 0xffe21a, eyeCss: '#ffe85a', body: 0x1a4a1a, bone: 0xd8c860, scale: 1.1, speed: 2.2, sight: 80, hear: 14, posture: 'crawl', headY: 4.6, lunge: 3.8,
    tail: true, spikes: 9, spikeLen: 0.7, eyeSize: 1.3, ribs: false, voice: { roar: 260, scream: 1100, growl: 140, click: true }, caption: 'The Serpent swallowed you whole.' },
  junglebrute: { name: 'The Jungle Brute', emoji: '🦍', eye: 0xff8a1a, eyeCss: '#ffaa5a', body: 0x16220e, scale: 1.45, speed: 0, sight: 100, hear: 22, posture: 'upright', headY: 8.5, lunge: 7.8,
    fur: 0x2a4a1a, bulk: 1.4, spikes: 0, voice: { roar: 70, scream: 450, growl: 34 }, caption: 'The Jungle Brute pounded you flat.' },
  tiki: { name: 'The Tiki Spirit', emoji: '🗿', eye: 0xff6a1a, eyeCss: '#ff9a5a', body: 0x6a4020, face: 0x8a5a2a, scale: 1.2, speed: -1, sight: 125, hear: 36, posture: 'float', headY: 9.8, lunge: 4.6,
    robe: 0x2a5a1a, eyeSize: 1.6, horns: true, longClaws: true, flicker: true, ribs: false, spikes: 0, voice: { roar: 380, scream: 1200, growl: 150, wail: true }, caption: 'The Tiki Spirit cursed you.' },
  // ---- Level 11: Midnight Toyland
  teddy: { name: 'The Teddy', emoji: '🧸', eye: 0xff2a2a, eyeCss: '#ff6a6a', body: 0x7a4a2a, scale: 1.4, speed: 0, sight: 110, hear: 20, posture: 'upright', headY: 8.5, lunge: 7.6,
    fur: 0x8a5a3a, bulk: 1.3, clownButtons: true, horns: true, eyeSize: 1.4, spikes: 0, lightK: 0.6, voice: { roar: 140, scream: 760, growl: 55, laugh: true }, caption: 'The Teddy hugged you a little too hard.' },
  doll: { name: 'The Broken Doll', emoji: '🪆', eye: 0x6affff, eyeCss: '#9affff', body: 0xd8c8c0, face: 0xf4e8e8, scale: 1.0, speed: 1.8, sight: 75, hear: 16, posture: 'crawl', headY: 4.6, lunge: 3.8,
    hair: 0x4a2a10, eyeSize: 1.7, extraArms: true, ribs: false, spikes: 0, lightK: 0.4, voice: { roar: 420, scream: 1300, growl: 160, creak: true }, caption: 'The Broken Doll wants you to play forever.' },
  jackbox: { name: 'The Jack-in-the-Box', emoji: '🎁', eye: 0xb44aff, eyeCss: '#cf8bff', body: 0x3a1a6a, face: 0xf2ede4, scale: 1.25, speed: -0.5, sight: 120, hear: 32, posture: 'float', headY: 9.8, lunge: 4.6,
    clown: true, robe: 0x5a2aa0, spikes: 0, ribs: false, lightK: 0.5, voice: { roar: 360, scream: 1100, growl: 130, laugh: true }, caption: 'POP! goes the Jack-in-the-Box.' },
};
const LEVELS = [
  { name: 'Nightfall City', emoji: '🌃', color: '#ff6fb5', center: 'city', corners: ['forest', 'graveyard', 'factory', 'fields'], monsters: ['stalker', 'crawler', 'wraith'],
    hemi: [0x8f80e0, 0x1a1030, 0.75], sky: 0x140b2a, wall: 0x3d3048, lair: 0xff1e32, speedBonus: 0, weather: null,
    blurb: 'Neon city, dark woods, a graveyard, rust yards and a farm.',
    story: ['When night falls, the gates lock. The city, the woods, the graveyard, the farm…', 'The only way out is the north gate.', 'Find 5 keys to unlock it…', '…but you are not alone.', 'There are THREE of them.'],
    released: ['They\'re awake.', 'And they\'re hungry.'], escape: 'You made it out of the city!' },
  { name: 'Frostbite Hollow', emoji: '❄️', color: '#7ae4ff', center: 'village', corners: ['snowwoods', 'lake', 'crystal', 'camp'], monsters: ['frostmaw', 'antlered', 'palelady'],
    hemi: [0xa8c0e8, 0x1c2430, 0.8], sky: 0x18202c, wall: 0x56606e, lair: 0x3ab8ff, speedBonus: 0.5, weather: 'snow',
    blurb: 'A snowed-in village, frozen pines, slippery black ice and glowing crystal caves.',
    story: ['A blizzard has buried Frostbite Hollow. The village, the frozen pines, the black ice lake…', 'The only way out is the north gate.', 'Find 5 keys before you freeze…', 'Something is moving in the snow.', 'Three somethings.'],
    released: ['The snow is moving.', 'Run before your footprints give you away.'], escape: 'You made it out of the blizzard!' },
  { name: 'Carnival of Screams', emoji: '🎪', color: '#ffb84a', center: 'midway', corners: ['bigtop', 'rides', 'maze', 'haunted'], monsters: ['grinner', 'jester', 'marionette'],
    hemi: [0xc890e8, 0x281020, 0.75], sky: 0x1a0a18, wall: 0x4a2436, lair: 0xff7a1e, speedBonus: 1, weather: 'embers',
    blurb: 'An abandoned carnival: game booths, circus tents, rides, a hedge maze and bleeding woods.',
    story: ['The carnival closed years ago. Tonight, the lights came back on…', 'The only way out is the north gate.', 'Find 5 keys hidden among the rides…', 'The show is about to begin.', 'And YOU are the main act.'],
    released: ['Showtime.', 'Ladies and gentlemen… run.'], escape: 'You escaped the carnival!' },
  { name: 'Titan Wasteland', emoji: '🗿', color: '#ff8a3a', center: 'ruins', corners: ['craters', 'lava', 'factory', 'ashwoods'], monsters: ['colossus', 'behemoth', 'titanwraith'],
    hemi: [0xd09070, 0x201010, 0.75], sky: 0x1e0c08, wall: 0x3a2a26, lair: 0xff5a1a, speedBonus: 0, weather: 'ash',
    battle: true, keyWord: 'power core', keyIcon: '⚡', keyColor: 0x3ce6ff,
    blurb: 'GIANT monsters stomp through a ruined world. Collect 5 power cores to grow GIANT and fight them!',
    story: ['The world is in ruins. The titans did this.', 'The gate won\'t save you this time…', 'But these power cores hold a strange power…', 'The ground is shaking.', 'They are ENORMOUS.'],
    released: ['The titans have woken up.', 'Every step shakes the ground.'], escape: 'You defeated the titans!' },
  { name: 'Sands of the Dead', emoji: '🏜', color: '#ffd27a', center: 'bazaar', corners: ['dunes', 'pyramids', 'canyon', 'boneyard'], monsters: ['mummy', 'scorpion', 'dustphantom'],
    hemi: [0xe0b080, 0x2a1a10, 0.8], sky: 0x1c1408, wall: 0x8a6a44, lair: 0xffb43a, speedBonus: 1.5, weather: 'sand',
    blurb: 'A cursed desert town, tombs, red canyons and a boneyard, in a howling sandstorm.',
    story: ['The sandstorm came at sunset. The town, the tombs, the canyon…', 'The only way out is the north gate.', 'Find 5 keys buried in the sand…', 'The tombs are opening.', 'Three of them. And they never sleep.'],
    released: ['The curse is awake.', 'Don\'t let the sand slow you down.'], escape: 'You escaped the desert!' },
  { name: 'Sunken Depths', emoji: '🌊', color: '#3ad8ff', center: 'sunkencity', corners: ['kelp', 'reef', 'wrecks', 'trench'], monsters: ['angler', 'drowned', 'jelly'],
    hemi: [0x5ab0e0, 0x0a1a2a, 0.75], sky: 0x04121e, wall: 0x1a3a4a, lair: 0x3affe0, speedBonus: 1.5, weather: 'bubbles', gravity: 52,
    blurb: 'The bottom of the sea: a sunken city, kelp forests, coral reefs, shipwrecks and a deep trench. Jumps are floaty underwater!',
    story: ['Deep under the sea lies a city that sank long ago…', 'The only way out is the north gate.', 'Find 5 keys before your air runs out…', 'Something is swimming toward you.', 'Three somethings.'],
    released: ['The deep is waking up.', 'Swim for your life.'], escape: 'You made it back to the surface!' },
  { name: 'Planet X', emoji: '🪐', color: '#9a6aff', center: 'base', corners: ['alienwoods', 'xcrystal', 'craters', 'ufo'], monsters: ['grey', 'xeno', 'voidwisp'],
    hemi: [0x9a8aff, 0x10081a, 0.75], sky: 0x06020e, wall: 0x3a3a50, lair: 0x4aff6a, speedBonus: 2, weather: null, gravity: 40,
    blurb: 'A research base on an alien planet: glowing alien forests, crystal fields, craters and crashed UFOs. Low gravity = moon jumps!',
    story: ['The research base on Planet X went silent three days ago…', 'The only way off-planet is the north gate.', 'Find 5 keys to power it up…', 'The crew isn\'t alone.', 'The crew is GONE.'],
    released: ['They\'ve found you.', 'Jump high, run fast.'], escape: 'You escaped Planet X!' },
  { name: 'Sweet Screams', emoji: '🍭', color: '#ff7ac8', center: 'candytown', corners: ['candywoods', 'gumdrops', 'chocoriver', 'cotton'], monsters: ['gingerbrute', 'candyspider', 'sugarghost'],
    hemi: [0xff9ad8, 0x2a1020, 0.75], sky: 0x1a0614, wall: 0x6a2a4a, lair: 0xff3a8a, speedBonus: 2, weather: 'sprinkles',
    blurb: 'A candy land gone wrong: gingerbread houses, candy cane woods, gumdrop hills, sticky chocolate rivers and cotton candy fields.',
    story: ['Welcome to Candy Land! Everything here is sweet…', 'The only way out is the north gate.', 'Find 5 keys hidden in the candy…', 'Something smells… sugary.', 'And it\'s hungry for YOU.'],
    released: ['Treat time is over.', 'Don\'t get stuck in the chocolate!'], escape: 'You escaped Sweet Screams!' },
  { name: 'Haunted Manor', emoji: '🏚', color: '#b48aff', center: 'manor', corners: ['pumpkins', 'swamp', 'graveyard', 'maze'], monsters: ['vampire', 'werewolf', 'banshee'],
    hemi: [0x9a80d0, 0x140a1a, 0.7], sky: 0x0e0614, wall: 0x2a1a2a, lair: 0xb44aff, speedBonus: 2, weather: 'ash',
    blurb: 'A haunted mansion estate: creepy manors, a pumpkin patch, a foggy swamp, a graveyard and a hedge maze.',
    story: ['Nobody has lived in the manor for a hundred years…', 'The only way out is the north gate.', 'Find 5 keys hidden on the grounds…', 'The doors are creaking open.', 'And the residents are HOME.'],
    released: ['The manor wakes up.', 'Don\'t look back.'], escape: 'You escaped the Haunted Manor!' },
  { name: 'Jungle Temple', emoji: '🌴', color: '#5aff8a', center: 'temple', corners: ['jungle', 'river', 'mossrock', 'swamp'], monsters: ['serpent', 'junglebrute', 'tiki'],
    hemi: [0x8ad08a, 0x0a1a0a, 0.7], sky: 0x06120a, wall: 0x3a4a2a, lair: 0xff8a1a, speedBonus: 2, weather: 'rain',
    blurb: 'A lost temple deep in a rainy jungle: step pyramids, thick jungle, rivers, mossy cliffs and swamps.',
    story: ['Deep in the jungle, a lost temple glows in the rain…', 'The only way out is the north gate.', 'Find 5 keys hidden in the ruins…', 'The jungle has gone quiet.', 'Too quiet.'],
    released: ['The temple guardians awaken.', 'The rivers will slow you down!'], escape: 'You escaped the jungle!' },
  { name: 'Midnight Toyland', emoji: '🧸', color: '#ffb84a', center: 'toytown', corners: ['blocks', 'ballpit', 'trains', 'dollhouses'], monsters: ['teddy', 'doll', 'jackbox'],
    hemi: [0xffc0a0, 0x1a1020, 0.75], sky: 0x120a18, wall: 0x5a3a6a, lair: 0xffb84a, speedBonus: 2.5, weather: 'sprinkles',
    blurb: 'A giant toy room after midnight: toy town, giant blocks, ball pits to hide in, toy trains and dollhouses.',
    story: ['At midnight, the toys come out to play…', 'The only way out is the north gate.', 'Find 5 keys hidden between the toys…', 'Something just wound itself up.', 'They want to play with YOU.'],
    released: ['Playtime!', 'Hide in the ball pits!'], escape: 'You escaped Midnight Toyland!' },
  { name: 'The Nightmare Mix', emoji: '🌀', color: '#ff4ad0', mix: true, center: 'city', corners: [], monsters: [],
    hemi: [0xb070e0, 0x200820, 0.7], sky: 0x120414, wall: 0x2a1030, lair: 0xff2ad0, speedBonus: 2, weather: 'embers',
    blurb: 'Different every round: random areas from every level and 3 random monsters. The hardest level.',
    story: ['Every nightmare at once. Nothing makes sense here.', 'The only way out is the north gate.', 'Find 5 keys…', 'Who will it be this time?', 'Good luck.'],
    released: ['Here they come.', 'Run like you mean it.'], escape: 'You escaped the nightmare! You beat EVERY level!' },
];
// level 6 rolls a new mix of areas and monsters every round
function resolveLevel(L) {
  if (!L.mix) return L;
  const pick = (arr, n) => { const a = [...arr]; for (let k = a.length - 1; k > 0; k--) { const r = Math.floor(Math.random() * (k + 1)); [a[k], a[r]] = [a[r], a[k]]; } return a.slice(0, n); };
  const others = LEVELS.filter((x) => !x.mix);
  return { ...L, center: pick(others.map((x) => x.center), 1)[0], corners: pick(others.flatMap((x) => x.corners), 4),
    monsters: pick(others.filter((x) => !x.battle).flatMap((x) => x.monsters), 3) };
}
const upgradeCost = (name, lvl) => CFG.upgrades[name].base + CFG.upgrades[name].step * lvl;

// ---------------------------------------------------------------------------
// Save data (localStorage, best-effort)
// ---------------------------------------------------------------------------
const SAVE_KEY = 'nightfall_runners_save_v1';
const DEFAULT_SAVE = { coins: 0, escapes: 0, best: null, diff: 'normal', view: 'fp', level: 1, levelBest: {}, name: '', upgrades: { stamina: 0, speed: 0 } };
function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s) return { ...DEFAULT_SAVE, ...s, upgrades: { ...DEFAULT_SAVE.upgrades, ...(s.upgrades || {}) } };
  } catch (e) { /* storage unavailable */ }
  return JSON.parse(JSON.stringify(DEFAULT_SAVE));
}
const save = loadSave();
const settings = () => (save.settings = { vol: 0.8, sens: 1, quality: 'high', ...(save.settings || {}) });
if (!save.name) save.name = 'Runner' + Math.floor(10 + Math.random() * 90);
function writeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ } }

// ---------------------------------------------------------------------------
// Utils
// ---------------------------------------------------------------------------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
class Rng {
  constructor(seed) { this.f = mulberry32(seed); }
  next() { return this.f(); }
  range(a, b) { return a + (b - a) * this.f(); }
  int(a, b) { return a + Math.floor(this.f() * (b - a + 1)); }
  pick(arr) { return arr[this.int(0, arr.length - 1)]; }
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const $ = (id) => document.getElementById(id);
const fmtTime = (t) => { t = Math.max(0, Math.ceil(t)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };

// ---------------------------------------------------------------------------
// Renderer / scene
// ---------------------------------------------------------------------------
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x140b2a);
scene.fog = new THREE.FogExp2(0x1a1130, 0.0058);

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 900);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.6, 0.45, 0.92);
composer.addPass(bloom);
composer.addPass(new OutputPass());

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

const hemi = new THREE.HemisphereLight(0x8f80e0, 0x1a1030, 0.75);
scene.add(hemi);
const moon = new THREE.DirectionalLight(0xb0b4ff, 1.1);
moon.position.set(-90, 170, -70);
moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
Object.assign(moon.shadow.camera, { left: -150, right: 150, top: 150, bottom: -150, near: 10, far: 450 });
moon.shadow.bias = -0.0006;
scene.add(moon, moon.target);
function aimMoon(x, z) { x = Math.round(x / 16) * 16; z = Math.round(z / 16) * 16; moon.position.set(x - 90, 170, z - 70); moon.target.position.set(x, 0, z); }

// flashlight (always in the scene so the light count never changes)
const flashlight = new THREE.SpotLight(0xfff0d0, 0, 85, 0.52, 0.6, 1.25);
scene.add(flashlight, flashlight.target);
let flashlightOn = true;

// sky: stars + moon
{
  const starGeo = new THREE.BufferGeometry();
  const pts = [];
  for (let i = 0; i < 1600; i++) {
    const th = Math.random() * Math.PI * 2, ph = Math.random() * Math.PI * 0.45;
    pts.push(700 * Math.sin(ph) * Math.cos(th), 700 * Math.cos(ph) + 40, 700 * Math.sin(ph) * Math.sin(th));
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85 })));
  const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(28, 32, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xe8e4ff).multiplyScalar(2.2), fog: false }));
  moonMesh.position.set(-260, 420, -320);
  scene.add(moonMesh);
}

// ---------------------------------------------------------------------------
// Materials & textures
// ---------------------------------------------------------------------------
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...o });
const neon = (color, k = 3) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k) });
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }

function windowTexture(seed) {
  const r = new Rng(seed);
  const [c, g] = makeCanvas(128, 128);
  g.fillStyle = '#000'; g.fillRect(0, 0, 128, 128);
  const cols = ['#ffd27a', '#ffe9b0', '#8fe3ff', '#ff8fd0', '#b7a4ff'];
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
    if (r.next() < 0.42) { g.globalAlpha = r.range(0.45, 1); g.fillStyle = r.pick(cols); g.fillRect(x * 32 + 7, y * 32 + 6, 18, 20); }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const WINDOW_TEX = [11, 22, 33, 44].map(windowTexture);

function glowTexture() {
  const [c, g] = makeCanvas(128, 128);
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.35, 'rgba(255,255,255,0.45)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
const GLOW_TEX = glowTexture();
const glowMat = (color, opacity) => new THREE.MeshBasicMaterial({ map: GLOW_TEX, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });

function stripeTexture() {
  const [c, g] = makeCanvas(64, 64);
  g.fillStyle = '#300'; g.fillRect(0, 0, 64, 64);
  g.strokeStyle = '#fff'; g.lineWidth = 12;
  for (let i = -64; i < 128; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 64, 64); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

function textSprite(text, color) {
  const [c, g] = makeCanvas(512, 160);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const draw = (t, col) => {
    g.clearRect(0, 0, 512, 160);
    g.font = '700 96px Fredoka, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 14; g.strokeStyle = 'rgba(0,0,0,0.7)'; g.strokeText(t, 256, 84);
    g.fillStyle = col; g.fillText(t, 256, 84); tex.needsUpdate = true;
  };
  draw(text, color);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true, fog: false }));
  s.renderOrder = 20; s.userData.draw = draw;
  return s;
}

// ---------------------------------------------------------------------------
// Particles
// ---------------------------------------------------------------------------
const particles = [];
const PGEO = new THREE.SphereGeometry(0.3, 6, 4);
function burst(pos, color, n = 24, speed = 12, life = 0.9, up = 6, size = 1) {
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(3), transparent: true });
  mat.userData.n = n;
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(PGEO, mat);
    m.position.copy(pos);
    scene.add(m);
    const v = V(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5).normalize().multiplyScalar(speed * (0.4 + Math.random() * 0.8));
    v.y += up;
    const l = life * (0.6 + Math.random() * 0.6);
    particles.push({ m, v, life: l, max: l, mat, size });
  }
}
function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    p.v.y -= 18 * dt;
    p.m.position.addScaledVector(p.v, dt);
    p.m.scale.setScalar(p.size * Math.max(0.01, p.life / p.max));
    if (p.life <= 0) {
      scene.remove(p.m);
      if (--p.mat.userData.n <= 0) p.mat.dispose();
      particles.splice(i, 1);
    }
  }
}

// ---------------------------------------------------------------------------
// World generation
// ---------------------------------------------------------------------------
const BUILDING_COLORS = [0x3a3550, 0x2f3a4c, 0x4a3442, 0x2a2e3a, 0x45434c];
const NEON_COLORS = [0xff4aa0, 0x3cdcff, 0xffc845, 0x9a5aff];
const CAR_COLORS = [0xc83232, 0x286ec8, 0xe6e6e6, 0xf0b428, 0x1e1e1e];
// sight: how far monsters can see you in that zone (1 = full range)
const ZONES = {
  city: { name: '🏙 Neon City', color: '#ff9ad0', ground: [37, 36, 44], fog: 0x1a1130, density: 0.0062, map: '#2a2638', sight: 1 },
  forest: { name: '🌲 The Whispering Woods', color: '#7dff9a', ground: [22, 32, 20], fog: 0x08140d, density: 0.0125, map: '#15271a', sight: 0.45 },
  graveyard: { name: '🪦 Hollow Hill Cemetery', color: '#c9d4ff', ground: [36, 40, 37], fog: 0x252a35, density: 0.0135, map: '#2a2f33', sight: 0.65 },
  factory: { name: '🏭 The Rust Yards', color: '#ffae6b', ground: [44, 40, 37], fog: 0x231309, density: 0.009, map: '#33291f', sight: 0.9 },
  fields: { name: '🌽 Crowfield Farm', color: '#ffd96b', ground: [42, 34, 21], fog: 0x111327, density: 0.0095, map: '#30281a', sight: 0.8 },
  // Level 2
  village: { name: '🏘 Frostbite Village', color: '#bfe6ff', ground: [128, 138, 150], fog: 0x2a3442, density: 0.0095, map: '#56606c', sight: 1 },
  snowwoods: { name: '🌲 The Frozen Pines', color: '#dff4ff', ground: [140, 150, 160], fog: 0x1c2832, density: 0.013, map: '#3a4a48', sight: 0.45 },
  lake: { name: '🧊 Black Ice Lake (slippery!)', color: '#8fdcff', ground: [44, 74, 98], fog: 0x1a2a3a, density: 0.008, map: '#2f5a74', sight: 1.15, slippery: true },
  crystal: { name: '💎 Crystal Caverns', color: '#a8f0ff', ground: [44, 52, 72], fog: 0x0e1e36, density: 0.011, map: '#2a3a5a', sight: 0.7 },
  camp: { name: '⛺ Deadwood Camp', color: '#ffb27a', ground: [118, 118, 124], fog: 0x282024, density: 0.01, map: '#5a5250', sight: 0.85 },
  // Level 3
  midway: { name: '🎪 The Midway', color: '#ff9ad0', ground: [40, 26, 44], fog: 0x1c0f24, density: 0.0065, map: '#36203c', sight: 1 },
  bigtop: { name: '🎭 Big Top Row', color: '#ff6b6b', ground: [56, 40, 28], fog: 0x200a0e, density: 0.009, map: '#40221e', sight: 0.8 },
  rides: { name: '🎡 Ride Alley', color: '#ffd96b', ground: [36, 34, 44], fog: 0x14122a, density: 0.0085, map: '#2c2a3c', sight: 0.9 },
  maze: { name: '🌿 The Hedge Maze', color: '#7dff9a', ground: [30, 40, 26], fog: 0x0c1a10, density: 0.011, map: '#1e3020', sight: 0.5 },
  haunted: { name: '🩸 The Bleeding Woods', color: '#ff5a6a', ground: [34, 20, 20], fog: 0x22060a, density: 0.0125, map: '#2e1616', sight: 0.5 },
  // Level 4
  ruins: { name: '🏚 The Shattered City', color: '#ff9a5a', ground: [42, 36, 34], fog: 0x2a1610, density: 0.0072, map: '#3a302c', sight: 1 },
  craters: { name: '☄️ Impact Craters', color: '#ffb46b', ground: [50, 40, 34], fog: 0x2a120a, density: 0.008, map: '#40302a', sight: 1.1 },
  lava: { name: '🌋 Lava Fields (lava burns your stamina!)', color: '#ff6a2a', ground: [30, 22, 20], fog: 0x300a04, density: 0.009, map: '#3a1a10', sight: 0.9 },
  ashwoods: { name: '🌲 The Ash Forest', color: '#c8c0b8', ground: [58, 56, 54], fog: 0x1c1a1a, density: 0.012, map: '#3a3836', sight: 0.5 },
  // Level 5
  bazaar: { name: '🏺 The Sunken Bazaar', color: '#ffd27a', ground: [112, 90, 58], fog: 0x2a1c10, density: 0.0075, map: '#6a5a3a', sight: 1 },
  dunes: { name: '🏜 The Endless Dunes', color: '#ffe0a0', ground: [140, 112, 72], fog: 0x2a2014, density: 0.0075, map: '#8a744a', sight: 1.2 },
  pyramids: { name: '🔺 Valley of Tombs', color: '#ffc86a', ground: [124, 98, 62], fog: 0x221808, density: 0.009, map: '#7a6440', sight: 0.85 },
  canyon: { name: '🪨 Red Rock Canyon', color: '#ff8a5a', ground: [104, 58, 40], fog: 0x2a100a, density: 0.0105, map: '#6a3a2a', sight: 0.55 },
  boneyard: { name: '🦴 The Boneyard', color: '#f0e8d8', ground: [112, 96, 72], fog: 0x1e1814, density: 0.011, map: '#6a5a46', sight: 0.8 },
  // Level 6
  sunkencity: { name: '🏛 The Sunken City', color: '#6ae8ff', ground: [34, 58, 66], fog: 0x062a3a, density: 0.0095, map: '#1e4a54', sight: 0.9 },
  kelp: { name: '🌿 The Kelp Forest', color: '#7aff9a', ground: [30, 52, 44], fog: 0x05241e, density: 0.013, map: '#1a3a2a', sight: 0.45 },
  reef: { name: '🪸 The Coral Reef', color: '#ff9a7a', ground: [70, 70, 64], fog: 0x0a2a3a, density: 0.0095, map: '#4a3a3a', sight: 0.75 },
  wrecks: { name: '⚓ Shipwreck Graveyard', color: '#d8b07a', ground: [52, 58, 56], fog: 0x062030, density: 0.011, map: '#3a3a30', sight: 0.75 },
  trench: { name: '🕳 The Midnight Trench', color: '#5a7aff', ground: [16, 22, 34], fog: 0x020814, density: 0.014, map: '#141a2a', sight: 0.5 },
  // Level 7
  base: { name: '🛰 Research Base', color: '#cfd8ff', ground: [58, 58, 70], fog: 0x0e0a1e, density: 0.007, map: '#3a3a4a', sight: 1 },
  alienwoods: { name: '🍄 Glowshroom Forest', color: '#4affd0', ground: [34, 20, 50], fog: 0x0e0420, density: 0.012, map: '#2a1a3a', sight: 0.45 },
  xcrystal: { name: '💜 Crystal Plains', color: '#d07aff', ground: [44, 30, 60], fog: 0x140828, density: 0.009, map: '#3a2a4a', sight: 0.75 },
  ufo: { name: '🛸 UFO Crash Site', color: '#7aff8a', ground: [50, 46, 52], fog: 0x0a1a10, density: 0.009, map: '#3a3a3a', sight: 0.9 },
  // Level 8
  candytown: { name: '🏠 Gingerbread Town', color: '#ffc87a', ground: [120, 70, 90], fog: 0x2a0c1e, density: 0.0075, map: '#6a3a50', sight: 1 },
  candywoods: { name: '🍬 Candy Cane Woods', color: '#ff7a9a', ground: [110, 60, 80], fog: 0x24081a, density: 0.012, map: '#5a2a3a', sight: 0.5 },
  gumdrops: { name: '🟣 Gumdrop Hills', color: '#c87aff', ground: [96, 64, 108], fog: 0x1a0a24, density: 0.009, map: '#4a2a5a', sight: 0.8 },
  chocoriver: { name: '🍫 Chocolate River (sticky!)', color: '#d8a070', ground: [74, 44, 34], fog: 0x1e0c08, density: 0.009, map: '#4a2a1a', sight: 0.9 },
  cotton: { name: '☁️ Cotton Candy Fields', color: '#ffb0e0', ground: [130, 90, 120], fog: 0x2a1028, density: 0.01, map: '#6a4a6a', sight: 0.6 },
  // Level 9
  manor: { name: '🏚 The Manor', color: '#c8a8ff', ground: [34, 30, 36], fog: 0x140c1c, density: 0.009, map: '#2a2232', sight: 0.9 },
  pumpkins: { name: '🎃 Pumpkin Patch', color: '#ff9a3a', ground: [50, 36, 22], fog: 0x1e1008, density: 0.0095, map: '#3a2a16', sight: 0.85 },
  swamp: { name: '🐸 The Swamp (water slows you)', color: '#7aff9a', ground: [30, 40, 26], fog: 0x0c1a10, density: 0.014, map: '#1e2e1a', sight: 0.5 },
  // Level 10
  temple: { name: '🛕 The Lost Temple', color: '#ffd27a', ground: [60, 66, 44], fog: 0x0e1a0a, density: 0.009, map: '#4a5030', sight: 0.9 },
  jungle: { name: '🌴 Deep Jungle', color: '#5aff8a', ground: [24, 44, 20], fog: 0x061408, density: 0.014, map: '#163a14', sight: 0.4 },
  river: { name: '🌊 Jungle River (water slows you)', color: '#6ad8ff', ground: [40, 54, 34], fog: 0x081a14, density: 0.01, map: '#2a3a2a', sight: 0.9 },
  mossrock: { name: '🪨 Mossy Cliffs', color: '#9ad87a', ground: [44, 52, 40], fog: 0x0a1a0e, density: 0.011, map: '#3a4a34', sight: 0.55 },
  // Level 11
  toytown: { name: '🏘 Toy Town', color: '#ffd27a', ground: [70, 50, 80], fog: 0x1a0e22, density: 0.0075, map: '#4a3a5a', sight: 1 },
  blocks: { name: '🧱 Giant Blocks', color: '#ff7a7a', ground: [60, 46, 70], fog: 0x180c20, density: 0.009, map: '#3a2a4a', sight: 0.65 },
  ballpit: { name: '🔴 Ball Pits (hide in them!)', color: '#7ad8ff', ground: [56, 60, 84], fog: 0x0e1424, density: 0.009, map: '#3a3a5a', sight: 0.85 },
  trains: { name: '🚂 Toy Train Yard', color: '#ffb84a', ground: [64, 54, 50], fog: 0x1a1210, density: 0.009, map: '#4a3a34', sight: 0.85 },
  dollhouses: { name: '🏠 Dollhouse Lane', color: '#ffa0d0', ground: [80, 56, 76], fog: 0x1e0c1c, density: 0.0095, map: '#5a3a52', sight: 0.8 },
};

let world = null;

function buildWorld(seed, L = LEVELS[0]) {
  const rng = new Rng(seed);
  const { N, C } = CFG;
  const size = N * C, half = size / 2;
  const group = new THREE.Group();
  const W = { seed, group, size, half, N, C, obstacles: [], bushes: [], pads: [], keys: [], drinks: [], patrol: [], spawns: [], mapRects: [], zones: [], scarecrows: [], spinners: [], hazards: [] };

  const add = (mesh, cast = true, receive = true) => { mesh.castShadow = cast; mesh.receiveShadow = receive; group.add(mesh); return mesh; };
  const box = (w, h, d, mat, x, y, z, cast = true) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return add(m, cast); };
  const solid = (x, z, w, d, h, extra = {}) => { const o = { x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, h, ...extra }; W.obstacles.push(o); return o; };
  const glowDecal = (x, z, r, color, opacity) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), glowMat(color, opacity));
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.06, z); group.add(m); return m;
  };
  const cellCenter = (i, j) => V(-half + (i + 0.5) * C, 0, -half + (j + 0.5) * C);

  // instanced props (trees, graves, corn...) so the big map stays fast
  const batches = new Map();
  const inst = (key, geo, mat, x, y, z, o = {}) => {
    let b = batches.get(key);
    if (!b) { b = { geo, mat, list: [], cast: o.cast !== false }; batches.set(key, b); }
    b.list.push({ x, y, z, rx: o.rx || 0, ry: o.ry || 0, rz: o.rz || 0, sx: o.sx ?? o.s ?? 1, sy: o.sy ?? o.s ?? 1, sz: o.sz ?? o.s ?? 1, color: o.color });
  };

  // ---- zones: city down the middle, four wild areas in the corners (shuffled every round)
  const corners = [...L.corners];
  for (let k = 3; k > 0; k--) { const s = rng.int(0, k); [corners[k], corners[s]] = [corners[s], corners[k]]; }
  const colJit = Array.from({ length: N }, () => rng.int(-1, 1));
  const rowJit = Array.from({ length: N }, () => rng.int(-1, 1));
  const mid = N / 2;
  const isLair = (i, j) => (i === mid - 1 || i === mid) && (j === mid - 1 || j === mid);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const a = Math.round(N * 0.35) + colJit[j], b = N - Math.round(N * 0.35) - 1 + colJit[j];
    let z;
    if ((i >= a && i <= b) || ((i === mid - 1 || i === mid) && Math.abs(j - mid + 0.5) < 3)) z = L.center;
    else z = corners[(i < a ? 0 : 1) + (j >= mid + rowJit[i] ? 2 : 0)];
    W.zones[j * N + i] = z;
  }
  const zoneIdx = (i, j) => W.zones[clamp(j, 0, N - 1) * N + clamp(i, 0, N - 1)];
  W.zoneAt = (x, z) => zoneIdx(Math.floor((x + half) / C), Math.floor((z + half) / C));

  // ---- ground painted per zone
  {
    const G = size + 60, px = 2048, s = px / G;
    const P = (w) => (w + G / 2) * s;
    const [c, g] = makeCanvas(px, px);
    g.fillStyle = '#1d1c22'; g.fillRect(0, 0, px, px);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const [r, gg, b] = ZONES[W.zones[j * N + i]].ground;
      g.fillStyle = `rgb(${r},${gg},${b})`;
      g.fillRect(P(-half + i * C) - 1, P(-half + j * C) - 1, C * s + 2, C * s + 2);
    }
    for (let i = 0; i < 26000; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`; g.fillRect(Math.random() * px, Math.random() * px, 2, 2); }
    for (let i = 0; i < 30000; i++) {
      const wx = (Math.random() - 0.5) * size, wz = (Math.random() - 0.5) * size, z = W.zoneAt(wx, wz);
      if (z === 'forest') { g.fillStyle = Math.random() < 0.5 ? 'rgba(8,18,6,0.6)' : 'rgba(60,44,20,0.35)'; g.fillRect(P(wx), P(wz), 4, 3); }
      else if (z === 'graveyard') { g.fillStyle = 'rgba(90,110,80,0.3)'; g.fillRect(P(wx), P(wz), 2, 4); }
      else if ((z === 'village' || z === 'snowwoods' || z === 'camp') && Math.random() < 0.7) { g.fillStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.3})`; g.fillRect(P(wx), P(wz), 3, 3); }
      else if (z === 'lake' && Math.random() < 0.08) { g.strokeStyle = 'rgba(200,235,255,0.35)'; g.lineWidth = 1; g.setLineDash([]); g.beginPath(); g.moveTo(P(wx), P(wz)); g.lineTo(P(wx) + (Math.random() - 0.5) * 40, P(wz) + (Math.random() - 0.5) * 40); g.stroke(); }
      else if (z === 'crystal') { g.fillStyle = 'rgba(120,200,255,0.25)'; g.fillRect(P(wx), P(wz), 2, 2); }
      else if (z === 'midway') { g.fillStyle = ['#ff3a5a', '#3ab0ff', '#ffc83a', '#9a5aff'][i % 4] + '55'; g.fillRect(P(wx), P(wz), 3, 2); }
      else if (z === 'bigtop') { g.fillStyle = 'rgba(200,160,90,0.3)'; g.fillRect(P(wx), P(wz), 3, 2); }
      else if (z === 'maze') { g.fillStyle = 'rgba(8,20,6,0.5)'; g.fillRect(P(wx), P(wz), 4, 3); }
      else if (z === 'haunted') { g.fillStyle = Math.random() < 0.3 ? 'rgba(120,0,0,0.5)' : 'rgba(10,4,4,0.6)'; g.fillRect(P(wx), P(wz), 4, 3); }
      else if (z === 'factory' && Math.random() < 0.05) { g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(P(wx), P(wz), 4 + Math.random() * 8, 0, 7); g.fill(); }
    }
    g.lineWidth = 2.2;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const z = W.zones[j * N + i], x0 = P(-half + i * C), z0 = P(-half + j * C), L = C * s;
      if (z === 'fields') { g.strokeStyle = 'rgba(20,14,6,0.55)'; g.setLineDash([]); for (let k = 1; k < 9; k++) { g.beginPath(); g.moveTo(x0, z0 + (k * L) / 9); g.lineTo(x0 + L, z0 + (k * L) / 9); g.stroke(); } }
      if (z !== 'city') continue;
      g.strokeStyle = 'rgba(230,190,60,0.55)'; g.setLineDash([14, 14]);
      if (zoneIdx(i + 1, j) === 'city' && i + 1 < N) { g.beginPath(); g.moveTo(x0 + L, z0); g.lineTo(x0 + L, z0 + L); g.stroke(); }
      if (zoneIdx(i, j + 1) === 'city' && j + 1 < N) { g.beginPath(); g.moveTo(x0, z0 + L); g.lineTo(x0 + L, z0 + L); g.stroke(); }
    }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(G, G), std(0xffffff, { map: tex, roughness: 0.95 }));
    ground.rotation.x = -Math.PI / 2;
    W.ground = add(ground, false, true);
  }

  // ---- border walls + exit gap
  const wallH = 34, wallT = 4;
  const wallMat = std(L.wall, { roughness: 0.95 });
  const trimMat = neon(0xff2846, 2.5);
  const wall = (w, d, x, z) => {
    box(w, wallH, d, wallMat, x, wallH / 2, z);
    box(w + 0.2, 0.8, d + 0.2, trimMat, x, wallH - 0.4, z, false);
    solid(x, z, w, d, wallH);
  };
  wall(size + wallT * 2, wallT, 0, -half - wallT / 2);
  wall(wallT, size, half + wallT / 2, 0);
  wall(wallT, size, -half - wallT / 2, 0);
  const gapW = 18;
  const exitX = cellCenter(rng.int(2, N - 3), N - 1).x;
  const leftLen = exitX - gapW / 2 - (-half - wallT);
  const rightLen = (half + wallT) - (exitX + gapW / 2);
  wall(leftLen, wallT, -half - wallT + leftLen / 2, half + wallT / 2);
  wall(rightLen, wallT, half + wallT - rightLen / 2, half + wallT / 2);

  const stripes = stripeTexture(); stripes.repeat.set(4, 7);
  const gateMat = new THREE.MeshBasicMaterial({ map: stripes, color: new THREE.Color(0xff2a40).multiplyScalar(2), transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
  const gate = box(gapW, wallH, 1, gateMat, exitX, wallH / 2, half + wallT / 2, false);
  const gateObs = solid(exitX, half + wallT / 2, gapW, wallT, wallH, { gate: true });
  const gateSign = textSprite('🔒 EXIT', '#ff5a6a');
  gateSign.position.set(exitX, wallH + 6, half + wallT / 2); gateSign.scale.set(20, 6.25, 1);
  group.add(gateSign);
  const exitPlate = box(gapW, 0.3, 14, neon(0x50505a, 1), exitX, 0.15, half + wallT + 7, false);
  const gateLight = new THREE.PointLight(0xff2a40, 120, 50, 2);
  gateLight.position.set(exitX, 8, half - 4); group.add(gateLight);
  box(gapW + 6, 0.2, 60, std(0x2a2a32), exitX, 0.1, half + wallT + 30, false);
  for (let k = 0; k < 6; k++) box(0.5, 0.1, 4, neon(0xffffff, 1.2), exitX, 0.22, half + wallT + 10 + k * 9, false);
  W.exit = { x: exitX, z: half + wallT, gate, gateObs, gateSign, exitPlate, gateLight, stripes, gapW };

  // ---- shared geometry + materials
  const GEO = {
    box: new THREE.BoxGeometry(1, 1, 1),
    trunk: new THREE.CylinderGeometry(0.6, 0.9, 1, 6),
    cone: new THREE.ConeGeometry(1, 1, 7),
    cyl: new THREE.CylinderGeometry(1, 1, 1, 12),
    sphere: new THREE.SphereGeometry(1, 8, 6),
  };
  const MAT = {
    bark: std(0x3b2a1e, { roughness: 1 }), deadBark: std(0x4a4038, { roughness: 1 }),
    pine: std(0xffffff, { roughness: 0.95, flatShading: true }),
    stone: std(0xffffff, { roughness: 0.9 }),
    candle: neon(0xff9a3c, 3), shroom: neon(0x6affd2, 2.4),
    corn: std(0xffffff, { roughness: 1 }), tassel: std(0xc8a040, { roughness: 1 }),
    hay: std(0xb89a4a, { roughness: 1 }),
    metal: std(0xffffff, { roughness: 0.55, metalness: 0.5 }),
    toxic: neon(0x7dff3a, 1.8),
    crystal: std(0xffffff, { emissive: 0x2a78c0, emissiveIntensity: 0.8, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.88, flatShading: true }),
    ember: neon(0xff5a1a, 2.6), bulb: neon(0xffffff, 2.6), blood: neon(0xff1a2a, 2.4),
    lava: neon(0xff4a0a, 2.2), obsidian: std(0x1a1214, { roughness: 0.2, metalness: 0.6, emissive: 0x501008, emissiveIntensity: 0.6, flatShading: true }),
    sand: std(0xc8a06a, { roughness: 1 }), boneM: std(0xe8dcc8, { roughness: 0.7 }), rune: neon(0x3affc8, 2.2),
  };
  GEO.cone6 = new THREE.ConeGeometry(1, 1, 6);
  GEO.cyl6 = new THREE.CylinderGeometry(1, 1, 1, 7);
  GEO.dome = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  Object.assign(MAT, {
    gold: neon(0xffc83a, 2.2), panel: std(0xffffff, { roughness: 0.2, metalness: 0.7 }),
    gum: std(0xffffff, { roughness: 0.3, transparent: true, opacity: 0.92 }), cottonCloud: std(0xffffff, { roughness: 1, transparent: true, opacity: 0.85 }),
    coral: std(0xffffff, { emissive: 0x401018, emissiveIntensity: 0.6, roughness: 0.7, flatShading: true }),
    alienCap: std(0xffffff, { emissive: 0x30104a, emissiveIntensity: 0.7, roughness: 0.6 }),
    choco: std(0x4a2414, { roughness: 0.25, metalness: 0.2 }), chocoBar: std(0x5a2e18, { roughness: 0.6 }),
    pumpkin: std(0xffffff, { roughness: 0.7, flatShading: true }), firefly: neon(0xd8ff6a, 3),
    swampWater: std(0x1a3a2a, { roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.85 }),
    water: std(0x1a5a7a, { roughness: 0.05, metalness: 0.4, transparent: true, opacity: 0.8 }),
    toy: std(0xffffff, { roughness: 0.35 }),
  });
  const lampMat = neon(0xffd08a, 3.2), sodiumMat = neon(0xff8a2a, 3.2), poleMat = std(0x1e1e24, { metalness: 0.6, roughness: 0.4 });
  const crateMat = std(0x96693c, { roughness: 1 }), crateMat2 = std(0x7d5632, { roughness: 1 });
  const sidewalkMat = std(0x5c5a64, { roughness: 1 });
  const padMat = neon(0x3ce6ff, 2.2);
  const glassMat = std(0x1e2a40, { roughness: 0.15, metalness: 0.4, transparent: true, opacity: 0.75 });
  const headlightMat = neon(0xfffad2, 3);
  W.blinkMat = neon(0xff1020, 4);
  const keyCandidates = [];

  // ---- reusable props
  const lamp = (x, z, mat, color) => {
    box(0.8, 14, 0.8, poleMat, x, 7, z);
    box(2.4, 0.8, 2.4, mat, x, 14.2, z, false);
    solid(x, z, 0.8, 0.8, 14);
    glowDecal(x, z, 13, color, 0.32);
  };
  const bush = (x, z, seedK, col = null) => {
    const geo = new THREE.IcosahedronGeometry(4.75, 1);
    const pos = geo.attributes.position;
    for (let v = 0; v < pos.count; v++) {
      const hx = Math.sin(pos.getX(v) * 12.9 + pos.getY(v) * 78.2 + pos.getZ(v) * 37.7 + seedK) * 43758.5453;
      const f = 0.93 + (hx - Math.floor(hx)) * 0.14;
      pos.setXYZ(v, pos.getX(v) * f, pos.getY(v) * f * 0.85, pos.getZ(v) * f);
    }
    geo.computeVertexNormals();
    const mat = std(col || new THREE.Color().setHSL(0.31 + rng.range(-0.03, 0.03), 0.55, rng.range(0.2, 0.28)), { flatShading: true, roughness: 1, transparent: true, opacity: 1 });
    const m = new THREE.Mesh(geo, mat); m.position.set(x, 3.2, z); add(m, true, true);
    W.bushes.push({ x, z, r: 4.3, mesh: m });
    W.mapRects.push({ x, z, w: 8, d: 8, color: '#2c6b35', round: true });
  };
  const pineCols = [0x1c3a22, 0x15301c, 0x22402a, 0x1a3324];
  const tree = (x, z, snow = false) => {
    const h = rng.range(16, 26);
    inst('trunk', GEO.trunk, MAT.bark, x, h / 2, z, { sy: h });
    for (let t = 0; t < 3; t++) {
      const rad = lerp(5.6, 2.4, t / 2) * rng.range(0.85, 1.15), ch = h * 0.42;
      inst('pine', GEO.cone, MAT.pine, x, h * 0.3 + t * h * 0.2 + ch / 2, z, { sx: rad, sy: ch, sz: rad, ry: rng.next() * 6, color: snow ? (t === 0 ? 0x2c4a3c : rng.pick([0xdde6ec, 0xc8d4dc])) : rng.pick(pineCols) });
    }
    solid(x, z, 1.8, 1.8, h);
    W.mapRects.push({ x, z, w: 7, d: 7, color: '#1d4224', round: true });
  };
  const deadTree = (x, z, ash = false) => {
    const h = rng.range(11, 17) * (ash ? 1.3 : 1);
    if (ash && rng.next() < 0.3) fire(x, z, rng.range(3, h * 0.7), 0.8);
    inst('dtrunk', GEO.trunk, MAT.deadBark, x, h / 2, z, { sx: 0.75, sy: h, sz: 0.75 });
    for (let k = 0; k < 5; k++) {
      const a = rng.next() * Math.PI * 2, len = rng.range(3, 6.5), t = rng.range(0.6, 1.1), y = h * rng.range(0.5, 0.95);
      inst('branch', GEO.box, MAT.deadBark, x + Math.sin(t) * Math.cos(a) * len / 2, y + Math.cos(t) * len / 2, z + Math.sin(t) * Math.sin(a) * len / 2, { sx: 0.3, sy: len, sz: 0.3, ry: -a, rz: -t });
    }
    solid(x, z, 1.4, 1.4, h);
    W.mapRects.push({ x, z, w: 3, d: 3, color: '#4a4038', round: true });
  };

  // ---- city
  const cityCell = (cc, i, j, edge) => {
    let t;
    if (edge) t = 'empty';
    else { const r = rng.next(); t = r < 0.36 ? 'building' : r < 0.5 ? 'crates' : r < 0.63 ? 'bushes' : r < 0.68 ? 'pad' : 'empty'; }
    if (t === 'building') {
      const w = C - rng.int(8, 11), d = C - rng.int(8, 11), h = rng.int(16, 50);
      box(w + 3, 0.3, d + 3, sidewalkMat, cc.x, 0.15, cc.z, false);
      solid(cc.x, cc.z, w + 3, d + 3, 0.3);
      const body = rng.pick(BUILDING_COLORS);
      const wt = rng.pick(WINDOW_TEX);
      const side = (u) => { const tx = wt.clone(); tx.repeat.set(Math.max(1, Math.round(u / 16)), Math.max(1, Math.round(h / 16))); return std(body, { emissive: 0xffffff, emissiveMap: tx, emissiveIntensity: 0.85 }); };
      const roof = std(0x24222c);
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side(d), side(d), roof, roof, side(w), side(w)]);
      b.position.set(cc.x, h / 2, cc.z); add(b);
      solid(cc.x, cc.z, w, d, h);
      if (rng.next() < 0.6) {
        const bandMat = neon(rng.pick(NEON_COLORS), 1.8);
        for (let y = 7; y <= h - 4; y += 8) box(w + 0.2, 0.5, d + 0.2, bandMat, cc.x, y, cc.z, false);
      }
      box(w + 0.6, 0.6, d + 0.6, neon(rng.pick(NEON_COLORS), 2.6), cc.x, h + 0.3, cc.z, false);
      W.mapRects.push({ x: cc.x, z: cc.z, w, d, color: '#4a4166' });
    } else if (t === 'crates') {
      const count = rng.int(2, 4);
      for (let k = 0; k < count; k++) {
        const a = rng.next() * Math.PI * 2, rad = rng.range(6, 9), s = rng.int(4, 5);
        const x = cc.x + Math.cos(a) * rad, z = cc.z + Math.sin(a) * rad;
        box(s, s, s, crateMat, x, s / 2, z);
        let h = s;
        if (rng.next() < 0.3) { box(s - 1, s - 1, s - 1, crateMat2, x, s + (s - 1) / 2, z); h = s + s - 1; }
        solid(x, z, s, s, h);
        W.mapRects.push({ x, z, w: s, d: s, color: '#6b4c2e' });
      }
      keyCandidates.push(cc); W.patrol.push(cc);
    } else if (t === 'bushes') {
      const count = rng.int(2, 3);
      for (let k = 0; k < count; k++) {
        const a = (k / count) * Math.PI * 2 + rng.next(), rad = rng.range(3, 7);
        bush(cc.x + Math.cos(a) * rad, cc.z + Math.sin(a) * rad, i * 3.1 + j + k);
      }
      W.patrol.push(cc);
    } else if (t === 'pad') {
      const pad = box(9, 0.4, 9, padMat, cc.x, 0.2, cc.z, false);
      for (let k = -1; k <= 1; k++) {
        const chev = new THREE.Mesh(new THREE.ConeGeometry(1.4, 2.2, 3), neon(0xffffff, 2.5));
        chev.rotation.x = Math.PI / 2; chev.position.set(cc.x, 0.5, cc.z + k * 2.6); chev.scale.y = 0.6; group.add(chev);
      }
      glowDecal(cc.x, cc.z, 10, 0x3ce6ff, 0.5);
      W.pads.push({ x: cc.x, z: cc.z, mesh: pad });
      W.patrol.push(cc);
      W.mapRects.push({ x: cc.x, z: cc.z, w: 9, d: 9, color: '#2fb8d8' });
    } else {
      const roll = rng.next();
      if (roll < 0.35) lamp(cc.x + C / 2 - 4, cc.z + C / 2 - 4, lampMat, 0xffc070);
      else if (roll < 0.6 && !edge) {
        const sd = rng.next() < 0.5 ? -1 : 1, x = cc.x + sd * 7, z = cc.z;
        box(5, 2.6, 11, std(rng.pick(CAR_COLORS), { roughness: 0.35, metalness: 0.5 }), x, 1.7, z);
        box(4.6, 2, 5.5, glassMat, x, 4, z + 0.5);
        for (const hx of [-1.8, 1.8]) box(1, 0.6, 0.2, headlightMat, x + hx, 2, z - 5.55, false);
        box(4.8, 0.5, 0.2, neon(0xff2020, 2), x, 2, z + 5.55, false);
        solid(x, z, 5, 11, 3.0);
        solid(x, z + 0.5, 4.6, 5.5, 5.0);
        W.mapRects.push({ x, z, w: 5, d: 11, color: '#555' });
      }
      if (!edge) keyCandidates.push(cc);
      W.patrol.push(cc);
    }
  };

  // ---- forest: dense pines block the monsters' view, it's very dark in here
  const forestCell = (cc, i, j, edge, style = null) => {
    const clearing = !edge && rng.next() < 0.2;
    const nTrees = edge ? rng.int(1, 2) : clearing ? rng.int(2, 3) : rng.int(5, 8);
    const placed = [];
    for (let k = 0, tries = 0; k < nTrees && tries < 50; tries++) {
      const x = cc.x + rng.range(-10.5, 10.5), z = cc.z + rng.range(-10.5, 10.5);
      if (Math.hypot(x - cc.x, z - cc.z) < (edge ? 8 : 5.5)) continue;
      if (placed.some((p) => Math.hypot(p[0] - x, p[1] - z) < 7.5)) continue;
      placed.push([x, z]); k++;
      if (style === 'kelp' || style === 'alien' || style === 'candy' || style === 'jungle') fancyTree(x, z, style);
      else if (style === 'dead' || style === 'ash' || rng.next() < 0.12) deadTree(x, z, style === 'ash'); else tree(x, z, style === 'snow');
    }
    if (!edge && !clearing && rng.next() < 0.4) {
      const a = rng.next() * Math.PI * 2;
      const x = cc.x + Math.cos(a) * 4, z = cc.z + Math.sin(a) * 4;
      if (placed.every((p) => Math.hypot(p[0] - x, p[1] - z) > 6)) bush(x, z, i + j * 7, style === 'snow' ? SNOWBUSH() : style === 'dead' ? new THREE.Color(0x3a1a1a) : style === 'ash' ? new THREE.Color(0x4a4642) : style === 'kelp' ? new THREE.Color(0x1a4a3a) : style === 'alien' ? new THREE.Color(0x5a2a8a) : style === 'candy' ? new THREE.Color(0xff9ad0) : style === 'jungle' ? new THREE.Color(0x1a5a1a) : null);
    }
    const shrooms = clearing ? 10 : rng.int(0, 3);
    for (let k = 0; k < shrooms; k++) {
      const a = clearing ? (k / shrooms) * Math.PI * 2 : rng.next() * 6.3, r = clearing ? 7 : rng.range(3, 10);
      const x = cc.x + Math.cos(a) * r, z = cc.z + Math.sin(a) * r;
      inst('shroomStem', GEO.cyl, MAT.bark, x, 0.4, z, { sx: 0.12, sy: 0.8, sz: 0.12, cast: false });
      inst(style ? 'shroomCap' + style : 'shroomCap', GEO.sphere, style === 'snow' ? MAT.crystal : style === 'dead' ? MAT.blood : style === 'ash' ? MAT.ember : MAT.shroom, x, 0.85, z, { sx: 0.45, sy: 0.22, sz: 0.45, cast: false });
    }
    if (clearing) glowDecal(cc.x, cc.z, 9, style === 'dead' ? 0xff1a2a : style === 'snow' ? 0x7ab8ff : 0x6affd2, 0.18);
    if (clearing && style === 'dead' && W.scarecrows.length < 10) scarecrow(cc.x + 5, cc.z - 5);
    if (!edge) keyCandidates.push(cc);
    W.patrol.push(cc);
  };

  // ---- graveyard: rows of graves, crypts with glowing doors, dead trees
  const crypt = (cc) => {
    const w = rng.int(10, 13), d = rng.int(9, 12), h = rng.int(9, 12);
    const stone = std(0x5a5a60, { roughness: 0.95 });
    box(w, h, d, stone, cc.x, h / 2, cc.z);
    const r = Math.max(w, d) * 0.75;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(r, 6, 4), std(0x2e2c34, { roughness: 0.9 }));
    roof.rotation.y = Math.PI / 4; roof.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d)); roof.position.set(cc.x, h + 3, cc.z); add(roof);
    box(3.2, 6.5, 0.3, new THREE.MeshBasicMaterial({ color: 0x050308 }), cc.x, 3.25, cc.z - d / 2 - 0.1, false);
    box(0.22, 6, 0.34, neon(0xb46bff, 3), cc.x, 3.1, cc.z - d / 2 - 0.14, false);
    for (const sx of [-1, 1]) box(1.1, h, 1.1, stone, cc.x + sx * (w / 2 - 0.2), h / 2, cc.z - d / 2 - 0.4);
    glowDecal(cc.x, cc.z - d / 2 - 2.5, 4, 0xb46bff, 0.4);
    solid(cc.x, cc.z, w + 1, d + 1.4, h);
    W.mapRects.push({ x: cc.x, z: cc.z, w, d, color: '#55525c' });
  };
  const stoneCols = [0x6e6e74, 0x5c5f5a, 0x77736a, 0x505257];
  const graveCell = (cc, i, j, edge) => {
    if (edge) { if (rng.next() < 0.3) deadTree(cc.x + rng.pick([-1, 1]) * 10, cc.z + rng.pick([-1, 1]) * 9); W.patrol.push(cc); return; }
    if (rng.next() < 0.2) { crypt(cc); return; }
    const rows = rng.int(2, 3);
    for (let a = 0; a < rows; a++) for (let b = 0; b < 3; b++) {
      if (rng.next() < 0.2) continue;
      const x = cc.x + (b - 1) * 7.5 + rng.range(-0.6, 0.6), z = cc.z + (a - (rows - 1) / 2) * 8.5 + rng.range(-0.5, 0.5);
      if (Math.hypot(x - cc.x, z - cc.z) < 4) continue;
      const tilt = rng.range(-0.18, 0.18), col = rng.pick(stoneCols);
      if (rng.next() < 0.3) {
        inst('crossV', GEO.box, MAT.stone, x, 2.1, z, { sx: 0.5, sy: 4.2, sz: 0.5, rz: tilt, color: col });
        inst('crossH', GEO.box, MAT.stone, x - Math.sin(tilt) * 1, 2.9, z, { sx: 2.4, sy: 0.5, sz: 0.5, rz: tilt, color: col });
        solid(x, z, 0.9, 0.9, 4.2);
      } else {
        const h = rng.range(2.2, 3.6);
        inst('tomb', GEO.box, MAT.stone, x, h / 2, z, { sx: 2.3, sy: h, sz: 0.65, rz: tilt, ry: rng.range(-0.12, 0.12), color: col });
        inst('mound', GEO.box, MAT.deadBark, x, 0.25, z - 2.4, { sx: 2, sy: 0.5, sz: 4, cast: false });
        solid(x, z, 2.3, 0.8, h);
      }
      W.mapRects.push({ x, z, w: 2.4, d: 1, color: '#6e6e74' });
      if (rng.next() < 0.22) {
        inst('candle', GEO.box, MAT.candle, x + 1.3, 0.45, z - 0.9, { sx: 0.25, sy: 0.9, sz: 0.25, cast: false });
        glowDecal(x + 1.3, z - 0.9, 2.5, 0xff9a3c, 0.4);
      }
    }
    if (rng.next() < 0.45) deadTree(cc.x + rng.pick([-1, 1]) * 10.5, cc.z + rng.pick([-1, 1]) * 11);
    keyCandidates.push(cc); W.patrol.push(cc);
  };

  // ---- rust yards: warehouses, shipping containers, smokestacks, toxic barrels
  const contCols = [0x8a2f22, 0x24508a, 0x2e6a3a, 0xb8661e, 0x6a6a70];
  const barrel = (x, z) => {
    const toxic = rng.next() < 0.3;
    inst(toxic ? 'barrelT' : 'barrel', GEO.cyl, toxic ? MAT.toxic : MAT.metal, x, 1.3, z, { sx: 1.1, sy: 2.6, sz: 1.1, color: toxic ? undefined : rng.pick([0x5a4030, 0x3a4a5a, 0x6a2a20]) });
    if (toxic) glowDecal(x, z, 3.5, 0x7dff3a, 0.35);
    solid(x, z, 2.2, 2.2, 2.6);
    W.mapRects.push({ x, z, w: 2.2, d: 2.2, color: toxic ? '#7dff3a' : '#6a5040', round: true });
  };
  const factoryCell = (cc, i, j, edge) => {
    if (edge) { if (rng.next() < 0.35) lamp(cc.x + C / 2 - 4, cc.z + C / 2 - 4, sodiumMat, 0xff8a2a); W.patrol.push(cc); return; }
    const r = rng.next();
    if (r < 0.28) {
      const w = C - rng.int(8, 10), d = C - rng.int(8, 10), h = rng.int(13, 20);
      const [c, g] = makeCanvas(64, 64);
      g.fillStyle = '#777'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#555';
      for (let k = 0; k < 64; k += 8) g.fillRect(k, 0, 3, 64);
      const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(w / 4, 1);
      const body = std(rng.pick([0x5a6470, 0x6a5a4a, 0x4a5a52]), { map: tex, roughness: 0.7, metalness: 0.3 });
      box(w, h, d, body, cc.x, h / 2, cc.z);
      box(w + 0.2, 1.2, d + 0.2, neon(0xff8a2a, 1.3), cc.x, h - 2.5, cc.z, false);
      box(8, 9, 0.3, new THREE.MeshBasicMaterial({ color: 0x0a0806 }), cc.x, 4.5, cc.z - d / 2 - 0.1, false);
      box(8.4, 0.4, 0.4, neon(0xff6a1a, 2.5), cc.x, 9.2, cc.z - d / 2 - 0.2, false);
      solid(cc.x, cc.z, w, d, h);
      W.mapRects.push({ x: cc.x, z: cc.z, w, d, color: '#5a5048' });
      return;
    }
    if (r < 0.62) {
      // two containers on opposite corners, so there's always a way through
      const slots = rng.next() < 0.5 ? [[-7.5, -5, 0], [7.5, 5, 0]] : [[5, -7.5, 1], [-5, 7.5, 1]];
      for (const [ox, oz, rot] of slots) {
        const x = cc.x + ox, z = cc.z + oz, w = rot ? 10.5 : 5, d = rot ? 5 : 10.5;
        inst('cont', GEO.box, MAT.metal, x, 2.75, z, { sx: w, sy: 5.5, sz: d, color: rng.pick(contCols) });
        let h = 5.5;
        if (rng.next() < 0.4) { inst('cont', GEO.box, MAT.metal, x, 8.25, z, { sx: w, sy: 5.5, sz: d, color: rng.pick(contCols) }); h = 11; }
        solid(x, z, w, d, h);
        W.mapRects.push({ x, z, w, d, color: '#7a4a3a' });
      }
    } else if (r < 0.74) {
      const x = cc.x + rng.pick([-1, 1]) * 7, z = cc.z + rng.pick([-1, 1]) * 7;
      box(7, 4, 7, std(0x4a3a34), x, 2, z);
      const stack = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.7, 56, 14), std(0x6a3a2c, { roughness: 0.9 }));
      stack.position.set(x, 30, z); add(stack);
      box(4.4, 1, 4.4, W.blinkMat, x, 57.5, z, false);
      for (const y of [20, 40]) box(5.6, 0.6, 5.6, neon(0xffffff, 0.9), x, y, z, false);
      solid(x, z, 7, 7, 58);
      W.mapRects.push({ x, z, w: 7, d: 7, color: '#7a3a2c', round: true });
      barrel(cc.x - Math.sign(x - cc.x) * 6, cc.z + Math.sign(z - cc.z) * 6);
    } else {
      const n = rng.int(2, 5);
      for (let k = 0; k < n; k++) { const a = rng.next() * 6.3, rr = rng.range(5.5, 9); barrel(cc.x + Math.cos(a) * rr, cc.z + Math.sin(a) * rr); }
      if (rng.next() < 0.5) lamp(cc.x + C / 2 - 4, cc.z + C / 2 - 4, sodiumMat, 0xff8a2a);
    }
    keyCandidates.push(cc); W.patrol.push(cc);
  };

  // ---- farm: corn you can hide in, barns, hay, and scarecrows that watch you
  const cornCols = [0x5a6a26, 0x6a6a2a, 0x4e5e22, 0x7a6a30];
  const scarecrow = (x, z) => {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const wood = std(0x4a3420), burlap = std(0x8a7448, { roughness: 1 }), cloth = std(0x3a2a40, { roughness: 1 });
    const parts = [[BOX(0.45, 9, 0.45), wood, 0, 4.5, 0], [BOX(7, 0.4, 0.4), wood, 0, 6.6, 0], [BOX(2.2, 3.2, 1.1), cloth, 0, 5.6, 0], [BOX(2.2, 1.4, 0.6), cloth, -2.4, 6.4, 0], [BOX(2.2, 1.4, 0.6), cloth, 2.4, 6.4, 0]];
    for (const [geo, m, px, py, pz] of parts) { const mm = new THREE.Mesh(geo, m); mm.position.set(px, py, pz); mm.castShadow = true; g.add(mm); }
    const head = new THREE.Group(); head.position.set(0, 8.3, 0); g.add(head);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(1.05, 10, 8), burlap); skull.castShadow = true; head.add(skull);
    const hat = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1.8, 8), std(0x2a2018)); hat.position.y = 1.2; hat.rotation.z = 0.25; head.add(hat);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 0.15, 12), std(0x2a2018)); brim.position.y = 0.5; head.add(brim);
    const eyeMat = neon(0xff3010, 0.6);
    for (const ex of [-0.38, 0.38]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), eyeMat); e.position.set(ex, 0.15, 0.92); head.add(e); }
    const mouth = new THREE.Mesh(BOX(0.9, 0.08, 0.1), new THREE.MeshBasicMaterial({ color: 0x000000 })); mouth.position.set(0, -0.4, 0.95); mouth.rotation.z = 0.15; head.add(mouth);
    group.add(g);
    solid(x, z, 0.8, 0.8, 9);
    W.scarecrows.push({ x, z, head, eyeMat, eyeCol: 0xff3010 });
    W.mapRects.push({ x, z, w: 3, d: 3, color: '#8a7448', round: true });
  };
  let barns = 0;
  const fieldsCell = (cc, i, j, edge) => {
    if (edge) { if (rng.next() < 0.3) { inst('hay', GEO.cyl, MAT.hay, cc.x + 9, 1.6, cc.z, { sx: 1.6, sy: 3, sz: 1.6, rz: Math.PI / 2 }); solid(cc.x + 9, cc.z, 3, 3.2, 3.2); } W.patrol.push(cc); return; }
    const r = rng.next();
    if (r < 0.42) {
      for (let zz = -10.5; zz <= 10.5; zz += 2.1) for (let xx = -11; xx <= 11; xx += 1.7) {
        if (Math.hypot(xx, zz) < 2.4) continue; // little gap in the middle (keys hide here)
        const x = cc.x + xx + rng.range(-0.3, 0.3), z = cc.z + zz + rng.range(-0.3, 0.3), h = rng.range(6.2, 8);
        inst('corn', GEO.box, MAT.corn, x, h / 2, z, { sx: 0.3, sy: h, sz: 0.3, rz: rng.range(-0.06, 0.06), color: rng.pick(cornCols) });
        if (rng.next() < 0.5) inst('cornLeaf', GEO.box, MAT.corn, x, h * 0.55, z, { sx: 1.8, sy: 0.08, sz: 0.35, ry: rng.next() * 6.3, rz: 0.4, color: rng.pick(cornCols), cast: false });
        inst('tassel', GEO.box, MAT.tassel, x, h + 0.3, z, { sx: 0.35, sy: 0.7, sz: 0.35, cast: false });
      }
      W.bushes.push({ x: cc.x, z: cc.z, r: 11.5, mesh: null, corn: true });
      W.mapRects.push({ x: cc.x, z: cc.z, w: 23, d: 22, color: '#5e5424' });
      keyCandidates.push(cc);
    } else if (r < 0.54 && barns < 3) {
      barns++;
      const w = 18, d = 14, h = 11, red = std(0x6e1c18, { roughness: 0.9 }), white = std(0xd8d0c0);
      box(w, h, d, red, cc.x, h / 2, cc.z);
      for (const s of [-1, 1]) { const p = box(w + 1, 0.6, 8.8, std(0x2a2422), cc.x, h + 2, cc.z + s * 3.8); p.rotation.x = s * 0.48; }
      box(6, 8, 0.3, new THREE.MeshBasicMaterial({ color: 0x060404 }), cc.x, 4, cc.z - d / 2 - 0.1, false);
      for (const s of [-1, 1]) { const x = box(0.4, 9.5, 0.4, white, cc.x, 4, cc.z - d / 2 - 0.3, false); x.rotation.z = s * 0.64; }
      box(2.2, 1.6, 0.3, neon(0xffc060, 1.6), cc.x, h - 2, cc.z - d / 2 - 0.1, false);
      solid(cc.x, cc.z, w, d, h);
      W.mapRects.push({ x: cc.x, z: cc.z, w, d, color: '#7a2a24' });
      W.patrol.push(cc); return;
    } else {
      const n = rng.int(2, 4);
      for (let k = 0; k < n; k++) {
        const a = rng.next() * 6.3, rr = rng.range(6, 9.5), x = cc.x + Math.cos(a) * rr, z = cc.z + Math.sin(a) * rr;
        inst('hay', GEO.cyl, MAT.hay, x, 1.6, z, { sx: 1.6, sy: 3, sz: 1.6, rz: Math.PI / 2, ry: a });
        solid(x, z, 3, 3, 3.2);
        W.mapRects.push({ x, z, w: 3, d: 3, color: '#b89a4a', round: true });
      }
      if (W.scarecrows.length < 9 && rng.next() < 0.6) scarecrow(cc.x + rng.pick([-1, 1]) * 5, cc.z + rng.pick([-1, 1]) * 5);
      keyCandidates.push(cc);
    }
    W.patrol.push(cc);
  };

  // ---- shared bits for levels 2 and 3
  const speedPad = (cc) => {
    const pad = box(9, 0.4, 9, padMat, cc.x, 0.2, cc.z, false);
    for (let k = -1; k <= 1; k++) {
      const chev = new THREE.Mesh(new THREE.ConeGeometry(1.4, 2.2, 3), neon(0xffffff, 2.5));
      chev.rotation.x = Math.PI / 2; chev.position.set(cc.x, 0.5, cc.z + k * 2.6); chev.scale.y = 0.6; group.add(chev);
    }
    glowDecal(cc.x, cc.z, 10, 0x3ce6ff, 0.5);
    W.pads.push({ x: cc.x, z: cc.z, mesh: pad });
    W.mapRects.push({ x: cc.x, z: cc.z, w: 9, d: 9, color: '#2fb8d8' });
  };
  const stripeTex = (a, b, n = 8) => {
    const [c, g] = makeCanvas(128, 16);
    for (let k = 0; k < n; k++) { g.fillStyle = k % 2 ? b : a; g.fillRect((k * 128) / n, 0, 128 / n + 1, 16); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  };
  const watcher = (x, z, head, eyeMat, eyeCol, h) => { // anything whose head turns to follow you
    W.scarecrows.push({ x, z, head, eyeMat, eyeCol });
    solid(x, z, 2.4, 2.4, h);
    W.mapRects.push({ x, z, w: 3, d: 3, color: '#ddd', round: true });
  };
  const meshAt = (geo, mat, x, y, z, parent = group) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
  const snowMat = std(0xe8eef4, { roughness: 1 });
  const SNOWBUSH = () => new THREE.Color().setHSL(0.45, 0.15, rng.range(0.62, 0.72));

  // ===== Level 2: Frostbite Hollow =====
  const snowman = (x, z) => {
    meshAt(new THREE.SphereGeometry(2.4, 12, 10), snowMat, x, 2.2, z);
    meshAt(new THREE.SphereGeometry(1.7, 12, 10), snowMat, x, 5.4, z);
    const head = new THREE.Group(); head.position.set(x, 7.9, z); group.add(head);
    meshAt(new THREE.SphereGeometry(1.2, 12, 10), snowMat, 0, 0, 0, head);
    const eyeMat = neon(0x3ab8ff, 0.5);
    for (const ex of [-0.4, 0.4]) meshAt(new THREE.SphereGeometry(0.17, 8, 6), eyeMat, ex, 0.25, 1.08, head);
    const nose = meshAt(new THREE.ConeGeometry(0.18, 1.3, 6), std(0xe06a1a), 0, 0, 1.6, head); nose.rotation.x = Math.PI / 2;
    for (let k = -2; k <= 2; k++) meshAt(new THREE.SphereGeometry(0.09, 6, 4), std(0x111111), k * 0.22, -0.45 + Math.abs(k) * 0.08, 1.08, head); // stitched grin
    meshAt(new THREE.CylinderGeometry(0.8, 0.8, 1.4, 12), std(0x15151a), 0, 1.5, 0, head);
    meshAt(new THREE.CylinderGeometry(1.3, 1.3, 0.12, 12), std(0x15151a), 0, 0.85, 0, head);
    for (const s of [-1, 1]) { const arm = meshAt(BOX(3.6, 0.22, 0.22), std(0x3a2618), x + s * 2.8, 6, z); arm.rotation.z = s * 0.5; }
    watcher(x, z, head, eyeMat, 0x3ab8ff, 9);
  };
  const cabin = (cc) => {
    const w = rng.int(12, 15), d = rng.int(10, 13), h = rng.int(7, 9);
    const logs = std(rng.pick([0x5a3a24, 0x4a3020, 0x6a4a30]), { roughness: 1 });
    box(w, h, d, logs, cc.x, h / 2, cc.z);
    for (const s of [-1, 1]) {
      const p = box(w + 1.5, 0.6, d / 2 + 1.6, std(0x2a2020), cc.x, h + 2, cc.z + s * (d / 4 + 0.3)); p.rotation.x = s * 0.5;
      const sn = box(w + 1.7, 0.5, d / 2 + 1.7, snowMat, cc.x, h + 2.5, cc.z + s * (d / 4 + 0.3), false); sn.rotation.x = s * 0.5;
    }
    const lit = rng.next() < 0.6, winMat = lit ? neon(0xffa040, 1.8) : new THREE.MeshBasicMaterial({ color: 0x050505 });
    for (const sx of [-1, 1]) box(2, 1.8, 0.2, winMat, cc.x + sx * w / 4, h * 0.55, cc.z - d / 2 - 0.1, false);
    box(2.4, 4.5, 0.2, new THREE.MeshBasicMaterial({ color: 0x0a0604 }), cc.x, 2.25, cc.z - d / 2 - 0.1, false);
    box(1.6, 5, 1.6, std(0x55555c), cc.x + w / 4, h + 3, cc.z + d / 4);
    solid(cc.x, cc.z, w, d, h);
    W.mapRects.push({ x: cc.x, z: cc.z, w, d, color: '#6a5040' });
  };
  const logPile = (x, z, a = 0) => {
    for (const [o, y] of [[-0.7, 0.65], [0.7, 0.65], [0, 1.8]]) inst('log', GEO.cyl, MAT.bark, x - Math.sin(a) * o, y, z + Math.cos(a) * o, { sx: 0.65, sy: 5, sz: 0.65, rz: Math.PI / 2, ry: a });
    solid(x, z, 4.4, 4.4, 2.4);
    W.mapRects.push({ x, z, w: 5, d: 3, color: '#5a3a24' });
  };
  const villageCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.34) { cabin(cc); return; }
    if (r < 0.47) { const n = rng.int(2, 3); for (let k = 0; k < n; k++) { const a = (k / n) * 6.28 + rng.next(), rr = rng.range(3, 7); bush(cc.x + Math.cos(a) * rr, cc.z + Math.sin(a) * rr, i * 3.1 + j + k, SNOWBUSH()); } W.patrol.push(cc); return; }
    if (r < 0.53) { speedPad(cc); W.patrol.push(cc); return; }
    const roll = rng.next();
    if (roll < 0.3) lamp(cc.x + C / 2 - 4, cc.z + C / 2 - 4, lampMat, 0xffc070);
    else if (roll < 0.55 && !edge && W.scarecrows.length < 10) snowman(cc.x + rng.pick([-1, 1]) * 7, cc.z + rng.pick([-1, 1]) * 7);
    else if (roll < 0.75 && !edge) logPile(cc.x + rng.pick([-1, 1]) * 7, cc.z + rng.pick([-1, 1]) * 7, rng.next() * 3);
    if (!edge) keyCandidates.push(cc);
    W.patrol.push(cc);
  };
  const rock = (x, z, r) => {
    inst('rock', GEO.sphere, MAT.stone, x, r * 0.55, z, { sx: r * 1.2, sy: r * 0.9, sz: r, ry: rng.next() * 6, color: rng.pick([0x5a5e66, 0x4a4e56, 0x6a6e74]) });
    inst('rockSnow', GEO.sphere, snowMat, x, r * 1.15, z, { sx: r * 0.9, sy: r * 0.35, sz: r * 0.75, cast: false });
    solid(x, z, r * 2, r * 1.8, r * 1.3);
    W.mapRects.push({ x, z, w: r * 2, d: r * 2, color: '#5a5e66', round: true });
  };
  const lakeCell = (cc, i, j, edge) => {
    const r = rng.next();
    if (!edge && r < 0.25) {
      const x = cc.x + rng.pick([-1, 1]) * 7, z = cc.z + rng.pick([-1, 1]) * 7;
      box(5, 5, 5, std(rng.pick([0x7a2a22, 0x2a4a7a, 0x3a5a3a])), x, 2.5, z);
      const rf = box(6, 0.6, 6, snowMat, x, 5.3, z, false); rf.rotation.z = 0.08;
      box(1.4, 1.2, 0.2, neon(0xffb050, 1.5), x, 3, z - 2.6, false);
      solid(x, z, 5, 5, 5);
      W.mapRects.push({ x, z, w: 5, d: 5, color: '#7a4a3a' });
    } else if (!edge && r < 0.55) {
      const n = rng.int(2, 4);
      for (let k = 0; k < n; k++) { const a = rng.next() * 6.3, rr = rng.range(6, 9.5); rock(cc.x + Math.cos(a) * rr, cc.z + Math.sin(a) * rr, rng.range(1.4, 2.6)); }
    }
    if (rng.next() < 0.45) { // black holes in the ice
      const a = rng.next() * 6.3, x = cc.x + Math.cos(a) * 8, z = cc.z + Math.sin(a) * 8;
      const hole = new THREE.Mesh(new THREE.CircleGeometry(rng.range(1.6, 2.6), 14), new THREE.MeshBasicMaterial({ color: 0x02060a }));
      hole.rotation.x = -Math.PI / 2; hole.position.set(x, 0.05, z); group.add(hole);
    }
    if (!edge) keyCandidates.push(cc);
    W.patrol.push(cc);
  };
  const crysCols = [0x9fe8ff, 0x7ab8ff, 0xc8a8ff, 0xa8fff0];
  const crystalCell = (cc, i, j, edge, style = '') => {
    const cols = style === 'coral' ? [0xff7a5a, 0xff4a8a, 0xffb03a, 0xc85aff] : style === 'alien' ? [0xb04aff, 0x4affd0, 0xff4ad0] : crysCols, cmat = style === 'coral' ? MAT.coral : MAT.crystal;
    const n = edge ? rng.int(0, 1) : rng.int(3, 5), placed = [];
    for (let k = 0, tries = 0; k < n && tries < 40; tries++) {
      const x = cc.x + rng.range(-10, 10), z = cc.z + rng.range(-10, 10);
      if (Math.hypot(x - cc.x, z - cc.z) < (edge ? 8 : 5.5) || placed.some((p) => Math.hypot(p[0] - x, p[1] - z) < 7)) continue;
      placed.push([x, z]); k++;
      const h = rng.range(8, 22) * (style === 'coral' ? 0.6 : 1), r0 = rng.range(1.3, 2.4), col = rng.pick(cols);
      inst('crys' + style, GEO.cone6, cmat, x, h / 2, z, { sx: r0, sy: h, sz: r0, rx: rng.range(-0.12, 0.12), rz: rng.range(-0.12, 0.12), ry: rng.next() * 6, color: col });
      for (let m = 0; m < 3; m++) { const a = rng.next() * 6.3; inst('crys' + style, GEO.cone6, cmat, x + Math.cos(a) * r0 * 1.3, 1.5, z + Math.sin(a) * r0 * 1.3, { sx: 0.6, sy: 3.5, sz: 0.6, rx: Math.cos(a) * 0.5, rz: -Math.sin(a) * 0.5, color: col }); }
      solid(x, z, r0 * 1.6, r0 * 1.6, h);
      glowDecal(x, z, 5, col, 0.22);
      W.mapRects.push({ x, z, w: 4, d: 4, color: '#7ab8ff', round: true });
    }
    if (!edge && rng.next() < 0.4) rock(cc.x + rng.pick([-1, 1]) * 9, cc.z + rng.pick([-1, 1]) * 9, rng.range(1.5, 2.5));
    if (!edge) keyCandidates.push(cc);
    W.patrol.push(cc);
  };
  const campCell = (cc, i, j, edge) => {
    if (edge) { W.patrol.push(cc); return; }
    const nt = rng.int(1, 2), spots = [[-7, -6], [7, 6], [7, -7], [-7, 7]];
    for (let k = 0; k < nt; k++) {
      const [ox, oz] = spots[k + (rng.next() < 0.5 ? 0 : 2)], x = cc.x + ox, z = cc.z + oz;
      const tent = meshAt(new THREE.ConeGeometry(4, 5, 4), std(rng.pick([0x8a4a1a, 0x2a5a3a, 0x2a3a6a, 0x6a2a2a]), { roughness: 1, flatShading: true }), x, 2.5, z);
      tent.rotation.y = Math.PI / 4;
      const sn = meshAt(new THREE.ConeGeometry(2.2, 2, 4), snowMat, x, 4.4, z); sn.rotation.y = Math.PI / 4;
      solid(x, z, 5.6, 5.6, 5);
      W.mapRects.push({ x, z, w: 5.6, d: 5.6, color: '#7a5a3a' });
    }
    if (rng.next() < 0.55) { // a campfire that's still smouldering...
      const x = cc.x + 4.5, z = cc.z - 3.5;
      for (let k = 0; k < 4; k++) inst('log', GEO.cyl, MAT.bark, x, 0.3, z, { sx: 0.3, sy: 2.6, sz: 0.3, rz: Math.PI / 2, ry: k * 0.8 });
      inst('ember', GEO.sphere, MAT.ember, x, 0.4, z, { sx: 0.8, sy: 0.35, sz: 0.8, cast: false });
      glowDecal(x, z, 6, 0xff6a1a, 0.5);
    }
    if (rng.next() < 0.4) logPile(cc.x - 7, cc.z + 1, Math.PI / 2);
    if (rng.next() < 0.35) bush(cc.x + rng.pick([-1, 1]) * 4, cc.z + rng.pick([-1, 1]) * 9, i + j * 3, SNOWBUSH());
    keyCandidates.push(cc); W.patrol.push(cc);
  };

  // ===== Level 3: Carnival of Screams =====
  const CARNI = [0xff3a5a, 0x3ab0ff, 0xffc83a, 0x9a5aff, 0x3aff8a];
  const CSS = (c) => '#' + c.toString(16).padStart(6, '0');
  const booth = (x, z) => {
    const col = rng.pick(CARNI);
    box(8, 4, 5, std(0x3a2a30), x, 2, z);
    const aw = box(9, 0.4, 6.5, std(0xffffff, { map: stripeTex('#f2f2f2', CSS(col)), roughness: 0.8 }), x, 6.8, z, false); aw.rotation.x = 0.12;
    for (const [px, pz] of [[-4, -2.4], [4, -2.4], [-4, 2.4], [4, 2.4]]) box(0.35, 6.6, 0.35, std(0xd0d0d0), x + px, 3.3, z + pz, false);
    box(6, 1.2, 0.3, neon(col, 2.2), x, 8, z - 2.8, false);
    for (let k = -2; k <= 2; k++) inst('prize', GEO.sphere, MAT.bulb, x + k * 1.4, 4.6, z - 1.5, { s: 0.45, color: rng.pick(CARNI), cast: false });
    solid(x, z, 8, 5, 4);
    W.mapRects.push({ x, z, w: 8, d: 5, color: CSS(col) });
  };
  const clownStatue = (x, z) => {
    box(3, 1.4, 3, std(0x4a2a3a), x, 0.7, z);
    meshAt(new THREE.ConeGeometry(1.6, 5, 10), std(0xffffff, { map: stripeTex('#d02040', '#f0e0e0', 10) }), x, 3.9, z);
    const head = new THREE.Group(); head.position.set(x, 7.4, z); group.add(head);
    meshAt(new THREE.SphereGeometry(1.15, 12, 10), std(0xf2ede4), 0, 0, 0, head);
    meshAt(new THREE.SphereGeometry(0.3, 8, 6), neon(0xff2030, 1.6), 0, -0.05, 1.15, head);
    for (const s of [-1, 1]) meshAt(new THREE.SphereGeometry(0.6, 8, 6), std(0xff5a1a), s * 1.1, 0.4, -0.1, head);
    const eyeMat = neon(0xffe23a, 0.5);
    for (const ex of [-0.4, 0.4]) meshAt(new THREE.SphereGeometry(0.16, 8, 6), eyeMat, ex, 0.35, 1.0, head);
    const grin = meshAt(BOX(1.3, 0.22, 0.1), neon(0xff1030, 1.4), 0, -0.5, 1.02, head); grin.castShadow = false;
    const hat = meshAt(new THREE.ConeGeometry(0.6, 1.6, 10), std(0x3a1a8a), 0, 1.6, 0, head); hat.rotation.z = 0.3;
    watcher(x, z, head, eyeMat, 0xffe23a, 8.5);
  };
  const stringLights = (x0, z0, x1, z1) => {
    for (const [x, z] of [[x0, z0], [x1, z1]]) { box(0.5, 10, 0.5, poleMat, x, 5, z); solid(x, z, 0.6, 0.6, 10); }
    for (let k = 1; k < 14; k++) { const t = k / 14; inst('bulb', GEO.sphere, MAT.bulb, lerp(x0, x1, t), 9.6 - Math.sin(t * Math.PI) * 2.2, lerp(z0, z1, t), { s: 0.28, color: CARNI[k % CARNI.length], cast: false }); }
  };
  const midwayCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.3) { booth(cc.x - 6, cc.z - 5.5); if (rng.next() < 0.6) booth(cc.x + 6, cc.z + 6); keyCandidates.push(cc); W.patrol.push(cc); return; }
    if (r < 0.42) { const n = rng.int(2, 3); for (let k = 0; k < n; k++) { const a = (k / n) * 6.28 + rng.next(), rr = rng.range(3, 7); bush(cc.x + Math.cos(a) * rr, cc.z + Math.sin(a) * rr, i * 3.1 + j + k); } W.patrol.push(cc); return; }
    if (r < 0.48) { speedPad(cc); W.patrol.push(cc); return; }
    const roll = rng.next();
    if (roll < 0.35 && !edge && W.scarecrows.length < 10) clownStatue(cc.x + rng.pick([-1, 1]) * 7, cc.z + rng.pick([-1, 1]) * 7);
    else if (roll < 0.8) stringLights(cc.x - 11, cc.z + rng.pick([-1, 1]) * 9, cc.x + 11, cc.z + rng.pick([-1, 1]) * 9);
    if (!edge) keyCandidates.push(cc);
    W.patrol.push(cc);
  };
  const bigtopCell = (cc, i, j, edge) => {
    if (edge) { W.patrol.push(cc); return; }
    const r = rng.next();
    if (r < 0.4) {
      const R = rng.range(9, 10.5), H = rng.range(6, 8), col = CSS(rng.pick([0xd02040, 0x2040d0, 0x8a20b0]));
      const wallT = stripeTex('#efe6d6', col, 16); wallT.repeat.set(2, 1);
      meshAt(new THREE.CylinderGeometry(R, R, H, 20, 1, true), std(0xffffff, { map: wallT, side: THREE.DoubleSide }), cc.x, H / 2, cc.z);
      meshAt(new THREE.ConeGeometry(R + 1, 7, 20), std(0xffffff, { map: stripeTex('#efe6d6', col, 16) }), cc.x, H + 3.5, cc.z);
      box(0.3, 4, 0.3, poleMat, cc.x, H + 9, cc.z, false);
      box(1.6, 1, 0.1, neon(0xffc83a, 2), cc.x + 0.8, H + 10.5, cc.z, false);
      box(3.5, 5, 0.3, new THREE.MeshBasicMaterial({ color: 0x050204 }), cc.x, 2.5, cc.z - R - 0.05, false);
      glowDecal(cc.x, cc.z - R - 2, 4, 0xff3a3a, 0.35);
      solid(cc.x, cc.z, R * 1.75, R * 1.75, H + 7);
      W.mapRects.push({ x: cc.x, z: cc.z, w: R * 2, d: R * 2, color: col, round: true });
      W.patrol.push(cc); return;
    }
    if (r < 0.72) { // animal cages... something is still inside
      for (const [ox, oz] of [[-7, -6], [7, 6]]) {
        if (rng.next() < 0.25) continue;
        const x = cc.x + ox, z = cc.z + oz;
        for (let a = 0; a < 4; a++) for (let b = 0; b < 6; b++) {
          const t = -2.5 + b, px = a < 2 ? t : (a === 2 ? -2.5 : 2.5), pz = a < 2 ? (a === 0 ? -2.5 : 2.5) : t;
          inst('bar', GEO.box, MAT.metal, x + px, 3, z + pz, { sx: 0.18, sy: 6, sz: 0.18, color: 0x8a7a5a });
        }
        inst('cageTop', GEO.box, MAT.metal, x, 6.2, z, { sx: 5.6, sy: 0.4, sz: 5.6, color: 0x6a2a2a });
        const eye = neon(rng.pick([0xff2020, 0xffe020, 0x40ff40]), 4);
        for (const ex of [-0.35, 0.35]) meshAt(new THREE.SphereGeometry(0.13, 6, 4), eye, x + ex, 1.6, z - 1.5);
        solid(x, z, 5.4, 5.4, 6.4);
        W.mapRects.push({ x, z, w: 5.4, d: 5.4, color: '#8a7a5a' });
      }
    } else for (let k = 0; k < rng.int(2, 4); k++) {
      const a = rng.next() * 6.3, rr = rng.range(6, 9.5), x = cc.x + Math.cos(a) * rr, z = cc.z + Math.sin(a) * rr;
      inst('drum', GEO.cyl, MAT.metal, x, 1.2, z, { sx: 1.4, sy: 2.4, sz: 1.4, color: rng.pick(CARNI) });
      solid(x, z, 2.8, 2.8, 2.4);
    }
    keyCandidates.push(cc); W.patrol.push(cc);
  };
  let bigRides = 0;
  const ridesCell = (cc, i, j, edge) => {
    if (edge) { W.patrol.push(cc); return; }
    const r = rng.next();
    if (r < 0.22 && bigRides < 5) { // ferris wheel
      bigRides++;
      for (const sz of [-1.6, 1.6]) for (const sx of [-1, 1]) { const leg = box(0.7, 14, 0.7, poleMat, cc.x + sx * 2.4, 6.6, cc.z + sz); leg.rotation.z = -sx * 0.33; }
      const wheel = new THREE.Group(); wheel.position.set(cc.x, 12.5, cc.z); group.add(wheel);
      const col = rng.pick(CARNI);
      for (const zz of [-1, 1]) meshAt(new THREE.TorusGeometry(10, 0.25, 6, 40), neon(col, 1.6), 0, 0, zz, wheel);
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        const sp = meshAt(BOX(0.25, 20, 0.25), poleMat, 0, 0, 0, wheel); sp.rotation.z = a;
        meshAt(BOX(2.2, 2.2, 2.2), std(CARNI[k % CARNI.length]), Math.cos(a) * 10, Math.sin(a) * 10 - 1.4, 0, wheel);
      }
      W.spinners.push({ obj: wheel, axis: 'z', speed: 0.12 });
      solid(cc.x, cc.z, 7, 4, 5);
      W.mapRects.push({ x: cc.x, z: cc.z, w: 20, d: 3, color: CSS(col) });
      W.patrol.push(cc); return;
    }
    if (r < 0.45 && bigRides < 5) { // carousel
      bigRides++;
      const car = new THREE.Group(); car.position.set(cc.x, 0, cc.z); group.add(car);
      meshAt(new THREE.CylinderGeometry(7, 7, 0.8, 24), std(0x4a2a4a), 0, 0.4, 0, car);
      meshAt(new THREE.ConeGeometry(8, 3, 24), std(0xffffff, { map: stripeTex('#f0e0e0', '#c02050', 16) }), 0, 9.5, 0, car);
      meshAt(new THREE.CylinderGeometry(0.6, 0.6, 8, 10), std(0xd0b060, { metalness: 0.6 }), 0, 4.4, 0, car);
      meshAt(new THREE.TorusGeometry(7.8, 0.15, 6, 40), neon(0xffc83a, 2), 0, 8, 0, car).rotation.x = Math.PI / 2;
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2, x = Math.cos(a) * 5.5, z = Math.sin(a) * 5.5;
        meshAt(new THREE.CylinderGeometry(0.12, 0.12, 7.5, 6), std(0xd0b060, { metalness: 0.6 }), x, 4.5, z, car);
        const horse = meshAt(BOX(0.8, 1.4, 2.6), std(rng.pick([0xf0e8e0, 0x1a1a1a, 0x8a5a3a])), x, 3 + (k % 2) * 0.8, z, car);
        horse.rotation.y = -a;
        const hh = meshAt(BOX(0.6, 1.2, 0.8), horse.material, x - Math.sin(a) * 1.4, 4.2 + (k % 2) * 0.8, z + Math.cos(a) * 1.4, car); hh.rotation.y = -a;
      }
      W.spinners.push({ obj: car, axis: 'y', speed: 0.45 });
      solid(cc.x, cc.z, 12.5, 12.5, 9);
      W.mapRects.push({ x: cc.x, z: cc.z, w: 14, d: 14, color: '#c02050', round: true });
      W.patrol.push(cc); return;
    }
    // bumper cars, abandoned mid-ride
    box(16, 0.2, 16, std(0x30303a, { metalness: 0.6, roughness: 0.4 }), cc.x, 0.1, cc.z, false);
    for (let k = 0; k < 3; k++) {
      const a = rng.next() * 6.3, rr = rng.range(4.5, 7), x = cc.x + Math.cos(a) * rr, z = cc.z + Math.sin(a) * rr;
      inst('bumper', GEO.box, MAT.metal, x, 1, z, { sx: 2.6, sy: 1.6, sz: 3.6, ry: rng.next() * 6, color: rng.pick(CARNI) });
      solid(x, z, 3.4, 3.4, 1.6);
    }
    keyCandidates.push(cc); W.patrol.push(cc);
  };
  const hedgeMat = std(0x1e4a26, { roughness: 1 });
  const mazeCell = (cc, i, j, edge) => {
    const x0 = cc.x - C / 2, z0 = cc.z - C / 2;
    const hedge = (mx, mz, w, d) => {
      inst('hedge', GEO.box, hedgeMat, mx, 3.5, mz, { sx: w, sy: 7, sz: d });
      solid(mx, mz, w, d, 7);
      W.mapRects.push({ x: mx, z: mz, w, d, color: '#2c6b35' });
    };
    const wallWithGap = (vertical) => {
      if (rng.next() < 0.22) return;
      const g = rng.range(3, C - 12), gw = 9;
      for (const [a, b] of [[0, g], [g + gw, C]]) {
        if (b - a < 1.5) continue;
        if (vertical) hedge(x0 + C, z0 + (a + b) / 2, 1.6, b - a);
        else hedge(x0 + (a + b) / 2, z0 + C, b - a, 1.6);
      }
    };
    if (j < N - 1) wallWithGap(false);
    if (i < N - 1) wallWithGap(true);
    if (!edge && rng.next() < 0.15) bush(cc.x + 5, cc.z + 5, i + j);
    if (!edge) keyCandidates.push(cc);
    W.patrol.push(cc);
  };

  // ===== Level 4: Titan Wasteland =====
  const rubbleMat = std(0xffffff, { roughness: 1, flatShading: true });
  const fire = (x, z, y = 0.4, r = 1) => {
    inst('ember', GEO.sphere, MAT.ember, x, y, z, { sx: 0.9 * r, sy: 0.5 * r, sz: 0.9 * r, cast: false });
    inst('flame', GEO.cone6, MAT.ember, x, y + 1.2 * r, z, { sx: 0.6 * r, sy: 2.2 * r, sz: 0.6 * r, ry: rng.next() * 6, cast: false });
    glowDecal(x, z, 6 * r, 0xff6a1a, 0.45);
  };
  const ruinsCell = (cc, i, j, edge, style = '') => {
    const sea = style === 'sea', fx = sea ? seaGlow : fire;
    const r = edge ? 1 : rng.next();
    if (r < 0.36) { // a smashed building with a jagged top
      const w = C - rng.int(9, 12), d = C - rng.int(9, 12), h = rng.int(10, 28);
      const mat = std(rng.pick(sea ? [0x2a4a50, 0x34585a, 0x24404a] : [0x3a3634, 0x4a4440, 0x2e2a2a]), { roughness: 1 });
      box(w, h, d, mat, cc.x, h / 2, cc.z);
      for (let k = 0; k < 4; k++) { const b = box(w * rng.range(0.2, 0.4), rng.range(2, 7), d * rng.range(0.25, 0.45), mat, cc.x + rng.range(-w / 3, w / 3), h + 1, cc.z + rng.range(-d / 3, d / 3)); b.rotation.set(rng.range(-0.3, 0.3), rng.next(), rng.range(-0.3, 0.3)); }
      const fireMat = neon(sea ? 0x3affe0 : 0xff5a1a, sea ? 1.2 : 1.8);
      for (let k = 0; k < 4; k++) box(1.6, 1.4, 0.2, rng.next() < 0.5 ? fireMat : new THREE.MeshBasicMaterial({ color: 0x050505 }), cc.x + rng.range(-w / 2.6, w / 2.6), rng.range(3, h - 2), cc.z - d / 2 - 0.1, false);
      for (let k = 0; k < 5; k++) { const a = rng.next() * 6.3, rr = Math.max(w, d) / 2 + rng.range(1, 3); inst('rubble', GEO.box, rubbleMat, cc.x + Math.cos(a) * rr, 0.4, cc.z + Math.sin(a) * rr, { s: rng.range(0.8, 1.8), ry: rng.next() * 6, rx: rng.next(), color: 0x4a4440 }); }
      solid(cc.x, cc.z, w, d, h);
      W.mapRects.push({ x: cc.x, z: cc.z, w, d, color: '#4a4440' });
      return;
    }
    if (r < 0.48) { // burnt-out cars, one still on fire
      for (const sd of [-1, 1]) {
        if (rng.next() < 0.35) continue;
        const x = cc.x + sd * 7, z = cc.z + rng.range(-3, 3);
        box(5, 2.6, 11, std(0x1e1a18, { roughness: 0.9 }), x, 1.5, z);
        box(4.4, 1.6, 5, std(0x0a0a0a), x, 3.5, z + 0.5);
        solid(x, z, 5, 11, 4.3);
        if (rng.next() < 0.6) fx(x, z, 4.3, 0.9);
        W.mapRects.push({ x, z, w: 5, d: 11, color: '#333' });
      }
    } else if (r < 0.6) {
      const n = rng.int(2, 3);
      for (let k = 0; k < n; k++) { const a = (k / n) * 6.28 + rng.next(), rr = rng.range(3, 7); bush(cc.x + Math.cos(a) * rr, cc.z + Math.sin(a) * rr, i * 3.1 + j + k, new THREE.Color(sea ? 0x1a4a3a : 0x3a3530)); }
      W.patrol.push(cc); return;
    } else if (r < 0.66) { speedPad(cc); W.patrol.push(cc); return; }
    else if (rng.next() < 0.5) fx(cc.x + rng.pick([-1, 1]) * 8, cc.z + rng.pick([-1, 1]) * 8);
    if (!edge) keyCandidates.push(cc);
    W.patrol.push(cc);
  };
  const cratersCell = (cc, i, j, edge) => {
    if (!edge && rng.next() < 0.55) { // a crater with a ring of boulders (and gaps to get in)
      const gap = rng.next() * 6.3;
      for (let k = 0; k < 9; k++) {
        const a = (k / 9) * Math.PI * 2;
        if (Math.abs(Math.atan2(Math.sin(a - gap), Math.cos(a - gap))) < 0.8 || Math.abs(Math.atan2(Math.sin(a - gap - Math.PI), Math.cos(a - gap - Math.PI))) < 0.6) continue;
        rock(cc.x + Math.cos(a) * 9.5, cc.z + Math.sin(a) * 9.5, rng.range(1.5, 2.3));
      }
      const pit = new THREE.Mesh(new THREE.CircleGeometry(7, 20), std(0x140a08, { roughness: 1 })); pit.rotation.x = -Math.PI / 2; pit.position.set(cc.x, 0.04, cc.z); pit.receiveShadow = true; group.add(pit);
      glowDecal(cc.x, cc.z, 6, 0xff5a1a, 0.35);
    } else if (!edge) for (let k = 0; k < rng.int(1, 3); k++) { const a = rng.next() * 6.3; rock(cc.x + Math.cos(a) * 8.5, cc.z + Math.sin(a) * 8.5, rng.range(1.4, 2.6)); }
    if (!edge) keyCandidates.push(cc);
    W.patrol.push(cc);
  };
  const lavaCell = (cc, i, j, edge, style = '') => {
    const choc = style === 'choco' || style === 'water', wet = style === 'water';
    if (!edge && rng.next() < 0.6) { // a river of lava: walkable, but it burns
      const alongX = rng.next() < 0.5, off = rng.pick([-1, 1]) * 7, w = alongX ? C : 5, d = alongX ? 5 : C;
      const x = cc.x + (alongX ? 0 : off), z = cc.z + (alongX ? off : 0);
      box(w, 0.12, d, wet ? MAT.water : choc ? MAT.choco : MAT.lava, x, 0.06, z, false);
      if (!choc) glowDecal(x, z, 9, 0xff4a0a, 0.4);
      W.hazards.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, kind: wet ? 'water' : choc ? 'choco' : 'lava' });
      W.mapRects.push({ x, z, w, d, color: wet ? '#2a7aa0' : choc ? '#5a2e18' : '#ff4a0a' });
    }
    const n = edge ? 0 : rng.int(1, 3);
    for (let k = 0; k < n; k++) { // obsidian spires
      const a = rng.next() * 6.3, rr = rng.range(6.5, 10), x = cc.x + Math.cos(a) * rr, z = cc.z + Math.sin(a) * rr, h = rng.range(9, 20), r0 = rng.range(1.5, 2.5);
      if (wet) rock(x, z, r0);
      else if (choc) inst('chunk', GEO.box, MAT.chocoBar, x, h * 0.25, z, { sx: r0 * 1.6, sy: h * 0.5, sz: r0 * 1.6, ry: rng.next() * 6, rz: rng.range(-0.2, 0.2) });
      else inst('obsidian', GEO.cone6, MAT.obsidian, x, h / 2, z, { sx: r0, sy: h, sz: r0, ry: rng.next() * 6, rz: rng.range(-0.1, 0.1) });
      solid(x, z, r0 * 1.6, r0 * 1.6, h);
      W.mapRects.push({ x, z, w: 4, d: 4, color: '#1a1214', round: true });
    }
    if (!edge) keyCandidates.push(cc);
    W.patrol.push(cc);
  };

  // ===== Level 5: Sands of the Dead =====
  const sandstone = (c) => std(c ?? rng.pick([0xb8935a, 0xa8834e, 0xc8a46a]), { roughness: 1 });
  const palm = (x, z) => {
    const h = rng.range(9, 13), lean = rng.range(-0.25, 0.25), a = rng.next() * 6.3;
    inst('palmTrunk', GEO.trunk, MAT.bark, x, h / 2, z, { sx: 0.5, sy: h, sz: 0.5, rz: lean, ry: a });
    const tx = x - Math.sin(lean) * h * Math.cos(a), tz = z + Math.sin(lean) * h * Math.sin(a);
    for (let k = 0; k < 7; k++) { const fa = (k / 7) * Math.PI * 2; inst('frond', GEO.box, MAT.pine, tx + Math.cos(fa) * 2.2, h - 0.6, tz + Math.sin(fa) * 2.2, { sx: 5, sy: 0.15, sz: 1.1, ry: -fa, rz: -0.45, color: rng.pick([0x2a5a22, 0x3a6a2a, 0x2a4a1a]) }); }
    solid(x, z, 1.2, 1.2, h);
    W.mapRects.push({ x, z, w: 5, d: 5, color: '#3a6a2a', round: true });
  };
  const sandHouse = (cc) => {
    const w = rng.int(11, 15), d = rng.int(11, 14), h = rng.int(8, 14), mat = sandstone();
    box(w, h, d, mat, cc.x, h / 2, cc.z);
    if (rng.next() < 0.6) { const dome = meshAt(new THREE.SphereGeometry(Math.min(w, d) * 0.35, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), std(rng.pick([0x3a7a9a, 0xe8e0d0, 0xa86a3a])), cc.x, h, cc.z); dome.castShadow = true; }
    const lit = neon(0xffa040, 1.6), dark = new THREE.MeshBasicMaterial({ color: 0x0a0604 });
    for (const sx of [-1, 1]) box(1.6, 2.4, 0.2, rng.next() < 0.5 ? lit : dark, cc.x + sx * w / 4, h * 0.6, cc.z - d / 2 - 0.1, false);
    box(2.6, 4.5, 0.2, dark, cc.x, 2.25, cc.z - d / 2 - 0.1, false);
    solid(cc.x, cc.z, w, d, h);
    W.mapRects.push({ x: cc.x, z: cc.z, w, d, color: '#a8834e' });
  };
  const stall = (x, z) => {
    const col = rng.pick(['#c03a2a', '#2a6ac0', '#e0b030', '#8a3ab0', '#2a9a6a']);
    box(7, 3, 4, std(0x5a3a20), x, 1.5, z);
    const aw = box(8, 0.25, 5.5, std(0xffffff, { map: stripeTex('#e8dcc0', col, 6), side: THREE.DoubleSide }), x, 5.6, z, false); aw.rotation.x = 0.18;
    for (const [px, pz] of [[-3.6, -2], [3.6, -2], [-3.6, 2], [3.6, 2]]) box(0.25, 5.6, 0.25, std(0x5a3a20), x + px, 2.8, z + pz, false);
    for (let k = -1; k <= 1; k++) inst('pot', GEO.cyl, MAT.stone, x + k * 2, 3.6, z, { sx: 0.6, sy: 1.2, sz: 0.6, color: rng.pick([0xa0602a, 0x8a4a2a, 0xc08040]) });
    solid(x, z, 7, 4, 3);
    W.mapRects.push({ x, z, w: 7, d: 4, color: col });
  };
  const bazaarCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.32) { sandHouse(cc); return; }
    if (r < 0.45) { stall(cc.x - 6, cc.z - 6); if (rng.next() < 0.6) stall(cc.x + 6, cc.z + 6.5); keyCandidates.push(cc); W.patrol.push(cc); return; }
    if (r < 0.57) { palm(cc.x + 7, cc.z - 7); const n = rng.int(1, 2); for (let k = 0; k < n; k++) bush(cc.x + rng.range(-6, 2), cc.z + rng.range(2, 7), i + j + k, new THREE.Color(0x4a6a2a)); W.patrol.push(cc); return; }
    if (r < 0.62) { speedPad(cc); W.patrol.push(cc); return; }
    if (rng.next() < 0.4) lamp(cc.x + C / 2 - 4, cc.z + C / 2 - 4, sodiumMat, 0xff8a2a);
    else if (!edge && rng.next() < 0.5) palm(cc.x + rng.pick([-1, 1]) * 8, cc.z + rng.pick([-1, 1]) * 8);
    if (!edge) keyCandidates.push(cc);
    W.patrol.push(cc);
  };
  const cactus = (x, z) => {
    const h = rng.range(5, 9), col = rng.pick([0x2a5a2a, 0x3a6a32]);
    inst('cactus', GEO.cyl, MAT.pine, x, h / 2, z, { sx: 0.7, sy: h, sz: 0.7, color: col });
    for (const s of [-1, 1]) if (rng.next() < 0.7) {
      const y = h * rng.range(0.4, 0.6);
      inst('cactus', GEO.cyl, MAT.pine, x + s * 1.1, y, z, { sx: 0.45, sy: 1.6, sz: 0.45, rz: Math.PI / 2, color: col });
      inst('cactus', GEO.cyl, MAT.pine, x + s * 1.8, y + 1.2, z, { sx: 0.45, sy: 2.6, sz: 0.45, color: col });
    }
    solid(x, z, 1.6, 1.6, h);
    W.mapRects.push({ x, z, w: 2, d: 2, color: '#3a6a32', round: true });
  };
  const bones = (x, z, n = 4) => { for (let k = 0; k < n; k++) inst('bone', GEO.box, MAT.boneM, x + rng.range(-3, 3), 0.15, z + rng.range(-3, 3), { sx: 0.25, sy: 0.25, sz: rng.range(1.2, 2.4), ry: rng.next() * 6, cast: false }); };
  const dunesCell = (cc, i, j, edge) => {
    for (let k = 0; k < rng.int(1, 3); k++) { const a = rng.next() * 6.3, rr = rng.range(4, 9); inst('dune', GEO.sphere, MAT.sand, cc.x + Math.cos(a) * rr, -0.4, cc.z + Math.sin(a) * rr, { sx: rng.range(5, 9), sy: rng.range(1.2, 1.8), sz: rng.range(4, 7), ry: rng.next() * 6, cast: false }); }
    if (!edge) for (let k = 0; k < rng.int(0, 2); k++) { const a = rng.next() * 6.3; cactus(cc.x + Math.cos(a) * 8, cc.z + Math.sin(a) * 8); }
    if (rng.next() < 0.5) bones(cc.x + rng.range(-6, 6), cc.z + rng.range(-6, 6));
    if (!edge) keyCandidates.push(cc);
    W.patrol.push(cc);
  };
  const pyramidsCell = (cc, i, j, edge) => {
    if (edge) { W.patrol.push(cc); return; }
    const r = rng.next();
    if (r < 0.3) {
      const s = rng.range(9, 11), h = s * 1.25;
      const pyr = meshAt(new THREE.ConeGeometry(s * 1.414, h, 4), sandstone(0xc8a46a), cc.x, h / 2, cc.z); pyr.rotation.y = Math.PI / 4; pyr.material.flatShading = true;
      box(2.6, 3.6, 0.3, new THREE.MeshBasicMaterial({ color: 0x050302 }), cc.x, 1.8, cc.z - s * 0.7, false);
      box(3, 0.3, 0.4, neon(0x3affc8, 2), cc.x, 3.8, cc.z - s * 0.72, false);
      solid(cc.x, cc.z, s * 1.6, s * 1.6, h * 0.55);
      W.mapRects.push({ x: cc.x, z: cc.z, w: s * 2, d: s * 2, color: '#c8a46a' });
      W.patrol.push(cc); return;
    }
    if (r < 0.65) { // obelisks with glowing runes
      for (const [ox, oz] of [[-7, -7], [7, 7], [7, -7], [-7, 7]]) {
        if (rng.next() < 0.4) continue;
        const x = cc.x + ox, z = cc.z + oz, h = rng.range(9, 15);
        inst('obelisk', GEO.box, MAT.stone, x, h / 2, z, { sx: 1.6, sy: h, sz: 1.6, color: 0x8a7050 });
        inst('obeliskTop', GEO.cone6, MAT.stone, x, h + 0.8, z, { sx: 1.1, sy: 1.6, sz: 1.1, ry: Math.PI / 4, color: 0xd0a040 });
        inst('rune', GEO.box, MAT.rune, x, h * 0.6, z - 0.82, { sx: 0.5, sy: h * 0.5, sz: 0.06, cast: false });
        solid(x, z, 1.8, 1.8, h);
        W.mapRects.push({ x, z, w: 2, d: 2, color: '#8a7050' });
      }
    } else for (let k = 0; k < rng.int(3, 5); k++) { // broken temple columns
      const a = rng.next() * 6.3, rr = rng.range(6, 9.5), x = cc.x + Math.cos(a) * rr, z = cc.z + Math.sin(a) * rr, h = rng.range(2, 10);
      inst('column', GEO.cyl, MAT.stone, x, h / 2, z, { sx: 1, sy: h, sz: 1, color: 0xb8a078 });
      solid(x, z, 2, 2, h);
    }
    keyCandidates.push(cc); W.patrol.push(cc);
  };
  const mesaCols = [0x8a3a22, 0xa04a2a, 0x7a3220, 0xb85a32];
  const canyonCell = (cc, i, j, edge, style = '') => {
    const mcols = style === 'trench' ? [0x1a2a3a, 0x22324a, 0x2a3a50] : style === 'moss' ? [0x3a4a2a, 0x4a5a3a, 0x2a3a22, 0x55604a] : mesaCols;
    const n = edge ? rng.int(0, 1) : rng.int(2, 4), placed = [];
    for (let k = 0, tries = 0; k < n && tries < 40; tries++) {
      const x = cc.x + rng.range(-9, 9), z = cc.z + rng.range(-9, 9);
      if (Math.hypot(x - cc.x, z - cc.z) < (edge ? 8 : 6) || placed.some((p) => Math.hypot(p[0] - x, p[1] - z) < 9)) continue;
      placed.push([x, z]); k++;
      const r0 = rng.range(2.5, 3.8), h = rng.range(14, 32);
      for (let b = 0; b < 3; b++) inst('mesa' + style, GEO.cyl6, MAT.stone, x, (h / 3) * (b + 0.5), z, { sx: r0 * (1.15 - b * 0.12), sy: h / 3, sz: r0 * (1.15 - b * 0.12), ry: rng.next(), color: rng.pick(mcols) });
      solid(x, z, r0 * 2, r0 * 2, h);
      W.mapRects.push({ x, z, w: r0 * 2, d: r0 * 2, color: '#8a3a22', round: true });
    }
    if (!edge && rng.next() < 0.3) cactus(cc.x + rng.pick([-1, 1]) * 4, cc.z + rng.pick([-1, 1]) * 9);
    if (!edge) keyCandidates.push(cc);
    W.patrol.push(cc);
  };
  const boneyardCell = (cc, i, j, edge) => {
    if (edge) { bones(cc.x, cc.z, 3); W.patrol.push(cc); return; }
    const r = rng.next();
    if (r < 0.35) { // the ribcage of something HUGE that you can run through
      const alongX = rng.next() < 0.5;
      for (let k = -2; k <= 2; k++) for (const s of [-1, 1]) {
        const along = k * 4, x = cc.x + (alongX ? along : s * 6), z = cc.z + (alongX ? s * 6 : along);
        inst('rib', GEO.box, MAT.boneM, x - (alongX ? 0 : s * 1.5), 6, z - (alongX ? s * 1.5 : 0), { sx: 0.8, sy: 13, sz: 0.8, rz: alongX ? 0 : s * 0.35, rx: alongX ? -s * 0.35 : 0 });
        solid(x, z, 1.2, 1.2, 5);
      }
      inst('spine', GEO.box, MAT.boneM, cc.x, 12, cc.z, { sx: alongX ? 22 : 1.2, sy: 1.2, sz: alongX ? 1.2 : 22 });
      W.mapRects.push({ x: cc.x, z: cc.z, w: alongX ? 20 : 12, d: alongX ? 12 : 20, color: '#e8dcc8' });
    } else if (r < 0.6) { // a giant skull with glowing eyes
      const x = cc.x + rng.pick([-1, 1]) * 6, z = cc.z + rng.pick([-1, 1]) * 6;
      const sk = meshAt(new THREE.SphereGeometry(4, 12, 10), MAT.boneM, x, 3.6, z); sk.scale.set(1, 0.85, 1.1);
      for (const ex of [-1.5, 1.5]) meshAt(new THREE.SphereGeometry(0.9, 8, 6), neon(0xff3a1a, 2), x + ex, 4.2, z - 3.6);
      solid(x, z, 7, 8, 6.8);
      W.mapRects.push({ x, z, w: 8, d: 8, color: '#e8dcc8', round: true });
    }
    bones(cc.x + rng.range(-7, 7), cc.z + rng.range(-7, 7), 5);
    keyCandidates.push(cc); W.patrol.push(cc);
  };

  // ===== Levels 6-8: shared fancy trees =====
  const swirlMats = [['#ff3a6a', '#ffffff'], ['#3ab0ff', '#ffe03a'], ['#9a3aff', '#3affb0']].map(([a, b]) => {
    const [c, g] = makeCanvas(128, 128);
    g.fillStyle = b; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = a; g.lineWidth = 9; g.beginPath();
    for (let t = 0; t < 40; t += 0.05) { const r = t * 1.6; g.lineTo(64 + Math.cos(t) * r, 64 + Math.sin(t) * r); }
    g.stroke();
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
    return std(0xffffff, { map: tx, roughness: 0.4 });
  });
  const caneTex = stripeTex('#f8f8f8', '#e0202a', 12); caneTex.rotation = 0.5; caneTex.repeat.set(1, 3);
  const caneMat = std(0xffffff, { map: caneTex, roughness: 0.35 });
  const fancyTree = (x, z, style) => {
    let h;
    if (style === 'kelp') {
      h = 20;
      for (let k = 0; k < rng.int(3, 5); k++) {
        const hh = rng.range(14, 26), ox = rng.range(-0.8, 0.8), oz = rng.range(-0.8, 0.8);
        inst('kelp', GEO.box, MAT.pine, x + ox, hh / 2, z + oz, { sx: 0.5, sy: hh, sz: 0.25, ry: rng.next() * 6, rx: rng.range(-0.08, 0.08), color: rng.pick([0x2a5a2a, 0x3a6a2a, 0x4a5a1a]) });
        for (let b = 0; b < 4; b++) inst('kelpLeaf', GEO.box, MAT.pine, x + ox, hh * (0.3 + b * 0.17), z + oz, { sx: 1.8, sy: 0.12, sz: 0.6, ry: rng.next() * 6, rz: 0.5, color: 0x3a7a2a, cast: false });
      }
      W.mapRects.push({ x, z, w: 4, d: 4, color: '#2a5a2a', round: true });
    } else if (style === 'alien') { // giant glowing mushroom
      h = rng.range(10, 18);
      const r = rng.range(4, 6.5), col = rng.pick([0x4affd0, 0xff4ad0, 0x9a6aff]);
      inst('alienStem', GEO.trunk, MAT.stone, x, h / 2, z, { sx: 0.9, sy: h, sz: 0.9, color: 0xd8c8e8 });
      inst('alienCap', GEO.sphere, MAT.alienCap, x, h, z, { sx: r, sy: r * 0.45, sz: r, color: col });
      for (let k = 0; k < 5; k++) { const a = rng.next() * 6.3; inst('alienSpot', GEO.sphere, MAT.bulb, x + Math.cos(a) * r * 0.6, h + r * 0.3, z + Math.sin(a) * r * 0.6, { s: 0.45, color: col, cast: false }); }
      glowDecal(x, z, r * 1.4, col, 0.25);
      W.mapRects.push({ x, z, w: r * 2, d: r * 2, color: '#5a2a8a', round: true });
    } else if (style === 'jungle') { // big jungle tree with hanging vines
      h = rng.range(16, 26);
      inst('jTrunk', GEO.trunk, MAT.bark, x, h / 2, z, { sx: 1.2, sy: h, sz: 1.2, color: 0x4a3a20 });
      for (let k = 0; k < 3; k++) { const a = rng.next() * 6.3; inst('jLeaf', GEO.sphere, MAT.pine, x + Math.cos(a) * 3, h - k * 3, z + Math.sin(a) * 3, { sx: rng.range(5, 7), sy: 2.2, sz: rng.range(5, 7), color: rng.pick([0x1a4a14, 0x22581a, 0x14400e]) }); }
      for (let k = 0; k < 5; k++) { const a = rng.next() * 6.3, vl = rng.range(5, 12); inst('vine', GEO.box, MAT.pine, x + Math.cos(a) * 4, h - 2 - vl / 2, z + Math.sin(a) * 4, { sx: 0.12, sy: vl, sz: 0.12, color: 0x2a6a1a, cast: false }); }
      W.mapRects.push({ x, z, w: 8, d: 8, color: '#163a14', round: true });
    } else if (rng.next() < 0.5) { // lollipop
      h = rng.range(8, 14);
      const r = rng.range(2.5, 4);
      inst('lolliStick', GEO.cyl, MAT.boneM, x, h / 2, z, { sx: 0.25, sy: h, sz: 0.25 });
      const lp = meshAt(new THREE.CylinderGeometry(r, r, 0.8, 24), rng.pick(swirlMats), x, h + r * 0.8, z); lp.rotation.x = Math.PI / 2; lp.rotation.y = rng.next() * 6;
      W.mapRects.push({ x, z, w: r * 2, d: r * 2, color: '#ff6a9a', round: true });
    } else { // candy cane
      h = rng.range(9, 15);
      meshAt(new THREE.CylinderGeometry(0.6, 0.6, h, 12), caneMat, x, h / 2, z);
      const hook = meshAt(new THREE.TorusGeometry(1.6, 0.6, 8, 16, Math.PI), caneMat, x + 1.6, h, z); hook.rotation.y = rng.next() * 6;
      W.mapRects.push({ x, z, w: 2, d: 2, color: '#ff3a4a', round: true });
    }
    solid(x, z, 1.8, 1.8, h);
  };
  const seaGlow = (x, z, y = 0.4, r = 1) => {
    inst('jellyGlow', GEO.sphere, MAT.shroom, x, y + 0.6 * r, z, { sx: 0.8 * r, sy: 0.5 * r, sz: 0.8 * r, cast: false });
    glowDecal(x, z, 5 * r, 0x3affe0, 0.35);
  };

  // ===== Level 6: Sunken Depths =====
  const wrecksCell = (cc, i, j, edge) => {
    if (!edge && rng.next() < 0.4) { // a sunken ship lying on its side
      const alongX = rng.next() < 0.5, Lh = 20, Wd = 6, h = 7, sd = rng.pick([-1, 1]);
      const x = cc.x + (alongX ? 0 : sd * 6.5), z = cc.z + (alongX ? sd * 6.5 : 0);
      const hull = box(alongX ? Lh : Wd, h, alongX ? Wd : Lh, std(0x4a3426, { roughness: 1 }), x, h / 2, z); hull.rotation[alongX ? 'x' : 'z'] = 0.22 * sd;
      const mast = box(0.6, 18, 0.6, std(0x3a2a1a), x, 8, z); mast.rotation[alongX ? 'x' : 'z'] = 1.1 * sd;
      for (let k = -2; k <= 2; k++) box(0.9, 0.9, 0.9, neon(0x3affe0, 1.4), x + (alongX ? k * 3.5 : -sd * 3.1), 3.5, z + (alongX ? -sd * 3.1 : k * 3.5), false);
      solid(x, z, alongX ? Lh : Wd, alongX ? Wd : Lh, h);
      W.mapRects.push({ x, z, w: alongX ? Lh : Wd, d: alongX ? Wd : Lh, color: '#5a4430' });
    } else if (!edge) {
      for (let k = 0; k < rng.int(1, 3); k++) { const a = rng.next() * 6.3; rock(cc.x + Math.cos(a) * 9, cc.z + Math.sin(a) * 9, rng.range(1.4, 2.4)); }
      if (rng.next() < 0.5) { // treasure!
        const x = cc.x + 5, z = cc.z - 5;
        inst('chest', GEO.box, MAT.metal, x, 0.9, z, { sx: 2.6, sy: 1.8, sz: 1.8, color: 0x6a4a20 });
        inst('gold', GEO.sphere, MAT.gold, x, 1.9, z, { sx: 1.1, sy: 0.4, sz: 0.8, cast: false });
        glowDecal(x, z, 4, 0xffc83a, 0.4);
        solid(x, z, 2.6, 1.8, 1.8);
      }
    }
    if (!edge) keyCandidates.push(cc);
    W.patrol.push(cc);
  };

  // ===== Level 7: Planet X =====
  const metalW = std(0xd8dce4, { roughness: 0.35, metalness: 0.6 });
  const baseCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.32) { // habitat dome
      const R = rng.range(7, 9);
      meshAt(new THREE.SphereGeometry(R, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), metalW, cc.x, 0, cc.z);
      const band = meshAt(new THREE.TorusGeometry(R, 0.25, 6, 40), neon(0x3ad8ff, 2), cc.x, 1.6, cc.z); band.rotation.x = Math.PI / 2;
      for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + 0.4; box(1.6, 1, 0.3, neon(0xffe0a0, 1.5), cc.x + Math.sin(a) * R * 0.86, R * 0.45, cc.z + Math.cos(a) * R * 0.86, false).rotation.y = a; }
      box(2.4, 3.6, 1.2, std(0x3a3a46), cc.x, 1.8, cc.z - R + 0.3);
      solid(cc.x, cc.z, R * 1.5, R * 1.5, R);
      W.mapRects.push({ x: cc.x, z: cc.z, w: R * 2, d: R * 2, color: '#cfd8ff', round: true });
      return;
    }
    if (r < 0.44) { // radio tower with a blinking light, solar panels
      const x = cc.x + rng.pick([-1, 1]) * 7, z = cc.z + rng.pick([-1, 1]) * 7;
      for (const [ox, oz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const leg = box(0.3, 22, 0.3, metalW, x + ox * 0.9, 11, z + oz * 0.9); leg.rotation.set(oz * 0.04, 0, -ox * 0.04); }
      box(1.6, 1, 1.6, W.blinkMat, x, 22.5, z, false);
      solid(x, z, 2.4, 2.4, 22);
      for (let k = 0; k < 3; k++) { inst('panel', GEO.box, MAT.panel, cc.x - 6 + k * 4, 1.6, cc.z + 7, { sx: 3.4, sy: 0.15, sz: 2.4, rx: -0.6, color: 0x2a4aaa }); solid(cc.x - 6 + k * 4, cc.z + 7, 3.4, 2, 2.2); }
      W.mapRects.push({ x, z, w: 3, d: 3, color: '#cfd8ff' });
    } else if (r < 0.56) {
      for (let k = 0; k < rng.int(2, 3); k++) { const a = rng.next() * 6.3, rr = rng.range(3, 7); bush(cc.x + Math.cos(a) * rr, cc.z + Math.sin(a) * rr, i + j + k, new THREE.Color(rng.pick([0x5a2a8a, 0x2a6a6a]))); }
      W.patrol.push(cc); return;
    } else if (r < 0.62) { speedPad(cc); W.patrol.push(cc); return; }
    else for (let k = 0; k < rng.int(2, 4); k++) { // supply crates
      const a = rng.next() * 6.3, rr = rng.range(6, 9.5), x = cc.x + Math.cos(a) * rr, z = cc.z + Math.sin(a) * rr, s = rng.range(2.5, 4);
      inst('crate', GEO.box, MAT.metal, x, s / 2, z, { s, ry: rng.next() * 6, color: rng.pick([0xd8d8e0, 0xe0a030, 0x3a8ad8]) });
      solid(x, z, s * 1.2, s * 1.2, s);
    }
    if (!edge) keyCandidates.push(cc);
    W.patrol.push(cc);
  };
  const ufoCell = (cc, i, j, edge) => {
    if (!edge && rng.next() < 0.35) { // crashed flying saucer
      const R = rng.range(7, 9.5), x = cc.x + rng.pick([-1, 1]) * 4, z = cc.z + rng.pick([-1, 1]) * 4;
      const ufo = new THREE.Group(); ufo.position.set(x, 1.6, z); ufo.rotation.set(rng.range(-0.3, 0.3), rng.next() * 6, 0.3); group.add(ufo);
      meshAt(new THREE.CylinderGeometry(R, R * 0.55, 2, 28), metalW, 0, 0, 0, ufo);
      meshAt(new THREE.SphereGeometry(R * 0.4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), std(0x2aff6a, { transparent: true, opacity: 0.6, emissive: 0x0a6a2a, emissiveIntensity: 1 }), 0, 1, 0, ufo);
      for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; meshAt(new THREE.SphereGeometry(0.3, 6, 4), neon(k % 2 ? 0x3aff6a : 0xffe03a, 2.5), Math.cos(a) * R * 0.95, 0.2, Math.sin(a) * R * 0.95, ufo); }
      glowDecal(x, z, R * 1.6, 0x3aff6a, 0.3);
      solid(x, z, R * 1.5, R * 1.5, 3.6);
      W.mapRects.push({ x, z, w: R * 2, d: R * 2, color: '#7aff8a', round: true });
      W.patrol.push(cc); return;
    }
    for (let k = 0; k < rng.int(2, 4); k++) { // twisted wreckage + glowing goo
      const a = rng.next() * 6.3, rr = rng.range(6, 9.5), x = cc.x + Math.cos(a) * rr, z = cc.z + Math.sin(a) * rr;
      inst('debris', GEO.box, MAT.metal, x, 1, z, { sx: rng.range(2, 4), sy: 0.3, sz: rng.range(2, 5), rx: rng.range(-0.6, 0.6), rz: rng.range(-0.6, 0.6), ry: rng.next() * 6, color: 0xb8bcc8 });
      if (rng.next() < 0.4) glowDecal(x + 2, z, 3, 0x3aff6a, 0.45);
    }
    if (!edge) keyCandidates.push(cc);
    W.patrol.push(cc);
  };

  // ===== Level 8: Sweet Screams =====
  const gingerHouse = (cc, pastel = false) => {
    const w = rng.int(11, 14), d = rng.int(10, 12), h = rng.int(7, 9);
    box(w, h, d, std(pastel ? rng.pick([0xf0b8d0, 0xb8d8f0, 0xf0e0a0, 0xc0f0c8]) : 0xa8642a, { roughness: 0.9 }), cc.x, h / 2, cc.z);
    for (const sd of [-1, 1]) {
      const p = box(w + 1.5, 0.7, d / 2 + 1.6, std(pastel ? rng.pick([0xd04a6a, 0x4a6ad0, 0x8a4ad0]) : 0x8a4a1a), cc.x, h + 2, cc.z + sd * (d / 4 + 0.3)); p.rotation.x = sd * 0.5;
      const ic = box(w + 1.7, 0.4, d / 2 + 1.7, std(0xfff4f8, { roughness: 0.5 }), cc.x, h + 2.5, cc.z + sd * (d / 4 + 0.3), false); ic.rotation.x = sd * 0.5;
    }
    for (let k = 0; k < 6; k++) inst('gumdropS', GEO.sphere, MAT.bulb, cc.x - w / 2 + (k + 0.5) * (w / 6), h + 0.2, cc.z - d / 2 - 0.3, { s: 0.5, color: CARNI[k % 5], cast: false });
    for (const sx of [-1, 1]) box(2, 2, 0.2, neon(rng.pick([0xff3a6a, 0x3affb0, 0xffe03a]), 1.6), cc.x + sx * w / 4, h * 0.55, cc.z - d / 2 - 0.1, false);
    box(2.4, 4.4, 0.2, std(0xff3a6a), cc.x, 2.2, cc.z - d / 2 - 0.1, false);
    solid(cc.x, cc.z, w, d, h);
    W.mapRects.push({ x: cc.x, z: cc.z, w, d, color: '#a8642a' });
  };
  const PINK = () => new THREE.Color().setHSL(rng.pick([0.9, 0.55, 0.8]), 0.6, rng.range(0.7, 0.8));
  const candytownCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.34) { gingerHouse(cc); return; }
    if (r < 0.47) { for (let k = 0; k < rng.int(2, 3); k++) { const a = rng.next() * 6.3, rr = rng.range(3, 7); bush(cc.x + Math.cos(a) * rr, cc.z + Math.sin(a) * rr, i + j + k, PINK()); } W.patrol.push(cc); return; }
    if (r < 0.53) { speedPad(cc); W.patrol.push(cc); return; }
    if (!edge && rng.next() < 0.6) fancyTree(cc.x + rng.pick([-1, 1]) * 8, cc.z + rng.pick([-1, 1]) * 8, 'candy');
    else if (rng.next() < 0.5) lamp(cc.x + C / 2 - 4, cc.z + C / 2 - 4, lampMat, 0xffa0d0);
    if (!edge) keyCandidates.push(cc);
    W.patrol.push(cc);
  };
  const gumdropsCell = (cc, i, j, edge) => {
    for (let k = 0, n = edge ? 1 : rng.int(2, 4); k < n; k++) {
      const a = rng.next() * 6.3, rr = rng.range(6.5, 9.5), x = cc.x + Math.cos(a) * rr, z = cc.z + Math.sin(a) * rr, s = rng.range(2.2, 3.6);
      inst('gumdrop', GEO.dome, MAT.gum, x, 0, z, { sx: s, sy: s * 1.2, sz: s, color: rng.pick([0xff3a6a, 0x3ad8ff, 0xffe03a, 0x9a3aff, 0x3aff8a]) });
      solid(x, z, s * 1.4, s * 1.4, s * 1.1);
      W.mapRects.push({ x, z, w: s * 2, d: s * 2, color: '#c87aff', round: true });
    }
    if (!edge) keyCandidates.push(cc);
    W.patrol.push(cc);
  };
  const cottonCell = (cc, i, j, edge) => {
    if (!edge) for (let k = 0; k < rng.int(2, 4); k++) { const a = rng.next() * 6.3, rr = rng.range(4, 9); bush(cc.x + Math.cos(a) * rr, cc.z + Math.sin(a) * rr, i + j * 5 + k, PINK()); }
    if (rng.next() < 0.5) inst('cloud', GEO.sphere, MAT.cottonCloud, cc.x + rng.range(-8, 8), rng.range(16, 24), cc.z + rng.range(-8, 8), { sx: rng.range(4, 7), sy: 2.4, sz: rng.range(3, 5), color: rng.pick([0xffc0e0, 0xc0e0ff]), cast: false });
    if (!edge) keyCandidates.push(cc);
    W.patrol.push(cc);
  };

  // ===== Level 9: Haunted Manor =====
  const mansion = (cc) => {
    const w = rng.int(15, 18), d = rng.int(13, 16), h = rng.int(13, 18);
    const wood = std(rng.pick([0x2a2028, 0x30262a, 0x24202c]), { roughness: 1 });
    box(w, h, d, wood, cc.x, h / 2, cc.z);
    const r = Math.max(w, d) * 0.75;
    const roof = meshAt(new THREE.ConeGeometry(r, 7, 4), std(0x16121a, { roughness: 0.9 }), cc.x, h + 3.5, cc.z); roof.rotation.y = Math.PI / 4; roof.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d));
    const tx = cc.x + w / 2 - 2, tz = cc.z - d / 2 + 2;
    meshAt(new THREE.CylinderGeometry(2.4, 2.4, h + 6, 10), wood, tx, (h + 6) / 2, tz);
    meshAt(new THREE.ConeGeometry(3.2, 6, 10), std(0x16121a), tx, h + 9, tz);
    for (let fl = 0; fl < Math.floor(h / 5); fl++) for (let k = -1; k <= 1; k++) {
      const lit = rng.next(), m = lit < 0.35 ? neon(0xffc86a, 1.6) : lit < 0.45 ? neon(0xff2a3a, 1.8) : new THREE.MeshBasicMaterial({ color: 0x050308 });
      box(1.8, 2.4, 0.2, m, cc.x + k * w / 3.5, 3 + fl * 5, cc.z - d / 2 - 0.1, false);
    }
    box(3, 5, 0.2, new THREE.MeshBasicMaterial({ color: 0x050308 }), cc.x, 2.5, cc.z - d / 2 - 0.1, false);
    solid(cc.x, cc.z, w, d, h);
    solid(tx, tz, 4.4, 4.4, h + 6);
    W.mapRects.push({ x: cc.x, z: cc.z, w, d, color: '#3a2e40' });
  };
  const manorCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.3) { mansion(cc); return; }
    if (r < 0.44) { for (let k = 0; k < rng.int(2, 3); k++) { const a = rng.next() * 6.3, rr = rng.range(3, 7); bush(cc.x + Math.cos(a) * rr, cc.z + Math.sin(a) * rr, i + j + k, new THREE.Color(0x1a2a1a)); } W.patrol.push(cc); return; }
    if (r < 0.5) { speedPad(cc); W.patrol.push(cc); return; }
    const roll = rng.next();
    if (roll < 0.35) lamp(cc.x + C / 2 - 4, cc.z + C / 2 - 4, neon(0x8affb0, 3), 0x6aff9a);
    else if (roll < 0.6 && !edge) { // a dried-up fountain with something glowing in it
      const x = cc.x + rng.pick([-1, 1]) * 7, z = cc.z + rng.pick([-1, 1]) * 7;
      meshAt(new THREE.CylinderGeometry(3.4, 3.6, 1.2, 16), std(0x4a4a50), x, 0.6, z);
      meshAt(new THREE.CylinderGeometry(0.5, 0.7, 4, 8), std(0x4a4a50), x, 2.6, z);
      glowDecal(x, z, 4, 0x6aff9a, 0.4);
      solid(x, z, 6.4, 6.4, 1.2);
    } else if (!edge && W.scarecrows.length < 10) scarecrow(cc.x + rng.pick([-1, 1]) * 7, cc.z + rng.pick([-1, 1]) * 7);
    if (!edge) keyCandidates.push(cc);
    W.patrol.push(cc);
  };
  const pumpkinsCell = (cc, i, j, edge) => {
    for (let k = 0, n = edge ? 3 : rng.int(5, 9); k < n; k++) {
      const a = rng.next() * 6.3, rr = rng.range(4, 10.5), x = cc.x + Math.cos(a) * rr, z = cc.z + Math.sin(a) * rr, s = rng.range(0.9, 2.2);
      inst('pumpkin', GEO.sphere, MAT.pumpkin, x, s * 0.7, z, { sx: s * 1.2, sy: s * 0.85, sz: s * 1.2, color: rng.pick([0xe06a10, 0xd05a10, 0xf08a20]) });
      if (rng.next() < 0.35) { for (const ex of [-0.35, 0.35]) inst('jackEye', GEO.sphere, MAT.ember, x + ex * s, s * 0.85, z - s * 1.15, { s: 0.22 * s, cast: false }); glowDecal(x, z - s, 2.5 * s, 0xff8a1a, 0.4); }
      if (s > 1.5) solid(x, z, s * 2.2, s * 2.2, s * 1.4);
    }
    if (!edge && rng.next() < 0.3 && W.scarecrows.length < 10) scarecrow(cc.x + 6, cc.z - 6);
    if (!edge) keyCandidates.push(cc);
    W.patrol.push(cc);
  };
  const swampCell = (cc, i, j, edge) => {
    if (!edge && rng.next() < 0.6) { // a murky pool: walkable, but it slows you down
      const a = rng.next() < 0.5, x = cc.x + (a ? rng.pick([-1, 1]) * 6 : 0), z = cc.z + (a ? 0 : rng.pick([-1, 1]) * 6), w = a ? 9 : C, d = a ? C : 9;
      box(w, 0.1, d, MAT.swampWater, x, 0.05, z, false);
      for (let k = 0; k < 4; k++) inst('lily', GEO.cyl, MAT.pine, x + rng.range(-w / 2.5, w / 2.5), 0.15, z + rng.range(-d / 2.5, d / 2.5), { sx: 0.8, sy: 0.05, sz: 0.8, color: 0x3a8a2a, cast: false });
      W.hazards.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, kind: 'water' });
      W.mapRects.push({ x, z, w, d, color: '#1a3a3a' });
    }
    if (!edge) for (let k = 0; k < rng.int(1, 2); k++) deadTree(cc.x + rng.pick([-1, 1]) * rng.range(8, 10.5), cc.z + rng.pick([-1, 1]) * rng.range(8, 10.5));
    for (let k = 0; k < 5; k++) inst('firefly', GEO.sphere, MAT.firefly, cc.x + rng.range(-11, 11), rng.range(1.5, 6), cc.z + rng.range(-11, 11), { s: 0.12, cast: false });
    if (!edge && rng.next() < 0.5) bush(cc.x + rng.range(-5, 5), cc.z + rng.range(-5, 5), i + j, new THREE.Color(0x2a4a1a));
    if (!edge) keyCandidates.push(cc);
    W.patrol.push(cc);
  };

  // ===== Level 10: Jungle Temple =====
  const stoneHead = (x, z) => { // giant stone head whose eyes follow you
    box(4, 1, 4, std(0x4a4a3a), x, 0.5, z);
    const head = new THREE.Group(); head.position.set(x, 4.2, z); group.add(head);
    meshAt(BOX(3.2, 5, 3), std(0x6a6a54, { roughness: 1 }), 0, 0, 0, head);
    meshAt(BOX(3.4, 0.6, 1.2), std(0x5a5a46), 0, 1.2, 1.2, head);
    meshAt(BOX(0.8, 1.6, 0.6), std(0x5a5a46), 0, 0, 1.6, head);
    const eyeMat = neon(0x5aff8a, 0.5);
    for (const ex of [-0.8, 0.8]) meshAt(BOX(0.6, 0.35, 0.1), eyeMat, ex, 0.6, 1.52, head);
    watcher(x, z, head, eyeMat, 0x5aff8a, 7);
  };
  const temple = (cc) => {
    const stone = std(rng.pick([0x6a6a50, 0x5a6248, 0x726a52]), { roughness: 1 });
    let s = rng.range(19, 21), y = 0;
    for (let k = 0; k < 4; k++) { box(s, 3, s, stone, cc.x, y + 1.5, cc.z); y += 3; s -= 4.2; }
    box(s + 1, 4, s + 1, stone, cc.x, y + 2, cc.z);
    box(2.4, 3, 0.3, neon(0x5aff8a, 1.8), cc.x, y + 1.8, cc.z - (s + 1) / 2 - 0.1, false);
    for (let k = 0; k < 4; k++) box(3, 0.2, 1.4, std(0x4a5040), cc.x, 3 * k + 3.05, cc.z - (19 - 4.2 * k) / 2 + 0.7, false); // steps
    glowDecal(cc.x, cc.z, 14, 0x5aff8a, 0.2);
    solid(cc.x, cc.z, 20, 20, y + 4);
    W.mapRects.push({ x: cc.x, z: cc.z, w: 20, d: 20, color: '#6a6a50' });
  };
  const templeCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.28) { temple(cc); return; }
    if (r < 0.42) { for (let k = 0; k < rng.int(2, 3); k++) { const a = rng.next() * 6.3, rr = rng.range(3, 7); bush(cc.x + Math.cos(a) * rr, cc.z + Math.sin(a) * rr, i + j + k, new THREE.Color(0x1a5a1a)); } W.patrol.push(cc); return; }
    if (r < 0.48) { speedPad(cc); W.patrol.push(cc); return; }
    if (!edge && rng.next() < 0.45 && W.scarecrows.length < 10) stoneHead(cc.x + rng.pick([-1, 1]) * 7, cc.z + rng.pick([-1, 1]) * 7);
    else if (!edge) for (let k = 0; k < rng.int(2, 4); k++) {
      const a = rng.next() * 6.3, rr = rng.range(6, 9.5), x = cc.x + Math.cos(a) * rr, z = cc.z + Math.sin(a) * rr, h = rng.range(3, 10);
      inst('column', GEO.cyl, MAT.stone, x, h / 2, z, { sx: 1, sy: h, sz: 1, color: 0x6a7058 });
      solid(x, z, 2, 2, h);
    }
    if (!edge) keyCandidates.push(cc);
    W.patrol.push(cc);
  };

  // ===== Level 11: Midnight Toyland =====
  const TOYC = [0xff3a4a, 0x3a8aff, 0xffd23a, 0x3ad86a, 0xb44aff, 0xff8a1a];
  const toySoldier = (x, z) => {
    box(2.4, 0.6, 2.4, std(0x3a3a3a), x, 0.3, z);
    meshAt(new THREE.CylinderGeometry(0.9, 0.9, 4, 12), std(0xc0202a), x, 2.6, z);
    meshAt(new THREE.CylinderGeometry(0.8, 0.8, 1.6, 12), std(0x1a1a4a), x, 0.9 + 0.4, z);
    const head = new THREE.Group(); head.position.set(x, 5.4, z); group.add(head);
    meshAt(new THREE.SphereGeometry(0.9, 12, 10), std(0xf0d0b0), 0, 0, 0, head);
    meshAt(new THREE.CylinderGeometry(0.8, 0.9, 2, 12), std(0x111111), 0, 1.4, 0, head);
    const eyeMat = neon(0xff2a2a, 0.5);
    for (const ex of [-0.3, 0.3]) meshAt(new THREE.SphereGeometry(0.13, 6, 4), eyeMat, ex, 0.15, 0.85, head);
    watcher(x, z, head, eyeMat, 0xff2a2a, 7);
  };
  const toyBlock = (x, z, s, y = 0) => { inst('toyblock', GEO.box, MAT.toy, x, y + s / 2, z, { s, ry: rng.range(-0.2, 0.2), color: rng.pick(TOYC) }); };
  const toytownCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.3) { gingerHouse(cc, true); return; }
    if (r < 0.42) { for (let k = 0; k < rng.int(2, 3); k++) { const a = rng.next() * 6.3, rr = rng.range(3, 7); bush(cc.x + Math.cos(a) * rr, cc.z + Math.sin(a) * rr, i + j + k, new THREE.Color(rng.pick(TOYC)).multiplyScalar(0.7)); } W.patrol.push(cc); return; }
    if (r < 0.48) { speedPad(cc); W.patrol.push(cc); return; }
    if (!edge && rng.next() < 0.4 && W.scarecrows.length < 10) toySoldier(cc.x + rng.pick([-1, 1]) * 7, cc.z + rng.pick([-1, 1]) * 7);
    else if (rng.next() < 0.5) lamp(cc.x + C / 2 - 4, cc.z + C / 2 - 4, lampMat, 0xffd27a);
    if (!edge) keyCandidates.push(cc);
    W.patrol.push(cc);
  };
  const blocksCell = (cc, i, j, edge) => {
    for (let k = 0, n = edge ? 1 : rng.int(2, 4); k < n; k++) {
      const a = rng.next() * 6.3, rr = rng.range(6.5, 9.5), x = cc.x + Math.cos(a) * rr, z = cc.z + Math.sin(a) * rr, s = rng.range(3.5, 5), hgt = rng.int(1, 3);
      for (let b = 0; b < hgt; b++) toyBlock(x + rng.range(-0.3, 0.3), z + rng.range(-0.3, 0.3), s - b * 0.4, b * (s - 0.2));
      solid(x, z, s, s, hgt * (s - 0.2));
      W.mapRects.push({ x, z, w: s, d: s, color: '#ff7a7a' });
    }
    if (!edge) keyCandidates.push(cc);
    W.patrol.push(cc);
  };
  const ballpitCell = (cc, i, j, edge) => {
    if (!edge && rng.next() < 0.65) { // a ball pit with a low wall: you can hide in the balls
      const R = 8.5;
      for (const [x, z, w, d] of [[cc.x, cc.z + R, 2 * R, 1], [cc.x - R, cc.z, 1, 2 * R], [cc.x + R, cc.z, 1, 2 * R]]) { box(w, 1.6, d, std(rng.pick(TOYC)), x, 0.8, z); solid(x, z, w, d, 1.6); }
      for (let k = 0; k < 160; k++) inst('ball', GEO.sphere, MAT.toy, cc.x + rng.range(-R + 1, R - 1), rng.range(0.4, 2.2), cc.z + rng.range(-R + 1, R - 1), { s: 0.6, color: rng.pick(TOYC), cast: false });
      W.bushes.push({ x: cc.x, z: cc.z, r: R - 1, mesh: null });
      W.mapRects.push({ x: cc.x, z: cc.z, w: 2 * R, d: 2 * R, color: '#3a8aff' });
    } else if (!edge) for (let k = 0; k < rng.int(1, 3); k++) toyBlock(cc.x + rng.pick([-1, 1]) * 8, cc.z + rng.pick([-1, 1]) * 8, 3.5);
    if (!edge) keyCandidates.push(cc);
    W.patrol.push(cc);
  };
  const trainsCell = (cc, i, j, edge) => {
    const z0 = cc.z + rng.pick([-1, 1]) * 7;
    for (const dz of [-1.1, 1.1]) box(C, 0.15, 0.3, std(0x8a8a90, { metalness: 0.6 }), cc.x, 0.08, z0 + dz, false);
    for (let k = -5; k <= 5; k++) inst('tie', GEO.box, MAT.bark, cc.x + k * 2.3, 0.05, z0, { sx: 0.6, sy: 0.1, sz: 3.2, cast: false });
    if (!edge && rng.next() < 0.6) { // a toy train car
      const x = cc.x + rng.range(-5, 5), col = rng.pick(TOYC);
      box(8, 3.6, 3.4, std(col), x, 2.3, z0);
      box(8.4, 0.4, 3.8, std(0x2a2a2a), x, 4.3, z0, false);
      for (const wx of [-2.6, 2.6]) for (const s of [-1, 1]) { const wl = meshAt(new THREE.CylinderGeometry(0.8, 0.8, 0.4, 12), std(0x1a1a1a), x + wx, 0.8, z0 + s * 1.8); wl.rotation.x = Math.PI / 2; }
      solid(x, z0, 8, 3.4, 4.1);
      W.mapRects.push({ x, z: z0, w: 8, d: 3.4, color: hex6(col) });
    }
    if (!edge) keyCandidates.push(cc);
    W.patrol.push(cc);
  };
  const dollhousesCell = (cc, i, j, edge) => {
    if (!edge && rng.next() < 0.4) { gingerHouse(cc, true); return; }
    if (!edge && rng.next() < 0.5) for (let k = 0; k < rng.int(1, 2); k++) bush(cc.x + rng.range(-6, 6), cc.z + rng.range(3, 7), i + j + k, new THREE.Color(0xffa0d0).multiplyScalar(0.8));
    else if (!edge) toyBlock(cc.x + 7, cc.z - 7, 4);
    if (!edge) keyCandidates.push(cc);
    W.patrol.push(cc);
  };

  const builders = {
    city: cityCell, forest: forestCell, graveyard: graveCell, factory: factoryCell, fields: fieldsCell,
    village: villageCell, snowwoods: (cc, i, j, e) => forestCell(cc, i, j, e, 'snow'), lake: lakeCell, crystal: crystalCell, camp: campCell,
    midway: midwayCell, bigtop: bigtopCell, rides: ridesCell, maze: mazeCell, haunted: (cc, i, j, e) => forestCell(cc, i, j, e, 'dead'),
    ruins: ruinsCell, craters: cratersCell, lava: lavaCell, ashwoods: (cc, i, j, e) => forestCell(cc, i, j, e, 'ash'),
    bazaar: bazaarCell, dunes: dunesCell, pyramids: pyramidsCell, canyon: canyonCell, boneyard: boneyardCell,
    sunkencity: (cc, i, j, e) => ruinsCell(cc, i, j, e, 'sea'), kelp: (cc, i, j, e) => forestCell(cc, i, j, e, 'kelp'), reef: (cc, i, j, e) => crystalCell(cc, i, j, e, 'coral'),
    wrecks: wrecksCell, trench: (cc, i, j, e) => canyonCell(cc, i, j, e, 'trench'),
    base: baseCell, alienwoods: (cc, i, j, e) => forestCell(cc, i, j, e, 'alien'), xcrystal: (cc, i, j, e) => crystalCell(cc, i, j, e, 'alien'), ufo: ufoCell,
    candytown: candytownCell, candywoods: (cc, i, j, e) => forestCell(cc, i, j, e, 'candy'), gumdrops: gumdropsCell, chocoriver: (cc, i, j, e) => lavaCell(cc, i, j, e, 'choco'), cotton: cottonCell,
    manor: manorCell, pumpkins: pumpkinsCell, swamp: swampCell,
    temple: templeCell, jungle: (cc, i, j, e) => forestCell(cc, i, j, e, 'jungle'), river: (cc, i, j, e) => lavaCell(cc, i, j, e, 'water'), mossrock: (cc, i, j, e) => canyonCell(cc, i, j, e, 'moss'),
    toytown: toytownCell, blocks: blocksCell, ballpit: ballpitCell, trains: trainsCell, dollhouses: dollhousesCell,
  };
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const cc = cellCenter(i, j);
    if (!isLair(i, j)) builders[W.zones[j * N + i]](cc, i, j, j === 0 || j === N - 1);
    if (j === 0 && i > 0 && i < N - 1) W.spawns.push(cc.clone());
  }

  box(size, 0.08, 0.8, neon(0x78ff8c, 1.1), 0, 0.04, -half + C, false); // start line

  // ---- monster lair
  {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 0.4, 48), std(new THREE.Color(L.lair).multiplyScalar(0.18), { roughness: 0.6 }));
    disc.position.set(0, 0.2, 0); add(disc, false, true);
    const ring = new THREE.Mesh(new THREE.RingGeometry(11.4, 12, 48), neon(L.lair, 1.8));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.42; group.add(ring);
    glowDecal(0, 0, 20, L.lair, 0.28);
    const pMat = neon(L.lair, 1.8);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2, x = Math.cos(a) * 14, z = Math.sin(a) * 14;
      box(1.2, 9, 1.2, pMat, x, 4.5, z, false); solid(x, z, 1.2, 1.2, 9);
    }
    W.patrol.push(V(0, 0, 0));
  }

  // ---- flood-fill from the lair so keys, drinks, spawns and patrol spots are never sealed in
  buildNav(W);
  {
    const nav = W.nav, n = nav.n, seen = new Uint8Array(n * n), q = new Int32Array(n * n);
    const s0 = navNearest(nav, ...navCell(nav, 0, 0));
    let qh = 0, qt = 0;
    seen[s0[1] * n + s0[0]] = 1; q[qt++] = s0[1] * n + s0[0];
    while (qh < qt) {
      const c = q[qh++], x = c % n, z = (c / n) | 0;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, nz = z + dz;
        if (navFree(nav, nx, nz) && !seen[nz * n + nx]) { seen[nz * n + nx] = 1; q[qt++] = nz * n + nx; }
      }
    }
    const ok = (p) => { const c = navNearest(nav, ...navCell(nav, p.x, p.z)); return c && seen[c[1] * n + c[0]]; };
    for (const arr of [keyCandidates, W.patrol, W.spawns]) for (let k = arr.length - 1; k >= 0; k--) if (!ok(arr[k])) arr.splice(k, 1);
  }

  // ---- keys (spread out), then energy drinks in leftover spots
  for (let k = keyCandidates.length - 1; k > 0; k--) { const s = rng.int(0, k); [keyCandidates[k], keyCandidates[s]] = [keyCandidates[s], keyCandidates[k]]; }
  let spacing = C * 3;
  const spots = [];
  for (let pass = 0; pass < 4 && spots.length < CFG.keysToSpawn; pass++, spacing *= 0.65) {
    for (const c of keyCandidates) {
      if (spots.length >= CFG.keysToSpawn) break;
      if (c.length() < C * 1.5) continue;
      if (spots.every((s) => s.distanceTo(c) >= spacing)) spots.push(c);
    }
  }
  const keyCol = L.keyColor || 0xffc83c, keyMat = neon(keyCol, 3.2);
  for (const s of spots) {
    const g = new THREE.Group();
    if (L.battle) { // glowing power core
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(1.3), keyMat);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.15, 8, 32), neon(0xffffff, 2)); ring.rotation.x = Math.PI / 2;
      g.add(core, ring);
    } else {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.28, 10, 24), keyMat); ring.position.y = 1.2;
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.6, 0.4), keyMat); shaft.position.y = -0.9;
      const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 0.4), keyMat); t1.position.set(0.5, -1.7, 0);
      const t2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.4), keyMat); t2.position.set(0.4, -1.0, 0);
      g.add(ring, shaft, t1, t2);
    }
    g.position.set(s.x, 3.2, s.z);
    group.add(g);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 80, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: keyCol, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    beam.position.set(s.x, 40, s.z); group.add(beam);
    const decal = glowDecal(s.x, s.z, 6, keyCol, 0.6);
    W.keys.push({ x: s.x, z: s.z, mesh: g, beam, decal, taken: false });
  }
  const canMat = neon(0x3cf0ff, 2.2), capMat = std(0xdddddd, { metalness: 0.8, roughness: 0.3 });
  for (const c of keyCandidates) {
    if (W.drinks.length >= CFG.drinks) break;
    const p = V(c.x + 3, 0, c.z - 2);
    if (spots.some((s) => s.distanceTo(c) < C * 1.5) || W.drinks.some((d) => Math.hypot(d.x - p.x, d.z - p.z) < C * 2.5)) continue;
    const g = new THREE.Group();
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.6, 16), canMat);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.2, 16), capMat); cap.position.y = 0.9;
    g.add(can, cap); g.position.set(p.x, 1.6, p.z); group.add(g);
    const decal = glowDecal(p.x, p.z, 4, 0x3cf0ff, 0.5);
    W.drinks.push({ x: p.x, z: p.z, mesh: g, decal, taken: false });
  }
  // ---- power-ups: 👻 ghost potions (turn invisible) and 💥 flash bombs (stun nearby monsters)
  W.items = [];
  for (const [kind, col] of [['ghost', 0xb47aff], ['bomb', 0xffe05a], ['ghost', 0xb47aff], ['bomb', 0xffe05a], ['ghost', 0xb47aff], ['bomb', 0xffe05a]]) {
    for (const c of [...keyCandidates].reverse()) {
      const p = V(c.x - 3, 0, c.z + 3);
      if (spots.some((s) => s.distanceTo(c) < C * 1.2) || W.drinks.some((d) => Math.hypot(d.x - p.x, d.z - p.z) < C) || W.items.some((d) => Math.hypot(d.x - p.x, d.z - p.z) < C * 3)) continue;
      const g = new THREE.Group();
      if (kind === 'ghost') {
        g.add(new THREE.Mesh(new THREE.SphereGeometry(0.75, 14, 10), neon(col, 2)));
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.7, 10), std(0xe0e0f0, { transparent: true, opacity: 0.8 })); neck.position.y = 0.85; g.add(neck);
        const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.25, 8), std(0x8a5a2a)); cork.position.y = 1.3; g.add(cork);
      } else {
        g.add(new THREE.Mesh(new THREE.SphereGeometry(0.8, 14, 10), std(0x2a2a34, { metalness: 0.6, roughness: 0.3 })));
        const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 6), std(0xc0a070)); fuse.position.y = 1; g.add(fuse);
        const spark = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), neon(col, 4)); spark.position.y = 1.35; g.add(spark);
      }
      g.position.set(p.x, 1.6, p.z); group.add(g);
      W.items.push({ x: p.x, z: p.z, kind, mesh: g, decal: glowDecal(p.x, p.z, 4, col, 0.5), taken: false });
      break;
    }
  }

  // ---- flush instanced props
  {
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), pv = V(0, 0, 0), sv = V(1, 1, 1), col = new THREE.Color();
    for (const b of batches.values()) {
      const im = new THREE.InstancedMesh(b.geo, b.mat, b.list.length);
      const colored = b.list.some((t) => t.color !== undefined);
      b.list.forEach((t, k) => {
        q.setFromEuler(e.set(t.rx, t.ry, t.rz));
        im.setMatrixAt(k, m4.compose(pv.set(t.x, t.y, t.z), q, sv.set(t.sx, t.sy, t.sz)));
        if (colored) im.setColorAt(k, col.set(t.color ?? 0xffffff));
      });
      im.castShadow = b.cast; im.receiveShadow = true; im.frustumCulled = false;
      group.add(im);
    }
  }

  scene.add(group);
  return W;
}

function disposeWorld(W) {
  if (!W) return;
  scene.remove(W.group);
  W.group.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
  });
}

// ---------------------------------------------------------------------------
// Collision + navigation
// ---------------------------------------------------------------------------
function groundAt(x, z, r, y, step = 1.2) {
  let g = 0;
  for (const o of world.obstacles) {
    if (o.h > y + step || o.h <= g) continue;
    const cx = clamp(x, o.x0, o.x1), cz = clamp(z, o.z0, o.z1);
    if ((x - cx) ** 2 + (z - cz) ** 2 < r * r * 0.5) g = o.h;
  }
  return g;
}

function collide(pos, r, step = 1.2) {
  for (let iter = 0; iter < 2; iter++) {
    for (const o of world.obstacles) {
      if (o.h <= pos.y + step) continue;
      if (pos.x < o.x0 - r || pos.x > o.x1 + r || pos.z < o.z0 - r || pos.z > o.z1 + r) continue;
      const cx = clamp(pos.x, o.x0, o.x1), cz = clamp(pos.z, o.z0, o.z1);
      const dx = pos.x - cx, dz = pos.z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 > 1e-8) {
        const d = Math.sqrt(d2);
        if (d < r) { pos.x += (dx / d) * (r - d); pos.z += (dz / d) * (r - d); }
      } else {
        const pl = pos.x - o.x0, pr = o.x1 - pos.x, pb = pos.z - o.z0, pf = o.z1 - pos.z;
        const m = Math.min(pl, pr, pb, pf);
        if (m === pl) pos.x = o.x0 - r; else if (m === pr) pos.x = o.x1 + r; else if (m === pb) pos.z = o.z0 - r; else pos.z = o.z1 + r;
      }
    }
  }
}

function segHitsBox(x0, z0, x1, z1, o) {
  let tmin = 0, tmax = 1;
  const dx = x1 - x0, dz = z1 - z0;
  for (const [p, d, lo, hi] of [[x0, dx, o.x0, o.x1], [z0, dz, o.z0, o.z1]]) {
    if (Math.abs(d) < 1e-9) { if (p < lo || p > hi) return false; }
    else {
      let t1 = (lo - p) / d, t2 = (hi - p) / d;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
      if (tmin > tmax) return false;
    }
  }
  return true;
}
function sightBlocked(x0, z0, x1, z1, minH) {
  for (const o of world.obstacles) if (o.h >= minH && segHitsBox(x0, z0, x1, z1, o)) return true;
  return false;
}

function rayDistance(origin, dir, maxD) {
  let best = maxD;
  for (const o of world.obstacles) {
    if (o.h < 2) continue;
    let tmin = 0, tmax = best, ok = true;
    for (const [p, d, lo, hi] of [[origin.x, dir.x, o.x0, o.x1], [origin.y, dir.y, 0, o.h], [origin.z, dir.z, o.z0, o.z1]]) {
      if (Math.abs(d) < 1e-9) { if (p < lo || p > hi) { ok = false; break; } }
      else {
        let t1 = (lo - p) / d, t2 = (hi - p) / d;
        if (t1 > t2) [t1, t2] = [t2, t1];
        tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
        if (tmin > tmax) { ok = false; break; }
      }
    }
    if (ok && tmin < best) best = tmin;
  }
  return best;
}

function buildNav(W) {
  const res = 2, n = Math.ceil(W.size / res), R = 1.9;
  const blocked = new Uint8Array(n * n);
  for (const o of W.obstacles) {
    if (o.h < 1) continue;
    const gx0 = Math.max(0, Math.floor((o.x0 - R + W.half) / res)), gx1 = Math.min(n - 1, Math.floor((o.x1 + R + W.half) / res));
    const gz0 = Math.max(0, Math.floor((o.z0 - R + W.half) / res)), gz1 = Math.min(n - 1, Math.floor((o.z1 + R + W.half) / res));
    for (let z = gz0; z <= gz1; z++) for (let x = gx0; x <= gx1; x++) blocked[z * n + x] = 1;
  }
  W.nav = { res, n, blocked, half: W.half, g: new Float32Array(n * n), came: new Int32Array(n * n), stamp: new Uint32Array(n * n), closed: new Uint32Array(n * n), gen: 0 };
}
function navCell(nav, x, z) {
  return [clamp(Math.floor((x + nav.half) / nav.res), 0, nav.n - 1), clamp(Math.floor((z + nav.half) / nav.res), 0, nav.n - 1)];
}
function navFree(nav, x, z) { return x >= 0 && z >= 0 && x < nav.n && z < nav.n && !nav.blocked[z * nav.n + x]; }
function navNearest(nav, x, z) {
  if (navFree(nav, x, z)) return [x, z];
  for (let r = 1; r < 10; r++) for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
    if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
    if (navFree(nav, x + dx, z + dz)) return [x + dx, z + dz];
  }
  return null;
}
function navClear(nav, x0, z0, x1, z1) {
  const d = Math.hypot(x1 - x0, z1 - z0), steps = Math.ceil(d / (nav.res * 0.5));
  for (let i = 0; i <= steps; i++) {
    const t = steps ? i / steps : 0;
    const [cx, cz] = navCell(nav, lerp(x0, x1, t), lerp(z0, z1, t));
    if (nav.blocked[cz * nav.n + cx]) return false;
  }
  return true;
}
function findPath(nav, sx, sz, tx, tz) {
  const a = navNearest(nav, ...navCell(nav, sx, sz));
  const b = navNearest(nav, ...navCell(nav, tx, tz));
  if (!a || !b) return null;
  const n = nav.n, start = a[1] * n + a[0], goal = b[1] * n + b[0];
  const gen = ++nav.gen;
  const { g, came, stamp, closed } = nav;
  const heapI = [], heapF = [];
  const push = (i, f) => {
    heapI.push(i); heapF.push(f);
    let k = heapI.length - 1;
    while (k > 0) { const p = (k - 1) >> 1; if (heapF[p] <= heapF[k]) break; [heapI[p], heapI[k]] = [heapI[k], heapI[p]]; [heapF[p], heapF[k]] = [heapF[k], heapF[p]]; k = p; }
  };
  const pop = () => {
    const top = heapI[0], li = heapI.pop(), lf = heapF.pop();
    if (heapI.length) {
      heapI[0] = li; heapF[0] = lf;
      let k = 0;
      for (;;) {
        const l = 2 * k + 1, r = l + 1; let m = k;
        if (l < heapI.length && heapF[l] < heapF[m]) m = l;
        if (r < heapI.length && heapF[r] < heapF[m]) m = r;
        if (m === k) break;
        [heapI[m], heapI[k]] = [heapI[k], heapI[m]]; [heapF[m], heapF[k]] = [heapF[k], heapF[m]]; k = m;
      }
    }
    return top;
  };
  const bx = b[0], bz = b[1];
  const h = (x, z) => { const dx = Math.abs(x - bx), dz = Math.abs(z - bz); return (dx + dz) + (Math.SQRT2 - 2) * Math.min(dx, dz); };
  stamp[start] = gen; g[start] = 0; came[start] = -1;
  push(start, h(a[0], a[1]));
  const DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];
  let found = false, iters = 0;
  while (heapI.length && iters++ < 200000) {
    const cur = pop();
    if (closed[cur] === gen) continue;
    closed[cur] = gen;
    if (cur === goal) { found = true; break; }
    const cx = cur % n, cz = (cur / n) | 0;
    for (const [dx, dz, cost] of DIRS) {
      const nx = cx + dx, nz = cz + dz;
      if (!navFree(nav, nx, nz)) continue;
      if (dx && dz && (!navFree(nav, cx + dx, cz) || !navFree(nav, cx, cz + dz))) continue;
      const ni = nz * n + nx;
      if (closed[ni] === gen) continue;
      const ng = g[cur] + cost;
      if (stamp[ni] !== gen || ng < g[ni]) { stamp[ni] = gen; g[ni] = ng; came[ni] = cur; push(ni, ng + h(nx, nz)); }
    }
  }
  if (!found) return null;
  const pts = [];
  for (let c = goal; c !== -1; c = came[c]) pts.push(V(-nav.half + ((c % n) + 0.5) * nav.res, 0, -nav.half + (((c / n) | 0) + 0.5) * nav.res));
  pts.reverse();
  return pts;
}

// ---------------------------------------------------------------------------
// Characters
// ---------------------------------------------------------------------------
function part(geo, mat, x, y, z, parent) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m;
}
function pivot(x, y, z, parent) { const p = new THREE.Group(); p.position.set(x, y, z); parent.add(p); return p; }
const BOX = (w, h, d) => new THREE.BoxGeometry(w, h, d);

function buildRunner(color = 0x35c6ff) {
  const g = new THREE.Group(); g.rotation.order = 'YXZ';
  const hoodie = std(color, { roughness: 0.7 }), pants = std(0x2b2b45), skin = std(0xffc9a0), shoe = std(0xf2f2f2), dark = new THREE.MeshBasicMaterial({ color: 0x111111 });
  part(BOX(2, 2.1, 1.1), hoodie, 0, 3.05, 0, g);
  part(BOX(1.3, 1.3, 1.3), skin, 0, 4.8, 0, g);
  part(BOX(1.45, 1.05, 0.5), hoodie, 0, 4.8, -0.58, g);
  part(BOX(1.4, 0.35, 1.4), std(0xff4fa0), 0, 5.5, 0, g);
  part(BOX(0.18, 0.3, 0.05), dark, -0.28, 4.9, 0.66, g);
  part(BOX(0.18, 0.3, 0.05), dark, 0.28, 4.9, 0.66, g);
  const legL = pivot(-0.5, 2, 0, g), legR = pivot(0.5, 2, 0, g);
  for (const L of [legL, legR]) { part(BOX(0.85, 1.8, 0.85), pants, 0, -0.9, 0, L); part(BOX(0.9, 0.35, 1.15), shoe, 0, -1.83, 0.12, L); }
  const armL = pivot(-1.38, 3.95, 0, g), armR = pivot(1.38, 3.95, 0, g);
  for (const A of [armL, armR]) { part(BOX(0.7, 1.9, 0.7), hoodie, 0, -0.85, 0, A); part(BOX(0.6, 0.4, 0.6), skin, 0, -1.95, 0, A); }
  g.userData = { legL, legR, armL, armR };
  return g;
}

function buildMonsterMesh(typeKey) {
  const T = MONSTERS[typeKey];
  const bulk = T.bulk || 1;
  const g = new THREE.Group(); g.rotation.order = 'YXZ';
  const inner = pivot(0, 0, 0, g); inner.scale.setScalar(T.scale);
  let wraps = null;
  if (T.mummy) { // dirty bandages
    const [c, g2] = makeCanvas(32, 32); g2.fillStyle = '#ddd'; g2.fillRect(0, 0, 32, 32);
    for (let y = 0; y < 32; y += 4) { g2.fillStyle = `rgba(60,40,20,${0.25 + Math.random() * 0.35})`; g2.fillRect(0, y, 32, 1.5); }
    wraps = new THREE.CanvasTexture(c); wraps.wrapS = wraps.wrapT = THREE.RepeatWrapping; wraps.repeat.set(1, 3);
  }
  const skin = T.ghost
    ? std(T.body, { roughness: 0.5, transparent: true, opacity: 0.88, emissive: T.ghost, emissiveIntensity: 0.8 })
    : std(T.body, { roughness: T.fur || T.mummy ? 0.95 : 0.42, metalness: T.fur || T.mummy ? 0 : 0.25, map: wraps });
  const bone = std(T.bone ?? 0xd8cfb8, { roughness: 0.55 });
  const faceMat = T.face ? std(T.face, { roughness: 0.6 }) : T.boneFace ? bone : skin;
  const eyeMat = neon(T.eye, 6), mouthMat = neon(T.clown ? 0xff1030 : T.eye, 1.5);
  const black = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const cloth = (c, o = {}) => std(c, { roughness: 1, side: THREE.DoubleSide, ...o });

  // gaunt, hunched torso
  const body = pivot(0, 3.4, 0, inner);
  part(new THREE.CylinderGeometry(1.15 * bulk, 0.65 * bulk, 3.6, 7), skin, 0, 1.8, 0, body);
  if (T.ribs !== false && !T.fur) for (let k = 0; k < 4; k++) part(BOX(1.9 - k * 0.22, 0.13, 0.25), bone, 0, 2.75 - k * 0.42, 0.95 - k * 0.07, body);
  const spikes = T.spikes ?? 4;
  for (let k = 0; k < spikes; k++) { const sp = part(new THREE.ConeGeometry(0.22, T.spikeLen || 0.9, 5), bone, 0, 0.5 + k * (3 / spikes), -0.85 * bulk, body); sp.rotation.x = -1.1; }
  if (T.fur) { // shaggy fur all over
    const furMat = std(T.fur, { roughness: 1, flatShading: true });
    for (let k = 0; k < 22; k++) {
      const a = (k / 22) * Math.PI * 2 * 3, y = 0.4 + (k / 22) * 3.2, r = (0.7 + (y / 3.6) * 0.5) * bulk;
      const f = part(new THREE.ConeGeometry(0.45, 1.6, 4), furMat, Math.sin(a) * r, y, Math.cos(a) * r, body);
      f.rotation.set(Math.cos(a) * 2.4, 0, -Math.sin(a) * 2.4);
    }
    part(new THREE.SphereGeometry(1.25 * bulk, 8, 6), furMat, 0, 3.4, -0.3, body).scale.set(1.2, 0.7, 1); // hunched shoulders
  }
  if (T.robe) { // tattered robe / dress hanging from the shoulders
    const geo = new THREE.ConeGeometry(2.3, 6.4, 12, 3, true);
    const p = geo.attributes.position;
    for (let v = 0; v < p.count; v++) if (p.getY(v) < -3) p.setY(v, p.getY(v) - Math.random() * 1.8);
    geo.computeVertexNormals();
    part(geo, cloth(T.robe, { transparent: true, opacity: 0.92, emissive: T.ghost || 0, emissiveIntensity: 0.3 }), 0, 0.6, 0, body);
  }
  if (T.clownButtons) for (let k = 0; k < 3; k++) part(new THREE.SphereGeometry(0.24, 8, 6), neon([0xff3a6a, 0x3affb0, 0xffe03a][k], 1.5), 0, 2.6 - k * 0.8, 1.02 * bulk, body);
  let tentacles = null;
  if (T.tentacles) { // dangling jellyfish tentacles
    tentacles = [];
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2, tp = pivot(Math.sin(a) * 0.9, 0.2, Math.cos(a) * 0.9, body);
      part(BOX(0.22, 5 + (k % 3), 0.22), skin, 0, -(5 + (k % 3)) / 2, 0, tp);
      tentacles.push(tp);
    }
    part(new THREE.SphereGeometry(2, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), skin, 0, 0.4, 0, body).scale.set(1, 0.6, 1); // bell
  }
  if (T.clown) { // baggy suit, pompom buttons, frilly collar
    for (let k = 0; k < 3; k++) part(new THREE.SphereGeometry(0.22, 8, 6), neon(0xffd23a, 1.5), 0, 2.6 - k * 0.8, 1.02, body);
    const ruff = part(new THREE.CylinderGeometry(1.6, 1.2, 0.5, 16, 1, true), cloth(0xf2ede4), 0, 3.55, 0, body);
    ruff.rotation.x = 0.1;
  }

  let tail = null;
  if (T.tail) { // segmented scorpion tail with a glowing stinger
    tail = [];
    let parent = pivot(0, 0.3, -0.7, body);
    parent.rotation.x = -2.2;
    for (let k = 0; k < 6; k++) {
      part(BOX(0.55 - k * 0.05, 1.1, 0.55 - k * 0.05), k % 2 ? bone : skin, 0, 0.55, 0, parent);
      tail.push(parent);
      const nx = pivot(0, 1.05, 0, parent); nx.rotation.x = 0.5; parent = nx;
    }
    part(new THREE.ConeGeometry(0.22, 1.2, 6), neon(T.eye, 2.5), 0, 0.6, 0, parent);
  }

  // head: brow, sunken glowing eyes, a jaw that opens wide
  const neck = pivot(0, 3.55, 0.15 + (bulk - 1) * 0.6, body);
  part(BOX(0.5 * bulk, 0.9, 0.5 * bulk), skin, 0, 0.35, 0, neck);
  const head = pivot(0, 0.75, 0.1, neck);
  if (T.bigHead) head.scale.set(1.45, 1.65, 1.3);
  if (T.lure) { // anglerfish lure dangling in front of its face
    const lp = pivot(0, 1.5, 0.4, head); lp.rotation.x = 0.8;
    part(BOX(0.08, 2.4, 0.08), skin, 0, 1.2, 0, lp);
    part(new THREE.SphereGeometry(0.32, 10, 8), neon(T.eye, 4), 0, 2.5, 0, lp);
    const ls = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: T.eye, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    ls.position.y = 2.5; ls.scale.setScalar(2.4); lp.add(ls);
  }
  part(BOX(1.25, 1.0, 1.45), faceMat, 0, 0.95, 0.1, head);
  part(BOX(1.15, 0.5, 0.8), skin, 0, 0.25, -0.25, head);
  part(BOX(1.45, 0.28, 0.45), faceMat, 0, 1.3, 0.72, head);
  if (T.hood) { const hood = part(new THREE.ConeGeometry(1.3, 2.8, 9, 1, true), cloth(T.hood), 0, 1.3, -0.15, head); hood.rotation.x = -0.15; }
  if (T.horns) for (const s of [-1, 1]) { const horn = part(new THREE.ConeGeometry(0.16 * bulk, T.eyes === 6 ? 0.9 : 1.6, 5), bone, s * 0.5, 1.7, -0.1, head); horn.rotation.z = -s * 0.5; horn.rotation.x = -0.4; }
  if (T.antlers) for (const s of [-1, 1]) { // branching antlers
    const beam = pivot(s * 0.45, 1.45, -0.1, head); beam.rotation.z = -s * 0.55; beam.rotation.x = -0.3;
    part(BOX(0.16, 3, 0.16), bone, 0, 1.5, 0, beam);
    for (let t = 0; t < 3; t++) { const tine = part(BOX(0.12, 1.2, 0.12), bone, s * 0.35, 1 + t * 0.8, 0.1, beam); tine.rotation.z = s * 0.9; }
  }
  if (T.clown) {
    part(new THREE.SphereGeometry(0.28, 10, 8), neon(0xff2030, 1.8), 0, 0.85, 0.95, head); // nose
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) part(new THREE.SphereGeometry(0.42, 8, 6), std(0xff5a1a, { roughness: 1 }), s * (0.8 + k * 0.12), 1.05 + k * 0.28, -0.1 - k * 0.2, head);
    for (const s of [-1, 1]) { const tear = part(BOX(0.08, 0.5, 0.05), neon(0x3a6aff, 1.5), s * 0.33, 0.7, 0.84, head); tear.rotation.z = 0.1 * s; }
  }
  if (T.jester) for (const s of [-1, 1]) { // two-pointed hat with bells
    const tip = pivot(s * 0.3, 1.5, 0, head); tip.rotation.z = -s * 1.0;
    part(new THREE.ConeGeometry(0.45, 2.2, 8), std(s < 0 ? 0x6a1a8a : 0x1a8a4a), 0, 1.1, 0, tip);
    part(new THREE.SphereGeometry(0.2, 8, 6), neon(0xffd23a, 1.8), 0, 2.3, 0, tip);
  }
  const eyes = T.eyes === 6 ? [[-0.42, 1.05], [0.42, 1.05], [-0.2, 1.17], [0.2, 1.17], [-0.5, 0.82], [0.5, 0.82]] : [[-0.33, 1.02], [0.33, 1.02]];
  const eyeGlow = [];
  for (const [ex, ey] of eyes) {
    const es = T.eyeSize || 1;
    part(BOX(0.36 * es, 0.27 * es, 0.08), black, ex, ey, 0.83, head);
    part(new THREE.SphereGeometry((T.eyes === 6 ? 0.1 : 0.13) * es, 8, 6), eyeMat, ex, ey, 0.87, head);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: T.eye, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    s.position.set(ex, ey, 0.97); s.userData.base = (T.eyes === 6 ? 0.9 : 1.4) * Math.sqrt(es); s.scale.setScalar(s.userData.base); head.add(s); eyeGlow.push(s);
  }
  if (T.hair) { // long wet hair hanging over the face
    const hm = cloth(T.hair);
    for (let k = 0; k < 9; k++) { const x = -0.6 + k * 0.15; if (k === 6) continue; part(BOX(0.16, 2.6 + Math.random() * 1.4, 0.12), hm, x, -0.1, 0.92 + Math.random() * 0.05, head); }
    part(BOX(1.4, 3.6, 0.3), hm, 0, -0.2, -0.6, head);
    part(BOX(1.4, 0.3, 1.5), hm, 0, 1.5, 0.1, head);
  }
  if (T.strings && T.boneFace) for (const s of [-1, 1]) part(BOX(0.06, 0.9, 0.04), black, s * 0.25, 0.25, 0.84, head); // carved puppet mouth lines
  part(BOX(0.95, 0.5, 0.1), mouthMat, 0, 0.3, 0.55, head); // glowing throat (seen when the jaw opens)
  const toothGeo = new THREE.ConeGeometry(0.07, 0.4, 4);
  for (let x = -0.45; x <= 0.46; x += 0.15) { const t = part(toothGeo, bone, x, 0.32, 0.72, head); t.rotation.x = Math.PI; }
  const jaw = pivot(0, 0.4, -0.25, head);
  const longJaw = T.posture === 'float';
  part(BOX(1.15, 0.26, longJaw ? 1.5 : 1.2), faceMat, 0, -0.2, longJaw ? 0.65 : 0.55, jaw);
  for (let x = -0.4; x <= 0.41; x += 0.16) part(toothGeo, bone, x, 0.05, longJaw ? 1.2 : 1.0, jaw);
  const headAnchor = pivot(0, 0.8, 0.9, head);

  // long arms with long claws
  const arm = (side, y, len) => {
    const th = bulk;
    const sh = pivot(side * 1.25 * bulk, y, 0, body);
    part(BOX(0.42 * th, len, 0.42 * th), T.clown ? skin : skin, 0, -len / 2, 0, sh);
    const el = pivot(0, -len, 0, sh);
    part(BOX(0.34 * th, len, 0.34 * th), skin, 0, -len / 2, 0, el);
    const hand = pivot(0, -len, 0, el);
    part(BOX(0.6 * th, 0.45, 0.35 * th), T.clown ? std(0xf2f2f2) : skin, 0, -0.2, 0, hand);
    const cl = T.longClaws ? 1.9 : 1.3;
    for (let c = -1; c <= 1; c++) { const m = part(new THREE.ConeGeometry(0.07 * th, cl, 4), bone, c * 0.2 * th, -0.4 - cl / 2, 0.05, hand); m.rotation.x = Math.PI; m.rotation.z = c * 0.12; }
    if (T.fur) { const f = part(new THREE.ConeGeometry(0.5, 1.8, 4), std(T.fur, { roughness: 1, flatShading: true }), 0, -len * 0.5, -0.2, sh); f.rotation.x = 2.6; }
    return { sh, el, hand };
  };
  const armL = arm(-1, 3.25, 2.6), armR = arm(1, 3.25, 2.6);
  const armL2 = T.extraArms ? arm(-1, 1.7, 2.2) : null, armR2 = T.extraArms ? arm(1, 1.7, 2.2) : null;
  const leg = (side) => {
    const hip = pivot(side * 0.55 * bulk, 0, 0, body);
    part(BOX(0.55 * bulk, 1.8, 0.55 * bulk), skin, 0, -0.9, 0, hip);
    const knee = pivot(0, -1.8, 0, hip);
    part(BOX(0.42 * bulk, 1.6, 0.42 * bulk), skin, 0, -0.8, 0, knee);
    part(BOX(0.6 * bulk, 0.25, 1.2 * bulk), T.clown ? std(0xc01a2a) : skin, 0, -1.55, T.clown ? 0.6 : 0.3, knee);
    if (T.clown) part(BOX(0.7, 0.3, 2.2), std(0xc01a2a), 0, -1.55, 0.6, knee); // giant shoes
    return { hip, knee };
  };
  const legL = leg(-1), legR = leg(1);
  if (T.robe && !T.legsVisible) { legL.hip.visible = false; legR.hip.visible = false; }

  // marionette strings: a wooden control bar floating above, with strings to the hands and head
  let strings = null;
  if (T.strings) {
    const bar = pivot(0, 22, 0, g);
    part(BOX(5, 0.3, 0.3), std(0x5a3a20), 0, 0, 0, bar);
    part(BOX(0.3, 0.3, 3), std(0x5a3a20), 0, 0, 0, bar);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(18), 3));
    const line = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xe8e0d0, transparent: true, opacity: 0.7 }));
    line.frustumCulled = false; g.add(line);
    strings = { bar, line, ends: [[-2.4, 0, 0, armL.hand], [2.4, 0, 0, armR.hand], [0, 0, 1.4, headAnchor]] };
  }

  const light = new THREE.PointLight(T.eye, 70, 30 * Math.max(1, T.scale * 0.7), 2); light.position.set(0, T.headY * T.scale * 0.5, 3 * Math.max(1, T.scale * 0.6)); g.add(light);
  const aura = new THREE.Mesh(new THREE.PlaneGeometry(10 * Math.max(1, T.scale * 0.6), 10 * Math.max(1, T.scale * 0.6)), glowMat(T.eye, 0.45));
  aura.rotation.x = -Math.PI / 2; aura.position.y = 0.08; g.add(aura);
  g.userData = { inner, body, neck, head, jaw, headAnchor, armL, armR, armL2, armR2, legL, legR, light, eyeGlow, skin, strings, tail, tentacles };
  return g;
}

// ---------------------------------------------------------------------------
// Audio (synthesized)
// ---------------------------------------------------------------------------
const sfx = {
  ctx: null,
  init() {
    if (this.ctx) { this.ctx.resume(); return; }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.55 * settings().vol; this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 2, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;
    } catch (e) { this.ctx = null; }
  },
  tone(freq, dur, type = 'sine', vol = 0.3, when = 0, slideTo = null) {
    if (!this.ctx || vol <= 0.0001) return;
    const t = this.ctx.currentTime + when, o = this.ctx.createOscillator(), gn = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(vol, t + 0.015); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn).connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  },
  noise(dur, vol, freq, type = 'lowpass', slideTo = null, when = 0) {
    if (!this.ctx || vol <= 0.0001) return;
    const t = this.ctx.currentTime + when, s = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), gn = this.ctx.createGain();
    s.buffer = this.noiseBuf; f.type = type; f.frequency.setValueAtTime(freq, t);
    if (slideTo) f.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(gn).connect(this.master); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  },
  key() { this.tone(880, 0.25, 'triangle', 0.25); this.tone(1318.5, 0.35, 'triangle', 0.22, 0.09); this.tone(1760, 0.6, 'sine', 0.16, 0.18); },
  drink() { this.noise(0.3, 0.25, 3000, 'highpass'); this.tone(500, 0.3, 'sine', 0.2, 0.1, 1200); },
  gate() { [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.55, 'triangle', 0.2, i * 0.09)); },
  release() { this.tone(70, 2.2, 'sawtooth', 0.3, 0, 38); this.tone(73, 2.2, 'sawtooth', 0.2, 0, 40); this.noise(2, 0.25, 900, 'lowpass', 80); },
  roar(type = 'stalker') {
    const vo = MONSTERS[type].voice, base = vo.roar;
    this.tone(base, 1.6, 'sawtooth', 0.35, 0, base * 0.35);
    this.tone(base * 1.06, 1.6, 'sawtooth', 0.25, 0.05, base * 0.33);
    if (vo.wail) this.tone(base * 1.5, 1.8, 'sine', 0.2, 0, base * 0.5);
    if (vo.laugh) this.laugh(base * 1.4, 1);
    if (vo.creak) this.creak(1);
    this.noise(1.4, 0.4, 1800, 'bandpass', 200);
  },
  laugh(f, v) { for (let i = 0; i < 6; i++) { this.tone(f * (1 - i * 0.05), 0.13, 'square', 0.1 * v, 0.1 + i * 0.17, f * 0.8); this.noise(0.12, 0.12 * v, f * 3, 'bandpass', null, 0.1 + i * 0.17); } },
  creak(v) { for (let i = 0; i < 3; i++) this.noise(0.25, 0.3 * v, 300 + i * 120, 'bandpass', 700 + i * 200, i * 0.3); },
  scream(type = 'stalker') {
    const base = MONSTERS[type].voice.scream;
    this.tone(base, 1.3, 'sawtooth', 0.4, 0, 70); this.tone(base * 1.33, 1.1, 'square', 0.15, 0, 90);
    this.noise(1.2, 0.6, 4000, 'bandpass', 150); this.tone(45, 1.5, 'sine', 0.6, 0.05, 30);
  },
  chomp(v = 1) { this.noise(0.2, 0.9 * v, 900, 'lowpass', 120); this.tone(95, 0.35, 'sine', 0.7 * v, 0, 38); this.noise(0.12, 0.5 * v, 2600, 'bandpass', 800, 0.03); this.noise(0.1, 0.35 * v, 4000, 'highpass', null, 0.08); },
  gulp() { this.tone(320, 0.55, 'sine', 0.45, 0, 70); this.noise(0.5, 0.3, 500, 'lowpass', 90, 0.05); this.tone(60, 0.6, 'sine', 0.5, 0.25, 35); },
  heartbeat(v) { this.tone(62, 0.16, 'sine', 0.55 * v); this.tone(54, 0.2, 'sine', 0.42 * v, 0.17); },
  boost() { this.noise(0.6, 0.35, 400, 'bandpass', 5000); },
  punch(when = 0) { this.noise(0.3, 0.7, 1400, 'lowpass', 150, when); this.tone(70, 0.45, 'sine', 0.8, when, 32); },
  charge() { this.tone(110, 3, 'sawtooth', 0.12, 0, 880); this.tone(220, 3, 'triangle', 0.1, 0, 1760); this.noise(3, 0.15, 400, 'bandpass', 6000); },
  whisper(v) { for (let i = 0; i < 4; i++) { const f = 900 + Math.random() * 2200; this.noise(0.3 + Math.random() * 0.35, 0.2 * v, f, 'bandpass', f * (0.5 + Math.random()), i * 0.17 + Math.random() * 0.1); } },
  growl(type, v) {
    const vo = MONSTERS[type].voice, b = vo.growl;
    if (vo.laugh && Math.random() < 0.5) { this.laugh(b * 3, v); return; }
    if (vo.creak) this.creak(v * 0.8);
    if (vo.click) { for (let i = 0; i < 6; i++) this.noise(0.05, 0.25 * v, 2500, 'bandpass', null, i * 0.06); } // clicking
    this.tone(b, 0.9, 'sawtooth', 0.13 * v, 0, b * 0.8); this.tone(b * 1.04, 0.9, 'square', 0.05 * v, 0.03, b * 0.75);
    this.noise(0.8, 0.22 * v, 280, 'lowpass', 120);
  },
  screech() { this.tone(1900, 0.7, 'sawtooth', 0.13, 0, 700); this.tone(2040, 0.7, 'sawtooth', 0.11, 0, 760); this.noise(0.5, 0.3, 5000, 'highpass'); this.tone(42, 0.7, 'sine', 0.5, 0, 30); },
  howl() { this.tone(280, 2.4, 'sawtooth', 0.11, 0, 140); this.tone(420, 2.2, 'triangle', 0.1, 0.15, 200); this.tone(297, 2.4, 'sawtooth', 0.07, 0.1, 150); this.noise(2, 0.14, 1200, 'bandpass', 300); },
  tension(d) {
    const n = this.droneNodes;
    if (!n || Math.abs(d - (n.last || 0)) < 0.02) return;
    n.last = d; const t = this.ctx.currentTime;
    n.f.frequency.setTargetAtTime(220 + d * 650, t, 0.3);
    n.g2.gain.setTargetAtTime(0.0001 + d * d * 0.07, t, 0.4);
  },
  jump() { this.tone(300, 0.15, 'square', 0.05, 0, 520); },
  wallJump() { this.noise(0.12, 0.3, 900, 'bandpass'); this.tone(380, 0.18, 'square', 0.06, 0, 760); },
  land(v) { this.noise(0.15, 0.25 * v, 300, 'lowpass'); },
  step(v = 1) { this.noise(0.07, 0.07 * v, 900 + Math.random() * 500, 'bandpass'); },
  thud(v) { this.tone(48, 0.25, 'sine', 0.5 * v, 0, 30); this.noise(0.12, 0.15 * v, 200, 'lowpass'); },
  click() { this.tone(1800, 0.04, 'square', 0.05); },
  escape() { [523, 659, 784, 1046].forEach((f, i) => { this.tone(f, 0.8, 'triangle', 0.2, i * 0.12); this.tone(f * 1.5, 0.8, 'sine', 0.08, i * 0.12); }); },
  boom() { this.noise(0.8, 0.35, 600, 'lowpass', 80); this.tone(90, 0.5, 'sine', 0.3, 0, 40); },
  drone(on) {
    if (!this.ctx) return;
    if (on && !this.droneNodes) {
      const g = this.ctx.createGain(); g.gain.value = 0.0001; g.gain.exponentialRampToValueAtTime(0.06, this.ctx.currentTime + 2);
      const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260;
      const o1 = this.ctx.createOscillator(), o2 = this.ctx.createOscillator();
      o1.type = o2.type = 'sawtooth'; o1.frequency.value = 55; o2.frequency.value = 55.6;
      o1.connect(f); o2.connect(f); f.connect(g).connect(this.master); o1.start(); o2.start();
      // a dissonant high layer that swells when monsters are close
      const g2 = this.ctx.createGain(); g2.gain.value = 0.0001;
      const f2 = this.ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 900; f2.Q.value = 3;
      const o3 = this.ctx.createOscillator(), o4 = this.ctx.createOscillator();
      o3.type = o4.type = 'sawtooth'; o3.frequency.value = 233.1; o4.frequency.value = 329.6;
      o3.connect(f2); o4.connect(f2); f2.connect(g2).connect(this.master); o3.start(); o4.start();
      this.droneNodes = { g, o1, o2, f, g2, o3, o4 };
    } else if (!on && this.droneNodes) {
      const { g, o1, o2, g2, o3, o4 } = this.droneNodes, t = this.ctx.currentTime;
      g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
      g2.gain.cancelScheduledValues(t); g2.gain.setValueAtTime(Math.max(0.0001, g2.gain.value), t); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
      o1.stop(t + 0.9); o2.stop(t + 0.9); o3.stop(t + 0.9); o4.stop(t + 0.9); this.droneNodes = null;
    }
  },
};

// ---------------------------------------------------------------------------
// HUD
// ---------------------------------------------------------------------------
const ui = {
  hud: $('hud'), teamPill: $('teamPill'), menu: $('menu'), pause: $('pause'), results: $('results'), touch: $('touch'),
  phase: $('phase'), timer: $('timer'), keysPill: $('keysPill'), huntPill: $('huntPill'),
  staminaFill: $('staminaFill'), staminaText: $('staminaText'), hiddenTag: $('hiddenTag'),
  vignette: $('vignette'), flash: $('flash'), fade: $('fade'), toasts: $('toasts'), caption: $('caption'), skip: $('skipBtn'),
  splash: $('splash'), splashTitle: $('splashTitle'), splashSub: $('splashSub'),
  minimap: $('minimap'), crosshair: $('crosshair'), static: $('static'),
  teeth: $('teeth'), teethTop: $('teethTop'), teethBot: $('teethBot'),
  itemPill: $('itemPill'), exitArrow: $('exitArrow'), exitArrowIcon: $('exitArrowIcon'), exitDist: $('exitDist'), tGhost: $('tGhost'), tBomb: $('tBomb'),
};
{ // TV static that creeps in when monsters are near
  const [c, g] = makeCanvas(256, 256), img = g.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) { const v = Math.random() * 255; img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; }
  g.putImageData(img, 0, 0);
  ui.static.style.backgroundImage = `url(${c.toDataURL()})`;
}
let splashTimer = null;
function splash(title, sub, color) {
  ui.splashTitle.textContent = title; ui.splashTitle.style.color = color; ui.splashSub.textContent = sub || '';
  ui.splash.classList.remove('show', 'hide'); void ui.splash.offsetWidth; ui.splash.classList.add('show');
  clearTimeout(splashTimer);
  splashTimer = setTimeout(() => { ui.splash.classList.remove('show'); ui.splash.classList.add('hide'); }, 3000);
}
function toast(text, color = '#fff') {
  const d = document.createElement('div');
  d.className = 'toast'; d.textContent = text; d.style.color = color; d.style.borderColor = color + '99';
  ui.toasts.appendChild(d);
  while (ui.toasts.children.length > 5) ui.toasts.firstChild.remove();
  setTimeout(() => { d.style.opacity = '0'; setTimeout(() => d.remove(), 400); }, 4200);
}
function flash(color, opacity) {
  ui.flash.style.transition = 'none'; ui.flash.style.background = color; ui.flash.style.opacity = opacity;
  void ui.flash.offsetWidth; ui.flash.style.transition = 'opacity 0.6s ease-out'; ui.flash.style.opacity = 0;
}
function bump(el) { el.classList.add('bump'); setTimeout(() => el.classList.remove('bump'), 250); }
function setCaption(text) {
  if (text) { ui.caption.textContent = text; ui.caption.classList.add('on'); } else ui.caption.classList.remove('on');
}

// ---------------------------------------------------------------------------
// Input: keyboard + mouse + touch
// ---------------------------------------------------------------------------
const keys = {};
const input = { joyX: 0, joyY: 0, jumpQueued: false, jumpHeld: false, sprintTouch: false };
let camYaw = 0, camPitch = 0.05, dragging = false, showMap = true;
let firstPerson = save.view !== 'tp';
let isTouch = window.matchMedia('(pointer: coarse)').matches;

function pitchLimits() { return firstPerson ? [-1.35, 1.35] : [-0.25, 1.25]; }
function look(dx, dy) {
  const k = settings().sens;
  camYaw -= dx * 0.0026 * k;
  const [lo, hi] = pitchLimits();
  camPitch = clamp(camPitch + dy * 0.0022 * k, lo, hi);
}
function setView(fp, announce = true) {
  firstPerson = fp; save.view = fp ? 'fp' : 'tp'; writeSave();
  const [lo, hi] = pitchLimits(); camPitch = clamp(fp ? camPitch : Math.max(camPitch, 0.25), lo, hi);
  if (announce && game.state === 'play') toast(fp ? '👁 First person' : '🎥 Third person', '#cdb8ff');
  renderMenu();
}
function toggleFlashlight() { flashlightOn = !flashlightOn; sfx.click(); }
function tryLock() {
  if (isTouch) return;
  try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ }
}
const locked = () => document.pointerLockElement === canvas;

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
  if (game.cine && (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape')) { game.skipCine(); return; }
  if (!e.repeat) {
    if (e.code === 'Space') input.jumpQueued = true;
    if (e.code === 'KeyV') setView(!firstPerson);
    if (e.code === 'KeyF') toggleFlashlight();
    if (e.code === 'KeyQ') game.useGhost();
    if (e.code === 'KeyE') game.useBomb();
    if (e.code === 'KeyM') { showMap = !showMap; ui.minimap.classList.toggle('hidden', !showMap); }
  }
  keys[e.code] = true;
  if ((e.code === 'KeyP' || (e.code === 'Escape' && !locked())) && game.state === 'play' && game.player && game.player.state === 'alive') setPaused(!game.paused);
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
document.addEventListener('mousemove', (e) => { if ((locked() || dragging) && !game.cine) look(e.movementX, e.movementY); });
canvas.addEventListener('mousedown', () => {
  if (game.cine) { game.skipCine(); return; }
  if (game.state === 'play' && !game.paused) { if (!locked()) tryLock(); dragging = true; }
});
window.addEventListener('mouseup', () => { dragging = false; });
document.addEventListener('pointerlockchange', () => {
  if (!locked() && game.state === 'play' && !game.paused && !game.cine && game.player && game.player.state === 'alive') setPaused(true);
});
ui.skip.addEventListener('click', () => game.skipCine());

// touch controls
function enableTouch() {
  if (isTouch) return;
  isTouch = true;
  document.body.classList.add('touch');
  game.refreshTouch();
}
window.addEventListener('touchstart', enableTouch, { passive: true });
if (isTouch) document.body.classList.add('touch');
{
  const zone = $('joyZone'), base = $('joyBase'), knob = $('joyKnob');
  let jid = null, cx = 0, cy = 0;
  const R = 55;
  const reset = () => { jid = null; input.joyX = input.joyY = 0; knob.style.transform = ''; base.style.left = ''; base.style.top = ''; base.style.bottom = ''; };
  zone.addEventListener('pointerdown', (e) => {
    if (jid !== null) return;
    jid = e.pointerId; zone.setPointerCapture(e.pointerId);
    const r = zone.getBoundingClientRect();
    cx = e.clientX; cy = e.clientY;
    base.style.left = `${e.clientX - r.left}px`; base.style.top = `${e.clientY - r.top - 65}px`; base.style.bottom = 'auto';
  });
  zone.addEventListener('pointermove', (e) => {
    if (e.pointerId !== jid) return;
    let dx = e.clientX - cx, dy = e.clientY - cy;
    const d = Math.hypot(dx, dy);
    if (d > R) { dx = (dx / d) * R; dy = (dy / d) * R; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    input.joyX = dx / R; input.joyY = dy / R;
  });
  for (const ev of ['pointerup', 'pointercancel']) zone.addEventListener(ev, (e) => { if (e.pointerId === jid) reset(); });

  const lz = $('lookZone');
  let lid = null, lx = 0, ly = 0;
  lz.addEventListener('pointerdown', (e) => { if (lid !== null) return; lid = e.pointerId; lz.setPointerCapture(e.pointerId); lx = e.clientX; ly = e.clientY; });
  lz.addEventListener('pointermove', (e) => {
    if (e.pointerId !== lid || game.cine) return;
    look((e.clientX - lx) * 1.7, (e.clientY - ly) * 1.7); lx = e.clientX; ly = e.clientY;
  });
  for (const ev of ['pointerup', 'pointercancel']) lz.addEventListener(ev, (e) => { if (e.pointerId === lid) lid = null; });

  const btn = (id, down, up) => {
    const el = $(id);
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); down(el); });
    if (up) for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) el.addEventListener(ev, () => up(el));
  };
  btn('tJump', () => { input.jumpQueued = true; input.jumpHeld = true; }, () => { input.jumpHeld = false; });
  btn('tSprint', (el) => { input.sprintTouch = !input.sprintTouch; el.classList.toggle('on', input.sprintTouch); });
  btn('tView', () => setView(!firstPerson));
  btn('tLight', () => toggleFlashlight());
  btn('tGhost', () => game.useGhost());
  btn('tBomb', () => game.useBomb());
  btn('tPause', () => { if (game.state === 'play' && game.player && game.player.state === 'alive' && !game.cine) setPaused(!game.paused); });
}

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------
class Player {
  constructor(spawn) {
    this.pos = V(spawn.x, 0, spawn.z);
    this.vel = V(0, 0, 0);
    this.vy = 0; this.onGround = true;
    this.facing = 0;
    this.maxStamina = CFG.maxStamina + save.upgrades.stamina * CFG.upgrades.stamina.per;
    this.sprintSpeed = CFG.sprint + save.upgrades.speed * CFG.upgrades.speed.per;
    this.stamina = this.maxStamina; this.exhausted = false; this.sprinting = false;
    this.boostUntil = 0; this.padCooldown = 0;
    this.hidden = false; this.hiddenBush = null;
    this.state = 'alive';
    this.anim = 0; this.stepAcc = 0; this.landDip = 0;
    this.wallNormal = V(0, 0, 0); this.wallTime = -9; this.wallJumps = 0; this.airLock = 0; this.wallJumpCount = 0;
    this.mesh = buildRunner(); scene.add(this.mesh);
    this.ghosts = 0; this.bombs = 0; this.ghostT = 0;
  }
  update(dt, now, control) {
    const f = V(Math.sin(camYaw), 0, Math.cos(camYaw));
    const r = V(-Math.cos(camYaw), 0, Math.sin(camYaw));
    const mv = V(0, 0, 0);
    if (control) {
      if (keys.KeyW || keys.ArrowUp) mv.add(f);
      if (keys.KeyS || keys.ArrowDown) mv.sub(f);
      if (keys.KeyD || keys.ArrowRight) mv.add(r);
      if (keys.KeyA || keys.ArrowLeft) mv.sub(r);
      if (Math.abs(input.joyX) + Math.abs(input.joyY) > 0.08) { mv.addScaledVector(f, -input.joyY); mv.addScaledVector(r, input.joyX); }
    }
    const amt = Math.min(1, mv.length());
    const moving = amt > 0.1;
    if (moving) mv.normalize().multiplyScalar(amt);

    const wantSprint = control && (keys.ShiftLeft || keys.ShiftRight || input.sprintTouch) && moving;
    this.sprinting = false;
    if (wantSprint && !this.exhausted && this.stamina > 0) {
      this.sprinting = true;
      this.stamina = Math.max(0, this.stamina - CFG.drain * dt);
      if (this.stamina <= 0) { this.exhausted = true; toast('💨 Out of breath!', '#ff9a5a'); }
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + CFG.regen * dt * (moving ? 0.7 : 1));
    }
    if (this.exhausted && this.stamina >= this.maxStamina * 0.35) this.exhausted = false;

    let speed = this.sprinting ? this.sprintSpeed : CFG.walk;
    if (this.exhausted) speed = CFG.walk - 3;
    if (now < this.boostUntil) speed += CFG.padBonus;
    if (this.sticky) speed *= 0.5; // sticky chocolate
    const target = mv.multiplyScalar(speed);
    if (this.airLock > 0) this.airLock -= dt;
    else {
      const slip = this.onGround && ZONES[world.zoneAt(this.pos.x, this.pos.z)].slippery;
      const k = 1 - Math.exp(-(this.onGround ? (slip ? 2.2 : 14) : 7) * dt);
      this.vel.x = lerp(this.vel.x, target.x, k); this.vel.z = lerp(this.vel.z, target.z, k);
    }

    this.pos.x += this.vel.x * dt; this.pos.z += this.vel.z * dt;
    collide(this.pos, 1.0);

    // wall probe (for wall jumps / slides)
    if (!this.onGround) {
      const probe = this.pos.clone();
      collide(probe, 1.5);
      const dx = probe.x - this.pos.x, dz = probe.z - this.pos.z, d = Math.hypot(dx, dz);
      if (d > 1e-4) { this.wallNormal.set(dx / d, 0, dz / d); this.wallTime = now; }
    }

    const jumpPressed = control && input.jumpQueued;
    input.jumpQueued = false;
    const jumpHeld = control && (keys.Space || input.jumpHeld);
    if ((jumpPressed || jumpHeld) && this.onGround) {
      this.vy = CFG.jumpVel; this.onGround = false; sfx.jump();
    } else if (jumpPressed && !this.onGround && now - this.wallTime < 0.22 && this.wallJumps < CFG.maxWallJumps) {
      this.vy = CFG.wallJumpVel;
      this.vel.x = this.wallNormal.x * CFG.wallKick + this.vel.x * 0.25;
      this.vel.z = this.wallNormal.z * CFG.wallKick + this.vel.z * 0.25;
      this.airLock = 0.12; this.wallJumps++; this.wallJumpCount++;
      this.wallTime = -9;
      sfx.wallJump(); game.fovKick = 6;
      burst(this.pos.clone().add(V(-this.wallNormal.x, 2.5, -this.wallNormal.z)), 0xb08cff, 10, 6, 0.4, 2);
      if (this.wallJumps === CFG.maxWallJumps) toast('🧱 Max wall jumps! Touch the ground to reset', '#b08cff');
    }

    const wasAir = !this.onGround, fallSpeed = -this.vy;
    this.vy -= (LV().gravity || CFG.gravity) * dt;
    if (!this.onGround && this.vy < 0 && now - this.wallTime < 0.06 && moving) this.vy = Math.max(this.vy, -14); // wall slide
    this.pos.y += this.vy * dt;
    const g = groundAt(this.pos.x, this.pos.z, 1.0, this.pos.y);
    if (this.pos.y <= g) {
      this.pos.y = g; this.vy = 0; this.onGround = true;
      if (wasAir && fallSpeed > 25) { this.landDip = Math.min(1, fallSpeed / 70); sfx.land(this.landDip); }
    } else this.onGround = this.pos.y - g < 0.05;
    if (this.onGround) this.wallJumps = 0;
    this.landDip = Math.max(0, this.landDip - dt * 4);

    // hiding
    let bush = null;
    for (const b of world.bushes) if (Math.hypot(this.pos.x - b.x, this.pos.z - b.z) < b.r && this.pos.y < 6) { bush = b; break; }
    if (bush !== this.hiddenBush) {
      if (this.hiddenBush && this.hiddenBush.mesh) { this.hiddenBush.mesh.material.opacity = 1; this.hiddenBush.mesh.material.depthWrite = true; }
      if (bush && bush.mesh) { bush.mesh.material.opacity = 0.35; bush.mesh.material.depthWrite = false; }
      this.hiddenBush = bush;
    }
    this.ghostT = Math.max(0, this.ghostT - dt);
    this.hidden = (!!bush || this.ghostT > 0) && this.state === 'alive';
    document.body.classList.toggle('ghosting', this.ghostT > 0);

    // lava burns your stamina
    const hz = this.pos.y < 0.6 && this.state === 'alive' ? world.hazards.find((h) => this.pos.x > h.x0 && this.pos.x < h.x1 && this.pos.z > h.z0 && this.pos.z < h.z1) : null;
    this.sticky = !!hz && (hz.kind === 'choco' || hz.kind === 'water');
    if (hz && hz.kind === 'lava') {
      this.stamina = Math.max(0, this.stamina - 45 * dt);
      if (this.stamina <= 0) this.exhausted = true;
      this.burnT = (this.burnT || 0) - dt;
      if (this.burnT <= 0) { this.burnT = 0.5; flash('#ff4a0a', 0.25); sfx.noise(0.3, 0.2, 2000, 'highpass'); burst(this.pos.clone().add(V(0, 0.5, 0)), 0xff6a1a, 6, 4, 0.5, 4); }
    }

    // speed pads
    this.padCooldown -= dt;
    if (this.state === 'alive' && this.padCooldown <= 0 && this.pos.y < 1) {
      for (const p of world.pads) if (Math.abs(this.pos.x - p.x) < 4.5 && Math.abs(this.pos.z - p.z) < 4.5) {
        this.boostUntil = now + CFG.padDuration; this.padCooldown = 1;
        flash('#50dcff', 0.3); sfx.boost(); toast('⚡ SPEED BOOST!', '#5fd8ff'); break;
      }
    }

    // footsteps
    const hs = Math.hypot(this.vel.x, this.vel.z);
    if (this.onGround && hs > 2) {
      this.stepAcc += hs * dt;
      if (this.stepAcc > (this.sprinting ? 6 : 4.6)) { this.stepAcc = 0; sfx.step(this.sprinting ? 1.3 : 0.9); }
    }
    this.animate(dt, hs);
  }
  animate(dt, hs) {
    if (hs > 0.5) this.facing = Math.atan2(this.vel.x, this.vel.z);
    const m = this.mesh;
    m.position.copy(this.pos);
    let dy = this.facing - m.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    m.rotation.y += dy * Math.min(1, dt * 14);
    m.rotation.x = lerp(m.rotation.x, this.sprinting ? 0.18 : 0, dt * 8);
    this.anim += dt * (4 + hs * 0.45);
    const sw = Math.sin(this.anim) * 0.9 * Math.min(1, hs / 14);
    const u = m.userData;
    if (!this.onGround) { u.legL.rotation.x = 0.6; u.legR.rotation.x = -0.4; u.armL.rotation.x = -2.4; u.armR.rotation.x = -2.4; }
    else { u.legL.rotation.x = sw; u.legR.rotation.x = -sw; u.armL.rotation.x = -sw * 0.9; u.armR.rotation.x = sw * 0.9; }
  }
  dispose() { scene.remove(this.mesh); if (this.hiddenBush && this.hiddenBush.mesh) this.hiddenBush.mesh.material.opacity = 1; }
}

// ---------------------------------------------------------------------------
// Hunter AI
// ---------------------------------------------------------------------------
class Hunter {
  constructor(index, typeKey) {
    this.index = index;
    this.typeKey = typeKey;
    this.T = MONSTERS[this.typeKey];
    this.home = V([0, -9, 9][index % 3] * Math.max(1, this.T.scale * 0.9), 0, 0);
    this.pos = V(this.home.x, -60, 0);
    this.vel = V(0, 0, 0);
    this.active = false; this.released = false;
    this.path = null; this.pi = 0; this.lastPath = -99; this.goal = null;
    this.lastKnown = null; this.patrolGoal = null; this.chasing = false; this.moveTarget = null;
    this.enraged = false; this.frenzy = false;
    this.think = Math.random() * 0.1; this.speed = 0; this.facing = Math.PI;
    this.stuckT = 0; this.stuckPos = V(0, 0, 0); this.strikes = 0;
    this.anim = Math.random() * 10; this.stepAcc = 0; this.flare = 0;
    this.twitch = V(0, 0, 0); this.twitchT = 1; this.blink = 0; this.growlT = 2 + Math.random() * 3;
    this.mesh = buildMonsterMesh(this.typeKey); this.mesh.position.copy(this.pos); scene.add(this.mesh);
  }
  spawn() { this.active = true; this.pos.set(this.home.x, 0, this.home.z); this.stuckPos.copy(this.pos); }
  release() { this.released = true; }
  computePath(goal, now) {
    this.lastPath = now; this.goal = goal.clone();
    this.path = findPath(world.nav, this.pos.x, this.pos.z, goal.x, goal.z);
    this.pi = this.path ? Math.min(1, this.path.length - 1) : 0;
  }
  advancePath(smoothPath) {
    if (!this.path) return null;
    const p = this.path;
    while (this.pi < p.length && Math.hypot(p[this.pi].x - this.pos.x, p[this.pi].z - this.pos.z) < 2) this.pi++;
    if (smoothPath) while (this.pi < p.length - 1 && navClear(world.nav, this.pos.x, this.pos.z, p[this.pi + 1].x, p[this.pi + 1].z)) this.pi++;
    if (this.pi >= p.length) { this.path = null; return null; }
    return p[this.pi];
  }
  newPatrolGoal(player) {
    const pts = world.patrol;
    if (player && player.state === 'alive' && Math.random() < 0.45) {
      const tx = player.pos.x + (Math.random() - 0.5) * 90, tz = player.pos.z + (Math.random() - 0.5) * 90;
      let best = pts[0], bd = Infinity;
      for (const p of pts) { const d = (p.x - tx) ** 2 + (p.z - tz) ** 2; if (d < bd) { bd = d; best = p; } }
      return best;
    }
    for (let k = 0; k < 12; k++) { const p = pts[Math.floor(Math.random() * pts.length)]; if (Math.hypot(p.x - this.pos.x, p.z - this.pos.z) < 190) return p; }
    return pts[Math.floor(Math.random() * pts.length)];
  }
  decide(now, player, D) {
    const alive = player.state === 'alive';
    let detected = false, dist = Infinity;
    if (alive) {
      dist = Math.hypot(player.pos.x - this.pos.x, player.pos.z - this.pos.z);
      const zoneSight = ZONES[world.zoneAt(player.pos.x, player.pos.z)].sight;
      const hear = this.T.hear * (player.sprinting ? 1.6 : 1);
      if (player.hidden) detected = dist <= CFG.hiddenRange;
      else if (this.frenzy) detected = true;
      else detected = dist <= hear || (dist <= this.T.sight * zoneSight && !sightBlocked(this.pos.x, this.pos.z, player.pos.x, player.pos.z, 4.5 * clamp(this.T.scale * 0.8, 1, 3))); // giants see over things
    }
    const chase = D.chase + this.T.speed + LV().speedBonus + (this.enraged ? CFG.enragedBonus : 0) + (this.frenzy ? 1 : 0);
    if (detected) {
      if (!this.chasing && dist > 12) this.spotted = true;
      this.chasing = true;
      this.lastKnown = player.pos.clone(); this.lastKnown.y = 0;
      this.speed = chase;
      const direct = dist < 40 && player.pos.y < 6 && !sightBlocked(this.pos.x, this.pos.z, player.pos.x, player.pos.z, 1) && navClear(world.nav, this.pos.x, this.pos.z, player.pos.x, player.pos.z);
      if (direct || dist < 4) {
        this.path = null;
        this.moveTarget = V(player.pos.x + player.vel.x * 0.15, 0, player.pos.z + player.vel.z * 0.15);
      } else {
        if (!this.path || now - this.lastPath > 0.5 || (this.goal && this.goal.distanceTo(this.lastKnown) > 6)) this.computePath(this.lastKnown, now);
        this.moveTarget = this.advancePath(true) || this.lastKnown;
      }
    } else if (this.lastKnown) {
      this.chasing = false;
      this.speed = chase - 2;
      if (!this.path || (this.goal && this.goal.distanceTo(this.lastKnown) > 2)) this.computePath(this.lastKnown, now);
      this.moveTarget = this.advancePath(true);
      if (!this.moveTarget || Math.hypot(this.pos.x - this.lastKnown.x, this.pos.z - this.lastKnown.z) < 5) { this.lastKnown = null; this.path = null; }
    } else {
      this.chasing = false;
      this.speed = D.patrol + this.T.speed * 0.5 + (this.enraged ? 2 : 0);
      if (!this.patrolGoal || Math.hypot(this.pos.x - this.patrolGoal.x, this.pos.z - this.patrolGoal.z) < 6) { this.patrolGoal = this.newPatrolGoal(player); this.path = null; }
      if (!this.path) { this.computePath(this.patrolGoal, now); if (!this.path) this.patrolGoal = null; }
      this.moveTarget = this.advancePath(true);
    }
  }
  // another monster saw the player: come running to that spot
  alert(spot) {
    if (this.chasing) return;
    this.lastKnown = spot.clone(); this.lastKnown.y = 0; this.path = null; this.patrolGoal = null;
  }
  update(dt, now, player, D, listener = player) {
    if (!this.active) return;
    this.anim += dt;
    this.target = player;
    if (this.stunT > 0) { this.stunT -= dt; this.vel.set(0, 0, 0); this.animate(dt, listener); return; } // 💥 dazed by a flash bomb
    if (this.pauseT > 0) { this.pauseT -= dt; this.vel.set(0, 0, 0); this.animate(dt, listener); return; }
    if (this.released) {
      this.think -= dt;
      if (this.think <= 0) { this.think = 0.1; this.decide(now, player, D); }
      if (this.path && !this.chasing) this.moveTarget = this.advancePath(false) || this.moveTarget;

      const desired = V(0, 0, 0);
      if (this.moveTarget) {
        const dx = this.moveTarget.x - this.pos.x, dz = this.moveTarget.z - this.pos.z, d = Math.hypot(dx, dz);
        if (d > 0.4) desired.set((dx / d) * this.speed, 0, (dz / d) * this.speed);
      }
      this.vel.lerp(desired, 1 - Math.exp(-8 * dt));
      this.pos.x += this.vel.x * dt; this.pos.z += this.vel.z * dt;
      collide(this.pos, 1.3, 0.6);
      this.pos.y = groundAt(this.pos.x, this.pos.z, 1.3, 0.5, 0.6);

      this.stuckT += dt;
      if (this.stuckT > 1.2) {
        if (this.moveTarget && this.pos.distanceTo(this.stuckPos) < 1.5) {
          this.strikes++; this.path = null;
          if (this.strikes >= 3) { this.patrolGoal = null; this.lastKnown = null; this.strikes = 0; }
        } else this.strikes = 0;
        this.stuckPos.copy(this.pos); this.stuckT = 0;
      }

      this.noises(dt, listener);
      const reach = Math.max(1, this.T.scale * 0.75);
      for (const q of game.everyone()) {
        if (!q || q.state !== 'alive') continue;
        if (Math.hypot(q.pos.x - this.pos.x, q.pos.z - this.pos.z) < CFG.catchRadius * reach && q.pos.y < CFG.catchHeight * reach) { game.caughtBy(this, q); break; }
      }
    }
    this.animate(dt, listener);
  }
  // heavy footsteps, growls and ground shakes you can hear/feel when it's close to YOU
  noises(dt, listener) {
      const hs = Math.hypot(this.vel.x, this.vel.z);
      const pd = Math.hypot(listener.pos.x - this.pos.x, listener.pos.z - this.pos.z);
      this.stepAcc += hs * dt;
      if (this.stepAcc > (this.T.posture === 'crawl' ? 4 : 7) && this.T.posture !== 'float') { this.stepAcc = 0; if (pd < 50) sfx.thud(clamp(1 - pd / 50, 0, 1) * (this.T.posture === 'crawl' ? 0.5 : 0.9) * (this.T.bulk || 1)); }
      this.growlT -= dt;
      if (this.growlT <= 0) { this.growlT = (this.chasing ? 1.6 : 4) + Math.random() * 3; if (pd < 45) sfx.growl(this.typeKey, clamp(1 - pd / 45, 0, 1)); }

      if (this.T.giant && hs > 2 && pd < 110) game.shake = Math.max(game.shake, 0.35 * (1 - pd / 110) * (0.6 + 0.4 * Math.abs(Math.sin(this.anim * 4)))); // the ground shakes
  }
  // multiplayer guests: the host sends where the monsters are, we glide them there
  netSet(a) {
    if (!this.netPos) this.netPos = V(0, 0, 0);
    this.netPos.set(a[0], a[1], a[2]); this.netF = a[3]; this.chasing = !!a[4]; this.active = !!a[5]; this.stunT = a[6] ? 0.4 : 0;
    if (!this.netSynced && !game.cine) { this.pos.copy(this.netPos); this.netSynced = true; }
  }
  netUpdate(dt, listener) {
    this.anim += dt;
    if (this.netPos && this.netSynced) {
      const px = this.pos.x, pz = this.pos.z, k = Math.max(dt, 1e-4);
      this.pos.lerp(this.netPos, 1 - Math.exp(-10 * dt));
      this.vel.set((this.pos.x - px) / k, 0, (this.pos.z - pz) / k);
      if (Math.hypot(this.vel.x, this.vel.z) < 0.5) this.facing = this.netF;
      if (this.active && game.released) this.noises(dt, listener);
    } else if (this.netPos && !game.cine) { this.pos.copy(this.netPos); this.netSynced = true; }
    this.animate(dt, listener);
  }
  animate(dt, player) {
    const m = this.mesh, u = m.userData;
    m.position.copy(this.pos);
    const hs = Math.hypot(this.vel.x, this.vel.z);
    const caught = game.catcher === this;
    const hunting = this.chasing || caught;
    if (hs > 0.5) this.facing = Math.atan2(this.vel.x, this.vel.z);
    if (caught && player) this.facing = Math.atan2(player.pos.x - this.pos.x, player.pos.z - this.pos.z);
    let dy = this.facing - m.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    m.rotation.y += dy * Math.min(1, dt * 8);
    const sw = Math.sin(this.anim * (5 + hs * 0.35)) * 0.85 * Math.min(1.2, hs / 16);
    const P = this.T.posture, k = 1 - Math.exp(-6 * dt);
    if (P === 'crawl') {
      const tilt = caught ? 0.45 : 1.15; // rears up when it gets you
      u.body.rotation.x = lerp(u.body.rotation.x, tilt, k);
      u.inner.position.y = -0.6;
      u.legL.hip.rotation.x = -tilt * 0.8 + sw; u.legR.hip.rotation.x = -tilt * 0.8 - sw;
      u.legL.knee.rotation.x = u.legR.knee.rotation.x = 0.6;
      u.armL.sh.rotation.x = -tilt - 1.0 - sw; u.armR.sh.rotation.x = -tilt - 1.0 + sw;
      u.armL.el.rotation.x = u.armR.el.rotation.x = caught ? -0.6 : 1.3;
      if (u.armL2) {
        u.armL2.sh.rotation.x = -tilt - 0.6 + sw; u.armR2.sh.rotation.x = -tilt - 0.6 - sw;
        u.armL2.el.rotation.x = u.armR2.el.rotation.x = 1.1;
        u.armL2.sh.rotation.z = -0.35; u.armR2.sh.rotation.z = 0.35;
      }
      u.armL.sh.rotation.z = -0.35; u.armR.sh.rotation.z = 0.35;
      u.neck.rotation.x = -tilt + 0.15 + Math.sin(this.anim * 9) * (this.chasing ? 0.12 : 0.04);
      if (u.tail) u.tail.forEach((t, k) => { t.rotation.z = Math.sin(this.anim * 3 + k * 0.6) * 0.12; if (k) t.rotation.x = 0.5 + Math.sin(this.anim * (hunting ? 6 : 2) + k) * 0.08; });
    } else if (P === 'float') {
      u.inner.position.y = 1.4 + Math.sin(this.anim * 1.8) * 0.5;
      if (u.tentacles) u.tentacles.forEach((t, k) => { t.rotation.x = Math.sin(this.anim * 2 + k) * 0.35 - (this.chasing ? 0.4 : 0); t.rotation.z = Math.cos(this.anim * 1.7 + k * 1.3) * 0.3; });
      u.body.rotation.x = lerp(u.body.rotation.x, caught ? 0.6 : this.chasing ? 0.4 : 0.12, k);
      const reach = hunting ? -1.55 : -0.35;
      u.armL.sh.rotation.x = reach + Math.sin(this.anim * 2.3) * 0.25; u.armR.sh.rotation.x = reach + Math.sin(this.anim * 2.3 + 1) * 0.25;
      if (this.T.strings) { // jerky puppet limbs
        u.armL.sh.rotation.x += this.twitch.x * 2.5; u.armR.sh.rotation.x -= this.twitch.y * 1.5;
        u.legL.hip.rotation.x = Math.sin(this.anim * 2) * 0.35 + this.twitch.z * 0.6; u.legR.hip.rotation.x = -Math.sin(this.anim * 2) * 0.35 - this.twitch.x;
        u.legL.knee.rotation.x = u.legR.knee.rotation.x = 0.4;
      }
      u.armL.sh.rotation.z = -0.2; u.armR.sh.rotation.z = 0.2;
      u.armL.el.rotation.x = u.armR.el.rotation.x = hunting ? -0.15 : 0.35;
      // flickers in and out of existence
      this.blink -= dt;
      if (this.T.flicker && !caught && this.blink < -0.2 && Math.random() < dt * (hunting ? 1.5 : 0.5)) this.blink = 0.06 + Math.random() * 0.12;
      u.inner.visible = caught || this.blink <= 0;
    } else {
      u.legL.hip.rotation.x = sw; u.legR.hip.rotation.x = -sw;
      u.legL.knee.rotation.x = Math.max(0, -sw) * 1.1; u.legR.knee.rotation.x = Math.max(0, sw) * 1.1;
      if (hunting || this.T.mummy) {
        u.armL.sh.rotation.x = -1.35 + sw * 0.2; u.armR.sh.rotation.x = -1.35 - sw * 0.2;
        u.armL.el.rotation.x = u.armR.el.rotation.x = -0.25;
      } else { // long arms dangle and sway
        u.armL.sh.rotation.x = -sw * 0.45; u.armR.sh.rotation.x = sw * 0.45;
        u.armL.el.rotation.x = u.armR.el.rotation.x = -0.15;
      }
      u.armL.sh.rotation.z = -0.12; u.armR.sh.rotation.z = 0.12;
      u.body.rotation.x = lerp(u.body.rotation.x, caught ? 0.9 : this.chasing ? 0.35 : 0.18, k);
      u.neck.rotation.y = hunting ? 0 : Math.sin(this.anim * 0.9) * 0.6;
      u.neck.rotation.x = caught ? -0.5 : Math.sin(this.anim * 1.7) * 0.08 - 0.15;
    }
    // jerky twitches of the head
    this.twitchT -= dt;
    if (this.twitchT <= 0) {
      const big = Math.random() < (hunting ? 0.55 : 0.3);
      if (big) this.twitch.set((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 1.1, (Math.random() - 0.5) * 1.5);
      else this.twitch.set(0, 0, 0);
      this.twitchT = big ? 0.12 + Math.random() * 0.45 : 0.5 + Math.random() * 2;
    }
    if (caught) u.head.rotation.set(0, 0, lerp(u.head.rotation.z, 0.45, k));
    else u.head.rotation.set(this.twitch.x, this.twitch.y, this.twitch.z);
    // jaw: shut-ish while prowling, snapping while it chases, wide open when it gets you
    const jawT = caught ? (this.eatJaw ?? 1.05) : this.chasing ? 0.5 + Math.sin(this.anim * 14) * 0.15 : 0.06 + Math.max(0, Math.sin(this.anim * 0.8)) * 0.14;
    u.jaw.rotation.x = lerp(u.jaw.rotation.x, jawT, 1 - Math.exp(-14 * dt));
    this.flare = Math.max(0, this.flare - dt * 0.8);
    const eyeK = 1 + (hunting ? 0.35 : 0) + this.flare * 0.8 + (Math.random() < 0.02 ? -0.6 : 0);
    for (const s of u.eyeGlow) s.scale.setScalar(s.userData.base * eyeK);
    u.light.intensity = ((hunting ? 120 : 55) + this.flare * 400) * (0.8 + Math.random() * 0.2) * (this.T.lightK ?? 1);
    if (this.stunT > 0) { // dazed: head spins, eyes go dim, jaw hangs open
      u.head.rotation.set(Math.sin(this.anim * 7) * 0.25, this.anim * 5, 0.5);
      u.jaw.rotation.x = 0.7;
      for (const s of u.eyeGlow) s.scale.setScalar(s.userData.base * 0.3);
      u.light.intensity *= 0.2;
    }
    if (u.strings) { // keep the puppet strings attached
      const S = u.strings, arr = S.line.geometry.attributes.position.array, a = V(0, 0, 0), b = V(0, 0, 0);
      S.bar.position.set(Math.sin(this.anim * 1.3) * 0.6, 22 + Math.sin(this.anim * 1.8) * 0.5 + u.inner.position.y, 0);
      S.bar.rotation.z = Math.sin(this.anim * 1.1) * 0.15;
      m.updateMatrixWorld(true);
      S.ends.forEach(([x, y, z, obj], k) => {
        m.worldToLocal(S.bar.localToWorld(a.set(x, y, z)));
        m.worldToLocal(obj.getWorldPosition(b));
        arr.set([a.x, a.y, a.z, b.x, b.y, b.z], k * 6);
      });
      S.line.geometry.attributes.position.needsUpdate = true;
    }
  }
  dispose() { scene.remove(this.mesh); }
}

// ---------------------------------------------------------------------------
// Minimap
// ---------------------------------------------------------------------------
let mapStatic = null;
const MAP_W = 360, MAP_H = 380, MAP_PAD = 14;
function mapXY(x, z) {
  const s = (MAP_W - MAP_PAD * 2) / world.size;
  return [MAP_PAD + (world.half - x) * s, MAP_PAD + 20 * s + (world.half - z) * s];
}
function buildMapStatic() {
  const [c, g] = makeCanvas(MAP_W, MAP_H);
  const s = (MAP_W - MAP_PAD * 2) / world.size;
  const [x0, y0] = mapXY(world.half, world.half);
  g.fillStyle = 'rgba(40,36,56,0.9)'; g.fillRect(x0, y0, world.size * s, world.size * s);
  const N = world.N, C = world.C;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const [cx, cy] = mapXY(-world.half + (i + 1) * C, -world.half + (j + 1) * C);
    g.fillStyle = ZONES[world.zones[j * N + i]].map; g.fillRect(cx - 0.5, cy - 0.5, C * s + 1, C * s + 1);
  }
  g.strokeStyle = '#ff3b52'; g.lineWidth = 3; g.strokeRect(x0, y0, world.size * s, world.size * s);
  for (const r of world.mapRects) {
    const [cx, cy] = mapXY(r.x, r.z);
    g.fillStyle = r.color;
    if (r.round) { g.beginPath(); g.arc(cx, cy, (r.w / 2) * s, 0, Math.PI * 2); g.fill(); }
    else g.fillRect(cx - (r.w / 2) * s, cy - (r.d / 2) * s, r.w * s, r.d * s);
  }
  const [lx, ly] = mapXY(0, 0);
  g.strokeStyle = '#ff2a40'; g.lineWidth = 2; g.beginPath(); g.arc(lx, ly, 10 * s, 0, Math.PI * 2); g.stroke();
  mapStatic = c;
}
function drawMap(now) {
  const g = ui.minimap.getContext('2d');
  g.clearRect(0, 0, MAP_W, MAP_H);
  g.drawImage(mapStatic, 0, 0);
  const s = (MAP_W - MAP_PAD * 2) / world.size;
  const p = game.player;
  const [ex, ey] = mapXY(world.exit.x, world.half);
  g.fillStyle = game.exitOpen ? '#78ff8f' : '#ff4d5e';
  g.fillRect(ex - (world.exit.gapW / 2) * s, ey - 4, world.exit.gapW * s, 8);
  g.font = '700 18px Fredoka, sans-serif'; g.textAlign = 'center'; g.fillText('EXIT', ex, ey - 8);
  const dot = (x, z, col, r) => { const [mx, my] = mapXY(x, z); g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 10; g.beginPath(); g.arc(mx, my, r, 0, Math.PI * 2); g.fill(); g.shadowBlur = 0; };
  for (const k of world.keys) if (!k.taken && Math.hypot(k.x - p.pos.x, k.z - p.pos.z) < 110) dot(k.x, k.z, '#ffd257', 6 + Math.sin(now * 6));
  for (const d of world.drinks) if (!d.taken && Math.hypot(d.x - p.pos.x, d.z - p.pos.z) < 90) dot(d.x, d.z, '#3cf0ff', 4.5);
  for (const it of world.items) if (!it.taken && Math.hypot(it.x - p.pos.x, it.z - p.pos.z) < 90) dot(it.x, it.z, it.kind === 'ghost' ? '#cf8bff' : '#ffe05a', 4.5);
  for (const h of game.hunters) {
    if (!h.active || h.pos.y < -10) continue;
    if (Math.hypot(h.pos.x - p.pos.x, h.pos.z - p.pos.z) > 50 && !h.chasing) continue;
    dot(h.pos.x, h.pos.z, h.T.eyeCss, 7);
  }
  for (const r of net.remotes.values()) if (r.state === 'alive' && !r.fresh) dot(r.pos.x, r.pos.z, hex6(MP_COLORS[(r.id - 1) % MP_COLORS.length]), 6);
  const [px, py] = mapXY(p.pos.x, p.pos.z);
  g.save(); g.translate(px, py); g.rotate(Math.atan2(-Math.cos(camYaw), -Math.sin(camYaw)));
  g.fillStyle = '#5fd8ff'; g.strokeStyle = '#fff'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(11, 0); g.lineTo(-7, 7); g.lineTo(-3, 0); g.lineTo(-7, -7); g.closePath(); g.fill(); g.stroke();
  g.restore();
}

// ---------------------------------------------------------------------------
// Multiplayer: rooms with a 5-letter code. Browsers connect straight to each other
// (WebRTC through PeerJS; the free PeerJS server is only used so players can find each other).
// The host runs the monsters, the timer and the keys; everyone sends their own position.
// ---------------------------------------------------------------------------
const MP_PREFIX = 'nightfall-runners-v1-';
const MP_COLORS = [0x35c6ff, 0xff5aa8, 0x78ff8f, 0xffd257, 0xb98cff, 0xff8a3a];
const MP_MAX = 6;
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const r2 = (v) => Math.round(v * 100) / 100;
const hex6 = (c) => '#' + c.toString(16).padStart(6, '0');
const escHtml = (t) => String(t).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const STATES = ['alive', 'caught', 'escaped'];

class RemotePlayer {
  constructor(id, name) {
    this.id = id; this.name = name;
    const col = MP_COLORS[(id - 1) % MP_COLORS.length];
    this.mesh = buildRunner(col); scene.add(this.mesh);
    this.tag = textSprite(name, hex6(col)); this.tag.scale.set(6, 1.9, 1); this.tag.position.y = 7.6; this.mesh.add(this.tag);
    this.pos = V(0, -100, 0); this.target = V(0, -100, 0); this.vel = V(0, 0, 0);
    this.ry = 0; this.spd = 0; this.state = 'alive'; this.hidden = false; this.sprinting = false; this.anim = 0; this.fresh = true; this.lockCaught = false;
  }
  set(a) { // [x, y, z, rotY, speed, state, hidden, sprinting]
    this.target.set(a[0], a[1], a[2]); this.ry = a[3]; this.spd = a[4];
    const st = STATES[a[5]] || 'alive';
    if (!(this.lockCaught && st === 'alive')) this.state = st;
    this.hidden = !!a[6]; this.sprinting = !!a[7];
    if (this.fresh) { this.pos.copy(this.target); this.fresh = false; }
  }
  update(dt) {
    const px = this.pos.x, pz = this.pos.z, k = Math.max(dt, 1e-4);
    this.pos.lerp(this.target, 1 - Math.exp(-12 * dt));
    this.vel.set((this.pos.x - px) / k, 0, (this.pos.z - pz) / k);
    const m = this.mesh, u = m.userData;
    m.visible = this.state === 'alive' && !this.fresh && !(game.cine && game.cine.kind === 'battle');
    m.position.copy(this.pos);
    let d = this.ry - m.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); m.rotation.y += d * Math.min(1, dt * 12);
    this.anim += dt * (4 + this.spd * 0.45);
    const sw = Math.sin(this.anim) * 0.9 * Math.min(1, this.spd / 14);
    u.legL.rotation.x = sw; u.legR.rotation.x = -sw; u.armL.rotation.x = -sw * 0.9; u.armR.rotation.x = sw * 0.9;
    this.tag.material.opacity = this.hidden ? 0.45 : 1;
  }
  dispose() { scene.remove(this.mesh); }
}

const net = {
  peer: null, role: null, code: '', myId: 1, nextId: 2,
  conns: new Map(), // host: peer id -> { conn, id, name }
  hostConn: null, // client: the connection to the host
  lobby: [], // [{ id, name }]
  remotes: new Map(), // id -> RemotePlayer, during a round
  sendT: 0, overT: -1, status: '', snaps: 0,
  get on() { return !!this.role; },
  get isHost() { return this.role === 'host'; },
  get isClient() { return this.role === 'client'; },

  setStatus(t) { this.status = t; renderLobby(); },
  myName() { return String(save.name || 'Runner').slice(0, 12); },
  newCode() { return Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join(''); },
  ready() { if (typeof Peer === 'undefined') { this.setStatus('Multiplayer could not load (are you offline?)'); return false; } return true; },

  create(code = null) {
    if (!this.ready()) return;
    this.leave(true);
    this.code = code || this.newCode();
    this.setStatus('Creating a room…');
    const peer = this.peer = new Peer(MP_PREFIX + this.code);
    peer.on('open', () => { this.role = 'host'; this.myId = 1; this.nextId = 2; this.lobby = [{ id: 1, name: this.myName() }]; this.setStatus('Room ready! Tell your friends the code.'); renderMenu(); });
    peer.on('error', (e) => { if (e.type === 'unavailable-id' && !code) this.create(); else this.setStatus('Room error: ' + e.type); });
    peer.on('connection', (conn) => {
      conn.on('data', (d) => this.hostRecv(conn, d));
      conn.on('close', () => this.dropClient(conn));
    });
  },
  join(code) {
    if (!this.ready()) return;
    code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length < 4) { this.setStatus('Type the room code first.'); return; }
    this.leave(true);
    this.code = code;
    this.setStatus(`Joining ${code}…`);
    const peer = this.peer = new Peer();
    peer.on('open', () => {
      const conn = this.hostConn = peer.connect(MP_PREFIX + code, { reliable: true, serialization: 'json' });
      conn.on('open', () => { this.role = 'client'; conn.send({ t: 'hello', name: this.myName() }); this.setStatus('Connected! Waiting for the host to start…'); renderMenu(); });
      conn.on('data', (d) => this.clientRecv(d));
      conn.on('close', () => {
        const was = this.role;
        this.leave(true);
        this.setStatus('Disconnected from the room.');
        if (was) { toast('📴 The host left the room', '#ff8a95'); if (game.state !== 'menu') game.showMenu(); }
      });
    });
    peer.on('error', (e) => this.setStatus(e.type === 'peer-unavailable' ? `There's no room called ${code}. Check the code!` : 'Connection error: ' + e.type));
  },
  leave(quiet = false) {
    if (this.peer) { try { this.peer.destroy(); } catch (e) { /* ignore */ } }
    this.peer = null; this.role = null; this.conns.clear(); this.hostConn = null; this.lobby = [];
    this.clearRemotes();
    if (!quiet) this.setStatus('');
    renderMenu();
  },
  send(m) { if (this.hostConn && this.hostConn.open) this.hostConn.send(m); },
  broadcast(m) { for (const c of this.conns.values()) if (c.conn.open) c.conn.send(m); },
  syncLobby() {
    if (this.isHost) this.broadcast({ t: 'lobby', players: this.lobby, level: game.level, diff: game.diff, inGame: game.state !== 'menu' });
    renderLobby();
  },

  hostRecv(conn, d) {
    let c = this.conns.get(conn.peer);
    if (d.t === 'hello') {
      if (c) return;
      if (this.conns.size >= MP_MAX - 1) { conn.send({ t: 'full' }); setTimeout(() => conn.close(), 300); return; }
      c = { conn, id: this.nextId++, name: String(d.name || 'Runner').slice(0, 12) };
      this.conns.set(conn.peer, c); this.lobby.push({ id: c.id, name: c.name });
      conn.send({ t: 'welcome', id: c.id });
      toast(`👋 ${c.name} joined the room`, '#78ff8f');
      this.syncLobby();
      return;
    }
    if (!c) return;
    if (d.t === 'me') { const r = this.remotes.get(c.id); if (r && Array.isArray(d.s)) r.set(d.s); }
    else if (d.t === 'key') { const k = world && world.keys[d.i]; if (k && !k.taken && game.state === 'play') game.collectKey(k, c.name); }
    else if (d.t === 'item') { const it = world && world.items[d.i]; if (it && !it.taken) { game.takeItem(it); this.broadcast({ t: 'item', i: d.i }); } }
    else if (d.t === 'stun' && game.state === 'play') { game.stunAround(V(d.x, 0, d.z), c.name); }
  },
  dropClient(conn) {
    const c = this.conns.get(conn.peer);
    if (!c) return;
    this.conns.delete(conn.peer); this.lobby = this.lobby.filter((p) => p.id !== c.id);
    const r = this.remotes.get(c.id); if (r) { r.dispose(); this.remotes.delete(c.id); }
    toast(`👋 ${c.name} left`, '#ff8a95');
    this.syncLobby();
  },
  clientRecv(d) {
    if (d.t === 'welcome') this.myId = d.id;
    else if (d.t === 'full') { this.leave(true); this.setStatus('That room is full (6 players max).'); }
    else if (d.t === 'lobby') {
      this.lobby = d.players; game.diff = d.diff;
      if (game.level !== d.level && game.state === 'menu') game.setLevel(d.level, true); else renderMenu();
      if (d.inGame && game.state === 'menu') this.setStatus('A round is being played. You\'ll join the next one!');
    } else if (d.t === 'start') game.netStart(d);
    else if (d.t === 'snap') { this.snaps++; game.applySnap(d); }
    else if (d.t === 'key') game.netKey(d.i, d.n, d.by);
    else if (d.t === 'item') { const it = world && world.items[d.i]; if (it && !it.taken) game.takeItem(it); }
    else if (d.t === 'stunned') { if (game.state === 'play') toast(`💥 ${d.by} stunned ${d.n} monster${d.n === 1 ? '' : 's'}!`, '#ffe05a'); }
    else if (d.t === 'exit') { if (!game.exitOpen) game.openExit(); }
    else if (d.t === 'battle') { if (game.state === 'play' && !(game.cine && game.cine.kind === 'battle')) { game.endCine(); game.startBattle(); } }
    else if (d.t === 'caught') {
      const h = game.hunters[d.h];
      if (d.id === this.myId) { if (h && game.player && game.player.state === 'alive') game.caught(h); }
      else { const p = this.lobby.find((x) => x.id === d.id); if (p && game.state === 'play') toast(`💀 ${p.name} was caught by ${h ? h.T.name : 'a monster'}!`, '#ff8a95'); }
    } else if (d.t === 'over') { if (game.state === 'play') game.roundOver(); }
  },
  makeRemotes() {
    this.clearRemotes();
    for (const p of this.lobby) if (p.id !== this.myId) this.remotes.set(p.id, new RemotePlayer(p.id, p.name));
  },
  clearRemotes() { for (const r of this.remotes.values()) r.dispose(); this.remotes.clear(); },
  me() {
    const p = game.player;
    return [r2(p.pos.x), r2(p.pos.y), r2(p.pos.z), r2(p.mesh.rotation.y), r2(Math.hypot(p.vel.x, p.vel.z)), STATES.indexOf(p.state), p.hidden ? 1 : 0, p.sprinting ? 1 : 0];
  },
  alive() { let n = game.player && game.player.state === 'alive' ? 1 : 0; for (const r of this.remotes.values()) if (r.state === 'alive') n++; return n; },
  sent: 0,
  tick(dt) {
    if (!this.on || game.state !== 'play' || !game.player) return;
    for (const r of this.remotes.values()) r.update(dt);
    if (this.isHost && this.overT > 0 && !(game.cine && game.cine.kind === 'battle')) {
      this.overT -= dt;
      if (this.overT <= 0) { this.broadcast({ t: 'over' }); game.roundOver(); return; }
    }
    this.sendT -= dt;
    if (this.sendT > 0) return;
    this.sendT = 1 / 15;
    if (this.isClient) { this.send({ t: 'me', s: this.me() }); return; }
    const ps = [[this.myId, ...this.me()]];
    for (const r of this.remotes.values()) ps.push([r.id, r2(r.target.x), r2(r.target.y), r2(r.target.z), r2(r.ry), r2(r.spd), STATES.indexOf(r.state), r.hidden ? 1 : 0, r.sprinting ? 1 : 0]);
    this.sent++;
    this.broadcast({
      t: 'snap', e: r2(game.elapsed), rel: game.released ? 1 : 0, fr: game.frenzy ? 1 : 0,
      h: game.hunters.map((h) => [r2(h.pos.x), r2(h.pos.y), r2(h.pos.z), r2(h.facing), h.chasing ? 1 : 0, h.active ? 1 : 0, h.stunT > 0 ? 1 : 0]), p: ps,
    });
    if (this.overT < 0 && this.alive() === 0) this.overT = 3; // nobody left running: end the round
  },
};

function renderLobby() {
  if (!$('mpRoom')) return;
  const on = net.on;
  $('mpJoinRow').classList.toggle('hidden', on);
  $('mpRoom').classList.toggle('hidden', !on);
  $('mpStatus').textContent = net.status;
  if (on) {
    $('mpCodeShow').textContent = net.code;
    $('mpPlayers').innerHTML = net.lobby.map((p) => `<span class="mpP" style="border-color:${hex6(MP_COLORS[(p.id - 1) % MP_COLORS.length])}">${p.id === 1 ? '👑 ' : ''}${escHtml(p.name)}${p.id === net.myId ? ' (you)' : ''}</span>`).join('');
  }
  const pb = $('playBtn');
  pb.disabled = net.isClient;
  pb.textContent = net.isClient ? '⏳ Waiting for the host…' : net.isHost ? `▶ PLAY (${net.lobby.length} players)` : '▶ PLAY';
}

// ---------------------------------------------------------------------------
// Game flow + cutscenes
// ---------------------------------------------------------------------------
const tmpV = V(0, 0, 0), fogTarget = new THREE.Color(), FOG_RED = new THREE.Color(0x3a0508);
const LV = () => game.L || LEVELS[game.level - 1];

// falling snow (level 2) / drifting embers (level 3) that follow the camera
const weather = { pts: null, kind: null, seed: null };
function setWeather(kind) {
  if (weather.pts) { scene.remove(weather.pts); weather.pts.geometry.dispose(); weather.pts.material.dispose(); weather.pts = null; }
  weather.kind = kind;
  if (!kind) return;
  const n = { snow: 2600, sand: 2200, ash: 1400, embers: 800, bubbles: 900, sprinkles: 1600, rain: 3000 }[kind], pos = new Float32Array(n * 3);
  weather.seed = new Float32Array(n);
  for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 140; pos[i * 3 + 1] = Math.random() * 70; pos[i * 3 + 2] = (Math.random() - 0.5) * 140; weather.seed[i] = Math.random(); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const geoCols = kind === 'sprinkles' ? new Float32Array(n * 3).map((_, i) => [[1, 0.3, 0.5], [0.3, 0.8, 1], [1, 0.9, 0.3], [0.6, 0.4, 1], [0.4, 1, 0.6]][Math.floor(i / 3) % 5][i % 3]) : null;
  const mat = kind === 'sprinkles' ? new THREE.PointsMaterial({ vertexColors: true, map: GLOW_TEX, size: 0.6, transparent: true, depthWrite: false })
    : kind === 'rain' ? new THREE.PointsMaterial({ color: 0x9ab8d8, size: 0.22, transparent: true, opacity: 0.6, depthWrite: false })
    : kind === 'bubbles' ? new THREE.PointsMaterial({ color: 0xbfefff, map: GLOW_TEX, size: 0.9, transparent: true, opacity: 0.55, depthWrite: false })
    : kind === 'snow' || kind === 'sand' || kind === 'ash'
    ? new THREE.PointsMaterial({ color: { snow: 0xffffff, sand: 0xd8b070, ash: 0x8a8480 }[kind], map: GLOW_TEX, size: kind === 'sand' ? 0.45 : 0.7, transparent: true, opacity: kind === 'sand' ? 0.7 : 0.9, depthWrite: false })
    : new THREE.PointsMaterial({ color: new THREE.Color(0xff7a2a).multiplyScalar(2.5), map: GLOW_TEX, size: 0.5, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  if (geoCols) geo.setAttribute('color', new THREE.BufferAttribute(geoCols, 3));
  weather.pts = new THREE.Points(geo, mat); weather.pts.frustumCulled = false; scene.add(weather.pts);
}
function updateWeather(dt, t) {
  if (!weather.pts) return;
  const a = weather.pts.geometry.attributes.position.array, c = camera.position, snow = weather.kind === 'snow';
  for (let i = 0, k = 0; i < a.length; i += 3, k++) {
    const sd = weather.seed[k];
    if (weather.kind === 'rain') { a[i] += 3 * dt; a[i + 1] -= (45 + sd * 20) * dt; }
    else if (weather.kind === 'bubbles') { a[i] += Math.sin(t * 2 + sd * 20) * 1.2 * dt; a[i + 1] += (3 + sd * 4) * dt; a[i + 2] += Math.cos(t * 2 + sd * 13) * 1.2 * dt; }
    else if (weather.kind === 'sprinkles') { a[i] += Math.sin(t + sd * 10) * 1.5 * dt; a[i + 1] -= (4 + sd * 3) * dt; a[i + 2] += Math.cos(t + sd * 7) * 1.5 * dt; }
    else if (weather.kind === 'sand') { a[i] += (28 + sd * 18) * dt; a[i + 1] += Math.sin(t * 2 + sd * 30) * 2 * dt; a[i + 2] += Math.sin(t + sd * 9) * 4 * dt; }
    else if (weather.kind === 'ash') { a[i] += Math.sin(t * 0.4 + sd * 10) * 1.5 * dt; a[i + 1] -= (1.5 + sd * 1.5) * dt; a[i + 2] += Math.cos(t * 0.3 + sd * 7) * 1.5 * dt; }
    else {
      a[i] += (snow ? 4 + Math.sin(t * 0.7 + sd * 10) * 2.5 : Math.sin(t + sd * 20) * 1.5) * dt;
      a[i + 1] += (snow ? -(5 + sd * 4) : 1.2 + sd * 2) * dt;
      a[i + 2] += (snow ? Math.cos(t * 0.5 + sd * 7) * 1.5 : Math.cos(t + sd * 13) * 1.5) * dt;
    }
    const dx = a[i] - c.x, dz = a[i + 2] - c.z, dy = a[i + 1] - c.y;
    if (dx > 70) a[i] -= 140; else if (dx < -70) a[i] += 140;
    if (dz > 70) a[i + 2] -= 140; else if (dz < -70) a[i + 2] += 140;
    if (dy < -25) a[i + 1] += 75; else if (dy > 50) a[i + 1] -= 75;
  }
  weather.pts.geometry.attributes.position.needsUpdate = true;
}
const game = {
  state: 'loading', paused: false, diff: save.diff in DIFF ? save.diff : 'normal',
  player: null, hunters: [], elapsed: 0, keys: 0, exitOpen: false, released: false, frenzy: false,
  nextExtra: 0, catcher: null, result: null, beatT: 0, time: 0, menuAngle: 0,
  cine: null, shake: 0, fovKick: 0, danger: 0, zone: 'city', whisperT: 4, flickT: 0, lastAlert: -99,
  level: clamp(save.level | 0, 1, LEVELS.length) || 1,

  newWorld(seed = (Math.random() * 1e9) | 0, Lres = null) {
    net.clearRemotes();
    if (this.player) { this.player.dispose(); this.player = null; }
    this.hunters.forEach((h) => h.dispose()); this.hunters = [];
    disposeWorld(world);
    const L = this.L = Lres || resolveLevel(LEVELS[this.level - 1]);
    world = buildWorld(seed, L);
    hemi.color.setHex(L.hemi[0]); hemi.groundColor.setHex(L.hemi[1]); hemi.intensity = L.hemi[2];
    setWeather(L.weather);
    const Z = ZONES[L.center];
    scene.fog.color.setHex(Z.fog); scene.fog.density = Z.density; scene.background.setHex(L.sky);
  },
  setLevel(n, fromHost = false) {
    if (net.isClient && !fromHost) { toast('Only the host can pick the level', '#cdb8ff'); return; }
    if (n === this.level && world) { renderMenu(); return; }
    this.level = n; save.level = n; writeSave();
    if (this.state === 'menu') this.newWorld();
    renderMenu();
    if (net.isHost) net.syncLobby();
  },

  refreshTouch() {
    ui.touch.classList.toggle('hidden', !(isTouch && this.state === 'play'));
  },

  showMenu() {
    this.state = 'menu'; this.paused = false; this.cine = null; this.catcher = null;
    document.body.classList.remove('cine'); setCaption(''); ui.skip.classList.add('hidden'); ui.fade.style.opacity = 0;
    sfx.drone(false);
    document.body.classList.remove('ghosting');
    this.newWorld();
    aimMoon(0, 0);
    ui.static.style.opacity = 0;
    ui.hud.classList.add('hidden'); ui.pause.classList.add('hidden'); ui.results.classList.add('hidden');
    ui.menu.classList.remove('hidden');
    ui.vignette.style.opacity = 0;
    if (locked()) document.exitPointerLock();
    this.refreshTouch();
    renderMenu();
    if (net.isHost) net.syncLobby();
  },

  start(fresh) {
    sfx.init();
    if (fresh) this.newWorld();
    this.state = 'play'; this.paused = false;
    const spawn = world.spawns[Math.floor(Math.random() * world.spawns.length)];
    this.player = new Player(spawn);
    camYaw = 0; camPitch = firstPerson ? 0.05 : 0.32;
    this.hunters = [];
    for (let i = 0; i < CFG.maxHunters; i++) { const h = new Hunter(i, LV().monsters[i]); h.spawn(); this.hunters.push(h); }
    this.elapsed = 0; this.keys = 0; this.exitOpen = false; this.released = false; this.frenzy = false;
    this.catcher = null; this.result = null; this.zone = world.zoneAt(spawn.x, spawn.z); this.lastAlert = -99;
    this.spectating = false;
    if (net.on) { net.makeRemotes(); net.overT = -1; net.sendT = 0; if (net.isHost) net.syncLobby(); }
    this.shake = 0; this.fovKick = 0; this.danger = 0;
    input.jumpQueued = false;
    ui.menu.classList.add('hidden'); ui.results.classList.add('hidden'); ui.pause.classList.add('hidden');
    ui.hud.classList.remove('hidden'); ui.toasts.innerHTML = '';
    buildMapStatic();
    this.refreshTouch();
    sfx.drone(true);
    tryLock();
    this.startIntro();
  },

  // ---------------- cutscene framework ----------------
  beginCine(kind, data) {
    this.cine = { kind, t: 0, ...data };
    document.body.classList.add('cine');
    ui.skip.classList.remove('hidden');
    ui.vignette.style.opacity = 0;
  },
  endCine() {
    if (this.cine && this.cine.kind === 'death') { this.hideTeeth(); if (this.cine.hunter) this.cine.hunter.eatJaw = undefined; }
    this.cine = null;
    document.body.classList.remove('cine');
    ui.skip.classList.add('hidden');
    setCaption('');
    ui.fade.style.opacity = 0;
  },
  skipCine() {
    const c = this.cine;
    if (!c) return;
    if (c.onEnd) { const f = c.onEnd; this.endCine(); f(); }
    else { this.endCine(); ui.fade.style.background = '#000'; this.endMine(); }
  },
  // a cutscene made of camera shots: { d, cap, pos(u), look(u), tick(u, c, dt) }
  playShots(kind, shots, onEnd) {
    for (const h of this.hunters) h.vel.set(0, 0, 0);
    this.beginCine(kind, { shots, idx: -1, local: 0, onEnd, freeze: true, fired: {} });
  },
  updateShots(dt) {
    const c = this.cine;
    c.local += dt; c.t += dt;
    if (c.idx < 0 || c.local >= c.shots[c.idx].d) {
      c.idx++; c.local = 0;
      if (c.idx >= c.shots.length) { const f = c.onEnd; this.endCine(); if (f) f(); return; }
      setCaption(c.shots[c.idx].cap || '');
    }
    const shot = c.shots[c.idx], u = c.local / shot.d;
    if (shot.tick) shot.tick(u, c, dt);
    if (!this.cine) return;
    camera.position.copy(shot.pos(u));
    camera.lookAt(shot.look(u));
    ui.fade.style.background = '#000';
    ui.fade.style.opacity = Math.max(0, 1 - c.local / 0.3).toFixed(3);
    this.applyShake(dt);
  },
  // camera shot looking a monster in the face
  faceCam(h, near = 6, far = 11) {
    const head = () => { h.mesh.updateMatrixWorld(true); return h.mesh.userData.headAnchor.getWorldPosition(V(0, 0, 0)); };
    return {
      pos: (u) => { const f = h.mesh.rotation.y, hd = head(), d = lerp(far, near, smooth(u)) * Math.max(1, h.T.scale * 0.85); return V(hd.x + Math.sin(f) * d, hd.y + 0.6, hd.z + Math.cos(f) * d); },
      look: () => head(),
    };
  },
  nearestHunter() {
    const p = this.player.pos;
    return this.hunters.filter((h) => h.active).reduce((a, b) => (Math.hypot(b.pos.x - p.x, b.pos.z - p.z) < Math.hypot(a.pos.x - p.x, a.pos.z - p.z) ? b : a));
  },
  roarShot(h, c, key, u, at = 0.15) {
    if (c.fired[key] || u < at) return;
    c.fired[key] = true; h.flare = 1.2; h.chasing = true; sfx.roar(h.typeKey); this.shake = 1; flash(h.T.eyeCss, 0.2);
  },

  // ---- monsters released
  startRelease() {
    const L = LV(), hs = this.hunters;
    const big = Math.max(...hs.map((h) => h.T.scale)), kz = big > 1.6 ? big * 0.8 : 1;
    hs.forEach((h) => { h.facing = Math.PI; });
    this.playShots('release', [
      { d: 3, cap: L.released[0], pos: (u) => { const a = lerp(-0.7, 0.7, u); return V(Math.sin(a) * 32 * kz, lerp(3, 7, u) * kz, -Math.cos(a) * 32 * kz); }, look: () => V(0, 6 * kz, 0),
        tick: (u, c) => hs.forEach((h, k) => this.roarShot(h, c, 'r' + k, u, 0.1 + k * 0.25)) },
      { d: 2.2, cap: L.released[1], ...this.faceCam(hs[0], 5, 10),
        tick: (u, c) => { if (!c.fired.s && u > 0.3) { c.fired.s = true; sfx.screech(); this.shake = 1.2; flash('#ff0020', 0.3); } } },
    ], () => this.release());
  },

  // ---- exit gate opens
  showGateOpen() {
    const e = world.exit;
    if (!e.gate.visible) return;
    e.gate.visible = false;
    e.gateSign.userData.draw('🚪 EXIT OPEN', '#78ff8f');
    e.exitPlate.material.color.set(0x50ff78).multiplyScalar(1.5);
    e.gateLight.color.set(0x50ff78);
    burst(V(e.x, 12, e.z), 0x78ff8f, 50, 18, 1.2);
    flash('#78ff8f', 0.35); sfx.gate();
  },

  // ---- Level 4 finale: you grow GIANT and fight the titans
  startBattle() {
    const p = this.player, pm = p.mesh, L = LV();
    this.exitOpen = true; p.state = 'escaped'; p.vel.set(0, 0, 0); net.overT = 1e9;
    for (const h of this.hunters) { h.released = false; h.vel.set(0, 0, 0); h.chasing = false; }
    const c0 = V(0, 0, 0);
    // the fight happens in a scorched arena with a ring of fire (the ruins are hidden so nothing blocks the view)
    for (const o of world.group.children) if (o !== world.ground) o.visible = false;
    const arena = new THREE.Group(); world.group.add(arena);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(165, 64), std(0x1a0c08, { roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.position.y = 0.05; floor.receiveShadow = true; arena.add(floor);
    const ringM = new THREE.Mesh(new THREE.RingGeometry(150, 154, 96), neon(0xff5a1a, 2)); ringM.rotation.x = -Math.PI / 2; ringM.position.y = 0.1; arena.add(ringM);
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2, h = 20 + Math.random() * 25;
      const f = new THREE.Mesh(new THREE.ConeGeometry(3, h, 6), neon(k % 2 ? 0xff5a1a : 0xffa23a, 2.2)); f.position.set(Math.sin(a) * 158, h / 2, Math.cos(a) * 158); arena.add(f);
      const gd = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), glowMat(0xff5a1a, 0.4)); gd.rotation.x = -Math.PI / 2; gd.position.set(Math.sin(a) * 158, 0.12, Math.cos(a) * 158); arena.add(gd);
    }
    const cracks = new THREE.Mesh(new THREE.RingGeometry(0, 165, 64), glowMat(0xff3a0a, 0.18)); cracks.rotation.x = -Math.PI / 2; cracks.position.y = 0.08; arena.add(cracks);
    const G = 6.5, H = 5.8 * G, angs = [0.5, 2.6, 4.4];
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0x3ce6ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
    glow.position.y = 3; glow.scale.setScalar(9); pm.add(glow);
    const pose = (o) => { const u = pm.userData; for (const k of ['legL', 'legR', 'armL', 'armR']) u[k].rotation.x = lerp(u[k].rotation.x, o[k] || 0, 0.3); };
    const place = (h, k, dist, y = 0) => { const a = angs[k]; h.pos.set(c0.x + Math.sin(a) * dist, y, c0.z + Math.cos(a) * dist); h.facing = a + Math.PI; h.mesh.rotation.y = h.facing; };
    const hit = (c, key, u, at, fn) => { if (!c.fired[key] && u > at) { c.fired[key] = true; fn(); } };
    const camAround = (r, y, a) => V(c0.x + Math.sin(a) * r, y, c0.z + Math.cos(a) * r);
    p.pos.copy(c0); pm.position.copy(c0); pm.scale.setScalar(1); pm.rotation.set(0, 0, 0);
    this.hunters.forEach((h, k) => { h.active = true; h.mesh.visible = true; h.mesh.rotation.x = 0; place(h, k, 110); });
    scene.fog.density *= 0.45; aimMoon(c0.x, c0.z);
    const fight = (k) => {
      const h = this.hunters[k], name = h.T.name, a = angs[k];
      const dir = V(Math.sin(a), 0, Math.cos(a)), side = V(dir.z, 0, -dir.x);
      const pt = (dist, y) => V(c0.x + dir.x * dist, y, c0.z + dir.z * dist);
      return {
        d: 4.8, cap: [`${name} charges at you…`, `${name} wants revenge…`, `Last one: ${name}!`][k],
        pos: () => pt(30, H * 0.5).addScaledVector(side, 105).addScaledVector(dir, -12), look: () => pt(30, H * 0.45),
        tick: (u, c) => {
          pm.rotation.y = Math.atan2(dir.x, dir.z); pm.position.y = 0;
          let dist, tilt = 0, y = 0;
          if (u < 0.3) { dist = lerp(110, 26, smooth(u / 0.3)); h.vel.copy(dir).multiplyScalar(-40); } // it charges
          else if (u < 0.48) { const t = (u - 0.3) / 0.18; dist = lerp(26, 44, smooth(t)); tilt = -0.55 * Math.sin(t * Math.PI); h.vel.set(0, 0, 0); } // POW
          else if (u < 0.58) { dist = lerp(44, 24, smooth((u - 0.48) / 0.1)); h.vel.copy(dir).multiplyScalar(-30); } // it tries again
          else { const t = clamp((u - 0.58) / 0.26, 0, 1); dist = lerp(24, 95, t); y = Math.sin(t * Math.PI) * 45; tilt = -1.7 * t; h.vel.set(0, 0, 0); } // UPPERCUT
          place(h, k, dist, y); h.mesh.rotation.x = tilt; h.chasing = true;
          const p1 = u > 0.26 && u < 0.4, p2 = u > 0.55 && u < 0.7;
          pose({ armR: p1 ? -1.7 : -0.5, armL: p2 ? -3 : -0.5, legL: p1 || p2 ? -0.5 : 0, legR: p1 || p2 ? 0.4 : 0 });
          hit(c, 'a' + k, u, 0.29, () => { const at = pt(18, H * 0.55); burst(at, 0xffe86a, 50, 40, 1, 10, 8); burst(at, h.T.eye, 30, 30, 0.8, 6, 8); flash('#ffffff', 0.5); this.shake = 1.6; sfx.punch(); sfx.roar(h.typeKey); setCaption('POW!'); });
          hit(c, 'b' + k, u, 0.58, () => { const at = pt(16, H * 0.7); burst(at, 0x3ce6ff, 70, 50, 1.2, 15, 10); flash('#3ce6ff', 0.6); this.shake = 2; sfx.punch(); sfx.punch(0.08); setCaption('SUPER UPPERCUT!'); });
          hit(c, 'c' + k, u, 0.84, () => {
            const at = h.mesh.position.clone().add(V(0, 15, 0));
            for (let n = 0; n < 4; n++) burst(at.clone().add(V((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30)), h.T.eye, 50, 45, 1.6, 8, 12);
            h.mesh.visible = false; sfx.scream(h.typeKey); sfx.boom(); this.shake = 1.4; setCaption(`${name} is DEFEATED!`);
          });
        },
      };
    };
    this.playShots('battle', [
      { d: 3, cap: `The ${L.keyWord}s are reacting…`, pos: (u) => camAround(16, lerp(5, 9, u), u * 2), look: () => V(c0.x, 3, c0.z),
        tick: (u, c, dt) => {
          pose({ armL: -2.7, armR: -2.7 }); glow.material.opacity = u;
          c.beamT = (c.beamT || 0) - dt;
          if (c.beamT <= 0) { c.beamT = 0.1; burst(V(c0.x + (Math.random() - 0.5) * 8, 3 + Math.random() * 8, c0.z + (Math.random() - 0.5) * 8), 0x3ce6ff, 8, 10, 0.6, 6); }
          hit(c, 'ch', u, 0, () => sfx.charge());
        } },
      { d: 3.4, cap: 'You are GROWING!', pos: (u) => camAround(lerp(18, 125, smooth(u)), lerp(4, H * 0.7, smooth(u)), 2 + u * 0.6), look: (u) => V(c0.x, lerp(3, H * 0.55, smooth(u)), c0.z),
        tick: (u, c) => {
          pm.scale.setScalar(lerp(1, G, smooth(u))); this.shake = Math.max(this.shake, 0.6);
          pose({ armL: -0.6, armR: -0.6, legL: 0.2, legR: -0.2 });
          hit(c, 'g0', u, 0.02, () => sfx.release());
          hit(c, 'g1', u, 0.92, () => { flash('#3ce6ff', 0.6); sfx.boom(); burst(V(c0.x, 2, c0.z), 0x3ce6ff, 80, 60, 1.2, 4, 6); });
        } },
      { d: 3.4, cap: 'Now it\'s YOUR turn.', pos: (u) => camAround(lerp(75, 65, u), 3, 3.5), look: () => V(c0.x, H * 0.6, c0.z),
        tick: (u, c) => { pose({ armL: -0.3, armR: -0.3 }); this.hunters.forEach((h, k) => { place(h, k, 110); this.roarShot(h, c, 'r' + k, u, 0.15 + k * 0.22); }); } },
      fight(0), fight(1), fight(2),
      { d: 4.5, cap: 'You defeated the titans! 🏆', pos: (u) => camAround(95, H * 0.5, 3 + u * 1.2), look: () => V(c0.x, H * 0.55, c0.z),
        tick: (u, c, dt) => {
          pose({ armL: -3, armR: -3 }); pm.position.y = Math.abs(Math.sin(u * 9)) * 8;
          hit(c, 'w', u, 0, () => sfx.escape());
          c.fw = (c.fw || 0) - dt;
          if (c.fw <= 0) { c.fw = 0.3; burst(V(c0.x + (Math.random() - 0.5) * 120, 60 + Math.random() * 40, c0.z + (Math.random() - 0.5) * 120), [0x78ff8f, 0xffd257, 0xff5aa8, 0x5fd8ff][Math.floor(Math.random() * 4)], 40, 30, 1.5, 0, 5); sfx.boom(); }
        } },
    ], () => { this.result = { win: true, reason: 'You grew GIANT and defeated all three titans!' }; ui.fade.style.background = '#000'; this.finish(); });
  },

  // ---- frenzy: last 45 seconds
  startFrenzy() {
    this.frenzy = true;
    for (const h of this.hunters) h.frenzy = true;
    const h = this.nearestHunter();
    this.playShots('frenzy', [
      { d: 1.6, cap: 'The night is almost over…', pos: (u) => V(this.player.pos.x, lerp(6, 60, smooth(u)), this.player.pos.z - lerp(4, 30, smooth(u))), look: () => V(this.player.pos.x, 0, this.player.pos.z) },
      { d: 2.6, cap: 'FRENZY. They can ALL sense you now.', ...this.faceCam(h, 4.5, 9),
        tick: (u, c) => { this.roarShot(h, c, 'f', u, 0.1); if (!c.fired.h && u > 0.5) { c.fired.h = true; sfx.howl(); flash('#ff0020', 0.4); } } },
    ], () => splash('FRENZY!', 'Hide or run!', '#ff3344'));
  },

  // ---------------- multiplayer ----------------
  hostStart() {
    sfx.init();
    this.newWorld();
    const L = this.L;
    net.broadcast({ t: 'start', seed: world.seed, level: this.level, diff: this.diff, L: { center: L.center, corners: L.corners, monsters: L.monsters } });
    this.start(false);
  },
  netStart(d) {
    sfx.init();
    this.level = d.level; this.diff = d.diff;
    this.newWorld(d.seed, { ...LEVELS[d.level - 1], ...d.L });
    net.setStatus('');
    this.start(false);
  },
  applySnap(d) {
    if (!world || this.state !== 'play') return;
    this.elapsed = d.e;
    if (d.rel && !this.released) { this.released = true; splash('THEY ARE LOOSE', 'All three of them. Stay out of sight…', '#ff4d5e'); flash('#c80014', 0.5); sfx.release(); this.shake = 1; }
    if (d.fr && !this.frenzy) this.quickFrenzy();
    d.h.forEach((a, k) => { if (this.hunters[k]) this.hunters[k].netSet(a); });
    for (const a of d.p) {
      if (a[0] === net.myId) continue;
      let r = net.remotes.get(a[0]);
      if (!r) { const lp = net.lobby.find((x) => x.id === a[0]); r = new RemotePlayer(a[0], lp ? lp.name : 'Runner'); net.remotes.set(a[0], r); }
      r.set(a.slice(1));
    }
  },
  netKey(i, n, by) {
    const k = world && world.keys[i];
    if (!k || this.state !== 'play') return;
    if (!k.taken) this.takeKey(k);
    this.keys = n;
    const L = LV(), word = L.keyWord || 'key';
    if (n < CFG.keysNeeded) toast(`${L.keyIcon || '🔑'} ${by === net.myName() ? 'You' : by} found a ${word}! (${n}/${CFG.keysNeeded})`, '#ffd257');
  },
  quickFrenzy() {
    this.frenzy = true;
    for (const h of this.hunters) h.frenzy = true;
    splash('FRENZY!', 'They can ALL sense you now. Hide or run!', '#ff3344'); flash('#ff0020', 0.4); sfx.howl();
  },
  everyone() { return net.on ? [this.player, ...[...net.remotes.values()].filter((r) => !r.fresh)] : [this.player]; }, // skip players we haven't heard from yet
  pickTarget(h) { // monsters go after the closest runner (hidden ones count as further away)
    let best = null, bd = Infinity;
    for (const q of this.everyone()) {
      if (!q || q.state !== 'alive') continue;
      const d = Math.hypot(q.pos.x - h.pos.x, q.pos.z - h.pos.z) + (q.hidden ? 60 : 0);
      if (d < bd) { bd = d; best = q; }
    }
    return best;
  },
  caughtBy(h, q) {
    if (q === this.player) { this.caught(h); return; }
    q.state = 'caught'; q.lockCaught = true;
    h.pauseT = 3.6; h.vel.set(0, 0, 0);
    net.broadcast({ t: 'caught', id: q.id, h: this.hunters.indexOf(h) });
    toast(`💀 ${q.name} was caught by ${h.T.name}!`, '#ff8a95');
  },
  stepHunters(dt, now, D) {
    const p = this.player;
    for (const h of this.hunters) {
      if (this.cine && this.cine.freeze) { h.anim += dt; h.animate(dt, p); continue; }
      if (net.isClient) {
        if (this.cine && h === this.catcher) { h.anim += dt; h.animate(dt, p); } else h.netUpdate(dt, p);
        continue;
      }
      h.update(dt, now, this.pickTarget(h) || p, D, p);
      if (h.spotted) {
        h.spotted = false;
        if (h.target === p) { toast(`👁 ${h.T.name} spotted you!`, h.T.eyeCss); this.shake = Math.max(this.shake, 0.5); sfx.screech(); flash('#ff0020', 0.18); this.flickT = 0.35; }
        this.alertPack(h, now, D);
      }
    }
  },
  // after you're caught or escape: watch your team (multiplayer) or see the results (solo)
  endMine() {
    if (net.on && this.state === 'play') {
      this.spectating = true; ui.fade.style.opacity = 0;
      toast(this.player.state === 'escaped' ? '🎉 You escaped! Watching your team…' : '👻 You were caught. Watching your team…', '#cdb8ff');
    } else this.finish();
  },
  roundOver() {
    if (this.state !== 'play') return;
    if (this.cine) this.endCine();
    if (!this.result) this.result = { win: this.player.state === 'escaped', reason: 'The round is over' };
    this.finish();
  },
  spectateCam(dt) {
    const alive = [...net.remotes.values()].filter((r) => r.state === 'alive' && !r.fresh);
    if (alive.length) {
      const r = alive[Math.floor(this.time / 10) % alive.length], ry = r.mesh.rotation.y;
      const want = V(r.pos.x - Math.sin(ry) * 14, r.pos.y + 9, r.pos.z - Math.cos(ry) * 14);
      camera.position.lerp(want, 1 - Math.exp(-4 * dt));
      camera.lookAt(r.pos.x, r.pos.y + 3, r.pos.z);
      this.specName = r.name; aimMoon(r.pos.x, r.pos.z);
    } else {
      this.menuAngle += dt * 0.08;
      camera.position.set(Math.sin(this.menuAngle) * 200, 110, Math.cos(this.menuAngle) * 200); camera.lookAt(0, 0, 0);
      this.specName = null;
    }
    camera.fov = lerp(camera.fov, 72, 0.1); camera.updateProjectionMatrix();
  },

  startIntro() {
    const L = LV(), st = L.story, half = world.half, ex = world.exit.x, p = this.player.pos;
    const key = world.keys.reduce((a, b) => (Math.hypot(b.x - p.x, b.z - p.z) < Math.hypot(a.x - p.x, a.z - p.z) ? b : a));
    for (const h of this.hunters) h.pos.y = -12 * h.T.scale;
    const big = Math.max(...this.hunters.map((h) => h.T.scale)), kz = big > 1.6 ? big * 0.8 : 1;
    this.playShots('intro', [
      { d: 3.8, cap: st[0], pos: (u) => V(lerp(-half * 0.9, half * 0.7, u), lerp(140, 100, u), lerp(-half * 0.95, -half * 0.3, u)), look: (u) => V(lerp(-60, 60, u), 0, lerp(20, 90, u)) },
      { d: 2.8, cap: st[1], pos: (u) => V(ex - 26 + 12 * u, lerp(16, 9, u), half - 64 + 28 * u), look: () => V(ex, 11, half + 2) },
      { d: 2.8, cap: st[2], pos: (u) => { const a = u * 1.7; return V(key.x + Math.sin(a) * 11, 6, key.z - Math.cos(a) * 11); }, look: () => V(key.x, 3, key.z) },
      { d: 5, cap: st[3], pos: (u) => V(0, lerp(4.5, 7.5, u) * kz, lerp(-48, -26, smooth(u)) * kz), look: (u) => V(0, lerp(2, 8, smooth(u)) * kz, 0),
        tick: (u, c) => {
          [1, 0, 2].forEach((hi, order) => {
            const h = this.hunters[hi], t0 = 0.08 + order * 0.16;
            h.pos.y = lerp(-12 * h.T.scale, 0, smooth((u - t0) / 0.3)); h.facing = Math.PI;
            if (h.T.giant && u > t0 && u < t0 + 0.3) this.shake = Math.max(this.shake, 0.8);
            if (!c.fired[hi] && u > t0 + 0.3) { c.fired[hi] = true; sfx.roar(h.typeKey); this.shake = 0.6 + order * 0.35; h.flare = 1; flash(h.T.eyeCss, 0.2 + order * 0.1); }
            h.chasing = !!c.fired[hi];
          });
          setCaption(u < 0.75 ? st[3] : st[4]);
        } },
      { d: 1.8, cap: 'RUN.', pos: (u) => V(p.x, lerp(42, 4.6, smooth(u)), p.z - lerp(32, 0, smooth(u))), look: (u) => V(p.x, lerp(0, 4.6, smooth(u)), p.z + 24) },
    ], () => this.finishIntro());
  },
  finishIntro() {
    for (const h of this.hunters) { h.pos.y = 0; h.chasing = false; h.flare = 0; }
    this.endCine();
    camYaw = 0; camPitch = firstPerson ? 0.05 : 0.32;
    splash('RUN!', `Level ${this.level}: ${LV().name}. ` + (LV().battle ? `Collect ${CFG.keysNeeded} power cores to grow GIANT` : `Find ${CFG.keysNeeded} keys and escape`), '#ffd257');
    if (isTouch) toast('Left side: move · Right side: look', '#cdb8ff');
    else toast('Click the game to lock your mouse · V camera · F flashlight', '#cdb8ff');
  },

  startDeath(hunter) {
    const dir = V(0, 0, 0); camera.getWorldDirection(dir);
    const p = this.player;
    const eye = V(p.pos.x, p.pos.y + 4.6, p.pos.z);
    const lookStart = eye.clone().addScaledVector(dir, 10);
    this.beginCine('death', { hunter, lookStart, hStart: hunter.pos.clone(), screamed: false, splashed: false });
    ui.skip.classList.add('hidden');
  },
  // the monster lunges, opens wide… and eats you
  updateDeath(dt) {
    const c = this.cine, t = (c.t += dt), p = this.player, h = c.hunter, sc = h.T.scale;
    const eye = V(p.pos.x, p.pos.y + 4.6, p.pos.z);
    const flat = V(eye.x - c.hStart.x, 0, eye.z - c.hStart.z);
    const fd = Math.max(0.01, flat.length()); flat.divideScalar(fd);
    const lungeTo = V(eye.x - flat.x * h.T.lunge, h.pos.y, eye.z - flat.z * h.T.lunge);
    const lu = smooth((t - 0.35) / 0.35);
    h.pos.x = lerp(c.hStart.x, lungeTo.x, lu); h.pos.z = lerp(c.hStart.z, lungeTo.z, lu);
    h.chasing = true; h.facing = Math.atan2(flat.x, flat.z);
    const fire = (key, at, fn) => { if (!c[key] && t > at) { c[key] = true; fn(); } };
    fire('screamed', 0.35, () => { sfx.scream(h.typeKey); this.shake = 1.6; h.flare = 1.4; flash('#ff0010', 0.6); burst(eye.clone().addScaledVector(flat, -1.5), h.T.eye, 30, 10, 0.8, 2); });
    // jaw: wide open, CHOMP, then chewing
    const chews = [1.75, 2.35, 2.95];
    h.eatJaw = t < 0.75 ? 1.05 : t < 1.75 ? 1.55 : 0.35 * Math.abs(Math.sin((t - 1.75) * 5.2));
    h.mesh.updateMatrixWorld(true);
    const head = h.mesh.userData.headAnchor.getWorldPosition(V(0, 0, 0));
    const mouth = head.clone().add(V(0, -0.35 * sc, 0));
    const toCam = eye.clone().sub(mouth); toCam.y = 0; toCam.normalize();
    // the camera gets pulled into the mouth
    const pull = smooth((t - 0.75) / 1.0);
    const inMouth = mouth.clone().addScaledVector(toCam, 0.9 * sc);
    camera.position.copy(eye).lerp(inMouth, pull);
    const look = c.lookStart.clone().lerp(head, smooth(t / 0.35)).lerp(mouth.clone().addScaledVector(toCam, -2 * sc), pull);
    camera.lookAt(look);
    camera.rotateZ(Math.sin(t * 3) * 0.06 * pull);
    // teeth closing around the screen
    let bite = 0;
    if (t > 0.9 && t < 1.75) bite = smooth((t - 0.9) / 0.85) * 0.42;
    else if (t >= 1.75) { const ph = (t - 1.75) * 5.2; bite = Math.min(1, 0.72 + 0.28 * Math.abs(Math.cos(ph))); }
    ui.teethTop.style.transform = `translateY(${((bite - 1) * 100).toFixed(1)}%)`;
    ui.teethBot.style.transform = `translateY(${((1 - bite) * 100).toFixed(1)}%)`;
    ui.teeth.style.opacity = t > 0.85 ? 1 : 0;
    chews.forEach((at, k) => fire('chew' + k, at, () => { sfx.chomp(k === 0 ? 1 : 0.7); this.shake = k === 0 ? 2.2 : 1.2; flash('#ff0010', k === 0 ? 0.75 : 0.35); }));
    fire('splashed', 1.85, () => splash('EATEN!', h.T.caption, h.T.eyeCss));
    fire('gulped', 3.45, () => sfx.gulp());
    ui.static.style.opacity = t > 0.35 && t < 1.75 ? (0.06 + Math.random() * 0.1).toFixed(2) : 0;
    ui.vignette.style.opacity = Math.min(1, t * 2).toFixed(2);
    ui.fade.style.background = '#1a0002';
    ui.fade.style.opacity = (t < 1.75 ? 0 : t < 3.4 ? 0.55 + 0.25 * Math.abs(Math.sin(t * 5.2)) : clamp(0.8 + (t - 3.4) / 0.8, 0, 1)).toFixed(3);
    this.applyShake(dt);
    if (t > 4.4) { h.eatJaw = undefined; this.hideTeeth(); this.endCine(); this.endMine(); }
  },
  hideTeeth() { ui.teeth.style.opacity = 0; ui.teethTop.style.transform = 'translateY(-100%)'; ui.teethBot.style.transform = 'translateY(100%)'; },

  startEscape() {
    this.player.state = 'escaped';
    sfx.escape();
    flash('#ffffff', 0.6);
    splash('YOU ESCAPED!', LV().escape, '#78ff8f');
    this.result = { win: true, reason: `Escaped with ${fmtTime(CFG.roundTime - this.elapsed)} left` };
    if (!net.on) for (const h of this.hunters) { h.released = false; h.vel.set(0, 0, 0); }
    this.beginCine('escape', { fireworks: 0 });
    setCaption(this.level < LEVELS.length ? `Next: ${LEVELS[this.level].emoji} ${LEVELS[this.level].name}…` : '🏆 You survived all three nightmares!');
  },
  updateEscape(dt) {
    const c = this.cine, t = (c.t += dt), p = this.player, ex = world.exit.x, half = world.half;
    p.pos.x = lerp(p.pos.x, ex, 1 - Math.exp(-3 * dt));
    p.pos.z += 17 * dt; p.pos.y = Math.max(0, p.pos.y - 20 * dt);
    p.vel.set(0, 0, 17); p.onGround = true; p.sprinting = true;
    p.mesh.visible = true;
    p.animate(dt, 17);
    camera.position.set(ex + 11, 6.5, half + 38);
    camera.lookAt(p.pos.x, 3.5, p.pos.z);
    c.fireworks -= dt;
    if (c.fireworks <= 0) {
      c.fireworks = 0.35;
      const col = [0x78ff8f, 0xffd257, 0xff5aa8, 0x5fd8ff][Math.floor(Math.random() * 4)];
      burst(V(ex + (Math.random() - 0.5) * 40, 30 + Math.random() * 25, half + 20 + Math.random() * 30), col, 40, 16, 1.4, 0);
      sfx.boom();
    }
    ui.fade.style.background = '#fff';
    ui.fade.style.opacity = clamp((t - 2.8) / 0.7, 0, 1).toFixed(3);
    if (t > 3.6) { this.endCine(); ui.fade.style.background = '#000'; this.endMine(); }
  },

  applyShake(dt) {
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 1.6);
      const s = this.shake * 0.06;
      camera.rotation.x += (Math.random() - 0.5) * s; camera.rotation.y += (Math.random() - 0.5) * s;
    }
  },

  // ---------------- gameplay events ----------------
  release() {
    this.released = true;
    const pts = world.patrol;
    const west = pts.filter((p) => p.x < -60), east = pts.filter((p) => p.x > 60);
    for (const h of this.hunters) {
      if (!h.active) continue;
      h.release();
      const pool = h.index === 1 ? west : h.index === 2 ? east : null;
      if (pool && pool.length) h.patrolGoal = pool[Math.floor(Math.random() * pool.length)];
    }
    splash('THEY ARE LOOSE', 'All three of them. Stay out of sight…', '#ff4d5e');
    flash('#c80014', 0.5); sfx.release(); this.shake = 1;
    for (const h of this.hunters) { h.chasing = false; h.flare = 0; }
  },
  takeKey(k) {
    k.taken = true; k.mesh.visible = false; k.beam.visible = false; k.decal.visible = false;
    sfx.key(); flash('#ffd257', 0.25); bump(ui.keysPill);
    burst(V(k.x, 3, k.z), 0xffc83c, 30, 12, 0.9);
  },
  collectKey(k, by = null) {
    if (k.taken) return;
    this.takeKey(k);
    if (net.isClient) { net.send({ t: 'key', i: world.keys.indexOf(k) }); return; } // the host counts the keys
    this.keys++;
    const L = LV(), word = L.keyWord || 'key';
    if (this.keys < CFG.keysNeeded) toast(`${L.keyIcon || '🔑'} ${by ? by + ' found a ' + word : word[0].toUpperCase() + word.slice(1) + ' found'}! (${this.keys}/${CFG.keysNeeded})`, '#ffd257');
    if (net.isHost) net.broadcast({ t: 'key', i: world.keys.indexOf(k), n: this.keys, by: by || net.myName() });
    if (this.keys >= CFG.keysNeeded && !this.exitOpen) {
      if (L.battle) { if (net.isHost) net.broadcast({ t: 'battle' }); this.startBattle(); }
      else { if (net.isHost) net.broadcast({ t: 'exit' }); this.openExit(); }
    }
  },
  takeItem(it) { it.taken = true; it.mesh.visible = false; it.decal.visible = false; },
  collectItem(it) {
    const p = this.player;
    this.takeItem(it);
    if (it.kind === 'ghost') { p.ghosts = Math.min(3, p.ghosts + 1); toast(`👻 Ghost Potion! Press ${isTouch ? 'the 👻 button' : 'Q'} to turn invisible`, '#cf8bff'); }
    else { p.bombs = Math.min(3, p.bombs + 1); toast(`💥 Flash Bomb! Press ${isTouch ? 'the 💥 button' : 'E'} to stun nearby monsters`, '#ffe05a'); }
    sfx.drink(); burst(V(it.x, 2, it.z), it.kind === 'ghost' ? 0xb47aff : 0xffe05a, 20, 8, 0.7);
    const i = world.items.indexOf(it);
    if (net.isClient) net.send({ t: 'item', i }); else if (net.isHost) net.broadcast({ t: 'item', i });
  },
  useGhost() {
    const p = this.player;
    if (this.state !== 'play' || this.cine || !p || p.state !== 'alive' || p.ghosts <= 0 || p.ghostT > 0) return;
    p.ghosts--; p.ghostT = 7;
    sfx.tone(600, 0.8, 'sine', 0.25, 0, 1400); sfx.noise(0.6, 0.2, 3000, 'highpass');
    flash('#b47aff', 0.4); burst(p.pos.clone().add(V(0, 3, 0)), 0xb47aff, 30, 8, 0.8, 3);
    toast('👻 You are INVISIBLE for 7 seconds!', '#cf8bff');
  },
  useBomb() {
    const p = this.player;
    if (this.state !== 'play' || this.cine || !p || p.state !== 'alive' || p.bombs <= 0) return;
    p.bombs--;
    flash('#ffffff', 0.95); this.shake = 1.2; sfx.boom(); sfx.tone(2400, 0.6, 'square', 0.12, 0, 600);
    burst(p.pos.clone().add(V(0, 3, 0)), 0xffe05a, 60, 30, 0.9, 6, 2);
    if (net.isClient) net.send({ t: 'stun', x: r2(p.pos.x), z: r2(p.pos.z) });
    else this.stunAround(p.pos, null);
  },
  stunAround(pos, by) {
    let n = 0;
    for (const h of this.hunters) {
      if (!h.active) continue;
      if (Math.hypot(h.pos.x - pos.x, h.pos.z - pos.z) / Math.max(1, h.T.scale * 0.5) > 45) continue;
      h.stunT = 5; h.chasing = false; h.lastKnown = null; h.path = null; h.vel.set(0, 0, 0); n++;
    }
    if (!by) toast(n ? `💥 You stunned ${n} monster${n === 1 ? '' : 's'}! RUN!` : '💥 No monsters close enough…', '#ffe05a');
    else if (n) toast(`💥 ${by} stunned ${n} monster${n === 1 ? '' : 's'}!`, '#ffe05a');
    if (net.isHost) net.broadcast({ t: 'stunned', n, by: by || net.myName() });
  },
  collectDrink(d) {
    d.taken = true; d.mesh.visible = false; d.decal.visible = false;
    this.player.stamina = this.player.maxStamina; this.player.exhausted = false;
    sfx.drink(); flash('#3cf0ff', 0.25); burst(V(d.x, 2, d.z), 0x3cf0ff, 20, 8, 0.7);
    toast('🥤 Stamina refilled!', '#3cf0ff');
  },
  openExit() {
    this.exitOpen = true;
    const e = world.exit;
    if (world.obstacles.includes(e.gateObs)) world.obstacles.splice(world.obstacles.indexOf(e.gateObs), 1);
    for (const h of this.hunters) h.enraged = true;
    if (net.on) { this.showGateOpen(); splash('THE EXIT IS OPEN!', 'Get to the gate. The monsters are enraged!', '#78ff8f'); return; } // no cutscene: the others keep playing
    const h = this.nearestHunter();
    this.playShots('exit', [
      { d: 2.8, cap: 'The gate is unlocking…', pos: (u) => V(e.x + lerp(-20, 20, u), lerp(9, 14, u), world.half - lerp(46, 36, u)), look: () => V(e.x, 10, e.z),
        tick: (u, c) => { if (!c.fired.g && u > 0.4) { c.fired.g = true; this.showGateOpen(); } } },
      { d: 2.4, cap: `…and ${h.T.name} heard it.`, ...this.faceCam(h, 5, 10), tick: (u, c) => this.roarShot(h, c, 'e', u, 0.25) },
    ], () => { this.showGateOpen(); h.chasing = false; splash('THE EXIT IS OPEN!', 'Get to the gate. The monsters are enraged!', '#78ff8f'); });
  },
  caught(hunter) {
    if (this.player.state !== 'alive') return;
    document.body.classList.remove('ghosting');
    this.player.state = 'caught'; this.catcher = hunter;
    this.player.vel.set(0, 0, 0);
    if (net.on) { hunter.pauseT = 3.6; hunter.vel.set(0, 0, 0); if (net.isHost) net.broadcast({ t: 'caught', id: net.myId, h: this.hunters.indexOf(hunter) }); }
    else for (const h of this.hunters) { h.vel.set(0, 0, 0); h.released = false; }
    this.result = { win: false, reason: hunter.T.caption };
    this.startDeath(hunter);
  },
  timeUp() {
    const p = this.player;
    p.state = 'caught';
    if (!net.on) for (const h of this.hunters) { h.released = false; h.vel.set(0, 0, 0); }
    const actives = this.hunters.filter((x) => x.active);
    const h = actives.reduce((a, b) => (Math.hypot(b.pos.x - p.pos.x, b.pos.z - p.pos.z) < Math.hypot(a.pos.x - p.pos.x, a.pos.z - p.pos.z) ? b : a));
    // the nearest monster appears right behind you
    const back = V(-Math.sin(camYaw), 0, -Math.cos(camYaw));
    const bd = 7 * Math.max(1, h.T.scale);
    h.pos.set(p.pos.x + back.x * bd, 0, p.pos.z + back.z * bd);
    this.catcher = h;
    this.result = { win: false, reason: 'Time ran out… the night swallowed the city' };
    this.startDeath(h);
  },
  finish() {
    this.state = 'results';
    this.refreshTouch();
    sfx.drone(false);
    if (locked()) document.exitPointerLock();
    const D = DIFF[this.diff];
    const rows = [[`Keys found (${this.keys})`, this.keys * CFG.rewards.key], ['Took part', CFG.rewards.participation]];
    if (this.result.win) {
      rows.push(['Escaped!', CFG.rewards.escape]);
      rows.push(['Time bonus', Math.floor((CFG.roundTime - this.elapsed) / 4)]);
    }
    let total = rows.reduce((a, r) => a + r[1], 0);
    if (D.mult !== 1) { const extra = Math.round(total * D.mult) - total; rows.push([`${this.diff[0].toUpperCase() + this.diff.slice(1)} difficulty ×${D.mult}`, extra]); total += extra; }
    save.coins += total;
    if (this.result.win) {
      save.escapes += 1;
      if (save.best === null || this.elapsed < save.best) save.best = this.elapsed;
      save.levelBest = save.levelBest || {};
      const b = save.levelBest[this.level];
      if (b === undefined || this.elapsed < b) save.levelBest[this.level] = this.elapsed;
    }
    writeSave();
    const last = this.level >= LEVELS.length;
    $('nextBtn').classList.toggle('hidden', net.isClient || (net.isHost ? last : !(this.result.win && !last)));
    $('againBtn').classList.toggle('hidden', net.isClient);
    $('againBtn').textContent = net.isHost ? 'Play again (everyone)' : 'Play again';
    $('menuBtn').textContent = net.on ? 'Room lobby' : 'Menu';
    if (net.on) { net.syncLobby(); if (net.isClient) setTimeout(() => { $('resultSub').textContent += ' · Waiting for the host to start the next round…'; }, 0); }
    $('resultTitle').textContent = this.result.win ? (last ? 'YOU BEAT IT ALL!' : LV().battle ? 'TITANS DEFEATED!' : 'ESCAPED!') : 'EATEN!';
    $('resultTitle').style.color = this.result.win ? 'var(--green)' : 'var(--red)';
    $('resultSub').textContent = this.result.reason;
    $('resultRows').innerHTML = rows.map(([a, b]) => `<div><span>${a}</span><span>${b >= 0 ? '+' : ''}${b} 🪙</span></div>`).join('')
      + `<div class="total"><span>Total</span><span>+${total} 🪙</span></div>`
      + (this.player.wallJumpCount ? `<div><span>Wall jumps</span><span>${this.player.wallJumpCount}</span></div>` : '');
    ui.results.classList.remove('hidden');
  },

  // ---------------- main update ----------------
  update(dt) {
    this.time += dt; this.frames = (this.frames || 0) + 1;
    const now = this.time;
    updateParticles(dt);
    updateWeather(dt, now);
    if (world) {
      for (const sp of world.spinners) sp.obj.rotation[sp.axis] += sp.speed * dt;
      for (const k of world.keys) if (!k.taken) { k.mesh.rotation.y += dt * 2; k.mesh.position.y = 3.2 + Math.sin(now * 2 + k.x) * 0.4; }
      for (const it of world.items) if (!it.taken) { it.mesh.rotation.y += dt * 2; it.mesh.position.y = 1.7 + Math.sin(now * 3 + it.x) * 0.35; }
      for (const d of world.drinks) if (!d.taken) { d.mesh.rotation.y += dt * 1.5; d.mesh.position.y = 1.6 + Math.sin(now * 2.5 + d.z) * 0.3; }
      if (world.exit && !this.exitOpen) world.exit.stripes.offset.x -= dt * 0.6;
      for (const p of world.pads) p.mesh.material.color.setRGB(0.24 * 2.2, (0.9 + Math.sin(now * 5) * 0.1) * 2.2, 2.2);
      world.blinkMat.color.setRGB(Math.sin(now * 3) > 0.3 ? 4 : 0.15, 0.05, 0.05);
      const pp = this.player && this.state === 'play' ? this.player.pos : null;
      for (const sc of world.scarecrows) { // they turn their heads to watch you...
        const d = pp ? Math.hypot(pp.x - sc.x, pp.z - sc.z) : 999;
        if (d < 50) { let a = Math.atan2(pp.x - sc.x, pp.z - sc.z) - sc.head.rotation.y; a = Math.atan2(Math.sin(a), Math.cos(a)); sc.head.rotation.y += a * Math.min(1, dt * 1.2); sc.head.rotation.z = 0.35; }
        sc.eyeMat.color.setHex(sc.eyeCol).multiplyScalar(d < 50 ? 4.5 : 0.5);
      }
    }

    // flashlight follows the camera
    const flTarget = this.state === 'play' && flashlightOn && !(this.cine && this.cine.kind !== 'escape' && this.cine.kind !== 'death') ? (this.cine && this.cine.kind === 'death' ? 7 : 55) : 0;
    let flScale = 1;
    if (flTarget > 0 && world) {
      const fd = V(0, 0, 0); camera.getWorldDirection(fd);
      const hit = Math.min(rayDistance(camera.position, fd, 14), camera.position.y / Math.max(0.05, -fd.y));
      flScale = clamp((hit / 12) ** 1.5, 0.06, 1); // dim when something is right in front of you
    }
    flashlight.intensity = lerp(flashlight.intensity, flTarget * flScale, 1 - Math.exp(-10 * dt));
  if (this.flickT > 0) { this.flickT -= dt; flashlight.intensity *= Math.random() < 0.7 ? 0.05 : 0.6; }

    if (this.state === 'menu') {
      this.menuAngle += dt * 0.05;
      camera.position.set(Math.sin(this.menuAngle) * 230, 110, Math.cos(this.menuAngle) * 230);
      camera.lookAt(0, 8, 0);
      return;
    }
    if (this.state !== 'play') return;

    const D = DIFF[this.diff];
    const p = this.player;
    net.tick(dt);
    if (this.state !== 'play') return;

    if (this.cine) {
      p.mesh.visible = this.cine.kind === 'escape' || this.cine.kind === 'battle';
      this.stepHunters(dt, now, D);
      if (this.cine.shots) this.updateShots(dt);
      else if (this.cine.kind === 'death') this.updateDeath(dt);
      else if (this.cine.kind === 'escape') this.updateEscape(dt);
      this.updateFlashlight();
      return;
    }
    if (this.paused && !net.on) return; // in multiplayer the round keeps going while you're paused

    this.elapsed += dt;
    const timeLeft = CFG.roundTime - this.elapsed;

    if (!net.isClient) { // the host (or solo player) runs the clock
      if (!this.released && this.elapsed >= CFG.headStart) { if (net.on) this.release(); else { this.startRelease(); return; } }
      if (!this.frenzy && timeLeft <= CFG.frenzyTime) { if (net.on) this.quickFrenzy(); else { this.startFrenzy(); return; } }
    }

    const alive = p.state === 'alive';
    if (alive) p.update(dt, now, !this.paused); else p.mesh.visible = false;
    this.stepHunters(dt, now, D);
    if (this.cine) return; // caught this frame

    if (!alive) { // spectating your team
      ui.vignette.style.opacity = 0; ui.static.style.opacity = 0; sfx.tension(0); this.danger = 0;
      this.spectateCam(dt); this.updateFlashlight(); this.updateHud(timeLeft, now);
      return;
    }

    for (const k of world.keys) {
      if (k.taken) continue;
      const d = Math.hypot(k.x - p.pos.x, k.z - p.pos.z);
      k.beam.material.opacity = d < 110 ? 0.14 * (1 - d / 110) + 0.04 : 0;
      if (d < 3.2 && p.pos.y < 6) this.collectKey(k);
    }
    for (const d of world.drinks) if (!d.taken && Math.hypot(d.x - p.pos.x, d.z - p.pos.z) < 2.6 && p.pos.y < 5) this.collectDrink(d);
    for (const it of world.items) if (!it.taken && Math.hypot(it.x - p.pos.x, it.z - p.pos.z) < 2.6 && p.pos.y < 5) this.collectItem(it);
    if (this.exitOpen && p.pos.z > world.half + 3 && Math.abs(p.pos.x - world.exit.x) < world.exit.gapW / 2 + 1) { this.startEscape(); return; }
    if (timeLeft <= 0) { this.timeUp(); return; }

    // danger
    let danger = 0, near = Infinity;
    for (const h of this.hunters) if (h.active) {
      const d = Math.hypot(h.pos.x - p.pos.x, h.pos.z - p.pos.z) / Math.max(1, h.T.scale * 0.5);
      danger = Math.max(danger, clamp(1 - (d - 12) / 55, 0, 1) * (h.chasing ? 1 : 0.6));
      if (!h.chasing) near = Math.min(near, d);
    }
    const pulse = 0.75 + 0.25 * Math.sin(now * (4 + danger * 8));
    ui.vignette.style.opacity = (danger * pulse).toFixed(3);
    ui.static.style.opacity = (danger * danger * 0.12 + (this.flickT > 0 ? 0.08 : 0)).toFixed(3);
    ui.static.style.backgroundPosition = `${(Math.random() * 256) | 0}px ${(Math.random() * 256) | 0}px`;
    this.whisperT -= dt;
    if (near < 75 && this.whisperT <= 0) { sfx.whisper(clamp(1.2 - near / 75, 0.2, 1)); this.whisperT = 5 + Math.random() * 7; }
    if (danger > 0.45 && Math.random() < dt * 3 * danger) this.flickT = 0.05 + Math.random() * 0.15;
    sfx.tension(danger);
    this.beatT -= dt;
    if (danger > 0.15 && this.beatT <= 0) { sfx.heartbeat(0.4 + danger * 0.6); this.beatT = lerp(1.1, 0.38, danger); }
    this.danger = danger;

    this.updateCamera(dt);
    this.updateFlashlight();
    this.updateAtmosphere(dt);
    this.updateHud(timeLeft, now);
  },

  // when one monster spots you it howls, and the others come running
  alertPack(src, now, D) {
    if (!D.pack || now - this.lastAlert < 8) return;
    let n = 0;
    for (const h of this.hunters) {
      if (h === src || !h.active || !h.released || h.chasing) continue;
      if (Math.hypot(h.pos.x - src.pos.x, h.pos.z - src.pos.z) > D.pack) continue;
      h.alert(src.lastKnown || this.player.pos); n++;
    }
    if (n) this.lastAlert = now;
    if (n && src.target === this.player) { this.lastAlert = now; setTimeout(() => sfx.howl(), 450); toast(`📣 ${src.T.name} howled. ${n === 2 ? 'Both others are' : 'Another one is'} coming!`, '#ff4d5e'); }
  },

  // each area has its own fog; it turns red when monsters are close
  updateAtmosphere(dt) {
    const p = this.player, zk = world.zoneAt(p.pos.x, p.pos.z), Z = ZONES[zk];
    if (zk !== this.zone) { this.zone = zk; toast(Z.name, Z.color); }
    const k = 1 - Math.exp(-1.5 * dt);
    fogTarget.setHex(Z.fog).lerp(FOG_RED, this.danger * 0.4);
    scene.fog.color.lerp(fogTarget, k);
    scene.background.copy(scene.fog.color).multiplyScalar(0.8);
    scene.fog.density = lerp(scene.fog.density, Z.density * (1 + this.danger * 0.35), k);
    aimMoon(p.pos.x, p.pos.z);
  },

  updateCamera(dt) {
    const p = this.player;
    const hs = Math.hypot(p.vel.x, p.vel.z);
    if (firstPerson) {
      p.mesh.visible = false;
      const bob = p.onGround ? Math.abs(Math.sin(p.anim)) * 0.22 * Math.min(1, hs / 16) : 0;
      const eye = V(p.pos.x, p.pos.y + 4.6 + bob - p.landDip * 0.9, p.pos.z);
      const pt = -camPitch;
      const dir = V(Math.sin(camYaw) * Math.cos(pt), Math.sin(pt), Math.cos(camYaw) * Math.cos(pt));
      camera.position.copy(eye);
      camera.lookAt(tmpV.copy(eye).add(dir));
      const right = V(-Math.cos(camYaw), 0, Math.sin(camYaw));
      camera.rotateZ(-(p.vel.x * right.x + p.vel.z * right.z) * 0.0025); // lean when strafing
    } else {
      p.mesh.visible = true;
      const target = p.pos.clone().add(V(0, 4.2, 0));
      const dir = V(-Math.sin(camYaw) * Math.cos(camPitch), Math.sin(camPitch), -Math.cos(camYaw) * Math.cos(camPitch));
      const d = Math.max(2.5, rayDistance(target, dir, 15) - 0.6);
      const desired = target.clone().addScaledVector(dir, d);
      if (desired.y < 0.8) desired.y = 0.8;
      camera.position.lerp(desired, 1 - Math.exp(-20 * dt));
      camera.lookAt(target);
    }
    this.applyShake(dt);
    this.fovKick = Math.max(0, this.fovKick - dt * 20);
    const fov = 72 + (p.sprinting ? 9 : 0) + this.danger * 6 + (this.time < p.boostUntil ? 6 : 0) + this.fovKick;
    camera.fov = lerp(camera.fov, fov, 1 - Math.exp(-6 * dt)); camera.updateProjectionMatrix();
  },

  updateFlashlight() {
    const dir = V(0, 0, 0); camera.getWorldDirection(dir);
    flashlight.position.copy(camera.position).add(V(0, -0.4, 0));
    flashlight.target.position.copy(camera.position).addScaledVector(dir, 12);
  },

  updateHud(timeLeft, now) {
    const p = this.player;
    if (!this.released) {
      ui.phase.textContent = 'MONSTERS RELEASED IN';
      ui.timer.textContent = Math.ceil(CFG.headStart - this.elapsed);
      ui.timer.style.color = '#ffd257';
    } else {
      ui.phase.textContent = this.exitOpen ? '🚪 EXIT OPEN, RUN!' : this.frenzy ? '⚠ FRENZY' : LV().battle ? 'FIND POWER CORES' : 'FIND THE KEYS';
      ui.timer.textContent = fmtTime(timeLeft);
      ui.timer.style.color = timeLeft <= CFG.frenzyTime ? '#ff4d5e' : '#fff';
    }
    ui.keysPill.textContent = `${LV().keyIcon || '🔑'} ${Math.min(this.keys, CFG.keysNeeded)} / ${CFG.keysNeeded}`;
    ui.keysPill.style.color = this.exitOpen ? 'var(--green)' : '';
    if (net.on) { ui.teamPill.classList.remove('hidden'); ui.teamPill.textContent = `👥 ${net.alive()}/${net.remotes.size + 1}`; } else ui.teamPill.classList.add('hidden');
    if (p.state !== 'alive') { ui.phase.textContent = this.specName ? `👻 WATCHING ${this.specName.toUpperCase()}` : '👻 SPECTATING'; }
    ui.huntPill.textContent = this.hunters.filter((h) => h.active).map((h) => h.T.emoji + (h.chasing ? '❗' : '')).join(' ');
    const frac = p.stamina / p.maxStamina;
    ui.staminaFill.style.width = `${(frac * 100).toFixed(1)}%`;
    ui.staminaFill.style.background = p.exhausted ? 'linear-gradient(180deg,#ff8a7a,#e04a3a)' : frac < 0.3 ? 'linear-gradient(180deg,#ffd77a,#f0a530)' : '';
    ui.staminaText.textContent = p.exhausted ? 'EXHAUSTED' : this.time < p.boostUntil ? '⚡ BOOST' : 'STAMINA';
    ui.hiddenTag.classList.toggle('hidden', !p.hidden);
    ui.hiddenTag.textContent = p.ghostT > 0 ? `👻 INVISIBLE ${Math.ceil(p.ghostT)}` : '🌿 HIDDEN';
    const inv = [p.ghosts ? `👻×${p.ghosts}${isTouch ? '' : ' Q'}` : '', p.bombs ? `💥×${p.bombs}${isTouch ? '' : ' E'}` : ''].filter(Boolean).join('  ');
    ui.itemPill.classList.toggle('hidden', !inv); ui.itemPill.textContent = inv;
    ui.tGhost.classList.toggle('hidden', !p.ghosts); ui.tBomb.classList.toggle('hidden', !p.bombs);
    const showArrow = this.exitOpen && p.state === 'alive' && !LV().battle;
    ui.exitArrow.classList.toggle('hidden', !showArrow);
    if (showArrow) { // points at the open exit gate
      const dx = world.exit.x - p.pos.x, dz = world.exit.z - p.pos.z;
      const fwd = dx * Math.sin(camYaw) + dz * Math.cos(camYaw), right = -dx * Math.cos(camYaw) + dz * Math.sin(camYaw);
      ui.exitArrowIcon.style.transform = `rotate(${Math.atan2(right, fwd).toFixed(3)}rad)`;
      ui.exitDist.textContent = `EXIT ${Math.round(Math.hypot(dx, dz))}m`;
    }
    ui.crosshair.classList.toggle('hidden', !firstPerson);
    if (showMap) drawMap(now);
  },
};

function setPaused(on) {
  game.paused = on;
  ui.pause.classList.toggle('hidden', !on);
  if (on) { for (const k in keys) keys[k] = false; input.joyX = input.joyY = 0; if (locked()) document.exitPointerLock(); }
}

// ---------------------------------------------------------------------------
// Menu / shop
// ---------------------------------------------------------------------------
// ---- settings (menu + pause screen)
function applySettings() {
  const st = settings(), low = st.quality === 'low';
  const pr = low ? 1 : Math.min(window.devicePixelRatio, 1.75);
  renderer.setPixelRatio(pr); composer.setPixelRatio(pr); composer.setSize(window.innerWidth, window.innerHeight);
  moon.castShadow = !low; bloom.enabled = !low;
  if (sfx.master) sfx.master.gain.value = 0.55 * st.vol;
}
function mountSettings(el) {
  el.innerHTML = `<div class="setRow"><span>🔊 Volume</span><input type="range" min="0" max="100" data-k="vol"></div>
    <div class="setRow"><span>🖱 Look speed</span><input type="range" min="30" max="250" data-k="sens"></div>
    <div class="setRow"><span>✨ Graphics</span><div class="seg"><button data-q="high">High</button><button data-q="low">Fast</button></div></div>`;
  el.querySelectorAll('input').forEach((inp) => inp.addEventListener('input', () => { settings()[inp.dataset.k] = inp.value / 100; writeSave(); applySettings(); renderSettings(); }));
  el.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => { settings().quality = b.dataset.q; writeSave(); applySettings(); renderSettings(); }));
}
function renderSettings() {
  const st = settings();
  document.querySelectorAll('.settingsBox input').forEach((inp) => { inp.value = Math.round(st[inp.dataset.k] * 100); });
  document.querySelectorAll('.settingsBox [data-q]').forEach((b) => b.classList.toggle('on', b.dataset.q === st.quality));
}
document.querySelectorAll('.settingsBox').forEach(mountSettings);
applySettings(); renderSettings();

function renderMenu() {
  renderLobby();
  const lv = $('levelSeg'); lv.innerHTML = '';
  LEVELS.forEach((L, k) => {
    const b = document.createElement('button');
    const best = save.levelBest && save.levelBest[k + 1] !== undefined ? `Best ${fmtTime(save.levelBest[k + 1])}` : 'Not escaped yet';
    b.className = 'lvl' + (game.level === k + 1 ? ' on' : '');
    b.innerHTML = `<span class="lvE">${L.emoji}</span><span class="lvN">${k + 1}. ${L.name}</span><span class="lvM">${L.mix ? '❓ ❓ ❓' : L.monsters.map((m) => MONSTERS[m].emoji).join(' ')}</span><span class="lvB">${best}</span>`;
    b.style.setProperty('--lc', L.color);
    b.onclick = () => game.setLevel(k + 1);
    lv.appendChild(b);
  });
  const L = LV();
  $('levelBlurb').innerHTML = `${L.blurb}<br>Monsters${L.mix ? ' this round' : ''}: ${L.monsters.map((m) => `<b style="color:${MONSTERS[m].eyeCss}">${MONSTERS[m].emoji} ${MONSTERS[m].name}</b>`).join(', ')}`;
  $('stCoins').textContent = save.coins;
  $('stEsc').textContent = save.escapes;
  $('stBest').textContent = save.best === null ? '–' : fmtTime(save.best);
  document.querySelectorAll('#diffSeg button').forEach((b) => b.classList.toggle('on', b.dataset.d === game.diff));
  document.querySelectorAll('#viewSeg button').forEach((b) => b.classList.toggle('on', (b.dataset.v === 'fp') === firstPerson));
  const shop = $('shop'); shop.innerHTML = '';
  for (const [name, u] of Object.entries(CFG.upgrades)) {
    const lvl = save.upgrades[name], maxed = lvl >= u.max, cost = upgradeCost(name, lvl);
    const row = document.createElement('div'); row.className = 'shopItem';
    row.innerHTML = `<div style="font-size:30px">${u.icon}</div><div class="info"><div class="name">${u.label}</div><div class="desc">${u.desc}</div><div class="pips">${'■'.repeat(lvl)}${'□'.repeat(u.max - lvl)}</div></div>`;
    const btn = document.createElement('button');
    btn.textContent = maxed ? 'MAXED' : `🪙 ${cost}`;
    btn.disabled = maxed || save.coins < cost;
    btn.onclick = () => { if (save.coins >= cost && !maxed) { save.coins -= cost; save.upgrades[name]++; writeSave(); renderMenu(); } };
    row.appendChild(btn); shop.appendChild(row);
  }
}
document.querySelectorAll('#diffSeg button').forEach((b) => b.addEventListener('click', () => {
  if (net.isClient) { toast('Only the host can pick the difficulty', '#cdb8ff'); return; }
  game.diff = b.dataset.d; save.diff = game.diff; writeSave(); renderMenu(); if (net.isHost) net.syncLobby();
}));
document.querySelectorAll('#viewSeg button').forEach((b) => b.addEventListener('click', () => setView(b.dataset.v === 'fp', false)));
$('playBtn').addEventListener('click', () => (net.isHost ? game.hostStart() : net.isClient ? null : game.start(false)));
$('againBtn').addEventListener('click', () => (net.isHost ? game.hostStart() : game.start(true)));
$('nextBtn').addEventListener('click', () => { game.setLevel(Math.min(LEVELS.length, game.level + 1)); if (net.isHost) game.hostStart(); else game.start(true); });
// multiplayer menu
$('mpName').value = save.name;
$('mpName').addEventListener('change', () => { save.name = $('mpName').value.trim().slice(0, 12) || save.name; $('mpName').value = save.name; writeSave(); });
$('mpCreate').addEventListener('click', () => net.create());
$('mpJoin').addEventListener('click', () => net.join($('mpCode').value));
$('mpCode').addEventListener('keydown', (e) => { if (e.key === 'Enter') net.join($('mpCode').value); e.stopPropagation(); });
$('mpName').addEventListener('keydown', (e) => e.stopPropagation());
$('mpLeave').addEventListener('click', () => net.leave());
$('mpCopy').addEventListener('click', () => {
  const link = `${location.origin}${location.pathname}?room=${net.code}`;
  try { navigator.clipboard.writeText(link); toastMenu('Invite link copied!'); } catch (e) { toastMenu(link); }
});
function toastMenu(t) { net.setStatus(t); }
{ const room = new URLSearchParams(location.search).get('room'); if (room) { $('mpCode').value = room.toUpperCase(); setTimeout(() => net.join(room), 300); } }
$('menuBtn').addEventListener('click', () => game.showMenu());
$('resumeBtn').addEventListener('click', () => { setPaused(false); tryLock(); });
$('quitBtn').addEventListener('click', () => game.showMenu());

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------
const clock = new THREE.Clock();
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  game.update(dt);
  composer.render();
}
$('loading').remove();
game.showMenu();
frame();

// Debug/demo: ?demo=1 auto-starts; ?demo=sim|hide|wall|death|escape|intro run automated checks
const demo = new URLSearchParams(location.search).get('demo');
if (demo) {
  window.addEventListener('error', (e) => console.error('GAME ERROR', e.message, e.filename, e.lineno));
  setTimeout(() => {
    try {
      if (demo === 'mphost' || demo === 'mpjoin') { // two browsers: ?demo=mphost&code=X and ?demo=mpjoin&code=X
        const code = new URLSearchParams(location.search).get('code'), log = (...a) => console.log('MP', ...a);
        const info = () => ({ seed: world.seed, key0: [world.keys[0].x, world.keys[0].z], keys: game.keys, remotes: net.remotes.size, remoteSeen: [...net.remotes.values()].some((r) => !r.fresh), released: game.released, state: game.state, me: game.player && game.player.state, k0: world.keys[0].taken, fps: Math.round(game.frames / Math.max(1, game.time)), sent: net.sent, snaps: net.snaps });
        if (demo === 'mphost') {
          net.create(code);
          const iv = setInterval(() => {
            if (net.lobby.length < 2 || game.state !== 'menu') return;
            clearInterval(iv);
            game.hostStart(); game.skipCine(); game.elapsed = CFG.headStart;
            log('HOST started', net.lobby.length);
            setTimeout(() => log('HOST', JSON.stringify(info())), 9000);
            if (/over/.test(location.search)) { // then the host gets caught too: the round should end for everyone
              setTimeout(() => { const h = game.hunters[0]; game.player.pos.set(h.pos.x + 1, 0, h.pos.z); }, 14000);
              setTimeout(() => log('HOST END', JSON.stringify({ state: game.state, title: $('resultTitle').textContent, again: !$('againBtn').classList.contains('hidden') })), 40000);
            }
          }, 300);
        } else {
          save.name = 'Joiner';
          setTimeout(() => net.join(code), 2500);
          const iv = setInterval(() => {
            if (game.state !== 'play' || !world) return;
            clearInterval(iv);
            game.skipCine();
            setTimeout(() => { const k = world.keys[0]; game.player.pos.set(k.x, 0, k.z); }, 2500);
            setTimeout(() => log('JOIN', JSON.stringify({ ...info(), snaps: net.snaps, hunterSynced: !!game.hunters[0].netSynced, myId: net.myId })), 7000);
            if (/over/.test(location.search)) {
              setTimeout(() => { const h = game.hunters[0]; game.player.pos.set(h.pos.x + 1, 0, h.pos.z); }, 8000);
              setTimeout(() => log('JOIN SPECTATE', JSON.stringify({ me: game.player.state, spectating: game.spectating, state: game.state })), 19000);
              setTimeout(() => log('JOIN END', JSON.stringify({ state: game.state, title: $('resultTitle').textContent, again: !$('againBtn').classList.contains('hidden') })), 40000);
            }
          }, 200);
        }
        return;
      }
      const lvq = +new URLSearchParams(location.search).get('level');
      if (lvq) game.setLevel(clamp(lvq, 1, LEVELS.length));
      game.start(false);
      if (demo === 'intro') { for (let i = 0; i < 60 * 15; i++) game.update(1 / 60); console.log('INTRO', JSON.stringify({ cineAfter: game.cine && game.cine.kind, hunterY: game.hunters[0].pos.y })); return; }
      if (demo === 'introshot') { for (let i = 0; i < 60 * 12.2; i++) game.update(1 / 60); return; }
      game.skipCine();
      game.elapsed = CFG.headStart; game.release();
      if (demo === 'cines') { // every mid-game cutscene must play through and hand control back
        const out = {}, run = (name, fn, secs) => { fn(); out[name + 'Started'] = game.cine && game.cine.kind; for (let i = 0; i < 60 * secs; i++) game.update(1 / 60); out[name + 'Ended'] = !game.cine && game.state === 'play'; };
        game.player.pos.set(world.spawns[0].x, 0, world.spawns[0].z);
        run('release', () => game.startRelease(), 7);
        run('frenzy', () => game.startFrenzy(), 6);
        game.frenzy = false; game.startFrenzy(); game.skipCine(); out.skipOk = !game.cine;
        if (LV().battle) {
          game.keys = 4; game.collectKey(world.keys.find((k) => !k.taken)); out.battleStarted = game.cine && game.cine.kind;
          for (let i = 0; i < 60 * 36; i++) game.update(1 / 60);
          out.battleWon = game.state === 'results' && game.result.win && $('resultTitle').textContent;
        } else run('exit', () => { game.keys = 4; game.collectKey(world.keys.find((k) => !k.taken)); }, 7);
        console.log('CINES', JSON.stringify(out));
        return;
      }
      if (demo === 'sim') {
        game.player.pos.set(30, 0, -60);
        let t = 0, firstChase = null;
        for (let i = 0; i < 60 * 40 && game.player.state === 'alive'; i++) {
          game.update(1 / 60); t += 1 / 60;
          if (firstChase === null && game.hunters[0].chasing) firstChase = t.toFixed(1);
        }
        const cineKind = game.cine && game.cine.kind;
        for (let i = 0; i < 60 * 6; i++) game.update(1 / 60);
        console.log('SIM', JSON.stringify({ firstChase, caughtAfter: t.toFixed(1), state: game.player.state, cine: cineKind, finalState: game.state }));
        const failed = [...world.keys, ...world.spawns, ...world.patrol].filter((k) => !findPath(world.nav, 0, 0, k.x, k.z));
        console.log('PATHS', JSON.stringify({ targets: world.keys.length + world.spawns.length + world.patrol.length, fails: failed.length, where: failed.map((k) => `${world.zoneAt(k.x, k.z)}@${k.x.toFixed(0)},${k.z.toFixed(0)}`) }));
      } else if (demo === 'wall') {
        const b = world.obstacles.filter((o) => o.h > 15 && !o.gate && o.x1 - o.x0 < 30).sort((a, c) => Math.hypot((a.x0 + a.x1) / 2, a.z0) - Math.hypot((c.x0 + c.x1) / 2, c.z0))[0];
        const p = game.player; p.pos.set((b.x0 + b.x1) / 2, 0, b.z0 - 7); camYaw = 0; game.hunters[0].active = false;
        keys.KeyW = true; let maxY = 0;
        for (let i = 0; i < 60 * 3; i++) {
          if (i === 10 || (!p.onGround && game.time - p.wallTime < 0.05 && p.vy < 8)) input.jumpQueued = true;
          game.update(1 / 60); maxY = Math.max(maxY, p.pos.y);
        }
        console.log('WALL', JSON.stringify({ wallJumps: p.wallJumpCount, maxY: maxY.toFixed(1), buildingH: b.h }));
      } else if (demo === 'death' || demo === 'deathshot') {
        const h = game.hunters[0]; game.player.pos.set(h.pos.x + 2, 0, h.pos.z - 14); camYaw = Math.PI;
        let caughtAt = null;
        for (let i = 0; i < 60 * 3 && !game.cine; i++) { game.update(1 / 60); }
        caughtAt = game.cine && game.cine.kind;
        if (demo === 'deathshot') { for (let i = 0; i < 60 * 0.9; i++) game.update(1 / 60); return; }
        for (let i = 0; i < 60 * 6; i++) game.update(1 / 60);
        console.log('DEATH', JSON.stringify({ cine: caughtAt, finalState: game.state, resultsShown: !ui.results.classList.contains('hidden') }));
      } else if (demo === 'escape' || demo === 'escapeshot') {
        game.keys = 4; game.collectKey(world.keys.find((k) => !k.taken)); game.skipCine();
        game.hunters[0].active = false;
        game.player.pos.set(world.exit.x, 0, world.half + 4);
        for (let i = 0; i < 60 * (demo === 'escapeshot' ? 1.4 : 5); i++) game.update(1 / 60);
        if (demo === 'escape') console.log('ESCAPE', JSON.stringify({ finalState: game.state, title: $('resultTitle').textContent }));
      } else if (demo === 'zone' || demo === 'monster') {
        // ?demo=zone&z=forest → stand in that area; ?demo=monster&m=0 → look at a monster up close
        const qs = new URLSearchParams(location.search), p = game.player;
        if (demo === 'zone') {
          const want = qs.get('z') || 'forest';
          const c = world.patrol.filter((k) => world.zoneAt(k.x, k.z) === want).sort((a, b) => a.length() - b.length())[3] || world.patrol[0];
          p.pos.set(c.x, 0, c.z); game.hunters.forEach((h) => { h.active = h.index === 0; });
          const h = game.hunters[0]; h.pos.set(c.x + 4, 0, c.z + 26); h.released = false; h.chasing = true;
        } else {
          const h = game.hunters[+(qs.get('m') || 0)];
          game.hunters.forEach((o) => { if (o !== h) o.active = false; o.released = false; });
          h.pos.set(p.pos.x, 0, p.pos.z + 13); h.chasing = true;
        }
        camYaw = 0; camPitch = -0.1; game.released = true; game.frenzy = true;
        for (let i = 0; i < 60 * 2; i++) { game.update(1 / 60); game.hunters.forEach((h) => { if (h.active) h.chasing = true; }); }
        renderer.info.autoReset = false; renderer.info.reset(); composer.render(); renderer.info.autoReset = true;
        console.log('RENDER', JSON.stringify({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles, obstacles: world.obstacles.length }));
      } else if (demo === 'battleshot') { // ?demo=battleshot&level=4&t=12 → freeze the battle at t seconds
        game.keys = 4; game.collectKey(world.keys.find((k) => !k.taken));
        const T = +new URLSearchParams(location.search).get('t') || 10;
        for (let i = 0; i < 60 * T; i++) game.update(1 / 60);
        game.update = () => {};
      } else if (demo === 'items') { // pick up a ghost potion + flash bomb, use both
        const p = game.player, out = { items: world.items.length };
        for (const kind of ['ghost', 'bomb']) { const it = world.items.find((x) => x.kind === kind && !x.taken); p.pos.set(it.x, 0, it.z); game.update(1 / 60); }
        out.inv = [p.ghosts, p.bombs];
        game.useGhost(); for (let i = 0; i < 30; i++) game.update(1 / 60); out.hiddenWhileGhost = p.hidden;
        const h = game.hunters[0]; p.pos.set(h.pos.x + 20, 0, h.pos.z); game.useBomb(); out.stunned = h.stunT > 0;
        for (let i = 0; i < 60; i++) game.update(1 / 60); out.stillStunned = h.stunT > 0; out.alive = p.state;
        console.log('ITEMS', JSON.stringify(out));
      } else if (demo === 'eatshot') { // freeze the eaten cutscene at t seconds
        const h = game.hunters[0]; game.player.pos.set(h.pos.x + 2, 0, h.pos.z - 14); camYaw = Math.PI;
        for (let i = 0; i < 60 * 3 && !game.cine; i++) game.update(1 / 60);
        const T = +new URLSearchParams(location.search).get('t') || 1.5;
        for (let i = 0; i < 60 * T; i++) game.update(1 / 60);
        game.update = () => {};
      } else if (demo === 'touch') {
        enableTouch(); input.joyY = -1; input.sprintTouch = true;
        const z0 = game.player.pos.z;
        for (let i = 0; i < 60; i++) game.update(1 / 60);
        console.log('TOUCH', JSON.stringify({ moved: (game.player.pos.z - z0).toFixed(1), touchUI: !ui.touch.classList.contains('hidden') }));
      } else keys.KeyW = true;
    } catch (err) { console.error('GAME ERROR', err.message, err.stack); }
  }, 500);
}
