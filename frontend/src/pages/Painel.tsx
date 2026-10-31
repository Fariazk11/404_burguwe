import { useEffect, useState } from "react";
import { api, getErrorMessage } from "../services/api";
import {
  PAGAMENTO_LABEL,
  Pedido,
  StatusPedido,
  STATUS_LABEL,
  destinoPedido,
  formatDate,
  formatPrice,
} from "../types";
import { StatusBadge } from "../components/StatusPedido";

// Colunas do quadro da cozinha (pedidos em andamento)
const COLUNAS: StatusPedido[] = ["PENDENTE", "EM_PREPARO", "PRONTO", "SAIU_PARA_ENTREGA"];

// Qual é o próximo passo de cada pedido (texto do botão + novo status)
function proximaAcao(pedido: Pedido): { label: string; status: StatusPedido } | null {
  switch (pedido.status) {
    case "PENDENTE":
      return { label: "Aceitar e preparar", status: "EM_PREPARO" };
    case "EM_PREPARO":
      return { label: "Marcar como pronto", status: "PRONTO" };
    case "PRONTO":
      if (pedido.tipoEntrega === "ENTREGA") return { label: "Saiu para entrega", status: "SAIU_PARA_ENTREGA" };
      if (pedido.tipoEntrega === "MESA") return { label: "Servido na mesa", status: "ENTREGUE" };
      return { label: "Cliente retirou", status: "ENTREGUE" };
    case "SAIU_PARA_ENTREGA":
      return { label: "Confirmar entrega", status: "ENTREGUE" };
    default:
      return null;
  }
}

