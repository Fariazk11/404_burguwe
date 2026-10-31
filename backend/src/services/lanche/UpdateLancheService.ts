// Importa a conexão com o banco de dados
import prismaClient from "../../prisma";
// Importa os campos que serão retornados
import { lancheSelect } from "./lancheSelect";

// Campos que podem ser alterados (todos opcionais: só muda o que vier)
interface UpdateLancheProps {
  nome?: string;
  descricao?: string;
  preco?: number;
  ingredientes?: string;
  tamanho?: string;
  calorias?: number;
  imagem?: string | null;
  disponivel?: boolean;
}

// Classe responsável por EDITAR um lanche (inclusive ativar/desativar a venda)
class UpdateLancheService {
  async execute(id: string, data: UpdateLancheProps) {
    // Confere se o lanche existe
    const lanche = await prismaClient.lanche.findFirst({
      where: { id: id },
    });

    if (!lanche) {
      throw new Error("Lanche não encontrado");
    }

    // Atualiza apenas os campos enviados
    const lancheAtualizado = await prismaClient.lanche.update({
      where: { id: id },
      data: {
        ...data,
        // String vazia remove a imagem (salva null)
        imagem: data.imagem === undefined ? undefined : data.imagem || null,
      },
      select: lancheSelect,
    });

    return lancheAtualizado;
  }
}

export { UpdateLancheService };
