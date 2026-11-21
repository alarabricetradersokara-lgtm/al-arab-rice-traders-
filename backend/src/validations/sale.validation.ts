import { z } from 'zod';
import { PaymentType } from '@prisma/client';

export const createSaleSchema = z.object({
  body: z.object({
    customerId: z.string().uuid().optional(), // Optional for counter walk-in POS
    warehouseId: z.string().uuid(),
    saleDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).default(() => new Date().toISOString()),
    paymentType: z.nativeEnum(PaymentType),
    items: z.array(
      z.object({
        productId: z.string().uuid(),
        bagCount: z.number().int().nonnegative().default(0),
        bagWeightKg: z.number().positive().default(50.0),
        netWeightKg: z.number().positive(),
        unitPricePerKg: z.number().positive(),
        unitPricePerBag: z.number().positive().optional(),
      })
    ).min(1, 'At least one sale item is required'),
    discountAmount: z.number().nonnegative().default(0),
    taxAmount: z.number().nonnegative().default(0),
    freightAmount: z.number().nonnegative().default(0),
    paidAmount: z.number().nonnegative().default(0),
    cashAccountId: z.string().uuid().optional(),
    bankAccountId: z.string().uuid().optional(),
    truckNumber: z.string().optional(),
    gatePassNumber: z.string().optional(),
    notes: z.string().optional(),
  }),
});