// Painel da equipe: acompanha e atualiza os pedidos (rotas GET /pedidos e PATCH /pedidos/:id/status)
export function Painel() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aba, setAba] = useState<"andamento" | "finalizados">("andamento");
  // id do pedido que está sendo atualizado (para desabilitar o botão)
  const [updating, setUpdating] = useState("");

  function carregar() {
    api
      .get<Pedido[]>("/pedidos")
      .then((response) => {
        setPedidos(response.data);
        setError("");
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  // Carrega ao abrir e atualiza a cada 10 segundos (novos pedidos aparecem sozinhos)
  useEffect(() => {
    carregar();
    const intervalo = setInterval(carregar, 10000);
    return () => clearInterval(intervalo);
  }, []);

  async function mudarStatus(pedido: Pedido, status: StatusPedido) {
    if (status === "CANCELADO" && !confirm(`Cancelar o pedido #${pedido.numero}?`)) return;

    setUpdating(pedido.id);
    try {
      const response = await api.patch<Pedido>(`/pedidos/${pedido.id}/status`, { status });
      // Troca o pedido antigo pelo atualizado na lista
      setPedidos((atual) => atual.map((p) => (p.id === pedido.id ? response.data : p)));
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setUpdating("");
    }
  }

  // Números do dia (considera só os pedidos feitos hoje)
  const hoje = new Date().toDateString();
  const pedidosHoje = pedidos.filter((p) => new Date(p.createdAt).toDateString() === hoje);
  const entreguesHoje = pedidosHoje.filter((p) => p.status === "ENTREGUE");
  const faturamentoHoje = entreguesHoje.reduce((soma, p) => soma + p.total, 0);

  const finalizados = pedidos
    .filter((p) => p.status === "ENTREGUE" || p.status === "CANCELADO")
    .reverse(); // mais recentes primeiro

  // Cartão de um pedido no quadro
  function PedidoCard({ pedido }: { pedido: Pedido }) {
    const acao = proximaAcao(pedido);

    return (
      <article className="card kitchen-card">
        <div className="kitchen-card-header">
          <strong>#{pedido.numero}</strong>
          <span className="muted small">{formatDate(pedido.createdAt)}</span>
        </div>
        {pedido.tipoEntrega === "MESA" ? (
          <>
            <p className="mesa-tag">🍽️ MESA {pedido.mesa}</p>
            <p className="small">
              {pedido.nomeCliente && <strong>{pedido.nomeCliente} • </strong>}
              <span className="muted">lançado por {pedido.user.name}</span>
            </p>
          </>
        ) : (
          <>
            <p className="small">
              <strong>{pedido.user.name}</strong> • {pedido.telefone}
            </p>
            <p className="small">
              {pedido.tipoEntrega === "ENTREGA" ? `🛵 ${pedido.endereco}` : "🏪 Retirada no balcão"}
            </p>
          </>
        )}

        <ul className="kitchen-items">
          {pedido.itens.map((item) => (
            <li key={item.id}>
              <strong>{item.quantidade}x</strong> {item.lanche.nome}
              {item.observacao && <em> — {item.observacao}</em>}
            </li>
          ))}
        </ul>

        {pedido.observacao && <p className="small note">📝 {pedido.observacao}</p>}

        <p className="small">
          {formatPrice(pedido.total)} • {PAGAMENTO_LABEL[pedido.formaPagamento]}
          {pedido.trocoPara && ` (troco p/ ${formatPrice(pedido.trocoPara)})`}
        </p>

        <div className="kitchen-actions">
          {acao && (
            <button
              className="btn-sm"
              disabled={updating === pedido.id}
              onClick={() => mudarStatus(pedido, acao.status)}
            >
              {acao.label}
            </button>
          )}
          <button
            className="btn-sm btn-outline-danger"
            disabled={updating === pedido.id}
            onClick={() => mudarStatus(pedido, "CANCELADO")}
          >
            Cancelar
          </button>
        </div>
      </article>
    );
  }

  return (
    <>
      <div className="page-title">
        <h1>Cozinha</h1>
        <span className="muted small">Atualiza automaticamente a cada 10s</span>
      </div>

      <div className="stats">
        <div className="card stat">
          <span className="muted small">Pedidos hoje</span>
          <strong>{pedidosHoje.length}</strong>
        </div>
        <div className="card stat">
          <span className="muted small">Em andamento</span>
          <strong>{pedidos.filter((p) => COLUNAS.includes(p.status)).length}</strong>
        </div>
        <div className="card stat">
          <span className="muted small">Faturamento hoje (entregues)</span>
          <strong>{formatPrice(faturamentoHoje)}</strong>
        </div>
      </div>

      <div className="chips">
        <button className={`chip ${aba === "andamento" ? "chip-active" : ""}`} onClick={() => setAba("andamento")}>
          Em andamento
        </button>
        <button className={`chip ${aba === "finalizados" ? "chip-active" : ""}`} onClick={() => setAba("finalizados")}>
          Finalizados
        </button>
      </div>

      {loading && <p className="muted">Carregando pedidos...</p>}
      {error && <p className="alert alert-error">{error}</p>}

      {aba === "andamento" ? (
        <div className="board">
          {COLUNAS.map((status) => {
            const daColuna = pedidos.filter((p) => p.status === status);

            return (
              <section key={status} className="board-column">
                <h2>
                  {STATUS_LABEL[status]} <span className="count">{daColuna.length}</span>
                </h2>
                {daColuna.length === 0 && <p className="muted small">Nenhum pedido</p>}
                {daColuna.map((pedido) => (
                  <PedidoCard key={pedido.id} pedido={pedido} />
                ))}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="order-list">
          {finalizados.length === 0 && <p className="muted">Nenhum pedido finalizado.</p>}
          {finalizados.map((pedido) => (
            <div key={pedido.id} className="card order-row">
              <div>
                <strong>
                  #{pedido.numero} —{" "}
                  {pedido.tipoEntrega === "MESA"
                    ? `${destinoPedido(pedido)}${pedido.nomeCliente ? ` (${pedido.nomeCliente})` : ""}`
                    : pedido.user.name}
                </strong>
                <p className="muted small">{formatDate(pedido.createdAt)}</p>
                <p className="small">
                  {pedido.itens.map((i) => `${i.quantidade}x ${i.lanche.nome}`).join(", ")}
                </p>
              </div>
              <div className="order-row-right">
                <StatusBadge status={pedido.status} />
                <strong>{formatPrice(pedido.total)}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
