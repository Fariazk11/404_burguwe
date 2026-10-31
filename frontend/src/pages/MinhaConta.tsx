import { SubmitEvent, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api, getErrorMessage } from "../services/api";
import { PERFIL_LABEL } from "../types";

// Tela "Minha conta": qualquer usuário logado altera o próprio nome e a própria senha
// (rotas PATCH /me e PATCH /me/senha)
export function MinhaConta() {
  const { user, updateUser } = useAuth();

  // ----- Nome -----
  const [name, setName] = useState(user?.name ?? "");
  const [salvandoNome, setSalvandoNome] = useState(false);
  const [msgNome, setMsgNome] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  // ----- Senha -----
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [msgSenha, setMsgSenha] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  if (!user) return null;

  async function salvarNome(event: SubmitEvent) {
    event.preventDefault();
    setMsgNome(null);
    setSalvandoNome(true);

    try {
      const response = await api.patch<{ name: string }>("/me", { name });
      updateUser({ name: response.data.name });
      setMsgNome({ tipo: "ok", texto: "Nome atualizado!" });
    } catch (err) {
      setMsgNome({ tipo: "erro", texto: getErrorMessage(err) });
    } finally {
      setSalvandoNome(false);
    }
  }

  async function salvarSenha(event: SubmitEvent) {
    event.preventDefault();
    setMsgSenha(null);

    if (novaSenha !== confirmar) {
      setMsgSenha({ tipo: "erro", texto: "A confirmação não é igual à nova senha" });
      return;
    }

    setSalvandoSenha(true);
    try {
      await api.patch("/me/senha", { senhaAtual, novaSenha });
      setMsgSenha({ tipo: "ok", texto: "Senha alterada! Use a nova senha no próximo login." });
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmar("");
    } catch (err) {
      setMsgSenha({ tipo: "erro", texto: getErrorMessage(err) });
    } finally {
      setSalvandoSenha(false);
    }
  }

  return (
    <div className="conta-page">
      <div className="page-title">
        <div>
          <h1>Minha conta</h1>
          <p className="muted mono">&gt; atualize seus dados de acesso_</p>
        </div>
      </div>

      <section className="card conta-info">
        <div>
          <span className="comanda-label">E-mail (login)</span>
          <p className="mono">{user.email}</p>
        </div>
        <div>
          <span className="comanda-label">Perfil</span>
          <p>
            <span className={`role-tag role-${user.role.toLowerCase()}`}>{PERFIL_LABEL[user.role]}</span>
          </p>
        </div>
      </section>

      <div className="conta-grid">
        <form className="card form" onSubmit={salvarNome}>
          <h2>Nome</h2>
          <label>
            Como você quer ser chamado
            <input value={name} onChange={(e) => setName(e.target.value)} minLength={3} required />
          </label>

          {msgNome && (
            <p className={`alert ${msgNome.tipo === "ok" ? "alert-success" : "alert-error"}`}>{msgNome.texto}</p>
          )}

          <button type="submit" disabled={salvandoNome || name.trim() === user.name}>
            {salvandoNome ? "Salvando..." : "Salvar nome"}
          </button>
        </form>

        <form className="card form" onSubmit={salvarSenha}>
          <h2>Trocar senha</h2>
          <label>
            Senha atual
            <input
              type="password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <label>
            Nova senha
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              autoComplete="new-password"
              required
            />
          </label>
          <label>
            Confirmar nova senha
            <input
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              minLength={6}
              autoComplete="new-password"
              required
            />
          </label>

          {msgSenha && (
            <p className={`alert ${msgSenha.tipo === "ok" ? "alert-success" : "alert-error"}`}>{msgSenha.texto}</p>
          )}

          <button type="submit" disabled={salvandoSenha}>
            {salvandoSenha ? "Salvando..." : "Trocar senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
