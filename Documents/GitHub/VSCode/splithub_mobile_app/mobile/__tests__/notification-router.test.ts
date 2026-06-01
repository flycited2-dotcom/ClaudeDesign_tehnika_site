import { notificationTarget } from '../src/features/notifications/notification-router';

test('routes order status notification to order details', () => {
  expect(notificationTarget({ type: 'order_status', order_id: 42 })).toBe('/order/42');
});

test('routes promotion to catalog', () => {
  expect(notificationTarget({ type: 'promotion', category: 'inv' })).toBe('/?category=inv');
});
