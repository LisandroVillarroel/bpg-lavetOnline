import { Request, Response } from 'express';
import Atencion from './atencion.model';

const buildResponse = <T>(
  overrides?: Partial<{ error: boolean; data: T | null; codigo: number; mensaje: string }>,
) => ({
  error: false,
  data: null,
  codigo: 200,
  mensaje: 'ok',
  ...overrides,
});

const atencionPopulate = [
  { path: 'mascota_Id', select: 'nombre especie_Id raza_Id propietario_Id' },
  {
    path: 'propietario_Id',
    select: 'nombres apellidoPaterno apellidoMaterno rutUsuario telefono email',
  },
];

export async function obtenerAtencionesPorEmpresa(req: Request, res: Response) {
  try {
    const { empresaId } = req.params;
    const filtro = { estado: 'Activo', empresa_Id: empresaId };
    const atenciones = await Atencion.find(filtro)
      .populate(atencionPopulate)
      .sort({ fechaAtencion: -1 });

    return res.status(200).json(
      buildResponse({
        data: atenciones,
        mensaje: 'Atenciones obtenidas correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al obtener atenciones',
      }),
    );
  }
}

export async function obtenerAtencionesPorMascota(req: Request, res: Response) {
  try {
    const { mascotaId } = req.params;
    const filtro = { estado: 'Activo', mascota_Id: mascotaId };
    const atenciones = await Atencion.find(filtro)
      .populate(atencionPopulate)
      .sort({ fechaAtencion: -1 });

    return res.status(200).json(
      buildResponse({
        data: atenciones,
        mensaje: 'Atenciones obtenidas correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al obtener atenciones de la mascota',
      }),
    );
  }
}

export async function obtenerAtencionesPorPropietario(req: Request, res: Response) {
  try {
    const { propietarioId } = req.params;
    const filtro = { estado: 'Activo', propietario_Id: propietarioId };
    const atenciones = await Atencion.find(filtro)
      .populate(atencionPopulate)
      .sort({ fechaAtencion: -1 });

    return res.status(200).json(
      buildResponse({
        data: atenciones,
        mensaje: 'Atenciones obtenidas correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al obtener atenciones del propietario',
      }),
    );
  }
}

export async function obtenerAtencionPorId(req: Request, res: Response) {
  try {
    const atencion = await Atencion.findById(req.params.id).populate(atencionPopulate);

    if (!atencion || atencion.estado === 'Borrado') {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Atención no encontrada',
        }),
      );
    }

    return res.status(200).json(
      buildResponse({
        data: atencion,
        mensaje: 'Atención encontrada',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al buscar atención',
      }),
    );
  }
}

export async function crearAtencion(req: Request, res: Response) {
  try {
    const atencion = new Atencion({
      ...req.body,
      estado: 'Activo',
      fechaHora_Crea: new Date(),
    });
    await atencion.save();
    await atencion.populate(atencionPopulate);

    return res.status(200).json(
      buildResponse({
        data: atencion,
        mensaje: 'Atención creada correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al crear atención',
      }),
    );
  }
}

export async function modificarAtencion(req: Request, res: Response) {
  try {
    const usuarioModifica_id = req.user?._id || req.user?.id;
    const atencion = await Atencion.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        usuarioModifica_id,
        fechaHora_Modifica: new Date(),
      },
      { new: true },
    ).populate(atencionPopulate);

    if (!atencion) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Atención no encontrada',
        }),
      );
    }

    return res.status(200).json(
      buildResponse({
        data: atencion,
        mensaje: 'Atención actualizada correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al actualizar atención',
      }),
    );
  }
}

export async function eliminarAtencion(req: Request, res: Response) {
  try {
    const usuarioModifica_id = req.user?._id || req.user?.id;
    const atencion = await Atencion.findByIdAndUpdate(
      req.params.id,
      {
        estado: 'Borrado',
        usuarioModifica_id,
        fechaHora_Modifica: new Date(),
      },
      { new: true },
    ).populate(atencionPopulate);

    if (!atencion) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Atención no encontrada',
        }),
      );
    }

    return res.status(200).json(
      buildResponse({
        data: atencion,
        mensaje: 'Atención eliminada correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al eliminar atención',
      }),
    );
  }
}
