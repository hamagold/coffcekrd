export type Language = 'ku' | 'ar' | 'en';
export type Direction = 'rtl' | 'ltr';
export type MenuType = 'robot' | 'staff';
export type PaymentMethod = 'cash' | 'fib' | 'zain' | 'fastpay';
export type OrderType = 'dine' | 'delivery';
export type UserRole = 'super' | 'staff';

export interface MultiLangText {
  ku: string;
  ar: string;
  en: string;
}

export interface MenuItem {
  id: string;
  cat: string;
  emoji: string;
  name: MultiLangText;
  desc: MultiLangText;
  price: number;
  image?: string;
}

export interface Category {
  id: string;
  icon: string;
  name: MultiLangText;
}

export interface CartItem extends MenuItem {
  qty: number;
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
