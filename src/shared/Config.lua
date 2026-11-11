-- Nightfall Runners :: shared configuration
-- Tweak these numbers to balance the game.

local Config = {}

-- Round flow ---------------------------------------------------------------
Config.MinPlayers = 1                -- solo play works (AI hunter)
Config.IntermissionTime = 20
Config.RoundTime = 240               -- seconds
Config.HunterReleaseDelay = 12       -- head start for runaways
Config.EndingTime = 7

-- Objectives ---------------------------------------------------------------
Config.KeysToSpawn = 7
Config.KeysNeeded = 5

-- Hunters ------------------------------------------------------------------
Config.PlayerHunterMinPlayers = 3    -- with 3+ players one player becomes a Hunter
Config.ExtraHunterEvery = 70         -- spawn another AI hunter every N seconds
Config.MaxAIHunters = 3
Config.HunterPatrolSpeed = 14
Config.HunterChaseSpeed = 19.5
Config.HunterEnragedBonus = 2        -- added to chase speed once the exit opens
Config.FrenzyTime = 45               -- last N seconds: hunters always know where you are
Config.HunterSightRange = 110
Config.HunterHearRange = 18          -- always notices you this close (unless hidden)
Config.HiddenDetectRange = 7         -- hidden players are only found this close
Config.CatchRadius = 4.5
Config.PlayerHunterSpeed = 23

-- Movement -----------------------------------------------------------------
Config.WalkSpeed = 16
Config.SprintSpeed = 26
Config.MaxStamina = 100
Config.StaminaDrain = 24             -- per second while sprinting
Config.StaminaRegen = 16             -- per second while not sprinting
Config.SpeedPadBonus = 12
Config.SpeedPadDuration = 3

-- Rewards (coins) ----------------------------------------------------------
Config.Rewards = {
	Key = 15,
	Escape = 60,
	Participation = 10,
	Catch = 25,          -- player hunter per catch
	HunterWin = 50,      -- player hunter if nobody escapes
}

-- Upgrades (shop) ----------------------------------------------------------
Config.Upgrades = {
	Stamina = { MaxLevel = 5, BaseCost = 100, CostStep = 75, PerLevel = 20, Label = "Lungs", Desc = "+20 max stamina" },
	Speed = { MaxLevel = 5, BaseCost = 150, CostStep = 100, PerLevel = 1, Label = "Sneakers", Desc = "+1 sprint speed" },
}

function Config.UpgradeCost(name, currentLevel)
	local u = Config.Upgrades[name]
	return u.BaseCost + u.CostStep * currentLevel
end

-- Map ----------------------------------------------------------------------
Config.GridSize = 12
Config.CellSize = 26
Config.LobbyPosition = Vector3.new(0, 80, -330)

Config.DataStoreName = "NightfallRunners_v1"

return Config
