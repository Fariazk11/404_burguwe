import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, getErrorMessage } from "../services/api";
import { Pedido, destinoPedido, formatDate, formatPrice } from "../types";
import { StatusBadge } from "../components/StatusPedido";

// Lista os pedidos do cliente logado (rota GET /pedidos/me)
export function MeusPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<Pedido[]>("/pedidos/me")
      .then((response) => setPedidos(response.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <h1 className="page-heading">Meus pedidos</h1>

      {loading && <p className="muted">Carregando...</p>}
      {error && <p className="alert alert-error">{error}</p>}

      {!loading && !error && pedidos.length === 0 && (
        <div className="empty-state">
          <span className="big-emoji">🧾</span>
          <h2>Você ainda não fez nenhum pedido</h2>
          <Link to="/" className="btn">
            Fazer meu primeiro pedido
          </Link>
        </div>
      )}

      <div className="order-list">
        {pedidos.map((pedido) => (
          <Link key={pedido.id} to={`/pedidos/${pedido.id}`} className="card order-row">
            <div>
              <strong>Pedido #{pedido.numero}</strong>
              <p className="muted small">
                {formatDate(pedido.createdAt)} •{" "}
                {destinoPedido(pedido)}
              </p>
              <p className="small">
                {pedido.itens.map((i) => `${i.quantidade}x ${i.lanche.nome}`).join(", ")}
              </p>
            </div>
            <div className="order-row-right">
              <StatusBadge status={pedido.status} />
              <strong>{formatPrice(pedido.total)}</strong>
              {/* Código de entrega à mão enquanto o pedido não chegou */}
              {pedido.codigoEntrega && pedido.status !== "ENTREGUE" && pedido.status !== "CANCELADO" && (
                <span className="codigo-mini">Código: {pedido.codigoEntrega}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
