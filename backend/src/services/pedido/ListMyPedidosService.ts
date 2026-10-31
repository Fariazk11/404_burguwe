// Importa a conexão com o banco de dados
import prismaClient from "../../prisma";
import { pedidoInclude } from "./pedidoInclude";

// Lista os pedidos do usuário logado (tela "Meus pedidos")
class ListMyPedidosService {
  async execute(user_id: string) {
    const pedidos = await prismaClient.pedido.findMany({
      where: { userId: user_id },
      include: pedidoInclude,
      // Mais recentes primeiro
      orderBy: { createdAt: "desc" },
    });

    return pedidos;
  }
}

export { ListMyPedidosService };
