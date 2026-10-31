import { SubmitEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getErrorMessage } from "../services/api";

// Tela de cadastro de usuário (usa a rota POST /users e depois POST /session)
export function Cadastro() {
  const { user, signUp } = useAuth();
  const navigate = useNavigate();
  // Página de onde o usuário veio (ex: /checkout); depois de entrar ele volta para lá
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  // Se já está logado, vai direto para o cardápio
  if (user) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setError("");
    setSending(true);

    try {
      // Cadastra e já faz o login automaticamente
      await signUp(name, email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <img src="/img/logo-404-burger.svg" alt="404 Burger" className="auth-logo" />
        <h1>Criar conta</h1>
        <p className="muted mono">&gt; registre seu ID na rede para fazer seu pedido_</p>

        <label>
          Nome
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            minLength={3}
            required
          />
        </label>

        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
            required
          />
        </label>

        <label>
          Senha
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

        <button type="submit" disabled={sending}>
          {sending ? "Cadastrando..." : "Cadastrar"}
        </button>

        <p className="muted">
          Já tem conta? <Link to="/login" state={{ from }}>Entrar</Link>
        </p>
      </form>
    </div>
  );
}
