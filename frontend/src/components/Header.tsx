// Importa os componentes de link do React Router (navegam sem recarregar a página)
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";

// Cabeçalho do site: logo, menu, carrinho e login
// O menu muda conforme o perfil:
// - visitante/CLIENTE: cardápio, meus pedidos e carrinho
// - STAFF (garçom): só a tela de mesas (ele só vê os pedidos que lançou)
// - COZINHA: só o painel da cozinha (vê os pedidos de todos)
// - ADMIN: tudo
export function Header() {
  const { user, signOut } = useAuth();
  const { totalItens, openCart } = useCart();

  const isGarcom = user?.role === "STAFF";
  const isCozinha = user?.role === "COZINHA";
  const isAdmin = user?.role === "ADMIN";
  // Equipe (garçom ou cozinha) não usa a loja do site
  const isEquipe = isGarcom || isCozinha;

  // Para onde a logo leva: a tela principal de cada perfil
  const inicio = isGarcom ? "/mesas" : isCozinha ? "/painel" : "/";

  return (
    <header className="header">
      <div className="container header-content">
        <Link to={inicio} className="logo">
          {/* Logo neon da pasta public/img */}
          <img src="/img/logo-404-burger.svg" alt="" className="logo-img" />
          <span className="logo-text">
            <strong className="glitch" data-text="404">404</strong> Burger
          </span>
        </Link>

        <nav>
          {isGarcom && <NavLink to="/mesas">Minhas mesas</NavLink>}
          {isCozinha && <NavLink to="/painel">Cozinha</NavLink>}
          {!isEquipe && (
            <>
              <NavLink to="/" end>
                Cardápio
              </NavLink>
              {user && !isAdmin && <NavLink to="/pedidos">Meus pedidos</NavLink>}
            </>
          )}
          {/* Links só para o admin */}
          {isAdmin && (
            <>
              <NavLink to="/mesas">Mesas</NavLink>
              <NavLink to="/painel">Cozinha</NavLink>
              <NavLink to="/admin/lanches">Lanches</NavLink>
              <NavLink to="/admin/funcionarios">Funcionários</NavLink>
            </>
          )}
        </nav>

        <div className="header-actions">
          {/* A equipe não usa o carrinho do site */}
          {!isEquipe && (
            <button className="cart-button" onClick={openCart} aria-label="Abrir carrinho">
              🛒
              {totalItens > 0 && <span className="cart-count">{totalItens}</span>}
            </button>
          )}

          {user ? (
            <div className="user-info">
              {isGarcom && <span className="role-tag">Garçom</span>}
              {isCozinha && <span className="role-tag role-cozinha">Cozinha</span>}
              <span className="user-name">&gt; {user.name.split(" ")[0]}_</span>
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
