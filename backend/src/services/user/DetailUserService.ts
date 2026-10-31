// Importa a conexão com o banco de dados
import prismaClient from "../../prisma";

// Classe responsável por buscar os detalhes do usuário logado
class DetailUserService {
  // Recebe o id do usuário (que veio do token, via isAuthenticated)
  async execute(user_id: string) {
    // Busca no banco o usuário com esse id
    const user = await prismaClient.user.findFirst({
      where: {
        id: user_id,
      },
      // Retorna apenas estes campos (a senha NÃO é retornada)
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Se não encontrou o usuário, lança um erro
    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Devolve os dados do usuário para o controller
    return user;
  }
}

// Exporta a classe para ser usada no controller
export { DetailUserService };
