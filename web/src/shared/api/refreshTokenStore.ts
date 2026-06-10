const KEY = "softtime_rt";

/**
 * sessionStorage-backed refresh token store.
 * sessionStorage survives page refresh within the same tab but is cleared
 * when the tab is closed — better security than localStorage for long-lived tokens.
 * The backend sends the refresh token in the JSON body (not httpOnly cookie).
 */
export const refreshTokenStore = {
  get: (): string | null => {
    try {
      return sessionStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  set: (token: string): void => {
    try {
      sessionStorage.setItem(KEY, token);
    } catch {}
  },
  clear: (): void => {
    try {
      sessionStorage.removeItem(KEY);
    } catch {}
  },
};
