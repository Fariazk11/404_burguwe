import { SubmitEvent, useEffect, useState } from "react";
import { api, getErrorMessage } from "../services/api";
import { formatDate } from "../types";

type PerfilEquipe = "STAFF" | "COZINHA" | "ENTREGADOR";

// Funcionário como o backend devolve em GET /funcionarios
interface Funcionario {
  id: string;
  name: string;
  email: string;
  role: PerfilEquipe;
  createdAt: string;
  pedidosLancados: number;
}

// Perfis que o admin pode criar
const PERFIS: { value: PerfilEquipe; label: string; descricao: string }[] = [
  { value: "STAFF", label: "🍽️ Garçom", descricao: "Lança pedidos de mesa; só vê os dele" },
  { value: "COZINHA", label: "🔥 Cozinha", descricao: "Vê todos os pedidos no painel" },
  { value: "ENTREGADOR", label: "🛵 Entregador", descricao: "Aceita e finaliza entregas com código" },
];

// Tela do ADMIN: cria e lista as contas da equipe
// - Garçom (STAFF): só vê os pedidos de mesa que ele mesmo lançou
// - Cozinha (COZINHA): vê todos os pedidos e atualiza o andamento
export function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<PerfilEquipe>("STAFF");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sucesso, setSucesso] = useState("");

  function carregar() {
    api
      .get<Funcionario[]>("/funcionarios")
      .then((response) => setFuncionarios(response.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(carregar, []);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setError("");
    setSucesso("");
    setSending(true);

    try {
      await api.post("/funcionarios", { name, email, password, role });
      setSucesso(
        `Conta de ${role === "COZINHA" ? "cozinha" : role === "ENTREGADOR" ? "entregador" : "garçom"} criada! ${name} já pode entrar com ${email} e a senha informada.`
      );
      setName("");
      setEmail("");
      setPassword("");
      carregar();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Funcionários</h1>
          <p className="muted mono">
            &gt; contas da equipe: garçons veem só os próprios pedidos; a cozinha vê todos_
          </p>
        </div>
      </div>

      <div className="funcionarios-layout">
        <form className="card form" onSubmit={handleSubmit}>
          <h2>Nova conta da equipe</h2>

          <div>
            <span className="comanda-label">Perfil</span>
            <div className="role-select">
              {PERFIS.map((p) => (
                <label key={p.value} className={`option ${role === p.value ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="perfil"
                    checked={role === p.value}
                    onChange={() => setRole(p.value)}
                  />
                  {p.label}
                  <small>{p.descricao}</small>
                </label>
              ))}
            </div>
          </div>

          <label>
            Nome
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Carlos Silva"
              minLength={3}
              required
            />
          </label>

          <label>
            E-mail (usado para entrar)
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="carlos@404burger.com"
              required
            />
          </label>

          <label>
            Senha inicial
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              required
            />
          </label>

          {error && <p className="alert alert-error">{error}</p>}
          {sucesso && <p className="alert alert-success">✓ {sucesso}</p>}

          <button type="submit" disabled={sending}>
            {sending ? "Criando..." : role === "COZINHA" ? "Criar conta da cozinha" : role === "ENTREGADOR" ? "Criar conta de entregador" : "Criar conta de garçom"}
          </button>
        </form>

        <section className="order-list">
          {loading && <p className="muted mono">&gt; carregando equipe..._</p>}
          {!loading && funcionarios.length === 0 && (
            <p className="muted mono">&gt; nenhum funcionário cadastrado_</p>
          )}

          {funcionarios.map((f) => (
            <div key={f.id} className="card order-row">
              <div>
                <strong>{f.name}</strong>
                <p className="muted small mono">{f.email}</p>
                <p className="muted small">Conta criada em {formatDate(f.createdAt)}</p>
              </div>
              <div className="order-row-right">
                {f.role === "ENTREGADOR" ? (
                  <>
                    <span className="role-tag role-entregador">Entregador</span>
                    <span className="muted small">aceita e finaliza entregas</span>
                  </>
                ) : f.role === "COZINHA" ? (
                  <>
                    <span className="role-tag role-cozinha">Cozinha</span>
                    <span className="muted small">vê todos os pedidos</span>
                  </>
                ) : (
                  <>
                    <span className="role-tag">Garçom</span>
                    <span className="small">
                      {f.pedidosLancados} {f.pedidosLancados === 1 ? "pedido lançado" : "pedidos lançados"}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
