export const INITIAL_DELIVERY_REQUESTS = [
  {
    id: 'GS10482',
    storeName: 'Sri Lakshmi Stores',
    storeAddress: '100 Feet Road, Indiranagar, Bengaluru - 560038',
    customerName: 'Rahul K.',
    customerPhone: '+91 98765 43210',
    deliveryAddress: 'Flat 402, Green Meadows Apartment, 100 Feet Road, Indiranagar, Bengaluru - 560038',
    distance: '3.4 km',
    estimatedTime: '18 min',
    estimatedEarnings: 82,
    itemCount: 7,
    items: [
      { name: 'Daawat Rozana Super Basmati Rice', qty: '5 kg' },
      { name: 'Amul Taaza Toned Milk', qty: '2 L' },
      { name: 'Fortune Sunlite Sunflower Oil', qty: '1 L' },
      { name: 'Madhur Pure Sugar', qty: '2 kg' },
      { name: 'Farm Fresh Red Tomatoes', qty: '1 kg' },
      { name: 'Aashirvaad Shudh Chakki Atta', qty: '5 kg' },
      { name: 'Tata Salt Vacuum Evaporated', qty: '1 kg' }
    ],
    orderTotal: 1101,
    paymentStatus: 'Paid Online (UPI)',
    paymentType: 'PREPAID',
    otp: '4820',
    status: 'delivery_requested', // available | delivery_requested | accepted | arrived_at_store | picked_up | out_for_delivery | delivered
    expiresInSeconds: 30
  }
];

export const INITIAL_DELIVERY_HISTORY = [
  {
    id: 'GS10478',
    completedAt: 'Today • 8:42 PM',
    storeName: 'Sri Lakshmi Stores',
    customerName: 'Karan Patel',
    deliveryAddress: 'Flat 501, Oakwood Apartments, Domlur',
    distance: '4.2 km',
    earnings: 78,
    paymentType: 'PREPAID',
    status: 'delivered'
  },
  {
    id: 'GS10476',
    completedAt: 'Today • 7:15 PM',
    storeName: 'FreshMart Grocery',
    customerName: 'Meera Nair',
    deliveryAddress: 'House 12B, Cambridge Layout, Ulsoor',
    distance: '2.8 km',
    earnings: 65,
    paymentType: 'COD (Cash on Delivery ₹474)',
    status: 'delivered'
  },
  {
    id: 'GS10472',
    completedAt: 'Yesterday • 6:30 PM',
    storeName: 'Green Basket Organic',
    customerName: 'Anil Kapoor',
    deliveryAddress: 'Sector 4, HSR Layout, Bengaluru',
    distance: '5.1 km',
    earnings: 95,
    paymentType: 'PREPAID',
    status: 'delivered'
  }
];
