// Standalone Mock Service for Partner Frontend Development
// Zero Supabase dependency

export async function mockPartnerSignUp({ phone, password, fullName, role = 'shopkeeper' }) {
  const userObj = {
    id: `partner-${Date.now()}`,
    phone,
    user_metadata: { full_name: fullName, role }
  };
  return { user: userObj, session: null, error: null };
}

export async function mockPartnerSignIn({ phone, password }) {
  const userObj = {
    id: `partner-${Date.now()}`,
    phone,
    user_metadata: { full_name: 'Store Partner', role: 'shopkeeper' }
  };
  return { user: userObj, session: null, error: null };
}

export async function mockCreateStore(storeData) {
  const newStore = {
    id: `shop-${Date.now()}`,
    name: storeData.name,
    address: storeData.address,
    city: storeData.city,
    locality: storeData.locality,
    latitude: storeData.latitude || 12.9784,
    longitude: storeData.longitude || 77.6408,
    status: 'open',
    rating: 5.0,
    isOpen: true
  };
  return { data: newStore, error: null };
}

export async function mockFetchPartnerOrders(shopId) {
  return [
    {
      id: 'ORD-9021',
      customerName: 'Ananya Roy',
      customerPhone: '+919876543210',
      address: '100 Feet Road, Indiranagar, Bengaluru',
      total: 340,
      status: 'pending',
      fulfillment_mode: 'store_selected',
      createdAt: new Date().toISOString(),
      items: [
        { id: 'p1', name: 'Sona Masoori Rice', quantity: 2, unit: '1 kg', price: 65 },
        { id: 'p2', name: 'Nandini Milk', quantity: 1, unit: '500 ml', price: 24 }
      ]
    }
  ];
}

export async function mockFetchRiderDeliveries() {
  return {
    incoming: {
      id: 'ORD-9021',
      storeName: 'Sri Lakshmi Stores',
      storeAddress: 'Market Road, Indiranagar',
      customerName: 'Ananya Roy',
      customerPhone: '+919876543210',
      deliveryAddress: '100 Feet Road, Indiranagar, Bengaluru',
      distance: '1.2 km',
      estimatedTime: 'Delivery after 4:00 PM',
      estimatedEarnings: 65,
      paymentStatus: 'Paid Online',
      status: 'pending'
    },
    active: null,
    history: []
  };
}