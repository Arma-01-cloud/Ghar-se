export const INITIAL_SHOPKEEPER_ORDERS = [
  {
    id: 'GS10482',
    customerName: 'Rahul K.',
    phone: '+91 98765 43210',
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 mins ago
    items: [
      { name: 'Daawat Rozana Super Basmati Rice', qty: 1, unit: '5 kg', price: 420 },
      { name: 'Amul Taaza Toned Milk', qty: 2, unit: '1 L', price: 54 },
      { name: 'Fortune Sunlite Sunflower Oil', qty: 1, unit: '1 L', price: 155 },
      { name: 'Madhur Pure Sugar', qty: 2, unit: '1 kg', price: 55 },
      { name: 'Farm Fresh Red Tomatoes', qty: 1, unit: '1 kg', price: 45 },
      { name: 'Aashirvaad Shudh Chakki Atta', qty: 1, unit: '5 kg', price: 285 },
      { name: 'Tata Salt Vacuum Evaporated', qty: 1, unit: '1 kg', price: 28 }
    ],
    subtotal: 1151,
    deliveryFee: 0,
    discount: 50,
    total: 1101,
    paymentStatus: 'Paid Online (UPI)',
    deliveryType: 'Express Home Delivery',
    deliveryAddress: 'Flat 402, Green Meadows Apartment, 100 Feet Road, Indiranagar, Bengaluru - 560038',
    status: 'pending',
    rejectionReason: null
  },
  {
    id: 'GS10481',
    customerName: 'Priya Sharma',
    phone: '+91 91234 56789',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 mins ago
    items: [
      { name: 'Britannia 100% Whole Wheat Bread', qty: 2, unit: '400 g', price: 50 },
      { name: 'Amul Pasteurised Butter', qty: 1, unit: '100 g', price: 58 },
      { name: 'Farm Fresh Brown Eggs', qty: 1, unit: 'Pack of 6', price: 95 }
    ],
    subtotal: 253,
    deliveryFee: 49,
    discount: 0,
    total: 302,
    paymentStatus: 'Cash on Delivery',
    deliveryType: 'Home Delivery',
    deliveryAddress: 'House 88, 12th Main Road, HAL 2nd Stage, Bengaluru - 560008',
    status: 'accepted',
    rejectionReason: null
  },
  {
    id: 'GS10480',
    customerName: 'Vikram Mehta',
    phone: '+91 99887 76655',
    createdAt: new Date(Date.now() - 28 * 60 * 1000).toISOString(), // 28 mins ago
    items: [
      { name: 'Tata Sampann Unpolished Toor Dal', qty: 2, unit: '1 kg', price: 175 },
      { name: 'Amul Pure Cow Ghee Jar', qty: 1, unit: '1 L', price: 590 },
      { name: 'Red Label Natural Care Tea', qty: 1, unit: '500 g', price: 275 }
    ],
    subtotal: 1215,
    deliveryFee: 0,
    discount: 100,
    total: 1115,
    paymentStatus: 'Paid Online (Card)',
    deliveryType: 'Express Home Delivery',
    deliveryAddress: 'Villa 12, Koramangala 4th Block, Bengaluru - 560034',
    status: 'preparing',
    rejectionReason: null
  },
  {
    id: 'GS10479',
    customerName: 'Ananya Deshmukh',
    phone: '+91 94455 66778',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    items: [
      { name: 'Organic Royal Gala Apples', qty: 2, unit: '1 kg', price: 189 },
      { name: 'Fresh Malai Paneer', qty: 2, unit: '200 g', price: 110 }
    ],
    subtotal: 598,
    deliveryFee: 0,
    discount: 0,
    total: 598,
    paymentStatus: 'Paid Online (UPI)',
    deliveryType: 'Home Delivery',
    deliveryAddress: 'Flat 104, Sunrise Heights, Old Airport Road, Bengaluru - 560017',
    status: 'ready',
    rejectionReason: null
  },
  {
    id: 'GS10478',
    customerName: 'Karan Patel',
    phone: '+91 97766 55443',
    createdAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    items: [
      { name: 'Fortune Sunlite Refined Sunflower Oil', qty: 2, unit: '1 L', price: 155 },
      { name: 'Haldiram Nagpur Bhujia Sev', qty: 2, unit: '350 g', price: 99 }
    ],
    subtotal: 508,
    deliveryFee: 0,
    discount: 50,
    total: 458,
    paymentStatus: 'Paid Online (UPI)',
    deliveryType: 'Express Home Delivery',
    deliveryAddress: 'Flat 501, Oakwood Apartments, Domlur, Bengaluru - 560071',
    status: 'out_for_delivery',
    rejectionReason: null
  },
  {
    id: 'GS10477',
    customerName: 'Siddharth Rao',
    phone: '+91 93322 11009',
    createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    items: [
      { name: 'Nescafe Classic Instant Coffee Jar', qty: 1, unit: '100 g', price: 340 },
      { name: 'California Roasted Almonds', qty: 1, unit: '250 g', price: 349 }
    ],
    subtotal: 689,
    deliveryFee: 0,
    discount: 0,
    total: 689,
    paymentStatus: 'Paid Online (UPI)',
    deliveryType: 'Home Delivery',
    deliveryAddress: 'Plot 45, BTM Layout 2nd Stage, Bengaluru - 560076',
    status: 'completed',
    rejectionReason: null
  },
  {
    id: 'GS10476',
    customerName: 'Meera Nair',
    phone: '+91 96655 44332',
    createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    items: [
      { name: 'Surf Excel Easy Wash Detergent', qty: 1, unit: '1 kg', price: 240 },
      { name: 'Vim Dishwash Gel Lemon Liquid', qty: 1, unit: '750 ml', price: 185 }
    ],
    subtotal: 425,
    deliveryFee: 49,
    discount: 0,
    total: 474,
    paymentStatus: 'Cash on Delivery',
    deliveryType: 'Home Delivery',
    deliveryAddress: 'House 12B, Cambridge Layout, Ulsoor, Bengaluru - 560008',
    status: 'rejected',
    rejectionReason: 'Item unavailable (Out of stock)'
  }
];
