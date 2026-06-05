# SoftTime — Backend

## Контекст
Читай перед задачей: docs/platform.md и docs/backend.md

## Стек
NestJS + Prisma + PostgreSQL + Redis + Zod (nestjs-zod)

## Команды
- Запуск: npm run start:dev
- Миграции: npx prisma migrate dev
- Тесты: npm test

## Архитектура
Модульная NestJS: modules/ → controllers/ → services/ → prisma/
Подробно в docs/backend.md раздел 2

## Правила
- Все типы из @softtime/shared — не дублировать
- Prisma-схема строго по docs/backend.md раздел 5
- Каждый запрос ADMIN/WORKER фильтровать по company_id
- Tenant-изоляция через Prisma Client Extensions
- bcrypt cost 12, пароль мин 8 символов
- JWT: access 15 мин (в памяти), refresh 30 дней (Redis)
- Soft delete через deleted_at (кроме office_networks)
- Все действия ADMIN/PROVIDER логировать в audit_logs
- Платёжный шлюз — только абстрактный слой, без реализации

## Чего НЕ делать
- Не трогать /web и /mobile
- Не хардкодить секреты — только .env
- Не писать бизнес-логику в контроллерах