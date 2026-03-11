
// ================================
// Global chart variables
// ================================

let equityChart = null
let histChart = null

// --- Chart Theme Settings ---
Chart.defaults.color = "rgba(241, 245, 249, 0.7)"; // text-muted
Chart.defaults.font.family = "'Outfit', sans-serif";
const gridColor = "rgba(255, 255, 255, 0.05)";

// ================================
// Run Monte Carlo Simulation
// ================================

function runSimulation() {

    let winrate = document.getElementById("winrate").value / 100
    let reward = parseFloat(document.getElementById("reward").value)
    let risk = parseFloat(document.getElementById("risk").value)

    let trades = parseInt(document.getElementById("trades").value)
    let sims = parseInt(document.getElementById("sims").value)

    let initialBalance = parseFloat(document.getElementById("balance").value)
    let riskpct = document.getElementById("riskpct").value / 100

    let equityDatasets = []
    let finalBalances = []
    let drawdowns = []
    let losingStreaks = []

    // ================================
    // Monte Carlo loop
    // ================================

    for (let s = 0; s < sims; s++) {

        let equity = initialBalance
        let peak = initialBalance
        let maxDD = 0

        let losing = 0
        let worstLosing = 0

        let curve = []

        // Generate a random hue for each simulation line to create a cool effect
        let hue = Math.floor(Math.random() * 60) + 190; // Range ~190-250 (Blues/Purples)
        let lineColor = `hsla(${hue}, 100%, 65%, 0.15)`;

        for (let t = 0; t < trades; t++) {

            let riskAmount = equity * riskpct

            if (Math.random() < winrate) {

                equity += riskAmount * reward
                losing = 0

            } else {

                equity -= riskAmount
                losing++

            }

            if (losing > worstLosing) {
                worstLosing = losing
            }

            if (equity > peak) {
                peak = equity
            }

            let dd = (peak - equity) / peak

            if (dd > maxDD) {
                maxDD = dd
            }

            curve.push(equity)

        }

        equityDatasets.push({
            data: curve,
            borderWidth: 1.5,
            borderColor: lineColor,
            fill: false,
            tension: 0.1 // slight curve
        })

        finalBalances.push(equity)
        drawdowns.push(maxDD)
        losingStreaks.push(worstLosing)

    }

    // ================================
    // Statistics
    // ================================

    let avgBalance = average(finalBalances)
    let worstDD = Math.max(...drawdowns)
    let worstStreak = Math.max(...losingStreaks)

    // Format currency
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    });

    document.getElementById("avgBalance").innerText = formatter.format(avgBalance)
    document.getElementById("maxDD").innerText = (worstDD * 100).toFixed(2) + "%"
    document.getElementById("worstStreak").innerText = worstStreak

    // ================================
    // Draw Charts
    // ================================

    drawEquityChart(equityDatasets, trades)
    drawHistogram(finalBalances)

}

// ================================
// Utility Functions
// ================================

function average(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length
}

// ================================
// Equity Curve Chart
// ================================

function drawEquityChart(datasets, trades) {

    const ctx = document.getElementById("equityChart")

    if (equityChart) {
        equityChart.destroy()
    }

    equityChart = new Chart(ctx, {

        type: "line",

        data: {

            labels: Array.from({ length: trades }, (_, i) => i + 1),

            datasets: datasets

        },

        options: {

            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: "Monte Carlo Equity Curves",
                    font: { size: 16, weight: '600' },
                    padding: { bottom: 20 }
                },
                tooltip: { enabled: false } // Disable tooltips for performance on 200 lines
            },

            elements: {
                point: { radius: 0 }
            },

            scales: {

                x: {
                    grid: { color: gridColor },
                    title: {
                        display: true,
                        text: "Trade Number"
                    }
                },

                y: {
                    grid: { color: gridColor },
                    title: {
                        display: true,
                        text: "Account Balance ($)"
                    },
                    ticks: {
                        callback: function (value) {
                            return "$" + value.toLocaleString();
                        }
                    }
                }

            }

        }

    })

}

// ================================
// Histogram Chart
// ================================

function drawHistogram(data) {

    const ctx = document.getElementById("histChart")

    if (histChart) {
        histChart.destroy()
    }

    let bins = 20

    let min = Math.min(...data)
    let max = Math.max(...data)

    // Handle case where min == max (e.g. 0 trades or 0 risk)
    if (min === max) {
        max = min + 1;
    }

    let step = (max - min) / bins

    let hist = new Array(bins).fill(0)
    let labels = new Array(bins)

    // Create labels based on ranges
    for (let i = 0; i < bins; i++) {
        let rangeStart = min + (i * step);
        let rangeEnd = min + ((i + 1) * step);

        // Format to compact numbers like $10k
        let formatNum = (num) => "$" + (num > 1000 ? (num / 1000).toFixed(1) + "k" : Math.floor(num));
        labels[i] = `${formatNum(rangeStart)} - ${formatNum(rangeEnd)}`;
    }

    for (let v of data) {

        let index = Math.floor((v - min) / step)

        if (index >= bins) {
            index = bins - 1
        }

        hist[index]++

    }

    // Gradient for bars
    let gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, '#00f2fe');   // accent-blue
    gradient.addColorStop(1, '#4facfe');   // accent-purple

    histChart = new Chart(ctx, {

        type: "bar",

        data: {

            labels: labels,

            datasets: [{
                label: "Simulations",
                data: hist,
                backgroundColor: gradient,
                borderRadius: 4,
                borderSkipped: false
            }]

        },

        options: {

            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: "Final Balance Distribution",
                    font: { size: 16, weight: '600' },
                    padding: { bottom: 20 }
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 14, 23, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1
                }
            },

            scales: {

                x: {
                    grid: { display: false },
                    title: {
                        display: true,
                        text: "Final Balance Range"
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        font: { size: 10 }
                    }
                },

                y: {
                    grid: { color: gridColor },
                    title: {
                        display: true,
                        text: "Frequency (Count)"
                    }
                }

            }

        }

    })

}
