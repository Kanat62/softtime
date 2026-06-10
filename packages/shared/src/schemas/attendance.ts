import { z } from 'zod';

/** Request body for POST /attendance/check-in and POST /attendance/check-out */
export const checkInRequestSchema = z.object({
  qrToken: z.string().min(1, 'qrToken обязателен'),
});

export type CheckInRequestDto = z.infer<typeof checkInRequestSchema>;
