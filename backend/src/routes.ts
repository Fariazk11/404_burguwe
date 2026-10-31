// Importa o Router do express, que organiza as rotas da aplicação
import { Router } from "express";

// ----- Middlewares -----
// Valida os dados da requisição usando um schema do Zod
import { validateSchema } from "./middlewares/validateSchema";
// Verifica se o usuário está logado (token JWT válido)
import { isAuthenticated } from "./middlewares/isAuthenticated";
// Verifica se o usuário logado é ADMIN
import { isAdmin } from "./middlewares/isAdmin";
// Verifica se o perfil do usuário logado está entre os permitidos (ex: hasRole(["COZINHA", "ADMIN"]))
import { hasRole } from "./middlewares/hasRole";

// ----- Schemas (regras de validação) -----
import { createUserSchema, authUserSchema, createFuncionarioSchema } from "./schemas/userSchema";
import {
  updatePerfilSchema,
  resetSenhaSchema,
  updateMeSchema,
  changeSenhaSchema,
} from "./schemas/usuarioSchema";
import { createLancheSchema, updateLancheSchema } from "./schemas/lancheSchema";
import {
  createPedidoSchema,
  createPedidoMesaSchema,
  updateStatusPedidoSchema,
} from "./schemas/pedidoSchema";

// ----- Controllers de usuário -----
import { CreateUserController } from "./controllers/user/CreateUserController";
import { AuthUserController } from "./controllers/user/AuthUserController";
import { DetailUserController } from "./controllers/user/DetailUserController";
import {
  CreateFuncionarioController,
  ListFuncionariosController,
} from "./controllers/user/FuncionarioControllers";
import {
  ListUsuariosController,
  UpdatePerfilController,
  ResetSenhaController,
  UpdateMeController,
  ChangeSenhaController,
} from "./controllers/user/UsuarioControllers";
import {
  ListEntregasDisponiveisController,
  ListMinhasEntregasController,
  AceitarEntregaController,
  FinalizarEntregaController,
  CancelarEntregaController,
} from "./controllers/entrega/EntregaControllers";
import { finalizarEntregaSchema, cancelarEntregaSchema } from "./schemas/entregaSchema";

// ----- Controllers de lanche -----
import { CreateLancheController } from "./controllers/lanche/CreateLancheController";
import { ListLancheController } from "./controllers/lanche/ListLancheController";
import { UpdateLancheController } from "./controllers/lanche/UpdateLancheController";

// ----- Controllers de pedido -----
import {
  CreatePedidoController,
  CreatePedidoMesaController,
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

// ===== MINHA CONTA (qualquer usuário logado) =====
// Alterar o próprio nome
router.patch("/me", isAuthenticated, validateSchema(updateMeSchema), new UpdateMeController().handle);

// Trocar a própria senha (precisa da senha atual)
router.patch(
  "/me/senha",
  isAuthenticated,
  validateSchema(changeSenhaSchema),
  new ChangeSenhaController().handle
);

// ===== USUÁRIOS (somente ADMIN) =====
// Listar todas as contas (?busca= filtra por nome ou e-mail)
router.get("/usuarios", isAuthenticated, isAdmin, new ListUsuariosController().handle);

// Mudar o perfil de uma conta (CLIENTE, STAFF, COZINHA ou ADMIN)
router.patch(
  "/usuarios/:id/perfil",
  isAuthenticated,
  isAdmin,
  validateSchema(updatePerfilSchema),
  new UpdatePerfilController().handle
);

// Definir uma senha nova para uma conta (ex: a pessoa esqueceu a senha)
router.patch(
  "/usuarios/:id/senha",
  isAuthenticated,
  isAdmin,
  validateSchema(resetSenhaSchema),
  new ResetSenhaController().handle
);

// ===== ROTAS DE FUNCIONÁRIO (somente ADMIN) =====
// Criar conta da equipe: garçom (STAFF) ou COZINHA
router.post(
  "/funcionarios",
  isAuthenticated,
  isAdmin,
  validateSchema(createFuncionarioSchema),
  new CreateFuncionarioController().handle
);

// Listar os funcionários
router.get("/funcionarios", isAuthenticated, isAdmin, new ListFuncionariosController().handle);

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

// Pedido feito NA MESA: o garçom (STAFF) ou o ADMIN lança pelo salão
router.post(
  "/pedidos/mesa",
  isAuthenticated,
  hasRole(["STAFF", "ADMIN"]),
  validateSchema(createPedidoMesaSchema),
  new CreatePedidoMesaController().handle
);

// Pedidos do usuário logado
// (precisa vir ANTES de "/pedidos/:id", senão o "me" seria lido como um id)
router.get("/pedidos/me", isAuthenticated, new ListMyPedidosController().handle);

// Pedidos da equipe: COZINHA e ADMIN veem todos; o garçom (STAFF) vê só os que ele lançou
router.get(
  "/pedidos",
  isAuthenticated,
  hasRole(["STAFF", "COZINHA", "ADMIN"]),
  new ListPedidosController().handle
);

// Detalhes de um pedido: o dono, a COZINHA ou o ADMIN
router.get("/pedidos/:id", isAuthenticated, new DetailPedidoController().handle);

// Alterar o status do pedido: COZINHA e ADMIN em qualquer pedido; o garçom só nos dele
router.patch(
  "/pedidos/:id/status",
  isAuthenticated,
  hasRole(["STAFF", "COZINHA", "ADMIN"]),
  validateSchema(updateStatusPedidoSchema),
  new UpdateStatusPedidoController().handle
);

// ===== ROTAS DE ENTREGA (somente ENTREGADOR) =====
// Entregas prontas esperando um entregador
router.get(
  "/entregas/disponiveis",
  isAuthenticated,
  hasRole(["ENTREGADOR"]),
  new ListEntregasDisponiveisController().handle
);

// Entregas que o entregador logado aceitou (em andamento e histórico)
router.get(
  "/entregas/minhas",
  isAuthenticated,
  hasRole(["ENTREGADOR"]),
  new ListMinhasEntregasController().handle
);

// Aceitar uma entrega (o pedido passa para "Saiu para entrega")
router.patch(
  "/entregas/:id/aceitar",
  isAuthenticated,
  hasRole(["ENTREGADOR"]),
  new AceitarEntregaController().handle
);

// Finalizar com o código de 4 dígitos que o cliente vê na página do pedido
router.patch(
  "/entregas/:id/finalizar",
  isAuthenticated,
  hasRole(["ENTREGADOR"]),
  validateSchema(finalizarEntregaSchema),
  new FinalizarEntregaController().handle
);

// Cancelar a entrega: o motivo é obrigatório
router.patch(
  "/entregas/:id/cancelar",
  isAuthenticated,
  hasRole(["ENTREGADOR"]),
  validateSchema(cancelarEntregaSchema),
  new CancelarEntregaController().handle
);

// O cliente cancela o próprio pedido (enquanto estiver PENDENTE)
router.patch(
  "/pedidos/:id/cancelar",
  isAuthenticated,
  new CancelPedidoController().handle
);

// Exporta as rotas para serem usadas no server.ts
export { router };
