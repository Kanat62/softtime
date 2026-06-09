/** In-memory access token. Lives only for the duration of the browser tab. */
let _token: string | null = null;

export const tokenStore = {
  get: (): string | null => _token,
  set: (token: string | null): void => {
    _token = token;
  },
};
