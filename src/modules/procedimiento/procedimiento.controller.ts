import { Request, Response } from 'express';

import Procedimiento from './procedimiento.model';

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

    const procedimientos = await Procedimiento.find(filter).sort({ nombre: 1 });

    return res.status(200).json(
      buildResponse({
        data: procedimientos,
        mensaje: 'Procedimientos obtenidos correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al obtener procedimientos',
      }),
    );
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const procedimiento = await Procedimiento.findById(req.params.id);

    if (!procedimiento || procedimiento.estado === 'Borrado') {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Procedimiento no encontrado',
        }),
      );
    }

    return res.status(200).json(
      buildResponse({
        data: procedimiento,
        mensaje: 'Procedimiento encontrado',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al buscar procedimiento',
      }),
    );
  }
}

export async function create(req: Request, res: Response) {
  try {
    const procedimiento = new Procedimiento({
      ...req.body,
      estado: 'Activo',
      fechaHora_Crea: new Date(),
    });

    await procedimiento.save();

    return res.status(200).json(
      buildResponse({
        data: procedimiento,
        mensaje: 'Procedimiento creado correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al crear procedimiento',
      }),
    );
  }
}

export async function update(req: Request, res: Response) {
  try {
    const usuarioModifica_id = req.user?._id || req.user?.id;
    const procedimiento = await Procedimiento.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        usuarioModifica_id,
        fechaHora_Modifica: new Date(),
      },
      { new: true },
    );

    if (!procedimiento) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Procedimiento no encontrado',
        }),
      );
    }

    return res.status(200).json(
      buildResponse({
        data: procedimiento,
        mensaje: 'Procedimiento actualizado correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al actualizar procedimiento',
      }),
    );
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const usuarioModifica_id = req.user?._id || req.user?.id;
    const procedimiento = await Procedimiento.findByIdAndUpdate(
      req.params.id,
      {
        estado: 'Borrado',
        usuarioModifica_id,
        fechaHora_Modifica: new Date(),
      },
      { new: true },
    );

    if (!procedimiento) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Procedimiento no encontrado',
        }),
      );
    }

    return res.status(200).json(
      buildResponse({
        data: procedimiento,
        mensaje: 'Procedimiento eliminado correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al eliminar procedimiento',
      }),
    );
  }
}
