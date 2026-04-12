const API = "http://localhost:5000/api";

function setUser(data) {
  if (!data) return;
  localStorage.setItem("token", data.token || "");
  localStorage.setItem("user", JSON.stringify(data.user || null));
}

function getUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getToken() {
  return localStorage.getItem("token");
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "index.html";
}

function protect() {
  if (!getToken()) {
    window.location.href = "login.html";
  }
}

async function loadComponent(id, file) {
  const el = document.getElementById(id);
  if (!el) return;
  const res = await fetch(file);
  const html = await res.text();
  el.innerHTML = html;
}

function setActiveNav(page) {
  const ids = {
    home: "nav-home",
    jobs: "nav-jobs",
    about: "nav-about"
  };

  Object.values(ids).forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("active-nav");
  });

  const active = document.getElementById(ids[page]);
  if (active) active.classList.add("active-nav");
}

function renderNavRight() {
  const user = getUser();
  const navRight = document.getElementById("nav-right");
  if (!navRight) return;

  if (!user) {
    navRight.innerHTML = `
      <button onclick="location.href='login.html'" class="text-blue-700 font-semibold hover:text-blue-800 transition-colors" type="button">
        Login
      </button>
      <button onclick="location.href='register.html'" class="bg-blue-700 text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-blue-800 transition-transform active:scale-95" type="button">
        Register
      </button>
    `;
    return;
  }

  navRight.innerHTML = `
    <span class="text-sm font-semibold text-slate-700 hidden sm:inline">
      ${user.name} (${user.role})
    </span>
    <button onclick="logout()" class="text-blue-700 font-semibold hover:text-blue-800 transition-colors" type="button">
      Logout
    </button>
  `;
}

async function loadLayout(activePage = "") {
  await Promise.all([
    loadComponent("navbar", "components/navbar.html"),
    loadComponent("footer", "components/footer.html")
  ]);
  renderNavRight();
  if (activePage) setActiveNav(activePage);
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}

function profileCardHTML(user) {
  const initials = (user?.name || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return `
    <div class="bg-white rounded-2xl shadow p-6">
      <div class="h-16 bg-blue-100 rounded-xl mb-6"></div>
      <div class="-mt-14 mb-4 flex justify-center lg:justify-start">
        <div class="w-24 h-24 rounded-full bg-white p-1 shadow">
          <div class="w-full h-full rounded-full bg-slate-200 flex items-center justify-center text-blue-700 font-bold text-2xl">
            ${initials}
          </div>
        </div>
      </div>
      <h3 class="text-3xl lg:text-2xl font-bold text-center lg:text-left">${user?.name || "Guest User"}</h3>
      <p class="text-slate-600 mt-2 text-center lg:text-left capitalize">${user?.role || "visitor"}</p>
    </div>
  `;
}

function saveJobId(id) {
  localStorage.setItem("jobId", id);
}

function getJobId() {
  return localStorage.getItem("jobId");
}

function saveJobId(id) {
  localStorage.setItem("jobId", id);
}

function getJobId() {
  return localStorage.getItem("jobId");
}

function saveBackPage(page) {
  localStorage.setItem("backPage", page);
}

function getBackPage() {
  return localStorage.getItem("backPage") || "jobs.html";
}

function goBackPage() {
  location.href = getBackPage();
}