function saveUser(name, email) {
  localStorage.setItem("ledgerlyUser", JSON.stringify({ name, email }));
  window.location.href = "dashboard.html";
}

document.getElementById("loginForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = document.getElementById("email").value;
  const derivedName = email.toLowerCase().includes("alex")
    ? "Alex Morgan"
    : email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  saveUser(derivedName, email);
});

document.getElementById("registerForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  saveUser(
    document.getElementById("name").value,
    document.getElementById("email").value,
  );
});
