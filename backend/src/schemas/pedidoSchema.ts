// Importa o zod, biblioteca de validação de dados
import { z } from "zod";

// itens: lista com pelo menos 1 lanche (usada no pedido do site e no pedido da mesa)
const itensSchema = z
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
  .min(1, { message: "O pedido precisa ter pelo menos 1 item" });

// Formas de pagamento aceitas
const formaPagamentoSchema = z.enum(["PIX", "CARTAO", "DINHEIRO"], {
  message: "A forma de pagamento deve ser PIX, CARTAO ou DINHEIRO",
});

// trocoPara: opcional, só faz sentido no pagamento em dinheiro
const trocoParaSchema = z
  .number({ message: "O troco deve ser um número" })
  .positive({ message: "O troco deve ser maior que zero" })
  .optional();

// Schema de validação para CRIAR um pedido (rota POST /pedidos)
export const createPedidoSchema = z.object({
  body: z
    .object({
      itens: itensSchema,
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
      formaPagamento: formaPagamentoSchema,
      trocoPara: trocoParaSchema,
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

// Schema de validação para o FUNCIONÁRIO lançar o pedido de uma mesa (rota POST /pedidos/mesa)
export const createPedidoMesaSchema = z.object({
  body: z.object({
    itens: itensSchema,
    // mesa: número inteiro entre 1 e 999
    mesa: z
      .number({ message: "Informe o número da mesa" })
      .int({ message: "O número da mesa deve ser inteiro" })
      .min(1, { message: "O número da mesa deve ser maior que zero" })
      .max(999, { message: "Número de mesa inválido" }),
    // nomeCliente: opcional (ajuda o garçom a achar a pessoa na mesa)
    nomeCliente: z.string().max(60, { message: "O nome deve ter no máximo 60 caracteres" }).optional(),
    formaPagamento: formaPagamentoSchema,
    trocoPara: trocoParaSchema,
    observacao: z.string().max(300).optional(),
  }),
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
