// Importa a conexão com o banco de dados
import prismaClient from "../../prisma";
import { enviarPagamento } from "./pagamentoResgate";

// Os dias são contados no horário de Brasília (o servidor do Render roda em UTC)
const FUSO = "America/Sao_Paulo";

// Converte uma data para o dia no formato "2026-10-31" (horário de Brasília)
const diaDe = (data: Date) => data.toLocaleDateString("en-CA", { timeZone: FUSO });

// Arredonda para centavos (evita 0.30000000000000004)
const centavos = (valor: number) => Math.round(valor * 100) / 100;

// Resgates que tiram dinheiro do saldo (os CANCELADOS devolvem o valor ao saldo)
const RESGATES_QUE_CONTAM = ["SOLICITADO", "PAGO"] as const;

// Calcula o saldo disponível do entregador: tudo que ganhou − resgates feitos.
// Recebe "db" para poder rodar dentro de uma transação (ver SolicitarResgateService).
async function calcularSaldo(db: Pick<typeof prismaClient, "pedido" | "resgate">, entregador_id: string) {
  const [ganhos, resgates] = await Promise.all([
    db.pedido.aggregate({
      where: { entregadorId: entregador_id, status: "ENTREGUE" },
      _sum: { ganhoEntregador: true },
    }),
    db.resgate.aggregate({
      where: { entregadorId: entregador_id, status: { in: [...RESGATES_QUE_CONTAM] } },
      _sum: { valor: true },
    }),
  ]);

  const totalGanho = centavos(ganhos._sum.ganhoEntregador ?? 0);
  const totalResgatado = centavos(resgates._sum.valor ?? 0);

  return { totalGanho, totalResgatado, saldoDisponivel: centavos(totalGanho - totalResgatado) };
}

// Painel de ganhos do entregador: hoje, saldo, ganhos por dia e resgates
class ResumoGanhosService {
  async execute(entregador_id: string, dias = 30) {
    const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);

    const [entregas, resgates, saldo] = await Promise.all([
      prismaClient.pedido.findMany({
        where: { entregadorId: entregador_id, status: "ENTREGUE", entregueEm: { gte: desde } },
        select: { entregueEm: true, ganhoEntregador: true },
      }),
      prismaClient.resgate.findMany({
        where: { entregadorId: entregador_id },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      calcularSaldo(prismaClient, entregador_id),
    ]);

    // Agrupa as entregas por dia (horário de Brasília)
    const porDiaMap = new Map<string, { entregas: number; valor: number }>();
    for (const e of entregas) {
      const dia = diaDe(e.entregueEm as Date);
      const atual = porDiaMap.get(dia) ?? { entregas: 0, valor: 0 };
      atual.entregas += 1;
      atual.valor = centavos(atual.valor + (e.ganhoEntregador ?? 0));
      porDiaMap.set(dia, atual);
    }

    const porDia = [...porDiaMap.entries()]
      .map(([data, v]) => ({ data, ...v }))
      .sort((a, b) => b.data.localeCompare(a.data)); // mais recente primeiro

    const hoje = porDiaMap.get(diaDe(new Date())) ?? { entregas: 0, valor: 0 };

    return { hoje, ...saldo, porDia, resgates };
  }
}

// Pedido de resgate: tira o valor do saldo e registra como SOLICITADO.
// Roda numa transação "Serializable": se o entregador clicar duas vezes ao mesmo
// tempo, o banco não deixa os dois resgates passarem do saldo.
class SolicitarResgateService {
  async execute(entregador_id: string, valor: number, chavePix: string) {
    const valorCentavos = centavos(valor);

    const resgate = await prismaClient
      .$transaction(
      async (tx) => {
        const { saldoDisponivel } = await calcularSaldo(tx, entregador_id);

        if (valorCentavos > saldoDisponivel) {
          throw new Error(
            `Valor maior que o saldo disponível (${saldoDisponivel.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })})`
          );
        }

        return tx.resgate.create({
          data: { entregadorId: entregador_id, valor: valorCentavos, chavePix: chavePix.trim() },
          include: { entregador: { select: { name: true } } },
        });
      },
      { isolationLevel: "Serializable" }
      )
      .catch((err: unknown) => {
        // Dois resgates ao mesmo tempo: o banco recusa um deles (código P2034 do Prisma)
        const codigo = (err as { code?: string }).code;
        if (codigo === "P2034" || String((err as Error).message).includes("write conflict")) {
          throw new Error("Outro resgate estava sendo processado ao mesmo tempo. Confira o saldo e tente de novo.");
        }
        throw err;
      });

    // Tenta enviar o pagamento (hoje só registra; ver pagamentoResgate.ts)
    const pagamento = await enviarPagamento({
      resgateId: resgate.id,
      valor: resgate.valor,
      chavePix: resgate.chavePix,
      entregadorNome: resgate.entregador.name,
    });

    if (pagamento.enviado) {
      return prismaClient.resgate.update({
        where: { id: resgate.id },
        data: { status: "PAGO", processadoEm: new Date(), observacao: `Transação ${pagamento.transacaoId}` },
      });
    }

    if (!pagamento.pendente) {
      // Provedor recusou: cancela e o valor volta para o saldo
      return prismaClient.resgate.update({
        where: { id: resgate.id },
        data: { status: "CANCELADO", processadoEm: new Date(), observacao: pagamento.erro },
      });
    }

    const { entregador, ...semEntregador } = resgate;
    return semEntregador;
  }
}

export { ResumoGanhosService, SolicitarResgateService };
