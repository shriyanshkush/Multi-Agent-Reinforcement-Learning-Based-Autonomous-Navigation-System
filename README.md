# 📘 Multi-Agent Reinforcement Learning Simulator 🚀

## 📌 Project Overview

This project implements a **Multi-Agent Reinforcement Learning (MARL)** system using **Q-Learning** in a grid-based environment. Multiple agents learn to navigate toward a goal while avoiding obstacles and collisions.

The system also includes a **FastAPI backend with WebSocket streaming**, enabling **real-time visualization** of agent behavior and learning dynamics.

This project aligns with the concept of an **autonomous navigation system**, where agents learn optimal policies through interaction rather than explicit programming.

---

## 🧠 Key Concepts Used

- Reinforcement Learning (RL)
- Q-Learning (Value-Based RL)
- Multi-Agent Systems (MARL)
- Exploration vs Exploitation
- Reward Shaping
- Temporal Difference Learning
- Real-time Simulation Streaming

---

## 🏗️ Project Structure

```
app/
│── agent.py        # Q-Learning agent
│── env.py          # Grid environment
│── train.py        # Simulation loop (async streaming)

main.py             # FastAPI server
```

---

## ⚙️ How It Works (High-Level Flow)

1. Environment is initialized (grid + obstacles + goal)
2. Multiple agents are created with independent Q-tables
3. Training runs across multiple episodes:
   - Agents reset to starting positions
   - At each step:
     - Agents select actions using policy
     - Environment updates positions
     - Rewards are assigned
     - Q-values are updated
4. Simulation data is streamed via WebSocket for real-time visualization

---

# 🧠 Mathematical Foundations

## 📌 1. Markov Decision Process (MDP)

The environment is modeled as:

$$
(S,\ A,\ P,\ R,\ \gamma)
$$

| Symbol | Meaning | In This Project |
|--------|---------|-----------------|
| $S$ | States | Grid positions $(x, y)$ |
| $A$ | Actions | `{up, down, left, right}` |
| $P$ | Transition function | Deterministic |
| $R$ | Reward function | Shaped rewards |
| $\gamma$ | Discount factor | 0.9 |

> **Note:** Finite state space: 5×5 = 25. Multi-agent interaction → non-stationary environment.

---

## 📌 2. Action-Value Function (Q-Function)

$$
Q^*(s,a) = \max_{\pi}\ \mathbb{E}\left[\sum_{t=0}^{\infty} \gamma^t r_t\right]
$$

Represents the **expected cumulative reward** for taking action $a$ in state $s$.

---

## 📌 3. Bellman Optimality Principle

$$
Q^*(s, a) = r + \gamma \max_{a'} Q^*(s', a')
$$

The value of a state-action pair depends on:
- Immediate reward
- Best future reward

---

## 📌 4. Q-Learning Update Rule

$$
Q(s,a) \leftarrow Q(s,a) + \alpha \left[r + \gamma \max_{a'} Q(s',a') - Q(s,a)\right]
$$

| Parameter | Symbol | Value |
|-----------|--------|-------|
| Learning rate | $\alpha$ | 0.1 |
| Discount factor | $\gamma$ | 0.9 |

The update uses **Temporal Difference (TD) error**:

$$
TD = r + \gamma \max Q(s') - Q(s)
$$

---

## 📌 5. Policy (ε-Greedy)

$$
\pi(a \mid s) =
\begin{cases}
\text{random action} & \text{with probability } \epsilon \\
\arg\max\ Q(s,a) & \text{otherwise}
\end{cases}
$$

- $\epsilon = 0.3$ → exploration rate
- Balances learning vs exploiting knowledge

---

## 📌 6. Reward Function (Reward Shaping)

$$
R =
\begin{cases}
-1  & \text{per step} \\
-6  & \text{obstacle hit} \\
-10 & \text{agent collision} \\
+20 & \text{goal reached}
\end{cases}
$$

| Situation | Reward |
|-----------|--------|
| Normal move | -1 |
| Hit obstacle | -6 |
| Agent collision | -10 |
| Goal reached | +20 |

> Encourages shortest path, safe navigation, and collision avoidance.

---

## 📌 7. Multi-Agent Dynamics

Transition depends on all agents:

$$
P(s' \mid s,\ a_1, a_2, \ldots, a_n)
$$

Makes the environment:
- Dynamic
- Non-stationary
- Harder to converge

---

## 📌 8. Independent Q-Learning (IQL)

Each agent learns its own Q-function independently:

$$
Q_i(s, a)
$$

Without coordination:
- Agents treat others as part of the environment
- Coordination emerges implicitly

---

# 🤖 Implementation

## Q-Table Structure

```python
self.q_table[(x, y)] = [Q(up), Q(down), Q(left), Q(right)]
```

## Update Rule

```python
target = r + self.gamma * max(self.q_table[s_])
self.q_table[s][a] += self.lr * (target - self.q_table[s][a])
```

## Policy: Decision Making

```python
if random.random() < epsilon:
    return random_action   # Explore
else:
    return best_action     # Exploit
```

---

# 🌍 Grid Environment

| Property | Value |
|----------|-------|
| Grid Size | `5 × 5` |
| Goal Position | `(4, 4)` |
| Obstacles | `[(2,2), (1,3), (3,1)]` |
| Agent Start | Top row `[(0,0), (0,1), (0,2), ...]` |

## Environment Step Logic

1. Agents take actions
2. Positions updated
3. Boundary constraints applied
4. Obstacle penalties applied
5. Collision penalties applied
6. Goal condition checked

## Collision Handling

```python
rewards[i] -= 10
rewards[j] -= 10
```

> Leads to implicit coordination and avoidance of overlapping paths.

---

# 📈 Learning Behavior

| Episode | Behavior |
|---------|----------|
| 1 | Random exploration |
| 5 | Semi-optimized paths |
| 10+ | Near-optimal navigation |

Agents progressively learn to:
- Find shortest paths
- Avoid obstacles
- Avoid collisions
- Adapt to other agents

---

# 🔌 WebSocket Streaming

| HTTP | WebSocket |
|------|-----------|
| One request-response | Continuous streaming |
| Not real-time | Real-time updates |

## Backend Endpoint

```python
@app.websocket("/ws")
async def websocket_endpoint(websocket):
    await websocket.accept()

    async for data in run_simulation_stream():
        await websocket.send_json(data)
```

## Data Format: Step Update

```json
{
  "type": "step",
  "episode": 1,
  "step": 5,
  "positions": [[x, y]],
  "rewards": [...]
}
```

## Data Format: Episode End

```json
{
  "type": "episode_end",
  "total_reward": 50
}
```

> `await asyncio.sleep(delay)` enables smooth real-time streaming.

---

# 🚀 Running the Project

### Install Dependencies

```bash
pip install fastapi uvicorn
```

### Start the Server

```bash
uvicorn main:app --reload
```

### Connect via WebSocket

```
ws://localhost:8000/ws
```

---

# 🔮 Possible Improvements

- [ ] Deep Q-Networks (DQN)
- [ ] Centralized training (MADDPG)
- [ ] Agent communication protocols
- [ ] Dynamic environments
- [ ] Frontend visualization (React / Jetpack Compose)
