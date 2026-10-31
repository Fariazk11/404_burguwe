// Contexto do carrinho de compras: fica disponível em todas as telas
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Lanche } from "../types";

// Um item do carrinho: o lanche, a quantidade e uma observação ("sem cebola")
export interface CartItem {
  lanche: Lanche;
  quantidade: number;
  observacao: string;
}

interface CartContextData {
  items: CartItem[];
  totalItens: number; // soma das quantidades (aparece no ícone do carrinho)
  subtotal: number;
  isOpen: boolean; // se a gaveta do carrinho está aberta
  openCart: () => void;
  closeCart: () => void;
  addItem: (lanche: Lanche) => void;
  changeQuantity: (lancheId: string, quantidade: number) => void;
  changeObservacao: (lancheId: string, observacao: string) => void;
  removeItem: (lancheId: string) => void;
  clearCart: () => void;
}

// Chave usada para salvar o carrinho no navegador (não se perde ao recarregar)
const CART_KEY = "@lanchonete:cart";

const CartContext = createContext({} as CartContextData);

export function CartProvider({ children }: { children: ReactNode }) {
  // Começa com o carrinho salvo no localStorage (se existir)
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(CART_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [isOpen, setIsOpen] = useState(false);

  // Sempre que o carrinho muda, salva no localStorage
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  // Adiciona 1 unidade: se o lanche já está no carrinho, só aumenta a quantidade
  function addItem(lanche: Lanche) {
    setItems((atual) => {
      const existe = atual.find((i) => i.lanche.id === lanche.id);

      if (existe) {
        return atual.map((i) =>
          i.lanche.id === lanche.id ? { ...i, quantidade: Math.min(i.quantidade + 1, 50) } : i
        );
      }

      return [...atual, { lanche, quantidade: 1, observacao: "" }];
    });
  }

  // Altera a quantidade; se chegar a 0, remove o item
  function changeQuantity(lancheId: string, quantidade: number) {
    if (quantidade <= 0) {
      removeItem(lancheId);
      return;
    }

    setItems((atual) =>
      atual.map((i) =>
        i.lanche.id === lancheId ? { ...i, quantidade: Math.min(quantidade, 50) } : i
      )
    );
  }

  function changeObservacao(lancheId: string, observacao: string) {
    setItems((atual) =>
      atual.map((i) => (i.lanche.id === lancheId ? { ...i, observacao } : i))
    );
  }

  function removeItem(lancheId: string) {
    setItems((atual) => atual.filter((i) => i.lanche.id !== lancheId));
  }

  function clearCart() {
    setItems([]);
  }

  const totalItens = items.reduce((soma, i) => soma + i.quantidade, 0);
  const subtotal = items.reduce((soma, i) => soma + i.lanche.preco * i.quantidade, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItens,
        subtotal,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        addItem,
        changeQuantity,
        changeObservacao,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Hook para as telas usarem o carrinho: const { addItem } = useCart();
export function useCart() {
  return useContext(CartContext);
}
