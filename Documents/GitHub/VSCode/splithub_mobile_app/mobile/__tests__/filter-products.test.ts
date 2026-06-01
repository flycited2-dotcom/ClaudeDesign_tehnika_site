import { filterProducts } from '../src/features/catalog/filter-products';

const products = [
  { id: '1', brand: 'ULTIMA', model: 'ELYSIUM 09', group: 'inv' },
  { id: '2', brand: 'MIDEA', model: 'BREEZE 12', group: 'onoff' },
] as never[];

test('filters by search and category', () => {
  expect(filterProducts(products, 'ely', 'inv').map((product) => product.id)).toEqual(['1']);
});
