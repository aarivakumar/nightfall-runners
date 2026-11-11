-- Procedurally builds the lobby and a new neon city every round.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))

local MapBuilder = {}

local BUILDING_COLORS = {
	Color3.fromRGB(52, 48, 68),
	Color3.fromRGB(44, 52, 66),
	Color3.fromRGB(66, 50, 58),
	Color3.fromRGB(38, 42, 52),
	Color3.fromRGB(58, 58, 64),
}
local NEON_COLORS = {
	Color3.fromRGB(255, 70, 160),
	Color3.fromRGB(60, 220, 255),
	Color3.fromRGB(255, 200, 70),
	Color3.fromRGB(150, 90, 255),
}
local CAR_COLORS = {
	Color3.fromRGB(200, 50, 50),
	Color3.fromRGB(40, 110, 200),
	Color3.fromRGB(230, 230, 230),
	Color3.fromRGB(240, 180, 40),
	Color3.fromRGB(30, 30, 30),
}

local function newPart(parent, props)
	local p = Instance.new("Part")
	p.Anchored = true
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	for k, v in pairs(props) do
		p[k] = v
	end
	p.Parent = parent
	return p
end

local function addLight(part, color, range, brightness)
	local l = Instance.new("PointLight")
	l.Color = color
	l.Range = range
	l.Brightness = brightness
	l.Shadows = false
	l.Parent = part
	return l
end

function MapBuilder.Billboard(part, text, color, w, h, offset, alwaysOnTop, maxDistance)
	local bb = Instance.new("BillboardGui")
	bb.Size = UDim2.fromOffset(w, h)
	bb.StudsOffset = offset or Vector3.new(0, 3, 0)
	bb.AlwaysOnTop = alwaysOnTop == true
	bb.LightInfluence = 0
	if maxDistance then
		bb.MaxDistance = maxDistance
	end
	local t = Instance.new("TextLabel")
	t.Size = UDim2.fromScale(1, 1)
	t.BackgroundTransparency = 1
	t.Text = text
	t.TextColor3 = color
	t.TextScaled = true
	t.Font = Enum.Font.FredokaOne
	t.TextStrokeTransparency = 0.2
	t.Parent = bb
	bb.Parent = part
	return bb, t
end

