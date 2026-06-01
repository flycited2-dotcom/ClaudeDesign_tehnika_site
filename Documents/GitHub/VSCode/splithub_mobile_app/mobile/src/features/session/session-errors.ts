export function apiErrorCode(error: unknown) {
  return String((error as { data?: { code?: string } }).data?.code ?? 'REQUEST_FAILED');
}

export function sessionErrorMessage(code: string) {
  if (code === 'INVALID_CREDENTIALS') return 'Неверный телефон или пароль';
  if (code === 'PHONE_ALREADY_REGISTERED') return 'Этот телефон уже зарегистрирован';
  if (code === 'INVALID_REGISTRATION') return 'Проверьте заполнение обязательных полей';
  return 'Не удалось выполнить запрос. Проверьте подключение к интернету.';
}
