import { Request, Response } from 'express';

import Medicamento from './medicamento.model';

type ApiResponse<T> = {
  error: boolean;
  data: T | null;
  codigo: number;
  mensaje: string;
};

const buildResponse = <T>(overrides?: Partial<ApiResponse<T>>): ApiResponse<T> => ({
  error: false,
  data: null,
  codigo: 200,
  mensaje: 'ok',
  ...overrides,
});

export async function getAll(req: Request, res: Response) {
  try {
    const { empresa_Id } = req.query;
    const filter: Record<string, unknown> = { estado: 'Activo' };

    if (typeof empresa_Id === 'string' && empresa_Id) {
      filter.empresa_Id = empresa_Id;
    }

    const medicamentos = await Medicamento.find(filter).sort({ nombre: 1 });

    return res.status(200).json(
      buildResponse({
        data: medicamentos,
        mensaje: 'Medicamentos obtenidos correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al obtener medicamentos',
      }),
    );
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const medicamento = await Medicamento.findById(req.params.id);

    if (!medicamento || medicamento.estado === 'Borrado') {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Medicamento no encontrado',
        }),
      );
    }

    return res.status(200).json(
      buildResponse({
        data: medicamento,
        mensaje: 'Medicamento encontrado',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al buscar medicamento',
      }),
    );
  }
}

export async function create(req: Request, res: Response) {
  try {
    const medicamento = new Medicamento({
      ...req.body,
      estado: 'Activo',
      fechaHora_Crea: new Date(),
    });

    await medicamento.save();

    return res.status(200).json(
      buildResponse({
        data: medicamento,
        mensaje: 'Medicamento creado correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al crear medicamento',
      }),
    );
  }
}

export async function update(req: Request, res: Response) {
  try {
    const usuarioModifica_id = req.user?._id || req.user?.id;
    const medicamento = await Medicamento.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        usuarioModifica_id,
        fechaHora_Modifica: new Date(),
      },
      { new: true },
    );

    if (!medicamento) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Medicamento no encontrado',
        }),
      );
    }

    return res.status(200).json(
      buildResponse({
        data: medicamento,
        mensaje: 'Medicamento actualizado correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al actualizar medicamento',
      }),
    );
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const usuarioModifica_id = req.user?._id || req.user?.id;
    const medicamento = await Medicamento.findByIdAndUpdate(
      req.params.id,
      {
        estado: 'Borrado',
        usuarioModifica_id,
        fechaHora_Modifica: new Date(),
      },
      { new: true },
    );

    if (!medicamento) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Medicamento no encontrado',
        }),
      );
    }

    return res.status(200).json(
      buildResponse({
        data: medicamento,
        mensaje: 'Medicamento eliminado correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al eliminar medicamento',
      }),
    );
  }
}
