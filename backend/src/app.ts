import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { AppError } from './utils/AppError';

export const createApp = (): Express => {
  const app = express();

  // Security & HTTP Headers
  app.use(helmet());

  // CORS Configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or server-to-server)
        if (!origin || config.cors.origin.includes(origin) || config.cors.origin.includes('*')) {
          callback(null, true);
        } else {
          callback(new AppError('CORS origin denied', 403));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Request Logging
  if (config.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }

  // Body Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Root welcome route
  app.get('/', (req: Request, res: Response) => {
    res.json({
      name: 'AL ARAB RICE TRADERS ERP & POS API',
      version: '1.0.0',
      status: 'OPERATIONAL',
      docs: '/api/health',
    });
  });

  // Mount API V1 routes (support both /api and serverless stripped prefixes)
  app.use('/api', routes);
  app.use('/', routes);

  // 404 Route Handler
  app.use((req: Request, res: Response, next: NextFunction) => {
    next(new AppError(`Cannot ${req.method} ${req.originalUrl} - Route not found on this server`, 404));
  });

  // Centralized Error Middleware
  app.use(errorHandler);

  return app;
};

export default createApp;
