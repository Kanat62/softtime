# Feature-Sliced Design — карта проекта

```
src/
  app/        # инициализация: провайдеры, router guards, стили
  pages/      # тонкие страницы: auth/, admin/, provider/
  widgets/    # крупные блоки UI (app-shell, *-table, schedule-editor, ...)
  features/   # действия пользователя (approve-request, edit-schedule, ...)
  entities/   # бизнес-сущности (session, user, company, attendance, ...)
  shared/     # ui / api / lib / config / types — инфраструктура без бизнес-смысла
  routes/     # ТОЛЬКО тонкие обёртки TanStack Start, импортирующие из pages/
  components/ # shims к старым путям (компат); реальный код в shared/ui и widgets/
  lib/        # shim к @/entities/session (компат)
```

Правило импортов: app → pages → widgets → features → entities → shared. Никогда наоборот.
Слайсы одного слоя не импортируют друг друга — композиция в слое выше.

Каждый слайс имеет публичный `index.ts` — внутрь напрямую не лазить.
