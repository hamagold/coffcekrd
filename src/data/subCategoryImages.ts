import coffee from '@/assets/subcategories/coffee.jpg';
import tea from '@/assets/subcategories/tea.jpg';
import chocolate from '@/assets/subcategories/chocolate.jpg';
import fruit from '@/assets/subcategories/fruit.jpg';
import cream from '@/assets/subcategories/cream.jpg';
import chicken from '@/assets/subcategories/chicken.jpg';
import beef from '@/assets/subcategories/beef.jpg';
import cake from '@/assets/subcategories/cake.jpg';
import pastry from '@/assets/subcategories/pastry.jpg';
import icecream from '@/assets/subcategories/icecream.jpg';

export const subCategoryImages: Record<string, string> = {
  coffee,
  tea,
  chocolate,
  fruit,
  cream,
  chicken,
  beef,
  cake,
  pastry,
  icecream,
};

export const subCategoryNames: Record<string, { ku: string; ar: string; en: string }> = {
  coffee: { ku: 'قاوە', ar: 'قهوة', en: 'Coffee' },
  tea: { ku: 'چای', ar: 'شاي', en: 'Tea' },
  chocolate: { ku: 'شکلاتە', ar: 'شوكولاتة', en: 'Chocolate' },
  fruit: { ku: 'میوە', ar: 'فواكه', en: 'Fruit' },
  cream: { ku: 'کریم', ar: 'كريم', en: 'Cream' },
  chicken: { ku: 'مریشک', ar: 'دجاج', en: 'Chicken' },
  beef: { ku: 'گۆشت', ar: 'لحم', en: 'Beef' },
  cake: { ku: 'کێک', ar: 'كيك', en: 'Cake' },
  pastry: { ku: 'پاستری', ar: 'معجنات', en: 'Pastry' },
  icecream: { ku: 'ئایسکریم', ar: 'آيسكريم', en: 'Ice Cream' },
};
