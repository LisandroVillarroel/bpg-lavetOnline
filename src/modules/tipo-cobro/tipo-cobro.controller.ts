import { Request, Response } from 'express';

import TipoCobro from './tipo-cobro.model';

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

    const tiposCobro = await TipoCobro.find(filter).sort({ nombre: 1 });

    return res.status(200).json(
      buildResponse({
        data: tiposCobro,
        mensaje: 'Tipos de cobro obtenidos correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al obtener tipos de cobro',
      }),
    );
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const tipoCobro = await TipoCobro.findById(req.params.id);

    if (!tipoCobro || tipoCobro.estado === 'Borrado') {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Tipo de cobro no encontrado',
        }),
      );
    }

    return res.status(200).json(
      buildResponse({
        data: tipoCobro,
        mensaje: 'Tipo de cobro encontrado',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al buscar tipo de cobro',
      }),
    );
  }
}

export async function create(req: Request, res: Response) {
  try {
    const tipoCobro = new TipoCobro({
      ...req.body,
      estado: 'Activo',
      fechaHora_Crea: new Date(),
    });

    await tipoCobro.save();

    return res.status(200).json(
      buildResponse({
        data: tipoCobro,
        mensaje: 'Tipo de cobro creado correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al crear tipo de cobro',
      }),
    );
  }
}

export async function update(req: Request, res: Response) {
  try {
    const usuarioModifica_id = req.user?._id || req.user?.id;
    const tipoCobro = await TipoCobro.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        usuarioModifica_id,
        fechaHora_Modifica: new Date(),
      },
      { new: true },
    );

    if (!tipoCobro) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Tipo de cobro no encontrado',
        }),
      );
    }

    return res.status(200).json(
      buildResponse({
        data: tipoCobro,
        mensaje: 'Tipo de cobro actualizado correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al actualizar tipo de cobro',
      }),
    );
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const usuarioModifica_id = req.user?._id || req.user?.id;
    const tipoCobro = await TipoCobro.findByIdAndUpdate(
      req.params.id,
      {
        estado: 'Borrado',
        usuarioModifica_id,
        fechaHora_Modifica: new Date(),
      },
      { new: true },
    );

    if (!tipoCobro) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Tipo de cobro no encontrado',
        }),
      );
    }

    return res.status(200).json(
      buildResponse({
        data: tipoCobro,
        mensaje: 'Tipo de cobro eliminado correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al eliminar tipo de cobro',
      }),
    );
  }
}
