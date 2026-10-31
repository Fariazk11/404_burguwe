import { SubmitEvent, useEffect, useState } from "react";
import { api, getErrorMessage } from "../services/api";
import { PAGAMENTO_LABEL, Pedido, formatDate, formatPrice } from "../types";
import { StatusBadge } from "../components/StatusPedido";

type Aba = "disponiveis" | "andamento" | "historico" | "ganhos";

// Painel de ganhos (GET /entregas/ganhos)
interface Resgate {
  id: string;
  valor: number;
  chavePix: string;
  status: "SOLICITADO" | "PAGO" | "CANCELADO";
  observacao: string | null;
  createdAt: string;
}

interface Ganhos {
  hoje: { entregas: number; valor: number };
  totalGanho: number;
  totalResgatado: number;
  saldoDisponivel: number;
  porDia: { data: string; entregas: number; valor: number }[];
  resgates: Resgate[];
}

const RESGATE_LABEL: Record<Resgate["status"], string> = {
  SOLICITADO: "Solicitado",
  PAGO: "Pago",
  CANCELADO: "Cancelado",
};

// "2026-10-31" -> "31/10/2026 (sexta)"; marca "hoje"
function formatDia(data: string) {
  const [ano, mes, dia] = data.split("-").map(Number);
  const d = new Date(ano!, mes! - 1, dia!);
  const hoje = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const semana = d.toLocaleDateString("pt-BR", { weekday: "long" }).split("-")[0];
  return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano} (${data === hoje ? "hoje" : semana})`;
}

// Tela do ENTREGADOR. Ele só pode:
// - ACEITAR uma entrega pronta
// - FINALIZAR digitando o código de 4 números que o cliente vê na página do pedido
// - CANCELAR informando o motivo (sem motivo não cancela)
// Rotas: GET /entregas/disponiveis, GET /entregas/minhas e PATCH /entregas/:id/(aceitar|finalizar|cancelar)
export function Entregas() {
  const [disponiveis, setDisponiveis] = useState<Pedido[]>([]);
  const [minhas, setMinhas] = useState<Pedido[]>([]);
  // A aba inicial pode vir no endereço: /entregas?aba=ganhos
  const abaInicial = new URLSearchParams(window.location.search).get("aba") as Aba | null;
  const [aba, setAba] = useState<Aba>(
    abaInicial && ["disponiveis", "andamento", "historico", "ganhos"].includes(abaInicial) ? abaInicial : "disponiveis"
  );
  const [loading, setLoading] = useState(true);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [salvando, setSalvando] = useState(""); // id do pedido em ação

  // Formulários abertos (um por vez): finalizar (código) ou cancelar (motivo)
  const [acao, setAcao] = useState<{ id: string; tipo: "finalizar" | "cancelar" } | null>(null);
  const [codigo, setCodigo] = useState("");
  const [motivo, setMotivo] = useState("");

  // ----- Ganhos e resgate -----
  const [ganhos, setGanhos] = useState<Ganhos | null>(null);
  const [resgateAberto, setResgateAberto] = useState(false);
  const [valorResgate, setValorResgate] = useState("");
  const [chavePix, setChavePix] = useState("");

  function carregar() {
    Promise.all([
      api.get<Pedido[]>("/entregas/disponiveis"),
      api.get<Pedido[]>("/entregas/minhas"),
      api.get<Ganhos>("/entregas/ganhos"),
    ])
      .then(([d, m, g]) => {
        setDisponiveis(d.data);
        setMinhas(m.data);
        setGanhos(g.data);
      })
      .catch((err) => setAviso({ tipo: "erro", texto: getErrorMessage(err) }))
      .finally(() => setLoading(false));
  }

  // Atualiza sozinho a cada 10 segundos (novas entregas aparecem quando a cozinha marca "Pronto")
  useEffect(() => {
    carregar();
    const intervalo = setInterval(carregar, 10000);
    return () => clearInterval(intervalo);
  }, []);

  const emAndamento = minhas.filter((p) => p.status === "SAIU_PARA_ENTREGA");
  const historico = minhas.filter((p) => p.status === "ENTREGUE" || p.status === "CANCELADO");

  function abrir(id: string, tipo: "finalizar" | "cancelar") {
    setAcao({ id, tipo });
    setCodigo("");
    setMotivo("");
    setAviso(null);
  }

  async function aceitar(pedido: Pedido) {
    setAviso(null);
    setSalvando(pedido.id);
    try {
      await api.patch(`/entregas/${pedido.id}/aceitar`);
      setAviso({ tipo: "ok", texto: `Entrega #${pedido.numero} aceita! Ela está em "Em andamento".` });
      setAba("andamento");
      carregar();
    } catch (err) {
      setAviso({ tipo: "erro", texto: getErrorMessage(err) });
      carregar(); // outro entregador pode ter pegado antes: atualiza a lista
    } finally {
      setSalvando("");
    }
  }

  async function finalizar(event: SubmitEvent, pedido: Pedido) {
    event.preventDefault();
    setAviso(null);
    setSalvando(pedido.id);
    try {
      await api.patch(`/entregas/${pedido.id}/finalizar`, { codigo });
      setAviso({ tipo: "ok", texto: `Entrega #${pedido.numero} finalizada. Bom trabalho!` });
      setAcao(null);
      carregar();
    } catch (err) {
      setAviso({ tipo: "erro", texto: getErrorMessage(err) });
    } finally {
      setSalvando("");
    }
  }

  async function cancelar(event: SubmitEvent, pedido: Pedido) {
    event.preventDefault();
    setAviso(null);
    setSalvando(pedido.id);
    try {
      await api.patch(`/entregas/${pedido.id}/cancelar`, { motivo });
      setAviso({ tipo: "ok", texto: `Entrega #${pedido.numero} cancelada. O motivo foi enviado para a loja e o cliente.` });
      setAcao(null);
      carregar();
    } catch (err) {
      setAviso({ tipo: "erro", texto: getErrorMessage(err) });
    } finally {
      setSalvando("");
    }
  }

  // Pede o resgate do saldo (por enquanto fica "Solicitado"; o envio ao banco vem numa próxima versão)
  async function resgatar(event: SubmitEvent) {
    event.preventDefault();
    setAviso(null);
    setSalvando("resgate");
    try {
      const valor = Number(valorResgate.replace(",", "."));
      await api.post("/entregas/resgates", { valor, chavePix });
      setAviso({
        tipo: "ok",
        texto: `Resgate de ${formatPrice(valor)} solicitado! Ele aparece em "Meus resgates" com o status Solicitado.`,
      });
      setResgateAberto(false);
      setValorResgate("");
      carregar();
    } catch (err) {
      setAviso({ tipo: "erro", texto: getErrorMessage(err) });
    } finally {
      setSalvando("");
    }
  }

  // Bloco com os dados da entrega (endereço, itens, valor a cobrar)
  function DadosEntrega({ pedido, mostrarContato }: { pedido: Pedido; mostrarContato: boolean }) {
    return (
      <>
        <div className="kitchen-card-header">
          <strong>#{pedido.numero}</strong>
          <span className="muted small">{formatDate(pedido.createdAt)}</span>
        </div>
        <p className="entrega-endereco">📍 {pedido.endereco}</p>
        {/* Nome e telefone do cliente só depois de aceitar */}
        {mostrarContato && (
          <p className="small">
            👤 <strong>{pedido.user.name}</strong>
            {pedido.telefone && (
              <>
                {" "}• 📞 <a href={`tel:${pedido.telefone}`}>{pedido.telefone}</a>
              </>
            )}
          </p>
        )}
        <ul className="kitchen-items">
          {pedido.itens.map((item) => (
            <li key={item.id}>
              <strong>{item.quantidade}x</strong> {item.lanche.nome}
            </li>
          ))}
        </ul>
        {pedido.observacao && <p className="small note">📝 {pedido.observacao}</p>}
        <p className="entrega-cobrar">
          Cobrar: <strong className="price">{formatPrice(pedido.total)}</strong> • {PAGAMENTO_LABEL[pedido.formaPagamento]}
          {pedido.trocoPara && ` (troco p/ ${formatPrice(pedido.trocoPara)})`}
        </p>
      </>
    );
  }

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Entregas</h1>
          <p className="muted mono">&gt; aceite, entregue e finalize com o código do cliente_</p>
        </div>
        <span className="muted small">Atualiza sozinho a cada 10s</span>
      </div>

      {/* ===== Painel de ganhos ===== */}
      {ganhos && (
        <div className="stats ganhos-stats">
          <div className="card stat">
            <span className="muted small">Ganhos de hoje</span>
            <strong>{formatPrice(ganhos.hoje.valor)}</strong>
            <span className="muted small">
              {ganhos.hoje.entregas} {ganhos.hoje.entregas === 1 ? "entrega" : "entregas"}
            </span>
          </div>
          <div className="card stat stat-saldo">
            <span className="muted small">Saldo disponível</span>
            <strong>{formatPrice(ganhos.saldoDisponivel)}</strong>
            <button
              type="button"
              className="btn-sm"
              disabled={ganhos.saldoDisponivel <= 0}
              onClick={() => {
                setAba("ganhos");
                setResgateAberto(true);
                setValorResgate(ganhos.saldoDisponivel.toFixed(2).replace(".", ","));
              }}
            >
              Resgatar
            </button>
          </div>
          <div className="card stat">
            <span className="muted small">Total ganho / resgatado</span>
            <strong>{formatPrice(ganhos.totalGanho)}</strong>
            <span className="muted small">{formatPrice(ganhos.totalResgatado)} resgatado</span>
          </div>
        </div>
      )}

      <div className="chips">
        <button type="button" className={`chip ${aba === "disponiveis" ? "chip-active" : ""}`} onClick={() => setAba("disponiveis")}>
          Disponíveis ({disponiveis.length})
        </button>
        <button type="button" className={`chip ${aba === "andamento" ? "chip-active" : ""}`} onClick={() => setAba("andamento")}>
          Em andamento ({emAndamento.length})
        </button>
        <button type="button" className={`chip ${aba === "historico" ? "chip-active" : ""}`} onClick={() => setAba("historico")}>
          Histórico ({historico.length})
        </button>
        <button type="button" className={`chip ${aba === "ganhos" ? "chip-active" : ""}`} onClick={() => setAba("ganhos")}>
          Ganhos
        </button>
      </div>

      {aviso && (
        <p className={`alert ${aviso.tipo === "ok" ? "alert-success" : "alert-error"}`}>
          {aviso.tipo === "ok" ? "✓ " : ""}
          {aviso.texto}
        </p>
      )}
      {loading && <p className="muted mono">&gt; buscando entregas..._</p>}

      {/* ===== Disponíveis: só ACEITAR ===== */}
      {aba === "disponiveis" && (
        <div className="entregas-grid">
          {!loading && disponiveis.length === 0 && (
            <p className="muted mono">&gt; nenhuma entrega pronta no momento_</p>
          )}
          {disponiveis.map((pedido) => (
            <article key={pedido.id} className="card kitchen-card">
              <DadosEntrega pedido={pedido} mostrarContato={false} />
              <button type="button" className="btn-block" disabled={salvando === pedido.id} onClick={() => aceitar(pedido)}>
                {salvando === pedido.id ? "Aceitando..." : "Aceitar entrega"}
              </button>
            </article>
          ))}
        </div>
      )}

      {/* ===== Em andamento: FINALIZAR (código) ou CANCELAR (motivo) ===== */}
      {aba === "andamento" && (
        <div className="entregas-grid">
          {!loading && emAndamento.length === 0 && (
            <p className="muted mono">&gt; você não tem entregas em andamento_</p>
          )}
          {emAndamento.map((pedido) => {
            const aberta = acao?.id === pedido.id ? acao.tipo : null;

            return (
              <article key={pedido.id} className="card kitchen-card entrega-andamento">
                <DadosEntrega pedido={pedido} mostrarContato />

                {aberta === "finalizar" && (
                  <form className="entrega-form" onSubmit={(e) => finalizar(e, pedido)}>
                    <label>
                      Código de entrega (peça ao cliente)
                      <input
                        className="codigo-input"
                        value={codigo}
                        onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        inputMode="numeric"
                        placeholder="0000"
                        autoFocus
                        required
                      />
                    </label>
                    <div className="entrega-botoes">
                      <button type="submit" disabled={codigo.length !== 4 || salvando === pedido.id}>
                        Confirmar entrega
                      </button>
                      <button type="button" className="btn-outline" onClick={() => setAcao(null)}>
                        Voltar
                      </button>
                    </div>
                  </form>
                )}

                {aberta === "cancelar" && (
                  <form className="entrega-form" onSubmit={(e) => cancelar(e, pedido)}>
                    <label>
                      Motivo do cancelamento (obrigatório)
                      <textarea
                        rows={3}
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        placeholder="Ex: cliente não atendeu no endereço após 3 tentativas"
                        maxLength={300}
                        autoFocus
                        required
                      />
                    </label>
                    <p className="muted small">
                      {motivo.trim().length < 10
                        ? `Escreva pelo menos 10 caracteres (faltam ${10 - motivo.trim().length}).`
                        : "O motivo será mostrado para a loja e para o cliente."}
                    </p>
                    <div className="entrega-botoes">
                      {/* Sem motivo preenchido o botão fica desabilitado (o backend também recusa) */}
                      <button
                        type="submit"
                        className="btn-danger"
                        disabled={motivo.trim().length < 10 || salvando === pedido.id}
                      >
                        Cancelar entrega
                      </button>
                      <button type="button" className="btn-outline" onClick={() => setAcao(null)}>
                        Voltar
                      </button>
                    </div>
                  </form>
                )}

                {!aberta && (
                  <div className="entrega-botoes">
                    <button type="button" onClick={() => abrir(pedido.id, "finalizar")}>
                      Finalizar entrega
                    </button>
                    <button type="button" className="btn-outline-danger" onClick={() => abrir(pedido.id, "cancelar")}>
                      Cancelar entrega
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* ===== Ganhos: por dia + resgate ===== */}
      {aba === "ganhos" && ganhos && (
        <div className="ganhos-layout">
          <section className="card">
            <h2>Ganhos por dia</h2>
            <p className="muted small">Últimos 30 dias • você ganha a taxa de entrega de cada pedido entregue</p>
            {ganhos.porDia.length === 0 ? (
              <p className="muted mono ganhos-vazio">&gt; nenhuma entrega finalizada nos últimos 30 dias_</p>
            ) : (
              <table className="ganhos-tabela">
                <thead>
                  <tr>
                    <th>Dia</th>
                    <th>Entregas</th>
                    <th>Ganho</th>
                  </tr>
                </thead>
                <tbody>
                  {ganhos.porDia.map((d) => (
                    <tr key={d.data}>
                      <td>{formatDia(d.data)}</td>
                      <td>{d.entregas}</td>
                      <td className="price">{formatPrice(d.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="card form">
            <h2>Resgatar dinheiro</h2>
            <p className="muted small">
              Saldo disponível: <strong className="price">{formatPrice(ganhos.saldoDisponivel)}</strong>
            </p>

            {!resgateAberto ? (
              <button
                type="button"
                disabled={ganhos.saldoDisponivel <= 0}
                onClick={() => {
                  setResgateAberto(true);
                  setValorResgate(ganhos.saldoDisponivel.toFixed(2).replace(".", ","));
                }}
              >
                {ganhos.saldoDisponivel > 0 ? "Resgatar saldo" : "Sem saldo para resgatar"}
              </button>
            ) : (
              <form className="form" onSubmit={resgatar}>
                <label>
                  Valor (R$)
                  <input
                    value={valorResgate}
                    onChange={(e) => setValorResgate(e.target.value.replace(/[^\d,.]/g, ""))}
                    inputMode="decimal"
                    placeholder="0,00"
                    required
                  />
                </label>
                <label>
                  Chave Pix (para onde enviar)
                  <input
                    value={chavePix}
                    onChange={(e) => setChavePix(e.target.value)}
                    placeholder="CPF, e-mail, telefone ou chave aleatória"
                    maxLength={140}
                    required
                  />
                </label>
                <p className="muted small">
                  O valor sai do seu saldo agora e o resgate fica como <strong>Solicitado</strong>. O envio automático
                  para o banco será ativado numa próxima atualização.
                </p>
                <div className="entrega-botoes">
                  <button type="submit" disabled={salvando === "resgate"}>
                    {salvando === "resgate" ? "Solicitando..." : "Confirmar resgate"}
                  </button>
                  <button type="button" className="btn-outline" onClick={() => setResgateAberto(false)}>
                    Voltar
                  </button>
                </div>
              </form>
            )}

            <h3 className="resgates-titulo">Meus resgates</h3>
            {ganhos.resgates.length === 0 ? (
              <p className="muted mono">&gt; nenhum resgate ainda_</p>
            ) : (
              <ul className="resgates-lista">
                {ganhos.resgates.map((r) => (
                  <li key={r.id}>
                    <div>
                      <strong>{formatPrice(r.valor)}</strong>
                      <p className="muted small">
                        {formatDate(r.createdAt)} • Pix: {r.chavePix}
                      </p>
                      {r.observacao && <p className="muted small">{r.observacao}</p>}
                    </div>
                    <span className={`status resgate-${r.status}`}>{RESGATE_LABEL[r.status]}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {/* ===== Histórico (só leitura) ===== */}
      {aba === "historico" && (
        <div className="order-list">
          {!loading && historico.length === 0 && <p className="muted mono">&gt; nenhuma entrega finalizada ainda_</p>}
          {historico.map((pedido) => (
            <div key={pedido.id} className="card order-row">
              <div>
                <strong>#{pedido.numero}</strong> <span className="muted small">• {formatDate(pedido.createdAt)}</span>
                <p className="small">📍 {pedido.endereco}</p>
                {pedido.motivoCancelamento && <p className="small note">Motivo: {pedido.motivoCancelamento}</p>}
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
