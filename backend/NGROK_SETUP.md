# Ngrok Setup for Development Webhooks

This guide helps you set up ngrok to receive webhooks from Midtrans and Digiflazz on your local development environment.

## 📋 What is Ngrok?

Ngrok creates a secure tunnel from the internet to your local server, allowing external services to send webhooks to your development machine.

**Without Ngrok:**
```
❌ Midtrans → Your Local Server (BLOCKED by firewall/NAT)
❌ Digiflazz → Your Local Server (BLOCKED by firewall/NAT)
```

**With Ngrok:**
```
✅ Midtrans → ngrok.io → Your Local Server (WORKING!)
✅ Digiflazz → ngrok.io → Your Local Server (WORKING!)
```

---

## 🚀 Quick Start

### 1. Install Ngrok

**Windows (PowerShell):**
```powershell
# Option 1: Chocolatey
choco install ngrok

# Option 2: Scoop
scoop install ngrok

# Option 3: Manual Download
# Download from: https://ngrok.com/download
```

**macOS:**
```bash
# Homebrew
brew install ngrok/ngrok/ngrok
```

**Linux:**
```bash
# Download and install
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok
```

### 2. Create Ngrok Account

1. Go to: https://dashboard.ngrok.com/signup
2. Sign up for free account
3. Get your authtoken: https://dashboard.ngrok.com/get-started/your-authtoken

### 3. Configure Authtoken

**Edit `ngrok.yml`:**
```yaml
authtoken: YOUR_ACTUAL_AUTHTOKEN_HERE  # Replace with your token
```

Or use command:
```bash
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

### 4. Start Development Server with Ngrok

**Windows:**
```powershell
.\start-dev-with-ngrok.ps1
```

**Linux/macOS:**
```bash
chmod +x start-dev-with-ngrok.sh
./start-dev-with-ngrok.sh
```

### 5. Get Your Ngrok URL

After starting, you'll see output like:
```
Forwarding    https://abc123.ngrok.io -> http://localhost:8000
```

**Your webhook URL:**
```
https://abc123.ngrok.io/api/main/webhooks/midtrans/
https://abc123.ngrok.io/api/main/webhooks/digiflazz/
```

---

## 🔧 Configure Webhook URLs

### Midtrans Dashboard

1. Login to: https://dashboard.sandbox.midtrans.com (or production)
2. Go to: **Settings → Configuration**
3. Set **Payment Notification URL**:
   ```
   https://YOUR_NGROK_URL.ngrok.io/api/main/webhooks/midtrans/
   ```
4. Save settings

### Digiflazz Dashboard

1. Login to: https://member.digiflazz.com
2. Go to: **Pengaturan → Koneksi API**
3. Set **Webhook URL**:
   ```
   https://YOUR_NGROK_URL.ngrok.io/api/main/webhooks/digiflazz/
   ```
4. Set **Webhook Secret**: Copy from your `.env` file
5. Save settings

---

## 📊 Monitor Webhooks

### Ngrok Web Interface

Ngrok provides a web interface to inspect requests:

```
http://localhost:4040
```

Features:
- ✅ View all incoming requests
- ✅ Inspect request/response headers
- ✅ View request body
- ✅ Replay requests for testing
- ✅ Export requests as curl commands

### Django Logs

Watch Django server logs:
```bash
# Webhook logs
tail -f logs/webhook.log

# Django logs
tail -f logs/django.log
```

---

## 🧪 Test Webhooks

### Test Midtrans Webhook

```bash
curl -X POST https://YOUR_NGROK_URL.ngrok.io/api/main/webhooks/midtrans/ping/

# Expected response:
# {"status": "ok", "message": "Midtrans webhook endpoint is working"}
```

### Test Digiflazz Webhook

```bash
curl -X POST https://YOUR_NGROK_URL.ngrok.io/api/main/webhooks/digiflazz/ping/

# Expected response:
# {"status": "ok", "message": "Webhook endpoint is working"}
```

### Test Full Payment Flow

1. **Create test payment** in sandbox
2. **Check ngrok web interface** (http://localhost:4040)
3. **Verify webhook received** in Django logs
4. **Check database** for updated Order/Payment status

---

## 💡 Tips & Best Practices

### 1. Persistent URLs (Paid Plans)

Free ngrok URLs change every restart:
```
https://abc123.ngrok.io  # Changes on restart!
```

Paid plans offer:
- **Custom subdomain**: `https://roxas-dev.ngrok.io` (stays same)
- **Custom domain**: `https://dev.roxasgamestore.com`

