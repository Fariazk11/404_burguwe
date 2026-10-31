// Importa os tipos do express usados em um middleware
import { Request, Response, NextFunction } from "express";
// Importa do zod o tipo genérico de schema e a classe de erro de validação
import { ZodType, ZodError } from "zod";

// Função que recebe um schema do Zod e devolve um middleware que valida a requisição
export const validateSchema =
  (schema: ZodType) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Valida o body, a query e os params da requisição de acordo com o schema
      // parseAsync lança um ZodError se algum dado estiver inválido
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Se passou na validação, segue para o próximo middleware/controller
      return next();
    } catch (error) {
      // Se o erro veio do Zod, formata as mensagens para o cliente
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Erro de validação",
          // Para cada problema encontrado, retorna o campo e a mensagem
          details: error.issues.map((issue) => ({
            // issue.path é algo como ["body", "email"]; o slice(1) remove o "body"
            campo: issue.path.slice(1).join("."),
            mensagem: issue.message,
          })),
        });
      }

      // Qualquer outro erro inesperado retorna 500
      return res.status(500).json({ error: "Internal server error" });
    }
  };
