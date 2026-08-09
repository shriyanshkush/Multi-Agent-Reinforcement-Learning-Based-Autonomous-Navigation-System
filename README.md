# MARL Autonomous Learning & Visualization Studio

An interactive, real-time laboratory and visual simulation engine designed for learning, experimenting with, and analyzing **Multi-Agent Reinforcement Learning (MARL)** algorithms and spatial coordination dynamics.

---

## 📌 Project Overview & Educational Goals

The **MARL Autonomous Learning Studio** bridges the gap between reinforcement learning mathematical theory and real-time visual intuition. Originally designed as a standard grid-world benchmark, this platform provides an interactive environment where developers, students, and researchers can observe how decentralized autonomous agents learn policies, navigate obstacles, and resolve team traffic conflicts.

By pairing an **asynchronous FastAPI simulation engine** with a rich **3D Three.js visualizer**, **live state-action ($Q(s,a)$) policy heatmaps**, and **WebSocket telemetry streams**, the studio enables direct inspection of reinforcement learning mechanics as they unfold.

---

## 🔑 Key Visual & Educational Features

| Visualizer & Feature | Educational Objective |
| :--- | :--- |
| **🕹️ 3D Cyber-Physical Arena** | Render real-time multi-agent spatial interactions, animated movement, goal pedestals, and obstacle boundaries using Three.js orbit controls. |
| **🗺️ 2D Tactical Grid** | Top-down view providing exact coordinate tracking and spatial path convergence across multiple agents. |
| **📊 Policy & Q-Table Heatmap** | Inspect live state-action values ($Q(s,a)$) and directional optimal action arrows ($\arg\max_a Q(s,a)$) rendered directly over the environment grid. |
| **📈 Real-Time Telemetry** | Stream live reward evolution curves, step counts, collision metrics, and exploration decay curves via WebSocket and Chart.js. |
| **🧠 Multi-Algorithm Suite** | Compare tabular methods (**Q-Learning**, **SARSA**, **Monte Carlo Control**) and deep neural approximation (**Deep Q-Network - DQN Lite**). |
| **🔍 Exploration Strategies** | Dynamically adjust exploration behavior using **$\epsilon$-Greedy**, **Boltzmann / Softmax**, or **Upper Confidence Bound (UCB)**. |
| **🤝 Team Dynamics Modes** | Observe non-stationary environment behavior in **Independent Learning** mode vs. collective behavior in **Cooperative (Shared Reward)** mode. |
| **🎛️ On-The-Fly Tuning** | Inject dynamic hyperparameter changes (learning rate $\alpha$, discount factor $\gamma$, decay $\lambda$, simulation speed) without restarting the server. |

---

## 🏗️ System Architecture & Codebase Structure

The platform uses a decoupled client-server architecture. The FastAPI backend executes the environment step logic and agent policy updates, streaming step payloads to the frontend studio via WebSockets.

```
                  +-----------------------------------+
                  |   FastAPI Backend (app/main.py)   |
                  +-----------------------------------+
                                    |
        +---------------------------+---------------------------+
        |                           |                           |
        v                           v                           v
+---------------+           +---------------+           +---------------+
|  Environment  | <-------> |  Agent Pool   | <-------> | Simulation    |
| (app/env.py)  |           | (app/agent.py)|           | Engine        |
+---------------+           +---------------+           | (app/train.py)|
                                                        +---------------+
                                                                |
                                             WebSocket Stream   | (JSON Frames:
                                             ws://localhost:8000/ws
                                                                v
                                    +-----------------------------------+
                                    |  Web Dashboard (marl-dashboard/)  |
                                    +-----------------------------------+
                                    | - 3D Arena (renderer-3d.js)       |
                                    | - 2D Grid (renderer-2d.js)        |
                                    | - Policy Map (renderer-policy.js) |
                                    | - Telemetry Charts (app.js)       |
                                    +-----------------------------------+
```

### Directory Layout

