import asyncio
from app.env import GridEnv
from app.agent import QLearningAgent

async def run_simulation_stream(num_agents=2, episodes=5, steps=50, delay=0.2):
    env = GridEnv(num_agents=num_agents)
    agents = [QLearningAgent() for _ in range(num_agents)]

    for ep in range(episodes):
        states = env.reset()
        total_reward = 0

        for step in range(steps):
            actions = [agents[i].choose_action(states[i]) for i in range(num_agents)]
            next_states, rewards, done = env.step(actions)

            total_reward += sum(rewards)

            # 🔥 LIVE step data
            yield {
                "type": "step",
                "episode": ep,
                "step": step,
                "positions": next_states,
                "rewards": rewards
            }

            # Learning
            for i in range(num_agents):
                agents[i].learn(states[i], actions[i], rewards[i], next_states[i])

            states = next_states

            await asyncio.sleep(delay)

            if done:
                break

        # 🔥 Episode summary
        yield {
            "type": "episode_end",
            "episode": ep,
            "total_reward": total_reward
        }