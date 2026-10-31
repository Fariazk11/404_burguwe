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
        <div className="container">
          🍔 Burger da Fatec • Aberto todos os dias das 18h às 23h • (11) 99999-0000
        </div>
      </footer>
    </>
  );
}
