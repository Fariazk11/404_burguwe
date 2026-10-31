// Importa os tipos Request (requisição) e Response (resposta) do express
import { Request, Response } from "express";
// Importa o service que cadastra o lanche
import { CreateLancheService } from "../../services/lanche/CreateLancheService";

// Classe responsável pela rota POST /lanches
class CreateLancheController {
  // Método chamado pela rota POST /lanches
  async handle(req: Request, res: Response) {
    // Pega os dados do lanche enviados no body (já validados pelo Zod)
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

    // Cria uma instância do service
    const createLancheService = new CreateLancheService();

    // Executa o cadastro passando os dados recebidos
    const lanche = await createLancheService.execute({
      nome,
      descricao,
      preco,
      ingredientes,
      tamanho,
      calorias,
      imagem,
      disponivel,
    });

    // Retorna status 201 (Created) com o lanche cadastrado
    return res.status(201).json(lanche);
  }
}

// Exporta a classe para ser usada no arquivo de rotas
export { CreateLancheController };
