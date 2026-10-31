// Gaveta lateral do carrinho (abre pelo botão 🛒 do cabeçalho)
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { formatPrice } from "../types";
import { LancheImage } from "./LancheImage";

export function CartDrawer() {
  const { items, subtotal, isOpen, closeCart, changeQuantity, changeObservacao, removeItem } =
    useCart();
  const navigate = useNavigate();

  // Fechada: não desenha nada
  if (!isOpen) {
    return null;
  }

  function irParaCheckout() {
    closeCart();
    navigate("/checkout");
  }

  return (
    // Clicar no fundo escuro fecha a gaveta
    <div className="overlay" onClick={closeCart}>
      {/* stopPropagation: clicar DENTRO da gaveta não fecha */}
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h2>Seu pedido</h2>
          <button className="btn-icon" onClick={closeCart} aria-label="Fechar">
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="drawer-empty">
            <span className="big-emoji">🛒</span>
            <p>Seu carrinho está vazio.</p>
            <button className="btn-outline" onClick={closeCart}>
              Ver cardápio
            </button>
          </div>
        ) : (
          <>
            <ul className="cart-list">
              {items.map((item) => (
                <li key={item.lanche.id} className="cart-item">
                  <LancheImage src={item.lanche.imagem} alt={item.lanche.nome} className="thumb" />

                  <div className="cart-item-info">
                    <div className="cart-item-top">
                      <strong>{item.lanche.nome}</strong>
                      <span>{formatPrice(item.lanche.preco * item.quantidade)}</span>
                    </div>

                    <input
                      className="input-sm"
                      value={item.observacao}
                      onChange={(e) => changeObservacao(item.lanche.id, e.target.value)}
                      placeholder="Observação (ex: sem cebola)"
                      maxLength={200}
                    />

                    <div className="cart-item-bottom">
                      <div className="qty">
                        <button onClick={() => changeQuantity(item.lanche.id, item.quantidade - 1)}>−</button>
                        <span>{item.quantidade}</span>
                        <button onClick={() => changeQuantity(item.lanche.id, item.quantidade + 1)}>+</button>
                      </div>
                      <button className="link-danger" onClick={() => removeItem(item.lanche.id)}>
                        Remover
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="drawer-footer">
              <div className="summary-line total">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <button className="btn-block" onClick={irParaCheckout}>
                Finalizar pedido
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
