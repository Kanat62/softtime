-- Remove tax requisite columns from Company (STI-161 feature removed)
ALTER TABLE "Company"
  DROP COLUMN IF EXISTS "tax_id",
  DROP COLUMN IF EXISTS "tax_authority_code",
  DROP COLUMN IF EXISTS "okpo_code",
  DROP COLUMN IF EXISTS "passport_number",
  DROP COLUMN IF EXISTS "postal_code",
  DROP COLUMN IF EXISTS "phone",
  DROP COLUMN IF EXISTS "address_region",
  DROP COLUMN IF EXISTS "address_street",
  DROP COLUMN IF EXISTS "billing_email",
  DROP COLUMN IF EXISTS "social_fund_reg_number",
  DROP COLUMN IF EXISTS "highland_coefficient",
  DROP COLUMN IF EXISTS "soate_code",
  DROP COLUMN IF EXISTS "gked_code",
  DROP COLUMN IF EXISTS "legal_form";
