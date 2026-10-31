// Importa os tipos do express usados em um middleware
import { Request, Response, NextFunction } from "express";
// Importa a conexão com o banco de dados
import prismaClient from "../prisma";

// Middleware que só deixa passar a EQUIPE da lanchonete (STAFF ou ADMIN).
// Deve vir DEPOIS do isAuthenticated, pois usa o req.user_id preenchido por ele.
export async function isStaff(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Busca no banco o usuário logado
  const user = await prismaClient.user.findFirst({
    where: {
      id: req.user_id,
    },
  });

  // Clientes (ou usuário inexistente) não podem acessar: 401 (Unauthorized)
  if (!user || (user.role !== "STAFF" && user.role !== "ADMIN")) {
    return res.status(401).json({ error: "Usuário sem permissão" });
  }

  // É da equipe: segue para o próximo middleware/controller
  return next();
}
