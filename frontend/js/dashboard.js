let incomeExpenseChart = null;
let categoryExpenseChart = null;

const CATEGORY_COLORS = [
  "#e65f4f", // Coral
  "#f6d67b", // Yellow
  "#4fa3e6", // Blue
  "#9c6be6", // Purple
  "#34a853", // Green
  "#e67e22", // Orange
  "#20c997", // Teal
  "#6c757d", // Slate
];

async function loadDashboard() {
  try {
    const summary = await api("/summary");

    // 1. Summary Cards
    const totalIncome = Number(summary.totalIncome) || 0;
    const totalExpenses = Number(summary.totalExpenses ?? summary.total) || 0;
    const remainingBalance = Number(summary.remainingBalance) || (totalIncome - totalExpenses);
    const budget = Number(summary.budget) || 0;
    const remainingBudget = Number(summary.remainingBudget) || (budget - totalExpenses);
    const count = Number(summary.count) || 0;

    document.getElementById("totalIncome").textContent = money(totalIncome);
    document.getElementById("totalSpent").textContent = money(totalExpenses);
    document.getElementById("remainingBalance").textContent = money(remainingBalance);
    document.getElementById("budgetTotal").textContent = money(budget);

    const remainingBudgetEl = document.getElementById("remainingBudget");
    if (remainingBudgetEl) {
      remainingBudgetEl.textContent = money(Math.max(0, remainingBudget));
    }

    const txCountEl = document.getElementById("transactionCount");
    if (txCountEl) {
      txCountEl.textContent = count;
    }

    const balanceNote = document.getElementById("balanceNote");
    if (balanceNote) {
      if (remainingBalance >= 0) {
        balanceNote.textContent = "Positive net cash flow";
        balanceNote.className = "stat-note income-badge";
      } else {
        balanceNote.textContent = "Expenses exceed income";
        balanceNote.className = "stat-note expense-badge";
      }
    }

    // 2. Monthly Budget Progress Bar Widget
    const currentMonthName = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const budgetMonthLabel = document.getElementById("budgetMonthLabel");
    if (budgetMonthLabel) {
      budgetMonthLabel.textContent = `${currentMonthName} Budget`;
    }

    const widgetRemaining = document.getElementById("widgetBudgetRemaining");
    if (widgetRemaining) {
      widgetRemaining.textContent = `${money(Math.abs(remainingBudget))} ${remainingBudget >= 0 ? "left" : "over"}`;
    }

    const widgetSpent = document.getElementById("widgetBudgetSpent");
    if (widgetSpent) widgetSpent.textContent = money(totalExpenses);

    const widgetLimit = document.getElementById("widgetBudgetLimit");
    if (widgetLimit) widgetLimit.textContent = money(budget);

    const percentSpent = budget > 0 ? Math.round((totalExpenses / budget) * 100) : 0;
    const percentLabel = document.getElementById("budgetPercentLabel");
    if (percentLabel) percentLabel.textContent = `${percentSpent}%`;

    const progressFill = document.getElementById("widgetBudgetProgressFill");
    const statusPill = document.getElementById("budgetStatusPill");

    if (progressFill) {
      progressFill.style.width = `${Math.min(100, Math.max(0, percentSpent))}%`;
      progressFill.className = "budget-widget-progress-fill";

      if (percentSpent >= 100) {
        progressFill.classList.add("danger");
        if (statusPill) {
          statusPill.className = "budget-status-pill danger";
          statusPill.textContent = "Over Budget";
        }
      } else if (percentSpent >= 80) {
        progressFill.classList.add("warning");
        if (statusPill) {
          statusPill.className = "budget-status-pill warning";
          statusPill.textContent = "Near Limit";
        }
      } else {
        if (statusPill) {
          statusPill.className = "budget-status-pill good";
          statusPill.textContent = "On Track";
        }
      }
    }

    // 3. Render Income vs Expenses Chart
    renderIncomeVsExpensesChart(summary.monthlyTrends || []);

    // 4. Render Category-wise Expense Chart
    renderCategoryExpenseChart(summary.byCategory || {});

    // 5. Render Recent Transactions Table
    renderRecentTransactions(summary.recent || []);

  } catch (error) {
    console.error("Error loading dashboard data:", error);
  }
}

