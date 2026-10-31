// Importa a conexão com o banco de dados
import prismaClient from "../../prisma";
// Importa o enum de status gerado pelo Prisma
import { StatusPedido } from "../../generated/prisma/client";
import { pedidoInclude } from "./pedidoInclude";

// Lista TODOS os pedidos (painel da equipe), com filtro opcional por status
class ListPedidosService {
  async execute(status?: string) {
    // Se o status enviado não for válido, simplesmente ignora o filtro
    const filtro = Object.values(StatusPedido).includes(status as StatusPedido)
      ? (status as StatusPedido)
      : undefined;

    const pedidos = await prismaClient.pedido.findMany({
      where: { status: filtro },
      include: pedidoInclude,
      // Mais antigos primeiro: a cozinha atende por ordem de chegada
      orderBy: { createdAt: "asc" },
    });

    return pedidos;
  }
}

export { ListPedidosService };
