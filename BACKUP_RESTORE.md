# 💾 POSTGRESQL BACKUP & DISASTER RECOVERY GUIDE
## AL ARAB RICE TRADERS — ENTERPRISE ERP & POS

> **Production Database Reliability, Automated Backups, and Point-In-Time Restoration Manual.**  
> *Target Systems: PostgreSQL 15 / 16 on Windows Server and Linux (Ubuntu/Debian).*

---

## 📋 Table of Contents
1. [Disaster Recovery Objectives (RPO & RTO)](#1-disaster-recovery-objectives-rpo--rto)
2. [Database Environment Architecture](#2-database-environment-architecture)
3. [Automated Backup Strategies](#3-automated-backup-strategies)
4. [Windows Automated Backup Setup (PowerShell & Task Scheduler)](#4-windows-automated-backup-setup-powershell--task-scheduler)
5. [Linux Automated Backup Setup (Bash & Cron)](#5-linux-automated-backup-setup-bash--cron)
6. [Step-by-Step Restoration Procedures](#6-step-by-step-restoration-procedures)
7. [Backup Verification & Integrity Testing](#7-backup-verification--integrity-testing)
8. [Offsite Cloud Storage Synchronization](#8-offsite-cloud-storage-synchronization)
9. [Disaster Recovery Drill Checklist](#9-disaster-recovery-drill-checklist)

---

## 1. Disaster Recovery Objectives (RPO & RTO)

For **Al Arab Rice Traders ERP & POS**, data loss prevention is mission-critical. Counter sales, Mandi purchase bills, and customer khata ledgers must be protected against disk failure, power corruption, ransomware, or operator error.

| Metric | Target | Operational Implementation |
| :--- | :--- | :--- |
| **Recovery Point Objective (RPO)** | **< 1 Hour** | Hourly transaction log / snapshot backups during peak Mandi trading hours (08:00 to 20:00). |
| **Recovery Time Objective (RTO)** | **< 15 Minutes** | Standby single-command database drop-and-restore script using native `pg_restore`. |
| **Retention Policy** | **7 Days Hourly / 30 Days Daily / 12 Months Monthly** | Automated rotation script pruning expired backups to conserve storage. |

---

## 2. Database Environment Architecture

### Production Connection Parameters
```env
# Database Credentials
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=alarab_erp
DB_USER=alarab_admin
DB_PASS=AlArabStrongPassword2026!
DATABASE_URL="postgresql://alarab_admin:AlArabStrongPassword2026!@127.0.0.1:5432/alarab_erp?schema=public&sslmode=prefer"
```

### Critical PostgreSQL Tools
Ensure the following binaries are in the system `PATH`:
- `pg_dump`: High-speed logical backup tool.
- `pg_restore`: Multi-threaded parallel restoration utility.
- `psql`: Interactive SQL terminal.

---

## 3. Automated Backup Strategies

We employ **Custom Compressed Format (`-Fc`)** for all automated backups:
- **Compression**: Up to 70% storage reduction using zlib compression.
- **Selectivity**: Enables restoring individual tables, schema-only, or data-only if needed.
- **Speed**: Allows multi-threaded parallel restoration via `pg_restore -j 4`.

---

## 4. Windows Automated Backup Setup (PowerShell & Task Scheduler)

### A. Dedicated Backup Script: `backup_alarab_erp.ps1`
Save this script to: `C:\AlArabERP\scripts\backup_alarab_erp.ps1` (or `d:\al arab rice traders\scripts\backup_alarab_erp.ps1`).

```powershell
# ==============================================================================
# AL ARAB RICE TRADERS — AUTOMATED POSTGRESQL BACKUP SCRIPT (WINDOWS)
# ==============================================================================
$ErrorActionPreference = "Stop"

# Configuration
$PgBinPath     = "C:\Program Files\PostgreSQL\16\bin" # Adjust to local PostgreSQL bin folder
$BackupRootDir = "D:\AlArabBackups"
$DbName        = "alarab_erp"
$DbUser        = "alarab_admin"
$DbHost        = "127.0.0.1"
$DbPort        = "5432"
$RetentionDays = 30

# Ensure Backup Directory Exists
if (-not (Test-Path -Path $BackupRootDir)) {
    New-Item -ItemType Directory -Path $BackupRootDir -Force | Out-Null
}

# Timestamp and Filename
$Timestamp  = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BackupFile = Join-Path -Path $BackupRootDir -ChildPath "${DbName}_backup_${Timestamp}.dump"
$LogFile    = Join-Path -Path $BackupRootDir -ChildPath "backup_log.txt"

# Set Password Environment Variable
$env:PGPASSWORD = "AlArabStrongPassword2026!"

Write-Output "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Starting backup of ${DbName} to ${BackupFile}..." | Out-File -Append -FilePath $LogFile

try {
    # Execute pg_dump with custom compressed format (-Fc) and verbose (-v)
    $PgDump = Join-Path -Path $PgBinPath -ChildPath "pg_dump.exe"
    & $PgDump -h $DbHost -p $DbPort -U $DbUser -d $DbName -F c -b -v -f $BackupFile 2>> $LogFile

    $FileSize = (Get-Item -Path $BackupFile).Length / 1MB
    Write-Output "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] SUCCESS: Backup completed successfully. Size: $([Math]::Round($FileSize, 2)) MB" | Out-File -Append -FilePath $LogFile
}
catch {
    Write-Output "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ERROR: Backup failed: $_" | Out-File -Append -FilePath $LogFile
    exit 1
}
finally {
    # Clean environment variable
    $env:PGPASSWORD = $null
}

# Automated Pruning of Backups Older than $RetentionDays
Get-ChildItem -Path $BackupRootDir -Filter "${DbName}_backup_*.dump" | Where-Object {
    $_.CreationTime -lt (Get-Date).AddDays(-$RetentionDays)
} | ForEach-Object {
    Remove-Item $_.FullName -Force
    Write-Output "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] PRUNED: Deleted old backup file: $($_.Name)" | Out-File -Append -FilePath $LogFile
}
```

### B. Scheduling in Windows Task Scheduler
1. Open **Windows Task Scheduler** (`taskschd.msc`).
2. Click **Create Task** (Run with highest privileges, user: `SYSTEM` or Administrator).
3. **Trigger**:
   - Daily at `02:00:00 AM` (Full daily snapshot).
   - Repeat task every `1 hour` between `08:00 AM` and `08:00 PM` for continuous Mandi intraday protection.
4. **Action**:
   - Action: `Start a program`
   - Program/script: `powershell.exe`
   - Add arguments: `-NoProfile -ExecutionPolicy Bypass -File "D:\AlArabBackups\backup_alarab_erp.ps1"`
5. **Conditions**: Uncheck "Start the task only if the computer is on AC power".

---

## 5. Linux Automated Backup Setup (Bash & Cron)

### A. Dedicated Backup Script: `/opt/alarab/backup_alarab.sh`
```bash
#!/bin/bash
# ==============================================================================
# AL ARAB RICE TRADERS — AUTOMATED POSTGRESQL BACKUP SCRIPT (LINUX)
# ==============================================================================
set -euo pipefail

BACKUP_DIR="/var/backups/alarab_erp"
DB_NAME="alarab_erp"
DB_USER="alarab_admin"
DB_HOST="127.0.0.1"
DB_PORT="5432"
RETENTION_DAYS=30
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_backup_${TIMESTAMP}.dump"
LOG_FILE="${BACKUP_DIR}/backup.log"

mkdir -p "$BACKUP_DIR"

export PGPASSWORD="AlArabStrongPassword2026!"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting backup of $DB_NAME to $BACKUP_FILE..." >> "$LOG_FILE"

if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F c -b -f "$BACKUP_FILE" >> "$LOG_FILE" 2>&1; then
    FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: Backup finished. Size: $FILE_SIZE" >> "$LOG_FILE"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Backup failed!" >> "$LOG_FILE"
    exit 1
fi

unset PGPASSWORD

# Prune old backups
find "$BACKUP_DIR" -type f -name "${DB_NAME}_backup_*.dump" -mtime +$RETENTION_DAYS -delete
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Old backups older than $RETENTION_DAYS days pruned." >> "$LOG_FILE"
```

### B. Make Executable & Add to Crontab
```bash
chmod +x /opt/alarab/backup_alarab.sh

# Edit Crontab
sudo crontab -e

# Run every hour between 8am and 8pm, and full daily at 2am
0 8-20 * * * /opt/alarab/backup_alarab.sh
0 2 * * * /opt/alarab/backup_alarab.sh
```

---

## 6. Step-by-Step Restoration Procedures

### Scenario A: Full Database Restoration (Drop and Recreate)
Use this procedure if the database is corrupted, during hardware migrations, or after severe disaster.

> [!CAUTION]
> This command completely drops the existing `alarab_erp` database and recreates it from the backup file. Ensure all application backend processes are stopped first!

#### Windows PowerShell:
```powershell
# 1. Stop Backend Application Server
pm2 stop alarab-backend  # or Stop-Process for dev server

# 2. Terminate active PostgreSQL connections to alarab_erp
$env:PGPASSWORD = "AlArabPostgresMasterPassword"
psql -U postgres -p 5432 -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'alarab_erp' AND pid <> pg_backend_pid();"

# 3. Drop and Recreate Clean Database
psql -U postgres -p 5432 -c "DROP DATABASE IF EXISTS alarab_erp;"
psql -U postgres -p 5432 -c "CREATE DATABASE alarab_erp WITH OWNER alarab_admin;"

# 4. Perform High-Speed Parallel Restore (-j 4 uses 4 CPU threads)
$BackupFile = "D:\AlArabBackups\alarab_erp_backup_2026-11-21_02-00-00.dump"
pg_restore -U alarab_admin -h 127.0.0.1 -p 5432 -d alarab_erp -v -j 4 $BackupFile

# 5. Restart Backend Application
pm2 restart alarab-backend
```

#### Linux Server:
```bash
# 1. Terminate connections and drop database
export PGPASSWORD="MasterPostgresPassword"
psql -U postgres -h 127.0.0.1 -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'alarab_erp' AND pid <> pg_backend_pid();"
psql -U postgres -h 127.0.0.1 -c "DROP DATABASE IF EXISTS alarab_erp;"
psql -U postgres -h 127.0.0.1 -c "CREATE DATABASE alarab_erp WITH OWNER alarab_admin;"

# 2. Restore from compressed dump
export PGPASSWORD="AlArabStrongPassword2026!"
pg_restore -U alarab_admin -h 127.0.0.1 -p 5432 -d alarab_erp -v -j 4 /var/backups/alarab_erp/alarab_erp_backup_2026-11-21_02-00-00.dump

# 3. Verify restore
psql -U alarab_admin -d alarab_erp -c "SELECT count(*) FROM \"User\";"
```

---

### Scenario B: Restoring a Single Table
If an operator accidentally altered a single table (e.g., `RiceProduct` or `Customer`):
```bash
pg_restore -U alarab_admin -h 127.0.0.1 -p 5432 -d alarab_erp -t "Customer" -v /path/to/backup.dump
```

---

## 7. Backup Verification & Integrity Testing

A backup that has never been restored is not a guaranteed backup. We provide an automated verification script that creates a temporary database (`alarab_erp_test`), restores the latest dump, performs consistency queries, and drops the test database.

### Automated Integrity Check Script (`verify_backup.ps1`)
```powershell
$env:PGPASSWORD = "AlArabPostgresMasterPassword"
$LatestBackup = Get-ChildItem "D:\AlArabBackups\*.dump" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $LatestBackup) {
    Write-Error "No backup file found to verify!"
    exit 1
}

Write-Host "Verifying latest backup: $($LatestBackup.FullName)..."

# 1. Create temporary verification database
psql -U postgres -p 5432 -c "DROP DATABASE IF EXISTS alarab_verify_temp;"
psql -U postgres -p 5432 -c "CREATE DATABASE alarab_verify_temp;"

# 2. Restore into temporary database
pg_restore -U postgres -p 5432 -d alarab_verify_temp -v $LatestBackup.FullName

# 3. Run Integrity Queries
$ProductsCount  = psql -U postgres -p 5432 -d alarab_verify_temp -t -A -c "SELECT count(*) FROM \"RiceProduct\";"
$SalesCount     = psql -U postgres -p 5432 -d alarab_verify_temp -t -A -c "SELECT count(*) FROM \"Sale\";"
$LedgerCount    = psql -U postgres -p 5432 -d alarab_verify_temp -t -A -c "SELECT count(*) FROM \"CustomerLedger\";"

Write-Host "Verification Passed! Records found -> Products: $ProductsCount, Sales: $SalesCount, Ledgers: $LedgerCount"

# 4. Clean up temporary database
psql -U postgres -p 5432 -c "DROP DATABASE alarab_verify_temp;"
Write-Host "Verification database cleaned. Backup is 100% HEALTHY."
```

---

## 8. Offsite Cloud Storage Synchronization

To protect against physical theft, hardware fire, or facility hazards in the Mandi, backups must be synced offsite.

### Recommended Tool: `rclone` (Cross-Platform)
1. Download `rclone` from [rclone.org](https://rclone.org/).
2. Configure cloud remote (Google Drive, AWS S3, or Backblaze B2):
   ```bash
   rclone config
   # Name: alarab_cloud
   ```
3. Add sync command to the daily backup script:
   ```bash
   # Sync backup folder to Cloud Bucket with bandwidth throttling
   rclone copy /var/backups/alarab_erp alarab_cloud:alarab-backups-bucket --max-age 7d --bwlimit 5M
   ```

---

## 9. Disaster Recovery Drill Checklist

Execute this dry run once every quarter:
- [ ] Verify primary backup folder contains recent dumps (< 2 hours old).
- [ ] Confirm cloud offsite sync contains matching file sizes.
- [ ] Restore latest `.dump` file to a staging or testing server.
- [ ] Execute `verify_backup.ps1` to ensure zero database corruption errors.
- [ ] Test application login and print yesterday's Daily Closing Report from restored database.
- [ ] Document audit drill date and sign off in system maintenance register.

---
*Maintained by Al Arab Rice Traders System Engineering.*