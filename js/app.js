const LOCAL_BACKEND_ORIGIN = "http://localhost:5000";
const SERVER_URL = LOCAL_BACKEND_ORIGIN;
const API = `${SERVER_URL}/api`;

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message, type = "success") {
  let box = document.getElementById("toast-box");
  if (!box) {
    box = document.createElement("div");
    box.id = "toast-box";
    box.className = "toast-box";
    document.body.appendChild(box);
  }
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${type === "success" ? "✓" : "!"}</span><p>${escapeHTML(message)}</p>`;
  box.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

async function setUser(data) {
  if (!data) return;
  localStorage.setItem("token", data.token || "");
  localStorage.setItem("user", JSON.stringify(data.user || null));
  await refreshMyProfile();
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

async function refreshMyProfile() {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const profile = await res.json();
    localStorage.setItem("user", JSON.stringify(profile));
    return profile;
  } catch {
    return null;
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("profileUserId");
  window.location.href = "index.html";
}
function protect() {
  if (!getToken()) window.location.href = "login.html";
}
function requireRecruiter() {
  const user = getUser();
  if (!user || user.role !== "recruiter") {
    showToast("Recruiter access only", "error");
    window.location.href = "jobs.html";
  }
}
function requireCandidate() {
  const user = getUser();
  if (!user || user.role !== "candidate") {
    showToast("Candidate access only", "error");
    window.location.href = "jobs.html";
  }
}

async function loadComponent(id, file) {
  const el = document.getElementById(id);
  if (!el) return;
  const res = await fetch(file);
  el.innerHTML = await res.text();
}
function toggleMobileMenu() {
  document.getElementById("mobile-menu")?.classList.toggle("hidden");
}
function closeMobileMenu() {
  document.getElementById("mobile-menu")?.classList.add("hidden");
}

function setActiveNav(page) {
  const ids = { home: "nav-home", jobs: "nav-jobs", about: "nav-about" };
  const mids = { home: "m-nav-home", jobs: "m-nav-jobs", about: "m-nav-about" };
  Object.values({ ...ids, ...mids }).forEach((id) =>
    document.getElementById(id)?.classList.remove("active-nav"),
  );
  if (ids[page])
    document.getElementById(ids[page])?.classList.add("active-nav");
  if (mids[page])
    document.getElementById(mids[page])?.classList.add("active-nav");
}

function imageUrl(path) {
  if (!path) return "images/default-profile.png";

  const clean = String(path).replace(/\\/g, "/").replace(/^\/+/, "");

  if (clean.startsWith("http")) return clean;

  return `${SERVER_URL}/${clean}`;
}
function getProfileImageHTML(user, size = "w-9 h-9") {
  const initials = escapeHTML(
    (user?.name || "U")
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase(),
  );
  if (user?.profileImage) {
    return `<img src="${imageUrl(user.profileImage)}" class="${size} rounded-full object-cover profile-img" alt="Profile" loading="eager" decoding="async" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" /><div class="${size} rounded-full bg-blue-100 text-blue-700 hidden items-center justify-center text-sm font-bold profile-img-fallback">${initials}</div>`;
  }
  return `<div class="${size} rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold profile-img-fallback">${initials}</div>`;
}

function renderAuthLinks(container, mobile = false) {
  if (!container) return;
  const user = getUser();
  if (!user) {
    container.innerHTML = `<button onclick="location.href='login.html'" class="nav-action" type="button">Login</button><button onclick="location.href='register.html'" class="btn-primary" type="button">Register</button>`;
    return;
  }
  let links = "";
  if (user.role === "candidate")
    links = `<button onclick="location.href='my-applications.html'" class="nav-link-btn" type="button">My Applications</button>`;
  if (user.role === "recruiter")
    links = `<button onclick="location.href='recruiter-jobs.html'" class="nav-link-btn" type="button">My Jobs</button><button onclick="location.href='recruiter-applications.html'" class="nav-link-btn" type="button">Applications</button>`;
  const name = escapeHTML(user.name || "Profile");
  container.innerHTML = `<div class="${mobile ? "flex flex-col gap-4" : "flex items-center gap-4 flex-wrap justify-end"}">${links}<button onclick="viewMyProfile()" class="profile-nav-btn nav-profile-combo" type="button" title="Open profile">${getProfileImageHTML(user, mobile ? "w-11 h-11" : "w-10 h-10")}<span>${name}</span></button><button onclick="logout()" class="logout-link" type="button">Logout</button></div>`;
}

