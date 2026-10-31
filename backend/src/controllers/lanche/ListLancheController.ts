// Importa os tipos Request (requisição) e Response (resposta) do express
import { Request, Response } from "express";
// Importa o service que lista os lanches
import { ListLancheService } from "../../services/lanche/ListLancheService";

// Classe responsável pela rota GET /lanches
class ListLancheController {
  // Método chamado pela rota GET /lanches
  // O "_" em _req indica que não usamos a requisição aqui
  async handle(_req: Request, res: Response) {
    // Cria uma instância do service
    const listLancheService = new ListLancheService();

    // Busca a lista de lanches
    const lanches = await listLancheService.execute();

    // Retorna status 200 (OK) com a lista
    return res.status(200).json(lanches);
  }
}

// Exporta a classe para ser usada no arquivo de rotas
export { ListLancheController };
