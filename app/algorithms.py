import random
import math
from collections import defaultdict

# =====================================================================
# EXPLORATION STRATEGIES
# =====================================================================

class EpsilonGreedyExploration:
    def __init__(self, epsilon=0.5, epsilon_min=0.05, epsilon_decay=0.98):
        self.epsilon = float(epsilon)
        self.epsilon_min = float(epsilon_min)
        self.epsilon_decay = float(epsilon_decay)

    def choose_action(self, q_values, state=None):
        if random.random() < self.epsilon:
            return random.randint(0, len(q_values) - 1)
        # Greedy choice with random tie-breaking
        max_q = max(q_values)
        best_actions = [i for i, q in enumerate(q_values) if q == max_q]
        return random.choice(best_actions)

    def step_episode(self):
        self.epsilon = max(self.epsilon_min, self.epsilon * self.epsilon_decay)

    def get_metric(self):
        return round(self.epsilon, 4)


class BoltzmannExploration:
    """Softmax / Boltzmann exploration where P(a|s) proportional to exp(Q(s,a) / T)"""
    def __init__(self, temp=0.5, temp_min=0.05, temp_decay=0.98):
        self.temp = max(0.01, float(temp))
        self.temp_min = float(temp_min)
        self.temp_decay = float(temp_decay)

    def choose_action(self, q_values, state=None):
        max_q = max(q_values)
        # Numerical stability shift
        exp_values = [math.exp((q - max_q) / self.temp) for q in q_values]
        total_exp = sum(exp_values)
        probs = [e / total_exp for e in exp_values]

        rand_val = random.random()
        cumulative = 0.0
        for i, p in enumerate(probs):
            cumulative += p
            if rand_val <= cumulative:
                return i
        return len(q_values) - 1

    def step_episode(self):
        self.temp = max(self.temp_min, self.temp * self.temp_decay)

    def get_metric(self):
        return round(self.temp, 4)


class UCBExploration:
    """Upper Confidence Bound exploration"""
    def __init__(self, c=1.414):
        self.c = float(c)
        self.action_counts = defaultdict(lambda: [0] * 4)
        self.total_counts = defaultdict(int)

    def choose_action(self, q_values, state=None):
        if state is None:
            # Fallback to epsilon-like if state is missing
            max_q = max(q_values)
            best_actions = [i for i, q in enumerate(q_values) if q == max_q]
            return random.choice(best_actions)

        total_s = self.total_counts[state]
        if total_s == 0:
            return random.randint(0, len(q_values) - 1)

        counts = self.action_counts[state]
        ucb_values = []
        for i, q in enumerate(q_values):
            if counts[i] == 0:
                return i  # Always explore unvisited action first
            ucb = q + self.c * math.sqrt(math.log(total_s) / counts[i])
            ucb_values.append(ucb)

        max_ucb = max(ucb_values)
        best_actions = [i for i, v in enumerate(ucb_values) if v == max_ucb]
        return random.choice(best_actions)

    def record_action(self, state, action):
        if state is not None:
            self.action_counts[state][action] += 1
            self.total_counts[state] += 1

    def step_episode(self):
        pass

    def get_metric(self):
        return round(self.c, 4)


# =====================================================================
# BASE AGENT
# =====================================================================

class BaseAgent:
    def __init__(self, grid_size=5, num_actions=4, lr=0.1, gamma=0.9, exploration=None):
        self.grid_size = grid_size
        self.num_actions = num_actions
        self.lr = float(lr)
        self.gamma = float(gamma)
        self.exploration = exploration or EpsilonGreedyExploration()
        self.q_table = defaultdict(lambda: [0.0] * self.num_actions)

    def choose_action(self, state):
        q_vals = self.q_table[state]
        action = self.exploration.choose_action(q_vals, state=state)
        if isinstance(self.exploration, UCBExploration):
            self.exploration.record_action(state, action)
        return action

    def learn(self, s, a, r, s_, next_a=None, done=False):
        raise NotImplementedError

    def on_episode_end(self):
        self.exploration.step_episode()

    def get_q_table_dict(self):
        # Return full dict representation for grid coordinates
        res = {}
        for x in range(self.grid_size):
            for y in range(self.grid_size):
                res[f"{x},{y}"] = [round(val, 3) for val in self.q_table[(x, y)]]
        return res

    def get_exploration_metric(self):
        return self.exploration.get_metric()


# =====================================================================
# Q-LEARNING AGENT (Off-Policy TD Control)
# =====================================================================

class QLearningAgent(BaseAgent):
    def learn(self, s, a, r, s_, next_a=None, done=False):
        max_q_next = max(self.q_table[s_]) if not done else 0.0
        target = r + self.gamma * max_q_next
        self.q_table[s][a] += self.lr * (target - self.q_table[s][a])
        return next_a


# =====================================================================
# SARSA AGENT (On-Policy TD Control)
# =====================================================================

class SARSAAgent(BaseAgent):
    def learn(self, s, a, r, s_, next_a=None, done=False):
        if next_a is None and not done:
            next_a = self.choose_action(s_)
        
        q_next = self.q_table[s_][next_a] if (not done and next_a is not None) else 0.0
        target = r + self.gamma * q_next
        self.q_table[s][a] += self.lr * (target - self.q_table[s][a])
        return next_a


# =====================================================================
# MONTE CARLO AGENT (First/Every-Visit Return Estimation)
# =====================================================================

