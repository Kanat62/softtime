import { z } from 'zod';

export const companyRequisitesSchema = z.object({
  tax_id: z
    .string()
    .regex(/^\d{14}$/, 'ИНН — ровно 14 цифр')
    .nullable(),
  tax_authority_code: z.string().min(1).nullable(),
  okpo_code: z.string().min(1).max(20).nullable(),
  passport_number: z.string().min(1).max(50).nullable(),
  postal_code: z.string().min(1).max(10).nullable(),
  phone: z.string().min(1).max(30).nullable(),
  address_region: z.string().min(1).max(255).nullable(),
  address_street: z.string().min(1).max(255).nullable(),
  billing_email: z.string().email('Некорректный email').nullable(),
  social_fund_reg_number: z.string().min(1).max(50).nullable(),
  highland_coefficient: z.number().positive().nullable(),
  soate_code: z.string().min(1).nullable(),
  gked_code: z.string().min(1).max(20).nullable(),
  legal_form: z.string().min(1).nullable(),
});

export type CompanyRequisites = z.infer<typeof companyRequisitesSchema>;
