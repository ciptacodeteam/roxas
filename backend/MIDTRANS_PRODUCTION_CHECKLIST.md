# Midtrans Production Checklist

Use this when Midtrans works in development but not in production.

---

## 1. Verify backend config at runtime

**Call your production ping endpoint (GET, no auth):**

```text
https://YOUR_PRODUCTION_DOMAIN/api/v1/webhooks/midtrans/ping/
```

**Expected in production:**

- `midtrans_mode`: `"production"` (not `"sandbox"`)
- `midtrans_api_url`: `"https://api.midtrans.com/v2"` (not `api.sandbox.midtrans.com`)
- `server_key_configured`: `true`

If you see `sandbox` or `server_key_configured: false`, the app is not using production Midtrans. Fix env (see below) and restart the app, then call the ping again.

---

## 2. Environment variables (exact names)

Backend reads these; names and values must match.

| Variable | Production value | Notes |
|----------|------------------|--------|
| `MIDTRANS_SERVER_KEY` | Your **production** server key | From [dashboard.midtrans.com](https://dashboard.midtrans.com/) → Settings → Access Keys |
| `MIDTRANS_CLIENT_KEY` | Your **production** client key | Same place (for frontend/Snap if you use it) |
| `MIDTRANS_IS_PRODUCTION` | `true` or `1` | **Must** be set in production so the backend uses `api.midtrans.com` |

Common mistakes:

- **Wrong env name:** Code uses `MIDTRANS_IS_PRODUCTION` (with **IS**). `MIDTRANS_PRODUCTION` alone is not read by Django settings.
- **Not set in production:** If `MIDTRANS_IS_PRODUCTION` is missing, it defaults to `false`, so production still uses the sandbox API (and sandbox keys in dev work; production keys with sandbox API often fail).
- **Wrong keys:** Production server key must be from the **production** Midtrans dashboard, not sandbox.

---

## 3. Midtrans dashboard (production)

- Log in to **[dashboard.midtrans.com](https://dashboard.midtrans.com/)** (not sandbox).
- **Settings → Configuration → Notification URL**
  - Set **Payment Notification URL** to:
    - `https://YOUR_PRODUCTION_DOMAIN/api/v1/webhooks/midtrans/`
  - Must be **HTTPS**, no trailing slash if your app expects no trailing slash (our webhook accepts both).
- Save. Midtrans will send payment status to this URL.

---

## 4. Webhook URL reachable by Midtrans

- The URL above must be **publicly reachable** (no VPN/firewall blocking Midtrans).
- **HTTPS** is required; HTTP is not accepted for production.
- Your backend must accept POSTs to that path (no auth required for the webhook; we validate with `signature_key`).
- If you use a reverse proxy (e.g. nginx), ensure it forwards to the Django app and that `ALLOWED_HOSTS` / proxy headers are correct so Django serves the request.

---

## 5. ALLOWED_HOSTS and CSRF

- `ALLOWED_HOSTS` must include your production domain (or the host your app sees after the proxy).
- The webhook view uses `@csrf_exempt`, so CSRF is not required for the notification URL. No change needed for CSRF just for the webhook.

---

## 6. Key/API mismatch

| Backend thinks | API URL used | Key you set | Result |
|----------------|--------------|-------------|--------|
| Production (`MIDTRANS_IS_PRODUCTION=true`) | `api.midtrans.com` | Production server key | Correct |
| Sandbox (default) | `api.sandbox.midtrans.com` | Production server key | Fails (wrong API for key) |
| Sandbox | `api.sandbox.midtrans.com` | Sandbox server key | Works in dev only |

So in production you **must** set `MIDTRANS_IS_PRODUCTION=true` and the **production** server key.

---

## 7. Quick checklist

- [ ] Production env has `MIDTRANS_SERVER_KEY` = production server key.
- [ ] Production env has `MIDTRANS_IS_PRODUCTION=true` (or `1`).
- [ ] After changing env, backend/workers were **restarted**.
- [ ] GET `.../api/v1/webhooks/midtrans/ping/` returns `midtrans_mode: "production"` and `server_key_configured: true`.
- [ ] Midtrans production dashboard → Notification URL = `https://YOUR_DOMAIN/api/v1/webhooks/midtrans/`.
- [ ] That URL is HTTPS and reachable from the internet (no firewall blocking Midtrans).

---

## 8. If payments are created but status never updates

- Midtrans is calling your **Payment Notification URL** when status changes. If the URL is wrong, unreachable, or returns an error, Midtrans may retry but your DB will not update.
- Check backend logs for:
  - Incoming POSTs to `/api/v1/webhooks/midtrans/`
  - Errors (e.g. 403 invalid signature, 500 server error)
- Invalid signature often means: wrong server key in env, or notification signed with production key while your app uses sandbox key (or the opposite). Fix key and `MIDTRANS_IS_PRODUCTION` so they match the environment you use in the dashboard.

---

## 9. Frontend (if you use Snap or client key)

- If the frontend loads Midtrans Snap/JS, it must use the **client key** for the same environment (sandbox vs production) as the backend. Backend only reads `MIDTRANS_CLIENT_KEY`; you must ensure the frontend gets the production client key in production (e.g. from your own API or env).
- Backend charge creation uses **server key** and `MIDTRANS_IS_PRODUCTION`; the ping endpoint and this checklist apply to the backend.
