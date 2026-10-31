// Importa os tipos Request (requisição) e Response (resposta) do express
import { Request, Response } from "express";
// Importa os services de pedido
import { CreatePedidoService } from "../../services/pedido/CreatePedidoService";
import { CreatePedidoMesaService } from "../../services/pedido/CreatePedidoMesaService";
import { ListMyPedidosService } from "../../services/pedido/ListMyPedidosService";
import { ListPedidosService } from "../../services/pedido/ListPedidosService";
import { DetailPedidoService } from "../../services/pedido/DetailPedidoService";
import { UpdateStatusPedidoService } from "../../services/pedido/UpdateStatusPedidoService";
import { CancelPedidoService } from "../../services/pedido/CancelPedidoService";

// Rota POST /pedidos: o cliente logado faz um pedido
class CreatePedidoController {
  async handle(req: Request, res: Response) {
    const {
      itens,
      tipoEntrega,
      endereco,
      telefone,
      formaPagamento,
      trocoPara,
      observacao,
    } = req.body;

    const pedido = await new CreatePedidoService().execute({
      user_id: req.user_id,
      itens,
      tipoEntrega,
      endereco,
      telefone,
      formaPagamento,
      trocoPara,
      observacao,
    });

    // 201 (Created) com o pedido criado
    return res.status(201).json(pedido);
  }
}

// Rota POST /pedidos/mesa: o funcionário lança o pedido de uma mesa
class CreatePedidoMesaController {
  async handle(req: Request, res: Response) {
    const { itens, mesa, nomeCliente, formaPagamento, trocoPara, observacao } = req.body;

    const pedido = await new CreatePedidoMesaService().execute({
      funcionario_id: req.user_id,
      itens,
      mesa,
      nomeCliente,
      formaPagamento,
      trocoPara,
      observacao,
    });

    return res.status(201).json(pedido);
  }
}

// Rota GET /pedidos/me: pedidos do usuário logado
class ListMyPedidosController {
  async handle(req: Request, res: Response) {
    const pedidos = await new ListMyPedidosService().execute(req.user_id);
    return res.json(pedidos);
  }
}

// Rota GET /pedidos?status=PENDENTE: todos os pedidos (ADMIN) ou só os do funcionário (STAFF)
class ListPedidosController {
  async handle(req: Request, res: Response) {
    // O filtro vem na query string; só aceitamos texto
    const status = typeof req.query.status === "string" ? req.query.status : undefined;

    const pedidos = await new ListPedidosService().execute(status, req.user_id, req.user_role);
    return res.json(pedidos);
  }
}

// Rota GET /pedidos/:id: detalhes de um pedido
class DetailPedidoController {
  async handle(req: Request, res: Response) {
    const pedido = await new DetailPedidoService().execute(
      req.params.id as string,
      req.user_id
    );
    return res.json(pedido);
  }
}

// Rota PATCH /pedidos/:id/status: a equipe muda o status
class UpdateStatusPedidoController {
  async handle(req: Request, res: Response) {
    const pedido = await new UpdateStatusPedidoService().execute(
      req.params.id as string,
      req.body.status,
      req.user_id,
      req.user_role
    );
    return res.json(pedido);
  }
}

// Rota PATCH /pedidos/:id/cancelar: o cliente cancela o próprio pedido
class CancelPedidoController {
  async handle(req: Request, res: Response) {
    const pedido = await new CancelPedidoService().execute(
      req.params.id as string,
      req.user_id
    );
    return res.json(pedido);
  }
}

export {
  CreatePedidoController,
  CreatePedidoMesaController,
  ListMyPedidosController,
  ListPedidosController,
  DetailPedidoController,
  UpdateStatusPedidoController,
  CancelPedidoController,
};
