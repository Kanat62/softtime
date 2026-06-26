ALTER TABLE "Subscription" ALTER COLUMN "priceUsd" SET DEFAULT 10;
UPDATE "Subscription" SET "priceUsd" = 10 WHERE "priceUsd" = 30;
