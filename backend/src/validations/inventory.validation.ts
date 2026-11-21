import { z } from 'zod';
import { GrainVariety, GrainGrade } from '@prisma/client';

export const createProductSchema = z.object({
  body: z.object({
    code: z.string().min(2).max(50),
    name: z.string().min(2).max(150),
    categoryId: z.string().uuid(),
    variety: z.nativeEnum(GrainVariety),
    grade: z.nativeEnum(GrainGrade).default(GrainGrade.RAW_WHITE),
    baseUnit: z.string().default('KG'),
    defaultBagWeightKg: z.number().positive().default(50.0),
    supportsMaund: z.boolean().default(true),
    maundWeightKg: z.number().positive().default(40.0),
    costPricePerKg: z.number().nonnegative().default(0),
    salePricePerKg: z.number().nonnegative().default(0),
    reorderLevelKg: z.number().nonnegative().default(1000.0),
  }),
});

export const stockAdjustmentSchema = z.object({
  body: z.object({
    warehouseId: z.string().uuid(),
    productId: z.string().uuid(),
    actualBags: z.number().int().nonnegative(),
    actualWeightKg: z.number().positive(),
    reason: z.string().min(3).max(255),
  }),
});
