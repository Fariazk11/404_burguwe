// Importa os componentes de link do React Router (navegam sem recarregar a página)
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { LOGO_SVG } from "../types";

// Cabeçalho do site: logo, menu, carrinho e login
// O menu muda conforme o perfil:
// - visitante/CLIENTE: cardápio, meus pedidos e carrinho
// - STAFF (garçom): só a tela de mesas (ele só vê os pedidos que lançou)
// - COZINHA: só o painel da cozinha (vê os pedidos de todos)
// - ENTREGADOR: só a tela de entregas
// - ADMIN: tudo
export function Header() {
  const { user, signOut } = useAuth();
  const { totalItens, openCart } = useCart();

  const isGarcom = user?.role === "STAFF";
  const isCozinha = user?.role === "COZINHA";
  const isEntregador = user?.role === "ENTREGADOR";
  const isAdmin = user?.role === "ADMIN";
  // Equipe (garçom, cozinha ou entregador) não usa a loja do site
  const isEquipe = isGarcom || isCozinha || isEntregador;

  // Para onde a logo leva: a tela principal de cada perfil
  const inicio = isGarcom ? "/mesas" : isCozinha ? "/painel" : isEntregador ? "/entregas" : "/";

  return (
    <header className="header">
      <div className="container header-content">
        <Link to={inicio} className="logo">
          {/* Logo neon da pasta public/img */}
          <img src={LOGO_SVG} alt="" className="logo-img" />
          <span className="logo-text">
            <strong className="glitch" data-text="404">404</strong> Burger
          </span>
        </Link>

        <nav>
          {isGarcom && <NavLink to="/mesas">Minhas mesas</NavLink>}
          {isCozinha && <NavLink to="/painel">Cozinha</NavLink>}
          {isEntregador && <NavLink to="/entregas">Entregas</NavLink>}
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
              <NavLink to="/admin/usuarios">Usuários</NavLink>
              <NavLink to="/admin/resgates">Resgates</NavLink>
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
              {isEntregador && <span className="role-tag role-entregador">Entregador</span>}
              {/* Clicar no nome abre "Minha conta" (trocar nome e senha) */}
              <Link to="/conta" className="user-name" title="Minha conta">
                &gt; {user.name.split(" ")[0]}_
              </Link>
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