```
MARL/
├── app/                        # Python Backend Simulation Engine
│   ├── __init__.py             # Package marker
│   ├── agent.py                # Agent instantiation & factory wrappers
│   ├── algorithms.py           # Core RL algorithms & exploration strategies
│   ├── env.py                  # Grid environment dynamics & procedural obstacle presets
│   ├── main.py                 # FastAPI server, WebSocket endpoints & static file mounts
│   └── train.py                # Asynchronous training loop & state streaming logic
│
├── marl-dashboard/             # Frontend Visualization Studio
│   ├── index.html              # Studio interface layout & dynamic control panel
│   ├── css/
│   │   └── styles.css          # Dark-mode dashboard styling & grid layout
│   └── js/
│       ├── app.js              # Core UI state manager & event handlers
│       ├── chart-config.js     # Chart.js telemetry charts initialization
│       ├── renderer-2d.js      # 2D tactical grid rendering engine
│       ├── renderer-3d.js      # Three.js 3D arena visualizer engine
│       ├── renderer-policy.js  # Q-table heatmap & greedy action arrow inspector
│       └── websocket.js        # Reconnecting WebSocket client manager
│
├── Procfile                    # Deployment execution target
├── railway.json                # Deployment configuration file
├── README.md                   # Project documentation
└── requirements.txt            # Python dependencies (FastAPI, Uvicorn)
```

---

## 🧠 Theoretical Foundations & RL Formulations

### 1. Markov Decision Process (MDP)
The multi-agent environment operates as a discrete-time Markov Decision Process across $N$ agents:

- **State Space ($S$)**: Grid position $(x_i, y_i) \in [0, \text{grid\_size}-1]^2$ for each agent $i$.
- **Action Space ($A$)**: Discrete direction choices:
  - `0`: Up (North)
  - `1`: Down (South)
  - `2`: Left (West)
  - `3`: Right (East)
- **Transition Model ($P$)**: Deterministic movement subject to grid boundaries and obstacle collisions (bounces back to prior state upon hitting an obstacle).
- **Discount Factor ($\gamma$)**: $\gamma \in [0, 1)$ balancing immediate rewards against long-term future return.

### 2. Reinforcement Learning Algorithms

