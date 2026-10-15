import { tr, resolveLanguage } from './translate';

describe('resolveLanguage', () => {
  it('passes through supported languages', () => {
    expect(resolveLanguage('ru')).toBe('ru');
    expect(resolveLanguage('en')).toBe('en');
  });

  it('falls back to ru for anything else', () => {
    expect(resolveLanguage(null)).toBe('ru');
    expect(resolveLanguage(undefined)).toBe('ru');
    expect(resolveLanguage('')).toBe('ru');
    expect(resolveLanguage('kk')).toBe('ru');
    // Региональные варианты не нормализуются — это настройка, а не Accept-Language
    expect(resolveLanguage('en-US')).toBe('ru');
  });
});

describe('tr — lookup', () => {
  it('resolves a plain push key in both languages', () => {
    expect(tr('ru', 'push.registrationApproved.title')).toBe('Регистрация одобрена');
    expect(tr('en', 'push.registrationApproved.title')).toBe('Registration approved');
  });

  it('reaches other namespaces of the shared dictionary', () => {
    expect(tr('ru', 'enums.requestType.SICK')).toBe('Больничный');
    expect(tr('en', 'enums.requestType.SICK')).toBe('Sick leave');
  });

  it('uses ru for an unknown language', () => {
    expect(tr('kk', 'push.registrationApproved.title')).toBe('Регистрация одобрена');
    expect(tr(null, 'push.newCompany.title')).toBe('Новая компания');
  });

  it('returns the key itself when nothing matches', () => {
    expect(tr('ru', 'push.nothingHere.title')).toBe('push.nothingHere.title');
  });
});

describe('tr — interpolation', () => {
  it('substitutes {{placeholders}}', () => {
    expect(tr('ru', 'push.newEmployee.body', { fullName: 'Иван Иванов' })).toBe(
      'Иван Иванов ожидает подтверждения регистрации',
    );
    expect(tr('en', 'push.newEmployee.body', { fullName: 'John Doe' })).toBe(
      'John Doe is waiting for registration approval',
    );
  });

  it('substitutes several placeholders and stringifies numbers', () => {
    expect(
      tr('en', 'push.newRequest.body', { requestType: 'Vacation', fullName: 'John Doe' }),
    ).toBe('Request submitted: Vacation from John Doe');
    expect(tr('en', 'push.subscriptionExpiring.body', { count: 7 })).toContain('7 days');
  });

  it('leaves an unknown placeholder untouched instead of printing undefined', () => {
    expect(tr('ru', 'push.newEmployee.body', {})).toBe(
      '{{fullName}} ожидает подтверждения регистрации',
    );
  });
});

describe('tr — pluralization', () => {
  it('picks the English one/other forms by count', () => {
    expect(tr('en', 'push.subscriptionExpiring.body', { count: 1 })).toBe(
      'Pay the subscription within 1 day, otherwise access will be suspended.',
    );
    expect(tr('en', 'push.subscriptionExpiring.body', { count: 7 })).toBe(
      'Pay the subscription within 7 days, otherwise access will be suspended.',
    );
  });

  it('picks Russian one / few / many forms by count', () => {
    // one: 1, 21, 31…  few: 2–4  many: 0, 5–20…
    expect(tr('ru', 'push.unclosedShifts.body', { count: 1, names: 'Иван' })).toBe(
      'Сотрудник не закрыл смену: Иван',
    );
    expect(tr('ru', 'push.unclosedShifts.body', { count: 3, names: 'Иван, Пётр' })).toBe(
      'Сотрудники не закрыли смену: Иван, Пётр',
    );
    expect(tr('ru', 'push.unclosedShifts.body', { count: 11, names: 'Иван' })).toBe(
      'Сотрудники не закрыли смену: Иван',
    );
    expect(tr('ru', 'push.unclosedShifts.body', { count: 21, names: 'Иван' })).toBe(
      'Сотрудник не закрыл смену: Иван',
    );
  });

  it('ignores plural forms when count is absent', () => {
    // У непюрализованного ключа тот же вызов работает без count
    expect(tr('ru', 'push.unclosedShifts.title')).toBe('Незакрытые смены');
  });
});
