// Importa o zod, biblioteca de validação de dados
import { z } from "zod";

// Schema de validação para CRIAR um pedido (rota POST /pedidos)
export const createPedidoSchema = z.object({
  body: z
    .object({
      // itens: lista com pelo menos 1 lanche
      itens: z
        .array(
          z.object({
            lancheId: z.string({ message: "O lanche é obrigatório" }),
            quantidade: z
              .number({ message: "A quantidade deve ser um número" })
              .int({ message: "A quantidade deve ser um número inteiro" })
              .min(1, { message: "A quantidade mínima é 1" })
              .max(50, { message: "A quantidade máxima por item é 50" }),
            // observacao: opcional (ex: "sem cebola")
            observacao: z.string().max(200).optional(),
          }),
          { message: "Os itens do pedido são obrigatórios" }
        )
        .min(1, { message: "O pedido precisa ter pelo menos 1 item" }),
      // tipoEntrega: entrega em casa ou retirada no balcão
      tipoEntrega: z.enum(["ENTREGA", "RETIRADA"], {
        message: "O tipo de entrega deve ser ENTREGA ou RETIRADA",
      }),
      // endereco: só é obrigatório na entrega (verificado logo abaixo)
      endereco: z.string().optional(),
      // telefone: obrigatório, com no mínimo 8 dígitos
      telefone: z
        .string({ message: "O telefone é obrigatório" })
        .min(8, { message: "Informe um telefone válido" }),
      formaPagamento: z.enum(["PIX", "CARTAO", "DINHEIRO"], {
        message: "A forma de pagamento deve ser PIX, CARTAO ou DINHEIRO",
      }),
      // trocoPara: opcional, só faz sentido no pagamento em dinheiro
      trocoPara: z
        .number({ message: "O troco deve ser um número" })
        .positive({ message: "O troco deve ser maior que zero" })
        .optional(),
      observacao: z.string().max(300).optional(),
    })
    // Regra extra: se for ENTREGA, o endereço precisa ter no mínimo 5 caracteres
    .refine(
      (data) =>
        data.tipoEntrega === "RETIRADA" ||
        (data.endereco !== undefined && data.endereco.trim().length >= 5),
      { message: "Informe o endereço de entrega", path: ["endereco"] }
    ),
});

// Schema de validação para ALTERAR o status (rota PATCH /pedidos/:id/status)
export const updateStatusPedidoSchema = z.object({
  body: z.object({
    status: z.enum(
      [
        "PENDENTE",
        "EM_PREPARO",
        "PRONTO",
        "SAIU_PARA_ENTREGA",
        "ENTREGUE",
        "CANCELADO",
      ],
      { message: "Status inválido" }
    ),
  }),
});
