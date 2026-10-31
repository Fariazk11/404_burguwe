// Importa a função que gera números aleatórios seguros (para o código de entrega)
import { randomInt } from "crypto";

// Dados relacionados que vêm junto com cada pedido:
// os itens (com nome/imagem do lanche), o cliente e o entregador (sem senhas)
export const pedidoInclude = {
  itens: {
    include: {
      lanche: {
        select: { id: true, nome: true, imagem: true },
      },
    },
  },
  user: {
    select: { id: true, name: true, email: true },
  },
  entregador: {
    select: { id: true, name: true },
  },
};

// Campos que SÓ o cliente dono do pedido pode ver.
// Use em todas as consultas feitas pela equipe (cozinha, garçom, entregador, admin):
//   prismaClient.pedido.findMany({ include: pedidoInclude, omit: pedidoOmitEquipe })
// Assim o entregador nunca recebe o código e não consegue finalizar sem falar com o cliente.
export const pedidoOmitEquipe = {
  codigoEntrega: true,
  tentativasCodigo: true,
} as const;

// Taxa fixa cobrada nos pedidos com entrega
export const TAXA_ENTREGA = 5;

// Quantos códigos errados o entregador pode digitar antes de a finalização travar
export const MAX_TENTATIVAS_CODIGO = 5;

// Gera um código de entrega de 4 dígitos (ex: "0427"), novo a cada pedido
export function gerarCodigoEntrega() {
  return String(randomInt(0, 10000)).padStart(4, "0");
}
