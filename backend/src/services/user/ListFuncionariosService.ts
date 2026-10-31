// Importa a conexão com o banco de dados
import prismaClient from "../../prisma";

// Lista as contas da equipe (garçons STAFF e COZINHA) para a tela do ADMIN,
// junto com quantos pedidos de mesa cada um já lançou (só garçons lançam)
class ListFuncionariosService {
  async execute() {
    const funcionarios = await prismaClient.user.findMany({
      where: { role: { in: ["STAFF", "COZINHA"] } },
      // A senha NUNCA é devolvida
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { pedidos: { where: { tipoEntrega: "MESA" } } } },
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });

    // Troca o "_count" do Prisma por um campo com nome mais claro
    return funcionarios.map(({ _count, ...funcionario }) => ({
      ...funcionario,
      pedidosLancados: _count.pedidos,
    }));
  }
}

export { ListFuncionariosService };
