// Script que popula o banco com dados de exemplo (rode com: npm run seed)
// Ele só cria o que ainda não existe, então pode ser executado mais de uma vez.
import prismaClient from "../src/prisma";
import { hash } from "bcryptjs";
// Cardápio temático do 404 Burger (cyberpunk)
import { cardapioCyberpunk } from "./cardapioCyberpunk";

// Lanches de exemplo do cardápio (sem o campo nomeAntigo, que não existe no banco)
const lanches = cardapioCyberpunk.map(({ nomeAntigo, ...lanche }) => lanche);

// Senha das contas de exemplo.
// - Local: senhas fáceis (admin123, func123, cozinha123)
// - Produção (Render): todas usam a variável SEED_SENHA, gerada pelo Render, para que
//   ninguém consiga entrar no site publicado com uma senha conhecida
const senha = (padrao: string) => process.env.SEED_SENHA || padrao;
const senhaLog = (padrao: string) => (process.env.SEED_SENHA ? "(senha da variável SEED_SENHA)" : padrao);

async function main() {
  // Só cadastra os lanches se o cardápio estiver vazio
  const total = await prismaClient.lanche.count();

  if (total === 0) {
    await prismaClient.lanche.createMany({ data: lanches });
    console.log(`${lanches.length} lanches cadastrados`);
  } else {
    console.log("Cardápio já possui lanches, nada foi alterado");
  }

  // Cria um usuário ADMIN de exemplo (se ainda não existir)
  const email = "admin@lanchonete.com";
  const adminExiste = await prismaClient.user.findFirst({ where: { email } });

  if (!adminExiste) {
    await prismaClient.user.create({
      data: {
        name: "Administrador",
        email: email,
        password: await hash(senha("admin123"), 8),
        role: "ADMIN",
      },
    });
    console.log(`Admin criado: ${email} / ${senhaLog("admin123")}`);
  }

  // Cria um FUNCIONÁRIO (STAFF) de exemplo: ele só vê os pedidos de mesa que lançar
  const emailFuncionario = "funcionario@lanchonete.com";
  const funcionarioExiste = await prismaClient.user.findFirst({ where: { email: emailFuncionario } });

  if (!funcionarioExiste) {
    await prismaClient.user.create({
      data: {
        name: "Garçom Exemplo",
        email: emailFuncionario,
        password: await hash(senha("func123"), 8),
        role: "STAFF",
      },
    });
    console.log(`Funcionário criado: ${emailFuncionario} / ${senhaLog("func123")}`);
  }

  // Cria uma conta da COZINHA de exemplo: vê todos os pedidos no painel
  const emailCozinha = "cozinha@lanchonete.com";
  const cozinhaExiste = await prismaClient.user.findFirst({ where: { email: emailCozinha } });

  if (!cozinhaExiste) {
    await prismaClient.user.create({
      data: {
        name: "Cozinha",
        email: emailCozinha,
        password: await hash(senha("cozinha123"), 8),
        role: "COZINHA",
      },
    });
    console.log(`Cozinha criada: ${emailCozinha} / ${senhaLog("cozinha123")}`);
  }

  // Cria um ENTREGADOR de exemplo: aceita, finaliza (com código) e cancela (com motivo) entregas
  const emailEntregador = "entregador@lanchonete.com";
  const entregadorExiste = await prismaClient.user.findFirst({ where: { email: emailEntregador } });

  if (!entregadorExiste) {
    await prismaClient.user.create({
      data: {
        name: "Entregador Exemplo",
        email: emailEntregador,
        password: await hash(senha("entrega123"), 8),
        role: "ENTREGADOR",
      },
    });
    console.log(`Entregador criado: ${emailEntregador} / ${senhaLog("entrega123")}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prismaClient.$disconnect());
