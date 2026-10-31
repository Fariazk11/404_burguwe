// Importa a conexão com o banco de dados
import prismaClient from "../../prisma";
// Importa a função compare, que confere a senha digitada com a senha criptografada
import { compare } from "bcryptjs";
// Importa a função sign, que gera o token JWT
import { sign } from "jsonwebtoken";

// Formato dos dados que o service precisa receber
interface AuthUserProps {
  email: string;
  password: string;
}

// Classe responsável pela REGRA DE NEGÓCIO do login
class AuthUserService {
  // Método principal: recebe e-mail e senha e devolve os dados do usuário + token
  async execute({ email, password }: AuthUserProps) {
    // Procura no banco o usuário com o e-mail informado
    const user = await prismaClient.user.findFirst({
      where: {
        email: email,
      },
    });

    // Se não encontrou, lança um erro GENÉRICO (não dizemos se foi o e-mail ou a senha)
    if (!user) {
      throw new Error("Email/senha incorretos");
    }

    // Compara a senha digitada com a senha criptografada que está no banco
    const passwordMatch = await compare(password, user.password);

    // Se a senha não confere, lança o mesmo erro genérico
    if (!passwordMatch) {
      throw new Error("Email/senha incorretos");
    }

    // Gera o token JWT
    const token = sign(
      // payload: informações que vão dentro do token
      {
        name: user.name,
        email: user.email,
      },
      // chave secreta usada para assinar o token (vem do .env)
      process.env.JWT_SECRET as string,
      {
        // subject (sub): o id do usuário dono do token
        subject: user.id,
        // o token expira em 30 dias
        expiresIn: "30d",
      }
    );

    // Devolve os dados do usuário (sem a senha) e o token
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: token,
    };
  }
}

// Exporta a classe para ser usada no controller
export { AuthUserService };
