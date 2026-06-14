-- CreateTable
CREATE TABLE "CompanyDefaultSchedule" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "weekday" "Weekday" NOT NULL,
    "isWorkingDay" BOOLEAN NOT NULL DEFAULT true,
    "startTime" TEXT,
    "endTime" TEXT,
    "autoCheckoutBuffer" INTEGER NOT NULL DEFAULT 60,

    CONSTRAINT "CompanyDefaultSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyDefaultSchedule_companyId_idx" ON "CompanyDefaultSchedule"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyDefaultSchedule_companyId_weekday_key" ON "CompanyDefaultSchedule"("companyId", "weekday");
