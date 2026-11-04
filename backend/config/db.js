const fs = require('fs/promises');
const path = require('path');
const { MongoClient } = require('mongodb');

const dataFile = path.join(__dirname, '..', 'data', 'expenses.json');
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/expense_management';

let client = null;
let db = null;
let isConnected = false;

async function connectDB() {
  if (db && isConnected) return db;
  try {
    client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 2500 });
    await client.connect();
    db = client.db();
    isConnected = true;
    console.log(`Connected to MongoDB database: ${db.databaseName}`);

    // Create indexes per documentation
    const expensesCol = db.collection('expenses');
    await expensesCol.createIndex({ userId: 1 });
    await expensesCol.createIndex({ date: -1 });
    await expensesCol.createIndex({ category: 1 });

    const usersCol = db.collection('users');
    await usersCol.createIndex({ email: 1 }, { unique: true });

    // Seed default data for alex@example.com if empty
    await seedIfEmpty();
    return db;
  } catch (err) {
    console.warn('MongoDB connection failed, falling back to local file storage:', err.message);
    isConnected = false;
    return null;
  }
}

async function seedIfEmpty() {
  if (!db) return;
  const expensesCol = db.collection('expenses');
  const usersCol = db.collection('users');

  const defaultEmail = 'alex@example.com';
  const count = await expensesCol.countDocuments({ userId: defaultEmail });
  
  // Seed user
  const existingUser = await usersCol.findOne({ email: defaultEmail });
  if (!existingUser) {
    await usersCol.insertOne({
      email: defaultEmail,
      name: 'Alex Morgan',
      monthlyBudget: 35000,
      createdAt: new Date().toISOString()
    });
  }

  if (count === 0) {
    console.log('Seeding initial MongoDB records for user:', defaultEmail);
    const initialRecords = [
      // October 2026 (Current Month) Income
      {
        id: 'inc_101',
        userId: defaultEmail,
        title: 'Monthly Salary',
        category: 'Salary',
        amount: 75000,
        date: '2026-10-01',
        note: 'Direct deposit from employer',
        paymentMethod: 'Transfer',
        type: 'income'
      },
      {
        id: 'inc_102',
        userId: defaultEmail,
        title: 'Freelance UI Project',
        category: 'Freelance',
        amount: 18500,
        date: '2026-10-12',
        note: 'Completed mobile dashboard client design',
        paymentMethod: 'UPI',
        type: 'income'
      },
      // October 2026 (Current Month) Expenses
      {
        id: 'exp_101',
        userId: defaultEmail,
        title: 'Apartment Rent & Society',
        category: 'Bills',
        amount: 14000,
        date: '2026-10-03',
        note: 'Monthly rental allowance transfer',
        paymentMethod: 'Transfer',
        type: 'expense'
      },
      {
        id: 'exp_102',
        userId: defaultEmail,
        title: 'Fresh Vegetables & Grocery Run',
        category: 'Shopping',
        amount: 4850,
        date: '2026-10-06',
        note: 'Weekly essentials and pantry restock',
        paymentMethod: 'Card',
        type: 'expense'
      },
      {
        id: 'exp_103',
        userId: defaultEmail,
        title: 'Broadband & Electric Utility',
        category: 'Bills',
        amount: 2350,
        date: '2026-10-09',
        note: 'Home internet & electricity utility bill',
        paymentMethod: 'UPI',
        type: 'expense'
      },
      {
        id: 'exp_104',
        userId: defaultEmail,
        title: 'Team Celebratory Dinner',
        category: 'Food',
        amount: 2600,
        date: '2026-10-14',
        note: 'Quarterly team celebration at Bistro',
        paymentMethod: 'Card',
        type: 'expense'
      },
      {
        id: 'exp_105',
        userId: defaultEmail,
        title: 'Metro Smart Card & Fuel',
        category: 'Transport',
        amount: 1850,
        date: '2026-10-17',
        note: 'Monthly commute recharge',
        paymentMethod: 'Card',
        type: 'expense'
      },
      {
        id: 'exp_106',
        userId: defaultEmail,
        title: 'Prescription & Vitamins',
        category: 'Health',
        amount: 950,
        date: '2026-10-19',
        note: 'Routine vitamins & wellness kit',
        paymentMethod: 'UPI',
        type: 'expense'
      },
      // September 2026 History for charts comparison
      {
        id: 'inc_091',
        userId: defaultEmail,
        title: 'September Salary',
        category: 'Salary',
        amount: 75000,
        date: '2026-09-01',
        note: 'Previous month salary',
        paymentMethod: 'Transfer',
        type: 'income'
      },
      {
        id: 'exp_091',
        userId: defaultEmail,
        title: 'September Rent',
        category: 'Bills',
        amount: 14000,
        date: '2026-09-03',
        note: 'September housing payment',
        paymentMethod: 'Transfer',
        type: 'expense'
      },
      {
        id: 'exp_092',
        userId: defaultEmail,
        title: 'Supermarket Groceries',
        category: 'Shopping',
        amount: 5400,
        date: '2026-09-10',
        note: 'Monthly provisions',
        paymentMethod: 'Card',
        type: 'expense'
      },
      {
        id: 'exp_093',
        userId: defaultEmail,
        title: 'Restaurant Outing',
        category: 'Food',
        amount: 2900,
        date: '2026-09-18',
        note: 'Weekend family dinner',
        paymentMethod: 'Card',
        type: 'expense'
      },
      {
        id: 'exp_094',
        userId: defaultEmail,
        title: 'Commute Passes',
        category: 'Transport',
        amount: 2100,
        date: '2026-09-22',
        note: 'Transit expenses',
        paymentMethod: 'Card',
        type: 'expense'
      }
    ];

    await expensesCol.insertMany(initialRecords);
  }
}

