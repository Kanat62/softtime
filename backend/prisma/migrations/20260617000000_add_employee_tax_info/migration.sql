-- AddColumn: налоговые поля сотрудника для СТИ-161 Раздел III
-- Только ADD COLUMN, ничего не удаляется

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "inn" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "salary" DECIMAL(65,30);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "citizenship" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "is_resident" BOOLEAN NOT NULL DEFAULT true;
