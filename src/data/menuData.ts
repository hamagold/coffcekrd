import { Category, MenuItem } from '@/types';

export const robotCategories: Category[] = [
  { id: 'hot', icon: '🔥', name: { ku: 'گەرم', ar: 'ساخن', en: 'Hot' } },
  { id: 'cold', icon: '❄️', name: { ku: 'سارد', ar: 'بارد', en: 'Cold' } },
  { id: 'shake', icon: '🧋', name: { ku: 'شێک', ar: 'شيك', en: 'Shake' } },
  { id: 'juice', icon: '🍹', name: { ku: 'ئاو میوە', ar: 'عصير', en: 'Juice' } },
];

export const staffCategories: Category[] = [
  { id: 'sandwich', icon: '🌯', name: { ku: 'ساندویچ', ar: 'ساندويتش', en: 'Sandwiches' } },
  { id: 'food', icon: '🍖', name: { ku: 'خواردن', ar: 'طعام', en: 'Food' } },
  { id: 'dessert', icon: '🧁', name: { ku: 'شیرینی', ar: 'حلويات', en: 'Desserts' } },
  { id: 'salad', icon: '🥬', name: { ku: 'سەلاتە', ar: 'سلطة', en: 'Salads' } },
];

export const defaultRobotItems: MenuItem[] = [
  { id: 'r1', cat: 'hot', emoji: '☕', name: { ku: 'قاوەی ئەسپرێسۆ', ar: 'اسبريسو', en: 'Espresso' }, desc: { ku: 'قاوەی بەهێز', ar: 'قهوة قوية', en: 'Strong coffee' }, price: 2500 },
  { id: 'r2', cat: 'hot', emoji: '🍵', name: { ku: 'لاتێ', ar: 'لاتيه', en: 'Latte' }, desc: { ku: 'قاوە و شیر', ar: 'قهوة وحليب', en: 'Coffee with milk' }, price: 3500 },
  { id: 'r3', cat: 'hot', emoji: '☕', name: { ku: 'کاپۆچینۆ', ar: 'كابوتشينو', en: 'Cappuccino' }, desc: { ku: 'فۆمی شیر', ar: 'رغوة الحليب', en: 'Milk foam' }, price: 3500 },
  { id: 'r4', cat: 'hot', emoji: '🫖', name: { ku: 'چای', ar: 'شاي', en: 'Tea' }, desc: { ku: 'چای گەرم', ar: 'شاي ساخن', en: 'Hot tea' }, price: 1500 },
  { id: 'r5', cat: 'hot', emoji: '🍫', name: { ku: 'شکلاتەی گەرم', ar: 'شوكولاتة ساخنة', en: 'Hot Chocolate' }, desc: { ku: 'شکلاتەی خۆشیت', ar: 'شوكولاتة حلوة', en: 'Sweet chocolate' }, price: 3000 },
  { id: 'r6', cat: 'cold', emoji: '🧊', name: { ku: 'قاوەی سارد', ar: 'قهوة باردة', en: 'Iced Coffee' }, desc: { ku: 'قاوەی سارد', ar: 'قهوة مثلجة', en: 'Cold coffee' }, price: 4000 },
  { id: 'r7', cat: 'cold', emoji: '🥛', name: { ku: 'شیری سارد', ar: 'حليب بارد', en: 'Cold Milk' }, desc: { ku: 'شیری فریش', ar: 'حليب طازج', en: 'Fresh milk' }, price: 2000 },
  { id: 'r8', cat: 'shake', emoji: '🍓', name: { ku: 'شێکی توو فەرەنگی', ar: 'شيك فراولة', en: 'Strawberry Shake' }, desc: { ku: 'توو فەرەنگی و شیر', ar: 'فراولة وحليب', en: 'Strawberry & milk' }, price: 5000 },
  { id: 'r9', cat: 'shake', emoji: '🍌', name: { ku: 'شێکی مۆز', ar: 'شيك موز', en: 'Banana Shake' }, desc: { ku: 'مۆز و شیر', ar: 'موز وحليب', en: 'Banana & milk' }, price: 4500 },
  { id: 'r10', cat: 'shake', emoji: '🍫', name: { ku: 'شێکی شکلاتە', ar: 'شيك شوكولاتة', en: 'Chocolate Shake' }, desc: { ku: 'شکلاتە و شیر', ar: 'شوكولاتة وحليب', en: 'Chocolate & milk' }, price: 5000 },
  { id: 'r11', cat: 'juice', emoji: '🍊', name: { ku: 'ئاوی مزر', ar: 'عصير برتقال', en: 'Orange Juice' }, desc: { ku: 'فریش', ar: 'طازج', en: 'Fresh squeezed' }, price: 3000 },
  { id: 'r12', cat: 'juice', emoji: '🍋', name: { ku: 'لیمۆناتا', ar: 'ليمونادا', en: 'Lemonade' }, desc: { ku: 'لیمۆ و شەکر', ar: 'ليمون وسكر', en: 'Lemon & sugar' }, price: 2500 },
];

