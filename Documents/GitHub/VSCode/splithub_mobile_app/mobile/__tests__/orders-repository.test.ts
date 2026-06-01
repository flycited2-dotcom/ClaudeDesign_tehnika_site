import { orderDetailsQuery } from '../src/features/orders/orders-repository';

test('builds order detail query', () => {
  expect(orderDetailsQuery(42)).toEqual({ id: '42' });
});
