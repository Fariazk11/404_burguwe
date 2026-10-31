// Tipos e funções usados em várias telas

// Lanche (igual ao que o backend devolve em GET /lanches)
export interface Lanche {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  ingredientes: string;
  tamanho: string;
  calorias: number;
  imagem: string | null;
  disponivel: boolean;
  createdAt: string;
}

export type StatusPedido =
  | "PENDENTE"
  | "EM_PREPARO"
  | "PRONTO"
  | "SAIU_PARA_ENTREGA"
  | "ENTREGUE"
  | "CANCELADO";

export type TipoEntrega = "ENTREGA" | "RETIRADA";
export type FormaPagamento = "PIX" | "CARTAO" | "DINHEIRO";

// Item de um pedido (com o nome do lanche que veio no include)
export interface ItemPedido {
  id: string;
  quantidade: number;
  precoUnitario: number;
  observacao: string | null;
  lanche: { id: string; nome: string; imagem: string | null };
}

// Pedido completo (igual ao que o backend devolve em /pedidos)
export interface Pedido {
  id: string;
  numero: number;
  status: StatusPedido;
  tipoEntrega: TipoEntrega;
  endereco: string | null;
  telefone: string;
  formaPagamento: FormaPagamento;
  trocoPara: number | null;
  observacao: string | null;
  subtotal: number;
  taxaEntrega: number;
  total: number;
  createdAt: string;
  itens: ItemPedido[];
  user: { id: string; name: string; email: string };
}

// Taxa de entrega (a mesma do backend; quem calcula o valor final é sempre o backend)
export const TAXA_ENTREGA = 5;

// Textos amigáveis para cada status
export const STATUS_LABEL: Record<StatusPedido, string> = {
  PENDENTE: "Aguardando confirmação",
  EM_PREPARO: "Em preparo",
  PRONTO: "Pronto",
  SAIU_PARA_ENTREGA: "Saiu para entrega",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

export const PAGAMENTO_LABEL: Record<FormaPagamento, string> = {
  PIX: "Pix",
  CARTAO: "Cartão (na entrega)",
  DINHEIRO: "Dinheiro",
};

// Formata um número como dinheiro: 29.9 -> "R$ 29,90"
export const formatPrice = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Formata data e hora: "31/10/2026 14:05"
export const formatDate = (value: string) =>
  new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
