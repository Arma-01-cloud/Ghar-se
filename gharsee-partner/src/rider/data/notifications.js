export const INITIAL_RIDER_NOTIFICATIONS = [
  {
    id: 'rn-1',
    title: 'New Delivery Request',
    message: 'Order #GS10482 from Sri Lakshmi Stores (3.4 km, ₹82).',
    time: 'Just now',
    type: 'request',
    read: false
  },
  {
    id: 'rn-2',
    title: 'Delivery Completed',
    message: 'Order #GS10478 completed. ₹78 added to today earnings.',
    time: '45 mins ago',
    type: 'success',
    read: true
  },
  {
    id: 'rn-3',
    title: 'Peak Surge Bonus Active',
    message: 'Earn +₹20 extra per delivery during peak evening hours (7 PM - 10 PM).',
    time: '2 hours ago',
    type: 'bonus',
    read: true
  }
];
