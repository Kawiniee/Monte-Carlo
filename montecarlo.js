function runSimulation() {

    let winrate = document.getElementById("winrate").value / 100
    let reward = parseFloat(document.getElementById("reward").value)
    let risk = parseFloat(document.getElementById("risk").value)
    let trades = parseInt(document.getElementById("trades").value)
    let sims = parseInt(document.getElementById("sims").value)

    let balance = parseFloat(document.getElementById("balance").value)
    let riskpct = document.getElementById("riskpct").value / 100

    let equityDatasets = []
    let finalBalances = []
    let drawdowns = []
    let losingStreaks = []

    for (let s = 0; s < sims; s++) {

        let equity = balance
        let peak = balance
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

    let avgBalance = average(finalBalances)
    let worstDD = Math.max(...drawdowns)
    let worstStreak = Math.max(...losingStreaks)

    document.getElementById("avgBalance").innerText =
        "Average Final Balance: " + avgBalance.toFixed(2)

    document.getElementById("maxDD").innerText =
        "Worst Drawdown: " + (worstDD * 100).toFixed(2) + "%"

    document.getElementById("worstStreak").innerText =
        "Worst Losing Streak: " + worstStreak

    drawEquityChart(equityDatasets, trades)

    drawHistogram(finalBalances)

}

function average(arr) {

    return arr.reduce((a, b) => a + b, 0) / arr.length

}

function drawEquityChart(datasets, trades) {

    const ctx = document.getElementById("equityChart")

    new Chart(ctx, {

        type: "line",

        data: {

            labels: Array.from({ length: trades }, (_, i) => i + 1),

            datasets: datasets

        },

        options: {

            elements: { point: { radius: 0 } },

            plugins: { legend: { display: false } }

        }

    })

}

function drawHistogram(data) {

    const ctx = document.getElementById("histChart")

    let bins = 20

    let min = Math.min(...data)
    let max = Math.max(...data)

    let step = (max - min) / bins

    let hist = new Array(bins).fill(0)

    for (let v of data) {

        let index = Math.floor((v - min) / step)

        if (index >= bins) { index = bins - 1 }

        hist[index]++

    }

    new Chart(ctx, {

        type: "bar",

        data: {

            labels: hist.map((_, i) => i),

            datasets: [{

                data: hist

            }]

        }

    })

}

