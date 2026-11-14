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

**100 levels, all unlocked** (pick one on the menu; escaping shows a *Next level* button):

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
| 🏚 9. Haunted Manor | spooky mansions, pumpkin patch, swamp (water slows you), graveyard, hedge maze | 🧛 Vampire, 🐺 Werewolf, 😱 Banshee |
| 🌴 10. Jungle Temple (rain) | step-pyramid temples with stone heads that watch you, deep jungle, rivers, mossy cliffs, swamp | 🐍 Serpent, 🦍 Jungle Brute, 🗿 Tiki Spirit |
| 🧸 11. Midnight Toyland | toy town, giant blocks, ball pits you can hide in, toy train yard, dollhouses | 🧸 Teddy, 🪆 Broken Doll, 🎁 Jack-in-the-Box |
| 🦖 12. Dino Valley (ash) | fossil plains with dino nests, giant fern forest, sticky tar pits, caves, lava fields | 🦖 Raptor (very fast), 🦕 T-Rex (huge), 🪶 Pterodactyl (wings) |
| 🏴‍☠️ 13. Pirate Cove | pirate port with taverns, moonlit beach, pirate ships and docks, lagoon (slows you), sea caves | 🏴‍☠️ Ghost Pirate, 🐙 Krakenling, 💀 Skull Captain |
| 🤖 14. Cyber City 2099 (rain) | neon city with holograms, server farm, laser grid (burns stamina), rust yards, neon park | 🐕 Robo-Hound, 🤖 Sentinel, 👾 The Glitch |
| 🌋 15. Volcano Island (embers) | lava village, lava rivers, burnt forest, craters, black sand beach | 🌋 Magma Golem, 🦎 Fire Salamander, 🔥 Ember Wraith |
| 🏰 16. Frozen Castle (snow) | ice castle courtyard, frozen pines, crystal caves, slippery frozen lake, ice maze | 🛡 Ice Knight, 🕸 Frost Spider, 👸 Snow Queen |
| 🏥 17. Hollow Hospital (rain) | abandoned hospital, graveyard, machine rooms, maze, overgrown swamp garden | 🤕 The Patient, 💉 Crawling Nurse, 🩺 Shadow Doctor |
| 🍄 18. Mushroom Marsh | mushroom village, glowing fungus forest, swamp, gourd patch, giant ferns | 🍄 Spore Giant, 🐸 Toad Horror, 🦠 Mold Spirit |
| 🤠 19. Ghost Town Gulch (sandstorm) | Wild West ghost town, dunes, red canyons, boneyard, mine caves | 🤠 Undead Sheriff, 🐍 Rattler, 🌵 Tumbleweed Phantom |
| ☁️ 20. Sky Islands (low gravity) | cloud city, cloud fields, crystal plains, gumdrop hills, sky base | 🦅 Storm Harpy, ⚡ Thunder Beast, ☁️ Cloud Wraith |
| 🛍 21. Midnight Mall | storefronts, giant toy blocks, ball pits, kiddie train, security rooms | 🧍 Mannequin, 🛒 Cart Crawler, 🔦 Security Ghost |
| 🐜 22. Bug Kingdom | ant hive tunnels, giant ferns, sticky sap pits, caves, glowing mushrooms | 🦗 Mantis Queen, 🐜 Giant Ant, 🦋 Moth Specter |
| ⚙️ 23. Clockwork Town (ash) | brass town, smoking factories, train yard, machine rooms, ruins | ⚙️ Clockwork Knight, 🕷 Gear Spider, 🕰 Cuckoo Phantom |
| ⛏ 24. Deep Mines | miners’ camp, dark caves, crystal veins, lava pools, tar pits | 🦡 Mole Beast, ⛏ Lost Miner, 🏮 Lantern Wisp |
| 🌑 25. Shadow Realm (very dark) | shadow city, bleeding woods, bottomless trench, maze, graveyard | 🌑 Shadow Stalker, 🕳 Void Crawler, 👑 Nightmare King |
| 🌈 26. Rainbow Nightmare (sprinkles) | rainbow town, gumdrop hills, cotton candy fields, neon park, ball pits | 🦄 Rainbow Unicorn, 🎈 Cloud Clown, ✨ Glitter Ghost |
| 🏫 27. Nightmare School | school buildings and buses, lockers, a creepy playground, sports field, hedge maze, giant blocks | 👩‍🏫 Substitute (ruler, flying papers), 🗄 Locker Crawler, 📝 Chalk Ghost |
| 🍳 28. Giant Kitchen (bubbles) | you're tiny: giant toasters, mugs and cans, a pantry of cereal boxes and jars, a soapy sink (slows you), chocolate river | 🔪 Butcher Chef, 🐀 Rat King, ♨️ Steam Phantom |
| 🎻 29. Phantom Opera House | grand facades, velvet seats, a stage, chandeliers, backstage clutter, a ballroom with waltzing dancers | 🎼 Masked Maestro, 🩰 Broken Ballerina, 🎤 Screaming Diva |
| 🐉 30. Dragon's Peak (embers) | dark towers with banners, braziers, a dragon skull, the dragon's gold hoard, jagged crags, lava | 🐉 Young Dragon, 💰 Treasure Golem, 🐲 Wyrm Spirit |
| ⛩ 31. Moonlit Shrine | pagodas, red gates, paper lanterns, blossom groves, thick bamboo forest, streams | 👹 Lantern Ogre, 🦊 Nine-Tail Fox, 🏮 Paper Lantern |
| 🏗 32. Construction Rooftops (rain) | rooftops with water tanks and spinning fans, steel frames and a swinging crane, glowing billboards | 🏗 Steel Giant, 🗿 Gargoyle, 🌫 Smog Wraith |
| 🐠 33. Aquarium After Dark (bubbles) | glowing fish tanks, glass tunnels, tall jellyfish tanks, touch pools (slow you), reef, kelp | 🦈 Shark Man, 🦀 Giant Crab, ⚡ Electric Eel |
| 🧪 34. Mad Science Lab (rain) | labs, glass pods, generators, bubbling vats, tesla coils with sparks, server farm, laser grid | 🧪 Mad Scientist, 🧟 The Experiment, 🧠 Brain in a Jar |
| 🌺 35. Carnivore Garden | greenhouses, flower beds, flytraps that turn to watch you, a bramble maze, jungle, swamp | 🪴 The Flytrap, 🌹 Thorn Beast, 🌼 Pollen Witch |
| 🎢 36. Boardwalk at Midnight | wooden pier shops, a lighthouse, lifeguard towers, tide pools (slow you), sandcastles, beach, lagoon | 🛟 Drowned Lifeguard, 🐚 Hermit Horror, 🕊 Gull Specter |
| 🏛 37. Museum at Night | marble halls, glowing display cases, statues that watch you, dinosaur skeletons, tombs, boneyard | 🗽 Living Statue, 🦴 Fossil Beast, 🖼 Haunted Portrait |
| 🕳 38. Sewer Depths (very dark) | brick tunnels, rivers of toxic sludge (burns stamina), giant pipes, caves, a bottomless trench | 🐊 Sewer Gator, 🟢 Sludge Man, 🪰 Sewer Specter |
| 🚀 39. Derelict Space Station (low gravity) | crew modules, solar panels, drifting debris, a hangar of shuttles, a reactor (plasma burns stamina), UFO wrecks | 👨‍🚀 Lost Astronaut, 🛰 Hull Crawler, 🌠 Star Eater |
| 📚 40. Storybook Woods | houses made of giant books, crooked cottages, sticky ink, fields of pages and pencils, glowing fairy rings | 🧙 Wicked Witch, 🐺 Storybook Wolf, 📖 Page Ghost |
| 🚂 41. Ghost Train Station (ash) | station house, platforms and a hissing steam engine, railyard signals and boxcars, coal heaps | 🎫 Phantom Conductor, ⚫ Coal Crawler, 🚂 Ghost Train |
| 🕹 42. Neon Arcade | arcade cabinets, claw machines, giant pinball bumpers, slot machines, ball pits | 👾 Pixel Brute, 🪙 Coin Cruncher, 🕹 The Claw |
| 🎬 43. Haunted Movie Studio | fake building fronts, cameras and spotlights, green-screen stages, film vaults, old movie sets | 🎬 Mad Director, 🦎 Rubber Suit Monster, 📽 Projector Ghost |
| 🐊 44. Bayou Nights (rain) | stilt shacks, docks and airboats, mossy cypress trees, bogs with lily pads and glowing gator eyes | 🐊 Gator Man, 🌿 Moss Beast, 🪷 Bog Lady |
| ⚔️ 45. Cursed Colosseum (sandstorm) | towering arena arches, gladiator statues that watch you, weapon racks, chariots, skull-lined catacombs | ⚔️ Cursed Gladiator, 🦁 Arena Lion, 🏛 Emperor's Ghost |
| 🎨 46. Doodle Land | everything drawn with black marker outlines: doodle houses, giant crayons, sticky paint puddles | ✏️ The Scribble, 🩷 Eraser Beast, 🖋 Ink Blot |
| 🚢 47. Ghost Cruise Ship | smokestacks, lifeboats, the bridge, pools (slow you), a roaring engine room, shipwrecks | ⚓ Drowned Captain, 🐚 Barnacle Brute, 📯 Foghorn Phantom |
| 🕷 48. Spider Queen's Nest | web-smothered huts, giant webs, glowing egg sacs, cocoons, webbed woods, egg caves | 🕷 Spider Queen, 🕸 Cocoon Man, 🕸️ Web Wraith |
| 🪞 49. Mirror Dimension | mirror buildings, upside-down houses hanging from the sky, a mirror maze, kaleidoscope fields | 🪞 Your Reflection, 💎 Shard Beast, 👸 Mirror Queen |
| 🏔 50. Yeti Peaks (snow) | 🏔 Mountain Lodge, ❄️ Avalanche Slopes, 🧊 Glacier Caves, plus older areas | 🦍 Yeti, 🐺 Snow Wolf, ❄️ Avalanche Spirit |
| 🌾 51. Scarecrow Harvest (embers) | 🌾 Harvest Village, 🌾 Endless Wheat, 🍎 The Old Orchard, plus older areas | 🌾 Harvester, 🐦‍⬛ Crow King, 🧵 Burlap Crawler |
| 🌴 52. Mirage Oasis (sand) | 🌴 Oasis Market, 🏜 Shifting Sands, 💧 Oasis Pools, plus older areas | 🌫 Mirage, 🪱 Dune Worm, 🏴 Desert Raider |
| 👺 53. Goblin Market | 👺 Goblin Bazaar, 🍄 Mushroom Hollows, 🗑 Junk Heaps, plus older areas | 👑 Goblin King, 🍄 Mushroom Goblin, 🔮 Hex Witch |
| 🦇 54. Vampire Castle | 🏰 Castle Courtyard, 🦇 Bat Caves, 🌹 Blood Rose Garden, plus older areas | 🧛 Count Crimson, 🦇 Giant Bat, 💀 Ghoul |
| 👽 55. Alien Invasion | 🛸 Crash Town, 🌀 Crop Circles, 🔦 Tractor Beam Field, plus older areas | 🛸 Abductor, 🔩 Probe Drone, 👽 Tall Visitor |
| 🌊 56. Flooded Town (rain) | 🌊 Flooded Streets, 🧱 The Sea Wall, 🌳 Sunken Park, plus older areas | 🌊 Wave Wraith, 🐍 Sea Serpent, 🎣 Drowned Fisherman |
| ⛪ 57. Haunted Cathedral | ⛪ Cathedral Square, 🔔 Bell Tower Ruins, 🪦 Crypt Garden, plus older areas | 🔔 Bell Ringer, 🪟 Glass Angel, ⚰️ Crypt Crawler |
| 🎃 58. Jack-o'-Lantern Festival (embers) | 🎃 Lantern Fest, 🎃 Pumpkin Hills, 🚜 Haunted Hayride, plus older areas | 🎃 Pumpkin King, 🌿 Vine Crawler, 🕯 Candle Ghost |
| 🛣 59. Midnight Highway (rain) | ⛽ Truck Stop, 🛣 The Highway, 🚗 Car Junkyard, plus older areas | 🚚 Ghost Trucker, 🦨 Roadkill Beast, 💡 Headlight Phantom |
| 🍦 60. Ice Cream Doom (sprinkles) | 🍨 Sundae Street, 🍭 Sprinkle Hills, 🍫 Melted Pools, plus older areas | 🍨 Scoop Monster, 🍦 Cone Crawler, 🧊 Brain Freeze |
| ⛈ 61. Thunder Plains (rain) | ⛈ Storm Outpost, ⚡ Lightning Fields, 🌪 Twister Alley, plus older areas | ⛈ Storm Giant, 🌪 Twister, 🐕 Static Hound |
| 🪸 62. Coral Kingdom (bubbles, low gravity) | 🪸 Coral Palace, 🦪 Pearl Beds, 🌺 Anemone Forest, plus older areas | 🧜‍♀️ Siren, 🦔 Urchin, 🐡 Puffer Brute |
| 🪖 63. Tin Fortress | 🏰 The Tin Fortress, 🔴 Marble Run, 🧱 Block Battlefield, plus older areas | 💂 Tin Captain, 🐁 Wind-Up Mouse, 🪁 Kite Phantom |
| 🌕 64. Moon Base (low gravity) | 🌕 Lunar Base, 🌑 Lunar Craters, 🛞 Rover Tracks, plus older areas | 🌕 Moon Golem, 🪱 Crater Worm, 🌙 Moon Wraith |
| ⚗️ 65. Alchemist's Tower (sprinkles) | ⚗️ Alchemist Quarter, 🧪 Potion Gardens, 🪨 Rune Stones, plus older areas | ⚗️ Alchemist, 🧪 Homunculus, 🔯 Rune Wisp |
| 🪓 66. Lumberjack Woods | 🪓 Logging Camp, 🪵 The Clearcut, 🌲 Giant Redwoods, plus older areas | 🪓 Axe Man, 🪵 Stump Beast, 🌫 Sawdust Ghost |
| 🏨 67. Haunted Hotel | 🏨 The Grand Hotel, 🌳 Hotel Gardens, 🧳 Luggage Hall, plus older areas | 🛎 Bellhop, 🧹 Midnight Maid, 🟥 Carpet Crawler |
| 💎 68. Geode World | 💎 Geode Village, 🔮 Amethyst Halls, 🐛 Glow Worm Grotto, plus older areas | 🪨 Geode Golem, 🐛 Glow Worm, 🔷 Prism Ghost |
| 🐒 69. Monkey Temple (rain) | 🐒 Monkey Temple, 🍌 Banana Groves, 🌉 Vine Bridges, plus older areas | 🐒 Monkey King, 🐆 Shadow Jaguar, 🗿 Golden Idol |
| 🦾 70. Robot Factory (ash) | 🏭 Assembly Line, 📦 Conveyor Maze, 🔩 Scrap Piles, plus older areas | 🦾 Assembler, 🪛 Drill Bot, 🔥 Welding Spark |
| ⚡ 71. Olympus Heights (low gravity) | 🏛 Cloud Temple, ✨ Golden Steps, ⚡ Lightning Garden, plus older areas | 🌩 Thunder Lord, 🔥 Fire Hound, ☁️ Cloud Siren |
| 🦉 72. Owl Forest | 🌳 Treehouse Village, 🌳 Hollow Trees, 🌙 Moonlit Clearing, plus older areas | 🐻 Owl Bear, 🦡 Night Badger, 🦉 Night Owl |
| 🔥 73. Fire Temple (embers) | 🔥 The Fire Temple, 🔥 Ember Fields, 🌋 Magma Falls, plus older areas | 🛡 Flame Knight, 🐦‍🔥 Dark Phoenix, 🐕 Lava Hound |
| 🧬 74. Bio Dome (bubbles) | 🧬 The Bio Dome, 🌱 Mutant Garden, 🫙 Specimen Tanks, plus older areas | 🌱 Mutant Plant, 🟢 Blob, 🦠 Spore Cloud |
| 🚀 75. Rocket Launch Site | 🚀 Launch Base, ⛽ Fuel Depot, 🚀 Launch Pads, plus older areas | 🧑‍🚀 Rocket Man, 🛢 Fuel Eater, ⏱ Countdown |
| 🧶 76. Knitted World (sprinkles) | 🧶 Yarn Town, 🔘 Button Fields, 🪡 Needle Forest, plus older areas | 🧦 Sock Puppet, 🕷 Yarn Spider, 🪡 Button-Eyed Ghost |
| 🎢 77. Rollercoaster Park | 🎢 Thrill Park, 🎢 Coaster Tracks, 🚗 Bumper Cars, plus older areas | 🎟 Ride Operator, 🚗 Bumper Car, 🎫 Ticket Ghost |
| 🪐 78. Galaxy Garden (low gravity) | 🪐 Star Garden, ☄️ Comet Fields, 🌌 Nebula Pools, plus older areas | ⭐ Star Beast, ☄️ Comet Crawler, 🌌 Nebula |
| 🎩 79. Fogtown Alleys | 🎩 Fogtown, 🧱 Cobble Alleys, ⚓ Foggy Docks, plus older areas | 🎩 Faceless Gentleman, 🧹 Chimney Crawler, 🌫 Fog Ghost |
| 🏔 80. Cliff Monastery (snow) | 🛕 Cliff Monastery, 🌉 Rope Bridges, 🦅 Eagle Nests, plus older areas | 🧘 Silent Monk, 🦅 Great Eagle, 🐐 Mountain Goat |
| 🫖 81. Topsy-Turvy Tea Party (sprinkles) | 🫖 Tea Party Lane, 🃏 Card Garden, 🌀 The Mad Hedges, plus older areas | 🎩 Tea Hatter, 🐈 Grinning Cat, 🃏 Card Queen |
| ☢️ 82. Toxic Wasteland (ash) | ☢️ Fallout Town, ☢️ Glow Craters, 🚙 Rusted Wrecks, plus older areas | ☢️ Mutant, 🪳 Rad Roach, 💚 Glow Ghost |
| 🦣 83. Ice Age Valley (snow) | 🔥 Cave Camp, 🧊 Frozen Tundra, 🦣 Mammoth Graves, plus older areas | 🦣 Mammoth, 🪨 Cave Brute, 🥶 Frost Spirit |
| 🎭 84. Masquerade Ball | 🎭 Masquerade Hall, 🌹 Ballroom Gardens, 🎆 Fireworks Terrace, plus older areas | 💃 Masked Dancer, 🐈‍⬛ Masked Panther, 🎭 Masquerade Ghost |
| 🚇 85. Abandoned Subway | 🚇 Subway Station, 🕳 The Tunnels, 🚃 Train Graveyard, plus older areas | 🐀 Tunnel Rat, 🎨 Graffiti Ghost, ⚡ Third Rail |
| 🥷 86. Shadow Dojo (sprinkles) | 🥷 Dojo Village, 🎯 Training Grounds, 🌸 Cherry Courtyard, plus older areas | 🥷 Shadow Ninja, 🐺 Masked Wolf, 🐉 Ink Dragon |
| 🌻 87. Sunflower Farm | 🌻 Sunflower Farm, 🌻 Sunflower Maze, 🐝 Bee Meadow, plus older areas | 🌻 Sunflower Giant, 🐝 Bee Hound, 👻 Straw Ghost |
| 🐂 88. The Labyrinth (sand) | 🏛 Labyrinth Gate, 🌿 The Endless Labyrinth, 🫒 Olive Groves, plus older areas | 🐂 Minotaur, 🐍 Stone Gazer, 🐃 Bronze Bull |
| 🦀 89. Crab Island | 🦀 Crab Shack Village, 🕳 Crab Burrows, 🐚 Shell Beach, plus older areas | 🦀 Hermit King, 🏄 Beach Zombie, 🔥 Tiki Torch Ghost |
| 👁 90. Cave of Eyes | 👁 The Eye Temple, 👀 Staring Walls, 🩸 Eye Pools, plus older areas | 👁 Many-Eyed One, 🕷 Eye Crawler, 🧿 Big Eye |
| 🛟 91. Submarine Base (bubbles, low gravity) | ⚓ Sub Base, 🚀 Torpedo Bay, 🪟 Abyss Windows, plus older areas | 🤿 Deep Diver, 🐟 Angler Queen, 🪼 Abyss Jelly |
| 🎈 92. Balloon Town (low gravity) | 🎈 Balloon Town, ☁️ Floating Fields, 🎈 Helium Factory, plus older areas | 🎈 Balloon Man, 📌 Popper, 🎈 Blimp |
| 🌒 93. Eclipse Village | 🌒 Eclipse Village, 🌑 Shadow Fields, ☀️ Sun Shrine, plus older areas | 🌒 Eclipse King, ☀️ Sun Dog, 🦋 Moon Moth |
| 📜 94. Ancient Library | 📜 The Grand Library, 📚 Scroll Stacks, 🪑 Reading Gardens, plus older areas | 🤫 Librarian, 🐛 Bookworm, 📜 Scroll Mummy |
| 🏟 95. Monster Stadium | 🏟 Monster Stadium, 🚿 Locker Rooms, 🏈 Training Field, plus older areas | 📣 Coach, 🐻 Mascot, 🦓 Referee Ghost |
| 🌀 96. Hypno Spiral | 🌀 Spiral City, 🌀 Spiral Fields, 🗼 Dizzy Towers, plus older areas | 😵‍💫 Hypnotist, 🐌 Spiral Snail, 🌀 Vortex |
| 🟩 97. Pixel World | 🟩 Pixel Village, ⛰ Block Hills, 🟧 Pixel Lava, plus older areas | 🗡 Pixel Knight, 🟩 Pixel Slime, 👾 Pixel Ghost |
| 💤 98. The Dream Factory (sprinkles) | 💤 The Dream Factory, 🛏 Pillow Hills, ⚙️ Nightmare Conveyor, plus older areas | 😴 Sleep Stealer, 🛏 Pillow Crawler, 💭 Dream Eater |
| 🌀 99. The Nightmare Mix | a random remix of areas from every level, new every round | 3 random monsters from the other levels, and the fastest monsters |
| 👑 100. THE FINAL NIGHTMARE (embers) | **the grand finale**: the giant Nightmare Throne, obsidian spires wrapped in rune rings, lava moats, skull gates, a field of titan bones, the floating Void Rift, crackling Storm Spires, a giant eye in the sky that follows you, burning halo rings, a huge blood moon and lightning | **3 GIANT BOSSES**: 😈 Nightmare Lord, 🐉 Abyss Dragon, 🌌 Void Queen. Collect 5 💠 nightmare crystals to grow GIANT and fight them all |

