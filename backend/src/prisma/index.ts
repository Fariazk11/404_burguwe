// Carrega as variáveis do .env (precisamos do DATABASE_URL)
import "dotenv/config";
// Importa o PrismaClient gerado pelo comando "npx prisma generate"
import { PrismaClient } from "../generated/prisma/client";
// Importa o adaptador do Prisma para o driver "pg" do PostgreSQL
import { PrismaPg } from "@prisma/adapter-pg";

// Cria o adaptador informando a string de conexão com o banco
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});

// Cria o cliente do Prisma usando esse adaptador
const prismaClient = new PrismaClient({ adapter });

// Exporta o cliente para ser usado nos services e middlewares
export default prismaClient;
