// Importa os tipos Request (requisição) e Response (resposta) do express
import { Request, Response } from "express";
import {
  ListEntregasDisponiveisService,
  ListMinhasEntregasService,
  AceitarEntregaService,
  FinalizarEntregaService,
  CancelarEntregaService,
} from "../../services/entrega/EntregaServices";
import { ResumoGanhosService, SolicitarResgateService } from "../../services/entrega/GanhosServices";

// GET /entregas/disponiveis — entregas prontas sem entregador
class ListEntregasDisponiveisController {
  async handle(_req: Request, res: Response) {
    return res.json(await new ListEntregasDisponiveisService().execute());
  }
}

// GET /entregas/minhas — entregas aceitas pelo entregador logado
class ListMinhasEntregasController {
  async handle(req: Request, res: Response) {
    return res.json(await new ListMinhasEntregasService().execute(req.user_id));
  }
}

// PATCH /entregas/:id/aceitar
class AceitarEntregaController {
  async handle(req: Request, res: Response) {
    return res.json(await new AceitarEntregaService().execute(req.params.id as string, req.user_id));
  }
}

// PATCH /entregas/:id/finalizar — body: { codigo }
class FinalizarEntregaController {
  async handle(req: Request, res: Response) {
    return res.json(
      await new FinalizarEntregaService().execute(req.params.id as string, req.user_id, req.body.codigo)
    );
  }
}

// PATCH /entregas/:id/cancelar — body: { motivo }
class CancelarEntregaController {
  async handle(req: Request, res: Response) {
    return res.json(
      await new CancelarEntregaService().execute(req.params.id as string, req.user_id, req.body.motivo)
    );
  }
}

// GET /entregas/ganhos?dias=30 — painel de ganhos do entregador (hoje, saldo, por dia, resgates)
class ResumoGanhosController {
  async handle(req: Request, res: Response) {
    const dias = Math.min(Math.max(Number(req.query.dias) || 30, 1), 365);
    return res.json(await new ResumoGanhosService().execute(req.user_id, dias));
  }
}

// POST /entregas/resgates — body: { valor, chavePix }
class SolicitarResgateController {
  async handle(req: Request, res: Response) {
    const resgate = await new SolicitarResgateService().execute(req.user_id, req.body.valor, req.body.chavePix);
    return res.status(201).json(resgate);
  }
}

export {
  ResumoGanhosController,
  SolicitarResgateController,
  ListEntregasDisponiveisController,
  ListMinhasEntregasController,
  AceitarEntregaController,
  FinalizarEntregaController,
  CancelarEntregaController,
};
