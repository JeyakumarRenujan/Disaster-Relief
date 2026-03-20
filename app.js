const ESP32_API = "http://10.208.164.237/data";     // change this
const ESP32_STATUS = "http://10.208.164.237/status"; // change this

const temperatureValue = document.getElementById("temperatureValue");
const humidityValue = document.getElementById("humidityValue");
const sensor1Value = document.getElementById("sensor1Value");
const sensor2Value = document.getElementById("sensor2Value");
const warningText = document.getElementById("warningText");
const warningPanel = document.getElementById("warningPanel");
const warningBadge = document.getElementById("warningBadge");
const historyTableBody = document.getElementById("historyTableBody");
const historyMobileList = document.getElementById("historyMobileList");
const deviceConnection = document.getElementById("deviceConnection");
const deviceApi = document.getElementById("deviceApi");
const lastUpdate = document.getElementById("lastUpdate");
const heroStatus = document.getElementById("heroStatus");
const heroSubtext = document.getElementById("heroSubtext");
const refreshBtn = document.getElementById("refreshBtn");

const labels = [];
const temperatureData = [];
const humidityData = [];
const sensor1Data = [];
const sensor2Data = [];
const maxPoints = window.innerWidth <= 640 ? 8 : 12;
const historyRows = [];

function getTickColor() {
  return "#94a3b8";
}

function getGridColor() {
  return "rgba(255,255,255,0.06)";
}

function getLegendColor() {
  return "#eef4ff";
}

function makeChart(canvasId, label, dataArray) {
  const ctx = document.getElementById(canvasId).getContext("2d");

  return new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label,
        data: dataArray,
        borderWidth: 2,
        tension: 0.35,
        fill: false,
        pointRadius: window.innerWidth <= 640 ? 2 : 3,
        pointHoverRadius: window.innerWidth <= 640 ? 3 : 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: {
          labels: {
            color: getLegendColor()
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: getTickColor(),
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: window.innerWidth <= 640 ? 4 : 8
          },
          grid: {
            color: getGridColor()
          }
        },
        y: {
          ticks: {
            color: getTickColor()
          },
          grid: {
            color: getGridColor()
          }
        }
      }
    }
  });
}

const temperatureChart = makeChart("temperatureChart", "Temperature (°C)", temperatureData);
const humidityChart = makeChart("humidityChart", "Humidity (%)", humidityData);

