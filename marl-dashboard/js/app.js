// Central application controller coordinating UI, visual renderers, and WebSocket commands

function initTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;

            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            button.classList.add('active');
            const activePane = document.getElementById(`viewport-${targetTab}`);
            if (activePane) activePane.classList.add('active');

            // Trigger resize hook on 3D canvas when tab becomes visible
            if (targetTab === '3d' && window.renderer3D) {
                setTimeout(() => window.renderer3D.onResize(), 50);
            }
        });
    });
}

function initSliderControls() {
    const bindSlider = (inputId, valId, formatFn = (v) => v) => {
        const inputEl = document.getElementById(inputId);
        const valEl = document.getElementById(valId);
        if (inputEl && valEl) {
            inputEl.addEventListener('input', (e) => {
                valEl.textContent = formatFn(e.target.value);
            });
        }
    };

    bindSlider('inputLr', 'valLr', (v) => parseFloat(v).toFixed(2));
    bindSlider('inputGamma', 'valGamma', (v) => parseFloat(v).toFixed(2));
    bindSlider('inputEpsilon', 'valEpsilon', (v) => parseFloat(v).toFixed(2));
    bindSlider('inputDecay', 'valDecay', (v) => parseFloat(v).toFixed(3));
    bindSlider('inputDelay', 'valDelay', (v) => `${parseFloat(v).toFixed(2)}s`);

    const selectExploration = document.getElementById('selectExploration');
    const labelExplorationRate = document.getElementById('labelExplorationRate');
    if (selectExploration && labelExplorationRate) {
        selectExploration.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val === 'boltzmann') {
                labelExplorationRate.textContent = 'Temperature (T)';
            } else if (val === 'ucb') {
                labelExplorationRate.textContent = 'UCB Parameter (c)';
            } else {
                labelExplorationRate.textContent = 'Exploration Rate (ε)';
            }
        });
    }
}

function getConfigPayload() {
    return {
        algorithm: document.getElementById('selectAlgorithm').value,
        exploration: document.getElementById('selectExploration').value,
        team_mode: document.getElementById('selectTeamMode').value,
        lr: parseFloat(document.getElementById('inputLr').value),
        gamma: parseFloat(document.getElementById('inputGamma').value),
        epsilon: parseFloat(document.getElementById('inputEpsilon').value),
        epsilon_decay: parseFloat(document.getElementById('inputDecay').value),
        num_agents: parseInt(document.getElementById('inputNumAgents').value, 10),
        grid_size: parseInt(document.getElementById('selectGridSize').value, 10),
        obstacles: document.getElementById('selectObstacles').value,
        delay: parseFloat(document.getElementById('inputDelay').value),
        episodes: 30,
        steps: 50
    };
}

function initButtonActions() {
    const btnStart = document.getElementById('btnStart');
    const btnApplyConfig = document.getElementById('btnApplyConfig');
    const btnPause = document.getElementById('btnPause');
    const btnResume = document.getElementById('btnResume');
    const btnStop = document.getElementById('btnStop');

    const triggerStart = () => {
        const config = getConfigPayload();
        console.log("Launching simulation loop with config:", config);
        resetChartMetrics();
        if (window.renderer2D) window.renderer2D.clearTrails();
        sendWebSocketCommand('start', config);
        if (btnPause && btnResume) {
            btnPause.style.display = 'inline-flex';
            btnResume.style.display = 'none';
        }
    };

    if (btnStart) btnStart.addEventListener('click', triggerStart);
    if (btnApplyConfig) btnApplyConfig.addEventListener('click', triggerStart);

    if (btnPause) {
        btnPause.addEventListener('click', () => {
            sendWebSocketCommand('pause');
            btnPause.style.display = 'none';
            if (btnResume) btnResume.style.display = 'inline-flex';
        });
    }

    if (btnResume) {
        btnResume.addEventListener('click', () => {
            sendWebSocketCommand('resume');
            btnResume.style.display = 'none';
            if (btnPause) btnPause.style.display = 'inline-flex';
        });
    }

    if (btnStop) {
        btnStop.addEventListener('click', () => {
            sendWebSocketCommand('stop');
            if (btnPause && btnResume) {
                btnPause.style.display = 'inline-flex';
                btnResume.style.display = 'none';
            }
        });
    }
}

// WebSocket Stream Event Processing Callbacks
function onInitPacket(data) {
    console.log("Environment Initialization Packet received:", data);
    if (window.renderer3D) window.renderer3D.buildEnvironment(data.grid_size, data.obstacles, data.goal);
    if (window.renderer2D) window.renderer2D.buildEnvironment(data.grid_size, data.obstacles, data.goal);
    if (window.rendererPolicy) window.rendererPolicy.buildEnvironment(data.grid_size, data.obstacles, data.goal);

    document.getElementById('currentEpisode').textContent = '1';
    document.getElementById('currentStep').textContent = '0 / 50';
    document.getElementById('currentCollisions').textContent = '0';
}

function onStepPacket(data) {
    document.getElementById('currentEpisode').textContent = data.episode;
    document.getElementById('currentStep').textContent = `${data.step} / 50`;
    document.getElementById('currentExploration').textContent = data.metrics?.epsilon !== undefined ? data.metrics.epsilon : '--';
    document.getElementById('currentCollisions').textContent = data.metrics?.collisions || 0;

    // Render instantaneous agent rewards
    const rewardsHtml = data.rewards.map((r, idx) => {
        const colorClass = r < 0 ? '#ef4444' : '#10b981';
        return `Agent ${idx}: <span style="color: ${colorClass}; font-weight: bold;">${r >= 0 ? '+' : ''}${r}</span>`;
    }).join('<br/>');
    document.getElementById('rewardList').innerHTML = rewardsHtml;

    // Dispatch telemetry to active visualization layers
    if (window.renderer3D) window.renderer3D.updateAgents(data.positions);
    if (window.renderer2D) window.renderer2D.updateAgents(data.positions);
    if (window.rendererPolicy && data.q_table) window.rendererPolicy.updatePolicy(data.q_table);
}

function onEpisodeEndPacket(data) {
    console.log(`Episode ${data.episode} Finished. Total Reward: ${data.total_reward}`);
    updateChartMetrics(data.episode, data.total_reward, data.agent_rewards);
}

// Application Boot
window.addEventListener('DOMContentLoaded', () => {
    initTabNavigation();
    initSliderControls();
    initButtonActions();

    if (window.renderer3D) window.renderer3D.init('threeContainer');
    if (window.renderer2D) window.renderer2D.init('grid');
    if (window.rendererPolicy) window.rendererPolicy.init('policy-grid');
    initChart();

    // Connect WebSocket stream
    connectWebSocket(onInitPacket, onStepPacket, onEpisodeEndPacket);
});