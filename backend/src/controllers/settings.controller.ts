import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/AppError';

export const getCompanySettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let settings = await prisma.companySettings.findFirst();
    if (!settings) {
      settings = await prisma.companySettings.create({
        data: {
          companyName: 'العرب رائز ٹریڈرز (AL ARAB RICE TRADERS)',
          businessType: 'Rice Traders & Commission Agents',
          address: 'مرکزی دکان و گودام، اناج مارکیٹ، مانسہرہ | ہیڈ آفس: اوکاڑہ',
          phone: '+92-300-1234567',
          email: 'info@alarabricetraders.com',
          taxNumber: '1849204-7',
          currency: 'PKR',
        },
      });
    }
    sendSuccess(res, settings, 'Company settings retrieved');
  } catch (err) {
    next(err);
  }
};

export const updateCompanySettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await prisma.companySettings.findFirst();
    if (!existing) {
      throw new AppError('Settings record not found', 404);
    }

    const updated = await prisma.companySettings.update({
      where: { id: existing.id },
      data: req.body,
    });

    sendSuccess(res, updated, 'Company settings updated successfully');
  } catch (err) {
    next(err);
  }
};
