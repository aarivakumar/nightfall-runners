-- Nightfall Runners :: client (HUD, sprint/stamina, effects, spectate, shop)

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local ContextActionService = game:GetService("ContextActionService")
local TweenService = game:GetService("TweenService")
local CollectionService = game:GetService("CollectionService")
local Lighting = game:GetService("Lighting")

local player = Players.LocalPlayer
local camera = workspace.CurrentCamera

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local GameState = ReplicatedStorage:WaitForChild("GameState")
local HuntersFolder = workspace:WaitForChild("Hunters")

---------------------------------------------------------------------------
-- UI helpers
---------------------------------------------------------------------------
local FONT = Enum.Font.FredokaOne
local FONT_BODY = Enum.Font.GothamBold
local PANEL = Color3.fromRGB(18, 14, 30)
local ACCENT = Color3.fromRGB(150, 100, 255)

local function make(class, props, children)
	local inst = Instance.new(class)
	for k, v in pairs(props or {}) do
		if k ~= "Parent" then
			inst[k] = v
		end
	end
	for _, child in ipairs(children or {}) do
		child.Parent = inst
	end
	if props and props.Parent then
		inst.Parent = props.Parent
	end
	return inst
end

local function corner(r)
	return make("UICorner", { CornerRadius = UDim.new(0, r or 12) })
end

local function stroke(color, thickness, transparency)
	return make("UIStroke", {
		Color = color or ACCENT,
		Thickness = thickness or 2,
		Transparency = transparency or 0.3,
		ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
	})
end

local function label(props)
	props.BackgroundTransparency = props.BackgroundTransparency or 1
	props.Font = props.Font or FONT
	props.TextColor3 = props.TextColor3 or Color3.new(1, 1, 1)
	props.TextScaled = props.TextScaled ~= false
	return make("TextLabel", props)
end

local gui = make("ScreenGui", {
	Name = "NightfallHUD",
	ResetOnSpawn = false,
	IgnoreGuiInset = true,
	ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
	Parent = player:WaitForChild("PlayerGui"),
})

---------------------------------------------------------------------------
-- Danger vignette (red edges)
---------------------------------------------------------------------------
local vignette = make("Frame", {
	Name = "Vignette",
	Size = UDim2.fromScale(1, 1),
	BackgroundTransparency = 1,
	ZIndex = 0,
	Parent = gui,
})
local vignetteEdges = {}
local function edge(size, pos, rotation)
	local f = make("Frame", {
		Size = size,
		Position = pos,
		BackgroundColor3 = Color3.fromRGB(200, 0, 20),
		BorderSizePixel = 0,
		BackgroundTransparency = 1,
		Parent = vignette,
	}, {
		make("UIGradient", {
			Rotation = rotation,
			Transparency = NumberSequence.new({
				NumberSequenceKeypoint.new(0, 0),
				NumberSequenceKeypoint.new(1, 1),
			}),
		}),
	})
	table.insert(vignetteEdges, f)
end
edge(UDim2.fromScale(1, 0.3), UDim2.fromScale(0, 0), 90)
edge(UDim2.fromScale(1, 0.3), UDim2.fromScale(0, 0.7), -90)
edge(UDim2.fromScale(0.25, 1), UDim2.fromScale(0, 0), 0)
edge(UDim2.fromScale(0.25, 1), UDim2.fromScale(0.75, 0), 180)

local flash = make("Frame", {
	Size = UDim2.fromScale(1, 1),
	BackgroundColor3 = Color3.new(1, 1, 1),
	BackgroundTransparency = 1,
	BorderSizePixel = 0,
	ZIndex = 50,
	Parent = gui,
})

---------------------------------------------------------------------------
-- Top status bar
---------------------------------------------------------------------------
local top = make("Frame", {
	Name = "Top",
	AnchorPoint = Vector2.new(0.5, 0),
	Position = UDim2.new(0.5, 0, 0, 14),
	Size = UDim2.fromOffset(330, 74),
	BackgroundColor3 = PANEL,
	BackgroundTransparency = 0.15,
	Parent = gui,
}, { corner(16), stroke(ACCENT, 2, 0.4) })

local phaseLabel = label({
	Size = UDim2.new(1, -20, 0, 20),
	Position = UDim2.fromOffset(10, 8),
	Text = "WAITING FOR PLAYERS",
	TextColor3 = Color3.fromRGB(200, 180, 255),
	Font = FONT_BODY,
	Parent = top,
})
local timerLabel = label({
	Size = UDim2.new(1, -20, 0, 38),
	Position = UDim2.fromOffset(10, 28),
	Text = "",
	Parent = top,
})

