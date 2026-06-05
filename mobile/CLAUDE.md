# SoftTime — Mobile

## Контекст
Читай перед задачей: docs/mobile.md, docs/design.md, docs/mobile-fsd.md

## Стек
React Native (TypeScript) + React Navigation v7 +
TanStack Query + react-hook-form + Zod + vision-camera + FCM

## Команды
- Запуск: npm start
- iOS: npm run ios
- Android: npm run android

## Архитектура
Строго Feature-Sliced Design (FSD).
Структура: app/ screens/ widgets/ features/ entities/ shared/
Подробно в docs/mobile-fsd.md

## Правила
- Все типы из @softtime/shared — не дублировать
- Дизайн строго по docs/design.md
  (шрифт Manrope, цвета только из палитры, Lucide иконки)
- Токены в Secure Storage (Keychain/Keystore) — не AsyncStorage
- Check-in/out только через QR + IP (верификация на backend)
- Компания SUSPENDED — блокировать кнопки прихода/ухода
- Офлайн — не выполнять действия с эффектами без сети
- Навигационные гарды в app/navigation/RootNavigator

## Чего НЕ делать
- Не трогать /backend и /web
- Не дублировать типы — только @softtime/shared
- Не класть бизнес-логику в компоненты — только в model/
- Не использовать AsyncStorage для токенов