**Every map and monster has its own look.** Each level has its own town in the middle (levels 15-100 have their own; levels 50-98 are built from a kit of props and building styles, mixed and colored differently for each level; 15-26 got: stone huts and
lava fountains, ice towers, hospital wards and ambulances, mushroom houses, saloons and water towers, marble sky temples, shop fronts,
ant mounds and honeycombs, brick buildings with turning gears and a clock tower, mine shafts and ore carts, crooked shadow towers with
walls of watching eyes, cupcake houses and rainbow arches). Each level also has its own ground and fog colors, moon color, and
decorations floating over its wild areas. Every monster has its own signature parts: snouts, beaks, hats, crowns and helmets,
held items (scythe, lantern, flashlight, pickaxe, syringe…), shells, wings, gears, flames, glowing cracks, and things orbiting it.
Developer views: `?demo=lineup&level=N` shows a level's 3 monsters side by side; `?demo=view&level=N&air=1` looks over its town.

**🛠 Create your own.** The **Create** tab on the menu has two makers:
- **Monster Maker:** a live 3D preview that spins as you design. Pick the body type (walks, crawls or floats), body and eye colors,
  size (go past ×2.2 for a GIANT), speed, head, face, horns or ears, wings/shell/flames on the back, a hat, something to hold,
  things floating around it, the number of eyes, plus tails, extra arms, fur, glowing cracks and more. 🎲 Random makes a surprise monster.
