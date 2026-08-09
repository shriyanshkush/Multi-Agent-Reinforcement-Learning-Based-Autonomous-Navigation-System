let rewardChart = null;
let chartLabels = [];
let chartDataTotal = [];
let chartDataA0 = [];
let chartDataA1 = [];
let chartDataA2 = [];

function initChart() {
    const canvasEl = document.getElementById('rewardChart');
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');

    if (rewardChart) rewardChart.destroy();

    rewardChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: [
                {
                    label: 'Total Team Reward',
                    data: chartDataTotal,
                    borderColor: '#66fcf1',
                    backgroundColor: 'rgba(102, 252, 241, 0.08)',
                    borderWidth: 2.5,
                    tension: 0.25,
                    fill: true,
                    pointBackgroundColor: '#66fcf1',
                    pointRadius: 3
                },
                {
                    label: 'Agent 0 Reward',
                    data: chartDataA0,
                    borderColor: '#ef4444',
                    borderWidth: 1.5,
                    tension: 0.25,
                    fill: false,
                    pointRadius: 2,
                    borderDash: [3, 3]
                },
                {
                    label: 'Agent 1 Reward',
                    data: chartDataA1,
                    borderColor: '#10b981',
                    borderWidth: 1.5,
                    tension: 0.25,
                    fill: false,
                    pointRadius: 2,
                    borderDash: [3, 3]
                },
                {
                    label: 'Agent 2 Reward',
                    data: chartDataA2,
                    borderColor: '#3b82f6',
                    borderWidth: 1.5,
                    tension: 0.25,
                    fill: false,
                    pointRadius: 2,
                    borderDash: [3, 3]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: { 
                    grid: { color: '#2c3847' }, 
                    ticks: { color: '#9ca3af', font: { size: 11, family: 'Plus Jakarta Sans' } } 
                },
                y: { 
                    grid: { color: '#2c3847' }, 
                    ticks: { color: '#9ca3af', font: { size: 11, family: 'Plus Jakarta Sans' } } 
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#c5c6c7',
                        font: { size: 11, family: 'Plus Jakarta Sans' },
                        boxWidth: 12,
                        padding: 10
                    }
                },
                tooltip: {
                    backgroundColor: '#1f2833',
                    titleColor: '#ffffff',
                    bodyColor: '#c5c6c7',
                    borderColor: '#2c3847',
                    borderWidth: 1,
                    padding: 10
                }
            }
        }
    });
}

function updateChartMetrics(episode, totalReward, agentRewards = []) {
    chartLabels.push(`Ep ${episode}`);
    chartDataTotal.push(totalReward);
    if (agentRewards.length > 0) chartDataA0.push(agentRewards[0] !== undefined ? agentRewards[0] : null);
    if (agentRewards.length > 1) chartDataA1.push(agentRewards[1] !== undefined ? agentRewards[1] : null);
    if (agentRewards.length > 2) chartDataA2.push(agentRewards[2] !== undefined ? agentRewards[2] : null);

    if (rewardChart) rewardChart.update();
}

function resetChartMetrics() {
    chartLabels.length = 0;
    chartDataTotal.length = 0;
    chartDataA0.length = 0;
    chartDataA1.length = 0;
    chartDataA2.length = 0;
    if (rewardChart) rewardChart.update();
}