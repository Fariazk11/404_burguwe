// Importa a conexão com o banco de dados
import prismaClient from "../../prisma";
import { pedidoInclude } from "./pedidoInclude";

// Busca os detalhes de um pedido (tela de acompanhamento)
class DetailPedidoService {
  async execute(id: string, user_id: string) {
    const pedido = await prismaClient.pedido.findFirst({
      where: { id: id },
      include: pedidoInclude,
    });

    if (!pedido) {
      throw new Error("Pedido não encontrado");
    }

    // Só o dono do pedido (cliente, ou o garçom que lançou a mesa), a COZINHA ou o ADMIN pode ver
    if (pedido.userId !== user_id) {
      const user = await prismaClient.user.findFirst({ where: { id: user_id } });

      if (!user || (user.role !== "ADMIN" && user.role !== "COZINHA")) {
        throw new Error("Pedido não encontrado");
      }
    }

    return pedido;
  }
}

export { DetailPedidoService };
