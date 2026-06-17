import { Request, Response } from 'express';

import Categoria from './categoria.model';

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

    const categorias = await Categoria.find(filter).sort({ nombre: 1 });

    return res.status(200).json(
      buildResponse({
        data: categorias,
        mensaje: 'Categorías obtenidas correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al obtener categorías',
      }),
    );
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const categoria = await Categoria.findById(req.params.id);

    if (!categoria || categoria.estado === 'Borrado') {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Categoría no encontrada',
        }),
      );
    }

    return res.status(200).json(
      buildResponse({
        data: categoria,
        mensaje: 'Categoría encontrada',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al buscar categoría',
      }),
    );
  }
}

export async function create(req: Request, res: Response) {
  try {
    const categoria = new Categoria({
      ...req.body,
      estado: 'Activo',
      fechaHora_Crea: new Date(),
    });

    await categoria.save();

    return res.status(200).json(
      buildResponse({
        data: categoria,
        mensaje: 'Categoría creada correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al crear categoría',
      }),
    );
  }
}

export async function update(req: Request, res: Response) {
  try {
    const usuarioModifica_id = req.user?._id || req.user?.id;
    const categoria = await Categoria.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        usuarioModifica_id,
        fechaHora_Modifica: new Date(),
      },
      { new: true },
    );

    if (!categoria) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Categoría no encontrada',
        }),
      );
    }

    return res.status(200).json(
      buildResponse({
        data: categoria,
        mensaje: 'Categoría actualizada correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al actualizar categoría',
      }),
    );
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const usuarioModifica_id = req.user?._id || req.user?.id;
    const categoria = await Categoria.findByIdAndUpdate(
      req.params.id,
      {
        estado: 'Borrado',
        usuarioModifica_id,
        fechaHora_Modifica: new Date(),
      },
      { new: true },
    );

    if (!categoria) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Categoría no encontrada',
        }),
      );
    }

    return res.status(200).json(
      buildResponse({
        data: categoria,
        mensaje: 'Categoría eliminada correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al eliminar categoría',
      }),
    );
  }
}
