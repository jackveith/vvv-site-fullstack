/*
  Warnings:

  - You are about to drop the column `size` on the `StarSystem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "StarSystem" DROP COLUMN "size",
ADD COLUMN     "radius" DOUBLE PRECISION NOT NULL DEFAULT 4;
