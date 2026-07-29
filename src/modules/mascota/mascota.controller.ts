import { Request, Response } from 'express';
import Mascota from './mascota.model';

const buildResponse = <T>(
  overrides?: Partial<{ error: boolean; data: T | null; codigo: number; mensaje: string }>,
) => ({
  error: false,
  data: null,
  codigo: 200,
  mensaje: 'ok',
  ...overrides,
});

const mascotaPopulate = [
  {
    path: 'propietario_Id',
    select: 'nombres apellidoPaterno apellidoMaterno rutUsuario telefono email',
  },
  { path: 'especie_Id', select: 'nombre' },
  { path: 'raza_Id', select: 'nombre' },
];

export async function obtenerMascotasPorEmpresa(req: Request, res: Response) {
  try {
    const { empresaId } = req.params;
    const filtro: Record<string, unknown> = {
      estado: 'Activo',
      empresa_Id: empresaId,
    };

    const mascotas = await Mascota.find(filtro).populate(mascotaPopulate).sort({ nombre: 1 });

    return res.status(200).json(
      buildResponse({
        data: mascotas,
        mensaje: 'Mascotas obtenidas correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al obtener mascotas',
      }),
    );
  }
}

export async function obtenerMascotasPorPropietario(req: Request, res: Response) {
  try {
    const { propietarioId } = req.params;
    const filtro = {
      estado: 'Activo',
      propietario_Id: propietarioId,
    };

    const mascotas = await Mascota.find(filtro).populate(mascotaPopulate).sort({ nombre: 1 });

    return res.status(200).json(
      buildResponse({
        data: mascotas,
        mensaje: 'Mascotas obtenidas correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al obtener mascotas del propietario',
      }),
    );
  }
}

export async function obtenerMascotaPorId(req: Request, res: Response) {
  try {
    const mascota = await Mascota.findById(req.params.id).populate(mascotaPopulate);

    if (!mascota || mascota.estado === 'Borrado') {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Mascota no encontrada',
        }),
      );
    }

    return res.status(200).json(
      buildResponse({
        data: mascota,
        mensaje: 'Mascota encontrada',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al buscar mascota',
      }),
    );
  }
}

export async function crearMascota(req: Request, res: Response) {
  try {
    const mascota = new Mascota({
      ...req.body,
      estado: 'Activo',
      fechaHora_Crea: new Date(),
    });

    await mascota.save();
    await mascota.populate(mascotaPopulate);

    return res.status(200).json(
      buildResponse({
        data: mascota,
        mensaje: 'Mascota creada correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al crear mascota',
      }),
    );
  }
}

export async function modificarMascota(req: Request, res: Response) {
  try {
    const usuarioModifica_id = req.user?._id || req.user?.id;
    const mascota = await Mascota.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        usuarioModifica_id,
        fechaHora_Modifica: new Date(),
      },
      { new: true },
    ).populate(mascotaPopulate);

    if (!mascota) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Mascota no encontrada',
        }),
      );
    }

    return res.status(200).json(
      buildResponse({
        data: mascota,
        mensaje: 'Mascota actualizada correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al actualizar mascota',
      }),
    );
  }
}

export async function eliminarMascota(req: Request, res: Response) {
  try {
    const usuarioModifica_id = req.user?._id || req.user?.id;
    const mascota = await Mascota.findByIdAndUpdate(
      req.params.id,
      {
        estado: 'Borrado',
        usuarioModifica_id,
        fechaHora_Modifica: new Date(),
      },
      { new: true },
    ).populate(mascotaPopulate);

    if (!mascota) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Mascota no encontrada',
        }),
      );
    }

    return res.status(200).json(
      buildResponse({
        data: mascota,
        mensaje: 'Mascota eliminada correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al eliminar mascota',
      }),
    );
  }
}
