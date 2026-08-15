-- CreateEnum
CREATE TYPE "ShipStatus" AS ENUM ('DOCKED', 'IN_TRANSIT');

-- CreateEnum
CREATE TYPE "TradeType" AS ENUM ('BUY', 'SELL');

-- CreateTable
CREATE TABLE "StarSystem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "z" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StarSystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StarLane" (
    "id" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "StarLane_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "volatility" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "attributes" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemResource" (
    "id" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "currentPrice" DOUBLE PRECISION NOT NULL,
    "supply" INTEGER NOT NULL DEFAULT 500,
    "demand" INTEGER NOT NULL DEFAULT 500,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ship" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "credits" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "cargoCapacity" INTEGER NOT NULL DEFAULT 100,
    "status" "ShipStatus" NOT NULL DEFAULT 'DOCKED',
    "currentSystemId" TEXT,
    "destinationSystemId" TEXT,
    "departedAt" TIMESTAMP(3),
    "arrivesAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CargoItem" (
    "id" TEXT NOT NULL,
    "shipId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "CargoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "shipId" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "type" "TradeType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StarSystem_name_key" ON "StarSystem"("name");

-- CreateIndex
CREATE UNIQUE INDEX "StarLane_fromId_toId_key" ON "StarLane"("fromId", "toId");

-- CreateIndex
CREATE UNIQUE INDEX "Resource_name_key" ON "Resource"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SystemResource_systemId_resourceId_key" ON "SystemResource"("systemId", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "CargoItem_shipId_resourceId_key" ON "CargoItem"("shipId", "resourceId");

-- AddForeignKey
ALTER TABLE "StarLane" ADD CONSTRAINT "StarLane_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "StarSystem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StarLane" ADD CONSTRAINT "StarLane_toId_fkey" FOREIGN KEY ("toId") REFERENCES "StarSystem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemResource" ADD CONSTRAINT "SystemResource_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "StarSystem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemResource" ADD CONSTRAINT "SystemResource_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ship" ADD CONSTRAINT "Ship_currentSystemId_fkey" FOREIGN KEY ("currentSystemId") REFERENCES "StarSystem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CargoItem" ADD CONSTRAINT "CargoItem_shipId_fkey" FOREIGN KEY ("shipId") REFERENCES "Ship"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CargoItem" ADD CONSTRAINT "CargoItem_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_shipId_fkey" FOREIGN KEY ("shipId") REFERENCES "Ship"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "StarSystem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
