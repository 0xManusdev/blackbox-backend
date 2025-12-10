-- CreateTable
CREATE TABLE "reports" (
    "id" SERIAL NOT NULL,
    "original_content" TEXT NOT NULL,
    "anonymized_content" TEXT NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "severity" VARCHAR(50) NOT NULL,
    "ai_analysis" TEXT NOT NULL,
    "content_hash" VARCHAR(66) NOT NULL,
    "blockchain_tx_hash" VARCHAR(66) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);
