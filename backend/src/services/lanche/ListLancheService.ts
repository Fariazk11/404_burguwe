// Importa a conexão com o banco de dados
import prismaClient from "../../prisma";
// Importa os campos que serão retornados
import { lancheSelect } from "./lancheSelect";

// Classe responsável por listar todos os lanches cadastrados
class ListLancheService {
  // Método principal: busca e devolve a lista de lanches
  async execute() {
    try {
      // Busca TODOS os lanches da tabela "lanches"
      const lanches = await prismaClient.lanche.findMany({
        // Define quais campos serão retornados
        select: lancheSelect,
        // Ordena do mais novo para o mais antigo
        orderBy: {
          createdAt: "desc",
        },
      });

      // Devolve a lista para o controller
      return lanches;
    } catch (err) {
      // Se algo der errado no banco, lança um erro com mensagem amigável
      throw new Error("Falha ao buscar lanches");
    }
  }
}

// Exporta a classe para ser usada no controller
export { ListLancheService };
