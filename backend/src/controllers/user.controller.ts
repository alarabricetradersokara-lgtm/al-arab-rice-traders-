import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { sendSuccess } from '../utils/response';

/**
 * GET /api/users
 * List all users with role and permissions
 */
export const getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const sanitizedUsers = users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      phone: u.phone,
      isActive: u.isActive,
      roleId: u.roleId,
      roleName: u.role.name,
      roleDescription: u.role.description,
      permissions: u.role.permissions.map((p) => p.permission.code),
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    sendSuccess(res, sanitizedUsers, 'Users retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/roles
 * List all roles with their assigned permissions
 */
export const getRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: {
          select: { users: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formattedRoles = roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      userCount: r._count.users,
      permissions: r.permissions.map((p) => ({
        id: p.permission.id,
        code: p.permission.code,
        module: p.permission.module,
        description: p.permission.description,
      })),
    }));

    sendSuccess(res, formattedRoles, 'Roles retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/users
 * Create a new operator account
 */
export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, email, password, fullName, phone, roleId } = req.body;

    if (!username || !email || !password || !fullName || !roleId) {
      throw new AppError('Username, email, password, full name, and role are required', 400);
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username: username.toLowerCase().trim() }, { email: email.toLowerCase().trim() }],
      },
    });

    if (existing) {
      throw new AppError('Username or email already exists in system', 409);
    }

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new AppError('Selected role does not exist', 404);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        username: username.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        fullName: fullName.trim(),
        phone: phone ? String(phone).trim() : null,
        roleId,
        passwordHash,
        isActive: true,
      },
      include: { role: true },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || newUser.id,
        action: 'CREATE',
        entityName: 'User',
        entityId: newUser.id,
        newValues: {
          username: newUser.username,
          fullName: newUser.fullName,
          role: newUser.role.name,
          email: newUser.email,
        },
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'AL ARAB ERP Client',
      },
    });

    sendSuccess(
      res,
      {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        fullName: newUser.fullName,
        phone: newUser.phone,
        roleName: newUser.role.name,
        isActive: newUser.isActive,
      },
      'Operator account created successfully',
      201
    );
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/users/:id
 * Update operator profile details or change role
 */
export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { fullName, email, phone, roleId } = req.body;

    const existing = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!existing) {
      throw new AppError('User not found', 404);
    }

    // Role existence check if roleId provided
    if (roleId && roleId !== existing.roleId) {
      const roleExists = await prisma.role.findUnique({ where: { id: roleId } });
      if (!roleExists) {
        throw new AppError('Selected role does not exist', 404);
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        fullName: fullName !== undefined ? String(fullName).trim() : existing.fullName,
        email: email !== undefined ? String(email).toLowerCase().trim() : existing.email,
        phone: phone !== undefined ? String(phone).trim() : existing.phone,
        roleId: roleId || existing.roleId,
      },
      include: { role: true },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || id,
        action: 'UPDATE',
        entityName: 'User',
        entityId: id,
        oldValues: {
          fullName: existing.fullName,
          email: existing.email,
          phone: existing.phone,
          role: existing.role.name,
        },
        newValues: {
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          phone: updatedUser.phone,
          role: updatedUser.role.name,
        },
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'AL ARAB ERP Client',
      },
    });

    sendSuccess(
      res,
      {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        phone: updatedUser.phone,
        roleName: updatedUser.role.name,
        isActive: updatedUser.isActive,
      },
      'Operator account updated successfully'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/:id/status
 * Toggle user active/inactive status
 */
export const toggleUserStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (req.user?.id === id) {
      throw new AppError('You cannot deactivate your own administrative account', 400);
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      include: { role: true },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || id,
        action: 'UPDATE',
        entityName: 'User',
        entityId: id,
        oldValues: { isActive: user.isActive },
        newValues: { isActive: updated.isActive },
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'AL ARAB ERP Client',
      },
    });

    sendSuccess(
      res,
      {
        id: updated.id,
        username: updated.username,
        isActive: updated.isActive,
      },
      `Operator account ${updated.isActive ? 'activated' : 'deactivated'} successfully`
    );
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/users/:id/reset-password
 * Admin resets an operator's password
 */
export const resetUserPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      throw new AppError('New password must be at least 6 characters long', 400);
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id },
      data: { passwordHash: newPasswordHash },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || id,
        action: 'PASSWORD_CHANGE',
        entityName: 'User',
        entityId: id,
        newValues: { resetBy: req.user?.username, resetAt: new Date().toISOString() },
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'AL ARAB ERP Client',
      },
    });

    sendSuccess(res, null, `Password for operator '${user.username}' reset successfully`);
  } catch (err) {
    next(err);
  }
};
