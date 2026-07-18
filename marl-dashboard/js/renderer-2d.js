class Renderer2D {
    constructor() {
        this.gridContainer = null;
        this.gridSize = 5;
        this.trailHistory = {};
        this.agentColors = ['#ef4444', '#10b981', '#66fcf1', '#8b5cf6', '#fbbf24'];
    }

    init(containerId) {
        this.gridContainer = document.getElementById(containerId);
    }

    buildEnvironment(gridSize = 5, obstacles = [], goal = null) {
        if (!this.gridContainer) this.init('grid');
        if (!this.gridContainer) return;

        this.gridSize = gridSize;
        this.clearTrails();
        this.gridContainer.innerHTML = '';
        this.gridContainer.style.gridTemplateColumns = `repeat(${gridSize}, minmax(65px, 85px))`;
        this.gridContainer.style.gridTemplateRows = `repeat(${gridSize}, minmax(65px, 85px))`;

        const obstacleSet = new Set(obstacles.map(o => `${o[0]},${o[1]}`));
        const goalCoord = goal ? `${goal[0]},${goal[1]}` : null;

        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = r;
                cell.dataset.col = c;

                const coordKey = `${r},${c}`;
                if (obstacleSet.has(coordKey)) {
                    cell.classList.add('obstacle-cell');
                    const icon = document.createElement('span');
                    icon.className = 'obstacle-icon';
                    icon.innerText = '⚠️';
                    cell.appendChild(icon);
                } else if (goalCoord === coordKey) {
                    cell.classList.add('goal-cell');
                    const icon = document.createElement('span');
                    icon.className = 'goal-icon';
                    icon.innerText = '🎯';
                    cell.appendChild(icon);
                }

                this.gridContainer.appendChild(cell);
            }
        }
    }

    clearTrails() {
        this.trailHistory = {};
    }

    updateAgents(positions = []) {
        if (!this.gridContainer) return;

        // Clean previous agent nodes & trails
        document.querySelectorAll('.agent, .agent-trail').forEach(el => el.remove());

        positions.forEach((pos, idx) => {
            const [row, col] = pos;
            if (row < 0 || row >= this.gridSize || col < 0 || col >= this.gridSize) return;

            // Record trail history
            if (!this.trailHistory[idx]) this.trailHistory[idx] = [];
            this.trailHistory[idx].push([row, col]);
            if (this.trailHistory[idx].length > 6) this.trailHistory[idx].shift();

            // Draw historical trail dots
            this.trailHistory[idx].slice(0, -1).forEach((trailPos, tIdx) => {
                const [tr, tc] = trailPos;
                const cellEl = this.gridContainer.querySelector(`[data-row='${tr}'][data-col='${tc}']`);
                if (cellEl) {
                    const trail = document.createElement('div');
                    trail.className = 'agent-trail';
                    trail.style.backgroundColor = this.agentColors[idx % this.agentColors.length];
                    trail.style.opacity = (tIdx + 1) * 0.08;
                    cellEl.appendChild(trail);
                }
            });

            // Draw current agent unit
            const targetCell = this.gridContainer.querySelector(`[data-row='${row}'][data-col='${col}']`);
            if (targetCell) {
                const agentEl = document.createElement('div');
                agentEl.className = `agent agent-${idx % 5}`;
                agentEl.innerText = `A${idx}`;
                targetCell.appendChild(agentEl);
            }
        });
    }
}

window.renderer2D = new Renderer2D();
