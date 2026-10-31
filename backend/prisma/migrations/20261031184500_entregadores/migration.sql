-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'ENTREGADOR';

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "codigoEntrega" TEXT,
ADD COLUMN     "entregadorId" TEXT,
ADD COLUMN     "motivoCancelamento" TEXT,
ADD COLUMN     "tentativasCodigo" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_entregadorId_fkey" FOREIGN KEY ("entregadorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
