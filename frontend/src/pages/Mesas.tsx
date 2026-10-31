import { SubmitEvent, useEffect, useState } from "react";
import { api, getErrorMessage } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import {
  FormaPagamento,
  Lanche,
  PAGAMENTO_LABEL,
  Pedido,
  formatDate,
  formatPrice,
} from "../types";
import { LancheImage } from "../components/LancheImage";
import { StatusBadge } from "../components/StatusPedido";

// Quantidade de mesas do salão (botões de atalho); outras mesas podem ser digitadas
const TOTAL_MESAS = 12;
const FILTROS = ["Todos", "Pequeno", "Médio", "Grande"];

// Um item da comanda que o funcionário está montando
interface ItemComanda {
  lanche: Lanche;
  quantidade: number;
  observacao: string;
}

// Página da EQUIPE: lançar pedidos dos clientes que estão nas mesas do salão
// (usa GET /lanches, POST /pedidos/mesa, GET /pedidos e PATCH /pedidos/:id/status)
export function Mesas() {
  // ----- Cardápio -----
  const [lanches, setLanches] = useState<Lanche[]>([]);
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("Todos");

  // ----- Comanda em montagem -----
  const [mesa, setMesa] = useState<number | "">("");
  const [nomeCliente, setNomeCliente] = useState("");
  const [itens, setItens] = useState<ItemComanda[]>([]);
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("CARTAO");
  const [trocoPara, setTrocoPara] = useState("");
  const [observacao, setObservacao] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sucesso, setSucesso] = useState("");

  // ----- Pedidos de mesa -----
  // Para o funcionário (STAFF) o backend devolve SOMENTE os pedidos que ele lançou;
  // o ADMIN recebe os de todos
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [updating, setUpdating] = useState("");
  const [aba, setAba] = useState<"abertos" | "finalizados">("abertos");

  // Carrega o cardápio uma vez
  useEffect(() => {
    api
      .get<Lanche[]>("/lanches")
      .then((response) => setLanches(response.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  // Carrega os pedidos e atualiza a cada 10 segundos (para ver o que ficou pronto)
  function carregarPedidos() {
    api
      .get<Pedido[]>("/pedidos")
      .then((response) => setPedidos(response.data))
      .catch((err) => setError(getErrorMessage(err)));
  }

  useEffect(() => {
    carregarPedidos();
    const intervalo = setInterval(carregarPedidos, 10000);
    return () => clearInterval(intervalo);
  }, []);

  // Pedidos de mesa que ainda não foram servidos nem cancelados, agrupados por mesa
  const abertos = pedidos.filter(
    (p) => p.tipoEntrega === "MESA" && p.status !== "ENTREGUE" && p.status !== "CANCELADO"
  );
  const mesasAbertas = [...new Set(abertos.map((p) => p.mesa as number))].sort((a, b) => a - b);
  // Pedidos de mesa já servidos ou cancelados (mais recentes primeiro)
  const finalizados = pedidos
    .filter((p) => p.tipoEntrega === "MESA" && (p.status === "ENTREGUE" || p.status === "CANCELADO"))
    .reverse();

  // ----- Ações da comanda -----
  function adicionar(lanche: Lanche) {
    setSucesso("");
    setItens((atual) => {
      const existe = atual.find((i) => i.lanche.id === lanche.id);
      if (existe) {
        return atual.map((i) =>
          i.lanche.id === lanche.id ? { ...i, quantidade: Math.min(i.quantidade + 1, 50) } : i
        );
      }
      return [...atual, { lanche, quantidade: 1, observacao: "" }];
    });
  }

  function mudarQuantidade(id: string, quantidade: number) {
    setItens((atual) =>
      quantidade <= 0
        ? atual.filter((i) => i.lanche.id !== id)
        : atual.map((i) => (i.lanche.id === id ? { ...i, quantidade: Math.min(quantidade, 50) } : i))
    );
  }

  function mudarObservacao(id: string, texto: string) {
    setItens((atual) => atual.map((i) => (i.lanche.id === id ? { ...i, observacao: texto } : i)));
  }

  function limparComanda() {
    setItens([]);
    setNomeCliente("");
    setObservacao("");
    setTrocoPara("");
    setError("");
  }

  const qtdNaComanda = (id: string) => itens.find((i) => i.lanche.id === id)?.quantidade ?? 0;
  const total = itens.reduce((soma, i) => soma + i.lanche.preco * i.quantidade, 0);

  // Envia a comanda para a cozinha
  async function enviar(event: SubmitEvent) {
    event.preventDefault();
    setError("");
    setSucesso("");

    if (mesa === "") {
      setError("Escolha o número da mesa");
      return;
    }
    if (itens.length === 0) {
      setError("Adicione pelo menos um lanche à comanda");
      return;
    }

    setSending(true);
    try {
      const response = await api.post<Pedido>("/pedidos/mesa", {
        mesa,
        nomeCliente: nomeCliente.trim() || undefined,
        itens: itens.map((i) => ({
          lancheId: i.lanche.id,
          quantidade: i.quantidade,
          observacao: i.observacao.trim() || undefined,
        })),
        formaPagamento,
        trocoPara: formaPagamento === "DINHEIRO" && trocoPara ? Number(trocoPara) : undefined,
        observacao: observacao.trim() || undefined,
      });

      setSucesso(`Pedido #${response.data.numero} da mesa ${mesa} enviado para a cozinha!`);
      setPedidos((atual) => [...atual, response.data]);
      limparComanda();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  // Muda o status de um pedido: "ENTREGUE" (servido na mesa) ou "CANCELADO"
  async function mudarStatus(pedido: Pedido, status: "ENTREGUE" | "CANCELADO") {
    if (status === "CANCELADO" && !confirm(`Cancelar o pedido #${pedido.numero} da mesa ${pedido.mesa}?`)) return;

    setUpdating(pedido.id);
    try {
      const response = await api.patch<Pedido>(`/pedidos/${pedido.id}/status`, { status });
      setPedidos((atual) => atual.map((p) => (p.id === pedido.id ? response.data : p)));
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setUpdating("");
    }
  }

  // Cardápio filtrado (só lanches disponíveis podem ser lançados)
  const term = search.toLowerCase();
  const cardapio = lanches
    .filter((l) => filtro === "Todos" || l.tamanho === filtro)
    .filter((l) => l.nome.toLowerCase().includes(term) || l.ingredientes.toLowerCase().includes(term))
    .sort((a, b) => Number(b.disponivel) - Number(a.disponivel) || a.nome.localeCompare(b.nome));

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Pedidos na mesa</h1>
          <p className="muted mono">
            {isAdmin
              ? "> terminal do salão: lance o pedido e ele vai direto para a cozinha_"
              : `> terminal de ${user?.name.split(" ")[0]}: você vê só os pedidos que lançou_`}
          </p>
        </div>
      </div>

      <div className="mesa-layout">
        {/* ===== Coluna da esquerda: cardápio ===== */}
        <section className="mesa-menu">
          <div className="menu-toolbar">
            <div className="chips">
              {FILTROS.map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`chip ${filtro === f ? "chip-active" : ""}`}
                  onClick={() => setFiltro(f)}
                >
                  {f}
                </button>
              ))}
            </div>
            <input
              className="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="> buscar lanche..."
            />
          </div>

          <ul className="mesa-cardapio">
            {cardapio.map((lanche) => {
              const qtd = qtdNaComanda(lanche.id);
              return (
                <li key={lanche.id}>
                  <button
                    type="button"
                    className={`mesa-lanche ${qtd > 0 ? "na-comanda" : ""}`}
                    disabled={!lanche.disponivel}
                    onClick={() => adicionar(lanche)}
                  >
                    <LancheImage src={lanche.imagem} alt="" className="thumb" />
                    <span className="mesa-lanche-info">
                      <strong>{lanche.nome}</strong>
                      <small>{lanche.disponivel ? lanche.tamanho : "Esgotado"}</small>
                    </span>
                    <span className="mesa-lanche-preco">{formatPrice(lanche.preco)}</span>
                    <span className="mesa-lanche-add">{qtd > 0 ? `${qtd}x` : "+"}</span>
                  </button>
                </li>
              );
            })}
            {cardapio.length === 0 && <p className="muted mono">&gt; nenhum lanche encontrado_</p>}
          </ul>
        </section>

        {/* ===== Coluna da direita: comanda ===== */}
        <form className="card comanda" onSubmit={enviar}>
          <h2>Comanda</h2>

          <div>
            <span className="comanda-label">Mesa</span>
            <div className="mesa-picker">
              {Array.from({ length: TOTAL_MESAS }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`mesa-btn ${mesa === n ? "selected" : ""} ${mesasAbertas.includes(n) ? "ocupada" : ""}`}
                  onClick={() => setMesa(n)}
                  title={mesasAbertas.includes(n) ? "Mesa com pedido em aberto" : "Mesa livre"}
                >
                  {String(n).padStart(2, "0")}
                </button>
              ))}
            </div>
            <label className="mesa-outra">
              Outra mesa
              <input
                type="number"
                min={1}
                max={999}
                value={mesa}
                onChange={(e) => setMesa(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="nº"
              />
            </label>
          </div>

          <label>
            Nome do cliente (opcional)
            <input
              value={nomeCliente}
              onChange={(e) => setNomeCliente(e.target.value)}
              placeholder="Ex: Ana"
              maxLength={60}
            />
          </label>

          {itens.length === 0 ? (
            <p className="muted mono comanda-vazia">&gt; toque nos lanches para adicionar_</p>
          ) : (
            <ul className="cart-list comanda-itens">
              {itens.map((item) => (
                <li key={item.lanche.id} className="cart-item">
                  <div className="cart-item-info">
                    <div className="cart-item-top">
                      <strong>{item.lanche.nome}</strong>
                      <span>{formatPrice(item.lanche.preco * item.quantidade)}</span>
                    </div>
                    <input
                      className="input-sm"
                      value={item.observacao}
                      onChange={(e) => mudarObservacao(item.lanche.id, e.target.value)}
                      placeholder="Observação (ex: sem cebola)"
                      maxLength={200}
                    />
                    <div className="cart-item-bottom">
                      <div className="qty">
                        <button type="button" onClick={() => mudarQuantidade(item.lanche.id, item.quantidade - 1)}>
                          −
                        </button>
                        <span>{item.quantidade}</span>
                        <button type="button" onClick={() => mudarQuantidade(item.lanche.id, item.quantidade + 1)}>
                          +
                        </button>
                      </div>
                      <button type="button" className="link-danger" onClick={() => mudarQuantidade(item.lanche.id, 0)}>
                        Remover
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div>
            <span className="comanda-label">Pagamento (no fechamento da mesa)</span>
            <div className="options">
              {(Object.keys(PAGAMENTO_LABEL) as FormaPagamento[]).map((forma) => (
                <label key={forma} className={`option ${formaPagamento === forma ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="pagamento"
                    checked={formaPagamento === forma}
                    onChange={() => setFormaPagamento(forma)}
                  />
                  {forma === "CARTAO" ? "Cartão" : PAGAMENTO_LABEL[forma]}
                </label>
              ))}
            </div>
          </div>

          {formaPagamento === "DINHEIRO" && (
            <label>
              Troco para (opcional)
              <input
                type="number"
                min={0}
                step="0.01"
                value={trocoPara}
                onChange={(e) => setTrocoPara(e.target.value)}
                placeholder="Ex: 100"
              />
            </label>
          )}

          <label>
            Observação geral (opcional)
            <textarea
              rows={2}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: trazer tudo junto"
              maxLength={300}
            />
          </label>

          <div className="summary-line total">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>

          {error && <p className="alert alert-error">{error}</p>}
          {sucesso && <p className="alert alert-success">✓ {sucesso}</p>}

          <button type="submit" className="btn-block" disabled={sending}>
            {sending ? "Enviando..." : mesa === "" ? "Enviar para a cozinha" : `Enviar mesa ${mesa} para a cozinha`}
          </button>
          {itens.length > 0 && (
            <button type="button" className="btn-outline btn-block" onClick={limparComanda}>
              Limpar comanda
            </button>
          )}
        </form>
      </div>

      {/* ===== Pedidos de mesa (funcionário: só os que ELE lançou; admin: todos) ===== */}
      <section className="mesas-abertas">
        <div className="page-title">
          <h2>
            <span className="h-prefix">//</span> {isAdmin ? "Pedidos das mesas" : "Meus pedidos"}
          </h2>
          <span className="muted small">Atualiza sozinho a cada 10s</span>
        </div>

        <div className="chips">
          <button
            type="button"
            className={`chip ${aba === "abertos" ? "chip-active" : ""}`}
            onClick={() => setAba("abertos")}
          >
            Em aberto ({abertos.length})
          </button>
          <button
            type="button"
            className={`chip ${aba === "finalizados" ? "chip-active" : ""}`}
            onClick={() => setAba("finalizados")}
          >
            Finalizados ({finalizados.length})
          </button>
        </div>

        {aba === "abertos" ? (
          <>
            {mesasAbertas.length === 0 && <p className="muted mono">&gt; nenhuma mesa com pedido em aberto_</p>}

            <div className="mesas-grid">
              {mesasAbertas.map((numero) => {
                const daMesa = abertos.filter((p) => p.mesa === numero);
                const totalMesa = daMesa.reduce((soma, p) => soma + p.total, 0);

                return (
                  <article key={numero} className="card mesa-card">
                    <div className="mesa-card-header">
                      <span className="mesa-tag">🍽️ MESA {numero}</span>
                      <strong className="price">{formatPrice(totalMesa)}</strong>
                    </div>

                    {daMesa.map((pedido) => (
                      <div key={pedido.id} className="mesa-pedido">
                        <div className="mesa-pedido-top">
                          <span>
                            <strong>#{pedido.numero}</strong>
                            {pedido.nomeCliente && ` • ${pedido.nomeCliente}`}
                            <small className="muted"> • {formatDate(pedido.createdAt)}</small>
                          </span>
                          <StatusBadge status={pedido.status} />
                        </div>
                        <p className="small">
                          {pedido.itens.map((i) => `${i.quantidade}x ${i.lanche.nome}`).join(", ")}
                        </p>
                        {/* O admin vê de quem é cada pedido */}
                        {isAdmin && <p className="muted small">lançado por {pedido.user.name}</p>}

                        {pedido.status === "PRONTO" && (
                          <button
                            type="button"
                            className="btn-sm btn-block"
                            disabled={updating === pedido.id}
                            onClick={() => mudarStatus(pedido, "ENTREGUE")}
                          >
                            Servido na mesa
                          </button>
                        )}
                        {/* Dá para cancelar enquanto a cozinha não começou a preparar */}
                        {pedido.status === "PENDENTE" && (
                          <button
                            type="button"
                            className="btn-sm btn-outline-danger"
                            disabled={updating === pedido.id}
                            onClick={() => mudarStatus(pedido, "CANCELADO")}
                          >
                            Cancelar pedido
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      className="btn-outline btn-sm"
                      onClick={() => {
                        setMesa(numero);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      + Novo pedido para a mesa {numero}
                    </button>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <div className="order-list">
            {finalizados.length === 0 && <p className="muted mono">&gt; nenhum pedido finalizado_</p>}
            {finalizados.map((pedido) => (
              <div key={pedido.id} className="card order-row">
                <div>
                  <strong>
                    #{pedido.numero} — Mesa {pedido.mesa}
                    {pedido.nomeCliente && ` (${pedido.nomeCliente})`}
                  </strong>
                  <p className="muted small">
                    {formatDate(pedido.createdAt)}
                    {isAdmin && ` • lançado por ${pedido.user.name}`}
                  </p>
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
      </section>
    </>
  );
}