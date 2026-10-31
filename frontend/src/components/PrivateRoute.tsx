// Importa os componentes de navegação do React Router
import { Navigate, Outlet, useLocation } from "react-router-dom";
// Importa o contexto de autenticação
import { useAuth, User } from "../contexts/AuthContext";

// Protege rotas (equivalente ao isAuthenticated / isStaff / isAdmin do backend)
// roles: perfis que podem acessar; se não for informado, basta estar logado
export function PrivateRoute({ roles }: { roles?: User["role"][] }) {
  const { user, loading } = useAuth();
  // Endereço atual: depois do login o usuário volta para cá
  const location = useLocation();

  // Ainda verificando o token salvo: mostra um aviso de carregamento
  if (loading) {
    return <p className="muted">Carregando...</p>;
  }

  // Não está logado: manda para o login, lembrando de onde veio
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Logado, mas sem o perfil necessário: volta para o início
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // Liberado: mostra a tela da rota
  return <Outlet />;
}
