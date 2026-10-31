// Importa a conexão com o banco de dados
import prismaClient from "../../prisma";
import { pedidoInclude } from "./pedidoInclude";

// O próprio cliente cancela o pedido (só enquanto a cozinha não começou)
class CancelPedidoService {
  async execute(id: string, user_id: string) {
    const pedido = await prismaClient.pedido.findFirst({
      where: { id: id, userId: user_id },
    });

    if (!pedido) {
      throw new Error("Pedido não encontrado");
    }

    if (pedido.status !== "PENDENTE") {
      throw new Error("O pedido já está em preparo e não pode mais ser cancelado");
    }

    const pedidoCancelado = await prismaClient.pedido.update({
      where: { id: id },
      data: { status: "CANCELADO" },
      include: pedidoInclude,
    });

    return pedidoCancelado;
  }
}

export { CancelPedidoService };
