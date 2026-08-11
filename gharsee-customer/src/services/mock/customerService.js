// Standalone Mock Service for Customer Frontend Development
// Zero Supabase dependency

export const MOCK_STORES = [
  {
    id: 'store-1',
    name: 'Sri Lakshmi Stores',
    ownerName: 'Ramesh Kumar',
    phone: '+91 98765 43210',
    address: 'Market Road, Chikkamagaluru, Karnataka',
    locality: 'Chikkamagaluru',
    city: 'Chikkamagaluru',
    state: 'Karnataka',
    rating: 4.9,
    reviews: 184,
    isOpen: true,
    openingTime: '07:00 AM',
    closingTime: '10:00 PM',
    distance: '~1.2 km away',
    deliveryTime: '15-25 min',
    image: '/images/store_lakshmi.jpg',
    categories: ['Groceries', 'Vegetables', 'Dairy', 'Rice & Grains']
  },
  {
    id: 'store-2',
    name: 'Fresh Mart Supermarket',
    ownerName: 'Suresh Gowda',
    phone: '+91 98765 88990',
    address: 'MG Road, Indiranagar, Bengaluru',
    locality: 'Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    rating: 4.8,
    reviews: 312,
    isOpen: true,
    openingTime: '08:00 AM',
    closingTime: '09:30 PM',
    distance: '~0.8 km away',
    deliveryTime: '12-20 min',
    image: '/images/store_freshmart.jpg',
    categories: ['Groceries', 'Fruits & Veggies', 'Organic', 'Snacks']
  }
];

export const MOCK_PRODUCTS = [
  {
    id: 'prod-1',
    shop_id: 'store-1',
    name: 'Sona Masoori Raw Rice',
    category: 'Rice & Grains',
    price: 65,
    mrp: 75,
    unit: '1 kg',
    stock: 45,
    image: '/images/cat_rice_grains.jpg',
    description: 'Aromatic and clean premium raw rice directly from local farms.'
  },
  {
    id: 'prod-2',
    shop_id: 'store-1',
    name: 'Fresh Cow Milk (Nandini Pure)',
    category: 'Dairy',
    price: 24,
    mrp: 26,
    unit: '500 ml',
    stock: 60,
    image: '/images/cat_dairy.jpg',
    description: 'Farm fresh pasteurized cow milk delivered daily.'
  },
  {
    id: 'prod-3',
    shop_id: 'store-1',
    name: 'Sunflower Cooking Oil (Fortune)',
    category: 'Cooking Essentials',
    price: 135,
    mrp: 150,
    unit: '1 Litre',
    stock: 30,
    image: '/images/cat_cooking_oil.jpg',
    description: 'Healthy refined sunflower oil for daily home cooking.'
  },
  {
    id: 'prod-4',
    shop_id: 'store-2',
    name: 'Farm Fresh Tomatoes',
    category: 'Vegetables',
    price: 32,
    mrp: 40,
    unit: '1 kg',
    stock: 50,
    image: '/images/cat_veg_fruits.jpg',
    description: 'Ripe red organic tomatoes harvested daily.'
  }
];

export async function fetchCustomerStores(city = '') {
  if (!city) return MOCK_STORES;
  const filtered = MOCK_STORES.filter(s =>
    s.city.toLowerCase().includes(city.toLowerCase()) ||
    s.locality.toLowerCase().includes(city.toLowerCase()) ||
    s.address.toLowerCase().includes(city.toLowerCase())
  );
  return filtered.length > 0 ? filtered : MOCK_STORES;
}

export async function fetchCustomerProducts(storeId = null) {
  if (!storeId) return MOCK_PRODUCTS;
  return MOCK_PRODUCTS.filter(p => p.shop_id === storeId);
}

export async function placeCustomerOrder(orderPayload) {
  const newOrder = {
    id: `ORD-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'Order Placed',
    ...orderPayload
  };
  const existing = JSON.parse(localStorage.getItem('gharsee_customer_orders') || '[]');
  localStorage.setItem('gharsee_customer_orders', JSON.stringify([newOrder, ...existing]));
  return newOrder;
}

export async function fetchCustomerOrdersHistory() {
  const localOrders = JSON.parse(localStorage.getItem('gharsee_customer_orders') || '[]');
  return localOrders;
}
