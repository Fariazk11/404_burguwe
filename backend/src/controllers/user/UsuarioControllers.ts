// Importa os tipos Request (requisição) e Response (resposta) do express
import { Request, Response } from "express";
import {
  ListUsuariosService,
  UpdatePerfilService,
  ResetSenhaService,
  UpdateMeService,
  ChangeSenhaService,
} from "../../services/user/UsuarioServices";

// GET /usuarios?busca=ana — lista as contas (ADMIN)
class ListUsuariosController {
  async handle(req: Request, res: Response) {
    const busca = typeof req.query.busca === "string" ? req.query.busca : undefined;
    const usuarios = await new ListUsuariosService().execute(busca);
    return res.json(usuarios);
  }
}

// PATCH /usuarios/:id/perfil — muda o perfil de uma conta (ADMIN)
class UpdatePerfilController {
  async handle(req: Request, res: Response) {
    const usuario = await new UpdatePerfilService().execute(
      req.params.id as string,
      req.body.role,
      req.user_id
    );
    return res.json(usuario);
  }
}

// PATCH /usuarios/:id/senha — define uma senha nova para alguém (ADMIN)
class ResetSenhaController {
  async handle(req: Request, res: Response) {
    const resultado = await new ResetSenhaService().execute(req.params.id as string, req.body.password);
    return res.json(resultado);
  }
}

// PATCH /me — altera o próprio nome (qualquer usuário logado)
class UpdateMeController {
  async handle(req: Request, res: Response) {
    const usuario = await new UpdateMeService().execute(req.user_id, req.body.name);
    return res.json(usuario);
  }
}

// PATCH /me/senha — troca a própria senha (qualquer usuário logado)
class ChangeSenhaController {
  async handle(req: Request, res: Response) {
    const resultado = await new ChangeSenhaService().execute(
      req.user_id,
      req.body.senhaAtual,
      req.body.novaSenha
    );
    return res.json(resultado);
  }
}

export {
  ListUsuariosController,
  UpdatePerfilController,
  ResetSenhaController,
  UpdateMeController,
  ChangeSenhaController,
};
