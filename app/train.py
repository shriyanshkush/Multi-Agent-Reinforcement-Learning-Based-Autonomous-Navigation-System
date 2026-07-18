import asyncio
from app.env import GridEnv
from app.agent import create_agent

async def run_simulation_stream(config=None):
    if config is None:
        config = {}

    num_agents = int(config.get("num_agents", 3))
    episodes = int(config.get("episodes", 25))
    steps = int(config.get("steps", 50))
    delay = float(config.get("delay", 0.15))
    grid_size = int(config.get("grid_size", 5))
    algorithm = config.get("algorithm", "q_learning")
    obstacles_preset = config.get("obstacles", "standard")
    team_mode = config.get("team_mode", "independent").lower()

    env = GridEnv(size=grid_size, num_agents=num_agents, obstacles_preset=obstacles_preset)
    agents = [create_agent(algorithm=algorithm, config=config, grid_size=grid_size) for _ in range(num_agents)]

    # 🔥 Emit initialization frame
    yield {
        "type": "init",
        "grid_size": env.size,
        "num_agents": num_agents,
        "obstacles": env.obstacles,
        "goal": env.goal,
        "config": {
            "algorithm": algorithm,
            "exploration": config.get("exploration", "epsilon_greedy"),
            "team_mode": team_mode,
            "grid_size": grid_size,
            "num_agents": num_agents,
            "episodes": episodes,
            "delay": delay
        }
    }

    await asyncio.sleep(0.1)

    for ep in range(1, episodes + 1):
        states = env.reset()
        total_reward = 0.0
        episode_agent_rewards = [0.0] * num_agents
        episode_collisions = 0
        next_actions = [None] * num_agents

        for step in range(steps):
            actions = []
            for i in range(num_agents):
                if next_actions[i] is not None:
                    actions.append(next_actions[i])
                else:
                    actions.append(agents[i].choose_action(states[i]))

            step_res = env.step(actions)
            if len(step_res) == 4:
                next_states, rewards, done, info = step_res
            else:
                next_states, rewards, done = step_res[:3]
                info = {}

            episode_collisions += info.get("collisions", 0)

            # Determine learning rewards (cooperative shared vs independent)
            if team_mode in ["cooperative", "shared"]:
                avg_reward = sum(rewards) / len(rewards)
                learning_rewards = [avg_reward] * num_agents
            else:
                learning_rewards = rewards

            total_reward += sum(rewards)
            for i in range(num_agents):
                episode_agent_rewards[i] += rewards[i]

            # 🔥 LIVE step data
            yield {
                "type": "step",
                "episode": ep,
                "step": step + 1,
                "positions": next_states,
                "actions": actions,
                "rewards": [round(r, 2) for r in rewards],
                "metrics": {
                    "epsilon": agents[0].get_exploration_metric(),
                    "collisions": episode_collisions
                },
                "q_table": agents[0].get_q_table_dict()
            }

            # Learning update
            new_next_actions = [None] * num_agents
            for i in range(num_agents):
                new_next_actions[i] = agents[i].learn(
                    states[i],
                    actions[i],
                    learning_rewards[i],
                    next_states[i],
                    next_a=None,
                    done=done
                )

            next_actions = new_next_actions
            states = next_states

            await asyncio.sleep(delay)

            if done:
                break

        # Episode end hooks
        for i in range(num_agents):
            agents[i].on_episode_end()

        # 🔥 Episode summary
        yield {
            "type": "episode_end",
            "episode": ep,
            "total_reward": round(total_reward, 2),
            "agent_rewards": [round(r, 2) for r in episode_agent_rewards],
            "steps_taken": step + 1,
            "collisions": episode_collisions,
            "goal_reached": done
        }

        await asyncio.sleep(delay * 1.5)