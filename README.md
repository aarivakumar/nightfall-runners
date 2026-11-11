# Nightfall Runners 🌃🏃

An original Roblox chase-and-escape game. Runaways spawn in a neon city at night,
hunt for keys, unlock the exit gate and escape before the Hunter catches them.

## Play it in Roblox Studio (easiest)

1. Open **`NightfallRunners.rbxlx`** in Roblox Studio (File → Open from File).
2. Press **Play**. The lobby, the city, the hunter and the HUD are all made by scripts,
   so nothing needs to be built by hand.
3. Optional, to save coins and upgrades: publish the place, then
   Game Settings → Security → turn on **Enable Studio Access to API Services**.

To test multiplayer (player hunter at 3+ players): Test tab → Clients and Servers → 3 players → Start.

If you edit anything in `src/`, rebuild the place file with:

```
python3 tools/build_place.py
```

Or use [Rojo](https://rojo.space): `rojo serve` and connect from the Rojo Studio plugin.

## How a round works

| Phase | What happens |
|---|---|
| Intermission (20s) | Everyone waits in the floating lobby. Use the 🛒 Shop. |
| Head start (12s) | Runaways spawn at the south edge of a **freshly generated city**. |
| Hunt (4 min) | The Hunter is released. Find **5 of 7 keys** 🔑 (marked through walls when close). |
| Exit opens | The red gate on the north wall turns off and the Hunter gets **enraged** (faster). |
| Frenzy (last 45s) | Hunters can sense every runaway who isn't hiding. |
| Every 70s | Another AI Hunter joins (up to 3). |

**Runaway tools**
- **Sprint**: hold Shift (or L3 on a controller, or the SPRINT button on mobile). Your stamina runs out and you get exhausted (slower) if you empty it.
- **Bushes** 🌿: stand inside one to be *hidden*. The Hunter only finds you if it's right next to you.
- **Speed pads** ⚡: short burst of speed.
- **Line of sight**: the AI Hunter needs to see or hear you. Break line of sight around buildings and it goes to check your last known spot.

**With 3 or more players**, one random player becomes the **Hunter** (red glow, faster) and plays alongside the AI.

Caught or escaped players can **spectate** from the lobby. Coins are earned for keys,
escaping, taking part, and (as Hunter) catches. Spend them on the **Lungs** (stamina) and **Sneakers** (sprint speed) upgrades. Progress is saved with DataStores.

## Files

```
src/shared/Config.lua        ← all balance numbers (speeds, timers, rewards, map size)
src/server/Main.server.lua   ← round loop, keys, exit, catching, rewards
src/server/MapBuilder.lua    ← builds the lobby + random city each round
src/server/HunterAI.lua      ← hunter rig + AI (patrol / sight / hearing / pathfinding chase)
src/server/DataService.lua   ← saving coins, escapes, upgrades
src/client/Main.client.lua   ← HUD, sprint/stamina, danger vignette, shop, spectate, effects
tools/build_place.py         ← packs src/ into NightfallRunners.rbxlx
```

## Tuning ideas

Everything is in `Config.lua`. For example:
- Too hard? Lower `HunterChaseSpeed` (the default 19.5 is faster than walking (16) and slower than sprinting (26)).
- Longer games? Raise `RoundTime` and `KeysToSpawn`.
- Bigger city? Raise `GridSize` (Roblox) or `N` in `web/game.js` (browser).

## ▶ Play it now

**https://aarivakumar.github.io/nightfall-runners/** (works in Chrome, Firefox and Edge, on a computer or a phone)

### Multiplayer (up to 6 players)

1. One player clicks **Create room** on the menu. A 5-letter room code appears (for example `KX7QM`).
2. Friends type the code and click **Join**, or open the invite link (**Copy invite link**).
3. The host picks the level and difficulty and clicks **PLAY**. Everyone starts together.

Everyone works as a team: keys are shared, the monsters chase whoever is closest, and when you get caught
(or escape) you watch your teammates until the round ends. Players connect straight to each other
(WebRTC via [PeerJS](https://peerjs.com)); PeerJS's free public server is only used so players can find each other by the code.

## Browser version (no Roblox needed)

A separate 3D web version lives in `web/` (Three.js, same gameplay, single-player vs AI hunters):

```
cd web
python3 -m http.server 8137
```

Then open http://localhost:8137 in Chrome/Firefox/Edge. Works with keyboard + mouse or a touch screen
(joystick on the left, drag the right side to look). First-person by default (press V for third person),
wall-jumps, flashlight (F), and cutscenes for the intro, getting caught and escaping.
Coins, upgrades and best time are saved in your browser.

**Nine levels, all unlocked** (pick one on the menu; escaping shows a *Next level* button):

| Level | Areas | Monsters |
|---|---|---|
| 🌃 1. Nightfall City | city, woods, graveyard, rust yards, farm | 👹 Stalker, 🕷 Crawler, 👻 Wraith |
| ❄️ 2. Frostbite Hollow (snowing) | snowed-in village, frozen pines, slippery black-ice lake, crystal caverns, abandoned camp | 🦍 Frostmaw (huge), 🦌 Antlered (fast, on all fours), 🥶 Pale Lady (floats, flickers) |
| 🎪 3. Carnival of Screams (embers) | midway booths, big-top tents and cages, ferris wheels and carousels, hedge maze, bleeding woods | 🤡 Grinner, 🃏 Jester (crawls, laughs), 🎭 Marionette (hangs from strings) |
| 🗿 4. Titan Wasteland (ash falling) | shattered city, impact craters, lava fields (lava drains stamina), rust yards, burning ash forest | **GIANTS**: 🗿 Colossus, 🦖 Behemoth, ☠️ Titan Wraith. Collect 5 ⚡ power cores to grow giant and fight them in a battle cutscene |
| 🏜 5. Sands of the Dead (sandstorm) | desert bazaar, dunes and cacti, pyramids and obelisks, red rock canyon, boneyard | 🧟 Mummy, 🦂 Sand Stinger (scorpion tail), 🌪 Dust Phantom |
| 🌊 6. Sunken Depths (bubbles, floaty jumps) | sunken city, kelp forest, coral reef, shipwreck graveyard, midnight trench | 🐟 Angler (glowing lure), 🧜 Drowned Sailor, 🪼 Jelly Phantom (tentacles) |
| 🪐 7. Planet X (moon gravity) | research base, glowshroom forest, crystal plains, craters, UFO crash site | 👽 The Grey, 🦠 The Xeno (tail), 🌌 Void Wisp |
| 🍭 8. Sweet Screams (sprinkles) | gingerbread town, candy cane woods, gumdrop hills, sticky chocolate river (slows you), cotton candy fields | 🍪 Gingerbrute, 🍭 Candy Spider, 🧁 Sugar Specter |
| 🌀 9. The Nightmare Mix | a random remix of areas from every level, new every round | 3 random monsters from the other levels, and the fastest monsters |

Monsters get a little faster each level. Cutscenes: a level-specific intro, the monsters being released,
the exit gate opening (and a monster hearing it), the last-45-seconds frenzy, getting caught, and escaping.
Every cutscene can be skipped (click, Space, Enter or Esc). Stamina lasts much longer than before.

What else is different in the browser version:
- **A big map (20×20 blocks)** with five areas per level, shuffled every round. Level 1: 🏙 Neon City down the middle,
  plus 🌲 the Whispering Woods (very dark, monsters can't see far), 🪦 Hollow Hill Cemetery (graves, crypts, dead trees),
  🏭 the Rust Yards (warehouses, containers, smokestacks) and 🌽 Crowfield Farm (corn you can hide in, barns, scarecrows that watch you).
- **All three monsters hunt at the same time** from the moment they're released: the Stalker, the Crawler and the Wraith.
  When one spots you it howls, and the others run to that spot (Normal: nearby ones, Hard: all of them, Easy: off).
- **Scarier monsters**: jaws that snap open, teeth, long claws, eyes that glow through the fog, jerky head twitches,
  the Crawler's six eyes and spider legs, the Wraith flickering in and out. Up close you get growls, whispers,
  a screech when you're spotted, TV static, red fog and a flickering flashlight. Sprinting is loud, so they hear you from further away.
