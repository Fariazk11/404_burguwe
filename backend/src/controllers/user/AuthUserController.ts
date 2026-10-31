// Importa os tipos Request (requisição) e Response (resposta) do express
import { Request, Response } from "express";
// Importa o service que contém a regra de negócio do login
import { AuthUserService } from "../../services/user/AuthUserService";

// Classe responsável por receber a requisição de login e devolver a resposta
class AuthUserController {
  // Método chamado pela rota POST /session
  async handle(req: Request, res: Response) {
    // Pega o e-mail e a senha enviados no body
    const { email, password } = req.body;

    // Cria uma instância do service
    const authUserService = new AuthUserService();

    // Executa o login; se der certo, recebe os dados do usuário + token
    const session = await authUserService.execute({
      email,
      password,
    });

    // Devolve os dados em formato JSON
    return res.json(session);
  }
}

// Exporta a classe para ser usada no arquivo de rotas
export { AuthUserController };