function renderNavRight() {
  renderAuthLinks(document.getElementById("nav-right"), false);
  renderAuthLinks(document.getElementById("mobile-nav-right"), true);
}
async function loadLayout(activePage = "") {
  await Promise.all([
    loadComponent("navbar", "components/navbar.html"),
    loadComponent("footer", "components/footer.html"),
  ]);
  await refreshMyProfile();
  renderNavRight();
  if (activePage) setActiveNav(activePage);
  renderChatOptions();
  setTimeout(loadChatHistory, 80);
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData) && !headers["Content-Type"])
    headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  if (!res.ok) throw new Error(data?.message || "Request failed");
  return data;
}

function profileCardHTML(user) {
  return `
    <div class="profile-summary-card">
      <div class="profile-cover"></div>

      <button
        onclick="viewUserProfile('${user?.id || ""}')"
        class="profile-card-photo"
        type="button"
      >
        ${getProfileImageHTML(user, "w-full h-full")}
      </button>

      <h3>${escapeHTML(user?.name || "Guest User")}</h3>

      <p class="capitalize">
        ${escapeHTML(user?.role || "visitor")}
      </p>
    </div>
  `;
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
function viewUserProfile(id) {
  if (id) localStorage.setItem("profileUserId", id);
  location.href = "user-profile.html";
}
function viewMyProfile() {
  const user = getUser();
  if (user?.id) localStorage.setItem("profileUserId", user.id);
  location.href = "user-profile.html";
}

function showConfirm(message, onYes) {
  let overlay = document.getElementById("confirm-modal");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "confirm-modal";
    overlay.className = "confirm-overlay hidden";
    overlay.innerHTML = `<div class="confirm-box"><h3>Are you sure?</h3><p id="confirm-message"></p><div class="confirm-actions"><button id="confirm-no" class="btn-outline" type="button">Cancel</button><button id="confirm-yes" class="btn-primary danger" type="button">Yes, delete</button></div></div>`;
    document.body.appendChild(overlay);
  }
  document.getElementById("confirm-message").textContent = message;
  overlay.classList.remove("hidden");
  document.getElementById("confirm-no").onclick = () =>
    overlay.classList.add("hidden");
  document.getElementById("confirm-yes").onclick = async () => {
    overlay.classList.add("hidden");
    await onYes();
  };
}

const CHAT_OPTIONS = [
  { value: "How to apply for a job?", label: "How to apply for a job?" },
  { value: "How to check application status?", label: "How to check application status?" },
  { value: "How to post a job?", label: "How to post a job?" },
  { value: "How to manage applications?", label: "How to manage applications?" },
  { value: "How to update profile?", label: "How to update profile?" },
  { value: "What data is protected?", label: "What data is protected?" },
];

function getChatKey() {
  const u = getUser();
  return u ? `smartjob_chat_${u.id}_${u.role}` : "smartjob_chat_guest";
}

function getChatBody() {
  return document.getElementById("chatbot-body");
}

function saveChatHistory() {
  const body = getChatBody();
  if (body) localStorage.setItem(getChatKey(), body.innerHTML);
}

function loadChatHistory() {
  const body = getChatBody();
  if (!body) return;

  const saved = localStorage.getItem(getChatKey());
  if (saved) body.innerHTML = saved;

  body.scrollTop = body.scrollHeight;
}

function openChatbot() {
  document.getElementById("chatbot-window")?.classList.remove("hidden");
  document.getElementById("chatbot-open-btn")?.classList.add("hidden");
  loadChatHistory();
  renderChatOptions();
}

function closeChatbot() {
  saveChatHistory();
  document.getElementById("chatbot-window")?.classList.add("hidden");
  document.getElementById("chatbot-open-btn")?.classList.remove("hidden");
}

function addChatMessage(sender, text, isUser = false) {
  const body = getChatBody();
  if (!body) return;

  const wrap = document.createElement("div");
  wrap.className = isUser ? "chat-row chat-user" : "chat-row chat-bot";

  const safeText = escapeHTML(text || "").replace(/\n/g, "<br>");

  wrap.innerHTML = isUser
    ? `<div class="chat-bubble user">${safeText}</div>`
    : `<div class="chat-name">${escapeHTML(sender)}</div><div class="chat-bubble bot">${safeText}</div>`;

  body.appendChild(wrap);
  body.scrollTop = body.scrollHeight;
  saveChatHistory();
}

function renderChatOptions(excludeValue = "") {
  const wrap = document.getElementById("chatbot-options");
  if (!wrap) return;

  wrap.innerHTML = CHAT_OPTIONS.filter((o) => o.value !== excludeValue)
    .map(
      (o) =>
        `<button onclick="sendChatOption('${escapeHTML(o.value)}', '${escapeHTML(o.label)}')" class="chat-option" type="button">${escapeHTML(o.label)}</button>`,
    )
    .join("");
}

