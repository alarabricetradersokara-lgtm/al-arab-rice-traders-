import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { sendSuccess } from '../utils/response';
import { LoginInput, RegisterInput, RefreshTokenInput } from '../validations/auth.validation';

const generateTokens = (user: { id: string; username: string; roleId: string }) => {
  const accessToken = jwt.sign(
    { userId: user.id, username: user.username, roleId: user.roleId },
    config.jwt.secret,
    { expiresIn: (config.jwt.expiresIn || '30d') as any }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, username: user.username },
    config.jwt.refreshSecret,
    { expiresIn: (config.jwt.refreshExpiresIn || '90d') as any }
  );

  return { accessToken, refreshToken };
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password }: LoginInput = req.body;

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: username.toLowerCase() }, { email: username.toLowerCase() }],
      },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new AppError('Invalid operator credentials or inactive account', 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid operator credentials', 401);
    }

    const { accessToken, refreshToken } = generateTokens(user);

    // Audit login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entityName: 'User',
        entityId: user.id,
        newValues: {
          loginTime: new Date().toISOString(),
          username: user.username,
          role: user.role.name,
        },
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'AL ARAB ERP Client',
      },
    });

    sendSuccess(
      res,
      {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          role: user.role.name,
          permissions: user.role.permissions.map((p) => p.permission.code),
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: config.jwt.expiresIn,
        },
      },
      'Operator logged in successfully'
    );
  } catch (err) {
    next(err);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, email, password, fullName, phone, roleId }: RegisterInput = req.body;

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
      },
    });

    if (existing) {
      throw new AppError('Username or email is already registered', 409);
    }

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new AppError('Specified Role ID does not exist', 404);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        passwordHash,
        fullName,
        phone,
        roleId,
      },
      include: { role: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || newUser.id,
        action: 'CREATE',
        entityName: 'User',
        entityId: newUser.id,
        newValues: {
          username: newUser.username,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role.name,
        },
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'AL ARAB ERP Client',
      },
    });

    sendSuccess(
      res,
      {
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role.name,
        },
      },
      'User created successfully',
      201
    );
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken }: RefreshTokenInput = req.body;

    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as {
      userId: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      throw new AppError('User not found or account deactivated', 401);
    }

    const tokens = generateTokens(user);

    sendSuccess(res, tokens, 'Token refreshed successfully');
  } catch (err) {
    next(new AppError('Invalid or expired refresh token', 401));
  }
};

export const getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Unauthenticated request', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User record not found', 404);
    }

    sendSuccess(
      res,
      {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role.name,
        permissions: user.role.permissions.map((p) => p.permission.code),
      },
      'User profile retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Unauthenticated request', 401);
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required', 400);
    }

    if (newPassword.length < 6) {
      throw new AppError('New password must be at least 6 characters long', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      throw new AppError('User record not found', 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 400);
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_CHANGE',
        entityName: 'User',
        entityId: user.id,
        newValues: { changedAt: new Date().toISOString() },
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'AL ARAB ERP Client',
      },
    });

    sendSuccess(res, null, 'Password changed successfully');
  } catch (err) {
    next(err);
  }
};
