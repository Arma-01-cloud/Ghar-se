import { MOCK_PRODUCTS } from './mock/customerService';

export function matchItemToCatalog(itemName) {
  if (!itemName) return null;
  const nameLower = itemName.toLowerCase();
  const found = MOCK_PRODUCTS.find(p => p.name.toLowerCase().includes(nameLower) || nameLower.includes(p.name.toLowerCase()));
  if (found) return found;

  return {
    id: `custom-${Date.now()}-${Math.random()}`,
    name: itemName,
    category: 'Groceries',
    price: 50,
    unit: '1 item',
    stock: 20,
    image: '/images/cat_veg_fruits.jpg'
  };
}

export async function parseRawListText(rawText) {
  if (!rawText) return [];
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  return lines.map((line, idx) => ({
    id: `item-${idx}`,
    name: line,
    quantity: 1,
    unit: '1 item',
    matchedProduct: matchItemToCatalog(line)
  }));
}

export async function parseGroceryListImage(imageFile) {
  return parseRawListText('1 kg Basmati Rice\n500ml Milk\n1 Litre Cooking Oil');
}
