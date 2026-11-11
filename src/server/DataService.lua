-- Saves coins, wins and upgrades with DataStores.
-- In Studio: Game Settings > Security > "Enable Studio Access to API Services" to test saving.

local DataStoreService = game:GetService("DataStoreService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))

local DataService = {}

local store = nil
pcall(function()
	store = DataStoreService:GetDataStore(Config.DataStoreName)
end)

local cache = {} -- [player] = data

local function defaultData()
	return {
		Coins = 0,
		Wins = 0,
		Catches = 0,
		Upgrades = { Stamina = 0, Speed = 0 },
	}
end

local function key(player)
	return "u_" .. player.UserId
end

local function refresh(player)
	local data = cache[player]
	if not data then
		return
	end
	local stats = player:FindFirstChild("leaderstats")
	if stats then
		stats.Coins.Value = data.Coins
		stats.Escapes.Value = data.Wins
	end
	local up = data.Upgrades
	player:SetAttribute("StaminaLevel", up.Stamina)
	player:SetAttribute("SpeedLevel", up.Speed)
	player:SetAttribute("MaxStamina", Config.MaxStamina + up.Stamina * Config.Upgrades.Stamina.PerLevel)
	player:SetAttribute("SprintSpeed", Config.SprintSpeed + up.Speed * Config.Upgrades.Speed.PerLevel)
end

function DataService.Load(player)
	local stats = Instance.new("Folder")
	stats.Name = "leaderstats"
	local coins = Instance.new("IntValue")
	coins.Name = "Coins"
	coins.Parent = stats
	local wins = Instance.new("IntValue")
	wins.Name = "Escapes"
	wins.Parent = stats
	stats.Parent = player

	local data = defaultData()
	if store then
		local ok, result = pcall(function()
			return store:GetAsync(key(player))
		end)
		if ok and type(result) == "table" then
			data.Coins = tonumber(result.Coins) or 0
			data.Wins = tonumber(result.Wins) or 0
			data.Catches = tonumber(result.Catches) or 0
			if type(result.Upgrades) == "table" then
				data.Upgrades.Stamina = tonumber(result.Upgrades.Stamina) or 0
				data.Upgrades.Speed = tonumber(result.Upgrades.Speed) or 0
			end
		elseif not ok then
			warn("[DataService] load failed for", player.Name, result)
		end
	end
	cache[player] = data
	refresh(player)
end

function DataService.Save(player)
	local data = cache[player]
	if not data or not store then
		return
	end
	local ok, err = pcall(function()
		store:SetAsync(key(player), data)
	end)
	if not ok then
		warn("[DataService] save failed for", player.Name, err)
	end
end

function DataService.Release(player)
	DataService.Save(player)
	cache[player] = nil
end

function DataService.AddCoins(player, amount)
	local data = cache[player]
	if data then
		data.Coins += amount
		refresh(player)
	end
end

function DataService.AddWin(player)
	local data = cache[player]
	if data then
		data.Wins += 1
		refresh(player)
	end
end

function DataService.AddCatch(player)
	local data = cache[player]
	if data then
		data.Catches += 1
	end
end

function DataService.TryUpgrade(player, name)
	local data = cache[player]
	local info = Config.Upgrades[name]
	if not data or not info then
		return false, "Unknown upgrade"
	end
	local level = data.Upgrades[name]
	if level >= info.MaxLevel then
		return false, "Already maxed!"
	end
	local cost = Config.UpgradeCost(name, level)
	if data.Coins < cost then
		return false, ("Need %d more coins"):format(cost - data.Coins)
	end
	data.Coins -= cost
	data.Upgrades[name] = level + 1
	refresh(player)
	return true, ("%s upgraded to level %d!"):format(info.Label, level + 1)
end

function DataService.SaveAll()
	for player in pairs(cache) do
		task.spawn(DataService.Save, player)
	end
end

return DataService
