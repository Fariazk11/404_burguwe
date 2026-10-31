// Importa os tipos Request (requisição) e Response (resposta) do express
import { Request, Response } from "express";
import { CreateUserService } from "../../services/user/CreateUserService";
import { ListFuncionariosService } from "../../services/user/ListFuncionariosService";

// Rota POST /funcionarios: o ADMIN cria uma conta da equipe
// role: "STAFF" (garçom, padrão) ou "COZINHA"
class CreateFuncionarioController {
  async handle(req: Request, res: Response) {
    const { name, email, password, role } = req.body;

    const funcionario = await new CreateUserService().execute({
      name,
      email,
      password,
      role: role === "COZINHA" ? "COZINHA" : "STAFF",
    });

    return res.status(201).json(funcionario);
  }
}

// Rota GET /funcionarios: o ADMIN vê a lista da equipe (garçons e cozinha)
class ListFuncionariosController {
  async handle(_req: Request, res: Response) {
    const funcionarios = await new ListFuncionariosService().execute();
    return res.json(funcionarios);
  }
}

export { CreateFuncionarioController, ListFuncionariosController };
