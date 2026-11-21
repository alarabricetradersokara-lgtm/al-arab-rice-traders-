export type GrainVariety =
  | 'SUPER_KERNEL_BASMATI'
  | 'BASMATI_1121_KAINAT'
  | 'BASMATI_385'
  | 'IRRI_6'
  | 'IRRI_9'
  | 'PK_386'
  | 'RAW_PADDY_DHAN'
  | 'BROKEN_RICE_TOTA'
  | 'RICE_BRAN_PHAK'
  | 'RICE_HUSK_BHOOSA';

export type GrainGrade =
  | 'RAW_WHITE'
  | 'STEAM'
  | 'SELLA_PARBOILED'
  | 'BROWN'
  | 'SECOND_GRADE'
  | 'COMMERCIAL';

export type StockMovementType =
  | 'OPENING_STOCK'
  | 'PURCHASE'
  | 'PURCHASE_RETURN'
  | 'SALE'
  | 'SALE_RETURN'
  | 'PRODUCTION_INPUT'
  | 'PRODUCTION_OUTPUT'
  | 'ADJUSTMENT'
  | 'WASTAGE';

export interface RiceCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  location?: string;
  capacityBags?: number;
  capacityKg?: string;
  isActive: boolean;
}

export interface RiceProduct {
  id: string;
  code: string;
  name: string;
  variety: GrainVariety;
  grade: GrainGrade;
  baseUnit: string;
  defaultBagWeightKg: string | number;
  supportsMaund: boolean;
  maundWeightKg: string | number;
  costPricePerKg: string | number;
  salePricePerKg: string | number;
  reorderLevelKg: string | number;
  category: {
    id: string;
    name: string;
    code: string;
  };
  totalBags: number;
  totalWeightKg: string;
  totalMaunds: string;
  isLowStock: boolean;
  isOutOfStock: boolean;
  stocks?: {
    warehouseId: string;
    warehouseName: string;
    currentBags: number;
    currentWeightKg: string | number;
    availableBags: number;
    availableWeightKg: string | number;
  }[];
}

export interface StockRecord {
  id: string;
  warehouse: {
    id: string;
    name: string;
    code: string;
  };
  product: {
    id: string;
    name: string;
    code: string;
    variety: GrainVariety;
    grade: GrainGrade;
    category: string;
    defaultBagWeightKg: string | number;
    costPricePerKg: string | number;
    salePricePerKg: string | number;
    reorderLevelKg: string | number;
  };
  currentBags: number;
  currentWeightKg: string | number;
  availableBags: number;
  availableWeightKg: string | number;
  maunds: string;
  valuationAmount: string;
  isLowStock: boolean;
  isOutOfStock: boolean;
  lastMovementDate?: string;
}

export interface StockOverviewSummary {
  totalBags: number;
  totalWeightKg: string;
  totalMaunds: string;
  totalMetricTons: string;
  totalValuation: string;
  totalVarieties: number;
  lowStockCount: number;
}

export interface StockMovement {
  id: string;
  movementNumber: string;
  movementType: StockMovementType;
  warehouseId: string;
  warehouse: Warehouse;
  productId: string;
  product: RiceProduct;
  bagCountDelta: number;
  weightKgDelta: string;
  unitCostPerKg: string;
  totalCost: string;
  referenceType: string;
  referenceId: string;
  notes?: string;
  createdAt: string;
}

export interface StockAlert {
  productId: string;
  productName: string;
  variety: GrainVariety;
  warehouseName: string;
  currentBags: number;
  currentWeightKg: string | number;
  reorderLevelKg: string | number;
  deficitKg?: string;
}
