// ===========================
// DOM ELEMENTS
// ===========================
const fromSelect = document.getElementById("fromCurrency");
const toSelect = document.getElementById("toCurrency");
const amountInput = document.getElementById("amount");
const convertBtn = document.getElementById("convertBtn");
const swapBtn = document.getElementById("swapBtn");
const rateInfo = document.getElementById("rateInfo");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");
const resultBox = document.getElementById("result");
const convertedEl = document.getElementById("converted");
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistory");

// ===========================
// STATE
// ===========================
let currencyList = [];
let history = JSON.parse(localStorage.getItem("fx_history") || "[]");

// ===========================
// UI HELPERS
// ===========================
function showLoading() {
  loadingEl.classList.remove("hidden");
}
function hideLoading() {
  loadingEl.classList.add("hidden");
}
function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.remove("hidden");
}
function clearError() {
  errorEl.classList.add("hidden");
}

// ===========================
// INIT — LOAD CURRENCIES
// ===========================
async function init() {
  showLoading();

  try {
    // Pakai API stabil — get all currencies from USD base
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await res.json();

    if (!data || !data.rates) {
      throw new Error("Failed to fetch currency list");
    }

    currencyList = Object.keys(data.rates);
    populateCurrencyDropdown(currencyList);
    renderHistory();
  } catch (err) {
    showError("Could not load currency list. Check your internet connection.");
    console.error(err);
  } finally {
    hideLoading();
  }
}

// ===========================
// POPULATE SELECT ELEMENTS
// ===========================
function populateCurrencyDropdown(list) {
  list.forEach((code) => {
    const opt1 = document.createElement("option");
    const opt2 = document.createElement("option");

    opt1.value = code;
    opt2.value = code;

    opt1.textContent = code;
    opt2.textContent = code;

    fromSelect.appendChild(opt1);
    toSelect.appendChild(opt2);
  });

  // default values
  fromSelect.value = "USD";
  toSelect.value = "IDR";
}

// ===========================
// CONVERT CURRENCY
// ===========================
async function convert() {
  clearError();
  resultBox.classList.add("hidden");

  const amount = parseFloat(amountInput.value);
  const from = fromSelect.value;
  const to = toSelect.value;

  if (!amount || amount <= 0) {
    showError("Please enter a valid amount.");
    return;
  }

  if (from === to) {
    showError("Currencies must be different.");
    return;
  }

  showLoading();

  try {
    // API converter
    const res = await fetch(`https://open.er-api.com/v6/latest/${from}`);
    const data = await res.json();

    const rate = data.rates[to];
    const converted = amount * rate;

    rateInfo.textContent = `1 ${from} = ${rate.toLocaleString()} ${to}`;

    convertedEl.innerHTML = `
      ${amount.toLocaleString()} ${from} = 
      <strong>${converted.toLocaleString(undefined, {
        maximumFractionDigits: 4,
      })} ${to}</strong>
    `;

    resultBox.classList.remove("hidden");

    saveHistory(from, to, amount, converted, rate);
  } catch (err) {
    showError("Conversion failed.");
    console.error(err);
  } finally {
    hideLoading();
  }
}

// ===========================
// SWAP BUTTON
// ===========================
function swapCurrencies() {
  const t = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = t;
}

// ===========================
// HISTORY MANAGEMENT
// ===========================
function saveHistory(from, to, amount, converted, rate) {
  const record = {
    timestamp: Date.now(),
    from,
    to,
    amount,
    converted,
    rate,
  };

  history.unshift(record);
  if (history.length > 10) history.pop();

  localStorage.setItem("fx_history", JSON.stringify(history));

  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = "";

  if (history.length === 0) {
    historyList.innerHTML = `<li style="opacity: .6">No history yet</li>`;
    return;
  }

  history.forEach((h) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <span>${new Date(h.timestamp).toLocaleString()} — 
      ${h.amount} ${h.from} → 
      ${Number(h.converted).toLocaleString(undefined, {
        maximumFractionDigits: 4,
      })} ${h.to}
      </span>

      <button class="replay">🔁</button>
    `;

    li.querySelector(".replay").addEventListener("click", () => {
      amountInput.value = h.amount;
      fromSelect.value = h.from;
      toSelect.value = h.to;
      convert();
    });

    historyList.appendChild(li);
  });
}

clearHistoryBtn.addEventListener("click", () => {
  history = [];
  localStorage.removeItem("fx_history");
  renderHistory();
});

// ===========================
// EVENTS
// ===========================
convertBtn.addEventListener("click", convert);
swapBtn.addEventListener("click", swapCurrencies);

init();
