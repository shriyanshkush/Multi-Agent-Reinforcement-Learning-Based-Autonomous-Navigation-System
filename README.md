#   

# 📘 Multi-Agent Reinforcement Learning Simulator 🚀

## 📌 Project Overview

# 

This project implements a **Multi-Agent Reinforcement Learning (MARL)** system using **Q-Learning** in a grid-based environment. Multiple agents learn to navigate toward a goal while avoiding obstacles and collisions.

The system also includes a **FastAPI backend with WebSocket streaming**, enabling **real-time visualization** of agent behavior and learning dynamics.

This project aligns with the concept of an **autonomous navigation system**, where agents learn optimal policies through interaction rather than explicit programming.

* * *

## 🧠 Key Concepts Used

# 

*   Reinforcement Learning (RL)
*   Q-Learning (Value-Based RL)
*   Multi-Agent Systems (MARL)
*   Exploration vs Exploitation
*   Reward Shaping
*   Temporal Difference Learning
*   Real-time Simulation Streaming

* * *

## 🏗️ Project Structure

# 

app/  
│── agent.py        # Q-Learning agent  
│── env.py          # Grid environment  
│── train.py        # Simulation loop (async streaming)  
│  
main.py             # FastAPI server

* * *

## ⚙️ How It Works (High-Level Flow)

# 

1.  Environment is initialized (grid + obstacles + goal)
2.  Multiple agents are created with independent Q-tables
3.  Training runs across multiple episodes:
    *   Agents reset to starting positions
    *   At each step:
        *   Agents select actions using policy
        *   Environment updates positions
        *   Rewards are assigned
        *   Q-values are updated
4.  Simulation data is streamed via WebSocket for real-time visualization

* * *

# 🧠 Mathematical Foundations

## 📌 1. Markov Decision Process (MDP)

# 

The environment is modeled as:

(S,A,P,R,γ)(S, A, P, R, \\gamma)(S,A,P,R,γ)

Where:

*   SSS: States → grid positions (x,y)(x,y)(x,y)
*   AAA: Actions → {up, down, left, right}
*   PPP: Transition function
*   RRR: Reward function
*   γ\\gammaγ: Discount factor

👉 In this project:

*   Finite state space: 5×5\=255 \\times 5 = 255×5\=25
*   Deterministic transitions
*   Multi-agent interaction → non-stationary environment

* * *

## 📌 2. Action-Value Function (Q-Function)

# Q^*(s,a) = \max_{\pi} \mathbb{E} \left[ \sum_{t=0}^{\infty} \gamma^t r_t \right]

This represents the **expected cumulative reward** for taking action aaa in state sss.

* * *

## 📌 3. Bellman Optimality Principle

# Q∗(s,a)\=r+γmax⁡a′Q∗(s′,a′)Q^\*(s,a) = r + \\gamma \\max\_{a'} Q^\*(s',a')Q∗(s,a)\=r+γa′max​Q∗(s′,a′)

👉 The value of a state-action pair depends on:

*   Immediate reward
*   Best future reward

* * *

## 📌 4. Q-Learning Update Rule

# 

