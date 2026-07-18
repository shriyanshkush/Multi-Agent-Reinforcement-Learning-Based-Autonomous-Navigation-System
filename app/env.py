import random

class GridEnv:
    def __init__(self, size=5, num_agents=2, obstacles_preset="standard"):
        self.size = max(4, int(size))
        self.num_agents = max(1, int(num_agents))
        self.goal = (self.size - 1, self.size - 1)
        self.obstacles_preset = obstacles_preset.lower()
        self.obstacles = self._generate_obstacles(self.obstacles_preset)
        self.agent_positions = []
        self.reset()

    def _generate_obstacles(self, preset):
        obs = []
        s = self.size
        goal = (s - 1, s - 1)
        start_slots = [(0, i) for i in range(self.num_agents)] + [(i, 0) for i in range(self.num_agents)]

        if preset == "empty" or preset == "open":
            return []
        elif preset == "maze":
            # Wall across row s//2 with an opening, and wall across col s//2 with an opening
            mid = s // 2
            for c in range(s):
                if c != 1 and c != s - 2:
                    obs.append((mid, c))
            for r in range(mid + 1, s):
                if r != mid + 1:
                    obs.append((r, mid))
        elif preset == "bottleneck":
            # Barrier separating left and right halves with a single center passage
            mid_c = s // 2
            gate_r = s // 2
            for r in range(s):
                if r != gate_r and r != gate_r - 1:
                    obs.append((r, mid_c))
        elif preset == "random":
            num_obs = int(0.15 * s * s)
            candidates = [(r, c) for r in range(s) for c in range(s)]
            for cand in candidates:
                if cand != goal and cand not in start_slots and len(obs) < num_obs:
                    if random.random() < 0.25:
                        obs.append(cand)
        else:
            # Standard default (scales smoothly from 5x5 default [(2, 2), (1, 3), (3, 1)])
            if s == 5:
                obs = [(2, 2), (1, 3), (3, 1)]
            else:
                mid = s // 2
                obs = [(mid, mid), (mid - 1, mid + 1), (mid + 1, mid - 1), (mid, mid - 2)]
                if s >= 7:
                    obs.extend([(mid - 2, mid), (mid + 2, mid - 1)])

        # Ensure goal and start locations are never blocked
        return [p for p in obs if p != goal and p[0] != 0]

    def reset(self):
        # Place agents at the start row (or spread across top/left if more agents than columns)
        self.agent_positions = []
        for i in range(self.num_agents):
            r = i // self.size
            c = i % self.size
            self.agent_positions.append((r, c))
        return self.agent_positions[:]

    def move(self, pos, action):
        x, y = pos
        if action == 0: x -= 1    # Up / North
        elif action == 1: x += 1  # Down / South
        elif action == 2: y -= 1  # Left / West
        elif action == 3: y += 1  # Right / East

        x = max(0, min(self.size - 1, x))
        y = max(0, min(self.size - 1, y))
        return (x, y)

    def step(self, actions):
        new_positions = []
        rewards = []
        collisions = 0
        goal_reached_count = 0

        for i, action in enumerate(actions):
            new_pos = self.move(self.agent_positions[i], action)
            reward = -1.0  # Base step time penalty

            # Obstacle collision check
            if new_pos in self.obstacles:
                reward -= 5.0
                new_pos = self.agent_positions[i]  # Bounce back

            new_positions.append(new_pos)
            rewards.append(reward)

        # Agent-to-Agent collision check
        for i in range(len(new_positions)):
            for j in range(i + 1, len(new_positions)):
                if new_positions[i] == new_positions[j]:
                    rewards[i] -= 10.0
                    rewards[j] -= 10.0
                    collisions += 1

        # Goal completion check
        done_flags = []
        for i in range(len(new_positions)):
            if new_positions[i] == self.goal:
                rewards[i] += 20.0
                done_flags.append(True)
                goal_reached_count += 1
            else:
                done_flags.append(False)

        self.agent_positions = new_positions
        done = all(done_flags)

        info = {
            "collisions": collisions,
            "goal_reached_count": goal_reached_count,
            "done_flags": done_flags
        }

        return new_positions, rewards, done, info