// Importa a conexão com o banco de dados
import prismaClient from "../../prisma";

// Formato de cada item enviado pelo front-end
export interface ItemProps {
  lancheId: string;
  quantidade: number;
  observacao?: string;
}

// Monta os itens de um pedido com o preço que está NO BANCO
// (nunca confiamos no preço enviado pelo front-end) e calcula o subtotal.
// Usado pelo pedido do site (CreatePedidoService) e pelo da mesa (CreatePedidoMesaService).
export async function montarItensPedido(itens: ItemProps[]) {
  // Busca no banco todos os lanches do pedido de uma vez só
  const lanches = await prismaClient.lanche.findMany({
    where: {
      id: { in: itens.map((item) => item.lancheId) },
    },
  });

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

  // Soma dos itens (arredondando para 2 casas decimais)
  const subtotal =
    Math.round(
      itensPedido.reduce((soma, i) => soma + i.precoUnitario * i.quantidade, 0) * 100
    ) / 100;

  return { itensPedido, subtotal };
}
