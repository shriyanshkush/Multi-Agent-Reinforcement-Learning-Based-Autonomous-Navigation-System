# 🤖 MARL Autonomous Production Studio 🚀
### **3D Cyber-Physical Multi-Agent Reinforcement Learning Platform**

---

## 📌 Executive Summary & Overview

The **MARL Autonomous Production Studio** is a state-of-the-art simulation and visualization platform designed to model, train, and analyze multi-agent autonomous systems. Originally conceived as a basic grid-based Q-Learning script, this project has been **completely re-engineered and enhanced** into a full-stack, real-time cyber-physical robotics environment.

In this simulator, multiple autonomous agents (robotic units) learn optimal navigation policies to reach energy pedestals while avoiding industrial hazards and inter-agent collisions. By combining an **async FastAPI simulation engine**, a **modular multi-algorithm reinforcement learning backend**, and an **interactive 3D/2D web-based studio**, this project demonstrates how autonomous coordination emerges from mathematical formulation and decentralized learning.

---

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| **🧠 Multi-Algorithm Suite** | Includes **Q-Learning** (Off-Policy TD), **SARSA** (On-Policy TD), **Monte Carlo Control** (Return Estimation), and a pure-Python **Deep Q-Network (DQN Lite)** with experience replay and synchronized target networks. |
| **🔍 Advanced Exploration** | Dynamically switch between **$\epsilon$-Greedy** (decaying random rates), **Boltzmann / Softmax** (temperature-based probabilities), and **Upper Confidence Bound (UCB)** (uncertainty optimism). |
| **🤝 Multi-Agent Team Modes** | Configure agents as **Independent Learners** (optimizing individual returns) or **Cooperative Teams** (sharing pooled rewards to foster collective traffic flow). |
| **🏗️ Procedural Environments** | Scale grids from **$5\times5$ up to $8\times8$** with **1 to 5 agents**, featuring 5 distinct obstacle layouts: *Standard Industrial*, *Winding Maze Corridor*, *Center Bottleneck Gate*, *Random Hazard Clusters*, and *Open Empty Arena*. |
| **🕹️ 3D Cyber-Robot Studio** | A Three.js-powered 3D viewport featuring animated robotic agents, glowing energy goals, industrial hazard pillars, orbit controls, and smooth step interpolation. |
| **📊 Live Policy Heatmaps** | Real-time inspection of tabular state-action values ($Q(s,a)$) with greedy action arrows ($\arg\max_a Q(s,a)$) overlaying a 2D tactical grid. |
| **📈 Real-Time Telemetry** | Asynchronous WebSocket streaming providing live Chart.js reward evolution curves, instant step telemetry, collision tracking, and exploration decay metrics. |
| **🎛️ Live Hyperparameter Injection** | Adjust learning rates ($\alpha$), discount factors ($\gamma$), exploration decay, and simulation speed on the fly directly from the studio dashboard. |

---

## 🏗️ System Architecture & Directory Structure

The platform follows a decoupled client-server architecture where the backend simulation engine streams high-frequency state transitions to the rich frontend visualizer via WebSockets.

```
Marl - Multiagent Reinforcement Learning/
│── app/
│   │── __init__.py         # Package initializer
│   │── agent.py            # Agent factory & wrapper logic
│   │── algorithms.py       # Modular RL algorithms & exploration strategies
│   │── env.py              # Multi-agent grid dynamics & obstacle generators
│   │── train.py            # Asynchronous simulation loop & WebSocket generator
│   └── main.py             # FastAPI server, WebSocket hub & static mounts
│
│── marl-dashboard/
│   │── index.html          # Studio UI layout & control panels
│   │── css/
│   │   └── styles.css      # Modern dark-mode aesthetics & glassmorphism
│   └── js/
│       │── app.js          # Core UI controller & event listeners
│       │── chart-config.js # Chart.js real-time analytics configuration
│       │── renderer-2d.js  # 2D top-down tactical grid visualizer
│       │── renderer-3d.js  # Three.js 3D robotics arena visualizer
│       │── renderer-policy.js # Q-Table heatmap & optimal action arrow inspector
│       └── websocket.js    # WebSocket client manager & reconnect handler
│
│── README.md               # Comprehensive project documentation
└── requirements.txt        # Backend dependencies (FastAPI, Uvicorn)
```

