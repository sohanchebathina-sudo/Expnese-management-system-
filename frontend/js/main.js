const API = "/api";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const categoryIcon = {
  Food: "◉",
  Transport: "↗",
  Bills: "▣",
  Shopping: "◇",
  Health: "+",
  Fun: "✦",
  Salary: "₹",
  Freelance: "★",
  Investment: "▲",
  Other: "•",
};

function ensureUser() {
  const user = JSON.parse(localStorage.getItem("ledgerlyUser") || "null");
  if (!user) {
    window.location.href = "login.html";
    return null;
  }
  document
    .querySelectorAll(".user-display")
    .forEach((element) => (element.textContent = user.name || "User"));
  document
    .querySelectorAll(".user-initial")
    .forEach(
      (element) => (element.textContent = (user.name || "U").charAt(0).toUpperCase()),
    );

  const dateLabel = document.getElementById("dateLabel");
  if (dateLabel) {
    dateLabel.textContent = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  return user;
}

async function api(path, options = {}) {
  const user = JSON.parse(localStorage.getItem("ledgerlyUser") || "null");
  const headers = {
    "Content-Type": "application/json",
    ...(user?.email ? { "x-user-email": user.email } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || "Something went wrong.");
  }
  return response.status === 204 ? null : response.json();
}

function setupLogout() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (event) => {
      event.preventDefault();
      localStorage.removeItem("ledgerlyUser");
      window.location.href = "login.html";
    });
  }
}

document.addEventListener("DOMContentLoaded", setupLogout);

if (
  !location.pathname.endsWith("login.html") &&
  !location.pathname.endsWith("register.html")
) {
  ensureUser();
}
