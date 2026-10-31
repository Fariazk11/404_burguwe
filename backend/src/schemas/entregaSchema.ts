// Importa o zod, biblioteca de validação de dados
import { z } from "zod";

// PATCH /entregas/:id/finalizar — o código de 4 dígitos que o cliente informa
export const finalizarEntregaSchema = z.object({
  body: z.object({
    codigo: z
      .string({ message: "Informe o código de entrega" })
      .trim()
      .regex(/^\d{4}$/, { message: "O código de entrega tem 4 números" }),
  }),
});

// PATCH /entregas/:id/cancelar — o motivo é OBRIGATÓRIO (sem ele não cancela)
export const cancelarEntregaSchema = z.object({
  body: z.object({
    motivo: z
      .string({ message: "Informe o motivo do cancelamento" })
      .trim()
      .min(10, { message: "Descreva o motivo do cancelamento (mínimo 10 caracteres)" })
      .max(300, { message: "O motivo deve ter no máximo 300 caracteres" }),
  }),
});
