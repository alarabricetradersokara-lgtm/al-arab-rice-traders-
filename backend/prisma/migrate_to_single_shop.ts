import dotenv from 'dotenv';
dotenv.config();
import prisma from '../src/config/prisma';

async function main() {
  console.log('--- Migrating to Single Mansehra Shop Location ---');
  const warehouses = await prisma.warehouse.findMany();
  console.log('Current warehouses in DB:', warehouses.map(w => ({ id: w.id, code: w.code, name: w.name })));

  // 1. Find or create the single master warehouse
  let mansehraShop = warehouses.find(w => w.code === 'MANSEHRA-01' || w.name.includes('مانسہرہ'));
  
  if (!mansehraShop) {
    const firstWh = warehouses[0];
    if (firstWh) {
      mansehraShop = await prisma.warehouse.update({
        where: { id: firstWh.id },
        data: {
          code: 'MANSEHRA-01',
          name: 'مرکزی دکان - مانسہرہ (Main Shop - Mansehra)',
          location: 'مرکزی دکان مانسہرہ (Main Shop, Mansehra)',
          capacityBags: 50000,
          capacityKg: 2500000,
          isActive: true,
        },
      });
      console.log('Updated existing warehouse to Mansehra Shop:', mansehraShop.name);
    } else {
      mansehraShop = await prisma.warehouse.create({
        data: {
          code: 'MANSEHRA-01',
          name: 'مرکزی دکان - مانسہرہ (Main Shop - Mansehra)',
          location: 'مرکزی دکان مانسہرہ (Main Shop, Mansehra)',
          capacityBags: 50000,
          capacityKg: 2500000,
          isActive: true,
        },
      });
      console.log('Created new Mansehra Shop warehouse:', mansehraShop.name);
    }
  } else {
    mansehraShop = await prisma.warehouse.update({
      where: { id: mansehraShop.id },
      data: {
        code: 'MANSEHRA-01',
        name: 'مرکزی دکان - مانسہرہ (Main Shop - Mansehra)',
        location: 'مرکزی دکان مانسہرہ (Main Shop, Mansehra)',
        capacityBags: 50000,
        capacityKg: 2500000,
        isActive: true,
      },
    });
    console.log('Ensured Mansehra Shop properties:', mansehraShop.name);
  }

  const targetWhId = mansehraShop.id;
  const otherWhs = warehouses.filter(w => w.id !== targetWhId);

  // 2. Re-assign all dependent records from other warehouses to targetWhId
  for (const other of otherWhs) {
    console.log(`Migrating data from warehouse ${other.name} (${other.id}) to ${mansehraShop.name}...`);
    
    // Purchases
    await prisma.purchase.updateMany({
      where: { warehouseId: other.id },
      data: { warehouseId: targetWhId },
    });

    // Daily Sales Entries
    await prisma.dailySalesEntry.updateMany({
      where: { warehouseId: other.id },
      data: { warehouseId: targetWhId },
    });

    // Sales (Counter Sales)
    await prisma.sale.updateMany({
      where: { warehouseId: other.id },
      data: { warehouseId: targetWhId },
    });

    // Stock Movements
    await prisma.stockMovement.updateMany({
      where: { warehouseId: other.id },
      data: { warehouseId: targetWhId },
    });

    // Production Batches
    await prisma.productionBatch.updateMany({
      where: { warehouseId: other.id },
      data: { warehouseId: targetWhId },
    });

    // Warehouse Transfers - delete any transfers referencing this warehouse
    await prisma.warehouseTransferItem.deleteMany({
      where: {
        transfer: {
          OR: [
            { fromWarehouseId: other.id },
            { toWarehouseId: other.id },
          ],
        },
      },
    });
    await prisma.warehouseTransfer.deleteMany({
      where: {
        OR: [
          { fromWarehouseId: other.id },
          { toWarehouseId: other.id },
        ],
      },
    });

    // Consolidate Stocks
    const otherStocks = await prisma.stock.findMany({ where: { warehouseId: other.id } });
    for (const os of otherStocks) {
      const existing = await prisma.stock.findUnique({
        where: { warehouseId_productId: { warehouseId: targetWhId, productId: os.productId } },
      });
      if (existing) {
        await prisma.stock.update({
          where: { id: existing.id },
          data: {
            currentBags: existing.currentBags + os.currentBags,
            currentWeightKg: existing.currentWeightKg.add(os.currentWeightKg),
            availableBags: existing.availableBags + os.availableBags,
            availableWeightKg: existing.availableWeightKg.add(os.availableWeightKg),
          },
        });
      } else {
        await prisma.stock.create({
          data: {
            warehouseId: targetWhId,
            productId: os.productId,
            currentBags: os.currentBags,
            currentWeightKg: os.currentWeightKg,
            availableBags: os.availableBags,
            availableWeightKg: os.availableWeightKg,
            lastMovementDate: os.lastMovementDate,
          },
        });
      }
    }

    // Delete other warehouse stocks
    await prisma.stock.deleteMany({ where: { warehouseId: other.id } });

    // Now delete the extra warehouse
    try {
      await prisma.warehouse.delete({ where: { id: other.id } });
      console.log(`Successfully deleted warehouse ${other.code} (${other.name})`);
    } catch (err: any) {
      console.warn(`Could not delete warehouse ${other.code}, marking inactive:`, err.message);
      await prisma.warehouse.update({
        where: { id: other.id },
        data: { isActive: false },
      });
    }
  }

  // 3. Update company settings to disable multi-warehouse and set address
  await prisma.companySettings.updateMany({
    data: {
      companyName: 'العرب رائس ٹریڈرز (AL ARAB RICE TRADERS)',
      address: 'مرکزی دکان و گودام، اناج مارکیٹ، مانسہرہ (Main Shop, Mansehra) | دفتر: اوکاڑہ (Okara)',
      enableMultiWarehouse: false,
      enableMilling: false,
    },
  });

  const finalWhs = await prisma.warehouse.findMany({ where: { isActive: true } });
  console.log('✅ Final Active Warehouses (must be 1 single shop):', finalWhs);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
