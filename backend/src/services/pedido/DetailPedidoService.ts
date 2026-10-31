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

    // O dono do pedido vê tudo, inclusive o CÓDIGO DE ENTREGA (que ele informa ao entregador)
    if (pedido.userId === user_id) {
      const { tentativasCodigo, ...paraODono } = pedido;
      return paraODono;
    }

    // Fora o dono, só a COZINHA e o ADMIN podem ver o pedido — e SEM o código de entrega
    const user = await prismaClient.user.findFirst({ where: { id: user_id } });

    if (!user || (user.role !== "ADMIN" && user.role !== "COZINHA")) {
      throw new Error("Pedido não encontrado");
    }

    const { codigoEntrega, tentativasCodigo, ...paraAEquipe } = pedido;
    return paraAEquipe;
  }
}

export { DetailPedidoService };
