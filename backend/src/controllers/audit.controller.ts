import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { AuditAction } from '@prisma/client';

/**
 * GET /api/audit-logs
 * Filterable, paginated audit trail
 */
export const getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const action = req.query.action as AuditAction | undefined;
    const entityName = req.query.entityName as string | undefined;
    const userId = req.query.userId as string | undefined;
    const search = req.query.search as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const where: any = {};

    if (action) {
      where.action = action;
    }

    if (entityName) {
      where.entityName = { contains: entityName, mode: 'insensitive' };
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.timestamp.lte = end;
      }
    }

    if (search) {
      where.OR = [
        { entityName: { contains: search, mode: 'insensitive' } },
        { user: { username: { contains: search, mode: 'insensitive' } } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              role: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    const formatted = logs.map((log: any) => ({
      id: log.id,
      action: log.action,
      entityName: log.entityName,
      entityId: log.entityId,
      oldValues: log.oldValues,
      newValues: log.newValues,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      timestamp: log.timestamp,
      user: log.user
        ? {
            id: log.user.id,
            username: log.user.username,
            fullName: log.user.fullName,
            role: log.user.role?.name,
          }
        : null,
    }));

    sendSuccess(
      res,
      {
        logs: formatted,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      'Audit trail retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/audit-logs/summary
 * KPI summary of audit events
 */
export const getAuditSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalLogs, todayLogs, loginsToday, passwordChanges, topEntities] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({
        where: { timestamp: { gte: today } },
      }),
      prisma.auditLog.count({
        where: {
          action: 'LOGIN',
          timestamp: { gte: today },
        },
      }),
      prisma.auditLog.count({
        where: {
          action: 'PASSWORD_CHANGE',
        },
      }),
      prisma.auditLog.groupBy({
        by: ['entityName'],
        _count: { entityName: true },
        orderBy: { _count: { entityName: 'desc' } },
        take: 5,
      }),
    ]);

    sendSuccess(
      res,
      {
        totalLogs,
        todayLogs,
        loginsToday,
        passwordChanges,
        topEntities: topEntities.map((e) => ({
          entityName: e.entityName,
          count: e._count.entityName,
        })),
      },
      'Audit log summary retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};
