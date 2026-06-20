import { z } from 'zod';

export const assistantAskSchema = z.object({
  question: z
    .string()
    .trim()
    .min(3, 'Вопрос слишком короткий (минимум 3 символа)')
    .max(300, 'Вопрос слишком длинный (максимум 300 символов)'),
});

export type AssistantAskInput = z.infer<typeof assistantAskSchema>;
