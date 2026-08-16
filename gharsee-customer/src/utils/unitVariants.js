/**
 * Unit & Weight Variants Utility for GharSee Customer Platform
 * Supports:
 * - Rice & Grains: 500g, 1 kg, 2 kg, 5 kg, 25 kg
 * - Flour & Wheat (Atta/Maida/Sooji): 500g, 1 kg, 2 kg, 5 kg, 10 kg
 * - Vegetables, Fruits & General Groceries: 100g, 250g, 500g, 1 kg, 2 kg
 * - Spices & Dry Fruits: 50g, 100g, 250g, 500g, 1 kg
 * - Liquids & Oils: 250ml, 500ml, 1 L, 2 L, 5 L
 */

export function getUnitVariants(product) {
  if (!product) return [];

  const rawUnit = (product.unit || '1 kg').toLowerCase().trim();
  const name = (product.name || '').toLowerCase().trim();
  const category = (product.category || '').toLowerCase().trim();
  const basePrice = Math.max(1, parseFloat(product.price || 50));
  const baseMrp = Math.max(basePrice, parseFloat(product.mrp || product.originalPrice || product.price || 50));

  // 1. LIQUID / VOLUME VARIANTS (ml, l, liter, litre, ltr, oil, ghee, milk, beverages)
  const isLiquidUnit = /ml|ltr|liter|litre|\bl\b/i.test(rawUnit);
  const isLiquidName = /oil|ghee|milk|juice|drink|beverage|water|syrup/i.test(name) || /oil|beverage|dairy/i.test(category);

  if (isLiquidUnit || (isLiquidName && !/kg|gm|gram/i.test(rawUnit))) {
    let baseMl = 1000;
    const match = rawUnit.match(/(\d+(\.\d+)?)\s*(ml|l|ltr|liter|litre)/i);
    if (match) {
      const val = parseFloat(match[1]);
      const type = match[3].toLowerCase();
      baseMl = type === 'ml' ? val : val * 1000;
    }

    const isBulkOil = /oil|ghee|cooking oil|sunflower|mustard|groundnut/i.test(name);
    const liquidPresets = isBulkOil
      ? [
          { label: '500ml', ml: 500 },
          { label: '1 L', ml: 1000 },
          { label: '2 L', ml: 2000 },
          { label: '5 L', ml: 5000 }
        ]
      : [
          { label: '250ml', ml: 250 },
          { label: '500ml', ml: 500 },
          { label: '1 L', ml: 1000 },
          { label: '2 L', ml: 2000 }
        ];

    return liquidPresets.map(preset => {
      const multiplier = preset.ml / baseMl;
      const price = Math.max(1, Math.round(basePrice * multiplier));
      const mrp = Math.max(price, Math.round(baseMrp * multiplier));
      const isBase = Math.abs(preset.ml - baseMl) < 50;

      return {
        id: preset.label.replace(/\s+/g, ''),
        unit: preset.label,
        label: preset.label,
        multiplier,
        price,
        mrp,
        isBase
      };
    });
  }

  // 2. CHECK SPECIFIC COMMODITIES
  // (A) Rice & Grains / Pulses (e.g. Sona Masoori, Basmati, Toor Dal, Grains) -> 5kg & 25kg
  const isRiceOrGrains = /rice|basmati|masoori|paddy|grain|dal|dhal|pulse|chana|rajma|toor|moong|urad/i.test(name) || /rice|atta & rice|pulses/i.test(category);

  // (B) Flour & Atta (e.g. Wheat Flour, Chakki Atta, Maida, Sooji, Besan, Rava) -> 5kg & 10kg
  const isFlourOrAtta = /wheat|flour|atta|maida|sooji|besan|rava|suji/i.test(name) || /flour/i.test(category);

  // (C) Spices & Dry Fruits (Nuts, Masalas, Cardamom, Cashew, Almond) -> 50g, 100g, 250g, 500g, 1 kg
  const isSpicesOrNuts = /spice|masala|chilli|turmeric|cumin|pepper|cardamom|clove|cinnamon|almond|cashew|kaju|badam|raisin|pista|walnut/i.test(name) || /oil & masala|spices/i.test(category);

  // Check if non-weight item (e.g., bread, eggs, biscuits, cleaning spray)
  const isPackItem = /pack|pkt|piece|pc|can|bottle|dozen|bunch/i.test(rawUnit) && !/kg|g|gm|gram/i.test(rawUnit);
  if (isPackItem) {
    const standardUnit = product.unit || '1 unit';
    return [
      {
        id: '1x',
        unit: standardUnit,
        label: standardUnit,
        multiplier: 1,
        price: basePrice,
        mrp: baseMrp,
        isBase: true
      },
      {
        id: '2x',
        unit: `2 x (${standardUnit})`,
        label: `2 Pack`,
        multiplier: 2,
        price: Math.round(basePrice * 1.95),
        mrp: baseMrp * 2,
        isBase: false
      }
    ];
  }

  // Determine base weight in grams
  let baseGrams = 1000;
  const match = rawUnit.match(/(\d+(\.\d+)?)\s*(kg|g|gm|gram|gms)/i);
  if (match) {
    const val = parseFloat(match[1]);
    const type = match[3].toLowerCase();
    baseGrams = (type === 'kg') ? val * 1000 : val;
  }

  let weightPresets;
  if (isRiceOrGrains) {
    // Rice & Grain items: Include 500g, 1 kg, 2 kg, 5 kg, 25 kg
    weightPresets = [
      { label: '500g', grams: 500 },
      { label: '1 kg', grams: 1000 },
      { label: '2 kg', grams: 2000 },
      { label: '5 kg', grams: 5000 },
      { label: '25 kg', grams: 25000 }
    ];
  } else if (isFlourOrAtta) {
    // Flour / Wheat items: Include 500g, 1 kg, 2 kg, 5 kg, 10 kg
    weightPresets = [
      { label: '500g', grams: 500 },
      { label: '1 kg', grams: 1000 },
      { label: '2 kg', grams: 2000 },
      { label: '5 kg', grams: 5000 },
      { label: '10 kg', grams: 10000 }
    ];
  } else if (isSpicesOrNuts) {
    // Spices & Dry Fruits: 50g, 100g, 250g, 500g, 1 kg
    weightPresets = [
      { label: '50g', grams: 50 },
      { label: '100g', grams: 100 },
      { label: '250g', grams: 250 },
      { label: '500g', grams: 500 },
      { label: '1 kg', grams: 1000 }
    ];
  } else {
    // Standard Fresh Vegetables, Fruits & Groceries: 100g, 250g, 500g, 1 kg, 2 kg, 5 kg
    weightPresets = [
      { label: '100g', grams: 100 },
      { label: '250g', grams: 250 },
      { label: '500g', grams: 500 },
      { label: '1 kg', grams: 1000 },
      { label: '2 kg', grams: 2000 },
      { label: '5 kg', grams: 5000 }
    ];
  }

  return weightPresets.map(preset => {
    const multiplier = preset.grams / baseGrams;
    const price = Math.max(1, Math.round(basePrice * multiplier));
    const mrp = Math.max(price, Math.round(baseMrp * multiplier));
    const isBase = Math.abs(preset.grams - baseGrams) < 20;

    return {
      id: preset.label.replace(/\s+/g, ''),
      unit: preset.label,
      label: preset.label,
      multiplier,
      price,
      mrp,
      isBase
    };
  });
}

/**
 * Returns a clone of the product with the selected unit variant applied
 */
export function getProductWithVariant(product, selectedVariant) {
  if (!product || !selectedVariant) return product;

  return {
    ...product,
    id: selectedVariant.isBase 
      ? product.id 
      : `${product.id}_${selectedVariant.unit.replace(/[^a-zA-Z0-9]/g, '')}`,
    baseProductId: product.id,
    selectedUnit: selectedVariant.unit,
    unit: selectedVariant.unit,
    price: selectedVariant.price,
    originalPrice: selectedVariant.mrp,
    mrp: selectedVariant.mrp,
    name: product.name
  };
}
