import { SubmitEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api, getErrorMessage } from "../services/api";
import { PERFIL_LABEL, Perfil, formatDate } from "../types";

// Conta como o backend devolve em GET /usuarios
interface Usuario {
  id: string;
  name: string;
  email: string;
  role: Perfil;
  createdAt: string;
  totalPedidos: number;
}

const FILTROS: { value: Perfil | "TODOS"; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "CLIENTE", label: "Clientes" },
  { value: "STAFF", label: "Garçons" },
  { value: "COZINHA", label: "Cozinha" },
  { value: "ADMIN", label: "Admins" },
];

// Tela "Usuários" (somente ADMIN): lista todas as contas, muda o perfil e define senha nova
// (rotas GET /usuarios, PATCH /usuarios/:id/perfil e PATCH /usuarios/:id/senha)
export function Usuarios() {
  const { user } = useAuth();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Perfil | "TODOS">("TODOS");
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [salvando, setSalvando] = useState(""); // id da conta sendo alterada

  // Formulário de "nova senha" aberto para qual conta
  const [senhaPara, setSenhaPara] = useState("");
  const [novaSenha, setNovaSenha] = useState("");

  useEffect(() => {
    api
      .get<Usuario[]>("/usuarios")
      .then((response) => setUsuarios(response.data))
      .catch((err) => setAviso({ tipo: "erro", texto: getErrorMessage(err) }))
      .finally(() => setLoading(false));
  }, []);

  async function mudarPerfil(usuario: Usuario, role: Perfil) {
    if (role === usuario.role) return;

    const texto =
      role === "ADMIN"
        ? `Tornar ${usuario.name} ADMIN? Essa pessoa poderá gerenciar tudo no site, inclusive outros usuários.`
        : `Mudar o perfil de ${usuario.name} de ${PERFIL_LABEL[usuario.role]} para ${PERFIL_LABEL[role]}?`;
    if (!confirm(texto)) return;

    setAviso(null);
    setSalvando(usuario.id);
    try {
      const response = await api.patch<Usuario>(`/usuarios/${usuario.id}/perfil`, { role });
      setUsuarios((atual) => atual.map((u) => (u.id === usuario.id ? { ...u, role: response.data.role } : u)));
      setAviso({ tipo: "ok", texto: `${usuario.name} agora é ${PERFIL_LABEL[role]}. Peça para sair e entrar de novo.` });
    } catch (err) {
      setAviso({ tipo: "erro", texto: getErrorMessage(err) });
    } finally {
      setSalvando("");
    }
  }

  async function salvarSenha(event: SubmitEvent, usuario: Usuario) {
    event.preventDefault();
    setAviso(null);
    setSalvando(usuario.id);
    try {
      await api.patch(`/usuarios/${usuario.id}/senha`, { password: novaSenha });
      setAviso({ tipo: "ok", texto: `Senha de ${usuario.name} alterada. Passe a nova senha para a pessoa.` });
      setSenhaPara("");
      setNovaSenha("");
    } catch (err) {
      setAviso({ tipo: "erro", texto: getErrorMessage(err) });
    } finally {
      setSalvando("");
    }
  }

  // Busca e filtro na tela (a lista inteira já veio do backend)
  const termo = busca.trim().toLowerCase();
  const visiveis = usuarios
    .filter((u) => filtro === "TODOS" || u.role === filtro)
    .filter((u) => u.name.toLowerCase().includes(termo) || u.email.toLowerCase().includes(termo));

  const contagem = (perfil: Perfil | "TODOS") =>
    perfil === "TODOS" ? usuarios.length : usuarios.filter((u) => u.role === perfil).length;

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Usuários</h1>
          <p className="muted mono">&gt; mude perfis e redefina senhas de qualquer conta_</p>
        </div>
        <Link to="/admin/funcionarios" className="btn btn-sm">
          + Conta da equipe
        </Link>
      </div>

      <div className="menu-toolbar">
        <div className="chips">
          {FILTROS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`chip ${filtro === f.value ? "chip-active" : ""}`}
              onClick={() => setFiltro(f.value)}
            >
              {f.label} ({contagem(f.value)})
            </button>
          ))}
        </div>
        <input
          className="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="> buscar por nome ou e-mail..."
        />
      </div>

      {aviso && (
        <p className={`alert ${aviso.tipo === "ok" ? "alert-success" : "alert-error"}`}>
          {aviso.tipo === "ok" ? "✓ " : ""}
          {aviso.texto}
        </p>
      )}

      {loading && <p className="muted mono">&gt; carregando usuários..._</p>}
      {!loading && visiveis.length === 0 && <p className="muted mono">&gt; nenhum usuário encontrado_</p>}

      <div className="order-list">
        {visiveis.map((u) => {
          const souEu = u.id === user?.id;

          return (
            <div key={u.id} className="card usuario-row">
              <div className="usuario-info">
                <strong>
                  {u.name} {souEu && <span className="muted small">(você)</span>}
                </strong>
                <p className="muted small mono">{u.email}</p>
                <p className="muted small">
                  Desde {formatDate(u.createdAt)} • {u.totalPedidos}{" "}
                  {u.totalPedidos === 1 ? "pedido" : "pedidos"}
                </p>
              </div>

              <div className="usuario-acoes">
                <label className="usuario-perfil">
                  Perfil
                  <select
                    value={u.role}
                    disabled={souEu || salvando === u.id}
                    title={souEu ? "Você não pode mudar o seu próprio perfil" : undefined}
                    onChange={(e) => mudarPerfil(u, e.target.value as Perfil)}
                  >
                    {(Object.keys(PERFIL_LABEL) as Perfil[]).map((p) => (
                      <option key={p} value={p}>
                        {PERFIL_LABEL[p]}
                      </option>
                    ))}
                  </select>
                </label>

                {senhaPara === u.id ? (
                  <form className="usuario-senha" onSubmit={(e) => salvarSenha(e, u)}>
                    <input
                      type="password"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      placeholder="Nova senha (mín. 6)"
                      minLength={6}
                      autoComplete="new-password"
                      autoFocus
                      required
                    />
                    <button type="submit" className="btn-sm" disabled={salvando === u.id}>
                      Salvar
                    </button>
                    <button
                      type="button"
                      className="btn-sm btn-outline"
                      onClick={() => {
                        setSenhaPara("");
                        setNovaSenha("");
                      }}
                    >
                      Cancelar
                    </button>
                  </form>
                ) : souEu ? (
                  <Link to="/conta" className="btn btn-sm btn-outline">
                    Minha conta
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="btn-sm btn-outline"
                    onClick={() => {
                      setSenhaPara(u.id);
                      setNovaSenha("");
                    }}
                  >
                    Nova senha
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
