export interface JwtPayload {
  sub: string;
  role: string;
  status: string;
  companyId: string | null;
  iat: number;
  exp: number;
}

/**
 * Decodes the payload of a JWT without verifying the signature.
 * Safe to use client-side for reading claims (role, status, etc.).
 * Returns null if the token is malformed.
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    // Unicode-safe decode
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonStr) as JwtPayload;
  } catch {
    return null;
  }
}
