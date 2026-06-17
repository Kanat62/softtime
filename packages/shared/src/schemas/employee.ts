import { z } from 'zod';

export const employeeTaxInfoSchema = z.object({
  inn: z
    .string()
    .regex(/^\d{14}$/, 'ИНН — ровно 14 цифр')
    .nullable(),
  citizenship: z.string().min(1).max(100).nullable(),
  isResident: z.boolean().default(true),
  hiredAt: z.coerce.date().nullable(),
});

export type EmployeeTaxInfo = z.infer<typeof employeeTaxInfoSchema>;

export const employeeSalarySchema = z.object({
  salary: z.number().min(0).nullable(),
});

export type EmployeeSalary = z.infer<typeof employeeSalarySchema>;
