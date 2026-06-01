import { cartReducer } from '../src/features/cart/cart-reducer';

test('increments an existing cart product', () => {
  const state = [{ id: '1001', name: 'ELYSIUM', price: 24900, qty: 1 }];
  expect(cartReducer(state, { type: 'add', item: state[0] })[0].qty).toBe(2);
});
