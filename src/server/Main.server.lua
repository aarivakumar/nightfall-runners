-- Nightfall Runners :: main server game loop

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Lighting = game:GetService("Lighting")
local CollectionService = game:GetService("CollectionService")
local TweenService = game:GetService("TweenService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local MapBuilder = require(script.Parent:WaitForChild("MapBuilder"))
local HunterAI = require(script.Parent:WaitForChild("HunterAI"))
local DataService = require(script.Parent:WaitForChild("DataService"))

---------------------------------------------------------------------------
-- Remotes + replicated game state
---------------------------------------------------------------------------
local Remotes = Instance.new("Folder")
Remotes.Name = "Remotes"
local NotifyEvent = Instance.new("RemoteEvent")
NotifyEvent.Name = "Notify"
NotifyEvent.Parent = Remotes
local SplashEvent = Instance.new("RemoteEvent")
SplashEvent.Name = "Splash"
SplashEvent.Parent = Remotes
local EffectEvent = Instance.new("RemoteEvent")
EffectEvent.Name = "Effect"
EffectEvent.Parent = Remotes
local BuyUpgrade = Instance.new("RemoteFunction")
BuyUpgrade.Name = "BuyUpgrade"
BuyUpgrade.Parent = Remotes
Remotes.Parent = ReplicatedStorage

local GameState = Instance.new("Configuration")
GameState.Name = "GameState"
GameState:SetAttribute("Phase", "Waiting")
GameState:SetAttribute("TimeLeft", 0)
GameState:SetAttribute("KeysCollected", 0)
GameState:SetAttribute("KeysNeeded", Config.KeysNeeded)
GameState:SetAttribute("ExitOpen", false)
GameState:SetAttribute("RunawaysLeft", 0)
GameState:SetAttribute("HunterReleased", false)
GameState.Parent = ReplicatedStorage

local Hunters = Instance.new("Folder")
Hunters.Name = "Hunters"
Hunters.Parent = workspace

---------------------------------------------------------------------------
-- Atmosphere
---------------------------------------------------------------------------
Lighting.ClockTime = 20.6
Lighting.Brightness = 1.6
Lighting.Ambient = Color3.fromRGB(70, 60, 100)
Lighting.OutdoorAmbient = Color3.fromRGB(95, 85, 130)
Lighting.EnvironmentDiffuseScale = 0.4
Lighting.EnvironmentSpecularScale = 0.6
pcall(function()
	Lighting.Technology = Enum.Technology.Future
end)
local atmosphere = Instance.new("Atmosphere")
atmosphere.Density = 0.38
atmosphere.Offset = 0.1
atmosphere.Color = Color3.fromRGB(120, 100, 170)
atmosphere.Decay = Color3.fromRGB(60, 40, 90)
atmosphere.Glare = 0
atmosphere.Haze = 1.5
atmosphere.Parent = Lighting
local bloom = Instance.new("BloomEffect")
bloom.Intensity = 0.6
bloom.Size = 28
bloom.Threshold = 1.6
bloom.Parent = Lighting
local cc = Instance.new("ColorCorrectionEffect")
cc.Contrast = 0.1
cc.Saturation = 0.15
cc.TintColor = Color3.fromRGB(240, 235, 255)
cc.Parent = Lighting

local _, lobbySpawn = MapBuilder.BuildLobby(workspace)

---------------------------------------------------------------------------
-- Helpers
---------------------------------------------------------------------------
local function notify(target, text, color)
	color = color or Color3.fromRGB(255, 255, 255)
	if target then
		NotifyEvent:FireClient(target, text, color)
	else
		NotifyEvent:FireAllClients(text, color)
	end
end

local function splash(target, title, subtitle, color)
	if target then
		SplashEvent:FireClient(target, title, subtitle, color)
	else
		SplashEvent:FireAllClients(title, subtitle, color)
	end
end

local function getRoot(player)
	local char = player.Character
	if not char then
		return nil
	end
	local hum = char:FindFirstChildOfClass("Humanoid")
	if not hum or hum.Health <= 0 then
		return nil
	end
	return char:FindFirstChild("HumanoidRootPart"), hum
end

local function setRole(player, role)
	player:SetAttribute("Role", role)
end

local function sendToLobby(player)
	if player.Parent then
		player:LoadCharacter()
	end
end

---------------------------------------------------------------------------
-- Round state
---------------------------------------------------------------------------
local round = nil -- table while a round is running

local function runawayTargets()
	local list = {}
	if not round then
		return list
	end
	for _, player in ipairs(Players:GetPlayers()) do
		if player:GetAttribute("Role") == "Runaway" then
			local root = getRoot(player)
			if root then
				table.insert(list, {
					Player = player,
					Root = root,
					Hidden = player:GetAttribute("Hidden") == true,
				})
			end
		end
	end
	return list
end

local function catchPlayer(player, byPlayer)
	if not round or player:GetAttribute("Role") ~= "Runaway" then
		return
	end
	setRole(player, "Caught")
	player:SetAttribute("Hidden", false)
	table.insert(round.Caught, player)

	local root, hum = getRoot(player)
	if hum then
		hum.WalkSpeed = 0
		hum.JumpPower = 0
		hum.JumpHeight = 0
	end
	if root then
		EffectEvent:FireAllClients("Caught", root.Position)
	end

	if byPlayer then
		DataService.AddCoins(byPlayer, Config.Rewards.Catch)
		DataService.AddCatch(byPlayer)
		notify(byPlayer, ("+%d coins for catching %s!"):format(Config.Rewards.Catch, player.DisplayName), Color3.fromRGB(255, 120, 120))
	end
	notify(nil, ("💀 %s was caught!"):format(player.DisplayName), Color3.fromRGB(255, 90, 90))
	splash(player, "CAUGHT!", "Spectate your friends from the lobby", Color3.fromRGB(255, 60, 60))

	task.delay(2.5, function()
		if player:GetAttribute("Role") == "Caught" then
			sendToLobby(player)
		end
	end)
end

local function escapePlayer(player)
	if not round or not round.ExitOpen or player:GetAttribute("Role") ~= "Runaway" then
		return
	end
	setRole(player, "Escaped")
	player:SetAttribute("Hidden", false)
	table.insert(round.Escaped, player)
	DataService.AddCoins(player, Config.Rewards.Escape)
	DataService.AddWin(player)
	notify(nil, ("🏁 %s ESCAPED!"):format(player.DisplayName), Color3.fromRGB(120, 255, 140))
	splash(player, "YOU ESCAPED!", ("+%d coins"):format(Config.Rewards.Escape), Color3.fromRGB(120, 255, 140))
	EffectEvent:FireClient(player, "Escaped")
	task.delay(2, function()
		if player:GetAttribute("Role") == "Escaped" then
			sendToLobby(player)
		end
	end)
end

local function openExit()
	if not round or round.ExitOpen then
		return
	end
	round.ExitOpen = true
	GameState:SetAttribute("ExitOpen", true)
	local info = round.Info
	info.Gate.CanCollide = false
	TweenService:Create(info.Gate, TweenInfo.new(1.2), { Transparency = 1 }):Play()
	local light = info.Gate:FindFirstChildOfClass("PointLight")
	if light then
		light.Color = Color3.fromRGB(80, 255, 120)
	end
	info.GateLabel.Text = "🚪 EXIT OPEN!"
	info.GateLabel.TextColor3 = Color3.fromRGB(120, 255, 140)
	info.ExitPlate.Color = Color3.fromRGB(80, 255, 120)
	for _, h in ipairs(round.AIHunters) do
		h:SetEnraged(true)
	end
	splash(nil, "THE EXIT IS OPEN!", "Get to the gate - the Hunter is enraged!", Color3.fromRGB(120, 255, 140))
	EffectEvent:FireAllClients("ExitOpen", info.ExitPosition)
end

local function collectKey(player, keyModel)
	if not round or round.Ended then
		return
	end
	round.Keys += 1
	GameState:SetAttribute("KeysCollected", round.Keys)
	EffectEvent:FireAllClients("Key", keyModel:GetPivot().Position)
	keyModel:Destroy()
	DataService.AddCoins(player, Config.Rewards.Key)
	notify(
		nil,
		("🔑 %s found a key! (%d/%d)"):format(player.DisplayName, math.min(round.Keys, Config.KeysNeeded), Config.KeysNeeded),
		Color3.fromRGB(255, 220, 90)
	)
	if round.Keys >= Config.KeysNeeded then
		openExit()
	end
end

local function spawnKey(position, parent)
	local model = Instance.new("Model")
	model.Name = "Key"

	local function kp(size, offset, shape)
		local p = Instance.new("Part")
		p.Anchored = true
		p.CanCollide = false
		p.Material = Enum.Material.Neon
		p.Color = Color3.fromRGB(255, 205, 60)
		if shape then
			p.Shape = shape
		end
		p.Size = size
		p.CFrame = CFrame.new(position) * offset
		p.Parent = model
		return p
	end
	local ring = kp(Vector3.new(0.5, 2, 2), CFrame.new(0, 1.2, 0), Enum.PartType.Cylinder)
	kp(Vector3.new(0.4, 2.6, 0.4), CFrame.new(0, -0.9, 0))
	kp(Vector3.new(0.4, 0.4, 0.9), CFrame.new(0, -1.6, 0.5))
	kp(Vector3.new(0.4, 0.4, 0.7), CFrame.new(0, -0.9, 0.4))
	model.PrimaryPart = ring

	local light = Instance.new("PointLight")
	light.Color = Color3.fromRGB(255, 210, 80)
	light.Range = 14
	light.Brightness = 3
	light.Parent = ring

	local hitbox = Instance.new("Part")
	hitbox.Name = "Hitbox"
	hitbox.Anchored = true
	hitbox.CanCollide = false
	hitbox.Transparency = 1
	hitbox.Size = Vector3.new(6, 7, 6)
	hitbox.Position = position
	hitbox.Parent = model

	MapBuilder.Billboard(ring, "🔑", Color3.fromRGB(255, 220, 90), 46, 46, Vector3.new(0, 3, 0), true, 70)
	CollectionService:AddTag(model, "SpinningKey")
	model.Parent = parent

	local taken = false
	hitbox.Touched:Connect(function(hit)
		if taken then
			return
		end
		local player = Players:GetPlayerFromCharacter(hit.Parent)
		if player and player:GetAttribute("Role") == "Runaway" then
			taken = true
			collectKey(player, model)
		end
	end)
end

---------------------------------------------------------------------------
-- Player lifecycle
---------------------------------------------------------------------------
local function setupCharacter(player, character)
	local hum = character:WaitForChild("Humanoid", 5)
	if not hum then
		return
	end
	local role = player:GetAttribute("Role")

	if role == "Hunter" and round and not round.Ended then
		-- respawned hunter goes back to the city
		task.defer(function()
			local root = character:WaitForChild("HumanoidRootPart", 5)
			if root then
				character:PivotTo(round.Info.HunterSpawn)
				round.SetupPlayerHunter(player, character)
			end
		end)
	elseif role == "Runaway" then
		-- should not happen (respawn mid-round) -> counts as caught
		setRole(player, "Caught")
	end

	hum.Died:Connect(function()
		if player:GetAttribute("Role") == "Runaway" and round then
			catchPlayer(player, nil)
		end
	end)
end

Players.PlayerAdded:Connect(function(player)
	setRole(player, "Lobby")
	player:SetAttribute("Hidden", false)
	player:SetAttribute("BoostUntil", 0)
	DataService.Load(player)
	player.CharacterAdded:Connect(function(char)
		setupCharacter(player, char)
	end)
	if player.Character then
		setupCharacter(player, player.Character)
	end
	notify(player, "Welcome to Nightfall Runners! Hold SHIFT to sprint.", Color3.fromRGB(200, 170, 255))
end)

Players.PlayerRemoving:Connect(function(player)
	DataService.Release(player)
end)

game:BindToClose(function()
	DataService.SaveAll()
	task.wait(2)
end)

task.spawn(function()
	while true do
		task.wait(120)
		DataService.SaveAll()
	end
end)

BuyUpgrade.OnServerInvoke = function(player, name)
	if type(name) ~= "string" then
		return false, "Bad request"
	end
	return DataService.TryUpgrade(player, name)
end

---------------------------------------------------------------------------
-- Round flow
---------------------------------------------------------------------------
local function setPhase(phase)
	GameState:SetAttribute("Phase", phase)
end

local function startRound()
	local rng = Random.new()
	local mapFolder = Instance.new("Folder")
	mapFolder.Name = "Round"
	mapFolder.Parent = workspace
	local info = MapBuilder.Build(rng, mapFolder)

	round = {
		Info = info,
		Folder = mapFolder,
		Keys = 0,
		ExitOpen = false,
		Escaped = {},
		Caught = {},
		AIHunters = {},
		PlayerHunter = nil,
		Released = false,
		Ended = false,
		Participants = {},
		Frenzy = false,
	}

	GameState:SetAttribute("KeysCollected", 0)
	GameState:SetAttribute("KeysNeeded", Config.KeysNeeded)
	GameState:SetAttribute("ExitOpen", false)
	GameState:SetAttribute("HunterReleased", false)

	for _, pos in ipairs(info.KeySpots) do
		spawnKey(pos, mapFolder)
	end

	-- speed pads
	local padDebounce = {}
	for _, pad in ipairs(info.SpeedPads) do
		pad.Touched:Connect(function(hit)
			local player = Players:GetPlayerFromCharacter(hit.Parent)
			if not player or player:GetAttribute("Role") ~= "Runaway" then
				return
			end
			if padDebounce[player] and os.clock() - padDebounce[player] < 1 then
				return
			end
			padDebounce[player] = os.clock()
			player:SetAttribute("BoostUntil", workspace:GetServerTimeNow() + Config.SpeedPadDuration)
			EffectEvent:FireClient(player, "Boost")
		end)
	end

	info.ExitZone.Touched:Connect(function(hit)
		local player = Players:GetPlayerFromCharacter(hit.Parent)
		if player then
			escapePlayer(player)
		end
	end)

	-- who's playing
	local participants = {}
	for _, p in ipairs(Players:GetPlayers()) do
		if getRoot(p) then
			table.insert(participants, p)
		end
	end
	round.Participants = participants

	local playerHunter = nil
	if #participants >= Config.PlayerHunterMinPlayers then
		playerHunter = participants[rng:NextInteger(1, #participants)]
	end

	function round.SetupPlayerHunter(player, character)
		local hum = character:FindFirstChildOfClass("Humanoid")
		local root = character:FindFirstChild("HumanoidRootPart")
		if hum then
			hum.WalkSpeed = Config.PlayerHunterSpeed
		end
		if not character:FindFirstChild("HunterGlow") then
			local hl = Instance.new("Highlight")
			hl.Name = "HunterGlow"
			hl.FillColor = Color3.fromRGB(255, 30, 50)
			hl.FillTransparency = 0.55
			hl.OutlineColor = Color3.fromRGB(255, 80, 80)
			hl.Parent = character
		end
		if root then
			root.Anchored = not round.Released
		end
	end

	local spawnIndex = 0
	for _, p in ipairs(participants) do
		local root = getRoot(p)
		if p == playerHunter then
			round.PlayerHunter = p
			setRole(p, "Hunter")
			p.Character:PivotTo(info.HunterSpawn)
			round.SetupPlayerHunter(p, p.Character)
			splash(p, "YOU ARE THE HUNTER", "Catch every runaway before they escape!", Color3.fromRGB(255, 60, 60))
		else
			spawnIndex += 1
			setRole(p, "Runaway")
			p:SetAttribute("Hidden", false)
			local cf = info.RunawaySpawns[(spawnIndex - 1) % #info.RunawaySpawns + 1]
			p.Character:PivotTo(cf)
			if root then
				root.AssemblyLinearVelocity = Vector3.zero
			end
			splash(p, "RUN!", ("Find %d keys and escape the city"):format(Config.KeysNeeded), Color3.fromRGB(255, 220, 90))
		end
	end

	-- AI hunter (always at least one)
	local function addAIHunter()
		local h = HunterAI.new({
			SpawnCFrame = info.HunterSpawn * CFrame.new(#round.AIHunters * 4, 0, 0),
			Parent = Hunters,
			GetTargets = runawayTargets,
			OnCatch = function(player)
				catchPlayer(player, nil)
			end,
			PatrolPoints = info.PatrolPoints,
		})
		h:SetEnraged(round.ExitOpen)
		h:SetFrenzy(round.Frenzy)
		table.insert(round.AIHunters, h)
		return h
	end
	round.AddAIHunter = addAIHunter
	addAIHunter()
end

local function releaseHunters()
	round.Released = true
	GameState:SetAttribute("HunterReleased", true)
	for _, h in ipairs(round.AIHunters) do
		h:Release()
	end
	if round.PlayerHunter then
		local root = getRoot(round.PlayerHunter)
		if root then
			root.Anchored = false
		end
	end
	splash(nil, "THE HUNTER IS LOOSE", "Stay out of sight...", Color3.fromRGB(255, 50, 70))
	EffectEvent:FireAllClients("Release")
end

local function updateHidden()
	for _, player in ipairs(Players:GetPlayers()) do
		local hidden = false
		if player:GetAttribute("Role") == "Runaway" then
			local root = getRoot(player)
			if root then
				for _, bush in ipairs(round.Info.Bushes) do
					local d = root.Position - bush.Position
					if Vector3.new(d.X, 0, d.Z).Magnitude < bush.Radius and root.Position.Y < bush.Position.Y + 4 then
						hidden = true
						break
					end
				end
			end
		end
		if player:GetAttribute("Hidden") ~= hidden then
			player:SetAttribute("Hidden", hidden)
		end
	end
end

local function countRunaways()
	local n = 0
	for _, player in ipairs(Players:GetPlayers()) do
		if player:GetAttribute("Role") == "Runaway" then
			n += 1
		end
	end
	return n
end

local function runRound()
	setPhase("Round")
	local startTime = os.clock()
	local nextExtra = Config.HunterReleaseDelay + Config.ExtraHunterEvery

	while true do
		local elapsed = os.clock() - startTime
		local timeLeft = math.max(0, Config.RoundTime - elapsed)
		GameState:SetAttribute("TimeLeft", math.ceil(timeLeft))

		if not round.Released and elapsed >= Config.HunterReleaseDelay then
			releaseHunters()
		end

		if round.Released and elapsed >= nextExtra and #round.AIHunters < Config.MaxAIHunters then
			nextExtra += Config.ExtraHunterEvery
			local h = round.AddAIHunter()
			h:Release()
			notify(nil, "👹 Another Hunter has entered the city!", Color3.fromRGB(255, 70, 90))
			EffectEvent:FireAllClients("Release")
		end

		if not round.Frenzy and timeLeft <= Config.FrenzyTime then
			round.Frenzy = true
			for _, h in ipairs(round.AIHunters) do
				h:SetFrenzy(true)
			end
			splash(nil, "FRENZY!", "The Hunters can sense you now - hurry!", Color3.fromRGB(255, 40, 40))
		end

		-- player hunter catches
		if round.Released and round.PlayerHunter and round.PlayerHunter.Parent then
			local hRoot = getRoot(round.PlayerHunter)
			if hRoot then
				for _, t in ipairs(runawayTargets()) do
					if (t.Root.Position - hRoot.Position).Magnitude <= Config.CatchRadius + 0.5 then
						catchPlayer(t.Player, round.PlayerHunter)
					end
				end
			end
		end

		updateHidden()

		local left = countRunaways()
		GameState:SetAttribute("RunawaysLeft", left)
		if left == 0 or timeLeft <= 0 then
			break
		end
		task.wait(0.1)
	end
end

local function endRound()
	round.Ended = true
	setPhase("Ending")

	-- anyone still running when time is up gets caught by the night
	local timedOut = {}
	for _, player in ipairs(Players:GetPlayers()) do
		if player:GetAttribute("Role") == "Runaway" then
			setRole(player, "Caught")
			table.insert(round.Caught, player)
			table.insert(timedOut, player)
		end
	end

	for _, player in ipairs(round.Participants) do
		if player.Parent then
			DataService.AddCoins(player, Config.Rewards.Participation)
		end
	end

	local escaped = #round.Escaped
	local title, sub, color
	if escaped > 0 then
		local names = {}
		for _, p in ipairs(round.Escaped) do
			table.insert(names, p.DisplayName)
		end
		title = escaped == 1 and "1 RUNAWAY ESCAPED" or (escaped .. " RUNAWAYS ESCAPED")
		sub = table.concat(names, ", ")
		color = Color3.fromRGB(120, 255, 140)
	else
		title = "THE HUNTERS WIN"
		sub = #timedOut > 0 and "Time ran out..." or "Nobody made it out."
		color = Color3.fromRGB(255, 60, 70)
		if round.PlayerHunter and round.PlayerHunter.Parent then
			DataService.AddCoins(round.PlayerHunter, Config.Rewards.HunterWin)
			notify(round.PlayerHunter, ("+%d coins - you win!"):format(Config.Rewards.HunterWin), Color3.fromRGB(255, 120, 120))
		end
	end
	splash(nil, title, sub, color)

	for _, h in ipairs(round.AIHunters) do
		h:Destroy()
	end
	task.wait(Config.EndingTime)

	for _, player in ipairs(Players:GetPlayers()) do
		local role = player:GetAttribute("Role")
		setRole(player, "Lobby")
		player:SetAttribute("Hidden", false)
		if role == "Hunter" or role == "Caught" or role == "Runaway" then
			sendToLobby(player)
		end
	end

	round.Folder:Destroy()
	round = nil
	GameState:SetAttribute("ExitOpen", false)
	GameState:SetAttribute("KeysCollected", 0)
	GameState:SetAttribute("RunawaysLeft", 0)
	GameState:SetAttribute("HunterReleased", false)
end

-- Main loop ---------------------------------------------------------------
while true do
	setPhase("Waiting")
	while #Players:GetPlayers() < Config.MinPlayers do
		task.wait(1)
	end

	setPhase("Intermission")
	local ready = true
	for t = Config.IntermissionTime, 1, -1 do
		GameState:SetAttribute("TimeLeft", t)
		task.wait(1)
		if #Players:GetPlayers() < Config.MinPlayers then
			ready = false
			break
		end
	end

	if ready then
		local ok, err = pcall(startRound)
		if ok then
			runRound()
			endRound()
		else
			warn("[Nightfall] failed to start round:", err)
			if round and round.Folder then
				round.Folder:Destroy()
			end
			round = nil
			task.wait(3)
		end
	end
end
