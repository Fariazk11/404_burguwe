// Importa o zod, biblioteca de validação de dados
import { z } from "zod";

// Campos de um lanche e suas regras (usados no cadastro e na edição)
const lancheFields = {
  // nome: texto obrigatório com no mínimo 2 caracteres (ex: "X-Bacon")
  nome: z
    .string({ message: "O nome do lanche é obrigatório" })
    .min(2, { message: "O nome do lanche deve ter no mínimo 2 caracteres" }),
  // descricao: texto obrigatório com no mínimo 5 caracteres
  descricao: z
    .string({ message: "A descrição é obrigatória" })
    .min(5, { message: "A descrição deve ter no mínimo 5 caracteres" }),
  // preco: número obrigatório e maior que zero (ex: 29.90)
  preco: z
    .number({ message: "O preço deve ser um número" })
    .positive({ message: "O preço deve ser maior que zero" }),
  // ingredientes: texto obrigatório com no mínimo 3 caracteres
  ingredientes: z
    .string({ message: "Os ingredientes são obrigatórios" })
    .min(3, { message: "Os ingredientes devem ter no mínimo 3 caracteres" }),
  // tamanho: só aceita um destes três valores
  tamanho: z.enum(["Pequeno", "Médio", "Grande"], {
    message: "O tamanho deve ser Pequeno, Médio ou Grande",
  }),
  // calorias: número inteiro e maior que zero (ex: 850)
  calorias: z
    .number({ message: "As calorias devem ser um número" })
    .int({ message: "As calorias devem ser um número inteiro" })
    .positive({ message: "As calorias devem ser maiores que zero" }),
  // imagem: URL de uma foto, opcional (string vazia ou null removem a foto)
  imagem: z
    .union([z.url({ message: "A imagem deve ser uma URL válida" }), z.literal(""), z.null()])
    .optional(),
  // disponivel: verdadeiro/falso, opcional (no banco o padrão é true)
  disponivel: z
    .boolean({ message: "O campo disponivel deve ser true ou false" })
    .optional(),
};

// Schema de validação para o CADASTRO de lanche (rota POST /lanches)
export const createLancheSchema = z.object({
  // Validamos apenas o body da requisição
  body: z.object(lancheFields),
});

// Schema de validação para a EDIÇÃO de lanche (rota PUT /lanches/:id)
// .partial() deixa todos os campos opcionais: só é alterado o que for enviado
export const updateLancheSchema = z.object({
  body: z.object(lancheFields).partial(),
});
