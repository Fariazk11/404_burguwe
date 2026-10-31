// Importa a conexão com o banco de dados
import prismaClient from "../../prisma";
// Importa os campos que serão retornados
import { lancheSelect } from "./lancheSelect";

// Formato dos dados que o service precisa receber para cadastrar um lanche
interface CreateLancheProps {
  nome: string;
  descricao: string;
  preco: number;
  ingredientes: string;
  tamanho: string;
  calorias: number;
  // O "?" indica que o campo é opcional
  imagem?: string | null;
  disponivel?: boolean;
}

// Classe responsável pela REGRA DE NEGÓCIO de cadastrar um lanche
class CreateLancheService {
  // Método principal: recebe os dados e salva o lanche no banco
  async execute({
    nome,
    descricao,
    preco,
    ingredientes,
    tamanho,
    calorias,
    imagem,
    disponivel,
  }: CreateLancheProps) {
    try {
      // Cria o lanche na tabela "lanches"
      const lanche = await prismaClient.lanche.create({
        data: {
          nome: nome,
          descricao: descricao,
          preco: preco,
          ingredientes: ingredientes,
          tamanho: tamanho,
          calorias: calorias,
          // Se não vier imagem (ou vier vazia), salva como null
          imagem: imagem || null,
          // Se "disponivel" não for enviado (undefined), o banco usa o padrão (true)
          disponivel: disponivel,
        },
        // Define quais campos serão retornados
        select: lancheSelect,
      });

      // Devolve o lanche cadastrado para o controller
      return lanche;
    } catch (err) {
      // Se algo der errado no banco, lança um erro com mensagem amigável
      throw new Error("Falha ao cadastrar lanche");
    }
  }
}

// Exporta a classe para ser usada no controller
export { CreateLancheService };
