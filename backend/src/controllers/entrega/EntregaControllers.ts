// Importa os tipos Request (requisição) e Response (resposta) do express
import { Request, Response } from "express";
import {
  ListEntregasDisponiveisService,
  ListMinhasEntregasService,
  AceitarEntregaService,
  FinalizarEntregaService,
  CancelarEntregaService,
} from "../../services/entrega/EntregaServices";

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

export {
  ListEntregasDisponiveisController,
  ListMinhasEntregasController,
  AceitarEntregaController,
  FinalizarEntregaController,
  CancelarEntregaController,
};
