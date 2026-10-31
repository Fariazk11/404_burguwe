// Importa o zod, biblioteca de validação de dados
import { z } from "zod";

// Schema de validação para o CADASTRO de usuário (rota POST /users)
export const createUserSchema = z.object({
  // Validamos apenas o body da requisição
  body: z.object({
    // name: texto obrigatório com no mínimo 3 caracteres
    name: z
      .string({ message: "O nome é obrigatório" })
      .min(3, { message: "O nome deve ter no mínimo 3 caracteres" }),
    // email: texto obrigatório e precisa ter formato de e-mail válido
    email: z
      .string({ message: "O e-mail é obrigatório" })
      .email({ message: "Informe um e-mail válido" }),
    // password: texto obrigatório com no mínimo 6 caracteres
    password: z
      .string({ message: "A senha é obrigatória" })
      .min(6, { message: "A senha deve ter no mínimo 6 caracteres" }),
  }),
});

// Schema de validação para o LOGIN (rota POST /session)
export const authUserSchema = z.object({
  body: z.object({
    // email: obrigatório e com formato válido
    email: z
      .string({ message: "O e-mail é obrigatório" })
      .email({ message: "Informe um e-mail válido" }),
    // password: obrigatória (não pode ser vazia)
    password: z
      .string({ message: "A senha é obrigatória" })
      .min(1, { message: "A senha é obrigatória" }),
  }),
});
