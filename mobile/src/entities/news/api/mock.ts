import type { News } from '@softtime/shared';

export type NewsWithRead = News & { isRead: boolean };

export const mockNews: NewsWithRead[] = [
  {
    id: 'news-001',
    companyId: 'company-001',
    title: 'Корпоративное мероприятие 20 июня',
    body: 'В пятницу, 20 июня, состоится командный выезд на базу отдыха. Автобус отправляется в 17:30 от главного входа офиса.\n\nМесто: база «Лесная поляна», Подмосковье. Программа включает командные игры, барбекю и вечерние посиделки у костра.\n\nОбязательно подтвердите участие у HR-менеджера до 15 июня. Форма одежды — спортивная. Ждём всех!',
    photoUrl: null,
    createdBy: 'user-admin-001',
    createdAt: new Date('2026-06-07T08:00:00'),
    isRead: false,
  },
  {
    id: 'news-002',
    companyId: 'company-001',
    title: 'График работы в праздничные дни',
    body: 'Уважаемые коллеги, сообщаем, что в период с 12 по 14 июня офис работает в сокращённом режиме: с 10:00 до 16:00.\n\nПросим учесть это при планировании рабочего времени. Встречи с клиентами в эти дни рекомендуется перенести.\n\nРуководство благодарит всех сотрудников за понимание и гибкость.',
    photoUrl: null,
    createdBy: 'user-admin-001',
    createdAt: new Date('2026-06-05T10:00:00'),
    isRead: true,
  },
  {
    id: 'news-003',
    companyId: 'company-001',
    title: 'Новая система учёта рабочего времени',
    body: 'С 1 июля вводится обязательная регистрация прихода и ухода через QR-код. Убедитесь, что на вашем телефоне установлено приложение SoftTime.\n\nОбучение по работе с системой пройдёт 25 июня в 11:00 в переговорной комнате на 2-м этаже. Присутствие обязательно для всех сотрудников.\n\nПо вопросам обращайтесь к IT-отделу.',
    photoUrl: null,
    createdBy: 'user-admin-001',
    createdAt: new Date('2026-05-28T09:30:00'),
    isRead: true,
  },
];

// Module-level mutable state — shared between NewsFeedScreen and NewsDetailScreen
export let currentMockNews: NewsWithRead[] = [...mockNews];

export function addMockNews(news: NewsWithRead): void {
  currentMockNews = [news, ...currentMockNews];
}