function renderIncomeVsExpensesChart(trends) {
  const canvas = document.getElementById("incomeVsExpensesChart");
  if (!canvas || typeof Chart === "undefined") return;

  const ctx = canvas.getContext("2d");
  if (incomeExpenseChart) {
    incomeExpenseChart.destroy();
  }

  const labels = trends.map((t) => t.name);
  const incomeData = trends.map((t) => t.income);
  const expenseData = trends.map((t) => t.expenses);

  incomeExpenseChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Income",
          data: incomeData,
          backgroundColor: "rgba(34, 197, 94, 0.85)",
          borderColor: "#16a34a",
          borderWidth: 1.5,
          borderRadius: 6,
          barPercentage: 0.6,
          categoryPercentage: 0.7,
        },
        {
          label: "Expenses",
          data: expenseData,
          backgroundColor: "rgba(230, 95, 79, 0.85)",
          borderColor: "#bd4438",
          borderWidth: 1.5,
          borderRadius: 6,
          barPercentage: 0.6,
          categoryPercentage: 0.7,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          align: "end",
          labels: {
            boxWidth: 12,
            boxHeight: 12,
            font: { family: "'DM Sans', sans-serif", size: 12 },
            color: "#17211b",
          },
        },
        tooltip: {
          backgroundColor: "#17211b",
          titleFont: { family: "'DM Sans', sans-serif", size: 13 },
          bodyFont: { family: "'DM Sans', sans-serif", size: 12 },
          padding: 10,
          cornerRadius: 6,
          callbacks: {
            label: (context) => ` ${context.dataset.label}: ${money(context.raw)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { family: "'DM Sans', sans-serif", size: 12 },
            color: "#778079",
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: "#edf0ec" },
          ticks: {
            font: { family: "'DM Sans', sans-serif", size: 11 },
            color: "#778079",
            callback: (value) => `₹${Number(value).toLocaleString("en-IN")}`,
          },
        },
      },
    },
  });
}

function renderCategoryExpenseChart(byCategory) {
  const canvas = document.getElementById("categoryExpenseChart");
  const container = document.getElementById("categoryChartContainer");
  const pillsContainer = document.getElementById("categoryPills");
  if (!canvas || typeof Chart === "undefined") return;

  if (categoryExpenseChart) {
    categoryExpenseChart.destroy();
  }

  const entries = Object.entries(byCategory).filter(([, val]) => Number(val) > 0);

  if (entries.length === 0) {
    if (container) {
      container.innerHTML = '<div class="chart-empty">No category expense records found for this period.</div>';
    }
    if (pillsContainer) pillsContainer.innerHTML = "";
    return;
  }

  // Restore canvas if it was replaced by empty notice
  if (!document.getElementById("categoryExpenseChart")) {
    container.innerHTML = '<canvas id="categoryExpenseChart"></canvas>';
  }

  const sorted = entries.sort((a, b) => b[1] - a[1]);
  const labels = sorted.map(([cat]) => cat);
  const data = sorted.map(([, val]) => val);
  const backgroundColors = labels.map((_, i) => CATEGORY_COLORS[i % CATEGORY_COLORS.length]);

  const ctx = document.getElementById("categoryExpenseChart").getContext("2d");
  categoryExpenseChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderWidth: 2,
          borderColor: "#ffffff",
          hoverOffset: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "#17211b",
          titleFont: { family: "'DM Sans', sans-serif", size: 13 },
          bodyFont: { family: "'DM Sans', sans-serif", size: 12 },
          padding: 10,
          cornerRadius: 6,
          callbacks: {
            label: (context) => ` ${context.label}: ${money(context.raw)}`,
          },
        },
      },
      cutout: "68%",
    },
  });

  // Render Category pills
  if (pillsContainer) {
    pillsContainer.innerHTML = sorted
      .map(
        ([category, amount], idx) => `
        <span class="category-pill-item">
          <span class="category-color-dot" style="background-color: ${backgroundColors[idx]}"></span>
          <b>${category}</b> ${money(amount)}
        </span>
      `,
      )
      .join("");
  }
}

function renderRecentTransactions(recent) {
  const tableBody = document.getElementById("recentTransactionsTable");
  if (!tableBody) return;

  if (!recent || recent.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5" class="empty">No recent transactions recorded in database.</td></tr>';
    return;
  }

  tableBody.innerHTML = recent
    .map((item) => {
      const isIncome = item.type === "income";
      const icon = categoryIcon[item.category] || (isIncome ? "₹" : "•");
      const formattedDate = item.date
        ? new Date(item.date).toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "-";

      return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px;">
              <span class="category-dot" style="width:30px;height:30px;font-size:14px;">${icon}</span>
              <div>
                <b>${escapeHtml(item.title || "Untitled")}</b>
                ${item.note ? `<br><small style="color:var(--muted)">${escapeHtml(item.note)}</small>` : ""}
              </div>
            </div>
          </td>
          <td>
            <span class="pill">${escapeHtml(item.category || "General")}</span>
          </td>
          <td>${formattedDate}</td>
          <td>
            <span class="tx-type-tag ${isIncome ? "income" : "expense"}">${isIncome ? "Income" : item.paymentMethod || "Card"}</span>
          </td>
          <td>
            <span class="tx-amount ${isIncome ? "income" : "expense"}">
              ${isIncome ? "+" : "-"}${money(item.amount)}
            </span>
          </td>
        </tr>
      `;
    })
    .join("");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
});
