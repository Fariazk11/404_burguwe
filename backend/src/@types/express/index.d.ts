// Aqui "estendemos" a tipagem do Request do express.
// Assim o TypeScript passa a aceitar req.user_id em toda a aplicação.
// O middleware isAuthenticated é quem preenche esse valor com o id do usuário logado.
declare namespace Express {
  export interface Request {
    // id do usuário que está autenticado (vem do "sub" do token JWT)
    user_id: string;
    // perfil do usuário (preenchido pelo middleware hasRole)
    user_role: "CLIENTE" | "STAFF" | "COZINHA" | "ADMIN";
  }
}
