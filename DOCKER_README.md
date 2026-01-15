# Docker Setup untuk Roxas (Next.js)

Dokumentasi lengkap untuk menjalankan aplikasi Roxas menggunakan Docker dengan integrasi Ngrok untuk webhook development.

## 📋 Prerequisites

1. **Docker & Docker Compose**

   ```bash
   docker --version  # Minimum v20.10
   docker-compose --version  # Minimum v2.0
   ```

2. **Ngrok Account**
   - Daftar di [ngrok.com](https://ngrok.com)
   - Dapatkan authentication token dari dashboard
   - (Opsional) Setup custom domain untuk paid plans

3. **Environment Variables**
   - Copy `.env.example` ke `.env`
   - Isi semua environment variables yang diperlukan
   - Pastikan `NGROK_AUTHTOKEN` sudah diisi

## 🚀 Quick Start

### Development Mode

```bash
# 1. Build Docker images
make build

# 2. Start semua services
make dev

# 3. Lihat logs
make logs

# 4. Dapatkan ngrok public URL
make ngrok-url
```

Aplikasi akan tersedia di:

- **App**: http://localhost:3000
- **Ngrok Dashboard**: http://localhost:4040
- **Prisma Studio**: http://localhost:5555 (via `make db-studio`)

### Stop Services

```bash
make down
```

## 📚 Available Commands

Lihat semua available commands:

```bash
make help
```

### Common Commands

| Command           | Description                       |
| ----------------- | --------------------------------- |
| `make dev`        | Start development environment     |
| `make down`       | Stop all containers               |
| `make logs`       | View all logs                     |
| `make logs-app`   | View app logs only                |
| `make logs-ngrok` | View ngrok logs only              |
| `make shell`      | Open shell in app container       |
| `make restart`    | Restart all containers            |
| `make rebuild`    | Rebuild and restart (clear cache) |
| `make ngrok-url`  | Get current ngrok URL             |
| `make db-migrate` | Run database migrations           |
| `make db-push`    | Push schema changes               |
| `make db-studio`  | Start Prisma Studio               |
| `make clean`      | Remove all containers and volumes |

## 🔧 Configuration

### Docker Compose Services

#### 1. App (Next.js)

- **Port**: 3000
- **Volume Mounts**: Source code for hot-reload
- **Environment**: Development mode dengan Neon database

#### 2. Ngrok

- **Port**: 4040 (dashboard)
- **Config**: `docker/ngrok.yml`
- **Purpose**: Expose local app untuk webhooks (Xendit, dll)

#### 3. Prisma Studio (Optional)

- **Port**: 5556
- **Profile**: tools (hanya start jika diperlukan)
- **Command**: `make prisma-studio`

### Environment Variables

Penting untuk diisi di `.env`:

```env
# Database (Neon)
DATABASE_URL=postgresql://...

# Authentication
AUTH_SECRET=your-secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Ngrok (Required)
NGROK_AUTHTOKEN=your-ngrok-token

# Payment Gateway
MIDTRANS_SERVER_KEY=...
MIDTRANS_CLIENT_KEY=...

# Email
MAILGUN_API_KEY=...
MAILGUN_DOMAIN=...

# Other services...
```

## 🌐 Ngrok Setup

### Free Plan

Ngrok akan otomatis generate random URL setiap restart:

```bash
make ngrok-url
# Output: https://abc123.ngrok.io
```

### Paid Plan (Custom Domain)

Tambahkan di `.env`:

```env
NGROK_DOMAIN=your-custom-domain.ngrok.io
```

Update `docker/ngrok.yml` jika perlu konfigurasi advanced.

### Webhook Configuration

Setelah mendapatkan ngrok URL:

1. Copy webhook URL:

   ```
   https://your-ngrok-url.ngrok.io/webhooks/xendit
   ```

2. Paste di Xendit Dashboard → Webhooks → Callback URL

3. Test webhook dengan trigger transaksi test

## 🔍 Troubleshooting

### Container tidak start

```bash
# Check logs
make logs

# Rebuild dari scratch
make rebuild
```

### Port sudah digunakan

Edit `docker-compose.yml` untuk mengubah port mapping:

```yaml
ports:
  - "3001:3000" # Ubah dari 3000 ke 3001
```

### Ngrok authentication failed

Pastikan `NGROK_AUTHTOKEN` sudah benar di `.env`:

```bash
# Check token
grep NGROK_AUTHTOKEN .env

# Restart ngrok
docker-compose restart ngrok
make ngrok-url
```

### Database connection error

Pastikan `DATABASE_URL` benar dan Neon database accessible:

```bash
# Test koneksi dari dalam container
make shell
bun run prisma db push
```

### Hot-reload tidak bekerja

Jika perubahan code tidak terdeteksi:

```bash
# Restart app container
make restart-app

# Atau rebuild
make rebuild
```

## 🏗️ Development Workflow

### 1. Initial Setup

```bash
# Clone repository
git clone <repo-url>
cd roxas

# Copy environment
cp .env.example .env
# Edit .env dengan credentials yang benar

# Build dan start
make build
make dev
```

### 2. Daily Development

```bash
# Start services
make dev

# View logs di terminal lain
make logs-app

# Edit code (hot-reload aktif)

# Run migrations jika ada perubahan schema
make db-migrate

# View database
make db-studio
```

### 3. Testing Webhooks

```bash
# Get webhook URL
make ngrok-url

# Configure di Xendit dashboard

# Monitor incoming webhooks
make logs-app | grep webhook
```

## 🔐 Security Best Practices

1. **Environment Variables**
   - Jangan commit `.env` ke git
   - Gunakan `.env.example` sebagai template
   - Rotate secrets secara berkala

2. **Ngrok**
   - Gunakan ngrok authentication untuk production
   - Batasi IP whitelist jika memungkinkan
   - Monitor ngrok dashboard untuk unexpected traffic

3. **Docker**
   - Containers run sebagai non-root user (nextjs)
   - Health checks enabled untuk monitoring
   - Resource limits dapat diset di docker-compose.yml

## 📊 Monitoring

### Container Health

```bash
# Check container status
make ps

# View resource usage
make stats
```

### Application Health

```bash
# Via health endpoint
curl http://localhost:3000/api/health

# Via Docker
docker-compose ps
```

### Ngrok Traffic

Access dashboard: http://localhost:4040

## 🚢 Production Notes

Setup Docker ini dioptimalkan untuk **development**. Untuk production:

1. Gunakan `Dockerfile` (production multi-stage build)
2. Disable hot-reload dan development tools
3. Set proper resource limits
4. Gunakan proper reverse proxy (Nginx/Caddy)
5. Implement proper logging dan monitoring
6. Gunakan proper secrets management (Vault, AWS Secrets Manager, dll)

## 📞 Support

Jika ada masalah:

1. Check logs: `make logs`
2. Restart: `make restart`
3. Rebuild: `make rebuild`
4. Clean start: `make clean` then `make dev`

---

**Happy Coding! 🎉**