#### A. Q-Learning (Off-Policy TD Control)
Learns optimal state-action values independently of the exploration policy being executed:
$$Q(s, a) \leftarrow Q(s, a) + \alpha \left[ r + \gamma \max_{a'} Q(s', a') - Q(s, a) \right]$$

#### B. SARSA (On-Policy TD Control)
Updates action-values based on the actual next action $a'$ selected by the current exploration policy:
$$Q(s, a) \leftarrow Q(s, a) + \alpha \left[ r + \gamma Q(s', a') - Q(s, a) \right]$$
*Educational Insight*: SARSA accounts for potential random exploration steps during learning, yielding safer paths around hazard walls compared to Q-Learning.

#### C. Monte Carlo Control (Episode Return Backpropagation)
Accumulates entire trajectory returns $G_t = \sum_{k=0}^{T-t-1} \gamma^k r_{t+k+1}$ at episode termination and performs incremental mean updates:
$$Q(s_t, a_t) \leftarrow Q(s_t, a_t) + \alpha \left( G_t - Q(s_t, a_t) \right)$$

#### D. Deep Q-Network (DQN Lite)
A lightweight 2-layer neural approximator implemented in pure Python/NumPy:
- **Input Encoding**: Normalized coordinates $\left[ \frac{x}{\text{size}-1}, \frac{y}{\text{size}-1} \right]$.
- **Architecture**: 2 Input Nodes $\to$ 16 Hidden Nodes (ReLU) $\to$ 4 Output Q-Values.
- **Experience Replay Buffer**: Stores up to 500 transitions $(s, a, r, s', \text{done})$ to sample uniform mini-batches ($B=16$).
- **Target Network**: Synchronized every 20 steps to stabilize learning targets:
  $$\mathcal{L}(\theta) = \frac{1}{B} \sum_{i=1}^B \left( r_i + \gamma \max_{a'} Q(s'_i, a'; \theta^{\text{target}}) - Q(s_i, a_i; \theta) \right)^2$$

### 3. Exploration Strategies

1. **$\epsilon$-Greedy**:
   $$\pi(a \mid s) = \begin{cases} \text{Random action} & \text{with probability } \epsilon \\ \arg\max_{a'} Q(s, a') & \text{with probability } 1 - \epsilon \end{cases}$$
   $\epsilon$ decays per episode: $\epsilon_{t+1} = \max(\epsilon_{\min}, \epsilon_t \cdot \lambda_{\text{decay}})$.

2. **Boltzmann / Softmax**:
   Calculates action probabilities proportional to exponentiated state-action values divided by temperature $T$:
   $$P(a \mid s) = \frac{\exp(Q(s, a) / T)}{\sum_{a'} \exp(Q(s, a') / T)}$$

3. **Upper Confidence Bound (UCB)**:
   Selects actions by balancing high Q-values with state-action visitation uncertainty:
   $$A_t = \arg\max_{a} \left[ Q(s, a) + c \sqrt{\frac{\ln N(s)}{N(s, a)}} \right]$$

### 4. Reward Matrix & Team Modes

#### Reward Structure
- **Step Time Penalty**: `-1.0` (Encourages path brevity)
- **Obstacle Hazard Collision**: `-5.0` (Punishes hitting pillars; causes bounce-back)
- **Inter-Agent Collision**: `-10.0` (Penalizes occupying the same coordinate as another agent)
- **Goal Reached**: `+20.0` (Rewards reaching the energy pedestal)

#### Multi-Agent Team Dynamics
- **Independent Learning (IQL)**: Each agent updates its own policy using its individual reward $r_i$. Other agents are treated as part of an evolving non-stationary environment.
- **Cooperative Team (Shared Rewards)**: Team rewards are averaged across all agents ($r_{\text{shared}} = \frac{1}{N} \sum_{i=1}^N r_i$). All agents receive $r_{\text{shared}}$, encouraging cooperative behavior such as waiting for another agent at bottlenecks.

---

## ⚡ Quickstart Guide

### Prerequisites
- **Python 3.8+**
- Modern web browser (Chrome, Firefox, Edge, Safari) supporting WebGL and WebSockets.

### 1. Installation
Clone the repository and install the backend dependencies:

```bash
git clone https://github.com/shriyanshkush/Multi-Agent-Reinforcement-Learning-Based-Autonomous-Navigation-System.git
cd MARL
pip install -r requirements.txt
```

### 2. Launching the Backend Server
Run the FastAPI application with Uvicorn:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

*Alternatively, run:*
```bash
python -m uvicorn app.main:app --reload
```

### 3. Opening the Dashboard Visualizer
Open your browser and navigate to:
```
http://localhost:8000
```
The studio will load and automatically connect to `ws://localhost:8000/ws`. A simulation run will begin streaming immediately!

---

## 🕹️ Interactive Visualizer & Inspection Guide

### 1. Viewport Selection Modes
- **3D Cyber Arena**: Complete 3D layout showing metallic agent models, glowing green energy goals, and obstacle columns.
  - *Controls*: `Left Click + Drag` to orbit; `Right Click + Drag` to pan; `Scroll` to zoom.
- **2D Tactical View**: High-contrast top-down view for observing multi-agent positioning and path overlaps.
- **Policy Heatmap**: Visualizes **Agent 0**'s learned internal state-action matrix ($Q(s,a)$). Darker blue cells indicate higher state value; white directional arrows display the greedy policy action $\arg\max_a Q(s,a)$.

### 2. Live Control Panel Parameters
- **Algorithm**: Select between `Q-Learning`, `SARSA`, `Monte Carlo`, or `DQN (Lite)`.
- **Exploration Method**: Choose `Epsilon-Greedy`, `Boltzmann (Softmax)`, or `UCB`.
- **Team Dynamics**: Switch between `Independent Learners` and `Cooperative Team`.
- **Grid Configuration**: Set grid dimensions ($5\times5$ to $8\times8$), agent count ($1$ to $5$), and obstacle presets (`Standard`, `Maze`, `Bottleneck`, `Random`, `Open`).
- **Hyperparameter Injection**: Adjust learning rate ($\alpha$), discount factor ($\gamma$), initial exploration ($\epsilon$), and decay rate ($\lambda$) on the fly.

---

## 🔌 WebSocket API Reference

The client and server exchange JSON messages over `ws://localhost:8000/ws`.

### Client Command Schema
To start, pause, resume, or stop a simulation stream, send a command payload:

```json
{
  "command": "start",
  "config": {
    "algorithm": "q_learning",
    "exploration": "epsilon_greedy",
    "team_mode": "independent",
    "grid_size": 5,
    "num_agents": 3,
    "episodes": 25,
    "steps": 50,
    "delay": 0.15,
    "obstacles": "standard",
    "lr": 0.1,
    "gamma": 0.9,
    "epsilon": 0.5,
    "epsilon_decay": 0.98
  }
}
```

### Server Stream Frames

1. **`init` Frame**: Transmitted at simulation start containing initial environment metadata (grid size, obstacle positions, goal coordinates).
2. **`step` Frame**: Emitted at each environment step containing agent coordinates, actions executed, step rewards, exploration decay metric, collision counts, and Agent 0's $Q(s,a)$ dictionary.
3. **`episode_end` Frame**: Emitted at episode termination with total cumulative reward, per-agent rewards, step count, and goal status.

---

## 🧪 Learning Experiments & Hands-On Case Studies

Try these interactive experiments in the dashboard to visually explore key MARL concepts:

### Experiment 1: Bottleneck Navigation (Independent vs. Cooperative)
1. Set **Obstacles** to `Center Bottleneck Gate` and **Num Agents** to `3`.
2. Run with **Team Mode** set to `Independent Learners`. Observe agent collisions and gridlocking at the gate as each agent greedily attempts to pass first.
3. Switch **Team Mode** to `Cooperative Team (Shared Rewards)`. Observe how agents learn turn-taking and yielding behavior to maximize team throughput.

### Experiment 2: Path Safety (Q-Learning vs. SARSA)
1. Select **Obstacles** `Standard` or `Maze`.
2. Train with **Q-Learning**. Notice how agents learn aggressive paths directly adjacent to hazard obstacles.
3. Train with **SARSA**. Observe how SARSA's on-policy updates produce safer trajectories that maintain distance from hazard pillars.

### Experiment 3: Exploration Efficiency (UCB vs. Epsilon-Greedy)
1. Compare `Epsilon-Greedy` against `Upper Confidence Bound (UCB)` on larger grids ($7\times7$ or $8\times8$).
2. Observe how UCB systematically explores unvisited state-action pairs earlier in training compared to purely random decay steps.

---

## 🛠️ Troubleshooting & FAQ

- **Agents circling or failing to converge**:
  - Increase the discount factor ($\gamma$) to `0.95` so agents value reaching the target goal over immediate step time penalties.
- **Deep Q-Network (DQN Lite) taking longer to learn**:
  - Neural value approximation requires more step iterations than tabular updates. Set episodes to `50+` and decay rate to `0.99` for smooth policy convergence.
- **WebSocket Connection Failure**:
  - Ensure Uvicorn is running on port `8000` (`http://localhost:8000`). If using a custom port, update the WebSocket client connection string in `marl-dashboard/js/websocket.js`.

---

## 📄 License & Attribution

Developed by [Shriyansh Kushwaha](https://github.com/shriyanshkush), [Aman Jha](https://github.com/TheNucleya02) Open source for educational, learning, and research purposes.
