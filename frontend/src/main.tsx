// Ponto de entrada do front-end: desenha a aplicação dentro da <div id="root">
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { Layout } from "./components/Layout";
import { PrivateRoute } from "./components/PrivateRoute";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Cadastro } from "./pages/Cadastro";
import { Checkout } from "./pages/Checkout";
import { MeusPedidos } from "./pages/MeusPedidos";
import { PedidoDetalhe } from "./pages/PedidoDetalhe";
import { Painel } from "./pages/Painel";
import { Mesas } from "./pages/Mesas";
import { Funcionarios } from "./pages/Funcionarios";
import { AdminLanches } from "./pages/AdminLanches";
import { LancheForm } from "./pages/LancheForm";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Todas as telas usam o mesmo layout (cabeçalho + carrinho + rodapé) */}
            <Route element={<Layout />}>
              {/* Rotas públicas */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Cadastro />} />

              {/* Rotas de quem compra pelo site (cliente e admin; funcionário não) */}
              <Route element={<PrivateRoute roles={["CLIENTE", "ADMIN"]} />}>
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/pedidos" element={<MeusPedidos />} />
              </Route>

              {/* Detalhe de um pedido: qualquer perfil (o backend só mostra se o pedido for dele) */}
              <Route element={<PrivateRoute />}>
                <Route path="/pedidos/:id" element={<PedidoDetalhe />} />
              </Route>

              {/* Garçom (STAFF) e ADMIN: lançar os pedidos das mesas */}
              <Route element={<PrivateRoute roles={["STAFF", "ADMIN"]} />}>
                <Route path="/mesas" element={<Mesas />} />
              </Route>

              {/* Painel da cozinha: perfil COZINHA e ADMIN (veem os pedidos de todos) */}
              <Route element={<PrivateRoute roles={["COZINHA", "ADMIN"]} />}>
                <Route path="/painel" element={<Painel />} />
              </Route>

              {/* Rotas somente ADMIN */}
              <Route element={<PrivateRoute roles={["ADMIN"]} />}>
                <Route path="/admin/funcionarios" element={<Funcionarios />} />
                <Route path="/admin/lanches" element={<AdminLanches />} />
                <Route path="/admin/lanches/novo" element={<LancheForm />} />
                <Route path="/admin/lanches/:id" element={<LancheForm />} />
              </Route>

              {/* Qualquer outro endereço volta para o início */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