local pills = make("Frame", {
	AnchorPoint = Vector2.new(0.5, 0),
	Position = UDim2.new(0.5, 0, 0, 94),
	Size = UDim2.fromOffset(330, 34),
	BackgroundTransparency = 1,
	Visible = false,
	Parent = gui,
}, {
	make("UIListLayout", {
		FillDirection = Enum.FillDirection.Horizontal,
		HorizontalAlignment = Enum.HorizontalAlignment.Center,
		Padding = UDim.new(0, 8),
	}),
})
local function pill(text, color)
	local f = make("Frame", {
		Size = UDim2.fromOffset(150, 34),
		BackgroundColor3 = PANEL,
		BackgroundTransparency = 0.15,
		Parent = pills,
	}, { corner(17), stroke(color, 2, 0.3) })
	local l = label({
		Size = UDim2.new(1, -12, 1, -8),
		Position = UDim2.fromOffset(6, 4),
		Text = text,
		TextColor3 = color,
		Parent = f,
	})
	return f, l
end
local keysPill, keysLabel = pill("🔑 0 / 5", Color3.fromRGB(255, 215, 80))
local _, runnersLabel = pill("🏃 0 left", Color3.fromRGB(140, 220, 255))

---------------------------------------------------------------------------
-- Role badge + stamina
---------------------------------------------------------------------------
local bottom = make("Frame", {
	AnchorPoint = Vector2.new(0.5, 1),
	Position = UDim2.new(0.5, 0, 1, -24),
	Size = UDim2.fromOffset(320, 70),
	BackgroundTransparency = 1,
	Parent = gui,
})
local roleLabel = label({
	Size = UDim2.new(1, 0, 0, 24),
	Text = "",
	Parent = bottom,
})
local hiddenLabel = label({
	AnchorPoint = Vector2.new(0.5, 1),
	Position = UDim2.new(0.5, 0, 0, -4),
	Size = UDim2.fromOffset(200, 28),
	Text = "🌿 HIDDEN",
	TextColor3 = Color3.fromRGB(120, 255, 140),
	Visible = false,
	Parent = bottom,
})
local staminaBack = make("Frame", {
	Position = UDim2.fromOffset(0, 32),
	Size = UDim2.new(1, 0, 0, 18),
	BackgroundColor3 = PANEL,
	BackgroundTransparency = 0.1,
	Parent = bottom,
}, { corner(9), stroke(Color3.fromRGB(80, 200, 255), 2, 0.4) })
local staminaFill = make("Frame", {
	Size = UDim2.fromScale(1, 1),
	BackgroundColor3 = Color3.fromRGB(80, 210, 255),
	BorderSizePixel = 0,
	Parent = staminaBack,
}, {
	corner(9),
	make("UIGradient", {
		Color = ColorSequence.new(Color3.fromRGB(255, 255, 255), Color3.fromRGB(190, 190, 190)),
		Rotation = 90,
	}),
})
local staminaText = label({
	Size = UDim2.fromScale(1, 1),
	Text = "STAMINA",
	Font = FONT_BODY,
	TextColor3 = Color3.fromRGB(255, 255, 255),
	TextStrokeTransparency = 0.5,
	ZIndex = 3,
	Parent = staminaBack,
})

---------------------------------------------------------------------------
-- Toast notifications
---------------------------------------------------------------------------
local toastHolder = make("Frame", {
	AnchorPoint = Vector2.new(1, 0),
	Position = UDim2.new(1, -16, 0, 80),
	Size = UDim2.fromOffset(330, 400),
	BackgroundTransparency = 1,
	Parent = gui,
}, {
	make("UIListLayout", {
		Padding = UDim.new(0, 6),
		HorizontalAlignment = Enum.HorizontalAlignment.Right,
		SortOrder = Enum.SortOrder.LayoutOrder,
	}),
})
local toastCount = 0
local function toast(text, color)
	toastCount += 1
	local f = make("Frame", {
		Size = UDim2.fromOffset(330, 36),
		BackgroundColor3 = PANEL,
		BackgroundTransparency = 0.15,
		LayoutOrder = toastCount,
		Parent = toastHolder,
	}, { corner(10), stroke(color, 2, 0.4) })
	local l = label({
		Size = UDim2.new(1, -16, 1, -10),
		Position = UDim2.fromOffset(8, 5),
		Text = text,
		Font = FONT_BODY,
		TextColor3 = color,
		TextXAlignment = Enum.TextXAlignment.Left,
		Parent = f,
	})
	local items = toastHolder:GetChildren()
	local frames = {}
	for _, c in ipairs(items) do
		if c:IsA("Frame") then
			table.insert(frames, c)
		end
	end
	if #frames > 6 then
		table.sort(frames, function(a, b)
			return a.LayoutOrder < b.LayoutOrder
		end)
		frames[1]:Destroy()
	end
	task.delay(5, function()
		if f.Parent then
			TweenService:Create(f, TweenInfo.new(0.4), { BackgroundTransparency = 1 }):Play()
			TweenService:Create(l, TweenInfo.new(0.4), { TextTransparency = 1 }):Play()
			task.wait(0.45)
			f:Destroy()
		end
	end)
