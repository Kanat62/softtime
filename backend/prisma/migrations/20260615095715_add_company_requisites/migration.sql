-- AlterTable: add nullable tax requisite columns to Company (СТИ-161-6)
ALTER TABLE "Company"
  ADD COLUMN IF NOT EXISTS "tax_id"                TEXT,
  ADD COLUMN IF NOT EXISTS "tax_authority_code"    TEXT,
  ADD COLUMN IF NOT EXISTS "okpo_code"             TEXT,
  ADD COLUMN IF NOT EXISTS "passport_number"       TEXT,
  ADD COLUMN IF NOT EXISTS "postal_code"           TEXT,
  ADD COLUMN IF NOT EXISTS "phone"                 TEXT,
  ADD COLUMN IF NOT EXISTS "address_region"        TEXT,
  ADD COLUMN IF NOT EXISTS "address_street"        TEXT,
  ADD COLUMN IF NOT EXISTS "billing_email"         TEXT,
  ADD COLUMN IF NOT EXISTS "social_fund_reg_number" TEXT,
  ADD COLUMN IF NOT EXISTS "highland_coefficient"  DECIMAL,
  ADD COLUMN IF NOT EXISTS "soate_code"            TEXT,
  ADD COLUMN IF NOT EXISTS "gked_code"             TEXT,
  ADD COLUMN IF NOT EXISTS "legal_form"            TEXT;
