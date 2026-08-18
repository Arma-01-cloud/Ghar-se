import { PRODUCTS } from '../data/products';

/**
 * Fuzzy search matches item name against catalog products for manual entry form
 */
export function matchItemToCatalog(itemName) {
  if (!itemName) return [];
  const searchLower = itemName.toLowerCase().trim();
  
  const matches = PRODUCTS.filter(product => {
    const pName = (product.name || '').toLowerCase();
    const pCat = (product.category || '').toLowerCase();
    const pBrand = (product.brand || '').toLowerCase();

    const keywords = searchLower.split(/\s+/).filter(k => k.length > 2);
    if (pName.includes(searchLower)) return true;

    return keywords.some(k => pName.includes(k) || pCat.includes(k) || pBrand.includes(k));
  });

  if (matches.length === 0) {
    if (searchLower.includes('milk') || searchLower.includes('dairy')) {
      return PRODUCTS.filter(p => p.category === 'dairy-eggs');
    }
    if (searchLower.includes('rice') || searchLower.includes('atta') || searchLower.includes('dal')) {
      return PRODUCTS.filter(p => p.category === 'rice-grains');
    }
    if (searchLower.includes('oil') || searchLower.includes('ghee') || searchLower.includes('sugar')) {
      return PRODUCTS.filter(p => p.category === 'cooking-oil');
    }
    return PRODUCTS.slice(0, 3);
  }

  return matches.slice(0, 4);
}

/**
 * Text parsing helper for manual list text entry
 */
export function parseRawListText(rawText) {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText
    .split(/\r?\n|,|;/)
    .map(line => line.replace(/^[\d\s.\-*•]+/, '').trim())
    .filter(line => line.length > 1);

  return lines.map((line, index) => {
    const qtyMatch = line.match(/(\d+(?:\.\d+)?)\s*(kg|g|l|ml|litre|liter|pkt|pack|bunch|pcs|pieces)?/i);
    
    let qty = 1;
    let unit = 'kg';
    let cleanName = line;

    if (qtyMatch) {
      qty = parseFloat(qtyMatch[1]) || 1;
      if (qtyMatch[2]) {
        unit = qtyMatch[2].toLowerCase();
        if (unit === 'litre' || unit === 'liter') unit = 'L';
      }
      cleanName = line.replace(qtyMatch[0], '').trim() || line;
    }

    const matchedProducts = matchItemToCatalog(cleanName);
    const selectedProduct = matchedProducts[0] || PRODUCTS[0];

    return {
      id: `item-${Date.now()}-${index}`,
      raw: line,
      name: cleanName || 'Grocery Item',
      qty: qty,
      unit: unit,
      matchedProducts: matchedProducts,
      selectedProduct: selectedProduct,
      price: selectedProduct ? selectedProduct.price : 50,
      selected: true
    };
  });
}