end

---------------------------------------------------------------------------
-- Splash (big center text)
---------------------------------------------------------------------------
local splashFrame = make("Frame", {
	AnchorPoint = Vector2.new(0.5, 0.5),
	Position = UDim2.fromScale(0.5, 0.36),
	Size = UDim2.fromOffset(700, 130),
	BackgroundTransparency = 1,
	Visible = false,
	Parent = gui,
})
local splashTitle = label({
	Size = UDim2.new(1, 0, 0, 80),
	Text = "",
	TextStrokeTransparency = 0,
	TextStrokeColor3 = Color3.fromRGB(20, 0, 30),
	Parent = splashFrame,
})
local splashSub = label({
	Position = UDim2.fromOffset(0, 84),
	Size = UDim2.new(1, 0, 0, 30),
	Text = "",
	Font = FONT_BODY,
	TextStrokeTransparency = 0.3,
	Parent = splashFrame,
})
local splashScale = make("UIScale", { Parent = splashFrame })
local splashToken = 0
local function showSplash(title, sub, color)
	splashToken += 1
	local token = splashToken
	splashTitle.Text = title
	splashTitle.TextColor3 = color or Color3.new(1, 1, 1)
	splashSub.Text = sub or ""
	splashTitle.TextTransparency = 0
	splashSub.TextTransparency = 0
	splashTitle.TextStrokeTransparency = 0
	splashFrame.Visible = true
	splashScale.Scale = 1.5
	TweenService:Create(splashScale, TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out), { Scale = 1 }):Play()
	task.delay(3.2, function()
		if token ~= splashToken then
			return
		end
		local ti = TweenInfo.new(0.5)
		TweenService:Create(splashTitle, ti, { TextTransparency = 1, TextStrokeTransparency = 1 }):Play()
		TweenService:Create(splashSub, ti, { TextTransparency = 1 }):Play()
		task.wait(0.5)
		if token == splashToken then
			splashFrame.Visible = false
		end
	end)
end

---------------------------------------------------------------------------
-- Buttons: shop, sprint (touch), spectate
---------------------------------------------------------------------------
local function button(props, text, color)
	local b = make("TextButton", {
		Size = props.Size,
		Position = props.Position,
		AnchorPoint = props.AnchorPoint or Vector2.zero,
		BackgroundColor3 = color or PANEL,
		BackgroundTransparency = props.BackgroundTransparency or 0.1,
		Text = text,
		Font = FONT,
		TextScaled = true,
		TextColor3 = Color3.new(1, 1, 1),
		AutoButtonColor = true,
		Visible = props.Visible ~= false,
		Parent = props.Parent or gui,
	}, { corner(12), stroke(Color3.new(1, 1, 1), 2, 0.6), make("UIPadding", {
		PaddingTop = UDim.new(0, 6),
		PaddingBottom = UDim.new(0, 6),
		PaddingLeft = UDim.new(0, 8),
		PaddingRight = UDim.new(0, 8),
	}) })
	return b
end

local shopButton = button({
	Size = UDim2.fromOffset(120, 44),
	Position = UDim2.new(0, 16, 0.5, -22),
}, "🛒 SHOP", Color3.fromRGB(110, 60, 220))

local sprintButton = button({
	Size = UDim2.fromOffset(96, 96),
	AnchorPoint = Vector2.new(1, 1),
	Position = UDim2.new(1, -24, 1, -170),
	Visible = UserInputService.TouchEnabled,
}, "SPRINT", Color3.fromRGB(40, 150, 220))

