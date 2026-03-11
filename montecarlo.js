
// ================================
// Global chart variables
// ================================

let equityChart = null
let histChart = null

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
            borderWidth: 1,
            fill: false
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

    document.getElementById("avgBalance").innerText =
        "Average Final Balance: " + avgBalance.toFixed(2)

    document.getElementById("maxDD").innerText =
        "Worst Drawdown: " + (worstDD * 100).toFixed(2) + "%"

    document.getElementById("worstStreak").innerText =
        "Worst Losing Streak: " + worstStreak

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

            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: "Monte Carlo Equity Curves"
                }
            },

            elements: {
                point: { radius: 0 }
            },

            scales: {

                x: {
                    title: {
                        display: true,
                        text: "Trade Number"
                    }
                },

                y: {
                    title: {
                        display: true,
                        text: "Account Balance"
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

    let step = (max - min) / bins

    let hist = new Array(bins).fill(0)

    for (let v of data) {

        let index = Math.floor((v - min) / step)

        if (index >= bins) {
            index = bins - 1
        }

        hist[index]++

    }

    histChart = new Chart(ctx, {

        type: "bar",

        data: {

            labels: hist.map((_, i) => "Bin " + (i + 1)),

            datasets: [{
                label: "Frequency",
                data: hist
            }]

        },

        options: {

            plugins: {
                title: {
                    display: true,
                    text: "Final Balance Distribution"
                }
            },

            scales: {

                x: {
                    title: {
                        display: true,
                        text: "Balance Range"
                    }
                },

                y: {
                    title: {
                        display: true,
                        text: "Frequency"
                    }
                }

            }

        }

    })

}

