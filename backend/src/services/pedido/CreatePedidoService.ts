// Importa a conexão com o banco de dados
import prismaClient from "../../prisma";
// Importa os dados relacionados e a taxa de entrega
import { pedidoInclude, TAXA_ENTREGA } from "./pedidoInclude";

// Formato de cada item enviado pelo cliente
interface ItemProps {
  lancheId: string;
  quantidade: number;
  observacao?: string;
}

// Formato dos dados necessários para criar um pedido
interface CreatePedidoProps {
  user_id: string;
  itens: ItemProps[];
  tipoEntrega: "ENTREGA" | "RETIRADA";
  endereco?: string;
  telefone: string;
  formaPagamento: "PIX" | "CARTAO" | "DINHEIRO";
  trocoPara?: number;
  observacao?: string;
}

// Classe responsável pela REGRA DE NEGÓCIO de fazer um pedido
class CreatePedidoService {
  async execute({
    user_id,
    itens,
    tipoEntrega,
    endereco,
    telefone,
    formaPagamento,
    trocoPara,
    observacao,
  }: CreatePedidoProps) {
    // Busca no banco todos os lanches do pedido de uma vez só
    const lanches = await prismaClient.lanche.findMany({
      where: {
        id: { in: itens.map((item) => item.lancheId) },
      },
    });

    // Monta os itens usando o preço que está NO BANCO
    // (nunca confiamos no preço enviado pelo front-end)
    const itensPedido = itens.map((item) => {
      const lanche = lanches.find((l) => l.id === item.lancheId);

      if (!lanche) {
        throw new Error("Um dos lanches do pedido não existe");
      }

      if (!lanche.disponivel) {
        throw new Error(`O lanche "${lanche.nome}" não está disponível no momento`);
      }

      return {
        lancheId: lanche.id,
        quantidade: item.quantidade,
        precoUnitario: lanche.preco,
        observacao: item.observacao || null,
      };
    });

    // Calcula os valores (arredondando para 2 casas decimais)
    const subtotal =
      Math.round(
        itensPedido.reduce((soma, i) => soma + i.precoUnitario * i.quantidade, 0) * 100
      ) / 100;
    const taxaEntrega = tipoEntrega === "ENTREGA" ? TAXA_ENTREGA : 0;
    const total = Math.round((subtotal + taxaEntrega) * 100) / 100;

    // Troco só faz sentido em dinheiro e precisa ser maior ou igual ao total
    if (formaPagamento === "DINHEIRO" && trocoPara !== undefined && trocoPara < total) {
      throw new Error("O valor para troco deve ser maior ou igual ao total do pedido");
    }

    // Cria o pedido e os itens ao mesmo tempo (create aninhado)
    const pedido = await prismaClient.pedido.create({
      data: {
        userId: user_id,
        tipoEntrega: tipoEntrega,
        endereco: tipoEntrega === "ENTREGA" ? endereco : null,
        telefone: telefone,
        formaPagamento: formaPagamento,
        trocoPara: formaPagamento === "DINHEIRO" ? trocoPara ?? null : null,
        observacao: observacao || null,
        subtotal: subtotal,
        taxaEntrega: taxaEntrega,
        total: total,
        itens: {
          create: itensPedido,
        },
      },
      include: pedidoInclude,
    });

    return pedido;
  }
}

export { CreatePedidoService };
