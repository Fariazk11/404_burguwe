// Importa os tipos do express usados em um middleware
import { Request, Response, NextFunction } from "express";
// Importa a conexão com o banco de dados
import prismaClient from "../prisma";

// Middleware que só deixa passar usuários com o perfil (role) ADMIN.
// Ele deve vir DEPOIS do isAuthenticated, pois usa o req.user_id preenchido por ele.
export async function isAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Pega o id do usuário logado (colocado na requisição pelo isAuthenticated)
  const user_id = req.user_id;

  // Busca no banco o usuário com esse id
  const user = await prismaClient.user.findFirst({
    where: {
      id: user_id,
    },
  });

  // Se o usuário não existe ou não é ADMIN, bloqueia com 401 (Unauthorized)
  if (!user || user.role !== "ADMIN") {
    return res.status(401).json({ error: "Usuário sem permissão" });
  }

  // É ADMIN: segue para o próximo middleware/controller
  return next();
}
