import { Category, MenuItem } from '@/types';

export const robotCategories: Category[] = [
  { id: 'hot', icon: '🔥', name: { ku: 'گەرم', ar: 'ساخن', en: 'Hot' } },
  { id: 'cold', icon: '❄️', name: { ku: 'سارد', ar: 'بارد', en: 'Cold' } },
  { id: 'shake', icon: '🧋', name: { ku: 'شێک', ar: 'شيك', en: 'Shake' } },
  { id: 'juice', icon: '🍹', name: { ku: 'ئاو میوە', ar: 'عصير', en: 'Juice' } },
  { id: 'icecream', icon: '🍦', name: { ku: 'ئایسکریم', ar: 'آيسكريم', en: 'Ice Cream' } },
];

export const staffCategories: Category[] = [
  { id: 'sandwich', icon: '🌯', name: { ku: 'ساندویچ', ar: 'ساندويتش', en: 'Sandwiches' } },
  { id: 'dessert', icon: '🧁', name: { ku: 'شیرینی', ar: 'حلويات', en: 'Desserts' } },
  { id: 'salad', icon: '🥬', name: { ku: 'سەلاتە', ar: 'سلطة', en: 'Salads' } },
];

export const defaultRobotItems: MenuItem[] = [
  // Hot → Coffee
  { id: 'r1', cat: 'hot', subCat: 'coffee', emoji: '☕', name: { ku: 'قاوەی ئەسپرێسۆ', ar: 'اسبريسو', en: 'Espresso' }, desc: { ku: 'قاوەی بەهێز', ar: 'قهوة قوية', en: 'Strong coffee' }, price: 2500 },
  { id: 'r2', cat: 'hot', subCat: 'coffee', emoji: '🍵', name: { ku: 'لاتێ', ar: 'لاتيه', en: 'Latte' }, desc: { ku: 'قاوە و شیر', ar: 'قهوة وحليب', en: 'Coffee with milk' }, price: 3500 },
  { id: 'r3', cat: 'hot', subCat: 'coffee', emoji: '☕', name: { ku: 'کاپۆچینۆ', ar: 'كابوتشينو', en: 'Cappuccino' }, desc: { ku: 'فۆمی شیر', ar: 'رغوة الحليب', en: 'Milk foam' }, price: 3500 },
  { id: 'r13', cat: 'hot', subCat: 'coffee', emoji: '☕', name: { ku: 'ئەمریکانۆ', ar: 'أمريكانو', en: 'Americano' }, desc: { ku: 'قاوەی سادە', ar: 'قهوة سادة', en: 'Black coffee' }, price: 3000 },
  { id: 'r14', cat: 'hot', subCat: 'coffee', emoji: '☕', name: { ku: 'ماکیاتۆ', ar: 'ماكياتو', en: 'Macchiato' }, desc: { ku: 'قاوە و فۆم', ar: 'قهوة ورغوة', en: 'Coffee & foam' }, price: 3500 },
  // Hot → Tea
  { id: 'r4', cat: 'hot', subCat: 'tea', emoji: '🫖', name: { ku: 'چای', ar: 'شاي', en: 'Tea' }, desc: { ku: 'چای گەرم', ar: 'شاي ساخن', en: 'Hot tea' }, price: 1500 },
  { id: 'r15', cat: 'hot', subCat: 'tea', emoji: '🍵', name: { ku: 'چای سەوز', ar: 'شاي أخضر', en: 'Green Tea' }, desc: { ku: 'چای سەوزی سروشتی', ar: 'شاي أخضر طبيعي', en: 'Natural green tea' }, price: 2000 },
  { id: 'r16', cat: 'hot', subCat: 'tea', emoji: '🫖', name: { ku: 'چای دارچین', ar: 'شاي قرفة', en: 'Cinnamon Tea' }, desc: { ku: 'چای بە دارچین', ar: 'شاي بالقرفة', en: 'Tea with cinnamon' }, price: 2000 },
  // Hot → Chocolate
  { id: 'r5', cat: 'hot', subCat: 'chocolate', emoji: '🍫', name: { ku: 'شکلاتەی گەرم', ar: 'شوكولاتة ساخنة', en: 'Hot Chocolate' }, desc: { ku: 'شکلاتەی خۆشیت', ar: 'شوكولاتة حلوة', en: 'Sweet chocolate' }, price: 3000 },
  { id: 'r17', cat: 'hot', subCat: 'chocolate', emoji: '🍫', name: { ku: 'مۆکا', ar: 'موكا', en: 'Mocha' }, desc: { ku: 'قاوە و شکلاتە', ar: 'قهوة وشوكولاتة', en: 'Coffee & chocolate' }, price: 4000 },
  // Cold
  { id: 'r6', cat: 'cold', emoji: '🧊', name: { ku: 'قاوەی سارد', ar: 'قهوة باردة', en: 'Iced Coffee' }, desc: { ku: 'قاوەی سارد', ar: 'قهوة مثلجة', en: 'Cold coffee' }, price: 4000 },
  { id: 'r7', cat: 'cold', emoji: '🥛', name: { ku: 'شیری سارد', ar: 'حليب بارد', en: 'Cold Milk' }, desc: { ku: 'شیری فریش', ar: 'حليب طازج', en: 'Fresh milk' }, price: 2000 },
  // Shake → Fruit
  { id: 'r8', cat: 'shake', subCat: 'fruit', emoji: '🍓', name: { ku: 'شێکی توو فەرەنگی', ar: 'شيك فراولة', en: 'Strawberry Shake' }, desc: { ku: 'توو فەرەنگی و شیر', ar: 'فراولة وحليب', en: 'Strawberry & milk' }, price: 5000 },
  { id: 'r9', cat: 'shake', subCat: 'fruit', emoji: '🍌', name: { ku: 'شێکی مۆز', ar: 'شيك موز', en: 'Banana Shake' }, desc: { ku: 'مۆز و شیر', ar: 'موز وحليب', en: 'Banana & milk' }, price: 4500 },
  { id: 'r18', cat: 'shake', subCat: 'fruit', emoji: '🥭', name: { ku: 'شێکی مانگۆ', ar: 'شيك مانجو', en: 'Mango Shake' }, desc: { ku: 'مانگۆ و شیر', ar: 'مانجو وحليب', en: 'Mango & milk' }, price: 5500 },
  // Shake → Cream
  { id: 'r10', cat: 'shake', subCat: 'cream', emoji: '🍫', name: { ku: 'شێکی شکلاتە', ar: 'شيك شوكولاتة', en: 'Chocolate Shake' }, desc: { ku: 'شکلاتە و شیر', ar: 'شوكولاتة وحليب', en: 'Chocolate & milk' }, price: 5000 },
  { id: 'r19', cat: 'shake', subCat: 'cream', emoji: '🍦', name: { ku: 'شێکی ڤانیلا', ar: 'شيك فانيلا', en: 'Vanilla Shake' }, desc: { ku: 'ڤانیلا و ئایسکریم', ar: 'فانيلا وآيسكريم', en: 'Vanilla & ice cream' }, price: 5000 },
  { id: 'r20', cat: 'shake', subCat: 'cream', emoji: '🍪', name: { ku: 'شێکی ئۆریۆ', ar: 'شيك أوريو', en: 'Oreo Shake' }, desc: { ku: 'ئۆریۆ و شیر', ar: 'أوريو وحليب', en: 'Oreo & milk' }, price: 5500 },
  // Juice
  { id: 'r11', cat: 'juice', emoji: '🍊', name: { ku: 'ئاوی مزر', ar: 'عصير برتقال', en: 'Orange Juice' }, desc: { ku: 'فریش', ar: 'طازج', en: 'Fresh squeezed' }, price: 3000 },
  { id: 'r12', cat: 'juice', emoji: '🍋', name: { ku: 'لیمۆناتا', ar: 'ليمونادا', en: 'Lemonade' }, desc: { ku: 'لیمۆ و شەکر', ar: 'ليمون وسكر', en: 'Lemon & sugar' }, price: 2500 },
  // Ice Cream
  { id: 'r21', cat: 'icecream', emoji: '🍦', name: { ku: 'ئایسکریمی ڤانیلا', ar: 'آيسكريم فانيلا', en: 'Vanilla Ice Cream' }, desc: { ku: 'ڤانیلای کلاسیک', ar: 'فانيلا كلاسيك', en: 'Classic vanilla' }, price: 3000 },
  { id: 'r22', cat: 'icecream', emoji: '🍫', name: { ku: 'ئایسکریمی شکلاتە', ar: 'آيسكريم شوكولاتة', en: 'Chocolate Ice Cream' }, desc: { ku: 'شکلاتەی تایبەت', ar: 'شوكولاتة مميزة', en: 'Rich chocolate' }, price: 3000 },
  { id: 'r23', cat: 'icecream', emoji: '🍓', name: { ku: 'ئایسکریمی توو فەرەنگی', ar: 'آيسكريم فراولة', en: 'Strawberry Ice Cream' }, desc: { ku: 'توو فەرەنگی', ar: 'فراولة', en: 'Strawberry' }, price: 3000 },
  { id: 'r24', cat: 'icecream', emoji: '🥭', name: { ku: 'ئایسکریمی مانگۆ', ar: 'آيسكريم مانجو', en: 'Mango Ice Cream' }, desc: { ku: 'مانگۆی فریش', ar: 'مانجو طازج', en: 'Fresh mango' }, price: 3500 },
  { id: 'r25', cat: 'icecream', emoji: '🍪', name: { ku: 'ئایسکریمی ئۆریۆ', ar: 'آيسكريم أوريو', en: 'Oreo Ice Cream' }, desc: { ku: 'ئۆریۆ و کریم', ar: 'أوريو وكريم', en: 'Oreo & cream' }, price: 3500 },
];

