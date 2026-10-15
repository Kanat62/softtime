import { apiClient } from "./client";
import { tokenStore } from "./tokenStore";
import { refreshTokenStore } from "./refreshTokenStore";

/** Имя межвкладочной блокировки. */
const LOCK_NAME = "softtime-refresh";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Обменивает refresh-токен на новую пару — под межвкладочной блокировкой.
 *
 * Зачем блокировка. Refresh-токен теперь общий для всех вкладок
 * (localStorage), а на бэкенде он одноразовый: /auth/refresh удаляет
 * использованный токен из Redis. Если две вкладки пойдут обновляться
 * одновременно, вторая предъявит уже погашенный токен и получит 401,
 * то есть пользователя выбросит на /login из-за того, что у него просто
 * открыто две вкладки.
 *
 * Поэтому: берём Web Lock, и уже внутри неё читаем токен из хранилища
 * ЗАНОВО. Вкладка, которая стояла в очереди, таким образом предъявит
 * токен, который успела записать соседняя, а не тот, что прочитала до
 * ожидания.
 *
 * navigator.locks есть во всех современных браузерах, но если его нет,
 * работаем без блокировки — поведение будет как до этой правки.
 *
 * Возвращает null, если токена в хранилище уже нет: соседняя вкладка
 * вышла из системы, пока мы ждали очередь. Для вызывающей стороны это
 * то же самое, что «токена не было с самого начала».
 * Ошибку самого /auth/refresh пробрасывает наружу — решение о logout
 * принимает вызывающий код.
 */
export async function refreshTokensUnderLock(): Promise<TokenPair | null> {
  const run = async (): Promise<TokenPair | null> => {
    // Читаем именно здесь, внутри блокировки, а не из аргумента/кэша.
    const current = refreshTokenStore.get();
    if (!current) return null;

    const { data } = await apiClient.post<TokenPair>("/auth/refresh", {
      refreshToken: current,
    });

    tokenStore.set(data.accessToken);
    refreshTokenStore.set(data.refreshToken);
    return data;
  };

  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  if (!locks?.request) return run();

  return locks.request(LOCK_NAME, run);
}
