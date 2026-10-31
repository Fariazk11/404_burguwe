// Importa a conexão com o banco de dados
import prismaClient from "../../prisma";
import {
  gerarCodigoEntrega,
  MAX_TENTATIVAS_CODIGO,
  pedidoInclude,
  pedidoOmitEquipe,
} from "../pedido/pedidoInclude";

// Regras da tela "Entregas" (perfil ENTREGADOR).
// O entregador só pode: ACEITAR uma entrega pronta, FINALIZAR com o código do cliente
// ou CANCELAR informando o motivo. Ele nunca recebe o código de entrega.

// Entregas prontas que ainda não têm entregador (mais antigas primeiro)
class ListEntregasDisponiveisService {
  async execute() {
    return prismaClient.pedido.findMany({
      where: { tipoEntrega: "ENTREGA", status: "PRONTO", entregadorId: null },
      include: pedidoInclude,
      omit: pedidoOmitEquipe,
      orderBy: { createdAt: "asc" },
    });
  }
}

// Todas as entregas que ESTE entregador aceitou (em andamento e histórico)
class ListMinhasEntregasService {
  async execute(entregador_id: string) {
    return prismaClient.pedido.findMany({
      where: { entregadorId: entregador_id },
      include: pedidoInclude,
      omit: pedidoOmitEquipe,
      orderBy: { updatedAt: "desc" },
    });
  }
}

// Aceitar: o pedido passa para "Saiu para entrega" no nome do entregador.
// O updateMany com todas as condições no "where" garante que, se dois entregadores
// clicarem ao mesmo tempo, só UM consegue (o outro recebe "não está mais disponível").
class AceitarEntregaService {
  async execute(id: string, entregador_id: string) {
    const atual = await prismaClient.pedido.findFirst({ where: { id } });

    const resultado = await prismaClient.pedido.updateMany({
      where: { id, tipoEntrega: "ENTREGA", status: "PRONTO", entregadorId: null },
      data: {
        entregadorId: entregador_id,
        status: "SAIU_PARA_ENTREGA",
        // Pedidos antigos (de antes dos entregadores) ganham um código agora
        ...(atual && !atual.codigoEntrega ? { codigoEntrega: gerarCodigoEntrega() } : {}),
      },
    });

    if (resultado.count === 0) {
      throw new Error("Esta entrega não está mais disponível");
    }

    return prismaClient.pedido.findFirst({ where: { id }, include: pedidoInclude, omit: pedidoOmitEquipe });
  }
}

// Busca uma entrega em andamento DESTE entregador (usado em finalizar e cancelar)
async function buscarEntregaEmAndamento(id: string, entregador_id: string) {
  const pedido = await prismaClient.pedido.findFirst({
    where: { id, entregadorId: entregador_id, tipoEntrega: "ENTREGA" },
  });

  if (!pedido) {
    throw new Error("Entrega não encontrada");
  }

  if (pedido.status !== "SAIU_PARA_ENTREGA") {
    throw new Error("Esta entrega não está mais em andamento");
  }

  return pedido;
}

// Finalizar: só com o código que o cliente vê na página do pedido.
// Depois de 5 códigos errados a finalização trava (evita adivinhar o código).
class FinalizarEntregaService {
  async execute(id: string, entregador_id: string, codigo: string) {
    const pedido = await buscarEntregaEmAndamento(id, entregador_id);

    if (pedido.tentativasCodigo >= MAX_TENTATIVAS_CODIGO) {
      throw new Error(
        "Finalização bloqueada: o código foi digitado errado 5 vezes. Fale com a loja ou cancele informando o motivo."
      );
    }

    if (codigo.trim() !== pedido.codigoEntrega) {
      const atualizado = await prismaClient.pedido.update({
        where: { id },
        data: { tentativasCodigo: { increment: 1 } },
      });
      const restantes = MAX_TENTATIVAS_CODIGO - atualizado.tentativasCodigo;

      throw new Error(
        restantes > 0
          ? `Código incorreto. Confira com o cliente (restam ${restantes} ${restantes === 1 ? "tentativa" : "tentativas"}).`
          : "Código incorreto. Finalização bloqueada após 5 tentativas: fale com a loja ou cancele informando o motivo."
      );
    }

    return prismaClient.pedido.update({
      where: { id },
      data: { status: "ENTREGUE" },
      include: pedidoInclude,
      omit: pedidoOmitEquipe,
    });
  }
}

// Cancelar: obrigatório informar o motivo (validado também no schema)
class CancelarEntregaService {
  async execute(id: string, entregador_id: string, motivo: string) {
    await buscarEntregaEmAndamento(id, entregador_id);

    return prismaClient.pedido.update({
      where: { id },
      data: { status: "CANCELADO", motivoCancelamento: motivo.trim() },
      include: pedidoInclude,
      omit: pedidoOmitEquipe,
    });
  }
}

export {
  ListEntregasDisponiveisService,
  ListMinhasEntregasService,
  AceitarEntregaService,
  FinalizarEntregaService,
  CancelarEntregaService,
};
