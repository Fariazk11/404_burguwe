// Script que popula o banco com dados de exemplo (rode com: npm run seed)
// Ele só cria o que ainda não existe, então pode ser executado mais de uma vez.
import prismaClient from "../src/prisma";
import { hash } from "bcryptjs";

// Lanches de exemplo do cardápio
const lanches = [
  { nome: "X-Burguer", descricao: "O clássico: pão macio, hambúrguer 150g e queijo derretido", preco: 18.9, ingredientes: "pão, hambúrguer, queijo, maionese", tamanho: "Pequeno", calorias: 520 },
  { nome: "X-Salada", descricao: "Hambúrguer artesanal com salada fresquinha", preco: 22.9, ingredientes: "pão, hambúrguer, queijo, alface, tomate, maionese", tamanho: "Médio", calorias: 610 },
  { nome: "X-Bacon", descricao: "Pão brioche, hambúrguer 180g, muito bacon crocante e cheddar", preco: 29.9, ingredientes: "pão brioche, hambúrguer, bacon, cheddar", tamanho: "Médio", calorias: 850 },
  { nome: "X-Egg", descricao: "Hambúrguer com ovo na chapa e queijo prato", preco: 24.9, ingredientes: "pão, hambúrguer, ovo, queijo, alface", tamanho: "Médio", calorias: 700 },
  { nome: "X-Tudo", descricao: "Para quem está com muita fome: vem com tudo que temos", preco: 38.9, ingredientes: "pão, 2 hambúrgueres, bacon, ovo, presunto, queijo, salada", tamanho: "Grande", calorias: 1250 },
  { nome: "Duplo Cheddar", descricao: "Dois hambúrgueres 150g cobertos com cheddar cremoso e cebola caramelizada", preco: 34.9, ingredientes: "pão australiano, 2 hambúrgueres, cheddar, cebola caramelizada", tamanho: "Grande", calorias: 1100 },
  { nome: "Frango Crispy", descricao: "Filé de frango empanado e crocante com molho da casa", preco: 26.9, ingredientes: "pão, frango empanado, alface, molho especial", tamanho: "Médio", calorias: 680 },
  { nome: "Veggie", descricao: "Hambúrguer de grão-de-bico com legumes grelhados", preco: 27.9, ingredientes: "pão integral, hambúrguer de grão-de-bico, abobrinha, tomate, rúcula", tamanho: "Médio", calorias: 480 },
];

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
        password: await hash("admin123", 8),
        role: "ADMIN",
      },
    });
    console.log(`Admin criado: ${email} / admin123`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prismaClient.$disconnect());
