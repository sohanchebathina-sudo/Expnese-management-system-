async function loadExpenses() {
  const expenses = await api("/expenses");
  const table = document.getElementById("expenseTable");
  if (!table) return;
  const filter = document.getElementById("categoryFilter");
  const render = () => {
    const selected = filter.value;
    const visible =
      selected === "all"
        ? expenses
        : expenses.filter((expense) => expense.category === selected);
    table.innerHTML = visible.length
      ? visible
          .map(
            (expense) =>
              `<tr><td><b>${expense.title}</b><br><small style="color:var(--muted)">${expense.note || "No note"}</small></td><td><span class="pill">${expense.category}</span></td><td>${new Date(expense.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td><td>${expense.paymentMethod}</td><td><b>${money(expense.amount)}</b></td><td><button class="delete-btn" title="Delete expense" data-id="${expense.id}">×</button></td></tr>`,
          )
          .join("")
      : '<tr><td colspan="6" class="empty">No expenses match this filter.</td></tr>';
    table.querySelectorAll(".delete-btn").forEach((button) =>
      button.addEventListener("click", async () => {
        await api(`/expenses/${button.dataset.id}`, { method: "DELETE" });
        window.location.reload();
      }),
    );
  };
  filter?.addEventListener("change", render);
  render();
}

document
  .getElementById("expenseForm")
  ?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    await api("/expenses", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(form)),
    });
    window.location.href = "expenses.html";
  });
loadExpenses().catch((error) => console.error(error));
