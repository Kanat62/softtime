-- Drop old composite unique constraint (companyId, email)
DROP INDEX IF EXISTS "User_companyId_email_key";

-- Add global unique constraint on email alone
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
