// Importa o Router do express, que organiza as rotas da aplicação
import { Router } from "express";

// ----- Middlewares -----
// Valida os dados da requisição usando um schema do Zod
import { validateSchema } from "./middlewares/validateSchema";
// Verifica se o usuário está logado (token JWT válido)
import { isAuthenticated } from "./middlewares/isAuthenticated";
// Verifica se o usuário logado é ADMIN
import { isAdmin } from "./middlewares/isAdmin";
// Verifica se o usuário logado é da equipe (STAFF ou ADMIN)
import { isStaff } from "./middlewares/isStaff";

// ----- Schemas (regras de validação) -----
import { createUserSchema, authUserSchema } from "./schemas/userSchema";
import { createLancheSchema, updateLancheSchema } from "./schemas/lancheSchema";
import { createPedidoSchema, updateStatusPedidoSchema } from "./schemas/pedidoSchema";

// ----- Controllers de usuário -----
import { CreateUserController } from "./controllers/user/CreateUserController";
import { AuthUserController } from "./controllers/user/AuthUserController";
import { DetailUserController } from "./controllers/user/DetailUserController";

// ----- Controllers de lanche -----
import { CreateLancheController } from "./controllers/lanche/CreateLancheController";
import { ListLancheController } from "./controllers/lanche/ListLancheController";
import { UpdateLancheController } from "./controllers/lanche/UpdateLancheController";

// ----- Controllers de pedido -----
import {
  CreatePedidoController,
  ListMyPedidosController,
  ListPedidosController,
  DetailPedidoController,
  UpdateStatusPedidoController,
  CancelPedidoController,
} from "./controllers/pedido/PedidoControllers";

// Cria o objeto de rotas
const router = Router();

// ===== ROTAS DE USUÁRIO =====
// Cadastro de usuário: valida o body e chama o controller
router.post(
  "/users",
  validateSchema(createUserSchema),
  new CreateUserController().handle
);

// Login: valida o body e devolve o token JWT
router.post(
  "/session",
  validateSchema(authUserSchema),
  new AuthUserController().handle
);

// Detalhes do usuário logado: precisa estar autenticado
router.get("/me", isAuthenticated, new DetailUserController().handle);

// ===== ROTAS DE LANCHE =====
// Cadastro de lanche: precisa estar logado, ser ADMIN e enviar dados válidos
router.post(
  "/lanches",
  isAuthenticated,
  isAdmin,
  validateSchema(createLancheSchema),
  new CreateLancheController().handle
);

// Listagem de lanches: PÚBLICA, para qualquer visitante ver o cardápio
router.get("/lanches", new ListLancheController().handle);

// Edição de lanche (inclusive ativar/desativar a venda): somente ADMIN
router.put(
  "/lanches/:id",
  isAuthenticated,
  isAdmin,
  validateSchema(updateLancheSchema),
  new UpdateLancheController().handle
);

// ===== ROTAS DE PEDIDO =====
// Fazer um pedido: precisa estar logado
router.post(
  "/pedidos",
  isAuthenticated,
  validateSchema(createPedidoSchema),
  new CreatePedidoController().handle
);

// Pedidos do usuário logado
// (precisa vir ANTES de "/pedidos/:id", senão o "me" seria lido como um id)
router.get("/pedidos/me", isAuthenticated, new ListMyPedidosController().handle);

// Todos os pedidos (painel da cozinha): somente a equipe
router.get("/pedidos", isAuthenticated, isStaff, new ListPedidosController().handle);

// Detalhes de um pedido: o dono ou a equipe
router.get("/pedidos/:id", isAuthenticated, new DetailPedidoController().handle);

// Alterar o status do pedido: somente a equipe
router.patch(
  "/pedidos/:id/status",
  isAuthenticated,
  isStaff,
  validateSchema(updateStatusPedidoSchema),
  new UpdateStatusPedidoController().handle
);

// O cliente cancela o próprio pedido (enquanto estiver PENDENTE)
router.patch(
  "/pedidos/:id/cancelar",
  isAuthenticated,
  new CancelPedidoController().handle
);

// Exporta as rotas para serem usadas no server.ts
export { router };
