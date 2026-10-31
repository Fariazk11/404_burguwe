// Carrega as variáveis do arquivo .env (PORT, DATABASE_URL, JWT_SECRET) para dentro de process.env
import "dotenv/config";
// Importa o express (framework do servidor) e os tipos usados no middleware de erros
import express, { Request, Response, NextFunction } from "express";
// Importa o cors, que libera o acesso à API a partir de outros endereços (ex: o front-end)
import cors from "cors";
// Importa o arquivo onde estão todas as rotas da aplicação
import { router } from "./routes";

// Cria a aplicação express
const app = express();

// Habilita o recebimento de dados em formato JSON no corpo (body) das requisições
app.use(express.json());
// Habilita o CORS para todas as rotas
app.use(cors());
// Registra as rotas da aplicação
app.use(router);

// Middleware global de tratamento de erros: ele é chamado sempre que algum
// service/controller lança um erro (throw new Error("...")).
// O express identifica que é um middleware de erro porque ele tem 4 parâmetros.
// O "_" na frente de _req e _next indica que esses parâmetros não são usados.
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // Se o erro é uma instância de Error, é um erro "conhecido" lançado por nós
  if (err instanceof Error) {
    // Retorna status 400 (Bad Request) com a mensagem do erro
    return res.status(400).json({
      error: err.message,
    });
  }

  // Caso contrário, é um erro inesperado: retorna status 500
  return res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
});

// Lê a porta definida no .env (se não existir, usa 3333)
const PORT = process.env.PORT || 3333;

// Coloca o servidor para "escutar" requisições na porta definida
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
