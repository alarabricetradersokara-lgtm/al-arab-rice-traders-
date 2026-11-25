import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

// Clean up stale rate limits every 5 minutes
if (typeof setInterval !== 'undefined') {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      if (now > record.resetAt) {
        memoryStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
  if (timer.unref) timer.unref();
}

export interface RateLimitOptions {
  windowMs: number; // Duration of rate limit window in ms
  max: number;      // Max allowed requests in the window
  message?: string;
  keyGenerator?: (req: Request) => string;
}

export const createRateLimiter = (options: RateLimitOptions) => {
  const {
    windowMs,
    max,
    message = 'Too many requests, please wait before retrying.',
    keyGenerator = (req: Request) => {
      const forwarded = req.headers['x-forwarded-for'];
      const clientIp = typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : req.socket.remoteAddress || req.ip || 'unknown';
      return `${req.path}:${clientIp}`;
    },
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyGenerator(req);
    const now = Date.now();

    let record = memoryStore.get(key);

    if (!record || now > record.resetAt) {
      record = {
        count: 1,
        resetAt: now + windowMs,
      };
      memoryStore.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetAt - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000));

    if (record.count > max) {
      res.setHeader('Retry-After', resetSeconds);
      return next(new AppError(message, 429));
    }

    next();
  };
};

/**
 * Strict brute-force protection for login attempts:
 * Allows max 10 login attempts per 15 minutes per IP/username.
 */
export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'سیکیورٹی الرٹ: بہت زیادہ کوششیں کی گئی ہیں۔ سیکیورٹی کی خاطر برائے مہربانی 15 منٹ بعد دوبارہ لاگ ان کریں۔ (Too many login attempts. Please wait 15 minutes before retrying.)',
  keyGenerator: (req: Request) => {
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim()
      : req.socket.remoteAddress || req.ip || 'unknown';
    const username = (req.body?.username || '').toString().toLowerCase().trim();
    return `auth_login:${clientIp}:${username}`;
  },
});

/**
 * General API rate limiter:
 * 300 requests per minute per IP to protect against DoS.
 */
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 300,
  message: 'API rate limit exceeded. Please slow down your requests.',
});
