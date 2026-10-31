import { SubmitEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, getErrorMessage } from "../services/api";
import { Lanche } from "../types";
import { LancheImage } from "../components/LancheImage";

// Tamanhos aceitos pelo backend (mesmos valores do z.enum do lancheSchema)
const TAMANHOS = ["Pequeno", "Médio", "Grande"];

// Formulário de lanche: serve para CADASTRAR (/admin/lanches/novo)
// e para EDITAR (/admin/lanches/:id) — somente ADMIN
export function LancheForm() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [ingredientes, setIngredientes] = useState("");
  const [tamanho, setTamanho] = useState("Médio");
  const [calorias, setCalorias] = useState("");
  const [imagem, setImagem] = useState("");
  const [disponivel, setDisponivel] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  // Na edição, preenche o formulário com os dados atuais do lanche
  useEffect(() => {
    if (!id) return;

    api
      .get<Lanche[]>("/lanches")
      .then((response) => {
        const lanche = response.data.find((l) => l.id === id);
        if (!lanche) {
          setError("Lanche não encontrado");
          return;
        }
        setNome(lanche.nome);
        setDescricao(lanche.descricao);
        setPreco(String(lanche.preco).replace(".", ","));
        setIngredientes(lanche.ingredientes);
        setTamanho(lanche.tamanho);
        setCalorias(String(lanche.calorias));
        setImagem(lanche.imagem ?? "");
        setDisponivel(lanche.disponivel);
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, [id]);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setError("");
    setSending(true);

    const dados = {
      nome,
      descricao,
      // O backend espera NÚMEROS; aceitamos vírgula no preço (ex: "29,90")
      preco: Number(preco.replace(",", ".")),
      ingredientes,
      tamanho,
      calorias: Number(calorias),
      imagem: imagem.trim(),
      disponivel,
    };

    try {
      if (editando) {
        await api.put(`/lanches/${id}`, dados);
      } else {
        await api.post("/lanches", dados);
      }
      navigate("/admin/lanches");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <h1 className="page-heading">{editando ? "Editar lanche" : "Novo lanche"}</h1>

      <form className="card form form-narrow" onSubmit={handleSubmit}>
        <label>
          Nome
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="X-Bacon" minLength={2} required />
        </label>

        <label>
          Descrição
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Pão brioche, hambúrguer 180g, bacon e cheddar"
            minLength={5}
            rows={3}
            required
          />
        </label>

        <label>
          Ingredientes
          <input
            value={ingredientes}
            onChange={(e) => setIngredientes(e.target.value)}
            placeholder="pão, carne, bacon, cheddar, alface"
            minLength={3}
            required
          />
        </label>

        <div className="row">
          <label>
            Preço (R$)
            <input inputMode="decimal" value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="29,90" required />
          </label>

          <label>
            Calorias (kcal)
            <input
              type="number"
              min={1}
              step={1}
              value={calorias}
              onChange={(e) => setCalorias(e.target.value)}
              placeholder="850"
              required
            />
          </label>

          <label>
            Tamanho
            <select value={tamanho} onChange={(e) => setTamanho(e.target.value)}>
              {TAMANHOS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
        </div>

        <label>
          URL da foto (opcional)
          <input
            type="url"
            value={imagem}
            onChange={(e) => setImagem(e.target.value)}
            placeholder="https://..."
          />
        </label>
        {/* Pré-visualização da foto */}
        <LancheImage src={imagem.trim() || null} alt="Pré-visualização" className="preview" />

        <label className="checkbox">
          <input type="checkbox" checked={disponivel} onChange={(e) => setDisponivel(e.target.checked)} />
          Disponível para venda
        </label>

        {error && <p className="alert alert-error">{error}</p>}

        <div className="actions">
          <button type="button" className="btn-outline" onClick={() => navigate("/admin/lanches")}>
            Cancelar
          </button>
          <button type="submit" disabled={sending}>
            {sending ? "Salvando..." : editando ? "Salvar alterações" : "Cadastrar lanche"}
          </button>
        </div>
      </form>
    </>
  );
}
