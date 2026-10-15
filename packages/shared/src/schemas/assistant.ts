import { z } from 'zod';

export const assistantAskSchema = z.object({
  question: z
    .string()
    .trim()
    .min(3, 'validation:assistant.questionMin')
    .max(300, 'validation:assistant.questionMax'),
});

export type AssistantAskInput = z.infer<typeof assistantAskSchema>;
