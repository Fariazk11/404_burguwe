// Importa os tipos Request (requisição) e Response (resposta) do express
import { Request, Response } from "express";
// Importa o service que edita o lanche
import { UpdateLancheService } from "../../services/lanche/UpdateLancheService";

// Classe responsável pela rota PUT /lanches/:id
class UpdateLancheController {
  async handle(req: Request, res: Response) {
    // O id vem na URL (ex: /lanches/abc-123)
    const id = req.params.id as string;

    const {
      nome,
      descricao,
      preco,
      ingredientes,
      tamanho,
      calorias,
      imagem,
      disponivel,
    } = req.body;

    const updateLancheService = new UpdateLancheService();

    const lanche = await updateLancheService.execute(id, {
      nome,
      descricao,
      preco,
      ingredientes,
      tamanho,
      calorias,
      imagem,
      disponivel,
    });

    return res.json(lanche);
  }
}

export { UpdateLancheController };