Q(s,a)←Q(s,a)+α\[r+γmax⁡a′Q(s′,a′)−Q(s,a)\]Q(s,a) \\leftarrow Q(s,a) + \\alpha \\left\[r + \\gamma \\max\_{a'} Q(s',a') - Q(s,a)\\right\]Q(s,a)←Q(s,a)+α\[r+γmaxa′​Q(s′,a′)−Q(s,a)\]

Where:

*   α\=0.1\\alpha = 0.1α\=0.1: learning rate
*   γ\=0.9\\gamma = 0.9γ\=0.9: discount factor

👉 This update uses **Temporal Difference (TD) error**:

TD\=r+γmax⁡Q(s′)−Q(s)TD = r + \\gamma \\max Q(s') - Q(s)TD\=r+γmaxQ(s′)−Q(s)

* * *

## 📌 5. Policy (ε-Greedy)

# π(a∣s)\={random actionwith probability ϵarg⁡max⁡Q(s,a)otherwise\\pi(a|s) = \\begin{cases} \\text{random action} & \\text{with probability } \\epsilon \\\\ \\arg\\max Q(s,a) & \\text{otherwise} \\end{cases}π(a∣s)\={random actionargmaxQ(s,a)​with probability ϵotherwise​

*   ϵ\=0.3\\epsilon = 0.3ϵ\=0.3 → exploration rate
*   Balances learning vs exploiting knowledge

* * *

## 📌 6. Reward Function (Reward Shaping)

# R\={−1per step−6obstacle hit−10agent collision+20goal reachedR = \\begin{cases} -1 & \\text{per step} \\\\ -6 & \\text{obstacle hit} \\\\ -10 & \\text{agent collision} \\\\ +20 & \\text{goal reached} \\end{cases}R\=⎩⎨⎧​−1−6−10+20​per stepobstacle hitagent collisiongoal reached​

👉 Encourages:

*   Shortest path
*   Safe navigation
*   Collision avoidance

* * *

## 📌 7. Multi-Agent Dynamics

# 

Transition depends on all agents:

P(s′∣s,a1,a2,...,an)P(s'|s, a\_1, a\_2, ..., a\_n)P(s′∣s,a1​,a2​,...,an​)

👉 Makes environment:

*   Dynamic
*   Non-stationary
*   Harder to converge

* * *

## 📌 8. Independent Q-Learning (IQL)

# 

Each agent learns:

Qi(s,a)Q\_i(s,a)Qi​(s,a)

👉 Without coordination:

*   Agents treat others as part of environment
*   Coordination emerges implicitly

* * *

## 🤖 Q-Learning Implementation

# 

Each agent maintains:

self.q\_table\[(x, y)\] \= \[Q(up), Q(down), Q(left), Q(right)\]

### Code Update Rule

# 

target \= r + self.gamma \* max(self.q\_table\[s\_\])  
self.q\_table\[s\]\[a\] += self.lr \* (target \- self.q\_table\[s\]\[a\])

* * *

## 🎯 Policy (Decision Making)

# 

if random.random() < epsilon:  
    return random action  
else:  
    return best action

* * *

## 🎁 Reward System

# 

| Situation | Reward |
| --- | --- |
| Normal move | -1 |
| Hit obstacle | -6 |
| Collision | -10 |
| Goal reached | +20 |

* * *

## 🌍 Grid Environment Details

# 

*   Grid Size: `5 x 5`
*   Goal Position: `(4, 4)`
*   Obstacles:

\[(2,2), (1,3), (3,1)\]

### Agent Start Positions

# 

\[(0,0), (0,1), (0,2), ...\]

👉 All agents start from the **top row**

* * *

## 🔄 Environment Step Logic

# 

1.  Agents take actions
2.  Positions updated
3.  Boundary constraints applied
4.  Obstacle penalties applied
5.  Collision penalties applied
6.  Goal condition checked

* * *

## 💥 Collision Handling

# 

rewards\[i\] \-= 10  
rewards\[j\] \-= 10

👉 Leads to:

*   Implicit coordination
*   Avoidance of overlapping paths

* * *

## 🧠 Learning Across Episodes

# 

✅ Agents retain knowledge

*   Q-table persists across episodes
*   Learning improves over time

| Episode | Behavior |
| --- | --- |
| 1 | Random |
| 5 | Semi-optimized |
| 10 | Near optimal |

* * *

## 🧾 State Representation

# 

State = `(x, y)`

q\_table\[(2,3)\] \= \[values for 4 actions\]

* * *

## 🔌 Why WebSocket?

# 

| HTTP | WebSocket |
| --- | --- |
| One request-response | Continuous streaming |
| Not real-time | Real-time updates |

👉 Used for:

*   Live training visualization
*   Step-by-step updates

* * *

## 🔁 WebSocket Flow

### Backend

# 

@app.websocket("/ws")  
async def websocket\_endpoint(websocket):  
    await websocket.accept()  
  
    async for data in run\_simulation\_stream():  
        await websocket.send\_json(data)

### Data Sent

#### Step Update

# 

{  
  "type": "step",  
  "episode": 1,  
  "step": 5,  
  "positions": \[(x,y)\],  
  "rewards": \[...\]  
}

#### Episode End

# 

{  
  "type": "episode\_end",  
  "total\_reward": 50  
}

* * *

## ⚡ Async Simulation

# 

await asyncio.sleep(delay)

👉 Enables smooth real-time streaming

* * *

## 📊 Training Loop

# 

For each episode:

1.  Reset environment
2.  Loop steps:
    *   choose action
    *   step environment
    *   update Q-values
3.  Stop when goal reached

* * *

## 📈 Learning Behavior

# 

Agents learn to:

*   Find shortest paths
*   Avoid obstacles
*   Avoid collisions
*   Adapt to other agents

* * *

## 🚀 Running the Project

### Install dependencies

# 

pip install fastapi uvicorn

### Run server

# 

uvicorn main:app \--reload

### WebSocket Endpoint

# 

ws://localhost:8000/ws

* * *

## 🔮 Possible Improvements

# 

*   Deep Q Networks (DQN)
*   Centralized training (MADDPG)
*   Agent communication protocols
*   Dynamic environments
*   Frontend visualization (React / Jetpack Compose)
