// Importa a conexão com o banco de dados
import prismaClient from "../../prisma";
import { StatusPedido } from "../../generated/prisma/client";
import { pedidoInclude } from "./pedidoInclude";

// Altera o status de um pedido (usado pela equipe no painel)
class UpdateStatusPedidoService {
  async execute(id: string, status: StatusPedido) {
    const pedido = await prismaClient.pedido.findFirst({
      where: { id: id },
    });

    if (!pedido) {
      throw new Error("Pedido não encontrado");
    }

    // Pedidos finalizados não podem mais mudar
    if (pedido.status === "ENTREGUE" || pedido.status === "CANCELADO") {
      throw new Error("Este pedido já foi finalizado");
    }

    // Pedido de retirada nunca "sai para entrega"
    if (status === "SAIU_PARA_ENTREGA" && pedido.tipoEntrega === "RETIRADA") {
      throw new Error("Pedidos de retirada não saem para entrega");
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
