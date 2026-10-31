// Componentes visuais para o status de um pedido
import { Pedido, StatusPedido, STATUS_LABEL } from "../types";

// Etiqueta colorida com o status
export function StatusBadge({ status }: { status: StatusPedido }) {
  return <span className={`status status-${status}`}>{STATUS_LABEL[status]}</span>;
}

// Linha do tempo do pedido (Recebido → Em preparo → ... → Entregue)
export function StatusTimeline({ pedido }: { pedido: Pedido }) {
  if (pedido.status === "CANCELADO") {
    return <p className="alert alert-error">Este pedido foi cancelado.</p>;
  }

  // Pedidos de retirada e de mesa não passam por "Saiu para entrega"
  const etapas: StatusPedido[] =
    pedido.tipoEntrega === "ENTREGA"
      ? ["PENDENTE", "EM_PREPARO", "PRONTO", "SAIU_PARA_ENTREGA", "ENTREGUE"]
      : ["PENDENTE", "EM_PREPARO", "PRONTO", "ENTREGUE"];

  const atual = etapas.indexOf(pedido.status);

  // Textos específicos para retirada e mesa
  const label = (s: StatusPedido) => {
    if (pedido.tipoEntrega === "RETIRADA" && s === "PRONTO") return "Pronto para retirar";
    if (pedido.tipoEntrega === "RETIRADA" && s === "ENTREGUE") return "Retirado";
    if (pedido.tipoEntrega === "MESA" && s === "PRONTO") return "Pronto para servir";
    if (pedido.tipoEntrega === "MESA" && s === "ENTREGUE") return "Servido na mesa";
    if (s === "PENDENTE") return "Pedido recebido";
    return STATUS_LABEL[s];
  };

  return (
    <ol className="timeline">
      {etapas.map((etapa, index) => (
        <li
          key={etapa}
          className={index < atual ? "done" : index === atual ? "current" : ""}
        >
          <span className="dot">{index < atual ? "✓" : index + 1}</span>
          <span>{label(etapa)}</span>
        </li>
      ))}
    </ol>
  );
}
