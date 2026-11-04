# Expense Management System

A responsive expense tracker with a static frontend and a small Express API.

## Run locally

```powershell
cd backend
npm install
npm start
```

Open `http://localhost:3000` in your browser. The API serves the `frontend` directory and exposes:

- `GET /api/expenses`
- `POST /api/expenses`
- `DELETE /api/expenses/:id`
- `GET /api/summary`
- `GET /api/budget`
- `PUT /api/budget`

The starter persists expenses in `backend/data/expenses.json`. Authentication is intentionally demo-only and stored in the browser.
