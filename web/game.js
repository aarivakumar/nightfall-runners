// Nightfall Runners — browser edition (Three.js)
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

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
  // ---- Level 12: Dino Valley
  raptor: { name: 'The Raptor', emoji: '🦖', eye: 0xffe21a, eyeCss: '#ffe85a', body: 0x3a5228, bone: 0xe8dcc0, scale: 1.05, speed: 2.6, sight: 85, hear: 18, posture: 'crawl', headY: 4.6, lunge: 3.8,
    tail: true, spikes: 6, spikeLen: 0.8, eyeSize: 1.2, ribs: false, voice: { roar: 340, scream: 1200, growl: 130, click: true }, caption: 'The Raptor was too fast.' },
  trex: { name: 'The T-Rex', emoji: '🦕', eye: 0xff6a1a, eyeCss: '#ff9a5a', body: 0x4a3a22, bone: 0xf0e8d0, scale: 2.2, speed: -1, sight: 110, hear: 26, posture: 'upright', headY: 8.5, lunge: 11,
    bulk: 1.6, tail: true, armLen: 1.1, spikes: 7, spikeLen: 0.9, ribs: false, voice: { roar: 60, scream: 380, growl: 30 }, caption: 'The T-Rex had you for lunch.' },
  ptero: { name: 'The Pterodactyl', emoji: '🪶', eye: 0xff2a4a, eyeCss: '#ff6a7a', body: 0x6a4a34, scale: 1.15, speed: -0.5, sight: 130, hear: 30, posture: 'float', headY: 9.8, lunge: 4.6,
    wings: true, legsVisible: true, horns: true, ribs: false, spikes: 0, voice: { roar: 700, scream: 1600, growl: 260, wail: true }, caption: 'The Pterodactyl swooped down on you.' },
  // ---- Level 13: Pirate Cove
  ghostpirate: { name: 'The Ghost Pirate', emoji: '🏴‍☠️', eye: 0x5aff9a, eyeCss: '#8affb4', body: 0x2a4a3a, scale: 1.3, speed: 0.5, sight: 115, hear: 20, posture: 'upright', headY: 8.5, lunge: 7.2,
    ghost: 0x0a3a20, hat: true, longClaws: true, ribs: true, spikes: 0, lightK: 0.6, voice: { roar: 150, scream: 750, growl: 55, laugh: true }, caption: 'The Ghost Pirate made you walk the plank.' },
  krakenling: { name: 'The Krakenling', emoji: '🐙', eye: 0xff4ad0, eyeCss: '#ff7ae0', body: 0x5a1a4a, scale: 1.1, speed: 1.8, sight: 75, hear: 16, posture: 'crawl', headY: 4.6, lunge: 3.8,
    extraArms: true, tentacles: true, eyeSize: 1.5, ribs: false, spikes: 0, voice: { roar: 240, scream: 950, growl: 90, click: true }, caption: 'The Krakenling dragged you into the deep.' },
  skullcaptain: { name: 'The Skull Captain', emoji: '💀', eye: 0xffc83a, eyeCss: '#ffd86a', body: 0x1a1a2a, scale: 1.2, speed: -1, sight: 125, hear: 36, posture: 'float', headY: 9.8, lunge: 4.6,
    ghost: 0x1a1a3a, robe: 0x14142a, hat: true, boneFace: true, longClaws: true, flicker: true, ribs: false, spikes: 0, voice: { roar: 420, scream: 1250, growl: 160, laugh: true }, caption: 'The Skull Captain claimed your treasure.' },
  // ---- Level 14: Cyber City 2099
  robohound: { name: 'The Robo-Hound', emoji: '🐕', eye: 0xff2a2a, eyeCss: '#ff5a5a', body: 0x5a6070, bone: 0x9aa0b0, scale: 1.1, speed: 2.4, sight: 90, hear: 20, posture: 'crawl', headY: 4.6, lunge: 3.8,
    metal: true, eyes: 1, eyeSize: 2.2, spikes: 5, spikeLen: 1, ribs: false, voice: { roar: 500, scream: 1400, growl: 200, click: true }, caption: 'The Robo-Hound locked on to you.' },
  sentinel: { name: 'The Sentinel', emoji: '🤖', eye: 0x2ad8ff, eyeCss: '#6ae8ff', body: 0x3a4250, bone: 0x8a90a0, scale: 1.4, speed: 0.5, sight: 140, hear: 22, posture: 'upright', headY: 8.5, lunge: 7.5,
    metal: true, eyes: 1, eyeSize: 2.6, bigHead: true, ribs: false, spikes: 0, voice: { roar: 220, scream: 900, growl: 80 }, caption: 'The Sentinel deleted you.' },
  glitch: { name: 'The Glitch', emoji: '👾', eye: 0xff2ad8, eyeCss: '#ff6ae8', body: 0x2a0a3a, scale: 1.2, speed: -0.5, sight: 130, hear: 40, posture: 'float', headY: 9.8, lunge: 4.6,
    ghost: 0x6a0a8a, robe: 0x1a0a2a, hood: 0x1a0a2a, boneFace: true, longClaws: true, flicker: true, ribs: false, spikes: 0, voice: { roar: 800, scream: 1800, growl: 300, wail: true }, caption: 'The Glitch corrupted you.' },
};

// ---- Levels 15-26: monsters made with a helper (posture decides the body type)
function M(name, emoji, eye, posture, body, extra = {}) {
  const l = new THREE.Color(eye).lerp(new THREE.Color(0xffffff), 0.3);
  const P = { upright: { scale: 1.3, speed: 0, sight: 110, hear: 20, headY: 8.5, lunge: 7.2, voice: { roar: 140, scream: 720, growl: 52 } },
    crawl: { scale: 1.05, speed: 2, sight: 80, hear: 16, headY: 4.6, lunge: 3.8, voice: { roar: 280, scream: 1000, growl: 100, click: true } },
    float: { scale: 1.2, speed: -1, sight: 125, hear: 36, headY: 9.8, lunge: 4.6, voice: { roar: 560, scream: 1400, growl: 200, wail: true } } }[posture];
  return { name, emoji, eye, eyeCss: '#' + l.getHexString(), body, posture, spikes: 0, ribs: false, ...P,
    ...(posture === 'float' ? { flicker: true, longClaws: true } : {}), caption: `${name} got you.`, ...extra };
}
Object.assign(MONSTERS, {
  magmagolem: M('The Magma Golem', '🌋', 0xff5a1a, 'upright', 0x2a1a14, { bulk: 1.5, scale: 1.5, horns: true, spikes: 5, ghost: 0x501400, caption: 'The Magma Golem melted you.' }),
  salamander: M('The Fire Salamander', '🦎', 0xffa21a, 'crawl', 0x5a1a0a, { tail: true, spikes: 7, speed: 2.6, caption: 'The Fire Salamander roasted you.' }),
  emberwraith: M('The Ember Wraith', '🔥', 0xff6a2a, 'float', 0x3a0a04, { ghost: 0x6a1400, robe: 0x1a0402, hood: 0x1a0402, boneFace: true, caption: 'The Ember Wraith burned you to ash.' }),
  iceknight: M('The Ice Knight', '🛡', 0x6ae0ff, 'upright', 0x8aa8c0, { metal: true, horns: true, face: 0xb0c8d8, caption: 'The Ice Knight froze you solid.' }),
  frostspider: M('The Frost Spider', '🕸', 0xa0f0ff, 'crawl', 0xd0e8f0, { eyes: 6, extraArms: true, spikes: 6, spikeLen: 1.2, caption: 'The Frost Spider wrapped you in ice.' }),
  snowqueen: M('The Snow Queen', '👸', 0x9af0ff, 'float', 0xe0f0ff, { ghost: 0x1a3a5a, robe: 0xd8ecff, hair: 0xf0f8ff, lightK: 0.25, caption: 'The Snow Queen kept you forever.' }),
  patient: M('The Patient', '🤕', 0x6aff6a, 'upright', 0xd8d0c0, { mummy: true, lightK: 0.4, caption: 'The Patient needed a roommate.' }),
  nurse: M('The Crawling Nurse', '💉', 0xff3a5a, 'crawl', 0xe8e0e0, { hair: 0x1a1a1a, extraArms: true, eyeSize: 1.4, caption: 'The Crawling Nurse gave you a shot.' }),
  shadowdoc: M('The Shadow Doctor', '🩺', 0x5affd8, 'float', 0x0a1a1a, { ghost: 0x0a2a2a, robe: 0xe8f0f0, hood: 0x101818, boneFace: true, caption: "The Shadow Doctor says you won't recover." }),
  sporegiant: M('The Spore Giant', '🍄', 0xc86aff, 'upright', 0x5a3a2a, { bulk: 1.4, scale: 1.45, bigHead: true, clownButtons: true, caption: 'The Spore Giant covered you in spores.' }),
  toad: M('The Toad Horror', '🐸', 0xffe03a, 'crawl', 0x3a5a1a, { eyeSize: 2, bulk: 1.3, speed: 1.6, caption: 'The Toad Horror snapped you up with its tongue.' }),
  moldspirit: M('The Mold Spirit', '🦠', 0x8aff4a, 'float', 0x2a4a1a, { ghost: 0x1a4a0a, tentacles: true, caption: 'The Mold Spirit grew on you.' }),
  sheriff: M('The Undead Sheriff', '🤠', 0xffc83a, 'upright', 0x4a3a2a, { hat: true, boneFace: true, ribs: true, caption: 'The Undead Sheriff ran you out of town.' }),
  rattler: M('The Rattler', '🐍', 0xff6a1a, 'crawl', 0x8a6a3a, { tail: true, spikes: 9, spikeLen: 0.6, speed: 2.5, caption: 'The Rattler struck first.' }),
  tumbleghost: M('The Tumbleweed Phantom', '🌵', 0xffe08a, 'float', 0x8a6a3a, { ghost: 0x3a2a10, robe: 0xa88a5a, hood: 0x8a6a40, caption: 'The Tumbleweed Phantom blew you away.' }),
  harpy: M('The Storm Harpy', '🦅', 0xfff04a, 'float', 0x4a4a6a, { wings: true, legsVisible: true, horns: true, flicker: false, caption: 'The Storm Harpy carried you off.' }),
  thunderbeast: M('The Thunder Beast', '⚡', 0x5ad8ff, 'crawl', 0x2a2a4a, { fur: 0x6a6a8a, bulk: 1.2, horns: true, speed: 2.4, caption: 'The Thunder Beast struck like lightning.' }),
  cloudwraith: M('The Cloud Wraith', '☁️', 0xb0e0ff, 'float', 0xe8f0ff, { ghost: 0x3a4a6a, robe: 0xf0f4ff, hood: 0xd8e4f0, boneFace: true, lightK: 0.3, caption: 'The Cloud Wraith swallowed you in fog.' }),
  mannequin: M('The Mannequin', '🧍', 0xffffff, 'upright', 0xe8dcd0, { face: 0xf0e4d8, eyeSize: 0.6, caption: 'The Mannequin moved when you blinked.' }),
  cartcrawler: M('The Cart Crawler', '🛒', 0xff3a3a, 'crawl', 0x8a8a90, { metal: true, extraArms: true, eyes: 6, caption: 'The Cart Crawler took you to checkout.' }),
  securityghost: M('The Security Ghost', '🔦', 0x3a8aff, 'float', 0x1a2a4a, { ghost: 0x0a1a3a, robe: 0x14203a, hat: true, caption: 'The Security Ghost escorted you out.' }),
  mantis: M('The Mantis Queen', '🦗', 0x9aff3a, 'upright', 0x3a6a1a, { bigHead: true, eyeSize: 2.2, longClaws: true, armLen: 3.2, caption: 'The Mantis Queen caught you in her claws.' }),
  ant: M('The Giant Ant', '🐜', 0xff2a2a, 'crawl', 0x2a0a0a, { extraArms: true, horns: true, speed: 2.6, caption: 'The Giant Ant carried you back to the nest.' }),
  moth: M('The Moth Specter', '🦋', 0xffe8a0, 'float', 0x8a7a5a, { wings: true, eyeSize: 2, flicker: false, caption: 'The Moth Specter dusted you.' }),
  clockknight: M('The Clockwork Knight', '⚙️', 0xffb43a, 'upright', 0x8a6a2a, { metal: true, eyes: 1, eyeSize: 2.4, bulk: 1.2, caption: 'The Clockwork Knight wound you down.' }),
  gearspider: M('The Gear Spider', '🕷', 0xff6a1a, 'crawl', 0x6a5a3a, { metal: true, eyes: 6, extraArms: true, caption: 'The Gear Spider ground you up.' }),
  cuckoo: M('The Cuckoo Phantom', '🕰', 0xff3aa0, 'float', 0x4a2a1a, { ghost: 0x3a0a1a, robe: 0x2a1a10, horns: true, boneFace: true, caption: "Cuckoo! Cuckoo! Time's up." }),
  molebeast: M('The Mole Beast', '🦡', 0xff5a5a, 'crawl', 0x3a2a20, { fur: 0x4a3a2a, bulk: 1.3, longClaws: true, eyeSize: 0.7, caption: 'The Mole Beast dragged you underground.' }),
  minerghost: M('The Lost Miner', '⛏', 0xffd23a, 'upright', 0x3a3a30, { hat: true, boneFace: true, ribs: true, lightK: 0.6, caption: 'The Lost Miner buried you.' }),
  lanternwisp: M('The Lantern Wisp', '🏮', 0xffa23a, 'float', 0x2a1a0a, { lure: true, ghost: 0x4a2a0a, robe: 0x1a1008, hood: 0x1a1008, boneFace: true, caption: 'The Lantern Wisp led you into the dark.' }),
  shadowstalker: M('The Shadow Stalker', '🌑', 0xffffff, 'upright', 0x050508, { scale: 1.6, longClaws: true, armLen: 3.4, caption: 'The Shadow Stalker was right behind you.' }),
  voidcrawler: M('The Void Crawler', '🕳', 0xb44aff, 'crawl', 0x0a0414, { eyes: 6, extraArms: true, spikes: 8, spikeLen: 1.5, speed: 2.6, caption: 'The Void Crawler pulled you into nothing.' }),
  nightmareking: M('The Nightmare King', '👑', 0xff1a4a, 'float', 0x14040a, { ghost: 0x3a0010, robe: 0x0a0204, hood: 0x0a0204, horns: true, boneFace: true, scale: 1.5, caption: 'The Nightmare King rules your dreams now.' }),
  unicorn: M('The Rainbow Unicorn', '🦄', 0xff6ae8, 'crawl', 0xf8f0ff, { horns: true, speed: 2.4, caption: 'The Rainbow Unicorn poked you.' }),
  cloudclown: M('The Cloud Clown', '🎈', 0x3affff, 'upright', 0xff7ac8, { clown: true, face: 0xfff0f8, caption: 'The Cloud Clown popped your bubble.' }),
  glitterghost: M('The Glitter Ghost', '✨', 0xffe03a, 'float', 0xffc8f0, { ghost: 0x5a1a4a, robe: 0xffd8f4, hood: 0xffb0e8, lightK: 0.3, caption: 'The Glitter Ghost made you sparkle… forever.' }),
});
// ---- each monster's signature look, so no two of them share a silhouette
// snout [len, width], ears, beak, antennae, mandibles, headShape (long | wide | dome), faceless, grin, unihorn, mane, cobra,
// hat (tricorn | cowboy | miner | cap | nurse | crown | helm | shroom | feathers | doctor | bow | swirl | bandana | party | top),
// held (scythe | sword | pickaxe | syringe | anchor | hook | flashlight | clipboard | lasso | lantern | staff | iv),
// orbit (stars | cubes | embers | snow | spores | skulls | shards | bolts | wisps | sparkles), abdomen, shell, cracks, crystals,
// flames, mushrooms, leaves, collar, badge, clockFace, gearBack, windKey, cloudBase, vortex, tumble, springBox, cart, balloons,
// pincers, digClaws, noLimbs, hideLegs, stripes, rattle, wings: 'round', wingColor
const LOOKS = {
  crawler: { abdomen: 0x0d160e, abdomenMark: true },
  wraith: { held: 'scythe' },
  frostmaw: { crystals: 0x9ae8ff },
  antlered: { snout: [1.3, 0.75] },
  colossus: { cracks: 0xff6a1a },
  behemoth: { shell: 0x2a3a20, snout: [1.6, 1.2] },
  titanwraith: { held: 'scythe', orbit: 'skulls' },
  scorpion: { pincers: 0xd8a860, shell: 0x5a3418 },
  dustphantom: { vortex: 0xc8a060, robe: null, hideLegs: true },
  drowned: { held: 'anchor', leaves: 0x2a5a3a },
  xeno: { headShape: 'long' },
  voidwisp: { orbit: 'stars' },
  gingerbrute: { cracks: 0xfff4f8, ears: 'round' },
  candyspider: { stripes: [0xd02a6a, 0xf8f0f0], abdomen: 0xff4a9a, abdomenMark: true },
  sugarghost: { hat: 'swirl', hood: null },
  vampire: { collar: 0x0a0408 },
  werewolf: { snout: [1.3, 0.9], ears: 'pointy', horns: false },
  banshee: { orbit: 'wisps' },
  serpent: { noLimbs: true, cobra: 0x2a6a1a },
  junglebrute: { leaves: 0x3a7a2a },
  tiki: { hat: 'feathers', horns: false, held: 'staff' },
  teddy: { horns: false, ears: 'round', windKey: true },
  doll: { hat: 'bow', bowColor: 0xff8ac8 },
  jackbox: { springBox: 0x5a2aa0, robe: null, hideLegs: true },
  raptor: { snout: [1.1, 0.75], mane: [0xd85a1a, 0xe8a03a, 0xd85a1a, 0xe8a03a] },
  trex: { snout: [1.9, 1.2] },
  ptero: { beak: 2.6, wingColor: 0x8a5a3a },
  ghostpirate: { hat: 'bandana', held: 'sword' },
  krakenling: { headShape: 'dome' },
  skullcaptain: { held: 'hook' },
  robohound: { snout: [1.2, 0.8], antennae: true },
  sentinel: { antennae: true },
  glitch: { orbit: 'cubes', hood: null },
  magmagolem: { cracks: 0xff5a1a, flames: 0xff6a1a },
  salamander: { snout: [1.2, 1.1], flames: 0xff8a1a },
  emberwraith: { orbit: 'embers', flames: 0xff4a1a },
  iceknight: { hat: 'helm', held: 'sword', heldColor: 0x9af0ff, crystals: 0xbff4ff, horns: false },
  frostspider: { abdomen: 0xc8f0ff, crystals: 0xa0f0ff, mandibles: true },
  snowqueen: { hat: 'crown', crown: 'ice', held: 'staff', heldColor: 'ice', orbit: 'snow' },
  patient: { robe: 0x9ad0e0, legsVisible: true, held: 'iv' },
  nurse: { hat: 'nurse', held: 'syringe' },
  shadowdoc: { hat: 'doctor', held: 'clipboard', hood: null },
  sporegiant: { hat: 'shroom', capColor: 0xa02ac8, bigHead: false, clownButtons: false, mushrooms: 0xc86aff, orbit: 'spores' },
  toad: { headShape: 'wide', eyePos: [[-0.45, 1.45], [0.45, 1.45]] },
  moldspirit: { tentacles: false, mushrooms: 0x8aff4a, cloudBase: 0x6a8a3a, robe: 0x2a3a1a },
  sheriff: { hat: 'cowboy', badge: true, held: 'lasso' },
  rattler: { noLimbs: true, rattle: true, stripes: [0x8a6a3a, 0x3a2a14] },
  tumbleghost: { tumble: true },
  harpy: { beak: 1.1, orbit: 'bolts', horns: false, wingColor: 0x5a5a8a },
  thunderbeast: { snout: [1.0, 1.1], mane: [0x5ad8ff, 0xffffff, 0x5ad8ff, 0xffffff, 0x5ad8ff] },
  cloudwraith: { cloudBase: 0xe8f0ff },
  mannequin: { faceless: true },
  cartcrawler: { cart: true },
  securityghost: { hat: 'cap', held: 'flashlight' },
  mantis: { antennae: true, abdomen: 0x4a8a2a },
  ant: { antennae: true, mandibles: true, abdomen: 0x3a0a0a, horns: false },
  moth: { wings: 'round', wingColor: 0xb8a070, antennae: 'feather' },
  clockknight: { hat: 'helm', plume: 0xffb43a, gearBack: true },
  gearspider: { abdomen: 0x8a6a2a, gearBack: true },
  cuckoo: { clockFace: true, beak: 0.9, horns: false },
  molebeast: { snout: [0.9, 0.7], digClaws: true },
  minerghost: { hat: 'miner', held: 'pickaxe' },
  lanternwisp: { held: 'lantern', lure: false },
  shadowstalker: { grin: true, orbit: 'wisps' },
  voidcrawler: { cracks: 0xb44aff, orbit: 'shards' },
  nightmareking: { hat: 'crown', crown: 0xff1a4a, held: 'staff', horns: false, hood: null },
  unicorn: { snout: [1.4, 0.8], unihorn: true, horns: false, ears: 'pointy', mane: [0xff3a3a, 0xff9a1a, 0xffe03a, 0x3ad86a, 0x3a8aff, 0xb44aff] },
  cloudclown: { balloons: [0xff3a6a, 0x3affff, 0xffe03a], hat: 'party' },
  glitterghost: { orbit: 'sparkles', hat: 'bow', hood: null },
};
for (const [k, v] of Object.entries(LOOKS)) Object.assign(MONSTERS[k], v);
// ---- Levels 27-38
Object.assign(MONSTERS, {
  substitute: M('The Substitute', '👩‍🏫', 0xff4a4a, 'upright', 0x3a3a4a, { glasses: true, hat: 'bun', held: 'ruler', orbit: 'papers', face: 0xd8c8c0, caption: 'The Substitute gave you detention. Forever.' }),
  lockercrawler: M('The Locker Crawler', '🗄', 0x3affb0, 'crawl', 0x3a5a8a, { locker: 0x3a5a8a, extraArms: true, eyes: 6, caption: 'The Locker Crawler stuffed you inside.' }),
  chalkghost: M('The Chalk Ghost', '📝', 0xffffff, 'float', 0xe8e8e0, { ghost: 0x3a3a3a, robe: 0xe0e0d8, hat: 'mortarboard', drips: 0xf0f0f0, boneFace: true, lightK: 0.4, caption: 'The Chalk Ghost erased you.' }),
  butcherchef: M('The Butcher Chef', '🔪', 0xff3a1a, 'upright', 0xd8c0a8, { hat: 'chef', apron: 0xf0f0f0, held: 'cleaver', bulk: 1.3, caption: "The Butcher Chef added you to tonight's menu." }),
  ratking: M('The Rat King', '🐀', 0xff2a2a, 'crawl', 0x5a5048, { snout: [1.0, 0.6], ears: 'round', tail: true, hat: 'crown', fur: 0x4a4038, speed: 2.4, caption: 'The Rat King and his court nibbled you.' }),
  steamphantom: M('The Steam Phantom', '♨️', 0x7ad8ff, 'float', 0xd8e0e8, { ghost: 0x2a3a4a, cloudBase: 0xf0f4f8, held: 'ladle', orbit: 'bubbles', lightK: 0.4, caption: 'The Steam Phantom boiled you.' }),
  maestro: M('The Masked Maestro', '🎼', 0xffc83a, 'upright', 0x101014, { mask: true, hat: 'top', collar: 0x0a0a0a, held: 'baton', orbit: 'notes', face: 0xd8c8c0, caption: 'The Masked Maestro conducted your final act.' }),
  ballerina: M('The Broken Ballerina', '🩰', 0xff6ad0, 'crawl', 0xf0d8e0, { face: 0xf8f0f0, tutu: 0xffb0d0, hat: 'bun', hairColor: 0x3a2010, extraArms: true, eyeSize: 1.4, caption: 'The Broken Ballerina danced you to pieces.' }),
  diva: M('The Screaming Diva', '🎤', 0xff3a6a, 'float', 0x8a1a2a, { ghost: 0x4a0a14, robe: 0x8a0a1a, hair: 0x2a0a0a, hat: 'crown', crown: 0xffc83a, orbit: 'feathers', caption: 'The Screaming Diva hit the highest note.' }),
  whelp: M('The Young Dragon', '🐉', 0xffa21a, 'crawl', 0x6a1a1a, { snout: [1.4, 1.0], wings: true, wingColor: 0x8a2a1a, tail: true, horns: true, spikes: 8, flames: 0xff6a1a, caption: 'The Young Dragon toasted you.' }),
  treasuregolem: M('The Treasure Golem', '💰', 0xff3a6a, 'upright', 0xc8a030, { metal: true, bulk: 1.5, scale: 1.5, orbit: 'coins', crystals: 0xff3a6a, caption: 'The Treasure Golem added you to the hoard.' }),
  wyrm: M('The Wyrm Spirit', '🐲', 0x5affc8, 'float', 0x2a5a4a, { ghost: 0x0a3a2a, noLimbs: true, tail: true, horns: true, snout: [1.2, 0.8], mane: [0x5affc8, 0xffffff, 0x5affc8, 0xffffff], caption: 'The Wyrm Spirit coiled around you.' }),
  ogre: M('The Lantern Ogre', '👹', 0xffe03a, 'upright', 0xa02a1a, { bulk: 1.4, scale: 1.45, horns: true, held: 'club', mane: [0xf0f0f0, 0xe0e0e0, 0xf0f0f0], caption: 'The Lantern Ogre clubbed you.' }),
  foxspirit: M('The Nine-Tail Fox', '🦊', 0x3affff, 'crawl', 0xe8a040, { snout: [1.1, 0.7], ears: 'pointy', tails: 5, speed: 2.6, caption: 'The Nine-Tail Fox tricked you.' }),
  paperlantern: M('The Paper Lantern', '🏮', 0xffe03a, 'float', 0x3a1a0a, { paperLantern: 0xff5a2a, eyes: 1, eyeSize: 2.2, hideLegs: true, flicker: false, caption: 'The Paper Lantern swallowed your light.' }),
  steelgiant: M('The Steel Giant', '🏗', 0xffa21a, 'upright', 0x6a6a72, { metal: true, hat: 'hardhat', held: 'wrench', bulk: 1.4, scale: 1.5, caption: 'The Steel Giant bolted you down.' }),
  gargoyle: M('The Gargoyle', '🗿', 0xff3a3a, 'crawl', 0x5a5a60, { wings: true, wingColor: 0x4a4a50, horns: true, snout: [0.8, 1.0], spikes: 6, caption: 'The Gargoyle swooped off the roof.' }),
  smogwraith: M('The Smog Wraith', '🌫', 0xc8ff3a, 'float', 0x3a3a3a, { ghost: 0x1a1a1a, cloudBase: 0x4a4a4a, hood: 0x1a1a1a, held: 'umbrella', caption: 'The Smog Wraith choked out your light.' }),
  sharkman: M('The Shark Man', '🦈', 0x3affff, 'upright', 0x5a7a8a, { fin: true, snout: [1.0, 1.2], face: 0xe8ecf0, caption: 'The Shark Man smelled you from a mile away.' }),
  crab: M('The Giant Crab', '🦀', 0xffe03a, 'crawl', 0xc03a1a, { pincers: 0xd84a2a, shell: 0xa02a1a, eyePos: [[-0.45, 1.45], [0.45, 1.45]], extraArms: true, caption: 'The Giant Crab pinched you.' }),
  eel: M('The Electric Eel', '⚡', 0x5affff, 'float', 0x3a5a2a, { ghost: 0x0a2a3a, noLimbs: true, tail: true, stripes: [0x2a3a1a, 0x5a7a2a], cracks: 0x5affff, flicker: false, caption: 'The Electric Eel zapped you.' }),
  madscientist: M('The Mad Scientist', '🧪', 0x8aff3a, 'upright', 0x3a3a40, { robe: 0xf4f4f0, legsVisible: true, goggles: true, held: 'beaker', face: 0xe0d0c0, caption: 'The Mad Scientist needed a test subject.' }),
  experiment: M('The Experiment', '🧟', 0x8aff3a, 'crawl', 0x6a8a4a, { cracks: 0x8aff3a, extraArms: true, eyes: 6, bulk: 1.2, caption: 'The Experiment escaped… and found you.' }),
  brainjar: M('The Brain in a Jar', '🧠', 0xff5aa0, 'float', 0x6a6a72, { brainJar: true, tentacles: true, metal: true, flicker: false, caption: 'The Brain in a Jar read your mind.' }),
  flytrap: M('The Flytrap', '🪴', 0xff3a3a, 'upright', 0x2a6a1a, { trapHead: 0x3a8a2a, leaves: 0x3a7a1a, caption: 'The Flytrap snapped shut.' }),
  thornbeast: M('The Thorn Beast', '🌹', 0xff2a4a, 'crawl', 0x2a3a1a, { spikes: 12, spikeLen: 1.4, leaves: 0x4a6a1a, crystals: 0xff2a4a, caption: 'The Thorn Beast tangled you in brambles.' }),
  pollenwitch: M('The Pollen Witch', '🌼', 0xffe03a, 'float', 0x6a8a3a, { ghost: 0x2a4a0a, robe: 0x4a6a2a, hat: 'flower', orbit: 'petals', caption: 'The Pollen Witch made you sneeze… forever.' }),
  lifeguard: M('The Drowned Lifeguard', '🛟', 0x3affd0, 'upright', 0x4a6a6a, { ghost: 0x0a2a2a, hair: 0x1a3a2a, held: 'buoy', caption: 'The Drowned Lifeguard was off duty.' }),
  hermit: M('The Hermit Horror', '🐚', 0xff8a3a, 'crawl', 0xc06a3a, { conch: 0xe8c8a8, antennae: true, eyePos: [[-0.45, 1.45], [0.45, 1.45]], caption: 'The Hermit Horror needed a bigger shell.' }),
  gull: M('The Gull Specter', '🕊', 0xffd23a, 'float', 0xe8e8e8, { beak: 1.3, wings: true, wingColor: 0xd8d8d8, legsVisible: true, flicker: false, caption: 'The Gull Specter stole your fries… and you.' }),
  statue: M('The Living Statue', '🗽', 0x9ae8ff, 'upright', 0xe8e4dc, { face: 0xf0ece4, hat: 'laurel', held: 'spear', eyeSize: 0.6, caption: 'The Living Statue turned you to stone.' }),
  fossil: M('The Fossil Beast', '🦴', 0xff6a1a, 'crawl', 0xd8ccb0, { ribs: true, snout: [1.6, 1.0], tail: true, spikes: 9, spikeLen: 0.7, caption: 'The Fossil Beast came back to life.' }),
  portrait: M('The Haunted Portrait', '🖼', 0xff2a4a, 'float', 0x2a1a24, { frame: 0xc8963a, ghost: 0x2a0a14, hideLegs: true, caption: 'The Haunted Portrait added you to its collection.' }),
  gator: M('The Sewer Gator', '🐊', 0xffe03a, 'crawl', 0x2a4a2a, { snout: [2.0, 1.3], tail: true, spikes: 10, spikeLen: 0.6, bulk: 1.2, caption: 'The Sewer Gator snapped you up.' }),
  sludgeman: M('The Sludge Man', '🟢', 0x8aff2a, 'upright', 0x4a8a1a, { ghost: 0x2a5a0a, drips: 0x6aff2a, bulk: 1.3, caption: 'The Sludge Man slimed you.' }),
  sewerspecter: M('The Sewer Specter', '🪰', 0xc8ff3a, 'float', 0x3a4a2a, { ghost: 0x1a2a0a, cloudBase: 0x4a6a2a, hood: 0x1a2410, orbit: 'flies', caption: 'The Sewer Specter dragged you down the drain.' }),
});
// ---- Levels 39-49, and the three giant bosses of level 51
Object.assign(MONSTERS, {
  astronaut: M('The Lost Astronaut', '👨‍🚀', 0x5ad8ff, 'upright', 0xe8e8ec, { spaceHelmet: true, badge: true, held: 'flashlight', face: 0x6a7a7a, caption: 'The Lost Astronaut needed a crewmate.' }),
  hullcrawler: M('The Hull Crawler', '🛰', 0xff3a3a, 'crawl', 0x8a8e98, { metal: true, eyes: 1, eyeSize: 2.4, extraArms: true, spikes: 6, spikeLen: 1.6, antennae: true, caption: 'The Hull Crawler patched you into the wall.' }),
  stareater: M('The Star Eater', '🌠', 0xd07aff, 'float', 0x2a1a4a, { ghost: 0x4a1a8a, headShape: 'dome', tentacles: true, orbit: 'stars', caption: 'The Star Eater swallowed your light.' }),
  witch: M('The Wicked Witch', '🧙', 0x8aff3a, 'upright', 0x2a1a2a, { hat: 'witch', held: 'broom', robe: 0x1a0a1a, legsVisible: true, face: 0x8aa04a, caption: 'The Wicked Witch put you in her pot.' }),
  storywolf: M('The Storybook Wolf', '🐺', 0xffd23a, 'crawl', 0x4a4a52, { snout: [1.4, 0.9], ears: 'pointy', fur: 0x5a5a62, hat: 'nightcap', speed: 2.6, caption: 'What big teeth it had…' }),
  pageghost: M('The Page Ghost', '📖', 0x3a3aff, 'float', 0xf0ecd8, { ghost: 0x1a1a3a, robe: 0xf0ecd8, drips: 0x1a1a2a, held: 'book', orbit: 'papers', caption: 'The Page Ghost wrote your final chapter.' }),
  conductor: M('The Phantom Conductor', '🎫', 0xffb43a, 'upright', 0x1a2040, { hat: 'cap', badge: true, held: 'lantern', heldColor: 0xffb43a, collar: 0x1a2040, ghost: 0x0a0a1a, caption: 'The Phantom Conductor punched your ticket.' }),
  coalcrawler: M('The Coal Crawler', '⚫', 0xff6a1a, 'crawl', 0x14100e, { cracks: 0xff6a1a, flames: 0xff8a2a, bulk: 1.2, eyes: 6, caption: 'The Coal Crawler threw you in the furnace.' }),
  steamghost: M('The Ghost Train', '🚂', 0xfff0a0, 'float', 0x3a3a40, { ghost: 0x1a1a1a, cloudBase: 0x8a8a90, hat: 'top', orbit: 'embers', eyes: 1, eyeSize: 2.6, caption: 'The Ghost Train ran you over.' }),
  pixelbrute: M('The Pixel Brute', '👾', 0x3aff8a, 'upright', 0x2a2a6a, { stripes: [0x3a3aff, 0xff3ad8], bigHead: true, eyes: 1, eyeSize: 2.2, orbit: 'cubes', bulk: 1.3, caption: 'GAME OVER. The Pixel Brute wins.' }),
  coincruncher: M('The Coin Cruncher', '🪙', 0xffd23a, 'crawl', 0x8a6a1a, { metal: true, headShape: 'wide', orbit: 'coins', eyePos: [[-0.45, 1.45], [0.45, 1.45]], caption: 'The Coin Cruncher ate you like a token.' }),
  clawghost: M('The Claw', '🕹', 0xff3ad8, 'float', 0x3a1a4a, { ghost: 0x6a0a8a, robe: 0x2a0a3a, hood: 0x2a0a3a, held: 'claw', boneFace: true, caption: 'The Claw picked YOU as the prize.' }),
  director: M('The Mad Director', '🎬', 0xffe03a, 'upright', 0x1a1a1a, { hat: 'beret', glasses: true, held: 'megaphone', face: 0xd8c0a8, caption: 'CUT! The Mad Director ended your scene.' }),
  rubbersuit: M('The Rubber Suit Monster', '🦎', 0xff3a1a, 'crawl', 0x3a6a3a, { snout: [1.2, 1.2], spikes: 10, spikeLen: 1.2, tail: true, bulk: 1.3, caption: 'The Rubber Suit Monster stomped you. Take two!' }),
  projector: M('The Projector Ghost', '📽', 0xfff4c0, 'float', 0x2a2a2a, { ghost: 0x1a1a1a, eyes: 1, eyeSize: 3, held: 'flashlight', robe: 0x14141a, orbit: 'papers', caption: 'The Projector Ghost made you a movie star. Forever.' }),
  gatorman: M('The Gator Man', '🐊', 0xffd23a, 'upright', 0x3a5a2a, { snout: [1.8, 1.1], tail: true, hat: 'straw', bulk: 1.2, caption: 'The Gator Man dragged you into the bayou.' }),
  mossbeast: M('The Moss Beast', '🌿', 0x8aff3a, 'crawl', 0x2a3a1a, { fur: 0x4a6a2a, leaves: 0x3a5a1a, mushrooms: 0x8aff3a, bulk: 1.3, caption: 'The Moss Beast grew over you.' }),
  boglady: M('The Bog Lady', '🪷', 0xc8ff6a, 'float', 0x4a5a3a, { ghost: 0x1a2a0a, robe: 0x3a4a2a, hair: 0x1a2a10, leaves: 0x3a6a1a, orbit: 'wisps', caption: 'The Bog Lady pulled you under the lilies.' }),
  gladiator: M('The Cursed Gladiator', '⚔️', 0xff3a3a, 'upright', 0x8a6a4a, { hat: 'helm', plume: 0xd01a1a, held: 'sword', shield: 0xb88a3a, bulk: 1.2, caption: 'The Cursed Gladiator won the crowd.' }),
  arenalion: M('The Arena Lion', '🦁', 0xffb43a, 'crawl', 0xc89a5a, { snout: [1.0, 1.0], ruff: 0x8a4a1a, tail: true, bulk: 1.3, speed: 2.6, caption: 'The Arena Lion was hungry.' }),
  emperor: M("The Emperor's Ghost", '🏛', 0xffe03a, 'float', 0x6a1a6a, { ghost: 0x3a0a3a, robe: 0x6a1a6a, hat: 'laurel', held: 'staff', boneFace: true, caption: "The Emperor's Ghost gave a thumbs down." }),
  scribble: M('The Scribble', '✏️', 0x3a3aff, 'upright', 0xf8f8f8, { outline: true, face: 0xffffff, grin: true, caption: 'The Scribble scribbled you out.' }),
  eraser: M('The Eraser Beast', '🩷', 0xff3a6a, 'crawl', 0xff9ab0, { outline: true, bulk: 1.3, caption: 'The Eraser Beast rubbed you out.' }),
  inkblot: M('The Ink Blot', '🖋', 0x3affff, 'float', 0x0a0a14, { ghost: 0x0a0a2a, drips: 0x2a2a6a, orbit: 'papers', robe: 0x0a0a14, caption: 'The Ink Blot spilled all over you.' }),
  captain: M('The Drowned Captain', '⚓', 0x5affd8, 'upright', 0xe8ecf0, { hat: 'cap', capCol: 0xf0f0f0, collar: 0x1a2a4a, held: 'wheel', ghost: 0x0a2a2a, caption: 'The Drowned Captain went down with the ship… and you.' }),
  barnacle: M('The Barnacle Brute', '🐚', 0xff8a3a, 'crawl', 0x4a5a5a, { shell: 0x3a4a4a, mushrooms: 0xe8e0d0, extraArms: true, bulk: 1.3, caption: 'The Barnacle Brute stuck to you.' }),
  foghorn: M('The Foghorn Phantom', '📯', 0xffe8a0, 'float', 0x8a9098, { ghost: 0x2a3a4a, cloudBase: 0xb0b8c0, tentacles: true, orbit: 'bubbles', caption: 'BWAAAMP. The Foghorn Phantom found you.' }),
  spiderqueen: M('The Spider Queen', '🕷', 0xb44aff, 'crawl', 0x1a0a1a, { abdomen: 0x2a0a2a, abdomenMark: true, extraArms: true, eyes: 6, hat: 'crown', crown: 0xb44aff, mandibles: true, scale: 1.5, caption: 'The Spider Queen wrapped you up for later.' }),
  cocoonman: M('The Cocoon Man', '🕸', 0xffffff, 'upright', 0xe8e8e0, { mummy: true, held: 'hook', orbit: 'flies', caption: 'The Cocoon Man spun you into a cocoon.' }),
  webwraith: M('The Web Wraith', '🕸️', 0xff3a5a, 'float', 0xd8d8d8, { ghost: 0x2a2a2a, eyes: 6, tentacles: true, hood: 0xc8c8c8, caption: 'The Web Wraith caught you in its web.' }),
  reflection: M('Your Reflection', '🪞', 0xffffff, 'upright', 0xc0c8d0, { metal: true, faceless: true, grin: false, caption: 'Your Reflection stepped out of the mirror.' }),
  shardbeast: M('The Shard Beast', '💎', 0x9ae8ff, 'crawl', 0x8a9aaa, { metal: true, crystals: 0x9ae8ff, spikes: 8, spikeLen: 1.6, caption: 'The Shard Beast cut you to pieces.' }),
  mirrorqueen: M('The Mirror Queen', '👸', 0xff6ae8, 'float', 0xc0c8d0, { metal: true, frame: 0xd0d8e0, hat: 'crown', crown: 0xd0d8e0, hideLegs: true, caption: 'The Mirror Queen trapped you in the glass.' }),
  // ---- Level 51: THE FINAL NIGHTMARE (giants)
  nightmarelord: M('The Nightmare Lord', '😈', 0xff1a3a, 'upright', 0x14040a, { giant: true, scale: 4.4, speed: -2.5, sight: 170, hear: 40, lunge: 21, bulk: 1.3, hat: 'crown', crown: 0xff1a3a, flames: 0xff2a1a, collar: 0x0a0204, held: 'staff', orbit: 'skulls', cracks: 0xff1a3a, horns: true, caption: 'The Nightmare Lord claimed you. Forever.' }),
  abyssdragon: M('The Abyss Dragon', '🐉', 0xb44aff, 'crawl', 0x1a0a2a, { giant: true, scale: 3.6, speed: -1, sight: 140, hear: 30, lunge: 14, snout: [1.8, 1.1], wings: true, wingColor: 0x3a0a5a, tail: true, horns: true, spikes: 10, spikeLen: 2, flames: 0xb44aff, cracks: 0xb44aff, caption: 'The Abyss Dragon breathed the void on you.' }),
  voidqueen: M('The Void Queen', '🌌', 0x5affff, 'float', 0x0a0a1a, { giant: true, scale: 4.0, speed: -3, sight: 170, hear: 60, lunge: 17, ghost: 0x0a2a4a, robe: 0x050510, hat: 'crown', crown: 'ice', held: 'scythe', heldColor: 0x5affff, orbit: 'shards', hair: 0xe8f8ff, caption: 'The Void Queen erased you from existence.' }),
});
// ---------------------------------------------------------------------------
// Levels 50-98: built from a kit. Each one gets its own town + two new wild areas (made from a different mix of
// buildings and props, in its own colors), two older areas, its own sky, and three new monsters.
// town: [name, building style, wall, roof, window glow, [props]]   a / b: [name, [props]]   m: [key, name, emoji, eye, posture, body, look]
// ---------------------------------------------------------------------------
const KIT = [
  { n: 'Yeti Peaks', e: '🏔', c: '#bfe6ff', tint: 0x9ad8ff, moon: 0xe8f4ff, w: 'snow', town: ['🏔 Mountain Lodge', 'cottage', 0x6a4a30, 0x3a2a20, 0xffc86a, ['pine', 'fire', 'lamp']], a: ['❄️ Avalanche Slopes', ['boulder', 'pine']], b: ['🧊 Glacier Caves', ['crystal', 'boulder']], reuse: ['snowwoods', 'lake'], deco: 'stars',
    m: [['yeti', 'The Yeti', '🦍', 0x3ad8ff, 'upright', 0xe8f0f8, { fur: 0xf4f8ff, bulk: 1.6, scale: 1.6, ears: 'round' }], ['snowwolf', 'The Snow Wolf', '🐺', 0x9ae8ff, 'crawl', 0xd8e0e8, { snout: [1.3, 0.8], ears: 'pointy', fur: 0xe8eef4 }], ['avalanche', 'The Avalanche Spirit', '❄️', 0xbff4ff, 'float', 0xe8f4ff, { cloudBase: 0xffffff, orbit: 'snow', ghost: 0x2a4a6a }]] },
  { n: 'Scarecrow Harvest', e: '🌾', c: '#ffc84a', tint: 0xffa21a, moon: 0xffb050, w: 'embers', town: ['🌾 Harvest Village', 'house', 0x8a4a2a, 0x4a2a1a, 0xffb43a, ['haybale', 'windmill', 'fence']], a: ['🌾 Endless Wheat', ['haybale', 'statue']], b: ['🍎 The Old Orchard', ['deadtree', 'barrel']], reuse: ['fields', 'pumpkins'], deco: 'fireflies',
    m: [['harvester', 'The Harvester', '🌾', 0xff8a1a, 'upright', 0x8a6a3a, { hat: 'straw', held: 'scythe', stripes: [0xb8963a, 0x8a6a3a] }], ['crowking', 'The Crow King', '🐦‍⬛', 0xff2a2a, 'float', 0x1a1a1a, { wings: true, wingColor: 0x14141a, beak: 1.4, hat: 'crown', orbit: 'feathers', flicker: false }], ['burlap', 'The Burlap Crawler', '🧵', 0xffd23a, 'crawl', 0xa88a5a, { stripes: [0xa88a5a, 0x7a5a3a], extraArms: true, grin: true }]] },
  { n: 'Mirage Oasis', e: '🌴', c: '#ffd27a', tint: 0xffc84a, moon: 0xfff0c0, w: 'sand', town: ['🌴 Oasis Market', 'tent', 0xd8b880, 0xc04a2a, 0xffd27a, ['palm', 'lanterns', 'pool:water']], a: ['🏜 Shifting Sands', ['cactus', 'bones']], b: ['💧 Oasis Pools', ['pool:water', 'palm']], reuse: ['dunes', 'canyon'], deco: 'stars',
    m: [['mirage', 'The Mirage', '🌫', 0xffd27a, 'float', 0xffd27a, { vortex: 0xffd27a, orbit: 'sparkles', hideLegs: true, robe: null }], ['duneworm', 'The Dune Worm', '🪱', 0xff6a1a, 'crawl', 0xc8a070, { noLimbs: true, tail: true, spikes: 10, spikeLen: 1.4, headShape: 'wide', scale: 1.4 }], ['raider', 'The Desert Raider', '🏴', 0xffe03a, 'upright', 0x6a4a3a, { hat: 'bandana', held: 'sword', boneFace: true }]] },
  { n: 'Goblin Market', e: '👺', c: '#8aff3a', tint: 0x6aff3a, moon: 0xd8ff9a, w: null, town: ['👺 Goblin Bazaar', 'tent', 0x5a3a6a, 0x3a8a3a, 0x9aff6a, ['lanterns', 'crates', 'coinpile']], a: ['🍄 Mushroom Hollows', ['shroom', 'alienshroom']], b: ['🗑 Junk Heaps', ['crates', 'barrel']], reuse: ['forest', 'caves'], deco: 'fireflies',
    m: [['goblinking', 'The Goblin King', '👑', 0xffe03a, 'upright', 0x5a8a2a, { hat: 'crown', ears: 'pointy', held: 'club' }], ['shroomgoblin', 'The Mushroom Goblin', '🍄', 0xff3a3a, 'crawl', 0x6a9a3a, { hat: 'shroom', capColor: 0xd84a1a, ears: 'pointy' }], ['hexwitch', 'The Hex Witch', '🔮', 0xc87aff, 'float', 0x3a1a4a, { hat: 'witch', orbit: 'stars', robe: 0x2a0a3a }]] },
  { n: 'Vampire Castle', e: '🦇', c: '#ff3a5a', tint: 0xff1a3a, moon: 0xff4a5a, w: null, town: ['🏰 Castle Courtyard', 'tower', 0x3a3438, 0x1a1a24, 0xff3a4a, ['statue', 'fire', 'gravestone']], a: ['🦇 Bat Caves', ['boulder', 'crystal']], b: ['🌹 Blood Rose Garden', ['deadtree', 'fence']], reuse: ['graveyard', 'haunted'], deco: 'flies',
    m: [['countcrimson', 'Count Crimson', '🧛', 0xff1a2a, 'upright', 0x14040a, { collar: 0x8a0018, hat: 'top', held: 'staff', face: 0xe8e0e8 }], ['giantbat', 'The Giant Bat', '🦇', 0xff3a5a, 'float', 0x2a1a24, { wings: true, wingColor: 0x1a0a14, ears: 'pointy', snout: [0.5, 0.7], flicker: false }], ['ghoul', 'The Ghoul', '💀', 0x9aff6a, 'crawl', 0x6a7a6a, { boneFace: true, ribs: true, eyes: 6 }]] },
  { n: 'Alien Invasion', e: '👽', c: '#7aff8a', tint: 0x4aff6a, moon: 0x9aff8a, w: null, town: ['🛸 Crash Town', 'house', 0x6a6a7a, 0x2a2a3a, 0x7aff8a, ['hologram', 'orb', 'lamp']], a: ['🌀 Crop Circles', ['haybale', 'orb']], b: ['🔦 Tractor Beam Field', ['rings', 'crystal']], reuse: ['ufo', 'fields'], deco: 'stars',
    m: [['abductor', 'The Abductor', '🛸', 0x4aff6a, 'float', 0x8a9aa0, { bigHead: true, eyeSize: 2.4, orbit: 'stars', cloudBase: 0x7aff8a }], ['probedrone', 'The Probe Drone', '🔩', 0xff3a3a, 'crawl', 0x9aa0aa, { metal: true, eyes: 1, eyeSize: 2, antennae: true, pincers: 0x8a8e98 }], ['tallvisitor', 'The Tall Visitor', '👽', 0x2aff8a, 'upright', 0x7a8a90, { bigHead: true, eyeSize: 2.2, scale: 1.7, armLen: 3.6 }]] },
  { n: 'Flooded Town', e: '🌊', c: '#6ad8ff', tint: 0x2a9aff, moon: 0xc8f0ff, w: 'rain', town: ['🌊 Flooded Streets', 'house', 0x5a6a7a, 0x2a3440, 0x9ae8ff, ['pool:water', 'barrel', 'lamp']], a: ['🧱 The Sea Wall', ['boulder', 'fence']], b: ['🌳 Sunken Park', ['pool:water', 'deadtree']], reuse: ['lagoon', 'wrecks'], deco: 'bubbles',
    m: [['wavewraith', 'The Wave Wraith', '🌊', 0x6ad8ff, 'float', 0x3a8aaa, { vortex: 0x6ad8ff, ghost: 0x0a3a5a, hideLegs: true, robe: null, orbit: 'bubbles' }], ['seaserpent', 'The Sea Serpent', '🐍', 0x3affd8, 'crawl', 0x2a6a8a, { noLimbs: true, tail: true, cobra: 0x3a8aaa, mane: [0x6ad8ff, 0x6ad8ff, 0x6ad8ff] }], ['fisherman', 'The Drowned Fisherman', '🎣', 0x8affd8, 'upright', 0x4a5a5a, { hat: 'straw', held: 'spear', hair: 0x2a3a2a, ghost: 0x0a2a2a }]] },
  { n: 'Haunted Cathedral', e: '⛪', c: '#c8a8ff', tint: 0x9a6aff, moon: 0xf0e8ff, w: null, town: ['⛪ Cathedral Square', 'temple', 0xb0a898, 0x3a3440, 0xd8a0ff, ['statue', 'pillar', 'fire']], a: ['🔔 Bell Tower Ruins', ['pillar', 'boulder']], b: ['🪦 Crypt Garden', ['gravestone', 'deadtree']], reuse: ['graveyard', 'ruins'], deco: 'wisps',
    m: [['bellringer', 'The Bell Ringer', '🔔', 0xffc83a, 'upright', 0x3a2a24, { hood: 0x2a1a14, held: 'hook', bulk: 1.3, robe: 0x2a1a14, legsVisible: true }], ['glassangel', 'The Glass Angel', '🪟', 0xff9af0, 'float', 0xc8e8ff, { wings: true, wingColor: 0x9ad8ff, crystals: 0xff9af0, metal: true, flicker: false }], ['cryptcrawler', 'The Crypt Crawler', '⚰️', 0xb48aff, 'crawl', 0x5a5048, { boneFace: true, ribs: true, eyes: 6, extraArms: true }]] },
  { n: "Jack-o'-Lantern Festival", e: '🎃', c: '#ff9a3a', tint: 0xff7a1a, moon: 0xffa04a, w: 'embers', town: ['🎃 Lantern Fest', 'cottage', 0x4a3a2a, 0x2a1a10, 0xff8a1a, ['lanterns', 'pumpkin', 'haybale']], a: ['🎃 Pumpkin Hills', ['pumpkin', 'fence']], b: ['🚜 Haunted Hayride', ['haybale', 'statue']], reuse: ['pumpkins', 'fields'], deco: 'embers',
    m: [['pumpkinking', 'The Pumpkin King', '🎃', 0xff8a1a, 'upright', 0xe8701a, { bigHead: true, flames: 0xff8a1a, hat: 'crown', crown: 0x2a6a1a, grin: true }], ['vinecrawler', 'The Vine Crawler', '🌿', 0x9aff3a, 'crawl', 0x3a6a1a, { leaves: 0x4a8a2a, extraArms: true, spikes: 8 }], ['candleghost', 'The Candle Ghost', '🕯', 0xffc83a, 'float', 0xf0e8d0, { held: 'lantern', flames: 0xffc83a, robe: 0xf0e8d0 }]] },
  { n: 'Midnight Highway', e: '🛣', c: '#ff8a3a', tint: 0xff6a1a, moon: 0xffe0b0, w: 'rain', town: ['⛽ Truck Stop', 'flat', 0x5a5a62, 0x2a2a30, 0xff6a3a, ['lamp', 'cone', 'barrel']], a: ['🛣 The Highway', ['cone', 'sign']], b: ['🚗 Car Junkyard', ['crates', 'barrel']], reuse: ['factory', 'city'], deco: 'papers',
    m: [['trucker', 'The Ghost Trucker', '🚚', 0xff3a3a, 'upright', 0x3a4a6a, { hat: 'cap', capCol: 0xc01a1a, held: 'wrench', ghost: 0x1a1a2a }], ['roadkill', 'The Roadkill Beast', '🦨', 0xffe03a, 'crawl', 0x2a2a2a, { stripes: [0x1a1a1a, 0xf0f0f0], snout: [0.8, 0.7], tail: true }], ['headlight', 'The Headlight Phantom', '💡', 0xfff4c0, 'float', 0x2a2a30, { eyes: 1, eyeSize: 3.2, cloudBase: 0x3a3a40 }]] },
  { n: 'Ice Cream Doom', e: '🍦', c: '#ffb0e0', tint: 0xff8ac8, moon: 0xfff0f8, w: 'sprinkles', town: ['🍨 Sundae Street', 'dome', 0xffd8e8, 0x8a4a2a, 0xffb0e0, ['candytree', 'giantball', 'lamp']], a: ['🍭 Sprinkle Hills', ['giantball', 'candytree']], b: ['🍫 Melted Pools', ['pool:choco', 'shroom']], reuse: ['gumdrops', 'cotton'], deco: 'stars',
    m: [['scoop', 'The Scoop Monster', '🍨', 0xff3a8a, 'upright', 0xffb0d8, { bigHead: true, hat: 'swirl', drips: 0xfff0f8 }], ['conecrawler', 'The Cone Crawler', '🍦', 0xff6ab0, 'crawl', 0xd8a060, { stripes: [0xd8a060, 0xb8803a], abdomen: 0xffb0d8 }], ['brainfreeze', 'Brain Freeze', '🧊', 0x7affff, 'float', 0xbff0ff, { brainJar: true, orbit: 'snow', flicker: false }]] },
  { n: 'Thunder Plains', e: '⛈', c: '#ffe03a', tint: 0x6a8aff, moon: 0xfff4a0, w: 'rain', town: ['⛈ Storm Outpost', 'hut', 0x6a5a4a, 0x3a3a4a, 0xfff04a, ['rod', 'lamp', 'fence']], a: ['⚡ Lightning Fields', ['rod', 'boulder']], b: ['🌪 Twister Alley', ['deadtree', 'haybale']], reuse: ['stormspire', 'craters'], deco: 'papers',
    m: [['stormgiant', 'The Storm Giant', '⛈', 0xfff04a, 'upright', 0x3a4a6a, { bulk: 1.5, scale: 1.6, orbit: 'bolts', cracks: 0xfff04a }], ['twister', 'The Twister', '🌪', 0xd8d8e8, 'float', 0x6a6a7a, { vortex: 0x8a8a9a, hideLegs: true, robe: null, orbit: 'papers' }], ['statichound', 'The Static Hound', '🐕', 0x9ae8ff, 'crawl', 0x2a2a3a, { snout: [1.1, 0.8], cracks: 0x9ae8ff, ears: 'pointy' }]] },
  { n: 'Coral Kingdom', e: '🪸', c: '#ff7a9a', tint: 0xff5a8a, moon: 0xffd0e0, w: 'bubbles', g: 52, town: ['🪸 Coral Palace', 'dome', 0xff9ab0, 0x5ad8d0, 0xff7a9a, ['crystal', 'shroom', 'rings']], a: ['🦪 Pearl Beds', ['giantball', 'boulder']], b: ['🌺 Anemone Forest', ['alienshroom', 'crystal']], reuse: ['reef', 'kelp'], deco: 'bubbles',
    m: [['siren', 'The Siren', '🧜‍♀️', 0xff6a8a, 'float', 0x3aa08a, { hair: 0xff6a3a, tail: true, hat: 'crown', crown: 0xff9ab0, held: 'spear', flicker: false }], ['urchin', 'The Urchin', '🦔', 0xff3aff, 'crawl', 0x2a0a2a, { spikes: 16, spikeLen: 2, eyes: 6, bulk: 1.3 }], ['puffer', 'The Puffer Brute', '🐡', 0xffe03a, 'upright', 0xe8c86a, { bulk: 1.8, spikes: 12, eyeSize: 1.8 }]] },
  { n: 'Tin Fortress', e: '🪖', c: '#e83a3a', tint: 0xe83a3a, moon: 0xfff0d8, w: null, town: ['🏰 The Tin Fortress', 'tower', 0x8a8e98, 0xc01a1a, 0xffd23a, ['flag', 'crates', 'cone']], a: ['🔴 Marble Run', ['giantball', 'fence']], b: ['🧱 Block Battlefield', ['crates', 'flag']], reuse: ['blocks', 'trains'], deco: 'balloons',
    m: [['tincaptain', 'The Tin Captain', '💂', 0xffd23a, 'upright', 0xc01a1a, { metal: true, hat: 'top', held: 'spear', badge: true }], ['windmouse', 'The Wind-Up Mouse', '🐁', 0xff3a3a, 'crawl', 0x9a9aa0, { metal: true, windKey: true, ears: 'round', snout: [0.8, 0.6], tail: true }], ['kite', 'The Kite Phantom', '🪁', 0x3affff, 'float', 0xff3a3a, { wings: 'round', wingColor: 0xff3a3a, flicker: false }]] },
  { n: 'Moon Base', e: '🌕', c: '#d8d8e8', tint: 0x8a8aa8, moon: 0x6a8aff, w: null, g: 38, town: ['🌕 Lunar Base', 'dome', 0xd8dce4, 0x6a6a78, 0x9ad8ff, ['orb', 'crates', 'flag']], a: ['🌑 Lunar Craters', ['boulder', 'flag']], b: ['🛞 Rover Tracks', ['crates', 'rings']], reuse: ['craters', 'base'], deco: 'stars',
    m: [['moongolem', 'The Moon Golem', '🌕', 0x9ae8ff, 'upright', 0xa8a8a0, { bulk: 1.6, scale: 1.5, cracks: 0x9ae8ff, eyes: 1 }], ['craterworm', 'The Crater Worm', '🪱', 0xffe03a, 'crawl', 0x8a8a84, { noLimbs: true, tail: true, headShape: 'wide', spikes: 6 }], ['moonwraith', 'The Moon Wraith', '🌙', 0xc8c8ff, 'float', 0xc8c8d8, { hair: 0xe8e8ff, orbit: 'shards', robe: 0xc8c8d8, held: 'staff' }]] },
  { n: "Alchemist's Tower", e: '⚗️', c: '#c87aff', tint: 0x9a3aff, moon: 0xe0c0ff, w: 'sprinkles', town: ['⚗️ Alchemist Quarter', 'tower', 0x5a4a6a, 0x2a1a3a, 0xc87aff, ['cauldron', 'crystal', 'lanterns']], a: ['🧪 Potion Gardens', ['shroom', 'cauldron']], b: ['🪨 Rune Stones', ['obelisk', 'rings']], reuse: ['xcrystal', 'forest'], deco: 'stars',
    m: [['alchemist', 'The Alchemist', '⚗️', 0x8aff3a, 'upright', 0x4a2a6a, { hat: 'witch', held: 'beaker', goggles: true, robe: 0x3a1a5a, legsVisible: true }], ['homunculus', 'The Homunculus', '🧪', 0x8aff6a, 'crawl', 0x8aff6a, { drips: 0x8aff3a, eyes: 6, ghost: 0x2a6a0a }], ['runewisp', 'The Rune Wisp', '🔯', 0xffd23a, 'float', 0x6a3aaa, { orbit: 'stars', cracks: 0xffd23a, hideLegs: true, robe: null, cloudBase: 0x6a3aaa }]] },
  { n: 'Lumberjack Woods', e: '🪓', c: '#c8a070', tint: 0x8a6a3a, moon: 0xfff0d0, w: null, town: ['🪓 Logging Camp', 'cottage', 0x6a4a2a, 0x3a2a1a, 0xffb86a, ['logs', 'fire', 'crates']], a: ['🪵 The Clearcut', ['stump', 'logs']], b: ['🌲 Giant Redwoods', ['bigtree', 'boulder']], reuse: ['forest', 'camp'], deco: 'fireflies',
    m: [['axeman', 'The Axe Man', '🪓', 0xff3a3a, 'upright', 0x8a1a1a, { stripes: [0xa81a1a, 0x1a1a1a], held: 'pickaxe', hat: 'cap', capCol: 0x8a1a1a, bulk: 1.4 }], ['stumpbeast', 'The Stump Beast', '🪵', 0x9aff3a, 'crawl', 0x5a3a20, { leaves: 0x3a6a1a, mushrooms: 0xd8c8a0, bulk: 1.4 }], ['sawdust', 'The Sawdust Ghost', '🌫', 0xffd27a, 'float', 0xd8b880, { cloudBase: 0xd8b880, orbit: 'papers', robe: 0xb8986a }]] },
  { n: 'Haunted Hotel', e: '🏨', c: '#ffd27a', tint: 0xc83a3a, moon: 0xfff0d0, w: null, town: ['🏨 The Grand Hotel', 'flat', 0x8a2a2a, 0x2a1a1a, 0xffd08a, ['lamp', 'bench', 'pool:water']], a: ['🌳 Hotel Gardens', ['hedge', 'statue']], b: ['🧳 Luggage Hall', ['crates', 'bench']], reuse: ['maze', 'manor'], deco: 'papers',
    m: [['bellhop', 'The Bellhop', '🛎', 0xffd23a, 'upright', 0x8a1a1a, { hat: 'cap', capCol: 0x8a1a1a, badge: true, held: 'lantern' }], ['maid', 'The Midnight Maid', '🧹', 0xff6a9a, 'float', 0x1a1a1a, { held: 'broom', robe: 0x1a1a1a, apron: 0xf0f0f0, hat: 'bun' }], ['carpetcrawler', 'The Carpet Crawler', '🟥', 0xffd23a, 'crawl', 0x8a1a2a, { stripes: [0x8a1a2a, 0xd8b04a], extraArms: true, eyes: 6 }]] },
  { n: 'Geode World', e: '💎', c: '#c87aff', tint: 0xb44aff, moon: 0xd8b0ff, w: null, town: ['💎 Geode Village', 'dome', 0x5a4a6a, 0xc87aff, 0xc87aff, ['crystal', 'orb', 'shroom']], a: ['🔮 Amethyst Halls', ['crystal', 'boulder']], b: ['🐛 Glow Worm Grotto', ['shroom', 'orb']], reuse: ['crystal', 'caves'], deco: 'fireflies',
    m: [['geodegolem', 'The Geode Golem', '🪨', 0xc87aff, 'upright', 0x5a4a6a, { crystals: 0xc87aff, bulk: 1.5, cracks: 0xc87aff }], ['glowworm', 'The Glow Worm', '🐛', 0x9aff6a, 'crawl', 0x2a3a2a, { noLimbs: true, tail: true, cracks: 0x9aff6a, eyes: 6 }], ['prismghost', 'The Prism Ghost', '🔷', 0x9ae8ff, 'float', 0xc8e8ff, { metal: true, orbit: 'sparkles', crystals: 0x9ae8ff, robe: 0xc8e8ff }]] },
  { n: 'Monkey Temple', e: '🐒', c: '#d8c050', tint: 0x6aaa2a, moon: 0xfff0b0, w: 'rain', town: ['🐒 Monkey Temple', 'pyramid', 0x7a7a5a, 0x4a6a2a, 0xffd23a, ['statue', 'jungletree', 'fire']], a: ['🍌 Banana Groves', ['palm', 'jungletree']], b: ['🌉 Vine Bridges', ['pillar', 'jungletree']], reuse: ['jungle', 'river'], deco: 'fireflies',
    m: [['monkeyking', 'The Monkey King', '🐒', 0xffd23a, 'upright', 0x6a4a2a, { fur: 0x8a5a3a, hat: 'crown', ears: 'round', held: 'staff', tail: true }], ['jaguar', 'The Shadow Jaguar', '🐆', 0x9aff3a, 'crawl', 0x2a2a1a, { snout: [1, 0.9], ears: 'round', stripes: [0x2a2a1a, 0x4a4a2a], tail: true, speed: 2.8 }], ['idol', 'The Golden Idol', '🗿', 0xff3a1a, 'float', 0xd8a830, { metal: true, bigHead: true, flames: 0xffc83a, hideLegs: true }]] },
  { n: 'Robot Factory', e: '🦾', c: '#9ae8ff', tint: 0x3a8aff, moon: 0xd0e8ff, w: 'ash', town: ['🏭 Assembly Line', 'flat', 0x5a5e68, 0x2a2e38, 0x5ad8ff, ['gear', 'crates', 'cone']], a: ['📦 Conveyor Maze', ['crates', 'gear']], b: ['🔩 Scrap Piles', ['barrel', 'crates']], reuse: ['factory', 'servers'], deco: 'embers',
    m: [['assembler', 'The Assembler', '🦾', 0x5ad8ff, 'upright', 0x8a8e98, { metal: true, extraArms: true, eyes: 1, eyeSize: 2, held: 'wrench' }], ['drillbot', 'The Drill Bot', '🪛', 0xffd23a, 'crawl', 0xd8a030, { metal: true, digClaws: true, snout: [1.2, 0.5], eyes: 1 }], ['weldspark', 'The Welding Spark', '🔥', 0xffb43a, 'float', 0x5a5a60, { orbit: 'embers', goggles: true, metal: true, cloudBase: 0x5a5a60 }]] },
  { n: 'Olympus Heights', e: '⚡', c: '#fff0a0', tint: 0xffe08a, moon: 0xffffff, w: null, g: 48, town: ['🏛 Cloud Temple', 'temple', 0xf0ece4, 0xffc83a, 0xfff0a0, ['pillar', 'statue', 'cloud']], a: ['✨ Golden Steps', ['pillar', 'coinpile']], b: ['⚡ Lightning Garden', ['rod', 'cloud']], reuse: ['skycity', 'cotton'], deco: 'stars',
    m: [['thunderlord', 'The Thunder Lord', '🌩', 0xfff04a, 'upright', 0xe8e0d0, { hat: 'laurel', held: 'spear', orbit: 'bolts', scale: 1.5, face: 0xf0e8e0 }], ['firehound', 'The Fire Hound', '🔥', 0xff3a1a, 'crawl', 0x3a1a14, { snout: [1.2, 0.9], flames: 0xff3a1a, ears: 'pointy', horns: true }], ['cloudsiren', 'The Cloud Siren', '☁️', 0xffe08a, 'float', 0xf0f0ff, { wings: true, wingColor: 0xffffff, hair: 0xffe08a, flicker: false }]] },
  { n: 'Owl Forest', e: '🦉', c: '#d8a870', tint: 0x6a5a8a, moon: 0xfff8e0, w: null, town: ['🌳 Treehouse Village', 'treehouse', 0x6a4a2a, 0x3a5a2a, 0xffc86a, ['lanterns', 'bigtree', 'fence']], a: ['🌳 Hollow Trees', ['bigtree', 'shroom']], b: ['🌙 Moonlit Clearing', ['stonelantern', 'rings']], reuse: ['forest', 'fairyring'], deco: 'fireflies',
    m: [['owlbear', 'The Owl Bear', '🐻', 0xffd23a, 'upright', 0x6a4a2a, { fur: 0x8a6a4a, beak: 0.8, bulk: 1.5, ears: 'pointy' }], ['badger', 'The Night Badger', '🦡', 0xff3a3a, 'crawl', 0x3a3a3a, { stripes: [0x1a1a1a, 0xe8e8e8], snout: [0.9, 0.7], digClaws: true }], ['nightowl', 'The Night Owl', '🦉', 0xffa21a, 'float', 0x6a4a3a, { wings: 'round', wingColor: 0x6a4a3a, beak: 0.6, eyeSize: 2.6, flicker: false }]] },
  { n: 'Fire Temple', e: '🔥', c: '#ff6a1a', tint: 0xff4a0a, moon: 0xff8a3a, w: 'embers', town: ['🔥 The Fire Temple', 'pyramid', 0x3a2420, 0x1a1210, 0xff5a1a, ['fire', 'pillar', 'pool:lava']], a: ['🔥 Ember Fields', ['fire', 'boulder']], b: ['🌋 Magma Falls', ['pool:lava', 'obelisk']], reuse: ['lava', 'ashwoods'], deco: 'embers',
    m: [['flameknight', 'The Flame Knight', '🛡', 0xff6a1a, 'upright', 0x5a3a2a, { hat: 'helm', plume: 0xff6a1a, held: 'sword', heldColor: 0xff6a1a, flames: 0xff5a1a, metal: true }], ['phoenix', 'The Dark Phoenix', '🐦‍🔥', 0xffc83a, 'float', 0x3a0a0a, { wings: true, wingColor: 0xff3a1a, beak: 1, flames: 0xffc83a, orbit: 'embers', flicker: false }], ['lavahound', 'The Lava Hound', '🐕', 0xff5a1a, 'crawl', 0x1a0a08, { snout: [1.1, 0.8], cracks: 0xff5a1a, ears: 'pointy', spikes: 6 }]] },
  { n: 'Bio Dome', e: '🧬', c: '#c87aff', tint: 0x9aff3a, moon: 0xe0ffb0, w: 'bubbles', town: ['🧬 The Bio Dome', 'dome', 0x8a9a8a, 0x9ad8c8, 0xc8ff6a, ['alienshroom', 'fern', 'pool:water']], a: ['🌱 Mutant Garden', ['alienshroom', 'shroom']], b: ['🫙 Specimen Tanks', ['orb', 'crystal']], reuse: ['vats', 'jungle'], deco: 'fireflies',
    m: [['mutantplant', 'The Mutant Plant', '🌱', 0xff3aff, 'upright', 0x5a2a6a, { trapHead: 0xc83aff, leaves: 0x8a3aaa }], ['blob', 'The Blob', '🟢', 0x3aff3a, 'crawl', 0x4ac83a, { ghost: 0x3aff3a, bulk: 1.6, drips: 0x3aff3a, eyes: 6 }], ['sporecloud', 'The Spore Cloud', '🦠', 0xb4ff6a, 'float', 0x6a8a3a, { cloudBase: 0xb4ff6a, orbit: 'spores', mushrooms: 0xc8ff6a }]] },
  { n: 'Rocket Launch Site', e: '🚀', c: '#ff8a3a', tint: 0x5a7aaa, moon: 0xffffff, w: null, town: ['🚀 Launch Base', 'flat', 0xd8dce4, 0x3a3e48, 0xff8a3a, ['rocket', 'lamp', 'cone']], a: ['⛽ Fuel Depot', ['barrel', 'orb']], b: ['🚀 Launch Pads', ['rocket', 'flag']], reuse: ['base', 'construction'], deco: 'embers',
    m: [['rocketman', 'The Rocket Man', '🧑‍🚀', 0xff8a1a, 'upright', 0xd8d8e0, { spaceHelmet: true, flames: 0xff8a1a, metal: true }], ['fueleater', 'The Fuel Eater', '🛢', 0xffe03a, 'crawl', 0x3a3a40, { metal: true, eyes: 6, drips: 0xffe03a }], ['countdown', 'The Countdown', '⏱', 0xff3a3a, 'float', 0x2a2a30, { clockFace: true, orbit: 'embers', robe: 0x2a2a30 }]] },
  { n: 'Knitted World', e: '🧶', c: '#ff9ad0', tint: 0xff6ab0, moon: 0xfff0f8, w: 'sprinkles', town: ['🧶 Yarn Town', 'cottage', 0xe8b0c8, 0x8a5aaa, 0xffd8e8, ['giantball', 'fence', 'candytree']], a: ['🔘 Button Fields', ['giantball', 'shroom']], b: ['🪡 Needle Forest', ['needle', 'giantball']], reuse: ['cotton', 'blocks'], deco: 'stars',
    m: [['sockpuppet', 'The Sock Puppet', '🧦', 0x3a3aff, 'upright', 0xff3a3a, { stripes: [0xff3a3a, 0xffffff], eyeSize: 1.8, grin: true }], ['yarnspider', 'The Yarn Spider', '🕷', 0xff3ad8, 'crawl', 0xff9ad0, { abdomen: 0xff6ab0, extraArms: true, eyes: 6, fur: 0xff9ad0 }], ['buttonghost', 'The Button-Eyed Ghost', '🪡', 0x1a1a1a, 'float', 0xd8c8e8, { eyeSize: 2, robe: 0xd8c8e8, hair: 0x3a1a0a }]] },
  { n: 'Rollercoaster Park', e: '🎢', c: '#ff3a8a', tint: 0xff3a8a, moon: 0xffe0f0, w: null, town: ['🎢 Thrill Park', 'flat', 0x3a3a5a, 0xff3a8a, 0xffd23a, ['rings', 'cone', 'lamp']], a: ['🎢 Coaster Tracks', ['rings', 'pillar']], b: ['🚗 Bumper Cars', ['giantball', 'cone']], reuse: ['rides', 'midway'], deco: 'balloons',
    m: [['rideoperator', 'The Ride Operator', '🎟', 0x3affff, 'upright', 0x3a5a8a, { hat: 'cap', capCol: 0x3a8ae8, held: 'megaphone', grin: true }], ['bumpercar', 'The Bumper Car', '🚗', 0xff3a3a, 'crawl', 0xe83a3a, { metal: true, eyes: 1, eyeSize: 2.4, headShape: 'wide' }], ['ticketghost', 'The Ticket Ghost', '🎫', 0xffd23a, 'float', 0xff6ab0, { orbit: 'papers', hat: 'party', robe: 0xff6ab0 }]] },
  { n: 'Galaxy Garden', e: '🪐', c: '#c87aff', tint: 0x6a3aff, moon: 0xffb0ff, w: null, g: 42, town: ['🪐 Star Garden', 'dome', 0x2a1a4a, 0xc87aff, 0xffd8ff, ['orb', 'alienshroom', 'rings']], a: ['☄️ Comet Fields', ['boulder', 'orb']], b: ['🌌 Nebula Pools', ['pool:water', 'crystal']], reuse: ['xcrystal', 'alienwoods'], deco: 'stars',
    m: [['starbeast', 'The Star Beast', '⭐', 0xffffff, 'upright', 0x1a0a3a, { orbit: 'stars', cracks: 0xffffff, bulk: 1.4 }], ['cometcrawler', 'The Comet Crawler', '☄️', 0x9ae8ff, 'crawl', 0x2a3a5a, { flames: 0x9ae8ff, tail: true, spikes: 6 }], ['nebula', 'The Nebula', '🌌', 0xff9af0, 'float', 0x4a2a6a, { cloudBase: 0xc87aff, orbit: 'sparkles', hideLegs: true }]] },
  { n: 'Fogtown Alleys', e: '🎩', c: '#c8c8c8', tint: 0x8a8a9a, moon: 0xf0f0f0, w: null, town: ['🎩 Fogtown', 'house', 0x5a3a2a, 0x2a2a30, 0xffd08a, ['lamp', 'barrel', 'bench']], a: ['🧱 Cobble Alleys', ['lamp', 'crates']], b: ['⚓ Foggy Docks', ['crates', 'barrel']], reuse: ['city', 'piratetown'], deco: 'clouds',
    m: [['gentleman', 'The Faceless Gentleman', '🎩', 0xffffff, 'upright', 0x1a1a1a, { hat: 'top', held: 'umbrella', faceless: true, collar: 0x1a1a1a }], ['chimneysweep', 'The Chimney Crawler', '🧹', 0xff6a1a, 'crawl', 0x2a2a2a, { hat: 'cap', drips: 0x1a1a1a, eyes: 6 }], ['fogghost', 'The Fog Ghost', '🌫', 0xffd08a, 'float', 0xb8b8c0, { cloudBase: 0xc8c8c8, held: 'lantern', hood: 0x3a3a3a }]] },
  { n: 'Cliff Monastery', e: '🏔', c: '#ffa23a', tint: 0xc86a1a, moon: 0xfff0e0, w: 'snow', town: ['🛕 Cliff Monastery', 'tower', 0xd8c8a8, 0x8a2a1a, 0xffb43a, ['lanterns', 'pillar', 'flag']], a: ['🌉 Rope Bridges', ['pillar', 'fence']], b: ['🦅 Eagle Nests', ['haybale', 'boulder']], reuse: ['crags', 'mossrock'], deco: 'lanterns',
    m: [['silentmonk', 'The Silent Monk', '🧘', 0xffa21a, 'upright', 0xc86a1a, { hood: 0xc86a1a, robe: 0xc86a1a, faceless: true, held: 'staff' }], ['eagle', 'The Great Eagle', '🦅', 0xffd23a, 'float', 0x6a4a2a, { wings: true, wingColor: 0x6a4a2a, beak: 1.2, legsVisible: true, flicker: false }], ['mountaingoat', 'The Mountain Goat', '🐐', 0xff3a3a, 'crawl', 0xe8e0d0, { horns: true, snout: [0.9, 0.6], fur: 0xe8e0d0, ears: 'pointy' }]] },
  { n: 'Topsy-Turvy Tea Party', e: '🫖', c: '#ff7ae8', tint: 0xb44aff, moon: 0xfff0b0, w: 'sprinkles', town: ['🫖 Tea Party Lane', 'cottage', 0xd8e8b0, 0xd84a8a, 0xffe08a, ['card', 'shroom', 'giantball']], a: ['🃏 Card Garden', ['card', 'hedge']], b: ['🌀 The Mad Hedges', ['hedge', 'shroom']], reuse: ['maze', 'fairyring'], deco: 'papers',
    m: [['teahatter', 'The Tea Hatter', '🎩', 0xff3aff, 'upright', 0x3a6a5a, { hat: 'top', glasses: true, grin: true, held: 'lantern' }], ['grincat', 'The Grinning Cat', '🐈', 0xffe03a, 'crawl', 0xb44aff, { grin: true, stripes: [0xb44aff, 0xff6ae8], ears: 'pointy', tail: true }], ['cardghost', 'The Card Queen', '🃏', 0xff2a4a, 'float', 0xf0f0f0, { orbit: 'papers', hat: 'crown', crown: 0xff2a4a, robe: 0xc01a2a }]] },
  { n: 'Toxic Wasteland', e: '☢️', c: '#8aff3a', tint: 0x7aff1a, moon: 0xc8ff6a, w: 'ash', town: ['☢️ Fallout Town', 'flat', 0x5a5a4a, 0x3a3a2a, 0x8aff3a, ['barrel', 'sign', 'cone']], a: ['☢️ Glow Craters', ['boulder', 'pool:lava']], b: ['🚙 Rusted Wrecks', ['crates', 'barrel']], reuse: ['sludge', 'craters'], deco: 'flies',
    m: [['mutant', 'The Mutant', '☢️', 0x8aff3a, 'upright', 0x6a7a4a, { extraArms: true, cracks: 0x8aff3a, bulk: 1.3, eyes: 6 }], ['radroach', 'The Rad Roach', '🪳', 0xffe03a, 'crawl', 0x5a3a1a, { shell: 0x5a3a1a, antennae: true, mandibles: true, extraArms: true }], ['glowghost', 'The Glow Ghost', '💚', 0x6aff3a, 'float', 0x3a6a2a, { ghost: 0x3aff3a, cloudBase: 0x6aff3a, orbit: 'spores' }]] },
  { n: 'Ice Age Valley', e: '🦣', c: '#bff4ff', tint: 0x7ad8ff, moon: 0xffffff, w: 'snow', town: ['🔥 Cave Camp', 'hut', 0x8a7a6a, 0x5a4a3a, 0xff8a3a, ['fire', 'bones', 'boulder']], a: ['🧊 Frozen Tundra', ['boulder', 'bones']], b: ['🦣 Mammoth Graves', ['bones', 'crystal']], reuse: ['snowwoods', 'caves'], deco: 'stars',
    m: [['mammoth', 'The Mammoth', '🦣', 0xff3a1a, 'crawl', 0x6a4a2a, { fur: 0x6a4a2a, bulk: 1.8, scale: 1.6, horns: true, snout: [1.4, 0.6] }], ['caveman', 'The Cave Brute', '🪨', 0xffd23a, 'upright', 0x8a6a4a, { fur: 0x6a4a2a, held: 'club', bulk: 1.3 }], ['frostspirit', 'The Frost Spirit', '🥶', 0x9af0ff, 'float', 0xd8f0ff, { orbit: 'snow', crystals: 0xbff4ff, robe: 0xd8f0ff, hood: 0xd8f0ff }]] },
  { n: 'Masquerade Ball', e: '🎭', c: '#ff5ab0', tint: 0xc81a6a, moon: 0xffe0f0, w: null, town: ['🎭 Masquerade Hall', 'temple', 0x3a1a2a, 0xffc83a, 0xffd08a, ['lamp', 'statue', 'pool:water']], a: ['🌹 Ballroom Gardens', ['hedge', 'statue']], b: ['🎆 Fireworks Terrace', ['rings', 'flag']], reuse: ['ballroom', 'maze'], deco: 'petals',
    m: [['maskeddancer', 'The Masked Dancer', '💃', 0xff3a8a, 'upright', 0x8a1a6a, { mask: true, hat: 'feathers', robe: 0x8a1a6a, legsVisible: true }], ['maskedpanther', 'The Masked Panther', '🐈‍⬛', 0xffd23a, 'crawl', 0x1a1a1a, { mask: true, snout: [1, 0.8], ears: 'pointy', tail: true }], ['masqghost', 'The Masquerade Ghost', '🎭', 0xff9af0, 'float', 0x3a0a2a, { mask: true, orbit: 'feathers', hair: 0x2a0a2a }]] },
  { n: 'Abandoned Subway', e: '🚇', c: '#ffd23a', tint: 0x6a6a4a, moon: 0xfff0a0, w: null, town: ['🚇 Subway Station', 'flat', 0xb0b8b0, 0x3a3a3a, 0xffe08a, ['bench', 'lamp', 'sign']], a: ['🕳 The Tunnels', ['pillar', 'barrel']], b: ['🚃 Train Graveyard', ['crates', 'barrel']], reuse: ['sewers', 'railyard'], deco: 'papers',
    m: [['tunnelrat', 'The Tunnel Rat', '🐀', 0xff3a3a, 'crawl', 0x4a4038, { snout: [1, 0.6], ears: 'round', tail: true, eyes: 6, scale: 1.3 }], ['graffiti', 'The Graffiti Ghost', '🎨', 0x3affff, 'float', 0x2a2a3a, { stripes: [0xff3ad8, 0x3affff], orbit: 'papers', robe: 0x3a3a4a }], ['thirdrail', 'The Third Rail', '⚡', 0xfff04a, 'upright', 0x5a5a62, { cracks: 0xfff04a, metal: true, orbit: 'bolts' }]] },
  { n: 'Shadow Dojo', e: '🥷', c: '#ff3a3a', tint: 0xc01a1a, moon: 0xfff4e0, w: 'sprinkles', town: ['🥷 Dojo Village', 'cottage', 0xd8c8a8, 0x1a1a24, 0xffb06a, ['stonelantern', 'bamboo', 'flag']], a: ['🎯 Training Grounds', ['statue', 'fence']], b: ['🌸 Cherry Courtyard', ['blossom', 'stonelantern']], reuse: ['bamboo', 'blossoms'], deco: 'petals',
    m: [['shadowninja', 'The Shadow Ninja', '🥷', 0xff3a3a, 'upright', 0x0a0a10, { hood: 0x0a0a0a, held: 'sword', mask: true }], ['oniwolf', 'The Masked Wolf', '🐺', 0xffd23a, 'crawl', 0x3a1a1a, { snout: [1.2, 0.8], mask: true, horns: true, ears: 'pointy' }], ['inkdragon', 'The Ink Dragon', '🐉', 0xffffff, 'float', 0x1a1a1a, { noLimbs: true, tail: true, snout: [1.2, 0.8], mane: [0x1a1a1a, 0xffffff, 0x1a1a1a], horns: true }]] },
  { n: 'Sunflower Farm', e: '🌻', c: '#ffd23a', tint: 0xffc81a, moon: 0xfff4c0, w: null, town: ['🌻 Sunflower Farm', 'house', 0xc8a060, 0x8a2a1a, 0xffd23a, ['sunflower', 'windmill', 'haybale']], a: ['🌻 Sunflower Maze', ['sunflower', 'fence']], b: ['🐝 Bee Meadow', ['haybale', 'shroom']], reuse: ['fields', 'flytraps'], deco: 'fireflies',
    m: [['sunflowergiant', 'The Sunflower Giant', '🌻', 0xff6a1a, 'upright', 0x3a6a1a, { hat: 'flower', flowerColor: 0xffd23a, leaves: 0x3a8a1a, scale: 1.5 }], ['beehound', 'The Bee Hound', '🐝', 0xffd23a, 'crawl', 0x1a1a1a, { stripes: [0xffd23a, 0x1a1a1a], antennae: true, wings: 'round', wingColor: 0xf0f8ff }], ['strawghost', 'The Straw Ghost', '👻', 0xffb43a, 'float', 0x8a6a3a, { hat: 'straw', robe: 0x8a6a3a, orbit: 'feathers' }]] },
  { n: 'The Labyrinth', e: '🐂', c: '#e8d8b0', tint: 0xc8a050, moon: 0xfff0d0, w: 'sand', town: ['🏛 Labyrinth Gate', 'temple', 0xe0d8c8, 0xb88a3a, 0xffc86a, ['pillar', 'statue', 'fire']], a: ['🌿 The Endless Labyrinth', ['hedge', 'pillar']], b: ['🫒 Olive Groves', ['bigtree', 'boulder']], reuse: ['maze', 'ruins'], deco: 'embers',
    m: [['minotaur', 'The Minotaur', '🐂', 0xff3a1a, 'upright', 0x5a3a2a, { horns: true, snout: [0.9, 1.1], bulk: 1.6, scale: 1.6, held: 'cleaver' }], ['stonegazer', 'The Stone Gazer', '🐍', 0x9aff3a, 'float', 0x5a7a4a, { mane: [0x3a8a1a, 0x4a9a2a, 0x3a8a1a, 0x4a9a2a, 0x3a8a1a], robe: 0x3a5a2a, eyeSize: 1.6 }], ['bronzebull', 'The Bronze Bull', '🐃', 0xff6a1a, 'crawl', 0xb88a3a, { metal: true, horns: true, snout: [1, 1], flames: 0xff6a1a, bulk: 1.4 }]] },
  { n: 'Crab Island', e: '🦀', c: '#ff6a3a', tint: 0xff6a3a, moon: 0xfff0d0, w: null, town: ['🦀 Crab Shack Village', 'hut', 0xb88a5a, 0x6a4a2a, 0xffc86a, ['palm', 'crates', 'fire']], a: ['🕳 Crab Burrows', ['boulder', 'bones']], b: ['🐚 Shell Beach', ['giantball', 'palm']], reuse: ['beach', 'tidepools'], deco: 'bubbles',
    m: [['hermitking', 'The Hermit King', '🦀', 0xffd23a, 'crawl', 0xd84a2a, { conch: 0xff9ab0, pincers: 0xd84a2a, hat: 'crown' }], ['beachzombie', 'The Beach Zombie', '🏄', 0x3affd8, 'upright', 0x7a9a7a, { hat: 'straw', hair: 0xe8c86a, stripes: [0xff6a3a, 0xffd23a] }], ['tikighost', 'The Tiki Torch Ghost', '🔥', 0xff8a1a, 'float', 0x6a3a1a, { flames: 0xff8a1a, hat: 'feathers', robe: 0x6a3a1a }]] },
  { n: 'Cave of Eyes', e: '👁', c: '#ff3a5a', tint: 0x8a1a3a, moon: 0xff8a9a, w: null, town: ['👁 The Eye Temple', 'pyramid', 0x3a1a24, 0x1a0a10, 0xff3a5a, ['statue', 'orb', 'crystal']], a: ['👀 Staring Walls', ['pillar', 'orb']], b: ['🩸 Eye Pools', ['pool:water', 'shroom']], reuse: ['caves', 'shadowcity'], deco: 'wisps',
    m: [['manyeyes', 'The Many-Eyed One', '👁', 0xff3a5a, 'upright', 0x3a0a1a, { eyes: 6, eyeSize: 1.4, bigHead: true, orbit: 'wisps' }], ['eyecrawler', 'The Eye Crawler', '🕷', 0xffe03a, 'crawl', 0x2a0a14, { eyes: 6, eyeSize: 2, abdomen: 0x5a0a1a }], ['bigeye', 'The Big Eye', '🧿', 0x3affff, 'float', 0xe8e0e0, { eyes: 1, eyeSize: 3.4, tentacles: true }]] },
  { n: 'Submarine Base', e: '🛟', c: '#3affd8', tint: 0x1a8aaa, moon: 0x8affff, w: 'bubbles', g: 52, town: ['⚓ Sub Base', 'dome', 0x8a9098, 0x3a4048, 0x3affd8, ['crates', 'lamp', 'rings']], a: ['🚀 Torpedo Bay', ['barrel', 'crates']], b: ['🪟 Abyss Windows', ['orb', 'crystal']], reuse: ['trench', 'wrecks'], deco: 'bubbles',
    m: [['deepdiver', 'The Deep Diver', '🤿', 0xffd23a, 'upright', 0xb88a3a, { spaceHelmet: true, metal: true, held: 'spear' }], ['anglerqueen', 'The Angler Queen', '🐟', 0x3affff, 'crawl', 0x1a2a3a, { lure: true, eyeSize: 2, bulk: 1.4, spikes: 8, hat: 'crown', crown: 0x3affff }], ['abyssjelly', 'The Abyss Jelly', '🪼', 0xff6ae8, 'float', 0x6a3aaa, { tentacles: true, headShape: 'dome', orbit: 'bubbles' }]] },
  { n: 'Balloon Town', e: '🎈', c: '#ff6ab0', tint: 0x6ab0ff, moon: 0xffffff, w: null, g: 44, town: ['🎈 Balloon Town', 'cottage', 0xf0e8d8, 0xff6ab0, 0xffe08a, ['cloud', 'giantball', 'flag']], a: ['☁️ Floating Fields', ['cloud', 'rings']], b: ['🎈 Helium Factory', ['barrel', 'gear']], reuse: ['skycity', 'gumdrops'], deco: 'balloons',
    m: [['balloonman', 'The Balloon Man', '🎈', 0xff3a6a, 'upright', 0x3a3a5a, { balloons: [0xff3a6a, 0xffe03a, 0x3a8aff], mask: true, hat: 'top' }], ['popper', 'The Popper', '📌', 0xffe03a, 'crawl', 0x8a8a90, { spikes: 14, spikeLen: 1.8, extraArms: true, metal: true }], ['blimp', 'The Blimp', '🎈', 0xff3a3a, 'float', 0xd8d8e0, { headShape: 'dome', eyes: 1, eyeSize: 2.4, hideLegs: true }]] },
  { n: 'Eclipse Village', e: '🌒', c: '#ffd23a', tint: 0x3a2a6a, moon: 0x1a1a1a, w: null, town: ['🌒 Eclipse Village', 'house', 0x3a3448, 0x1a1424, 0xffd23a, ['lamp', 'obelisk', 'rings']], a: ['🌑 Shadow Fields', ['deadtree', 'obelisk']], b: ['☀️ Sun Shrine', ['pillar', 'fire']], reuse: ['shadowcity', 'pyramids'], deco: 'shards',
    m: [['eclipseking', 'The Eclipse King', '🌒', 0xffd23a, 'upright', 0x0a0a0a, { hat: 'crown', crown: 0xffd23a, flames: 0xffd23a, collar: 0x1a1a1a }], ['sundog', 'The Sun Dog', '☀️', 0xffa21a, 'crawl', 0xc87a1a, { flames: 0xffa21a, snout: [1, 0.8], ears: 'pointy' }], ['moonmoth', 'The Moon Moth', '🦋', 0xc8c8ff, 'float', 0x2a2a4a, { wings: 'round', wingColor: 0x2a2a4a, antennae: 'feather' }]] },
  { n: 'Ancient Library', e: '📜', c: '#e8c890', tint: 0xb8903a, moon: 0xfff4e0, w: null, town: ['📜 The Grand Library', 'temple', 0xb8a888, 0x5a3a2a, 0xffd08a, ['book', 'lamp', 'statue']], a: ['📚 Scroll Stacks', ['book', 'crates']], b: ['🪑 Reading Gardens', ['bench', 'hedge']], reuse: ['pages', 'museum'], deco: 'papers',
    m: [['librarian', 'The Librarian', '🤫', 0x9ae8ff, 'upright', 0x4a3a4a, { glasses: true, hat: 'bun', held: 'book' }], ['bookworm', 'The Bookworm', '🐛', 0xffd23a, 'crawl', 0x8a1a2a, { noLimbs: true, tail: true, glasses: true, stripes: [0x8a1a2a, 0xf0e8d0] }], ['scrollghost', 'The Scroll Mummy', '📜', 0xffa21a, 'float', 0xe8dcc0, { mummy: true, orbit: 'papers' }]] },
  { n: 'Monster Stadium', e: '🏟', c: '#3aff8a', tint: 0x2a8a3a, moon: 0xffffff, w: null, town: ['🏟 Monster Stadium', 'flat', 0x6a6a72, 0x2a6a3a, 0xffffff, ['flag', 'lamp', 'fence']], a: ['🚿 Locker Rooms', ['crates', 'bench']], b: ['🏈 Training Field', ['giantball', 'cone']], reuse: ['sportsfield', 'playground'], deco: 'papers',
    m: [['coach', 'The Coach', '📣', 0xff3a3a, 'upright', 0x2a4a3a, { hat: 'cap', capCol: 0x1a6a3a, held: 'megaphone', badge: true }], ['mascot', 'The Mascot', '🐻', 0xffd23a, 'crawl', 0x3a8ae8, { fur: 0x3a8ae8, ears: 'round', grin: true, bulk: 1.3 }], ['referee', 'The Referee Ghost', '🦓', 0xffffff, 'float', 0xf0f0f0, { stripes: [0x111111, 0xffffff], orbit: 'papers' }]] },
  { n: 'Hypno Spiral', e: '🌀', c: '#ff3ad8', tint: 0xff3ad8, moon: 0xffffff, w: null, town: ['🌀 Spiral City', 'dome', 0x3a1a4a, 0xff3ad8, 0x3affff, ['rings', 'orb', 'giantball']], a: ['🌀 Spiral Fields', ['rings', 'crystal']], b: ['🗼 Dizzy Towers', ['obelisk', 'rings']], reuse: ['kaleido', 'neonpark'], deco: 'stars',
    m: [['hypnotist', 'The Hypnotist', '😵‍💫', 0xff3ad8, 'upright', 0x2a1a3a, { hat: 'top', glasses: true, orbit: 'sparkles', held: 'staff' }], ['spiralsnail', 'The Spiral Snail', '🐌', 0x3affff, 'crawl', 0x6a5a4a, { conch: 0xb44aff, antennae: true }], ['vortexghost', 'The Vortex', '🌀', 0xff9af0, 'float', 0x6a1a6a, { vortex: 0xff3ad8, hideLegs: true, robe: null, orbit: 'stars' }]] },
  { n: 'Pixel World', e: '🟩', c: '#3aff6a', tint: 0x3ac83a, moon: 0xffffff, w: null, town: ['🟩 Pixel Village', 'flat', 0x8a6a3a, 0x3a8a3a, 0xffe03a, ['crates', 'pine', 'giantball']], a: ['⛰ Block Hills', ['crates', 'boulder']], b: ['🟧 Pixel Lava', ['pool:lava', 'crates']], reuse: ['blocks', 'arcade'], deco: 'stars',
    m: [['pixelknight', 'The Pixel Knight', '🗡', 0x3aff6a, 'upright', 0x3a8a3a, { hat: 'helm', held: 'sword', outline: true }], ['pixelslime', 'The Pixel Slime', '🟩', 0x1a1a1a, 'crawl', 0x6aff6a, { ghost: 0x3aff3a, bulk: 1.6, eyes: 1, eyeSize: 2, outline: true }], ['pixelghost', 'The Pixel Ghost', '👾', 0xff3ad8, 'float', 0xffffff, { orbit: 'cubes', robe: 0xffffff, eyes: 1, outline: true }]] },
  { n: 'The Dream Factory', e: '💤', c: '#b48aff', tint: 0x8a6aff, moon: 0xfff0ff, w: 'sprinkles', town: ['💤 The Dream Factory', 'flat', 0x6a5a8a, 0x3a2a5a, 0xffd8ff, ['cloud', 'gear', 'rings']], a: ['🛏 Pillow Hills', ['cloud', 'giantball']], b: ['⚙️ Nightmare Conveyor', ['crates', 'gear']], reuse: ['cotton', 'steamtown'], deco: 'stars',
    m: [['sleepstealer', 'The Sleep Stealer', '😴', 0xb48aff, 'upright', 0x2a2a4a, { hat: 'nightcap', orbit: 'sparkles', held: 'lantern' }], ['pillowcrawler', 'The Pillow Crawler', '🛏', 0xff6ae8, 'crawl', 0xf0e8ff, { bulk: 1.5, eyes: 6, fur: 0xffffff }], ['dreameater', 'The Dream Eater', '💭', 0xff9af0, 'float', 0x6a3aaa, { headShape: 'dome', tentacles: true, orbit: 'stars' }]] },
];
for (const K of KIT) for (const [key, name, emoji, eye, posture, body, look] of K.m) MONSTERS['k_' + key] = M(name, emoji, eye, posture, body, look);
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
  { name: 'Dino Valley', emoji: '🦖', color: '#9ad84a', center: 'dinoplains', corners: ['ferns', 'tarpits', 'caves', 'lava'], monsters: ['raptor', 'trex', 'ptero'],
    hemi: [0xc8a070, 0x1a120a, 0.75], sky: 0x1a0c06, wall: 0x4a3a2a, lair: 0xff6a1a, speedBonus: 2.5, weather: 'ash',
    blurb: 'A prehistoric valley: open plains with fossils and dino nests, giant ferns, sticky tar pits, caves and a volcano.',
    story: ['Millions of years ago… or is it tonight?', 'The only way out is the north gate.', 'Find 5 keys before the volcano erupts…', 'The ground is shaking.', 'Something BIG is coming.'],
    released: ['The dinosaurs are hungry.', 'Watch out for the tar!'], escape: 'You escaped Dino Valley!' },
  { name: 'Pirate Cove', emoji: '🏴‍☠️', color: '#ffc85a', center: 'piratetown', corners: ['beach', 'shipyard', 'lagoon', 'seacave'], monsters: ['ghostpirate', 'krakenling', 'skullcaptain'],
    hemi: [0x90b0d0, 0x101820, 0.75], sky: 0x081420, wall: 0x5a4430, lair: 0x5aff9a, speedBonus: 2.5, weather: null,
    blurb: 'A cursed pirate port: taverns and docks, a moonlit beach, pirate ships, a lagoon that slows you down and sea caves.',
    story: ['Arr… the cursed crew returns every full moon…', 'The only way out is the north gate.', 'Find 5 keys hidden with the treasure…', 'A ghost ship is coming into the harbor.', 'And its crew wants YOU.'],
    released: ['All hands on deck!', 'Stay out of the water!'], escape: 'You escaped Pirate Cove!' },
  { name: 'Cyber City 2099', emoji: '🤖', color: '#2ad8ff', center: 'cybercity', corners: ['servers', 'lasergrid', 'factory', 'neonpark'], monsters: ['robohound', 'sentinel', 'glitch'],
    hemi: [0x7aa0ff, 0x0a0a1a, 0.8], sky: 0x05050f, wall: 0x2a3050, lair: 0x2ad8ff, speedBonus: 3, weather: 'rain',
    blurb: 'A neon future city in the rain: server farms, laser grids that burn your stamina, junkyards and a glowing neon park.',
    story: ['The year is 2099. The machines run the city now…', 'The only way out is the north gate.', 'Find 5 keys hidden in the system…', 'Security has detected you.', 'Three hunter units are online.'],
    released: ['Hunter units activated.', 'Don\'t touch the lasers!'], escape: 'You escaped Cyber City!' },
  { name: "Volcano Island", emoji: '🌋', color: '#ff6a2a', center: 'volcanotown', corners: ["lava", "ashwoods", "craters", "beach"], monsters: ["magmagolem", "salamander", "emberwraith"],
    hemi: [0xffa070, 0x2a0a04, 0.75], sky: 0x1e0804, wall: 0x3a1a10, lair: 0xff4a0a, speedBonus: 3, weather: 'embers',
    blurb: "A tropical island with an erupting volcano: a lava village, rivers of lava, burnt forests, craters and a black sand beach.", story: ["The volcano woke up at midnight…", "The only way out is the north gate.", "Find 5 keys before the lava reaches you…", "Something is climbing out of the lava.", "Three somethings."], released: ["The island is burning.", "Do NOT step in the lava!"], escape: "You escaped Volcano Island!" },
  { name: "Frozen Castle", emoji: '🏰', color: '#9ae8ff', center: 'icecastle', corners: ["snowwoods", "crystal", "lake", "maze"], monsters: ["iceknight", "frostspider", "snowqueen"],
    hemi: [0xb0d0ff, 0x101828, 0.8], sky: 0x0c1424, wall: 0x8aa0b8, lair: 0x6ae0ff, speedBonus: 3, weather: 'snow',
    blurb: "An enchanted ice castle: frozen courtyards, crystal caves, a slippery frozen lake and an icy hedge maze.", story: ["Long ago, the Snow Queen froze her own castle…", "The only way out is the north gate.", "Find 5 keys frozen in the ice…", "The castle guards are thawing.", "And they are COLD."], released: ["The castle wakes.", "Careful on the ice!"], escape: "You escaped the Frozen Castle!" },
  { name: "Hollow Hospital", emoji: '🏥', color: '#7affb0', center: 'hospital', corners: ["graveyard", "servers", "maze", "swamp"], monsters: ["patient", "nurse", "shadowdoc"],
    hemi: [0x9ad8c0, 0x0a1410, 0.7], sky: 0x061210, wall: 0x5a6a64, lair: 0x5affd8, speedBonus: 3, weather: 'rain',
    blurb: "An abandoned hospital on a rainy hill: dark wards, a graveyard out back, flickering machine rooms and an overgrown garden.", story: ["St. Hollow Hospital closed 50 years ago…", "The only way out is the north gate.", "Find 5 keys left behind by the staff…", "Someone is still checking in.", "Visiting hours are OVER."], released: ["The patients are awake.", "Stay quiet in the halls…"], escape: "You checked out of Hollow Hospital!" },
  { name: "Mushroom Marsh", emoji: '🍄', color: '#c86aff', center: 'shroomtown', corners: ["alienwoods", "swamp", "pumpkins", "ferns"], monsters: ["sporegiant", "toad", "moldspirit"],
    hemi: [0xb090d0, 0x14081a, 0.75], sky: 0x0c0614, wall: 0x4a3a2a, lair: 0xc86aff, speedBonus: 3, weather: 'bubbles',
    blurb: "A soggy marsh full of giant glowing mushrooms: a mushroom village, fungus forests, swamps, gourd patches and ferns.", story: ["Deep in the marsh, the mushrooms are glowing…", "The only way out is the north gate.", "Find 5 keys hidden under the caps…", "The spores are spreading.", "And something is GROWING."], released: ["The marsh is alive.", "Stay out of the swamp water!"], escape: "You escaped Mushroom Marsh!" },
  { name: "Ghost Town Gulch", emoji: '🤠', color: '#ffc85a', center: 'westtown', corners: ["dunes", "canyon", "boneyard", "caves"], monsters: ["sheriff", "rattler", "tumbleghost"],
    hemi: [0xe0b880, 0x2a1a0a, 0.8], sky: 0x1a1006, wall: 0x8a6a44, lair: 0xffc83a, speedBonus: 3.5, weather: 'sand',
    blurb: "A Wild West ghost town: dusty streets, desert dunes, red canyons, a cattle boneyard and old mine caves.", story: ["This town has been empty since the gold ran out…", "The only way out is the north gate.", "Find 5 keys before sundown… oh, it's already night.", "Spurs are jingling in the dark.", "The sheriff never left."], released: ["Draw!", "Watch out for rattlers!"], escape: "You got out of Ghost Town Gulch!" },
  { name: "Sky Islands", emoji: '☁️', color: '#9ad8ff', center: 'skycity', corners: ["cotton", "xcrystal", "gumdrops", "base"], monsters: ["harpy", "thunderbeast", "cloudwraith"],
    hemi: [0xc0d8ff, 0x182030, 0.85], sky: 0x0a1430, wall: 0x8a9ab8, lair: 0xfff04a, speedBonus: 3.5, weather: null, gravity: 48,
    blurb: "Floating islands above the clouds: a cloud city, fluffy cloud fields, crystal plains and floating gardens. LOW gravity, super jumps!", story: ["Above the clouds, a storm is brewing…", "The only way out is the north gate.", "Find 5 keys scattered across the sky…", "Thunder is rolling in.", "And it has WINGS."], released: ["The storm has arrived.", "Jump high!"], escape: "You escaped the Sky Islands!" },
  { name: "Midnight Mall", emoji: '🛍', color: '#ff9ad8', center: 'mall', corners: ["blocks", "ballpit", "trains", "servers"], monsters: ["mannequin", "cartcrawler", "securityghost"],
    hemi: [0xd0b0e0, 0x1a1020, 0.8], sky: 0x0e0816, wall: 0x5a4a6a, lair: 0xff6ae8, speedBonus: 3.5, weather: null,
    blurb: "A giant shopping mall after closing time: storefronts, a toy store, a ball pit play area, a kiddie train and the security office.", story: ["You fell asleep in the mall. Now it's locked…", "The only way out is the north gate.", "Find 5 keys behind the counters…", "The mannequins have moved.", "And they're not alone."], released: ["The mall is closed.", "Hide in the ball pits!"], escape: "You escaped the Midnight Mall!" },
  { name: "Bug Kingdom", emoji: '🐜', color: '#9aff3a', center: 'hive', corners: ["ferns", "tarpits", "caves", "alienwoods"], monsters: ["mantis", "ant", "moth"],
    hemi: [0xa0d080, 0x0e1408, 0.75], sky: 0x081008, wall: 0x4a5a2a, lair: 0x9aff3a, speedBonus: 4, weather: null,
    blurb: "You shrank to bug size! A giant ant hive, huge ferns, sticky sap pits, tunnels and glowing mushrooms.", story: ["Uh oh. You shrank to the size of a bug…", "The only way out is the north gate.", "Find 5 keys in the giant grass…", "Something has six legs.", "And it's HUNGRY."], released: ["The hive is buzzing.", "Don't get stuck in the sap!"], escape: "You escaped the Bug Kingdom!" },
  { name: "Clockwork Town", emoji: '⚙️', color: '#ffb43a', center: 'steamtown', corners: ["factory", "trains", "servers", "ruins"], monsters: ["clockknight", "gearspider", "cuckoo"],
    hemi: [0xd8b080, 0x1a1008, 0.75], sky: 0x140c06, wall: 0x6a4a2a, lair: 0xffb43a, speedBonus: 4, weather: 'ash',
    blurb: "A steampunk town of brass and gears: smoking factories, a train yard, machine rooms and broken ruins.", story: ["In Clockwork Town, every clock just struck midnight…", "The only way out is the north gate.", "Find 5 keys before the clocks stop…", "Gears are turning in the dark.", "Tick… tock… tick…"], released: ["The machines are wound up.", "Run before time runs out!"], escape: "You escaped Clockwork Town!" },
  { name: "Deep Mines", emoji: '⛏', color: '#ffd23a', center: 'minecamp', corners: ["caves", "crystal", "lava", "tarpits"], monsters: ["molebeast", "minerghost", "lanternwisp"],
    hemi: [0xc0a070, 0x0a0806, 0.65], sky: 0x060404, wall: 0x3a3028, lair: 0xffd23a, speedBonus: 4, weather: 'ash',
    blurb: "An old mine deep underground: a miners' camp, dark caves, glowing crystal veins, lava pools and tar pits.", story: ["The mine collapsed years ago. Some miners never left…", "The only way out is the north gate.", "Find 5 keys deep in the tunnels…", "Something is digging toward you.", "Keep your flashlight ON."], released: ["The tunnels are moving.", "Don't fall in the lava!"], escape: "You escaped the Deep Mines!" },
  { name: "Shadow Realm", emoji: '🌑', color: '#b44aff', center: 'shadowcity', corners: ["haunted", "trench", "maze", "graveyard"], monsters: ["shadowstalker", "voidcrawler", "nightmareking"],
    hemi: [0x6a5a9a, 0x08040c, 0.6], sky: 0x030206, wall: 0x1a1024, lair: 0xb44aff, speedBonus: 4.5, weather: 'ash',
    blurb: "The darkest place of all: a shadow city, bleeding woods, a bottomless trench, a maze and a graveyard. VERY dark!", story: ["You fell asleep… and woke up in the Shadow Realm.", "The only way out is the north gate.", "Find 5 keys in the darkness…", "The shadows are moving.", "The Nightmare King is coming."], released: ["The darkness hunts you.", "Your flashlight is your only friend."], escape: "You escaped the Shadow Realm!" },
  { name: "Rainbow Nightmare", emoji: '🌈', color: '#ff7ae8', center: 'rainbowtown', corners: ["gumdrops", "cotton", "neonpark", "ballpit"], monsters: ["unicorn", "cloudclown", "glitterghost"],
    hemi: [0xffb0f0, 0x200a20, 0.85], sky: 0x1a0618, wall: 0x8a4a8a, lair: 0xff6ae8, speedBonus: 4.5, weather: 'sprinkles',
    blurb: "Everything is cute and colorful… too cute. A rainbow town, gumdrop hills, cotton candy fields, a neon park and ball pits.", story: ["Welcome to Rainbow Land! Everyone is SO happy here…", "The only way out is the north gate.", "Find 5 keys under the rainbows…", "The smiles are getting bigger.", "TOO big."], released: ["Let's be friends FOREVER!", "Don't trust the unicorn."], escape: "You escaped the Rainbow Nightmare!" },
  { name: 'Nightmare School', emoji: '🏫', color: '#ffd23a', center: 'school', corners: ['playground', 'sportsfield', 'maze', 'blocks'], monsters: ['substitute', 'lockercrawler', 'chalkghost'],
    hemi: [0xd8c8a0, 0x14100a, 0.75], sky: 0x0e0c08, wall: 0x6a3a2a, lair: 0xff4a4a, speedBonus: 4.5, weather: null,
    blurb: 'A school after dark: classrooms, school buses, a creepy playground and a sports field with bleachers.', story: ['You stayed late after school. Big mistake…', 'The only way out is the north gate.', 'Find 5 keys hidden around campus…', 'The bell just rang. At midnight.', 'Class is in session.'], released: ['School is OUT.', 'No running in the halls!'], escape: 'You escaped Nightmare School!' },
  { name: 'Giant Kitchen', emoji: '🍳', color: '#ff8a5a', center: 'kitchen', corners: ['pantry', 'sinkland', 'chocoriver', 'gumdrops'], monsters: ['butcherchef', 'ratking', 'steamphantom'],
    hemi: [0xffc8a0, 0x1a100a, 0.8], sky: 0x140a06, wall: 0x8a8a90, lair: 0xff3a1a, speedBonus: 4.5, weather: 'bubbles',
    blurb: "You shrank and fell into a giant's kitchen: huge toasters and mugs, a pantry of giant boxes and a soapy sink that slows you.", story: ['You shrank to the size of a fork…', 'The only way out is the north gate.', 'Find 5 keys between the pots and pans…', 'Something is sharpening a knife.', "You're on the menu."], released: ['Dinner time!', 'Stay out of the soapy water!'], escape: 'You escaped the Giant Kitchen!' },
  { name: 'Phantom Opera House', emoji: '🎻', color: '#ff6a8a', center: 'opera', corners: ['backstage', 'ballroom', 'graveyard', 'haunted'], monsters: ['maestro', 'ballerina', 'diva'],
    hemi: [0xd0a0c0, 0x140810, 0.7], sky: 0x0e040a, wall: 0x4a1a24, lair: 0xffc83a, speedBonus: 4.5, weather: null,
    blurb: 'A grand old opera house: red velvet seats, chandeliers, a cluttered backstage and a ballroom of dancing statues.', story: ['The opera house burned down 100 years ago…', 'The only way out is the north gate.', 'Find 5 keys before the final act…', 'The orchestra is tuning up.', 'And YOU have the lead role.'], released: ['Curtain up!', 'The show must go on.'], escape: 'You escaped the Phantom Opera House!' },
  { name: "Dragon's Peak", emoji: '🐉', color: '#ff5a3a', center: 'dragonkeep', corners: ['goldhoard', 'crags', 'lava', 'ashwoods'], monsters: ['whelp', 'treasuregolem', 'wyrm'],
    hemi: [0xd89a70, 0x1a0806, 0.75], sky: 0x140604, wall: 0x3a2a26, lair: 0xffa21a, speedBonus: 5, weather: 'embers',
    blurb: "A ruined castle on a mountain: dark towers with banners, a dragon's hoard of gold, jagged crags and lava.", story: ['The knights never came back from the peak…', 'The only way out is the north gate.', "Find 5 keys hidden in the dragon's gold…", 'Something huge is breathing in the dark.', 'And it smells smoke.'], released: ['The dragons wake!', 'Do NOT step in the lava!'], escape: "You escaped Dragon's Peak!" },
  { name: 'Moonlit Shrine', emoji: '⛩', color: '#ff7a9a', center: 'shrine', corners: ['blossoms', 'bamboo', 'river', 'mossrock'], monsters: ['ogre', 'foxspirit', 'paperlantern'],
    hemi: [0xe0a8c0, 0x100a14, 0.75], sky: 0x0c0612, wall: 0x6a1a1a, lair: 0xff5a2a, speedBonus: 5, weather: 'sprinkles',
    blurb: 'A mountain shrine under a full moon: pagodas and red gates, blossom groves, a thick bamboo forest and streams.', story: ['Lanterns are glowing at the old shrine…', 'The only way out is the north gate.', 'Find 5 keys before the lanterns go out…', 'The spirits have noticed you.', 'They do not like visitors.'], released: ['The spirits are restless.', 'Hide in the bamboo!'], escape: 'You escaped the Moonlit Shrine!' },
  { name: 'Construction Rooftops', emoji: '🏗', color: '#ffb43a', center: 'rooftops', corners: ['construction', 'billboards', 'factory', 'ruins'], monsters: ['steelgiant', 'gargoyle', 'smogwraith'],
    hemi: [0xb0b8d0, 0x0a0a10, 0.75], sky: 0x080a12, wall: 0x4a4a52, lair: 0xffa21a, speedBonus: 5, weather: 'rain',
    blurb: 'High above the city: rooftops with water tanks and fans, a half-built tower full of steel beams and glowing billboards.', story: ['You climbed too high on the half-built tower…', 'The only way down is the north gate.', 'Find 5 keys across the rooftops…', 'The gargoyles are not statues.', "And it's a long way down."], released: ['The roof is alive.', "Don't look down!"], escape: 'You got off the Construction Rooftops!' },
  { name: 'Aquarium After Dark', emoji: '🐠', color: '#3ad8ff', center: 'aquarium', corners: ['tanks', 'touchpools', 'reef', 'kelp'], monsters: ['sharkman', 'crab', 'eel'],
    hemi: [0x6ac0e8, 0x061020, 0.8], sky: 0x040c18, wall: 0x1a3a5a, lair: 0x3affff, speedBonus: 5, weather: 'bubbles',
    blurb: 'A huge aquarium after closing: glowing fish tanks, glass tunnels, giant tanks and splashy touch pools that slow you.', story: ['The aquarium closed hours ago. You hid in the gift shop…', 'The only way out is the north gate.', 'Find 5 keys among the tanks…', 'Something cracked the biggest tank.', 'And it got OUT.'], released: ['The tanks are open.', 'Stay out of the touch pools!'], escape: 'You escaped the Aquarium!' },
  { name: 'Mad Science Lab', emoji: '🧪', color: '#8aff3a', center: 'lab', corners: ['vats', 'teslafield', 'servers', 'lasergrid'], monsters: ['madscientist', 'experiment', 'brainjar'],
    hemi: [0xa0e8a0, 0x081008, 0.75], sky: 0x040a04, wall: 0x3a4a3a, lair: 0x8aff3a, speedBonus: 5.5, weather: 'rain',
    blurb: 'A secret lab in a storm: buzzing tesla coils, bubbling vats of goo, glass pods and laser grids.', story: ['Lightning struck the secret lab…', 'The only way out is the north gate.', 'Find 5 keys before the next storm…', 'The experiments are awake.', "IT'S ALIVE!"], released: ['The lab is in lockdown.', 'Stay away from the lasers!'], escape: 'You escaped the Mad Science Lab!' },
  { name: 'Carnivore Garden', emoji: '🌺', color: '#ff4a8a', center: 'greenhouse', corners: ['flytraps', 'thorns', 'jungle', 'swamp'], monsters: ['flytrap', 'thornbeast', 'pollenwitch'],
    hemi: [0xa0d890, 0x0a1408, 0.75], sky: 0x060e06, wall: 0x3a5a2a, lair: 0xff3a3a, speedBonus: 5.5, weather: 'sprinkles',
    blurb: 'A botanical garden where the plants are hungry: glass greenhouses, giant flytraps that turn to watch you, thorny brambles.', story: ['The greenhouse plants have grown… a lot.', 'The only way out is the north gate.', 'Find 5 keys in the flower beds…', 'Something just licked its lips.', 'Plants are not supposed to have lips.'], released: ['Feeding time!', 'Watch out for the swamp!'], escape: 'You escaped the Carnivore Garden!' },
  { name: 'Boardwalk at Midnight', emoji: '🎢', color: '#ffd23a', center: 'boardwalk', corners: ['tidepools', 'sandcastles', 'beach', 'lagoon'], monsters: ['lifeguard', 'hermit', 'gull'],
    hemi: [0xa8c0e0, 0x101420, 0.8], sky: 0x081022, wall: 0x6a5034, lair: 0xff8a3a, speedBonus: 5.5, weather: null,
    blurb: 'A seaside boardwalk at midnight: wooden piers, game stalls, a spinning lighthouse, tide pools and giant sandcastles.', story: ['The boardwalk lights flicker on at midnight…', 'The only way out is the north gate.', 'Find 5 keys buried in the sand…', 'Something is crawling out of the tide.', 'The beach is closed. Permanently.'], released: ['High tide!', 'Stay out of the water!'], escape: 'You escaped the Boardwalk!' },
  { name: 'Museum at Night', emoji: '🏛', color: '#e8d8b0', center: 'museum', corners: ['statuegarden', 'fossilhall', 'pyramids', 'boneyard'], monsters: ['statue', 'fossil', 'portrait'],
    hemi: [0xd0c8b0, 0x100e0a, 0.75], sky: 0x0a0806, wall: 0xb0a890, lair: 0x9ae8ff, speedBonus: 6, weather: null,
    blurb: 'A great museum after hours: marble halls, glowing display cases, a garden of statues that watch you, and fossil halls.', story: ['You got locked in the museum overnight…', 'The only way out is the north gate.', 'Find 5 keys in the exhibits…', 'The statues were facing the other way a second ago.', 'The exhibits are waking up.'], released: ['The museum is OPEN.', "Don't let them catch you blinking."], escape: 'You escaped the Museum!' },
  { name: 'Sewer Depths', emoji: '🕳', color: '#8aff2a', center: 'sewers', corners: ['sludge', 'pipeworks', 'caves', 'trench'], monsters: ['gator', 'sludgeman', 'sewerspecter'],
    hemi: [0x90b080, 0x060804, 0.65], sky: 0x030402, wall: 0x3a3a2a, lair: 0x8aff2a, speedBonus: 6, weather: 'bubbles',
    blurb: 'Deep under the city: brick tunnels, rivers of toxic sludge (it burns your stamina!), giant pipes and dark caves.', story: ['You fell through a drain…', 'The only way out is the north gate.', 'Find 5 keys in the muck…', 'Something big is swimming in the sludge.', 'Something with TEETH.'], released: ['The sewers are flooding.', "Don't touch the green stuff!"], escape: 'You climbed out of the Sewer Depths!' },
  { name: "Derelict Space Station", emoji: '🚀', color: '#5ad8ff', center: 'station', corners: ["hangar", "reactor", "ufo", "xcrystal"], monsters: ["astronaut", "hullcrawler", "stareater"],
    hemi: [0x9ab0e0, 0x060812, 0.75], sky: 0x020208, wall: 0x4a5060, lair: 0x5ad8ff, speedBonus: 6, weather: null, gravity: 46,
    blurb: "A space station drifting through the dark: crew modules, solar panels, a hangar full of shuttles and a glowing reactor (plasma burns!). Low gravity!", story: ["The space station stopped answering three days ago\u2026", "The only way out is the north airlock.", "Find 5 keys to power it up\u2026", "The crew is still on board.", "What is left of them."], released: ["Hull breach!", "Stay away from the plasma!"], escape: "You escaped the Space Station!" },
  { name: "Storybook Woods", emoji: '📚', color: '#ffb43a', center: 'storytown', corners: ["pages", "fairyring", "forest", "maze"], monsters: ["witch", "storywolf", "pageghost"],
    hemi: [0xd8c0a0, 0x140c06, 0.75], sky: 0x0e0804, wall: 0x5a3a2a, lair: 0x8aff3a, speedBonus: 6, weather: 'sprinkles',
    blurb: "You fell into a fairy tale: houses made of giant books, crooked cottages, fields of loose pages and glowing fairy rings.", story: ["Once upon a time, you opened the wrong book\u2026", "The only way out is the north gate.", "Find 5 keys before the story ends\u2026", "The villains have noticed you.", "This story does NOT have a happy ending."], released: ["Once upon a nightmare\u2026", "Stay out of the ink!"], escape: "You escaped the Storybook!" },
  { name: "Ghost Train Station", emoji: '🚂', color: '#ffb43a', center: 'depot', corners: ["railyard", "coalyard", "factory", "graveyard"], monsters: ["conductor", "coalcrawler", "steamghost"],
    hemi: [0xb0a8a0, 0x0a0806, 0.7], sky: 0x060504, wall: 0x3a3430, lair: 0xffb43a, speedBonus: 6, weather: 'ash',
    blurb: "An old train station at midnight: platforms, a steam engine still hissing, a railyard of signals and boxcars and smoking coal heaps.", story: ["The last train left 80 years ago\u2026", "The only way out is the north gate.", "Find 5 keys before the midnight train arrives\u2026", "You can hear a whistle.", "All aboard\u2026"], released: ["The ghost train is here!", "Mind the gap!"], escape: "You escaped the Ghost Train Station!" },
  { name: "Neon Arcade", emoji: '🕹', color: '#ff3ad8', center: 'arcade', corners: ["pinball", "slots", "neonpark", "ballpit"], monsters: ["pixelbrute", "coincruncher", "clawghost"],
    hemi: [0xc0a0ff, 0x0a0614, 0.8], sky: 0x06020e, wall: 0x2a1a4a, lair: 0xff3ad8, speedBonus: 6.5, weather: null,
    blurb: "The biggest arcade ever, after closing: game cabinets, claw machines, giant pinball bumpers, slot machines and ball pits.", story: ["You got locked in the arcade overnight\u2026", "The only way out is the north gate.", "Find 5 keys to beat the high score\u2026", "INSERT COIN.", "PLAYER 2 HAS ENTERED THE GAME."], released: ["GAME ON!", "Hide in the ball pits!"], escape: "You beat the Neon Arcade!" },
  { name: "Haunted Movie Studio", emoji: '🎬', color: '#ffe03a', center: 'backlot', corners: ["soundstage", "filmvault", "westtown", "city"], monsters: ["director", "rubbersuit", "projector"],
    hemi: [0xd0c8b0, 0x0e0c0a, 0.75], sky: 0x0a0806, wall: 0x4a4440, lair: 0xffe03a, speedBonus: 6.5, weather: null,
    blurb: "An abandoned film studio: fake building fronts, cameras and spotlights, giant green-screen stages, reels of old film and old movie sets.", story: ["They were filming a horror movie here\u2026", "The only way out is the north gate.", "Find 5 keys on the movie sets\u2026", "The monsters were never actors.", "And the cameras are still rolling."], released: ["ACTION!", "Run like it is the last scene!"], escape: "You escaped the Movie Studio! THAT is a wrap!" },
  { name: "Bayou Nights", emoji: '🐊', color: '#8aff6a', center: 'bayou', corners: ["cypress", "bog", "swamp", "river"], monsters: ["gatorman", "mossbeast", "boglady"],
    hemi: [0x90b090, 0x060a04, 0.7], sky: 0x040804, wall: 0x3a4a2a, lair: 0xc8ff6a, speedBonus: 6.5, weather: 'rain',
    blurb: "A misty bayou: shacks on stilts, docks and airboats, cypress trees dripping with moss, and bogs full of lily pads (and glowing eyes).", story: ["Deep in the bayou, the fog never lifts\u2026", "The only way out is the north gate.", "Find 5 keys between the shacks\u2026", "Something is watching from the water.", "Lots of somethings."], released: ["The bayou wakes up.", "Stay out of the bog!"], escape: "You escaped the Bayou!" },
  { name: "Cursed Colosseum", emoji: '⚔️', color: '#ff5a3a', center: 'colosseum', corners: ["arenasand", "catacombs", "ruins", "pyramids"], monsters: ["gladiator", "arenalion", "emperor"],
    hemi: [0xe0b090, 0x1a0c06, 0.75], sky: 0x120604, wall: 0x8a6a4a, lair: 0xff3a3a, speedBonus: 7, weather: 'sand',
    blurb: "A giant cursed arena: towering arches, gladiator statues, sand pits with weapon racks and chariots, and catacombs full of skulls.", story: ["Two thousand years ago, the crowd cheered here\u2026", "The only way out is the north gate.", "Find 5 keys around the arena\u2026", "The crowd is cheering again.", "For THEM."], released: ["Let the games begin!", "The crowd wants blood!"], escape: "You escaped the Colosseum!" },
  { name: "Doodle Land", emoji: '🎨', color: '#3a8aff', center: 'doodletown', corners: ["crayons", "paintsplash", "gumdrops", "blocks"], monsters: ["scribble", "eraser", "inkblot"],
    hemi: [0xe0e0f0, 0x101018, 0.9], sky: 0x14141c, wall: 0xe8e8f0, lair: 0x3a8aff, speedBonus: 7, weather: null,
    blurb: "A world drawn with a marker: doodled houses with thick black outlines, giant crayons, sticky paint puddles, gumdrops and blocks.", story: ["Somebody drew a monster in their notebook\u2026", "The only way out is the north gate.", "Find 5 keys hidden in the drawings\u2026", "The doodles are coming to life.", "And they cannot be erased."], released: ["Scribble scribble!", "Do not step in the paint!"], escape: "You escaped Doodle Land!" },
  { name: "Ghost Cruise Ship", emoji: '🚢', color: '#5affd8', center: 'cruise', corners: ["pooldeck", "engineroom", "wrecks", "lagoon"], monsters: ["captain", "barnacle", "foghorn"],
    hemi: [0xa0c0d8, 0x060c14, 0.75], sky: 0x040a14, wall: 0xe8e8e8, lair: 0x5affd8, speedBonus: 7, weather: null,
    blurb: "A cruise ship that sank and came back: decks with smokestacks and lifeboats, pools that slow you, a roaring engine room and shipwrecks.", story: ["The cruise ship vanished in a storm 100 years ago\u2026", "The only way off is the north gate.", "Find 5 keys on the decks\u2026", "The ship is creaking.", "The passengers are boarding again."], released: ["All hands on deck!", "Stay out of the pools!"], escape: "You escaped the Ghost Cruise Ship!" },
  { name: "Spider Queen's Nest", emoji: '🕷', color: '#b44aff', center: 'nest', corners: ["webwoods", "eggcave", "caves", "haunted"], monsters: ["spiderqueen", "cocoonman", "webwraith"],
    hemi: [0xa090b0, 0x08040a, 0.65], sky: 0x050208, wall: 0x2a1a2a, lair: 0xb44aff, speedBonus: 7.5, weather: null,
    blurb: "A nest of giant spiders: huts covered in webs, huge webs strung between posts, glowing egg sacs, cocoons and dark woods.", story: ["Everyone who went into these woods\u2026 stayed.", "The only way out is the north gate.", "Find 5 keys before you get stuck\u2026", "Something is spinning a web.", "A VERY big web."], released: ["The nest is hatching!", "Do not get caught in a web!"], escape: "You escaped the Spider Queen's Nest!" },
  { name: "Mirror Dimension", emoji: '🪞', color: '#ff6ae8', center: 'mirrortown', corners: ["mirrormaze", "kaleido", "xcrystal", "neonpark"], monsters: ["reflection", "shardbeast", "mirrorqueen"],
    hemi: [0xd0c0f0, 0x0c0814, 0.85], sky: 0x0a0612, wall: 0x8a8aa0, lair: 0xff6ae8, speedBonus: 7.5, weather: 'sprinkles',
    blurb: "A world behind the glass: mirror buildings, houses hanging upside down from the sky, a maze of mirrors and kaleidoscope fields.", story: ["You looked into the mirror for too long\u2026", "The only way out is the north gate.", "Find 5 keys on this side of the glass\u2026", "Your reflection just blinked.", "You did not."], released: ["The mirrors shatter!", "Trust nothing you see."], escape: "You escaped the Mirror Dimension!" },
  { name: 'The Nightmare Mix', emoji: '🌀', color: '#ff4ad0', mix: true, center: 'city', corners: [], monsters: [],
    hemi: [0xb070e0, 0x200820, 0.7], sky: 0x120414, wall: 0x2a1030, lair: 0xff2ad0, speedBonus: 2, weather: 'embers',
    blurb: 'Different every round: random areas from every level and 3 random monsters. The warm-up for the final level.',
    story: ['Every nightmare at once. Nothing makes sense here.', 'The only way out is the north gate.', 'Find 5 keys…', 'Who will it be this time?', 'Good luck.'],
    released: ['Here they come.', 'Run like you mean it.'], escape: 'You escaped the Nightmare Mix! Only THE FINAL NIGHTMARE is left…' },
  { name: 'THE FINAL NIGHTMARE', emoji: '👑', color: '#ff2a4a', center: 'throne', corners: ['voidrift', 'bonefield', 'stormspire', 'lava'], monsters: ['nightmarelord', 'abyssdragon', 'voidqueen'],
    hemi: [0xc06080, 0x10020a, 0.7], sky: 0x0a0006, wall: 0x1a0a14, lair: 0xff1a3a, speedBonus: 6, weather: 'embers', final: true,
    battle: true, keyWord: 'nightmare crystal', keyIcon: '💠', keyColor: 0xff3aff, arena: [0x2a0614, 0xff1a3a, 0xb44aff],
    battleTitle: 'NIGHTMARE DEFEATED!', battleCap: 'THE NIGHTMARE IS OVER! 🏆', battleWin: 'You grew GIANT and defeated the Nightmare Lord, the Abyss Dragon and the Void Queen. You beat EVERY nightmare!',
    blurb: 'The last level. The Nightmare Throne, a sky with a giant watching eye, lightning, floating void rocks and fields of titan bones. Three GIANT bosses. Collect 5 nightmare crystals to grow GIANT and fight them all!',
    story: ['Every nightmare you escaped… came from HERE.', 'The Nightmare Throne. The end of everything.', 'Find 5 nightmare crystals. They will make you GIANT…', 'The sky just opened its eye.', 'They are the biggest of them all. And they are AWAKE.'],
    released: ['THE FINAL NIGHTMARE BEGINS.', 'Survive. Collect the crystals. FIGHT.'], escape: 'You beat THE FINAL NIGHTMARE!' },
];
// each level's own colors: tint (ground + fog), moon color, and decorations scattered over its corner areas
// (several levels share corner areas, so this keeps every map looking like its own place)
[
  {}, { tint: [0x6ab8ff, 0.12], moon: 0xd8f0ff }, { tint: [0xff7a1e, 0.1], moon: 0xffd08a }, { tint: [0xff4a1a, 0.15], moon: 0xff6a3a },
  { tint: [0xffb43a, 0.12], moon: 0xffe0a0 }, { tint: [0x1ab8ff, 0.18], moon: 0x8af0ff }, { tint: [0x6a3aff, 0.15], moon: 0x9aff8a },
  { tint: [0xff4aa0, 0.14], moon: 0xffb0e0 }, { tint: [0x7a3aff, 0.12], moon: 0xfff0c0 }, { tint: [0x2aff6a, 0.1], moon: 0xe8ffd0 },
  { tint: [0xffa03a, 0.1], moon: 0xfff0a0 }, { tint: [0xff6a1a, 0.14], moon: 0xffa060 }, { tint: [0x2a8aff, 0.12], moon: 0xfff4d0 },
  { tint: [0x2ad8ff, 0.14], moon: 0x6affff },
  { tint: [0xff3a0a, 0.3], moon: 0xff3a1a, deco: 'embers' }, { tint: [0x8ae0ff, 0.3], moon: 0xc8f4ff, deco: 'ice' },
  { tint: [0x3aff9a, 0.25], moon: 0x9affc8, deco: 'wisps' }, { tint: [0xb44aff, 0.3], moon: 0xe0a0ff, deco: 'spores' },
  { tint: [0xffa03a, 0.3], moon: 0xffc070, deco: 'tumbleweeds' }, { tint: [0x9ad0ff, 0.35], moon: 0xffffff, deco: 'clouds' },
  { tint: [0xff6ae8, 0.25], moon: 0xffb0f0, deco: 'balloons' }, { tint: [0x9aff3a, 0.3], moon: 0xe0ff9a, deco: 'fireflies' },
  { tint: [0xffa02a, 0.28], moon: 0xffd890, deco: 'gears' }, { tint: [0xffc83a, 0.22], moon: 0x8a6a3a, deco: 'gold' },
  { tint: [0x6a1aff, 0.35], moon: 0x8a3aff, deco: 'shards' }, { tint: [0xff6ae8, 0.3], moon: 0xffb0ff, deco: 'stars' },
  { tint: [0xffd23a, 0.15], moon: 0xfff0c0, deco: 'papers' }, { tint: [0xff8a3a, 0.2], moon: 0xffe0b0, deco: 'bubbles' },
  { tint: [0xc02a4a, 0.28], moon: 0xffd0d8, deco: 'petals', decoColor: 0xd01a3a }, { tint: [0xff4a1a, 0.3], moon: 0xff8a3a, deco: 'embers' },
  { tint: [0xff6a9a, 0.22], moon: 0xfff4e0, deco: 'lanterns' }, { tint: [0x5a7aaa, 0.25], moon: 0xd8e0ff, deco: 'clouds', decoColor: 0x4a4a54 },
  { tint: [0x1a9aff, 0.3], moon: 0x8ae8ff, deco: 'bubbles' }, { tint: [0x6aff3a, 0.16], moon: 0xc8ff8a, deco: 'fireflies', decoColor: 0x6aff3a },
  { tint: [0xff3a7a, 0.22], moon: 0xffd0e8, deco: 'petals', decoColor: 0xffa0d0 }, { tint: [0x3a8aff, 0.2], moon: 0xfff0d0, deco: 'balloons' },
  { tint: [0xe8c890, 0.18], moon: 0xf0f0ff, deco: 'wisps', decoColor: 0xd0e8ff }, { tint: [0x6aff2a, 0.15], moon: 0x8a9a5a, deco: 'flies' },
  { tint: [0x3a6aff, 0.25], moon: 0x8ad8ff, deco: 'stars' }, { tint: [0xffb43a, 0.18], moon: 0xfff0c0, deco: 'fireflies', decoColor: 0xffe08a },
  { tint: [0xff8a3a, 0.15], moon: 0xffd8a0, deco: 'embers' }, { tint: [0xff3ad8, 0.28], moon: 0xff9af0, deco: 'stars' },
  { tint: [0xffe03a, 0.14], moon: 0xffffff, deco: 'papers' }, { tint: [0x6aff3a, 0.14], moon: 0xe0ffc0, deco: 'fireflies', decoColor: 0xc8ff6a },
  { tint: [0xff6a3a, 0.2], moon: 0xffc080, deco: 'embers' }, { tint: [0x8aaaff, 0.12], moon: 0xffffff, deco: 'papers' },
  { tint: [0x3affd8, 0.2], moon: 0xd0fff4, deco: 'bubbles' }, { tint: [0xb44aff, 0.25], moon: 0xd8b0ff, deco: 'flies' },
  { tint: [0xff6ae8, 0.25], moon: 0xffffff, deco: 'shards' },
  {}, // the Nightmare Mix
  { tint: [0xff1a3a, 0.32], moon: 0xff1a1a, deco: 'embers' },
].forEach((look, k) => Object.assign(LEVELS[k], look));
LEVELS.splice(LEVELS.findIndex((l) => l.mix), 0, ...KIT.map((K, k) => {
  const id = 'kit' + k, t = new THREE.Color(K.tint), dark = (f) => t.clone().multiplyScalar(f).getHex(), plain = (s) => s.replace(/^\S+ /, '');
  const first = MONSTERS['k_' + K.m[0][0]].name;
  return { name: K.n, emoji: K.e, color: K.c, center: id + 't', corners: [id + 'a', id + 'b', ...K.reuse], monsters: K.m.map((m) => 'k_' + m[0]),
    hemi: [t.clone().lerp(new THREE.Color(0xffffff), 0.5).getHex(), dark(0.06), 0.75], sky: dark(0.05), wall: dark(0.3), lair: K.m[0][3],
    speedBonus: Math.min(9, 7.5 + k * 0.03), weather: K.w, gravity: K.g, tint: [K.tint, 0.22], moon: K.moon, deco: K.deco,
    blurb: `${plain(K.town[0])}, ${plain(K.a[0])} and ${plain(K.b[0])}. Three brand new monsters.`,
    story: [`Welcome to ${K.n}. Nobody comes here after dark…`, 'The only way out is the north gate.', 'Find 5 keys before it is too late…', `${first} is waking up.`, 'And it is not alone.'],
    released: [`${K.n} comes alive!`, 'RUN!'], escape: `You escaped ${K.n}!` };
}));
// BIG levels (5 quest items, slow-motion escape): the boss battles and every 10th level
LEVELS.forEach((L, k) => { L.big = !L.mix && (!!L.battle || (k + 1) % 10 === 0); });
const tintFog = (hex) => { const L = game.L; return L && L.tint ? new THREE.Color(hex).lerp(new THREE.Color(L.tint[0]).multiplyScalar(0.22), Math.min(1, L.tint[1] * 1.6)).getHex() : hex; }; // darker tint so the night stays dark
// level 6 rolls a new mix of areas and monsters every round
function resolveLevel(L) {
  if (!L.mix) return L;
  const pick = (arr, n) => { const a = [...arr]; for (let k = a.length - 1; k > 0; k--) { const r = Math.floor(Math.random() * (k + 1)); [a[k], a[r]] = [a[r], a[k]]; } return a.slice(0, n); };
  const others = LEVELS.filter((x) => !x.mix);
  return { ...L, center: pick(others.map((x) => x.center), 1)[0], corners: pick(others.flatMap((x) => x.corners), 4),
    monsters: pick(others.filter((x) => !x.battle).flatMap((x) => x.monsters), 3) };
}
// ---------------------------------------------------------------------------
// Story quests: every level has one. Find the quest items (3, or 5 on a BIG level); each tells part of the story,
// and finishing the quest gives you an edge. m = the level's monster names, L = the level.
// ---------------------------------------------------------------------------
const QUESTS = [
  { id: 'diary', title: 'The Lost Diary', item: 'diary page', icon: '📄', col: 0xf0e8d0, perk: 'keys', perkText: 'The diary marks where every key is hidden! Look for the bright beams.',
    lines: (L, m) => [`"Day 1: We came to ${L.name} on a dare. Everyone said to stay away from ${m[0]}."`, `"Day 2: ${m[1]} took Sam. I hid until it went quiet."`, `"Day 3: There IS a way out. The north gate. Five keys open it."`, `"Day 4: ${m[2]} can't see you if you stay low and keep moving."`, `"Last page: If you are reading this… don't stop running."`] },
  { id: 'beacons', title: 'Light the Beacons', item: 'beacon', icon: '🔥', col: 0xff8a2a, perk: 'slow', perkText: 'All the beacons blaze! The monsters are blinded and SLOW for 25 seconds.',
    lines: (L, m) => [`The first beacon roars to life. Somewhere, ${m[0]} hisses at the light.`, `Another beacon lit. The shadows of ${L.name} pull back a little.`, `The beacons form a ring of fire. The monsters hate it.`, `${m[1]} howls. The light hurts it.`, `One more…`] },
  { id: 'relics', title: 'The Three Relics', item: 'relic', icon: '🏺', col: 0xffc83a, perk: 'ghost', perkText: 'The relics turn into 2 Ghost Potions! Press Q to vanish.',
    lines: (L, m) => [`An old relic, warm to the touch. It whispers your name.`, `The second relic glows when ${m[0]} is near.`, `"Whoever holds the relics walks unseen" is carved on its base.`, `The relics are humming together now.`, `They're almost awake…`] },
  { id: 'curse', title: 'Break the Curse', item: 'cursed totem', icon: '🗿', col: 0xb44aff, perk: 'stun', perkText: 'The curse SHATTERS! Every monster is stunned for 6 seconds. RUN!',
    lines: (L, m) => [`You smash the first totem. ${m[0]} screams somewhere far away.`, `Another totem cracks. The curse on ${L.name} is weakening.`, `The totems were feeding the monsters. Not anymore.`, `${m[2]} is getting nervous. You can feel it.`, `Just one left…`] },
  { id: 'map', title: 'The Torn Map', item: 'map piece', icon: '🗺', col: 0xd8b07a, perk: 'keys', perkText: 'The map is complete! Every key in the area is marked with a bright beam.',
    lines: (L, m) => [`A torn piece of an old map of ${L.name}. Something is circled in red.`, `The second piece shows the north gate… and a path around ${m[1]}'s lair.`, `"X marks the keys", someone scribbled in the corner.`, `The pieces fit together. Almost there.`, `One last piece…`] },
  { id: 'survivors', title: 'Find the Survivors', item: 'survivor', icon: '🧍', col: 0x7affd0, perk: 'bomb', perkText: 'The survivors give you 2 Flash Bombs to thank you! Press E.',
    lines: (L, m) => [`"You're real! I've been hiding from ${m[0]} all night!" They run for the gate.`, `"I saw ${m[1]} eat a whole car. Take this, you'll need it."`, `"Stay off the ground. They can't climb as well as you."`, `"There's more of us out here. Find them!"`, `"Thank you. Now get OUT of here."`] },
  { id: 'radio', title: 'Call for Help', item: 'radio part', icon: '📻', col: 0x5ad8ff, perk: 'boost', perkText: 'The radio crackles: "Help is coming, keep running!" You get a 15-second SPEED BOOST.',
    lines: (L, m) => [`A radio battery. Still has a little charge.`, `An antenna. The static whispers: "…${L.name}… anyone…"`, `The speaker. You hear breathing on the other end. Then: "Who is this?"`, `"We can hear you. Hold on."`, `Last part…`] },
  { id: 'seal', title: 'Seal the Lair', item: 'seal stone', icon: '🔷', col: 0x5affff, perk: 'slow', perkText: 'The seal stones pulse! The monsters feel it and SLOW down for 25 seconds.',
    lines: (L, m) => [`A glowing seal stone. It's cold, like ice.`, `The second stone hums. ${m[0]} stops and sniffs the air.`, `The stones are drawing a circle around the lair.`, `${m[2]} backs away from the light.`, `One more stone…`] },
];
const questOf = (L) => { let h = 0; for (const ch of L.name) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return QUESTS[h % QUESTS.length]; };
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
{ // the Nightmare Mix moves when levels are added: carry its best time and selection along
  const mixNow = LEVELS.findIndex((l) => l.mix) + 1, mixWas = save.mixAt || (save.mixMoved ? 39 : 27);
  if (mixWas !== mixNow) {
    if (save.levelBest && save.levelBest[mixWas] !== undefined) { save.levelBest[mixNow] = save.levelBest[mixWas]; delete save.levelBest[mixWas]; }
    if (save.level === mixWas) save.level = mixNow;
  }
  save.mixAt = mixNow;
  const finNow = LEVELS.findIndex((l) => l.final) + 1, finWas = save.finalAt || 51;
  if (finWas !== finNow) {
    if (save.levelBest && save.levelBest[finWas] !== undefined && finWas !== mixNow) { save.levelBest[finNow] = save.levelBest[finWas]; delete save.levelBest[finWas]; }
    if (save.level === finWas && finWas !== mixNow) save.level = finNow;
  }
  save.finalAt = finNow;
}
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
let moonMesh;
{
  const starGeo = new THREE.BufferGeometry();
  const pts = [];
  for (let i = 0; i < 1600; i++) {
    const th = Math.random() * Math.PI * 2, ph = Math.random() * Math.PI * 0.45;
    pts.push(700 * Math.sin(ph) * Math.cos(th), 700 * Math.cos(ph) + 40, 700 * Math.sin(ph) * Math.sin(th));
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85 })));
  moonMesh = new THREE.Mesh(new THREE.SphereGeometry(28, 32, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xe8e4ff).multiplyScalar(2.2), fog: false }));
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
  // Level 12
  dinoplains: { name: '🦴 Dino Plains', color: '#d8c87a', ground: [70, 70, 40], fog: 0x1e1408, density: 0.0075, map: '#4a4a2a', sight: 1.1 },
  ferns: { name: '🌿 Giant Fern Forest', color: '#7aff6a', ground: [30, 50, 22], fog: 0x0a1a08, density: 0.013, map: '#1a3a14', sight: 0.45 },
  tarpits: { name: '⚫ Tar Pits (sticky!)', color: '#b0a090', ground: [40, 34, 28], fog: 0x140e0a, density: 0.01, map: '#2a2420', sight: 0.9 },
  caves: { name: '🕳 Dino Caves', color: '#c8a07a', ground: [44, 36, 30], fog: 0x0e0a08, density: 0.013, map: '#3a2e26', sight: 0.5 },
  // Level 13
  piratetown: { name: '🍺 Pirate Port', color: '#ffc85a', ground: [70, 56, 40], fog: 0x0e1418, density: 0.0085, map: '#4a3a2a', sight: 1 },
  beach: { name: '🏝 Moonlit Beach', color: '#ffe8a0', ground: [150, 130, 90], fog: 0x0c1a24, density: 0.0075, map: '#8a7a54', sight: 1.15 },
  shipyard: { name: '⛵ Pirate Shipyard', color: '#d8b07a', ground: [60, 50, 38], fog: 0x0a141c, density: 0.009, map: '#3a3026', sight: 0.75 },
  lagoon: { name: '🌊 The Lagoon (water slows you)', color: '#6ad8ff', ground: [60, 80, 70], fog: 0x081a24, density: 0.009, map: '#2a4a4a', sight: 1 },
  seacave: { name: '🦀 Sea Caves', color: '#8ab0d0', ground: [30, 40, 46], fog: 0x040c14, density: 0.013, map: '#1a2a34', sight: 0.5 },
  // Level 14
  cybercity: { name: '🌆 Cyber City', color: '#2ad8ff', ground: [26, 26, 40], fog: 0x0a0a20, density: 0.0065, map: '#22223a', sight: 1 },
  servers: { name: '🖥 Server Farm', color: '#5aff8a', ground: [30, 34, 40], fog: 0x081410, density: 0.0095, map: '#1e2a2a', sight: 0.6 },
  lasergrid: { name: '🔴 Laser Grid (lasers burn your stamina!)', color: '#ff4a6a', ground: [24, 20, 30], fog: 0x1a0610, density: 0.009, map: '#2a1a2a', sight: 1 },
  neonpark: { name: '🌳 Neon Park', color: '#ff6ae8', ground: [20, 24, 40], fog: 0x0e0a24, density: 0.011, map: '#1a1a3a', sight: 0.5 },
};

Object.assign(ZONES, {
  volcanotown: { name: '🌋 Lava Village', color: '#ff8a4a', ground: [44, 28, 22], fog: 0x2a0c04, density: 0.0085, map: '#3a2018', sight: 0.95, use: 'ruins' },
  icecastle: { name: '🏰 Ice Castle Courtyard', color: '#c0f0ff', ground: [150, 170, 190], fog: 0x1a2a40, density: 0.0085, map: '#6a8098', sight: 1, use: 'village' },
  hospital: { name: '🏥 The Hospital', color: '#a8ffd8', ground: [52, 60, 58], fog: 0x0c1814, density: 0.01, map: '#34403c', sight: 0.85, use: 'city' },
  shroomtown: { name: '🍄 Mushroom Village', color: '#d8a0ff', ground: [44, 30, 50], fog: 0x140a1e, density: 0.0095, map: '#34243c', sight: 0.85, use: 'alienwoods' },
  westtown: { name: '🤠 Ghost Town', color: '#ffd27a', ground: [120, 92, 60], fog: 0x241608, density: 0.0085, map: '#7a5e3c', sight: 1, use: 'bazaar' },
  skycity: { name: '☁️ Cloud City', color: '#d8f0ff', ground: [190, 200, 220], fog: 0x24304a, density: 0.0065, map: '#8a98b0', sight: 1.1, use: 'base' },
  mall: { name: '🛍 The Mall', color: '#ffb0e8', ground: [90, 80, 96], fog: 0x1a1020, density: 0.0075, map: '#4a3e54', sight: 1, use: 'toytown' },
  hive: { name: '🐜 The Ant Hive', color: '#c8ff7a', ground: [70, 52, 30], fog: 0x140e04, density: 0.011, map: '#4a3a20', sight: 0.6, use: 'canyon' },
  steamtown: { name: '⚙️ Brass Town', color: '#ffc87a', ground: [60, 48, 34], fog: 0x1e1208, density: 0.009, map: '#40301e', sight: 0.95, use: 'city' },
  minecamp: { name: "⛏ Miners' Camp", color: '#ffe07a', ground: [50, 42, 34], fog: 0x0c0806, density: 0.012, map: '#342a20', sight: 0.75, use: 'camp' },
  shadowcity: { name: '🌑 Shadow City', color: '#c08aff', ground: [16, 12, 22], fog: 0x040208, density: 0.014, map: '#140c1c', sight: 0.6, use: 'city' },
  rainbowtown: { name: '🌈 Rainbow Town', color: '#ffb0f0', ground: [130, 90, 140], fog: 0x2a1030, density: 0.0075, map: '#6a4a74', sight: 1, use: 'candytown' },
});

Object.assign(ZONES, { // Levels 27-38: every area here has its own builder
  school: { name: '🏫 Nightmare School', color: '#ffd23a', ground: [60, 56, 50], fog: 0x14120c, density: 0.008, map: '#3a362e', sight: 0.95 },
  playground: { name: '🛝 The Playground', color: '#ff8a5a', ground: [96, 74, 50], fog: 0x1a1008, density: 0.009, map: '#5a4630', sight: 0.85 },
  sportsfield: { name: '🏈 The Sports Field', color: '#7aff8a', ground: [34, 74, 34], fog: 0x0a1a0a, density: 0.0075, map: '#224a22', sight: 1.15 },
  kitchen: { name: '🍳 The Countertop', color: '#ffb08a', ground: [150, 140, 130], fog: 0x241a14, density: 0.0075, map: '#8a8278', sight: 1 },
  pantry: { name: '🥫 The Pantry', color: '#ffd27a', ground: [110, 80, 50], fog: 0x1e140a, density: 0.0095, map: '#6a4a2e', sight: 0.65 },
  sinkland: { name: '🧽 The Sink (soapy water slows you)', color: '#9ae8ff', ground: [140, 150, 160], fog: 0x1a2430, density: 0.009, map: '#8a96a0', sight: 1 },
  opera: { name: '🎻 The Opera House', color: '#ff6a8a', ground: [60, 20, 28], fog: 0x1a060c, density: 0.008, map: '#3a1218', sight: 0.95 },
  backstage: { name: '🎭 Backstage', color: '#d8a070', ground: [44, 34, 30], fog: 0x120c0a, density: 0.011, map: '#2c221e', sight: 0.55 },
  ballroom: { name: '💃 The Ballroom', color: '#ffe0a0', ground: [70, 60, 50], fog: 0x18120c, density: 0.008, map: '#463c32', sight: 1 },
  dragonkeep: { name: "🏰 The Dragon's Keep", color: '#ff8a5a', ground: [50, 40, 38], fog: 0x1e0a06, density: 0.0085, map: '#322826', sight: 0.9 },
  goldhoard: { name: "💰 The Dragon's Hoard", color: '#ffd23a', ground: [90, 70, 30], fog: 0x221808, density: 0.008, map: '#5a461e', sight: 0.9 },
  crags: { name: '⛰ The Crags', color: '#c8b0a0', ground: [70, 62, 58], fog: 0x141010, density: 0.01, map: '#463e3a', sight: 0.6 },
  shrine: { name: '⛩ The Shrine', color: '#ff7a9a', ground: [70, 54, 50], fog: 0x140a10, density: 0.0085, map: '#46363a', sight: 0.95 },
  blossoms: { name: '🌸 Blossom Grove', color: '#ffb0d0', ground: [96, 70, 84], fog: 0x1e0c18, density: 0.0095, map: '#604656', sight: 0.75 },
  bamboo: { name: '🎋 Bamboo Forest', color: '#8aff8a', ground: [40, 60, 30], fog: 0x08140a, density: 0.013, map: '#283e1e', sight: 0.4 },
  rooftops: { name: '🏙 The Rooftops', color: '#ffc87a', ground: [64, 64, 70], fog: 0x0e1018, density: 0.007, map: '#404046', sight: 1 },
  construction: { name: '🚧 Construction Site', color: '#ffa21a', ground: [80, 72, 60], fog: 0x18140c, density: 0.009, map: '#504838', sight: 0.8 },
  billboards: { name: '📺 Billboard Alley', color: '#ff6ae8', ground: [44, 40, 54], fog: 0x120a1a, density: 0.0085, map: '#2c2836', sight: 0.85 },
  aquarium: { name: '🐠 The Aquarium', color: '#6ae8ff', ground: [40, 60, 80], fog: 0x061424, density: 0.0085, map: '#283c50', sight: 0.9 },
  tanks: { name: '🫙 The Big Tanks', color: '#3affd0', ground: [30, 50, 64], fog: 0x041220, density: 0.0095, map: '#1e3240', sight: 0.7 },
  touchpools: { name: '⭐ Touch Pools (water slows you)', color: '#ffb07a', ground: [70, 70, 64], fog: 0x0a1820, density: 0.009, map: '#464640', sight: 1 },
  lab: { name: '🧪 The Lab', color: '#8aff3a', ground: [56, 60, 58], fog: 0x081008, density: 0.0085, map: '#383c3a', sight: 0.9 },
  vats: { name: '🧫 The Vat Room', color: '#c8ff3a', ground: [40, 48, 36], fog: 0x0c1806, density: 0.01, map: '#283022', sight: 0.75 },
  teslafield: { name: '⚡ Tesla Field', color: '#8ae8ff', ground: [34, 36, 48], fog: 0x0a0e1e, density: 0.008, map: '#22242e', sight: 1 },
  greenhouse: { name: '🌺 The Greenhouses', color: '#ff7ab0', ground: [50, 70, 40], fog: 0x0c160a, density: 0.009, map: '#324628', sight: 0.85 },
  flytraps: { name: '🪴 Flytrap Beds', color: '#9aff5a', ground: [40, 56, 26], fog: 0x0a1406, density: 0.0105, map: '#283818', sight: 0.65 },
  thorns: { name: '🌹 The Bramble Maze', color: '#ff4a6a', ground: [40, 30, 26], fog: 0x140808, density: 0.012, map: '#281e18', sight: 0.5 },
  boardwalk: { name: '🎢 The Boardwalk', color: '#ffd23a', ground: [90, 66, 42], fog: 0x0c1222, density: 0.0075, map: '#5a422a', sight: 1 },
  tidepools: { name: '🦀 Tide Pools (water slows you)', color: '#7ad8ff', ground: [70, 70, 60], fog: 0x0a1624, density: 0.009, map: '#46463c', sight: 1 },
  sandcastles: { name: '🏰 Sandcastle Beach', color: '#ffe0a0', ground: [150, 130, 90], fog: 0x101824, density: 0.008, map: '#8a7a54', sight: 0.8 },
  museum: { name: '🏛 The Museum', color: '#f0e0c0', ground: [96, 90, 80], fog: 0x12100c, density: 0.008, map: '#605a50', sight: 0.95 },
  statuegarden: { name: '🗽 The Statue Garden', color: '#d8f0ff', ground: [50, 64, 44], fog: 0x0c120a, density: 0.0095, map: '#32402c', sight: 0.7 },
  fossilhall: { name: '🦴 The Fossil Hall', color: '#e8d8b0', ground: [80, 70, 56], fog: 0x14100a, density: 0.009, map: '#504636', sight: 0.85 },
  sewers: { name: '🕳 The Sewers', color: '#8aff2a', ground: [44, 42, 34], fog: 0x060a04, density: 0.012, map: '#2c2a22', sight: 0.7 },
  sludge: { name: '☣️ Sludge Rivers (sludge burns your stamina!)', color: '#aaff3a', ground: [34, 40, 24], fog: 0x0a1404, density: 0.011, map: '#222816', sight: 0.85 },
  pipeworks: { name: '🔧 The Pipeworks', color: '#d8a070', ground: [46, 40, 36], fog: 0x0c0a08, density: 0.011, map: '#2e2824', sight: 0.6 },
});

Object.assign(ZONES, { // Levels 39-49 and THE FINAL NIGHTMARE
  station: { name: '🚀 Station Decks', color: '#9ae8ff', ground: [56, 60, 70], fog: 0x04060e, density: 0.006, map: '#383c46', sight: 1 },
  hangar: { name: '🛸 The Hangar', color: '#d8e0f0', ground: [44, 46, 54], fog: 0x05060c, density: 0.007, map: '#2c2e36', sight: 1.1 },
  reactor: { name: '☢️ The Reactor (plasma burns your stamina!)', color: '#5affff', ground: [24, 34, 44], fog: 0x04101c, density: 0.009, map: '#18222c', sight: 0.85 },
  storytown: { name: '📚 Storybook Town', color: '#ffd27a', ground: [70, 60, 44], fog: 0x140e06, density: 0.0085, map: '#463c2c', sight: 0.9 },
  pages: { name: '📄 Fields of Pages', color: '#f0ecd8', ground: [120, 114, 96], fog: 0x18160e, density: 0.008, map: '#78725e', sight: 1 },
  fairyring: { name: '🧚 Fairy Rings', color: '#c8ff9a', ground: [34, 56, 30], fog: 0x08140a, density: 0.011, map: '#22381e', sight: 0.6 },
  depot: { name: '🚉 The Station', color: '#ffd27a', ground: [54, 50, 46], fog: 0x0c0a08, density: 0.009, map: '#36322e', sight: 0.95 },
  railyard: { name: '🛤 The Railyard', color: '#d8c8a8', ground: [60, 52, 44], fog: 0x0e0c0a, density: 0.0085, map: '#3c342c', sight: 1.05 },
  coalyard: { name: '⛰ Coal Heaps', color: '#ff8a3a', ground: [30, 28, 26], fog: 0x0e0806, density: 0.011, map: '#1e1c1a', sight: 0.6 },
  arcade: { name: '🕹 The Arcade', color: '#ff7ae8', ground: [30, 20, 50], fog: 0x0c0418, density: 0.0075, map: '#1e1432', sight: 0.9 },
  pinball: { name: '🎯 Giant Pinball', color: '#3affff', ground: [20, 30, 60], fog: 0x040a1c, density: 0.008, map: '#141e3c', sight: 1 },
  slots: { name: '🎰 Slot Machine Alley', color: '#ffd23a', ground: [60, 20, 24], fog: 0x18040a, density: 0.0085, map: '#3c1418', sight: 0.85 },
  backlot: { name: '🎬 The Backlot', color: '#ffe8a0', ground: [70, 66, 60], fog: 0x0e0c0a, density: 0.008, map: '#46423c', sight: 0.95 },
  soundstage: { name: '🟩 Green Screen Stages', color: '#5aff8a', ground: [40, 60, 40], fog: 0x061008, density: 0.008, map: '#283c28', sight: 0.75 },
  filmvault: { name: '🎞 The Film Vault', color: '#d8b07a', ground: [40, 34, 30], fog: 0x0c0806, density: 0.011, map: '#28221e', sight: 0.6 },
  bayou: { name: '🛖 Bayou Town', color: '#c8ff9a', ground: [40, 46, 30], fog: 0x0a1206, density: 0.011, map: '#282e1e', sight: 0.75 },
  cypress: { name: '🌳 Cypress Swamp', color: '#9ad87a', ground: [30, 40, 26], fog: 0x081006, density: 0.0135, map: '#1e2818', sight: 0.45 },
  bog: { name: '🪷 The Bog (water slows you)', color: '#7affd0', ground: [30, 50, 40], fog: 0x061410, density: 0.011, map: '#1e3228', sight: 0.85 },
  colosseum: { name: '🏟 The Colosseum', color: '#ffc87a', ground: [130, 104, 70], fog: 0x1e1208, density: 0.0075, map: '#826846', sight: 1 },
  arenasand: { name: '⚔️ Arena Sands', color: '#ffe0a0', ground: [150, 120, 80], fog: 0x201408, density: 0.0075, map: '#967850', sight: 1.15 },
  catacombs: { name: '💀 The Catacombs', color: '#e8d8c0', ground: [50, 44, 40], fog: 0x0c0a08, density: 0.0125, map: '#322c28', sight: 0.5 },
  doodletown: { name: '✏️ Doodle Town', color: '#3a8aff', ground: [200, 200, 210], fog: 0x1a1a24, density: 0.006, map: '#c8c8d2', sight: 1 },
  crayons: { name: '🖍 Crayon Forest', color: '#ff6a3a', ground: [190, 186, 170], fog: 0x1a1812, density: 0.008, map: '#bebaaa', sight: 0.75 },
  paintsplash: { name: '🎨 Paint Puddles (sticky!)', color: '#ff3ad8', ground: [180, 180, 196], fog: 0x18181e, density: 0.007, map: '#b4b4c4', sight: 1 },
  cruise: { name: '🚢 The Main Deck', color: '#e8f4ff', ground: [120, 100, 76], fog: 0x081220, density: 0.008, map: '#78644c', sight: 0.95 },
  pooldeck: { name: '🏊 Pool Deck (water slows you)', color: '#6ae8ff', ground: [150, 150, 150], fog: 0x0a1420, density: 0.0075, map: '#969696', sight: 1 },
  engineroom: { name: '⚙️ The Engine Room', color: '#ffa23a', ground: [44, 40, 38], fog: 0x0e0806, density: 0.011, map: '#2c2826', sight: 0.65 },
  nest: { name: '🕸 The Nest', color: '#d8a0ff', ground: [34, 28, 34], fog: 0x0a060c, density: 0.012, map: '#221c22', sight: 0.6 },
  webwoods: { name: '🕸 Webbed Woods', color: '#e8e8f0', ground: [30, 30, 34], fog: 0x0c0c10, density: 0.0135, map: '#1e1e22', sight: 0.45 },
  eggcave: { name: '🥚 Egg Chambers', color: '#c8ff6a', ground: [36, 30, 28], fog: 0x0a0806, density: 0.0125, map: '#241e1c', sight: 0.55 },
  mirrortown: { name: '🪞 Mirror Town', color: '#ffc8f8', ground: [70, 66, 86], fog: 0x100c18, density: 0.007, map: '#464256', sight: 1 },
  mirrormaze: { name: '🔷 The Mirror Maze', color: '#c8e8ff', ground: [56, 56, 70], fog: 0x0c0c16, density: 0.009, map: '#383846', sight: 0.55 },
  kaleido: { name: '🌈 Kaleidoscope Fields', color: '#ff9ae8', ground: [60, 40, 70], fog: 0x120818, density: 0.0085, map: '#3c2846', sight: 0.95 },
  throne: { name: '👑 THE NIGHTMARE THRONE', color: '#ff3a5a', ground: [30, 14, 20], fog: 0x14020a, density: 0.0075, map: '#1e0e14', sight: 1 },
  voidrift: { name: '🌌 The Void Rift', color: '#c87aff', ground: [20, 12, 34], fog: 0x0a0416, density: 0.009, map: '#140c22', sight: 0.8 },
  bonefield: { name: '🦴 Field of Titan Bones', color: '#f0e0c8', ground: [70, 60, 50], fog: 0x140c08, density: 0.009, map: '#463c32', sight: 0.85 },
  stormspire: { name: '⚡ The Storm Spires', color: '#9ae8ff', ground: [34, 34, 46], fog: 0x0a0a18, density: 0.008, map: '#22222e', sight: 1 },
});

KIT.forEach((K, k) => { // ground and fog colors come from the level's own tint
  const id = 'kit' + k, t = new THREE.Color(K.tint), tc = [t.r * 255, t.g * 255, t.b * 255];
  const zone = (spec, part, base, f, density, sight) => {
    const g = base.map((v, i) => Math.round(lerp(v, tc[i], f))), props = part === 'town' ? spec[5] : spec[1];
    const note = props.includes('pool:water') ? ' (water slows you)' : props.includes('pool:lava') ? ' (it burns your stamina!)' : props.includes('pool:choco') ? ' (sticky!)' : '';
    return { name: spec[0] + note, color: K.c, ground: g, fog: t.clone().multiplyScalar(0.1).getHex(), density, map: `rgb(${g.map((v) => Math.round(v * 0.8)).join(',')})`, sight, kit: [part, k] };
  };
  ZONES[id + 't'] = zone(K.town, 'town', [52, 50, 56], 0.2, 0.008, 0.95);
  ZONES[id + 'a'] = zone(K.a, 'a', [40, 42, 36], 0.3, 0.0095, 0.75);
  ZONES[id + 'b'] = zone(K.b, 'b', [36, 34, 44], 0.4, 0.009, 0.85);
});

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
    if (L.layout) z = L.layout[4 - Math.floor(j / 4)][4 - Math.floor(i / 4)]; // a map painted in the Map Maker (north at the top, like the minimap)
    else if ((i >= a && i <= b) || ((i === mid - 1 || i === mid) && Math.abs(j - mid + 0.5) < 3)) z = L.center;
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
      let [r, gg, b] = ZONES[W.zones[j * N + i]].ground;
      if (L.tint) { const t = new THREE.Color(L.tint[0]), k = L.tint[1] * 0.7; r = lerp(r, t.r * 255, k); gg = lerp(gg, t.g * 255, k); b = lerp(b, t.b * 255, k); }
      g.fillStyle = `rgb(${r | 0},${gg | 0},${b | 0})`;
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
    tar: std(0x0a0806, { roughness: 0.05, metalness: 0.5 }), laserFloor: neon(0xff2a4a, 1.6),
    neonWire: Object.assign(neon(0xffffff, 2.2), { wireframe: true }),
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
      if (['kelp', 'alien', 'candy', 'jungle', 'fern', 'neon'].includes(style)) fancyTree(x, z, style);
      else if (style === 'dead' || style === 'ash' || rng.next() < 0.12) deadTree(x, z, style === 'ash'); else tree(x, z, style === 'snow');
    }
    if (!edge && !clearing && rng.next() < 0.4) {
      const a = rng.next() * Math.PI * 2;
      const x = cc.x + Math.cos(a) * 4, z = cc.z + Math.sin(a) * 4;
      if (placed.every((p) => Math.hypot(p[0] - x, p[1] - z) > 6)) bush(x, z, i + j * 7, style === 'snow' ? SNOWBUSH() : style === 'dead' ? new THREE.Color(0x3a1a1a) : style === 'ash' ? new THREE.Color(0x4a4642) : style === 'kelp' ? new THREE.Color(0x1a4a3a) : style === 'alien' ? new THREE.Color(0x5a2a8a) : style === 'candy' ? new THREE.Color(0xff9ad0) : style === 'jungle' ? new THREE.Color(0x1a5a1a) : style === 'fern' ? new THREE.Color(0x2a5a1a) : style === 'neon' ? new THREE.Color(0x3a1a5a) : null);
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
    const tar = style === 'tar', laser = style === 'laser', wet = style === 'water' || tar, choc = style === 'choco' || wet;
    if (!edge && rng.next() < 0.6) { // a river of lava: walkable, but it burns
      const alongX = rng.next() < 0.5, off = rng.pick([-1, 1]) * 7, w = alongX ? C : 5, d = alongX ? 5 : C;
      const x = cc.x + (alongX ? 0 : off), z = cc.z + (alongX ? off : 0);
      box(w, 0.12, d, tar ? MAT.tar : wet ? MAT.water : laser ? MAT.laserFloor : choc ? MAT.choco : MAT.lava, x, 0.06, z, false);
      if (!choc) glowDecal(x, z, 9, laser ? 0xff2a4a : 0xff4a0a, 0.4);
      W.hazards.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, kind: wet ? 'water' : choc ? 'choco' : 'lava' });
      W.mapRects.push({ x, z, w, d, color: tar ? '#111' : wet ? '#2a7aa0' : laser ? '#ff2a4a' : choc ? '#5a2e18' : '#ff4a0a' });
    }
    const n = edge ? 0 : rng.int(1, 3);
    for (let k = 0; k < n; k++) { // obsidian spires
      const a = rng.next() * 6.3, rr = rng.range(6.5, 10), x = cc.x + Math.cos(a) * rr, z = cc.z + Math.sin(a) * rr, h = rng.range(9, 20), r0 = rng.range(1.5, 2.5);
      if (wet) rock(x, z, r0);
      else if (laser) { inst('pylon', GEO.box, MAT.metal, x, h * 0.3, z, { sx: 1.4, sy: h * 0.6, sz: 1.4, color: 0x3a3a4a }); inst('pylonTop', GEO.sphere, MAT.laserFloor, x, h * 0.6 + 0.6, z, { s: 0.7, cast: false }); }
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
    const mcols = style === 'trench' ? [0x1a2a3a, 0x22324a, 0x2a3a50] : style === 'moss' ? [0x3a4a2a, 0x4a5a3a, 0x2a3a22, 0x55604a] : style === 'cave' ? [0x3a3028, 0x2e2620, 0x4a3e32] : mesaCols;
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
    } else if (style === 'fern') { // giant prehistoric fern
      h = rng.range(5, 9);
      inst('fernTrunk', GEO.trunk, MAT.bark, x, h / 2, z, { sx: 0.8, sy: h, sz: 0.8, color: 0x5a4a2a });
      for (let k = 0; k < 9; k++) { const a = (k / 9) * 6.3 + rng.next() * 0.3, len = rng.range(6, 9); inst('frondF', GEO.box, MAT.pine, x + Math.cos(a) * len * 0.42, h + 0.4, z + Math.sin(a) * len * 0.42, { sx: len, sy: 0.15, sz: 1.6, ry: -a, rz: -0.35, color: rng.pick([0x2a6a1a, 0x3a7a22, 0x22581a]) }); }
      W.mapRects.push({ x, z, w: 9, d: 9, color: '#1a3a14', round: true });
    } else if (style === 'neon') { // glowing wireframe tree
      h = rng.range(10, 16);
      const col = rng.pick([0xff2ad8, 0x2ad8ff, 0x5aff8a, 0xb44aff]);
      inst('neonTrunk', GEO.cyl, MAT.metal, x, h / 2, z, { sx: 0.35, sy: h, sz: 0.35, color: 0x3a3a4a });
      inst('neonCone', GEO.cone, MAT.neonWire, x, h * 0.65, z, { sx: 4.5, sy: h * 0.7, sz: 4.5, ry: rng.next() * 6, color: col, cast: false });
      glowDecal(x, z, 5, col, 0.25);
      W.mapRects.push({ x, z, w: 6, d: 6, color: hex6(col), round: true });
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

  // ===== Level 12: Dino Valley =====
  const nest = (x, z) => {
    for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; inst('stick', GEO.cyl, MAT.bark, x + Math.cos(a) * 2.2, 0.4, z + Math.sin(a) * 2.2, { sx: 0.18, sy: 3, sz: 0.18, rz: Math.PI / 2, ry: -a + 1.2, cast: false }); }
    for (let k = 0; k < 3; k++) inst('egg', GEO.sphere, MAT.boneM, x + (k - 1) * 0.9, 0.7, z + (k % 2) * 0.6, { sx: 0.55, sy: 0.75, sz: 0.55, color: rng.pick([0xe8f0d8, 0xd8e8b0, 0xe0d0c0]) });
    glowDecal(x, z, 3, 0xffe8a0, 0.25);
  };
  const dinoplainsCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.25) { boneyardCell(cc, i, j, edge); return; }
    if (r < 0.4) nest(cc.x + rng.pick([-1, 1]) * 7, cc.z + rng.pick([-1, 1]) * 7);
    else if (r < 0.55) for (let k = 0; k < rng.int(1, 3); k++) { const a = rng.next() * 6.3; rock(cc.x + Math.cos(a) * 8.5, cc.z + Math.sin(a) * 8.5, rng.range(1.5, 2.6)); }
    else if (r < 0.66) { for (let k = 0; k < rng.int(2, 3); k++) { const a = rng.next() * 6.3, rr = rng.range(3, 7); bush(cc.x + Math.cos(a) * rr, cc.z + Math.sin(a) * rr, i + j + k, new THREE.Color(0x3a6a22)); } W.patrol.push(cc); return; }
    else if (r < 0.71) { speedPad(cc); W.patrol.push(cc); return; }
    if (!edge) keyCandidates.push(cc);
    W.patrol.push(cc);
  };

  // ===== Level 13: Pirate Cove =====
  const tavern = (cc) => {
    const w = rng.int(12, 15), d = rng.int(10, 13), h = rng.int(8, 11);
    box(w, h, d, std(rng.pick([0x5a3a22, 0x4a3020, 0x6a4628]), { roughness: 1 }), cc.x, h / 2, cc.z);
    for (const sd of [-1, 1]) { const p = box(w + 1.5, 0.6, d / 2 + 1.6, std(0x2a1a14), cc.x, h + 2, cc.z + sd * (d / 4 + 0.3)); p.rotation.x = sd * 0.5; }
    for (const sx of [-1, 1]) box(2, 1.6, 0.2, neon(0xffb050, 1.6), cc.x + sx * w / 4, h * 0.55, cc.z - d / 2 - 0.1, false);
    box(2.4, 4.4, 0.2, new THREE.MeshBasicMaterial({ color: 0x0a0604 }), cc.x, 2.2, cc.z - d / 2 - 0.1, false);
    box(3.6, 1.4, 0.2, std(0x8a5a2a), cc.x, h * 0.8, cc.z - d / 2 - 0.4, false); // sign
    solid(cc.x, cc.z, w, d, h);
    W.mapRects.push({ x: cc.x, z: cc.z, w, d, color: '#6a4628' });
  };
  const piratetownCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.32) { tavern(cc); return; }
    if (r < 0.45) {
      for (let k = 0; k < rng.int(2, 4); k++) barrel(cc.x + rng.pick([-1, 1]) * rng.range(6, 9), cc.z + rng.pick([-1, 1]) * rng.range(6, 9));
      for (let k = 0; k < 2; k++) { const x = cc.x + rng.pick([-1, 1]) * 8, z = cc.z + rng.range(-3, 3); inst('crateP', GEO.box, MAT.metal, x, 1.5, z, { s: 3, ry: rng.next(), color: 0x8a6a3a }); solid(x, z, 3.4, 3.4, 3); }
      keyCandidates.push(cc); W.patrol.push(cc); return;
    }
    if (r < 0.56) { palm(cc.x + 7, cc.z - 7); bush(cc.x - 4, cc.z + 5, i + j, new THREE.Color(0x2a5a22)); W.patrol.push(cc); return; }
    if (r < 0.61) { speedPad(cc); W.patrol.push(cc); return; }
    if (rng.next() < 0.5) lamp(cc.x + C / 2 - 4, cc.z + C / 2 - 4, sodiumMat, 0xffa040);
    if (!edge) keyCandidates.push(cc);
    W.patrol.push(cc);
  };
  const beachCell = (cc, i, j, edge) => {
    for (let k = 0; k < rng.int(1, 2); k++) { const a = rng.next() * 6.3, rr = rng.range(4, 9); inst('dune', GEO.sphere, MAT.sand, cc.x + Math.cos(a) * rr, -0.4, cc.z + Math.sin(a) * rr, { sx: rng.range(5, 8), sy: 1.3, sz: rng.range(4, 6), ry: rng.next() * 6, cast: false }); }
    if (!edge && rng.next() < 0.55) palm(cc.x + rng.pick([-1, 1]) * 8, cc.z + rng.pick([-1, 1]) * 8);
    if (!edge && rng.next() < 0.3) { // a beached rowboat
      const x = cc.x - 6, z = cc.z + 6;
      inst('rowboat', GEO.box, MAT.metal, x, 0.7, z, { sx: 2.6, sy: 1.2, sz: 6, ry: rng.next(), rz: 0.2, color: 0x6a4a2a });
      solid(x, z, 4, 4, 1.4);
    }
    for (let k = 0; k < 4; k++) inst('shell', GEO.sphere, MAT.boneM, cc.x + rng.range(-10, 10), 0.1, cc.z + rng.range(-10, 10), { sx: 0.35, sy: 0.15, sz: 0.3, color: rng.pick([0xffd0c0, 0xf0e0ff, 0xfff0d0]), cast: false });
    if (!edge) keyCandidates.push(cc);
    W.patrol.push(cc);
  };
  const pirateShip = (cc) => {
    const alongX = rng.next() < 0.5, Lh = 20, Wd = 6.5, h = 6, sd = rng.pick([-1, 1]);
    const x = cc.x + (alongX ? 0 : sd * 6.5), z = cc.z + (alongX ? sd * 6.5 : 0);
    const hull = std(0x4a2e1a, { roughness: 1 });
    box(alongX ? Lh : Wd, h, alongX ? Wd : Lh, hull, x, h / 2, z);
    for (const s of [-0.3, 0.25]) {
      const mx = x + (alongX ? s * Lh : 0), mz = z + (alongX ? 0 : s * Lh);
      box(0.6, 18, 0.6, std(0x3a2414), mx, h + 9, mz);
      const sail = box(alongX ? 0.15 : 7, 7, alongX ? 7 : 0.15, std(0xe8e0c8, { side: THREE.DoubleSide, roughness: 1 }), mx, h + 10, mz, false);
      sail.rotation.y = 0.1;
    }
    box(alongX ? 0.1 : 2.4, 1.6, alongX ? 2.4 : 0.1, new THREE.MeshBasicMaterial({ color: 0x050505, side: THREE.DoubleSide }), x, h + 18.6, z, false); // jolly roger
    for (let k = -2; k <= 2; k++) box(0.8, 0.8, 0.8, neon(0xffb050, 1.4), x + (alongX ? k * 3.5 : -sd * 3.3), h - 2, z + (alongX ? -sd * 3.3 : k * 3.5), false);
    solid(x, z, alongX ? Lh : Wd, alongX ? Wd : Lh, h);
    W.mapRects.push({ x, z, w: alongX ? Lh : Wd, d: alongX ? Wd : Lh, color: '#5a3a22' });
  };
  const shipyardCell = (cc, i, j, edge) => {
    if (!edge && rng.next() < 0.4) pirateShip(cc);
    else if (!edge) { // a wooden dock
      for (let k = -2; k <= 2; k++) inst('plank', GEO.box, MAT.bark, cc.x + k * 2.2, 0.15, cc.z + 7, { sx: 2, sy: 0.3, sz: 8, color: 0x6a4a2a, cast: false });
      for (const px of [-5, 5]) { inst('post', GEO.cyl, MAT.bark, cc.x + px, 1.2, cc.z + 11, { sx: 0.4, sy: 2.4, sz: 0.4 }); solid(cc.x + px, cc.z + 11, 0.9, 0.9, 2.4); }
      if (rng.next() < 0.5) barrel(cc.x - 7, cc.z - 6);
    }
    if (!edge) keyCandidates.push(cc);
    W.patrol.push(cc);
  };

  // ===== Level 14: Cyber City 2099 =====
  const hologram = (x, z) => {
    const col = rng.pick([0x2ad8ff, 0xff2ad8, 0x5aff8a, 0xffe03a]);
    const holo = new THREE.Group(); holo.position.set(x, 14 + rng.range(0, 8), z); group.add(holo);
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(2.2), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(1.8), wireframe: true, transparent: true, opacity: 0.8 }));
    holo.add(m);
    W.spinners.push({ obj: holo, axis: 'y', speed: 0.8 });
    glowDecal(x, z, 5, col, 0.2);
  };
  const cybercityCell = (cc, i, j, edge) => {
    cityCell(cc, i, j, edge);
    if (!edge && rng.next() < 0.25) hologram(cc.x + C / 2 - 3, cc.z - C / 2 + 3);
  };
  const serversCell = (cc, i, j, edge) => {
    for (const oz of [-7, 7]) {
      if (edge || rng.next() < 0.2) continue;
      for (let k = -2; k <= 2; k++) {
        const x = cc.x + k * 4.2, z = cc.z + oz;
        if (Math.abs(k) === 2 && rng.next() < 0.5) continue;
        inst('rack', GEO.box, MAT.metal, x, 4, z, { sx: 3.6, sy: 8, sz: 2.4, color: 0x2a2e38 });
        for (let l = 0; l < 4; l++) inst('led', GEO.box, MAT.bulb, x + rng.range(-1.2, 1.2), 1.5 + l * 1.7, z - 1.25, { sx: 0.6, sy: 0.12, sz: 0.05, color: rng.pick([0x3aff6a, 0x2ad8ff, 0xffb03a]), cast: false });
        solid(x, z, 3.6, 2.4, 8);
        W.mapRects.push({ x, z, w: 3.6, d: 2.4, color: '#3a4a4a' });
      }
    }
    if (!edge) keyCandidates.push(cc);
    W.patrol.push(cc);
  };

  // ===== Levels 15-26: every level gets its own town in the middle =====
  const openSpot = (cc, edge) => { if (!edge) keyCandidates.push(cc); W.patrol.push(cc); };
  const bushRing = (cc, i, j, col) => { for (let k = 0; k < rng.int(2, 3); k++) { const a = rng.next() * 6.3, rr = rng.range(3, 7); bush(cc.x + Math.cos(a) * rr, cc.z + Math.sin(a) * rr, i * 3.1 + j + k, new THREE.Color(typeof col === 'function' ? col() : col)); } W.patrol.push(cc); };
  const house = (cc, o) => { // a building with its own wall + roof style
    const w = o.w ?? rng.int(11, 14), d = o.d ?? rng.int(10, 13), h = o.h ?? rng.int(7, 10);
    box(w, h, d, o.wall, cc.x, h / 2, cc.z);
    if (o.roof === 'cone') meshAt(new THREE.ConeGeometry(Math.max(w, d) * 0.72, o.roofH ?? 7, o.sides ?? 4), o.roofMat, cc.x, h + (o.roofH ?? 7) / 2, cc.z).rotation.y = Math.PI / 4;
    else if (o.roof === 'dome') meshAt(new THREE.SphereGeometry(Math.min(w, d) * 0.55, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), o.roofMat, cc.x, h, cc.z);
    else if (o.roof === 'flat') box(w + 1, 0.8, d + 1, o.roofMat, cc.x, h + 0.4, cc.z);
    else for (const sd of [-1, 1]) { const p = box(w + 1.5, 0.6, d / 2 + 1.6, o.roofMat, cc.x, h + 2, cc.z + sd * (d / 4 + 0.3)); p.rotation.x = sd * 0.5; }
    if (o.win) for (let k = 0; k < (o.winN ?? 3); k++) for (let fl = 0; fl < Math.max(1, Math.floor(h / 6)); fl++) box(1.8, 2, 0.2, o.win, cc.x - w / 2 + (k + 0.5) * (w / (o.winN ?? 3)), 3 + fl * 5, cc.z - d / 2 - 0.1, false);
    if (o.door) box(2.4, 4, 0.2, o.door, cc.x, 2, cc.z - d / 2 - 0.12, false);
    solid(cc.x, cc.z, w, d, h);
    W.mapRects.push({ x: cc.x, z: cc.z, w, d, color: o.map || '#555' });
    return { w, d, h };
  };

  // --- Volcano Island: lava-lit stone huts, lava fountains, tiki torches
  const volcRock = std(0x2a201c, { roughness: 1, flatShading: true }), thatch = std(0x5a3a1a, { roughness: 1, flatShading: true });
  const tikiTorch = (x, z) => { inst('torchPole', GEO.cyl, MAT.bark, x, 3, z, { sx: 0.25, sy: 6, sz: 0.25 }); fire(x, z, 6.2, 0.6); solid(x, z, 0.8, 0.8, 6); };
  const volcanotownCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.3) { house(cc, { wall: volcRock, roof: 'cone', roofMat: thatch, sides: 8, h: rng.int(6, 8), win: neon(0xff6a1a, 1.8), winN: 2, door: neon(0xff4a0a, 1.4), map: '#3a2018' }); return; }
    if (r < 0.42) { // lava fountain: a ring of stone with a glowing pool
      const R = 5.5;
      for (let k = 0; k < 10; k++) { const a = (k / 10) * 6.28; inst('fountainRock', GEO.box, volcRock, cc.x + Math.cos(a) * R, 0.8, cc.z + Math.sin(a) * R, { sx: 3.4, sy: 1.6, sz: 1.4, ry: -a + Math.PI / 2 }); }
      const pool = meshAt(new THREE.CylinderGeometry(R - 0.6, R - 0.6, 0.3, 24), MAT.lava, cc.x, 0.6, cc.z); pool.castShadow = false;
      inst('lavaSpout', GEO.cone6, MAT.lava, cc.x, 3.5, cc.z, { sx: 1.2, sy: 6, sz: 1.2, cast: false });
      glowDecal(cc.x, cc.z, 14, 0xff4a0a, 0.5);
      solid(cc.x, cc.z, R * 2, R * 2, 1.6);
      W.mapRects.push({ x: cc.x, z: cc.z, w: R * 2, d: R * 2, color: '#ff4a0a', round: true });
      W.patrol.push(cc); return;
    }
    if (r < 0.54) { bushRing(cc, i, j, () => rng.pick([0x2a4a1a, 0x1a3a12])); return; }
    if (r < 0.6) { speedPad(cc); W.patrol.push(cc); return; }
    if (!edge) { tikiTorch(cc.x + 8, cc.z + 8); tikiTorch(cc.x - 8, cc.z - 8); if (rng.next() < 0.5) palm(cc.x + rng.pick([-1, 1]) * 8, cc.z - 8); }
    openSpot(cc, edge);
  };

  // --- Frozen Castle: ice towers, battlements, frozen fountains
  const iceMat = std(0xc8ecff, { roughness: 0.08, metalness: 0.1, emissive: 0x2a6aa0, emissiveIntensity: 0.35, transparent: true, opacity: 0.88 });
  const iceStone = std(0x9ab8d0, { roughness: 0.5, flatShading: true });
  const iceTower = (x, z, R, h) => {
    meshAt(new THREE.CylinderGeometry(R, R * 1.1, h, 12), iceStone, x, h / 2, z);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * 6.28; box(1.2, 1.4, 1.2, iceStone, x + Math.cos(a) * R, h + 0.7, z + Math.sin(a) * R); }
    meshAt(new THREE.ConeGeometry(R * 1.15, h * 0.55, 12), iceMat, x, h + h * 0.275 + 1.2, z);
    for (let k = 0; k < 3; k++) box(1, 2, 0.2, neon(0x6ae0ff, 1.5), x + Math.sin(k * 2.1) * R, 4 + k * 4, z + Math.cos(k * 2.1) * R, false).rotation.y = k * 2.1;
    solid(x, z, R * 2, R * 2, h);
    W.mapRects.push({ x, z, w: R * 2, d: R * 2, color: '#9ab8d0', round: true });
  };
  const icecastleCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.22) { iceTower(cc.x, cc.z, rng.range(5, 7), rng.range(18, 30)); return; }
    if (r < 0.36) { // a stretch of castle wall with battlements
      const alongX = rng.next() < 0.5, len = C - 6, x = cc.x + (alongX ? 0 : rng.pick([-1, 1]) * 6), z = cc.z + (alongX ? rng.pick([-1, 1]) * 6 : 0);
      box(alongX ? len : 3, 9, alongX ? 3 : len, iceStone, x, 4.5, z);
      for (let k = 0; k < 6; k++) box(alongX ? 1.6 : 3.2, 1.6, alongX ? 3.2 : 1.6, iceStone, x + (alongX ? -len / 2 + 1 + k * (len - 2) / 5 : 0), 9.8, z + (alongX ? 0 : -len / 2 + 1 + k * (len - 2) / 5));
      solid(x, z, alongX ? len : 3, alongX ? 3 : len, 9);
      W.mapRects.push({ x, z, w: alongX ? len : 3, d: alongX ? 3 : len, color: '#9ab8d0' });
      openSpot(cc, edge); return;
    }
    if (r < 0.46) { // frozen fountain
      meshAt(new THREE.CylinderGeometry(5, 5.5, 1.4, 20), iceStone, cc.x, 0.7, cc.z);
      meshAt(new THREE.CylinderGeometry(4.4, 4.4, 0.2, 20), iceMat, cc.x, 1.45, cc.z);
      for (let k = 0; k < 6; k++) inst('icicleF', GEO.cone6, iceMat, cc.x + Math.cos(k) * 1.2, 3.5, cc.z + Math.sin(k) * 1.2, { sx: 0.6, sy: rng.range(3, 6), sz: 0.6, rz: Math.cos(k) * 0.3, rx: Math.sin(k) * 0.3 });
      glowDecal(cc.x, cc.z, 9, 0x6ae0ff, 0.35);
      solid(cc.x, cc.z, 10, 10, 2);
      W.mapRects.push({ x: cc.x, z: cc.z, w: 10, d: 10, color: '#c8ecff', round: true });
      W.patrol.push(cc); return;
    }
    if (r < 0.56) { bushRing(cc, i, j, SNOWBUSH); return; }
    if (r < 0.62) { speedPad(cc); W.patrol.push(cc); return; }
    if (!edge && rng.next() < 0.5) for (let k = 0; k < 3; k++) { const x = cc.x + rng.range(-9, 9), z = cc.z + rng.range(-9, 9); inst('iceSpike', GEO.cone6, iceMat, x, 2, z, { sx: 1, sy: rng.range(3, 6), sz: 1 }); solid(x, z, 1.6, 1.6, 4); }
    openSpot(cc, edge);
  };

  // --- Hollow Hospital: long wards with flickering green windows, ambulances, beds left outside
  const wardWall = std(0xc8ccc4, { roughness: 0.9 }), wardTrim = std(0x5a6a64);
  const hospitalCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.34) {
      const { w, d, h } = house(cc, { wall: wardWall, roof: 'flat', roofMat: wardTrim, w: C - 6, d: rng.int(9, 12), h: rng.int(12, 20), win: neon(rng.pick([0x5affb0, 0x2a4a3a, 0x8affd0]), 1.2), winN: 5, door: std(0x2a3a34), map: '#c8ccc4' });
      box(3, 0.8, 0.3, neon(0xff2a3a, 2), cc.x, h - 2, cc.z - d / 2 - 0.2, false); box(0.8, 3, 0.3, neon(0xff2a3a, 2), cc.x, h - 2, cc.z - d / 2 - 0.2, false); // red cross
      return;
    }
    if (r < 0.46 && !edge) { // abandoned ambulance
      const x = cc.x + rng.pick([-1, 1]) * 7, z = cc.z;
      box(5.4, 5, 11, std(0xe8e8e0, { roughness: 0.5 }), x, 2.9, z);
      box(5.5, 0.8, 11.1, std(0xc02a2a), x, 2.4, z, false);
      box(4, 0.6, 1.2, W.blinkMat, x, 5.7, z - 4, false);
      for (const sz of [-3.5, 3.5]) for (const sd of [-1, 1]) { const wl = meshAt(new THREE.CylinderGeometry(1, 1, 0.5, 12), std(0x1a1a1a), x + sd * 2.6, 1, z + sz); wl.rotation.z = Math.PI / 2; }
      solid(x, z, 5.4, 11, 5.4);
      W.mapRects.push({ x, z, w: 5.4, d: 11, color: '#e8e8e0' });
      openSpot(cc, edge); return;
    }
    if (r < 0.58 && !edge) { // hospital beds and an IV stand, left out in the rain
      for (let k = 0; k < 3; k++) {
        const x = cc.x - 6 + k * 6, z = cc.z + rng.range(-7, 7), ry = rng.range(-0.4, 0.4);
        inst('bedFrame', GEO.box, MAT.metal, x, 1.6, z, { sx: 2.6, sy: 0.3, sz: 5.6, ry, color: 0xb0b8b8 });
        inst('bedSheet', GEO.box, MAT.stone, x, 1.95, z, { sx: 2.4, sy: 0.4, sz: 5.2, ry, color: rng.pick([0xe8ece8, 0xc8d8d0, 0xd8c8c0]) });
        inst('bedHead', GEO.box, MAT.metal, x - Math.sin(ry) * 2.7, 2.4, z - Math.cos(ry) * 2.7, { sx: 2.6, sy: 2, sz: 0.2, ry, color: 0x8a9090 });
        solid(x, z, 2.8, 5.8, 2.2);
      }
      openSpot(cc, edge); return;
    }
    if (r < 0.66) { bushRing(cc, i, j, () => rng.pick([0x2a3a2a, 0x3a4a34])); return; }
    if (r < 0.72) { speedPad(cc); W.patrol.push(cc); return; }
    if (rng.next() < 0.6) lamp(cc.x + C / 2 - 4, cc.z + C / 2 - 4, neon(0x8affc8, 2.6), 0x5affb0);
    openSpot(cc, edge);
  };

  // --- Mushroom Marsh: mushroom houses with spotted caps
  const stemMat = std(0xe8dcc8, { roughness: 0.9 });
  const shroomHouse = (cc) => {
    const R = rng.range(4.5, 6), h = rng.range(7, 10), col = rng.pick([0xc02a3a, 0x8a3ad8, 0xd86a1a, 0x3a8ad8]);
    meshAt(new THREE.CylinderGeometry(R * 0.85, R, h, 16), stemMat, cc.x, h / 2, cc.z);
    const cap = meshAt(new THREE.SphereGeometry(R * 1.9, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), std(col, { roughness: 0.6, emissive: col, emissiveIntensity: 0.15 }), cc.x, h - 0.5, cc.z); cap.scale.y = 0.7;
    for (let k = 0; k < 10; k++) { const a = rng.next() * 6.3, rr = rng.range(R * 0.3, R * 1.6), y = h - 0.5 + Math.sqrt(Math.max(0, 1 - (rr / (R * 1.9)) ** 2)) * R * 1.9 * 0.7; inst('capSpot', GEO.sphere, MAT.bulb, cc.x + Math.cos(a) * rr, y, cc.z + Math.sin(a) * rr, { sx: 0.8, sy: 0.3, sz: 0.8, color: 0xfff4e8, cast: false }); }
    const door = meshAt(new THREE.CylinderGeometry(1.2, 1.2, 0.3, 12, 1, false, 0, Math.PI), std(0x5a3a1a), cc.x, 0, cc.z - R + 0.1); door.rotation.set(Math.PI / 2, 0, 0); door.position.y = 0.05; door.scale.set(1, 1, 2.6);
    for (const sx of [-1, 1]) box(1.4, 1.4, 0.2, neon(0xffe0a0, 1.6), cc.x + sx * R * 0.5, h * 0.55, cc.z - R * 0.93, false);
    solid(cc.x, cc.z, R * 1.8, R * 1.8, h + R);
    W.mapRects.push({ x: cc.x, z: cc.z, w: R * 3, d: R * 3, color: hex6(col), round: true });
  };
  const shroomtownCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.32) { shroomHouse(cc); return; }
    if (r < 0.46) { bushRing(cc, i, j, () => rng.pick([0x3a2a4a, 0x2a3a2a, 0x4a2a3a])); return; }
    if (r < 0.52) { speedPad(cc); W.patrol.push(cc); return; }
    if (!edge && rng.next() < 0.6) fancyTree(cc.x + rng.pick([-1, 1]) * 8, cc.z + rng.pick([-1, 1]) * 8, 'alien');
    if (!edge) for (let k = 0; k < 5; k++) { const x = cc.x + rng.range(-10, 10), z = cc.z + rng.range(-10, 10), col = rng.pick([0xff4ad0, 0x4affd0, 0xffe03a]); inst('tinyStem', GEO.cyl, stemMat, x, 0.5, z, { sx: 0.2, sy: 1, sz: 0.2, cast: false }); inst('tinyCap', GEO.dome, MAT.bulb, x, 1, z, { sx: 0.7, sy: 0.5, sz: 0.7, color: col, cast: false }); }
    openSpot(cc, edge);
  };

  // --- Ghost Town Gulch: saloons with tall false fronts, a water tower, wagons
  const plank = () => std(rng.pick([0x6a4a2a, 0x5a3a20, 0x7a5a34]), { roughness: 1 });
  const westtownCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.32) {
      const wood = plank(), { w, d, h } = house(cc, { wall: wood, roof: 'flat', roofMat: std(0x3a2a18), h: rng.int(8, 11), win: neon(rng.pick([0xffc83a, 0x1a1208]), 1.2), winN: 3, door: std(0x2a1a0e), map: '#7a5a34' });
      box(w + 1, 5, 0.6, wood, cc.x, h + 2.5, cc.z - d / 2 - 0.3); // false front
      box(w * 0.6, 1.4, 0.2, std(0xe8d8b0), cc.x, h + 3, cc.z - d / 2 - 0.65, false); // the sign
      box(w + 2, 0.4, 3.5, std(0x3a2a18), cc.x, h * 0.45, cc.z - d / 2 - 1.8); // porch roof
      for (const px of [-w / 2, w / 2]) inst('porchPost', GEO.box, wood, cc.x + px, h * 0.22, cc.z - d / 2 - 3.3, { sx: 0.4, sy: h * 0.45, sz: 0.4 });
      return;
    }
    if (r < 0.4 && !edge) { // water tower
      const x = cc.x + rng.pick([-1, 1]) * 6, z = cc.z + rng.pick([-1, 1]) * 6;
      for (const [ox, oz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) inst('towerLeg', GEO.box, MAT.bark, x + ox, 6, z + oz, { sx: 0.5, sy: 12, sz: 0.5 });
      meshAt(new THREE.CylinderGeometry(3.6, 3.6, 6, 14), std(0x5a3a20, { roughness: 1 }), x, 15, z);
      meshAt(new THREE.ConeGeometry(4, 2.6, 14), std(0x3a2a18), x, 19.3, z);
      solid(x, z, 5, 5, 18);
      W.mapRects.push({ x, z, w: 7, d: 7, color: '#5a3a20', round: true });
      openSpot(cc, edge); return;
    }
    if (r < 0.5 && !edge) { // broken covered wagon
      const x = cc.x + rng.range(-5, 5), z = cc.z + rng.pick([-1, 1]) * 6;
      box(4.5, 2, 9, plank(), x, 2, z);
      const cover = meshAt(new THREE.CylinderGeometry(2.6, 2.6, 8, 14, 1, true, -Math.PI / 2, Math.PI), std(0xe8dcc0, { side: THREE.DoubleSide, roughness: 1 }), x, 3, z); cover.rotation.x = Math.PI / 2;
      for (const sz of [-3, 3]) for (const sd of [-1, 1]) { const wl = meshAt(new THREE.TorusGeometry(1.4, 0.18, 6, 14), std(0x3a2a18), x + sd * 2.4, 1.4, z + sz); wl.rotation.y = Math.PI / 2; }
      solid(x, z, 4.5, 9, 5.6);
      W.mapRects.push({ x, z, w: 4.5, d: 9, color: '#e8dcc0' });
      openSpot(cc, edge); return;
    }
    if (r < 0.58) { if (!edge) { cactus(cc.x + 7, cc.z - 7); cactus(cc.x - 6, cc.z + 8); } openSpot(cc, edge); return; }
    if (r < 0.64) { speedPad(cc); W.patrol.push(cc); return; }
    if (!edge && rng.next() < 0.6) { barrel(cc.x + 8, cc.z + 6); barrel(cc.x + 5.5, cc.z + 8); }
    openSpot(cc, edge);
  };

  // --- Sky Islands: white marble temples, floating islands and clouds overhead
  const marble = std(0xeef0f8, { roughness: 0.35 }), goldTrim = std(0xffc83a, { metalness: 0.9, roughness: 0.25, emissive: 0x4a3000, emissiveIntensity: 0.4 });
  const cloudPuff = (x, y, z, s) => { for (let k = 0; k < 4; k++) inst('skyCloud', GEO.sphere, MAT.cottonCloud, x + (k - 1.5) * s * 0.9, y + Math.sin(k * 2) * s * 0.3, z + Math.cos(k * 3) * s * 0.4, { s: s * rng.range(0.7, 1.1), color: rng.pick([0xffffff, 0xe0ecff, 0xf0e8ff]), cast: false }); };
  const skycityCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (rng.next() < 0.25) cloudPuff(cc.x + rng.range(-6, 6), rng.range(28, 44), cc.z + rng.range(-6, 6), rng.range(3, 5));
    if (r < 0.3) { // round temple with columns and a golden dome
      const R = rng.range(6, 8), h = rng.range(9, 12);
      meshAt(new THREE.CylinderGeometry(R + 1.2, R + 1.6, 1.2, 24), marble, cc.x, 0.6, cc.z);
      for (let k = 0; k < 10; k++) { const a = (k / 10) * 6.28; inst('column', GEO.cyl, marble, cc.x + Math.cos(a) * R, 1.2 + h / 2, cc.z + Math.sin(a) * R, { sx: 0.6, sy: h, sz: 0.6 }); solid(cc.x + Math.cos(a) * R, cc.z + Math.sin(a) * R, 1.2, 1.2, h); }
      meshAt(new THREE.CylinderGeometry(R + 0.8, R + 0.8, 1, 24), marble, cc.x, h + 1.7, cc.z);
      meshAt(new THREE.SphereGeometry(R, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), goldTrim, cc.x, h + 2.2, cc.z);
      glowDecal(cc.x, cc.z, R, 0xfff0a0, 0.3);
      W.mapRects.push({ x: cc.x, z: cc.z, w: R * 2, d: R * 2, color: '#eef0f8', round: true });
      openSpot(cc, edge); return; // you can run between the columns
    }
    if (r < 0.42 && !edge) { // a little island floating overhead, with a waterfall of light
      const x = cc.x + rng.range(-4, 4), z = cc.z + rng.range(-4, 4), y = rng.range(18, 26), R = rng.range(4, 6);
      const isl = meshAt(new THREE.ConeGeometry(R, R * 1.6, 8), std(0x6a5a4a, { flatShading: true, roughness: 1 }), x, y - R * 0.8, z); isl.rotation.x = Math.PI;
      meshAt(new THREE.CylinderGeometry(R, R, 0.8, 8), std(0x5aa04a, { flatShading: true }), x, y + 0.4, z);
      inst('islTree', GEO.cone, MAT.pine, x, y + 3.5, z, { sx: 1.8, sy: 5, sz: 1.8, color: 0x3a8a3a });
      W.spinners.push({ obj: isl, axis: 'y', speed: 0.05 });
      glowDecal(x, z, R, 0xc0e0ff, 0.2);
    }
    if (r < 0.52) { bushRing(cc, i, j, () => rng.pick([0xe8f0ff, 0xd8e8f8])); return; }
    if (r < 0.64) { speedPad(cc); W.patrol.push(cc); return; } // low gravity: lots of boost pads
    if (!edge && rng.next() < 0.5) { const x = cc.x + 8, z = cc.z - 8; inst('spire', GEO.cone6, goldTrim, x, 6, z, { sx: 1.2, sy: 12, sz: 1.2 }); inst('spireBase', GEO.box, marble, x, 0.8, z, { s: 2.4 }); solid(x, z, 2.4, 2.4, 12); }
    openSpot(cc, edge);
  };

  // --- Midnight Mall: storefronts with glowing signs, fountains, kiosks, shopping carts
  const SHOPC = [0xff4a8a, 0x3ad8ff, 0xffd23a, 0x8a5aff, 0x3aff8a, 0xff8a3a];
  const mallCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.34) {
      const col = rng.pick(SHOPC), { w, d, h } = house(cc, { wall: std(rng.pick([0x4a4058, 0x3a3a4a, 0x584a5a]), { roughness: 0.6 }), roof: 'flat', roofMat: std(0x2a2a34), h: rng.int(9, 14), map: '#5a4a6a' });
      box(w - 2, h * 0.5, 0.25, std(0x203040, { roughness: 0.05, metalness: 0.6, emissive: col, emissiveIntensity: 0.15 }), cc.x, h * 0.3, cc.z - d / 2 - 0.15, false); // shop window
      box(w - 1, 1.8, 0.4, neon(col, 2.2), cc.x, h - 1.5, cc.z - d / 2 - 0.3, false); // sign
      const aw = box(w, 0.3, 3, std(col, { roughness: 0.8 }), cc.x, h * 0.62, cc.z - d / 2 - 1.4); aw.rotation.x = 0.35; // awning
      for (let k = 0; k < 3; k++) inst('mannequinP', GEO.cyl, MAT.stone, cc.x - w / 4 + k * (w / 4), 2.4, cc.z - d / 2 + 0.6, { sx: 0.45, sy: 4.4, sz: 0.45, color: 0xe8dcd0, cast: false });
      return;
    }
    if (r < 0.46 && !edge) { // fountain with benches
      meshAt(new THREE.CylinderGeometry(5, 5, 1.2, 24), std(0xd8d0e0), cc.x, 0.6, cc.z);
      meshAt(new THREE.CylinderGeometry(4.4, 4.4, 0.2, 24), MAT.water, cc.x, 1.25, cc.z);
      inst('fountainCol', GEO.cyl, MAT.stone, cc.x, 3, cc.z, { sx: 0.6, sy: 4, sz: 0.6, color: 0xd8d0e0 });
      meshAt(new THREE.CylinderGeometry(1.8, 0.6, 0.6, 16), std(0xd8d0e0), cc.x, 5, cc.z);
      for (const [x, z, ry] of [[cc.x, cc.z - 9, 0], [cc.x, cc.z + 9, 0], [cc.x - 9, cc.z, Math.PI / 2]]) { inst('bench', GEO.box, MAT.bark, x, 1, z, { sx: 5, sy: 0.3, sz: 1.4, ry }); inst('benchB', GEO.box, MAT.bark, x, 1.8, z + (ry ? 0 : Math.sign(z - cc.z) * 0.6), { sx: ry ? 0.2 : 5, sy: 1.2, sz: ry ? 5 : 0.2 }); solid(x, z, ry ? 1.4 : 5, ry ? 5 : 1.4, 1.2); }
      glowDecal(cc.x, cc.z, 8, 0x3ad8ff, 0.3);
      solid(cc.x, cc.z, 10, 10, 1.4);
      W.mapRects.push({ x: cc.x, z: cc.z, w: 10, d: 10, color: '#3ad8ff', round: true });
      openSpot(cc, edge); return;
    }
    if (r < 0.54) { bushRing(cc, i, j, () => rng.pick([0x2a5a3a, 0x3a6a3a])); return; }
    if (r < 0.6) { speedPad(cc); W.patrol.push(cc); return; }
    if (!edge) for (let k = 0; k < rng.int(1, 3); k++) { // abandoned shopping carts
      const x = cc.x + rng.range(-9, 9), z = cc.z + rng.range(-9, 9), ry = rng.next() * 6;
      inst('cartBody', GEO.box, MAT.neonWire, x, 1.6, z, { sx: 2, sy: 1.4, sz: 3, ry, color: 0x8a8a90, cast: false });
      solid(x, z, 2.4, 2.4, 2.2);
    }
    if (!edge && rng.next() < 0.4) { const x = cc.x + 7, z = cc.z + 7, col = rng.pick(SHOPC); box(4, 3, 4, std(0x2a2a34), x, 1.5, z); box(4.6, 0.6, 4.6, neon(col, 1.8), x, 3.3, z); solid(x, z, 4, 4, 3.6); W.mapRects.push({ x, z, w: 4, d: 4, color: hex6(col) }); } // kiosk
    openSpot(cc, edge);
  };

  // --- Bug Kingdom: giant ant mounds, honeycomb towers, grass blades taller than houses
  const dirt = std(0x6a4a2a, { roughness: 1, flatShading: true }), honey = std(0xffb82a, { roughness: 0.2, emissive: 0x8a4a00, emissiveIntensity: 0.5, transparent: true, opacity: 0.9, flatShading: true });
  const grassBlade = (x, z) => { const h = rng.range(14, 30); inst('blade', GEO.cone, MAT.pine, x, h / 2, z, { sx: 0.9, sy: h, sz: 0.3, ry: rng.next() * 6, rz: rng.range(-0.12, 0.12), color: rng.pick([0x3a7a1a, 0x4a8a22, 0x2a6a14]) }); solid(x, z, 1, 1, h); };
  const hiveCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.26) { // ant mound with tunnel holes
      const R = rng.range(7, 9), h = rng.range(10, 16);
      meshAt(new THREE.ConeGeometry(R, h, 10), dirt, cc.x, h / 2, cc.z);
      for (let k = 0; k < 4; k++) { const a = k * 1.7, y = rng.range(1, h * 0.5), rr = R * (1 - y / h); box(1.8, 1.8, 0.2, new THREE.MeshBasicMaterial({ color: 0x050302 }), cc.x + Math.sin(a) * rr, y, cc.z + Math.cos(a) * rr, false).rotation.y = a; }
      solid(cc.x, cc.z, R * 1.3, R * 1.3, h * 0.7);
      W.mapRects.push({ x: cc.x, z: cc.z, w: R * 2, d: R * 2, color: '#6a4a2a', round: true });
      return;
    }
    if (r < 0.38 && !edge) { // honeycomb towers
      for (let k = 0; k < rng.int(3, 5); k++) { const x = cc.x + rng.range(-8, 8), z = cc.z + rng.range(-8, 8), h = rng.range(4, 12); inst('comb', GEO.cyl6, honey, x, h / 2, z, { sx: 1.8, sy: h, sz: 1.8 }); solid(x, z, 3, 3, h); W.mapRects.push({ x, z, w: 3.6, d: 3.6, color: '#ffb82a', round: true }); }
      glowDecal(cc.x, cc.z, 10, 0xffb82a, 0.3);
      openSpot(cc, edge); return;
    }
    if (r < 0.5 && !edge) { // a giant dew drop and a fallen leaf
      const x = cc.x + rng.range(-5, 5), z = cc.z + rng.range(-5, 5), R = rng.range(2.5, 3.5);
      meshAt(new THREE.SphereGeometry(R, 20, 14), std(0xc0f0ff, { roughness: 0.02, metalness: 0.2, transparent: true, opacity: 0.45 }), x, R * 0.85, z);
      const leaf = meshAt(new THREE.CircleGeometry(6, 12), std(0x5a8a2a, { side: THREE.DoubleSide, flatShading: true }), cc.x - 6, 0.3, cc.z + 6); leaf.rotation.set(-Math.PI / 2 + 0.1, 0, rng.next() * 6); leaf.scale.set(0.5, 1, 1);
      solid(x, z, R * 1.6, R * 1.6, R * 1.6);
      openSpot(cc, edge); return;
    }
    if (r < 0.6) { bushRing(cc, i, j, () => rng.pick([0x3a6a1a, 0x4a7a2a])); return; }
    if (r < 0.66) { speedPad(cc); W.patrol.push(cc); return; }
    if (!edge) for (let k = 0; k < rng.int(2, 4); k++) grassBlade(cc.x + rng.pick([-1, 1]) * rng.range(6, 10), cc.z + rng.pick([-1, 1]) * rng.range(6, 10));
    openSpot(cc, edge);
  };

  // --- Clockwork Town: brick buildings with spinning gears, copper pipes, smoking chimneys, a clock tower
  const brick = () => std(rng.pick([0x7a3a24, 0x6a3020, 0x8a4a2a]), { roughness: 1 });
  const brass = std(0xc8963a, { metalness: 0.85, roughness: 0.3 }), copper = std(0xb86a3a, { metalness: 0.8, roughness: 0.35 });
  const bigGear = (x, y, z, R, ry, speed) => {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; group.add(g);
    const sp = new THREE.Group(); g.add(sp);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.6, 20), brass); disc.rotation.x = Math.PI / 2; sp.add(disc);
    for (let k = 0; k < 12; k++) { const a = (k / 12) * 6.28, t = new THREE.Mesh(BOX(R * 0.25, R * 0.3, 0.6), brass); t.position.set(Math.cos(a) * R, Math.sin(a) * R, 0); t.rotation.z = a; sp.add(t); }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.25, R * 0.25, 0.9, 10), neon(0xffb43a, 1.4)); hub.rotation.x = Math.PI / 2; sp.add(hub);
    W.spinners.push({ obj: sp, axis: 'z', speed });
  };
  const steamtownCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.32) {
      const { w, d, h } = house(cc, { wall: brick(), roof: 'flat', roofMat: std(0x2a2420), h: rng.int(10, 18), win: neon(0xffb43a, 1.3), winN: 3, door: copper, map: '#7a3a24' });
      bigGear(cc.x + rng.range(-w / 4, w / 4), h * 0.6, cc.z - d / 2 - 0.4, rng.range(2.2, 3.5), 0, rng.pick([-0.6, 0.6]));
      inst('chimney', GEO.cyl, copper, cc.x + w / 3, h + 3, cc.z + d / 4, { sx: 0.9, sy: 6, sz: 0.9 });
      inst('smoke', GEO.sphere, MAT.cottonCloud, cc.x + w / 3, h + 7, cc.z + d / 4, { s: 1.8, color: 0x6a6460, cast: false });
      inst('pipe', GEO.cyl, copper, cc.x - w / 2 - 0.5, h / 2, cc.z, { sx: 0.4, sy: h, sz: 0.4 });
      return;
    }
    if (r < 0.4 && !edge) { // clock tower
      const x = cc.x, z = cc.z, h = rng.range(26, 34);
      box(6, h, 6, brick(), x, h / 2, z);
      meshAt(new THREE.ConeGeometry(4.8, 7, 4), std(0x2a3a3a, { metalness: 0.5 }), x, h + 3.5, z).rotation.y = Math.PI / 4;
      for (const [ox, oz, ry] of [[0, -3.05, 0], [0, 3.05, Math.PI], [-3.05, 0, Math.PI / 2], [3.05, 0, -Math.PI / 2]]) {
        const face = new THREE.Group(); face.position.set(x + ox, h - 4, z + oz); face.rotation.y = ry; group.add(face);
        const disc = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.2, 24), std(0xf4ecd0, { emissive: 0xffe0a0, emissiveIntensity: 0.6 })); disc.rotation.x = Math.PI / 2; face.add(disc);
        const hand = new THREE.Group(); hand.position.z = -0.2; face.add(hand); const hm = new THREE.Mesh(BOX(0.2, 2, 0.1), new THREE.MeshBasicMaterial({ color: 0x111111 })); hm.position.y = 0.9; hand.add(hm);
        W.spinners.push({ obj: hand, axis: 'z', speed: -0.5 });
      }
      solid(x, z, 6, 6, h);
      W.mapRects.push({ x, z, w: 6, d: 6, color: '#7a3a24' });
      return;
    }
    if (r < 0.5 && !edge) { // tangle of steam pipes with glowing valves
      for (let k = 0; k < 4; k++) { const z = cc.z - 6 + k * 4; inst('pipeRun', GEO.cyl, copper, cc.x, 1.2 + (k % 2), z, { sx: 0.6, sy: C - 8, sz: 0.6, rz: Math.PI / 2 }); inst('valve', GEO.sphere, MAT.ember, cc.x + rng.range(-6, 6), 1.2 + (k % 2) + 0.6, z, { s: 0.5, cast: false }); }
      solid(cc.x, cc.z, C - 8, 14, 2.8);
      W.mapRects.push({ x: cc.x, z: cc.z, w: C - 8, d: 14, color: '#b86a3a' });
      W.patrol.push(cc); return;
    }
    if (r < 0.58) { bushRing(cc, i, j, () => rng.pick([0x3a3a2a, 0x2a3a24])); return; }
    if (r < 0.64) { speedPad(cc); W.patrol.push(cc); return; }
    if (rng.next() < 0.5) lamp(cc.x + C / 2 - 4, cc.z + C / 2 - 4, sodiumMat, 0xff8a2a);
    openSpot(cc, edge);
  };

  // --- Deep Mines: mine shaft entrances in rock, carts on rails, lantern posts, glowing ore piles
  const mineRock = std(0x3a322a, { roughness: 1, flatShading: true });
  const minecampCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.28) { // a mine entrance cut into a big rock
      const w = C - 7, h = rng.range(10, 15);
      const rk = meshAt(new THREE.DodecahedronGeometry(w * 0.55, 1), mineRock, cc.x, h * 0.3, cc.z); rk.scale.set(1, h / (w * 0.9), 1);
      box(5, 6, 0.4, new THREE.MeshBasicMaterial({ color: 0x050302 }), cc.x, 3, cc.z - w * 0.5, false);
      for (const sx of [-2.8, 2.8]) inst('mineBeam', GEO.box, MAT.bark, cc.x + sx, 3.2, cc.z - w * 0.5 - 0.3, { sx: 0.7, sy: 6.4, sz: 0.7 });
      inst('mineBeam', GEO.box, MAT.bark, cc.x, 6.5, cc.z - w * 0.5 - 0.3, { sx: 6.4, sy: 0.7, sz: 0.7 });
      inst('mineLamp', GEO.sphere, MAT.ember, cc.x, 5.6, cc.z - w * 0.5 - 0.8, { s: 0.4, cast: false });
      glowDecal(cc.x, cc.z - w * 0.5 - 2, 5, 0xffb43a, 0.35);
      solid(cc.x, cc.z, w * 0.95, w * 0.95, h);
      W.mapRects.push({ x: cc.x, z: cc.z, w, d: w, color: '#3a322a', round: true });
      return;
    }
    if (r < 0.44) { // rails with a mine cart full of glowing ore
      const z0 = cc.z + rng.pick([-1, 1]) * 6;
      for (const dz of [-1.1, 1.1]) box(C, 0.15, 0.3, std(0x6a6a70, { metalness: 0.6 }), cc.x, 0.08, z0 + dz, false);
      for (let k = -5; k <= 5; k++) inst('tie', GEO.box, MAT.bark, cc.x + k * 2.3, 0.05, z0, { sx: 0.6, sy: 0.1, sz: 3.2, cast: false });
      if (!edge) {
        const x = cc.x + rng.range(-5, 5);
        box(5, 2.6, 3, std(0x4a4a50, { metalness: 0.7, roughness: 0.4 }), x, 1.9, z0);
        for (let k = 0; k < 6; k++) inst('ore', GEO.sphere, MAT.gold, x + rng.range(-1.8, 1.8), 3.3, z0 + rng.range(-0.9, 0.9), { s: rng.range(0.4, 0.7), cast: false });
        glowDecal(x, z0, 5, 0xffd23a, 0.3);
        solid(x, z0, 5, 3, 3.4);
        W.mapRects.push({ x, z: z0, w: 5, d: 3, color: '#ffd23a' });
      }
      openSpot(cc, edge); return;
    }
    if (r < 0.54 && !edge) { // miners' tent and a crate stack
      const x = cc.x + rng.pick([-1, 1]) * 5, z = cc.z + rng.pick([-1, 1]) * 5;
      meshAt(new THREE.ConeGeometry(4.5, 5.5, 4), std(0x8a7a5a, { roughness: 1, flatShading: true }), x, 2.75, z).rotation.y = Math.PI / 4;
      solid(x, z, 6, 6, 5);
      W.mapRects.push({ x, z, w: 6, d: 6, color: '#8a7a5a' });
      openSpot(cc, edge); return;
    }
    if (r < 0.6) { speedPad(cc); W.patrol.push(cc); return; }
    if (!edge) for (let k = 0; k < 2; k++) { // lantern posts
      const x = cc.x + (k ? 8 : -8), z = cc.z + (k ? -8 : 8);
      inst('lPost', GEO.box, MAT.bark, x, 4, z, { sx: 0.4, sy: 8, sz: 0.4 }); inst('lArm', GEO.box, MAT.bark, x + 0.8, 7.8, z, { sx: 1.8, sy: 0.3, sz: 0.3 });
      inst('lantern', GEO.box, MAT.ember, x + 1.5, 7, z, { sx: 0.6, sy: 0.9, sz: 0.6, cast: false });
      glowDecal(x + 1.5, z, 7, 0xffb43a, 0.35); solid(x, z, 0.8, 0.8, 8);
    }
    if (!edge && rng.next() < 0.5) for (let k = 0; k < 6; k++) inst('oreRock', GEO.sphere, rubbleMat, cc.x + rng.range(-4, 4), 0.5, cc.z + rng.range(-4, 4), { s: rng.range(0.6, 1.4), color: rng.pick([0x4a3a2a, 0x8a6a2a]) });
    openSpot(cc, edge);
  };

  // --- Shadow Realm: crooked black towers with purple slit windows, floating shards, watching eyes
  const shadowMat = std(0x0a0810, { roughness: 0.3, metalness: 0.6 });
  const shadowcityCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (rng.next() < 0.3) { // a shard floating overhead
      const s = new THREE.Mesh(new THREE.OctahedronGeometry(rng.range(1.5, 3)), std(0x14081e, { emissive: 0x6a1aa0, emissiveIntensity: 0.8, flatShading: true }));
      s.position.set(cc.x + rng.range(-8, 8), rng.range(18, 30), cc.z + rng.range(-8, 8)); s.scale.y = 2; group.add(s);
      W.spinners.push({ obj: s, axis: 'y', speed: rng.range(0.3, 0.9) });
    }
    if (r < 0.34) { // crooked tower
      const w = rng.range(7, 11), h = rng.range(22, 44), lean = rng.range(-0.08, 0.08);
      const t = box(w, h, w, shadowMat, cc.x, h / 2, cc.z); t.rotation.set(lean, rng.next(), -lean);
      const t2 = box(w * 0.6, h * 0.35, w * 0.6, shadowMat, cc.x + Math.sin(lean) * h * 0.5, h + h * 0.15, cc.z); t2.rotation.set(-lean * 2, rng.next(), lean * 3);
      for (let k = 0; k < 6; k++) box(0.4, rng.range(2, 5), 0.2, neon(0xb44aff, 2), cc.x + rng.range(-w / 3, w / 3), rng.range(4, h - 4), cc.z - w / 2 - 0.2, false);
      solid(cc.x, cc.z, w, w, h);
      W.mapRects.push({ x: cc.x, z: cc.z, w, d: w, color: '#140c1c' });
      return;
    }
    if (r < 0.44 && !edge) { // a wall of eyes that open and follow you
      const x = cc.x + rng.pick([-1, 1]) * 6, z = cc.z;
      box(2, 8, C - 8, shadowMat, x, 4, z);
      for (let k = 0; k < 3; k++) {
        const head = new THREE.Group(); head.position.set(x + Math.sign(cc.x - x) * 1.1, 4.5, z - 6 + k * 6); group.add(head);
        meshAt(new THREE.SphereGeometry(0.9, 12, 10), std(0xf0e8f0, { roughness: 0.3 }), 0, 0, 0, head);
        const eyeMat = neon(0xb44aff, 0.5); meshAt(new THREE.SphereGeometry(0.45, 10, 8), eyeMat, 0, 0, 0.6, head);
        W.scarecrows.push({ x: head.position.x, z: head.position.z, head, eyeMat, eyeCol: 0xb44aff });
      }
      solid(x, z, 2, C - 8, 8);
      W.mapRects.push({ x, z, w: 2, d: C - 8, color: '#140c1c' });
      openSpot(cc, edge); return;
    }
    if (r < 0.54) { bushRing(cc, i, j, () => rng.pick([0x1a1024, 0x24102a])); return; }
    if (r < 0.6) { speedPad(cc); W.patrol.push(cc); return; }
    if (!edge && rng.next() < 0.5) deadTree(cc.x + rng.pick([-1, 1]) * 8, cc.z + rng.pick([-1, 1]) * 8);
    openSpot(cc, edge);
  };

  // --- Rainbow Nightmare: cupcake houses, rainbow arches, giant lollipops, smiling flowers that watch you
  const RAINBOW = [0xff3a3a, 0xff9a1a, 0xffe03a, 0x3ad86a, 0x3a8aff, 0xb44aff];
  const rainbowArch = (x, z, ry) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; group.add(g);
    RAINBOW.forEach((c, k) => { const t = new THREE.Mesh(new THREE.TorusGeometry(9 - k * 0.7, 0.36, 8, 32, Math.PI), std(c, { emissive: c, emissiveIntensity: 0.5, roughness: 0.5 })); g.add(t); });
    for (const s of [-1, 1]) { meshAt(new THREE.SphereGeometry(2, 10, 8), MAT.cottonCloud, s * 7.2, 0.8, 0, g); solid(x + Math.cos(ry) * s * 7.2, z - Math.sin(ry) * s * 7.2, 3, 3, 3); }
  };
  const smileFlower = (x, z) => {
    inst('fStem', GEO.cyl, MAT.pine, x, 3, z, { sx: 0.3, sy: 6, sz: 0.3, color: 0x3ad86a });
    const head = new THREE.Group(); head.position.set(x, 6.8, z); group.add(head);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * 6.28; meshAt(new THREE.SphereGeometry(0.9, 8, 6), std(RAINBOW[k % 6]), Math.cos(a) * 1.5, Math.sin(a) * 1.5, -0.2, head).scale.z = 0.4; }
    meshAt(new THREE.SphereGeometry(1.1, 12, 10), std(0xffe03a), 0, 0, 0, head);
    const eyeMat = neon(0xff2a8a, 0.5);
    for (const ex of [-0.4, 0.4]) meshAt(new THREE.SphereGeometry(0.16, 8, 6), eyeMat, ex, 0.25, 1.0, head);
    for (let k = -3; k <= 3; k++) meshAt(new THREE.SphereGeometry(0.08, 6, 4), new THREE.MeshBasicMaterial({ color: 0x111111 }), k * 0.15, -0.3 + k * k * 0.02, 1.05, head);
    watcher(x, z, head, eyeMat, 0xff2a8a, 8);
  };
  const rainbowtownCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.3) { // cupcake house
      const R = rng.range(5, 6.5), h = rng.range(6, 8), col = rng.pick([0xffb0d8, 0xb0e0ff, 0xfff0a0, 0xd0b0ff]);
      meshAt(new THREE.CylinderGeometry(R, R * 0.8, h, 16), std(rng.pick([0xd88ab0, 0x8ab0d8, 0xd8b08a])), cc.x, h / 2, cc.z);
      for (let k = 0; k < 3; k++) meshAt(new THREE.TorusGeometry(R * (1 - k * 0.28), R * 0.32, 10, 24), std(col, { roughness: 0.6 }), cc.x, h + 0.6 + k * R * 0.42, cc.z).rotation.x = Math.PI / 2;
      meshAt(new THREE.SphereGeometry(1.2, 12, 10), neon(0xff1a3a, 1.1), cc.x, h + R * 1.2 + 0.8, cc.z);
      for (let k = 0; k < 12; k++) inst('sprinkle', GEO.box, MAT.bulb, cc.x + Math.cos(k) * R * 0.9, h + 1.2 + (k % 3) * 0.8, cc.z + Math.sin(k) * R * 0.9, { sx: 0.6, sy: 0.15, sz: 0.15, ry: k, color: RAINBOW[k % 6], cast: false });
      box(2.4, 4, 0.2, std(0xff6ab0), cc.x, 2, cc.z - R * 0.92, false);
      solid(cc.x, cc.z, R * 1.8, R * 1.8, h + R);
      W.mapRects.push({ x: cc.x, z: cc.z, w: R * 2, d: R * 2, color: '#ffb0d8', round: true });
      return;
    }
    if (r < 0.4 && !edge) { rainbowArch(cc.x, cc.z, rng.pick([0, Math.PI / 2])); openSpot(cc, edge); return; }
    if (r < 0.5 && !edge && W.scarecrows.length < 10) { smileFlower(cc.x + rng.pick([-1, 1]) * 7, cc.z + rng.pick([-1, 1]) * 7); openSpot(cc, edge); return; }
    if (r < 0.6) { bushRing(cc, i, j, () => RAINBOW[rng.int(0, 5)]); return; }
    if (r < 0.66) { speedPad(cc); W.patrol.push(cc); return; }
    if (!edge && rng.next() < 0.6) fancyTree(cc.x + rng.pick([-1, 1]) * 8, cc.z + rng.pick([-1, 1]) * 8, 'candy');
    openSpot(cc, edge);
  };

  // ===== Levels 27-38: a new town in the middle + two brand new wild areas each =====
  const around = (cc, n, r0, r1, fn) => { for (let k = 0; k < n; k++) { const a = rng.next() * 6.3, rr = rng.range(r0, r1); fn(cc.x + Math.cos(a) * rr, cc.z + Math.sin(a) * rr, k); } };
  const pool = (x, z, w, d, kind, mat, css, glow, extra = {}) => {
    box(w, 0.12, d, mat, x, 0.06, z, false);
    if (glow) glowDecal(x, z, Math.max(w, d) * 0.6, glow, 0.35);
    W.hazards.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, kind, ...extra });
    W.mapRects.push({ x, z, w, d, color: css });
  };
  const wheel = (x, y, z, r, alongX = false) => { const wl = meshAt(new THREE.CylinderGeometry(r, r, 0.5, 12), std(0x1a1a1a), x, y, z); wl.rotation[alongX ? 'x' : 'z'] = Math.PI / 2; };
  const PLAYC = [0xe83a3a, 0x3a8ae8, 0xe8c83a, 0x3ac85a, 0xb44aff];

  // --- Nightmare School
  const schoolCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.32) {
      const { w, d, h } = house(cc, { wall: std(rng.pick([0xb8a070, 0xa86040, 0xc0b090]), { roughness: 1 }), roof: 'flat', roofMat: std(0x3a3030), h: rng.int(10, 14), win: neon(rng.pick([0xffe8a0, 0x3a3a2a]), 1.1), winN: 5, door: std(0x2a4a8a), map: '#a86040' });
      meshAt(new THREE.CylinderGeometry(1.4, 1.4, 0.3, 20), std(0xf4ecd8, { emissive: 0xffe0a0, emissiveIntensity: 0.5 }), cc.x, h - 2, cc.z - d / 2 - 0.2).rotation.x = Math.PI / 2;
      inst('flagpole', GEO.cyl, MAT.metal, cc.x + w / 2 + 2, 8, cc.z - d / 2 - 2, { sx: 0.15, sy: 16, sz: 0.15, color: 0xc0c0c8 });
      inst('flag', GEO.box, MAT.stone, cc.x + w / 2 + 3.4, 14.5, cc.z - d / 2 - 2, { sx: 2.6, sy: 1.6, sz: 0.05, color: 0x8a1a1a, cast: false });
      return;
    }
    if (r < 0.44 && !edge) { // school bus
      const x = cc.x + rng.pick([-1, 1]) * 6, z = cc.z;
      box(5.2, 5, 15, std(0xf0b81a, { roughness: 0.5 }), x, 3, z);
      box(5.3, 0.4, 15.1, std(0x1a1a1a), x, 2.2, z, false);
      for (let k = 0; k < 6; k++) for (const sd of [-1, 1]) box(0.1, 1.4, 1.6, glassMat, x + sd * 2.62, 4.3, z - 6 + k * 2.3, false);
      for (const sz of [-5, 5]) for (const sd of [-1, 1]) wheel(x + sd * 2.5, 1, z + sz, 1);
      box(1.2, 0.6, 0.2, W.blinkMat, x, 5.2, z - 7.6, false);
      solid(x, z, 5.2, 15, 5.5);
      W.mapRects.push({ x, z, w: 5.2, d: 15, color: '#f0b81a' });
      openSpot(cc, edge); return;
    }
    if (r < 0.54 && !edge) { // a row of lockers
      const z = cc.z + rng.pick([-1, 1]) * 7;
      for (let k = -3; k <= 3; k++) { inst('locker', GEO.box, MAT.metal, cc.x + k * 1.9, 3, z, { sx: 1.8, sy: 6, sz: 1.6, color: rng.pick([0x3a5a8a, 0x8a2a2a, 0x2a6a4a]) }); inst('lockerVent', GEO.box, MAT.bulb, cc.x + k * 1.9, 5, z - 0.82, { sx: 1, sy: 0.5, sz: 0.02, color: 0x111111, cast: false }); }
      solid(cc.x, z, 13.4, 1.6, 6);
      W.mapRects.push({ x: cc.x, z, w: 13.4, d: 1.6, color: '#3a5a8a' });
      openSpot(cc, edge); return;
    }
    if (r < 0.62) { bushRing(cc, i, j, () => rng.pick([0x2a5a2a, 0x3a6a2a])); return; }
    if (r < 0.68) { speedPad(cc); W.patrol.push(cc); return; }
    if (rng.next() < 0.5) lamp(cc.x + C / 2 - 4, cc.z + C / 2 - 4, lampMat, 0xffd27a);
    openSpot(cc, edge);
  };
  const playgroundCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next(), pm = () => std(rng.pick(PLAYC), { roughness: 0.5 });
    if (r < 0.25) { // swing set; one swing is still moving…
      const z = cc.z + rng.pick([-1, 1]) * 6, m = pm();
      for (const sx of [-6, 6]) { for (const sz of [-1.5, 1.5]) box(0.4, 9, 0.4, m, cc.x + sx, 4.3, z + sz).rotation.x = sz > 0 ? -0.17 : 0.17; solid(cc.x + sx, z, 1, 3.4, 9); }
      box(12.4, 0.4, 0.4, m, cc.x, 8.8, z);
      for (const sx of [-3, 0, 3]) {
        const sw = new THREE.Group(); sw.position.set(cc.x + sx, 8.6, z); sw.rotation.x = rng.range(-0.5, 0.5); group.add(sw);
        for (const o of [-0.6, 0.6]) { const c = new THREE.Mesh(BOX(0.05, 6, 0.05), std(0x888888)); c.position.set(o, -3, 0); sw.add(c); }
        const seat = new THREE.Mesh(BOX(1.6, 0.2, 0.8), std(0x1a1a1a)); seat.position.y = -6; seat.castShadow = true; sw.add(seat);
      }
      W.mapRects.push({ x: cc.x, z, w: 13, d: 3, color: '#e83a3a' });
    } else if (r < 0.45) { // slide
      const x = cc.x + rng.pick([-1, 1]) * 5, z = cc.z - 3, m = pm();
      for (const [ox, oz] of [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]]) inst('slideLeg', GEO.cyl, MAT.metal, x + ox, 3, z + oz, { sx: 0.2, sy: 6, sz: 0.2, color: 0xc0c0c8 });
      box(3.4, 0.4, 3.4, m, x, 6.2, z);
      const ramp = box(2.4, 0.3, 9, pm(), x, 3.3, z + 5.6); ramp.rotation.x = 0.62;
      for (let k = 0; k < 5; k++) inst('rung', GEO.box, MAT.metal, x, 1 + k * 1.1, z - 2.2, { sx: 2.4, sy: 0.15, sz: 0.15, color: 0xc0c0c8 });
      solid(x, z, 3.4, 3.4, 6.4); solid(x, z + 6, 2.4, 6, 2.5);
      W.mapRects.push({ x, z: z + 3, w: 3.4, d: 10, color: '#3a8ae8' });
    } else if (r < 0.58) { // merry-go-round that turns on its own
      const mg = new THREE.Group(); mg.position.set(cc.x, 0.5, cc.z + 4); group.add(mg);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 0.5, 6), pm()); disc.castShadow = true; mg.add(disc);
      for (let k = 0; k < 6; k++) { const a = (k / 6) * 6.28, b = new THREE.Mesh(BOX(0.15, 2.4, 0.15), std(0xe8e8e8, { metalness: 0.6 })); b.position.set(Math.cos(a) * 3.2, 1.2, Math.sin(a) * 3.2); mg.add(b); }
      W.spinners.push({ obj: mg, axis: 'y', speed: 0.35 });
      solid(cc.x, cc.z + 4, 7, 7, 1.2);
      W.mapRects.push({ x: cc.x, z: cc.z + 4, w: 8, d: 8, color: '#e8c83a', round: true });
    } else if (r < 0.7 && !edge) { // jungle gym of bars
      const x = cc.x + 5, z = cc.z - 5, m = std(rng.pick(PLAYC), { metalness: 0.5, roughness: 0.4 });
      for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) inst('gymV', GEO.cyl, m, x - 3 + a * 3, 3, z - 3 + b * 3, { sx: 0.12, sy: 6, sz: 0.12 });
      for (let y = 2; y <= 6; y += 2) for (let a = 0; a < 3; a++) { inst('gymH', GEO.box, m, x, y, z - 3 + a * 3, { sx: 6, sy: 0.15, sz: 0.15 }); inst('gymH', GEO.box, m, x - 3 + a * 3, y, z, { sx: 0.15, sy: 0.15, sz: 6 }); }
      solid(x, z, 6.4, 6.4, 6);
      W.mapRects.push({ x, z, w: 6.4, d: 6.4, color: '#3ac85a' });
    } else if (!edge) { // sandbox with an abandoned bucket
      for (const [x, z, w, d] of [[cc.x, cc.z - 4, 9, 0.6], [cc.x, cc.z + 4, 9, 0.6], [cc.x - 4.5, cc.z, 0.6, 8.6], [cc.x + 4.5, cc.z, 0.6, 8.6]]) box(w, 0.8, d, MAT.bark, x, 0.4, z);
      box(8.4, 0.3, 7.4, std(0xd8c088, { roughness: 1 }), cc.x, 0.3, cc.z, false);
      meshAt(new THREE.CylinderGeometry(0.7, 0.5, 1, 10), std(rng.pick(PLAYC)), cc.x + 2, 0.9, cc.z);
    }
    openSpot(cc, edge);
  };
  const sportsfieldCell = (cc, i, j, edge) => {
    inst('fieldLine', GEO.box, MAT.bulb, cc.x, 0.04, cc.z - C / 2 + 0.5, { sx: C, sy: 0.04, sz: 0.4, color: 0xd8d8d8, cast: false });
    const r = edge ? 1 : rng.next();
    if (r < 0.25) { // goal posts with a torn net
      const z = cc.z + rng.pick([-1, 1]) * 4, wm = std(0xf0f0f0, { roughness: 0.4 });
      for (const sx of [-5, 5]) { inst('goalPost', GEO.cyl, wm, cc.x + sx, 3.5, z, { sx: 0.25, sy: 7, sz: 0.25 }); solid(cc.x + sx, z, 0.8, 0.8, 7); }
      box(10.4, 0.4, 0.4, wm, cc.x, 7, z);
      const net = box(10, 7, 4, Object.assign(std(0xe0e0e0), { wireframe: true }), cc.x, 3.5, z + 2, false); net.castShadow = false;
      W.mapRects.push({ x: cc.x, z, w: 10, d: 1, color: '#f0f0f0' });
    } else if (r < 0.45) { // bleachers
      const z = cc.z + rng.pick([-1, 1]) * 6, side = z > cc.z ? 1 : -1;
      for (let k = 0; k < 4; k++) { box(C - 6, 1.2 + k * 1.2, 2, std(k % 2 ? 0x8a8a90 : 0x6a6a72, { metalness: 0.5 }), cc.x, (1.2 + k * 1.2) / 2, z + side * k * 2); solid(cc.x, z + side * k * 2, C - 6, 2, 1.2 + k * 1.2); }
      W.mapRects.push({ x: cc.x, z: z + side * 3, w: C - 6, d: 8, color: '#8a8a90' });
    } else if (r < 0.55 && !edge) { // scoreboard
      const x = cc.x + 7, z = cc.z + 7;
      inst('sbPost', GEO.box, MAT.metal, x, 6, z, { sx: 0.8, sy: 12, sz: 0.8, color: 0x3a3a40 });
      box(8, 4, 0.6, std(0x14141a), x, 13, z);
      for (let k = 0; k < 4; k++) box(1.2, 2, 0.1, neon(k < 2 ? 0xff3a3a : 0xffc83a, 2), x - 2.8 + k * 1.6 + (k > 1 ? 0.6 : 0), 13, z - 0.35, false);
      solid(x, z, 1, 1, 12);
    } else if (!edge) around(cc, rng.int(1, 3), 5, 9, (x, z) => meshAt(new THREE.SphereGeometry(rng.range(0.8, 1.4), 12, 10), std(rng.pick([0xf0f0f0, 0xe86a1a, 0x8a4a2a])), x, 1, z));
    openSpot(cc, edge);
  };

  // --- Giant Kitchen (you are tiny)
  const chrome = std(0xd8dce4, { metalness: 0.9, roughness: 0.15 });
  const kitchenCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.24) { // giant toaster, glowing hot inside
      const w = 13, d = 8, h = 10;
      box(w, h, d, chrome, cc.x, h / 2, cc.z);
      for (const sz of [-1.6, 1.6]) { box(w - 3, 0.3, 1.2, neon(0xff5a1a, 2.2), cc.x, h + 0.05, cc.z + sz, false); }
      box(0.8, 2, 1.4, std(0x1a1a1a), cc.x + w / 2 + 0.4, h * 0.6, cc.z);
      glowDecal(cc.x, cc.z, 9, 0xff5a1a, 0.3);
      solid(cc.x, cc.z, w, d, h);
      W.mapRects.push({ x: cc.x, z: cc.z, w, d, color: '#d8dce4' });
      return;
    }
    if (r < 0.38) { // giant mug of coffee, still steaming
      const R = rng.range(5, 6.5), h = rng.range(9, 12), col = rng.pick([0xd84a4a, 0x4a8ad8, 0xf0f0e8, 0x3ab06a]);
      meshAt(new THREE.CylinderGeometry(R, R * 0.92, h, 24), std(col, { roughness: 0.3 }), cc.x, h / 2, cc.z);
      meshAt(new THREE.CylinderGeometry(R * 0.92, R * 0.92, 0.2, 24), std(0x3a1a0a, { roughness: 0.1 }), cc.x, h - 0.6, cc.z);
      const hd = meshAt(new THREE.TorusGeometry(2.6, 0.7, 8, 16, Math.PI), std(col, { roughness: 0.3 }), cc.x + R, h / 2, cc.z); hd.rotation.z = -Math.PI / 2;
      for (let k = 0; k < 3; k++) inst('steam', GEO.sphere, MAT.cottonCloud, cc.x + rng.range(-1, 1), h + 3 + k * 3, cc.z, { s: 1.5 + k * 0.6, color: 0xd8d8d8, cast: false });
      solid(cc.x, cc.z, R * 1.8, R * 1.8, h);
      W.mapRects.push({ x: cc.x, z: cc.z, w: R * 2, d: R * 2, color: hex6(col), round: true });
      return;
    }
    if (r < 0.5 && !edge) { // stack of giant tin cans
      around(cc, rng.int(2, 3), 6, 9, (x, z) => { const h = rng.range(5, 8), col = rng.pick([0xd83a3a, 0x3a8a3a, 0xe8b83a, 0x3a5ad8]); inst('can', GEO.cyl, chrome, x, h / 2, z, { sx: 2.4, sy: h, sz: 2.4 }); inst('label', GEO.cyl, MAT.stone, x, h / 2, z, { sx: 2.45, sy: h * 0.6, sz: 2.45, color: col }); solid(x, z, 4.4, 4.4, h); W.mapRects.push({ x, z, w: 4.8, d: 4.8, color: hex6(col), round: true }); });
      openSpot(cc, edge); return;
    }
    if (r < 0.58 && !edge) { // a giant fork stuck in the counter
      const x = cc.x + rng.pick([-1, 1]) * 7, z = cc.z + rng.pick([-1, 1]) * 7, f = new THREE.Group(); f.position.set(x, 0, z); f.rotation.set(0.25, rng.next() * 6, 0.15); group.add(f);
      meshAt(BOX(1.2, 12, 0.5), chrome, 0, 10, 0, f); meshAt(BOX(3, 1.2, 0.5), chrome, 0, 3.6, 0, f);
      for (let k = 0; k < 4; k++) meshAt(BOX(0.4, 3.6, 0.4), chrome, -1.2 + k * 0.8, 1.6, 0, f);
      solid(x, z, 3, 3, 14);
    } else if (r < 0.66) { bushRing(cc, i, j, () => rng.pick([0x4a9a2a, 0x6ab02a])); return; } // lettuce
    else if (r < 0.72) { speedPad(cc); W.patrol.push(cc); return; }
    else if (!edge) around(cc, rng.int(2, 4), 6, 10, (x, z) => { const s = rng.range(1.5, 2.5); inst('sugarCube', GEO.box, MAT.stone, x, s / 2, z, { s, ry: rng.next(), color: 0xf8f8f8 }); solid(x, z, s, s, s); });
    openSpot(cc, edge);
  };
  const pantryCell = (cc, i, j, edge) => {
    if (!edge) around(cc, rng.int(2, 4), 6.5, 10, (x, z) => {
      if (rng.next() < 0.55) { // a giant cereal box
        const h = rng.range(10, 16), col = rng.pick([0xe8b81a, 0xd83a3a, 0x3a6ad8, 0x8a3ad8]), ry = rng.range(-0.3, 0.3);
        inst('cereal', GEO.box, MAT.toy, x, h / 2, z, { sx: 5, sy: h, sz: 2, ry, color: col });
        inst('cerealBand', GEO.box, MAT.bulb, x, h * 0.65, z, { sx: 5.05, sy: 1.6, sz: 2.05, ry, color: 0xffffff, cast: false });
        solid(x, z, 5, 5, h);
        W.mapRects.push({ x, z, w: 5, d: 3, color: hex6(col) });
      } else { // a glass jar of something glowing
        const h = rng.range(5, 8), col = rng.pick([0xff6a1a, 0xc83aff, 0x3ad8ff, 0xffd23a]);
        inst('jarGlass', GEO.cyl, glassMat, x, h / 2, z, { sx: 2, sy: h, sz: 2 });
        inst('jarFill', GEO.cyl, MAT.bulb, x, h * 0.35, z, { sx: 1.8, sy: h * 0.65, sz: 1.8, color: col, cast: false });
        inst('jarLid', GEO.cyl, MAT.metal, x, h + 0.3, z, { sx: 2.1, sy: 0.6, sz: 2.1, color: 0xc0a040 });
        glowDecal(x, z, 4, col, 0.3);
        solid(x, z, 4, 4, h);
        W.mapRects.push({ x, z, w: 4, d: 4, color: hex6(col), round: true });
      }
    });
    if (!edge) for (let k = 0; k < 8; k++) inst('crumb', GEO.box, rubbleMat, cc.x + rng.range(-10, 10), 0.2, cc.z + rng.range(-10, 10), { s: rng.range(0.3, 0.7), ry: rng.next() * 6, color: 0xc8963a, cast: false });
    openSpot(cc, edge);
  };
  const soapMat = std(0xc8e8ff, { roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.8, emissive: 0x204060, emissiveIntensity: 0.4 });
  const sinklandCell = (cc, i, j, edge) => {
    if (!edge && rng.next() < 0.6) { // a soapy puddle with bubbles
      const w = rng.range(10, 16), d = rng.range(8, 14), x = cc.x + rng.range(-3, 3), z = cc.z + rng.range(-3, 3);
      pool(x, z, w, d, 'water', soapMat, '#9ae8ff', 0x9ae8ff);
      for (let k = 0; k < 10; k++) inst('soapBubble', GEO.sphere, decoBubble, x + rng.range(-w / 2, w / 2), rng.range(0.3, 2), z + rng.range(-d / 2, d / 2), { s: rng.range(0.4, 1.2), cast: false });
    }
    if (!edge) around(cc, rng.int(1, 2), 7, 10, (x, z) => { // sponges
      const ry = rng.next(); inst('sponge', GEO.box, MAT.toy, x, 1.4, z, { sx: 5, sy: 2.8, sz: 3, ry, color: 0xf0d84a }); inst('spongeTop', GEO.box, MAT.toy, x, 3.1, z, { sx: 5, sy: 0.6, sz: 3, ry, color: 0x3a8a3a });
      solid(x, z, 5, 5, 3.4); W.mapRects.push({ x, z, w: 5, d: 3, color: '#f0d84a' });
    });
    openSpot(cc, edge);
  };
  const decoBubble = std(0xd8f4ff, { transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.3, depthWrite: false });

  // --- Phantom Opera House
  const velvet = std(0x8a0a1a, { roughness: 1 });
  const operaCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.3) { // grand facade with gold columns and a marquee
      const { w, d, h } = house(cc, { wall: std(0x4a1a24, { roughness: 0.8 }), roof: 'dome', roofMat: goldTrim, h: rng.int(12, 16), win: neon(0xffd08a, 1.2), winN: 3, door: velvet, map: '#4a1a24' });
      for (let k = 0; k < 4; k++) { const x = cc.x - w / 2 + 1.5 + k * ((w - 3) / 3); inst('opCol', GEO.cyl, marble, x, h / 2, cc.z - d / 2 - 1.5, { sx: 0.6, sy: h, sz: 0.6 }); solid(x, cc.z - d / 2 - 1.5, 1.2, 1.2, h); }
      box(w + 2, 1.6, 0.5, neon(0xffc83a, 1.6), cc.x, h * 0.55, cc.z - d / 2 - 2.6, false);
      for (let k = 0; k < 12; k++) inst('marquee', GEO.sphere, MAT.bulb, cc.x - w / 2 + (k + 0.5) * (w / 12), h * 0.55 - 1.1, cc.z - d / 2 - 2.85, { s: 0.25, color: 0xfff0b0, cast: false });
      return;
    }
    if (r < 0.45 && !edge) { // rows of red velvet seats facing nowhere
      for (let row = 0; row < 3; row++) {
        const z = cc.z - 6 + row * 4.5;
        for (let k = -4; k <= 4; k++) { inst('seat', GEO.box, velvet, cc.x + k * 1.6, 0.8, z, { sx: 1.3, sy: 0.6, sz: 1.3 }); inst('seatBack', GEO.box, velvet, cc.x + k * 1.6, 1.6, z + 0.6, { sx: 1.3, sy: 1.8, sz: 0.3 }); }
        solid(cc.x, z + 0.2, 14.4, 1.6, 2.5);
      }
      W.mapRects.push({ x: cc.x, z: cc.z - 1.5, w: 14.4, d: 11, color: '#8a0a1a' });
    } else if (r < 0.56 && !edge) { // a stage with tall red curtains
      const z = cc.z + 5;
      box(16, 1.6, 8, std(0x5a3a20, { roughness: 0.8 }), cc.x, 0.8, z); solid(cc.x, z, 16, 8, 1.6);
      for (const sx of [-6.5, 6.5]) { box(3, 14, 0.6, velvet, cc.x + sx, 8.6, z + 3.6); solid(cc.x + sx, z + 3.6, 3, 0.6, 15); }
      box(16, 2, 0.6, velvet, cc.x, 15, z + 3.6, false);
      glowDecal(cc.x, z, 7, 0xffd08a, 0.4);
      W.mapRects.push({ x: cc.x, z, w: 16, d: 8, color: '#5a3a20' });
    } else if (r < 0.64) { bushRing(cc, i, j, () => rng.pick([0x3a1a1a, 0x2a2a1a])); return; }
    else if (r < 0.7) { speedPad(cc); W.patrol.push(cc); return; }
    if (!edge && rng.next() < 0.5) { // a chandelier hanging in the air
      const ch = new THREE.Group(); ch.position.set(cc.x + rng.range(-5, 5), rng.range(15, 20), cc.z + rng.range(-5, 5)); group.add(ch);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.2, 6, 24), goldTrim); ring.rotation.x = Math.PI / 2; ch.add(ring);
      for (let k = 0; k < 10; k++) { const a = (k / 10) * 6.28, c = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 4), neon(0xffd08a, 3)); c.position.set(Math.cos(a) * 2.6, 0.4, Math.sin(a) * 2.6); ch.add(c); }
      const chain = new THREE.Mesh(BOX(0.1, 12, 0.1), std(0x3a3020)); chain.position.y = 6; ch.add(chain);
      W.spinners.push({ obj: ch, axis: 'y', speed: 0.15 });
      glowDecal(ch.position.x, ch.position.z, 8, 0xffd08a, 0.2);
    }
    openSpot(cc, edge);
  };
  const backstageCell = (cc, i, j, edge) => {
    if (!edge) around(cc, rng.int(2, 3), 6, 10, (x, z) => {
      const t = rng.next();
      if (t < 0.35) { // costume rack
        inst('rackBar', GEO.box, MAT.metal, x, 5, z, { sx: 6, sy: 0.15, sz: 0.15, color: 0x8a8a90 });
        for (const sx of [-3, 3]) inst('rackLeg', GEO.box, MAT.metal, x + sx, 2.5, z, { sx: 0.15, sy: 5, sz: 0.15, color: 0x8a8a90 });
        for (let k = 0; k < 6; k++) inst('costume', GEO.box, MAT.toy, x - 2.5 + k, 3.3, z, { sx: 0.8, sy: 3.2, sz: 1.2, color: rng.pick([0x8a1a3a, 0x1a3a8a, 0xd8b83a, 0x3a8a3a, 0x1a1a1a]) });
        solid(x, z, 6.4, 1.4, 5); W.mapRects.push({ x, z, w: 6.4, d: 1.4, color: '#8a1a3a' });
      } else if (t < 0.65) { // makeup mirror ringed with bulbs
        box(4, 5, 0.4, std(0x3a2a1a), x, 4.5, z);
        box(3.2, 4.2, 0.1, std(0xc8d8e8, { metalness: 1, roughness: 0.05 }), x, 4.5, z - 0.25, false);
        for (let k = 0; k < 10; k++) { const a = (k / 10) * 6.28; inst('mirrorBulb', GEO.sphere, MAT.bulb, x + Math.cos(a) * 2.1, 4.5 + Math.sin(a) * 2.6, z - 0.3, { s: 0.22, color: 0xfff0c0, cast: false }); }
        inst('mirrorLeg', GEO.box, MAT.bark, x, 1, z, { sx: 0.4, sy: 2, sz: 0.4 });
        solid(x, z, 4, 1, 7);
      } else { // stacked prop crates
        const s = rng.range(3, 4.5); box(s, s, s, crateMat, x, s / 2, z); if (rng.next() < 0.5) box(s * 0.8, s * 0.8, s * 0.8, crateMat2, x, s + s * 0.4, z);
        solid(x, z, s, s, s * 1.8); W.mapRects.push({ x, z, w: s, d: s, color: '#6b4c2e' });
      }
    });
    if (rng.next() < 0.5) { const x = cc.x + rng.range(-6, 6), z = cc.z + rng.range(-6, 6), y = rng.range(10, 18); inst('sandbag', GEO.sphere, MAT.hay, x, y, z, { sx: 1, sy: 1.4, sz: 1 }); inst('rope', GEO.box, MAT.bark, x, y + 8, z, { sx: 0.08, sy: 16, sz: 0.08, cast: false }); }
    openSpot(cc, edge);
  };
  const ballroomCell = (cc, i, j, edge) => {
    for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) inst('tile', GEO.box, MAT.stone, cc.x - 9.75 + a * 6.5, 0.05, cc.z - 9.75 + b * 6.5, { sx: 6.5, sy: 0.08, sz: 6.5, color: (a + b + i + j) % 2 ? 0x1a1a1a : 0xe8e0d0, cast: false });
    if (!edge && rng.next() < 0.5) for (const [ox, oz] of [[-9, -9], [9, 9]]) { inst('bPillar', GEO.cyl, marble, cc.x + ox, 7, cc.z + oz, { sx: 1.1, sy: 14, sz: 1.1 }); inst('bCap', GEO.box, goldTrim, cc.x + ox, 14.3, cc.z + oz, { sx: 2.8, sy: 0.6, sz: 2.8 }); solid(cc.x + ox, cc.z + oz, 2.2, 2.2, 14); }
    if (!edge && rng.next() < 0.5) { // two dancers that never stop waltzing
      const d = new THREE.Group(); d.position.set(cc.x + rng.range(-4, 4), 0, cc.z + rng.range(-4, 4)); group.add(d);
      for (const s of [-1, 1]) {
        const body = new THREE.Mesh(new THREE.ConeGeometry(1.4, 5, 12), std(s < 0 ? 0x8a1a3a : 0x14141a)); body.position.set(s * 0.9, 2.5, 0); body.castShadow = true; d.add(body);
        const hd = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 8), std(0xf0ece4)); hd.position.set(s * 0.9, 5.5, 0); d.add(hd);
      }
      W.spinners.push({ obj: d, axis: 'y', speed: 0.8 });
      solid(d.position.x, d.position.z, 4, 4, 6);
    }
    openSpot(cc, edge);
  };

  // --- Dragon's Peak
  const keepStone = std(0x3a3436, { roughness: 1, flatShading: true });
  const banner = (x, y, z, ry) => { const b = box(2.4, 6, 0.1, cloth(0x8a1a1a), x, y, z, false); b.rotation.y = ry; inst('bannerGold', GEO.box, MAT.gold, x, y - 1, z, { sx: 0.8, sy: 0.8, sz: 0.15, ry, cast: false }); };
  const cloth = (c) => std(c, { roughness: 1, side: THREE.DoubleSide });
  const brazier = (x, z) => { inst('brazier', GEO.cyl, MAT.metal, x, 1.6, z, { sx: 0.9, sy: 3.2, sz: 0.9, color: 0x3a3a3a }); fire(x, z, 3.4, 0.8); solid(x, z, 1.8, 1.8, 3.4); };
  const dragonkeepCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.3) { // dark tower with banners
      const R = rng.range(5, 7), h = rng.range(20, 34);
      meshAt(new THREE.CylinderGeometry(R, R * 1.15, h, 10), keepStone, cc.x, h / 2, cc.z);
      for (let k = 0; k < 8; k++) { const a = (k / 8) * 6.28; box(1.4, 1.6, 1.4, keepStone, cc.x + Math.cos(a) * R, h + 0.8, cc.z + Math.sin(a) * R); }
      for (let k = 0; k < 3; k++) { const a = k * 2.1; banner(cc.x + Math.sin(a) * (R + 0.1), h * 0.6, cc.z + Math.cos(a) * (R + 0.1), a); }
      for (let k = 0; k < 4; k++) box(0.6, 1.6, 0.2, neon(0xff8a2a, 1.6), cc.x + Math.sin(k * 1.6) * R, 6 + k * 5, cc.z - Math.cos(k * 1.6) * R, false).rotation.y = -k * 1.6;
      solid(cc.x, cc.z, R * 2, R * 2, h);
      W.mapRects.push({ x: cc.x, z: cc.z, w: R * 2, d: R * 2, color: '#3a3436', round: true });
      return;
    }
    if (r < 0.44 && !edge) { // broken wall with a banner and braziers
      const z = cc.z + rng.pick([-1, 1]) * 6;
      box(C - 8, rng.range(6, 10), 2.4, keepStone, cc.x, 4, z);
      for (let k = 0; k < 5; k++) { const b = box(rng.range(1, 3), rng.range(1, 2), rng.range(1, 2), keepStone, cc.x + rng.range(-8, 8), 0.6, z + rng.range(-3, 3)); b.rotation.y = rng.next(); }
      banner(cc.x, 5, z - 1.3, 0);
      brazier(cc.x - 6, cc.z); brazier(cc.x + 6, cc.z);
      solid(cc.x, z, C - 8, 2.4, 9);
      W.mapRects.push({ x: cc.x, z, w: C - 8, d: 2.4, color: '#3a3436' });
      openSpot(cc, edge); return;
    }
    if (r < 0.54 && !edge) { // the skull of a dragon that lost
      const x = cc.x + rng.pick([-1, 1]) * 5, z = cc.z + rng.pick([-1, 1]) * 5, sk = new THREE.Group(); sk.position.set(x, 0, z); sk.rotation.y = rng.next() * 6; group.add(sk);
      meshAt(new THREE.SphereGeometry(3.5, 12, 10), MAT.boneM, 0, 3, 0, sk).scale.set(1, 0.8, 1.2);
      meshAt(BOX(3.6, 2.2, 5), MAT.boneM, 0, 2, 4.6, sk);
      for (const s of [-1, 1]) { const hn = meshAt(new THREE.ConeGeometry(0.7, 5, 6), MAT.boneM, s * 2.2, 5.5, -2, sk); hn.rotation.set(-0.8, 0, -s * 0.4); meshAt(new THREE.SphereGeometry(0.8, 8, 6), new THREE.MeshBasicMaterial({ color: 0x050505 }), s * 1.4, 3.6, 3.2, sk); }
      solid(x, z, 7, 7, 6);
      W.mapRects.push({ x, z, w: 7, d: 7, color: '#e8dcc8', round: true });
      openSpot(cc, edge); return;
    }
    if (r < 0.62) { bushRing(cc, i, j, () => rng.pick([0x2a2a1a, 0x3a2a1a])); return; }
    if (r < 0.68) { speedPad(cc); W.patrol.push(cc); return; }
    if (!edge && rng.next() < 0.6) brazier(cc.x + 8, cc.z - 8);
    openSpot(cc, edge);
  };
  const goldhoardCell = (cc, i, j, edge) => {
    if (!edge) around(cc, rng.int(2, 4), 6, 10, (x, z) => {
      const t = rng.next();
      if (t < 0.45) { const R = rng.range(2.5, 4.5); inst('coinPile', GEO.dome, MAT.gold, x, 0, z, { sx: R, sy: R * 0.6, sz: R }); solid(x, z, R * 1.4, R * 1.4, R * 0.55); W.mapRects.push({ x, z, w: R * 2, d: R * 2, color: '#ffc83a', round: true }); }
      else if (t < 0.75) { // treasure chest, lid open, glowing inside
        const ry = rng.next() * 6;
        inst('chest', GEO.box, MAT.bark, x, 1.2, z, { sx: 4, sy: 2.4, sz: 2.6, ry, color: 0x6a3a1a });
        inst('chestGlow', GEO.box, MAT.gold, x, 2.45, z, { sx: 3.6, sy: 0.2, sz: 2.2, ry, cast: false });
        glowDecal(x, z, 4, 0xffc83a, 0.45);
        solid(x, z, 4, 4, 2.6);
      } else { inst('swordBlade', GEO.box, MAT.metal, x, 2.4, z, { sx: 0.3, sy: 4.8, sz: 0.1, rz: rng.range(-0.3, 0.3), color: 0xc8ccd8 }); inst('swordGuard', GEO.box, MAT.gold, x, 4.6, z, { sx: 1.4, sy: 0.25, sz: 0.25 }); }
    });
    for (let k = 0; k < 6; k++) inst('gem', GEO.sphere, MAT.bulb, cc.x + rng.range(-10, 10), 0.4, cc.z + rng.range(-10, 10), { s: 0.4, color: rng.pick([0xff2a4a, 0x2aff8a, 0x3a8aff, 0xc83aff]), cast: false });
    openSpot(cc, edge);
  };
  const cragsCell = (cc, i, j, edge) => {
    if (!edge) around(cc, rng.int(2, 4), 6.5, 10, (x, z) => { const h = rng.range(12, 30), r0 = rng.range(1.8, 3.2); inst('crag', GEO.cone6, keepStone, x, h / 2, z, { sx: r0, sy: h, sz: r0, ry: rng.next() * 6, rx: rng.range(-0.08, 0.08) }); solid(x, z, r0 * 1.6, r0 * 1.6, h); W.mapRects.push({ x, z, w: r0 * 2, d: r0 * 2, color: '#463e3a', round: true }); });
    for (let k = 0; k < 4; k++) inst('pebble', GEO.sphere, rubbleMat, cc.x + rng.range(-10, 10), 0.3, cc.z + rng.range(-10, 10), { s: rng.range(0.4, 1), color: 0x5a5250, cast: false });
    openSpot(cc, edge);
  };

  // --- Moonlit Shrine
  const shrineRed = std(0xc0281a, { roughness: 0.6 }), roofDark = std(0x1a1a24, { roughness: 0.6 });
  const stoneLantern = (x, z) => { inst('slBase', GEO.box, MAT.stone, x, 1, z, { sx: 1.2, sy: 2, sz: 1.2, color: 0x8a8a84 }); inst('slLight', GEO.box, MAT.bulb, x, 2.6, z, { sx: 1.1, sy: 1.1, sz: 1.1, color: 0xffb06a, cast: false }); inst('slTop', GEO.cone, MAT.stone, x, 3.6, z, { sx: 1.4, sy: 1, sz: 1.4, color: 0x8a8a84 }); glowDecal(x, z, 4, 0xffa05a, 0.35); solid(x, z, 1.4, 1.4, 4); };
  const shrineCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.3) { // a three-tier pagoda
      let w = rng.range(10, 12), y = 0;
      for (let t = 0; t < 3; t++) {
        const h = 5 - t * 0.6;
        box(w, h, w, std(t % 2 ? 0x2a1a14 : 0xd8c8a8), cc.x, y + h / 2, cc.z);
        const rf = meshAt(new THREE.ConeGeometry(w * 0.95, 2.4, 4), roofDark, cc.x, y + h + 1.2, cc.z); rf.rotation.y = Math.PI / 4;
        box(1.8, 1.2, 0.2, neon(0xffb06a, 1.4), cc.x, y + h * 0.5, cc.z - w / 2 - 0.1, false);
        y += h + 1.6; w *= 0.75;
      }
      inst('spireTop', GEO.cyl, MAT.gold, cc.x, y + 2, cc.z, { sx: 0.2, sy: 4, sz: 0.2 });
      solid(cc.x, cc.z, 11, 11, y);
      W.mapRects.push({ x: cc.x, z: cc.z, w: 11, d: 11, color: '#c0281a' });
      return;
    }
    if (r < 0.42 && !edge) { // a tall red gate across the path
      const alongX = rng.next() < 0.5, g = new THREE.Group(); g.position.set(cc.x, 0, cc.z); g.rotation.y = alongX ? 0 : Math.PI / 2; group.add(g);
      for (const s of [-1, 1]) { meshAt(new THREE.CylinderGeometry(0.6, 0.7, 12, 10), shrineRed, s * 5, 6, 0, g); solid(cc.x + (alongX ? s * 5 : 0), cc.z + (alongX ? 0 : s * 5), 1.4, 1.4, 12); }
      meshAt(BOX(14, 1, 1.2), shrineRed, 0, 10, 0, g); meshAt(BOX(16, 1, 1.6), roofDark, 0, 12, 0, g);
      W.mapRects.push({ x: cc.x, z: cc.z, w: alongX ? 12 : 1.4, d: alongX ? 1.4 : 12, color: '#c0281a' });
      stoneLantern(cc.x + 7, cc.z + 7);
      openSpot(cc, edge); return;
    }
    if (r < 0.52 && !edge) { // a string of paper lanterns between two poles
      const z = cc.z + rng.pick([-1, 1]) * 7;
      for (const sx of [-8, 8]) { inst('lanternPole', GEO.cyl, MAT.bark, cc.x + sx, 4.5, z, { sx: 0.25, sy: 9, sz: 0.25 }); solid(cc.x + sx, z, 0.8, 0.8, 9); }
      for (let k = 0; k < 7; k++) { const x = cc.x - 6 + k * 2, y = 8 - Math.sin((k / 6) * Math.PI) * 1.4; inst('paperL', GEO.sphere, MAT.bulb, x, y, z, { sx: 0.7, sy: 0.95, sz: 0.7, color: rng.pick([0xff5a2a, 0xffb03a, 0xff3a5a]), cast: false }); }
      glowDecal(cc.x, z, 9, 0xff7a3a, 0.25);
      openSpot(cc, edge); return;
    }
    if (r < 0.6) { bushRing(cc, i, j, () => rng.pick([0x2a5a2a, 0xd88ab0])); return; }
    if (r < 0.66) { speedPad(cc); W.patrol.push(cc); return; }
    if (!edge) stoneLantern(cc.x + rng.pick([-1, 1]) * 8, cc.z + rng.pick([-1, 1]) * 8);
    openSpot(cc, edge);
  };
  const blossomsCell = (cc, i, j, edge) => {
    if (!edge) around(cc, rng.int(2, 3), 6.5, 10, (x, z) => {
      const h = rng.range(7, 10);
      inst('bTrunk', GEO.trunk, MAT.bark, x, h / 2, z, { sx: 0.8, sy: h, sz: 0.8, color: 0x3a2a24, rz: rng.range(-0.15, 0.15) });
      for (let k = 0; k < 6; k++) inst('blossom', GEO.sphere, MAT.alienCap, x + rng.range(-3, 3), h + rng.range(-1, 2), z + rng.range(-3, 3), { s: rng.range(2, 3.2), color: rng.pick([0xffb0d0, 0xff9ac0, 0xffd0e0]) });
      glowDecal(x, z, 6, 0xff9ac0, 0.2);
      solid(x, z, 1.6, 1.6, h);
      W.mapRects.push({ x, z, w: 8, d: 8, color: '#ffb0d0', round: true });
    });
    openSpot(cc, edge);
  };
  const bambooCell = (cc, i, j, edge) => {
    if (!edge) for (let k = 0; k < rng.int(14, 24); k++) {
      const a = rng.next() * 6.3, rr = rng.range(5, 12), x = cc.x + Math.cos(a) * rr, z = cc.z + Math.sin(a) * rr, h = rng.range(14, 24);
      inst('bamboo', GEO.cyl6, MAT.pine, x, h / 2, z, { sx: 0.35, sy: h, sz: 0.35, rx: rng.range(-0.05, 0.05), rz: rng.range(-0.05, 0.05), color: rng.pick([0x5a9a3a, 0x6aaa4a, 0x4a8a2a]) });
      for (let n = 1; n < 4; n++) inst('bambooJoint', GEO.cyl6, MAT.pine, x, (h * n) / 4, z, { sx: 0.42, sy: 0.25, sz: 0.42, color: 0x3a6a2a, cast: false });
      inst('bambooLeaf', GEO.box, MAT.pine, x + 0.8, h - 1, z, { sx: 2, sy: 0.08, sz: 0.5, ry: rng.next() * 6, rz: -0.4, color: 0x4a8a2a, cast: false });
      solid(x, z, 0.8, 0.8, h);
    }
    W.mapRects.push({ x: cc.x, z: cc.z, w: C - 4, d: C - 4, color: '#3a6a2a', round: true });
    openSpot(cc, edge);
  };

  // --- Construction Rooftops
  const steelOrange = std(0xd86a1a, { metalness: 0.6, roughness: 0.45 });
  const rooftopsCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.28) { // stairwell hut with an antenna mast on top
      const { w, d, h } = house(cc, { wall: std(0x5a5a62, { roughness: 0.9 }), roof: 'flat', roofMat: std(0x3a3a40), w: rng.int(8, 11), d: rng.int(8, 10), h: rng.int(6, 8), door: std(0x2a2a30), win: neon(0xffd08a, 1), winN: 1, map: '#5a5a62' });
      inst('mast', GEO.box, MAT.metal, cc.x + w / 4, h + 8, cc.z, { sx: 0.4, sy: 16, sz: 0.4, color: 0x8a8a90 });
      box(1, 1, 1, W.blinkMat, cc.x + w / 4, h + 16.5, cc.z, false);
      return;
    }
    if (r < 0.42 && !edge) { // water tank on legs
      const x = cc.x + rng.pick([-1, 1]) * 6, z = cc.z + rng.pick([-1, 1]) * 6;
      for (const [ox, oz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) inst('tankLeg', GEO.box, MAT.metal, x + ox, 4, z + oz, { sx: 0.4, sy: 8, sz: 0.4, color: 0x5a5a62 });
      meshAt(new THREE.CylinderGeometry(3.4, 3.4, 6, 14), std(0x5a4a3a, { roughness: 1 }), x, 11, z);
      meshAt(new THREE.ConeGeometry(3.8, 2.4, 14), std(0x3a3a40), x, 15.2, z);
      solid(x, z, 5, 5, 14);
      W.mapRects.push({ x, z, w: 7, d: 7, color: '#5a4a3a', round: true });
    } else if (r < 0.58 && !edge) { // rooftop AC units, fans spinning
      around(cc, rng.int(2, 3), 6, 9.5, (x, z) => {
        inst('acUnit', GEO.box, MAT.metal, x, 1.4, z, { sx: 3.6, sy: 2.8, sz: 3.6, color: 0xb0b4bc });
        const fan = new THREE.Group(); fan.position.set(x, 2.9, z); group.add(fan);
        for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(BOX(2.8, 0.06, 0.5), std(0x2a2a2a)); b.rotation.y = (k / 3) * Math.PI; fan.add(b); }
        W.spinners.push({ obj: fan, axis: 'y', speed: 6 });
        solid(x, z, 3.6, 3.6, 2.9);
        W.mapRects.push({ x, z, w: 3.6, d: 3.6, color: '#b0b4bc' });
      });
    } else if (r < 0.66) { speedPad(cc); W.patrol.push(cc); return; }
    else if (!edge && rng.next() < 0.6) { const x = cc.x + rng.range(-6, 6), z = cc.z + rng.range(-6, 6); box(5, 0.6, 5, neon(0xffe0a0, 1.1), x, 0.3, z, false); glowDecal(x, z, 6, 0xffe0a0, 0.3); } // skylight
    openSpot(cc, edge);
  };
  const constructionCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.3) { // open steel frame you can run through
      const s = 9, hgt = rng.int(2, 3) * 6;
      for (const [ox, oz] of [[-s, -s], [s, -s], [-s, s], [s, s]].map(([a, b]) => [a / 1.3, b / 1.3])) { inst('girderV', GEO.box, steelOrange, cc.x + ox, hgt / 2, cc.z + oz, { sx: 0.8, sy: hgt, sz: 0.8 }); solid(cc.x + ox, cc.z + oz, 1, 1, hgt); }
      for (let y = 6; y <= hgt; y += 6) for (const [ox, oz, w, d] of [[0, -s / 1.3, (2 * s) / 1.3, 0.6], [0, s / 1.3, (2 * s) / 1.3, 0.6], [-s / 1.3, 0, 0.6, (2 * s) / 1.3], [s / 1.3, 0, 0.6, (2 * s) / 1.3]]) inst('girderH', GEO.box, steelOrange, cc.x + ox, y, cc.z + oz, { sx: w + 0.1, sy: 0.7, sz: d + 0.1 });
      W.mapRects.push({ x: cc.x, z: cc.z, w: 14, d: 14, color: '#d86a1a' });
    } else if (r < 0.4 && !edge) { // a crane, its arm slowly swinging
      const x = cc.x + 6, z = cc.z + 6, h = 34;
      box(2.4, h, 2.4, Object.assign(std(0xe8b81a), { wireframe: true }), x, h / 2, z);
      const jib = new THREE.Group(); jib.position.set(x, h, z); group.add(jib);
      const arm = new THREE.Mesh(BOX(26, 1.4, 1.4), Object.assign(std(0xe8b81a), { wireframe: true })); arm.position.x = 8; jib.add(arm);
      const hook = new THREE.Mesh(BOX(0.1, 10, 0.1), std(0x2a2a2a)); hook.position.set(18, -5, 0); jib.add(hook);
      const load = new THREE.Mesh(BOX(3, 1, 1), steelOrange); load.position.set(18, -10, 0); jib.add(load);
      W.spinners.push({ obj: jib, axis: 'y', speed: 0.1 });
      solid(x, z, 2.6, 2.6, h);
    } else if (r < 0.55 && !edge) { // stacked pipes
      const z = cc.z + rng.pick([-1, 1]) * 6;
      for (let k = 0; k < 3; k++) inst('bigPipe', GEO.cyl, MAT.metal, cc.x, 1 + (k === 2 ? 1.7 : 0), z + (k === 2 ? 0 : k * 2 - 1), { sx: 1, sy: 10, sz: 1, rz: Math.PI / 2, color: 0x6a6a72 });
      solid(cc.x, z, 10, 4, 3.5);
      W.mapRects.push({ x: cc.x, z, w: 10, d: 4, color: '#6a6a72' });
    }
    if (!edge) for (let k = 0; k < rng.int(2, 5); k++) { const x = cc.x + rng.range(-10, 10), z = cc.z + rng.range(-10, 10); inst('cone', GEO.cone, MAT.toy, x, 0.9, z, { sx: 0.6, sy: 1.8, sz: 0.6, color: 0xff6a1a, cast: false }); inst('coneBand', GEO.cyl, MAT.bulb, x, 1, z, { sx: 0.42, sy: 0.25, sz: 0.42, color: 0xffffff, cast: false }); }
    openSpot(cc, edge);
  };
  const ADS = [0xff3a8a, 0x3ad8ff, 0xffd23a, 0x8aff3a, 0xc83aff];
  const billboardsCell = (cc, i, j, edge) => {
    if (!edge && rng.next() < 0.6) { // a big glowing billboard with a smiling face that's too wide
      const x = cc.x + rng.range(-4, 4), z = cc.z + rng.pick([-1, 1]) * 6, col = rng.pick(ADS), bb = new THREE.Group(); bb.position.set(x, 0, z); bb.rotation.y = rng.range(-0.4, 0.4); group.add(bb);
      for (const s of [-1, 1]) meshAt(BOX(0.6, 10, 0.6), std(0x3a3a40, { metalness: 0.6 }), s * 5, 5, 0, bb);
      meshAt(BOX(13, 7, 0.4), std(0x14141a), 0, 13, 0, bb);
      meshAt(BOX(12, 6, 0.1), std(col, { emissive: col, emissiveIntensity: 0.8 }), 0, 13, -0.25, bb);
      for (const s of [-1, 1]) meshAt(new THREE.SphereGeometry(0.7, 10, 8), new THREE.MeshBasicMaterial({ color: 0x111111 }), s * 2, 14.2, -0.4, bb).scale.z = 0.2;
      for (let k = -5; k <= 5; k++) meshAt(BOX(0.45, 0.35, 0.1), new THREE.MeshBasicMaterial({ color: 0x111111 }), k * 0.5, 11.7 + k * k * 0.03, -0.35, bb);
      glowDecal(x, z, 10, col, 0.3);
      solid(x - 5, z, 1, 1, 10); solid(x + 5, z, 1, 1, 10);
      W.mapRects.push({ x, z, w: 13, d: 1, color: hex6(col) });
    } else if (!edge) lamp(cc.x + C / 2 - 4, cc.z + C / 2 - 4, neon(rng.pick(ADS), 2.6), rng.pick(ADS));
    if (!edge && rng.next() < 0.4) barrel(cc.x - 8, cc.z + 8);
    openSpot(cc, edge);
  };

  // --- Aquarium After Dark
  const tankGlass = std(0x8ad8ff, { roughness: 0.02, metalness: 0.2, transparent: true, opacity: 0.25, emissive: 0x0a4a8a, emissiveIntensity: 0.5, depthWrite: false });
  const fishIn = (x, y, z, sx, sy, sz, n) => { for (let k = 0; k < n; k++) inst('fish', GEO.cone, MAT.bulb, x + rng.range(-sx, sx), y + rng.range(-sy, sy), z + rng.range(-sz, sz), { sx: 0.35, sy: 1, sz: 0.25, rz: Math.PI / 2, ry: rng.next() * 6, color: rng.pick([0xff8a1a, 0xffd23a, 0x3affd0, 0xff3a8a, 0x8a5aff]), cast: false }); };
  const aquariumCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.3) { // giant glass tank full of glowing fish
      const w = rng.range(12, 16), d = rng.range(8, 11), h = rng.range(9, 12);
      box(w, h, d, tankGlass, cc.x, h / 2, cc.z, false);
      box(w + 0.6, 0.8, d + 0.6, std(0x1a2a3a, { metalness: 0.6 }), cc.x, h + 0.4, cc.z); box(w + 0.6, 1, d + 0.6, std(0x1a2a3a, { metalness: 0.6 }), cc.x, 0.5, cc.z);
      fishIn(cc.x, h / 2, cc.z, w / 2 - 1, h / 2 - 1.5, d / 2 - 1, 14);
      for (let k = 0; k < 4; k++) inst('tankWeed', GEO.box, MAT.pine, cc.x + rng.range(-w / 2 + 1, w / 2 - 1), 3, cc.z + rng.range(-d / 2 + 1, d / 2 - 1), { sx: 0.4, sy: 5, sz: 0.2, color: 0x2a8a4a, cast: false });
      glowDecal(cc.x, cc.z, Math.max(w, d) * 0.7, 0x3ab8ff, 0.4);
      solid(cc.x, cc.z, w, d, h);
      W.mapRects.push({ x: cc.x, z: cc.z, w, d, color: '#3ab8ff' });
      return;
    }
    if (r < 0.42 && !edge) { // a glass tunnel you can run through, fish swimming over your head
      const alongX = rng.next() < 0.5, t = meshAt(new THREE.CylinderGeometry(6, 6, C, 20, 1, true, -Math.PI / 2, Math.PI), std(0x8ad8ff, { side: THREE.DoubleSide, transparent: true, opacity: 0.22, roughness: 0.02, emissive: 0x0a4a8a, emissiveIntensity: 0.6, depthWrite: false }), cc.x, 0, cc.z);
      t.rotation.set(0, alongX ? 0 : Math.PI / 2, Math.PI / 2); t.castShadow = false;
      fishIn(cc.x, 8, cc.z, alongX ? 10 : 3, 1, alongX ? 3 : 10, 10);
      for (const s of [-1, 1]) { const x = cc.x + (alongX ? 0 : s * 6), z = cc.z + (alongX ? s * 6 : 0); box(alongX ? C : 0.4, 1, alongX ? 0.4 : C, std(0x1a2a3a), x, 0.5, z); solid(x, z, alongX ? C : 0.5, alongX ? 0.5 : C, 1.5); }
      openSpot(cc, edge); return;
    }
    if (r < 0.52) { bushRing(cc, i, j, () => rng.pick([0x1a5a6a, 0x2a6a5a])); return; }
    if (r < 0.58) { speedPad(cc); W.patrol.push(cc); return; }
    if (rng.next() < 0.5) lamp(cc.x + C / 2 - 4, cc.z + C / 2 - 4, neon(0x6ae8ff, 2.6), 0x3ad8ff);
    openSpot(cc, edge);
  };
  const tanksCell = (cc, i, j, edge) => {
    if (!edge) around(cc, rng.int(1, 3), 6.5, 9.5, (x, z) => { // tall round tanks with jellyfish drifting inside
      const R = rng.range(2.5, 3.8), h = rng.range(12, 20), col = rng.pick([0xff6ae8, 0x6affff, 0xffb03a]);
      inst('tankC', GEO.cyl, tankGlass, x, h / 2, z, { sx: R, sy: h, sz: R, cast: false });
      inst('tankCap', GEO.cyl, MAT.metal, x, h + 0.4, z, { sx: R + 0.3, sy: 0.8, sz: R + 0.3, color: 0x1a2a3a });
      for (let k = 0; k < 3; k++) { const y = rng.range(3, h - 2); inst('jellyB', GEO.dome, MAT.bulb, x + rng.range(-R / 2, R / 2), y, z + rng.range(-R / 2, R / 2), { sx: 0.8, sy: 0.6, sz: 0.8, color: col, cast: false }); }
      glowDecal(x, z, R * 2, col, 0.4);
      solid(x, z, R * 2, R * 2, h);
      W.mapRects.push({ x, z, w: R * 2, d: R * 2, color: hex6(col), round: true });
    });
    openSpot(cc, edge);
  };
  const tideWater = std(0x2a7a8a, { roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.8 });
  const starfish = (x, z, col) => { for (let k = 0; k < 5; k++) inst('starArm', GEO.box, MAT.toy, x + Math.cos(k * 1.257) * 0.5, 0.2, z + Math.sin(k * 1.257) * 0.5, { sx: 1, sy: 0.2, sz: 0.35, ry: -k * 1.257, color: col, cast: false }); };
  const touchpoolsCell = (cc, i, j, edge) => {
    if (!edge && rng.next() < 0.65) { // a shallow pool: it slows you down
      const w = rng.range(10, 15), d = rng.range(8, 13);
      pool(cc.x, cc.z, w, d, 'water', tideWater, '#2a7a8a', 0x3ad8ff);
      for (const [x, z, ww, dd] of [[cc.x, cc.z - d / 2 - 0.4, w + 1.6, 0.8], [cc.x, cc.z + d / 2 + 0.4, w + 1.6, 0.8]]) box(ww, 0.9, dd, std(0x5a5a5a, { roughness: 1 }), x, 0.45, z);
      for (let k = 0; k < 4; k++) starfish(cc.x + rng.range(-w / 2 + 1, w / 2 - 1), cc.z + rng.range(-d / 2 + 1, d / 2 - 1), rng.pick([0xff6a1a, 0xff3a6a, 0xc83aff]));
      for (let k = 0; k < 3; k++) inst('anemone', GEO.sphere, MAT.bulb, cc.x + rng.range(-w / 2, w / 2), 0.4, cc.z + rng.range(-d / 2, d / 2), { sx: 0.6, sy: 0.5, sz: 0.6, color: 0x6affd0, cast: false });
    } else if (!edge) around(cc, 2, 6, 10, (x, z) => { const s = rng.range(1.5, 2.6); inst('tideRock', GEO.sphere, rubbleMat, x, s * 0.5, z, { sx: s * 1.3, sy: s, sz: s, color: 0x4a4a48 }); solid(x, z, s * 2, s * 2, s); starfish(x + 2, z + 2, 0xff6a1a); });
    openSpot(cc, edge);
  };

  // --- Mad Science Lab
  const labWhite = std(0xd8dcd8, { roughness: 0.8 }), goo = neon(0x8aff3a, 1.8);
  const teslaCoil = (x, z) => {
    inst('teslaBase', GEO.cyl, MAT.metal, x, 1, z, { sx: 1.8, sy: 2, sz: 1.8, color: 0x3a3a40 });
    for (let k = 0; k < 8; k++) inst('teslaCoilR', GEO.cyl, MAT.metal, x, 2.5 + k * 0.9, z, { sx: 0.9, sy: 0.4, sz: 0.9, color: 0xb86a3a });
    const top = meshAt(new THREE.TorusGeometry(1.8, 0.6, 8, 20), std(0xc0c4cc, { metalness: 0.9, roughness: 0.2 }), x, 10, z); top.rotation.x = Math.PI / 2;
    const arcs = new THREE.Group(); arcs.position.set(x, 10, z); group.add(arcs);
    for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(BOX(0.12, 0.12, 5), neon(0xa0e8ff, 3)); b.position.set(Math.cos(k * 1.57) * 2.5, rng.range(-0.5, 0.5), Math.sin(k * 1.57) * 2.5); b.rotation.set(rng.range(-0.6, 0.6), k * 1.57, rng.range(-0.4, 0.4)); arcs.add(b); }
    W.spinners.push({ obj: arcs, axis: 'y', speed: rng.range(3, 6) });
    glowDecal(x, z, 9, 0xa0e8ff, 0.35);
    solid(x, z, 3.6, 3.6, 11);
    W.mapRects.push({ x, z, w: 3.6, d: 3.6, color: '#a0e8ff', round: true });
  };
  const vat = (x, z, R = 2.6) => {
    inst('vat', GEO.cyl, MAT.metal, x, 2.5, z, { sx: R, sy: 5, sz: R, color: 0x5a6a5a });
    inst('vatGoo', GEO.cyl, goo, x, 5.05, z, { sx: R * 0.9, sy: 0.12, sz: R * 0.9, cast: false });
    for (let k = 0; k < 3; k++) inst('gooBubble', GEO.sphere, goo, x + rng.range(-R / 2, R / 2), 5.4 + k * 0.3, z + rng.range(-R / 2, R / 2), { s: rng.range(0.25, 0.5), cast: false });
    glowDecal(x, z, R * 2, 0x8aff3a, 0.3);
    solid(x, z, R * 2, R * 2, 5.2);
    W.mapRects.push({ x, z, w: R * 2, d: R * 2, color: '#8aff3a', round: true });
  };
  const labCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.3) {
      const { w, h } = house(cc, { wall: labWhite, roof: 'flat', roofMat: std(0x5a5a60), h: rng.int(9, 13), win: neon(0x8aff3a, 1.4), winN: 4, door: std(0x3a3a40), map: '#d8dcd8' });
      const dish = meshAt(new THREE.SphereGeometry(2.6, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), labWhite, cc.x + w / 4, h + 2.5, cc.z); dish.rotation.x = -2.2;
      W.spinners.push({ obj: dish, axis: 'y', speed: 0.3 });
      return;
    }
    if (r < 0.44 && !edge) { // glass pods with something floating inside
      around(cc, 2, 6, 9, (x, z) => {
        inst('podGlass', GEO.cyl, std(0xb0ffb0, { transparent: true, opacity: 0.3, emissive: 0x3aff3a, emissiveIntensity: 0.6, depthWrite: false }), x, 4, z, { sx: 1.8, sy: 7, sz: 1.8, cast: false });
        inst('podThing', GEO.box, MAT.stone, x, 4, z, { sx: 1, sy: 3.4, sz: 0.6, color: 0x2a3a2a });
        for (const y of [0.4, 7.6]) inst('podCap', GEO.cyl, MAT.metal, x, y, z, { sx: 2, sy: 0.8, sz: 2, color: 0x3a3a40 });
        glowDecal(x, z, 4, 0x8aff3a, 0.4);
        solid(x, z, 3.6, 3.6, 8);
        W.mapRects.push({ x, z, w: 3.6, d: 3.6, color: '#8aff3a', round: true });
      });
      openSpot(cc, edge); return;
    }
    if (r < 0.54 && !edge) { // a humming generator with gauges
      const x = cc.x + rng.pick([-1, 1]) * 6, z = cc.z;
      box(5, 5, 8, std(0x3a4a3a, { metalness: 0.6, roughness: 0.4 }), x, 2.5, z);
      for (let k = 0; k < 3; k++) meshAt(new THREE.CylinderGeometry(0.6, 0.6, 0.1, 14), neon(k ? 0xffe03a : 0xff3a3a, 1.4), x - 2.55, 3.4, z - 2 + k * 2).rotation.z = Math.PI / 2;
      W.blinkMat && box(0.5, 0.5, 0.5, W.blinkMat, x, 5.3, z + 3, false);
      solid(x, z, 5, 8, 5);
      W.mapRects.push({ x, z, w: 5, d: 8, color: '#3a4a3a' });
      openSpot(cc, edge); return;
    }
    if (r < 0.62) { bushRing(cc, i, j, () => rng.pick([0x2a4a2a, 0x3a5a3a])); return; }
    if (r < 0.68) { speedPad(cc); W.patrol.push(cc); return; }
    if (!edge && rng.next() < 0.5) vat(cc.x + 8, cc.z - 8, 1.8);
    openSpot(cc, edge);
  };
  const vatsCell = (cc, i, j, edge) => {
    if (!edge) around(cc, rng.int(2, 3), 6.5, 10, (x, z) => vat(x, z, rng.range(2.2, 3.2)));
    if (!edge && rng.next() < 0.5) inst('labPipe', GEO.cyl, MAT.metal, cc.x, 7, cc.z, { sx: 0.5, sy: C, sz: 0.5, rz: Math.PI / 2, color: 0x6a6a72 });
    openSpot(cc, edge);
  };
  const teslafieldCell = (cc, i, j, edge) => {
    for (let k = 0; k < 4; k++) inst('floorPlate', GEO.box, MAT.metal, cc.x - 6.5 + (k % 2) * 13, 0.05, cc.z - 6.5 + (k >> 1) * 13, { sx: 12, sy: 0.08, sz: 12, color: 0x3a3e48, cast: false });
    if (!edge && rng.next() < 0.7) teslaCoil(cc.x + rng.pick([-1, 1]) * 7, cc.z + rng.pick([-1, 1]) * 7);
    openSpot(cc, edge);
  };

  // --- Carnivore Garden
  const greenGlass = std(0xb0ffc0, { roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.25, emissive: 0x1a4a1a, emissiveIntensity: 0.4, depthWrite: false });
  const flytrapPlant = (x, z, watch) => { // the jaws turn to follow you
    const h = rng.range(5, 8);
    inst('ftStem', GEO.cyl, MAT.pine, x, h / 2, z, { sx: 0.35, sy: h, sz: 0.35, color: 0x3a7a1a });
    for (let k = 0; k < 4; k++) inst('ftLeaf', GEO.box, MAT.pine, x + Math.cos(k * 1.57) * 1.5, 0.3, z + Math.sin(k * 1.57) * 1.5, { sx: 3, sy: 0.15, sz: 1, ry: -k * 1.57, color: 0x3a8a1a, cast: false });
    if (!watch) { // a still one: batched, so a whole bed of them stays cheap to draw
      inst('ftTop', GEO.dome, MAT.pine, x, h + 1.2, z, { sx: 1.8, sy: 1, sz: 2.1, rx: -0.5, color: 0x4a9a2a });
      inst('ftBot', GEO.dome, MAT.pine, x, h + 0.8, z, { sx: 1.8, sy: 1, sz: 2.1, rx: Math.PI + 0.5, color: 0x4a9a2a });
      inst('ftMouth', GEO.sphere, MAT.blood, x, h + 1, z + 0.3, { sx: 1.2, sy: 0.3, sz: 1.4, cast: false });
      solid(x, z, 2, 2, h + 2);
      W.mapRects.push({ x, z, w: 4, d: 4, color: '#4a9a2a', round: true });
      return;
    }
    const head = new THREE.Group(); head.position.set(x, h + 1, z); group.add(head);
    const outer = std(0x4a9a2a, { side: THREE.DoubleSide }), inner = neon(0xff2a4a, 0.9);
    for (const s of [-1, 1]) {
      const jaw = new THREE.Group(); jaw.rotation.x = s * 0.5; head.add(jaw);
      const shell = new THREE.Mesh(new THREE.SphereGeometry(1.8, 12, 6, 0, Math.PI * 2, s > 0 ? 0 : Math.PI / 2, Math.PI / 2), outer); shell.scale.set(1, 0.55, 1.2); shell.castShadow = true; jaw.add(shell);
      for (let k = 0; k < 6; k++) { const a = (k / 5) * Math.PI, t = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.8, 4), MAT.boneM); t.position.set(Math.cos(a) * 1.8, s * 0.3, Math.sin(a) * 2.1); t.rotation.x = s > 0 ? 0 : Math.PI; jaw.add(t); }
    }
    const tongue = new THREE.Mesh(new THREE.SphereGeometry(1.2, 10, 6), inner); tongue.scale.set(1, 0.3, 1.2); head.add(tongue);
    watcher(x, z, head, inner, 0xff2a4a, h + 2);
    W.mapRects.push({ x, z, w: 4, d: 4, color: '#4a9a2a', round: true });
  };
  const greenhouseCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.32) { // greenhouse full of plants
      const w = rng.range(12, 16), d = rng.range(9, 12), h = 7;
      box(w, h, d, greenGlass, cc.x, h / 2, cc.z, false);
      const roof = meshAt(new THREE.CylinderGeometry(d / 2, d / 2, w, 16, 1, true, -Math.PI / 2, Math.PI), greenGlass, cc.x, h, cc.z); roof.rotation.z = Math.PI / 2; roof.castShadow = false;
      for (const [x, z] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) inst('ghFrame', GEO.box, MAT.metal, cc.x + x, h / 2, cc.z + z, { sx: 0.3, sy: h, sz: 0.3, color: 0xe8e8e8 });
      for (let k = 0; k < 8; k++) inst('ghPlant', GEO.sphere, MAT.pine, cc.x + rng.range(-w / 2 + 1, w / 2 - 1), rng.range(1, 3), cc.z + rng.range(-d / 2 + 1, d / 2 - 1), { s: rng.range(1, 2), color: rng.pick([0x2a6a1a, 0x3a8a2a, 0x8a2a4a]) });
      solid(cc.x, cc.z, w, d, h + d / 2);
      W.mapRects.push({ x: cc.x, z: cc.z, w, d, color: '#b0ffc0' });
      return;
    }
    if (r < 0.44 && !edge) { // raised flower beds
      for (const sz of [-6, 6]) {
        box(14, 1.4, 3, std(0x5a3a20, { roughness: 1 }), cc.x, 0.7, cc.z + sz); solid(cc.x, cc.z + sz, 14, 3, 1.4);
        for (let k = 0; k < 9; k++) inst('bedFlower', GEO.sphere, MAT.bulb, cc.x - 6.4 + k * 1.6, 2, cc.z + sz + rng.range(-0.8, 0.8), { s: 0.5, color: rng.pick([0xff3a6a, 0xffe03a, 0xff8a1a, 0xc83aff]), cast: false });
      }
      W.mapRects.push({ x: cc.x, z: cc.z, w: 14, d: 15, color: '#5a3a20' });
      openSpot(cc, edge); return;
    }
    if (r < 0.52 && !edge && W.scarecrows.length < 12) { flytrapPlant(cc.x + rng.pick([-1, 1]) * 7, cc.z + rng.pick([-1, 1]) * 7, true); openSpot(cc, edge); return; }
    if (r < 0.62) { bushRing(cc, i, j, () => rng.pick([0x2a6a1a, 0x3a5a1a])); return; }
    if (r < 0.68) { speedPad(cc); W.patrol.push(cc); return; }
    if (!edge && rng.next() < 0.5) { const x = cc.x + 8, z = cc.z + 8; meshAt(new THREE.CylinderGeometry(1.6, 1.8, 3, 12), std(0x3a8a5a, { metalness: 0.5 }), x, 1.5, z); const sp = meshAt(new THREE.CylinderGeometry(0.2, 0.3, 4, 8), std(0x3a8a5a, { metalness: 0.5 }), x + 2.2, 3, z); sp.rotation.z = -0.9; solid(x, z, 3.4, 3.4, 3); } // giant watering can
    openSpot(cc, edge);
  };
  const flytrapsCell = (cc, i, j, edge) => {
    if (!edge) around(cc, rng.int(1, 2), 6.5, 9.5, (x, z) => flytrapPlant(x, z, W.scarecrows.length < 14));
    if (!edge && rng.next() < 0.5) { bushRing(cc, i, j, () => rng.pick([0x2a5a1a, 0x4a6a1a])); keyCandidates.push(cc); }
    else openSpot(cc, edge);
  };
  const brambleMat = std(0x2a1a14, { roughness: 1, flatShading: true });
  const thornsCell = (cc, i, j, edge) => {
    if (!edge) for (const side of [0, 1, 2, 3]) {
      if (rng.next() < 0.45) continue;
      const alongX = side < 2, off = (side % 2 ? 1 : -1) * (C / 2 - 2), len = C - 8, x = cc.x + (alongX ? 0 : off), z = cc.z + (alongX ? off : 0);
      box(alongX ? len : 2, 4.5, alongX ? 2 : len, brambleMat, x, 2.25, z);
      for (let k = 0; k < 10; k++) { const t = rng.range(-len / 2, len / 2); inst('thorn', GEO.cone, MAT.boneM, x + (alongX ? t : rng.pick([-1.1, 1.1])), rng.range(1, 4.2), z + (alongX ? rng.pick([-1.1, 1.1]) : t), { sx: 0.15, sy: 0.8, sz: 0.15, rx: rng.range(-1.5, 1.5), rz: rng.range(-1.5, 1.5), color: 0x8a6a4a, cast: false }); }
      for (let k = 0; k < 3; k++) { const t = rng.range(-len / 2, len / 2); inst('rose', GEO.sphere, MAT.blood, x + (alongX ? t : 0), 4.6, z + (alongX ? 0 : t), { s: 0.55, cast: false }); }
      solid(x, z, alongX ? len : 2, alongX ? 2 : len, 4.5);
      W.mapRects.push({ x, z, w: alongX ? len : 2, d: alongX ? 2 : len, color: '#2a1a14' });
    }
    openSpot(cc, edge);
  };

  // --- Boardwalk at Midnight
  const boardsMat = std(0x7a5a38, { roughness: 1 });
  const boardwalkCell = (cc, i, j, edge) => {
    box(C, 0.3, C, boardsMat, cc.x, 0.15, cc.z, false).receiveShadow = true;
    for (let k = 0; k < 8; k++) inst('boardGap', GEO.box, MAT.bulb, cc.x, 0.31, cc.z - C / 2 + k * (C / 8), { sx: C, sy: 0.02, sz: 0.12, color: 0x2a1a0a, cast: false });
    const r = edge ? 1 : rng.next();
    if (r < 0.28) { // seaside shop with a striped awning
      const { w, d, h } = house(cc, { wall: std(rng.pick([0x8ab0c8, 0xe8d8b8, 0xd88a8a]), { roughness: 0.8 }), roof: 'gable', roofMat: std(0x3a4a5a), h: rng.int(6, 8), win: neon(0xffe0a0, 1.2), winN: 2, door: std(0x2a3a4a), map: '#8ab0c8' });
      const aw = box(w, 0.3, 3.5, std(0xffffff, { map: stripeTex(rng.pick(['#e83a3a', '#3a8ae8', '#3ac85a']), '#f8f8f8', 10) }), cc.x, h * 0.7, cc.z - d / 2 - 1.6); aw.rotation.x = 0.35;
      return;
    }
    if (r < 0.36 && !edge && !W.lighthouse) { // a lighthouse, its lamp sweeping around
      W.lighthouse = true;
      const x = cc.x, z = cc.z, h = 30;
      for (let k = 0; k < 6; k++) meshAt(new THREE.CylinderGeometry(3.4 - k * 0.3 - 0.3, 3.4 - k * 0.3, h / 6, 16), std(k % 2 ? 0xc02a2a : 0xf0f0f0), x, k * (h / 6) + h / 12, z);
      meshAt(new THREE.CylinderGeometry(1.8, 1.8, 3, 12), std(0xfff0a0, { emissive: 0xffe08a, emissiveIntensity: 1.2, transparent: true, opacity: 0.9 }), x, h + 1.5, z);
      meshAt(new THREE.ConeGeometry(2.4, 2.4, 12), std(0x1a1a1a), x, h + 4.2, z);
      const lampG = new THREE.Group(); lampG.position.set(x, h + 1.5, z); group.add(lampG);
      for (const s of [-1, 1]) { const b = new THREE.Mesh(BOX(0.6, 0.6, 3), neon(0xffffd0, 4)); b.position.z = s * 2; lampG.add(b); }
      W.spinners.push({ obj: lampG, axis: 'y', speed: 1.2 });
      glowDecal(x, z, 12, 0xffe08a, 0.3);
      solid(x, z, 6.8, 6.8, h);
      W.mapRects.push({ x, z, w: 7, d: 7, color: '#c02a2a', round: true });
      return;
    }
    if (r < 0.46 && !edge) { // lifeguard tower on stilts
      const x = cc.x + rng.pick([-1, 1]) * 6, z = cc.z + rng.pick([-1, 1]) * 6;
      for (const [ox, oz] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) inst('ltLeg', GEO.box, MAT.bark, x + ox, 3, z + oz, { sx: 0.4, sy: 6, sz: 0.4, color: 0xf0f0f0 });
      box(4, 3, 4, std(0xe8d8a8), x, 7.5, z); box(4.6, 0.3, 4.6, std(0xc02a2a), x, 9.2, z);
      meshAt(BOX(1.4, 1.4, 0.1), new THREE.MeshBasicMaterial({ color: 0xc02a2a }), x, 7.6, z - 2.05);
      solid(x, z, 4, 4, 9.3);
      W.mapRects.push({ x, z, w: 4, d: 4, color: '#e8d8a8' });
    } else if (r < 0.54) { if (!edge) stringLights(cc.x - 9, cc.z + rng.range(-6, 6), cc.x + 9, cc.z + rng.range(-6, 6)); }
    else if (r < 0.6) { speedPad(cc); W.patrol.push(cc); return; }
    else if (!edge) { const z = cc.z + 8; inst('bench', GEO.box, MAT.bark, cc.x, 1, z, { sx: 5, sy: 0.3, sz: 1.4 }); inst('benchB', GEO.box, MAT.bark, cc.x, 1.8, z + 0.6, { sx: 5, sy: 1.2, sz: 0.2 }); solid(cc.x, z, 5, 1.4, 1.2); }
    openSpot(cc, edge);
  };
  const tidepoolsCell = (cc, i, j, edge) => {
    if (!edge && rng.next() < 0.6) {
      const x = cc.x + rng.range(-3, 3), z = cc.z + rng.range(-3, 3), w = rng.range(9, 14), d = rng.range(9, 14);
      pool(x, z, w, d, 'water', tideWater, '#2a7a8a', 0x2ab8d8);
      for (let k = 0; k < 3; k++) starfish(x + rng.range(-w / 2, w / 2), z + rng.range(-d / 2, d / 2), rng.pick([0xff6a1a, 0xffb03a]));
    }
    if (!edge) around(cc, rng.int(1, 3), 7, 10, (x, z) => { const s = rng.range(1.4, 2.4); inst('tideRock2', GEO.sphere, rubbleMat, x, s * 0.45, z, { sx: s * 1.4, sy: s * 0.9, sz: s, color: 0x3a3a3a }); inst('mussels', GEO.sphere, MAT.stone, x, s * 0.9, z, { sx: s * 0.8, sy: 0.3, sz: s * 0.6, color: 0x1a1a2a, cast: false }); solid(x, z, s * 2.2, s * 2, s * 0.9); });
    openSpot(cc, edge);
  };
  const sandM = std(0xd8b880, { roughness: 1 });
  const sandcastlesCell = (cc, i, j, edge) => {
    if (!edge && rng.next() < 0.5) { // a sandcastle big enough to hide behind
      const x = cc.x + rng.range(-3, 3), z = cc.z + rng.range(-3, 3), s = 4;
      for (const [ox, oz] of [[-s, -s], [s, -s], [-s, s], [s, s]]) { inst('scTower', GEO.cyl, sandM, x + ox, 3, z + oz, { sx: 1.6, sy: 6, sz: 1.6 }); inst('scTop', GEO.cone, sandM, x + ox, 7, z + oz, { sx: 1.9, sy: 2, sz: 1.9 }); }
      for (const [ox, oz, w, d] of [[0, -s, 2 * s, 0.8], [0, s, 2 * s, 0.8], [-s, 0, 0.8, 2 * s], [s, 0, 0.8, 2 * s]]) inst('scWall', GEO.box, sandM, x + ox, 1.8, z + oz, { sx: w, sy: 3.6, sz: d });
      inst('scKeep', GEO.cyl, sandM, x, 4.5, z, { sx: 2.2, sy: 9, sz: 2.2 }); inst('scFlag', GEO.box, MAT.blood, x + 0.6, 10.6, z, { sx: 1.2, sy: 0.7, sz: 0.05, cast: false });
      solid(x, z, 2 * s + 3, 2 * s + 3, 6);
      W.mapRects.push({ x, z, w: 2 * s + 3, d: 2 * s + 3, color: '#d8b880' });
    } else if (!edge) around(cc, rng.int(1, 3), 5, 10, (x, z) => { // beach umbrellas and buckets
      if (rng.next() < 0.5) { inst('umbPole', GEO.cyl, MAT.metal, x, 3, z, { sx: 0.1, sy: 6, sz: 0.1, color: 0xe8e8e8 }); inst('umbTop', GEO.cone, MAT.toy, x, 6.2, z, { sx: 3.4, sy: 1.4, sz: 3.4, color: rng.pick([0xe83a3a, 0x3a8ae8, 0xe8c83a]) }); solid(x, z, 0.5, 0.5, 6); }
      else inst('bucket', GEO.cyl, MAT.toy, x, 0.8, z, { sx: 0.9, sy: 1.6, sz: 0.9, color: rng.pick([0xe83a3a, 0x3ac8e8, 0xe8c83a]) });
    });
    openSpot(cc, edge);
  };

  // --- Museum at Night
  const statueOn = (x, z, watch) => { // a marble statue on a pedestal whose head turns to watch you
    box(2.6, 2, 2.6, marble, x, 1, z);
    meshAt(new THREE.CylinderGeometry(0.9, 1.1, 4, 10), marble, x, 4, z);
    for (const s of [-1, 1]) { const a = meshAt(new THREE.CylinderGeometry(0.3, 0.3, 3, 8), marble, x + s * 1.2, 4.5, z); a.rotation.z = s * 0.3; }
    const head = new THREE.Group(); head.position.set(x, 6.8, z); group.add(head);
    meshAt(new THREE.SphereGeometry(0.8, 12, 10), marble, 0, 0, 0, head);
    const eyeMat = neon(0x9ae8ff, 0.5);
    for (const ex of [-0.28, 0.28]) meshAt(new THREE.SphereGeometry(0.12, 6, 4), eyeMat, ex, 0.15, 0.72, head);
    if (watch) watcher(x, z, head, eyeMat, 0x9ae8ff, 7.6); else solid(x, z, 2.6, 2.6, 7.6);
  };
  const museumCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.3) { // marble hall with columns and steps
      const { w, d, h } = house(cc, { wall: marble, roof: 'flat', roofMat: marble, h: rng.int(11, 14), win: neon(0xffe0b0, 1), winN: 3, door: std(0x2a2420), map: '#e8e4dc' });
      for (let k = 0; k < 6; k++) { const x = cc.x - w / 2 + 1 + k * ((w - 2) / 5); inst('mCol', GEO.cyl, marble, x, h / 2, cc.z - d / 2 - 2, { sx: 0.6, sy: h, sz: 0.6 }); solid(x, cc.z - d / 2 - 2, 1.2, 1.2, h); }
      const ped = meshAt(new THREE.ConeGeometry(w * 0.62, 3, 3), marble, cc.x, h + 1.2, cc.z - d / 2 - 1); ped.rotation.set(0, 0, 0); ped.scale.z = 0.25;
      for (let k = 0; k < 3; k++) box(w + 2 - k, 0.4, 1.2, marble, cc.x, 0.2 + k * 0.4, cc.z - d / 2 - 3.6 + k * 0.5, false);
      return;
    }
    if (r < 0.44 && !edge) { // glass display cases, artifacts glowing inside
      around(cc, rng.int(2, 3), 6, 9.5, (x, z) => {
        inst('casePed', GEO.box, MAT.stone, x, 1.5, z, { sx: 2.4, sy: 3, sz: 2.4, color: 0x2a2420 });
        inst('caseGlass', GEO.box, glassMat, x, 4.3, z, { sx: 2.2, sy: 2.6, sz: 2.2, cast: false });
        const col = rng.pick([0xffc83a, 0x3affd0, 0xff5a8a]);
        inst('artifact', GEO.sphere, MAT.bulb, x, 4, z, { sx: 0.6, sy: 0.9, sz: 0.6, color: col, cast: false });
        glowDecal(x, z, 3.5, col, 0.4);
        solid(x, z, 2.4, 2.4, 5.6);
      });
      openSpot(cc, edge); return;
    }
    if (r < 0.52 && !edge && W.scarecrows.length < 12) { statueOn(cc.x + rng.pick([-1, 1]) * 7, cc.z + rng.pick([-1, 1]) * 7, true); openSpot(cc, edge); return; }
    if (r < 0.6) { bushRing(cc, i, j, () => rng.pick([0x2a4a2a, 0x2a3a24])); return; }
    if (r < 0.66) { speedPad(cc); W.patrol.push(cc); return; }
    if (!edge) { const z = cc.z + 7; for (let k = 0; k < 4; k++) inst('stanchion', GEO.cyl, MAT.gold, cc.x - 6 + k * 4, 1.4, z, { sx: 0.2, sy: 2.8, sz: 0.2 }); inst('velvetRope', GEO.box, velvet, cc.x, 2.4, z, { sx: 12, sy: 0.2, sz: 0.2, cast: false }); }
    openSpot(cc, edge);
  };
  const statuegardenCell = (cc, i, j, edge) => {
    if (!edge && rng.next() < 0.55) statueOn(cc.x + rng.pick([-1, 1]) * 7, cc.z + rng.pick([-1, 1]) * 7, W.scarecrows.length < 14);
    if (!edge && rng.next() < 0.5) for (let k = 0; k < 3; k++) { const x = cc.x - 7 + k * 7, z = cc.z + rng.pick([-1, 1]) * 9; inst('hedgeBox', GEO.box, MAT.pine, x, 1.5, z, { sx: 5, sy: 3, sz: 2, color: 0x2a5a2a }); solid(x, z, 5, 2, 3); W.mapRects.push({ x, z, w: 5, d: 2, color: '#2a5a2a' }); }
    openSpot(cc, edge);
  };
  const skeletonDisplay = (x, z, len) => { // a dinosaur skeleton on a low platform
    box(len + 4, 0.8, 6, std(0x2a2420), x, 0.4, z);
    for (let k = 0; k < len; k++) { inst('spine', GEO.box, MAT.boneM, x - len / 2 + k, 6 - Math.abs(k - len / 2) * 0.2, z, { sx: 0.8, sy: 0.6, sz: 0.6 }); if (k % 2 === 0 && Math.abs(k - len / 2) < len / 3) { const rb = meshAt(new THREE.TorusGeometry(2, 0.15, 6, 12, Math.PI), MAT.boneM, x - len / 2 + k, 6 - Math.abs(k - len / 2) * 0.2, z); rb.rotation.set(0, Math.PI / 2, Math.PI); } }
    for (const s of [-1, 1]) for (const lx of [-len / 4, len / 4]) inst('legBone', GEO.box, MAT.boneM, x + lx, 3, z + s * 1.4, { sx: 0.5, sy: 5, sz: 0.5 });
    inst('skullBone', GEO.box, MAT.boneM, x + len / 2 + 1.5, 6.5, z, { sx: 3, sy: 1.8, sz: 1.6 });
    solid(x, z, len + 4, 6, 7);
    W.mapRects.push({ x, z, w: len + 4, d: 6, color: '#e8dcc8' });
  };
  const fossilhallCell = (cc, i, j, edge) => {
    if (!edge && rng.next() < 0.45) skeletonDisplay(cc.x, cc.z + rng.pick([-1, 1]) * 5, rng.int(9, 13));
    else if (!edge) around(cc, rng.int(1, 2), 6, 9, (x, z) => { // giant spiral shell fossils on stands
      inst('fossilStand', GEO.box, MAT.stone, x, 1, z, { sx: 3, sy: 2, sz: 3, color: 0x2a2420 });
      for (let k = 0; k < 4; k++) { const t = meshAt(new THREE.TorusGeometry(1.6 - k * 0.35, 0.3, 6, 16), std(0xb8a888, { roughness: 0.8 }), x + k * 0.2, 3.8 - k * 0.15, z); t.rotation.y = Math.PI / 2; }
      solid(x, z, 3, 3, 5.6);
    });
    openSpot(cc, edge);
  };

  // --- Sewer Depths
  const sewerBrick = std(0x4a3a2a, { roughness: 1 }), sludgeMat = neon(0x6aff1a, 1.1);
  const sludgeHz = { color: 0x8aff2a, css: '#8aff2a' };
  const sewersCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.3) { // a brick tunnel arch you run underneath
      const alongX = rng.next() < 0.5, g = new THREE.Group(); g.position.set(cc.x, 0, cc.z); g.rotation.y = alongX ? Math.PI / 2 : 0; group.add(g);
      for (let k = -2; k <= 2; k++) { const a = meshAt(new THREE.TorusGeometry(8, 1.3, 6, 16, Math.PI), sewerBrick, 0, 0, k * 4.4, g); a.scale.set(1, 1.1, 1.4); }
      for (const s of [-1, 1]) { const x = cc.x + (alongX ? 0 : s * 8), z = cc.z + (alongX ? s * 8 : 0); solid(x, z, alongX ? C - 4 : 2.6, alongX ? 2.6 : C - 4, 8); }
      W.mapRects.push({ x: cc.x, z: cc.z, w: alongX ? C - 4 : 17, d: alongX ? 17 : C - 4, color: '#4a3a2a' });
      openSpot(cc, edge); return;
    }
    if (r < 0.48 && !edge) { // a channel of glowing sludge with brick edges
      const alongX = rng.next() < 0.5, off = rng.pick([-1, 1]) * 7, w = alongX ? C : 5, d = alongX ? 5 : C, x = cc.x + (alongX ? 0 : off), z = cc.z + (alongX ? off : 0);
      pool(x, z, w, d, 'lava', sludgeMat, '#8aff2a', 0x6aff1a, sludgeHz);
      for (const s of [-1, 1]) box(alongX ? C : 0.8, 0.6, alongX ? 0.8 : C, sewerBrick, x + (alongX ? 0 : s * 2.9), 0.3, z + (alongX ? s * 2.9 : 0), false);
    } else if (r < 0.58 && !edge) { // a giant pipe pouring sludge out of a wall
      const x = cc.x + rng.pick([-1, 1]) * 7, z = cc.z + 8;
      box(8, 10, 3, sewerBrick, x, 5, z); solid(x, z, 8, 3, 10);
      const pp = meshAt(new THREE.CylinderGeometry(1.6, 1.6, 3, 14), std(0x5a5a52, { metalness: 0.6 }), x, 4, z - 2.5); pp.rotation.x = Math.PI / 2;
      inst('sludgeFall', GEO.box, sludgeMat, x, 2, z - 4, { sx: 2, sy: 4, sz: 0.4, cast: false });
      pool(x, z - 6.5, 5, 4, 'lava', sludgeMat, '#8aff2a', 0x6aff1a, sludgeHz);
      W.mapRects.push({ x, z, w: 8, d: 3, color: '#4a3a2a' });
    } else if (r < 0.66) { speedPad(cc); W.patrol.push(cc); return; }
    else if (!edge) { if (rng.next() < 0.5) barrel(cc.x + 8, cc.z - 8); const x = cc.x - 7, z = cc.z + 7; inst('ladder', GEO.box, MAT.metal, x, 8, z, { sx: 1.6, sy: 16, sz: 0.2, color: 0x6a6a62 }); glowDecal(x, z + 1, 4, 0xffffd0, 0.35); }
    openSpot(cc, edge);
  };
  const sludgeCell = (cc, i, j, edge) => {
    if (!edge && rng.next() < 0.65) {
      const x = cc.x + rng.range(-3, 3), z = cc.z + rng.range(-3, 3), w = rng.range(8, 13), d = rng.range(8, 13);
      pool(x, z, w, d, 'lava', sludgeMat, '#8aff2a', 0x6aff1a, sludgeHz);
      for (let k = 0; k < 6; k++) inst('sludgeBub', GEO.sphere, sludgeMat, x + rng.range(-w / 2, w / 2), 0.3, z + rng.range(-d / 2, d / 2), { s: rng.range(0.3, 0.8), cast: false });
    }
    if (!edge && rng.next() < 0.6) barrel(cc.x + rng.pick([-1, 1]) * 9, cc.z + rng.pick([-1, 1]) * 9);
    openSpot(cc, edge);
  };
  const pipeworksCell = (cc, i, j, edge) => {
    if (!edge) for (let k = 0; k < rng.int(1, 3); k++) {
      const y = rng.pick([1.6, 7, 12]), alongX = rng.next() < 0.5, off = rng.range(-8, 8), R = y < 2 ? 1.6 : rng.range(1, 2);
      inst('pwPipe', GEO.cyl, MAT.metal, cc.x + (alongX ? 0 : off), y, cc.z + (alongX ? off : 0), { sx: R, sy: C, sz: R, rx: alongX ? 0 : Math.PI / 2, rz: alongX ? Math.PI / 2 : 0, color: rng.pick([0x5a5a52, 0x6a4a3a, 0x3a4a3a]) });
      if (y < 2) { solid(cc.x + (alongX ? 0 : off), cc.z + (alongX ? off : 0), alongX ? C : R * 2, alongX ? R * 2 : C, y + R); W.mapRects.push({ x: cc.x + (alongX ? 0 : off), z: cc.z + (alongX ? off : 0), w: alongX ? C : R * 2, d: alongX ? R * 2 : C, color: '#5a5a52' }); }
    }
    if (!edge) around(cc, rng.int(1, 2), 6, 10, (x, z) => { const h = rng.range(8, 16); inst('pwVert', GEO.cyl, MAT.metal, x, h / 2, z, { sx: 1.2, sy: h, sz: 1.2, color: 0x5a5a52 }); inst('pwValve', GEO.sphere, MAT.ember, x, rng.range(2, 5), z - 1.3, { s: 0.45, cast: false }); solid(x, z, 2.4, 2.4, h); });
    openSpot(cc, edge);
  };

  // ===== Levels 39-49 + THE FINAL NIGHTMARE =====
  const lineBlack = new THREE.LineBasicMaterial({ color: 0x0a0a0a });
  const doodle = (m) => { m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 25), lineBlack)); return m; };

  // --- Derelict Space Station
  const hullMat = std(0xb8bcc8, { metalness: 0.7, roughness: 0.35 }), plasma = neon(0x5affff, 1.6);
  const stationCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.3) { // a round crew module with portholes
      const R = rng.range(6, 7.5), h = rng.range(8, 11);
      meshAt(new THREE.CylinderGeometry(R, R, h, 16), hullMat, cc.x, h / 2, cc.z);
      meshAt(new THREE.SphereGeometry(R, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), hullMat, cc.x, h, cc.z).scale.y = 0.4;
      for (let k = 0; k < 6; k++) { const a = (k / 6) * 6.28; meshAt(new THREE.CylinderGeometry(0.8, 0.8, 0.3, 12), neon(0x9ae8ff, 1.6), cc.x + Math.sin(a) * R, h * 0.6, cc.z + Math.cos(a) * R).rotation.set(Math.PI / 2, 0, -a); }
      box(3, 4.5, 0.4, std(0x3a3e48), cc.x, 2.25, cc.z - R - 0.1); box(3.2, 0.4, 0.5, W.blinkMat, cc.x, 4.8, cc.z - R - 0.15, false);
      solid(cc.x, cc.z, R * 1.6, R * 1.6, h + 2);
      W.mapRects.push({ x: cc.x, z: cc.z, w: R * 2, d: R * 2, color: '#b8bcc8', round: true });
      return;
    }
    if (r < 0.42 && !edge) { // solar panel array
      for (let k = 0; k < 4; k++) { const x = cc.x - 7.5 + k * 5; inst('solarPost', GEO.box, MAT.metal, x, 2, cc.z + 6, { sx: 0.4, sy: 4, sz: 0.4, color: 0x8a8e98 }); inst('solar', GEO.box, MAT.panel, x, 4.2, cc.z + 6, { sx: 4.4, sy: 0.15, sz: 3, rx: -0.5, color: 0x2a3aaa }); solid(x, cc.z + 6, 4.4, 2.6, 5); }
      W.mapRects.push({ x: cc.x, z: cc.z + 6, w: 19, d: 3, color: '#2a3aaa' });
    } else if (r < 0.52 && !edge) { // debris drifting overhead in zero-g
      for (let k = 0; k < 4; k++) { const d = new THREE.Mesh(BOX(rng.range(1, 3), rng.range(0.3, 1), rng.range(1, 4)), hullMat); d.position.set(cc.x + rng.range(-8, 8), rng.range(9, 22), cc.z + rng.range(-8, 8)); d.castShadow = true; group.add(d); W.spinners.push({ obj: d, axis: rng.pick(['x', 'y', 'z']), speed: rng.range(0.2, 0.8) }); }
    } else if (r < 0.6) { bushRing(cc, i, j, () => rng.pick([0x2a6a5a, 0x3a5a6a])); return; } // hydroponic plants
    else if (r < 0.7) { speedPad(cc); W.patrol.push(cc); return; }
    else if (rng.next() < 0.6) lamp(cc.x + C / 2 - 4, cc.z + C / 2 - 4, neon(0x9ae8ff, 2.6), 0x5ad8ff);
    openSpot(cc, edge);
  };
  const hangarCell = (cc, i, j, edge) => {
    inst('padMark', GEO.box, MAT.bulb, cc.x, 0.04, cc.z, { sx: 14, sy: 0.04, sz: 0.4, color: 0xe8c83a, cast: false });
    if (!edge && rng.next() < 0.45) { // a parked shuttle, engines still glowing
      const x = cc.x + rng.range(-3, 3), z = cc.z + rng.range(-3, 3), sh = new THREE.Group(); sh.position.set(x, 0, z); sh.rotation.y = rng.next() * 6; group.add(sh);
      meshAt(BOX(4, 3.4, 12), hullMat, 0, 2.6, 0, sh); meshAt(new THREE.ConeGeometry(2.2, 4, 4), hullMat, 0, 2.6, 8, sh).rotation.set(Math.PI / 2, Math.PI / 4, 0);
      meshAt(BOX(14, 0.4, 5), hullMat, 0, 1.8, -2, sh); meshAt(BOX(0.4, 4, 3), hullMat, 0, 5.5, -4.5, sh);
      for (const s of [-1, 1]) meshAt(new THREE.CylinderGeometry(0.8, 0.8, 0.4, 12), plasma, s * 1.2, 2.6, -6.1, sh).rotation.x = Math.PI / 2;
      meshAt(BOX(3, 1.2, 0.1), neon(0x5ad8ff, 1.4), 0, 3.8, 6.05, sh);
      solid(x, z, 10, 10, 5);
      W.mapRects.push({ x, z, w: 8, d: 12, color: '#b8bcc8' });
    } else if (!edge) around(cc, rng.int(2, 3), 6, 10, (x, z) => { const s = rng.range(2.5, 4); inst('spaceCrate', GEO.box, MAT.metal, x, s / 2, z, { s, ry: rng.next(), color: rng.pick([0xd8d8e0, 0xe8a03a, 0x3a6ad8]) }); solid(x, z, s * 1.2, s * 1.2, s); });
    openSpot(cc, edge);
  };
  const reactorCell = (cc, i, j, edge) => {
    if (!edge && rng.next() < 0.45) { // a reactor core, its rings pulsing
      const x = cc.x, z = cc.z;
      meshAt(new THREE.CylinderGeometry(3, 3.6, 2, 16), std(0x3a3e48, { metalness: 0.7 }), x, 1, z);
      meshAt(new THREE.CylinderGeometry(1.6, 1.6, 14, 16), std(0x9affff, { emissive: 0x2ad8ff, emissiveIntensity: 1.6, transparent: true, opacity: 0.85 }), x, 8, z);
      const rings = new THREE.Group(); rings.position.set(x, 8, z); group.add(rings);
      for (let k = 0; k < 3; k++) { const t = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.25, 8, 28), neon(0x5affff, 2)); t.position.y = -5 + k * 5; t.rotation.x = Math.PI / 2 + (k - 1) * 0.3; rings.add(t); }
      W.spinners.push({ obj: rings, axis: 'y', speed: 1.5 });
      glowDecal(x, z, 12, 0x5affff, 0.45);
      solid(x, z, 7, 7, 15);
      W.mapRects.push({ x, z, w: 7, d: 7, color: '#5affff', round: true });
    } else if (!edge && rng.next() < 0.7) { // spilled plasma: it burns
      const w = rng.range(6, 10), d = rng.range(6, 10), x = cc.x + rng.range(-4, 4), z = cc.z + rng.range(-4, 4);
      pool(x, z, w, d, 'lava', plasma, '#5affff', 0x5affff, { color: 0x5affff, css: '#5affff' });
    }
    if (!edge) for (let k = 0; k < 4; k++) inst('warnStripe', GEO.box, MAT.bulb, cc.x - 9 + k * 6, 0.05, cc.z - C / 2 + 1, { sx: 3, sy: 0.04, sz: 0.8, color: k % 2 ? 0x1a1a1a : 0xe8c83a, cast: false });
    openSpot(cc, edge);
  };

  // --- Storybook Woods
  const BOOKC = [0x8a1a2a, 0x1a3a8a, 0x2a6a2a, 0x6a2a8a, 0x8a5a1a];
  const giantBook = (x, z, h, ry) => { // a book standing on end, big as a house
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; group.add(g);
    const col = rng.pick(BOOKC);
    meshAt(BOX(2.6, h, h * 0.75), std(col, { roughness: 0.8 }), 0, h / 2, 0, g);
    meshAt(BOX(2.3, h - 0.6, h * 0.75 - 0.6), std(0xf4ecd4), 0.25, h / 2, 0.05, g);
    for (const y of [h * 0.2, h * 0.8]) meshAt(BOX(2.7, 0.5, h * 0.76), neon(0xffc83a, 1.2), 0, y, 0, g);
    solid(x, z, Math.max(3, Math.abs(Math.sin(ry)) * h * 0.75 + 2.6), Math.max(3, Math.abs(Math.cos(ry)) * h * 0.75 + 2.6), h);
    W.mapRects.push({ x, z, w: 4, d: h * 0.75, color: hex6(col) });
  };
  const storytownCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.2) { giantBook(cc.x - 4, cc.z, rng.range(12, 18), 0); giantBook(cc.x + 1, cc.z, rng.range(12, 18), 0.15); return; }
    if (r < 0.38) { // a crooked fairytale cottage
      const { h } = house(cc, { wall: std(rng.pick([0xe8d8b8, 0xd8c8a0, 0xc8b0d8]), { roughness: 1 }), roof: 'cone', roofMat: std(rng.pick([0x6a2a1a, 0x2a4a6a, 0x4a2a5a]), { flatShading: true }), roofH: 9, sides: 5, h: rng.int(6, 8), w: rng.int(9, 11), d: rng.int(9, 11), win: neon(0xffc86a, 1.4), winN: 2, door: std(0x5a3a1a), map: '#d8c8a0' });
      inst('chimneyS', GEO.box, MAT.stone, cc.x + 2.5, h + 5, cc.z + 1, { sx: 1.2, sy: 5, sz: 1.2, rz: 0.2, color: 0x6a5a4a });
      return;
    }
    if (r < 0.5 && !edge) { // a giant quill pen stuck in a pool of sticky ink
      const x = cc.x + rng.pick([-1, 1]) * 5, z = cc.z + rng.pick([-1, 1]) * 5;
      pool(x, z, 9, 7, 'choco', std(0x0a0a1a, { roughness: 0.05, metalness: 0.4 }), '#0a0a1a', 0);
      const q = meshAt(new THREE.ConeGeometry(1.4, 14, 6), std(0xf0f0f0), x, 7, z); q.rotation.z = 0.3; q.scale.z = 0.25;
      solid(x, z, 2, 2, 12);
    } else if (r < 0.6) { bushRing(cc, i, j, () => rng.pick([0x2a6a2a, 0x3a7a2a])); return; }
    else if (r < 0.66) { speedPad(cc); W.patrol.push(cc); return; }
    else if (rng.next() < 0.5) lamp(cc.x + C / 2 - 4, cc.z + C / 2 - 4, lampMat, 0xffd27a);
    openSpot(cc, edge);
  };
  const pagesCell = (cc, i, j, edge) => {
    for (let k = 0; k < 10; k++) inst('bigPage', GEO.box, MAT.stone, cc.x + rng.range(-10, 10), 0.1 + k * 0.01, cc.z + rng.range(-10, 10), { sx: 3.4, sy: 0.04, sz: 4.4, ry: rng.next() * 6, color: rng.pick([0xf4ecd4, 0xece4cc]), cast: false });
    if (!edge) around(cc, rng.int(1, 3), 6, 10, (x, z) => {
      if (rng.next() < 0.5) { // giant pencil stuck in the ground
        const h = rng.range(10, 16), col = rng.pick([0xe8b81a, 0xd83a3a, 0x3a8ad8]);
        inst('pencil', GEO.cyl6, MAT.toy, x, h / 2 + 1.5, z, { sx: 0.9, sy: h, sz: 0.9, color: col });
        inst('pencilTip', GEO.cone6, MAT.toy, x, 0.75, z, { sx: 0.9, sy: 1.5, sz: 0.9, rx: Math.PI, color: 0xe8c8a0 });
        inst('eraserTop', GEO.cyl6, MAT.toy, x, h + 2, z, { sx: 0.9, sy: 1, sz: 0.9, color: 0xff9ab0 });
        solid(x, z, 1.8, 1.8, h + 2);
      } else { const s = rng.range(2.5, 3.5); inst('letterBlock', GEO.box, MAT.toy, x, s / 2, z, { s, ry: rng.next(), color: rng.pick(TOYC) }); solid(x, z, s, s, s); }
    });
    openSpot(cc, edge);
  };
  const fairyringCell = (cc, i, j, edge) => {
    if (!edge && rng.next() < 0.6) { // a ring of glowing toadstools; fairy lights circling above it
      const R = rng.range(5, 7), x = cc.x + rng.range(-3, 3), z = cc.z + rng.range(-3, 3);
      for (let k = 0; k < 12; k++) { const a = (k / 12) * 6.28; inst('ringStem', GEO.cyl, MAT.stone, x + Math.cos(a) * R, 0.6, z + Math.sin(a) * R, { sx: 0.3, sy: 1.2, sz: 0.3, color: 0xe8e0d0, cast: false }); inst('ringCap', GEO.dome, MAT.alienCap, x + Math.cos(a) * R, 1.2, z + Math.sin(a) * R, { sx: 1, sy: 0.7, sz: 1, color: rng.pick([0xff3a3a, 0xffffff]) }); }
      const fl = new THREE.Group(); fl.position.set(x, 4, z); group.add(fl);
      for (let k = 0; k < 8; k++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 4), neon(rng.pick([0xc8ff6a, 0xff9af0, 0x9affff]), 3)); f.position.set(Math.cos(k) * R * 0.6, Math.sin(k * 3) * 1.2, Math.sin(k) * R * 0.6); fl.add(f); }
      W.spinners.push({ obj: fl, axis: 'y', speed: 0.7 });
      glowDecal(x, z, R * 1.3, 0xc8ff6a, 0.3);
    }
    if (!edge && rng.next() < 0.6) fancyTree(cc.x + rng.pick([-1, 1]) * 9, cc.z + rng.pick([-1, 1]) * 9, 'alien');
    openSpot(cc, edge);
  };

  // --- Ghost Train Station
  const platform = (x, z, len, alongX) => { box(alongX ? len : 6, 1.4, alongX ? 6 : len, std(0x6a6460, { roughness: 1 }), x, 0.7, z); inst('platEdge', GEO.box, MAT.bulb, x + (alongX ? 0 : 2.9), 1.42, z + (alongX ? 2.9 : 0), { sx: alongX ? len : 0.3, sy: 0.04, sz: alongX ? 0.3 : len, color: 0xe8c83a, cast: false }); solid(x, z, alongX ? len : 6, alongX ? 6 : len, 1.4); W.mapRects.push({ x, z, w: alongX ? len : 6, d: alongX ? 6 : len, color: '#6a6460' }); };
  const rails = (cc, z0) => { for (const dz of [-1.1, 1.1]) box(C, 0.15, 0.3, std(0x8a8a90, { metalness: 0.6 }), cc.x, 0.08, z0 + dz, false); for (let k = -5; k <= 5; k++) inst('tie', GEO.box, MAT.bark, cc.x + k * 2.3, 0.05, z0, { sx: 0.6, sy: 0.1, sz: 3.2, cast: false }); };
  const steamEngine = (x, z) => { // a steam locomotive, headlamp still on
    const g = new THREE.Group(); g.position.set(x, 0, z); group.add(g);
    const bm = std(0x1a1a20, { metalness: 0.6, roughness: 0.4 });
    meshAt(new THREE.CylinderGeometry(1.8, 1.8, 9, 14), bm, -1.5, 3.4, 0, g).rotation.z = Math.PI / 2;
    meshAt(BOX(4.5, 6, 4), bm, 4.5, 4, 0, g); meshAt(BOX(5, 0.4, 4.4), std(0x8a1a1a), 4.5, 7.2, 0, g);
    meshAt(new THREE.CylinderGeometry(0.7, 0.9, 3, 10), bm, -4.5, 6.2, 0, g);
    meshAt(new THREE.CylinderGeometry(0.6, 0.6, 0.3, 12), neon(0xfff0a0, 3), -6.1, 3.6, 0, g).rotation.z = Math.PI / 2;
    for (let k = 0; k < 4; k++) for (const s of [-1, 1]) meshAt(new THREE.CylinderGeometry(1.1, 1.1, 0.4, 14), std(0x8a1a1a), -4 + k * 2.6, 1.2, s * 2, g).rotation.x = Math.PI / 2;
    for (let k = 0; k < 3; k++) inst('trainSmoke', GEO.sphere, MAT.cottonCloud, x - 4.5 + k * 1.5, 9 + k * 2.4, z, { s: 1.4 + k * 0.6, color: 0x8a8a8a, cast: false });
    glowDecal(x - 8, z, 6, 0xfff0a0, 0.35);
    solid(x, z, 14, 4.4, 7.4);
    W.mapRects.push({ x, z, w: 14, d: 4.4, color: '#1a1a20' });
  };
  const depotCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.26) { // station house with a big clock and a canopy
      const { w, d, h } = house(cc, { wall: brick(), roof: 'gable', roofMat: std(0x2a3a3a), h: rng.int(9, 12), win: neon(0xffd08a, 1.2), winN: 4, door: std(0x2a1a10), map: '#7a3a24' });
      meshAt(new THREE.CylinderGeometry(1.6, 1.6, 0.3, 20), std(0xf4ecd8, { emissive: 0xffe0a0, emissiveIntensity: 0.6 }), cc.x, h - 1.6, cc.z - d / 2 - 0.2).rotation.x = Math.PI / 2;
      box(w + 4, 0.4, 4, std(0x2a3a3a), cc.x, h * 0.5, cc.z - d / 2 - 2);
      return;
    }
    if (r < 0.46) { const z0 = cc.z + rng.pick([-1, 1]) * 7; rails(cc, z0); platform(cc.x, cc.z - Math.sign(z0 - cc.z) * 2, C - 4, true); if (!edge && rng.next() < 0.5) steamEngine(cc.x, z0); openSpot(cc, edge); return; }
    if (r < 0.56) { bushRing(cc, i, j, () => rng.pick([0x2a3a24, 0x3a3a2a])); return; }
    if (r < 0.62) { speedPad(cc); W.patrol.push(cc); return; }
    if (!edge) { lamp(cc.x + C / 2 - 4, cc.z + C / 2 - 4, lampMat, 0xffd08a); const z = cc.z + 6; inst('bench', GEO.box, MAT.bark, cc.x, 1, z, { sx: 5, sy: 0.3, sz: 1.4 }); inst('benchB', GEO.box, MAT.bark, cc.x, 1.8, z + 0.6, { sx: 5, sy: 1.2, sz: 0.2 }); solid(cc.x, z, 5, 1.4, 1.2); }
    openSpot(cc, edge);
  };
  const railyardCell = (cc, i, j, edge) => {
    rails(cc, cc.z - 6); rails(cc, cc.z + 6);
    if (!edge && rng.next() < 0.5) { // a boxcar
      const x = cc.x + rng.range(-5, 5), z = cc.z + rng.pick([-6, 6]), col = rng.pick([0x6a2a1a, 0x2a3a5a, 0x3a3a3a]);
      box(10, 5, 3.6, std(col, { roughness: 0.9 }), x, 3.4, z);
      for (const wx of [-3.5, 3.5]) for (const s of [-1, 1]) wheel(x + wx, 0.8, z + s * 1.9, 0.8, true);
      solid(x, z, 10, 3.6, 6);
      W.mapRects.push({ x, z, w: 10, d: 3.6, color: hex6(col) });
    }
    if (!edge && rng.next() < 0.5) { // a signal post
      const x = cc.x + rng.pick([-1, 1]) * 9, z = cc.z;
      inst('signalPost', GEO.box, MAT.metal, x, 4, z, { sx: 0.4, sy: 8, sz: 0.4, color: 0x2a2a2a });
      inst('signalBox', GEO.box, MAT.metal, x, 8, z, { sx: 1.2, sy: 2.4, sz: 0.8, color: 0x1a1a1a });
      inst('signalLight', GEO.sphere, MAT.bulb, x, 8.5, z - 0.45, { s: 0.35, color: rng.pick([0xff2a2a, 0x2aff6a]), cast: false });
      solid(x, z, 1, 1, 9);
    }
    openSpot(cc, edge);
  };
  const coalyardCell = (cc, i, j, edge) => {
    if (!edge) around(cc, rng.int(2, 3), 6.5, 10, (x, z) => { const R = rng.range(3, 5), h = rng.range(4, 7); inst('coalHeap', GEO.cone, rubbleMat, x, h / 2, z, { sx: R, sy: h, sz: R, color: 0x14121a }); for (let k = 0; k < 3; k++) inst('ember2', GEO.sphere, MAT.ember, x + rng.range(-R / 2, R / 2), rng.range(0.5, h * 0.5), z + rng.range(-R / 2, R / 2), { s: 0.3, cast: false }); glowDecal(x, z, R * 1.3, 0xff6a1a, 0.2); solid(x, z, R * 1.4, R * 1.4, h * 0.8); W.mapRects.push({ x, z, w: R * 2, d: R * 2, color: '#14121a', round: true }); });
    openSpot(cc, edge);
  };

  // --- Neon Arcade
  const cabinet = (x, z, ry) => { // an arcade cabinet with a glowing screen
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; group.add(g);
    const col = rng.pick(ADS);
    meshAt(BOX(2.6, 6, 2.2), std(rng.pick([0x1a1a3a, 0x3a1a3a, 0x1a2a1a])), 0, 3, 0, g);
    meshAt(BOX(2, 1.6, 0.1), std(col, { emissive: col, emissiveIntensity: 1.2 }), 0, 4.2, -1.12, g);
    meshAt(BOX(2.4, 0.8, 0.1), neon(col, 1.6), 0, 5.6, -1.12, g);
    meshAt(BOX(2.4, 0.2, 0.8), std(0x1a1a1a), 0, 2.8, -1.4, g);
    solid(x, z, 2.6, 2.6, 6);
  };
  const arcadeCell = (cc, i, j, edge) => {
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if ((a + b + i + j) % 2) inst('neonTile', GEO.box, MAT.bulb, cc.x - 8 + a * 8, 0.03, cc.z - 8 + b * 8, { sx: 7.6, sy: 0.03, sz: 7.6, color: rng.pick([0x2a0a4a, 0x0a1a4a, 0x3a0a2a]), cast: false });
    const r = edge ? 1 : rng.next();
    if (r < 0.3 && !edge) { const z = cc.z + rng.pick([-1, 1]) * 6; for (let k = -2; k <= 2; k++) cabinet(cc.x + k * 3, z, 0); W.mapRects.push({ x: cc.x, z, w: 15, d: 2.6, color: '#ff3ad8' }); openSpot(cc, edge); return; }
    if (r < 0.44 && !edge) { // a claw machine full of prizes
      const x = cc.x + rng.pick([-1, 1]) * 6, z = cc.z + rng.pick([-1, 1]) * 6;
      box(5, 2.4, 5, std(0xd83a8a), x, 1.2, z);
      box(5, 5, 5, glassMat, x, 4.9, z, false); box(5.2, 0.6, 5.2, neon(0xff6ae8, 1.6), x, 7.7, z, false);
      for (let k = 0; k < 10; k++) inst('prize', GEO.sphere, MAT.toy, x + rng.range(-1.8, 1.8), 2.9 + rng.range(0, 0.8), z + rng.range(-1.8, 1.8), { s: 0.6, color: rng.pick(PLAYC), cast: false });
      inst('clawRope', GEO.box, MAT.metal, x, 6.2, z, { sx: 0.06, sy: 2.6, sz: 0.06, color: 0xc0c0c8, cast: false });
      solid(x, z, 5, 5, 8);
      W.mapRects.push({ x, z, w: 5, d: 5, color: '#d83a8a' });
    } else if (r < 0.54) { bushRing(cc, i, j, () => rng.pick([0x3a1a6a, 0x1a3a6a])); return; }
    else if (r < 0.62) { speedPad(cc); W.patrol.push(cc); return; }
    else if (!edge && rng.next() < 0.5) cabinet(cc.x + 8, cc.z + 8, rng.next() * 6);
    openSpot(cc, edge);
  };
  const pinballCell = (cc, i, j, edge) => {
    if (!edge) around(cc, rng.int(2, 3), 6, 10, (x, z) => { // giant bumpers
      const col = rng.pick(ADS);
      inst('bumper', GEO.cyl, MAT.toy, x, 1.5, z, { sx: 2.2, sy: 3, sz: 2.2, color: 0xf0f0f0 });
      inst('bumperTop', GEO.cyl, MAT.bulb, x, 3.1, z, { sx: 2.4, sy: 0.4, sz: 2.4, color: col, cast: false });
      inst('bumperRing', GEO.cyl, MAT.bulb, x, 1.2, z, { sx: 2.5, sy: 0.6, sz: 2.5, color: col, cast: false });
      glowDecal(x, z, 5, col, 0.4); solid(x, z, 4.4, 4.4, 3.2);
      W.mapRects.push({ x, z, w: 4.4, d: 4.4, color: hex6(col), round: true });
    });
    if (!edge && rng.next() < 0.5) meshAt(new THREE.SphereGeometry(2.4, 18, 14), chrome, cc.x + rng.range(-3, 3), 2.4, cc.z + rng.range(-3, 3)); // a steel ball
    if (!edge && rng.next() < 0.4) { const f = box(9, 1.2, 1.6, std(0xe83a3a), cc.x, 0.6, cc.z + 8); f.rotation.y = rng.range(-0.4, 0.4); solid(cc.x, cc.z + 8, 9, 2, 1.2); }
    openSpot(cc, edge);
  };
  const slotsCell = (cc, i, j, edge) => {
    if (!edge) around(cc, rng.int(1, 3), 6.5, 10, (x, z) => { // a giant slot machine
      box(5, 8, 4, std(0x8a1a1a, { metalness: 0.5 }), x, 4, z);
      for (let k = -1; k <= 1; k++) box(1.2, 2, 0.1, std(0xffffff, { emissive: 0xfff0c0, emissiveIntensity: 0.6 }), x + k * 1.4, 5, z - 2.05, false);
      box(5.2, 1, 4.2, neon(0xffd23a, 1.8), x, 8.5, z, false);
      inst('slotLever', GEO.cyl, MAT.metal, x + 3, 6, z, { sx: 0.2, sy: 4, sz: 0.2, color: 0xc0c0c8 }); inst('slotKnob', GEO.sphere, MAT.blood, x + 3, 8.2, z, { s: 0.6, cast: false });
      solid(x, z, 5, 4, 9); W.mapRects.push({ x, z, w: 5, d: 4, color: '#8a1a1a' });
    });
    for (let k = 0; k < 8; k++) inst('coinFloor', GEO.cyl, MAT.gold, cc.x + rng.range(-10, 10), 0.1, cc.z + rng.range(-10, 10), { sx: 0.5, sy: 0.1, sz: 0.5, cast: false });
    openSpot(cc, edge);
  };

  // --- Haunted Movie Studio
  const backlotCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.3) { // a fake building front held up by wooden braces
      const w = rng.range(12, 16), h = rng.range(10, 16), z = cc.z - 2, col = rng.pick([0xc8a878, 0x8a9aa8, 0xa86a5a]);
      box(w, h, 0.5, std(col, { roughness: 1 }), cc.x, h / 2, z);
      for (let k = 0; k < 3; k++) for (let fl = 0; fl < 2; fl++) box(1.8, 2.4, 0.1, neon(rng.pick([0xffd08a, 0x1a1a1a]), 1), cc.x - w / 3 + k * (w / 3), 3 + fl * 5, z - 0.3, false);
      for (const sx of [-w / 3, w / 3]) { const br = box(0.4, h * 0.9, 0.4, MAT.bark, cc.x + sx, h * 0.4, z + 3); br.rotation.x = -0.45; }
      solid(cc.x, z, w, 0.6, h);
      W.mapRects.push({ x: cc.x, z, w, d: 0.6, color: hex6(col) });
      openSpot(cc, edge); return;
    }
    if (r < 0.44 && !edge) { // a film camera on a tripod and a big spotlight
      const x = cc.x + rng.pick([-1, 1]) * 6, z = cc.z + rng.pick([-1, 1]) * 6;
      for (let k = 0; k < 3; k++) { const l = box(0.2, 5, 0.2, std(0x2a2a2a), x + Math.cos(k * 2.1) * 0.8, 2.4, z + Math.sin(k * 2.1) * 0.8); l.rotation.set(Math.sin(k * 2.1) * 0.2, 0, -Math.cos(k * 2.1) * 0.2); }
      box(1.6, 1.6, 2.6, std(0x1a1a1a), x, 5.4, z);
      for (const s of [-1, 1]) meshAt(new THREE.CylinderGeometry(0.9, 0.9, 0.3, 14), std(0x1a1a1a), x, 6.8, z + s * 0.9).rotation.z = Math.PI / 2;
      solid(x, z, 2, 2, 6.5);
      const sx = cc.x - (x - cc.x), sz = cc.z - (z - cc.z);
      inst('spotStand', GEO.box, MAT.metal, sx, 3, sz, { sx: 0.4, sy: 6, sz: 0.4, color: 0x2a2a2a });
      meshAt(new THREE.CylinderGeometry(1.2, 1.4, 2, 14), std(0x2a2a2a), sx, 6.6, sz).rotation.x = 1.1;
      glowDecal(cc.x, cc.z, 9, 0xfff4c0, 0.4); solid(sx, sz, 1, 1, 7);
    } else if (r < 0.54) { bushRing(cc, i, j, () => rng.pick([0x2a4a2a, 0x3a4a2a])); return; }
    else if (r < 0.6) { speedPad(cc); W.patrol.push(cc); return; }
    else if (!edge) { const x = cc.x + 7, z = cc.z + 7; inst('dirChair', GEO.box, MAT.bark, x, 1.6, z, { sx: 1.8, sy: 0.2, sz: 1.6 }); inst('dirBack', GEO.box, MAT.stone, x, 2.8, z + 0.8, { sx: 1.8, sy: 1, sz: 0.1, color: 0x1a1a1a }); solid(x, z, 1.8, 1.8, 3); }
    openSpot(cc, edge);
  };
  const soundstageCell = (cc, i, j, edge) => {
    if (!edge && rng.next() < 0.5) { // a giant green screen wall
      const alongX = rng.next() < 0.5, off = rng.pick([-1, 1]) * 7, x = cc.x + (alongX ? 0 : off), z = cc.z + (alongX ? off : 0), len = C - 6;
      box(alongX ? len : 0.6, 14, alongX ? 0.6 : len, std(0x2ac83a, { emissive: 0x0a4a0a, emissiveIntensity: 0.6 }), x, 7, z);
      solid(x, z, alongX ? len : 0.6, alongX ? 0.6 : len, 14);
      W.mapRects.push({ x, z, w: alongX ? len : 0.6, d: alongX ? 0.6 : len, color: '#2ac83a' });
    }
    if (!edge && rng.next() < 0.6) { // lighting rig overhead
      for (let k = 0; k < 4; k++) inst('rigLight', GEO.cyl, MAT.bulb, cc.x - 6 + k * 4, 16, cc.z, { sx: 0.8, sy: 1.2, sz: 0.8, color: 0xfff4c0, cast: false });
      inst('rigBar', GEO.box, MAT.metal, cc.x, 17, cc.z, { sx: 16, sy: 0.4, sz: 0.4, color: 0x2a2a2a, cast: false });
      glowDecal(cc.x, cc.z, 10, 0xfff4c0, 0.25);
    }
    if (!edge && rng.next() < 0.5) around(cc, 2, 6, 10, (x, z) => { const s = rng.range(2.5, 4); box(s, s, s, crateMat, x, s / 2, z); solid(x, z, s, s, s); });
    openSpot(cc, edge);
  };
  const filmvaultCell = (cc, i, j, edge) => {
    if (!edge) around(cc, rng.int(2, 3), 6.5, 10, (x, z) => { // stacks of film reels
      const n = rng.int(2, 5);
      for (let k = 0; k < n; k++) { inst('reel', GEO.cyl, MAT.metal, x + rng.range(-0.2, 0.2), 0.4 + k * 0.85, z, { sx: 2.2, sy: 0.8, sz: 2.2, color: rng.pick([0x8a8a90, 0x5a5a60]) }); inst('reelHub', GEO.cyl, MAT.stone, x, 0.4 + k * 0.85, z, { sx: 0.5, sy: 0.85, sz: 0.5, color: 0x1a1a1a, cast: false }); }
      solid(x, z, 4.4, 4.4, n * 0.85 + 0.2);
      W.mapRects.push({ x, z, w: 4.4, d: 4.4, color: '#8a8a90', round: true });
    });
    if (!edge && rng.next() < 0.4) { const x = cc.x, z = cc.z + 9; box(2.4, 2, 3.4, std(0x2a2a2a), x, 2.5, z); meshAt(new THREE.CylinderGeometry(0.4, 0.5, 0.6, 12), neon(0xfff4c0, 3), x, 2.6, z - 1.9).rotation.x = Math.PI / 2; glowDecal(x, z - 8, 8, 0xfff4c0, 0.3); solid(x, z, 2.4, 3.4, 3.5); }
    openSpot(cc, edge);
  };

  // --- Bayou Nights
  const bogWater = std(0x2a4a3a, { roughness: 0.08, metalness: 0.3, transparent: true, opacity: 0.85 });
  const gatorEyes = (x, z) => { for (const s of [-0.4, 0.4]) inst('gatorEye', GEO.sphere, MAT.bulb, x + s, 0.35, z, { s: 0.18, color: 0xffe03a, cast: false }); };
  const cypressTree = (x, z) => {
    const h = rng.range(14, 22);
    inst('cypTrunk', GEO.trunk, MAT.bark, x, h / 2, z, { sx: 1.4, sy: h, sz: 1.4, color: 0x4a3a2a });
    inst('cypBase', GEO.cone, MAT.bark, x, 1.2, z, { sx: 2.6, sy: 2.4, sz: 2.6, color: 0x4a3a2a });
    inst('cypTop', GEO.sphere, MAT.pine, x, h, z, { sx: 5, sy: 2.4, sz: 5, color: 0x2a4a22 });
    for (let k = 0; k < 6; k++) { const a = rng.next() * 6.3, l = rng.range(3, 7); inst('moss', GEO.box, MAT.pine, x + Math.cos(a) * 3.5, h - 1 - l / 2, z + Math.sin(a) * 3.5, { sx: 0.3, sy: l, sz: 0.3, color: 0x7a8a6a, cast: false }); }
    solid(x, z, 2.6, 2.6, h);
    W.mapRects.push({ x, z, w: 6, d: 6, color: '#2a4a22', round: true });
  };
  const bayouCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.3) { // a shack up on stilts
      const w = rng.range(9, 11), d = rng.range(8, 10), h = 5, y0 = 3.5, wood = plank();
      for (const [ox, oz] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) inst('stilt', GEO.cyl, MAT.bark, cc.x + ox, y0 / 2, cc.z + oz, { sx: 0.35, sy: y0, sz: 0.35 });
      box(w, h, d, wood, cc.x, y0 + h / 2, cc.z);
      const rf = box(w + 1.6, 0.4, d + 1.6, std(0x5a5a52, { metalness: 0.4 }), cc.x, y0 + h + 0.6, cc.z); rf.rotation.x = 0.12;
      box(1.6, 1.6, 0.2, neon(0xffc86a, 1.4), cc.x, y0 + h * 0.6, cc.z - d / 2 - 0.1, false);
      const st = box(2, 0.3, 6, wood, cc.x, y0 / 2, cc.z - d / 2 - 2.6); st.rotation.x = -0.55;
      solid(cc.x, cc.z, w, d, y0 + h);
      W.mapRects.push({ x: cc.x, z: cc.z, w, d, color: '#5a3a20' });
      return;
    }
    if (r < 0.46 && !edge) { // dock, water and a fan airboat
      const z = cc.z + rng.pick([-1, 1]) * 6;
      pool(cc.x, z, C, 8, 'water', bogWater, '#2a4a3a', 0);
      box(4, 0.4, 10, plank(), cc.x - 5, 0.8, z, false);
      const x = cc.x + 5, ab = new THREE.Group(); ab.position.set(x, 0.4, z); group.add(ab);
      meshAt(BOX(3.4, 0.8, 7), std(0x6a7a6a, { metalness: 0.5 }), 0, 0, 0, ab);
      const fan = new THREE.Group(); fan.position.set(0, 2.4, -3); ab.add(fan);
      fan.add(new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.12, 6, 18), std(0x8a8a90)));
      for (let k = 0; k < 2; k++) { const b = new THREE.Mesh(BOX(3, 0.3, 0.1), std(0x2a2a2a)); b.rotation.z = k * Math.PI / 2; const sp = new THREE.Group(); sp.add(b); fan.add(sp); W.spinners.push({ obj: sp, axis: 'z', speed: 4 }); }
      gatorEyes(cc.x + rng.range(-8, 8), z + rng.range(-2, 2));
      openSpot(cc, edge); return;
    }
    if (r < 0.56) { bushRing(cc, i, j, () => rng.pick([0x2a3a1a, 0x3a4a22])); return; }
    if (r < 0.62) { speedPad(cc); W.patrol.push(cc); return; }
    if (!edge && rng.next() < 0.6) cypressTree(cc.x + rng.pick([-1, 1]) * 8, cc.z + rng.pick([-1, 1]) * 8);
    openSpot(cc, edge);
  };
  const cypressCell = (cc, i, j, edge) => { if (!edge) around(cc, rng.int(2, 3), 6.5, 10, (x, z) => cypressTree(x, z)); openSpot(cc, edge); };
  const bogCell = (cc, i, j, edge) => {
    if (!edge && rng.next() < 0.65) {
      const w = rng.range(10, 16), d = rng.range(10, 16), x = cc.x + rng.range(-3, 3), z = cc.z + rng.range(-3, 3);
      pool(x, z, w, d, 'water', bogWater, '#2a4a3a', 0x3aff9a);
      for (let k = 0; k < 6; k++) inst('lilyPad', GEO.cyl, MAT.pine, x + rng.range(-w / 2, w / 2), 0.15, z + rng.range(-d / 2, d / 2), { sx: 1.2, sy: 0.05, sz: 1.2, color: 0x3a7a2a, cast: false });
      for (let k = 0; k < 2; k++) inst('lilyFlower', GEO.sphere, MAT.bulb, x + rng.range(-w / 2, w / 2), 0.4, z + rng.range(-d / 2, d / 2), { sx: 0.5, sy: 0.3, sz: 0.5, color: 0xff9ad8, cast: false });
      if (rng.next() < 0.6) gatorEyes(x + rng.range(-w / 3, w / 3), z + rng.range(-d / 3, d / 3));
    }
    openSpot(cc, edge);
  };

  // --- Cursed Colosseum
  const arenaStone = std(0xc8b088, { roughness: 1 });
  const colosseumCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.3) { // a section of the arena's wall: three stories of arches
      const alongX = rng.next() < 0.5, len = C - 4, g = new THREE.Group(); g.position.set(cc.x, 0, cc.z); g.rotation.y = alongX ? 0 : Math.PI / 2; group.add(g);
      for (let fl = 0; fl < 3; fl++) {
        meshAt(BOX(len, 0.8, 3), arenaStone, 0, 6 + fl * 6.5, 0, g);
        for (let k = 0; k < 5; k++) meshAt(BOX(1.2, 6, 3), arenaStone, -len / 2 + 1 + k * ((len - 2) / 4), 3 + fl * 6.5, 0, g);
      }
      solid(cc.x, cc.z, alongX ? len : 3, alongX ? 3 : len, 20);
      W.mapRects.push({ x: cc.x, z: cc.z, w: alongX ? len : 3, d: alongX ? 3 : len, color: '#c8b088' });
      return;
    }
    if (r < 0.42 && !edge && W.scarecrows.length < 12) { statueOn(cc.x + rng.pick([-1, 1]) * 7, cc.z + rng.pick([-1, 1]) * 7, true); brazier(cc.x - 7, cc.z + 7); openSpot(cc, edge); return; }
    if (r < 0.52 && !edge) { const z = cc.z + rng.pick([-1, 1]) * 7; for (const sx of [-6, 6]) { inst('banPole', GEO.cyl, MAT.gold, cc.x + sx, 6, z, { sx: 0.25, sy: 12, sz: 0.25 }); solid(cc.x + sx, z, 0.8, 0.8, 12); } box(10, 4.5, 0.1, cloth(0x8a1a1a), cc.x, 9.4, z, false); }
    else if (r < 0.6) { bushRing(cc, i, j, () => rng.pick([0x5a6a2a, 0x4a5a22])); return; }
    else if (r < 0.66) { speedPad(cc); W.patrol.push(cc); return; }
    else if (!edge) brazier(cc.x + 8, cc.z - 8);
    openSpot(cc, edge);
  };
  const arenasandCell = (cc, i, j, edge) => {
    if (!edge && rng.next() < 0.4) { // weapon rack
      const x = cc.x + rng.pick([-1, 1]) * 7, z = cc.z;
      inst('rackBeam', GEO.box, MAT.bark, x, 3, z, { sx: 0.4, sy: 0.4, sz: 6 });
      for (let k = 0; k < 5; k++) { inst('rackSpear', GEO.cyl, MAT.metal, x, 2.6, z - 2.4 + k * 1.2, { sx: 0.1, sy: 5.2, sz: 0.1, rx: 0.15, color: 0xc0c8d0 }); }
      for (const sz of [-3, 3]) inst('rackLeg2', GEO.box, MAT.bark, x, 1.5, z + sz, { sx: 0.4, sy: 3, sz: 0.4 });
      solid(x, z, 1, 6.4, 3.2);
    } else if (!edge && rng.next() < 0.5) { // a broken chariot
      const x = cc.x + rng.range(-4, 4), z = cc.z + rng.range(-4, 4);
      box(3.4, 2.4, 2.6, std(0x8a5a2a), x, 1.8, z);
      for (const s of [-1, 1]) { const w = meshAt(new THREE.TorusGeometry(1.4, 0.15, 6, 16), std(0x5a3a1a), x + s * 1.9, 1.4, z); w.rotation.y = Math.PI / 2; }
      solid(x, z, 4, 3, 3);
    }
    if (!edge) around(cc, rng.int(0, 2), 6, 10, (x, z) => { inst('spikePillar', GEO.cone6, MAT.metal, x, 2.5, z, { sx: 0.8, sy: 5, sz: 0.8, color: 0x6a6a72 }); solid(x, z, 1.4, 1.4, 5); });
    openSpot(cc, edge);
  };
  const catacombsCell = (cc, i, j, edge) => {
    if (!edge) for (const side of [-1, 1]) {
      if (rng.next() < 0.4) continue;
      const z = cc.z + side * (C / 2 - 3);
      box(C - 6, 7, 2, std(0x4a4038, { roughness: 1 }), cc.x, 3.5, z);
      for (let a = 0; a < 6; a++) for (let b = 0; b < 3; b++) inst('wallSkull', GEO.sphere, MAT.boneM, cc.x - 8 + a * 3.2, 1.5 + b * 2.2, z - side * 1.05, { s: 0.6, cast: false });
      for (let k = 0; k < 3; k++) fire(cc.x - 6 + k * 6, z - side * 1.6, 7.4, 0.35);
      solid(cc.x, z, C - 6, 2, 7);
      W.mapRects.push({ x: cc.x, z, w: C - 6, d: 2, color: '#4a4038' });
    }
    if (!edge && rng.next() < 0.5) { const x = cc.x + rng.range(-4, 4); inst('tomb', GEO.box, MAT.stone, x, 1, cc.z, { sx: 3, sy: 2, sz: 6, color: 0x6a6258 }); solid(x, cc.z, 3, 6, 2); }
    openSpot(cc, edge);
  };

  // --- Doodle Land (everything drawn with a black marker)
  const paper = (c) => std(c, { roughness: 1 });
  const doodleTownCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.32) { // a doodled house: wobbly box, triangle roof, scribbled windows
      const w = rng.range(9, 12), d = rng.range(8, 10), h = rng.range(6, 9), col = rng.pick([0xfff4f0, 0xf0f8ff, 0xfffff0]);
      doodle(box(w, h, d, paper(col), cc.x, h / 2, cc.z));
      const roof = meshAt(new THREE.ConeGeometry(Math.max(w, d) * 0.72, 6, 4), paper(rng.pick([0xff6a5a, 0x5a8aff, 0xffd23a])), cc.x, h + 3, cc.z); roof.rotation.y = Math.PI / 4; doodle(roof);
      for (const sx of [-w / 4, w / 4]) doodle(box(2, 2, 0.15, paper(0x9ad8ff), cc.x + sx, h * 0.6, cc.z - d / 2 - 0.1, false));
      doodle(box(2, 3.6, 0.15, paper(0xb87a4a), cc.x, 1.8, cc.z - d / 2 - 0.1, false));
      solid(cc.x, cc.z, w, d, h);
      W.mapRects.push({ x: cc.x, z: cc.z, w, d, color: '#f0f0f0' });
      return;
    }
    if (r < 0.46 && !edge) { // a lollipop-shaped doodle tree
      const x = cc.x + rng.pick([-1, 1]) * 7, z = cc.z + rng.pick([-1, 1]) * 7, h = rng.range(6, 9);
      doodle(meshAt(new THREE.CylinderGeometry(0.5, 0.6, h, 6), paper(0xb87a4a), x, h / 2, z));
      doodle(meshAt(new THREE.IcosahedronGeometry(3.4, 0), paper(rng.pick([0x6ad86a, 0x9aff6a])), x, h + 2, z));
      solid(x, z, 1.4, 1.4, h + 4);
    } else if (r < 0.56) { bushRing(cc, i, j, () => rng.pick([0x6ad86a, 0x5ac85a])); return; }
    else if (r < 0.62) { speedPad(cc); W.patrol.push(cc); return; }
    else if (!edge && rng.next() < 0.3) { // a smiling sun on a stick, watching you
      const x = cc.x + 8, z = cc.z - 8, head = new THREE.Group(); head.position.set(x, 9, z); group.add(head);
      doodle(meshAt(new THREE.CylinderGeometry(0.2, 0.2, 9, 6), paper(0x8a8a8a), x, 4.5, z));
      doodle(meshAt(new THREE.CylinderGeometry(2, 2, 0.4, 12), paper(0xffd23a), 0, 0, 0, head)).rotation.x = Math.PI / 2;
      const eyeMat = neon(0x111111, 1); for (const ex of [-0.7, 0.7]) meshAt(new THREE.SphereGeometry(0.25, 6, 4), eyeMat, ex, 0.4, 0.3, head);
      if (W.scarecrows.length < 12) watcher(x, z, head, eyeMat, 0x3a3aff, 10); else solid(x, z, 1, 1, 10);
    }
    openSpot(cc, edge);
  };
  const crayonsCell = (cc, i, j, edge) => {
    if (!edge) around(cc, rng.int(2, 4), 6, 10, (x, z) => {
      const h = rng.range(9, 18), col = rng.pick([0xe83a3a, 0x3a8ae8, 0xe8c83a, 0x3ac85a, 0xb44aff, 0xff8a1a]);
      const c = doodle(meshAt(new THREE.CylinderGeometry(1.1, 1.1, h, 8), paper(col), x, h / 2, z));
      doodle(meshAt(new THREE.ConeGeometry(1.1, 2.4, 8), paper(col), x, h + 1.2, z));
      meshAt(new THREE.CylinderGeometry(1.15, 1.15, h * 0.5, 8), paper(0xf0f0e8), x, h * 0.45, z);
      solid(x, z, 2.2, 2.2, h + 2);
      W.mapRects.push({ x, z, w: 2.4, d: 2.4, color: hex6(col), round: true });
    });
    openSpot(cc, edge);
  };
  const paintsplashCell = (cc, i, j, edge) => {
    if (!edge && rng.next() < 0.65) { // a sticky puddle of paint, with the bucket it fell from
      const col = rng.pick([0xff3ad8, 0x3ad8ff, 0xffd23a, 0x3aff8a]), x = cc.x + rng.range(-3, 3), z = cc.z + rng.range(-3, 3), w = rng.range(8, 12), d = rng.range(7, 11);
      pool(x, z, w, d, 'choco', std(col, { roughness: 0.2, emissive: col, emissiveIntensity: 0.2 }), hex6(col), col);
      const b = doodle(meshAt(new THREE.CylinderGeometry(1.8, 1.5, 3.4, 10), paper(0xd8d8e0), x + w / 2 + 1, 1.8, z)); b.rotation.z = 1.3;
      solid(x + w / 2 + 1, z, 3.6, 3.6, 3);
    }
    if (!edge && rng.next() < 0.4) { const x = cc.x - 8, z = cc.z + 8; doodle(meshAt(new THREE.CylinderGeometry(0.4, 0.4, 10, 6), paper(0xb87a4a), x, 5, z)).rotation.z = 0.4; }
    openSpot(cc, edge);
  };

  // --- Ghost Cruise Ship
  const deckWhite = std(0xe8ecf0, { roughness: 0.6 });
  const cruiseCell = (cc, i, j, edge) => {
    box(C, 0.25, C, std(0x8a6a4a, { roughness: 1 }), cc.x, 0.12, cc.z, false).receiveShadow = true;
    const r = edge ? 1 : rng.next();
    if (r < 0.22) { // a huge red-topped smokestack
      const R = rng.range(4, 5), h = rng.range(22, 28);
      meshAt(new THREE.CylinderGeometry(R, R * 1.1, h, 16), deckWhite, cc.x, h / 2, cc.z);
      meshAt(new THREE.CylinderGeometry(R + 0.05, R + 0.05, h * 0.25, 16), std(0xc01a1a), cc.x, h * 0.88, cc.z);
      for (let k = 0; k < 4; k++) inst('stackSmoke', GEO.sphere, MAT.cottonCloud, cc.x + k * 1.6, h + 2 + k * 2.5, cc.z, { s: 2 + k * 0.8, color: 0x6a6a70, cast: false });
      solid(cc.x, cc.z, R * 2, R * 2, h);
      W.mapRects.push({ x: cc.x, z: cc.z, w: R * 2, d: R * 2, color: '#e8ecf0', round: true });
      return;
    }
    if (r < 0.36) { // the bridge, windows glowing
      house(cc, { wall: deckWhite, roof: 'flat', roofMat: std(0x3a4a5a), h: rng.int(9, 12), win: neon(0x9affe8, 1.4), winN: 5, door: std(0x2a3a4a), map: '#e8ecf0' });
      return;
    }
    if (r < 0.48 && !edge) { // lifeboats hanging from davits along the rail
      const z = cc.z + rng.pick([-1, 1]) * 8;
      for (let k = -1; k <= 1; k++) { const x = cc.x + k * 6; inst('lifeboat', GEO.sphere, MAT.toy, x, 5, z, { sx: 2.2, sy: 1, sz: 1, color: 0xff6a1a }); for (const s of [-1, 1]) inst('davit', GEO.box, MAT.metal, x + s * 2, 3.5, z, { sx: 0.3, sy: 7, sz: 0.3, color: 0xe8e8e8 }); }
      inst('rail', GEO.box, MAT.metal, cc.x, 1.4, z + 1.6, { sx: C, sy: 0.15, sz: 0.15, color: 0xe8e8e8 });
      solid(cc.x, z, 18, 3, 7);
      W.mapRects.push({ x: cc.x, z, w: 18, d: 3, color: '#ff6a1a' });
    } else if (r < 0.58 && !edge) around(cc, rng.int(2, 4), 5, 10, (x, z) => { const ry = rng.next() * 6; inst('deckChair', GEO.box, MAT.bark, x, 0.8, z, { sx: 1.6, sy: 0.25, sz: 4, ry, rx: 0.1 }); inst('deckBack', GEO.box, MAT.bark, x, 1.6, z, { sx: 1.6, sy: 0.25, sz: 1.8, ry, rx: -0.9 }); });
    else if (r < 0.64) { speedPad(cc); W.patrol.push(cc); return; }
    else if (rng.next() < 0.5) lamp(cc.x + C / 2 - 4, cc.z + C / 2 - 4, neon(0xd0fff4, 2.6), 0x5affd8);
    openSpot(cc, edge);
  };
  const pooldeckCell = (cc, i, j, edge) => {
    if (!edge && rng.next() < 0.6) { // a swimming pool (it slows you down) and a slide
      const w = rng.range(10, 14), d = rng.range(7, 10);
      pool(cc.x, cc.z, w, d, 'water', std(0x2ab8e8, { roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.85, emissive: 0x0a4a6a, emissiveIntensity: 0.5 }), '#2ab8e8', 0x3ad8ff);
      for (const [x, z, ww, dd] of [[cc.x, cc.z - d / 2 - 0.5, w + 2, 1], [cc.x, cc.z + d / 2 + 0.5, w + 2, 1]]) box(ww, 0.4, dd, deckWhite, x, 0.3, z, false);
      if (rng.next() < 0.5) { const sl = box(1.6, 0.3, 10, std(0xffd23a), cc.x + w / 2 + 2, 3, cc.z); sl.rotation.x = 0.5; inst('slideLadder', GEO.box, MAT.metal, cc.x + w / 2 + 2, 3.5, cc.z + 4.6, { sx: 1.6, sy: 7, sz: 0.3, color: 0xc0c0c8 }); solid(cc.x + w / 2 + 2, cc.z + 2, 1.6, 6, 6); }
    }
    if (!edge) around(cc, rng.int(0, 2), 8, 10, (x, z) => { inst('umbPole', GEO.cyl, MAT.metal, x, 3, z, { sx: 0.1, sy: 6, sz: 0.1, color: 0xe8e8e8 }); inst('umbTop', GEO.cone, MAT.toy, x, 6.2, z, { sx: 3.4, sy: 1.4, sz: 3.4, color: rng.pick([0x3a8ae8, 0xffffff]) }); solid(x, z, 0.5, 0.5, 6); });
    openSpot(cc, edge);
  };
  const engineroomCell = (cc, i, j, edge) => {
    if (!edge) around(cc, rng.int(1, 2), 6.5, 9, (x, z) => { // a roaring furnace boiler
      meshAt(new THREE.CylinderGeometry(3, 3, 9, 14), std(0x5a4a3a, { metalness: 0.6, roughness: 0.4 }), x, 4.5, z).rotation.x = Math.PI / 2;
      meshAt(new THREE.CylinderGeometry(1.2, 1.2, 0.3, 12), neon(0xff6a1a, 2.4), x, 4.5, z - 4.6).rotation.x = Math.PI / 2;
      glowDecal(x, z - 6, 6, 0xff6a1a, 0.4);
      solid(x, z, 6, 9, 7.5);
      W.mapRects.push({ x, z, w: 6, d: 9, color: '#5a4a3a' });
    });
    if (!edge && rng.next() < 0.6) bigGear(cc.x + rng.range(-6, 6), 8, cc.z + rng.range(-6, 6), rng.range(2.5, 4), rng.next() * 6, rng.pick([-0.8, 0.8]));
    openSpot(cc, edge);
  };

  // --- Spider Queen's Nest
  const webMat = new THREE.LineBasicMaterial({ color: 0xe8e8f0, transparent: true, opacity: 0.55 });
  const web = (x, y, z, R, ry) => { // a big spider web: spokes and rings
    const pts = [];
    for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; pts.push(0, 0, 0, Math.cos(a) * R, Math.sin(a) * R, 0); }
    for (let rr = 1; rr <= 5; rr++) for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2, b = ((k + 1) / 10) * Math.PI * 2, q = (R * rr) / 5; pts.push(Math.cos(a) * q, Math.sin(a) * q, 0, Math.cos(b) * q, Math.sin(b) * q, 0); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const l = new THREE.LineSegments(geo, webMat); l.position.set(x, y, z); l.rotation.y = ry; group.add(l);
  };
  const eggSacs = (x, z, n) => { for (let k = 0; k < n; k++) inst('eggSac', GEO.sphere, MAT.alienCap, x + rng.range(-1.5, 1.5), 0.8 + rng.range(0, 0.6), z + rng.range(-1.5, 1.5), { sx: 0.9, sy: 1.2, sz: 0.9, color: rng.pick([0xc8ff6a, 0xe8ffc8]) }); glowDecal(x, z, 4, 0xc8ff6a, 0.35); };
  const cocoon = (x, z) => { const y = rng.range(5, 9); inst('cocoon', GEO.sphere, MAT.stone, x, y, z, { sx: 0.9, sy: 2, sz: 0.9, color: 0xe8e8e0 }); inst('silk', GEO.box, MAT.bulb, x, y + 6, z, { sx: 0.05, sy: 10, sz: 0.05, color: 0xd8d8e0, cast: false }); };
  const nestCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (r < 0.28) { // a hut smothered in webs
      const { w, d, h } = house(cc, { wall: std(0x3a3434, { roughness: 1 }), roof: 'cone', roofMat: std(0x2a2424, { flatShading: true }), sides: 6, h: rng.int(6, 8), win: neon(0xb44aff, 1.2), winN: 2, door: std(0x0a0a0a), map: '#3a3434' });
      meshAt(new THREE.ConeGeometry(Math.max(w, d) * 0.75, h + 8, 8, 1, true), std(0xf0f0f8, { transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }), cc.x, (h + 8) / 2, cc.z).castShadow = false;
      return;
    }
    if (r < 0.46 && !edge) { // a giant web strung between two posts
      const z = cc.z + rng.pick([-1, 1]) * 5;
      for (const sx of [-8, 8]) { inst('webPost', GEO.cyl, MAT.deadBark, cc.x + sx, 7, z, { sx: 0.5, sy: 14, sz: 0.5 }); solid(cc.x + sx, z, 1, 1, 14); }
      web(cc.x, 7.5, z, 7.5, 0);
      eggSacs(cc.x + rng.range(-6, 6), cc.z - Math.sign(z - cc.z) * 6, 4);
      openSpot(cc, edge); return;
    }
    if (r < 0.56) { bushRing(cc, i, j, () => rng.pick([0x1a1a1a, 0x2a2024])); return; }
    if (r < 0.62) { speedPad(cc); W.patrol.push(cc); return; }
    if (!edge) { cocoon(cc.x + rng.range(-8, 8), cc.z + rng.range(-8, 8)); if (rng.next() < 0.5) eggSacs(cc.x + 8, cc.z + 8, 3); }
    openSpot(cc, edge);
  };
  const webwoodsCell = (cc, i, j, edge) => {
    if (!edge) around(cc, rng.int(2, 3), 6.5, 10, (x, z) => { deadTree(x, z); if (rng.next() < 0.5) web(x + 2.5, 7, z, 3.5, rng.next() * 6); if (rng.next() < 0.5) cocoon(x + 2, z + 1); });
    openSpot(cc, edge);
  };
  const eggcaveCell = (cc, i, j, edge) => {
    if (!edge) around(cc, rng.int(2, 3), 6.5, 10, (x, z) => { const s = rng.range(2.2, 3.4); inst('caveRock', GEO.sphere, rubbleMat, x, s * 0.6, z, { sx: s * 1.3, sy: s, sz: s, color: 0x3a302a }); solid(x, z, s * 2.2, s * 2, s * 1.4); eggSacs(x + s + 1.5, z, rng.int(3, 6)); });
    openSpot(cc, edge);
  };

  // --- Mirror Dimension
  const mirrorMat = std(0xe8f0ff, { metalness: 1, roughness: 0.04 }), mirrorTint = () => std(rng.pick([0xffd8f8, 0xd8f0ff, 0xf8f0d8]), { metalness: 1, roughness: 0.06 });
  const mirrortownCell = (cc, i, j, edge) => {
    const r = edge ? 1 : rng.next();
    if (rng.next() < 0.18) { // a house hanging upside down from the sky
      const g = new THREE.Group(); g.position.set(cc.x + rng.range(-4, 4), rng.range(30, 40), cc.z + rng.range(-4, 4)); g.rotation.set(Math.PI, rng.next() * 6, 0); group.add(g);
      meshAt(BOX(8, 6, 8), mirrorTint(), 0, 3, 0, g); meshAt(new THREE.ConeGeometry(6.5, 4, 4), mirrorMat, 0, 8, 0, g).rotation.y = Math.PI / 4;
      W.spinners.push({ obj: g, axis: 'y', speed: 0.06 });
    }
    if (r < 0.32) { const { w, h } = house(cc, { wall: mirrorTint(), roof: 'flat', roofMat: mirrorMat, h: rng.int(12, 22), map: '#e8f0ff' }); inst('mirrorTrim', GEO.box, MAT.bulb, cc.x, h + 0.9, cc.z, { sx: w + 1.2, sy: 0.3, sz: 0.3, color: 0xff6ae8, cast: false }); return; }
    if (r < 0.44 && !edge) { for (let k = 0; k < 4; k++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(rng.range(1, 2)), mirrorMat); s.position.set(cc.x + rng.range(-8, 8), rng.range(4, 12), cc.z + rng.range(-8, 8)); s.scale.y = 2; group.add(s); W.spinners.push({ obj: s, axis: 'y', speed: rng.range(0.4, 1.2) }); } }
    else if (r < 0.54) { bushRing(cc, i, j, () => rng.pick([0xd8b0e8, 0xb0d8e8])); return; }
    else if (r < 0.62) { speedPad(cc); W.patrol.push(cc); return; }
    else if (rng.next() < 0.5) lamp(cc.x + C / 2 - 4, cc.z + C / 2 - 4, neon(0xff9af0, 2.6), 0xff6ae8);
    openSpot(cc, edge);
  };
  const mirrormazeCell = (cc, i, j, edge) => {
    if (!edge) for (let k = 0; k < rng.int(3, 5); k++) { // mirror panels at odd angles
      const x = cc.x + rng.range(-8, 8), z = cc.z + rng.range(-8, 8), ry = rng.pick([0, Math.PI / 2, Math.PI / 4, -Math.PI / 4]), len = rng.range(5, 8);
      const m = box(len, 8, 0.3, mirrorMat, x, 4, z); m.rotation.y = ry;
      const ax = Math.abs(Math.cos(ry)), az = Math.abs(Math.sin(ry));
      if (az < 0.1 || ax < 0.1) solid(x, z, ax > 0.5 ? len : 0.4, ax > 0.5 ? 0.4 : len, 8);
      else for (let t = -len / 2 + 1; t <= len / 2 - 1; t += 1.5) solid(x + Math.cos(ry) * t, z - Math.sin(ry) * t, 1, 1, 8);
      W.mapRects.push({ x, z, w: len * ax + 0.4, d: len * az + 0.4, color: '#e8f0ff' });
    }
    openSpot(cc, edge);
  };
  const kaleidoCell = (cc, i, j, edge) => {
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; inst('kTri', GEO.cone, MAT.bulb, cc.x + Math.cos(a) * 5, 0.03, cc.z + Math.sin(a) * 5, { sx: 4, sy: 0.03, sz: 4, ry: a, color: RAINBOW[k], cast: false }); }
    if (!edge) around(cc, rng.int(1, 3), 6.5, 10, (x, z) => { const h = rng.range(5, 9), col = rng.pick(RAINBOW); inst('prism', GEO.cone, MAT.crystal, x, h / 2, z, { sx: 1.8, sy: h, sz: 1.8, color: col }); glowDecal(x, z, 4, col, 0.4); solid(x, z, 2.6, 2.6, h); });
    openSpot(cc, edge);
  };

  // ===== THE FINAL NIGHTMARE =====
  const obsidian = MAT.obsidian, runeM = neon(0xff1a3a, 2.2), voidM = neon(0xb44aff, 2);
  const throneCell = (cc, i, j, edge) => {
    if (!W.throneBuilt && j === mid + 2 && i === mid - 1) { // THE NIGHTMARE THRONE, right in front of the lair
      W.throneBuilt = true;
      const x = cc.x + C / 2, z = cc.z + 2, g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.PI; group.add(g);
      for (let k = 0; k < 4; k++) meshAt(BOX(22 - k * 2, 1.2, 16 - k * 2), obsidian, 0, 0.6 + k * 1.2, 0, g);
      meshAt(BOX(10, 5, 8), obsidian, 0, 7.3, 0, g);
      meshAt(BOX(12, 26, 2.5), obsidian, 0, 17, -4.5, g);
      for (let k = 0; k < 7; k++) { const sp = meshAt(new THREE.ConeGeometry(0.9, 8 + (3 - Math.abs(k - 3)) * 3, 6), obsidian, -6 + k * 2, 32 + (3 - Math.abs(k - 3)) * 1.5, -4.5, g); sp.rotation.z = (k - 3) * 0.12; }
      for (const s of [-1, 1]) { meshAt(BOX(2, 3, 8), obsidian, s * 6, 10.3, 0, g); fire(x - s * 6, z, 12.4, 1.4); }
      meshAt(new THREE.OctahedronGeometry(2.2), runeM, 0, 24, -3, g);
      for (let k = 0; k < 5; k++) meshAt(BOX(10.5, 0.3, 0.2), runeM, 0, 8 + k * 4, -3.2, g);
      glowDecal(x, z, 26, 0xff1a3a, 0.45);
      solid(x, z, 20, 14, 12); solid(x, z + 4.5, 12, 3, 34);
      W.mapRects.push({ x, z, w: 22, d: 16, color: '#ff1a3a' });
      return;
    }
    const r = edge ? 1 : rng.next();
    if (r < 0.22) { // an obsidian spire wrapped in glowing rune rings
      const h = rng.range(36, 64), R = rng.range(3, 4.5);
      inst('throneSpire', GEO.cone6, obsidian, cc.x, h / 2, cc.z, { sx: R, sy: h, sz: R });
      for (let k = 1; k < 5; k++) { const t = meshAt(new THREE.TorusGeometry(R * (1 - (k * 0.18) / 1) + 0.6, 0.25, 6, 20), runeM, cc.x, (h * k) / 6, cc.z); t.rotation.x = Math.PI / 2; t.castShadow = false; }
      glowDecal(cc.x, cc.z, R * 3, 0xff1a3a, 0.4);
      solid(cc.x, cc.z, R * 1.6, R * 1.6, h);
      W.mapRects.push({ x: cc.x, z: cc.z, w: R * 2, d: R * 2, color: '#1a1214', round: true });
      return;
    }
    if (r < 0.36 && !edge) { const alongX = rng.next() < 0.5, off = rng.pick([-1, 1]) * 7, w = alongX ? C : 5, d = alongX ? 5 : C; pool(cc.x + (alongX ? 0 : off), cc.z + (alongX ? off : 0), w, d, 'lava', MAT.lava, '#ff4a0a', 0xff4a0a); }
    else if (r < 0.5 && !edge) { // a giant pillar of flame
      const x = cc.x + rng.pick([-1, 1]) * 6, z = cc.z + rng.pick([-1, 1]) * 6, h = rng.range(14, 20);
      inst('flamePillar', GEO.cyl6, obsidian, x, h / 2, z, { sx: 1.8, sy: h, sz: 1.8 });
      inst('pillarFire', GEO.cone6, MAT.ember, x, h + 3, z, { sx: 2.2, sy: 6, sz: 2.2, cast: false });
      glowDecal(x, z, 10, 0xff5a1a, 0.4); solid(x, z, 3.6, 3.6, h);
    } else if (r < 0.6 && !edge) { // skull gate
      const z = cc.z + rng.pick([-1, 1]) * 6;
      for (const sx of [-6, 6]) { inst('gatePillar', GEO.box, obsidian, cc.x + sx, 7, z, { sx: 2.4, sy: 14, sz: 2.4 }); inst('gateSkull', GEO.sphere, MAT.boneM, cc.x + sx, 15.6, z, { s: 1.6 }); solid(cc.x + sx, z, 2.4, 2.4, 17); }
      inst('gateBeam', GEO.box, obsidian, cc.x, 13.5, z, { sx: 14.4, sy: 1.6, sz: 2.4 });
      for (let k = 0; k < 6; k++) inst('gateChain', GEO.box, MAT.metal, cc.x - 5 + k * 2, 10, z, { sx: 0.25, sy: 6, sz: 0.25, color: 0x3a3a3a, cast: false });
    } else if (r < 0.66) { speedPad(cc); W.patrol.push(cc); return; }
    else if (!edge) { fire(cc.x + 8, cc.z - 8, 0.4, 1.2); fire(cc.x - 8, cc.z + 8, 0.4, 1.2); }
    openSpot(cc, edge);
  };
  const voidriftCell = (cc, i, j, edge) => {
    for (let k = 0; k < 3; k++) { const x = cc.x + rng.range(-9, 9), z = cc.z + rng.range(-9, 9); inst('voidCrack', GEO.box, voidM, x, 0.04, z, { sx: rng.range(4, 9), sy: 0.04, sz: 0.3, ry: rng.next() * 6, cast: false }); }
    glowDecal(cc.x, cc.z, 10, 0xb44aff, 0.25);
    if (rng.next() < 0.5) { // a chunk of the world floating up into the void
      const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(rng.range(2, 4.5), 0), std(0x2a1a3a, { flatShading: true, emissive: 0x3a0a6a, emissiveIntensity: 0.4 }));
      rk.position.set(cc.x + rng.range(-6, 6), rng.range(8, 28), cc.z + rng.range(-6, 6)); rk.castShadow = true; group.add(rk);
      W.spinners.push({ obj: rk, axis: rng.pick(['x', 'y']), speed: rng.range(0.1, 0.4) });
    }
    if (!edge) around(cc, rng.int(1, 2), 7, 10, (x, z) => { const h = rng.range(4, 9); inst('voidCrystal', GEO.cone6, MAT.crystal, x, h / 2, z, { sx: 1.2, sy: h, sz: 1.2, color: 0xb44aff, rz: rng.range(-0.2, 0.2) }); solid(x, z, 2, 2, h); });
    openSpot(cc, edge);
  };
  const bonefieldCell = (cc, i, j, edge) => {
    if (!edge && rng.next() < 0.5) { // the ribcage of a fallen titan; you can run right through it
      const alongX = rng.next() < 0.5, g = new THREE.Group(); g.position.set(cc.x, 0, cc.z); g.rotation.y = alongX ? Math.PI / 2 : 0; group.add(g);
      meshAt(BOX(1.6, 1.6, C - 4), MAT.boneM, 0, 1, 0, g);
      for (let k = 0; k < 6; k++) { const rb = meshAt(new THREE.TorusGeometry(8 - Math.abs(k - 2.5) * 0.6, 0.6, 6, 14, Math.PI), MAT.boneM, 0, 0, -9 + k * 3.6, g); rb.rotation.y = 0; }
      for (const s of [-1, 1]) for (let k = 0; k < 6; k++) { const px = s * (8 - Math.abs(k - 2.5) * 0.6), pz = -9 + k * 3.6; solid(cc.x + (alongX ? pz : px), cc.z + (alongX ? -px : pz), 1.4, 1.4, 4); }
      W.mapRects.push({ x: cc.x, z: cc.z, w: alongX ? C - 4 : 17, d: alongX ? 17 : C - 4, color: '#e8dcc8' });
    } else if (!edge) around(cc, rng.int(1, 2), 6, 9, (x, z) => { // a titan's skull
      inst('titanSkull', GEO.sphere, MAT.boneM, x, 3, z, { sx: 4, sy: 3.2, sz: 4.6 });
      for (const s of [-1, 1]) inst('skullEye', GEO.sphere, MAT.blood, x + s * 1.6, 3.6, z + 3.6, { s: 0.6, cast: false });
      solid(x, z, 7, 7, 6);
      W.mapRects.push({ x, z, w: 8, d: 8, color: '#e8dcc8', round: true });
    });
    for (let k = 0; k < 4; k++) inst('bone', GEO.box, MAT.boneM, cc.x + rng.range(-10, 10), 0.2, cc.z + rng.range(-10, 10), { sx: 0.4, sy: 0.4, sz: rng.range(2, 4), ry: rng.next() * 6, cast: false });
    openSpot(cc, edge);
  };
  const stormspireCell = (cc, i, j, edge) => {
    if (!edge && rng.next() < 0.6) { // a tall spire with a crackling storm orb
      const x = cc.x + rng.range(-5, 5), z = cc.z + rng.range(-5, 5), h = rng.range(20, 34);
      inst('stormSpire', GEO.cone6, MAT.metal, x, h / 2, z, { sx: 1.6, sy: h, sz: 1.6, color: 0x3a3a4a });
      meshAt(new THREE.SphereGeometry(1.8, 14, 10), neon(0x9ae8ff, 2.4), x, h + 1.5, z);
      const arcs = new THREE.Group(); arcs.position.set(x, h + 1.5, z); group.add(arcs);
      for (let k = 0; k < 5; k++) { const b = new THREE.Mesh(BOX(0.15, 0.15, 6), neon(0xd0f4ff, 3)); b.position.set(Math.cos(k * 1.26) * 2.8, rng.range(-1, 1), Math.sin(k * 1.26) * 2.8); b.rotation.set(rng.range(-0.8, 0.8), k * 1.26, rng.range(-0.5, 0.5)); arcs.add(b); }
      W.spinners.push({ obj: arcs, axis: 'y', speed: rng.range(4, 8) });
      glowDecal(x, z, 10, 0x9ae8ff, 0.35);
      solid(x, z, 2.6, 2.6, h);
      W.mapRects.push({ x, z, w: 3, d: 3, color: '#9ae8ff', round: true });
    }
    for (let k = 0; k < 2; k++) inst('scorch', GEO.cyl, MAT.stone, cc.x + rng.range(-9, 9), 0.03, cc.z + rng.range(-9, 9), { sx: rng.range(2, 4), sy: 0.03, sz: rng.range(2, 4), color: 0x0a0a0e, cast: false });
    openSpot(cc, edge);
  };

  // ===== Levels 50-98: the kit. Props + building styles, combined differently (and colored differently) per level =====
  const KP = { // every prop: (x, z, palette) where palette = { a: wall color, b: roof color, w: glow color }
    pine: (x, z) => tree(x, z), deadtree: (x, z) => deadTree(x, z), palm: (x, z) => palm(x, z), cactus: (x, z) => cactus(x, z),
    alienshroom: (x, z) => fancyTree(x, z, 'alien'), candytree: (x, z) => fancyTree(x, z, 'candy'), jungletree: (x, z) => fancyTree(x, z, 'jungle'), fern: (x, z) => fancyTree(x, z, 'fern'),
    bigtree: (x, z) => { const h = rng.range(16, 24); inst('kBigTrunk', GEO.trunk, MAT.bark, x, h / 2, z, { sx: 2, sy: h, sz: 2, color: 0x4a3420 }); for (let k = 0; k < 3; k++) inst('kCanopy', GEO.sphere, MAT.pine, x + rng.range(-2, 2), h - k * 2.5, z + rng.range(-2, 2), { sx: rng.range(5, 7), sy: 3, sz: rng.range(5, 7), color: rng.pick([0x2a4a22, 0x22401c, 0x3a5a2a]) }); solid(x, z, 3, 3, h); W.mapRects.push({ x, z, w: 9, d: 9, color: '#2a4a22', round: true }); },
    blossom: (x, z) => { const h = rng.range(7, 10); inst('bTrunk', GEO.trunk, MAT.bark, x, h / 2, z, { sx: 0.8, sy: h, sz: 0.8, color: 0x3a2a24 }); for (let k = 0; k < 6; k++) inst('blossom', GEO.sphere, MAT.alienCap, x + rng.range(-3, 3), h + rng.range(-1, 2), z + rng.range(-3, 3), { s: rng.range(2, 3.2), color: rng.pick([0xffb0d0, 0xff9ac0]) }); solid(x, z, 1.6, 1.6, h); },
    bamboo: (x, z) => { for (let k = 0; k < 6; k++) { const h = rng.range(12, 20), bx = x + rng.range(-2, 2), bz = z + rng.range(-2, 2); inst('bamboo', GEO.cyl6, MAT.pine, bx, h / 2, bz, { sx: 0.35, sy: h, sz: 0.35, color: 0x5a9a3a }); } solid(x, z, 4, 4, 18); },
    sunflower: (x, z) => { for (let k = 0; k < 3; k++) { const fx = x + (k - 1) * 2, h = rng.range(7, 11); inst('sfStem', GEO.cyl, MAT.pine, fx, h / 2, z, { sx: 0.25, sy: h, sz: 0.25, color: 0x3a8a1a }); inst('sfPetals', GEO.cyl, MAT.bulb, fx, h, z - 0.3, { sx: 1.8, sy: 0.2, sz: 1.8, rx: Math.PI / 2, color: 0xffd23a, cast: false }); inst('sfMid', GEO.cyl, MAT.stone, fx, h, z - 0.45, { sx: 0.9, sy: 0.2, sz: 0.9, rx: Math.PI / 2, color: 0x4a2a10 }); } solid(x, z, 6, 1, 9); },
    boulder: (x, z) => { const s = rng.range(1.8, 3); inst('kBoulder', GEO.sphere, rubbleMat, x, s * 0.6, z, { sx: s * 1.3, sy: s, sz: s, ry: rng.next() * 6, color: rng.pick([0x5a5e66, 0x6a6258, 0x4a4a52]) }); solid(x, z, s * 2.2, s * 2, s * 1.4); W.mapRects.push({ x, z, w: s * 2.4, d: s * 2.4, color: '#5a5e66', round: true }); },
    crystal: (x, z, P) => { for (let k = 0; k < 3; k++) { const h = rng.range(3, 7); inst('kCrystal', GEO.cone6, MAT.crystal, x + rng.range(-1.2, 1.2), h / 2, z + rng.range(-1.2, 1.2), { sx: 0.9, sy: h, sz: 0.9, rz: rng.range(-0.3, 0.3), color: P.w }); } glowDecal(x, z, 4, P.w, 0.35); solid(x, z, 2.6, 2.6, 6); },
    obelisk: (x, z, P) => { const h = rng.range(10, 16); inst('kObelisk', GEO.box, MAT.stone, x, h / 2, z, { sx: 1.8, sy: h, sz: 1.8, color: 0x2a2a30 }); inst('kObTop', GEO.cone, MAT.stone, x, h + 0.8, z, { sx: 1.3, sy: 1.6, sz: 1.3, color: 0x2a2a30 }); inst('kRune', GEO.box, MAT.bulb, x, h * 0.6, z, { sx: 1.9, sy: 0.4, sz: 1.9, color: P.w, cast: false }); glowDecal(x, z, 4, P.w, 0.3); solid(x, z, 2, 2, h); },
    pillar: (x, z, P) => { const h = rng.range(8, 14); inst('kPillar', GEO.cyl, MAT.stone, x, h / 2, z, { sx: 0.9, sy: h, sz: 0.9, color: new THREE.Color(P.a).lerp(new THREE.Color(0xffffff), 0.5).getHex() }); inst('kCap', GEO.box, MAT.stone, x, h + 0.3, z, { sx: 2.4, sy: 0.6, sz: 2.4, color: P.b }); solid(x, z, 2, 2, h); },
    statue: (x, z) => statueOn(x, z, W.scarecrows.length < 12),
    lamp: (x, z, P) => lamp(x, z, neon(P.w, 2.6), P.w),
    stonelantern: (x, z) => stoneLantern(x, z),
    lanterns: (x, z, P) => { for (const sx of [-6, 6]) { inst('lanternPole', GEO.cyl, MAT.bark, x + sx, 4.5, z, { sx: 0.25, sy: 9, sz: 0.25 }); solid(x + sx, z, 0.8, 0.8, 9); } for (let k = 0; k < 6; k++) inst('paperL', GEO.sphere, MAT.bulb, x - 5 + k * 2, 8 - Math.sin((k / 5) * Math.PI) * 1.2, z, { sx: 0.7, sy: 0.95, sz: 0.7, color: k % 2 ? P.w : 0xffb03a, cast: false }); glowDecal(x, z, 7, P.w, 0.2); },
    fire: (x, z) => brazier(x, z), barrel: (x, z) => barrel(x, z), bones: (x, z) => bones(x, z, 5), hologram: (x, z) => hologram(x, z),
    crates: (x, z) => { const s = rng.range(3, 4.5); box(s, s, s, crateMat, x, s / 2, z); if (rng.next() < 0.5) box(s * 0.8, s * 0.8, s * 0.8, crateMat2, x, s * 1.4, z); solid(x, z, s, s, s * 1.8); W.mapRects.push({ x, z, w: s, d: s, color: '#6b4c2e' }); },
    haybale: (x, z) => { for (let k = 0; k < 2; k++) inst('kHay', GEO.cyl, MAT.hay, x + k * 2.6, 1.2, z, { sx: 1.2, sy: 2.4, sz: 1.2, rz: Math.PI / 2 }); solid(x + 1.3, z, 5, 2.4, 2.4); },
    windmill: (x, z, P) => { inst('kMillTower', GEO.cone6, MAT.stone, x, 6, z, { sx: 3, sy: 12, sz: 3, color: P.a }); const bl = new THREE.Group(); bl.position.set(x, 11, z - 2); group.add(bl); for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(BOX(0.8, 7, 0.2), std(0xe8dcc0)); b.position.y = 3.5; const p = new THREE.Group(); p.rotation.z = (k / 4) * Math.PI * 2; p.add(b); bl.add(p); } W.spinners.push({ obj: bl, axis: 'z', speed: 0.6 }); solid(x, z, 4, 4, 12); W.mapRects.push({ x, z, w: 5, d: 5, color: hex6(P.a), round: true }); },
    fence: (x, z) => { for (let k = 0; k < 5; k++) inst('kPost', GEO.box, MAT.bark, x - 4 + k * 2, 1.2, z, { sx: 0.3, sy: 2.4, sz: 0.3 }); for (const y of [0.8, 1.8]) inst('kRail', GEO.box, MAT.bark, x, y, z, { sx: 8.4, sy: 0.2, sz: 0.15 }); solid(x, z, 8.4, 0.5, 2.4); },
    bench: (x, z) => { inst('bench', GEO.box, MAT.bark, x, 1, z, { sx: 5, sy: 0.3, sz: 1.4 }); inst('benchB', GEO.box, MAT.bark, x, 1.8, z + 0.6, { sx: 5, sy: 1.2, sz: 0.2 }); solid(x, z, 5, 1.4, 1.2); },
    gravestone: (x, z) => { for (let k = 0; k < 3; k++) { const gx = x - 3 + k * 3; inst('kGrave', GEO.box, MAT.stone, gx, 1.2, z, { sx: 1.6, sy: 2.4, sz: 0.4, rz: rng.range(-0.15, 0.15), color: 0x7a7e84 }); solid(gx, z, 1.6, 0.6, 2.4); } },
    coinpile: (x, z) => { const R = rng.range(2.5, 4); inst('coinPile', GEO.dome, MAT.gold, x, 0, z, { sx: R, sy: R * 0.6, sz: R }); solid(x, z, R * 1.4, R * 1.4, R * 0.55); },
    shroom: (x, z, P) => { for (let k = 0; k < 5; k++) { const mx = x + rng.range(-2.5, 2.5), mz = z + rng.range(-2.5, 2.5); inst('tinyStem', GEO.cyl, MAT.stone, mx, 0.6, mz, { sx: 0.25, sy: 1.2, sz: 0.25, color: 0xe8e0d0, cast: false }); inst('tinyCap', GEO.dome, MAT.bulb, mx, 1.2, mz, { sx: 0.9, sy: 0.6, sz: 0.9, color: rng.pick([P.w, 0xff4ad0, 0x4affd0]), cast: false }); } glowDecal(x, z, 4, P.w, 0.3); },
    orb: (x, z, P) => { inst('orbPed', GEO.cyl, MAT.stone, x, 1, z, { sx: 0.9, sy: 2, sz: 0.9, color: 0x3a3a40 }); inst('orbGlow', GEO.sphere, MAT.bulb, x, 3.4, z, { s: 1.2, color: P.w, cast: false }); glowDecal(x, z, 5, P.w, 0.45); solid(x, z, 1.8, 1.8, 4.6); },
    rings: (x, z, P) => { const g = new THREE.Group(); g.position.set(x, 5, z); group.add(g); for (let k = 0; k < 2; k++) { const t = new THREE.Mesh(new THREE.TorusGeometry(2.6 - k * 0.8, 0.22, 6, 24), neon(k ? P.w : P.b, 2)); t.rotation.x = k * 1.2; g.add(t); } W.spinners.push({ obj: g, axis: 'y', speed: 1 }); inst('ringBase', GEO.cyl, MAT.metal, x, 1, z, { sx: 1.2, sy: 2, sz: 1.2, color: 0x3a3a44 }); glowDecal(x, z, 5, P.w, 0.3); solid(x, z, 2.4, 2.4, 2.2); },
    cone: (x, z) => { for (let k = 0; k < 3; k++) { const cx = x + rng.range(-2, 2), cz = z + rng.range(-2, 2); inst('cone', GEO.cone, MAT.toy, cx, 0.9, cz, { sx: 0.6, sy: 1.8, sz: 0.6, color: 0xff6a1a, cast: false }); inst('coneBand', GEO.cyl, MAT.bulb, cx, 1, cz, { sx: 0.42, sy: 0.25, sz: 0.42, color: 0xffffff, cast: false }); } },
    sign: (x, z, P) => { inst('kSignPost', GEO.box, MAT.metal, x, 3.5, z, { sx: 0.4, sy: 7, sz: 0.4, color: 0x3a3a40 }); inst('kSign', GEO.box, MAT.bulb, x, 7, z, { sx: 5, sy: 2.6, sz: 0.3, color: P.w, cast: false }); glowDecal(x, z, 5, P.w, 0.3); solid(x, z, 0.8, 0.8, 8); },
    giantball: (x, z, P) => { const R = rng.range(1.4, 2.8); inst('kBall', GEO.sphere, MAT.toy, x, R, z, { s: R, color: rng.pick([P.b, P.w, P.a, 0xffffff]) }); solid(x, z, R * 1.6, R * 1.6, R * 2); W.mapRects.push({ x, z, w: R * 2, d: R * 2, color: hex6(P.b), round: true }); },
    rod: (x, z) => { const h = rng.range(12, 18); inst('kRod', GEO.cyl, MAT.metal, x, h / 2, z, { sx: 0.25, sy: h, sz: 0.25, color: 0x8a8a90 }); inst('kRodOrb', GEO.sphere, MAT.bulb, x, h + 0.6, z, { s: 0.8, color: 0xfff4a0, cast: false }); glowDecal(x, z, 4, 0xfff4a0, 0.3); solid(x, z, 0.8, 0.8, h); },
    flag: (x, z, P) => { inst('kFlagPole', GEO.cyl, MAT.metal, x, 6, z, { sx: 0.15, sy: 12, sz: 0.15, color: 0xc0c0c8 }); inst('kFlag', GEO.box, MAT.stone, x + 1.6, 10.6, z, { sx: 3, sy: 1.8, sz: 0.05, color: P.b, cast: false }); solid(x, z, 0.6, 0.6, 12); },
    cauldron: (x, z, P) => { inst('kPot', GEO.sphere, MAT.metal, x, 1.6, z, { sx: 2.2, sy: 1.6, sz: 2.2, color: 0x1a1a1a }); inst('kBrew', GEO.cyl, MAT.bulb, x, 2.6, z, { sx: 1.8, sy: 0.1, sz: 1.8, color: P.w, cast: false }); for (let k = 0; k < 3; k++) inst('kBubble', GEO.sphere, MAT.bulb, x + rng.range(-1, 1), 3 + k * 0.4, z + rng.range(-1, 1), { s: 0.3, color: P.w, cast: false }); fire(x, z, 0.3, 0.6); solid(x, z, 4, 4, 3); },
    logs: (x, z) => { for (let k = 0; k < 5; k++) inst('kLog', GEO.cyl, MAT.bark, x, 0.7 + (k > 2 ? 1.2 : 0), z - 2 + (k % 3) * 1.4 + (k > 2 ? 0.7 : 0), { sx: 0.7, sy: 7, sz: 0.7, rz: Math.PI / 2 }); solid(x, z, 7, 4.4, 2.6); },
    stump: (x, z) => { const R = rng.range(1.2, 2); inst('kStump', GEO.trunk, MAT.bark, x, 0.8, z, { sx: R * 1.4, sy: 1.6, sz: R * 1.4, color: 0x5a3a20 }); inst('kRingTop', GEO.cyl, MAT.stone, x, 1.62, z, { sx: R * 1.2, sy: 0.05, sz: R * 1.2, color: 0xd8b880, cast: false }); solid(x, z, R * 2, R * 2, 1.6); },
    gear: (x, z) => { // most gears are still (batched, so they're cheap); a few turn
      inst('kGearPost', GEO.box, MAT.metal, x, 3, z, { sx: 0.6, sy: 6, sz: 0.6, color: 0x5a4a3a }); solid(x, z, 1, 1, 6);
      const R = rng.range(2, 3.2);
      if (rng.next() < 0.25) { bigGear(x, 7, z, R, rng.next() * 6, rng.pick([-0.8, 0.8])); return; }
      inst('kGearDisc', GEO.cyl, MAT.metal, x, 7, z, { sx: R, sy: 0.6, sz: R, rx: Math.PI / 2, color: 0xc8963a });
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; inst('kGearTooth', GEO.box, MAT.metal, x + Math.cos(a) * R, 7 + Math.sin(a) * R, z, { sx: R * 0.3, sy: R * 0.3, sz: 0.6, rz: a, color: 0xc8963a }); }
    },
    rocket: (x, z) => { const h = rng.range(14, 22); inst('kRocket', GEO.cyl, MAT.stone, x, h / 2 + 1, z, { sx: 1.6, sy: h, sz: 1.6, color: 0xf0f0f0 }); inst('kNose', GEO.cone, MAT.toy, x, h + 2.6, z, { sx: 1.6, sy: 3.2, sz: 1.6, color: 0xd82a2a }); for (let k = 0; k < 3; k++) inst('kFin', GEO.box, MAT.toy, x + Math.cos(k * 2.1) * 1.8, 2, z + Math.sin(k * 2.1) * 1.8, { sx: 0.2, sy: 3, sz: 1.6, ry: -k * 2.1, color: 0xd82a2a }); inst('kFlame', GEO.cone6, MAT.ember, x, 0.4, z, { sx: 1.2, sy: 1.6, sz: 1.2, rx: Math.PI, cast: false }); solid(x, z, 3.4, 3.4, h + 4); W.mapRects.push({ x, z, w: 4, d: 4, color: '#f0f0f0', round: true }); },
    needle: (x, z) => { const h = rng.range(12, 18); inst('kNeedle', GEO.cone6, MAT.metal, x, h / 2, z, { sx: 0.5, sy: h, sz: 0.5, rz: 0.2, rx: Math.PI, color: 0xc8ccd8 }); solid(x, z, 1, 1, h); },
    card: (x, z) => { const ry = rng.range(-0.5, 0.5); inst('kCard', GEO.box, MAT.stone, x, 5, z, { sx: 6, sy: 9, sz: 0.2, ry, color: 0xf8f8f8 }); inst('kSuit', GEO.sphere, MAT.blood, x, 5, z, { sx: 1.2, sy: 1.2, sz: 0.3, ry, cast: false }); solid(x, z, 5, 1.5, 9.5); },
    book: (x, z) => giantBook(x, z, rng.range(9, 14), rng.next() * 6),
    cloud: (x, z) => cloudPuff(x, rng.range(18, 30), z, rng.range(2.5, 4)),
    hedge: (x, z) => { const ry = rng.pick([0, Math.PI / 2]); inst('kHedge', GEO.box, MAT.pine, x, 2, z, { sx: 8, sy: 4, sz: 2, ry, color: 0x2a5a2a }); solid(x, z, ry ? 2 : 8, ry ? 8 : 2, 4); W.mapRects.push({ x, z, w: ry ? 2 : 8, d: ry ? 8 : 2, color: '#2a5a2a' }); },
    'pool:water': (x, z, P) => pool(x, z, rng.range(6, 9), rng.range(6, 9), 'water', std(new THREE.Color(0x1a5a7a).lerp(new THREE.Color(P.w), 0.2).getHex(), { roughness: 0.05, metalness: 0.4, transparent: true, opacity: 0.8 }), '#2a7aa0', P.w),
    'pool:lava': (x, z, P) => pool(x, z, rng.range(6, 9), rng.range(6, 9), 'lava', neon(P.w, 1.6), hex6(P.w), P.w, { color: P.w, css: hex6(P.w) }),
    'pool:choco': (x, z) => pool(x, z, rng.range(6, 9), rng.range(6, 9), 'choco', MAT.choco, '#5a2e18', 0),
    pumpkin: (x, z) => { for (let k = 0; k < 3; k++) { const s = rng.range(0.9, 1.8), px = x + rng.range(-2.5, 2.5), pz = z + rng.range(-2.5, 2.5); inst('kPumpkin', GEO.sphere, MAT.pumpkin, px, s * 0.8, pz, { sx: s * 1.2, sy: s * 0.9, sz: s * 1.2, color: 0xe8701a }); inst('kPumpFace', GEO.box, MAT.ember, px, s * 0.9, pz - s * 1.15, { sx: s * 0.8, sy: s * 0.3, sz: 0.05, cast: false }); } solid(x, z, 5, 5, 2.4); },
  };
  const kitBuilding = (cc, style, P) => {
    const wall = std(P.a, { roughness: 0.85 }), roof = std(P.b, { roughness: 0.7, flatShading: true }), win = neon(P.w, 1.3), map = hex6(P.a);
    if (style === 'house') { house(cc, { wall, roof: 'gable', roofMat: roof, win, winN: 3, door: std(0x2a1a10), map }); return; }
    if (style === 'cottage') { house(cc, { wall, roof: 'cone', roofMat: roof, roofH: 8, sides: 4, w: rng.int(9, 12), d: rng.int(9, 12), h: rng.int(6, 8), win, winN: 2, door: std(0x3a2a1a), map }); return; }
    if (style === 'flat') { house(cc, { wall, roof: 'flat', roofMat: roof, h: rng.int(12, 22), win, winN: 4, door: std(0x1a1a1a), map }); return; }
    if (style === 'temple') { const { w, d, h } = house(cc, { wall, roof: 'flat', roofMat: roof, h: rng.int(10, 13), win, winN: 3, door: std(0x1a1a1a), map }); for (let k = 0; k < 5; k++) { const x = cc.x - w / 2 + 1 + k * ((w - 2) / 4); inst('kCol', GEO.cyl, wall, x, h / 2, cc.z - d / 2 - 2, { sx: 0.6, sy: h, sz: 0.6 }); solid(x, cc.z - d / 2 - 2, 1.2, 1.2, h); } return; }
    let R = rng.range(5.5, 7), h = rng.range(7, 10), top;
    if (style === 'dome') { meshAt(new THREE.CylinderGeometry(R, R, 3, 20), wall, cc.x, 1.5, cc.z); meshAt(new THREE.SphereGeometry(R, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), roof, cc.x, 3, cc.z); top = R + 3; }
    else if (style === 'tower') { h = rng.range(18, 28); R = rng.range(4.5, 6); meshAt(new THREE.CylinderGeometry(R, R * 1.1, h, 14), wall, cc.x, h / 2, cc.z); meshAt(new THREE.ConeGeometry(R * 1.3, h * 0.4, 14), roof, cc.x, h + h * 0.2, cc.z); top = h; }
    else if (style === 'tent') { meshAt(new THREE.ConeGeometry(R + 1, 10, 10), std(0xffffff, { map: stripeTex(hex6(P.a), hex6(P.b), 10), roughness: 1 }), cc.x, 5, cc.z); inst('kTentFlag', GEO.box, MAT.stone, cc.x + 0.8, 11, cc.z, { sx: 1.6, sy: 1, sz: 0.05, color: P.w, cast: false }); top = 9; }
    else if (style === 'pyramid') { for (let t = 0; t < 4; t++) box(2 * R - t * 2.6, 2.5, 2 * R - t * 2.6, wall, cc.x, 1.25 + t * 2.5, cc.z); box(2.4, 2.4, 2.4, win, cc.x, 11.2, cc.z, false); glowDecal(cc.x, cc.z, R * 1.4, P.w, 0.25); top = 10; }
    else if (style === 'hut') { meshAt(new THREE.CylinderGeometry(R, R, 5, 12), wall, cc.x, 2.5, cc.z); meshAt(new THREE.ConeGeometry(R * 1.3, 6, 12), roof, cc.x, 8, cc.z); top = 5; }
    else { // treehouse: a thick trunk with a little house on top
      inst('kTHTrunk', GEO.trunk, MAT.bark, cc.x, 5, cc.z, { sx: 2.2, sy: 10, sz: 2.2, color: 0x4a3420 });
      box(9, 0.6, 9, MAT.bark, cc.x, 10.3, cc.z); box(6, 5, 6, wall, cc.x, 13.1, cc.z); meshAt(new THREE.ConeGeometry(5.2, 3.6, 4), roof, cc.x, 17.4, cc.z).rotation.y = Math.PI / 4;
      for (let k = 0; k < 3; k++) inst('kCanopy', GEO.sphere, MAT.pine, cc.x + rng.range(-4, 4), 19 + k, cc.z + rng.range(-4, 4), { sx: 5, sy: 3, sz: 5, color: 0x2a4a22 });
      for (let k = 0; k < 6; k++) inst('rung', GEO.box, MAT.bark, cc.x, 1 + k * 1.6, cc.z - 1.3, { sx: 1.6, sy: 0.15, sz: 0.15 });
      solid(cc.x, cc.z, 3, 3, 10); W.mapRects.push({ x: cc.x, z: cc.z, w: 9, d: 9, color: map });
      openSpot(cc, false); return;
    }
    for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + 0.4; box(1.4, 1.4, 0.2, win, cc.x + Math.sin(a) * (R + 0.05), Math.min(top - 1.5, 3.5), cc.z + Math.cos(a) * (R + 0.05), false).rotation.y = a; }
    solid(cc.x, cc.z, R * 1.6, R * 1.6, top);
    W.mapRects.push({ x: cc.x, z: cc.z, w: R * 2, d: R * 2, color: map, round: true });
  };
  const kitCache = {};
  const kitCell = (zk) => {
    if (kitCache[zk]) return kitCache[zk];
    const [part, k] = ZONES[zk].kit, K = KIT[k], P = { a: K.town[2], b: K.town[3], w: K.town[4] }, prop = (name, x, z) => KP[name](x, z, P);
    if (part === 'town') {
      const [, style, , , , props] = K.town;
      return (kitCache[zk] = (cc, i, j, edge) => {
        const r = edge ? 1 : rng.next();
        if (r < 0.32) { kitBuilding(cc, style, P); return; }
        if (r < 0.46 && !edge) { around(cc, rng.int(1, 2), 6.5, 10, (x, z) => prop(props[0], x, z)); openSpot(cc, edge); return; }
        if (r < 0.58 && !edge) { around(cc, rng.int(1, 2), 6.5, 10, (x, z) => prop(props[1], x, z)); openSpot(cc, edge); return; }
        if (r < 0.66) { bushRing(cc, i, j, () => new THREE.Color(K.tint).multiplyScalar(rng.range(0.22, 0.38)).getHex()); return; }
        if (r < 0.72) { speedPad(cc); W.patrol.push(cc); return; }
        if (!edge && rng.next() < 0.7) prop(props[2], cc.x + rng.pick([-1, 1]) * 8, cc.z + rng.pick([-1, 1]) * 8);
        openSpot(cc, edge);
      });
    }
    const props = K[part][1];
    return (kitCache[zk] = (cc, i, j, edge) => {
      if (!edge) {
        const r = rng.next();
        if (r < 0.5) around(cc, rng.int(2, 3), 6.5, 10, (x, z) => prop(props[0], x, z));
        else if (r < 0.85) around(cc, rng.int(1, 3), 6.5, 10, (x, z) => prop(props[1], x, z));
        else { prop(props[0], cc.x - 7, cc.z - 7); prop(props[1], cc.x + 7, cc.z + 7); }
      }
      openSpot(cc, edge);
    });
  };

  const builders = {
    station: stationCell, hangar: hangarCell, reactor: reactorCell, storytown: storytownCell, pages: pagesCell, fairyring: fairyringCell,
    depot: depotCell, railyard: railyardCell, coalyard: coalyardCell, arcade: arcadeCell, pinball: pinballCell, slots: slotsCell,
    backlot: backlotCell, soundstage: soundstageCell, filmvault: filmvaultCell, bayou: bayouCell, cypress: cypressCell, bog: bogCell,
    colosseum: colosseumCell, arenasand: arenasandCell, catacombs: catacombsCell, doodletown: doodleTownCell, crayons: crayonsCell, paintsplash: paintsplashCell,
    cruise: cruiseCell, pooldeck: pooldeckCell, engineroom: engineroomCell, nest: nestCell, webwoods: webwoodsCell, eggcave: eggcaveCell,
    mirrortown: mirrortownCell, mirrormaze: mirrormazeCell, kaleido: kaleidoCell, throne: throneCell, voidrift: voidriftCell, bonefield: bonefieldCell, stormspire: stormspireCell,
    school: schoolCell, playground: playgroundCell, sportsfield: sportsfieldCell, kitchen: kitchenCell, pantry: pantryCell, sinkland: sinklandCell,
    opera: operaCell, backstage: backstageCell, ballroom: ballroomCell, dragonkeep: dragonkeepCell, goldhoard: goldhoardCell, crags: cragsCell,
    shrine: shrineCell, blossoms: blossomsCell, bamboo: bambooCell, rooftops: rooftopsCell, construction: constructionCell, billboards: billboardsCell,
    aquarium: aquariumCell, tanks: tanksCell, touchpools: touchpoolsCell, lab: labCell, vats: vatsCell, teslafield: teslafieldCell,
    greenhouse: greenhouseCell, flytraps: flytrapsCell, thorns: thornsCell, boardwalk: boardwalkCell, tidepools: tidepoolsCell, sandcastles: sandcastlesCell,
    museum: museumCell, statuegarden: statuegardenCell, fossilhall: fossilhallCell, sewers: sewersCell, sludge: sludgeCell, pipeworks: pipeworksCell,
    volcanotown: volcanotownCell, icecastle: icecastleCell, hospital: hospitalCell, shroomtown: shroomtownCell, westtown: westtownCell, skycity: skycityCell,
    mall: mallCell, hive: hiveCell, steamtown: steamtownCell, minecamp: minecampCell, shadowcity: shadowcityCell, rainbowtown: rainbowtownCell,
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
    dinoplains: dinoplainsCell, ferns: (cc, i, j, e) => forestCell(cc, i, j, e, 'fern'), tarpits: (cc, i, j, e) => lavaCell(cc, i, j, e, 'tar'), caves: (cc, i, j, e) => canyonCell(cc, i, j, e, 'cave'),
    piratetown: piratetownCell, beach: beachCell, shipyard: shipyardCell, lagoon: (cc, i, j, e) => lavaCell(cc, i, j, e, 'water'), seacave: (cc, i, j, e) => canyonCell(cc, i, j, e, 'trench'),
    cybercity: cybercityCell, servers: serversCell, lasergrid: (cc, i, j, e) => lavaCell(cc, i, j, e, 'laser'), neonpark: (cc, i, j, e) => forestCell(cc, i, j, e, 'neon'),
  };
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const cc = cellCenter(i, j);
    const zk = W.zones[j * N + i];
    if (!isLair(i, j)) (builders[zk] || builders[ZONES[zk].use] || kitCell(zk))(cc, i, j, j === 0 || j === N - 1);
    if (j === 0 && i > 0 && i < N - 1) W.spawns.push(cc.clone());
  }

  // ---- level decorations over the corner areas (nothing solid, so they never block a path)
  if (L.deco) {
    const D = L.deco, glowM = (c, k = 2.4) => neon(c, k);
    const DC = L.decoColor;
    const decoMat = { embers: glowM(0xff6a1a, 3), wisps: glowM(DC || 0x5affb0, 2.6), spores: glowM(0xd07aff, 2.4), fireflies: glowM(DC || 0xd8ff6a, 3), stars: MAT.bulb, gold: MAT.gold,
      flies: std(0x111111), papers: std(0xece8d8, { side: THREE.DoubleSide, roughness: 1 }), petals: std(DC || 0xff9ad0, { side: THREE.DoubleSide, emissive: DC || 0xff9ad0, emissiveIntensity: 0.3 }),
      bubbles: std(0xc8f0ff, { transparent: true, opacity: 0.3, roughness: 0.05, metalness: 0.3, depthWrite: false }), lanterns: std(0xff6a2a, { emissive: 0xff5a1a, emissiveIntensity: 1.4, roughness: 1 }),
      ice: std(0xc8ecff, { emissive: 0x3a9aff, emissiveIntensity: 0.6, roughness: 0.1, transparent: true, opacity: 0.85, flatShading: true }) }[D];
    for (let j = 1; j < N - 1; j++) for (let i = 0; i < N; i++) {
      const zk = W.zones[j * N + i];
      if (zk === L.center || isLair(i, j) || rng.next() > 0.4) continue;
      const cc = cellCenter(i, j), rx = () => cc.x + rng.range(-11, 11), rz = () => cc.z + rng.range(-11, 11);
      if (D === 'flies' || D === 'papers' || D === 'petals' || D === 'bubbles') { // little things swarming or drifting about
        const n = D === 'flies' ? 10 : D === 'bubbles' ? 4 : 6, cx = rx(), cz = rz();
        for (let k = 0; k < n; k++) {
          const x = D === 'flies' ? cx + rng.range(-1.5, 1.5) : rx(), z = D === 'flies' ? cz + rng.range(-1.5, 1.5) : rz();
          const y = D === 'papers' || D === 'petals' ? (rng.next() < 0.6 ? 0.08 : rng.range(2, 9)) : rng.range(1, D === 'bubbles' ? 14 : 4);
          if (D === 'papers') inst('decoPaper', GEO.box, decoMat, x, y, z, { sx: 1.2, sy: 0.02, sz: 1.6, ry: rng.next() * 6, rx: y > 1 ? rng.range(-1, 1) : 0, cast: false });
          else if (D === 'petals') inst('decoPetal', GEO.sphere, decoMat, x, y, z, { sx: 0.4, sy: 0.05, sz: 0.25, ry: rng.next() * 6, rx: rng.range(-0.6, 0.6), cast: false });
          else inst('deco' + D, GEO.sphere, decoMat, x, y, z, { s: D === 'flies' ? 0.1 : rng.range(0.4, 1.2), cast: false });
        }
      } else if (D === 'lanterns') { // paper lanterns drifting up into the sky
        const x = rx(), z = rz(), y = rng.range(8, 24);
        inst('decoLantern', GEO.cyl, decoMat, x, y, z, { sx: 0.8, sy: 1.3, sz: 0.8, cast: false });
        glowDecal(x, z, 4, 0xff6a2a, 0.15);
      } else if (D === 'embers' || D === 'wisps' || D === 'spores' || D === 'fireflies') {
        for (let k = 0; k < (D === 'fireflies' ? 6 : 3); k++) { const x = rx(), z = rz(); inst('deco' + D, GEO.sphere, decoMat, x, rng.range(2, D === 'embers' ? 14 : 8), z, { s: D === 'wisps' ? 0.5 : 0.22, cast: false }); }
        glowDecal(cc.x, cc.z, 9, DC || { embers: 0xff4a0a, wisps: 0x3aff9a, spores: 0xb44aff, fireflies: 0xc8ff3a }[D], 0.16);
      } else if (D === 'ice' || D === 'gold') { // small crystal clusters poking out of the ground
        const x = rx(), z = rz();
        for (let k = 0; k < 4; k++) inst('deco' + D, GEO.cone6, decoMat, x + rng.range(-1, 1), 0.6, z + rng.range(-1, 1), { sx: 0.35, sy: rng.range(1, 2.2), sz: 0.35, rx: rng.range(-0.4, 0.4), rz: rng.range(-0.4, 0.4), cast: false });
        glowDecal(x, z, 3.5, D === 'ice' ? 0x6ae0ff : 0xffd23a, 0.35);
      } else if (D === 'clouds') {
        if (rng.next() < 0.5) for (let k = 0; k < 4; k++) inst('decoCloud', GEO.sphere, MAT.cottonCloud, cc.x + (k - 1.5) * 3.5, rng.range(26, 30) + k % 2, cc.z + rng.range(-2, 2), { s: rng.range(2.5, 4), color: DC || 0xf4f8ff, cast: false });
      } else if (D === 'balloons') { // lost balloons drifting up into the dark
        const x = rx(), z = rz(), y = rng.range(10, 26), col = rng.pick([0xff3a6a, 0x3ad8ff, 0xffe03a, 0xb44aff]);
        inst('decoBalloon', GEO.sphere, MAT.toy, x, y, z, { sx: 1, sy: 1.25, sz: 1, color: col, cast: false });
        inst('decoString', GEO.box, MAT.bulb, x, y - 3.2, z, { sx: 0.05, sy: 4, sz: 0.05, color: 0x888888, cast: false });
      } else if (D === 'tumbleweeds') {
        const x = rx(), z = rz(), t = new THREE.Mesh(GEO.tumble || (GEO.tumble = new THREE.IcosahedronGeometry(1.4, 1)), MAT.tumble || (MAT.tumble = Object.assign(std(0x8a6a3a), { wireframe: true })));
        t.position.set(x, 1.4, z); group.add(t); W.spinners.push({ obj: t, axis: 'x', speed: rng.range(0.5, 1.5) });
        for (let k = 0; k < 3; k++) inst('decoBone', GEO.box, MAT.boneM, rx(), 0.15, rz(), { sx: 0.25, sy: 0.25, sz: rng.range(1, 2), ry: rng.next() * 6, cast: false });
      } else if ((D === 'gears' || D === 'shards' || D === 'stars') && rng.next() < 0.45) { // spinning things hanging in the air
        const o = new THREE.Group(); o.position.set(rx(), rng.range(14, 26), rz()); group.add(o);
        if (D === 'gears') { const R = rng.range(1.5, 3); const d = new THREE.Mesh(new THREE.TorusGeometry(R, R * 0.25, 6, 12), std(0xc8963a, { metalness: 0.85, roughness: 0.3 })); o.add(d); for (let k = 0; k < 8; k++) { const t = new THREE.Mesh(BOX(R * 0.3, R * 0.35, R * 0.4), d.material); t.position.set(Math.cos(k * 0.785) * R * 1.25, Math.sin(k * 0.785) * R * 1.25, 0); t.rotation.z = k * 0.785; o.add(t); } }
        else if (D === 'shards') { const m = new THREE.Mesh(new THREE.OctahedronGeometry(rng.range(0.8, 1.8)), std(0x14081e, { emissive: 0x6a1aa0, emissiveIntensity: 0.9, flatShading: true })); m.scale.y = 2.2; o.add(m); }
        else { const m = new THREE.Mesh(new THREE.OctahedronGeometry(1.2), neon(rng.pick([0xff6ae8, 0xffe03a, 0x7affff, 0xb47aff]), 2)); m.scale.z = 0.35; o.add(m); }
        o.rotation.y = rng.next() * 6;
        W.spinners.push({ obj: o, axis: D === 'gears' ? 'z' : 'y', speed: rng.range(0.4, 1.2) * (rng.next() < 0.5 ? -1 : 1) });
      }
    }
  }

  // ---- parkour spots on every map: low hurdles to vault, and step-blocks to climb up to a lookout
  {
    const pkMat = std(new THREE.Color(L.wall).lerp(new THREE.Color(0x9a9aa4), 0.5).getHex(), { roughness: 0.8 }), edgeMat = neon(L.lair, 1.6);
    const free = (x, z, w, d) => Math.abs(x) < half - 8 && Math.abs(z) < half - 14 && Math.hypot(x, z) > 24 && !W.obstacles.some((o) => x + w / 2 + 1.5 > o.x0 && x - w / 2 - 1.5 < o.x1 && z + d / 2 + 1.5 > o.z0 && z - d / 2 - 1.5 < o.z1);
    const block = (x, z, w, d, h) => { box(w, h, d, pkMat, x, h / 2, z); box(w + 0.1, 0.25, d + 0.1, edgeMat, x, h - 0.12, z, false); solid(x, z, w, d, h); W.mapRects.push({ x, z, w, d, color: '#9a9aa4' }); };
    for (const cc of [...W.patrol]) {
      if (rng.next() > 0.16) continue;
      const sx = rng.pick([-1, 1]), sz = rng.pick([-1, 1]), alongX = rng.next() < 0.5;
      if (rng.next() < 0.5) { // a hurdle: sprint into it to vault over
        const x = cc.x + sx * 7, z = cc.z + sz * 7, w = alongX ? 7 : 1, d = alongX ? 1 : 7;
        if (free(x, z, w, d)) block(x, z, w, d, rng.range(2.0, 2.8));
      } else { // three steps up to a lookout: vault, climb, climb
        const x0 = cc.x + sx * 5.5, z0 = cc.z + sz * 5.5, dx = alongX ? sx * 3.2 : 0, dz = alongX ? 0 : sz * 3.2; // steps go outward, away from the key spot
        if ([0, 1, 2].every((k) => free(x0 + dx * k, z0 + dz * k, 3.2, 3.2))) [2.6, 5.4, 8.2].forEach((h, k) => block(x0 + dx * k, z0 + dz * k, 3.2, 3.2, h));
      }
    }
  }

  // ---- THE FINAL NIGHTMARE: an eye in the sky that follows you, burning halo rings over the throne
  if (L.final) {
    const eye = new THREE.Group(); eye.position.set(0, 230, half + 260); group.add(eye);
    const sky = (c, o = {}) => new THREE.MeshBasicMaterial({ color: c, fog: false, ...o });
    const ball = new THREE.Mesh(new THREE.SphereGeometry(70, 32, 20), sky(new THREE.Color(0xd8b8b0).multiplyScalar(0.6))); eye.add(ball);
    const iris = new THREE.Mesh(new THREE.CircleGeometry(34, 40), sky(new THREE.Color(0xff1a3a).multiplyScalar(1.8))); iris.position.z = 69.5; eye.add(iris);
    const pupil = new THREE.Mesh(new THREE.CircleGeometry(15, 32), sky(0x000000)); pupil.position.z = 70; pupil.scale.x = 0.45; eye.add(pupil);
    for (let k = 0; k < 10; k++) { const v = new THREE.Mesh(BOX(1.4, 30 + k * 3, 0.5), sky(0xb01020)); const a = (k / 10) * Math.PI * 2; v.position.set(Math.cos(a) * 52, Math.sin(a) * 52, 48); v.rotation.z = a + Math.PI / 2; eye.add(v); }
    W.skyEye = eye;
    for (let k = 0; k < 3; k++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(60 + k * 28, 1.6 - k * 0.3, 8, 96), sky(new THREE.Color(k === 1 ? 0xb44aff : 0xff1a3a).multiplyScalar(2.6)));
      ring.position.set(0, 95 + k * 22, 0); ring.rotation.set(Math.PI / 2 + (k - 1) * 0.25, 0, k);
      const holder = new THREE.Group(); holder.add(ring); group.add(holder);
      W.spinners.push({ obj: holder, axis: 'y', speed: (k % 2 ? -1 : 1) * (0.08 + k * 0.03) });
    }
    W.final = true;
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

  // ---- story quest items
  {
    const Q = questOf(L), want = L.big ? 5 : 3;
    W.quest = { q: Q, items: [] };
    const qMat = neon(Q.col, 2), dark = std(0x2a2a30, { roughness: 0.8 });
    for (const c of [...keyCandidates].sort(() => rng.next() - 0.5)) {
      if (W.quest.items.length >= want) break;
      const p = V(c.x + 4, 0, c.z + 4);
      if (spots.some((s) => s.distanceTo(c) < C * 1.2) || W.drinks.some((d) => Math.hypot(d.x - p.x, d.z - p.z) < C) || W.items.some((d) => Math.hypot(d.x - p.x, d.z - p.z) < C)
        || W.quest.items.some((d) => Math.hypot(d.x - p.x, d.z - p.z) < C * 4) || Math.hypot(p.x, p.z) < C * 2) continue;
      const g = new THREE.Group(); g.position.set(p.x, 0, p.z); group.add(g);
      const at = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
      if (Q.id === 'diary' || Q.id === 'map') { at(BOX(1.6, 0.06, 2), qMat, 0, 2.2, 0).rotation.x = -0.6; at(new THREE.CylinderGeometry(0.15, 0.15, 1.2, 8), dark, 0, 1.1, 0); }
      else if (Q.id === 'beacons') { at(new THREE.CylinderGeometry(0.9, 0.6, 1, 10), dark, 0, 2.5, 0); at(new THREE.CylinderGeometry(0.2, 0.25, 2, 6), dark, 0, 1, 0); }
      else if (Q.id === 'relics') { at(new THREE.SphereGeometry(0.7, 12, 10), qMat, 0, 2.2, 0).scale.set(0.8, 1.2, 0.8); at(new THREE.CylinderGeometry(0.3, 0.5, 0.6, 10), qMat, 0, 3.1, 0); at(BOX(1.4, 1.4, 1.4), dark, 0, 0.7, 0); }
      else if (Q.id === 'curse') { for (let k = 0; k < 3; k++) at(BOX(1.2 - k * 0.15, 1.2, 1.2 - k * 0.15), std(0x5a4a3a), 0, 0.6 + k * 1.2, 0); at(BOX(0.8, 0.2, 0.1), qMat, 0, 3.2, 0.55); }
      else if (Q.id === 'survivors') { at(new THREE.CylinderGeometry(0.5, 0.6, 1.6, 10), std(0x3a7ad8), 0, 1.2, 0); at(new THREE.SphereGeometry(0.45, 12, 10), std(0xffc9a0), 0, 2.4, 0); g.rotation.x = 0.1; }
      else if (Q.id === 'radio') { at(BOX(1.4, 0.9, 0.7), dark, 0, 1.8, 0); at(BOX(0.06, 1.6, 0.06), dark, 0.5, 3, 0); at(new THREE.CylinderGeometry(0.25, 0.25, 0.1, 12), qMat, -0.3, 1.8, 0.36).rotation.x = Math.PI / 2; at(BOX(0.8, 1.2, 0.8), dark, 0, 0.6, 0); }
      else { at(new THREE.OctahedronGeometry(0.9), qMat, 0, 2.6, 0); at(new THREE.CylinderGeometry(0.8, 1, 0.8, 8), dark, 0, 0.4, 0); }
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: Q.col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.8 })); spr.position.y = 2.6; spr.scale.setScalar(4); g.add(spr);
      W.quest.items.push({ x: p.x, z: p.z, mesh: g, decal: glowDecal(p.x, p.z, 4, Q.col, 0.5), taken: false });
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
const rangeK = (k, a, b) => { const h = Math.sin(k * 127.1 + 311.7) * 43758.5453; return a + (b - a) * (h - Math.floor(h)); }; // repeatable "random"

// play AS one of your own monsters: its body, shrunk to runner size, with the limbs the runner animation expects
function buildPlayerSkin(key) {
  const T = MONSTERS[key], m = buildMonsterMesh(key), u = m.userData;
  const k = (T.posture === 'crawl' ? 7.5 : 6.2) / T.headY; // about as tall as the runner
  u.inner.scale.setScalar(k);
  if (T.posture === 'crawl') { u.body.rotation.x = 1.15; u.inner.position.y = (T.noLimbs ? -2.6 : -0.6) * k; u.neck.rotation.x = -1; }
  if (T.posture === 'float') u.inner.position.y = 1.4 * k;
  u.light.intensity = 8; u.light.distance = 14;
  m.userData = { legL: u.legL.hip, legR: u.legR.hip, armL: u.armL.sh, armR: u.armR.sh, skin: u, posture: T.posture };
  return m;
}
const playerBody = () => { const id = save.playAs, key = 'u_' + id; return id && MONSTERS[key] ? buildPlayerSkin(key) : buildRunner(); };
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

const W_BLINK = neon(0xff2a2a, 3);
// smoother monster parts: rounded boxes and capsules instead of plain boxes
const RB = (w, h, d, r = 0.16) => new RoundedBoxGeometry(w, h, d, 2, Math.max(0.01, Math.min(r, w / 2 - 0.01, h / 2 - 0.01, d / 2 - 0.01)));
const CAP = (r, len) => new THREE.CapsuleGeometry(r, Math.max(0.01, len - 2 * r), 3, 8);
// a glowing rim around the monster's silhouette, in the color of its eyes (it reads in the dark)
function addRim(mat, color, k = 0.55) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.rimCol = { value: new THREE.Color(color).multiplyScalar(k) };
    sh.fragmentShader = 'uniform vec3 rimCol;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n  float rimF = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 2.6);\n  totalEmissiveRadiance += rimCol * rimF;');
  };
  mat.customProgramCacheKey = () => 'rim';
  return mat;
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
  if (T.stripes) { // candy / snake bands painted on the skin
    const [c, g2] = makeCanvas(16, 64);
    for (let y = 0; y < 8; y++) { g2.fillStyle = '#' + new THREE.Color(T.stripes[y % 2]).getHexString(); g2.fillRect(0, y * 8, 16, 8); }
    wraps = new THREE.CanvasTexture(c); wraps.colorSpace = THREE.SRGBColorSpace; wraps.wrapS = wraps.wrapT = THREE.RepeatWrapping; wraps.repeat.set(1, 2);
  }
  const skin = T.metal ? std(T.body, { roughness: 0.25, metalness: 0.9 }) : T.ghost
    ? std(T.body, { roughness: 0.5, transparent: true, opacity: 0.88, emissive: T.ghost, emissiveIntensity: 0.8 })
    : std(T.stripes ? 0xffffff : T.body, { roughness: T.fur || T.mummy ? 0.95 : 0.42, metalness: T.fur || T.mummy ? 0 : 0.25, map: wraps });
  const spin = [], flick = [];
  const glowSprite = (col, s, parent, x = 0, y = 0, z = 0) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    sp.position.set(x, y, z); sp.scale.setScalar(s); parent.add(sp); return sp;
  };
  const crawlBack = T.posture === 'crawl'; // on all fours the torso's "back" points up
  const bone = std(T.bone ?? 0xd8cfb8, { roughness: 0.55 });
  const faceMat = T.face ? std(T.face, { roughness: 0.6 }) : T.boneFace ? bone : skin;
  addRim(skin, T.eye); if (faceMat !== skin) addRim(faceMat, T.eye, 0.35);
  const eyeMat = neon(T.eye, 6), mouthMat = neon(T.clown ? 0xff1030 : T.eye, 1.5);
  const black = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const cloth = (c, o = {}) => std(c, { roughness: 1, side: THREE.DoubleSide, ...o });

  // gaunt, hunched torso
  const body = pivot(0, 3.4, 0, inner);
  part(new THREE.CylinderGeometry(1.15 * bulk, 0.65 * bulk, 3.6, 14), skin, 0, 1.8, 0, body);
  part(new THREE.SphereGeometry(1.18 * bulk, 16, 10), skin, 0, 3.15, -0.05, body).scale.set(1.05, 0.55, 0.85); // hunched chest and shoulders
  part(new THREE.SphereGeometry(0.7 * bulk, 12, 8), skin, 0, 0.15, 0, body).scale.set(1, 0.6, 0.9); // hips
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
    if (T.rattle) for (let k = 0; k < 4; k++) part(new THREE.SphereGeometry(0.3 - k * 0.04, 8, 6), std(0xd8c08a), 0, 1.2 + k * 0.35, 0, parent).scale.set(1, 0.6, 1);
  }

  // ---- extra body parts that give each monster its own look
  if (T.abdomen) { // big bug / spider bottom
    const ab = part(new THREE.SphereGeometry(1.4 * bulk, 14, 10), std(T.abdomen, { roughness: 0.35, metalness: 0.2 }), 0, crawlBack ? -1.4 : 0.6, crawlBack ? -0.9 : -1.6, body);
    ab.scale.set(1.1, 1, 1.5);
    if (T.abdomenMark) part(new THREE.SphereGeometry(0.5, 8, 6), neon(T.eye, 1.6), 0, crawlBack ? -1.5 : 1.0, crawlBack ? -1.6 : -3.0, body).scale.set(1, 0.4, 1);
  }
  if (T.shell) { // hard shell over the back
    const sh = part(new THREE.SphereGeometry(1.4 * bulk, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), std(T.shell, { roughness: 0.3, metalness: 0.35 }), 0, 1.9, -0.35 * bulk, body);
    sh.rotation.x = -Math.PI / 2; sh.scale.set(1.05, 1.0, 1.6);
    for (let k = 0; k < 3; k++) part(BOX(2.6 * bulk, 0.12, 0.3), std(0x000000), 0, 0.9 + k * 0.9, -1.3 * bulk, body);
  }
  if (T.cracks) { // glowing cracks (lava rock, void)
    const cm = neon(T.cracks, 2.4);
    for (let k = 0; k < 14; k++) {
      const y = 0.4 + (k * 0.23) % 3.0, a = k * 2.4, r = lerp(0.65, 1.15, y / 3.6) * bulk + 0.03;
      const c = part(BOX(0.09, rangeK(k, 0.6, 1.5), 0.05), cm, Math.sin(a) * r, y, Math.cos(a) * r, body);
      c.rotation.set(0, a, rangeK(k + 3, -0.8, 0.8));
    }
  }
  if (T.crystals) { // ice / gem crystals sticking out of the shoulders and back
    const cm = std(T.crystals, { emissive: T.crystals, emissiveIntensity: 0.6, roughness: 0.1, transparent: true, opacity: 0.85, flatShading: true });
    for (let k = 0; k < 7; k++) {
      const sd = k % 2 ? 1 : -1, c = part(new THREE.ConeGeometry(0.3, rangeK(k, 1.2, 2.4), 5), cm, sd * rangeK(k + 1, 0.3, 1.1) * bulk, 2.4 + rangeK(k + 2, 0, 1.2), -0.6 * bulk, body);
      c.rotation.set(-0.7 - rangeK(k + 4, 0, 0.5), 0, -sd * rangeK(k + 5, 0.2, 0.9));
    }
  }
  if (T.flames) { // flames licking off the shoulders and back
    const fm = neon(T.flames, 2.6), fm2 = neon(0xffd23a, 3);
    for (let k = 0; k < 6; k++) {
      const sd = k % 2 ? 1 : -1, f = part(new THREE.ConeGeometry(0.4, 1.8, 6), k < 2 ? fm2 : fm, sd * (0.5 + (k >> 1) * 0.3) * bulk, 3.3 - (k >> 1) * 0.8, -0.5 * bulk, body);
      f.rotation.x = -0.3; flick.push(f);
    }
  }
  if (T.mushrooms) { // little glowing mushrooms growing on it
    const cap = std(T.mushrooms, { emissive: T.mushrooms, emissiveIntensity: 0.5 }), stem = std(0xe8e0d0);
    for (let k = 0; k < 7; k++) {
      const a = k * 2.1, y = 0.8 + k * 0.42, r = lerp(0.65, 1.15, y / 3.6) * bulk;
      const mp = pivot(Math.sin(a) * r, y, Math.cos(a) * r, body); mp.rotation.set(Math.cos(a) * 0.9, 0, -Math.sin(a) * 0.9);
      part(new THREE.CylinderGeometry(0.1, 0.12, 0.5, 6), stem, 0, 0.25, 0, mp);
      part(new THREE.SphereGeometry(0.35, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), cap, 0, 0.45, 0, mp);
    }
  }
  if (T.leaves) { // vines and leaves hanging off it
    const lm = std(T.leaves, { roughness: 0.9, side: THREE.DoubleSide, flatShading: true });
    for (let k = 0; k < 10; k++) {
      const a = k * 0.63 + 0.3, r = 1.1 * bulk, l = part(new THREE.ConeGeometry(0.45, 1.4, 3), lm, Math.sin(a) * r, 3.2 - (k % 3) * 0.9, Math.cos(a) * r, body);
      l.rotation.set(Math.PI + Math.cos(a) * 0.5, a, 0); l.scale.z = 0.3;
    }
  }
  if (T.collar) { // tall vampire cape collar
    const col = part(new THREE.CylinderGeometry(1.7, 0.9, 2.4, 14, 1, true, Math.PI / 2, Math.PI), cloth(T.collar), 0, 4.1, -0.1, body);
    col.rotation.x = -0.15;
    part(new THREE.CylinderGeometry(1.65, 0.86, 2.3, 14, 1, true, Math.PI / 2, Math.PI), cloth(0x8a0018, { side: THREE.BackSide }), 0, 4.1, -0.05, body).rotation.x = -0.15;
  }
  if (T.apron) part(BOX(1.9 * bulk, 3.0, 0.1), cloth(T.apron), 0, 1.6, 1.0 * bulk + 0.05, body).rotation.x = -0.12;
  if (T.tutu) for (let k = 0; k < 3; k++) part(new THREE.ConeGeometry(2.2 - k * 0.3, 0.9, 18, 1, true), cloth(T.tutu, { transparent: true, opacity: 0.85 }), 0, 0.5 + k * 0.25, 0, body);
  if (T.tails) for (let k = 0; k < T.tails; k++) { // a fan of fluffy glowing-tipped tails
    const tp = pivot(0, 0.2, -0.7 * bulk, body); tp.rotation.set(crawlBack ? -2.4 : -2.0, (k - (T.tails - 1) / 2) * 0.35, 0);
    part(new THREE.ConeGeometry(0.45, 3.2, 8), skin, 0, 1.6, 0, tp).rotation.x = Math.PI;
    part(new THREE.SphereGeometry(0.42, 8, 6), neon(T.eye, 1.6), 0, 3.0, 0, tp);
    spin.push({ obj: tp, axis: 'z', speed: 0 }); flick.push(tp.children[1]);
  }
  if (T.paperLantern) { // a giant glowing paper lantern for a body
    const pm = std(T.paperLantern, { emissive: T.paperLantern, emissiveIntensity: 1.1, transparent: true, opacity: 0.92, roughness: 1 });
    part(new THREE.SphereGeometry(2.3, 16, 12), pm, 0, 1.6, 0, body).scale.set(1, 1.25, 1);
    for (let k = 0; k < 6; k++) part(new THREE.TorusGeometry(2.3 * Math.sin(((k + 1) / 7) * Math.PI), 0.05, 4, 24), black, 0, 1.6 + Math.cos(((k + 1) / 7) * Math.PI) * 2.85, 0, body).rotation.x = Math.PI / 2;
    for (const y of [-1.3, 4.5]) part(new THREE.CylinderGeometry(1, 1, 0.4, 14), std(0x1a1a1a), 0, y, 0, body);
    glowSprite(T.paperLantern, 7, body, 0, 1.6, 0);
  }
  if (T.fin) { const f = part(new THREE.ConeGeometry(1.0, 2.6, 4), skin, 0, 3.1, -0.95 * bulk, body); f.scale.x = 0.25; f.rotation.x = -0.5; }
  if (T.conch) { // a spiral shell carried on its back
    const cm = std(T.conch, { roughness: 0.4 }), cp = pivot(0, 1.4, -1.1 * bulk, body); cp.rotation.x = crawlBack ? -0.3 : -1.2;
    for (let k = 0; k < 6; k++) { const r = 1.7 - k * 0.24; part(new THREE.TorusGeometry(r, r * 0.45, 8, 16), cm, 0, k * 0.5, 0, cp).rotation.x = Math.PI / 2; }
    part(new THREE.ConeGeometry(0.4, 1.0, 10), std(0xc84a6a), 0, 3.2, 0, cp);
  }
  if (T.locker) { // a school locker for a body, with vents and a lock
    const lm = std(T.locker, { metalness: 0.6, roughness: 0.4 });
    part(BOX(2.6, 4, 2.2), lm, 0, 1.9, 0, body);
    for (let k = 0; k < 4; k++) part(BOX(1.4, 0.08, 0.05), black, 0, 3.4 - k * 0.22, 1.12, body);
    part(BOX(0.2, 0.5, 0.1), std(0xc0c0c8, { metalness: 0.9 }), 0.9, 2.0, 1.14, body);
  }
  if (T.frame) { // a haunted portrait: an ornate gold frame around its upper body
    const fm = std(T.frame, { metalness: 0.9, roughness: 0.3, emissive: 0x4a3000, emissiveIntensity: 0.4 });
    const fp = pivot(0, 3.4, 0.6, body);
    for (const [w, h, x, y] of [[4.4, 0.45, 0, 3], [4.4, 0.45, 0, -3], [0.45, 6.4, -2, 0], [0.45, 6.4, 2, 0]]) part(BOX(w, h, 0.4), fm, x, y, 0, fp);
    part(BOX(3.6, 5.6, 0.1), std(0x1a0e14), 0, 0, -0.6, fp);
  }
  if (T.drips) { // oozing drips hanging off it
    const dm = neon(T.drips, 1.4);
    for (let k = 0; k < 10; k++) { const a = k * 2.3, y = 0.3 + (k % 5) * 0.65, r = lerp(0.65, 1.15, y / 3.6) * bulk; const d = part(new THREE.ConeGeometry(0.16, rangeK(k, 0.6, 1.4), 5), dm, Math.sin(a) * r, y - 0.4, Math.cos(a) * r, body); d.rotation.x = Math.PI; flick.push(d); }
  }
  if (T.spaceHelmet) { // a cracked glass space helmet
    part(new THREE.CylinderGeometry(1.2, 1.2, 0.4, 16), std(0xd8dce4, { metalness: 0.7 }), 0, 3.9, 0.1, body);
  }
  if (T.badge) { const b = part(new THREE.CylinderGeometry(0.32, 0.32, 0.06, 5), neon(0xffc83a, 1.6), 0.5 * bulk, 2.7, 1.02 * bulk, body); b.rotation.x = Math.PI / 2; }
  if (T.clockFace) { // a clock on its chest, hands always spinning
    const cf = pivot(0, 2.3, 1.05 * bulk, body);
    part(new THREE.CylinderGeometry(0.95, 0.95, 0.12, 24), std(0xf4ecd8, { emissive: 0x403020, emissiveIntensity: 0.5 }), 0, 0, 0, cf).rotation.x = Math.PI / 2;
    part(new THREE.TorusGeometry(0.98, 0.1, 6, 24), neon(0xffb43a, 1.4), 0, 0, 0.02, cf);
    const hands = pivot(0, 0, 0.1, cf);
    part(BOX(0.08, 0.75, 0.04), black, 0, 0.32, 0, hands);
    const h2 = pivot(0, 0, 0.12, cf); part(BOX(0.1, 0.5, 0.04), neon(T.eye, 1.5), 0, 0.22, 0, h2);
    spin.push({ obj: hands, axis: 'z', speed: -2.4 }, { obj: h2, axis: 'z', speed: -0.4 });
  }
  const gear = (r, mat) => {
    const gg = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.3, 18), mat); disc.rotation.x = Math.PI / 2; gg.add(disc);
    for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2, t = new THREE.Mesh(BOX(0.45, 0.5, 0.3), mat); t.position.set(Math.cos(a) * r, Math.sin(a) * r, 0); t.rotation.z = a; gg.add(t); }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.3, r * 0.3, 0.5, 10), neon(T.eye, 1.4)); hub.rotation.x = Math.PI / 2; gg.add(hub);
    return gg;
  };
  if (T.gearBack) { // big turning gear on its back
    const gp = pivot(0, 2.2, -0.95 * bulk, body), gm = std(0xb88a3a, { metalness: 0.8, roughness: 0.3 });
    const g1 = gear(1.5, gm); gp.add(g1); spin.push({ obj: g1, axis: 'z', speed: 1.4 });
    const g2 = gear(0.8, gm); g2.position.set(1.3, 1.3, -0.1); gp.add(g2); spin.push({ obj: g2, axis: 'z', speed: -2.6 });
  }
  if (T.windKey) { // a wind-up key turning in its back
    const kp = pivot(0, 2.0, -0.9 * bulk, body); kp.rotation.x = Math.PI / 2;
    const km = std(0xc8a040, { metalness: 0.8, roughness: 0.25 });
    part(new THREE.CylinderGeometry(0.15, 0.15, 1.4, 8), km, 0, -0.7, 0, kp);
    const bow = pivot(0, -1.5, 0, kp);
    for (const s of [-1, 1]) part(new THREE.TorusGeometry(0.55, 0.13, 6, 14), km, s * 0.6, 0, 0, bow).rotation.y = Math.PI / 2;
    spin.push({ obj: bow, axis: 'y', speed: 2 });
  }
  if (T.cloudBase) { // a puffy storm cloud instead of legs
    const cp = pivot(0, -2.2, 0, body), cm = std(T.cloudBase, { roughness: 1, transparent: true, opacity: 0.9, emissive: 0x202838, emissiveIntensity: 0.4 });
    for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2; part(new THREE.SphereGeometry(rangeK(k, 0.9, 1.4), 10, 8), cm, Math.cos(a) * 1.7, rangeK(k + 2, -0.4, 0.5), Math.sin(a) * 1.7, cp); }
    part(new THREE.SphereGeometry(1.5, 10, 8), cm, 0, -0.6, 0, cp);
    spin.push({ obj: cp, axis: 'y', speed: 0.6 });
  }
  if (T.vortex) { // a spinning tornado of sand instead of legs
    const vp = pivot(0, -0.5, 0, body), vm = std(T.vortex, { transparent: true, opacity: 0.55, roughness: 1, side: THREE.DoubleSide, depthWrite: false });
    for (let k = 0; k < 7; k++) { const r = 2.2 - k * 0.27, t = part(new THREE.TorusGeometry(r, 0.18 + r * 0.08, 6, 20), vm, Math.sin(k) * 0.25, -k * 0.55, Math.cos(k) * 0.25, vp); t.rotation.x = Math.PI / 2 + Math.sin(k * 1.7) * 0.15; }
    spin.push({ obj: vp, axis: 'y', speed: 6 });
  }
  if (T.tumble) { // rolling ball of tumbleweed around the whole body
    const tp = pivot(0, 1.5, 0, body);
    tp.add(new THREE.Mesh(new THREE.IcosahedronGeometry(3.2, 1), new THREE.MeshStandardMaterial({ color: 0x8a6a3a, wireframe: true })));
    tp.add(new THREE.Mesh(new THREE.IcosahedronGeometry(2.8, 1), new THREE.MeshStandardMaterial({ color: 0xa8844a, wireframe: true })));
    spin.push({ obj: tp, axis: 'x', speed: 2.2 });
  }
  if (T.springBox) { // the box the Jack pops out of, on a spring
    const bm = std(T.springBox, { roughness: 0.6 });
    part(BOX(3.6, 3.2, 3.6), bm, 0, -3.6, 0, body);
    for (const [x, z] of [[0, 1.81], [0, -1.81], [1.81, 0], [-1.81, 0]]) part(BOX(z ? 1.8 : 0.05, 1.8, z ? 0.05 : 1.8), neon(0xffd23a, 1.3), x, -3.6, z, body);
    const lid = part(BOX(3.6, 0.25, 3.6), bm, 0, -0.4, -2.0, body); lid.rotation.x = -1.25;
    for (let k = 0; k < 5; k++) part(new THREE.TorusGeometry(0.7, 0.1, 6, 16), std(0xc0c0c8, { metalness: 0.9, roughness: 0.2 }), 0, -1.8 + k * 0.42, 0, body).rotation.x = Math.PI / 2;
  }
  if (T.cart) { // a rusty shopping cart for a body
    const wm = Object.assign(std(0xb0b4bc, { metalness: 0.8, roughness: 0.3 }), { wireframe: true });
    part(new THREE.BoxGeometry(2.8, 3.8, 2.4, 3, 4, 3), wm, 0, 1.9, -0.3, body);
    part(BOX(2.9, 0.12, 0.12), std(0xff3a3a), 0, 3.9, -1.5, body);
    for (const [x, y] of [[-1.2, 0.1], [1.2, 0.1], [-1.2, 3.6], [1.2, 3.6]]) part(new THREE.CylinderGeometry(0.35, 0.35, 0.25, 10), std(0x1a1a1a), x, y, -1.6, body).rotation.z = Math.PI / 2;
  }
  if (T.balloons) { // a bunch of balloons tied to it
    const bp = pivot(1.9, 1, 0.3, body);
    T.balloons.forEach((c, k) => {
      const x = (k - 1) * 0.9, h = 7 + (k % 2) * 1.2;
      part(BOX(0.04, h, 0.04), std(0xffffff), x * 0.4, h / 2, 0, bp);
      part(new THREE.SphereGeometry(0.85, 12, 10), std(c, { roughness: 0.2, emissive: c, emissiveIntensity: 0.35 }), x, h + 0.6, 0, bp).scale.y = 1.2;
    });
  }

  // head: brow, sunken glowing eyes, a jaw that opens wide
  const neck = pivot(0, 3.55, 0.15 + (bulk - 1) * 0.6, body);
  part(CAP(0.27 * bulk, 1.0), skin, 0, 0.35, 0, neck);
  const head = pivot(0, 0.75, 0.1, neck);
  if (T.bigHead) head.scale.set(1.45, 1.65, 1.3);
  if (T.lure) { // anglerfish lure dangling in front of its face
    const lp = pivot(0, 1.5, 0.4, head); lp.rotation.x = 0.8;
    part(BOX(0.08, 2.4, 0.08), skin, 0, 1.2, 0, lp);
    part(new THREE.SphereGeometry(0.32, 10, 8), neon(T.eye, 4), 0, 2.5, 0, lp);
    const ls = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: T.eye, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    ls.position.y = 2.5; ls.scale.setScalar(2.4); lp.add(ls);
  }
  part(RB(1.25, 1.0, 1.45, 0.24), faceMat, 0, 0.95, 0.1, head);
  part(RB(1.15, 0.5, 0.8, 0.2), skin, 0, 0.25, -0.25, head);
  part(RB(1.45, 0.28, 0.45, 0.12), faceMat, 0, 1.3, 0.72, head);
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
  const eyes = T.eyePos || (T.eyes === 6 ? [[-0.42, 1.05], [0.42, 1.05], [-0.2, 1.17], [0.2, 1.17], [-0.5, 0.82], [0.5, 0.82]] : T.eyes === 1 ? [[0, 1.02]] : [[-0.33, 1.02], [0.33, 1.02]]);
  if (T.eyePos) for (const [ex, ey] of T.eyePos) part(new THREE.SphereGeometry(0.4, 10, 8), faceMat, ex, ey, 0.55, head); // bulging eye sockets
  // ---- head shapes
  if (T.headShape === 'long') { const lh = part(new THREE.SphereGeometry(0.8, 14, 10), skin, 0, 1.4, -1.0, head); lh.scale.set(0.95, 0.85, 2.4); lh.rotation.x = -0.35; }
  if (T.headShape === 'wide') head.scale.set(1.7, 0.75, 1.25);
  if (T.headShape === 'dome') { const dh = part(new THREE.SphereGeometry(1.1, 14, 10), skin, 0, 2.1, -0.6, head); dh.scale.set(1.15, 1.5, 1.4); dh.rotation.x = -0.5; }
  if (T.faceless) { const eg = part(new THREE.SphereGeometry(0.85, 18, 14), faceMat, 0, 1.0, 0.15, head); eg.scale.set(0.85, 1.15, 0.95); }
  if (T.snout) { // long muzzle (wolves, dinos, dogs, horses); the bottom half opens with the jaw
    const [len, wd] = T.snout;
    part(BOX(0.85 * wd, 0.55, len), faceMat, 0, 0.72, 0.75 + len / 2, head);
    part(BOX(0.4 * wd, 0.3, 0.2), black, 0, 0.9, 0.78 + len, head); // nose
    const tg = new THREE.ConeGeometry(0.06, 0.35, 4);
    for (let z = 0.9; z < 0.7 + len; z += 0.32) for (const s of [-1, 1]) { const t = part(tg, bone, s * 0.36 * wd, 0.38, z, head); t.rotation.x = Math.PI; }
  }
  if (T.ears) for (const s of [-1, 1]) {
    if (T.ears === 'round') { const e = part(new THREE.SphereGeometry(0.42, 10, 8), skin, s * 0.62, 1.55, -0.05, head); e.scale.z = 0.45; part(new THREE.SphereGeometry(0.25, 8, 6), std(0xd8a0a0), s * 0.62, 1.55, 0.12, head).scale.z = 0.3; }
    else { const e = part(new THREE.ConeGeometry(0.28, 1.0, 4), skin, s * 0.48, 1.85, -0.15, head); e.rotation.z = -s * 0.3; }
  }
  if (T.beak) { const bk = part(new THREE.ConeGeometry(0.42, T.beak, 6), std(0xe8b03a, { roughness: 0.5 }), 0, 0.75, 0.8 + T.beak / 2, head); bk.rotation.x = Math.PI / 2; }
  if (T.antennae) for (const s of [-1, 1]) {
    const ap = pivot(s * 0.3, 1.45, 0.3, head); ap.rotation.set(0.5, 0, -s * 0.45);
    part(BOX(0.08, 2.4, 0.08), skin, 0, 1.2, 0, ap);
    part(new THREE.SphereGeometry(0.17, 8, 6), neon(T.eye, 2), 0, 2.45, 0, ap);
    if (T.antennae === 'feather') for (let k = 0; k < 5; k++) part(BOX(0.7 - k * 0.1, 0.06, 0.05), skin, 0, 0.8 + k * 0.35, 0, ap);
  }
  if (T.mandibles) for (const s of [-1, 1]) { const md = part(new THREE.ConeGeometry(0.16, 1.3, 5), bone, s * 0.5, 0.35, 1.1, head); md.rotation.set(Math.PI / 2, 0, s * 0.6); }
  if (T.unihorn) { const uh = part(new THREE.ConeGeometry(0.22, 2.6, 8), neon(0xffe0f8, 1.6), 0, 1.9, 0.8, head); uh.rotation.x = 0.55; }
  if (T.mane) T.mane.forEach((c, k) => { const mn = part(BOX(0.3, 0.9, 0.5), std(c, { emissive: c, emissiveIntensity: 0.4 }), 0, 1.35 - k * 0.32, -0.45 - k * 0.22, head); mn.rotation.x = -0.6; });
  if (T.cobra) { const hd = part(new THREE.SphereGeometry(1.5, 14, 8), std(T.cobra, { side: THREE.DoubleSide }), 0, 0.6, -0.5, head); hd.scale.set(1.3, 1.4, 0.18); }
  if (T.grin) { // a too-wide glowing smile
    for (let k = -6; k <= 6; k++) { const x = k * 0.1, y = 0.42 + (k * k) * 0.007; part(BOX(0.11, 0.07, 0.04), neon(0xffffff, 2.2), x, y, 0.86, head); if (k % 2 === 0) part(BOX(0.05, 0.14, 0.04), black, x, y, 0.88, head); }
  }
  if (T.spaceHelmet) {
    part(new THREE.SphereGeometry(1.35, 18, 14), std(0xc8e8ff, { transparent: true, opacity: 0.25, roughness: 0, metalness: 0.4, depthWrite: false }), 0, 0.95, 0.15, head);
    part(BOX(0.08, 1.2, 0.04), std(0xffffff, { transparent: true, opacity: 0.6 }), 0.5, 1.2, 1.4, head).rotation.z = 0.6; // crack
    part(BOX(0.06, 0.8, 0.06), std(0xc0c0c8), 0.6, 2.4, 0, head);
    part(new THREE.SphereGeometry(0.15, 8, 6), W_BLINK, 0.6, 2.85, 0, head);
  }
  if (T.ruff) for (let k = 0; k < 14; k++) { // a big shaggy lion mane around the face
    const a = (k / 14) * Math.PI * 2, m = part(new THREE.ConeGeometry(0.5, 1.6, 5), std(T.ruff, { roughness: 1, flatShading: true }), Math.cos(a) * 1.05, 0.95 + Math.sin(a) * 1.0, 0.1, head);
    m.rotation.z = a - Math.PI / 2;
  }
  if (T.glasses) { // round glasses with a glint
    const gm = std(0x1a1a1a, { metalness: 0.6 });
    for (const s of [-1, 1]) { part(new THREE.TorusGeometry(0.24, 0.045, 6, 16), gm, s * 0.33, 1.02, 0.92, head); part(new THREE.CircleGeometry(0.22, 14), std(0xe0f0ff, { transparent: true, opacity: 0.35, metalness: 1, roughness: 0 }), s * 0.33, 1.02, 0.93, head); }
    part(BOX(0.2, 0.04, 0.04), gm, 0, 1.04, 0.93, head);
  }
  if (T.goggles) { // big lab goggles, lenses glowing
    part(new THREE.TorusGeometry(0.85, 0.08, 6, 20), std(0x3a2a1a), 0, 1.05, 0.1, head).rotation.x = Math.PI / 2;
    for (const s of [-1, 1]) { const l = part(new THREE.CylinderGeometry(0.3, 0.3, 0.3, 14), std(0x5a4a2a, { metalness: 0.7 }), s * 0.33, 1.02, 0.9, head); l.rotation.x = Math.PI / 2; part(new THREE.CircleGeometry(0.24, 14), neon(T.eye, 1.6), s * 0.33, 1.02, 1.06, head); }
  }
  if (T.mask) part(BOX(0.66, 1.0, 0.08), std(0xf4f0ec, { roughness: 0.3 }), 0.3, 1.0, 0.86, head); // white half mask
  if (T.brainJar) { // its head is a glass jar with a glowing brain inside
    part(new THREE.SphereGeometry(1.35, 18, 14), std(0xc8f0ff, { transparent: true, opacity: 0.28, roughness: 0.02, metalness: 0.3, depthWrite: false }), 0, 1.0, 0.1, head);
    for (let k = 0; k < 6; k++) part(new THREE.SphereGeometry(0.45, 10, 8), std(0xff8ab0, { emissive: 0xff3a8a, emissiveIntensity: 0.6, roughness: 0.6 }), (k % 2 ? 0.25 : -0.25), 1.2 + (k >> 1) * 0.15, -0.3 + (k >> 1) * 0.3, head).scale.set(1, 0.8, 1.1);
    part(new THREE.CylinderGeometry(1.0, 1.1, 0.4, 16), std(0x8a8a90, { metalness: 0.9, roughness: 0.3 }), 0, -0.25, 0.1, head);
    glowSprite(0xff5aa0, 3, head, 0, 1.2, 0);
  }
  if (T.trapHead) { // top half of a giant snapping flytrap (the bottom half opens with the jaw)
    const tm = std(T.trapHead, { roughness: 0.6, side: THREE.DoubleSide }), inm = std(0xc02a3a, { side: THREE.DoubleSide, emissive: 0x6a0a1a, emissiveIntensity: 0.6 });
    const top = part(new THREE.SphereGeometry(1.7, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), tm, 0, 0.8, 0.5, head); top.scale.set(1, 0.7, 1.15);
    part(new THREE.SphereGeometry(1.62, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), inm, 0, 0.78, 0.5, head).scale.set(1, 0.66, 1.1);
    for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2, t = part(new THREE.ConeGeometry(0.08, 0.7, 4), bone, Math.cos(a) * 1.7, 0.6, 0.5 + Math.sin(a) * 1.95, head); t.rotation.x = Math.PI; }
  }
  // ---- hats and headgear
  const H = T.hat === true ? 'tricorn' : T.hat;
  const hatMat = (c, o) => std(c, { roughness: 0.8, ...o });
  if (H === 'tricorn') { // pirate tricorn hat with a skull
    const hat = part(new THREE.CylinderGeometry(0.95, 1.3, 0.55, 3), std(0x141414), 0, 1.78, 0.05, head); hat.rotation.y = Math.PI;
    part(new THREE.CylinderGeometry(1.5, 1.5, 0.08, 16), std(0x141414), 0, 1.5, 0.05, head);
    part(BOX(0.35, 0.3, 0.05), std(0xf0f0f0), 0, 1.82, 0.98, head);
  } else if (H === 'cowboy') {
    part(new THREE.CylinderGeometry(1.9, 1.9, 0.1, 20), hatMat(0x5a3a1e), 0, 1.5, 0.1, head).scale.z = 0.85;
    part(new THREE.CylinderGeometry(0.8, 0.95, 1.0, 14), hatMat(0x5a3a1e), 0, 2.0, 0.1, head);
    part(new THREE.CylinderGeometry(0.97, 0.97, 0.18, 14), hatMat(0x1a1008), 0, 1.65, 0.1, head);
  } else if (H === 'miner') { // hard hat with a headlamp
    part(new THREE.SphereGeometry(0.95, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), hatMat(0xe8b81a, { roughness: 0.4 }), 0, 1.45, 0.1, head);
    part(new THREE.CylinderGeometry(1.15, 1.15, 0.1, 16), hatMat(0xe8b81a, { roughness: 0.4 }), 0, 1.47, 0.1, head);
    const lampM = part(new THREE.CylinderGeometry(0.28, 0.28, 0.2, 12), neon(0xfff0b0, 3), 0, 1.75, 1.0, head); lampM.rotation.x = Math.PI / 2;
    glowSprite(0xffe8a0, 2.4, head, 0, 1.75, 1.15);
  } else if (H === 'cap') { // security guard cap
    part(new THREE.CylinderGeometry(0.85, 0.75, 0.55, 14), hatMat(T.capCol || 0x14203a), 0, 1.7, 0.05, head);
    part(BOX(1.3, 0.08, 0.7), hatMat(0x0a0a14), 0, 1.45, 0.9, head);
    part(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 6), neon(0xffc83a, 1.5), 0, 1.7, 0.83, head).rotation.x = Math.PI / 2;
  } else if (H === 'nurse') {
    part(BOX(1.2, 0.5, 0.9), hatMat(0xf4f4f4), 0, 1.65, 0.15, head).rotation.x = -0.2;
    part(BOX(0.4, 0.12, 0.04), neon(0xff2a3a, 1.4), 0, 1.7, 0.62, head); part(BOX(0.12, 0.4, 0.04), neon(0xff2a3a, 1.4), 0, 1.7, 0.62, head);
  } else if (H === 'crown') { // spiky crown with gems
    const cm = T.crown === 'ice' ? std(0xc8f4ff, { emissive: 0x3ab8ff, emissiveIntensity: 0.7, roughness: 0.1, transparent: true, opacity: 0.9 }) : std(T.crown || 0xffc83a, { metalness: 0.9, roughness: 0.25, emissive: T.crown || 0x6a4a00, emissiveIntensity: 0.3 });
    part(new THREE.CylinderGeometry(0.85, 0.85, 0.35, 14, 1, true), cm, 0, 1.6, 0.1, head);
    for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2; part(new THREE.ConeGeometry(0.15, k % 2 ? 0.9 : 1.4, 5), cm, Math.sin(a) * 0.8, 2.1, 0.1 + Math.cos(a) * 0.8, head); }
    part(new THREE.OctahedronGeometry(0.2), neon(T.eye, 2.5), 0, 1.65, 0.95, head);
  } else if (H === 'helm') { // knight helmet with an eye slit and a plume
    const hm = std(T.body, { metalness: 0.9, roughness: 0.25 });
    part(new THREE.SphereGeometry(0.85, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), hm, 0, 1.45, 0.1, head);
    part(BOX(1.5, 0.55, 1.75), hm, 0, 1.3, 0.1, head);
    part(BOX(1.5, 0.75, 0.15), hm, 0, 0.55, 1.0, head);
    for (const s of [-1, 1]) part(BOX(0.12, 1.4, 1.7), hm, s * 0.74, 0.9, 0.1, head);
    for (let k = 0; k < 5; k++) part(new THREE.ConeGeometry(0.22, 1.6, 5), std(T.plume || T.eye, { emissive: T.plume || T.eye, emissiveIntensity: 0.3 }), 0, 2.4 + k * 0.05, -0.2 - k * 0.3, head).rotation.x = -0.6 - k * 0.2;
  } else if (H === 'shroom') { // a giant spotted mushroom cap
    const cap = part(new THREE.SphereGeometry(2.4, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), std(T.capColor || 0xc02a3a, { roughness: 0.6, emissive: T.capColor || 0xc02a3a, emissiveIntensity: 0.2 }), 0, 1.6, 0, head);
    cap.scale.y = 0.65;
    for (let k = 0; k < 9; k++) { const a = k * 2.4, r = rangeK(k, 0.5, 1.9), y = 1.6 + Math.sqrt(Math.max(0, 1 - (r / 2.4) ** 2)) * 2.4 * 0.65; part(new THREE.SphereGeometry(0.28, 8, 6), neon(0xffffff, 1.2), Math.sin(a) * r, y, Math.cos(a) * r, head).scale.y = 0.4; }
  } else if (H === 'feathers') { // tall feather headdress
    for (let k = 0; k < 9; k++) { const a = -1.1 + k * 0.275, f = pivot(Math.sin(a) * 0.6, 1.4, -0.2, head); f.rotation.set(-0.3, 0, -a * 0.8); part(BOX(0.28, 2.4, 0.06), std([0xff3a2a, 0xffc83a, 0x2aa04a, 0x2a8aff][k % 4], { roughness: 0.8 }), 0, 1.2, 0, f); }
    part(BOX(1.5, 0.3, 1.5), std(0x8a5a2a), 0, 1.45, 0.1, head);
  } else if (H === 'doctor') { // head mirror
    part(new THREE.TorusGeometry(0.8, 0.07, 6, 18), std(0x1a1a1a), 0, 1.35, 0.1, head).rotation.x = Math.PI / 2;
    part(new THREE.CylinderGeometry(0.4, 0.4, 0.06, 16), std(0xe0e8f0, { metalness: 1, roughness: 0.05, emissive: 0x406060, emissiveIntensity: 0.6 }), 0, 1.5, 0.95, head).rotation.x = Math.PI / 2 - 0.3;
  } else if (H === 'bow') {
    for (const s of [-1, 1]) { const b = part(new THREE.ConeGeometry(0.45, 1, 4), std(T.bowColor || 0xff6ab0), s * 0.5, 1.6, 0.1, head); b.rotation.z = s * Math.PI / 2; }
    part(new THREE.SphereGeometry(0.2, 8, 6), std(T.bowColor || 0xff6ab0), 0, 1.6, 0.1, head);
  } else if (H === 'swirl') { // cupcake frosting swirl with a cherry
    for (let k = 0; k < 4; k++) part(new THREE.TorusGeometry(0.9 - k * 0.2, 0.28, 8, 18), std(0xfff0f8, { roughness: 0.6 }), 0, 1.5 + k * 0.38, 0.1, head).rotation.x = Math.PI / 2;
    part(new THREE.SphereGeometry(0.3, 10, 8), neon(0xff1a3a, 1.2), 0, 2.85, 0.1, head);
  } else if (H === 'bandana') {
    part(BOX(1.45, 0.45, 1.6), hatMat(0xb0182a), 0, 1.4, 0.1, head);
    for (let k = 0; k < 6; k++) part(new THREE.SphereGeometry(0.09, 6, 4), std(0xf0f0f0), -0.5 + k * 0.2, 1.4, 0.92, head);
    for (const s of [-1, 1]) { const t = part(BOX(0.25, 0.9, 0.08), hatMat(0xb0182a), s * 0.2, 1.0, -0.8, head); t.rotation.z = s * 0.4; }
  } else if (H === 'party') {
    const ph = part(new THREE.ConeGeometry(0.6, 1.8, 12), std(0x3affff, { roughness: 0.5 }), 0.25, 2.2, 0.1, head); ph.rotation.z = -0.25;
    part(new THREE.SphereGeometry(0.25, 8, 6), neon(0xffe03a, 1.6), 0.5, 3.1, 0.1, head);
  } else if (H === 'nightcap') { // a floppy granny nightcap
    part(new THREE.SphereGeometry(0.85, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), std(0xf0d8e8, { roughness: 1 }), 0, 1.4, 0.05, head);
    const tip = part(new THREE.ConeGeometry(0.6, 1.8, 10), std(0xf0d8e8, { roughness: 1 }), 0.5, 2.0, -0.3, head); tip.rotation.z = -1.0;
    part(new THREE.SphereGeometry(0.25, 8, 6), std(0xffffff), 1.3, 1.8, -0.3, head);
  } else if (H === 'witch') {
    part(new THREE.CylinderGeometry(1.9, 1.9, 0.08, 20), std(0x14101a), 0, 1.5, 0.1, head);
    const c1 = part(new THREE.ConeGeometry(0.9, 2.2, 14), std(0x14101a), 0, 2.6, 0.1, head);
    const c2 = part(new THREE.ConeGeometry(0.45, 1.4, 10), std(0x14101a), 0.35, 4.1, -0.1, head); c2.rotation.z = -0.6;
    part(new THREE.CylinderGeometry(0.95, 0.95, 0.25, 14), std(0x6a2a8a), 0, 1.65, 0.1, head);
  } else if (H === 'beret') {
    part(new THREE.SphereGeometry(1.0, 14, 8), std(0xb01a2a, { roughness: 1 }), 0.15, 1.6, 0, head).scale.set(1, 0.3, 1);
    part(BOX(0.08, 0.3, 0.08), std(0xb01a2a), 0.15, 1.85, 0, head);
  } else if (H === 'straw') {
    part(new THREE.CylinderGeometry(2.0, 2.0, 0.08, 18), std(0xd8b860, { roughness: 1 }), 0, 1.5, 0.1, head);
    part(new THREE.CylinderGeometry(0.8, 0.9, 0.6, 14), std(0xd8b860, { roughness: 1 }), 0, 1.8, 0.1, head);
    part(new THREE.CylinderGeometry(0.92, 0.92, 0.18, 14), std(0x8a1a1a), 0, 1.6, 0.1, head);
  } else if (H === 'chef') {
    part(new THREE.CylinderGeometry(0.8, 0.72, 1.3, 14), std(0xf8f8f8, { roughness: 0.9 }), 0, 2.05, 0.05, head);
    part(new THREE.SphereGeometry(1.0, 12, 8), std(0xf8f8f8, { roughness: 0.9 }), 0, 2.85, 0.05, head).scale.y = 0.6;
  } else if (H === 'mortarboard') { // graduation cap
    part(new THREE.CylinderGeometry(0.75, 0.75, 0.5, 14), std(0x14141a), 0, 1.6, 0.1, head);
    part(BOX(2, 0.1, 2), std(0x14141a), 0, 1.9, 0.1, head).rotation.y = Math.PI / 4;
    part(BOX(0.06, 0.9, 0.06), neon(0xffc83a, 1.4), 0.9, 1.5, 0.6, head);
  } else if (H === 'hardhat') {
    part(new THREE.SphereGeometry(0.95, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), hatMat(0xff8a1a, { roughness: 0.4 }), 0, 1.45, 0.1, head);
    part(BOX(1.9, 0.1, 2.1), hatMat(0xff8a1a, { roughness: 0.4 }), 0, 1.47, 0.25, head);
    part(BOX(0.25, 0.3, 1.9), hatMat(0xe86a0a), 0, 2.3, 0.1, head);
  } else if (H === 'laurel') { // a wreath of leaves
    for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; if (Math.abs(Math.sin(a / 2)) < 0.15) continue; const l = part(new THREE.SphereGeometry(0.22, 6, 4), std(0x8aa04a), Math.sin(a) * 0.8, 1.45, 0.1 + Math.cos(a) * 0.85, head); l.scale.set(0.5, 0.4, 1.2); l.rotation.y = a; }
  } else if (H === 'flower') { // a huge flower blooming out of its head
    const fc = T.flowerColor || 0xff5ab0;
    for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2, pt = part(new THREE.SphereGeometry(0.75, 10, 8), std(fc, { emissive: fc, emissiveIntensity: 0.25 }), Math.cos(a) * 1.0, 1.9, 0.1 + Math.sin(a) * 1.0, head); pt.scale.set(1, 0.25, 0.55); pt.rotation.y = -a; }
    part(new THREE.SphereGeometry(0.5, 10, 8), neon(0xffe03a, 1.4), 0, 2.0, 0.1, head).scale.y = 0.5;
  } else if (H === 'bun') { // hair pulled into a tight bun
    part(BOX(1.35, 0.35, 1.55), std(T.hairColor || 0x2a1a10), 0, 1.5, 0.1, head);
    part(new THREE.SphereGeometry(0.5, 10, 8), std(T.hairColor || 0x2a1a10), 0, 1.75, -0.55, head);
  } else if (H === 'top') {
    part(new THREE.CylinderGeometry(1.3, 1.3, 0.08, 18), std(0x0a0a0a), 0, 1.48, 0.1, head);
    part(new THREE.CylinderGeometry(0.75, 0.75, 1.8, 16), std(0x0a0a0a), 0, 2.4, 0.1, head);
    part(new THREE.CylinderGeometry(0.77, 0.77, 0.3, 16), std(0x8a0018), 0, 1.7, 0.1, head);
  }
  const eyeGlow = [];
  for (const [ex, ey] of eyes) {
    const es = T.eyeSize || 1;
    part(BOX(0.36 * es, 0.27 * es, 0.08), black, ex, ey, 0.83, head);
    part(new THREE.SphereGeometry((T.eyes === 6 ? 0.1 : 0.13) * es, 12, 8), eyeMat, ex, ey, 0.87, head);
    if (!T.metal) part(BOX(0.035 * es, 0.17 * es, 0.02), black, ex, ey, 0.995, head); // slit pupil
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
  part(RB(1.15, 0.26, longJaw ? 1.5 : 1.2, 0.1), faceMat, 0, -0.2, longJaw ? 0.65 : 0.55, jaw);
  for (let x = -0.4; x <= 0.41; x += 0.16) part(toothGeo, bone, x, 0.05, longJaw ? 1.2 : 1.0, jaw);
  const headAnchor = pivot(0, 0.8, 0.9, head);
  if (T.trapHead) {
    const bot = part(new THREE.SphereGeometry(1.7, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), std(T.trapHead, { roughness: 0.6, side: THREE.DoubleSide }), 0, 0.4, 0.75, jaw); bot.scale.set(1, 0.7, 1.15);
    for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; part(new THREE.ConeGeometry(0.08, 0.7, 4), bone, Math.cos(a) * 1.7, 0.6, 0.75 + Math.sin(a) * 1.95, jaw); }
  }

  // long arms with long claws
  const arm = (side, y, len) => {
    const th = bulk;
    const sh = pivot(side * 1.25 * bulk, y, 0, body);
    part(CAP(0.23 * th, len + 0.3), skin, 0, -len / 2, 0, sh);
    const el = pivot(0, -len, 0, sh);
    part(CAP(0.19 * th, len + 0.25), skin, 0, -len / 2, 0, el);
    const hand = pivot(0, -len, 0, el);
    part(RB(0.6 * th, 0.45, 0.35 * th, 0.12), T.clown ? std(0xf2f2f2) : skin, 0, -0.2, 0, hand);
    const cl = T.longClaws ? 1.9 : 1.3;
    for (let c = -1; c <= 1; c++) { const m = part(new THREE.ConeGeometry(0.07 * th, cl, 4), bone, c * 0.2 * th, -0.4 - cl / 2, 0.05, hand); m.rotation.x = Math.PI; m.rotation.z = c * 0.12; }
    if (T.fur) { const f = part(new THREE.ConeGeometry(0.5, 1.8, 4), std(T.fur, { roughness: 1, flatShading: true }), 0, -len * 0.5, -0.2, sh); f.rotation.x = 2.6; }
    return { sh, el, hand };
  };
  const armL = arm(-1, 3.25, T.armLen || 2.6), armR = arm(1, 3.25, T.armLen || 2.6);
  let wings = null;
  if (T.wings) { // big leathery wings
    wings = [-1, 1].map((sd) => {
      const wp = pivot(sd * 1.1, 3.1, -0.4, body);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0.4, 0, sd * 7.5, 1.6, -0.6, sd * 5, -2.4, -1, 0, 0.4, 0, sd * 5, -2.4, -1, 0, -2, 0], 3));
      geo.computeVertexNormals();
      const wingMat = std(T.wingColor || T.body, { side: THREE.DoubleSide, roughness: 0.9, emissive: T.wingColor || 0, emissiveIntensity: T.wingColor ? 0.25 : 0 });
      if (T.wings === 'round') { // big round moth wings with eye spots
        for (const [r, y, sx] of [[3.4, 0.6, 4.2], [2.3, -2.6, 3.0]]) {
          const w = new THREE.Mesh(new THREE.CircleGeometry(r, 20), wingMat); w.position.set(sd * sx, y, -0.6); w.scale.y = 0.75; w.castShadow = true; wp.add(w);
          const spot = new THREE.Mesh(new THREE.CircleGeometry(r * 0.32, 14), neon(T.eye, 1.6)); spot.position.set(sd * sx, y, -0.55); wp.add(spot);
          const spot2 = new THREE.Mesh(new THREE.CircleGeometry(r * 0.14, 10), black); spot2.position.set(sd * sx, y, -0.5); wp.add(spot2);
        }
        wp.userData.sd = sd; return wp;
      }
      if (T.wingColor) geo.deleteAttribute('normal'), geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0.4, 0, sd * 9, 2.4, -0.6, sd * 6, -2.8, -1, 0, 0.4, 0, sd * 6, -2.8, -1, 0, -2.2, 0, sd * 9, 2.4, -0.6, sd * 10, -1, -0.8, sd * 6, -2.8, -1], 3));
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, wingMat); m.castShadow = true; wp.add(m);
      wp.userData.sd = sd; return wp;
    });
  }
  const armL2 = T.extraArms ? arm(-1, 1.7, 2.2) : null, armR2 = T.extraArms ? arm(1, 1.7, 2.2) : null;
  if (T.shield) { // a round shield on the left arm
    const sp = pivot(0, -0.6, 0.4, armL.hand);
    part(new THREE.CylinderGeometry(1.4, 1.4, 0.2, 18), std(T.shield, { metalness: 0.7, roughness: 0.35 }), 0, 0, 0, sp).rotation.z = Math.PI / 2;
    part(new THREE.SphereGeometry(0.35, 10, 8), std(0xffc83a, { metalness: 0.9, roughness: 0.2 }), -0.15, 0, 0, sp);
  }
  if (T.pincers) for (const A of [armL, armR]) { // huge crab / scorpion claws
    const pm = std(T.pincers, { roughness: 0.35, metalness: 0.3 });
    part(new THREE.SphereGeometry(0.75, 10, 8), pm, 0, -0.6, 0, A.hand).scale.set(1, 1.3, 0.8);
    for (const s of [-1, 1]) { const f = part(new THREE.ConeGeometry(0.3, 1.8, 5), pm, s * 0.35, -1.9, 0, A.hand); f.rotation.set(Math.PI, 0, s * 0.3); }
  }
  if (T.digClaws) for (const A of [armL, armR]) { // big flat digging paws
    part(BOX(1.4, 0.5, 0.9), skin, 0, -0.4, 0.1, A.hand);
    for (let c = -2; c <= 2; c++) { const m = part(new THREE.ConeGeometry(0.12, 1.4, 4), bone, c * 0.28, -1.2, 0.15, A.hand); m.rotation.x = Math.PI; }
  }
  // ---- something held in the right hand
  if (T.held) {
    const hp = pivot(0, -0.4, 0.2, armR.hand), I = T.held, ic = T.heldColor;
    const wood = std(0x4a3020, { roughness: 1 }), steel = std(typeof ic === 'number' ? ic : 0xc0c8d0, { metalness: 0.9, roughness: 0.2 });
    if (I === 'scythe') {
      part(new THREE.CylinderGeometry(0.1, 0.1, 7, 6), wood, 0, 0, 1.2, hp).rotation.x = Math.PI / 2;
      const bl = part(new THREE.ConeGeometry(0.4, 3.6, 4), steel, 0, 1.6, 4.4, hp); bl.rotation.z = Math.PI / 2; bl.scale.z = 0.15; bl.rotation.y = 0.3;
    } else if (I === 'sword') {
      part(BOX(0.18, 0.32, 4), ic ? std(ic, { emissive: ic, emissiveIntensity: 0.6, roughness: 0.1, transparent: true, opacity: 0.85 }) : steel, 0, 0, 2.4, hp);
      part(BOX(1.2, 0.2, 0.2), std(0xc8a040, { metalness: 0.8 }), 0, 0, 0.3, hp);
    } else if (I === 'pickaxe') {
      part(new THREE.CylinderGeometry(0.1, 0.1, 3.4, 6), wood, 0, 0, 1.4, hp).rotation.x = Math.PI / 2;
      const ph = part(new THREE.ConeGeometry(0.18, 2.6, 5), steel, 0, 0, 3, hp); ph.scale.set(1, 1, 0.6);
    } else if (I === 'syringe') {
      part(new THREE.CylinderGeometry(0.22, 0.22, 1.6, 10), std(0xd8f0ff, { transparent: true, opacity: 0.5, emissive: 0x3aff8a, emissiveIntensity: 0.5 }), 0, 0, 1.0, hp).rotation.x = Math.PI / 2;
      part(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 4), steel, 0, 0, 2.5, hp).rotation.x = Math.PI / 2;
    } else if (I === 'anchor') {
      part(new THREE.CylinderGeometry(0.15, 0.15, 3.6, 6), std(0x4a4a44, { metalness: 0.7 }), 0, 0, 1.6, hp).rotation.x = Math.PI / 2;
      const ar = part(new THREE.TorusGeometry(0.9, 0.15, 6, 14, Math.PI), std(0x4a4a44, { metalness: 0.7 }), 0, 0, 3.3, hp); ar.rotation.set(0, Math.PI / 2, Math.PI / 2);
    } else if (I === 'hook') {
      part(new THREE.TorusGeometry(0.45, 0.1, 6, 14, Math.PI * 1.3), steel, 0, -0.5, 0.2, hp).rotation.y = Math.PI / 2;
    } else if (I === 'flashlight') {
      part(new THREE.CylinderGeometry(0.2, 0.25, 1.2, 10), std(0x1a1a1a), 0, 0, 0.7, hp).rotation.x = Math.PI / 2;
      part(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 12), neon(0xfff4c0, 3), 0, 0, 1.32, hp).rotation.x = Math.PI / 2;
      glowSprite(0xfff4c0, 1.6, hp, 0, 0, 1.35);
    } else if (I === 'clipboard') {
      part(BOX(0.1, 1.6, 1.2), std(0x8a6a3a), 0, -0.4, 0.5, hp);
      part(BOX(0.12, 1.4, 1.0), std(0xf0f0e8), 0.02, -0.4, 0.5, hp);
    } else if (I === 'ruler') {
      part(BOX(0.08, 0.45, 3.4), std(0xe8c860), 0, 0, 1.8, hp);
      for (let k = 0; k < 8; k++) part(BOX(0.1, 0.15, 0.04), black, 0, 0.12, 0.4 + k * 0.4, hp);
    } else if (I === 'cleaver') {
      part(new THREE.CylinderGeometry(0.12, 0.12, 1, 6), wood, 0, 0, 0.5, hp).rotation.x = Math.PI / 2;
      part(BOX(0.08, 1.3, 1.9), steel, 0, -0.35, 1.9, hp);
    } else if (I === 'ladle') {
      part(new THREE.CylinderGeometry(0.06, 0.06, 2.8, 6), steel, 0, 0, 1.4, hp).rotation.x = Math.PI / 2;
      part(new THREE.SphereGeometry(0.55, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), steel, 0, 0, 3.0, hp);
    } else if (I === 'baton') {
      part(new THREE.CylinderGeometry(0.03, 0.05, 2.2, 6), std(0xf8f8f8), 0, 0, 1.1, hp).rotation.x = Math.PI / 2;
    } else if (I === 'club') {
      const cl = part(new THREE.CylinderGeometry(0.55, 0.2, 3.6, 8), std(0x3a2a1a, { roughness: 1 }), 0, 0, 1.9, hp); cl.rotation.x = Math.PI / 2;
      for (let k = 0; k < 8; k++) { const a = k * 1.3, sp = part(new THREE.ConeGeometry(0.1, 0.5, 4), steel, Math.cos(a) * 0.45, Math.sin(a) * 0.45, 2.4 + (k % 3) * 0.4, hp); sp.rotation.set(Math.sin(a) * -1.5, 0, -Math.cos(a) * 1.5); }
    } else if (I === 'wrench') {
      part(BOX(0.25, 0.12, 3), steel, 0, 0, 1.5, hp);
      part(new THREE.TorusGeometry(0.4, 0.15, 6, 12, Math.PI * 1.5), steel, 0, 0, 3.2, hp).rotation.x = Math.PI / 2;
    } else if (I === 'spear') {
      part(new THREE.CylinderGeometry(0.07, 0.07, 6, 6), wood, 0, 0, 1.5, hp).rotation.x = Math.PI / 2;
      part(new THREE.ConeGeometry(0.22, 1, 6), std(0xffc83a, { metalness: 0.9, roughness: 0.2 }), 0, 0, 4.9, hp).rotation.x = Math.PI / 2;
    } else if (I === 'buoy') {
      const b = pivot(0, -1.4, 0, hp);
      for (let k = 0; k < 4; k++) part(new THREE.TorusGeometry(0.9, 0.3, 8, 6, Math.PI / 2), std(k % 2 ? 0xffffff : 0xe82a2a), 0, 0, 0, b).rotation.z = k * Math.PI / 2;
    } else if (I === 'book') {
      part(BOX(0.5, 1.6, 1.2), std(ic || 0x6a1a2a), 0, -0.5, 0.5, hp);
      part(BOX(0.42, 1.5, 1.1), std(0xf0e8d0), 0.06, -0.5, 0.52, hp);
    } else if (I === 'claw') { // an arcade claw, opening and closing
      part(new THREE.CylinderGeometry(0.35, 0.35, 0.6, 10), steel, 0, 0, 0.6, hp).rotation.x = Math.PI / 2;
      for (let k = 0; k < 3; k++) { const pr = pivot(0, 0, 0.9, hp); pr.rotation.z = (k / 3) * Math.PI * 2; const f = part(BOX(0.12, 0.12, 1.4), steel, 0, 0.35, 0.6, pr); f.rotation.x = -0.5; }
    } else if (I === 'megaphone') {
      const mg = part(new THREE.ConeGeometry(0.7, 1.8, 14, 1, true), std(0xe8e8e8, { side: THREE.DoubleSide }), 0, 0, 1.4, hp); mg.rotation.x = -Math.PI / 2;
    } else if (I === 'wheel') { // a ship's wheel
      const wp = pivot(0, -0.2, 0.9, hp);
      part(new THREE.TorusGeometry(1.2, 0.12, 6, 20), wood, 0, 0, 0, wp);
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2, sp = part(BOX(0.1, 3.2, 0.1), wood, 0, 0, 0, wp); sp.rotation.z = a; }
    } else if (I === 'lasso') {
      part(new THREE.TorusGeometry(1.1, 0.08, 6, 20), std(0xc8a060), 0, -1.6, 0, hp);
    } else { // lantern / staff / iv pole: these hang straight down or stand straight up
      const up = pivot(0, 0, 0, hp);
      if (I === 'lantern') {
        part(BOX(0.06, 1, 0.06), std(0x1a1a1a), 0, -0.5, 0, up);
        part(BOX(0.8, 1.1, 0.8), std(0x2a2018, { metalness: 0.6 }), 0, -1.5, 0, up).scale.set(1, 1, 1);
        part(new THREE.SphereGeometry(0.34, 10, 8), neon(typeof ic === 'number' ? ic : T.eye, 3.5), 0, -1.5, 0, up);
        glowSprite(typeof ic === 'number' ? ic : T.eye, 4, up, 0, -1.5, 0);
      } else if (I === 'staff') {
        part(new THREE.CylinderGeometry(0.1, 0.12, 7, 6), ic === 'ice' ? std(0xc8f0ff, { emissive: 0x3a9aff, emissiveIntensity: 0.5 }) : wood, 0, 1.5, 0, up);
        part(new THREE.OctahedronGeometry(0.55), neon(T.eye, 2.5), 0, 5.2, 0, up);
        glowSprite(T.eye, 3.5, up, 0, 5.2, 0);
      } else if (I === 'broom') {
        part(new THREE.CylinderGeometry(0.07, 0.07, 6, 6), wood, 0, 1.4, 0, up);
        part(new THREE.ConeGeometry(0.7, 1.8, 10), std(0xb8963a, { roughness: 1 }), 0, -2.2, 0, up);
      } else if (I === 'umbrella') {
        part(new THREE.CylinderGeometry(0.06, 0.06, 5, 6), std(0x1a1a1a), 0, 2.2, 0, up);
        part(new THREE.ConeGeometry(2.6, 1.2, 8, 1, true), std(T.umbrella || 0x1a1a24, { side: THREE.DoubleSide }), 0, 4.6, 0, up);
      } else if (I === 'beaker') {
        part(new THREE.ConeGeometry(0.6, 1.1, 12), std(0xd8f0ff, { transparent: true, opacity: 0.45 }), 0, -1.3, 0, up);
        part(new THREE.ConeGeometry(0.45, 0.6, 12), neon(T.eye, 2), 0, -1.55, 0, up);
        part(new THREE.CylinderGeometry(0.18, 0.18, 0.6, 8), std(0xd8f0ff, { transparent: true, opacity: 0.45 }), 0, -0.55, 0, up);
        glowSprite(T.eye, 2.2, up, 0, -1.5, 0);
      } else if (I === 'iv') {
        part(new THREE.CylinderGeometry(0.06, 0.06, 7, 6), steel, 0, 1.5, 0, up);
        part(BOX(0.7, 1.0, 0.25), std(0xd0ffd8, { transparent: true, opacity: 0.6, emissive: 0x3aff6a, emissiveIntensity: 0.8 }), 0.45, 4.4, 0, up);
      }
    }
  }
  const leg = (side) => {
    const hip = pivot(side * 0.55 * bulk, 0, 0, body);
    part(CAP(0.3 * bulk, 2.0), skin, 0, -0.9, 0, hip);
    const knee = pivot(0, -1.8, 0, hip);
    part(CAP(0.23 * bulk, 1.8), skin, 0, -0.8, 0, knee);
    part(RB(0.6 * bulk, 0.3, 1.2 * bulk, 0.12), T.clown ? std(0xc01a2a) : skin, 0, -1.55, T.clown ? 0.6 : 0.3, knee);
    if (T.clown) part(BOX(0.7, 0.3, 2.2), std(0xc01a2a), 0, -1.55, 0.6, knee); // giant shoes
    return { hip, knee };
  };
  const legL = leg(-1), legR = leg(1);
  if ((T.robe && !T.legsVisible) || T.hideLegs || T.noLimbs) { legL.hip.visible = false; legR.hip.visible = false; }
  if (T.noLimbs) for (const A of [armL, armR, armL2, armR2]) if (A) A.sh.visible = false;

  // ---- things floating around it (sparkles, snow, pixels, spores, music notes, coins…)
  if (T.orbit) {
    const kind = T.orbit, op = pivot(0, T.headY * 0.55, 0, inner), n = kind === 'skulls' ? 5 : kind === 'flies' ? 16 : 9;
    const cols = { stars: [T.eye, 0xffffff], cubes: [0xff2ad8, 0x2affff, 0xffe03a, 0x3aff6a], embers: [0xff6a1a, 0xffc83a], snow: [0xe8f8ff], spores: [T.eye], skulls: [0xe8e0d0],
      shards: [T.eye, 0x0a0410], bolts: [0xfff04a, 0x8ae8ff], wisps: [T.eye], sparkles: [0xffe03a, 0xff7ae8, 0x7affff], papers: [0xf4f0e0, 0xe8e4d0], notes: [0xffc83a, T.eye],
      bubbles: [0xc8f0ff], coins: [0xffc83a], petals: [0xff9ad0, 0xffd0e8, 0xffffff], flies: [0x111111], feathers: [0xff3a8a, 0xffe03a, 0x3ad8ff] }[kind] || [T.eye];
    const SOLID = { skulls: 1, papers: 1, petals: 1, flies: 1, feathers: 1, coins: 1 };
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2, r = (kind === 'flies' ? 2.2 : 3.0) + (k % 3) * 0.6, y = Math.sin(k * 1.9) * 2.2, c = cols[k % cols.length];
      const geo = kind === 'cubes' ? BOX(0.55, 0.55, 0.55) : kind === 'stars' || kind === 'snow' || kind === 'sparkles' ? new THREE.OctahedronGeometry(kind === 'snow' ? 0.22 : 0.32)
        : kind === 'shards' ? new THREE.ConeGeometry(0.3, 1.6, 4) : kind === 'bolts' ? BOX(0.12, 1.4, 0.12) : kind === 'papers' ? BOX(0.8, 1.0, 0.03)
        : kind === 'coins' ? new THREE.CylinderGeometry(0.35, 0.35, 0.08, 14) : kind === 'petals' ? new THREE.SphereGeometry(0.3, 8, 6) : kind === 'feathers' ? BOX(0.15, 1.2, 0.04)
        : kind === 'bubbles' ? new THREE.SphereGeometry(0.35 + (k % 3) * 0.12, 12, 8) : kind === 'notes' ? new THREE.SphereGeometry(0.25, 8, 6)
        : new THREE.SphereGeometry(kind === 'skulls' ? 0.5 : kind === 'flies' ? 0.09 : 0.22, 8, 6);
      const mat = kind === 'bubbles' ? std(c, { transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.3 }) : kind === 'coins' ? std(c, { metalness: 0.9, roughness: 0.2, emissive: 0x6a4a00, emissiveIntensity: 0.6 })
        : SOLID[kind] || kind === 'shards' && k % 2 ? std(c, { roughness: 0.6 }) : neon(c, kind === 'snow' ? 1.4 : 2.4);
      const o = part(geo, mat, Math.cos(a) * r, y, Math.sin(a) * r, op);
      o.rotation.set(k, k * 2, kind === 'bolts' ? 0.5 : 0); o.castShadow = false;
      if (kind === 'petals') o.scale.set(1, 0.25, 0.6);
      if (kind === 'notes') { o.scale.set(1, 0.8, 0.6); o.rotation.set(0, 0, 0); part(BOX(0.06, 0.8, 0.06), mat, 0.22, 0.4, 0, o); if (k % 2) part(BOX(0.06, 0.3, 0.06), mat, 0.38, 0.72, 0, o).rotation.z = -1; }
      if (kind === 'skulls') for (const s of [-1, 1]) part(new THREE.SphereGeometry(0.12, 6, 4), neon(T.eye, 3), s * 0.18, 0.05, 0.42, o);
      if (!SOLID[kind] && kind !== 'cubes' && kind !== 'bubbles' && k % 2 === 0) glowSprite(c, kind === 'wisps' ? 2.6 : 1.4, op, Math.cos(a) * r, y, Math.sin(a) * r);
    }
    spin.push({ obj: op, axis: 'y', speed: kind === 'cubes' ? 1.6 : kind === 'snow' || kind === 'bubbles' ? 0.5 : kind === 'flies' ? 4 : 0.9 });
  }

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
  if (T.outline) { // drawn-with-a-marker look: black outlines on every edge
    const lm = new THREE.LineBasicMaterial({ color: 0x050505 }), meshes = [];
    inner.traverse((o) => { if (o.isMesh && o.geometry && o.geometry.attributes.position.count < 400) meshes.push(o); });
    for (const o of meshes) o.add(new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 25), lm));
  }
  g.userData = { inner, body, neck, head, jaw, headAnchor, armL, armR, armL2, armR2, legL, legR, light, eyeGlow, skin, strings, tail, tentacles, wings, spin, flick };
  return g;
}

// inside a monster's mouth (used by the "eaten" cutscene): a throat tunnel, tongue and a ring of teeth
function buildMouthRoom(T, k) {
  const g = new THREE.Group(), R = 2.4, L = 10;
  const flesh = std(0x8a1428, { roughness: 0.3, metalness: 0.1, emissive: 0x4a0010, emissiveIntensity: 0.9, side: THREE.BackSide });
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.45, R, L, 24, 8, true), flesh);
  tube.rotation.x = -Math.PI / 2; tube.position.z = -L / 2; g.add(tube);
  const ridge = std(0x4a0814, { roughness: 0.4, side: THREE.DoubleSide });
  for (let i = 1; i < 6; i++) { const rr = lerp(R, R * 0.45, i / 6) * 0.97; const ring = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.12, 6, 28), ridge); ring.position.z = -i * L / 6; g.add(ring); }
  const pink = std(0xd04a6a, { roughness: 0.25, emissive: 0x3a0010, emissiveIntensity: 0.6 });
  const tongue = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), pink); tongue.scale.set(R * 0.7, R * 0.25, L * 0.35); tongue.position.set(0, -R * 0.62, -L * 0.32); g.add(tongue);
  const uvula = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), pink); uvula.scale.set(0.3, 0.7, 0.3); uvula.position.set(0, R * 0.25, -L * 0.82); g.add(uvula);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(R * 0.46, 20), new THREE.MeshBasicMaterial({ color: 0x000000 })); hole.position.z = -L + 0.02; g.add(hole);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0xff2a2a, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })); glow.position.z = -L + 1; glow.scale.setScalar(R * 1.6); g.add(glow);
  const bone = std(T.bone ?? 0xefe4c8, { roughness: 0.4 }), toothGeo = new THREE.ConeGeometry(0.26, 1.2, 5);
  const top = new THREE.Group(), bot = new THREE.Group(); g.add(top, bot);
  for (const [grp, a0] of [[top, 0], [bot, Math.PI]]) for (let i = 0; i <= 10; i++) {
    const a = a0 + Math.PI * (0.06 + 0.88 * i / 10), dx = -Math.cos(a), dy = -Math.sin(a);
    const tooth = new THREE.Mesh(toothGeo, bone);
    tooth.position.set(Math.cos(a) * R * 0.95 + dx * 0.55, Math.sin(a) * R * 0.95 + dy * 0.55, 0.2);
    tooth.rotation.z = a + Math.PI / 2; grp.add(tooth);
  }
  const lid = new THREE.Mesh(new THREE.CircleGeometry(R * 1.1, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, side: THREE.DoubleSide }));
  lid.position.z = 0.6; g.add(lid);
  g.scale.setScalar(k);
  return { g, top, bot, lid, R, L };
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
  slurp() { this.noise(0.6, 0.5, 300, 'bandpass', 1600); this.tone(180, 0.5, 'sine', 0.3, 0, 520); this.noise(0.3, 0.3, 800, 'lowpass', 200, 0.3); },
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
// a story card: shows a quest line for a few seconds, above the stamina bar
function storyCard(title, text, color = '#ffd257') {
  let el = $('storyCard');
  if (!el) {
    el = document.createElement('div'); el.id = 'storyCard';
    el.style.cssText = 'position:fixed;left:50%;bottom:92px;transform:translateX(-50%);max-width:min(560px,88vw);padding:12px 18px;border-radius:14px;background:rgba(10,6,20,0.82);border:2px solid;font:600 15px/1.35 system-ui,sans-serif;color:#f2edff;text-align:center;pointer-events:none;transition:opacity .4s;z-index:30;opacity:0';
    document.body.appendChild(el);
  }
  el.innerHTML = `<div style="font:800 13px system-ui;letter-spacing:.08em;color:${color};margin-bottom:4px">${title}</div>${text}`;
  el.style.borderColor = color; el.style.opacity = 1;
  clearTimeout(el._t); el._t = setTimeout(() => { el.style.opacity = 0; }, 5200);
}
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
  btn('tSlide', () => { input.slideQueued = true; });
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
    this.mesh = playerBody(); scene.add(this.mesh);
    this.ghosts = 0; this.bombs = 0; this.ghostT = 0;
    this.pk = null; this.slideT = 0; this.slideCD = 0; this.crouch = 0; this.camRoll = 0; this.combo = 0; this.lastMove = -9; this.moves = 0;
  }
  // ---- parkour: vault low walls, climb ledges, slide, roll
  obstacleAhead(dir, dist) {
    const px = this.pos.x + dir.x * dist, pz = this.pos.z + dir.z * dist;
    let best = null;
    for (const o of world.obstacles) if (o.h > this.pos.y + 0.8 && !o.gate && px > o.x0 - 0.3 && px < o.x1 + 0.3 && pz > o.z0 - 0.3 && pz < o.z1 + 0.3 && (!best || o.h > best.h)) best = o;
    return best;
  }
  inside(o, x, z, m = 0) { return x > o.x0 - m && x < o.x1 + m && z > o.z0 - m && z < o.z1 + m; }
  parkourMove(name, color) {
    const now = game.time;
    this.combo = now - this.lastMove < 3 ? this.combo + 1 : 1; this.lastMove = now; this.moves++;
    toast(`${name}${this.combo > 1 ? `  ×${this.combo} COMBO` : ''}`, color);
    game.fovKick = Math.max(game.fovKick, 5);
  }
  startVault(o, dir) {
    let exitT = 0;
    for (let t = 0.5; t < 16; t += 0.5) if (!this.inside(o, this.pos.x + dir.x * t, this.pos.z + dir.z * t, 0.3)) { exitT = t + 1.4; break; }
    if (!exitT) return false;
    const to = this.pos.clone().addScaledVector(dir, exitT);
    let y1 = groundAt(to.x, to.z, 1.0, o.h + 1);
    if (y1 > o.h - 0.5 || Math.abs(to.x) > world.half - 2 || Math.abs(to.z) > world.half - 2) { // something tall behind it: land ON the wall instead
      const t2 = Math.min(exitT - 1.4, 2.2); to.copy(this.pos).addScaledVector(dir, t2); y1 = groundAt(to.x, to.z, 1.0, o.h + 1);
    }
    this.pk = { type: 'vault', t: 0, d: clamp(0.34 + exitT * 0.025, 0.36, 0.6), from: this.pos.clone(), to, y0: this.pos.y, y1, peak: o.h + 1.0, dir: dir.clone() };
    sfx.jump(); this.parkourMove('🤸 VAULT!', '#7affd0');
    return true;
  }
  startClimb(o, dir) {
    const to = this.pos.clone().addScaledVector(dir, 2.2);
    to.x = clamp(to.x, o.x0 + 0.9, o.x1 - 0.9); to.z = clamp(to.z, o.z0 + 0.9, o.z1 - 0.9);
    if (o.x1 - o.x0 < 1.8) to.x = (o.x0 + o.x1) / 2;
    if (o.z1 - o.z0 < 1.8) to.z = (o.z0 + o.z1) / 2;
    const y1 = groundAt(to.x, to.z, 1.0, o.h + 0.6);
    if (y1 > o.h + 0.5) return false;
    this.pk = { type: 'climb', t: 0, d: 0.32 + (y1 - this.pos.y) * 0.035, from: this.pos.clone(), to, y0: this.pos.y, y1, dir: dir.clone() };
    sfx.wallJump(); this.parkourMove('🧗 CLIMB!', '#ffd27a');
    return true;
  }
  stepParkour(dt) {
    const k = this.pk; k.t += dt;
    const u = clamp(k.t / k.d, 0, 1), U = this.mesh.userData;
    if (k.type === 'vault') {
      this.pos.x = lerp(k.from.x, k.to.x, u); this.pos.z = lerp(k.from.z, k.to.z, u);
      this.pos.y = lerp(k.y0, k.y1, u) + (k.peak - lerp(k.y0, k.y1, 0.5)) * 4 * u * (1 - u);
      U.armL.rotation.x = U.armR.rotation.x = -1.6 + u; U.legL.rotation.x = -1.2; U.legR.rotation.x = -0.9;
      this.camRoll = Math.sin(u * Math.PI) * 0.12;
    } else { // climb: haul yourself up, then step onto the top
      const up = smooth(u / 0.65), over = smooth((u - 0.55) / 0.45);
      this.pos.y = lerp(k.y0, k.y1 + 0.4, up) - 0.4 * over;
      this.pos.x = lerp(k.from.x, k.to.x, over * 0.85 + up * 0.15); this.pos.z = lerp(k.from.z, k.to.z, over * 0.85 + up * 0.15);
      U.armL.rotation.x = U.armR.rotation.x = -2.9 + over * 2; U.legL.rotation.x = Math.sin(k.t * 20) * 0.6; U.legR.rotation.x = -Math.sin(k.t * 20) * 0.6;
      this.camRoll = Math.sin(k.t * 14) * 0.03;
    }
    this.mesh.position.copy(this.pos); this.mesh.rotation.y = Math.atan2(k.dir.x, k.dir.z);
    if (u >= 1) {
      this.pos.y = k.y1; this.vy = 0; this.onGround = true; this.wallJumps = 0; this.camRoll = 0;
      const sp = k.type === 'vault' ? Math.max(this.sprintSpeed, Math.hypot(this.vel.x, this.vel.z)) : 8;
      this.vel.set(k.dir.x * sp, 0, k.dir.z * sp); this.pk = null;
      collide(this.pos, 1.0);
    }
    return true;
  }
  update(dt, now, control) {
    if (this.pk) { this.stepParkour(dt); return; }
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

    // slide: C / Ctrl while sprinting. A burst of speed, low to the ground, harder to grab
    this.slideCD -= dt;
    const wantSlide = control && (keys.KeyC || input.slideQueued); input.slideQueued = false;
    if (wantSlide && this.onGround && this.slideT <= 0 && this.slideCD <= 0 && Math.hypot(this.vel.x, this.vel.z) > 12) {
      const d = V(this.vel.x, 0, this.vel.z).normalize(), sp = Math.max(this.sprintSpeed, Math.hypot(this.vel.x, this.vel.z)) * 1.35;
      this.vel.set(d.x * sp, 0, d.z * sp); this.slideT = 0.75; this.slideCD = 1.1; this.airLock = 0.75;
      sfx.noise(0.5, 0.18, 900, 'lowpass'); this.parkourMove('💨 SLIDE!', '#9ae8ff');
    }
    if (this.slideT > 0) { this.slideT -= dt; const f = Math.exp(-1.1 * dt); this.vel.x *= f; this.vel.z *= f; }
    this.crouch = lerp(this.crouch, this.slideT > 0 ? 1 : 0, 1 - Math.exp(-14 * dt));
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

    // parkour: sprint into a low wall to vault it; jump at a ledge to climb it
    if (moving && this.state === 'alive' && this.slideT <= 0) {
      const dir = mv.clone().setY(0);
      if (dir.lengthSq() > 0.01) {
        dir.normalize();
        const o = this.obstacleAhead(dir, 1.9);
        if (o) {
          const rise = o.h - this.pos.y;
          if (this.onGround && this.sprinting && rise > 1.0 && rise <= 3.9 && this.startVault(o, dir)) return;
          if (!this.onGround && rise > 0.8 && rise <= 8.5 && this.vy > -30 && this.startClimb(o, dir)) return;
        }
      }
    }

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
      if (wasAir && fallSpeed > 40 && moving) { this.landDip = 0.25; sfx.land(0.4); this.rollT = 0.45; this.parkourMove('🌀 ROLL!', '#ffb0f0'); } // roll out of big drops, keep your speed
      else if (wasAir && fallSpeed > 25) { this.landDip = Math.min(1, fallSpeed / 70); sfx.land(this.landDip); }
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
      if (this.burnT <= 0) { this.burnT = 0.5; flash(hz.css || '#ff4a0a', 0.25); sfx.noise(0.3, 0.2, 2000, 'highpass'); burst(this.pos.clone().add(V(0, 0.5, 0)), hz.color || 0xff6a1a, 6, 4, 0.5, 4); }
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
    const sk = m.userData.skin;
    if (sk) { for (const s of sk.spin) s.obj.rotation[s.axis] += s.speed * dt; sk.jaw.rotation.x = this.sprinting ? 0.35 : 0.1; if (m.userData.posture === 'float') sk.inner.position.y = sk.inner.scale.x * (1.4 + Math.sin(this.anim * 0.5) * 0.3); }
    this.anim += dt * (4 + hs * 0.45);
    const sw = Math.sin(this.anim) * 0.9 * Math.min(1, hs / 14);
    const u = m.userData;
    this.rollT = Math.max(0, (this.rollT || 0) - dt);
    m.rotation.x = this.slideT > 0 ? -1.1 : this.rollT > 0 ? (1 - this.rollT / 0.45) * Math.PI * 2 : m.rotation.x;
    if (this.slideT > 0) { u.legL.rotation.x = -1.4; u.legR.rotation.x = -1.2; u.armL.rotation.x = -0.6; u.armR.rotation.x = 0.4; }
    else if (!this.onGround) { u.legL.rotation.x = 0.6; u.legR.rotation.x = -0.4; u.armL.rotation.x = -2.4; u.armR.rotation.x = -2.4; }
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
    const chase = D.chase + this.T.speed + LV().speedBonus + (this.enraged ? CFG.enragedBonus : 0) + (this.frenzy ? 1 : 0) - (game.slowT > 0 ? 7 : 0) + (game.midnight ? 1 : 0);
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
      this.speed = D.patrol + this.T.speed * 0.5 + (this.enraged ? 2 : 0) - (game.slowT > 0 ? 5 : 0);
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
        if (Math.hypot(q.pos.x - this.pos.x, q.pos.z - this.pos.z) < CFG.catchRadius * reach * (q.slideT > 0 ? 0.65 : 1) && q.pos.y < CFG.catchHeight * reach) { game.caughtBy(this, q); break; }
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
      u.inner.position.y = this.T.noLimbs ? -2.6 : -0.6;
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
      if (u.wings) u.wings.forEach((w) => { w.rotation.z = w.userData.sd * (0.15 + Math.sin(this.anim * (this.chasing ? 7 : 4)) * 0.55); });
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
    for (const s of u.spin) s.obj.rotation[s.axis] += s.speed * dt * (hunting ? 1.6 : 1);
    const br = Math.sin(this.anim * (hunting ? 5 : 1.8)) * (hunting ? 0.045 : 0.025); u.body.scale.set(1 + br, 1 + br * 0.6, 1 + br); // breathing (panting when it hunts)
    for (const f of u.flick) f.scale.set(0.8 + Math.random() * 0.3, 0.7 + Math.random() * 0.6, 0.8 + Math.random() * 0.3);
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
  for (const q of world.quest.items) if (!q.taken && Math.hypot(q.x - p.pos.x, q.z - p.pos.z) < 140) dot(q.x, q.z, hex6(world.quest.q.col), 5.5);
  if (game.revealKeys) for (const k of world.keys) if (!k.taken) dot(k.x, k.z, '#ffd257', 6 + Math.sin(now * 6));
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
    const L = this.L = Lres || this.custom || resolveLevel(LEVELS[this.level - 1]);
    world = buildWorld(seed, L);
    hemi.color.setHex(L.hemi[0]); hemi.groundColor.setHex(L.hemi[1]); hemi.intensity = L.hemi[2];
    setWeather(L.weather);
    const Z = ZONES[L.center];
    scene.fog.color.setHex(tintFog(Z.fog)); scene.fog.density = Z.density; scene.background.setHex(L.sky);
    moonMesh.material.color.set(L.moon || 0xe8e4ff).multiplyScalar(2.2); moonMesh.scale.setScalar(L.final ? 3.2 : 1); // a HUGE blood moon for the finale
  },
  playEndless(n, practice = false) {
    if (net.on) { toast('Endless mode is solo only for now', '#ff9a5a'); return; }
    this.endless = Math.max(1, n | 0); this.practice = practice;
    this.custom = endlessLevel(this.endless);
    this.start(true);
  },
  setLevel(n, fromHost = false) {
    if (net.isClient && !fromHost) { toast('Only the host can pick the level', '#cdb8ff'); return; }
    if (n === this.level && world) { renderMenu(); return; }
    this.custom = null; this.endless = null; this.level = n; save.level = n; writeSave();
    if (this.state === 'menu') this.newWorld();
    renderMenu();
    if (net.isHost) net.syncLobby();
  },

  refreshTouch() {
    ui.touch.classList.toggle('hidden', !(isTouch && this.state === 'play'));
  },

  showMenu() {
    this.custom = null; this.endless = null;
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
    this.questGot = 0; this.questDone = false; this.questPerkT = 0; this.slowT = 0; this.revealKeys = false; this.bigFired = {}; this.midnight = false;
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
    const sc = $('storyCard'); if (sc) sc.style.opacity = 0;
    document.body.classList.add('cine');
    ui.skip.classList.remove('hidden');
    ui.vignette.style.opacity = 0;
  },
  endCine() {
    if (this.cine && this.cine.kind === 'death') this.cleanupDeath(this.cine);
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
    const AR = L.arena || [0x1a0c08, 0xff5a1a, 0xffa23a];
    const floor = new THREE.Mesh(new THREE.CircleGeometry(165, 64), std(AR[0], { roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.position.y = 0.05; floor.receiveShadow = true; arena.add(floor);
    const ringM = new THREE.Mesh(new THREE.RingGeometry(150, 154, 96), neon(AR[1], 2)); ringM.rotation.x = -Math.PI / 2; ringM.position.y = 0.1; arena.add(ringM);
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2, h = 20 + Math.random() * 25;
      const f = new THREE.Mesh(new THREE.ConeGeometry(3, h, 6), neon(k % 2 ? AR[1] : AR[2], 2.2)); f.position.set(Math.sin(a) * 158, h / 2, Math.cos(a) * 158); arena.add(f);
      const gd = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), glowMat(AR[1], 0.4)); gd.rotation.x = -Math.PI / 2; gd.position.set(Math.sin(a) * 158, 0.12, Math.cos(a) * 158); arena.add(gd);
    }
    const cracks = new THREE.Mesh(new THREE.RingGeometry(0, 165, 64), glowMat(AR[1], 0.18)); cracks.rotation.x = -Math.PI / 2; cracks.position.y = 0.08; arena.add(cracks);
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
    ], () => this.playShots('victory', [ // its own cutscene: the victory celebration
      { d: 4.5, cap: L.battleCap || 'You defeated the titans! 🏆', pos: (u) => camAround(95, H * 0.5, 3 + u * 1.2), look: () => V(c0.x, H * 0.55, c0.z),
        tick: (u, c, dt) => {
          pose({ armL: -3, armR: -3 }); pm.position.y = Math.abs(Math.sin(u * 9)) * 8;
          hit(c, 'w', u, 0, () => sfx.escape());
          c.fw = (c.fw || 0) - dt;
          if (c.fw <= 0) { c.fw = 0.3; burst(V(c0.x + (Math.random() - 0.5) * 120, 60 + Math.random() * 40, c0.z + (Math.random() - 0.5) * 120), [0x78ff8f, 0xffd257, 0xff5aa8, 0x5fd8ff][Math.floor(Math.random() * 4)], 40, 30, 1.5, 0, 5); sfx.boom(); }
        } },
      { d: 3.2, cap: L.escape, pos: (u) => camAround(lerp(140, 190, u), H * lerp(0.6, 1.4, u), 4.2 + u * 0.8), look: () => V(c0.x, H * 0.4, c0.z),
        tick: (u, c, dt) => { pose({ armL: -3, armR: -3 }); c.fw = (c.fw || 0) - dt; if (c.fw <= 0) { c.fw = 0.2; burst(V(c0.x + (Math.random() - 0.5) * 160, 50 + Math.random() * 60, c0.z + (Math.random() - 0.5) * 160), [0x78ff8f, 0xffd257, 0xff5aa8, 0x5fd8ff][Math.floor(Math.random() * 4)], 50, 34, 1.6, 0, 6); sfx.boom(); } } },
    ], () => { this.result = { win: true, reason: L.battleWin || 'You grew GIANT and defeated all three titans!' }; ui.fade.style.background = '#000'; this.finish(); }));
  },

  // ---- frenzy: last 45 seconds
  startFrenzy(then = null) {
    this.frenzy = true;
    for (const h of this.hunters) h.frenzy = true;
    const h = this.nearestHunter();
    this.playShots('frenzy', [
      { d: 1.6, cap: 'The night is almost over…', pos: (u) => V(this.player.pos.x, lerp(6, 60, smooth(u)), this.player.pos.z - lerp(4, 30, smooth(u))), look: () => V(this.player.pos.x, 0, this.player.pos.z) },
      { d: 2.6, cap: 'FRENZY. They can ALL sense you now.', ...this.faceCam(h, 4.5, 9),
        tick: (u, c) => { this.roarShot(h, c, 'f', u, 0.1); if (!c.fired.h && u > 0.5) { c.fired.h = true; sfx.howl(); flash('#ff0020', 0.4); } } },
    ], () => { splash('FRENZY!', 'Hide or run!', '#ff3344'); if (then) then(); });
  },

  // ---------------- 15 cutscenes on EVERY level: intro, release, sighted, backflip, chase, front flip, midnight, rooftop leap,
  // storm, ambush, flip combo, exit, final run, frenzy, and the escape / eaten ending (boss levels add 'surge' + the battle) ----------------
  checkBigScenes() {
    const L = LV(), F = this.bigFired, p = this.player, rt = CFG.roundTime;
    if (net.on || this.cine || !this.released || p.state !== 'alive' || this.exitOpen || this.time < (this.sceneAt || 0) || p.pos.y > 4) return false;
    const due = (k, frac, prev) => this.keys >= k || this.elapsed >= frac * rt;
    const go = (key, fn) => { F[key] = true; fn(); this.sceneAt = this.time + 7; return !!this.cine; };
    if (!F.sighted && due(1, 0.1)) return go('sighted', () => this.startSighted());
    if (!F.backflip && F.sighted && due(1, 0.18)) return go('backflip', () => this.startBackflip());
    if (!F.chase && due(2, 0.28)) return go('chase', () => this.startRunScene('chase'));
    if (!F.frontflip && F.chase && due(2, 0.36)) return go('frontflip', () => this.startFrontFlip());
    if (!F.surge && L.battle && this.keys >= 3) return go('surge', () => this.startSurge());
    if (!F.midnight && (this.elapsed >= rt / 2 || this.keys >= 3)) return go('midnight', () => this.startMidnight());
    if (!F.rooftop && F.midnight && due(3, 0.56)) return go('rooftop', () => this.startRooftop());
    if (!F.storm && F.rooftop && due(3, 0.64)) return go('storm', () => this.startStorm());
    if (!F.ambush && due(4, 0.72)) return go('ambush', () => this.startAmbush());
    if (!F.combo && F.ambush && due(4, 0.78)) return go('combo', () => this.startCombo());
    return false;
  },
  // a running route along the monsters' paths: at(d) gives the point d units along it and the direction there
  makeRun(from, to) {
    const path = findPath(world.nav, from.x, from.z, to.x, to.z);
    if (!path || path.length < 8) return null;
    const P = [V(from.x, 0, from.z), ...path], cum = [0];
    for (let k = 1; k < P.length; k++) cum.push(cum[k - 1] + P[k].distanceTo(P[k - 1]));
    const len = cum[cum.length - 1];
    const raw = (d) => {
      if (d <= 0) { const dir = P[Math.min(3, P.length - 1)].clone().sub(P[0]).normalize(); return P[0].clone().addScaledVector(dir, d); }
      if (d >= len) return P[P.length - 1].clone();
      let k = 0; while (cum[k + 1] < d) k++;
      return P[k].clone().lerp(P[k + 1], (d - cum[k]) / Math.max(1e-6, cum[k + 1] - cum[k]));
    };
    const at = (d) => { const a = raw(d - 3), b = raw(d + 3), dir = b.sub(a); dir.y = 0; if (dir.lengthSq() < 1e-6) dir.set(0, 0, 1); dir.normalize(); return { p: raw(d), dir }; };
    return { len, at };
  },
  // camera that keeps a clear line to the player (picks the open side)
  runCams(c) {
    const P = () => c.pp.clone().add(V(0, 3, 0)), side = () => V(c.dir.z, 0, -c.dir.x).multiplyScalar(c.side);
    const clear = (to) => { const from = P(), d = to.clone().sub(from), L = d.length(); d.divideScalar(L); return from.addScaledVector(d, Math.max(2.2, Math.min(L, rayDistance(from, d, L) - 0.8))); }; // pull in if a wall is in the way
    return {
      front: { pos: () => clear(P().addScaledVector(c.dir, 9).addScaledVector(side(), 3).add(V(0, 0.8, 0))), look: () => P().addScaledVector(c.dir, -6) },
      side: { pos: () => clear(P().addScaledVector(side(), 10)), look: () => P().addScaledVector(c.dir, 2) },
      low: { pos: () => clear(P().addScaledVector(c.dir, 6).add(V(0, -1.4, 0))), look: () => P().add(V(0, 0.6, 0)) },
      behind: { pos: () => (c.hs[0] ? c.hs[0].pos.clone() : c.pp.clone()).addScaledVector(c.dir, -9).add(V(0, 8, 0)), look: () => P() },
      aerial: { pos: () => P().add(V(0, 34, 0)).addScaledVector(c.dir, -24), look: () => P().addScaledVector(c.dir, 12) },
    };
  },
  // one frame of a running scene: move the runner and the chasers along the route
  runStep(c, dt, slow = 1, hop = 0) {
    const p = this.player, R = c.run;
    c.dist = Math.min(c.dist + dt * c.speed * slow, c.endD);
    const { p: pt, dir } = R.at(c.dist);
    c.pp.copy(pt); c.dir.copy(dir);
    p.pos.set(pt.x, Math.max(0, hop), pt.z);
    p.vel.set(dir.x * c.speed, 0, dir.z * c.speed); p.onGround = hop <= 0.01;
    p.animate(dt * slow, c.speed);
    if (hop > 0.01) { const U = p.mesh.userData; U.armL.rotation.x = U.armR.rotation.x = -2.6; U.legL.rotation.x = -1.2; U.legR.rotation.x = 0.4; }
    c.hs.forEach((h, k) => {
      const gap = c.gaps[k] * (c.gapK ?? 1), q = R.at(c.dist - gap);
      h.pos.set(q.p.x, 0, q.p.z); h.vel.set(q.dir.x * c.speed, 0, q.dir.z * c.speed); h.chasing = true; h.facing = Math.atan2(q.dir.x, q.dir.z);
    });
    c.stepT = (c.stepT || 0) - dt * slow;
    if (c.stepT <= 0) { c.stepT = 0.26; sfx.step(1.3); }
  },
  endRunScene(c, gapsAfter) {
    const p = this.player, { p: pt, dir } = c.run.at(c.dist);
    p.pos.set(pt.x, 0, pt.z); collide(p.pos, 1.0); p.pos.y = groundAt(p.pos.x, p.pos.z, 1.0, 0);
    p.vel.set(dir.x * p.sprintSpeed, 0, dir.z * p.sprintSpeed); p.onGround = true; p.vy = 0;
    camYaw = Math.atan2(dir.x, dir.z); camPitch = firstPerson ? 0.05 : 0.32;
    c.hs.forEach((h, k) => { const q = c.run.at(c.dist - gapsAfter[k]); h.pos.set(q.p.x, 0, q.p.z); collide(h.pos, 1.5); h.chasing = true; h.lastKnown = p.pos.clone(); h.path = null; h.stunT = 1.2; });
  },
  // 'chase' (an epic running scene) and 'finalrun' (sprint for the open gate with EVERY monster behind you)
  startRunScene(kind, then = null) {
    const p = this.player, L = LV(), fin = kind === 'finalrun';
    const target = fin ? V(world.exit.x, 0, world.half - 8)
      : world.patrol.filter((q) => { const d = Math.hypot(q.x - p.pos.x, q.z - p.pos.z); return d > 70 && d < 150; }).sort(() => Math.random() - 0.5)[0];
    const run = target && this.makeRun(p.pos, target);
    const hs = fin ? this.hunters.filter((h) => h.active) : [this.nearestHunter()];
    if (!run || run.len < 50) { this.roarScene(kind, hs[0], then); return; }
    const c0 = { run, dist: 0, endD: fin ? Math.max(30, run.len - 34) : Math.min(run.len - 4, 125), speed: 24, pp: p.pos.clone(), dir: V(0, 0, 1), hs, gaps: fin ? [14, 21, 29] : [18], side: 1 };
    c0.side = rayDistance(p.pos.clone().add(V(0, 3, 0)), V(run.at(0).dir.z, 0, -run.at(0).dir.x), 12) > rayDistance(p.pos.clone().add(V(0, 3, 0)), V(-run.at(0).dir.z, 0, run.at(0).dir.x), 12) ? 1 : -1;
    const K = this.runCams(c0), h0 = hs[0];
    const step = (slow = 1, hop = 0) => (u, c, dt) => this.runStep(c0, dt, slow, hop > 0 ? Math.sin(u * Math.PI) * hop : 0);
    const shots = fin ? [
      { d: 2.0, cap: 'THE GATE IS OPEN!', ...K.aerial, tick: (u, c, dt) => { this.runStep(c0, dt); hs.forEach((h, k) => this.roarShot(h, c, 'r' + k, u, 0.1 + k * 0.2)); } },
      { d: 2.0, cap: 'Every monster in the place is coming for you…', ...K.front, tick: step() },
      { d: 1.5, cap: 'VAULT!', ...K.side, tick: (u, c, dt) => { this.runStep(c0, dt, 0.55, Math.sin(clamp((u - 0.2) / 0.6, 0, 1) * Math.PI) * 4); if (!c.fired.v && u > 0.25) { c.fired.v = true; sfx.jump(); } } },
      { d: 1.8, cap: `${h0.T.name} is RIGHT behind you!`, ...K.behind, tick: (u, c, dt) => { c0.gapK = lerp(1, 0.55, u); this.runStep(c0, dt); this.roarShot(h0, c, 'h', u, 0.3); } },
      { d: 1.8, cap: 'Keep running. Do NOT look back.', ...K.low, tick: (u, c, dt) => { c0.gapK = lerp(0.55, 1.1, u); this.runStep(c0, dt); } },
    ] : [
      { d: 1.8, cap: `${h0.T.name} has your scent!`, ...this.faceCam(h0, 5, 10), tick: (u, c, dt) => { this.roarShot(h0, c, 'r', u, 0.1); this.runStep(c0, dt * 0.3); } },
      { d: 2.0, cap: 'RUN!', ...K.front, tick: step() },
      { d: 1.6, cap: 'VAULT!', ...K.side, tick: (u, c, dt) => { this.runStep(c0, dt, 0.5, Math.sin(clamp((u - 0.2) / 0.6, 0, 1) * Math.PI) * 4); if (!c.fired.v && u > 0.25) { c.fired.v = true; sfx.jump(); } } },
      { d: 1.6, cap: 'It\'s gaining…', ...K.behind, tick: (u, c, dt) => { c0.gapK = lerp(1, 0.3, u); this.runStep(c0, dt); } },
      { d: 1.8, cap: 'SLIDE!', ...K.low, tick: (u, c, dt) => { // it lunges… you slide under its claws, in slow motion
        c0.gapK = lerp(0.3, 0.9, smooth(u)); this.runStep(c0, dt, u < 0.6 ? 0.3 : 1);
        if (u < 0.6) { const U = p.mesh.userData; p.mesh.rotation.x = -1.1; U.legL.rotation.x = -1.4; U.legR.rotation.x = -1.2; }
        if (!c.fired.l && u > 0.1) { c.fired.l = true; sfx.scream(h0.typeKey); this.shake = 1.2; flash(h0.T.eyeCss, 0.25); h0.flare = 1.2; } } },
    ];
    this.playShots(kind, shots, () => { this.endRunScene(c0, fin ? [20, 28, 36] : [22]); toast(fin ? '🚪 GET TO THE GATE!' : '🏃 You got away… for now!', '#7affd0'); if (then) then(); });
    this.cine.showPlayer = true;
  },
  // fallback when no good route exists: still a cutscene, just a roar
  roarScene(kind, h, then = null) {
    this.playShots(kind, [{ d: 2.6, cap: `${h.T.name} roars across ${LV().name}!`, ...this.faceCam(h, 5, 10), tick: (u, c) => this.roarShot(h, c, 'r', u, 0.2) }], () => { if (then) then(); });
  },
  // 'sighted': the first key catches a monster's attention
  startSighted() {
    const p = this.player, h = this.nearestHunter();
    this.playShots('sighted', [
      { d: 2.4, cap: `${h.T.name} stops… and sniffs the air.`, ...this.faceCam(h, 6, 12), tick: (u, c) => { h.mesh.userData.neck.rotation.x = -0.4 * Math.sin(u * Math.PI); if (!c.fired.s && u > 0.55) { c.fired.s = true; h.flare = 1.5; sfx.screech(); } } },
      { d: 2.0, cap: 'It caught your scent.', pos: (u) => h.pos.clone().add(V(0, 9 * Math.max(1, h.T.scale * 0.6), 0)).lerp(p.pos.clone().add(V(0, 6, 0)), u * 0.6), look: () => p.pos.clone().add(V(0, 3, 0)),
        tick: (u, c) => { if (!c.fired.r && u > 0.4) { c.fired.r = true; this.roarShot(h, c, 'x', 1, 0); } } },
    ], () => { h.chasing = true; h.lastKnown = p.pos.clone(); h.path = null; splash('IT KNOWS', `${h.T.name} is tracking you`, h.T.eyeCss); });
  },
  // 'midnight': halfway through, the moon turns red and the monsters get faster
  startMidnight() {
    const hs = this.hunters.filter((h) => h.active), half = world.half;
    this.playShots('midnight', [
      { d: 2.6, cap: 'Midnight.', pos: (u) => V(lerp(-half * 0.6, half * 0.6, u), 150, -half * 0.5), look: () => V(0, 0, 40), tick: (u, c) => { if (!c.fired.m && u > 0.5) { c.fired.m = true; moonMesh.material.color.set(0xff1a1a).multiplyScalar(2.4); moonMesh.scale.setScalar(Math.max(2, moonMesh.scale.x)); flash('#ff0020', 0.5); sfx.howl(); } } },
      { d: 2.2, cap: 'The moon turns red…', pos: (u) => V(0, 12 + u * 6, 0), look: () => moonMesh.position.clone() },
      ...hs.slice(0, 3).map((h, k) => ({ d: 1.3, cap: ['…and they grow stronger.', 'Faster.', 'Hungrier.'][k], ...this.faceCam(h, 4.5, 8), tick: (u, c) => this.roarShot(h, c, 'm' + k, u, 0.15) })),
    ], () => { this.midnight = true; splash('MIDNIGHT', 'The monsters are FASTER now', '#ff3344'); });
  },
  // 'surge' (boss levels): the power is building
  startSurge() {
    const p = this.player, L = LV(), h = this.nearestHunter();
    this.playShots('surge', [
      { d: 2.6, cap: `The ${L.keyWord}s are pulsing with power…`, pos: (u) => { const a = u * 2.4; return p.pos.clone().add(V(Math.sin(a) * 9, 4 + u * 3, Math.cos(a) * 9)); }, look: () => p.pos.clone().add(V(0, 3, 0)),
        tick: (u, c, dt) => { c.bt = (c.bt || 0) - dt; if (c.bt <= 0) { c.bt = 0.12; burst(p.pos.clone().add(V((Math.random() - 0.5) * 4, 2 + Math.random() * 4, (Math.random() - 0.5) * 4)), L.keyColor || 0x3ce6ff, 8, 8, 0.6, 4); } if (!c.fired.c && u > 0.1) { c.fired.c = true; sfx.charge(); } } },
      { d: 2.2, cap: `${CFG.keysNeeded - this.keys} more and you can FIGHT BACK.`, ...this.faceCam(h, 6, 11), tick: (u, c) => this.roarShot(h, c, 's', u, 0.3) },
    ], () => {});
    this.cine.showPlayer = true;
  },
  // 'ambush': a monster drops out of the sky in front of you… you slide right under it
  startAmbush() {
    const p = this.player, hs = this.hunters.filter((h) => h.active);
    const h = hs.reduce((a, b) => (Math.hypot(b.pos.x - p.pos.x, b.pos.z - p.pos.z) > Math.hypot(a.pos.x - p.pos.x, a.pos.z - p.pos.z) ? b : a));
    const f = V(Math.sin(camYaw), 0, Math.cos(camYaw));
    const run = this.makeRun(p.pos, p.pos.clone().addScaledVector(f, 40));
    if (!run || run.len < 24) { this.roarScene('ambush', h); return; }
    const c0 = { run, dist: 0, endD: Math.min(run.len - 2, 34), speed: 20, pp: p.pos.clone(), dir: f.clone(), hs: [], gaps: [], side: 1 };
    const drop = run.at(16).p, K = this.runCams(c0);
    h.pos.set(drop.x, 40, drop.z); h.facing = Math.atan2(-run.at(16).dir.x, -run.at(16).dir.z);
    this.playShots('ambush', [
      { d: 1.8, cap: 'Something is falling from the sky—', pos: () => p.pos.clone().add(V(0, 3.5, 0)).addScaledVector(f, -6), look: (u) => h.pos.clone().add(V(0, 5, 0)),
        tick: (u, c, dt) => { h.pos.y = Math.max(0, 40 * (1 - smooth(u / 0.8))); if (!c.fired.l && u > 0.8) { c.fired.l = true; this.shake = 2; sfx.boom(); burst(V(drop.x, 1, drop.z), h.T.eye, 50, 25, 1, 4, 3); flash('#ffffff', 0.4); } } },
      { d: 1.6, cap: 'AMBUSH!', ...this.faceCam(h, 5, 9), tick: (u, c) => this.roarShot(h, c, 'a', u, 0.05) },
      { d: 2.2, cap: 'SLIDE UNDER IT!', ...K.side, tick: (u, c, dt) => { // slow motion, right under its claws
        const slow = u > 0.3 && u < 0.75 ? 0.25 : 1; this.runStep(c0, dt, slow);
        if (u > 0.3 && u < 0.8) { const U = p.mesh.userData; p.mesh.rotation.x = -1.1; U.legL.rotation.x = -1.4; U.legR.rotation.x = -1.2; }
        h.vel.set(0, 0, 0); h.chasing = true; h.mesh.userData.armL.sh.rotation.x = h.mesh.userData.armR.sh.rotation.x = -2.2;
        if (!c.fired.s && u > 0.32) { c.fired.s = true; sfx.noise(0.6, 0.2, 900, 'lowpass'); this.shake = 0.8; } } },
      { d: 1.4, cap: 'You made it through!', ...K.front, tick: (u, c, dt) => this.runStep(c0, dt) },
    ], () => { this.endRunScene(c0, []); h.pos.y = 0; collide(h.pos, 1.5); h.stunT = 1.8; h.chasing = true; h.lastKnown = p.pos.clone(); toast('🤸 Close one! KEEP RUNNING!', '#7affd0'); });
    this.cine.showPlayer = true;
  },

  // ---------------- 5 acrobatic scenes: backflips, front flips, a rooftop leap, a lightning storm and a flip combo ----------------
  // rotate the runner around the middle of their body (not their feet) so flips look right
  acro(pitch = 0, roll = 0, tuck = 1) {
    const p = this.player, pm = p.mesh, U = pm.userData;
    pm.rotation.order = 'YXZ'; pm.rotation.x = pitch; pm.rotation.z = roll;
    const off = V(0, 3, 0).applyEuler(pm.rotation);
    pm.position.set(p.pos.x - off.x, p.pos.y + 3 - off.y, p.pos.z - off.z);
    U.armL.rotation.x = U.armR.rotation.x = -2.4 * tuck; U.legL.rotation.x = -1.5 * tuck; U.legR.rotation.x = -1.3 * tuck;
  },
  acroReset() { const pm = this.player.mesh; pm.rotation.x = 0; pm.rotation.z = 0; },
  // a straight running route in front of you + camera rigs (incl. an orbit camera that circles the runner)
  acroPrep(len, speed, hs = [], gaps = []) {
    const p = this.player, f = V(Math.sin(camYaw), 0, Math.cos(camYaw));
    const run = this.makeRun(p.pos, p.pos.clone().addScaledVector(f, len + 8));
    if (!run || run.len < len * 0.7) return null;
    const c0 = { run, dist: 0, endD: Math.min(run.len - 2, len), speed, pp: p.pos.clone(), dir: run.at(0).dir.clone(), hs, gaps, side: 1 };
    const o = p.pos.clone().add(V(0, 3, 0));
    c0.side = rayDistance(o, V(c0.dir.z, 0, -c0.dir.x), 12) > rayDistance(o, V(-c0.dir.z, 0, c0.dir.x), 12) ? 1 : -1;
    const K = this.runCams(c0);
    const P = () => c0.pp.clone().add(V(0, 3, 0)), sd = () => V(c0.dir.z, 0, -c0.dir.x).multiplyScalar(c0.side);
    K.orbit = (r, y, a0, a1) => ({
      pos: (u) => {
        const a = lerp(a0, a1, smooth(u)), from = P(), to = from.clone().addScaledVector(c0.dir, Math.cos(a) * r).addScaledVector(sd(), Math.sin(a) * r).add(V(0, y, 0));
        const d = to.clone().sub(from), L = d.length(); d.divideScalar(L);
        return from.addScaledVector(d, Math.max(2.2, Math.min(L, rayDistance(from, d, L) - 0.8)));
      },
      look: () => P(),
    });
    return { c0, K };
  },
  placeBlocker(c0, d, h) { const q = c0.run.at(d); h.pos.set(q.p.x, 0, q.p.z); h.vel.set(0, 0, 0); h.facing = Math.atan2(-q.dir.x, -q.dir.z); h.chasing = true; return q; },
  swing(h, a) { const U = h.mesh.userData; U.armL.sh.rotation.x = U.armR.sh.rotation.x = -2.6 * a; },
  // one camera shot in which the runner does a move: o = { d, hop, pitch (turns), roll (turns), slow, a, b, blocker, extra }
  flipShot(c0, cap, cam, o) {
    const p = this.player, a = o.a ?? 0.15, b = o.b ?? 0.85;
    const slowAt = (u) => (typeof o.slow === 'function' ? o.slow(u) : (o.slow ?? 1));
    return { d: o.d, cap, ...cam, tick: (u, c, dt) => {
      if (o.blocker && !c.fired.m) { // park the monster exactly where the runner will be at the top of the jump
        c.fired.m = true; let s = 0; const um = (a + b) / 2;
        for (let i = 0; i < 40; i++) s += slowAt(um * (i + 0.5) / 40) * um / 40;
        this.placeBlocker(c0, c0.dist + s * o.d * c0.speed, o.blocker);
      }
      const t = clamp((u - a) / (b - a), 0, 1), air = u > a && u < b;
      this.runStep(c0, dt, slowAt(u), air ? Math.sin(t * Math.PI) * o.hop : 0);
      if (air) {
        const e = smooth(t);
        this.acro((o.pitch || 0) * Math.PI * 2 * e, (o.roll || 0) * Math.PI * 2 * e, o.tuck ?? 1);
        if (!c.fired.j) { c.fired.j = true; sfx.jump(); }
        c.tr = (c.tr || 0) - dt; if (c.tr <= 0) { c.tr = 0.05; burst(p.pos.clone().add(V(0, 3, 0)), o.col ?? 0x7affd0, 4, 5, 0.5, 1); }
      } else if (u >= b) {
        if (!c.fired.l && o.hop > 0) { c.fired.l = true; this.acroReset(); sfx.land(0.7); this.shake = Math.max(this.shake, 0.5); burst(V(p.pos.x, 0.6, p.pos.z), 0xffffff, 18, 9, 0.5, 2); }
      } else this.acroReset();
      if (o.extra) o.extra(u, c, dt);
    } };
  },
  finishAcro(c0, gaps, blocker, msg) {
    this.acroReset(); this.endRunScene(c0, gaps); this.player.moves += 3;
    if (blocker) { blocker.pos.y = 0; collide(blocker.pos, 1.5); blocker.stunT = 2.4; blocker.chasing = true; blocker.lastKnown = this.player.pos.clone(); blocker.path = null; }
    toast(msg, '#7affd0');
  },
  strike(x, z, hit = null) { // a lightning bolt from the sky
    const m = new THREE.Mesh(BOX(1.4, 150, 1.4), neon(0xe0c8ff, 5)); m.position.set(x, 75, z); scene.add(m);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1, 7, 24), glowMat(0xc8a0ff, 0.9)); ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.2, z); scene.add(ring);
    setTimeout(() => { scene.remove(m); scene.remove(ring); }, 260);
    burst(V(x, 1.5, z), 0xe0c8ff, 40, 24, 0.8, 8, 2); flash('#ffffff', 0.55); this.shake = Math.max(this.shake, 1.2); sfx.boom(); sfx.noise(0.5, 0.25, 2500, 'highpass');
    if (hit) { hit.flare = 1.4; sfx.scream(hit.typeKey); }
  },
  // 1) the monster blocks the road: BACKFLIP over its claws (orbit camera, slow motion)
  startBackflip() {
    const h = this.nearestHunter(), A = this.acroPrep(48, 15);
    if (!A) { this.roarScene('backflip', h); return; }
    const { c0, K } = A;
    this.playShots('backflip', [
      { d: 1.5, cap: `${h.T.name} blocks the road…`, ...K.front, tick: (u, c, dt) => { this.runStep(c0, dt); if (c0.dist > 6) this.swing(h, 0.2); } },
      this.flipShot(c0, 'BACKFLIP!', K.orbit(11, 1.5, 1.2, 4.4), { d: 2.8, hop: 7, pitch: -1, slow: 0.45, blocker: h,
        extra: (u, c) => { this.swing(h, Math.sin(clamp(u / 0.75, 0, 1) * Math.PI)); this.roarShot(h, c, 'r', u, 0.3); } }),
      { d: 1.6, cap: 'Stuck the landing!', ...K.low, tick: (u, c, dt) => { this.runStep(c0, dt); this.acroReset(); this.swing(h, 0); } },
    ], () => this.finishAcro(c0, [], h, '🤸 BACKFLIP! Keep running!'));
    this.cine.showPlayer = true;
  },
  // 2) a DOUBLE front flip over a tail sweep, with a frozen-in-time moment at the top
  startFrontFlip() {
    const h = this.nearestHunter(), A = this.acroPrep(48, 16);
    if (!A) { this.roarScene('frontflip', h); return; }
    const { c0, K } = A;
    this.playShots('frontflip', [
      { d: 1.4, cap: 'It swings low…', ...K.side, tick: (u, c, dt) => { this.runStep(c0, dt); } },
      this.flipShot(c0, 'DOUBLE FRONT FLIP!', K.orbit(9, 0.5, 2.0, -1.6), { d: 3.0, hop: 9, pitch: 2, slow: (u) => (u > 0.4 && u < 0.6 ? 0.12 : 0.55), blocker: h, col: 0xffd257,
        extra: (u, c) => { this.swing(h, 0.4 + 0.6 * Math.sin(clamp(u / 0.6, 0, 1) * Math.PI)); h.mesh.rotation.z = Math.sin(clamp((u - 0.2) / 0.5, 0, 1) * Math.PI) * 0.5; if (!c.fired.x && u > 0.45) { c.fired.x = true; flash('#ffe05a', 0.35); this.shake = 0.8; sfx.punch(); } } }),
      { d: 1.6, cap: 'It never even touched you!', ...K.front, tick: (u, c, dt) => { this.runStep(c0, dt); h.mesh.rotation.z = 0; this.roarShot(h, c, 'r', u, 0.4); } },
    ], () => { h.mesh.rotation.z = 0; this.finishAcro(c0, [], h, '🤸 DOUBLE FRONT FLIP!'); });
    this.cine.showPlayer = true;
  },
  // 3) a huge rooftop-style leap: the ground falls away, a triple flip, and a backflip to land
  startRooftop() {
    const h = this.nearestHunter(), A = this.acroPrep(70, 20, [h], [13]);
    if (!A) { this.roarScene('rooftop', h); return; }
    const { c0, K } = A;
    this.playShots('rooftop', [
      { d: 1.5, cap: 'Cornered at the edge!', ...K.behind, tick: (u, c, dt) => { this.runStep(c0, dt); this.roarShot(h, c, 'r', u, 0.2); } },
      this.flipShot(c0, 'LEAP!', K.aerial, { d: 2.2, hop: 24, pitch: 3, slow: 0.55, col: 0x5fd8ff, a: 0.1, b: 0.92,
        extra: (u, c) => { if (!c.fired.t && u > 0.5) { c.fired.t = true; burst(this.player.pos.clone().add(V(0, 3, 0)), 0x5fd8ff, 50, 25, 1, 0, 3); flash('#5fd8ff', 0.3); sfx.boom(); } } }),
      this.flipShot(c0, 'TRIPLE FLIP!', K.orbit(13, 2, 0.4, 3.6), { d: 2.4, hop: 12, pitch: -2, roll: 1, slow: 0.4, col: 0xff5aa8, tuck: 1,
        extra: (u, c) => { if (!c.fired.t && u > 0.5) { c.fired.t = true; this.shake = 1; flash('#ff5aa8', 0.3); sfx.boom(); } } }),
      { d: 1.5, cap: 'You left it in the dust!', ...K.front, tick: (u, c, dt) => { c0.gapK = lerp(1, 2.4, u); this.runStep(c0, dt); this.acroReset(); } },
    ], () => this.finishAcro(c0, [26], null, '🌟 What a leap! Keep going!'));
    this.cine.showPlayer = true;
  },
  // 4) a lightning storm: cartwheel and corkscrew between the bolts while the monster chases
  startStorm() {
    const h = this.nearestHunter(), A = this.acroPrep(64, 17, [h], [16]);
    if (!A) { this.roarScene('storm', h); return; }
    const { c0, K } = A, p = this.player;
    const ahead = (d, s = 0) => { const q = c0.run.at(c0.dist + d); return V(q.p.x + q.dir.z * s, 0, q.p.z - q.dir.x * s); };
    this.playShots('storm', [
      { d: 1.8, cap: 'The sky splits open!', ...K.aerial, tick: (u, c, dt) => { this.runStep(c0, dt); if (!c.fired.s && u > 0.5) { c.fired.s = true; const q = ahead(26, 7); this.strike(q.x, q.z); } } },
      this.flipShot(c0, 'DODGE!', K.orbit(9, 1, 0.9, 2.7), { d: 2.2, hop: 4, roll: 1, slow: 0.45, col: 0xe0c8ff, a: 0.2, b: 0.9,
        extra: (u, c) => { if (!c.fired.s && u > 0.3) { c.fired.s = true; const q = ahead(1, 0); this.strike(q.x, q.z); } } }),
      this.flipShot(c0, 'CORKSCREW!', K.low, { d: 2.2, hop: 6, pitch: 1, roll: 1, slow: 0.45, col: 0xe0c8ff, a: 0.2, b: 0.9,
        extra: (u, c) => { if (!c.fired.s && u > 0.3) { c.fired.s = true; const q = ahead(2, -4); this.strike(q.x, q.z); } } }),
      { d: 1.8, cap: `The lightning hits ${h.T.name}!`, ...K.behind, tick: (u, c, dt) => { c0.gapK = lerp(1, 2.2, u); this.runStep(c0, dt); this.acroReset(); if (!c.fired.s && u > 0.3) { c.fired.s = true; this.strike(h.pos.x, h.pos.z, h); } } },
    ], () => this.finishAcro(c0, [30], null, '⚡ Dodged the storm!'));
    this.cine.showPlayer = true;
  },
  // 5) the grand finale: vault, backflip, front flip, corkscrew and a double backflip, with fireworks
  startCombo() {
    const h = this.nearestHunter(), A = this.acroPrep(86, 22, [h], [15]);
    if (!A) { this.roarScene('combo', h); return; }
    const { c0, K } = A, p = this.player;
    const fw = (u, c, dt) => { c.fw = (c.fw || 0) - dt; if (c.fw <= 0) { c.fw = 0.14; burst(p.pos.clone().add(V((Math.random() - 0.5) * 24, 6 + Math.random() * 18, (Math.random() - 0.5) * 24)), [0x78ff8f, 0xffd257, 0xff5aa8, 0x5fd8ff][Math.floor(Math.random() * 4)], 26, 22, 1.2, 0, 3); } };
    this.playShots('combo', [
      { d: 1.2, cap: 'PARKOUR!', ...K.front, tick: (u, c, dt) => this.runStep(c0, dt) },
      this.flipShot(c0, 'VAULT!', K.side, { d: 1.0, hop: 3.5, tuck: 0.5 }),
      this.flipShot(c0, 'BACKFLIP!', K.orbit(10, 1, 1.3, 3.2), { d: 1.6, hop: 6, pitch: -1, slow: 0.7 }),
      this.flipShot(c0, 'FRONT FLIP!', K.low, { d: 1.6, hop: 6.5, pitch: 1, slow: 0.7, col: 0xffd257 }),
      this.flipShot(c0, 'CORKSCREW!', K.orbit(11, 3, 0.6, 3.6), { d: 2.0, hop: 9, pitch: 1, roll: 2, slow: 0.5, col: 0xff5aa8, extra: fw }),
      this.flipShot(c0, 'DOUBLE BACKFLIP!!!', K.orbit(15, 4, 3.6, 0.4), { d: 2.4, hop: 13, pitch: -2, slow: 0.4, col: 0x5fd8ff, extra: (u, c, dt) => { fw(u, c, dt); if (!c.fired.b && u > 0.5) { c.fired.b = true; sfx.boom(); flash('#ffffff', 0.4); this.shake = 1.2; } } }),
      { d: 1.8, cap: 'UNSTOPPABLE!', ...K.behind, tick: (u, c, dt) => { c0.gapK = lerp(1, 2.6, u); this.runStep(c0, dt); this.acroReset(); fw(u, c, dt); if (!c.fired.w) { c.fired.w = true; sfx.escape(); } } },
    ], () => this.finishAcro(c0, [34], null, '🏅 PARKOUR LEGEND!'));
    this.cine.showPlayer = true;
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
    splash('RUN!', `${this.endless ? '♾ Endless ' + this.endless : this.custom ? '🛠 Your map' : 'Level ' + this.level}: ${LV().name}. ` + (LV().battle ? `Collect ${CFG.keysNeeded} ${LV().keyWord}s to grow GIANT` : `Find ${CFG.keysNeeded} keys and escape`), '#ffd257');
    { const Q = world.quest.q; setTimeout(() => storyCard(`${Q.icon} STORY QUEST: ${Q.title}`, `Find ${world.quest.items.length} ${Q.item}s (${Q.icon} on your map). ${LV().big ? '⭐ BIG LEVEL: bigger quest, bigger reward!' : ''}`, hex6(Q.col)), 2600); }
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
  // the monster lunges, grabs you, puts you ALL the way in its mouth… then CHOMP
  updateDeath(dt) {
    const c = this.cine, t = (c.t += dt), p = this.player, h = c.hunter, sc = h.T.scale;
    const TIN = 1.4, TDEEP = 2.3, TTURN = 3.0, TCHOMP = 3.25, TEND = 5.8;
    const fire = (key, at, fn) => { if (!c[key] && t > at) { c[key] = true; fn(); } };
    const eye = V(p.pos.x, p.pos.y + 4.6, p.pos.z);
    if (t < TIN) {
      // 1) it lunges at you and opens wide
      const flat = V(eye.x - c.hStart.x, 0, eye.z - c.hStart.z);
      const fd = Math.max(0.01, flat.length()); flat.divideScalar(fd);
      const lungeTo = V(eye.x - flat.x * h.T.lunge, h.pos.y, eye.z - flat.z * h.T.lunge);
      const lu = smooth((t - 0.35) / 0.35);
      h.pos.x = lerp(c.hStart.x, lungeTo.x, lu); h.pos.z = lerp(c.hStart.z, lungeTo.z, lu);
      h.chasing = true; h.facing = Math.atan2(flat.x, flat.z);
      h.eatJaw = t < 0.7 ? 1.05 : 1.65;
      fire('screamed', 0.35, () => { sfx.scream(h.typeKey); this.shake = 1.6; h.flare = 1.4; flash('#ff0010', 0.6); burst(eye.clone().addScaledVector(flat, -1.5), h.T.eye, 30, 10, 0.8, 2); });
      // 2) it grabs you and pulls you toward its mouth
      h.mesh.updateMatrixWorld(true);
      const head = h.mesh.userData.headAnchor.getWorldPosition(V(0, 0, 0));
      const mouth = head.clone().add(V(0, -0.35 * sc, 0));
      const toCam = eye.clone().sub(mouth); toCam.y = 0; toCam.normalize();
      c.mouth = mouth; c.toCam = toCam;
      const pull = smooth((t - 0.7) / (TIN - 0.7));
      camera.position.copy(eye).lerp(mouth.clone().addScaledVector(toCam, 0.5 * sc), pull);
      camera.lookAt(c.lookStart.clone().lerp(head, smooth(t / 0.35)).lerp(mouth.clone().addScaledVector(toCam, -3 * sc), pull));
      camera.rotateZ(Math.sin(t * 9) * 0.05 * pull); // you're struggling
      ui.static.style.opacity = t > 0.35 ? (0.06 + Math.random() * 0.1).toFixed(2) : 0;
      ui.vignette.style.opacity = Math.min(1, t * 2).toFixed(2);
      ui.fade.style.opacity = 0;
    } else {
      // 3) you're INSIDE its mouth: throat ahead, tongue below, teeth all around the opening
      if (!c.room) {
        c.room = buildMouthRoom(h.T, Math.max(0.8, sc * 0.6));
        c.room.g.position.copy(c.mouth); c.room.g.lookAt(c.mouth.clone().add(c.toCam));
        scene.add(c.room.g); h.mesh.visible = false;
        flash('#5a0010', 0.8); sfx.slurp(); this.shake = 0.6; ui.static.style.opacity = 0;
      }
      const R = c.room, g = R.g;
      g.updateMatrixWorld(true);
      const deep = smooth((t - TIN) / (TDEEP - TIN)), turn = smooth((t - TDEEP) / (TTURN - TDEEP));
      const local = V(Math.sin(t * 2.2) * 0.15, -0.25 + Math.sin(t * 3) * 0.08, lerp(0.6, -R.L * 0.55, deep));
      const phi = turn * Math.PI; // turn around to look back out of the mouth
      const lookL = local.clone().add(V(Math.sin(phi) * 4, -0.1 + turn * 0.15, -Math.cos(phi) * 4));
      camera.position.copy(g.localToWorld(local.clone()));
      camera.lookAt(g.localToWorld(lookL));
      camera.rotateZ(Math.sin(t * 2) * 0.04);
      // 4) the jaws slam shut
      const shut = clamp((t - TTURN) / (TCHOMP - TTURN), 0, 1) ** 2;
      R.top.position.y = -R.R * 0.95 * shut; R.bot.position.y = R.R * 0.95 * shut;
      R.lid.material.opacity = clamp((t - TCHOMP + 0.05) / 0.12, 0, 1);
      fire('chomp0', TCHOMP, () => { sfx.chomp(1); this.shake = 2.4; flash('#ff0010', 0.8); });
      // 5) darkness… chewing… gulp
      const chew = t > TCHOMP ? Math.min(1, 0.72 + 0.28 * Math.abs(Math.cos((t - TCHOMP) * 5.2))) : 0;
      ui.teeth.style.opacity = t > TCHOMP ? 1 : 0;
      ui.teethTop.style.transform = `translateY(${((chew - 1) * 100).toFixed(1)}%)`;
      ui.teethBot.style.transform = `translateY(${((1 - chew) * 100).toFixed(1)}%)`;
      [0.6, 1.2].forEach((dtc, k) => fire('chew' + k, TCHOMP + dtc, () => { sfx.chomp(0.7); this.shake = 1.3; flash('#ff0010', 0.35); }));
      fire('splashed', TCHOMP + 0.15, () => splash('EATEN!', h.T.caption, h.T.eyeCss));
      fire('gulped', TCHOMP + 1.8, () => sfx.gulp());
      ui.fade.style.background = '#1a0002';
      ui.fade.style.opacity = (t < TCHOMP ? 0 : t < TCHOMP + 1.7 ? 0.55 + 0.25 * Math.abs(Math.sin(t * 5.2)) : clamp(0.8 + (t - TCHOMP - 1.7) / 0.8, 0, 1)).toFixed(3);
    }
    this.applyShake(dt);
    if (t > TEND) { this.endCine(); this.endMine(); }
  },
  cleanupDeath(c) {
    if (c.room) { scene.remove(c.room.g); c.room.g.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); c.room = null; }
    if (c.hunter) { c.hunter.eatJaw = undefined; c.hunter.mesh.visible = true; }
    this.hideTeeth();
  },
  hideTeeth() { ui.teeth.style.opacity = 0; ui.teethTop.style.transform = 'translateY(-100%)'; ui.teethBot.style.transform = 'translateY(100%)'; },

  startEscape() {
    this.player.state = 'escaped';
    sfx.escape();
    flash('#ffffff', 0.6);
    splash('YOU ESCAPED!', LV().escape, '#78ff8f');
    this.result = { win: true, reason: `Escaped with ${fmtTime(CFG.roundTime - this.elapsed)} left` };
    if (!net.on) for (const h of this.hunters) { h.released = false; h.vel.set(0, 0, 0); }
    const chaser = !net.on && this.hunters.filter((h) => h.active).length ? this.nearestHunter() : null;
    if (chaser) { chaser.pos.set(world.exit.x + 3, 0, world.half - 16 * Math.max(1, chaser.T.scale * 0.5)); chaser.chasing = true; }
    this.beginCine('escape', { fireworks: 0, chaser, freeze: !!chaser, big: LV().big });
    setCaption(this.endless ? `♾ Endless ${this.endless} cleared! Next: Endless ${this.endless + 1}…` : this.custom ? `🛠 You beat your own map: ${this.custom.name}!` : this.level < LEVELS.length ? `Next: ${LEVELS[this.level].emoji} ${LEVELS[this.level].name}…` : '🏆 You survived all three nightmares!');
  },
  updateEscape(dt) {
    const c = this.cine; if (c.big && c.t < 2.2) dt *= 0.45;
    const t = (c.t += dt), p = this.player, ex = world.exit.x, half = world.half;
    p.pos.x = lerp(p.pos.x, ex, 1 - Math.exp(-3 * dt));
    p.pos.z += 17 * dt; p.pos.y = Math.max(0, p.pos.y - 20 * dt);
    p.vel.set(0, 0, 17); p.onGround = true; p.sprinting = true;
    p.mesh.visible = true;
    p.animate(dt, 17);
    const h = c.chaser, e = world.exit;
    if (h) { // it chases you right up to the gate… and the gate slams shut in its face
      const stopZ = half - 2 * Math.max(1, h.T.scale * 0.6);
      if (h.pos.z < stopZ) { h.pos.z = Math.min(stopZ, h.pos.z + 21 * dt); h.pos.x = lerp(h.pos.x, ex, 1 - Math.exp(-3 * dt)); h.vel.set(0, 0, 21); h.facing = 0; }
      else { h.vel.set(0, 0, 0); if (!c.slam) { c.slam = true; e.gate.visible = true; e.gateSign.userData.draw('🔒 SHUT!', '#ff5a6a'); sfx.boom(); sfx.scream(h.typeKey); this.shake = 1.8; flash(h.T.eyeCss, 0.4); burst(V(ex, 8, half + 2), h.T.eye, 60, 22, 1.2, 4, 3); h.flare = 1.5; } }
      h.chasing = true;
    }
    if (c.big && t < 2.2) { // BIG levels: a slow-motion side shot first
      camera.position.set(p.pos.x + 13, 3.2, p.pos.z - 4); camera.lookAt(p.pos.x, 3, p.pos.z - 3);
    } else { camera.position.set(ex + 11, 6.5, half + 38); camera.lookAt(p.pos.x, 3.5, p.pos.z); }
    c.fireworks -= dt;
    if (c.fireworks <= 0) {
      c.fireworks = 0.35;
      const col = [0x78ff8f, 0xffd257, 0xff5aa8, 0x5fd8ff][Math.floor(Math.random() * 4)];
      burst(V(ex + (Math.random() - 0.5) * 40, 30 + Math.random() * 25, half + 20 + Math.random() * 30), col, 40, 16, 1.4, 0);
      sfx.boom();
    }
    ui.fade.style.background = '#fff';
    const T0 = c.big ? 3.6 : 2.8;
    ui.fade.style.opacity = clamp((t - T0) / 0.7, 0, 1).toFixed(3);
    if (t > T0 + 0.8) { this.endCine(); ui.fade.style.background = '#000'; this.endMine(); }
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
      if (L.battle) { if (net.isHost) net.broadcast({ t: 'battle' }); if (!net.on && !this.frenzy) this.startFrenzy(() => this.startBattle()); else this.startBattle(); }
      else { if (net.isHost) net.broadcast({ t: 'exit' }); this.openExit(); }
    }
  },
  // ---- story quest
  collectQuest(q) {
    const Q = world.quest.q, L = LV(), names = L.monsters.map((k) => MONSTERS[k].name);
    q.taken = true; q.decal.visible = false;
    if (Q.id === 'beacons') { const f = new THREE.Mesh(new THREE.ConeGeometry(0.8, 2.4, 8), neon(0xff8a1a, 3)); f.position.y = 4; q.mesh.add(f); } // the beacon stays lit
    else q.mesh.visible = false;
    this.questGot++;
    const need = world.quest.items.length;
    sfx.key(); flash(hex6(Q.col), 0.2); burst(V(q.x, 3, q.z), Q.col, 24, 10, 0.8);
    storyCard(`${Q.icon} ${Q.title} ${this.questGot}/${need}`, Q.lines(L, names)[this.questGot - 1] || '', hex6(Q.col));
    if (this.questGot >= need && !this.questDone) {
      this.questDone = true;
      this.questPerkT = 1.8; // the reward lands a moment after the last item
    }
  },
  questReward() {
      const Q = world.quest.q, p = this.player;
      {
        splash('QUEST COMPLETE!', Q.perkText, hex6(Q.col)); sfx.escape();
        let perk = Q.perk;
        if (net.isClient && (perk === 'slow' || perk === 'stun')) perk = 'bomb'; // only the host runs the monsters
        if (perk === 'keys') this.revealKeys = true;
        else if (perk === 'slow') this.slowT = 25;
        else if (perk === 'ghost') p.ghosts = Math.min(3, p.ghosts + 2);
        else if (perk === 'bomb') p.bombs = Math.min(3, p.bombs + 2);
        else if (perk === 'boost') p.boostUntil = this.time + 15;
        else if (perk === 'stun') for (const h of this.hunters) if (h.active) { h.stunT = 6; h.chasing = false; h.vel.set(0, 0, 0); }
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
    ], () => { this.showGateOpen(); h.chasing = false; splash('THE EXIT IS OPEN!', 'Get to the gate. The monsters are enraged!', '#78ff8f'); const enrage = () => { if (!this.frenzy) this.startFrenzy(); }; if (!this.bigFired.finalrun) { this.bigFired.finalrun = true; this.startRunScene('finalrun', enrage); } else enrage(); });
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
    if (this.questDone) rows.push([`📜 Quest: ${world.quest.q.title}`, LV().big ? 50 : 25]);
    else if (this.questGot) rows.push([`📜 Quest items (${this.questGot}/${world.quest.items.length})`, this.questGot * 5]);
    if (this.player && this.player.moves) rows.push([`🤸 Parkour moves (${this.player.moves})`, Math.min(40, this.player.moves * 2)]);
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
      if (!this.custom && (b === undefined || this.elapsed < b)) save.levelBest[this.level] = this.elapsed;
    }
    writeSave();
    const last = this.level >= LEVELS.length && !this.custom;
    if (this.endless && this.result.win && !this.practice) { save.endless = Math.max(save.endless || 0, this.endless); writeSave(); }
    $('nextBtn').classList.toggle('hidden', this.endless ? !(this.result.win && !net.on) : !!this.custom || net.isClient || (net.isHost ? last : !(this.result.win && !last)));
    $('againBtn').classList.toggle('hidden', net.isClient);
    $('againBtn').textContent = net.isHost ? 'Play again (everyone)' : 'Play again';
    $('menuBtn').textContent = net.on ? 'Room lobby' : 'Menu';
    if (net.on) { net.syncLobby(); if (net.isClient) setTimeout(() => { $('resultSub').textContent += ' · Waiting for the host to start the next round…'; }, 0); }
    $('resultTitle').textContent = this.result.win ? (last ? 'YOU BEAT IT ALL!' : LV().battle ? (LV().battleTitle || 'TITANS DEFEATED!') : 'ESCAPED!') : 'EATEN!';
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
      if (world.final) { // the sky eye watches you, and lightning cracks across the sky
        if (world.skyEye && this.player) world.skyEye.lookAt(this.player.pos.x, 0, this.player.pos.z);
        this.boltT = (this.boltT ?? 3) - dt;
        if (this.bolt) { this.bolt.life -= dt; if (this.bolt.life <= 0) { world.group.remove(this.bolt.g); this.bolt = null; } }
        if (this.boltT <= 0 && this.state === 'play' && !this.cine && this.player) {
          this.boltT = 3 + Math.random() * 6;
          const g = new THREE.Group(), p = this.player.pos, x = p.x + (Math.random() - 0.5) * 160, z = p.z + 60 + Math.random() * 80;
          let px = x, py = 160;
          const bm = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xd8b0ff).multiplyScalar(4), fog: false });
          while (py > 0) { const nx = px + (Math.random() - 0.5) * 18, ny = py - 14 - Math.random() * 10, len = Math.hypot(nx - px, ny - py); const seg = new THREE.Mesh(BOX(1.2, len, 1.2), bm); seg.position.set((px + nx) / 2, (py + ny) / 2, z); seg.rotation.z = Math.atan2(px - nx, ny - py) * -1; g.add(seg); px = nx; py = ny; }
          world.group.add(g); this.bolt = { g, life: 0.18 };
          flash('#c8a0ff', 0.3); setTimeout(() => sfx.boom(), 250);
        }
      }
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
      p.mesh.visible = this.cine.kind === 'escape' || this.cine.kind === 'battle' || this.cine.kind === 'victory' || !!this.cine.showPlayer;
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
      k.beam.material.opacity = this.revealKeys ? 0.3 : d < 110 ? 0.14 * (1 - d / 110) + 0.04 : 0;
      if (d < 3.2 && p.pos.y < 6) this.collectKey(k);
    }
    for (const d of world.drinks) if (!d.taken && Math.hypot(d.x - p.pos.x, d.z - p.pos.z) < 2.6 && p.pos.y < 5) this.collectDrink(d);
    for (const it of world.items) if (!it.taken && Math.hypot(it.x - p.pos.x, it.z - p.pos.z) < 2.6 && p.pos.y < 5) this.collectItem(it);
    for (const q of world.quest.items) if (!q.taken && Math.hypot(q.x - p.pos.x, q.z - p.pos.z) < 3 && p.pos.y < 6) this.collectQuest(q);
    this.slowT = Math.max(0, this.slowT - dt);
    if (this.questPerkT > 0 && (this.questPerkT -= dt) <= 0) this.questReward();
    if (this.checkBigScenes()) return;
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
    fogTarget.setHex(tintFog(Z.fog)).lerp(FOG_RED, this.danger * 0.4);
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
      const eye = V(p.pos.x, p.pos.y + 4.6 + bob - p.landDip * 0.9 - p.crouch * 2.6 - (p.rollT > 0 ? Math.sin((p.rollT / 0.45) * Math.PI) * 2 : 0), p.pos.z);
      const pt = -camPitch;
      const dir = V(Math.sin(camYaw) * Math.cos(pt), Math.sin(pt), Math.cos(camYaw) * Math.cos(pt));
      camera.position.copy(eye);
      camera.lookAt(tmpV.copy(eye).add(dir));
      const right = V(-Math.cos(camYaw), 0, Math.sin(camYaw));
      camera.rotateZ(-(p.vel.x * right.x + p.vel.z * right.z) * 0.0025 + p.camRoll); // lean when strafing / doing parkour
      if (p.rollT > 0) camera.rotateX(-(1 - p.rollT / 0.45) * Math.PI * 2 * 0.15);
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
      ui.phase.textContent = this.exitOpen ? '🚪 EXIT OPEN, RUN!' : this.frenzy ? '⚠ FRENZY' : LV().battle ? `FIND ${LV().keyWord.toUpperCase()}S` : 'FIND THE KEYS';
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
    const qp = $('questPill'), Q = world.quest.q;
    if (qp && world.quest.items.length) { qp.classList.remove('hidden'); qp.textContent = this.questDone ? `${Q.icon} ✓ ${Q.title}` : `${Q.icon} ${this.questGot}/${world.quest.items.length} ${Q.title}`; qp.style.color = this.questDone ? 'var(--green)' : hex6(Q.col); }
    if (showMap) drawMap(now);
  },
};

function setPaused(on) {
  game.paused = on;
  ui.pause.classList.toggle('hidden', !on);
  if (on) { for (const k in keys) keys[k] = false; input.joyX = input.joyY = 0; if (locked()) document.exitPointerLock(); }
}

// ---------------------------------------------------------------------------
// CREATE: design your own monsters and maps (saved in this browser), then play them
// ---------------------------------------------------------------------------
const MAKER = {
  hats: ['none', 'crown', 'top', 'witch', 'cowboy', 'helm', 'party', 'chef', 'shroom', 'feathers', 'miner', 'cap', 'beret', 'nightcap', 'mortarboard', 'straw', 'bandana', 'bow', 'swirl', 'flower', 'laurel', 'tricorn'],
  held: ['none', 'scythe', 'sword', 'staff', 'lantern', 'club', 'pickaxe', 'spear', 'hook', 'anchor', 'flashlight', 'umbrella', 'broom', 'cleaver', 'wrench', 'balloons', 'book', 'claw', 'megaphone', 'syringe', 'buoy', 'ladle'],
  orbit: ['none', 'stars', 'skulls', 'embers', 'snow', 'bubbles', 'cubes', 'bolts', 'sparkles', 'shards', 'spores', 'wisps', 'notes', 'coins', 'petals', 'feathers', 'flies', 'papers'],
  head: ['normal', 'big', 'long', 'wide', 'dome', 'faceless', 'brain jar', 'flytrap', 'space helmet'],
  face: ['none', 'snout', 'long snout', 'beak', 'grin', 'mask', 'mandibles', 'glasses', 'goggles'],
  horns: ['none', 'horns', 'antlers', 'unicorn horn', 'pointy ears', 'round ears', 'antennae', 'lion mane'],
  back: ['none', 'bat wings', 'moth wings', 'shell', 'gear', 'fin', 'flames', 'crystals', 'spikes', 'wind-up key', 'cape'],
  extras: [['tail', 'Tail'], ['extraArms', 'Extra arms'], ['fur', 'Fur'], ['cracks', 'Glowing cracks'], ['ghost', 'Ghostly glow'], ['drips', 'Drips'], ['mushrooms', 'Mushrooms'], ['leaves', 'Leaves'], ['stripes', 'Stripes'], ['metal', 'Metal'], ['longClaws', 'Long claws'], ['robe', 'Robe / cloak']],
  emojis: ['👹', '👾', '🐲', '🦖', '👻', '🧟', '🕷', '🐺', '🤖', '🎃', '💀', '🦑', '🐍', '🦇', '👽', '🧛', '🐙', '🦂', '🐻', '🦈', '🧙', '🤡', '🌋', '❄️', '⚡', '🍄', '🌈', '🔥'],
  mapEmojis: ['🏰', '🌋', '🏝', '🌲', '🏙', '🏜', '❄️', '🌊', '🪐', '🎪', '🍭', '🏚', '🌑', '⚡', '🍄', '🗺'],
  weather: [['none', '☀ Clear'], ['rain', '🌧 Rain'], ['snow', '❄ Snow'], ['embers', '🔥 Embers'], ['ash', '🌫 Ash'], ['sand', '🏜 Sandstorm'], ['bubbles', '🫧 Bubbles'], ['sprinkles', '✨ Sprinkles']],
};
const creations = () => (save.creations = save.creations || { monsters: [], maps: [] });
// turn a monster design into the options the monster builder understands
function designLook(d) {
  const o = { spikes: 0, ribs: false };
  const base = { upright: 1.3, crawl: 1.05, float: 1.2 }[d.posture];
  o.scale = base * d.size; if (d.size >= 2.2) o.giant = true;
  o.speed = { slow: -1.5, normal: 0, fast: 2, insane: 3.5 }[d.speed] ?? 0;
  if (d.posture === 'float') { o.flicker = !!d.flicker; o.longClaws = true; }
  if (d.head === 'big') o.bigHead = true; else if (['long', 'wide', 'dome'].includes(d.head)) o.headShape = d.head;
  else if (d.head === 'faceless') o.faceless = true; else if (d.head === 'brain jar') o.brainJar = true; else if (d.head === 'flytrap') o.trapHead = d.body; else if (d.head === 'space helmet') o.spaceHelmet = true;
  ({ snout: () => { o.snout = [1.1, 0.8]; }, 'long snout': () => { o.snout = [1.9, 1.1]; }, beak: () => { o.beak = 1.3; }, grin: () => { o.grin = true; }, mask: () => { o.mask = true; }, mandibles: () => { o.mandibles = true; }, glasses: () => { o.glasses = true; }, goggles: () => { o.goggles = true; } }[d.face] || (() => {}))();
  ({ horns: () => { o.horns = true; }, antlers: () => { o.antlers = true; }, 'unicorn horn': () => { o.unihorn = true; }, 'pointy ears': () => { o.ears = 'pointy'; }, 'round ears': () => { o.ears = 'round'; }, antennae: () => { o.antennae = true; }, 'lion mane': () => { o.ruff = new THREE.Color(d.body).multiplyScalar(0.6).getHex(); } }[d.horns] || (() => {}))();
  ({ 'bat wings': () => { o.wings = true; o.wingColor = d.body; }, 'moth wings': () => { o.wings = 'round'; o.wingColor = d.body; }, shell: () => { o.shell = new THREE.Color(d.body).multiplyScalar(0.7).getHex(); }, gear: () => { o.gearBack = true; }, fin: () => { o.fin = true; }, flames: () => { o.flames = d.eye; }, crystals: () => { o.crystals = d.eye; }, spikes: () => { o.spikes = 8; o.spikeLen = 1.4; }, 'wind-up key': () => { o.windKey = true; }, cape: () => { o.collar = new THREE.Color(d.body).multiplyScalar(0.5).getHex(); } }[d.back] || (() => {}))();
  if (d.hat !== 'none') { o.hat = d.hat; if (d.hat === 'crown') o.crown = d.eye; }
  if (d.held === 'balloons') o.balloons = [0xff3a6a, 0xffe03a, 0x3a8aff]; else if (d.held !== 'none') o.held = d.held;
  if (d.orbit !== 'none') o.orbit = d.orbit;
  o.eyes = +d.eyes; o.eyeSize = d.eyeSize;
  const x = d.extras || {}, dark = new THREE.Color(d.body).multiplyScalar(0.55).getHex();
  if (x.tail) o.tail = true; if (x.extraArms) o.extraArms = true; if (x.fur) o.fur = new THREE.Color(d.body).lerp(new THREE.Color(0xffffff), 0.15).getHex();
  if (x.cracks) o.cracks = d.eye; if (x.ghost) o.ghost = new THREE.Color(d.eye).multiplyScalar(0.35).getHex(); if (x.drips) o.drips = d.eye;
  if (x.mushrooms) o.mushrooms = d.eye; if (x.leaves) o.leaves = 0x3a7a2a; if (x.stripes) o.stripes = [d.body, dark]; if (x.metal) o.metal = true; if (x.longClaws) o.longClaws = true;
  if (x.robe) o.robe = dark;
  return o;
}
function registerCreation(d) {
  const T = M(d.name || 'My Monster', d.emoji, d.eye, d.posture, d.body, designLook(d));
  T.caption = `${T.name} got you. (Made by you!)`; T.custom = true;
  MONSTERS['u_' + d.id] = T;
  return 'u_' + d.id;
}
// the areas you can paint with, grouped by the level they come from
const MAKER_ZONES = (() => {
  const seen = new Set(), out = [];
  for (const L of LEVELS) if (!L.mix && !L.final) for (const z of [L.center, ...L.corners]) if (ZONES[z] && !seen.has(z)) { seen.add(z); out.push(z); }
  for (const z of ['throne', 'voidrift', 'bonefield', 'stormspire']) if (!seen.has(z)) out.push(z);
  return out;
})();
// turn a map design into a playable level
function customLevel(m) {
  const flat = m.layout.flat(), count = {};
  for (const z of flat) count[z] = (count[z] || 0) + 1;
  const uniq = Object.keys(count).sort((a, b) => count[b] - count[a]);
  const t = new THREE.Color(m.tint), dark = { dim: 0.55, normal: 0.75, bright: 0.95 }[m.light] ?? 0.75;
  const mons = m.monsters.map((k) => (MONSTERS[k] ? k : 'stalker'));
  return {
    name: m.name || 'My Map', emoji: m.emoji, color: '#' + t.getHexString(), custom: true, layout: m.layout,
    center: uniq[0], corners: [...uniq.slice(1), ...uniq, ...uniq].slice(0, 4), monsters: mons,
    hemi: [t.clone().lerp(new THREE.Color(0xffffff), 0.55).getHex(), t.clone().multiplyScalar(0.06).getHex(), dark],
    sky: t.clone().multiplyScalar(0.05).getHex(), wall: t.clone().multiplyScalar(0.3).getHex(), lair: MONSTERS[mons[0]].eye,
    speedBonus: { slow: 0, normal: 3, fast: 6, insane: 9 }[m.speed] ?? 3, weather: m.weather === 'none' ? null : m.weather,
    gravity: { normal: undefined, low: 46, moon: 34 }[m.gravity], tint: [m.tint, 0.2], moon: t.clone().lerp(new THREE.Color(0xffffff), 0.6).getHex(), big: !!m.big,
    blurb: 'A map you designed yourself!',
    story: [`Welcome to ${m.name || 'your map'}. You built this place…`, 'The only way out is the north gate.', 'Find 5 keys…', `${MONSTERS[mons[0]].name} is waiting for you.`, 'Did you really think you were safe in your OWN map?'],
    released: ['Your monsters are loose!', 'RUN!'], escape: `You escaped ${m.name || 'your map'}!`,
  };
}
for (const d of creations().monsters) registerCreation(d);

// ---------------------------------------------------------------------------
// AUTO MAKERS: a never-ending supply of new monsters and maps (used by Endless mode and the Create tab)
// ---------------------------------------------------------------------------
const GEN = {
  A: ['Grim', 'Night', 'Shadow', 'Bone', 'Hollow', 'Rot', 'Gloom', 'Fang', 'Creep', 'Howl', 'Ash', 'Venom', 'Mire', 'Dusk', 'Wretch', 'Husk', 'Thorn', 'Gore', 'Pale', 'Sorrow', 'Cinder', 'Frost', 'Rust', 'Moth', 'Plague', 'Drip', 'Static', 'Void'],
  B: ['crawler', 'stalker', 'walker', 'wraith', 'beast', 'maw', 'lurker', 'grinner', 'gnasher', 'creeper', 'shambler', 'render', 'screamer', 'biter', 'horror', 'wisp', 'titan', 'warden', 'hound', 'widow'],
  PA: ['Hollow', 'Crimson', 'Forgotten', 'Drowned', 'Silent', 'Burning', 'Frozen', 'Twisted', 'Neon', 'Rusted', 'Haunted', 'Lost', 'Shattered', 'Sunken', 'Whispering', 'Endless', 'Bleeding', 'Gilded', 'Toxic', 'Electric'],
  PB: ['Marrows', 'Docks', 'Gardens', 'Heights', 'Catacombs', 'Wastes', 'Carnival', 'Station', 'Orchard', 'Reef', 'Foundry', 'Canyon', 'Quarter', 'Hollows', 'Citadel', 'Fields', 'Tunnels', 'Peaks', 'Mall', 'Sanctum'],
};
const rngPick = (r, a) => a[Math.floor(r() * a.length)];
// a brand-new monster design (same format the Monster Maker uses); n = how deep into Endless we are (bigger = nastier)
function genMonster(r, id, n = 1) {
  const hue = r(), col = (h, sa, l) => new THREE.Color().setHSL(h % 1, sa, l).getHex(), pick = (a) => rngPick(r, a);
  const d = { id, name: `The ${pick(GEN.A)}${pick(GEN.B)}`, emoji: pick(MAKER.emojis), posture: pick(['upright', 'upright', 'crawl', 'float']),
    body: col(hue, 0.45 + r() * 0.45, 0.14 + r() * 0.2), eye: col(hue + 0.4 + r() * 0.2, 1, 0.55), size: +Math.min(2.6, 0.9 + r() * 0.7 + Math.min(0.6, n * 0.025)).toFixed(1),
    speed: n < 3 ? 'normal' : pick(['normal', 'normal', 'fast', n > 8 ? 'insane' : 'fast']), head: pick(MAKER.head), face: pick(MAKER.face), horns: pick(MAKER.horns), back: pick(MAKER.back),
    hat: r() < 0.5 ? 'none' : pick(MAKER.hats), held: r() < 0.5 ? 'none' : pick(MAKER.held), orbit: r() < 0.55 ? 'none' : pick(MAKER.orbit),
    eyes: pick([1, 2, 2, 6]), eyeSize: +(0.8 + r()).toFixed(1), flicker: r() < 0.3, extras: {} };
  for (const [k] of MAKER.extras) if (r() < 0.18) d.extras[k] = true;
  return d;
}
function registerGen(d) { // make a generated monster playable without saving it
  const key = 'u_' + d.id;
  if (!MONSTERS[key]) { registerCreation(d); MONSTERS[key].custom = false; MONSTERS[key].caption = `${d.name} got you.`; }
  return key;
}
// a brand-new map design: 4 random areas blended into a 5x5 layout
function genMap(r, id, n = 1) {
  const pick = (a) => rngPick(r, a), sites = Array.from({ length: 4 }, () => ({ x: r() * 4, y: r() * 4, z: pick(MAKER_ZONES) }));
  const layout = Array.from({ length: 5 }, (_, row) => Array.from({ length: 5 }, (_, c) => sites.reduce((b, s) => (Math.hypot(s.x - c, s.y - row) + r() * 0.8 < Math.hypot(b.x - c, b.y - row) + r() * 0.8 ? s : b)).z));
  return { id, name: `${pick(GEN.PA)} ${pick(GEN.PB)}`, emoji: pick(MAKER.mapEmojis), tint: '#' + new THREE.Color().setHSL(r(), 0.6 + r() * 0.4, 0.5).getHexString(),
    weather: pick(MAKER.weather)[0], light: pick(['dim', 'normal', 'normal', 'bright']), gravity: pick(['normal', 'normal', 'normal', 'low', 'moon']), speed: 'normal', big: false, layout, monsters: [] };
}
// Endless level n: always the same for the same n, and there is always an n+1
function endlessLevel(n) {
  const r = mulberry32(((n * 2654435761) ^ 0x9e3779b9) >>> 0);
  const m = genMap(r, 'e' + n, n);
  m.monsters = [0, 1, 2].map((i) => registerGen(genMonster(r, `e${n}_${i}`, n)));
  m.big = n % 5 === 0;
  const L = customLevel(m), mn = m.monsters.map((k) => MONSTERS[k].name);
  L.endless = n; L.speedBonus = Math.min(16, 2 + n * 0.7);
  L.blurb = `♾ Endless #${n}: ${mn.join(', ')} hunt you through ${m.name}.${m.big ? ' ⭐ BIG level!' : ''}`;
  L.story = [`Endless night #${n}. ${m.name}.`, 'The only way out is the north gate.', 'Find 5 keys…', `${mn[0]} is waiting for you.`, 'There is always another night…'];
  L.released = [`${mn[0]}, ${mn[1]} and ${mn[2]} are loose!`, 'RUN!'];
  L.escape = `You escaped ${m.name}! Another night awaits…`;
  return L;
}

// ---- the Create tab
const maker = {
  mon: null, map: null, brush: 'city', prev: null,
  newMonster() { return { id: Date.now().toString(36), name: 'My Monster', emoji: '👹', posture: 'upright', body: '#3a1a2a', eye: '#ff2a4a', size: 1, speed: 'normal', head: 'normal', face: 'none', horns: 'horns', back: 'none', hat: 'none', held: 'none', orbit: 'none', eyes: 2, eyeSize: 1, flicker: false, extras: { longClaws: true } }; },
  newMap() { return { id: Date.now().toString(36), name: 'My Map', emoji: '🏰', tint: '#ff4a8a', weather: 'none', light: 'normal', gravity: 'normal', speed: 'normal', big: false,
    layout: Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => (c >= 1 && c <= 3 ? 'city' : r < 2 ? 'forest' : 'graveyard'))),
    monsters: ['stalker', 'crawler', 'wraith'] }; },
  init() {
    if (this.ready) return; this.ready = true;
    this.mon = this.newMonster(); this.map = this.newMap();
    this.buildMonsterForm(); this.buildMapForm(); this.renderLists();
    // 3D preview of the monster you're designing
    const cv = $('mkPreview'), r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    r.setPixelRatio(Math.min(2, window.devicePixelRatio)); r.setSize(cv.clientWidth || 320, cv.clientHeight || 320, false);
    const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(40, 1, 0.1, 400);
    sc.add(new THREE.HemisphereLight(0xc8c0ff, 0x201828, 1.4)); const dl = new THREE.DirectionalLight(0xffffff, 1.6); dl.position.set(5, 10, 8); sc.add(dl);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 40), std(0x1e1a2a)); floor.rotation.x = -Math.PI / 2; sc.add(floor);
    this.prev = { r, sc, cam, mesh: null, a: 0 };
    this.refreshPreview();
    const loop = () => { requestAnimationFrame(loop); this.drawPreview(); };
    loop();
  },
  refreshPreview() {
    const P = this.prev; if (!P) return;
    if (P.mesh) { P.sc.remove(P.mesh); P.mesh.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
    const d = { ...this.mon, body: parseInt(this.mon.body.slice(1), 16), eye: parseInt(this.mon.eye.slice(1), 16) };
    MONSTERS.u_preview = M(d.name, d.emoji, d.eye, d.posture, d.body, designLook(d));
    const m = buildMonsterMesh('u_preview'), u = m.userData, T = MONSTERS.u_preview;
    if (T.posture === 'crawl') { u.body.rotation.x = 1.15; u.inner.position.y = T.noLimbs ? -2.6 : -0.6; u.legL.hip.rotation.x = u.legR.hip.rotation.x = -0.9; u.legL.knee.rotation.x = u.legR.knee.rotation.x = 0.6; u.armL.sh.rotation.x = u.armR.sh.rotation.x = -2.1; u.armL.el.rotation.x = u.armR.el.rotation.x = 1.3; u.neck.rotation.x = -1; }
    else if (T.posture === 'float') { u.inner.position.y = 1.4; u.armL.sh.rotation.x = u.armR.sh.rotation.x = -0.4; }
    u.light.intensity = 25;
    P.sc.add(m); P.mesh = m;
    const h = T.headY * T.scale; P.target = h * 0.55; P.dist = Math.max(14, h * 1.9);
  },
  drawPreview() {
    const P = this.prev;
    if (!P || !P.mesh || !$('mkPreview').offsetParent) return; // only while the Create tab is open
    P.a += 0.012;
    const u = P.mesh.userData;
    for (const sp of u.spin) sp.obj.rotation[sp.axis] += sp.speed * 0.016;
    for (const f of u.flick) f.scale.set(0.8 + Math.random() * 0.3, 0.7 + Math.random() * 0.6, 0.8 + Math.random() * 0.3);
    u.jaw.rotation.x = 0.15 + Math.max(0, Math.sin(P.a * 3)) * 0.4;
    P.cam.position.set(Math.sin(P.a) * P.dist, P.target + P.dist * 0.25, Math.cos(P.a) * P.dist); P.cam.lookAt(0, P.target, 0);
    P.r.render(P.sc, P.cam);
  },
  // ---- forms
  sel(id, list, val, fn) {
    const el = $(id); el.innerHTML = list.map((x) => { const [v, t] = Array.isArray(x) ? x : [x, x[0].toUpperCase() + x.slice(1)]; return `<option value="${v}">${t}</option>`; }).join('');
    el.value = val; el.onchange = () => fn(el.value); return el;
  },
  buildMonsterForm() {
    const m = () => this.mon, set = (k) => (v) => { m()[k] = v; this.refreshPreview(); };
    $('mkName').oninput = (e) => { m().name = e.target.value.slice(0, 24); };
    this.sel('mkEmoji', MAKER.emojis.map((e) => [e, e]), m().emoji, set('emoji'));
    this.sel('mkPosture', [['upright', '🧍 Walks upright'], ['crawl', '🕷 Crawls on all fours'], ['float', '👻 Floats']], m().posture, set('posture'));
    $('mkBody').oninput = (e) => set('body')(e.target.value); $('mkEye').oninput = (e) => set('eye')(e.target.value);
    $('mkSize').oninput = (e) => { set('size')(+e.target.value); $('mkSizeV').textContent = `×${(+e.target.value).toFixed(1)}${+e.target.value >= 2.2 ? ' GIANT' : ''}`; };
    this.sel('mkSpeed', [['slow', '🐢 Slow'], ['normal', '🚶 Normal'], ['fast', '🏃 Fast'], ['insane', '⚡ Insane']], m().speed, set('speed'));
    this.sel('mkHead', MAKER.head, m().head, set('head')); this.sel('mkFace', MAKER.face, m().face, set('face'));
    this.sel('mkHorns', MAKER.horns, m().horns, set('horns')); this.sel('mkBack', MAKER.back, m().back, set('back'));
    this.sel('mkHat', MAKER.hats, m().hat, set('hat')); this.sel('mkHeld', MAKER.held, m().held, set('held')); this.sel('mkOrbit', MAKER.orbit, m().orbit, set('orbit'));
    this.sel('mkEyes', [['1', '👁 1 eye'], ['2', '👀 2 eyes'], ['6', '🕷 6 eyes']], String(m().eyes), (v) => set('eyes')(+v));
    $('mkEyeSize').oninput = (e) => set('eyeSize')(+e.target.value);
    $('mkExtras').innerHTML = MAKER.extras.map(([k, t]) => `<label class="mkChk"><input type="checkbox" data-x="${k}"> ${t}</label>`).join('');
    $('mkExtras').querySelectorAll('input').forEach((c) => { c.onchange = () => { m().extras[c.dataset.x] = c.checked; this.refreshPreview(); }; });
    $('mkRandom').onclick = () => { this.randomMonster(); };
    $('mkAuto').onclick = () => { const d = genMonster(mulberry32((Math.random() * 4294967296) >>> 0), Date.now().toString(36), 6 + Math.floor(Math.random() * 20)), hx = (v) => '#' + new THREE.Color(v).getHexString(); this.mon = { ...d, body: hx(d.body), eye: hx(d.eye) }; this.fillMonsterForm(); };
    $('mkSave').onclick = () => this.saveMonster();
    $('mkNew').onclick = () => { this.mon = this.newMonster(); this.fillMonsterForm(); };
    this.fillMonsterForm();
  },
  fillMonsterForm() {
    const d = this.mon;
    $('mkName').value = d.name; $('mkBody').value = d.body; $('mkEye').value = d.eye; $('mkSize').value = d.size; $('mkEyeSize').value = d.eyeSize;
    $('mkSizeV').textContent = `×${d.size.toFixed(1)}${d.size >= 2.2 ? ' GIANT' : ''}`;
    for (const [id, k] of [['mkEmoji', 'emoji'], ['mkPosture', 'posture'], ['mkSpeed', 'speed'], ['mkHead', 'head'], ['mkFace', 'face'], ['mkHorns', 'horns'], ['mkBack', 'back'], ['mkHat', 'hat'], ['mkHeld', 'held'], ['mkOrbit', 'orbit']]) $(id).value = d[k];
    $('mkEyes').value = String(d.eyes);
    $('mkExtras').querySelectorAll('input').forEach((c) => { c.checked = !!d.extras[c.dataset.x]; });
    $('mkSaveState').textContent = creations().monsters.some((x) => x.id === d.id) ? 'Editing a saved monster' : 'New monster (not saved yet)';
    this.refreshPreview();
  },
  randomMonster() {
    const pick = (a) => a[Math.floor(Math.random() * a.length)], col = () => '#' + new THREE.Color().setHSL(Math.random(), 0.6 + Math.random() * 0.4, 0.2 + Math.random() * 0.35).getHexString();
    const d = this.mon;
    Object.assign(d, { emoji: pick(MAKER.emojis), posture: pick(['upright', 'crawl', 'float']), body: col(), eye: '#' + new THREE.Color().setHSL(Math.random(), 1, 0.55).getHexString(), size: +(0.8 + Math.random() * 0.9).toFixed(1),
      head: pick(MAKER.head), face: pick(MAKER.face), horns: pick(MAKER.horns), back: pick(MAKER.back), hat: Math.random() < 0.5 ? 'none' : pick(MAKER.hats), held: Math.random() < 0.5 ? 'none' : pick(MAKER.held),
      orbit: Math.random() < 0.6 ? 'none' : pick(MAKER.orbit), eyes: pick([1, 2, 2, 6]), eyeSize: +(0.8 + Math.random()).toFixed(1), extras: {} });
    for (const [k] of MAKER.extras) if (Math.random() < 0.18) d.extras[k] = true;
    const a = ['Grim', 'Night', 'Shadow', 'Bone', 'Hollow', 'Rot', 'Gloom', 'Fang', 'Creep', 'Howl'], b = ['crawler', 'stalker', 'walker', 'wraith', 'beast', 'maw', 'lurker', 'grinner', 'gnasher', 'creeper'];
    d.name = `The ${pick(a)}${pick(b)}`;
    this.fillMonsterForm();
  },
  saveMonster() {
    const L = creations().monsters, d = JSON.parse(JSON.stringify(this.mon));
    d.body = parseInt(d.body.slice(1), 16); d.eye = parseInt(d.eye.slice(1), 16);
    const k = L.findIndex((x) => x.id === d.id);
    if (k >= 0) L[k] = d; else L.push(d);
    registerCreation(d); writeSave(); this.renderLists(); this.fillMapMonsters();
    $('mkSaveState').textContent = 'Saved! Use it in a map →';
    toast(`💾 Saved ${d.name}`, '#7affd0');
  },
  // ---- map maker
  buildMapForm() {
    const m = () => this.map;
    $('mpmName').oninput = (e) => { m().name = e.target.value.slice(0, 24); };
    this.sel('mpmEmoji', MAKER.mapEmojis.map((e) => [e, e]), m().emoji, (v) => { m().emoji = v; });
    $('mpmTint').oninput = (e) => { m().tint = e.target.value; };
    this.sel('mpmWeather', MAKER.weather, m().weather, (v) => { m().weather = v; });
    this.sel('mpmLight', [['dim', '🌑 Very dark'], ['normal', '🌙 Night'], ['bright', '🌕 Bright moon']], m().light, (v) => { m().light = v; });
    this.sel('mpmGravity', [['normal', '⬇ Normal'], ['low', '🪶 Low (big jumps)'], ['moon', '🌕 Moon (huge jumps)']], m().gravity, (v) => { m().gravity = v; });
    this.sel('mpmSpeed', [['slow', '🐢 Slow monsters'], ['normal', '🚶 Normal'], ['fast', '🏃 Fast'], ['insane', '⚡ Insane']], m().speed, (v) => { m().speed = v; });
    $('mpmBig').onchange = (e) => { m().big = e.target.checked; };
    // brush: every area from every level
    const groups = []; let cur = null;
    for (const L of LEVELS) if (!L.mix) { const zs = [L.center, ...L.corners].filter((z) => MAKER_ZONES.includes(z) && !groups.some((g) => g.zs.includes(z))); if (zs.length) groups.push({ name: `${L.emoji} ${L.name}`, zs }); }
    $('mpmBrush').innerHTML = groups.map((g) => `<optgroup label="${escHtml(g.name)}">${g.zs.map((z) => `<option value="${z}">${escHtml(ZONES[z].name)}</option>`).join('')}</optgroup>`).join('');
    $('mpmBrush').value = this.brush; $('mpmBrush').onchange = (e) => { this.brush = e.target.value; this.showBrush(); };
    $('mpmFill').onclick = () => { m().layout = m().layout.map((row) => row.map(() => this.brush)); this.drawGrid(); };
    $('mpmShuffle').onclick = () => { const z = () => MAKER_ZONES[Math.floor(Math.random() * MAKER_ZONES.length)], a = [z(), z(), z(), z(), z()]; m().layout = m().layout.map((row) => row.map(() => a[Math.floor(Math.random() * a.length)])); this.drawGrid(); };
    $('mpmAuto').onclick = () => { // a whole map + 3 brand-new monsters for it, all made automatically
      const r = mulberry32((Math.random() * 4294967296) >>> 0), id = Date.now().toString(36), d = genMap(r, id, 8);
      d.monsters = [0, 1, 2].map((i) => { const md = genMonster(r, `${id}_${i}`, 8 + Math.floor(r() * 12)); creations().monsters.push(md); registerCreation(md); return 'u_' + md.id; });
      writeSave(); this.map = d; this.fillMapForm(); this.renderLists(); toast(`🤖 Made ${d.name} with 3 new monsters`, '#7affd0');
    };
    $('mpmSave').onclick = () => this.saveMap(false);
    $('mpmPlay').onclick = () => this.saveMap(true);
    $('mpmNew').onclick = () => { this.map = this.newMap(); this.fillMapForm(); };
    // painting: click or drag over the tiles
    const g = $('mpmGrid'); let down = false;
    const paint = (el) => { if (!el || el.dataset.r === undefined) return; m().layout[+el.dataset.r][+el.dataset.c] = this.brush; this.drawGrid(); };
    g.onpointerdown = (e) => { down = true; g.setPointerCapture(e.pointerId); paint(document.elementFromPoint(e.clientX, e.clientY)); };
    g.onpointermove = (e) => { if (down) paint(document.elementFromPoint(e.clientX, e.clientY)); };
    g.onpointerup = g.onpointercancel = () => { down = false; };
    this.fillMapForm();
  },
  fillMapMonsters() {
    const own = creations().monsters.map((d) => ['u_' + d.id, `⭐ ${d.emoji} ${d.name} (yours)`]);
    const all = Object.keys(MONSTERS).filter((k) => !k.startsWith('u_')).map((k) => [k, `${MONSTERS[k].emoji} ${MONSTERS[k].name}`]);
    [0, 1, 2].forEach((i) => this.sel('mpmMon' + i, [...own, ...all], this.map.monsters[i], (v) => { this.map.monsters[i] = v; }));
  },
  fillMapForm() {
    const d = this.map;
    $('mpmName').value = d.name; $('mpmEmoji').value = d.emoji; $('mpmTint').value = d.tint; $('mpmWeather').value = d.weather; $('mpmLight').value = d.light;
    $('mpmGravity').value = d.gravity; $('mpmSpeed').value = d.speed; $('mpmBig').checked = d.big;
    this.fillMapMonsters(); this.drawGrid(); this.showBrush();
  },
  showBrush() { const Z = ZONES[this.brush]; $('mpmBrushSwatch').style.background = Z.map; },
  drawGrid() {
    $('mpmGrid').innerHTML = this.map.layout.map((row, r) => row.map((z, c) => {
      const Z = ZONES[z] || ZONES.city, icon = Z.name.split(' ')[0];
      return `<div class="mpmTile" data-r="${r}" data-c="${c}" style="background:${Z.map};border-color:${Z.color}" title="${escHtml(Z.name)}">${r === 2 && c === 2 ? '👹' : icon}${r === 0 && c === 2 ? '<b>🚪</b>' : ''}</div>`;
    }).join('')).join('');
  },
  saveMap(play) {
    const L = creations().maps, d = JSON.parse(JSON.stringify(this.map)), k = L.findIndex((x) => x.id === d.id);
    if (k >= 0) L[k] = d; else L.push(d);
    writeSave(); this.renderLists();
    if (play) this.play(d); else toast(`💾 Saved ${d.name}`, '#7affd0');
  },
  play(d) {
    if (net.on) { toast('Your own maps are solo only for now', '#ff9a5a'); return; }
    game.endless = null; game.custom = customLevel(d);
    game.start(true);
  },
  renderLists() {
    const C = creations();
    $('mkMonList').innerHTML = C.monsters.length ? C.monsters.map((d) => `<div class="mkItem"><span style="color:#${new THREE.Color(d.eye).getHexString()}">${d.emoji} ${escHtml(d.name)}</span><button data-act="me" data-id="${d.id}" class="${save.playAs === d.id ? 'mkOn' : ''}">${save.playAs === d.id ? '🎮 You!' : '🎮 Play as'}</button><button data-act="edit" data-id="${d.id}">✏️ Edit</button><button data-act="del" data-id="${d.id}">🗑</button></div>`).join('') + (save.playAs ? '<div class="mkItem"><span>🧍 Back to the normal runner</span><button data-act="me" data-id="">Switch back</button></div>' : '') : '<div class="mkEmpty">No monsters yet. Design one and press Save!</div>';
    $('mkMapList').innerHTML = C.maps.length ? C.maps.map((d) => `<div class="mkItem"><span style="color:${d.tint}">${d.emoji} ${escHtml(d.name)}</span><button data-act="play" data-id="${d.id}">▶ Play</button><button data-act="edit" data-id="${d.id}">✏️ Edit</button><button data-act="del" data-id="${d.id}">🗑</button></div>`).join('') : '<div class="mkEmpty">No maps yet. Paint one and press Save!</div>';
    $('mkMonList').querySelectorAll('button').forEach((b) => { b.onclick = () => {
      if (b.dataset.act === 'me') { save.playAs = b.dataset.id || null; writeSave(); this.renderLists(); toast(save.playAs ? '🎮 You will play AS this monster! (press V to see yourself)' : '🧍 Back to the normal runner', '#7affd0'); return; }
      const i = C.monsters.findIndex((x) => x.id === b.dataset.id); if (i < 0) return;
      if (b.dataset.act === 'edit') { const d = C.monsters[i]; this.mon = { ...JSON.parse(JSON.stringify(d)), body: '#' + new THREE.Color(d.body).getHexString(), eye: '#' + new THREE.Color(d.eye).getHexString() }; this.fillMonsterForm(); $('mkMonForm').scrollIntoView({ behavior: 'smooth' }); }
      else if (confirm(`Delete ${C.monsters[i].name}?`)) { if (save.playAs === C.monsters[i].id) save.playAs = null; C.monsters.splice(i, 1); writeSave(); this.renderLists(); this.fillMapMonsters(); }
    }; });
    $('mkMapList').querySelectorAll('button').forEach((b) => { b.onclick = () => {
      const i = C.maps.findIndex((x) => x.id === b.dataset.id); if (i < 0) return;
      if (b.dataset.act === 'play') this.play(C.maps[i]);
      else if (b.dataset.act === 'edit') { this.map = JSON.parse(JSON.stringify(C.maps[i])); this.fillMapForm(); $('mkMapForm').scrollIntoView({ behavior: 'smooth' }); }
      else if (confirm(`Delete ${C.maps[i].name}?`)) { C.maps.splice(i, 1); writeSave(); this.renderLists(); }
    }; });
  },
};

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

function showTab(t) {
  if (t === 'create') maker.init();
  document.querySelectorAll('#lbTabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === t));
  document.querySelectorAll('.lbPanel').forEach((p) => p.classList.toggle('on', p.dataset.panel === t));
  $('menu').scrollTop = 0;
}
document.querySelectorAll('#lbTabs button').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));
$('pickLevelBtn').addEventListener('click', () => showTab('levels'));

function renderEndless() {
  const next = (save.endless || 0) + 1, L = endlessLevel(next);
  $('endlessInfo').innerHTML = `Cleared so far: <b>${save.endless || 0}</b> · Next up: <b>${L.emoji} ${escHtml(L.name)}</b> ${L.monsters.map((m) => MONSTERS[m].emoji).join(' ')}`;
  $('endlessGo').textContent = `▶ Play Endless #${next}`;
  $('endlessGo').onclick = () => game.playEndless(next);
  $('endlessRandom').onclick = () => game.playEndless(6 + Math.floor(Math.random() * 90), true);
}
function renderMenu() {
  renderLobby(); renderEndless();
  const lv = $('levelSeg'); lv.innerHTML = '';
  LEVELS.forEach((L, k) => {
    const b = document.createElement('button');
    const best = save.levelBest && save.levelBest[k + 1] !== undefined ? `Best ${fmtTime(save.levelBest[k + 1])}` : 'Not escaped yet';
    b.className = 'lvl' + (game.level === k + 1 ? ' on' : '');
    b.innerHTML = `<span class="lvNum">${k + 1}${L.big ? ' ⭐' : ''}</span><span class="lvE">${L.emoji}</span><span class="lvN">${L.name}</span><span class="lvM">${L.mix ? '❓ ❓ ❓' : L.monsters.map((m) => MONSTERS[m].emoji).join(' ')}</span><span class="lvB">${best}</span>`;
    b.style.setProperty('--lc', L.color);
    b.onclick = () => { game.setLevel(k + 1); if (!net.isClient) showTab('play'); };
    lv.appendChild(b);
  });
  const L = LV(), base = LEVELS[game.level - 1];
  $('lbHero').style.setProperty('--lc', base.color);
  $('heroEmojiBg').textContent = base.emoji;
  $('heroNum').textContent = `LEVEL ${game.level} / ${LEVELS.length}`;
  $('heroName').textContent = base.name;
  $('levelBlurb').textContent = base.blurb;
  $('heroMonsters').innerHTML = (base.mix ? '<span class="mChip" style="border-color:#ff4ad0;color:#ff9af0">❓ 3 random monsters every round</span>' : '')
    + (base.mix ? '' : L.monsters.map((m) => `<span class="mChip" style="border-color:${MONSTERS[m].eyeCss};color:${MONSTERS[m].eyeCss}">${MONSTERS[m].emoji} ${MONSTERS[m].name}</span>`).join(''));
  if (!base.mix) { const Q = questOf(base); $('heroMonsters').innerHTML += `<span class="mChip" style="border-color:${hex6(Q.col)};color:${hex6(Q.col)}">📜 Quest: ${Q.title}</span>` + (base.big ? '<span class="mChip" style="border-color:#ffd23a;color:#ffd23a">⭐ BIG LEVEL · bigger quest</span>' : '') + '<span class="mChip" style="border-color:#ff9a3a;color:#ffb066">🎬 15 cutscenes · flips!</span>'; }
  const hb = save.levelBest && save.levelBest[game.level];
  $('heroBest').textContent = hb !== undefined ? `🏆 Your best: ${fmtTime(hb)}` : 'Not escaped yet';
  $('hdrCoins').textContent = save.coins; $('hdrName').textContent = save.name;
  $('squadMini').innerHTML = net.on ? `👥 <b>Room ${net.code}</b> · ${net.lobby.length} player${net.lobby.length === 1 ? '' : 's'}${net.isClient ? ' · waiting for the host' : ''}` : '👤 Solo · <a href="#" id="goSquad" style="color:var(--gold)">play with friends</a>';
  const gs = $('goSquad'); if (gs) gs.onclick = (e) => { e.preventDefault(); showTab('squad'); };
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
$('nextBtn').addEventListener('click', () => { if (game.endless) { game.playEndless(game.endless + 1, game.practice); return; } game.setLevel(Math.min(LEVELS.length, game.level + 1)); if (net.isHost) game.hostStart(); else game.start(true); });
// multiplayer menu
$('mpName').value = save.name;
$('mpName').addEventListener('change', () => { save.name = $('mpName').value.trim().slice(0, 12) || save.name; $('mpName').value = save.name; writeSave(); renderMenu(); });
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
{ const room = new URLSearchParams(location.search).get('room'); if (room) { showTab('squad'); $('mpCode').value = room.toUpperCase(); setTimeout(() => net.join(room), 300); } }
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
      if (demo === 'createplay') { // design a monster + a map in the Create tab, save them, play the map
        game.showMenu(); showTab('create');
        maker.randomMonster(); maker.mon.name = 'Test Beast'; maker.saveMonster();
        if (new URLSearchParams(location.search).get('me')) { save.playAs = maker.mon.id; setView(false, false); }
        const key = 'u_' + maker.mon.id;
        $('mpmShuffle').click(); maker.map.name = 'Test Map'; maker.map.monsters = [key, 'stalker', 'k_yeti']; maker.map.big = true;
        maker.saveMap(true);
        CFG.catchRadius = 0;
        for (let i = 0; i < 60 * 20; i++) { game.update(1 / 60); if (game.cine) game.skipCine(); }
        if (new URLSearchParams(location.search).get('shot')) { const c = world.patrol.filter((q) => q.length() > 60)[5]; game.player.pos.set(c.x, 0, c.z); camPitch = firstPerson ? -0.35 : 0.25; keys.KeyW = true; keys.ShiftLeft = true; setPaused(false); game.hunters.forEach((h) => { h.active = false; h.mesh.visible = false; }); for (let i = 0; i < 30; i++) game.update(1 / 60); game.danger = 0; ui.vignette.style.opacity = 0; setPaused(false); game.update = () => {}; const pp = game.player.pos; game.player.mesh.visible = true; camera.position.set(pp.x + 6, pp.y + 5, pp.z - 7); camera.lookAt(pp.x, pp.y + 3, pp.z); setInterval(() => { ui.pause.classList.add('hidden'); composer.render(); }, 200); }
        console.log('CREATE', JSON.stringify({ playingAs: game.player.mesh.userData.skin ? 'monster' : 'runner', state: game.state, level: LV().name, custom: !!LV().custom, monsters: game.hunters.map((h) => h.T.name), saved: [save.creations.monsters.length, save.creations.maps.length], zones: [...new Set(world.zones)].length, quest: world.quest.items.length }));
        return;
      }
      if (demo === 'quest') { // collect every story quest item; the quest must complete and give its reward
        const p = game.player, Q = world.quest.q, out = { quest: Q.title, items: world.quest.items.length };
        CFG.catchRadius = 0;
        const before = { ghosts: p.ghosts, bombs: p.bombs };
        for (const q of world.quest.items) { p.pos.set(q.x, 0, q.z); for (let i = 0; i < 10; i++) game.update(1 / 60); }
        for (let i = 0; i < 60 * 2.5; i++) game.update(1 / 60);
        Object.assign(out, { got: game.questGot, done: game.questDone, perk: Q.perk, reveal: game.revealKeys, slowT: +game.slowT.toFixed(0), ghosts: p.ghosts - before.ghosts, bombs: p.bombs - before.bombs, stunned: game.hunters.some((h) => h.stunT > 0), boost: p.boostUntil > game.time });
        console.log('QUEST', JSON.stringify(out));
        return;
      }
      if (demo === 'parkour') { // vault a hurdle, climb a block, slide: each must actually happen
        const p = game.player, out = {};
        game.hunters.forEach((h) => { h.active = false; h.mesh.visible = false; });
        const tryMove = (pred, setup, secs, check) => {
          for (const o of world.obstacles) {
            if (!pred(o)) continue;
            const cx = (o.x0 + o.x1) / 2, cz = (o.z0 + o.z1) / 2, alongX = o.x1 - o.x0 < o.z1 - o.z0;
            for (const s of [-1, 1]) {
              const sx = alongX ? cx + s * 9 : cx, sz = alongX ? cz : cz + s * 9;
              if (groundAt(sx, sz, 1.0, 0) > 0.1) continue;
              p.pos.set(sx, 0, sz); p.vel.set(0, 0, 0); p.vy = 0; p.onGround = true; p.pk = null; p.slideT = 0; p.slideCD = 0;
              camYaw = Math.atan2(cx - sx, cz - sz);
              const before = p.moves; setup();
              let maxY = 0, kind = null;
              for (let i = 0; i < 60 * secs; i++) { game.update(1 / 60); maxY = Math.max(maxY, p.pos.y); if (p.pk) kind = p.pk.type; if (p.slideT > 0) kind = kind || 'slide'; }
              for (const k in keys) keys[k] = false;
              if (p.moves > before) return check(o, kind, maxY);
            }
          }
          return 'not found';
        };
        out.vault = tryMove((o) => o.h > 1.6 && o.h < 3.2 && Math.min(o.x1 - o.x0, o.z1 - o.z0) < 1.6, () => { keys.KeyW = true; keys.ShiftLeft = true; }, 1.2, (o, k, y) => ({ kind: k, cleared: y > o.h, h: o.h.toFixed(1) }));
        out.climb = tryMove((o) => o.h > 4.5 && o.h < 8.6 && o.x1 - o.x0 > 2.5 && o.z1 - o.z0 > 2.5, () => { keys.KeyW = true; input.jumpQueued = true; }, 1.5, (o, k, y) => ({ kind: k, reachedTop: y >= o.h - 0.4, maxY: y.toFixed(1), h: o.h.toFixed(1) }));
        p.pos.set(world.spawns[0].x, 0, world.spawns[0].z); camYaw = 0; keys.KeyW = true; keys.ShiftLeft = true;
        for (let i = 0; i < 40; i++) game.update(1 / 60);
        input.slideQueued = true; game.update(1 / 60); out.slide = { sliding: p.slideT > 0, speed: Math.hypot(p.vel.x, p.vel.z).toFixed(1) };
        console.log('PARKOUR', JSON.stringify(out));
        return;
      }
      if (demo === 'bigcines') { // ?demo=bigcines&level=N → play a whole round and list every cutscene that played
        const kinds = ['intro'], orig = game.beginCine.bind(game);
        game.beginCine = (k, d) => { if (kinds[kinds.length - 1] !== k) kinds.push(k); orig(k, d); };
        CFG.catchRadius = 0;
        const p = game.player; p.pos.set(world.spawns[0].x, 0, world.spawns[0].z);
        const qs = new URLSearchParams(location.search), stop = qs.get('stop'), T = +(qs.get('t') || 3);
        const settle = (secs = 20) => { let idle = 0; for (let i = 0; i < 60 * secs; i++) { game.update(1 / 60); if (stop && game.cine && game.cine.kind === stop && game.cine.t >= T) { game.update = () => {}; ui.hud.classList.add('hidden'); throw new Error('STOP'); } idle = game.cine ? 0 : idle + 1; if (idle > 30) break; } };
        try {
        game.startRelease(); settle();
        for (let k = 0; k < CFG.keysNeeded && game.state === 'play'; k++) {
          if (k === 4 && !new URLSearchParams(location.search).get('fast')) { game.frenzy = false; game.startFrenzy(); settle(); }
          const key = world.keys.find((q) => !q.taken); p.pos.set(key.x, 0, key.z); game.update(1 / 60); settle(60);
          if (k === 2 && !new URLSearchParams(location.search).get('fast')) { game.elapsed = CFG.roundTime / 2; game.update(1 / 60); settle(); }
        }
        if (game.state === 'play' && !LV().battle) { p.pos.set(world.exit.x, 0, world.half + 4); game.update(1 / 60); settle(12); }
        } catch (e) { if (e.message === 'STOP') return; throw e; }
        const real = kinds.filter((k) => k !== 'death');
        console.log('BIGCINES', JSON.stringify({ big: !!LV().big, count: real.length, kinds: real, state: game.state, win: !!(game.result && game.result.win) }));
        return;
      }
      if (demo === 'flips') { // every new acrobatic scene must play through, and endless levels must build
        const out = {}; CFG.catchRadius = 0; game.released = true;
        for (const n of ['Backflip', 'FrontFlip', 'Rooftop', 'Storm', 'Combo']) {
          game.player.pos.set(world.spawns[0].x, 0, world.spawns[0].z); game['start' + n]();
          let t = 0; for (; t < 60 * 25 && game.cine; t++) game.update(1 / 60);
          out[n] = { secs: +(t / 60).toFixed(1), ended: !game.cine, rotX: +game.player.mesh.rotation.x.toFixed(2), y: +game.player.pos.y.toFixed(2) };
        }
        game.playEndless(7); out.endless = { name: game.custom.name, mons: game.custom.monsters, state: game.state };
        for (let i = 0; i < 60 * 8; i++) game.update(1 / 60); out.endlessIntroDone = !game.cine;
        console.log('FLIPS', JSON.stringify(out)); return;
      }
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
        for (let i = 0; i < 60 * 7; i++) game.update(1 / 60);
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
        for (let i = 0; i < 60 * 7; i++) game.update(1 / 60);
        console.log('DEATH', JSON.stringify({ cine: caughtAt, finalState: game.state, resultsShown: !ui.results.classList.contains('hidden') }));
      } else if (demo === 'escape' || demo === 'escapeshot') {
        game.keys = 4; game.collectKey(world.keys.find((k) => !k.taken)); game.skipCine();
        game.hunters[0].active = false;
        game.player.pos.set(world.exit.x, 0, world.half + 4);
        for (let i = 0; i < 60 * (demo === 'escapeshot' ? 1.4 : 14) && game.state === 'play'; i++) { game.update(1 / 60); if (game.cine && (game.cine.kind === 'frenzy' || game.cine.kind === 'finalrun')) { game.skipCine(); game.player.pos.set(world.exit.x, 0, world.half + 4); } }
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
      } else if (demo === 'view') { // ?demo=view&level=N&z=zone[&air=1] → look around an area with no monsters about
        const qs = new URLSearchParams(location.search), want = qs.get('z') || LV().center, p = game.player;
        const c = world.patrol.filter((k) => world.zoneAt(k.x, k.z) === want).sort((a, b) => a.length() - b.length())[+(qs.get('n') || 2)] || world.patrol[0];
        p.pos.set(c.x, 0, c.z - 10);
        game.hunters.forEach((h) => { h.active = false; h.mesh.visible = false; });
        camYaw = 0; camPitch = qs.get('air') ? -0.5 : 0.08;
        try { for (let i = 0; i < 30; i++) game.update(1 / 60); } catch (e) { /* no active monsters */ }
        game.danger = 0; ui.vignette.style.opacity = 0; ui.static.style.opacity = 0; ui.hud.classList.add('hidden');
        if (qs.get('air')) { camera.position.set(c.x, 55, c.z - 45); camera.lookAt(c.x, 0, c.z + 20); }
        if (qs.get('sky')) { camera.position.set(0, 20, world.half - 60); camera.lookAt(0, 160, world.half + 260); composer.render(); }
        game.update = () => {};
      } else if (demo === 'lineup') { // ?demo=lineup&level=N → that level's 3 monsters side by side, calm lighting
        const p = game.player, s = Math.max(...game.hunters.map((h) => h.T.scale));
        game.hunters.forEach((h) => { h.active = false; h.mesh.visible = false; });
        camYaw = 0; camPitch = 0.05;
        try { for (let i = 0; i < 20; i++) game.update(1 / 60); } catch (e) { /* no active monsters: fine for a photo */ }
        game.hunters.forEach((h, k) => {
          h.mesh.visible = true; h.vel.set(0, 0, 0); h.facing = Math.PI; h.mesh.rotation.y = Math.PI;
          h.pos.set(p.pos.x + (k - 1) * 9 * s, 0, p.pos.z + 20 * s);
          for (let i = 0; i < 40; i++) h.animate(1 / 60, null);
          h.mesh.position.copy(h.pos); h.mesh.position.y = h.pos.y;
        });
        game.danger = 0; ui.vignette.style.opacity = 0; ui.static.style.opacity = 0; flashlightOn = true;
        scene.fog.density = 0.002; hemi.intensity = 1.6; world.group.visible = false; ui.hud.classList.add('hidden');
        const stage = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), std(0x2a2a34)); stage.rotation.x = -Math.PI / 2; stage.position.y = 0.01; stage.receiveShadow = true; scene.add(stage);
        game.update = () => {}; // ?demo=battleshot&level=4&t=12 → freeze the battle at t seconds
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
      } else if (demo === 'tab') { game.showMenu(); showTab(new URLSearchParams(location.search).get('tab') || 'levels');
        if (new URLSearchParams(location.search).get('rand')) { maker.randomMonster(); $('mpmShuffle').click(); }
      } else if (demo === 'touch') {
        enableTouch(); input.joyY = -1; input.sprintTouch = true;
        const z0 = game.player.pos.z;
        for (let i = 0; i < 60; i++) game.update(1 / 60);
        console.log('TOUCH', JSON.stringify({ moved: (game.player.pos.z - z0).toFixed(1), touchUI: !ui.touch.classList.contains('hidden') }));
      } else keys.KeyW = true;
    } catch (err) { console.error('GAME ERROR', err.message, err.stack); }
  }, 500);
}
