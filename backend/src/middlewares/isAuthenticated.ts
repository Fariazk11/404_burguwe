// Importa os tipos do express usados em um middleware
import { Request, Response, NextFunction } from "express";
// Importa a função verify, que confere se o token JWT é válido
import { verify } from "jsonwebtoken";

// Formato do conteúdo (payload) do token que nos interessa: o "sub" (id do usuário)
interface Payload {
  sub: string;
}

// Middleware que só deixa a requisição passar se o usuário estiver logado
export function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Pega o cabeçalho "Authorization" da requisição (formato: "Bearer <token>")
  const authToken = req.headers.authorization;

  // Se não veio o cabeçalho, o usuário não está autenticado: 401 (Unauthorized)
  if (!authToken) {
    return res.status(401).json({ error: "Token não informado" });
  }

  // Separa "Bearer" do token pelo espaço e fica só com a segunda parte (o token)
  const [, token] = authToken.split(" ");

  // Se não existir a segunda parte, o cabeçalho está mal formatado
  if (!token) {
    return res.status(401).json({ error: "Token não informado" });
  }

  try {
    // Valida o token com a nossa chave secreta e extrai o "sub" (id do usuário)
    const { sub } = verify(token, process.env.JWT_SECRET as string) as Payload;

    // Guarda o id do usuário dentro da requisição para usar nos controllers
    req.user_id = sub;

    // Token válido: segue para o próximo middleware/controller
    return next();
  } catch (err) {
    // Token inválido ou expirado: 401 (Unauthorized)
    return res.status(401).json({ error: "Token inválido" });
  }
}
