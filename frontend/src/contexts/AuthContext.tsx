// Importa as ferramentas do React para criar um contexto global de autenticação
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
// Importa a instância do axios e a chave do token
import { api, TOKEN_KEY } from "../services/api";

// Formato do usuário logado (igual ao que o backend devolve em GET /me)
export interface User {
  id: string;
  name: string;
  email: string;
  role: "CLIENTE" | "STAFF" | "COZINHA" | "ENTREGADOR" | "ADMIN";
}

// Tudo o que o contexto disponibiliza para as telas
interface AuthContextData {
  user: User | null;
  loading: boolean; // true enquanto verificamos se já existe um token salvo
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
  // Atualiza os dados do usuário logado na tela (ex: depois de mudar o nome em "Minha conta")
  updateUser: (dados: Partial<User>) => void;
}

const AuthContext = createContext({} as AuthContextData);

// Componente que envolve a aplicação e guarda o estado do usuário logado
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Ao abrir a página: se já existe um token salvo, busca os dados do usuário em GET /me
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get<User>("/me")
      .then((response) => setUser(response.data))
      // Token inválido/expirado: remove do navegador
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  // Login: chama POST /session, salva o token e guarda o usuário
  async function signIn(email: string, password: string) {
    const response = await api.post("/session", { email, password });
    const { id, name, role, token } = response.data;

    localStorage.setItem(TOKEN_KEY, token);
    setUser({ id, name, email: response.data.email, role });
  }

  // Cadastro: chama POST /users e em seguida já faz o login
  async function signUp(name: string, email: string, password: string) {
    await api.post("/users", { name, email, password });
    await signIn(email, password);
  }

  // Logout: apaga o token e limpa o usuário
  function signOut() {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }

  function updateUser(dados: Partial<User>) {
    setUser((atual) => (atual ? { ...atual, ...dados } : atual));
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para as telas acessarem o contexto: const { user } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}