local spectateBar = make("Frame", {
	AnchorPoint = Vector2.new(0.5, 1),
	Position = UDim2.new(0.5, 0, 1, -110),
	Size = UDim2.fromOffset(420, 50),
	BackgroundTransparency = 1,
	Visible = false,
	Parent = gui,
})
local specPrev = button({ Size = UDim2.fromOffset(50, 50), Parent = spectateBar }, "◀")
local specNext = button({ Size = UDim2.fromOffset(50, 50), Position = UDim2.new(1, -50, 0, 0), Parent = spectateBar }, "▶")
local specLabel = label({
	Position = UDim2.fromOffset(58, 0),
	Size = UDim2.new(1, -116, 1, 0),
	Text = "SPECTATE",
	Parent = spectateBar,
})
local specButton = button({
	Size = UDim2.fromOffset(140, 44),
	AnchorPoint = Vector2.new(0.5, 1),
	Position = UDim2.new(0.5, 0, 1, -170),
	Visible = false,
}, "👁 SPECTATE", Color3.fromRGB(60, 60, 90))

---------------------------------------------------------------------------
-- Shop panel
---------------------------------------------------------------------------
local shop = make("Frame", {
	AnchorPoint = Vector2.new(0.5, 0.5),
	Position = UDim2.fromScale(0.5, 0.5),
	Size = UDim2.fromOffset(420, 330),
	BackgroundColor3 = PANEL,
	Visible = false,
	ZIndex = 20,
	Parent = gui,
}, { corner(18), stroke(ACCENT, 3, 0.2) })
label({ Size = UDim2.new(1, -40, 0, 44), Position = UDim2.fromOffset(20, 12), Text = "UPGRADE SHOP", ZIndex = 21, Parent = shop })
local coinsLabel = label({
	Size = UDim2.new(1, -40, 0, 26),
	Position = UDim2.fromOffset(20, 56),
	Text = "🪙 0",
	TextColor3 = Color3.fromRGB(255, 215, 80),
	ZIndex = 21,
	Parent = shop,
})
local closeShop = button({ Size = UDim2.fromOffset(40, 40), Position = UDim2.new(1, -52, 0, 12), Parent = shop }, "✕", Color3.fromRGB(180, 50, 70))
closeShop.ZIndex = 22

local shopRows = {}
local function shopRow(name, y)
	local info = Config.Upgrades[name]
	local row = make("Frame", {
		Position = UDim2.fromOffset(20, y),
		Size = UDim2.new(1, -40, 0, 96),
		BackgroundColor3 = Color3.fromRGB(34, 28, 54),
		ZIndex = 21,
		Parent = shop,
	}, { corner(12) })
	local title = label({ Position = UDim2.fromOffset(12, 8), Size = UDim2.new(0.6, 0, 0, 30), Text = info.Label, TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 22, Parent = row })
	local desc = label({
		Position = UDim2.fromOffset(12, 40),
		Size = UDim2.new(0.6, 0, 0, 20),
		Text = info.Desc,
		Font = FONT_BODY,
		TextColor3 = Color3.fromRGB(190, 180, 220),
		TextXAlignment = Enum.TextXAlignment.Left,
		ZIndex = 22,
		Parent = row,
	})
	local level = label({
		Position = UDim2.fromOffset(12, 64),
		Size = UDim2.new(0.6, 0, 0, 22),
		Text = "",
		TextColor3 = Color3.fromRGB(120, 220, 255),
		TextXAlignment = Enum.TextXAlignment.Left,
		ZIndex = 22,
		Parent = row,
	})
	local buy = button({
		AnchorPoint = Vector2.new(1, 0.5),
		Position = UDim2.new(1, -12, 0.5, 0),
		Size = UDim2.fromOffset(120, 50),
		Parent = row,
	}, "BUY", Color3.fromRGB(60, 180, 90))
	buy.ZIndex = 22
	shopRows[name] = { Level = level, Buy = buy, Title = title, Desc = desc }
	buy.MouseButton1Click:Connect(function()
		local ok, msg = Remotes.BuyUpgrade:InvokeServer(name)
		toast(msg or "", ok and Color3.fromRGB(120, 255, 140) or Color3.fromRGB(255, 110, 110))
	end)
end
shopRow("Stamina", 96)
shopRow("Speed", 204)

