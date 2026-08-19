export const INITIAL_NOTIFICATIONS = [
  {
    id: 'n-1',
    title: 'New Order Received',
    message: 'Order #GS10482 from Rahul K. is waiting for your confirmation.',
    time: '2 mins ago',
    type: 'order',
    read: false
  },
  {
    id: 'n-2',
    title: 'Low Stock Alert',
    message: 'Fortune Sunlite Sunflower Oil is running low (Only 4 bottles remaining).',
    time: '1 hour ago',
    type: 'alert',
    read: false
  },
  {
    id: 'n-3',
    title: 'Order Delivered',
    message: 'Order #GS10477 was marked completed by rider.',
    time: '2 hours ago',
    type: 'success',
    read: true
  }
];