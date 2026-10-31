import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { api, getErrorMessage } from "../services/api";
import { PAGAMENTO_LABEL, Pedido, formatDate, formatPrice } from "../types";
import { StatusBadge, StatusTimeline } from "../components/StatusPedido";

// Tela de acompanhamento de um pedido (rota GET /pedidos/:id)
export function PedidoDetalhe() {
  // O id vem da URL: /pedidos/abc-123
  const { id } = useParams();
  // "novo" vem do checkout, para mostrar a mensagem de sucesso
  const location = useLocation();
  const novo = (location.state as { novo?: boolean } | null)?.novo;

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [error, setError] = useState("");
  const [canceling, setCanceling] = useState(false);

  // Busca o pedido e repete a cada 10 segundos para o status atualizar sozinho
  useEffect(() => {
    function carregar() {
      api
        .get<Pedido>(`/pedidos/${id}`)
        .then((response) => setPedido(response.data))
        .catch((err) => setError(getErrorMessage(err)));
    }

    carregar();
    const intervalo = setInterval(carregar, 10000);

    // Ao sair da tela, para de atualizar
    return () => clearInterval(intervalo);
  }, [id]);

  async function cancelar() {
    if (!confirm("Deseja mesmo cancelar este pedido?")) return;

    setCanceling(true);
    try {
      const response = await api.patch<Pedido>(`/pedidos/${id}/cancelar`);
      setPedido(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCanceling(false);
    }
  }

  if (error && !pedido) {
    return <p className="alert alert-error">{error}</p>;
  }

  if (!pedido) {
    return <p className="muted">Carregando pedido...</p>;
  }

  return (
    <div className="order-detail">
      {novo && pedido.status === "PENDENTE" && (
        <div className="alert alert-success">
          🎉 Pedido enviado! Acompanhe o andamento por aqui — esta página atualiza sozinha.
        </div>
      )}

      <div className="page-title">
        <div>
          <h1>Pedido #{pedido.numero}</h1>
          <p className="muted">Feito em {formatDate(pedido.createdAt)}</p>
        </div>
        <StatusBadge status={pedido.status} />
      </div>

      <section className="card">
        <StatusTimeline pedido={pedido} />
      </section>

      <div className="detail-grid">
        <section className="card">
          <h2>Itens</h2>
          <ul className="summary-items">
            {pedido.itens.map((item) => (
              <li key={item.id}>
                <span>
                  {item.quantidade}x {item.lanche.nome}
                  {item.observacao && <small className="muted"> — {item.observacao}</small>}
                </span>
                <span>{formatPrice(item.precoUnitario * item.quantidade)}</span>
              </li>
            ))}
          </ul>
          <div className="summary-line">
            <span>Subtotal</span>
            <span>{formatPrice(pedido.subtotal)}</span>
          </div>
          <div className="summary-line">
            <span>Taxa de entrega</span>
            <span>{pedido.taxaEntrega ? formatPrice(pedido.taxaEntrega) : "Grátis"}</span>
          </div>
          <div className="summary-line total">
            <span>Total</span>
            <span>{formatPrice(pedido.total)}</span>
          </div>
        </section>

        <section className="card info-list">
          <h2>Entrega e pagamento</h2>
          <p>
            <strong>{pedido.tipoEntrega === "ENTREGA" ? "🛵 Entrega" : "🏪 Retirada no balcão"}</strong>
          </p>
          {pedido.endereco && <p>{pedido.endereco}</p>}
          <p>📞 {pedido.telefone}</p>
          <p>
            💳 {PAGAMENTO_LABEL[pedido.formaPagamento]}
            {pedido.trocoPara && ` — troco para ${formatPrice(pedido.trocoPara)}`}
          </p>
          {pedido.observacao && <p>📝 {pedido.observacao}</p>}
        </section>
      </div>

      {error && <p className="alert alert-error">{error}</p>}

      <div className="actions">
        <Link to="/pedidos" className="btn-outline btn">
          Meus pedidos
        </Link>
        {/* O cliente só pode cancelar enquanto a cozinha não começou */}
        {pedido.status === "PENDENTE" && (
          <button className="btn-danger" onClick={cancelar} disabled={canceling}>
            {canceling ? "Cancelando..." : "Cancelar pedido"}
          </button>
        )}
      </div>
    </div>
  );
}
