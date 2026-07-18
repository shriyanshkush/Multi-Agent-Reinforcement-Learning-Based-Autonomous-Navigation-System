class RendererPolicy {
    constructor() {
        this.container = null;
        this.gridSize = 5;
        this.obstacles = new Set();
        this.goal = null;
        this.arrows = ['↑', '↓', '←', '→'];
    }

    init(containerId) {
        this.container = document.getElementById(containerId);
    }

    buildEnvironment(gridSize = 5, obstacles = [], goal = null) {
        if (!this.container) this.init('policy-grid');
        if (!this.container) return;

        this.gridSize = gridSize;
        this.obstacles = new Set(obstacles.map(o => `${o[0]},${o[1]}`));
        this.goal = goal ? `${goal[0]},${goal[1]}` : null;

        this.container.innerHTML = '';
        this.container.style.gridTemplateColumns = `repeat(${gridSize}, minmax(85px, 1fr))`;

        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const cell = document.createElement('div');
                cell.className = 'policy-cell';
                const coordKey = `${r},${c}`;
                cell.dataset.coord = coordKey;

                if (this.obstacles.has(coordKey)) {
                    cell.style.background = 'rgba(239, 68, 68, 0.15)';
                    cell.style.border = '1px solid #ef4444';
                    cell.innerHTML = `
                        <span class="coord" style="color:#f87171">[${r},${c}]</span>
                        <div class="best-arrow" style="font-size:1.1rem; color:#f87171">⚠️ HAZARD</div>
                    `;
                } else if (this.goal === coordKey) {
                    cell.style.background = 'rgba(16, 185, 129, 0.15)';
                    cell.style.border = '1px solid #10b981';
                    cell.innerHTML = `
                        <span class="coord" style="color:#34d399">[${r},${c}]</span>
                        <div class="best-arrow" style="font-size:1.1rem; color:#34d399">🎯 GOAL</div>
                    `;
                } else {
                    cell.innerHTML = `
                        <span class="coord">[${r},${c}]</span>
                        <div class="best-arrow">●</div>
                        <div class="q-vals">
                            <span class="q-u">U: 0.0</span>
                            <span class="q-d">D: 0.0</span>
                            <span class="q-l">L: 0.0</span>
                            <span class="q-r">R: 0.0</span>
                        </div>
                    `;
                }

                this.container.appendChild(cell);
            }
        }
    }

    updatePolicy(qTable = {}) {
        if (!this.container) return;

        Object.entries(qTable).forEach(([coord, qVals]) => {
            if (this.obstacles.has(coord) || this.goal === coord) return;

            const cellEl = this.container.querySelector(`[data-coord='${coord}']`);
            if (!cellEl) return;

            const maxQ = Math.max(...qVals);
            const minQ = Math.min(...qVals);
            const isAllEqual = qVals.every(v => Math.abs(v - qVals[0]) < 1e-5);

            const arrowEl = cellEl.querySelector('.best-arrow');
            if (arrowEl) {
                if (isAllEqual) {
                    arrowEl.innerText = '●';
                    arrowEl.style.color = '#9ca3af';
                } else {
                    const bestIdx = qVals.indexOf(maxQ);
                    arrowEl.innerText = this.arrows[bestIdx];
                    arrowEl.style.color = '#66fcf1';
                }
            }

            const qU = cellEl.querySelector('.q-u');
            const qD = cellEl.querySelector('.q-d');
            const qL = cellEl.querySelector('.q-l');
            const qR = cellEl.querySelector('.q-r');

            if (qU && qD && qL && qR) {
                qU.innerText = `U:${qVals[0].toFixed(1)}`;
                qD.innerText = `D:${qVals[1].toFixed(1)}`;
                qL.innerText = `L:${qVals[2].toFixed(1)}`;
                qR.innerText = `R:${qVals[3].toFixed(1)}`;
            }

            // Subtle heatmap background color based on highest action value
            if (!isAllEqual && maxQ > 0) {
                const intensity = Math.min(0.25, maxQ * 0.02);
                cellEl.style.backgroundColor = `rgba(102, 252, 241, ${intensity})`;
            }
        });
    }
}

window.rendererPolicy = new RendererPolicy();