const waterChart = new Chart(document.getElementById("waterChart").getContext("2d"), {
  type: "line",
  data: {
    labels,
    datasets: [
      {
        label: "Sensor 1",
        data: sensor1Data,
        borderWidth: 2,
        tension: 0.35,
        fill: false,
        pointRadius: window.innerWidth <= 640 ? 2 : 3,
        pointHoverRadius: window.innerWidth <= 640 ? 3 : 4
      },
      {
        label: "Sensor 2",
        data: sensor2Data,
        borderWidth: 2,
        tension: 0.35,
        fill: false,
        pointRadius: window.innerWidth <= 640 ? 2 : 3,
        pointHoverRadius: window.innerWidth <= 640 ? 3 : 4
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false
    },
    plugins: {
      legend: {
        labels: {
          color: getLegendColor()
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: getTickColor(),
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: window.innerWidth <= 640 ? 4 : 8
        },
        grid: {
          color: getGridColor()
        }
      },
      y: {
        ticks: {
          color: getTickColor()
        },
        grid: {
          color: getGridColor()
        }
      }
    }
  }
});

function pushChartData(timeLabel, temp, hum, s1, s2) {
  labels.push(timeLabel);
  temperatureData.push(temp);
  humidityData.push(hum);
  sensor1Data.push(s1);
  sensor2Data.push(s2);

  if (labels.length > maxPoints) {
    labels.shift();
    temperatureData.shift();
    humidityData.shift();
    sensor1Data.shift();
    sensor2Data.shift();
  }

  temperatureChart.update();
  humidityChart.update();
  waterChart.update();
}

function updateWarningUI(message) {
  warningText.textContent = message;

  if (message.includes("ALERT")) {
    warningPanel.classList.remove("safe");
    warningPanel.classList.add("alert");
    warningBadge.textContent = "ALERT";
    heroStatus.textContent = "Critical environmental attention required";
    heroSubtext.textContent = "One or more monitored values indicate a possible unsafe condition for relief materials.";
  } else {
    warningPanel.classList.remove("alert");
    warningPanel.classList.add("safe");
    warningBadge.textContent = "SAFE";
    heroStatus.textContent = "Environmental conditions are stable";
    heroSubtext.textContent = "Current storage conditions appear acceptable for monitored relief materials.";
  }
}

function renderHistoryTable() {
  historyTableBody.innerHTML = historyRows.map(row => `
    <tr>
      <td>${row.time}</td>
      <td>${row.temp}</td>
      <td>${row.hum}</td>
      <td>${row.s1}</td>
      <td>${row.s2}</td>
      <td>${row.warning}</td>
    </tr>
  `).join("");
}

function renderMobileHistory() {
  if (!historyMobileList) return;

  historyMobileList.innerHTML = historyRows.map(row => {
    const isAlert = row.warning.includes("ALERT");

    return `
      <div class="history-mobile-item">
        <div class="history-mobile-top">
          <div class="history-mobile-time">${row.time}</div>
          <div class="history-mobile-badge ${isAlert ? "alert" : "safe"}">
            ${isAlert ? "ALERT" : "SAFE"}
          </div>
        </div>

        <div class="history-mobile-grid">
          <div class="history-mobile-field">
            <span>Temperature</span>
            <strong>${row.temp} °C</strong>
          </div>

          <div class="history-mobile-field">
            <span>Humidity</span>
            <strong>${row.hum} %</strong>
          </div>

          <div class="history-mobile-field">
            <span>Sensor 1</span>
            <strong>${row.s1}</strong>
          </div>

          <div class="history-mobile-field">
            <span>Sensor 2</span>
            <strong>${row.s2}</strong>
          </div>
        </div>

        <div class="history-mobile-warning">
          <span>Warning</span>
          <strong>${row.warning}</strong>
        </div>
      </div>
    `;
  }).join("");
}

function addHistoryRow(time, temp, hum, s1, s2, warning) {
  historyRows.unshift({ time, temp, hum, s1, s2, warning });

  if (historyRows.length > 10) {
    historyRows.pop();
  }

  renderHistoryTable();
  renderMobileHistory();
}

async function fetchStatus() {
  try {
    const res = await fetch(ESP32_STATUS);
    const data = await res.json();

    deviceConnection.textContent = "Connected";
    deviceApi.textContent = data.ip || "Available";
  } catch (error) {
    deviceConnection.textContent = "Disconnected";
    deviceApi.textContent = "Unavailable";
  }
}

async function fetchLiveData() {
  try {
    const res = await fetch(ESP32_API);
    const data = await res.json();

    const now = new Date();
    const timeLabel = now.toLocaleTimeString();

    temperatureValue.textContent = `${data.temperature} °C`;
    humidityValue.textContent = `${data.humidity} %`;
    sensor1Value.textContent = data.sensor1;
    sensor2Value.textContent = data.sensor2;
    lastUpdate.textContent = timeLabel;

    updateWarningUI(data.warning);
    pushChartData(timeLabel, data.temperature, data.humidity, data.sensor1, data.sensor2);
    addHistoryRow(timeLabel, data.temperature, data.humidity, data.sensor1, data.sensor2, data.warning);
  } catch (error) {
    deviceConnection.textContent = "Disconnected";
    heroStatus.textContent = "Unable to reach ESP32 live API";
    heroSubtext.textContent = "Check hotspot connection, ESP32 IP address, and API availability.";
    console.error("Fetch error:", error);
  }
}

refreshBtn.addEventListener("click", () => {
  fetchStatus();
  fetchLiveData();
});

fetchStatus();
fetchLiveData();

setInterval(fetchStatus, 8000);
setInterval(fetchLiveData, 2000);