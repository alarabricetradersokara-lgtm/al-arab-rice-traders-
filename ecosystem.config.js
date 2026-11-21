// ==============================================================================
// AL ARAB RICE TRADERS — ENTERPRISE ERP & POS
// PM2 Process Manager Production Ecosystem Configuration
// ==============================================================================

module.exports = {
  apps: [
    {
      name: 'alarab-api',
      cwd: './backend',
      script: 'dist/server.js',
      instances: 'max', // Scale to all available CPU cores or set to 2
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '../logs/pm2-api-error.log',
      out_file: '../logs/pm2-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000
    }
  ]
};