export const defaultStaffItems: MenuItem[] = [
  { id: 's1', cat: 'sandwich', emoji: '🥪', name: { ku: 'ساندویچی مریشک', ar: 'ساندويتش دجاج', en: 'Chicken Sandwich' }, desc: { ku: 'مریشکی برژێوی', ar: 'دجاج مشوي', en: 'Grilled chicken' }, price: 8000 },
  { id: 's2', cat: 'sandwich', emoji: '🥙', name: { ku: 'شاورمە', ar: 'شاورما', en: 'Shawarma' }, desc: { ku: 'گۆشتی خۆش', ar: 'لحم لذيذ', en: 'Delicious meat' }, price: 7000 },
  { id: 's3', cat: 'sandwich', emoji: '🍔', name: { ku: 'بەرگەر', ar: 'برجر', en: 'Burger' }, desc: { ku: 'گۆشتی گاو', ar: 'لحم بقر', en: 'Beef burger' }, price: 10000 },
  { id: 's4', cat: 'food', emoji: '🍳', name: { ku: 'هاو و پێنیر', ar: 'بيض وجبن', en: 'Eggs & Cheese' }, desc: { ku: 'تەخمی بامیاو', ar: 'بيض مقلي', en: 'Fried eggs' }, price: 5000 },
  { id: 's5', cat: 'food', emoji: '🥘', name: { ku: 'برنجی قابلی', ar: 'أرز قابلي', en: 'Qabli Rice' }, desc: { ku: 'برنجی تایبەت', ar: 'أرز مميز', en: 'Special rice' }, price: 12000 },
  { id: 's6', cat: 'food', emoji: '🍗', name: { ku: 'مریشکی سەرخستوو', ar: 'دجاج مشوي', en: 'Grilled Chicken' }, desc: { ku: 'مریشکی تەواو', ar: 'دجاج كامل', en: 'Full chicken' }, price: 15000 },
  { id: 's7', cat: 'dessert', emoji: '🍰', name: { ku: 'کێک', ar: 'كيك', en: 'Cake' }, desc: { ku: 'کێکی شیرین', ar: 'كيك حلو', en: 'Sweet cake' }, price: 4000 },
  { id: 's8', cat: 'dessert', emoji: '🍮', name: { ku: 'کرێم کارامیل', ar: 'كريم كراميل', en: 'Creme Caramel' }, desc: { ku: 'شیرینی گرم', ar: 'حلوى لذيذة', en: 'Delicious dessert' }, price: 3500 },
  { id: 's9', cat: 'dessert', emoji: '🍩', name: { ku: 'دونات', ar: 'دونات', en: 'Donut' }, desc: { ku: 'دونات تازە', ar: 'دونات طازج', en: 'Fresh donut' }, price: 3000 },
  { id: 's10', cat: 'salad', emoji: '🥗', name: { ku: 'سەلاتەی سەوزە', ar: 'سلطة خضراء', en: 'Green Salad' }, desc: { ku: 'سەوزەی فریش', ar: 'خضار طازج', en: 'Fresh vegetables' }, price: 4000 },
  { id: 's11', cat: 'salad', emoji: '🥑', name: { ku: 'سەلاتەی ئاڤوکادۆ', ar: 'سلطة أفوكادو', en: 'Avocado Salad' }, desc: { ku: 'ئاڤوکادۆ و لیمۆ', ar: 'أفوكادو وليمون', en: 'Avocado & lemon' }, price: 5500 },
];
