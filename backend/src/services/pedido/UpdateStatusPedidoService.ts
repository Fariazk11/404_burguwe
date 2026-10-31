// Importa a conexão com o banco de dados
import prismaClient from "../../prisma";
import { StatusPedido } from "../../generated/prisma/client";
import { pedidoInclude } from "./pedidoInclude";

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

    const pedidoAtualizado = await prismaClient.pedido.update({
      where: { id: id },
      data: { status: status },
      include: pedidoInclude,
    });

    return pedidoAtualizado;
  }
}

export { UpdateStatusPedidoService };
