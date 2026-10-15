import { ArgumentsHost } from '@nestjs/common';
import { ZodValidationException } from 'nestjs-zod';
import { z } from 'zod';
import { loginSchema } from '@softtime/shared';
import { HttpExceptionFilter } from './http-exception.filter';

/**
 * Тесты на перевод details[].message по Accept-Language.
 * Фильтр чистый: подставляем ArgumentsHost и смотрим, что ушло в send().
 */
function hostWith(acceptLanguage?: string) {
  const sent: { status?: number; payload?: any } = {};
  const response = {
    code(status: number) {
      sent.status = status;
      return { send: (payload: any) => (sent.payload = payload) };
    },
  };
  const request = {
    headers: acceptLanguage === undefined ? {} : { 'accept-language': acceptLanguage },
  };
  const host = {
    switchToHttp: () => ({ getResponse: () => response, getRequest: () => request }),
  } as unknown as ArgumentsHost;
  return { host, sent };
}

/** Исключение ровно такое, какое поднимает ZodValidationPipe на этой схеме. */
function zodExceptionFor(schema: z.ZodTypeAny, value: unknown) {
  const result = schema.safeParse(value);
  if (result.success) throw new Error('fixture must be invalid');
  return new ZodValidationException(result.error);
}

describe('HttpExceptionFilter — перевод details по Accept-Language', () => {
  const filter = new HttpExceptionFilter();
  const badLogin = { email: 'not-an-email', password: '' };

  function messagesFor(acceptLanguage?: string) {
    const { host, sent } = hostWith(acceptLanguage);
    filter.catch(zodExceptionFor(loginSchema, badLogin), host);
    expect(sent.status).toBe(400);
    return (sent.payload.details as Array<{ path: string[]; message: string }>).map(
      (d) => [d.path.join('.'), d.message] as const,
    );
  }

  it('Accept-Language: ru — русский', () => {
    expect(messagesFor('ru')).toEqual([
      ['email', 'Некорректный email'],
      ['password', 'Пароль обязателен'],
    ]);
  });

  it('Accept-Language: en — английский', () => {
    expect(messagesFor('en')).toEqual([
      ['email', 'Invalid email address'],
      ['password', 'Password is required'],
    ]);
  });

  it('без заголовка — русский (ответ старым клиентам не меняется)', () => {
    expect(messagesFor(undefined)).toEqual([
      ['email', 'Некорректный email'],
      ['password', 'Пароль обязателен'],
    ]);
  });

  it('неизвестный язык — русский', () => {
    expect(messagesFor('kk')).toEqual([
      ['email', 'Некорректный email'],
      ['password', 'Пароль обязателен'],
    ]);
    expect(messagesFor('de-DE,de;q=0.9')).toEqual([
      ['email', 'Некорректный email'],
      ['password', 'Пароль обязателен'],
    ]);
  });

  it('разбирает первый тег с регионом и весами', () => {
    expect(messagesFor('en-US,en;q=0.9,ru;q=0.8')[0][1]).toBe('Invalid email address');
    expect(messagesFor('EN')[0][1]).toBe('Invalid email address');
    // Первый тег решает: ru впереди — отвечаем по-русски, даже если дальше en
    expect(messagesFor('ru,en;q=0.9')[0][1]).toBe('Некорректный email');
  });

  it('не-ключ остаётся как есть (английский дефолт zod)', () => {
    // .uuid() без message — zod отдаёт свой английский текст
    const schema = z.object({ id: z.string().uuid() });
    const { host, sent } = hostWith('en');
    filter.catch(zodExceptionFor(schema, { id: 'nope' }), host);
    expect(sent.payload.details[0].message).toBe('Invalid uuid');

    const ruCall = hostWith('ru');
    filter.catch(zodExceptionFor(schema, { id: 'nope' }), ruCall.host);
    expect(ruCall.sent.payload.details[0].message).toBe('Invalid uuid');
  });

  it('русский текст локальной схемы контроллера не ломается', () => {
    const schema = z.object({ note: z.string().max(3, 'Слишком длинно') });
    const { host, sent } = hostWith('en');
    filter.catch(zodExceptionFor(schema, { note: 'aaaa' }), host);
    expect(sent.payload.details[0].message).toBe('Слишком длинно');
  });

  it('остальные поля ответа не меняются', () => {
    const { host, sent } = hostWith('en');
    filter.catch(zodExceptionFor(loginSchema, badLogin), host);
    expect(sent.payload.statusCode).toBe(400);
    expect(sent.payload.message).toBe('Validation failed');
    expect(sent.payload.error).toBe('Bad Request');
    expect(sent.payload.code).toBe('VALIDATION_ERROR');
    // path / code каждого issue сохранены
    expect(sent.payload.details[0]).toMatchObject({ path: ['email'], code: 'invalid_string' });
  });

  it('сохраняет форму issue: переводится только message', () => {
    const { host, sent } = hostWith('en');
    filter.catch(zodExceptionFor(loginSchema, badLogin), host);
    const issue = sent.payload.details[0];
    expect(Object.keys(issue).sort()).toEqual(
      ['code', 'message', 'path', 'validation'].sort(),
    );
  });
});
