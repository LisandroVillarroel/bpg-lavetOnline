import { Request, Response } from 'express';

import Examen from './examen.model';

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

const categoriaProjection = '_id nombre sigla empresa_Id estado';

export async function getAll(req: Request, res: Response) {
  try {
    const { empresa_Id } = req.query;
    const filter: Record<string, unknown> = { estado: 'Activo' };

    if (typeof empresa_Id === 'string' && empresa_Id) {
      filter.empresa_Id = empresa_Id;
    }

    const examenes = await Examen.find(filter)
      .populate('categoria', categoriaProjection)
      .sort({ nombre: 1 });

    return res.status(200).json(
      buildResponse({
        data: examenes,
        mensaje: 'Exámenes obtenidos correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al obtener exámenes',
      }),
    );
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const examen = await Examen.findById(req.params.id).populate('categoria', categoriaProjection);

    if (!examen || examen.estado === 'Borrado') {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Examen no encontrado',
        }),
      );
    }

    return res.status(200).json(
      buildResponse({
        data: examen,
        mensaje: 'Examen encontrado',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al buscar examen',
      }),
    );
  }
}

export async function create(req: Request, res: Response) {
  try {
    const examen = new Examen({
      ...req.body,
      estado: 'Activo',
      fechaHora_Crea: new Date(),
    });

    await examen.save();
    await examen.populate('categoria', categoriaProjection);

    return res.status(200).json(
      buildResponse({
        data: examen,
        mensaje: 'Examen creado correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al crear examen',
      }),
    );
  }
}

export async function update(req: Request, res: Response) {
  try {
    const usuarioModifica_id = req.user?._id || req.user?.id;
    const examen = await Examen.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        usuarioModifica_id,
        fechaHora_Modifica: new Date(),
      },
      { new: true },
    ).populate('categoria', categoriaProjection);

    if (!examen) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Examen no encontrado',
        }),
      );
    }

    return res.status(200).json(
      buildResponse({
        data: examen,
        mensaje: 'Examen actualizado correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al actualizar examen',
      }),
    );
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const usuarioModifica_id = req.user?._id || req.user?.id;
    const examen = await Examen.findByIdAndUpdate(
      req.params.id,
      {
        estado: 'Borrado',
        usuarioModifica_id,
        fechaHora_Modifica: new Date(),
      },
      { new: true },
    ).populate('categoria', categoriaProjection);

    if (!examen) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Examen no encontrado',
        }),
      );
    }

    return res.status(200).json(
      buildResponse({
        data: examen,
        mensaje: 'Examen eliminado correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al eliminar examen',
      }),
    );
  }
}
