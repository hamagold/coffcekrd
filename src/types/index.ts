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
  ice: number;        // 0=no ice, 1=less, 2=normal, 3=more → VW1224
  sugar: number;      // 0=none, 1=less, 2=normal, 3=more → VW1232
  sugarType: number;  // 1-50 coffee syrups → VW1228
  cupType: number;    // 1=coffee 8oz, 5=coffee 16oz, 51=tea 12oz, 52=tea 16oz → VW1230
  topping: number;    // 0=none, 51=boba, 52=strawberry, 53=orange, 54=lychee → VW1234
  latteArt: number;   // 0=none, 1-3=patterns → VW1226
  param6?: number;
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
  has_params?: boolean;
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
