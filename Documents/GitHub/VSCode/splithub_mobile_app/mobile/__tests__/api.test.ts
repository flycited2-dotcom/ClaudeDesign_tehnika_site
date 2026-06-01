import { buildHeaders } from '../src/lib/api';

test('adds bearer token when present', () => {
  expect(buildHeaders('secret')).toEqual({
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: 'Bearer secret',
  });
});
