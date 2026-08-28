import { Request, Response } from 'express';

import TipoAtencion from './tipo-atencion.model';

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

    const tiposAtencion = await TipoAtencion.find(filter).sort({ nombre: 1 });

    return res.status(200).json(
      buildResponse({
        data: tiposAtencion,
        mensaje: 'Tipos de atención obtenidos correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al obtener tipos de atención',
      }),
    );
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const tipoAtencion = await TipoAtencion.findById(req.params.id);

    if (!tipoAtencion || tipoAtencion.estado === 'Borrado') {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Tipo de atención no encontrado',
        }),
      );
    }

    return res.status(200).json(
      buildResponse({
        data: tipoAtencion,
        mensaje: 'Tipo de atención encontrado',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al buscar tipo de atención',
      }),
    );
  }
}

export async function create(req: Request, res: Response) {
  try {
    const tipoAtencion = new TipoAtencion({
      ...req.body,
      estado: 'Activo',
      fechaHora_Crea: new Date(),
    });

    await tipoAtencion.save();

    return res.status(200).json(
      buildResponse({
        data: tipoAtencion,
        mensaje: 'Tipo de atención creado correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al crear tipo de atención',
      }),
    );
  }
}

export async function update(req: Request, res: Response) {
  try {
    const usuarioModifica_id = req.user?._id || req.user?.id;
    const tipoAtencion = await TipoAtencion.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        usuarioModifica_id,
        fechaHora_Modifica: new Date(),
      },
      { new: true },
    );

    if (!tipoAtencion) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Tipo de atención no encontrado',
        }),
      );
    }

    return res.status(200).json(
      buildResponse({
        data: tipoAtencion,
        mensaje: 'Tipo de atención actualizado correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al actualizar tipo de atención',
      }),
    );
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const usuarioModifica_id = req.user?._id || req.user?.id;
    const tipoAtencion = await TipoAtencion.findByIdAndUpdate(
      req.params.id,
      {
        estado: 'Borrado',
        usuarioModifica_id,
        fechaHora_Modifica: new Date(),
      },
      { new: true },
    );

    if (!tipoAtencion) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Tipo de atención no encontrado',
        }),
      );
    }

    return res.status(200).json(
      buildResponse({
        data: tipoAtencion,
        mensaje: 'Tipo de atención eliminado correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al eliminar tipo de atención',
      }),
    );
  }
}
