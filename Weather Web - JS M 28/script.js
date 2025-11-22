const input = document.getElementById("city");
const btnSearch = document.getElementById("btnSearch");
const btnLocation = document.getElementById("btnLocation");
const weatherBox = document.getElementById("weather");
const historyList = document.getElementById("historyList");

const API_KEY = "366584ab2d4c0f54a3f582ded73a1d91";

// Ambil history dari localStorage
let history = JSON.parse(localStorage.getItem("history")) || [];
renderHistory();

// Klik tombol search
btnSearch.addEventListener("click", () => getWeather(input.value));

// Enter key
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") getWeather(input.value);
});

// Tombol lokasi
btnLocation.addEventListener("click", () => {
  navigator.geolocation.getCurrentPosition((pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;

    fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    )
      .then((res) => res.json())
      .then((data) => showWeather(data));
  });
});

// ========================================
// FUNGSI GET WEATHER
// ========================================
function getWeather(city) {
  if (!city) {
    weatherBox.innerHTML = "<p>Nama kota tidak boleh kosong.</p>";
    return;
  }

  weatherBox.innerHTML = "<p>Loading...</p>";

  fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
  )
    .then((res) => {
      if (!res.ok) throw new Error("Kota tidak ditemukan");
      return res.json();
    })
    .then((data) => {
      showWeather(data);
      addHistory(data.name); // Simpan ke history
    })
    .catch((err) => {
      weatherBox.innerHTML = `<p style="color:red;">${err.message}</p>`;
    });
}

// ========================================
// TAMPILKAN CUACA
// ========================================
function showWeather(data) {
  const weather = data.weather[0].main;
  const icon = data.weather[0].icon;

  // UBAH background sesuai cuaca
  if (weather === "Clear") document.body.style.background = "#f7d358";
  else if (weather === "Clouds") document.body.style.background = "#bdbdbd";
  else if (weather === "Rain") document.body.style.background = "#5dade2";
  else document.body.style.background = "#3a7bd5"; // default

  // Tampilkan data cuaca + feels like + pressure
  weatherBox.innerHTML = `
        <h2>${data.name}</h2>
        <img src="https://openweathermap.org/img/wn/${icon}@2x.png">
        <h3>${data.main.temp} °C</h3>
        <p>${data.weather[0].description}</p>

        <p><strong>Feels Like:</strong> ${data.main.feels_like} °C</p>
        <p><strong>Pressure:</strong> ${data.main.pressure} hPa</p>

        <p>Kelembapan: ${data.main.humidity}%</p>
        <p>Angin: ${data.wind.speed} m/s</p>
    `;
}

// ========================================
// HISTORY TANPA DUPLIKASI
// ========================================
function addHistory(city) {
  // Jika sudah ada → hapus dulu (supaya tidak duplikasi)
  history = history.filter((item) => item.toLowerCase() !== city.toLowerCase());

  // Masukkan ke paling atas
  history.unshift(city);

  // Simpan ke localStorage
  localStorage.setItem("history", JSON.stringify(history));

  // Tampilkan ulang
  renderHistory();
}

// TAMPILKAN HISTORY DI HALAMAN
function renderHistory() {
  historyList.innerHTML = "";
  history.forEach((city) => {
    const li = document.createElement("li");
    li.textContent = city;
    li.style.cursor = "pointer";
    li.onclick = () => getWeather(city); // klik untuk pencarian ulang
    historyList.appendChild(li);
  });
}