local function refreshShop()
	local stats = player:FindFirstChild("leaderstats")
	local coins = stats and stats:FindFirstChild("Coins")
	coinsLabel.Text = "🪙 " .. (coins and coins.Value or 0)
	for name, row in pairs(shopRows) do
		local lvl = player:GetAttribute(name .. "Level") or 0
		local info = Config.Upgrades[name]
		local pips = string.rep("■", lvl) .. string.rep("□", info.MaxLevel - lvl)
		row.Level.Text = pips
		if lvl >= info.MaxLevel then
			row.Buy.Text = "MAXED"
			row.Buy.BackgroundColor3 = Color3.fromRGB(90, 90, 110)
		else
			row.Buy.Text = "🪙 " .. Config.UpgradeCost(name, lvl)
			row.Buy.BackgroundColor3 = Color3.fromRGB(60, 180, 90)
		end
	end
end

shopButton.MouseButton1Click:Connect(function()
	shop.Visible = not shop.Visible
	refreshShop()
end)
closeShop.MouseButton1Click:Connect(function()
	shop.Visible = false
end)
player:GetAttributeChangedSignal("StaminaLevel"):Connect(refreshShop)
player:GetAttributeChangedSignal("SpeedLevel"):Connect(refreshShop)
task.spawn(function()
	local stats = player:WaitForChild("leaderstats", 30)
	if stats then
		stats:WaitForChild("Coins").Changed:Connect(refreshShop)
		refreshShop()
	end
end)

---------------------------------------------------------------------------
-- Sprint + stamina
---------------------------------------------------------------------------
local sprintHeld = false
local stamina = Config.MaxStamina
local exhausted = false

local function onSprint(_, state)
	if state == Enum.UserInputState.Begin then
		sprintHeld = true
	elseif state == Enum.UserInputState.End or state == Enum.UserInputState.Cancel then
		sprintHeld = false
	end
	return Enum.ContextActionResult.Pass
end
ContextActionService:BindAction("Sprint", onSprint, false, Enum.KeyCode.LeftShift, Enum.KeyCode.RightShift, Enum.KeyCode.ButtonL3)

sprintButton.MouseButton1Down:Connect(function()
	sprintHeld = not sprintHeld
	sprintButton.BackgroundColor3 = sprintHeld and Color3.fromRGB(255, 160, 40) or Color3.fromRGB(40, 150, 220)
end)

---------------------------------------------------------------------------
-- Spectating
---------------------------------------------------------------------------
local spectating = false
local specIndex = 1

local function spectateTargets()
	local list = {}
	for _, p in ipairs(Players:GetPlayers()) do
		local role = p:GetAttribute("Role")
		if p ~= player and (role == "Runaway" or role == "Hunter") and p.Character and p.Character:FindFirstChildOfClass("Humanoid") then
			table.insert(list, p)
		end
	end
	return list
end

local function stopSpectate()
	spectating = false
	spectateBar.Visible = false
	local char = player.Character
	local hum = char and char:FindFirstChildOfClass("Humanoid")
	if hum then
		camera.CameraSubject = hum
	end
end

