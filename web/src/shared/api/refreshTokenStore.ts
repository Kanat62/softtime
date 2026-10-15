/** Ключ хранилища. Экспортирован для слушателя события `storage`. */
export const REFRESH_TOKEN_KEY = "softtime_rt";

const KEY = REFRESH_TOKEN_KEY;

/**
 * Хранилище refresh-токена: localStorage, с откатом в память.
 *
 * Почему localStorage, а не sessionStorage. sessionStorage живёт до
 * закрытия вкладки, и поскольку access-токен лежит в памяти, после
 * закрытия вкладки восстанавливать сессию было нечем — пользователя
 * выбрасывало на /login, хотя на сервере refresh действителен 30 дней.
 *
 * Компромисс по безопасности. В localStorage токен доступен любому JS на
 * странице, то есть при XSS его можно выгрузить и пользоваться до
 * истечения срока. Полностью это закрывает только httpOnly-cookie, но
 * веб живёт на *.vercel.app, а бэкенд на *.railway.app — это разные
 * сайты, cookie была бы сторонней, и Safari (ITP) с инкогнито Chrome её
 * выбрасывают. Пока нет общего домена либо same-origin прокси, остаётся
 * этот вариант. Риск частично гасит одноразовая ротация на бэкенде:
 * /auth/refresh удаляет использованный токен из Redis, поэтому украденный
 * токен перестаёт работать после первого же легального обновления.
 *
 * Хранилище может быть недоступно (приватный режим, запрет на site data,
 * заполненная квота) и бросать на любом обращении, поэтому каждый вызов
 * обёрнут в try/catch, а при недоступности используется память модуля:
 * сессия тогда ведёт себя как раньше — живёт до закрытия вкладки, но
 * ничего не падает.
 */

/** Запасное хранилище, когда localStorage недоступен. */
let memoryToken: string | null = null;

/** Миграция sessionStorage → localStorage выполняется один раз за загрузку. */
let migrated = false;

function readLocal(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function writeLocal(token: string): boolean {
  try {
    localStorage.setItem(KEY, token);
    return true;
  } catch {
    return false;
  }
}

function removeLocal(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* недоступно — нечего удалять */
  }
}

function readSession(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function removeSession(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* недоступно — нечего удалять */
  }
}

/**
 * Переносит токен из sessionStorage, если он там остался с прошлой версии.
 * Без этого все, у кого вкладка открыта с момента до деплоя, потеряли бы
 * сессию при следующем холодном старте. Выполняется один раз и только
 * когда в localStorage пусто — чтобы не перетереть более свежий токен.
 */
function migrateFromSession(): void {
  if (migrated) return;
  migrated = true;

  const legacy = readSession();
  if (!legacy) return;
  if (readLocal() !== null) {
    // В localStorage уже есть токен — он новее, старый просто убираем.
    removeSession();
    return;
  }
  if (writeLocal(legacy)) removeSession();
  else memoryToken = legacy;
}

export const refreshTokenStore = {
  get: (): string | null => {
    migrateFromSession();
    return readLocal() ?? memoryToken;
  },

  set: (token: string): void => {
    migrated = true; // после явной записи миграция не нужна
    if (!writeLocal(token)) memoryToken = token;
    else memoryToken = null;
  },

  clear: (): void => {
    migrated = true;
    memoryToken = null;
    removeLocal();
    // Чистим и прежнее место — иначе забытый там токен снова «оживёт»
    // при следующей миграции.
    removeSession();
  },
};
