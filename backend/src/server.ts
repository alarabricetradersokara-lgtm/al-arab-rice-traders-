import { createApp } from './app';
import { config } from './config';
import prisma from './config/prisma';

const startServer = async () => {
  try {
    // Validate database connection
    try {
      await prisma.$connect();
      console.log('✅ PostgreSQL database connection established.');
    } catch (dbErr) {
      console.warn('⚠️ Notice: Database connection pending. Ensure PostgreSQL is running on port 5432.');
    }

    const app = createApp();

    const server = app.listen(config.port, () => {
      console.log(`=======================================================`);
      console.log(`🌾 AL ARAB RICE TRADERS - ERP & POS SERVER ACTIVE`);
      console.log(`🚀 Mode: ${config.nodeEnv.toUpperCase()}`);
      console.log(`🌐 Port: http://localhost:${config.port}`);
      console.log(`🩺 Health API: http://localhost:${config.port}/api/health`);
      console.log(`🔐 Auth API: http://localhost:${config.port}/api/auth/login`);
      console.log(`=======================================================`);
    });

    // Graceful Shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('🔒 Database connections closed. Process terminating.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
