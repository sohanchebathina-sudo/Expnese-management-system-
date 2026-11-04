require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const {
  connectDB,
  readExpenses,
  addExpense,
  deleteExpense,
  getBudget,
  updateBudget,
  getUser
} = require('./config/db');
const { createId, monthTotal, monthIncomeTotal, getMonthlyTrends } = require('./utils/helpers');

const app = express();
const port = process.env.PORT || 3000;
const frontendPath = path.join(__dirname, '..', 'frontend');

// Helper to extract user identity from request
function getUserId(req) {
  return (req.headers['x-user-email'] || req.query.userId || 'alex@example.com').trim().toLowerCase();
}

app.use(cors());
app.use(express.json());
app.use(express.static(frontendPath));

// Connect to MongoDB immediately at startup
connectDB().catch((err) => console.error('MongoDB startup connection error:', err));

app.get('/api/expenses', async (req, res) => {
  try {
    const userId = getUserId(req);
    const expenses = await readExpenses(userId);
    res.json(expenses.sort((a, b) => b.date.localeCompare(a.date)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { title, category, amount, date, note = '', paymentMethod = 'Card', type = 'expense' } = req.body;
    if (!title || !category || !amount || !date) {
      return res.status(400).json({ message: 'Title, category, amount, and date are required.' });
    }
    const expense = {
      id: createId(type === 'income' ? 'inc' : 'exp'),
      userId,
      title,
      category,
      amount: Number(amount),
      date,
      note,
      paymentMethod,
      type
    };
    await addExpense(expense, userId);
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    await deleteExpense(req.params.id, userId);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/summary', async (req, res) => {
  try {
    const userId = getUserId(req);
    const expenses = await readExpenses(userId);
    const budget = await getBudget(userId);

    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentExpenses = expenses.filter(
      (expense) => expense.date && expense.date.startsWith(currentMonth) && expense.type !== 'income'
    );
    const currentIncomes = expenses.filter(
      (expense) => expense.date && expense.date.startsWith(currentMonth) && expense.type === 'income'
    );

    const totalSpent = monthTotal(expenses, currentMonth, 'expense');
    const totalIncome = monthIncomeTotal(expenses, currentMonth);

    // If current month has no expenses yet, calculate category breakdown from available expenses
    const categorySource = currentExpenses.length > 0 ? currentExpenses : expenses.filter((e) => e.type !== 'income');
    const byCategory = categorySource.reduce((groups, expense) => {
      groups[expense.category] = (groups[expense.category] || 0) + Number(expense.amount);
      return groups;
    }, {});

    const monthlyTrends = getMonthlyTrends(expenses, 6);

    res.json({
      total: totalSpent,
      totalExpenses: totalSpent,
      totalIncome: totalIncome,
      remainingBalance: totalIncome - totalSpent,
      count: currentExpenses.length,
      byCategory,
      budget,
      remainingBudget: budget - totalSpent,
      recent: expenses.slice(0, 8),
      monthlyTrends
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/budget', async (req, res) => {
  try {
    const userId = getUserId(req);
    const expenses = await readExpenses(userId);
    const budget = await getBudget(userId);
    const spent = monthTotal(expenses);
    res.json({ budget, spent, remaining: budget - spent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/budget', async (req, res) => {
  try {
    const userId = getUserId(req);
    const value = Number(req.body.amount);
    if (!value || value < 0) return res.status(400).json({ message: 'Budget must be a positive number.' });
    const budget = await updateBudget(value, userId);
    res.json({ budget });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('*', (_req, res) => res.sendFile(path.join(frontendPath, 'index.html')));

app.listen(port, () => console.log(`Expense Management System running at http://localhost:${port}`));
