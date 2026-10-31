// Carrega as variáveis do .env (precisamos do DATABASE_URL)
import "dotenv/config";
// Importa a função de configuração do Prisma
import { defineConfig } from "prisma/config";

export default defineConfig({
  // Caminho do arquivo onde ficam os models (tabelas)
  schema: "prisma/schema.prisma",
  migrations: {
    // Pasta onde o Prisma salva as migrations (histórico de alterações do banco)
    path: "prisma/migrations",
  },
  datasource: {
    // URL de conexão com o PostgreSQL, lida do .env
    url: process.env["DATABASE_URL"],
  },
});