### **Architecture Data Flow**
```
+-----------------------------------------------------------------------------------+
|                            FastAPI Backend Server (main.py)                       |
|                                                                                   |
|  +--------------------+      +--------------------+      +---------------------+  |
|  |  Grid Environment  | <--> |   RL Agent Pool    | <--> | Async Training Loop |  |
|  |     (env.py)       |      |  (algorithms.py)   |      |     (train.py)      |  |
|  +--------------------+      +--------------------+      +---------------------+  |
+---------------------------------------------------------+-------------------------+
                                                          |
                                                          | Async WebSocket Stream
                                                          | (JSON Payloads: init/step/end)
                                                          v
+-----------------------------------------------------------------------------------+
|                        MARL Web Studio (marl-dashboard/)                          |
|                                                                                   |
|  +--------------------+      +--------------------+      +---------------------+  |
|  |   3D Cyber Arena   |      |  2D Tactical Grid  |      |   Policy Inspector  |  |
|  |  (renderer-3d.js)  |      |  (renderer-2d.js)  |      | (renderer-policy.js)|  |
|  +--------------------+      +--------------------+      +---------------------+  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |           Real-Time Telemetry & Chart.js Analytics (app.js / chart.js)     |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 🧠 Mathematical Foundations & Core RL Theory

### 1. Markov Decision Process (MDP)
The multi-agent navigation task is modeled as a tuple $(S, A, P, R, \gamma)$ across $N$ interacting agents:

| Symbol | Definition | Project Implementation |
| :--- | :--- | :--- |
| $S$ | State Space | Grid coordinates $(x_i, y_i) \in [0, \text{size}-1]^2$ for each agent $i$ |
| $A$ | Action Space | Discrete actions: `0: Up (North)`, `1: Down (South)`, `2: Left (West)`, `3: Right (East)` |
| $P$ | Transition Dynamics | Deterministic spatial displacement subject to boundary constraints and obstacle bounces |
| $R$ | Reward Function | Shaped scalar feedback incentivizing speed, safety, and goal accomplishment |
| $\gamma$ | Discount Factor | $\gamma \in (0, 1)$ balancing immediate vs. future cumulative returns |

---

### 2. Reinforcement Learning Algorithms Formulation

#### **A. Q-Learning (Off-Policy Temporal Difference Control)**
Q-Learning learns the optimal action-value function $Q^*(s, a)$ independently of the policy being followed during exploration. The value update uses the maximum future reward of the next state:
$$Q(s, a) \leftarrow Q(s, a) + \alpha \left[ r + \gamma \max_{a'} Q(s', a') - Q(s, a) \right]$$
where $\alpha$ is the learning rate and $\left( r + \gamma \max_{a'} Q(s', a') - Q(s, a) \right)$ is the **Temporal Difference (TD) Error**.

#### **B. SARSA (On-Policy Temporal Difference Control)**
SARSA (**S**tate-**A**ction-**R**eward-**S**tate-**A**ction) updates the action-value function based on the action $a'$ actually executed by the agent under its current exploration policy:
$$Q(s, a) \leftarrow Q(s, a) + \alpha \left[ r + \gamma Q(s', a') - Q(s, a) \right]$$
> *Why use SARSA?* Because SARSA accounts for exploration noise during training, it learns safer paths around hazards compared to Q-Learning's aggressive edge-hugging behavior.

#### **C. Monte Carlo Control (Return Estimation)**
Instead of step-by-step TD updates, Monte Carlo agents record complete episode trajectories $(s_0, a_0, r_0, s_1, a_1, r_1, \dots, s_T)$ and backpropagate the discounted cumulative return $G_t$ at the end of the episode:
$$G_t = \sum_{k=0}^{T-t-1} \gamma^k r_{t+k+1}$$
$$Q(s_t, a_t) \leftarrow Q(s_t, a_t) + \alpha (G_t - Q(s_t, a_t))$$

#### **D. Deep Q-Network (DQN Lite)**
To demonstrate deep reinforcement learning without heavy external ML dependencies, the project includes a custom **pure-Python/NumPy 2-Layer Neural Q-Approximator**:
- **State Encoding**: Normalized coordinates $\left[ \frac{x}{\text{size}-1}, \frac{y}{\text{size}-1} \right]$.
- **Network Architecture**: Input Layer (2 nodes) $\to$ Hidden Layer (16 nodes with ReLU activation) $\to$ Output Layer (4 action Q-values).
- **Experience Replay Buffer**: Stores up to 500 transitions $(s, a, r, s', \text{done})$ and uniformly samples mini-batches ($B=16$) to break temporal correlation.
- **Target Network Synchronization**: Maintains a cloned target network $(W_1^{\text{target}}, W_2^{\text{target}})$ updated every 20 steps to stabilize gradient descent against the loss function:
$$\mathcal{L}(\theta) = \frac{1}{B} \sum_{i=1}^B \left( y_i - Q(s_i, a_i; \theta) \right)^2, \quad y_i = r_i + \gamma \max_{a'} Q(s'_i, a'; \theta^{\text{target}})$$

---

### 3. Exploration vs. Exploitation Strategies

```
        Exploration vs. Exploitation Spectrum
        
   Pure Random <-------------------------------> Pure Greedy
  (High ε / High T)                         (ε -> 0 / UCB / Low T)
        |                                             |
   Epsilon-Greedy                              Boltzmann & UCB
 (Decaying random steps)                   (Probabilistic / Confidence)
