// Importa a conexão com o banco de dados
import prismaClient from "../../prisma";
import { pedidoInclude } from "./pedidoInclude";

// Lista os pedidos do usuário logado (tela "Meus pedidos")
class ListMyPedidosService {
  async execute(user_id: string) {
    const pedidos = await prismaClient.pedido.findMany({
      // Pedidos de MESA ficam no nome do funcionário que lançou, mas não são "dele":
      // por isso não aparecem aqui (a equipe vê esses pedidos na tela de Mesas/Cozinha)
      where: { userId: user_id, tipoEntrega: { not: "MESA" } },
      include: pedidoInclude,
      // O cliente vê o próprio código de entrega; só o contador de tentativas fica de fora
      omit: { tentativasCodigo: true },
      // Mais recentes primeiro
      orderBy: { createdAt: "desc" },
    });

    return pedidos;
  }
}

export { ListMyPedidosService };
