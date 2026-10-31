// Importa a conexão com o banco de dados
import prismaClient from "../../prisma";
// Importa a função hash, que criptografa a senha
import { hash } from "bcryptjs";

// Formato dos dados que o service precisa receber
interface CreateUserProps {
  name: string;
  email: string;
  password: string;
  // Perfil da conta: o cadastro do site cria CLIENTE; o ADMIN cria STAFF (garçom) ou COZINHA
  role?: "CLIENTE" | "STAFF" | "COZINHA";
}

// Classe responsável pela REGRA DE NEGÓCIO de cadastrar um usuário
class CreateUserService {
  // Método principal do service: recebe os dados e cadastra o usuário
  async execute({ name, email, password, role = "CLIENTE" }: CreateUserProps) {
    // Procura no banco se já existe um usuário com o mesmo e-mail
    const userAlreadyExists = await prismaClient.user.findFirst({
      where: {
        email: email,
      },
    });

    // Se já existir, lança um erro (será tratado pelo middleware de erros do server.ts)
    if (userAlreadyExists) {
      throw new Error("Usuário já existe");
    }

    // Criptografa a senha; o 8 é o "salt" (quantas rodadas de embaralhamento)
    const passwordHash = await hash(password, 8);

    // Salva o novo usuário no banco com a senha criptografada
    const user = await prismaClient.user.create({
      data: {
        name: name,
        email: email,
        password: passwordHash,
        role: role,
      },
      // select define quais campos serão RETORNADOS (a senha NÃO é retornada)
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Devolve o usuário criado para o controller
    return user;
  }
}

// Exporta a classe para ser usada no controller
export { CreateUserService };
