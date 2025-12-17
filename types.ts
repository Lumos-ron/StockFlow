export enum Category {
  ELECTRONICS = '电子产品',
  HOME = '家居用品',
  APPAREL = '服饰鞋包',
  ACCESSORIES = '数码配件',
  TOYS = '母婴玩具'
}

export interface User {
  username: string;
  email?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  store: string; // Store Name
  category: Category;
  image?: string;
  availableStock: number;
  inTransitStock: number;
  plannedShipment: number;
  salesLast7Days: number;
  // New fields for restock planning
  customRestockQty?: number; // User overridden restock quantity
  specs?: string; // e.g. "90x120"
  qtyPerCarton?: number; // Quantity per box (Packing Rate)
}

export interface ProductCalculation {
  dailySales: number;
  totalPipelineStock: number;
  daysCoverage: number;
  monthsCoverage: number;
  restockNeededQty: number; // Calculated suggestion
  displayRestockQty: number; // The final number to show (custom or calculated)
  isLowStock: boolean;
  status: 'Critical' | 'Warning' | 'Healthy' | 'Overstocked';
}

export const LEAD_TIME_DAYS = 30; // Sea Freight
export const PRODUCTION_DAYS = 7;
export const SAFETY_STOCK_DAYS = 7;
export const TOTAL_LEAD_TIME = LEAD_TIME_DAYS + PRODUCTION_DAYS + SAFETY_STOCK_DAYS; // 44 Days
export const TARGET_COVERAGE_MONTHS = 1.5;
export const TARGET_COVERAGE_DAYS = TARGET_COVERAGE_MONTHS * 30; // 45 Days