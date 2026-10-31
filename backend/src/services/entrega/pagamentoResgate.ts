// =====================================================================
// PONTO DE INTEGRAÇÃO DO PAGAMENTO DE RESGATES (próxima atualização)
// =====================================================================
//
// Hoje o resgate só é REGISTRADO: ele fica com status SOLICITADO e o valor
// sai do saldo do entregador. Nenhum dinheiro é enviado.
//
// Para ligar o pagamento de verdade (ex: Pix via Mercado Pago, Asaas, Efí,
// banco do Brasil etc.), implemente a função enviarPagamento abaixo:
//   1. chame a API do provedor com o valor e a chave Pix
//   2. devolva { enviado: true, transacaoId } se deu certo
//      ou { enviado: false, erro } se o provedor recusou
// O SolicitarResgateService já chama esta função e, quando ela devolver
// enviado: true, marca o resgate como PAGO automaticamente.
//
// Guarde as credenciais do provedor em variáveis de ambiente (ex: PIX_API_KEY)
// no Render — nunca no código.

export interface DadosPagamento {
  resgateId: string;
  valor: number;
  chavePix: string;
  entregadorNome: string;
}

export type ResultadoPagamento =
  | { enviado: true; transacaoId: string }
  | { enviado: false; pendente: true } // ainda sem integração: fica SOLICITADO
  | { enviado: false; pendente: false; erro: string }; // provedor recusou

export async function enviarPagamento(_dados: DadosPagamento): Promise<ResultadoPagamento> {
  // Sem integração bancária ainda: o resgate fica aguardando (SOLICITADO)
  return { enviado: false, pendente: true };
}