### 2. Security

**Add basic authentication** (optional):
```yaml
# ngrok.yml
tunnels:
  backend:
    auth: "username:password"
```

**IP Whitelist** in Django (settings.py):
```python
# Allow ngrok IPs and local IPs
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '.ngrok.io',
    '.ngrok-free.app',
    'data.roxasgamestore.com',
]
```

### 3. Environment-Specific Webhooks

**Development (.env):**
```bash
WEBHOOK_BASE_URL=https://YOUR_NGROK_URL.ngrok.io
```

**Production (.env.prod):**
```bash
WEBHOOK_BASE_URL=https://data.roxasgamestore.com
```

### 4. Automatic URL Updates

Create script to auto-update webhook URLs:

```python
# update_webhooks.py
import os
import requests

ngrok_url = requests.get('http://localhost:4040/api/tunnels').json()
public_url = ngrok_url['tunnels'][0]['public_url']

print(f"Update webhook URLs to: {public_url}/api/main/webhooks/")
```

### 5. Multiple Tunnels

Run multiple services:
```yaml
# ngrok.yml
tunnels:
  backend:
    proto: http
    addr: 8000
  
  frontend:
    proto: http
    addr: 3000
```

Start all:
```bash
ngrok start --all --config=ngrok.yml
```

---

## 🐛 Troubleshooting

### Issue: "Invalid authtoken"

**Solution:**
1. Get new token: https://dashboard.ngrok.com/get-started/your-authtoken
2. Update ngrok.yml
3. Or run: `ngrok config add-authtoken YOUR_TOKEN`

### Issue: "Webhook not received"

**Check:**
1. ✅ Django server running on port 8000
2. ✅ Ngrok tunnel active
3. ✅ Correct webhook URL in Midtrans/Digiflazz
4. ✅ No firewall blocking ngrok
5. ✅ Check ngrok web interface (http://localhost:4040)

### Issue: "Connection refused"

**Solution:**
```bash
# Make sure Django is running first
python manage.py runserver

# Then start ngrok in separate terminal
ngrok http 8000
```

### Issue: Ngrok URL keeps changing

**Free plan:** URLs change on restart  
**Solution:** Upgrade to paid plan for persistent URLs, or update webhook URLs after each restart

### Issue: "Too many connections"

**Free plan limits:**
- 1 online ngrok agent
- 40 connections/minute

**Solution:** Upgrade to paid plan or reduce request rate

---

## 📦 Ngrok Plans

| Feature | Free | Basic ($8/mo) | Pro ($20/mo) |
|---------|------|---------------|--------------|
| Random URL | ✅ | ✅ | ✅ |
| Custom Subdomain | ❌ | ✅ | ✅ |
| Custom Domain | ❌ | ❌ | ✅ |
| IP Whitelist | ❌ | ❌ | ✅ |
| Agents | 1 | 2 | 3 |
| Connections/min | 40 | 120 | 240 |

For development, **Free plan is sufficient**!

---

## 🔗 Useful Links

- **Ngrok Dashboard**: https://dashboard.ngrok.com
- **Ngrok Docs**: https://ngrok.com/docs
- **Ngrok Download**: https://ngrok.com/download
- **Web Interface**: http://localhost:4040 (when ngrok is running)

---

## 📝 Workflow Summary

**Daily Development:**
```bash
# 1. Start backend with ngrok
./start-dev-with-ngrok.sh

# 2. Get ngrok URL from terminal output
# Example: https://abc123.ngrok.io

# 3. Update webhook URLs in dashboards (if URL changed)
# Midtrans: https://abc123.ngrok.io/api/main/webhooks/midtrans/
# Digiflazz: https://abc123.ngrok.io/api/main/webhooks/digiflazz/

# 4. Monitor webhooks at http://localhost:4040

# 5. Test payment flow

# 6. Check logs for webhook events
```

**Before Production:**
```bash
# Switch webhook URLs to production domain
# Midtrans: https://data.roxasgamestore.com/api/main/webhooks/midtrans/
# Digiflazz: https://data.roxasgamestore.com/api/main/webhooks/digiflazz/
```

---

**Happy Developing! 🚀**
