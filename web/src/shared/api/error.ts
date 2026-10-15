import type { AxiosError } from "axios";
import { Weekday, type ErrorCodeValue } from "@softtime/shared";
import i18n from "@/shared/i18n";

/**
 * Normalized error shape guaranteed by the transport layer.
 * Every rejected promise from `request()` is one of these.
 */
export interface NormalizedError {
  message: string;
  statusCode: number;
  /** Machine-readable code from the backend, e.g. "QR_INVALID". Language-independent. */
  code?: ErrorCodeValue;
  /** Field-level validation errors keyed by dot-joined Zod path, e.g. { "email": "Invalid email" } */
  fieldErrors?: Record<string, string>;
}

// Backend error body shape per HttpExceptionFilter:
// { statusCode, message, error, code, details?: ZodIssue[], params? }
interface BackendBody {
  statusCode?: number;
  message?: string;
  error?: string;
  code?: string;
  details?: unknown;
  params?: Record<string, unknown>;
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

function isWeekday(v: unknown): v is Weekday {
  return typeof v === "string" && Object.values(Weekday).includes(v as Weekday);
}

/**
 * Translates the error into the UI language by its machine `code`.
 *
 * The backend answers in Russian only, so the text we show comes from the
 * shared dictionary (namespace `errors`, key = the ErrorCode value). When the
 * code is unknown to us — an older or newer backend — we fall back to the
 * server's own `message`, which is the pre-i18n behaviour.
 *
 * `params` carries the values that used to be baked into the message
 * (today only SCHEDULE_MIN_HOURS); `weekday` is itself an enum, so it is
 * translated through the `enums` namespace before interpolation.
 */
function translateByCode(
  code: string | undefined,
  params: Record<string, unknown> | undefined,
  serverMessage: string,
): string {
  if (!code) return serverMessage;

  const key = `errors:${code}`;
  if (!i18n.exists(key)) return serverMessage;

  const values = { ...params };
  if (isWeekday(values.weekday)) {
    values.weekday = i18n.t(`enums:weekdayLong.${values.weekday}`);
  }

  return i18n.t(key, values);
}

export function normalizeError(error: unknown): NormalizedError {
  if (isAxiosError(error)) {
    if (error.response) {
      const body = error.response.data;
      const statusCode = body?.statusCode ?? error.response.status;
      const code = typeof body?.code === "string" ? body.code : undefined;
      const serverMessage =
        body?.message ?? error.message ?? i18n.t("common:genericError");
      const message = translateByCode(code, body?.params, serverMessage);

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
        ...(code ? { code: code as ErrorCodeValue } : {}),
        ...(Object.keys(fieldErrors).length > 0 ? { fieldErrors } : {}),
      };
    }

    // Network error — no response
    return { statusCode: 0, message: i18n.t("common:noServerConnection") };
  }

  return {
    statusCode: 500,
    message: error instanceof Error ? error.message : i18n.t("common:genericError"),
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
