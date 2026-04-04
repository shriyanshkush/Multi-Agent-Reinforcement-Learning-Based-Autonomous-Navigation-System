class GridEnv:
    def __init__(self, size=5, num_agents=2):
        self.size = size
        self.num_agents = num_agents
        self.goal = (size - 1, size - 1)
        self.obstacles = [(2, 2), (1, 3), (3, 1)]

    def reset(self):
        self.agent_positions = [(0, i) for i in range(self.num_agents)]
        return self.agent_positions

    def move(self, pos, action):
        x, y = pos

        if action == 0: x -= 1
        elif action == 1: x += 1
        elif action == 2: y -= 1
        elif action == 3: y += 1

        x = max(0, min(self.size - 1, x))
        y = max(0, min(self.size - 1, y))

        return (x, y)

    def step(self, actions):
        new_positions = []
        rewards = []

        for i, action in enumerate(actions):
            new_pos = self.move(self.agent_positions[i], action)
            reward = -1

            if new_pos in self.obstacles:
                reward -= 5
                new_pos = self.agent_positions[i]

            new_positions.append(new_pos)
            rewards.append(reward)

        # collision penalty
        for i in range(len(new_positions)):
            for j in range(i + 1, len(new_positions)):
                if new_positions[i] == new_positions[j]:
                    rewards[i] -= 10
                    rewards[j] -= 10

        done_flags = []
        for i in range(len(new_positions)):
            if new_positions[i] == self.goal:
                rewards[i] += 20
                done_flags.append(True)
            else:
                done_flags.append(False)

        self.agent_positions = new_positions
        done = all(done_flags)

        return new_positions, rewards, done