```

1. **$\epsilon$-Greedy Exploration**:
   $$\pi(a \mid s) = \begin{cases} \text{Random action } \in A & \text{with probability } \epsilon \\ \arg\max_{a'} Q(s, a') & \text{with probability } 1 - \epsilon \end{cases}$$
   where $\epsilon$ decays exponentially per episode: $\epsilon_{t+1} = \max(\epsilon_{\min}, \epsilon_t \cdot \lambda_{\text{decay}})$.

2. **Boltzmann / Softmax Exploration**:
   Assigns selection probabilities proportional to exponentiated Q-values modulated by a temperature parameter $T$:
   $$P(a \mid s) = \frac{\exp\left( \frac{Q(s, a)}{T} \right)}{\sum_{a' \in A} \exp\left( \frac{Q(s, a')}{T} \right)}$$
   High $T$ produces nearly uniform random actions; as $T \to 0$, action selection becomes deterministically greedy.

3. **Upper Confidence Bound (UCB)**:
   Balances exploitation with systematic exploration of infrequently tested state-action pairs:
   $$A_t = \arg\max_{a \in A} \left[ Q(s, a) + c \sqrt{\frac{\ln N(s)}{N(s, a)}} \right]$$
   where $N(s)$ is the total visitation count of state $s$, $N(s,a)$ is the visitation count of taking action $a$ in state $s$, and $c > 0$ controls confidence weighting.

---

### 4. Reward Shaping & Multi-Agent Dynamics

#### **Reward Matrix**
| Event | Reward ($R$) | Behavioral Incentive |
| :--- | :--- | :--- |
| **Step Penalty** | `-1.0` | Encourages agents to find the shortest possible path to the goal |
| **Obstacle Collision** | `-5.0` | Punishes hitting hazard pillars; agents bounce back to previous cell |
| **Inter-Agent Collision** | `-10.0` | Strongly penalizes occupying the same grid cell as another agent |
| **Goal Accomplishment** | `+20.0` | Rewards reaching the designated energy pedestal |

#### **Independent vs. Cooperative Team Dynamics**
- **Independent Mode (`IQL`)**: Each agent $i$ updates its parameters solely using its individual reward $r_i$. Other agents are treated as moving parts of a non-stationary environment.
- **Cooperative Mode (`Shared`)**: Rewards are pooled and averaged across the team: $r_{\text{shared}} = \frac{1}{N} \sum_{i=1}^N r_i$. All agents receive $r_{\text{shared}}$, encouraging self-sacrifice (e.g., waiting at a bottleneck) to maximize collective efficiency.

---

## 🕹️ Interactive Dashboard Guide & Viewports

The frontend studio provides three specialized visual inspection modes:

### 1. 🕹️ 3D Cyber-Robot Arena
- Built with **Three.js** featuring custom 3D geometries, materials, and point lighting.
- **Robotic Agents**: Rendered as metallic cylinders with animated directional indicators and status domes.
- **Energy Goal**: A glowing green pedestal with a rotating halo ring marking the target coordinate.
- **Hazard Pillars**: Crimson industrial columns marking blocked grid cells.
- **Controls**: Use `Left Click + Drag` to orbit around the arena, `Right Click + Drag` to pan, and `Scroll Wheel` to zoom.

### 2. 🗺️ 2D Tactical Grid
- High-contrast top-down view ideal for inspecting precise coordinates and simultaneous trajectory crossings.
- Displays color-coded agent badges along with real-time status indicators.

### 3. 📊 Q-Table & Policy Inspector
- Visualizes the internal representation of **Agent 0** across every grid cell.
- Each cell shows a **Heatmap** (darker blue indicating higher state-action value) along with **Greedy Action Arrows** pointing in the direction of the highest Q-value ($\arg\max_a Q(s,a)$).

---

## ⚡ WebSocket Protocol & API Specifications

The backend server communicates with the studio client over high-speed WebSockets at `ws://localhost:8000/ws`.

