import random

class QLearningAgent:
    def __init__(self, grid_size=5):
        self.q_table = {
            (x, y): [0.0] * 4
            for x in range(grid_size)
            for y in range(grid_size)
        }

        self.lr = 0.1
        self.gamma = 0.9
        self.epsilon = 0.3

    def choose_action(self, state):
        if random.random() < self.epsilon:
            return random.randint(0, 3)
        return self.q_table[state].index(max(self.q_table[state]))

    def learn(self, s, a, r, s_):
        target = r + self.gamma * max(self.q_table[s_])
        self.q_table[s][a] += self.lr * (target - self.q_table[s][a])