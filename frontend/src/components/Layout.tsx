// Estrutura comum das telas: cabeçalho, conteúdo (Outlet), carrinho e rodapé
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { CartDrawer } from "./CartDrawer";

export function Layout() {
  return (
    <>
      <Header />
      <main className="container main">
        <Outlet />
      </main>
      <CartDrawer />
      <footer className="footer">
        <div className="container footer-content">
          <img src="/img/logo-404-burger.svg" alt="404 Burger" className="footer-logo" />
          <div>
            <p className="footer-brand">404 BURGER // FOME NOT FOUND</p>
            <p>Online todos os dias das 18h às 03h • (11) 99999-0404</p>
            <p className="footer-mono">&gt; status: servidores da chapa operando a 220°C_</p>
          </div>
        </div>
      </footer>
    </>
  );
}
