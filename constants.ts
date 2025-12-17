import { Product, Category } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    sku: 'SF-001',
    name: '无线降噪耳机 (Pro版)',
    store: 'Amazon US',
    category: Category.ELECTRONICS,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150&h=150&fit=crop',
    availableStock: 120,
    inTransitStock: 50,
    plannedShipment: 0,
    salesLast7Days: 85,
  },
  {
    id: '2',
    sku: 'SF-002',
    name: '人体工学办公椅',
    store: 'Shopify 独立站',
    category: Category.HOME,
    image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=150&h=150&fit=crop',
    availableStock: 45,
    inTransitStock: 0,
    plannedShipment: 0,
    salesLast7Days: 20, 
  },
  {
    id: '3',
    sku: 'SF-003',
    name: '纯棉圆领T恤',
    store: 'Amazon US',
    category: Category.APPAREL,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=150&h=150&fit=crop',
    availableStock: 1500,
    inTransitStock: 200,
    plannedShipment: 500,
    salesLast7Days: 140,
  }
];