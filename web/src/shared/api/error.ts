import type { AxiosError } from "axios";

/**
 * Normalized error shape guaranteed by the transport layer.
 * Every rejected promise from `request()` is one of these.
 */
export interface NormalizedError {
  message: string;
  statusCode: number;
  /** Field-level validation errors keyed by dot-joined Zod path, e.g. { "email": "Invalid email" } */
  fieldErrors?: Record<string, string>;
}

// Backend error body shape per HttpExceptionFilter:
// { statusCode, message, error, details?: ZodIssue[] }
interface BackendBody {
  statusCode?: number;
  message?: string;
  error?: string;
  details?: unknown;
}

interface ZodIssue {
  path: (string | number)[];
  message: string;
}

function isZodIssueArray(v: unknown): v is ZodIssue[] {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    typeof (v as ZodIssue[])[0].message === "string"
  );
}

function isAxiosError(e: unknown): e is AxiosError<BackendBody> {
  return typeof e === "object" && e !== null && (e as AxiosError).isAxiosError === true;
}

export function normalizeError(error: unknown): NormalizedError {
  if (isAxiosError(error)) {
    if (error.response) {
      const body = error.response.data;
      const statusCode = body?.statusCode ?? error.response.status;
      const message = body?.message ?? error.message ?? "Произошла ошибка";

      const fieldErrors: Record<string, string> = {};
      if (isZodIssueArray(body?.details)) {
        for (const issue of body.details) {
          const key = issue.path.join(".") || "_root";
          // Keep the first error per field
          if (!fieldErrors[key]) fieldErrors[key] = issue.message;
        }
      }

      return {
        statusCode,
        message,
        ...(Object.keys(fieldErrors).length > 0 ? { fieldErrors } : {}),
      };
    }

    // Network error — no response
    return { statusCode: 0, message: "Нет соединения с сервером" };
  }

  return {
    statusCode: 500,
    message: error instanceof Error ? error.message : "Произошла ошибка",
  };
}

/** Type guard — lets catch blocks check if an error came from the API layer */
export function isNormalizedError(e: unknown): e is NormalizedError {
  return (
    typeof e === "object" &&
    e !== null &&
    typeof (e as NormalizedError).statusCode === "number" &&
    typeof (e as NormalizedError).message === "string"
  );
}
