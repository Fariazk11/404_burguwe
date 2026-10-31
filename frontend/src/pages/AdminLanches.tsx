import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, getErrorMessage } from "../services/api";
import { Lanche, formatPrice } from "../types";
import { LancheImage } from "../components/LancheImage";

// Gerenciamento do cardápio (somente ADMIN)
export function AdminLanches() {
  const [lanches, setLanches] = useState<Lanche[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<Lanche[]>("/lanches")
      .then((response) => setLanches(response.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  // Liga/desliga a venda de um lanche (rota PUT /lanches/:id)
  async function toggleDisponivel(lanche: Lanche) {
    try {
      const response = await api.put<Lanche>(`/lanches/${lanche.id}`, {
        disponivel: !lanche.disponivel,
      });
      setLanches((atual) => atual.map((l) => (l.id === lanche.id ? response.data : l)));
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  return (
    <>
      <div className="page-title">
        <h1>Gerenciar cardápio</h1>
        <Link to="/admin/lanches/novo" className="btn">
          + Novo lanche
        </Link>
      </div>

      {loading && <p className="muted">Carregando...</p>}
      {error && <p className="alert alert-error">{error}</p>}

      <div className="order-list">
        {lanches.map((lanche) => (
          <div key={lanche.id} className="card admin-row">
            <LancheImage src={lanche.imagem} alt={lanche.nome} className="thumb" />
            <div className="admin-row-info">
              <strong>{lanche.nome}</strong>
              <span className="muted small">
                {lanche.tamanho} • {lanche.calorias} kcal • {formatPrice(lanche.preco)}
              </span>
            </div>

            <label className="switch" title="Disponível para venda">
              <input
                type="checkbox"
                checked={lanche.disponivel}
                onChange={() => toggleDisponivel(lanche)}
              />
              <span>{lanche.disponivel ? "À venda" : "Esgotado"}</span>
            </label>

            <Link to={`/admin/lanches/${lanche.id}`} className="btn btn-outline btn-sm">
              Editar
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
