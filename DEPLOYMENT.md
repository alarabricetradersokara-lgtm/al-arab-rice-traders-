# 🚀 PRODUCTION DEPLOYMENT & OPERATIONS MANUAL
## AL ARAB RICE TRADERS — ENTERPRISE ERP & POS

> **Hardened Multi-Tier Deployment Architecture Guide**  
> *Target Environments: Windows Server 2022 / 2019, Ubuntu 22.04 LTS / Debian 12, Local LAN On-Premise Servers & Cloud VPS.*

---

## 📋 Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites & Server Sizing](#2-prerequisites--server-sizing)
3. [Environment Configuration & Security](#3-environment-configuration--security)
4. [Backend Node.js API Deployment (PM2 Cluster)](#4-backend-nodejs-api-deployment-pm2-cluster)
5. [Frontend React SPA Production Build & Optimization](#5-frontend-react-spa-production-build--optimization)
6. [Nginx Reverse Proxy & SSL/TLS Termination](#6-nginx-reverse-proxy--ssltls-termination)
7. [Local Area Network (LAN) Multi-Counter Setup](#7-local-area-network-lan-multi-counter-setup)
8. [Firewall & OS Hardening Rules](#8-firewall--os-hardening-rules)
9. [Zero-Downtime Application Updates](#9-zero-downtime-application-updates)
10. [Health Monitoring & Log Rotation](#10-health-monitoring--log-rotation)

---

## 1. Architecture Overview

Al Arab Rice Traders ERP & POS is engineered with an enterprise 3-tier architecture:

```
                  ┌──────────────────────────────────────────────┐
                  │          Client Terminals / Web POS          │
                  │  (Counter Cashier, Mandi Truck In-charge,    │
                  │   Managing Director Desktop, Mobile Tablet)  │
                  └──────────────────────┬───────────────────────┘
                                         │ HTTPS / Port 443
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │             Nginx Reverse Proxy              │
                  │  - SSL/TLS Termination (Let's Encrypt / HSTS) │
                  │  - Gzip / Brotli Static Asset Caching        │
                  │  - Rate Limiting & HTTP Header Hardening     │
                  └──────────────┬───────────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │ Reverse Proxy                 │ Static SPAs
                 ▼ /api/                         ▼ /
     ┌───────────────────────┐       ┌───────────────────────┐
     │ Node.js / Express API │       │ React 19 Production   │
     │  (PM2 Cluster Mode)   │       │ Static Bundle         │
     │  Port: 5000           │       │ (Vite Optimized)      │
     └───────────┬───────────┘       └───────────────────────┘
                 │ Prisma ORM
                 ▼ Connection Pool
     ┌───────────────────────┐
     │ PostgreSQL 16 DB      │
     │ - Dedicated User      │
     │ - ACID Transactions   │
     │ - Port: 5432 (Local)  │
     └───────────────────────┘
```

---

## 2. Prerequisites & Server Sizing

### Recommended Server Specifications
- **Dedicated Mandi Server (On-Premise or Cloud VPS)**:
  - **CPU**: 4 Cores (Intel Xeon or AMD EPYC / Ryzen)
  - **RAM**: 8 GB minimum (16 GB for concurrent peak season Mandi procurement)
  - **Storage**: 100 GB NVMe SSD (with secondary drive for automated backups)
  - **Network**: 1 Gbps NIC for LAN / 100 Mbps uplink for cloud
- **Software Stack**:
  - Node.js LTS `v20.x`
  - PostgreSQL `16.x`
  - Nginx `1.24+`
  - PM2 Process Manager (`npm install -g pm2`)

---

## 3. Environment Configuration & Security

### A. Backend Production Environment (`backend/.env`)
Create `backend/.env` based on `backend/.env.production.example`:

```env
# Application Core
NODE_ENV=production
PORT=5000
API_PREFIX=/api

# Database Connection Pool (PostgreSQL 16)
DATABASE_URL="postgresql://alarab_admin:AlArabStrongPassword2026!@127.0.0.1:5432/alarab_erp?schema=public&connection_limit=20&pool_timeout=10"

# Cryptographic Authentication Secrets
JWT_SECRET="a8f9c2d1e0b4a7f6c3e2d1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0"
JWT_EXPIRES_IN="12h"

# CORS Allowed Origins (Comma-separated)
CORS_ORIGIN="https://erp.alarabrice.com,http://192.168.1.100:5173"

# System Security & Audit
ENABLE_AUDIT_LOGS=true
BCRYPT_SALT_ROUNDS=12
```

### B. Frontend Production Environment (`frontend/.env`)
Create `frontend/.env` based on `frontend/.env.production.example`:

```env
# Production API Endpoint
VITE_API_URL=https://erp.alarabrice.com/api
# Or for LAN local deployment:
# VITE_API_URL=http://192.168.1.100:5000/api
```

---

## 4. Backend Node.js API Deployment (PM2 Cluster)

### A. Compile Backend TypeScript to Production JavaScript
```bash
cd "d:/al arab rice traders/backend" # or /opt/alarab/backend
npm install --omit=dev
npx prisma generate
npx prisma migrate deploy
npm run build # Compiles src/ to dist/
```

### B. PM2 Ecosystem Configuration (`ecosystem.config.js`)
We provide a dedicated PM2 configuration file in the project root:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'alarab-api',
      script: './backend/dist/server.js',
      instances: 2, // Cluster mode across 2 CPU cores
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/pm2-api-error.log',
      out_file: './logs/pm2-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
```

### C. Launch with PM2 & Enable Auto-Start on System Boot
```bash
# Start cluster
pm2 start ecosystem.config.js --env production

# Save process list
pm2 save

# Setup auto-start on server reboot (Windows / Linux)
pm2 startup
```

---

## 5. Frontend React SPA Production Build & Optimization

1. Navigate to frontend directory and compile production bundle:
   ```bash
   cd "d:/al arab rice traders/frontend"
   npm install
   npm run build
   ```
2. Vite generates an optimized, minified production distribution in `frontend/dist`:
   - Gzip compressed chunks.
   - Cache-busted hash assets (`.js`, `.css`).
   - SVG icons and Emerald Enterprise design tokens.

---

## 6. Nginx Reverse Proxy & SSL/TLS Termination

### Recommended Nginx Configuration (`/etc/nginx/sites-available/alarab.conf`)
```nginx
# Upstream Node.js API cluster
upstream alarab_api_upstream {
    server 127.0.0.1:5000;
    keepalive 32;
}

# HTTP ➔ HTTPS Redirect
server {
    listen 80;
    listen [::]:80;
    server_name erp.alarabrice.com;
    return 301 https://$host$request_uri;
}

# HTTPS Main Server Block
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name erp.alarabrice.com;

    # SSL Certificates (Let's Encrypt / Cloudflare Origin)
    ssl_certificate /etc/letsencrypt/live/erp.alarabrice.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/erp.alarabrice.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval';" always;

    # Client Upload Body Limits (for Weighbridge chits and documents)
    client_max_body_size 25M;

    # Static Assets Root (Vite dist)
    root /opt/alarab/frontend/dist;
    index index.html;

    # Static Assets Caching
    location ~* \.(?:css|js|jpg|jpeg|gif|png|ico|cur|gz|svg|svgz|mp4|ogg|ogv|webm|htc|woff|woff2)$ {
        expires 1y;
        access_log off;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # SPA Routing (Fallback to index.html)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Reverse Proxy for API Routes
    location /api/ {
        proxy_pass http://alarab_api_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/alarab.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. Local Area Network (LAN) Multi-Counter Setup

Many grain mandi shops operate on a high-speed local network with multiple cashiers without relying on active internet:

1. **Assign Static IP to Server Machine**:
   - e.g., `192.168.1.100` on shop router.
2. **Configure Frontend Host**:
   - Set `VITE_API_URL=http://192.168.1.100:5000/api`.
3. **Open Windows Firewall Ports**:
   - Port `5000` (Backend API).
   - Port `5173` or `80` (Frontend Web POS).
4. **Accessing from Counter Desktops & Mobile Tablets**:
   - Open browser on any counter terminal: `http://192.168.1.100:5173`.
   - Log in as `Sales Operator` or `Cashier`.

---

## 8. Firewall & OS Hardening Rules

### Ubuntu UFW Firewall:
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
# Explicitly block external access to PostgreSQL port 5432:
sudo ufw deny 5432/tcp
sudo ufw enable
```

### Windows Defender Firewall:
- Allow inbound TCP on ports `80`, `443`, `5000`, `5173` for Private Network profile.
- Restrict PostgreSQL port `5432` strictly to `127.0.0.1` (Localhost only).

---

## 9. Zero-Downtime Application Updates

When deploying software updates or new features:

```bash
# 1. Pull latest code
git pull origin main

# 2. Update Backend
cd backend
npm install --omit=dev
npx prisma migrate deploy
npm run build
pm2 reload alarab-api # Zero-downtime cluster reload

# 3. Update Frontend
cd ../frontend
npm install
npm run build

# Frontend static files are updated instantly in Nginx!
```

---

## 10. Health Monitoring & Log Rotation

### Health Check Endpoint
The backend includes a zero-overhead health check endpoint:
```bash
curl -I https://erp.alarabrice.com/api/health
# Returns HTTP 200 OK: {"status": "ok", "uptime": 182736, "timestamp": "2026-11-21T10:00:00Z"}
```

### PM2 Log Rotation
Prevent log files from filling up disk space:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 14
pm2 set pm2-logrotate:compress true
```

---
*Authorized for Al Arab Rice Traders Production Deployment.*