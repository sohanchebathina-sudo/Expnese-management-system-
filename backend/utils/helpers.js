function createId(prefix = 'exp') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function formatMonthKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function monthTotal(expenses, month = formatMonthKey(new Date()), type = 'expense') {
  return expenses
    .filter((expense) => {
      const matchMonth = expense.date && expense.date.startsWith(month);
      const isExpense = type === 'expense' ? expense.type !== 'income' : expense.type === 'income';
      return matchMonth && isExpense;
    })
    .reduce((total, expense) => total + Number(expense.amount || 0), 0);
}

function monthIncomeTotal(expenses, month = formatMonthKey(new Date())) {
  return expenses
    .filter((expense) => expense.date && expense.date.startsWith(month) && expense.type === 'income')
    .reduce((total, expense) => total + Number(expense.amount || 0), 0);
}

function getMonthlyTrends(expenses, monthsCount = 6) {
  const result = [];
  const now = new Date();
  
  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 15);
    const monthKey = formatMonthKey(d);
    const monthName = d.toLocaleDateString('en-US', { month: 'short' });

    const monthExpenses = expenses.filter((e) => e.date && e.date.startsWith(monthKey) && e.type !== 'income');
    const monthIncomes = expenses.filter((e) => e.date && e.date.startsWith(monthKey) && e.type === 'income');

    const totalExpense = monthExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const totalIncome = monthIncomes.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    result.push({
      key: monthKey,
      name: monthName,
      income: totalIncome,
      expenses: totalExpense
    });
  }
  return result;
}

module.exports = { createId, monthTotal, monthIncomeTotal, getMonthlyTrends, formatMonthKey };