### **Client Command Payloads (Outgoing)**
To initiate or modify simulation loops, the client sends JSON commands:
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
*Supported commands: `start`, `pause`, `resume`, `stop`.*

### **Server Stream Payloads (Incoming)**

#### **1. Initialization Frame (`init`)**
Sent when a simulation run is created:
```json
{
  "type": "init",
  "grid_size": 5,
  "num_agents": 3,
  "obstacles": [[2, 2], [1, 3], [3, 1]],
  "goal": [4, 4],
  "config": { ... }
}
```

#### **2. Step Telemetry Frame (`step`)**
Sent at each simulation step (frequency governed by `delay`):
```json
{
  "type": "step",
  "episode": 1,
  "step": 12,
  "positions": [[0, 2], [1, 1], [2, 0]],
  "actions": [3, 1, 0],
  "rewards": [-1.0, -1.0, -5.0],
  "metrics": {
    "epsilon": 0.48,
    "collisions": 1
  },
  "q_table": {
    "0,0": [0.0, -1.2, 0.0, 3.4],
    "0,1": [1.1, 2.5, -0.8, 4.2]
  }
}
```

#### **3. Episode Summary Frame (`episode_end`)**
Sent upon episode completion or goal attainment:
```json
{
  "type": "episode_end",
  "episode": 1,
  "total_reward": 14.5,
  "agent_rewards": [18.0, -2.5, -1.0],
  "steps_taken": 24,
  "collisions": 1,
  "goal_reached": true
}
```

---

## 🚀 Getting Started & Quickstart Guide

### Prerequisites
- **Python 3.8+** installed on your system.
- A modern web browser supporting WebSockets and WebGL (Chrome, Edge, Firefox, or Safari).

### 1. Clone the Repository & Install Dependencies
Open your terminal inside the workspace directory and install the required Python packages:
```bash
# Install backend dependencies
pip install -r requirements.txt
```
*(If `requirements.txt` is missing, run: `pip install fastapi uvicorn`)*

### 2. Launch the Production Studio Backend
Start the FastAPI server with live reloading enabled:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
or run `python -m uvicorn app.main:app --reload`.

### 3. Access the Studio Dashboard
Open your web browser and navigate to:
```
http://localhost:8000
```
Once opened, the dashboard will automatically connect to the WebSocket server (`ws://localhost:8000/ws`), display **Connected ✅** in the header, and begin running the default 3D simulation!

---

## 💡 Troubleshooting & Best Practices

- **Slow Convergence or Circling Behavior**:
  If agents circle endlessly or fail to reach the goal, try increasing the **Discount Factor ($\gamma$) to `0.95`** so agents value long-term goal attainment over immediate step penalties.
- **Congestion in Bottlenecks**:
  When testing the `Center Bottleneck Gate` obstacle layout with 3+ agents, switch **MARL Team Goal** to `Cooperative Team (Shared Rewards)`. This incentivizes agents to yield right-of-way rather than colliding in the doorway.
- **Exploring Deep Q-Network (DQN Lite)**:
  Because DQN uses function approximation, it requires more steps to stabilize than tabular methods. Set **Decay Rate per Episode** to `0.99` and run for `50+ Episodes` to observe smooth neural policy convergence.

---

## 🔮 Roadmap & Future Horizons

- [ ] **Multi-Agent Deep Deterministic Policy Gradients (MADDPG)**: Centralized training with decentralized execution for continuous action spaces.
- [ ] **Inter-Agent Communication Channels**: Implementing differentiable communication networks (e.g., CommNet / DIAL) where agents transmit hidden vector messages.
- [ ] **Dynamic & Moving Obstacles**: Introducing patrolling hazards that force agents to learn predictive temporal avoidance.
- [ ] **Custom Grid Editor**: Frontend point-and-click layout builder allowing users to design and export custom industrial floor plans.

---

*Built by the MARL Autonomous Robotics Research Team.*
