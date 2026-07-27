// Hierarchical category definitions for Dhangadhi Dash multi-industry marketplace.
// Parent categories have null parent_id; children reference their parent's slug.
// Used by CategoryManager (seeding), homepage, search filters, and product forms.

export const CATEGORY_HIERARCHY = [
  {
    name: "Food", slug: "food", emoji: "🍽", color: "from-orange-400 to-red-400", group: "food",
    children: [
      { name: "Fast Food", slug: "fast_food", emoji: "🍟", color: "from-red-400 to-orange-400" },
      { name: "Restaurant", slug: "restaurant", emoji: "🍴", color: "from-amber-400 to-orange-400" },
      { name: "Cafe", slug: "cafe", emoji: "☕", color: "from-amber-700 to-amber-500" },
      { name: "Bakery", slug: "bakery", emoji: "🍰", color: "from-pink-400 to-rose-400" },
      { name: "Pizza", slug: "pizza", emoji: "🍕", color: "from-red-500 to-orange-500" },
      { name: "Burger", slug: "burger", emoji: "🍔", color: "from-yellow-400 to-orange-400" },
      { name: "Momo", slug: "momo", emoji: "🥟", color: "from-orange-400 to-amber-400" },
      { name: "Biryani", slug: "biryani", emoji: "🍚", color: "from-amber-500 to-yellow-500" },
      { name: "Chinese", slug: "chinese", emoji: "🥡", color: "from-red-400 to-rose-400" },
      { name: "Thakali", slug: "thakali", emoji: "🍛", color: "from-green-400 to-terai" },
      { name: "Newari", slug: "newari", emoji: "🍢", color: "from-orange-500 to-red-500" },
      { name: "Indian", slug: "indian", emoji: "🌶", color: "from-amber-500 to-red-500" },
      { name: "Italian", slug: "italian", emoji: "🍝", color: "from-red-400 to-green-400" },
      { name: "Healthy Food", slug: "healthy_food", emoji: "🥗", color: "from-green-400 to-emerald-400" },
      { name: "Breakfast", slug: "breakfast", emoji: "🍳", color: "from-yellow-400 to-amber-400" },
      { name: "Lunch", slug: "lunch", emoji: "🍱", color: "from-orange-400 to-amber-400" },
      { name: "Dinner", slug: "dinner", emoji: "🍲", color: "from-amber-500 to-orange-500" },
      { name: "Desserts", slug: "desserts", emoji: "🍮", color: "from-pink-400 to-fuchsia-400" },
      { name: "Ice Cream", slug: "ice_cream", emoji: "🍨", color: "from-pink-300 to-purple-300" },
      { name: "Juices", slug: "juices", emoji: "🥤", color: "from-orange-400 to-yellow-400" },
      { name: "Coffee", slug: "coffee", emoji: "☕", color: "from-amber-700 to-amber-500" },
      { name: "Tea", slug: "tea", emoji: "🍵", color: "from-green-400 to-teal-400" },
      { name: "Beverages", slug: "beverages", emoji: "🧃", color: "from-blue-400 to-cyan-400" },
    ],
  },
  {
    name: "Grocery", slug: "grocery", emoji: "🛒", color: "from-terai to-emerald-400", group: "grocery",
    children: [
      { name: "Fruits", slug: "fruits", emoji: "🍎", color: "from-red-400 to-pink-400" },
      { name: "Vegetables", slug: "vegetables", emoji: "🥦", color: "from-green-400 to-terai" },
      { name: "Dairy", slug: "dairy", emoji: "🥛", color: "from-blue-300 to-cyan-300" },
      { name: "Meat", slug: "meat", emoji: "🥩", color: "from-rose-400 to-red-400" },
      { name: "Fish", slug: "fish", emoji: "🐟", color: "from-blue-400 to-cyan-400" },
      { name: "Frozen Foods", slug: "frozen_foods", emoji: "🧊", color: "from-cyan-300 to-blue-300" },
      { name: "Rice & Grains", slug: "rice_grains", emoji: "🌾", color: "from-amber-400 to-yellow-400" },
      { name: "Spices", slug: "spices", emoji: "🌶", color: "from-red-500 to-orange-500" },
      { name: "Snacks", slug: "snacks", emoji: "🍿", color: "from-yellow-400 to-amber-400" },
      { name: "Beverages", slug: "grocery_beverages", emoji: "🧃", color: "from-blue-400 to-cyan-400" },
      { name: "Household Essentials", slug: "household_essentials", emoji: "🧴", color: "from-teal-400 to-cyan-400" },
      { name: "Baby Care", slug: "baby_care", emoji: "🍼", color: "from-pink-300 to-blue-300" },
    ],
  },
  {
    name: "Fashion", slug: "fashion", emoji: "👕", color: "from-purple-400 to-pink-400", group: "fashion",
    children: [
      { name: "Men's Clothing", slug: "mens_clothing", emoji: "👔", color: "from-blue-500 to-indigo-500" },
      { name: "Women's Clothing", slug: "womens_clothing", emoji: "👗", color: "from-pink-400 to-fuchsia-400" },
      { name: "Kids Wear", slug: "kids_wear", emoji: "👶", color: "from-yellow-400 to-orange-400" },
      { name: "Shoes", slug: "shoes", emoji: "👟", color: "from-slate-400 to-slate-600" },
      { name: "Bags", slug: "bags", emoji: "👜", color: "from-amber-500 to-orange-500" },
      { name: "Watches", slug: "watches", emoji: "⌚", color: "from-slate-600 to-gray-800" },
      { name: "Jewelry", slug: "jewelry", emoji: "💍", color: "from-yellow-400 to-amber-500" },
      { name: "Accessories", slug: "accessories", emoji: "🧢", color: "from-cyan-400 to-blue-400" },
    ],
  },
  {
    name: "Electronics", slug: "electronics", emoji: "💻", color: "from-blue-500 to-cyan-500", group: "electronics",
    children: [
      { name: "Mobiles", slug: "mobiles", emoji: "📱", color: "from-blue-500 to-indigo-500" },
      { name: "Laptops", slug: "laptops", emoji: "💻", color: "from-indigo-500 to-blue-500" },
      { name: "Tablets", slug: "tablets", emoji: "📲", color: "from-cyan-500 to-blue-500" },
      { name: "Audio", slug: "audio", emoji: "🎧", color: "from-violet-500 to-purple-500" },
      { name: "Cameras", slug: "cameras", emoji: "📷", color: "from-slate-500 to-gray-600" },
      { name: "Gaming", slug: "gaming", emoji: "🎮", color: "from-purple-500 to-violet-500" },
      { name: "Smart Home", slug: "smart_home", emoji: "🏠", color: "from-teal-500 to-cyan-500" },
      { name: "Accessories", slug: "electronics_accessories", emoji: "🔌", color: "from-cyan-400 to-blue-400" },
    ],
  },
  {
    name: "Beauty", slug: "beauty", emoji: "💄", color: "from-pink-500 to-rose-500", group: "beauty",
    children: [
      { name: "Skincare", slug: "skincare", emoji: "🧴", color: "from-rose-300 to-pink-300" },
      { name: "Makeup", slug: "makeup", emoji: "💅", color: "from-pink-400 to-red-400" },
      { name: "Hair Care", slug: "hair_care", emoji: "💇", color: "from-fuchsia-400 to-purple-400" },
      { name: "Perfumes", slug: "perfumes", emoji: "🌸", color: "from-purple-400 to-fuchsia-400" },
      { name: "Personal Care", slug: "personal_care", emoji: "🧼", color: "from-teal-400 to-cyan-400" },
    ],
  },
  {
    name: "Home & Living", slug: "home_living", emoji: "🏠", color: "from-amber-400 to-orange-400", group: "home",
    children: [
      { name: "Furniture", slug: "furniture", emoji: "🛋️", color: "from-amber-600 to-orange-600" },
      { name: "Kitchen", slug: "kitchen", emoji: "🍳", color: "from-orange-400 to-amber-400" },
      { name: "Home Decor", slug: "home_decor", emoji: "🪑", color: "from-amber-500 to-yellow-500" },
      { name: "Bedding", slug: "bedding", emoji: "🛏️", color: "from-purple-300 to-indigo-300" },
      { name: "Cleaning Supplies", slug: "cleaning_supplies", emoji: "🧹", color: "from-cyan-400 to-blue-400" },
    ],
  },
  {
    name: "Gifts & Flowers", slug: "gifts_flowers", emoji: "🎁", color: "from-pink-400 to-rose-400", group: "gifts",
    children: [
      { name: "Gifts", slug: "gifts", emoji: "🎁", color: "from-pink-400 to-fuchsia-400" },
      { name: "Flowers", slug: "flowers", emoji: "💐", color: "from-rose-400 to-pink-400" },
      { name: "Cakes", slug: "gift_cakes", emoji: "🎂", color: "from-pink-300 to-purple-300" },
      { name: "Chocolates", slug: "chocolates", emoji: "🍫", color: "from-amber-700 to-amber-500" },
      { name: "Greeting Cards", slug: "greeting_cards", emoji: "💌", color: "from-red-400 to-pink-400" },
      { name: "Custom Gifts", slug: "custom_gifts", emoji: "🎀", color: "from-fuchsia-400 to-purple-400" },
    ],
  },
  {
    name: "Pet Supplies", slug: "pet_supplies", emoji: "🐶", color: "from-teal-400 to-cyan-400", group: "pets",
    children: [
      { name: "Dog Supplies", slug: "dog_supplies", emoji: "🐕", color: "from-amber-500 to-orange-500" },
      { name: "Cat Supplies", slug: "cat_supplies", emoji: "🐈", color: "from-slate-400 to-gray-500" },
      { name: "Pet Food", slug: "pet_food", emoji: "🦴", color: "from-amber-600 to-yellow-600" },
      { name: "Pet Toys", slug: "pet_toys", emoji: "🎾", color: "from-green-400 to-teal-400" },
      { name: "Aquarium", slug: "aquarium", emoji: "🐟", color: "from-blue-400 to-cyan-400" },
      { name: "Pet Grooming", slug: "pet_grooming", emoji: "🧴", color: "from-teal-400 to-emerald-400" },
    ],
  },
  {
    name: "Books & Stationery", slug: "books_stationery", emoji: "📚", color: "from-indigo-500 to-blue-500", group: "books",
    children: [
      { name: "Books", slug: "books", emoji: "📖", color: "from-indigo-500 to-blue-500" },
      { name: "Notebooks", slug: "notebooks", emoji: "📓", color: "from-blue-500 to-cyan-500" },
      { name: "Stationery", slug: "stationery", emoji: "✏️", color: "from-amber-400 to-yellow-400" },
      { name: "Art Supplies", slug: "art_supplies", emoji: "🎨", color: "from-purple-400 to-pink-400" },
      { name: "Office Supplies", slug: "office_supplies", emoji: "📎", color: "from-slate-500 to-gray-600" },
    ],
  },
  {
    name: "Sports & Fitness", slug: "sports_fitness", emoji: "⚽", color: "from-green-500 to-emerald-500", group: "sports",
    children: [
      { name: "Fitness Equipment", slug: "fitness_equipment", emoji: "🏋️", color: "from-slate-500 to-gray-600" },
      { name: "Sportswear", slug: "sportswear", emoji: "👟", color: "from-blue-500 to-indigo-500" },
      { name: "Outdoor Sports", slug: "outdoor_sports", emoji: "🏕️", color: "from-green-500 to-teal-500" },
      { name: "Team Sports", slug: "team_sports", emoji: "⚽", color: "from-green-400 to-emerald-400" },
      { name: "Cycling", slug: "cycling", emoji: "🚴", color: "from-terai to-emerald-400" },
      { name: "Yoga & Wellness", slug: "yoga_wellness", emoji: "🧘", color: "from-purple-400 to-fuchsia-400" },
    ],
  },
  {
    name: "Automotive", slug: "automotive", emoji: "🚗", color: "from-slate-600 to-gray-800", group: "auto",
    children: [
      { name: "Car Accessories", slug: "car_accessories", emoji: "🚙", color: "from-slate-600 to-gray-700" },
      { name: "Bike Accessories", slug: "bike_accessories", emoji: "🏍️", color: "from-red-500 to-orange-500" },
      { name: "Car Care", slug: "car_care", emoji: "🧽", color: "from-cyan-500 to-blue-500" },
      { name: "Spare Parts", slug: "spare_parts", emoji: "🔧", color: "from-amber-600 to-orange-600" },
      { name: "Tools", slug: "auto_tools", emoji: "🛠️", color: "from-slate-500 to-gray-600" },
    ],
  },
];

// Flatten to a list of parents only (for homepage cards)
export const PARENT_CATEGORIES = CATEGORY_HIERARCHY.map((c) => ({
  name: c.name, slug: c.slug, emoji: c.emoji, color: c.color, group: c.group,
}));

// Get children of a specific parent by slug
export function getChildCategories(parentSlug) {
  const parent = CATEGORY_HIERARCHY.find((c) => c.slug === parentSlug);
  return parent?.children || [];
}

// Legacy flat list (backwards compatible with old imports)
export const INDUSTRY_CATEGORIES = CATEGORY_HIERARCHY.flatMap((parent) => [
  { name: parent.name, slug: parent.slug, emoji: parent.emoji, color: parent.color, group: parent.group },
  ...parent.children.map((child) => ({
    name: child.name, slug: child.slug, emoji: child.emoji, color: child.color, group: parent.group,
  })),
]);

export function getCategoryBySlug(slug) {
  return INDUSTRY_CATEGORIES.find((c) => c.slug === slug);
}

export function getHomepageCategories() {
  return PARENT_CATEGORIES;
}