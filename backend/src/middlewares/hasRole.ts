// Importa os tipos do express usados em um middleware
import { Request, Response, NextFunction } from "express";
// Importa a conexão com o banco de dados
import prismaClient from "../prisma";

type Role = "CLIENTE" | "STAFF" | "COZINHA" | "ENTREGADOR" | "ADMIN";

// Cria um middleware que só deixa passar os perfis informados.
// Exemplo: hasRole(["COZINHA", "ADMIN"])
// Deve vir DEPOIS do isAuthenticated, pois usa o req.user_id preenchido por ele.
//
// Perfis da equipe:
// - STAFF (garçom): lança pedidos de mesa e só vê os que ele mesmo lançou
// - COZINHA: vê todos os pedidos no painel e atualiza o andamento
// - ENTREGADOR: aceita, finaliza (com código) e cancela (com motivo) entregas
// - ADMIN: pode tudo
export function hasRole(roles: Role[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Busca no banco o usuário logado
    const user = await prismaClient.user.findFirst({
      where: {
        id: req.user_id,
      },
    });

    // Usuário inexistente ou com perfil não permitido: 401 (Unauthorized)
    if (!user || !roles.includes(user.role)) {
      return res.status(401).json({ error: "Usuário sem permissão" });
    }

    // Guarda o perfil na requisição: os services usam para decidir o que o
    // usuário pode ver (ex: o garçom só enxerga os pedidos que ele lançou)
    req.user_role = user.role;

    return next();
  };
}
