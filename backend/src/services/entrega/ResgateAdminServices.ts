// Importa a conexão com o banco de dados
import prismaClient from "../../prisma";
import { StatusResgate } from "../../generated/prisma/client";

// Regras da tela "Resgates" do ADMIN.
// Enquanto não houver integração bancária (ver pagamentoResgate.ts), a loja paga
// o entregador por fora (ex: Pix manual) e marca aqui como PAGO.

const resgateInclude = {
  entregador: { select: { id: true, name: true, email: true } },
};

const centavos = (valor: number) => Math.round(valor * 100) / 100;

// Lista os resgates (filtro opcional por status) + totais de cada status
class ListResgatesService {
  async execute(status?: string) {
    const filtro = Object.values(StatusResgate).includes(status as StatusResgate)
      ? (status as StatusResgate)
      : undefined;

    const [resgates, totais] = await Promise.all([
      prismaClient.resgate.findMany({
        where: { status: filtro },
        include: resgateInclude,
        // Os pendentes mais antigos primeiro (fila de pagamento); os demais, mais recentes primeiro
        orderBy: filtro === "SOLICITADO" ? { createdAt: "asc" } : { createdAt: "desc" },
        take: 200,
      }),
      prismaClient.resgate.groupBy({
        by: ["status"],
        _sum: { valor: true },
        _count: { _all: true },
      }),
    ]);

    // Totais por status: { SOLICITADO: { quantidade, valor }, PAGO: {...}, CANCELADO: {...} }
    const resumo = Object.fromEntries(
      Object.values(StatusResgate).map((s) => {
        const t = totais.find((x) => x.status === s);
        return [s, { quantidade: t?._count._all ?? 0, valor: centavos(t?._sum.valor ?? 0) }];
      })
    );

    return { resgates, resumo };
  }
}

// Muda um resgate SOLICITADO para PAGO ou CANCELADO.
// O updateMany com status SOLICITADO no "where" garante que um resgate não seja
// processado duas vezes (ex: dois admins clicando ao mesmo tempo).
async function processarResgate(id: string, novoStatus: "PAGO" | "CANCELADO", observacao: string | null) {
  const resultado = await prismaClient.resgate.updateMany({
    where: { id, status: "SOLICITADO" },
    data: { status: novoStatus, processadoEm: new Date(), observacao },
  });

  if (resultado.count === 0) {
    const existe = await prismaClient.resgate.findFirst({ where: { id } });
    throw new Error(existe ? "Este resgate já foi processado" : "Resgate não encontrado");
  }

  return prismaClient.resgate.findFirst({ where: { id }, include: resgateInclude });
}

// Marca como PAGO (a loja já enviou o dinheiro por fora). Observação opcional: id do Pix, comprovante...
class PagarResgateService {
  async execute(id: string, observacao?: string) {
    return processarResgate(id, "PAGO", observacao?.trim() || "Pago manualmente pela loja");
  }
}

// Cancela o resgate: o valor VOLTA para o saldo do entregador (o saldo ignora resgates cancelados)
class CancelarResgateService {
  async execute(id: string, motivo: string) {
    return processarResgate(id, "CANCELADO", motivo.trim());
  }
}

export { ListResgatesService, PagarResgateService, CancelarResgateService };
