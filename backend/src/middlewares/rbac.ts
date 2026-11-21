import { Request, Response, NextFunction } from 'express';
import { RoleName } from '@prisma/client';
import { AppError } from '../utils/AppError';
import prisma from '../config/prisma';

/**
 * Permission aliases mapping so standard permission codes and specialized legacy codes
 * both satisfy the permission requirement seamlessly.
 */
const PERMISSION_ALIASES: Record<string, string[]> = {
  'pos:sale': ['pos:sale', 'sales:create', 'sales:manage'],
  'sales:create': ['sales:create', 'pos:sale', 'sales:manage'],
  'sales:manage': ['sales:manage'],
  'sales:view': ['sales:view', 'sales:create', 'sales:manage', 'pos:sale'],
  'pos:close_shift': ['pos:close_shift', 'daily_closing:approve'],
  'daily_closing:approve': ['daily_closing:approve', 'pos:close_shift'],
  'inventory:view': ['inventory:view', 'stock:view', 'products:manage'],
  'stock:view': ['stock:view', 'inventory:view', 'products:manage'],
  'inventory:create': ['inventory:create', 'products:manage', 'stock:manage'],
  'products:manage': ['products:manage', 'inventory:create', 'stock:manage'],
  'inventory:adjust': ['inventory:adjust', 'stock:manage'],
  'stock:manage': ['stock:manage', 'inventory:adjust', 'products:manage'],
  'procurement:create': ['procurement:create', 'purchases:manage'],
  'purchases:manage': ['purchases:manage', 'procurement:create'],
  'accounts:view': ['accounts:view', 'ledgers:view', 'reports:financial'],
  'accounts:manage': ['accounts:manage', 'accounts:post', 'payments:manage', 'receipts:manage'],
  'accounts:post': ['accounts:post', 'accounts:manage'],
  'payments:manage': ['payments:manage', 'accounts:manage', 'accounts:post'],
  'receipts:manage': ['receipts:manage', 'accounts:manage', 'accounts:post'],
  'ledgers:view': ['ledgers:view', 'accounts:view'],
  'reports:financial': ['reports:financial'],
  'reports:view': ['reports:view', 'reports:financial'],
  'users:manage': ['users:manage'],
  'settings:manage': ['settings:manage'],
  'audit:view': ['audit:view'],
  'customers:view': ['customers:view', 'accounts:view', 'sales:create'],
  'dashboard:view': ['dashboard:view'],
};

/**
 * Restrict access to specific Role names
 */
export const requireRole = (...allowedRoles: RoleName[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Unauthenticated request', 401));
    }

    // SUPER_ADMIN and ADMIN have root administrative privileges
    if (req.user.roleName === RoleName.SUPER_ADMIN || req.user.roleName === RoleName.ADMIN) {
      return next();
    }

    if (!allowedRoles.includes(req.user.roleName as RoleName)) {
      return next(
        new AppError(
          `Forbidden: Role '${req.user.roleName}' is not authorized to access this resource`,
          403
        )
      );
    }

    next();
  };
};

/**
 * Restrict access based on granular permission codes
 */
export const requirePermission = (permissionCode: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new AppError('Unauthenticated request', 401));
      }

      // SUPER_ADMIN and ADMIN have implicit root permission
      if (req.user.roleName === RoleName.SUPER_ADMIN || req.user.roleName === RoleName.ADMIN) {
        return next();
      }

      // Check codes that satisfy this permission
      const acceptedCodes = PERMISSION_ALIASES[permissionCode] || [permissionCode];

      const hasPerm = await prisma.rolePermission.findFirst({
        where: {
          roleId: req.user.roleId,
          permission: {
            code: { in: acceptedCodes },
          },
        },
      });

      if (!hasPerm) {
        return next(
          new AppError(
            `Forbidden: Missing required permission '${permissionCode}' for role '${req.user.roleName}'`,
            403
          )
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
