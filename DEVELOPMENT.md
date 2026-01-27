# Development Setup Guide

Quick guide for local development with Docker infrastructure.

## 🚀 Quick Start

### 1. Start Infrastructure Services (Database, Redis, Ngrok)

```powershell
# Start all infrastructure in background
docker compose -f docker-compose.dev.yml up -d

# Check status
docker compose -f docker-compose.dev.yml ps
```

### 2. Run App Locally

```powershell
# Run database migrations (first time only)
bunx prisma migrate dev

# Start development server (with hot reload)
bun run dev
```

### 3. Run Email Worker (Optional)

```powershell
# In another terminal
bun run worker/email-worker.ts
```

## 📊 What's Running Where

| Service | Location | Port | URL |
|---------|----------|------|-----|
| **PostgreSQL** | Docker | 5432 | `localhost:5432` |
| **Redis** | Docker | 6379 | `localhost:6379` |
| **Ngrok** | Docker | 4040 | http://localhost:4040 |
| **App** | Local | 3000 | http://localhost:3000 |
| **Email Worker** | Local | - | (background process) |

## 🔄 Daily Workflow

```powershell
# Start infrastructure (once)
docker compose -f docker-compose.dev.yml up -d

# Develop (instant hot reload, no rebuilds!)
bun run dev

# Stop everything when done
docker compose -f docker-compose.dev.yml down
```

## ⚡ Why This Is Fast

✅ **No Docker builds** - infrastructure uses official images  
✅ **Hot reload** - code changes reflect instantly  
✅ **No restarts** - edit code and see changes immediately  
✅ **Small footprint** - only 3 lightweight containers  

## 🛠️ Useful Commands

```powershell
# View logs
docker compose -f docker-compose.dev.yml logs -f

# Restart a service
docker compose -f docker-compose.dev.yml restart db

# Stop all services
docker compose -f docker-compose.dev.yml down

# Stop and remove volumes (fresh start)
docker compose -f docker-compose.dev.yml down -v

# Access database directly
docker compose -f docker-compose.dev.yml exec db psql -U postgres -d roxas

# View ngrok URL
curl http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url'
```

## 📦 First Time Setup

```powershell
# 1. Copy environment file
copy .env.docker.example .env

# 2. Update .env with your values
# - Add NGROK_AUTHTOKEN from https://dashboard.ngrok.com
# - Configure other API keys as needed

# 3. Install dependencies
bun install

# 4. Start infrastructure
docker compose -f docker-compose.dev.yml up -d

# 5. Run migrations
bunx prisma migrate dev

# 6. (Optional) Seed database
bunx prisma db seed

# 7. Start developing!
bun run dev
```

## 🐛 Troubleshooting

**Database connection error:**
```powershell
# Make sure database is running
docker compose -f docker-compose.dev.yml ps db

# Restart database
docker compose -f docker-compose.dev.yml restart db
```

**Port already in use:**
```powershell
# Stop conflicting services
docker compose -f docker-compose.dev.yml down

# Or change ports in docker-compose.dev.yml
```

**Redis connection error:**
```powershell
# Check Redis is running
docker compose -f docker-compose.dev.yml exec redis redis-cli ping
# Should return: PONG
```

## 🎯 Performance Comparison

| Method | Startup Time | Code Changes |
|--------|--------------|--------------|
| Full Docker (`docker-compose.yml`) | ~700 seconds | Need rebuild |
| **Dev Docker + Local** | **~5 seconds** | **Instant** ✅ |

---

**Happy coding! 🚀**
