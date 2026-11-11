-- AI Hunter: patrols, spots runaways by sight / sound, chases with pathfinding.

local PathfindingService = game:GetService("PathfindingService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))

local HunterAI = {}
HunterAI.__index = HunterAI

local BODY = Color3.fromRGB(18, 16, 22)
local EYE = Color3.fromRGB(255, 20, 40)

local function makePart(model, name, size, color, material)
	local p = Instance.new("Part")
	p.Name = name
	p.Size = size
	p.Color = color
	p.Material = material or Enum.Material.SmoothPlastic
	p.CanCollide = false
	p.Massless = true
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Parent = model
	return p
end

local function motor(name, part0, part1, c0, c1)
	local m = Instance.new("Motor6D")
	m.Name = name
	m.Part0 = part0
	m.Part1 = part1
	m.C0 = c0
	m.C1 = c1
	m.Parent = part0
	return m
end

local function weld(part0, part1, c0)
	local w = Instance.new("Weld")
	w.Part0 = part0
	w.Part1 = part1
	w.C0 = c0
	w.Parent = part1
	part1.CFrame = part0.CFrame * c0
end

local function buildRig(spawnCFrame, number)
	local model = Instance.new("Model")
	model.Name = "Hunter" .. number

	local root = makePart(model, "HumanoidRootPart", Vector3.new(2, 2, 1), BODY)
	root.Transparency = 1
	root.CanCollide = true
	root.Massless = false
	root.CFrame = spawnCFrame
	model.PrimaryPart = root

	local torso = makePart(model, "Torso", Vector3.new(2.6, 3.2, 1.3), BODY)
	local head = makePart(model, "Head", Vector3.new(1.7, 1.9, 1.7), BODY)
	local lArm = makePart(model, "Left Arm", Vector3.new(0.8, 3.8, 0.8), BODY)
	local rArm = makePart(model, "Right Arm", Vector3.new(0.8, 3.8, 0.8), BODY)
	local lLeg = makePart(model, "Left Leg", Vector3.new(1, 3, 1), BODY)
	local rLeg = makePart(model, "Right Leg", Vector3.new(1, 3, 1), BODY)

	-- joints (clients animate these locally); place parts to match
	local function joint(name, p0, p1, c0, c1)
		motor(name, p0, p1, c0, c1)
		p1.CFrame = p0.CFrame * c0 * c1:Inverse()
	end
	joint("RootJoint", root, torso, CFrame.new(0, 0.5, 0), CFrame.new())
	joint("Neck", torso, head, CFrame.new(0, 1.6, 0), CFrame.new(0, -1.0, 0))
	joint("Left Shoulder", torso, lArm, CFrame.new(-1.75, 1.3, 0), CFrame.new(0, 1.6, 0))
	joint("Right Shoulder", torso, rArm, CFrame.new(1.75, 1.3, 0), CFrame.new(0, 1.6, 0))
	joint("Left Hip", torso, lLeg, CFrame.new(-0.6, -1.6, 0), CFrame.new(0, 1.5, 0))
	joint("Right Hip", torso, rLeg, CFrame.new(0.6, -1.6, 0), CFrame.new(0, 1.5, 0))

	-- glowing eyes + grin
	for _, x in ipairs({ -0.38, 0.38 }) do
		local eye = makePart(model, "Eye", Vector3.new(0.35, 0.22, 0.1), EYE, Enum.Material.Neon)
		weld(head, eye, CFrame.new(x, 0.25, -0.86))
	end
	local mouth = makePart(model, "Mouth", Vector3.new(0.9, 0.12, 0.1), EYE, Enum.Material.Neon)
	weld(head, mouth, CFrame.new(0, -0.4, -0.86))

	local light = Instance.new("PointLight")
	light.Color = EYE
	light.Range = 18
	light.Brightness = 3
	light.Parent = head

	local humanoid = Instance.new("Humanoid")
	humanoid.RigType = Enum.HumanoidRigType.R15 -- uses HipHeight with a custom rig
	humanoid.HipHeight = 3.1
	humanoid.WalkSpeed = Config.HunterPatrolSpeed
	humanoid.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None
	humanoid.HealthDisplayType = Enum.HumanoidHealthDisplayType.AlwaysOff
	humanoid.BreakJointsOnDeath = false
	humanoid.MaxHealth = math.huge
	humanoid.Health = math.huge
	humanoid.Parent = model

	return model, humanoid, root
end

local count = 0

-- params: SpawnCFrame, Parent, GetTargets() -> { {Player, Root, Hidden} }, OnCatch(player), PatrolPoints
function HunterAI.new(params)
	count += 1
	local self = setmetatable({}, HunterAI)
	self.Model, self.Humanoid, self.Root = buildRig(params.SpawnCFrame, count)
	self.Root.Anchored = true
	self.Model.Parent = params.Parent

	self.GetTargets = params.GetTargets
	self.OnCatch = params.OnCatch
	self.PatrolPoints = params.PatrolPoints
	self.Rng = Random.new()

	self.Path = PathfindingService:CreatePath({
		AgentRadius = 2.5,
		AgentHeight = 7,
		AgentCanJump = true,
		WaypointSpacing = 6,
	})
	self.Waypoints = nil
	self.WpIndex = 0
	self.Goal = nil
	self.LastPathTime = 0
	self.LastKnown = nil
	self.PatrolGoal = nil
	self.Chasing = false
	self.Enraged = false
	self.Frenzy = false
	self.Active = false
	self.Destroyed = false
	return self
end

function HunterAI:Release()
	if self.Active or self.Destroyed then
		return
	end
	self.Active = true
	self.Root.Anchored = false
	pcall(function()
		self.Root:SetNetworkOwner(nil)
	end)
	task.spawn(function()
		self:_loop()
	end)
end

function HunterAI:SetEnraged(on)
	self.Enraged = on
end

function HunterAI:SetFrenzy(on)
	self.Frenzy = on
end

function HunterAI:Destroy()
	self.Destroyed = true
	self.Active = false
	if self.Model then
		self.Model:Destroy()
	end
end

local rayParams = RaycastParams.new()
rayParams.FilterType = Enum.RaycastFilterType.Exclude

function HunterAI:_canSee(targetRoot)
	local origin = self.Root.Position + Vector3.new(0, 2.5, 0)
	local dir = targetRoot.Position - origin
	if dir.Magnitude > Config.HunterSightRange then
		return false
	end
	rayParams.FilterDescendantsInstances = { self.Model, targetRoot.Parent, workspace:FindFirstChild("Hunters") }
	local hit = workspace:Raycast(origin, dir, rayParams)
	if hit and hit.Instance and hit.Instance.Parent and hit.Instance.Parent:FindFirstChildOfClass("Humanoid") then
		hit = nil -- another character in the way doesn't block sight
	end
	return hit == nil
end

function HunterAI:_pickTarget(targets)
	local best, bestDist = nil, math.huge
	local myPos = self.Root.Position
	for _, t in ipairs(targets) do
		local d = (t.Root.Position - myPos).Magnitude
		local detected
		if t.Hidden then
			detected = d <= Config.HiddenDetectRange
		elseif self.Frenzy then
			detected = true
		else
			detected = d <= Config.HunterHearRange or self:_canSee(t.Root)
		end
		if detected and d < bestDist then
			best, bestDist = t, d
		end
	end
	return best, bestDist
end

function HunterAI:_computePath(goal)
	self.LastPathTime = os.clock()
	self.Goal = goal
	local ok = pcall(function()
		self.Path:ComputeAsync(self.Root.Position, goal)
	end)
	if ok and self.Path.Status == Enum.PathStatus.Success then
		self.Waypoints = self.Path:GetWaypoints()
		self.WpIndex = math.min(2, #self.Waypoints)
	else
		self.Waypoints = nil
	end
end

function HunterAI:_followPath()
	local wps = self.Waypoints
	if not wps then
		return false
	end
	local wp = wps[self.WpIndex]
	while wp do
		local flat = (wp.Position - self.Root.Position) * Vector3.new(1, 0, 1)
		if flat.Magnitude < 3 then
			self.WpIndex += 1
			wp = wps[self.WpIndex]
		else
			break
		end
	end
	if not wp then
		self.Waypoints = nil
		return false
	end
	if wp.Action == Enum.PathWaypointAction.Jump then
		self.Humanoid.Jump = true
	end
	self.Humanoid:MoveTo(wp.Position)
	return true
end

function HunterAI:_newPatrolGoal(targets)
	-- Bias patrols toward runaways so the hunter keeps up the pressure
	if #targets > 0 and self.Rng:NextNumber() < 0.55 then
		local t = targets[self.Rng:NextInteger(1, #targets)]
		local offset = Vector3.new(self.Rng:NextNumber(-35, 35), 0, self.Rng:NextNumber(-35, 35))
		local nearest, nd = nil, math.huge
		for _, p in ipairs(self.PatrolPoints) do
			local d = (p - (t.Root.Position + offset)).Magnitude
			if d < nd then
				nearest, nd = p, d
			end
		end
		return nearest
	end
	return self.PatrolPoints[self.Rng:NextInteger(1, #self.PatrolPoints)]
end

function HunterAI:_loop()
	local lastPos = self.Root.Position
	local lastStuckCheck = os.clock()
	local stuckStrikes = 0

	while self.Active and not self.Destroyed and self.Model.Parent do
		local targets = self.GetTargets()

		-- catch check
		for _, t in ipairs(targets) do
			if (t.Root.Position - self.Root.Position).Magnitude <= Config.CatchRadius then
				self.OnCatch(t.Player)
			end
		end

		local target, dist = self:_pickTarget(targets)
		local chaseSpeed = Config.HunterChaseSpeed + (self.Enraged and Config.HunterEnragedBonus or 0)

		if target then
			self.Chasing = true
			self.LastKnown = target.Root.Position
			self.Humanoid.WalkSpeed = chaseSpeed
			local heightDiff = math.abs(target.Root.Position.Y - self.Root.Position.Y)
			if dist < 40 and heightDiff < 4 and self:_canSee(target.Root) then
				-- straight at them
				self.Waypoints = nil
				self.Humanoid:MoveTo(target.Root.Position + target.Root.AssemblyLinearVelocity * 0.15)
			else
				if not self.Waypoints or os.clock() - self.LastPathTime > 0.5
					or (self.Goal and (self.Goal - target.Root.Position).Magnitude > 8) then
					self:_computePath(target.Root.Position)
				end
				if not self:_followPath() then
					self.Humanoid:MoveTo(target.Root.Position)
				end
			end
		elseif self.LastKnown then
			-- investigate last known position
			self.Chasing = false
			self.Humanoid.WalkSpeed = chaseSpeed - 2
			if not self.Waypoints or (self.Goal and (self.Goal - self.LastKnown).Magnitude > 2) then
				self:_computePath(self.LastKnown)
			end
			if not self:_followPath() or (self.Root.Position - self.LastKnown).Magnitude < 5 then
				self.LastKnown = nil
				self.Waypoints = nil
			end
		else
			self.Chasing = false
			self.Humanoid.WalkSpeed = Config.HunterPatrolSpeed + (self.Enraged and 2 or 0)
			if not self.PatrolGoal or (self.Root.Position - self.PatrolGoal).Magnitude < 6 then
				self.PatrolGoal = self:_newPatrolGoal(targets)
				self.Waypoints = nil
			end
			if not self.Waypoints then
				self:_computePath(self.PatrolGoal)
				if not self.Waypoints then
					self.PatrolGoal = nil
				end
			end
			self:_followPath()
		end

		self.Model:SetAttribute("Chasing", self.Chasing)

		-- stuck detection
		if os.clock() - lastStuckCheck > 1.2 then
			local moved = (self.Root.Position - lastPos).Magnitude
			if moved < 1.5 then
				stuckStrikes += 1
				self.Humanoid.Jump = true
				self.Waypoints = nil
				if stuckStrikes >= 4 then
					self.PatrolGoal = nil
					self.LastKnown = nil
					stuckStrikes = 0
				end
			else
				stuckStrikes = 0
			end
			lastPos = self.Root.Position
			lastStuckCheck = os.clock()
		end

		-- fell out of the world? bring it back
		if self.Root.Position.Y < -30 and #self.PatrolPoints > 0 then
			self.Model:PivotTo(CFrame.new(self.PatrolPoints[1] + Vector3.new(0, 6, 0)))
		end

		task.wait(0.1)
	end
end

return HunterAI
