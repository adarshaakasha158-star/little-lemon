export const MENU_API_URL =
  'https://raw.githubusercontent.com/Meta-Mobile-Developer-PC/Working-With-Data-API/main/capstone.json';

const CATEGORY_ALIASES = {
  starter: 'starters',
  starters: 'starters',
  appetizer: 'starters',
  appetizers: 'starters',
  main: 'mains',
  mains: 'mains',
  entree: 'mains',
  entrees: 'mains',
  dessert: 'desserts',
  desserts: 'desserts',
  drink: 'drinks',
  drinks: 'drinks',
  beverage: 'drinks',
  beverages: 'drinks'
};

function normalizeCategory(value) {
  const key = String(value ?? '').trim().toLowerCase();
  return CATEGORY_ALIASES[key] || 'mains';
}

function normalizeMenuItem(item, index) {
  const name = String(item.name ?? item.title ?? `Dish ${index + 1}`).trim();
  const category = normalizeCategory(item.category);
  const price = Number(item.price);

  return {
    id: String(item.id ?? `${category}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`),
    name,
    description: String(item.description ?? '').trim(),
    price: Number.isFinite(price) ? price : 0,
    category,
    image: String(item.image ?? '').trim()
  };
}

export function getDishImageUrl(fileName) {
  if (!fileName) {
    return null;
  }

  return `https://github.com/Meta-Mobile-Developer-PC/Working-With-Data-API/blob/main/images/${encodeURIComponent(fileName)}?raw=true`;
}

export async function fetchMenuItems() {
  const response = await fetch(MENU_API_URL, {
    headers: { Accept: 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`Menu service returned ${response.status}.`);
  }

  const payload = await response.json();
  const sourceItems = Array.isArray(payload) ? payload : payload?.menu;

  if (!Array.isArray(sourceItems)) {
    throw new Error('The menu response was not in the expected format.');
  }

  return sourceItems.map(normalizeMenuItem);
}
