/*
  Warnings:

  - You are about to drop the column `original_content` on the `reports` table. All the data in the column will be lost.
  - Added the required column `description` to the `reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `incident_time` to the `reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zone` to the `reports` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Zone" AS ENUM ('TERMINAL_1', 'TERMINAL_2', 'PORTES_EMBARQUEMENT', 'ZONE_DOUANES', 'PARKING', 'HALL_ARRIVEE', 'HALL_DEPART', 'ZONE_TRANSIT', 'AUTRE');

-- AlterTable
ALTER TABLE "reports" DROP COLUMN "original_content",
ADD COLUMN     "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "custom_zone" TEXT,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "incident_time" VARCHAR(10) NOT NULL,
ADD COLUMN     "zone" "Zone" NOT NULL;
