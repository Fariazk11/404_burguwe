import { SubmitEvent, useEffect, useState } from "react";
import { api, getErrorMessage } from "../services/api";
import { formatDate, formatPrice } from "../types";

type StatusResgate = "SOLICITADO" | "PAGO" | "CANCELADO";

// Resgate como o backend devolve em GET /resgates
interface Resgate {
  id: string;
  valor: number;
  chavePix: string;
  status: StatusResgate;
  observacao: string | null;
  createdAt: string;
  processadoEm: string | null;
  entregador: { id: string; name: string; email: string };
}

type Resumo = Record<StatusResgate, { quantidade: number; valor: number }>;

const FILTROS: { value: StatusResgate | "TODOS"; label: string }[] = [
  { value: "SOLICITADO", label: "A pagar" },
  { value: "PAGO", label: "Pagos" },
  { value: "CANCELADO", label: "Cancelados" },
  { value: "TODOS", label: "Todos" },
];

const STATUS_LABEL: Record<StatusResgate, string> = {
  SOLICITADO: "Solicitado",
  PAGO: "Pago",
  CANCELADO: "Cancelado",
};

// Tela "Resgates" (somente ADMIN): a loja vê os pedidos de resgate dos entregadores,
// paga por fora (ex: Pix manual) e marca como PAGO — ou cancela com motivo (o valor
// volta para o saldo do entregador). Rotas: GET /resgates e PATCH /resgates/:id/(pagar|cancelar)
export function Resgates() {
  const [filtro, setFiltro] = useState<StatusResgate | "TODOS">("SOLICITADO");
  const [resgates, setResgates] = useState<Resgate[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [salvando, setSalvando] = useState("");

  // Formulário aberto (um por vez): pagar (observação opcional) ou cancelar (motivo obrigatório)
  const [acao, setAcao] = useState<{ id: string; tipo: "pagar" | "cancelar" } | null>(null);
  const [texto, setTexto] = useState("");
  const [copiado, setCopiado] = useState("");

  function carregar(status = filtro) {
    api
      .get<{ resgates: Resgate[]; resumo: Resumo }>("/resgates", {
        params: status === "TODOS" ? {} : { status },
      })
      .then((response) => {
        setResgates(response.data.resgates);
        setResumo(response.data.resumo);
      })
      .catch((err) => setAviso({ tipo: "erro", texto: getErrorMessage(err) }))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    setLoading(true);
    carregar(filtro);
  }, [filtro]);

  function abrir(id: string, tipo: "pagar" | "cancelar") {
    setAcao({ id, tipo });
    setTexto("");
    setAviso(null);
  }

  async function copiarPix(resgate: Resgate) {
    try {
      await navigator.clipboard.writeText(resgate.chavePix);
      setCopiado(resgate.id);
      setTimeout(() => setCopiado(""), 2000);
    } catch {
      setAviso({ tipo: "erro", texto: "Não foi possível copiar. Selecione a chave e copie manualmente." });
    }
  }

  async function confirmar(event: SubmitEvent, resgate: Resgate) {
    event.preventDefault();
    if (!acao) return;

    setAviso(null);
    setSalvando(resgate.id);
    try {
      if (acao.tipo === "pagar") {
        await api.patch(`/resgates/${resgate.id}/pagar`, { observacao: texto || undefined });
        setAviso({ tipo: "ok", texto: `Resgate de ${formatPrice(resgate.valor)} para ${resgate.entregador.name} marcado como pago.` });
      } else {
        await api.patch(`/resgates/${resgate.id}/cancelar`, { motivo: texto });
        setAviso({
          tipo: "ok",
          texto: `Resgate cancelado. ${formatPrice(resgate.valor)} voltou para o saldo de ${resgate.entregador.name}.`,
        });
      }
      setAcao(null);
      carregar();
    } catch (err) {
      setAviso({ tipo: "erro", texto: getErrorMessage(err) });
      carregar(); // outro admin pode ter processado antes
    } finally {
      setSalvando("");
    }
  }

  const contagem = (f: StatusResgate | "TODOS") =>
    !resumo
      ? 0
      : f === "TODOS"
        ? resumo.SOLICITADO.quantidade + resumo.PAGO.quantidade + resumo.CANCELADO.quantidade
        : resumo[f].quantidade;

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Resgates</h1>
          <p className="muted mono">&gt; pague os entregadores por Pix e marque aqui como pago_</p>
        </div>
      </div>

      {resumo && (
        <div className="stats">
          <div className="card stat stat-pendente">
            <span className="muted small">A pagar</span>
            <strong>{formatPrice(resumo.SOLICITADO.valor)}</strong>
            <span className="muted small">
              {resumo.SOLICITADO.quantidade} {resumo.SOLICITADO.quantidade === 1 ? "resgate" : "resgates"}
            </span>
          </div>
          <div className="card stat">
            <span className="muted small">Já pago</span>
            <strong>{formatPrice(resumo.PAGO.valor)}</strong>
            <span className="muted small">{resumo.PAGO.quantidade} pagos</span>
          </div>
          <div className="card stat">
            <span className="muted small">Cancelados</span>
            <strong>{formatPrice(resumo.CANCELADO.valor)}</strong>
            <span className="muted small">voltaram para o saldo</span>
          </div>
        </div>
      )}

      <div className="chips">
        {FILTROS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`chip ${filtro === f.value ? "chip-active" : ""}`}
            onClick={() => {
              setFiltro(f.value);
              setAcao(null);
            }}
          >
            {f.label} ({contagem(f.value)})
          </button>
        ))}
      </div>

      {aviso && (
        <p className={`alert ${aviso.tipo === "ok" ? "alert-success" : "alert-error"}`}>
          {aviso.tipo === "ok" ? "✓ " : ""}
          {aviso.texto}
        </p>
      )}

      {loading && <p className="muted mono">&gt; carregando resgates..._</p>}
      {!loading && resgates.length === 0 && (
        <p className="muted mono">
          {filtro === "SOLICITADO" ? "> nenhum resgate esperando pagamento_" : "> nenhum resgate aqui_"}
        </p>
      )}

      <div className="order-list">
        {resgates.map((r) => {
          const aberta = acao?.id === r.id ? acao.tipo : null;

          return (
            <div key={r.id} className={`card resgate-row ${r.status === "SOLICITADO" ? "resgate-pendente" : ""}`}>
              <div className="resgate-topo">
                <div>
                  <strong>{r.entregador.name}</strong>
                  <p className="muted small mono">{r.entregador.email}</p>
                  <p className="muted small">
                    Pedido em {formatDate(r.createdAt)}
                    {r.processadoEm && ` • ${r.status === "PAGO" ? "pago" : "cancelado"} em ${formatDate(r.processadoEm)}`}
                  </p>
                </div>
                <div className="order-row-right">
                  <strong className="resgate-valor">{formatPrice(r.valor)}</strong>
                  <span className={`status resgate-${r.status}`}>{STATUS_LABEL[r.status]}</span>
                </div>
              </div>

              <div className="resgate-pix">
                <span className="comanda-label">Chave Pix</span>
                <code>{r.chavePix}</code>
                <button type="button" className="btn-sm btn-outline" onClick={() => copiarPix(r)}>
                  {copiado === r.id ? "Copiado ✓" : "Copiar"}
                </button>
              </div>

              {r.observacao && <p className="small note">{r.observacao}</p>}

              {r.status === "SOLICITADO" && !aberta && (
                <div className="entrega-botoes">
                  <button type="button" onClick={() => abrir(r.id, "pagar")}>
                    Marcar como pago
                  </button>
                  <button type="button" className="btn-outline-danger" onClick={() => abrir(r.id, "cancelar")}>
                    Cancelar resgate
                  </button>
                </div>
              )}

              {aberta && (
                <form className="entrega-form" onSubmit={(e) => confirmar(e, r)}>
                  {aberta === "pagar" ? (
                    <label>
                      Comprovante / ID da transação Pix (opcional)
                      <input
                        value={texto}
                        onChange={(e) => setTexto(e.target.value)}
                        placeholder="Ex: E12345678202610311200abcdef"
                        maxLength={200}
                        autoFocus
                      />
                    </label>
                  ) : (
                    <label>
                      Motivo do cancelamento (o entregador vai ver)
                      <input
                        value={texto}
                        onChange={(e) => setTexto(e.target.value)}
                        placeholder="Ex: chave Pix inválida, refaça o pedido"
                        maxLength={200}
                        autoFocus
                        required
                      />
                    </label>
                  )}
                  <p className="muted small">
                    {aberta === "pagar"
                      ? `Confirme só depois de enviar ${formatPrice(r.valor)} para a chave acima.`
                      : `O valor de ${formatPrice(r.valor)} volta para o saldo do entregador.`}
                  </p>
                  <div className="entrega-botoes">
                    <button
                      type="submit"
                      className={aberta === "cancelar" ? "btn-danger" : ""}
                      disabled={salvando === r.id || (aberta === "cancelar" && texto.trim().length < 5)}
                    >
                      {aberta === "pagar" ? "Confirmar pagamento" : "Confirmar cancelamento"}
                    </button>
                    <button type="button" className="btn-outline" onClick={() => setAcao(null)}>
                      Voltar
                    </button>
                  </div>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
