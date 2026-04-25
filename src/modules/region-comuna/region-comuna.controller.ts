import { Request, Response } from 'express';
import RegionComunaModel from './region-comuna.model';

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

export async function obtenerRegionComunas(_req: Request, res: Response) {
  try {
    const regiones = await RegionComunaModel.find({ estado: 'Activo' });
    const regionesOrdenadas = regiones
      .map((region) => ({
        ...region.toObject(),
        comuna: [...region.comuna].sort((a, b) =>
          a.descripcion.localeCompare(b.descripcion, 'es', { sensitivity: 'base' }),
        ),
      }))
      .sort((a, b) => a.region.localeCompare(b.region, 'es', { sensitivity: 'base' }));

    return res
      .status(200)
      .json(
        buildResponse({
          data: regionesOrdenadas,
          mensaje: 'Regiones y comunas obtenidas correctamente',
        }),
      );
  } catch (error) {
    return res
      .status(200)
      .json(
        buildResponse({ error: true, codigo: 500, mensaje: 'Error al obtener regiones y comunas' }),
      );
  }
}

export async function obtenerRegionComunaPorId(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 400, mensaje: 'ID requerido' }));
    }

    const regionComuna = await RegionComunaModel.findById(id);
    if (!regionComuna || regionComuna.estado !== 'Activo') {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 404, mensaje: 'Región/Comuna no encontrada' }));
    }

    return res
      .status(200)
      .json(buildResponse({ data: regionComuna, mensaje: 'Región/Comuna encontrada' }));
  } catch (error) {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al buscar región/comuna' }));
  }
}

export async function crearRegionComuna(req: Request, res: Response) {
  try {
    const now = new Date();
    const nuevaRegionComuna = new RegionComunaModel({
      ...req.body,
      usuarioCrea_id: req.body.usuarioCrea_id || 'sistema',
      usuarioModifica_id: req.body.usuarioCrea_id || 'sistema',
      fechaHora_Crea: now,
      fechaHora_Modifica: now,
      estado: req.body.estado || 'Activo',
    });

    await nuevaRegionComuna.save();
    return res.status(201).json(
      buildResponse({
        data: nuevaRegionComuna,
        codigo: 201,
        mensaje: 'Región/Comuna creada correctamente',
      }),
    );
  } catch (error) {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al crear región/comuna' }));
  }
}

export async function crearRegionesComunasMasivas(req: Request, res: Response) {
  try {
    const payload = Array.isArray(req.body) ? req.body : (req.body.data ?? req.body);

    if (!Array.isArray(payload) || payload.length === 0) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 400,
          mensaje: 'Se requiere un arreglo de regiones y comunas',
        }),
      );
    }

    const now = new Date();
    const documentos = payload.map((item: any) => ({
      region: item.region,
      sigla: item.sigla || item.region,
      descripcion: item.descripcion || item.region,
      comuna: Array.isArray(item.comuna)
        ? item.comuna.map((comuna: any) => ({
            sigla: comuna.sigla || comuna.descripcion || '',
            descripcion: comuna.descripcion || comuna.sigla || '',
          }))
        : [],
      estado: item.estado || 'Activo',
      usuarioCrea_id: item.usuarioCrea_id || 'sistema',
      usuarioModifica_id: item.usuarioModifica_id || 'sistema',
      fechaHora_Crea: now,
      fechaHora_Modifica: now,
    }));

    const created = await RegionComunaModel.insertMany(documentos, { ordered: false });

    return res.status(201).json(
      buildResponse({
        data: created,
        codigo: 201,
        mensaje: `${created.length} regiones/comunas creadas correctamente`,
      }),
    );
  } catch (error: any) {
    const insertedCount = Array.isArray(error?.insertedDocs) ? error.insertedDocs.length : 0;
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: `Error al crear regiones/comunas. Insertadas: ${insertedCount}`,
        data: error?.insertedDocs ?? null,
      }),
    );
  }
}

export async function modificarRegionComuna(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 400, mensaje: 'ID requerido' }));
    }

    const updateData = {
      ...req.body,
      usuarioModifica_id: req.body.usuarioModifica_id || 'sistema',
    };

    const regionComunaActualizada = await RegionComunaModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!regionComunaActualizada) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 404, mensaje: 'Región/Comuna no encontrada' }));
    }

    return res.status(200).json(
      buildResponse({
        data: regionComunaActualizada,
        mensaje: 'Región/Comuna actualizada correctamente',
      }),
    );
  } catch (error) {
    return res
      .status(200)
      .json(
        buildResponse({ error: true, codigo: 500, mensaje: 'Error al actualizar región/comuna' }),
      );
  }
}

export async function eliminarRegionComuna(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 400, mensaje: 'ID requerido' }));
    }

    const regionComunaEliminada = await RegionComunaModel.findByIdAndUpdate(
      id,
      { estado: 'Borrado' },
      { new: true },
    );

    if (!regionComunaEliminada) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 404, mensaje: 'Región/Comuna no encontrada' }));
    }

    return res.status(200).json(
      buildResponse({
        data: regionComunaEliminada,
        mensaje: 'Región/Comuna eliminada correctamente',
      }),
    );
  } catch (error) {
    return res
      .status(200)
      .json(
        buildResponse({ error: true, codigo: 500, mensaje: 'Error al eliminar región/comuna' }),
      );
  }
}
