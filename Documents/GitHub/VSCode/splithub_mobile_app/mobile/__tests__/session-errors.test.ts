import { sessionErrorMessage } from '../src/features/session/session-errors';

test('maps invalid credentials to a Russian message', () => {
  expect(sessionErrorMessage('INVALID_CREDENTIALS')).toBe('Неверный телефон или пароль');
});
