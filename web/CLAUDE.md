# SoftTime — Web

## Контекст

Читай перед задачей: docs/web.md, docs/design.md, docs/web-fsd.md

## Стек

React + Vite + TypeScript + shadcn/ui + Tailwind +
TanStack Query + TanStack Table + Recharts + React Router v7

## Команды

- Запуск: npm run dev
- Сборка: npm run build

## Архитектура

Feature-Sliced Design (FSD).
Структура: app/ pages/ widgets/ features/ entities/ shared/
Подробно в docs/web-fsd.md

## Правила

- Все типы из @softtime/shared — не дублировать
- Дизайн строго по docs/design.md (Manrope, цвета из палитры)
- ADMIN видит только свою компанию (company_id изоляция на backend)
- PROVIDER видит все компании
- WORKER на вебе не регистрируется — формы нет
- Токены: access — в памяти модуля (`shared/api/tokenStore.ts`), живёт до
  перезагрузки страницы; refresh — в `localStorage` под ключом `softtime_rt`
  (`shared/api/refreshTokenStore.ts`), поэтому сессия переживает и F5, и
  закрытие вкладки. httpOnly-cookie для refresh **не используется**: бэкенд
  присылает оба токена в JSON-теле, cookie-слоя на нём нет. Перейти на
  cookie мешают разные сайты у веба (*.vercel.app) и бэкенда
  (*.railway.app) — cookie была бы сторонней и блокировалась Safari/инкогнито;
  нужен общий домен либо same-origin прокси.
- Обновление пары идёт через `shared/api/refreshSession.ts` под
  `navigator.locks`: refresh-токен одноразовый (бэкенд гасит его в Redis),
  а localStorage общий для вкладок, поэтому без блокировки две вкладки
  гасили бы сессию друг другу. Выход в одной вкладке остальные замечают
  по событию `storage`.
- Таблицы с серверной пагинацией

## Чего НЕ делать

- Не трогать /backend и /mobile
- Не дублировать типы — только @softtime/shared
- Не класть бизнес-логику в компоненты
