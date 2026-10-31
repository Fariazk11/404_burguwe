# Frontend — Lanchonete

Site da lanchonete em React + Vite + TypeScript que consome o backend em `../backend`.

## Como rodar

1. Inicie o backend (porta 3333):
   ```bash
   cd ../backend
   npx prisma migrate dev   # aplica as tabelas (só na primeira vez)
   npm run seed             # lanches de exemplo + usuário admin (opcional)
   npm run dev
   ```
2. Em outro terminal, inicie o frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. Acesse http://localhost:5173

Para usar outro endereço de backend, copie `.env.example` para `.env` e ajuste `VITE_API_URL`.

## Perfis

| Perfil    | Como obter                                   | O que pode fazer                                  |
| --------- | -------------------------------------------- | ------------------------------------------------- |
| visitante | —                                            | ver o cardápio e montar o carrinho                |
| `CLIENTE` | se cadastrando no site                       | fazer, acompanhar e cancelar (se pendente) pedidos |
| `STAFF`   | alterar o `role` no banco (`npx prisma studio`) | tudo do cliente + painel da cozinha            |
| `ADMIN`   | seed: `admin@lanchonete.com` / `admin123`    | tudo do STAFF + gerenciar o cardápio              |

## Telas

| Tela               | Rota                  | Endpoints usados                         | Acesso       |
| ------------------ | --------------------- | ---------------------------------------- | ------------ |
| Cardápio + carrinho | `/`                  | `GET /lanches`                           | público      |
| Login / Cadastro   | `/login`, `/cadastro` | `POST /session`, `POST /users`, `GET /me` | público      |
| Finalizar pedido   | `/checkout`           | `POST /pedidos`                          | logado       |
| Meus pedidos       | `/pedidos`            | `GET /pedidos/me`                        | logado       |
| Acompanhar pedido  | `/pedidos/:id`        | `GET /pedidos/:id`, `PATCH /pedidos/:id/cancelar` | logado |
| Cozinha            | `/painel`             | `GET /pedidos`, `PATCH /pedidos/:id/status` | STAFF/ADMIN |
| Gerenciar cardápio | `/admin/lanches`      | `GET /lanches`, `POST /lanches`, `PUT /lanches/:id` | ADMIN |

## Fluxo de um pedido

`PENDENTE` → `EM_PREPARO` → `PRONTO` → `SAIU_PARA_ENTREGA` (só entrega) → `ENTREGUE`

O pedido pode ser cancelado pela equipe a qualquer momento antes de finalizar, e pelo cliente
enquanto estiver `PENDENTE`. As telas de acompanhamento e da cozinha se atualizam sozinhas a cada 10 s.
A taxa de entrega é de R$ 5,00 e os preços são sempre calculados pelo backend.
