import { z } from 'zod';

/** Request body for POST /devices — register FCM token */
export const registerDeviceSchema = z.object({
  fcmToken: z.string().min(1, 'validation:required.fcmToken'),
  platform: z.enum(['ios', 'android']),
});

export type RegisterDeviceDto = z.infer<typeof registerDeviceSchema>;
