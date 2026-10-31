-- AlterEnum
ALTER TYPE "TipoEntrega" ADD VALUE 'MESA';

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "mesa" INTEGER,
ADD COLUMN     "nomeCliente" TEXT,
ALTER COLUMN "telefone" DROP NOT NULL;
