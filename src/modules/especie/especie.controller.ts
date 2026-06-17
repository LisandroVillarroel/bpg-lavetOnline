import Especie from './especie.model';
import { Request, Response } from 'express';
import Raza from '../raza/raza.model';

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
    const filter: any = { estado: 'Activo' };
    if (typeof empresa_Id === 'string' && empresa_Id) filter.empresa_Id = empresa_Id;
    const especies = await Especie.find(filter);
    return res.status(200).json(
      buildResponse({
        data: especies,
        mensaje: 'Especies obtenidas correctamente',
      }),
    );
  } catch (error) {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al obtener especies' }));
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const especie = await Especie.findById(req.params.id);
    if (!especie || especie.estado === 'Borrado') {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 404, mensaje: 'Especie no encontrada' }));
    }
    return res.status(200).json(buildResponse({ data: especie, mensaje: 'Especie encontrada' }));
  } catch (error) {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al buscar especie' }));
  }
}

export async function create(req: Request, res: Response) {
  try {
    const data = req.body;
    const especie = new Especie({
      ...data,
      estado: 'Activo',
      fechaHora_Crea: new Date(),
    });
    await especie.save();
    return res.status(200).json(
      buildResponse({
        data: especie,
        codigo: 200,
        mensaje: 'Especie creada correctamente',
      }),
    );
  } catch (error) {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al crear especie' }));
  }
}

export async function update(req: Request, res: Response) {
  try {
    const data = req.body;
    // Se asume que req.user._id contiene el id del usuario autenticado
    const usuarioModifica_id = req.user?._id || req.user?.id;
    const especieActual = await Especie.findById(req.params.id);

    if (!especieActual) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 404, mensaje: 'Especie no encontrada' }));
    }

    const nombreAnterior = String(especieActual.nombre ?? '').trim();
    const nombreNuevo = typeof data?.nombre === 'string' ? data.nombre.trim() : nombreAnterior;
    const especie = await Especie.findByIdAndUpdate(
      req.params.id,
      {
        ...data,
        nombre: nombreNuevo,
        usuarioModifica_id,
        fechaHora_Modifica: new Date(),
      },
      { new: true },
    );

    if (nombreAnterior && nombreNuevo && nombreAnterior !== nombreNuevo) {
      await Raza.updateMany(
        {
          empresa_Id: especieActual.empresa_Id,
          especieNombre: nombreAnterior,
        },
        {
          $set: {
            especieNombre: nombreNuevo,
            usuarioModifica_id,
            fechaHora_Modifica: new Date(),
          },
        },
      );
    }

    return res
      .status(200)
      .json(buildResponse({ data: especie, mensaje: 'Especie actualizada correctamente' }));
  } catch (error) {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al actualizar especie' }));
  }
}

export async function remove(req: Request, res: Response) {
  try {
    // Se asume que req.user._id contiene el id del usuario autenticado
    const usuarioModifica_id = req.user?._id || req.user?.id;
    const especie = await Especie.findByIdAndUpdate(
      req.params.id,
      { estado: 'Borrado', usuarioModifica_id, fechaHora_Modifica: new Date() },
      { new: true },
    );
    if (!especie) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 404, mensaje: 'Especie no encontrada' }));
    }
    return res
      .status(200)
      .json(buildResponse({ data: especie, mensaje: 'Especie eliminada correctamente' }));
  } catch (error) {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al eliminar especie' }));
  }
}
