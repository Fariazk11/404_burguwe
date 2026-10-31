// Importa o zod, biblioteca de validação de dados
import { z } from "zod";

// Regra de senha usada em todo o sistema (igual à do cadastro)
const senhaSchema = z
  .string({ message: "A senha é obrigatória" })
  .min(6, { message: "A senha deve ter no mínimo 6 caracteres" });

// ===== Rotas do ADMIN (tela Usuários) =====

// PATCH /usuarios/:id/perfil — muda o perfil de uma conta
export const updatePerfilSchema = z.object({
  body: z.object({
    role: z.enum(["CLIENTE", "STAFF", "COZINHA", "ADMIN"], {
      message: "Perfil inválido (use CLIENTE, STAFF, COZINHA ou ADMIN)",
    }),
  }),
});

// PATCH /usuarios/:id/senha — define uma senha nova para alguém (ex: esqueceu a senha)
export const resetSenhaSchema = z.object({
  body: z.object({
    password: senhaSchema,
  }),
});

// ===== Rotas de qualquer usuário logado (tela Minha conta) =====

// PATCH /me — altera o próprio nome
export const updateMeSchema = z.object({
  body: z.object({
    name: z
      .string({ message: "O nome é obrigatório" })
      .trim()
      .min(3, { message: "O nome deve ter no mínimo 3 caracteres" }),
  }),
});

// PATCH /me/senha — troca a própria senha (precisa informar a senha atual)
export const changeSenhaSchema = z.object({
  body: z.object({
    senhaAtual: z
      .string({ message: "Informe a senha atual" })
      .min(1, { message: "Informe a senha atual" }),
    novaSenha: senhaSchema,
  }),
});
