// Aplica o tema cyberpunk "404 Burger" num banco que JÁ tem lanches (rode com: npm run tema)
//
// Para cada lanche do cardápio antigo (ex: "X-Bacon"), troca o nome e a descrição
// pelos do tema (ex: "Chrome Bacon"). Preço, ingredientes, foto e pedidos antigos NÃO mudam.
// Pode ser executado mais de uma vez: lanches já renomeados são ignorados.
import prismaClient from "../src/prisma";
import { cardapioCyberpunk } from "./cardapioCyberpunk";

async function main() {
  let renomeados = 0;

  for (const item of cardapioCyberpunk) {
    // Procura o lanche pelo nome antigo (sem diferenciar maiúsculas/minúsculas)
    const lanche = await prismaClient.lanche.findFirst({
      where: { nome: { equals: item.nomeAntigo, mode: "insensitive" } },
    });

    if (!lanche) {
      continue;
    }

    await prismaClient.lanche.update({
      where: { id: lanche.id },
      data: { nome: item.nome, descricao: item.descricao },
    });

    console.log(`  ${lanche.nome}  ->  ${item.nome}`);
    renomeados++;
  }

  console.log(
    renomeados > 0
      ? `${renomeados} lanche(s) atualizados para o tema 404 Burger`
      : "Nenhum lanche com nome antigo encontrado (o tema já foi aplicado?)"
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prismaClient.$disconnect());
