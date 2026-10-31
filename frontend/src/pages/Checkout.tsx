import { SubmitEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, getErrorMessage } from "../services/api";
import { useCart } from "../contexts/CartContext";
import { FormaPagamento, Pedido, PAGAMENTO_LABEL, TAXA_ENTREGA, TipoEntrega, formatPrice } from "../types";

// Tela de finalização do pedido (rota POST /pedidos)
export function Checkout() {
  const { items, subtotal, clearCart, openCart } = useCart();
  const navigate = useNavigate();

  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>("ENTREGA");
  const [endereco, setEndereco] = useState("");
  const [telefone, setTelefone] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("PIX");
  const [trocoPara, setTrocoPara] = useState("");
  const [observacao, setObservacao] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  // Carrinho vazio: não há o que finalizar
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <span className="big-emoji">🛒</span>
        <h2>Seu carrinho está vazio</h2>
        <Link to="/" className="btn">
          Ver cardápio
        </Link>
      </div>
    );
  }

  const taxa = tipoEntrega === "ENTREGA" ? TAXA_ENTREGA : 0;
  const total = subtotal + taxa;

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setError("");
    setSending(true);

    try {
      const response = await api.post<Pedido>("/pedidos", {
        // Enviamos só o id e a quantidade: o PREÇO é calculado pelo backend
        itens: items.map((i) => ({
          lancheId: i.lanche.id,
          quantidade: i.quantidade,
          observacao: i.observacao || undefined,
        })),
        tipoEntrega,
        endereco: tipoEntrega === "ENTREGA" ? endereco : undefined,
        telefone,
        formaPagamento,
        trocoPara:
          formaPagamento === "DINHEIRO" && trocoPara
            ? Number(trocoPara.replace(",", "."))
            : undefined,
        observacao: observacao || undefined,
      });

      // Pedido criado: esvazia o carrinho e abre a tela de acompanhamento
      clearCart();
      navigate(`/pedidos/${response.data.id}`, { state: { novo: true } });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <h1 className="page-heading">Finalizar pedido</h1>

      <form className="checkout" onSubmit={handleSubmit}>
        <div className="checkout-main">
          <section className="card form">
            <h2>Como você quer receber?</h2>
            <div className="options">
              <label className={`option ${tipoEntrega === "ENTREGA" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="tipo"
                  checked={tipoEntrega === "ENTREGA"}
                  onChange={() => setTipoEntrega("ENTREGA")}
                />
                🛵 Entrega <small>+ {formatPrice(TAXA_ENTREGA)}</small>
              </label>
              <label className={`option ${tipoEntrega === "RETIRADA" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="tipo"
                  checked={tipoEntrega === "RETIRADA"}
                  onChange={() => setTipoEntrega("RETIRADA")}
                />
                🏪 Retirar no balcão <small>grátis</small>
              </label>
            </div>

            {tipoEntrega === "ENTREGA" && (
              <label>
                Endereço de entrega
                <input
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua, número, bairro e complemento"
                  minLength={5}
                  required
                />
              </label>
            )}

            <label>
              Telefone / WhatsApp
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 99999-9999"
                minLength={8}
                required
              />
            </label>
          </section>

          <section className="card form">
            <h2>Pagamento</h2>
            <p className="muted">O pagamento é feito na entrega ou na retirada.</p>
            <div className="options">
              {(Object.keys(PAGAMENTO_LABEL) as FormaPagamento[]).map((forma) => (
                <label key={forma} className={`option ${formaPagamento === forma ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="pagamento"
                    checked={formaPagamento === forma}
                    onChange={() => setFormaPagamento(forma)}
                  />
                  {PAGAMENTO_LABEL[forma]}
                </label>
              ))}
            </div>

            {formaPagamento === "DINHEIRO" && (
              <label>
                Troco para quanto? (deixe vazio se não precisar)
                <input
                  inputMode="decimal"
                  value={trocoPara}
                  onChange={(e) => setTrocoPara(e.target.value)}
                  placeholder="Ex: 50,00"
                />
              </label>
            )}

            <label>
              Observações do pedido
              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex: interfone quebrado, ligar quando chegar"
                maxLength={300}
                rows={2}
              />
            </label>
          </section>
        </div>

        <aside className="card checkout-summary">
          <h2>Resumo</h2>
          <ul className="summary-items">
            {items.map((i) => (
              <li key={i.lanche.id}>
                <span>
                  {i.quantidade}x {i.lanche.nome}
                  {i.observacao && <small className="muted"> — {i.observacao}</small>}
                </span>
                <span>{formatPrice(i.lanche.preco * i.quantidade)}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="link" onClick={openCart}>
            Editar itens
          </button>

          <div className="summary-line">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="summary-line">
            <span>Taxa de entrega</span>
            <span>{taxa ? formatPrice(taxa) : "Grátis"}</span>
          </div>
          <div className="summary-line total">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>

          {error && <p className="alert alert-error">{error}</p>}

          <button type="submit" className="btn-block" disabled={sending}>
            {sending ? "Enviando pedido..." : "Confirmar pedido"}
          </button>
        </aside>
      </form>
    </>
  );
}
