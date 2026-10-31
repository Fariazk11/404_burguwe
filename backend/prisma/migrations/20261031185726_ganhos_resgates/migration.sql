-- CreateEnum
CREATE TYPE "StatusResgate" AS ENUM ('SOLICITADO', 'PAGO', 'CANCELADO');

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "entregueEm" TIMESTAMP(3),
ADD COLUMN     "ganhoEntregador" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "resgates" (
    "id" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "chavePix" TEXT NOT NULL,
    "status" "StatusResgate" NOT NULL DEFAULT 'SOLICITADO',
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processadoEm" TIMESTAMP(3),
    "entregadorId" TEXT NOT NULL,

    CONSTRAINT "resgates_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "resgates" ADD CONSTRAINT "resgates_entregadorId_fkey" FOREIGN KEY ("entregadorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
