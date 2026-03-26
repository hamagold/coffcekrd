export type Language = 'ku' | 'ar' | 'en';
export type Direction = 'rtl' | 'ltr';
export type MenuType = 'robot' | 'staff';
export type PaymentMethod = 'cash' | 'plc' | 'fib' | 'zain' | 'fastpay';
export type OrderType = 'dine' | 'delivery';
export type UserRole = 'super' | 'staff';

export interface MultiLangText {
  ku: string;
  ar: string;
  en: string;
}

export interface PLCParams {
  sugar: number;      // 0=none, 1=little, 2=medium, 3=full → VW1224
  size: number;       // 1=small, 2=medium, 3=large → VW1226
  milk: number;       // 0=none, 1=regular, 2=oat, 3=almond → VW1228
  recipe: number;     // 1=normal, 2=strong, 3=light → VW1230
  waterLevel: number; // 1=little, 2=medium, 3=full → VW1232
  param6?: number;    // → VW1234
}

export interface MenuItem {
  id: string;
  cat: string;
  emoji: string;
  name: MultiLangText;
  desc: MultiLangText;
  price: number;
  image?: string;
  plc_code?: number;
  out_of_stock?: boolean;
}

export interface Category {
  id: string;
  icon: string;
  image?: string;
  name: MultiLangText;
}

export interface CartItem extends MenuItem {
  qty: number;
  plcParams?: PLCParams;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  payment: PaymentMethod;
  type: OrderType;
  time: string;
  lang: Language;
  status: 'pending' | 'preparing' | 'done';
}

export interface Expense {
  id: string;
  type: 'electricity' | 'water' | 'salary' | 'supplies' | 'other';
  desc: string;
  amount: number;
  date: string;
}

export interface AppUser {
  username: string;
  name: string;
  role: UserRole;
  password: string;
}

export interface PaymentProvider {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  apiKey?: string;
  merchantId?: string;
}
