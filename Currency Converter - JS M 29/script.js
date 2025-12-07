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

// Apa yang ditekankan:

// document.getElementById() mengembalikan referensi DOM.

// Gunakan const karena referensi DOM tidak di-reassign.

// Menyimpan referensi mempercepat akses dan membuat kode lebih readable.

// Demo: di console ketik fromSelect dan tampilkan .value (saat belum diisi akan "").


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

// Poin ajar:
// currencyList menampung kode currency, history berisi array riwayat (parse dari string di localStorage).
// JSON.parse(... || '[]') → jika tidak ada data, fallback ke array kosong.
// showLoading() mengubah class .hidden untuk menampilkan elemen loading. Tekankan perbedaan style.display vs class toggle (classList.add/remove) — prefer class toggle untuk maintainability.

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

// Penjelasan lengkap:
// async function init() → function asynchronous agar bisa await pada fetch.
// fetch(url) mengembalikan Promise<Response>. await res.json() mengembalikan parsed JSON.
// Kenapa open.er-api.com? API ini CORS-safe dan tidak memerlukan key, bagus untuk kelas.
// Object.keys(data.rates) → daftar kode currency (USD, IDR, EUR, dll) — karena response data.rates adalah object { "IDR": 14500, "EUR": 0.90, ... }.
// populateCurrencyDropdown() mengisi <select>; renderHistory() menampilkan riwayat (jika ada).
// try...catch...finally → pattern wajib untuk network calls: handle failure and always cleanup (hide loading).

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

/*
Penjelasan:
Untuk setiap code buat dua <option> agar kedua dropdown memiliki opsi sama.
createElement + appendChild part of DOM API.
textContent aman karena tidak mengeksekusi HTML; gunakan ini jika ambil data dari internet.
Set default from=USD, to=IDR — nilai ini bisa diubah sesuai kelas.
*/

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

/*
Rincian penjelasan:

clearError() menghapus pesan error sebelumnya.

resultBox.classList.add("hidden") menyembunyikan hasil sebelum fetch, untuk menghindari menampilkan data lama selama request.

parseFloat(amountInput.value) -> konversi string ke number. Jika input kosong atau bukan angka → NaN. if (!amount || amount <= 0) memvalidasi. Catatan: 0 dianggap invalid di sini.

if (from === to) → ajarkan kenapa perlu handle ini (hasil = amount, tapi app UX sebaiknya beri tahu user).

showLoading() tampilkan indikator.

fetch('https://open.er-api.com/v6/latest/${from}') → kita ambil semua rates dengan base from. Response data.rates adalah object; ambil rate = data.rates[to].

converted = amount * rate → kalkulasi sederhana.

toLocaleString() untuk format angka berdasarkan locale pengguna (ribuan, desimal).

convertedEl.innerHTML = ... → hati-hati XSS jika menampilkan input user mentah; di sini safe karena angka, tapi ajarkan caution.

saveHistory(...) menyimpan record ke localStorage agar bisa replay.

catch block menampilkan error umum jika fetch gagal — jelaskan network errors (timeout, no internet, CORS, API down).

finally hide loading.
*/

// ===========================
// SWAP BUTTON
// ===========================
function swapCurrencies() {
  const t = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = t;
}

/*
Teknik swap klasik menggunakan temporary variable t. (Bisa juga tunjukkan destructuring swap [a,b] = [b,a] untuk ES6 advanced.)
Setelah swap, baiknya bersihkan hasil atau auto-trigger konversi jika amount ada.
*/

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

/*
Penjelasan:
record.timestamp = Date.now() untuk menyimpan waktu dalam ms. Gunakan new Date(timestamp).toLocaleString() saat tampilkan.
history.unshift(record) menaruh record terbaru di depan. history.pop() membatasi panjang array ke 10.
localStorage.setItem(key, JSON.stringify(obj)) menyimpan array sebagai string.
renderHistory() menghasilkan DOM <li> untuk tiap entry.
Tombol replay mem-fill input dan memanggil convert() kembali. Ini demonstrasi konsep DRY (reuse of convert() function).
clearHistoryBtn menghapus data dan update UI.
*/

// ===========================
// EVENTS
// ===========================
convertBtn.addEventListener("click", convert);
swapBtn.addEventListener("click", swapCurrencies);

init();

/*
Apa yang harus ditekankan:
addEventListener membuat aplikasi reaktif.
init() dipanggil sekali untuk bootstrap app.
Jelaskan event bubbling jika anak tambahkan event pada parent — penting ketika membuat dynamic elements. (Di sini replay listeners di-attach per item.)
*/


