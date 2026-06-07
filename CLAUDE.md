# SoftTime — Монорепозиторий

## Структура
- /backend   — NestJS API (разраб: ты)
- /mobile    — React Native (разраб: ты)
- /web       — React веб-панель (разраб: другой, НЕ ТРОГАТЬ)
- /packages/shared — общие типы и Zod-схемы (используют все)
- /docs      — все ТЗ

## Документация
- docs/platform.md  — общее ТЗ (роли, статусы, бизнес-правила)
- docs/backend.md   — backend ТЗ
- docs/mobile.md    — mobile ТЗ
- docs/web.md       — веб ТЗ
- docs/design.md    — дизайн-система
- docs/mobile-fsd.md — FSD мобилки
- docs/web-fsd.md   — FSD веба

## Общие правила (для всех частей)
- Типы и Zod-схемы — только из packages/shared
- UUID primary key везде
- Tenant-изоляция по company_id
- Шрифт Manrope, цвета строго из docs/design.md

## packages/shared — что внутри

Единый источник типов для backend и mobile. НЕ дублировать.

Импорт:
import { UserRole, UserStatus } from '@softtime/shared'
import { registerWorkerSchema } from '@softtime/shared'

Что там есть:
- src/enums/ — все enum'ы (UserRole, UserStatus, CompanyStatus,
  SubStatus, CheckInStatus, CheckOutStatus, DayStatus,
  RequestType, RequestStatus, PaymentStatus, Weekday)
- src/types/ — интерфейсы (User, Company, Attendance,
  EmployeeSchedule, AbsenceRequest, Subscription, Payment...)
- src/schemas/auth.ts — registerCompanySchema,
  registerWorkerSchema, loginSchema
- src/schemas/schedule.ts — scheduleSchema (мин 6ч, буфер 60мин)
- src/schemas/request.ts — absenceRequestSchema

# Правила работы

## Ограничения
- Работай ТОЛЬКО внутри текущей директории проекта
- НЕ изменяй и НЕ читай файлы за пределами текущей папки проекта
- НЕ запускай команды, которые затрагивают файлы вне проекта
- При любых сомнениях — спроси перед выполнением

## Разрешено
- Любые изменения внутри проекта
- npm, git, node команды
- Создание, редактирование, удаление файлов внутри проекта