local function updateSpectate()
	if not spectating then
		return
	end
	local list = spectateTargets()
	if #list == 0 then
		specLabel.Text = "Nobody to watch"
		stopSpectate()
		return
	end
	specIndex = ((specIndex - 1) % #list) + 1
	local target = list[specIndex]
	local hum = target.Character:FindFirstChildOfClass("Humanoid")
	camera.CameraSubject = hum
	local role = target:GetAttribute("Role")
	specLabel.Text = (role == "Hunter" and "👹 " or "🏃 ") .. target.DisplayName
end

specButton.MouseButton1Click:Connect(function()
	if spectating then
		stopSpectate()
	else
		spectating = true
		spectateBar.Visible = true
		updateSpectate()
	end
end)
specPrev.MouseButton1Click:Connect(function()
	specIndex -= 1
	updateSpectate()
end)
specNext.MouseButton1Click:Connect(function()
	specIndex += 1
	updateSpectate()
end)

---------------------------------------------------------------------------
-- State -> UI
---------------------------------------------------------------------------
local function fmtTime(t)
	t = math.max(0, math.floor(t))
	return ("%d:%02d"):format(t // 60, t % 60)
end

local function refreshRole()
	local role = player:GetAttribute("Role") or "Lobby"
	local phase = GameState:GetAttribute("Phase")
	if role == "Runaway" then
		roleLabel.Text = "🏃 RUNAWAY"
		roleLabel.TextColor3 = Color3.fromRGB(140, 220, 255)
	elseif role == "Hunter" then
		roleLabel.Text = "👹 HUNTER"
		roleLabel.TextColor3 = Color3.fromRGB(255, 80, 90)
	elseif role == "Caught" then
		roleLabel.Text = "💀 CAUGHT"
		roleLabel.TextColor3 = Color3.fromRGB(200, 120, 120)
	elseif role == "Escaped" then
		roleLabel.Text = "🏁 ESCAPED"
		roleLabel.TextColor3 = Color3.fromRGB(120, 255, 140)
	else
		roleLabel.Text = "LOBBY"
		roleLabel.TextColor3 = Color3.fromRGB(200, 180, 255)
	end
	staminaBack.Visible = role ~= "Hunter"
	local canSpectate = phase == "Round" and role ~= "Runaway" and role ~= "Hunter"
	specButton.Visible = canSpectate
	if not canSpectate and spectating then
		stopSpectate()
	end
	sprintButton.Visible = UserInputService.TouchEnabled and role ~= "Hunter"
	shopButton.Visible = role ~= "Runaway" and role ~= "Hunter"
	if not shopButton.Visible then
		shop.Visible = false
	end
end

local function refreshState()
	local phase = GameState:GetAttribute("Phase")
	local timeLeft = GameState:GetAttribute("TimeLeft") or 0
	local keys = GameState:GetAttribute("KeysCollected") or 0
	local needed = GameState:GetAttribute("KeysNeeded") or Config.KeysNeeded
	local exitOpen = GameState:GetAttribute("ExitOpen")

	pills.Visible = phase == "Round"
	if phase == "Waiting" then
		phaseLabel.Text = "WAITING FOR PLAYERS"
		timerLabel.Text = "..."
	elseif phase == "Intermission" then
		phaseLabel.Text = "NEXT ROUND IN"
		timerLabel.Text = tostring(timeLeft)
		timerLabel.TextColor3 = Color3.new(1, 1, 1)
	elseif phase == "Round" then
		local elapsed = Config.RoundTime - timeLeft
		local release = Config.HunterReleaseDelay - elapsed
		if not GameState:GetAttribute("HunterReleased") and release > 0 then
			phaseLabel.Text = "HUNTER RELEASED IN"
			timerLabel.Text = tostring(math.ceil(release))
			timerLabel.TextColor3 = Color3.fromRGB(255, 200, 90)
		else
			phaseLabel.Text = exitOpen and "🚪 EXIT OPEN - RUN!" or "FIND THE KEYS"
			timerLabel.Text = fmtTime(timeLeft)
			timerLabel.TextColor3 = timeLeft <= Config.FrenzyTime and Color3.fromRGB(255, 70, 80) or Color3.new(1, 1, 1)
		end
		keysLabel.Text = ("🔑 %d / %d"):format(math.min(keys, needed), needed)
		keysLabel.TextColor3 = exitOpen and Color3.fromRGB(120, 255, 140) or Color3.fromRGB(255, 215, 80)
		runnersLabel.Text = ("🏃 %d left"):format(GameState:GetAttribute("RunawaysLeft") or 0)
	elseif phase == "Ending" then
		phaseLabel.Text = "ROUND OVER"
		timerLabel.Text = "GG"
	end
	refreshRole()
end

for _, attr in ipairs({ "Phase", "TimeLeft", "KeysCollected", "ExitOpen", "RunawaysLeft", "HunterReleased" }) do
	GameState:GetAttributeChangedSignal(attr):Connect(refreshState)
end
player:GetAttributeChangedSignal("Role"):Connect(function()
	refreshState()
	local role = player:GetAttribute("Role")
	if role == "Runaway" then
		stamina = player:GetAttribute("MaxStamina") or Config.MaxStamina
		exhausted = false
	end
end)
player:GetAttributeChangedSignal("Hidden"):Connect(function()
	hiddenLabel.Visible = player:GetAttribute("Hidden") == true
end)
refreshState()

local lastKeys = 0
GameState:GetAttributeChangedSignal("KeysCollected"):Connect(function()
	local k = GameState:GetAttribute("KeysCollected") or 0
	if k > lastKeys then
		keysPill.Size = UDim2.fromOffset(170, 40)
		TweenService:Create(keysPill, TweenInfo.new(0.3, Enum.EasingStyle.Back), { Size = UDim2.fromOffset(150, 34) }):Play()
	end
	lastKeys = k
end)

Remotes.Notify.OnClientEvent:Connect(toast)
Remotes.Splash.OnClientEvent:Connect(showSplash)

---------------------------------------------------------------------------
-- Effects
---------------------------------------------------------------------------
local shake = 0
local function flashScreen(color, from)
	flash.BackgroundColor3 = color
	flash.BackgroundTransparency = from or 0.4
	TweenService:Create(flash, TweenInfo.new(0.6), { BackgroundTransparency = 1 }):Play()
end

local function burst(position, color)
	local p = Instance.new("Part")
	p.Anchored = true
	p.CanCollide = false
	p.CanQuery = false
	p.CastShadow = false
	p.Shape = Enum.PartType.Ball
	p.Material = Enum.Material.Neon
	p.Color = color
	p.Size = Vector3.new(1, 1, 1)
	p.Position = position
	p.Parent = workspace
	TweenService:Create(p, TweenInfo.new(0.6, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
		Size = Vector3.new(14, 14, 14),
		Transparency = 1,
	}):Play()
	game:GetService("Debris"):AddItem(p, 0.7)
end

Remotes.Effect.OnClientEvent:Connect(function(kind, position)
	if kind == "Key" then
		burst(position, Color3.fromRGB(255, 210, 70))
		flashScreen(Color3.fromRGB(255, 220, 100), 0.75)
	elseif kind == "Caught" then
		burst(position, Color3.fromRGB(255, 30, 50))
		local char = player.Character
		local root = char and char:FindFirstChild("HumanoidRootPart")
		if root and (root.Position - position).Magnitude < 60 then
			shake = 1
		end
		if player:GetAttribute("Role") == "Caught" then
			flashScreen(Color3.fromRGB(255, 0, 0), 0.2)
		end
	elseif kind == "Release" then
		shake = 0.6
		flashScreen(Color3.fromRGB(200, 0, 20), 0.6)
	elseif kind == "ExitOpen" then
		flashScreen(Color3.fromRGB(100, 255, 140), 0.6)
	elseif kind == "Escaped" then
		flashScreen(Color3.fromRGB(255, 255, 255), 0)
	elseif kind == "Boost" then
		flashScreen(Color3.fromRGB(80, 220, 255), 0.7)
		toast("⚡ SPEED BOOST!", Color3.fromRGB(80, 220, 255))
	end
end)

---------------------------------------------------------------------------
-- Per-frame: sprint, danger, hunter animation, key spin, camera
---------------------------------------------------------------------------
local baseFov = 70
local currentFov = baseFov
local animT = 0

local function hunterRoots()
	local list = {}
	for _, model in ipairs(HuntersFolder:GetChildren()) do
		local r = model:FindFirstChild("HumanoidRootPart")
		if r then
			table.insert(list, r)
		end
	end
	for _, p in ipairs(Players:GetPlayers()) do
		if p ~= player and p:GetAttribute("Role") == "Hunter" and p.Character then
			local r = p.Character:FindFirstChild("HumanoidRootPart")
			if r then
				table.insert(list, r)
			end
		end
	end
	return list
end

local function animateHunter(model, t)
	local root = model:FindFirstChild("HumanoidRootPart")
	local torso = model:FindFirstChild("Torso")
	if not root or not torso then
		return
	end
	local speed = (root.AssemblyLinearVelocity * Vector3.new(1, 0, 1)).Magnitude
	local amt = math.clamp(speed / 18, 0, 1.2)
	local swing = math.sin(t * (6 + speed * 0.35)) * 0.9 * amt
	local chasing = model:GetAttribute("Chasing")
	local function set(name, cf)
		local m = torso:FindFirstChild(name)
		if m then
			m.Transform = cf
		end
	end
	set("Left Hip", CFrame.Angles(swing, 0, 0))
	set("Right Hip", CFrame.Angles(-swing, 0, 0))
	if chasing then
		-- arms reaching forward while chasing
		set("Left Shoulder", CFrame.Angles(math.rad(80) + swing * 0.2, 0, 0))
		set("Right Shoulder", CFrame.Angles(math.rad(80) - swing * 0.2, 0, 0))
	else
		set("Left Shoulder", CFrame.Angles(-swing * 0.8, 0, 0))
		set("Right Shoulder", CFrame.Angles(swing * 0.8, 0, 0))
	end
	set("Neck", CFrame.Angles(math.sin(t * 1.7) * 0.15, math.sin(t * 0.9) * 0.4, 0))
	local root2 = root:FindFirstChild("RootJoint")
	if root2 then
		root2.Transform = CFrame.Angles(chasing and -0.25 or -0.08, 0, 0)
	end
end

local keyBase = {}

RunService.RenderStepped:Connect(function(dt)
	animT += dt
	local char = player.Character
	local hum = char and char:FindFirstChildOfClass("Humanoid")
	local root = char and char:FindFirstChild("HumanoidRootPart")
	local role = player:GetAttribute("Role")

	-- sprint / stamina
	local sprinting = false
	if hum and role ~= "Hunter" and role ~= "Caught" then
		local maxS = player:GetAttribute("MaxStamina") or Config.MaxStamina
		local sprintSpeed = player:GetAttribute("SprintSpeed") or Config.SprintSpeed
		local moving = hum.MoveDirection.Magnitude > 0.1
		if sprintHeld and moving and not exhausted and stamina > 0 then
			sprinting = true
			stamina = math.max(0, stamina - Config.StaminaDrain * dt)
			if stamina <= 0 then
				exhausted = true
				toast("💨 Out of breath!", Color3.fromRGB(255, 150, 90))
			end
		else
			stamina = math.min(maxS, stamina + Config.StaminaRegen * dt * (moving and 0.7 or 1))
		end
		if exhausted and stamina >= maxS * 0.35 then
			exhausted = false
		end
		local speed = sprinting and sprintSpeed or Config.WalkSpeed
		if exhausted then
			speed = Config.WalkSpeed - 3
		end
		if workspace:GetServerTimeNow() < (player:GetAttribute("BoostUntil") or 0) then
			speed += Config.SpeedPadBonus
		end
		hum.WalkSpeed = speed

		local frac = stamina / maxS
		staminaFill.Size = UDim2.fromScale(frac, 1)
		staminaFill.BackgroundColor3 = exhausted and Color3.fromRGB(255, 90, 80)
			or (frac < 0.3 and Color3.fromRGB(255, 190, 70) or Color3.fromRGB(80, 210, 255))
		staminaText.Text = exhausted and "EXHAUSTED" or "STAMINA"
	end

	-- danger: proximity to hunters
	local danger = 0
	if root and role == "Runaway" then
		for _, hr in ipairs(hunterRoots()) do
			local d = (hr.Position - root.Position).Magnitude
			danger = math.max(danger, math.clamp(1 - (d - 12) / 55, 0, 1))
		end
	end
	local pulse = danger > 0 and (0.75 + 0.25 * math.sin(animT * (4 + danger * 8))) or 0
	for _, e in ipairs(vignetteEdges) do
		e.BackgroundTransparency = 1 - danger * 0.75 * pulse
	end

	-- hunters' limbs
	for _, model in ipairs(HuntersFolder:GetChildren()) do
		animateHunter(model, animT)
	end

	-- spinning keys
	for _, key in ipairs(CollectionService:GetTagged("SpinningKey")) do
		if key:IsDescendantOf(workspace) then
			local base = keyBase[key]
			if not base then
				base = key:GetPivot()
				keyBase[key] = base
				key.Destroying:Connect(function()
					keyBase[key] = nil
				end)
			end
			key:PivotTo(base * CFrame.new(0, math.sin(animT * 2) * 0.5, 0) * CFrame.Angles(0, animT * 2, 0))
		end
	end

	-- camera feel
	local targetFov = baseFov + (sprinting and 8 or 0) + danger * 6
	currentFov += (targetFov - currentFov) * math.min(1, dt * 6)
	camera.FieldOfView = currentFov
	if shake > 0 then
		shake = math.max(0, shake - dt * 1.5)
		local s = shake * 0.35
		camera.CFrame = camera.CFrame * CFrame.Angles(
			(math.random() - 0.5) * s * 0.1,
			(math.random() - 0.5) * s * 0.1,
			0
		)
	end
end)

player.CharacterAdded:Connect(function()
	stamina = player:GetAttribute("MaxStamina") or Config.MaxStamina
	exhausted = false
	if spectating then
		task.defer(updateSpectate)
	end
end)

-- slowly darken saturation while in danger (subtle mood)
local moodCC = Instance.new("ColorCorrectionEffect")
moodCC.Name = "DangerMood"
moodCC.Parent = Lighting
RunService.Heartbeat:Connect(function()
	local alpha = 1 - (vignetteEdges[1].BackgroundTransparency)
	moodCC.Saturation = -alpha * 0.6
	moodCC.TintColor = Color3.new(1, 1 - alpha * 0.25, 1 - alpha * 0.25)
end)
