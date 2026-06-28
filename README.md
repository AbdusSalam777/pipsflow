# PipsFlow - Trading Journal & Analytics Platform

A production-ready full-stack trading journal built with the MERN stack. Track trades, analyze performance, identify mistakes, and improve your trading psychology.

![Dark Mode](https://img.shields.io/badge/Dark%20Mode-Default-2962ff)
![TypeScript](https://img.shields.io/badge/TypeScript-Full%20Stack-3178c6)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248)

## Features

- **Authentication** - JWT + refresh tokens, forgot/reset password, profile management
- **Trade Logging** - Full trade entry with auto RR calculation, screenshots, tags, mistakes
- **Dashboard** - Summary cards, equity curve, heatmap, monthly PnL, recent trades
- **Analytics** - Win rate trends, pair/session/day performance, drawdown analysis
- **Calendar** - Daily/monthly view with PnL per day
- **Journal** - Personal trading journal entries
- **Mistake Analysis** - Track recurring mistakes and their impact
- **Goals** - Set and track trading goals with progress bars
- **Export** - CSV and Excel export
- **Dark Mode** - TradingView-inspired dark theme by default

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, shadcn/ui, React Query, Recharts |
| Backend | Node.js, Express, TypeScript, Mongoose |
| Database | MongoDB Atlas |
| Auth | JWT, bcrypt, refresh tokens |
| Storage | Cloudinary |
| Deployment | Vercel (frontend), Render (backend) |

## Project Structure

```
pipsflow/
├── backend/
│   └── src/
│       ├── config/          # DB, Cloudinary, env config
│       ├── controllers/     # Route handlers
│       ├── middleware/      # Auth, validation, upload, errors
│       ├── models/          # Mongoose schemas
│       ├── routes/          # API routes
│       ├── services/        # Business logic (repository pattern)
│       ├── utils/           # JWT, trade calculations, helpers
│       ├── validators/      # Zod schemas
│       └── seed/            # Demo data seeder
├── frontend/
│   └── src/
│       ├── components/      # UI, charts, layout
│       ├── contexts/        # Auth context
│       ├── pages/           # All app pages
│       ├── services/        # API service layer
│       ├── types/           # TypeScript types
│       └── lib/             # Utilities
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account (optional, for image uploads)
- SMTP credentials (optional, for password reset emails)

### 1. Clone & Install

```bash
cd pipsflow

# Backend
cd backend
cp .env.example .env
npm install

# Frontend
cd ../frontend
cp .env.example .env
npm install
```

### 2. Configure Environment

**backend/.env**
```env
MONGODB_URI=mongodb://localhost:27017/pipsflow
JWT_ACCESS_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**frontend/.env**
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Seed Demo Data

```bash
cd backend
npm run seed
```

Demo credentials: `demo@pipsflow.com` / `Password123!`

### 4. Run Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh-token` | Refresh JWT |
| POST | `/api/auth/forgot-password` | Send reset link |
| POST | `/api/auth/reset-password` | Reset password |
| GET | `/api/auth/me` | Get current user |

### Trades
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/trades` | Create trade |
| GET | `/api/trades` | List trades (search, filter, paginate) |
| GET | `/api/trades/:id` | Get trade details |
| PUT | `/api/trades/:id` | Update trade |
| DELETE | `/api/trades/:id` | Delete trade |
| GET | `/api/trades/export` | Export CSV/JSON |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Dashboard data |
| GET | `/api/analytics/performance` | Performance metrics |
| GET | `/api/analytics/winrate` | Win rate trend |
| GET | `/api/analytics/equity` | Equity curve |
| GET | `/api/analytics/mistakes` | Mistake analysis |
| GET | `/api/analytics/calendar` | Calendar data |

### Journal, Goals, Profile
Full CRUD at `/api/journal`, `/api/goals`, `/api/profile`

## Deployment

### Frontend (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Set root directory to `frontend`
4. Add env var: `VITE_API_URL=https://your-api.onrender.com/api`
5. Deploy

### Backend (Render)

1. Create new Web Service on Render
2. Connect repo, set root to `backend`
3. Build: `npm install && npm run build`
4. Start: `npm start`
5. Add all env vars from `.env.example`

### Database (MongoDB Atlas)

1. Create free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Get connection string
3. Set `MONGODB_URI` in backend env

## Security Features

- Password hashing with bcrypt (12 rounds)
- JWT access + refresh token rotation
- Rate limiting (100 req/15min)
- Helmet security headers
- Input validation with Zod
- CORS configuration
- Role-based middleware (future-ready)

## License

MIT