local function pick(rng, list)
	return list[rng:NextInteger(1, #list)]
end

---------------------------------------------------------------------------
-- Lobby
---------------------------------------------------------------------------
function MapBuilder.BuildLobby(parent)
	local model = Instance.new("Model")
	model.Name = "Lobby"
	local c = Config.LobbyPosition
	local S = 90

	newPart(model, {
		Name = "Floor",
		Size = Vector3.new(S, 2, S),
		Position = c - Vector3.new(0, 1, 0),
		Material = Enum.Material.SmoothPlastic,
		Color = Color3.fromRGB(30, 28, 44),
	})
	-- neon floor grid
	for i = -2, 2 do
		local off = i * 18
		newPart(model, {
			Size = Vector3.new(0.6, 0.1, S),
			Position = c + Vector3.new(off, 0.05, 0),
			Material = Enum.Material.Neon,
			Color = Color3.fromRGB(110, 70, 220),
			CanCollide = false,
		})
		newPart(model, {
			Size = Vector3.new(S, 0.1, 0.6),
			Position = c + Vector3.new(0, 0.05, off),
			Material = Enum.Material.Neon,
			Color = Color3.fromRGB(110, 70, 220),
			CanCollide = false,
		})
	end

	-- glass walls
	local H = 16
	local walls = {
		{ Vector3.new(S, H, 1), Vector3.new(0, H / 2, S / 2) },
		{ Vector3.new(S, H, 1), Vector3.new(0, H / 2, -S / 2) },
		{ Vector3.new(1, H, S), Vector3.new(S / 2, H / 2, 0) },
		{ Vector3.new(1, H, S), Vector3.new(-S / 2, H / 2, 0) },
	}
	for _, w in ipairs(walls) do
		newPart(model, {
			Size = w[1],
			Position = c + w[2],
			Material = Enum.Material.Glass,
			Transparency = 0.65,
			Color = Color3.fromRGB(140, 110, 230),
		})
	end

	-- corner pillars
	for _, sx in ipairs({ -1, 1 }) do
		for _, sz in ipairs({ -1, 1 }) do
			local p = newPart(model, {
				Size = Vector3.new(3, H + 4, 3),
				Position = c + Vector3.new(sx * (S / 2 - 2), (H + 4) / 2, sz * (S / 2 - 2)),
				Material = Enum.Material.Neon,
				Color = Color3.fromRGB(255, 70, 160),
			})
			addLight(p, p.Color, 28, 2)
		end
	end

	local spawn = Instance.new("SpawnLocation")
	spawn.Name = "LobbySpawn"
	spawn.Anchored = true
	spawn.Size = Vector3.new(16, 1, 16)
	spawn.Position = c + Vector3.new(0, 0.5, -10)
	spawn.Material = Enum.Material.Neon
	spawn.Color = Color3.fromRGB(120, 80, 255)
	spawn.TopSurface = Enum.SurfaceType.Smooth
	spawn.Duration = 0
	spawn.Neutral = true
	spawn.Parent = model

	-- How-to-play board
	local board = newPart(model, {
		Name = "Board",
		Size = Vector3.new(44, 20, 1),
		Position = c + Vector3.new(0, 12, S / 2 - 3),
		Material = Enum.Material.SmoothPlastic,
		Color = Color3.fromRGB(15, 12, 25),
	})
	local sg = Instance.new("SurfaceGui")
	sg.Face = Enum.NormalId.Front
	sg.CanvasSize = Vector2.new(880, 400)
	sg.LightInfluence = 0
	sg.Parent = board
	local title = Instance.new("TextLabel")
	title.Size = UDim2.new(1, 0, 0.3, 0)
	title.BackgroundTransparency = 1
	title.Text = "NIGHTFALL RUNNERS"
	title.Font = Enum.Font.FredokaOne
	title.TextScaled = true
	title.TextColor3 = Color3.fromRGB(255, 90, 170)
	title.Parent = sg
	local body = Instance.new("TextLabel")
	body.Size = UDim2.new(0.92, 0, 0.66, 0)
	body.Position = UDim2.new(0.04, 0, 0.32, 0)
	body.BackgroundTransparency = 1
	body.TextWrapped = true
	body.TextScaled = true
	body.Font = Enum.Font.GothamBold
	body.TextColor3 = Color3.fromRGB(230, 225, 255)
	body.TextXAlignment = Enum.TextXAlignment.Left
	body.Text = ("🔑  Find %d keys hidden around the city\n🚪  Unlock the exit gate and ESCAPE\n👹  The Hunter is coming - don't get caught!\n🌿  Hide inside bushes  •  ⚡ Speed pads boost you\n⇧  Hold SHIFT to sprint (watch your stamina)"):format(
		Config.KeysNeeded
	)
	body.Parent = sg

	model.Parent = parent
	return model, spawn
end

---------------------------------------------------------------------------
-- City map
---------------------------------------------------------------------------
function MapBuilder.Build(rng, parent)
	local N, C = Config.GridSize, Config.CellSize
	local size = N * C
	local half = size / 2

	local model = Instance.new("Model")
	model.Name = "Map"

	local info = {
		Model = model,
		RunawaySpawns = {},
		KeySpots = {},
		PatrolPoints = {},
		Bushes = {},
		SpeedPads = {},
	}

	local function cellCenter(i, j)
		return Vector3.new(-half + (i - 0.5) * C, 0, -half + (j - 0.5) * C)
	end

	-- Ground
	newPart(model, {
		Name = "Ground",
		Size = Vector3.new(size + 60, 4, size + 60),
		Position = Vector3.new(0, -2, 0),
		Material = Enum.Material.Asphalt,
		Color = Color3.fromRGB(38, 38, 44),
	})

	-- Border walls
	local wallH, wallT = 34, 4
	local wallProps = { Material = Enum.Material.Brick, Color = Color3.fromRGB(58, 46, 66) }
	local function wall(sz, pos)
		local w = newPart(model, {
			Name = "Wall",
			Size = sz,
			Position = pos,
			Material = wallProps.Material,
			Color = wallProps.Color,
		})
		newPart(model, {
			Size = Vector3.new(sz.X + 0.2, 0.8, sz.Z + 0.2),
			Position = pos + Vector3.new(0, sz.Y / 2 - 0.4, 0),
			Material = Enum.Material.Neon,
			Color = Color3.fromRGB(255, 40, 70),
			CanCollide = false,
		})
		return w
	end
	wall(Vector3.new(size + wallT * 2, wallH, wallT), Vector3.new(0, wallH / 2, -half - wallT / 2))
	wall(Vector3.new(wallT, wallH, size), Vector3.new(half + wallT / 2, wallH / 2, 0))
	wall(Vector3.new(wallT, wallH, size), Vector3.new(-half - wallT / 2, wallH / 2, 0))

	-- North wall with the exit gap
	local gapW = 18
	local exitX = cellCenter(rng:NextInteger(3, N - 2), N).X
	local leftLen = (exitX - gapW / 2) - (-half - wallT)
	local rightLen = (half + wallT) - (exitX + gapW / 2)
	wall(Vector3.new(leftLen, wallH, wallT), Vector3.new(-half - wallT + leftLen / 2, wallH / 2, half + wallT / 2))
	wall(Vector3.new(rightLen, wallH, wallT), Vector3.new(half + wallT - rightLen / 2, wallH / 2, half + wallT / 2))

	local gate = newPart(model, {
		Name = "Gate",
		Size = Vector3.new(gapW, wallH, 1.5),
		Position = Vector3.new(exitX, wallH / 2, half + wallT / 2),
		Material = Enum.Material.ForceField,
		Color = Color3.fromRGB(255, 40, 60),
	})
	addLight(gate, gate.Color, 30, 3)
	local _, gateLabel = MapBuilder.Billboard(gate, "🔒 EXIT", Color3.fromRGB(255, 80, 90), 200, 60, Vector3.new(0, wallH / 2 + 3, 0), true)

	local exitPlate = newPart(model, {
		Name = "ExitPlate",
		Size = Vector3.new(gapW, 0.3, 14),
		Position = Vector3.new(exitX, 0.15, half + wallT + 7),
		Material = Enum.Material.Neon,
		Color = Color3.fromRGB(80, 80, 90),
		CanCollide = false,
	})
	local exitZone = newPart(model, {
		Name = "ExitZone",
		Size = Vector3.new(gapW, 12, 14),
		Position = Vector3.new(exitX, 6, half + wallT + 7),
		Transparency = 1,
		CanCollide = false,
	})

	info.Gate = gate
	info.GateLabel = gateLabel
	info.ExitPlate = exitPlate
	info.ExitZone = exitZone
	info.ExitPosition = Vector3.new(exitX, 3, half - 6)

	-- Cell layout -----------------------------------------------------------
	local midI, midJ = math.floor(N / 2), math.floor(N / 2)
	local layout = {}
	for i = 1, N do
		layout[i] = {}
		for j = 1, N do
			local t
			if j == 1 or j == N then
				t = "empty"
			elseif (i == midI or i == midI + 1) and (j == midJ or j == midJ + 1) then
				t = "lair"
			else
				local r = rng:NextNumber()
				if r < 0.36 then
					t = "building"
				elseif r < 0.5 then
					t = "crates"
				elseif r < 0.63 then
					t = "bushes"
				elseif r < 0.68 then
					t = "pad"
				else
					t = "empty"
				end
			end
			layout[i][j] = t
		end
	end

	local keyCandidates = {}

	for i = 1, N do
		for j = 1, N do
			local t = layout[i][j]
			local cc = cellCenter(i, j)

			if t == "building" then
				local w = C - rng:NextInteger(8, 11)
				local d = C - rng:NextInteger(8, 11)
				local h = rng:NextInteger(16, 50)
				newPart(model, {
					Name = "Sidewalk",
					Size = Vector3.new(w + 3, 0.3, d + 3),
					Position = cc + Vector3.new(0, 0.15, 0),
					Material = Enum.Material.Concrete,
					Color = Color3.fromRGB(90, 88, 96),
				})
				newPart(model, {
					Name = "Building",
					Size = Vector3.new(w, h, d),
					Position = cc + Vector3.new(0, h / 2, 0),
					Material = pick(rng, { Enum.Material.Concrete, Enum.Material.Brick, Enum.Material.SmoothPlastic }),
					Color = pick(rng, BUILDING_COLORS),
				})
				if rng:NextNumber() < 0.65 then
					local neon = pick(rng, NEON_COLORS)
					for y = 7, h - 4, 8 do
						newPart(model, {
							Size = Vector3.new(w + 0.2, 1, d + 0.2),
							Position = cc + Vector3.new(0, y, 0),
							Material = Enum.Material.Neon,
							Color = neon,
							Transparency = 0.15,
							CanCollide = false,
						})
					end
				end
				local roof = newPart(model, {
					Size = Vector3.new(w + 0.6, 0.6, d + 0.6),
					Position = cc + Vector3.new(0, h + 0.3, 0),
					Material = Enum.Material.Neon,
					Color = pick(rng, NEON_COLORS),
					CanCollide = false,
				})
				if rng:NextNumber() < 0.3 then
					addLight(roof, roof.Color, 40, 1.5)
				end
			elseif t == "crates" then
				local count = rng:NextInteger(2, 4)
				for _ = 1, count do
					local ang = rng:NextNumber() * math.pi * 2
					local rad = rng:NextNumber(6, 9)
					local s = rng:NextInteger(4, 5)
					local pos = cc + Vector3.new(math.cos(ang) * rad, s / 2, math.sin(ang) * rad)
					local crate = newPart(model, {
						Name = "Crate",
						Size = Vector3.new(s, s, s),
						CFrame = CFrame.new(pos) * CFrame.Angles(0, rng:NextNumber() * math.pi, 0),
						Material = Enum.Material.WoodPlanks,
						Color = Color3.fromRGB(150, 105, 60),
					})
					if rng:NextNumber() < 0.3 then
						newPart(model, {
							Name = "Crate",
							Size = Vector3.new(s - 1, s - 1, s - 1),
							CFrame = crate.CFrame * CFrame.new(0, s - 0.5, 0) * CFrame.Angles(0, 0.4, 0),
							Material = Enum.Material.WoodPlanks,
							Color = Color3.fromRGB(130, 90, 50),
						})
					end
				end
				table.insert(keyCandidates, cc)
				table.insert(info.PatrolPoints, cc)
			elseif t == "bushes" then
				local count = rng:NextInteger(2, 3)
				for k = 1, count do
					local ang = (k / count) * math.pi * 2 + rng:NextNumber()
					local rad = rng:NextNumber(3, 7)
					local pos = cc + Vector3.new(math.cos(ang) * rad, 3.2, math.sin(ang) * rad)
					local bush = newPart(model, {
						Name = "Bush",
						Shape = Enum.PartType.Ball,
						Size = Vector3.new(9.5, 9.5, 9.5),
						Position = pos,
						Material = Enum.Material.Grass,
						Color = Color3.fromRGB(40, rng:NextInteger(95, 130), 50),
						CanCollide = false,
						CanQuery = false,
						Transparency = 0.05,
					})
					table.insert(info.Bushes, { Position = bush.Position, Radius = 4.3 })
				end
				table.insert(info.PatrolPoints, cc)
			elseif t == "pad" then
				local pad = newPart(model, {
					Name = "SpeedPad",
					Size = Vector3.new(9, 0.4, 9),
					Position = cc + Vector3.new(0, 0.2, 0),
					Material = Enum.Material.Neon,
					Color = Color3.fromRGB(60, 230, 255),
					CanCollide = false,
				})
				addLight(pad, pad.Color, 16, 2)
				local sg = Instance.new("SurfaceGui")
				sg.Face = Enum.NormalId.Top
				sg.LightInfluence = 0
				sg.Parent = pad
				local lbl = Instance.new("TextLabel")
				lbl.Size = UDim2.fromScale(1, 1)
				lbl.BackgroundTransparency = 1
				lbl.Text = "⚡"
				lbl.TextScaled = true
				lbl.TextColor3 = Color3.new(1, 1, 1)
				lbl.Parent = sg
				table.insert(info.SpeedPads, pad)
				table.insert(info.PatrolPoints, cc)
			elseif t == "empty" then
				local roll = rng:NextNumber()
				if roll < 0.35 then
					-- street lamp
					local base = cc + Vector3.new(C / 2 - 4, 0, C / 2 - 4)
					newPart(model, {
						Name = "LampPost",
						Size = Vector3.new(0.8, 14, 0.8),
						Position = base + Vector3.new(0, 7, 0),
						Material = Enum.Material.Metal,
						Color = Color3.fromRGB(30, 30, 34),
					})
					local head = newPart(model, {
						Size = Vector3.new(2.4, 0.8, 2.4),
						Position = base + Vector3.new(0, 14.2, 0),
						Material = Enum.Material.Neon,
						Color = Color3.fromRGB(255, 210, 140),
						CanCollide = false,
					})
					addLight(head, Color3.fromRGB(255, 200, 130), 34, 2.2)
				elseif roll < 0.6 and j > 1 and j < N then
					-- parked car
					local side = rng:NextNumber() < 0.5 and -1 or 1
					local carCF = CFrame.new(cc + Vector3.new(side * 7, 0, 0)) * CFrame.Angles(0, rng:NextNumber(-0.2, 0.2), 0)
					local color = pick(rng, CAR_COLORS)
					newPart(model, {
						Name = "Car",
						Size = Vector3.new(5, 2.6, 11),
						CFrame = carCF * CFrame.new(0, 1.7, 0),
						Material = Enum.Material.SmoothPlastic,
						Color = color,
					})
					newPart(model, {
						Name = "Car",
						Size = Vector3.new(4.6, 2, 5.5),
						CFrame = carCF * CFrame.new(0, 4, 0.5),
						Material = Enum.Material.Glass,
						Transparency = 0.3,
						Color = Color3.fromRGB(30, 40, 60),
					})
					for _, x in ipairs({ -1.8, 1.8 }) do
						local light = newPart(model, {
							Size = Vector3.new(1, 0.6, 0.2),
							CFrame = carCF * CFrame.new(x, 2, -5.55),
							Material = Enum.Material.Neon,
							Color = Color3.fromRGB(255, 250, 210),
							CanCollide = false,
						})
						if x > 0 then
							addLight(light, light.Color, 14, 1)
						end
					end
				end
				if j > 1 and j < N then
					table.insert(keyCandidates, cc)
				end
				table.insert(info.PatrolPoints, cc)
			end

			if j == 1 and i > 1 and i < N then
				table.insert(info.RunawaySpawns, CFrame.new(cc + Vector3.new(0, 4, 0)) * CFrame.Angles(0, math.pi, 0))
			end
		end
	end

	-- Start line
	newPart(model, {
		Size = Vector3.new(size, 0.1, 1.5),
		Position = Vector3.new(0, 0.05, -half + C),
		Material = Enum.Material.Neon,
		Color = Color3.fromRGB(120, 255, 140),
		CanCollide = false,
	})

	-- Hunter lair (center)
	local lairPos = cellCenter(midI, midJ) + Vector3.new(C / 2, 0, C / 2)
	local lairFloor = newPart(model, {
		Name = "Lair",
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(0.4, 26, 26),
		CFrame = CFrame.new(lairPos + Vector3.new(0, 0.2, 0)) * CFrame.Angles(0, 0, math.rad(90)),
		Material = Enum.Material.Slate,
		Color = Color3.fromRGB(45, 10, 15),
	})
	newPart(model, {
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(0.45, 20, 20),
		CFrame = lairFloor.CFrame,
		Material = Enum.Material.Neon,
		Color = Color3.fromRGB(200, 20, 40),
		CanCollide = false,
	})
	for k = 1, 6 do
		local a = k / 6 * math.pi * 2
		local p = newPart(model, {
			Size = Vector3.new(1.2, 9, 1.2),
			Position = lairPos + Vector3.new(math.cos(a) * 12, 4.5, math.sin(a) * 12),
			Material = Enum.Material.Neon,
			Color = Color3.fromRGB(255, 30, 50),
		})
		if k % 2 == 0 then
			addLight(p, p.Color, 24, 2)
		end
	end
	info.HunterSpawn = CFrame.new(lairPos + Vector3.new(0, 5, 0))
	table.insert(info.PatrolPoints, lairPos)

	-- Pick key spots, spread out
	for idx = #keyCandidates, 2, -1 do
		local swap = rng:NextInteger(1, idx)
		keyCandidates[idx], keyCandidates[swap] = keyCandidates[swap], keyCandidates[idx]
	end
	local minSpacing = C * 2.2
	for pass = 1, 3 do
		for _, cand in ipairs(keyCandidates) do
			if #info.KeySpots >= Config.KeysToSpawn then
				break
			end
			local ok = true
			for _, chosen in ipairs(info.KeySpots) do
				if (chosen - cand).Magnitude < minSpacing then
					ok = false
					break
				end
			end
			if ok and (cand - lairPos).Magnitude > C then
				table.insert(info.KeySpots, cand + Vector3.new(0, 3, 0))
			end
		end
		minSpacing *= 0.6
	end

	info.Bounds = { Half = half }
	model.Parent = parent
	return info
end

return MapBuilder
