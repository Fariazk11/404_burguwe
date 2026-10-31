// Importa a conexão com o banco de dados
import prismaClient from "../../prisma";
// Importa os dados relacionados que voltam junto com o pedido
import { pedidoInclude, pedidoOmitEquipe } from "./pedidoInclude";
// Monta os itens com o preço do banco e calcula o subtotal
import { ItemProps, montarItensPedido } from "./montarItensPedido";

// Dados que o funcionário envia ao lançar o pedido de uma mesa
interface CreatePedidoMesaProps {
  funcionario_id: string; // quem lançou o pedido (fica registrado como "user" do pedido)
  itens: ItemProps[];
  mesa: number;
  nomeCliente?: string;
  formaPagamento: "PIX" | "CARTAO" | "DINHEIRO";
  trocoPara?: number;
  observacao?: string;
}

// Regra de negócio do pedido feito NA MESA pelo funcionário (salão)
// - não tem taxa de entrega, endereço nem telefone
// - vai direto para o painel da cozinha, como qualquer outro pedido
class CreatePedidoMesaService {
  async execute({
    funcionario_id,
    itens,
    mesa,
    nomeCliente,
    formaPagamento,
    trocoPara,
    observacao,
  }: CreatePedidoMesaProps) {
    const { itensPedido, subtotal } = await montarItensPedido(itens);

    // Na mesa não há taxa: o total é o próprio subtotal
    const total = subtotal;

    if (formaPagamento === "DINHEIRO" && trocoPara !== undefined && trocoPara < total) {
      throw new Error("O valor para troco deve ser maior ou igual ao total do pedido");
    }

    const pedido = await prismaClient.pedido.create({
      data: {
        userId: funcionario_id,
        tipoEntrega: "MESA",
        mesa: mesa,
        nomeCliente: nomeCliente?.trim() || null,
        endereco: null,
        telefone: null,
        formaPagamento: formaPagamento,
        trocoPara: formaPagamento === "DINHEIRO" ? trocoPara ?? null : null,
        observacao: observacao || null,
        subtotal: subtotal,
        taxaEntrega: 0,
        total: total,
        itens: {
          create: itensPedido,
        },
      },
      include: pedidoInclude,
      omit: pedidoOmitEquipe,
    });

    return pedido;
  }
}

export { CreatePedidoMesaService };