class MonteCarloAgent(BaseAgent):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.episode_history = []
        self.return_counts = defaultdict(int)

    def learn(self, s, a, r, s_, next_a=None, done=False):
        self.episode_history.append((s, a, r))
        return next_a

    def on_episode_end(self):
        G = 0.0
        # Iterate backwards through episode step history
        for s, a, r in reversed(self.episode_history):
            G = r + self.gamma * G
            self.return_counts[(s, a)] += 1
            # Incremental update toward return G using learning rate or sample average
            error = G - self.q_table[s][a]
            self.q_table[s][a] += self.lr * error

        self.episode_history = []
        super().on_episode_end()


# =====================================================================
# DEEP Q-NETWORK (DQN Lite) AGENT (2-Layer Neural Q-Approximator)
# =====================================================================

class DQNAgent(BaseAgent):
    """
    Lightweight, fast pure-Python/NumPy Neural Q-Approximator for Deep RL demonstration.
    Uses experience replay memory and target network synchronization.
    """
    def __init__(self, grid_size=5, num_actions=4, lr=0.05, gamma=0.9, exploration=None):
        super().__init__(grid_size, num_actions, lr, gamma, exploration)
        self.hidden_size = 16
        # Weights: W1 (2 x hidden_size), b1 (hidden_size), W2 (hidden_size x num_actions), b2 (num_actions)
        self.W1 = [[(random.random() - 0.5) * 0.5 for _ in range(self.hidden_size)] for _ in range(2)]
        self.b1 = [0.0] * self.hidden_size
        self.W2 = [[(random.random() - 0.5) * 0.5 for _ in range(self.num_actions)] for _ in range(self.hidden_size)]
        self.b2 = [0.0] * self.num_actions

        # Target network copy
        self.target_W1 = [row[:] for row in self.W1]
        self.target_b1 = self.b1[:]
        self.target_W2 = [row[:] for row in self.W2]
        self.target_b2 = self.b2[:]

        self.memory = []
        self.batch_size = 16
        self.max_memory = 500
        self.step_counter = 0

    def _state_vector(self, state):
        x, y = state
        return [x / max(1, self.grid_size - 1), y / max(1, self.grid_size - 1)]

    def _forward(self, state_vec, use_target=False):
        W1 = self.target_W1 if use_target else self.W1
        b1 = self.target_b1 if use_target else self.b1
        W2 = self.target_W2 if use_target else self.W2
        b2 = self.target_b2 if use_target else self.b2

        # Hidden layer + ReLU
        hidden = [b1[h] + state_vec[0] * W1[0][h] + state_vec[1] * W1[1][h] for h in range(self.hidden_size)]
        hidden_relu = [max(0.0, val) for val in hidden]

        # Output layer
        out = [b2[a] + sum(hidden_relu[h] * W2[h][a] for h in range(self.hidden_size)) for a in range(self.num_actions)]
        return out, hidden, hidden_relu

    def choose_action(self, state):
        state_vec = self._state_vector(state)
        q_vals, _, _ = self._forward(state_vec)
        # Synchronize tabular mirror for fast UI lookup & heatmap display
        self.q_table[state] = q_vals
        return self.exploration.choose_action(q_vals, state=state)

    def learn(self, s, a, r, s_, next_a=None, done=False):
        self.memory.append((s, a, r, s_, done))
        if len(self.memory) > self.max_memory:
            self.memory.pop(0)

        self.step_counter += 1
        if len(self.memory) >= self.batch_size:
            batch = random.sample(self.memory, self.batch_size)
            self._replay_batch(batch)

        if self.step_counter % 20 == 0:
            self._update_target_network()

        # Update Q table cache for current state
        q_vals, _, _ = self._forward(self._state_vector(s))
        self.q_table[s] = q_vals
        return next_a

    def _replay_batch(self, batch):
        for s, a, r, s_, done in batch:
            s_vec = self._state_vector(s)
            s_next_vec = self._state_vector(s_)

            q_vals, hidden, hidden_relu = self._forward(s_vec, use_target=False)
            q_next, _, _ = self._forward(s_next_vec, use_target=True)

            target_val = r if done else r + self.gamma * max(q_next)
            error = target_val - q_vals[a]

            # Backpropagation gradient descent
            # dQ/dA_output = error
            # Update W2 and b2 for action a
            for h in range(self.hidden_size):
                grad_w2 = error * hidden_relu[h]
                self.W2[h][a] += self.lr * grad_w2

            self.b2[a] += self.lr * error

            # Backprop to hidden layer
            for h in range(self.hidden_size):
                if hidden[h] > 0:  # ReLU derivative
                    grad_h = error * self.W2[h][a]
                    self.W1[0][h] += self.lr * grad_h * s_vec[0]
                    self.W1[1][h] += self.lr * grad_h * s_vec[1]
                    self.b1[h] += self.lr * grad_h

    def _update_target_network(self):
        self.target_W1 = [row[:] for row in self.W1]
        self.target_b1 = self.b1[:]
        self.target_W2 = [row[:] for row in self.W2]
        self.target_b2 = self.b2[:]

    def get_q_table_dict(self):
        res = {}
        for x in range(self.grid_size):
            for y in range(self.grid_size):
                s_vec = self._state_vector((x, y))
                q_vals, _, _ = self._forward(s_vec)
                res[f"{x},{y}"] = [round(val, 3) for val in q_vals]
        return res
