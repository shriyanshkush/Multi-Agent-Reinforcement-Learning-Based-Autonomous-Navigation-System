from app.algorithms import (
    QLearningAgent,
    SARSAAgent,
    MonteCarloAgent,
    DQNAgent,
    EpsilonGreedyExploration,
    BoltzmannExploration,
    UCBExploration
)

def create_agent(algorithm="q_learning", config=None, grid_size=5):
    """
    Factory function to instantiate the requested RL agent with custom exploration and hyperparameters.
    """
    if config is None:
        config = {}

    lr = float(config.get("lr", 0.1))
    gamma = float(config.get("gamma", 0.9))
    exploration_type = config.get("exploration", "epsilon_greedy")

    # Build exploration strategy
    if exploration_type == "epsilon_greedy":
        epsilon = float(config.get("epsilon", 0.5))
        epsilon_min = float(config.get("epsilon_min", 0.05))
        epsilon_decay = float(config.get("epsilon_decay", 0.98))
        exploration = EpsilonGreedyExploration(epsilon=epsilon, epsilon_min=epsilon_min, epsilon_decay=epsilon_decay)
    elif exploration_type == "boltzmann":
        temp = float(config.get("temp", config.get("epsilon", 0.5)))
        temp_min = float(config.get("temp_min", 0.05))
        temp_decay = float(config.get("temp_decay", config.get("epsilon_decay", 0.98)))
        exploration = BoltzmannExploration(temp=temp, temp_min=temp_min, temp_decay=temp_decay)
    elif exploration_type == "ucb":
        c = float(config.get("ucb_c", 1.414))
        exploration = UCBExploration(c=c)
    else:
        exploration = EpsilonGreedyExploration()

    # Build agent algorithm
    algo = algorithm.lower().replace("-", "_")
    if algo in ["q_learning", "qlearning"]:
        return QLearningAgent(grid_size=grid_size, lr=lr, gamma=gamma, exploration=exploration)
    elif algo in ["sarsa"]:
        return SARSAAgent(grid_size=grid_size, lr=lr, gamma=gamma, exploration=exploration)
    elif algo in ["monte_carlo", "montecarlo", "mc"]:
        return MonteCarloAgent(grid_size=grid_size, lr=lr, gamma=gamma, exploration=exploration)
    elif algo in ["dqn", "dqn_lite", "deep_q"]:
        return DQNAgent(grid_size=grid_size, lr=lr, gamma=gamma, exploration=exploration)
    else:
        return QLearningAgent(grid_size=grid_size, lr=lr, gamma=gamma, exploration=exploration)