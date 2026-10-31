// Importa a conexão com o banco de dados
import prismaClient from "../../prisma";
import { StatusPedido } from "../../generated/prisma/client";
import { pedidoInclude, pedidoOmitEquipe } from "./pedidoInclude";

// Altera o status de um pedido (usado pela equipe no painel)
class UpdateStatusPedidoService {
  async execute(id: string, status: StatusPedido, user_id: string, role: string) {
    const pedido = await prismaClient.pedido.findFirst({
      where: { id: id },
    });

    // Garçom (STAFF) só mexe nos pedidos que ele mesmo lançou;
    // para ele, o pedido de outra pessoa "não existe"
    if (!pedido || (role === "STAFF" && pedido.userId !== user_id)) {
      throw new Error("Pedido não encontrado");
    }

    // Pedidos finalizados não podem mais mudar
    if (pedido.status === "ENTREGUE" || pedido.status === "CANCELADO") {
      throw new Error("Este pedido já foi finalizado");
    }

    // Só pedidos de ENTREGA "saem para entrega" (retirada e mesa não)
    if (status === "SAIU_PARA_ENTREGA" && pedido.tipoEntrega !== "ENTREGA") {
      throw new Error(
        pedido.tipoEntrega === "MESA"
          ? "Pedidos de mesa não saem para entrega"
          : "Pedidos de retirada não saem para entrega"
      );
    }

    // Nos pedidos de ENTREGA, quem leva e finaliza é o ENTREGADOR (tela Entregas):
    // - "Saiu para entrega" só acontece quando um entregador aceita
    // - "Entregue" só com o código do cliente (o ADMIN pode forçar em caso de problema)
    if (pedido.tipoEntrega === "ENTREGA") {
      if (status === "SAIU_PARA_ENTREGA") {
        throw new Error("O pedido sai para entrega quando um entregador aceita na tela Entregas");
      }
      if (status === "ENTREGUE" && role !== "ADMIN") {
        throw new Error("A entrega só é finalizada pelo entregador, com o código do cliente");
      }
    }

    const pedidoAtualizado = await prismaClient.pedido.update({
      where: { id: id },
      data: { status: status },
      include: pedidoInclude,
      omit: pedidoOmitEquipe,
    });

    return pedidoAtualizado;
  }
}

export { UpdateStatusPedidoService };