async function sendChatOption(value, label) {
  addChatMessage("You", label, true);
  await fetchSmartBotReply(label);
  renderChatOptions(value);
}

async function sendChatMessage() {
  const input = document.getElementById("chatbot-input");
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  addChatMessage("You", text, true);
  await fetchSmartBotReply(text);
  renderChatOptions();
}

async function fetchSmartBotReply(message) {
  addChatMessage("SmartBot", "Thinking...");

  const body = getChatBody();
  const typing = body?.lastElementChild;

  try {
    const data = await apiFetch("/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    });

    if (typing) typing.remove();
    addChatMessage("SmartBot", data.reply || "Sorry, I could not understand that.");
  } catch (err) {
    if (typing) typing.remove();

    addChatMessage(
      "SmartBot",
      "Sorry, SmartBot is not connected right now. Check backend server, GEMINI_API_KEY, or model access.",
    );
  }
}

function clearChatHistory() {
  localStorage.removeItem(getChatKey());
  const body = getChatBody();
  if (body) {
    body.innerHTML = `<div class="chat-row chat-bot"><div class="chat-name">SmartBot</div><div class="chat-bubble bot">Namaste! 🙏 I can help you find suitable jobs, apply for jobs, improve your profile, or guide recruiters.</div></div>`;
    renderChatOptions();
  }
}

function fileUrl(path) {
  // Convert any stored resume path into the correct backend file URL.
  // Accepted database values:
  // 1) uploads/file.pdf
  // 2) http://localhost:5000/uploads/file.pdf
  // 3) localhost/uploads/file.pdf
  if (!path || path === "#" || path === "undefined" || path === "null") {
    return "";
  }

  let clean = String(path)
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");

  clean = clean
    .replace(/^http:\/\/localhost:5500\//, "")
    .replace(/^http:\/\/127\.0\.0\.1:5500\//, "")
    .replace(/^http:\/\/localhost:5000\//, "")
    .replace(/^http:\/\/127\.0\.0\.1:5000\//, "")
    .replace(/^http:\/\/localhost\//, "")
    .replace(/^localhost\//, "");

  if (clean.startsWith("uploads/")) {
    return `${SERVER_URL}/${clean}`;
  }

  if (clean.toLowerCase().includes(".pdf")) {
    return `${SERVER_URL}/uploads/${clean.split("/").pop()}`;
  }

  return "";
}

function isSameOriginUrl(url) {
  try {
    const fileUrl = new URL(url);
    return window.location.origin === fileUrl.origin;
  } catch {
    return false;
  }
}

function openResumeModal(url, title = "Resume Preview") {
  // Build one reusable modal for all resume previews.
  let modal = document.getElementById("global-resume-modal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "global-resume-modal";
    modal.className =
      "fixed inset-0 bg-black/70 z-[99999] hidden p-3 sm:p-6 overflow-y-auto";

    modal.innerHTML = `
      <div class="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
        <div class="flex items-center justify-between border-b px-4 sm:px-6 py-4">
          <div>
            <h2 id="global-resume-title" class="text-lg sm:text-2xl font-bold text-slate-800">Resume Preview</h2>
            <p id="global-resume-subtitle" class="text-slate-500 text-sm mt-1">View candidate resume directly inside Smart Job</p>
          </div>
          <div class="flex items-center gap-3">
            <a id="global-resume-download" href="#" download class="btn-primary !py-2 !px-4 text-sm">Download</a>
            <button onclick="closeResumeModal()" class="w-10 h-10 rounded-full bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 text-2xl flex items-center justify-center transition">×</button>
          </div>
        </div>
        <div id="global-resume-content" class="bg-slate-100 p-2 sm:p-4"></div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  document.getElementById("global-resume-title").textContent = title;

  const download = document.getElementById("global-resume-download");
  download.href = url;
  download.target = "_blank";
  download.rel = "noopener noreferrer";

  const content = document.getElementById("global-resume-content");
  content.innerHTML = `<iframe id="global-resume-frame" class="w-full h-[80vh] rounded-xl bg-white" style="border:none;" allowfullscreen src="${url}"></iframe>`;

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeResumeModal() {
  const modal = document.getElementById("global-resume-modal");
  const frame = document.getElementById("global-resume-frame");

  if (frame) frame.src = "";
  if (modal) modal.classList.add("hidden");

  document.body.style.overflow = "auto";
}

function openResume(path, name = "Resume Preview") {
  const url = fileUrl(path);

  if (!url) {
    showToast("Resume file not found", "error");
    return;
  }

  if (!isSameOriginUrl(url)) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  openResumeModal(url, name);
}
