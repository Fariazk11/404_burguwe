// Importa o useState para guardar o que o usuário digita
import { SubmitEvent, useState } from "react";
// Importa o Link (navegação) e o useNavigate (redirecionar após o login)
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getErrorMessage } from "../services/api";

// Tela de login (usa a rota POST /session)
export function Login() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  // Página de onde o usuário veio (ex: /checkout); depois de entrar ele volta para lá
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  // Se já está logado, não precisa ver a tela de login
  if (user) {
    return <Navigate to={from} replace />;
  }

  // Chamada ao enviar o formulário
  async function handleSubmit(event: SubmitEvent) {
    // Impede o navegador de recarregar a página
    event.preventDefault();
    setError("");
    setSending(true);

    try {
      await signIn(email, password);
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
        <h1>Entrar</h1>
        <p className="muted">Entre para fazer e acompanhar seus pedidos</p>

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
            placeholder="Sua senha"
            required
          />
        </label>

        {error && <p className="alert alert-error">{error}</p>}

        <button type="submit" disabled={sending}>
          {sending ? "Entrando..." : "Entrar"}
        </button>

        <p className="muted">
          Não tem conta? <Link to="/cadastro" state={{ from }}>Cadastre-se</Link>
        </p>
      </form>
    </div>
  );
}
