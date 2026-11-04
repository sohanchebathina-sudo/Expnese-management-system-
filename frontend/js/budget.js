async function loadBudget() {
  const data = await api("/budget");
  document.getElementById("budgetRemaining").textContent =
    `${money(data.remaining)} left`;
  document.getElementById("budgetSpent").textContent = money(data.spent);
  document.getElementById("budgetAmount").textContent = money(data.budget);
  document.getElementById("newBudget").value = data.budget;
  document.getElementById("budgetProgress").style.width =
    `${Math.min(100, (data.spent / data.budget) * 100)}%`;
}
document
  .getElementById("budgetForm")
  ?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await api("/budget", {
      method: "PUT",
      body: JSON.stringify({
        amount: document.getElementById("newBudget").value,
      }),
    });
    await loadBudget();
  });
loadBudget().catch((error) => console.error(error));
