import { z } from 'zod';
import { PaymentType } from '@prisma/client';

export const createPurchaseSchema = z.object({
  body: z.object({
    supplierId: z.string().uuid(),
    warehouseId: z.string().uuid(),
    purchaseDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
    paymentType: z.nativeEnum(PaymentType),
    truckNumber: z.string().optional(),
    biltyNumber: z.string().optional(),
    items: z.array(
      z.object({
        productId: z.string().uuid(),
        bagCount: z.number().int().positive(),
        bagWeightKg: z.number().positive().default(50.0),
        grossWeightKg: z.number().positive(),
        bardanaTareKg: z.number().nonnegative().default(0),
        netWeightKg: z.number().positive(),
        unitPricePerKg: z.number().positive(),
      })
    ).min(1, 'At least one purchase item is required'),
    moistureDeductionWeightKg: z.number().nonnegative().default(0),
    moistureDeductionAmount: z.number().nonnegative().default(0),
    kardaDeductionAmount: z.number().nonnegative().default(0),
    commissionRatePercent: z.number().nonnegative().default(0),
    palledariAmount: z.number().nonnegative().default(0),
    freightAmount: z.number().nonnegative().default(0),
    paidAmount: z.number().nonnegative().default(0),
    cashAccountId: z.string().uuid().optional(),
    bankAccountId: z.string().uuid().optional(),
    notes: z.string().optional(),
  }),
});