- **Map Maker:** paint a 5×5 map with any area from any level (click or drag), and set the sky color, weather, darkness and gravity.
  Pick 3 monsters (your own included), how fast they are, and whether it's a ⭐ BIG level. Then **Save & PLAY**.

- **Play as your monster:** press **🎮 Play as** next to any monster you made, and you become it: run, vault, climb and slide
  with your own monster's body (press `V` to see yourself). Press **Switch back** for the normal runner.

Your creations are saved in your browser. Custom maps are solo-only for now.

**🤸 Parkour runaway.** Sprint into a low wall to **vault** it, jump at a ledge to **climb** up, press `C` (or 💨 on a phone) to
**slide** (it's harder for a monster to grab you), and land a big drop while running to **roll** and keep your speed. Chain moves
for combos; parkour moves earn coins. Every map has parkour spots: low hurdles and step-blocks that climb up to a lookout.

**📜 Story quests.** Every level has a story quest: find the lost diary pages, light the beacons, gather the relics, break the curse,
piece together the torn map, find the survivors, fix the radio, or place the seal stones. Each item tells part of the level's story,
and finishing the quest gives you an edge: every key revealed, the monsters slowed or stunned, extra ghost potions or flash bombs,
or a speed boost.

**🎬 Cutscenes.** Every level has 5: the intro, the monsters being released, the exit opening, the frenzy, and the escape, where a
monster chases you to the gate and the gate slams shut in its face. **⭐ BIG levels** (every 10th level, plus the boss battles on
level 4 and level 100) have **10**, with epic running scenes: a monster catches your scent, a chase where you vault and slide under
its claws in slow motion, midnight turning the moon red, an ambush from the sky, and a final sprint for the open gate with every
monster behind you (boss levels get a power surge and a victory celebration instead). BIG levels also have a bigger quest.

**👹 Better-looking monsters.** Rounded heads, smooth limbs, a hunched chest, slit pupils, a glowing rim in the color of their eyes,
and they breathe (and pant when they hunt you).

Monsters get a little faster each level. Cutscenes: a level-specific intro, the monsters being released,
the exit gate opening (and a monster hearing it), the last-45-seconds frenzy, getting caught, and escaping.
Every cutscene can be skipped (click, Space, Enter or Esc). Stamina lasts much longer than before.

**Power-ups** are hidden around every map: 👻 **Ghost Potion** (press `Q`) makes you invisible for 7 seconds,
💥 **Flash Bomb** (press `E`) stuns every monster near you for 5 seconds. When the exit opens, an arrow points to it.
Getting caught now plays an **eaten** cutscene: the monster grabs you and pulls you all the way into its mouth, down past the tongue to its throat; you turn around, see the teeth around the opening… and *CHOMP*, then chewing and a gulp.
**Settings** (menu and pause screen): volume, look speed, and a *Fast* graphics mode for slower computers and phones.

What else is different in the browser version:
- **A big map (20×20 blocks)** with five areas per level, shuffled every round. Level 1: 🏙 Neon City down the middle,
  plus 🌲 the Whispering Woods (very dark, monsters can't see far), 🪦 Hollow Hill Cemetery (graves, crypts, dead trees),
  🏭 the Rust Yards (warehouses, containers, smokestacks) and 🌽 Crowfield Farm (corn you can hide in, barns, scarecrows that watch you).
- **All three monsters hunt at the same time** from the moment they're released: the Stalker, the Crawler and the Wraith.
  When one spots you it howls, and the others run to that spot (Normal: nearby ones, Hard: all of them, Easy: off).
- **Scarier monsters**: jaws that snap open, teeth, long claws, eyes that glow through the fog, jerky head twitches,
  the Crawler's six eyes and spider legs, the Wraith flickering in and out. Up close you get growls, whispers,
  a screech when you're spotted, TV static, red fog and a flickering flashlight. Sprinting is loud, so they hear you from further away.

## Web version: 15 cutscenes per level + endless auto-made levels

- Every level now has 15 cutscenes, including five acrobatic ones (backflip, double front flip, rooftop leap, lightning-storm dodge, and a flip combo finale).
- **Endless mode** (Levels tab) builds a new map and three new monsters for every number, so it never runs out.
- The Create tab has **Auto-make** buttons for monsters and for whole maps (with 3 new monsters).
