import { useEffect, useState } from "react";
import { api, getErrorMessage } from "../services/api";
import { useCart } from "../contexts/CartContext";
import { Lanche, formatPrice } from "../types";
import { LancheImage } from "../components/LancheImage";

// Filtros por tamanho (mesmos valores aceitos pelo backend)
const FILTROS = ["Todos", "Pequeno", "Médio", "Grande"];

// Página inicial: banner + cardápio com botão de adicionar ao carrinho
export function Home() {
  const { items, addItem, openCart, totalItens, subtotal } = useCart();

  const [lanches, setLanches] = useState<Lanche[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("Todos");

  // Busca o cardápio (rota pública GET /lanches) assim que a tela abre
  useEffect(() => {
    api
      .get<Lanche[]>("/lanches")
      .then((response) => setLanches(response.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  // Quantas unidades deste lanche já estão no carrinho
  const qtdNoCarrinho = (id: string) =>
    items.find((i) => i.lanche.id === id)?.quantidade ?? 0;

  // Aplica a busca e o filtro de tamanho; os disponíveis aparecem primeiro
  const term = search.toLowerCase();
  const filtered = lanches
    .filter((l) => filtro === "Todos" || l.tamanho === filtro)
    .filter(
      (l) => l.nome.toLowerCase().includes(term) || l.ingredientes.toLowerCase().includes(term)
    )
    .sort((a, b) => Number(b.disponivel) - Number(a.disponivel));

  return (
    <>
      <section className="hero">
        <div>
          <h1>Fome? A gente resolve. 🍔</h1>
          <p>Hambúrgueres artesanais feitos na hora. Peça para entrega ou retire no balcão.</p>
          <div className="hero-info">
            <span>🛵 Entrega em ~40 min</span>
            <span>🏪 Retirada em ~20 min</span>
            <span>💳 Pix, cartão ou dinheiro</span>
          </div>
        </div>
      </section>

      <div className="menu-toolbar">
        <h2>Cardápio</h2>
        <div className="chips">
          {FILTROS.map((f) => (
            <button
              key={f}
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
          placeholder="🔍 Buscar por nome ou ingrediente..."
        />
      </div>

      {loading && <p className="muted">Carregando cardápio...</p>}
      {error && <p className="alert alert-error">{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="muted">Nenhum lanche encontrado.</p>
      )}

      <div className="grid">
        {filtered.map((lanche) => {
          const qtd = qtdNoCarrinho(lanche.id);

          return (
            <article key={lanche.id} className={`card product ${lanche.disponivel ? "" : "esgotado"}`}>
              <LancheImage src={lanche.imagem} alt={lanche.nome} />

              <div className="product-body">
                <div className="product-header">
                  <h3>{lanche.nome}</h3>
                  <span className="price">{formatPrice(lanche.preco)}</span>
                </div>
                <p>{lanche.descricao}</p>
                <p className="muted small">{lanche.ingredientes}</p>

                <div className="tags">
                  <span className="badge">{lanche.tamanho}</span>
                  <span className="badge">{lanche.calorias} kcal</span>
                </div>

                {lanche.disponivel ? (
                  <button className="btn-block" onClick={() => addItem(lanche)}>
                    {qtd > 0 ? `Adicionar mais um (${qtd} no carrinho)` : "Adicionar ao pedido"}
                  </button>
                ) : (
                  <button className="btn-block" disabled>
                    Esgotado
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Barra fixa no rodapé enquanto houver itens no carrinho */}
      {totalItens > 0 && (
        <button className="floating-cart" onClick={openCart}>
          <span>
            🛒 {totalItens} {totalItens === 1 ? "item" : "itens"}
          </span>
          <span>Ver carrinho • {formatPrice(subtotal)}</span>
        </button>
      )}
    </>
  );
}
