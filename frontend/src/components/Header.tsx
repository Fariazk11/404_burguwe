// Importa os componentes de link do React Router (navegam sem recarregar a página)
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";

// Cabeçalho do site: logo, menu, carrinho e login
export function Header() {
  const { user, signOut } = useAuth();
  const { totalItens, openCart } = useCart();

  // Equipe = STAFF ou ADMIN
  const isEquipe = user?.role === "STAFF" || user?.role === "ADMIN";

  return (
    <header className="header">
      <div className="container header-content">
        <Link to="/" className="logo">
          🍔 <span>Burger da Fatec</span>
        </Link>

        <nav>
          <NavLink to="/" end>
            Cardápio
          </NavLink>
          {user && <NavLink to="/pedidos">Meus pedidos</NavLink>}
          {/* Links só para a equipe */}
          {isEquipe && <NavLink to="/painel">Cozinha</NavLink>}
          {user?.role === "ADMIN" && <NavLink to="/admin/lanches">Gerenciar cardápio</NavLink>}
        </nav>

        <div className="header-actions">
          <button className="cart-button" onClick={openCart} aria-label="Abrir carrinho">
            🛒
            {totalItens > 0 && <span className="cart-count">{totalItens}</span>}
          </button>

          {user ? (
            <div className="user-info">
              <span className="user-name">Olá, {user.name.split(" ")[0]}</span>
              <button className="btn-outline btn-sm" onClick={signOut}>
                Sair
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-sm">
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