export const defaultStaffItems: MenuItem[] = [
  // Sandwich → Chicken
  { id: 's1', cat: 'sandwich', subCat: 'chicken', emoji: '🥪', name: { ku: 'ساندویچی مریشک', ar: 'ساندويتش دجاج', en: 'Chicken Sandwich' }, desc: { ku: 'مریشکی برژێوی', ar: 'دجاج مشوي', en: 'Grilled chicken' }, price: 8000 },
  { id: 's2', cat: 'sandwich', subCat: 'chicken', emoji: '🥙', name: { ku: 'شاورمە', ar: 'شاورما', en: 'Shawarma' }, desc: { ku: 'گۆشتی خۆش', ar: 'لحم لذيذ', en: 'Delicious meat' }, price: 7000 },
  { id: 's12', cat: 'sandwich', subCat: 'chicken', emoji: '🌮', name: { ku: 'تاکۆی مریشک', ar: 'تاكو دجاج', en: 'Chicken Taco' }, desc: { ku: 'تاکۆ بە مریشک', ar: 'تاكو بالدجاج', en: 'Taco with chicken' }, price: 6000 },
  // Sandwich → Beef
  { id: 's3', cat: 'sandwich', subCat: 'beef', emoji: '🍔', name: { ku: 'بەرگەر', ar: 'برجر', en: 'Burger' }, desc: { ku: 'گۆشتی گاو', ar: 'لحم بقر', en: 'Beef burger' }, price: 10000 },
  { id: 's13', cat: 'sandwich', subCat: 'beef', emoji: '🍔', name: { ku: 'دووبل بەرگەر', ar: 'دبل برجر', en: 'Double Burger' }, desc: { ku: 'دوو پارچە گۆشت', ar: 'قطعتين لحم', en: 'Double patty' }, price: 14000 },
  { id: 's14', cat: 'sandwich', subCat: 'beef', emoji: '🌯', name: { ku: 'ڕاپی گۆشت', ar: 'راب لحم', en: 'Beef Wrap' }, desc: { ku: 'گۆشت و سەوزە', ar: 'لحم وخضار', en: 'Beef & veggies' }, price: 9000 },
  // Dessert → Cake
  { id: 's7', cat: 'dessert', subCat: 'cake', emoji: '🍰', name: { ku: 'کێک', ar: 'كيك', en: 'Cake' }, desc: { ku: 'کێکی شیرین', ar: 'كيك حلو', en: 'Sweet cake' }, price: 4000 },
  { id: 's15', cat: 'dessert', subCat: 'cake', emoji: '🎂', name: { ku: 'چیزکێک', ar: 'تشيز كيك', en: 'Cheesecake' }, desc: { ku: 'چیزکێکی کلاسیک', ar: 'تشيز كيك كلاسيك', en: 'Classic cheesecake' }, price: 5000 },
  // Dessert → Pastry
  { id: 's8', cat: 'dessert', subCat: 'pastry', emoji: '🍮', name: { ku: 'کرێم کارامیل', ar: 'كريم كراميل', en: 'Creme Caramel' }, desc: { ku: 'شیرینی گرم', ar: 'حلوى لذيذة', en: 'Delicious dessert' }, price: 3500 },
  { id: 's9', cat: 'dessert', subCat: 'pastry', emoji: '🍩', name: { ku: 'دونات', ar: 'دونات', en: 'Donut' }, desc: { ku: 'دونات تازە', ar: 'دونات طازج', en: 'Fresh donut' }, price: 3000 },
  { id: 's16', cat: 'dessert', subCat: 'pastry', emoji: '🥐', name: { ku: 'کرواسان', ar: 'كرواسان', en: 'Croissant' }, desc: { ku: 'کرواسانی تازە', ar: 'كرواسان طازج', en: 'Fresh croissant' }, price: 3000 },
  // Salad
  { id: 's10', cat: 'salad', emoji: '🥗', name: { ku: 'سەلاتەی سەوزە', ar: 'سلطة خضراء', en: 'Green Salad' }, desc: { ku: 'سەوزەی فریش', ar: 'خضار طازج', en: 'Fresh vegetables' }, price: 4000 },
  { id: 's11', cat: 'salad', emoji: '🥑', name: { ku: 'سەلاتەی ئاڤوکادۆ', ar: 'سلطة أفوكادو', en: 'Avocado Salad' }, desc: { ku: 'ئاڤوکادۆ و لیمۆ', ar: 'أفوكادو وليمون', en: 'Avocado & lemon' }, price: 5500 },
];
