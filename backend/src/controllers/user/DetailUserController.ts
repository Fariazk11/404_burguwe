// Importa os tipos Request (requisição) e Response (resposta) do express
import { Request, Response } from "express";
// Importa o service que busca os detalhes do usuário
import { DetailUserService } from "../../services/user/DetailUserService";

// Classe responsável pela rota GET /me
class DetailUserController {
  // Método chamado pela rota GET /me
  async handle(req: Request, res: Response) {
    // Pega o id do usuário logado (colocado na requisição pelo isAuthenticated)
    const user_id = req.user_id;

    // Cria uma instância do service
    const detailUserService = new DetailUserService();

    // Busca os dados do usuário no banco
    const user = await detailUserService.execute(user_id);

    // Devolve os dados em formato JSON
    return res.json(user);
  }
}

// Exporta a classe para ser usada no arquivo de rotas
export { DetailUserController };
