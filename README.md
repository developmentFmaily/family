# Family App

Basic Node.js + Express + PostgreSQL template

## Setup

1. Copy `.env.example` to `.env` and update with your database credentials.
2. Run `npm install` to install dependencies.
3. Start the server with `npm start` or `npm run dev` (for auto-reload).

## Structure
- `server.js`: Entry point
- `config/db.js`: PostgreSQL connection
- `routes/`: Express routes
- `controllers/`: Route handlers
- `models/`: Database queries
- `public/`: Static assets
