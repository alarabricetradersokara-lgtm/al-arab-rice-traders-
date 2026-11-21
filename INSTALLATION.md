# 🛠️ INSTALLATION & SETUP GUIDE
## AL ARAB RICE TRADERS — ENTERPRISE ERP & POS

This guide provides end-to-end instructions for provisioning, configuring, and installing the AL ARAB RICE TRADERS ERP & POS system on local workstations, local area network (LAN) servers, or cloud environments.

---

## 1. System Requirements

### Hardware Requirements
- **CPU**: 4 Cores minimum (8 Cores recommended for high-frequency Mandi seasons).
- **RAM**: 8 GB RAM minimum (16 GB recommended for concurrent multi-terminal POS operations).
- **Disk Storage**: 50 GB SSD storage minimum with automated backup storage.

### Software Prerequisites
- **Operating System**: Windows Server 2019/2022, Windows 10/11 Pro, or Ubuntu 22.04 LTS / Debian 12.
- **Node.js**: Version 18.18.0 or 20.x LTS.
- **PostgreSQL**: Version 15 or 16 with `pg_dump` and `psql` command-line tools.
- **Package Manager**: `npm` v9+ or `pnpm` v8+.

---

## 2. Database Installation & Provisioning

### A. Windows Installation (PostgreSQL)
1. Download PostgreSQL 16 Windows Installer from [postgresql.org](https://www.postgresql.org/download/windows/).
2. Run installer, select port `5432`, and set a strong master password (e.g. `AlArabPostgres@2026`).
3. Open PowerShell or Command Prompt and verify:
   ```powershell
   psql -U postgres -p 5432 -c "SELECT version();"
   ```

### B. Create Dedicated ERP Database
```sql
-- Connect via psql
psql -U postgres -p 5432

-- Execute in psql shell:
CREATE DATABASE alarab_erp;
CREATE USER alarab_admin WITH ENCRYPTED PASSWORD 'AlArabStrongPassword2026!';
GRANT ALL PRIVILEGES ON DATABASE alarab_erp TO alarab_admin;
ALTER DATABASE alarab_erp OWNER TO alarab_admin;
\q
```

---

## 3. Backend API Server Configuration

### A. Navigate to Backend Directory
```bash
cd "d:/al arab rice traders/backend"
```

### B. Environment Variables Setup
Copy the production or development template into `.env`:
```bash
cp .env.production.example .env
```
Ensure `.env` contains valid credentials:
```env
PORT=5000
NODE_ENV=production
DATABASE_URL="postgresql://alarab_admin:AlArabStrongPassword2026!@localhost:5432/alarab_erp?schema=public"
JWT_SECRET="e9a781fbc0214c7784f183920192847582910384756201928475610293847561"
JWT_EXPIRES_IN="8h"
JWT_REFRESH_SECRET="7b8a9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b"
JWT_REFRESH_EXPIRES_IN="30d"
CORS_ORIGIN="http://localhost:5173,http://localhost:5000"
```

### C. Install Dependencies
```bash
npm install
```

### D. Push Prisma Schema & Generate Client
```bash
npx prisma generate
npx prisma db push
```

### E. Seed Master Data & Operator Roles
```bash
# Seed initial company settings, godowns, categories and baseline varieties:
npx tsx src/seed.ts

# Seed 5 standard roles, permissions matrix, and operator demo accounts:
npx tsx src/seed-step11-roles.ts
```

### F. Compile Backend TypeScript
```bash
npm run build
```

---

## 4. Frontend Application Setup

### A. Navigate to Frontend Directory
```bash
cd "d:/al arab rice traders/frontend"
```

### B. Install Dependencies
```bash
npm install
```

### C. Environment Variables Configuration
Create `.env` in the frontend root:
```env
VITE_API_BASE_URL="/api"
```

### D. Compile & Build Production Bundle
```bash
npm run build
```

---

## 5. Running the Application

### Development Mode (with Hot Module Replacement)
- **Start Backend**:
  ```bash
  cd "d:/al arab rice traders/backend"
  npm run dev
  ```
- **Start Frontend**:
  ```bash
  cd "d:/al arab rice traders/frontend"
  npm run dev
  ```
  Open `http://localhost:5173`.

### Production Mode (Using Node.js Server)
- **Backend Service**:
  ```bash
  cd "d:/al arab rice traders/backend"
  node dist/server.js
  ```
- The backend serves API endpoints on `http://localhost:5000/api`.

---

## 6. Pre-Flight Health Check & Verification

Verify that all services are operational:
```bash
# 1. API Health Check
curl http://localhost:5000/api/health

# Expected response:
# {"success":true,"data":{"system":"AL ARAB RICE TRADERS ERP & POS API","version":"1.0.0","status":"ONLINE","database":"connected"}}

# 2. Run Comprehensive Production Test Suite
cd "d:/al arab rice traders/backend"
npx tsx src/test-step12-production-audit.ts
```
Expected result: **`41 PASSED, 0 FAILED`**.

---

*For operational workflows and operator usage, see [USER_GUIDE.md](file:///d:/al%20arab%20rice%20traders/USER_GUIDE.md).*
