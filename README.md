# ZIVO-AI — Full-Stack AI Builder Platform

ZIVO-AI is a production-grade AI-powered web application builder. Describe what you want and ZIVO-AI generates a complete, deployable web project.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   ZIVO-AI Platform                  │
├────────────────┬────────────────┬───────────────────┤
│  Frontend      │  Backend       │  AI Layer         │
│  Next.js 16    │  API Routes    │  OpenAI GPT-4o    │
│  TailwindCSS   │  TypeScript    │  Python FastAPI   │
├────────────────┴────────────────┴───────────────────┤
│  Database: Supabase (PostgreSQL + pgvector)         │
│  Auth: Cookie-based + Supabase RLS                  │
│  Cache: Redis (optional)                            │
│  Deploy: Docker / Vercel / Netlify                  │
└─────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | Next.js 16, TypeScript, TailwindCSS |
| Backend     | Next.js API Routes (TypeScript)     |
| AI          | OpenAI GPT-4o, Python FastAPI       |
| Database    | Supabase (PostgreSQL + pgvector)    |
| Auth        | Cookie-based + Supabase RLS         |
| DevOps      | Docker, GitHub Actions CI/CD        |

---

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.11+ (for the Python AI service)
- Docker (optional, for containerized setup)

### 1. Clone & Install (Next.js)

```bash
git clone https://github.com/kimlainchhorng/ZIVO-AI
cd ZIVO-AI
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Your OpenAI API key |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |

Optional variables:

| Variable | Description |
|----------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `VERCEL_TOKEN` | Vercel deployment token |
| `NETLIFY_TOKEN` | Netlify deployment token |
| `GITHUB_TOKEN` | GitHub token for apply API |
| `PYTHON_AI_URL` | Python AI service URL (default: http://localhost:8000) |
| `REDIS_URL` | Redis URL for rate limiting |

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## Python AI Microservice

The Python FastAPI service provides an alternative AI generation endpoint.

### Using uv (recommended)

```bash
cd python-ai
uv sync
uv run uvicorn main:app --reload
```

### Using pip

```bash
cd python-ai
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### API Endpoints

- `POST /generate` — Generate code from a prompt
- `GET /health` — Health check

---

## Docker Setup

Run the full stack with Docker Compose:

```bash
# Copy env file
cp .env.example .env

# Build and start all services
docker-compose up --build
```

Services:
- **web** — Next.js app at `http://localhost:3000`
- **python-ai** — FastAPI service at `http://localhost:8000`
- **redis** — Redis cache at `localhost:6379`

---

## Database Setup (Supabase)

1. Create a [Supabase](https://supabase.com) project
2. Run the schema from `lib/supabase-schema.sql` in the Supabase SQL editor
3. Add your Supabase credentials to `.env.local`

---

## Streamlit App (Python)

```bash
# Using uv (recommended — 10-100x faster)
uv sync
uv run streamlit run app.py

# Using pip
pip install -r requirements.txt
streamlit run app.py
```

---

## CI/CD

GitHub Actions workflows run automatically on push/PR to `main`:

- **lint-and-typecheck** — ESLint + TypeScript type checking
- **build** — Next.js production build
- **python-lint** — Ruff linting for Python code

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

MIT
