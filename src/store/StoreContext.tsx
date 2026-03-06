import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Language, MenuType, CartItem, MenuItem, Order, PaymentMethod, OrderType, Expense, AppUser } from '@/types';
import { defaultRobotItems, defaultStaffItems } from '@/data/menuData';
import { supabase } from '@/integrations/supabase/client';

interface StoreContextType {
  // Language
  language: Language;
  setLanguage: (lang: Language) => void;
  direction: 'rtl' | 'ltr';

  // Menu
  robotItems: MenuItem[];
  staffItems: MenuItem[];
  setRobotItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  setStaffItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;

  // Cart
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (id: string) => void;
  changeQty: (id: string, delta: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartItemCount: number;

  // Orders
  orders: Order[];
  placeOrder: (payment: PaymentMethod, orderType: OrderType) => Promise<string>;
  clearOrders: () => void;

  // Expenses
  expenses: Expense[];
  addExpense: (exp: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;

  // Auth
  currentUser: AppUser | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  users: AppUser[];
  addUser: (user: AppUser) => void;
  removeUser: (username: string) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [robotItems, setRobotItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('plc_robot_items');
    return saved ? JSON.parse(saved) : defaultRobotItems;
  });
  const [staffItems, setStaffItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('plc_staff_items');
    return saved ? JSON.parse(saved) : defaultStaffItems;
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('plc_orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('plc_expenses');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem('plc_users');
    return saved ? JSON.parse(saved) : [
      { username: 'admin', name: 'Administrator', role: 'super' as const, password: 'admin123' },
      { username: 'staff', name: 'Staff Member', role: 'staff' as const, password: 'staff123' },
    ];
  });

  const direction = language === 'en' ? 'ltr' : 'rtl';

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [language, direction]);

  useEffect(() => { localStorage.setItem('plc_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('plc_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('plc_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('plc_robot_items', JSON.stringify(robotItems)); }, [robotItems]);
  useEffect(() => { localStorage.setItem('plc_staff_items', JSON.stringify(staffItems)); }, [staffItems]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const addToCart = useCallback((item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(c => c.id !== id));
  }, []);

  const changeQty = useCallback((id: string, delta: number) => {
    setCart(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, qty: c.qty + delta } : c);
      return updated.filter(c => c.qty > 0);
    });
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartItemCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const placeOrder = useCallback(async (payment: PaymentMethod, orderType: OrderType): Promise<string> => {
    const counter = parseInt(localStorage.getItem('plc_order_counter') || '0') + 1;
    localStorage.setItem('plc_order_counter', String(counter));
    const orderNum = String(counter).padStart(3, '0');

    // Insert into database
    await supabase.from('orders').insert({
      order_number: orderNum,
      items: cart as any,
      total: cart.reduce((s, i) => s + i.price * i.qty, 0),
      payment,
      order_type: orderType,
      lang: language,
      status: 'done',
      is_online: false,
    });

    // Also keep local for backward compat
    const order: Order = {
      id: orderNum,
      items: [...cart],
      total: cart.reduce((s, i) => s + i.price * i.qty, 0),
      payment,
      type: orderType,
      time: new Date().toISOString(),
      lang: language,
      status: 'done',
    };
    setOrders(prev => [...prev, order]);
    setCart([]);
    return orderNum;
  }, [cart, language]);

  const clearOrders = useCallback(() => {
    setOrders([]);
    localStorage.removeItem('plc_order_counter');
  }, []);

  const addExpense = useCallback((exp: Omit<Expense, 'id'>) => {
    setExpenses(prev => [...prev, { ...exp, id: 'exp_' + Date.now() }]);
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  const login = useCallback((username: string, password: string): boolean => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) { setCurrentUser(user); return true; }
    return false;
  }, [users]);

  const logout = useCallback(() => setCurrentUser(null), []);

  const addUser = useCallback((user: AppUser) => {
    setUsers(prev => [...prev, user]);
  }, []);

  const removeUser = useCallback((username: string) => {
    setUsers(prev => prev.filter(u => u.username !== username));
  }, []);

  return (
    <StoreContext.Provider value={{
      language, setLanguage, direction,
      robotItems, staffItems, setRobotItems, setStaffItems,
      cart, addToCart, removeFromCart, changeQty, clearCart, cartTotal, cartItemCount,
      orders, placeOrder, clearOrders,
      expenses, addExpense, deleteExpense,
      currentUser, login, logout, users, addUser, removeUser,
    }}>
      {children}
    </StoreContext.Provider>
  );
};
