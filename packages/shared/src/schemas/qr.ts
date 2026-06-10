import { z } from 'zod';

/** Регенерация QR — тело POST /qr/regenerate */
export const regenerateQrSchema = z.object({
  /** Привязать новый QR к конкретной офисной сети; null — без привязки */
  officeNetworkId: z.string().uuid().nullable().optional(),
});

export type RegenerateQrDto = z.infer<typeof regenerateQrSchema>;
