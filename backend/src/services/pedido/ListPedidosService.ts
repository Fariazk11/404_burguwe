// Importa a conexão com o banco de dados
import prismaClient from "../../prisma";
// Importa o enum de status gerado pelo Prisma
import { StatusPedido } from "../../generated/prisma/client";
import { pedidoInclude } from "./pedidoInclude";

// Lista os pedidos da equipe, com filtro opcional por status
// - ADMIN e COZINHA: veem TODOS os pedidos (painel da cozinha)
// - STAFF (funcionário): vê SOMENTE os pedidos de mesa que ele mesmo lançou
class ListPedidosService {
  async execute(status: string | undefined, user_id: string, role: string) {
    // Se o status enviado não for válido, simplesmente ignora o filtro
    const filtro = Object.values(StatusPedido).includes(status as StatusPedido)
      ? (status as StatusPedido)
      : undefined;

    const somenteDoFuncionario =
      (role === "ADMIN" || role === "COZINHA") ? {} : { userId: user_id, tipoEntrega: "MESA" as const };

    const pedidos = await prismaClient.pedido.findMany({
      where: { status: filtro, ...somenteDoFuncionario },
      include: pedidoInclude,
      // Mais antigos primeiro: a cozinha atende por ordem de chegada
      orderBy: { createdAt: "asc" },
    });

    return pedidos;
  }
}

export { ListPedidosService };
