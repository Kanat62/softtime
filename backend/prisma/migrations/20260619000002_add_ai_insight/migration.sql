-- CreateTable: store latest AI-generated insight per company
CREATE TABLE "AiInsight" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insight" TEXT NOT NULL,
    "aggregates" JSONB NOT NULL,
    "isEnough" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AiInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiInsight_companyId_key" ON "AiInsight"("companyId");
CREATE INDEX "AiInsight_companyId_idx" ON "AiInsight"("companyId");
