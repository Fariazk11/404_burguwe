// Importa os tipos Request (requisição) e Response (resposta) do express
import { Request, Response } from "express";
// Importa o service que contém a regra de negócio do cadastro
import { CreateUserService } from "../../services/user/CreateUserService";

// Classe responsável por receber a requisição HTTP e devolver a resposta
class CreateUserController {
  // Método chamado pela rota POST /users
  async handle(req: Request, res: Response) {
    // Pega os dados enviados no corpo (body) da requisição
    const { name, email, password } = req.body;

    // Cria uma instância do service
    const createUserService = new CreateUserService();

    // Executa o service passando os dados recebidos
    const user = await createUserService.execute({
      name,
      email,
      password,
    });

    // Devolve o usuário cadastrado em formato JSON
    return res.json({ user });
  }
}

// Exporta a classe para ser usada no arquivo de rotas
export { CreateUserController };
