// Importa a conexão com o banco de dados
import prismaClient from "../../prisma";
// hash: criptografa a senha nova | compare: confere a senha atual
import { compare, hash } from "bcryptjs";

type Role = "CLIENTE" | "STAFF" | "COZINHA" | "ADMIN";

// Campos do usuário que a API devolve (a senha NUNCA é devolvida)
const usuarioSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
};

// ===================== Tela "Usuários" (somente ADMIN) =====================

// Lista todas as contas, com busca opcional por nome ou e-mail
class ListUsuariosService {
  async execute(busca?: string) {
    const termo = busca?.trim();

    const usuarios = await prismaClient.user.findMany({
      where: termo
        ? {
            OR: [
              { name: { contains: termo, mode: "insensitive" } },
              { email: { contains: termo, mode: "insensitive" } },
            ],
          }
        : undefined,
      select: { ...usuarioSelect, _count: { select: { pedidos: true } } },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });

    return usuarios.map(({ _count, ...usuario }) => ({ ...usuario, totalPedidos: _count.pedidos }));
  }
}

// Muda o perfil de uma conta, com proteções:
// - o admin não pode mudar o PRÓPRIO perfil (evita perder o acesso sem querer)
// - o sistema nunca fica sem nenhum ADMIN
class UpdatePerfilService {
  async execute(id: string, role: Role, admin_id: string) {
    if (id === admin_id) {
      throw new Error("Você não pode mudar o seu próprio perfil");
    }

    const usuario = await prismaClient.user.findFirst({ where: { id } });

    if (!usuario) {
      throw new Error("Usuário não encontrado");
    }

    if (usuario.role === "ADMIN" && role !== "ADMIN") {
      const totalAdmins = await prismaClient.user.count({ where: { role: "ADMIN" } });

      if (totalAdmins <= 1) {
        throw new Error("O sistema precisa ter pelo menos um administrador");
      }
    }

    return prismaClient.user.update({
      where: { id },
      data: { role },
      select: usuarioSelect,
    });
  }
}

// Define uma senha nova para uma conta (ex: a pessoa esqueceu a senha)
class ResetSenhaService {
  async execute(id: string, password: string) {
    const usuario = await prismaClient.user.findFirst({ where: { id } });

    if (!usuario) {
      throw new Error("Usuário não encontrado");
    }

    await prismaClient.user.update({
      where: { id },
      data: { password: await hash(password, 8) },
    });

    return { message: `Senha de ${usuario.name} alterada` };
  }
}

// ===================== Tela "Minha conta" (qualquer usuário logado) =====================

// Altera o próprio nome
class UpdateMeService {
  async execute(user_id: string, name: string) {
    return prismaClient.user.update({
      where: { id: user_id },
      data: { name },
      select: usuarioSelect,
    });
  }
}

// Troca a própria senha: só funciona se a senha atual estiver correta
class ChangeSenhaService {
  async execute(user_id: string, senhaAtual: string, novaSenha: string) {
    const usuario = await prismaClient.user.findFirst({ where: { id: user_id } });

    if (!usuario) {
      throw new Error("Usuário não encontrado");
    }

    const senhaConfere = await compare(senhaAtual, usuario.password);

    if (!senhaConfere) {
      throw new Error("A senha atual está incorreta");
    }

    if (senhaAtual === novaSenha) {
      throw new Error("A nova senha deve ser diferente da atual");
    }

    await prismaClient.user.update({
      where: { id: user_id },
      data: { password: await hash(novaSenha, 8) },
    });

    return { message: "Senha alterada com sucesso" };
  }
}

export { ListUsuariosService, UpdatePerfilService, ResetSenhaService, UpdateMeService, ChangeSenhaService };
