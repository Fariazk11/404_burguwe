// Dados relacionados que vêm junto com cada pedido:
// os itens (com nome/imagem do lanche) e o cliente (sem a senha)
export const pedidoInclude = {
  itens: {
    include: {
      lanche: {
        select: { id: true, nome: true, imagem: true },
      },
    },
  },
  user: {
    select: { id: true, name: true, email: true },
  },
};

// Taxa fixa cobrada nos pedidos com entrega
export const TAXA_ENTREGA = 5;
