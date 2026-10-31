// Importa o axios, biblioteca que faz as requisições HTTP para o backend
import axios, { AxiosError } from "axios";

// Cria uma instância do axios já apontando para o endereço do backend
// (lê o VITE_API_URL do .env; se não existir, usa http://localhost:3333)
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3333",
});

// Chave usada para guardar o token no localStorage do navegador
export const TOKEN_KEY = "@lanchonete:token";

// Interceptor: antes de CADA requisição, coloca o token no cabeçalho Authorization
// no formato que o middleware isAuthenticated espera ("Bearer <token>")
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Formato das respostas de erro do backend:
// - erros comuns:        { error: "Usuário já existe" }
// - erros de validação:  { error: "Erro de validação", details: [{ campo, mensagem }] }
interface ApiErrorBody {
  error?: string;
  message?: string;
  details?: { campo: string; mensagem: string }[];
}

// Transforma qualquer erro de requisição em uma mensagem legível para o usuário
export function getErrorMessage(err: unknown): string {
  const error = err as AxiosError<ApiErrorBody>;

  // Sem resposta: o backend está desligado ou inacessível
  if (!error.response) {
    return "Não foi possível conectar ao servidor. O backend está rodando?";
  }

  const data = error.response.data;

  // Erro de validação do Zod: junta todas as mensagens
  if (data?.details?.length) {
    return data.details.map((d) => d.mensagem).join(" • ");
  }

  return data?.error || data?.message || "Erro inesperado";
}
