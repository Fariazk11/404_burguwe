// Importa a conexão com o banco de dados
import prismaClient from "../../prisma";
// Importa os dados relacionados e a taxa de entrega
import { gerarCodigoEntrega, pedidoInclude, TAXA_ENTREGA } from "./pedidoInclude";
// Monta os itens com o preço do banco e calcula o subtotal
import { ItemProps, montarItensPedido } from "./montarItensPedido";

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

// Classe responsável pela REGRA DE NEGÓCIO de fazer um pedido pelo site
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
    const { itensPedido, subtotal } = await montarItensPedido(itens);

    // Calcula os valores (arredondando para 2 casas decimais)
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
        // Pedido de ENTREGA ganha um código novo, que o cliente informa ao entregador
        codigoEntrega: tipoEntrega === "ENTREGA" ? gerarCodigoEntrega() : null,
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