async function readExpenses(userId = 'alex@example.com') {
  await connectDB();
  if (isConnected && db) {
    const query = { userId };
    const items = await db.collection('expenses').find(query).sort({ date: -1 }).toArray();
    return items.map(({ _id, ...rest }) => rest);
  }
  // Fallback to local JSON
  try {
    const content = await fs.readFile(dataFile, 'utf8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function writeExpenses(expenses, userId = 'alex@example.com') {
  await connectDB();
  if (isConnected && db) {
    const expensesCol = db.collection('expenses');
    // For general writeExpenses backward compatibility:
    // replace user's expenses with new array
    await expensesCol.deleteMany({ userId });
    const docs = expenses.map((exp) => ({ ...exp, userId: exp.userId || userId }));
    if (docs.length > 0) {
      await expensesCol.insertMany(docs);
    }
    return expenses;
  }
  await fs.writeFile(dataFile, JSON.stringify(expenses, null, 2));
  return expenses;
}

async function addExpense(expense, userId = 'alex@example.com') {
  await connectDB();
  const item = { ...expense, userId };
  if (isConnected && db) {
    await db.collection('expenses').insertOne(item);
    return item;
  }
  const current = await readExpenses();
  const updated = [item, ...current];
  await fs.writeFile(dataFile, JSON.stringify(updated, null, 2));
  return item;
}

async function deleteExpense(id, userId = 'alex@example.com') {
  await connectDB();
  if (isConnected && db) {
    const res = await db.collection('expenses').deleteOne({ id, userId });
    if (res.deletedCount === 0) {
      // Try deleting without userId in case of legacy items
      await db.collection('expenses').deleteOne({ id });
    }
    return true;
  }
  const current = await readExpenses();
  const next = current.filter((exp) => exp.id !== id);
  await fs.writeFile(dataFile, JSON.stringify(next, null, 2));
  return true;
}

async function getUser(userId = 'alex@example.com') {
  await connectDB();
  if (isConnected && db) {
    const user = await db.collection('users').findOne({ email: userId });
    if (user) {
      const { _id, ...rest } = user;
      return rest;
    }
  }
  return { email: userId, name: 'Alex Morgan', monthlyBudget: 35000 };
}

async function getBudget(userId = 'alex@example.com') {
  const user = await getUser(userId);
  return user.monthlyBudget || 35000;
}

async function updateBudget(amount, userId = 'alex@example.com') {
  await connectDB();
  const val = Number(amount);
  if (isConnected && db) {
    await db.collection('users').updateOne(
      { email: userId },
      { $set: { email: userId, monthlyBudget: val } },
      { upsert: true }
    );
  }
  return val;
}

module.exports = {
  connectDB,
  readExpenses,
  writeExpenses,
  addExpense,
  deleteExpense,
  getUser,
  getBudget,
  updateBudget
};
