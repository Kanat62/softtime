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
- Access токен в памяти, Refresh в httpOnly cookie
- Таблицы с серверной пагинацией

## Чего НЕ делать
- Не трогать /backend и /mobile
- Не дублировать типы — только @softtime/shared
- Не класть бизнес-логику в компоненты