import Raza from './raza.model';
import { Request, Response } from 'express';

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

// Obtener todas las razas
export const obtenerRazas = async (req: Request, res: Response) => {
  try {
    const { empresa_Id } = req.query;
    const filter: any = { estado: 'Activo' };
    if (typeof empresa_Id === 'string' && empresa_Id) filter.empresa_Id = empresa_Id;
    const razas = await Raza.find(filter);
    return res.status(200).json(
      buildResponse({
        data: razas,
        mensaje: 'Razas obtenidas correctamente',
      }),
    );
  } catch (error) {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al obtener razas' }));
  }
};

// Crear una raza
export const crearRaza = async (req: Request, res: Response) => {
  try {
    const nuevaRaza = new Raza({
      ...req.body,
      estado: 'Activo',
      usuarioCrea_id: req.user?._id || req.user?.id,
      fechaHora_Crea: new Date(),
    });
    await nuevaRaza.save();
    return res.status(200).json(
      buildResponse({
        data: nuevaRaza,
        codigo: 200,
        mensaje: 'Raza creada correctamente',
      }),
    );
  } catch (error) {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al crear raza' }));
  }
};

// Modificar una raza
export const modificarRaza = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const razaActualizada = await Raza.findByIdAndUpdate(
      id,
      {
        ...req.body,
        usuarioModifica_id: req.user?._id || req.user?.id,
        fechaHora_Modifica: new Date(),
      },
      { new: true },
    );
    if (!razaActualizada) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 404, mensaje: 'Raza no encontrada' }));
    }
    return res
      .status(200)
      .json(buildResponse({ data: razaActualizada, mensaje: 'Raza actualizada correctamente' }));
  } catch (error) {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al modificar raza' }));
  }
};

// Eliminar (borrado lógico) una raza
export const eliminarRaza = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const razaEliminada = await Raza.findByIdAndUpdate(
      id,
      {
        estado: 'Borrado',
        usuarioModifica_id: req.user?._id || req.user?.id,
        fechaHora_Modifica: new Date(),
      },
      { new: true },
    );
    if (!razaEliminada) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 404, mensaje: 'Raza no encontrada' }));
    }
    return res
      .status(200)
      .json(buildResponse({ data: razaEliminada, mensaje: 'Raza eliminada correctamente' }));
  } catch (error) {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al eliminar raza' }));
  }
};
