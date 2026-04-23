import { Request, Response } from 'express';
import TipoVeterinarioModel from './tipo-veterinario.model';

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

export async function obtenerTiposVeterinario(_req: Request, res: Response) {
  try {
    const tipos = await TipoVeterinarioModel.find({ estado: { $ne: 'Bloqueado' } });
    return res
      .status(200)
      .json(
        buildResponse({ data: tipos, mensaje: 'Tipos de veterinario obtenidos correctamente' }),
      );
  } catch (error) {
    return res
      .status(200)
      .json(
        buildResponse({
          error: true,
          codigo: 500,
          mensaje: 'Error al obtener tipos de veterinario',
        }),
      );
  }
}

export async function obtenerTipoVeterinarioPorId(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 400, mensaje: 'ID requerido' }));
    }

    const tipo = await TipoVeterinarioModel.findById(id);
    if (!tipo || tipo.estado === 'Bloqueado') {
      return res
        .status(200)
        .json(
          buildResponse({ error: true, codigo: 404, mensaje: 'Tipo de veterinario no encontrado' }),
        );
    }

    return res
      .status(200)
      .json(buildResponse({ data: tipo, mensaje: 'Tipo de veterinario encontrado' }));
  } catch (error) {
    return res
      .status(200)
      .json(
        buildResponse({ error: true, codigo: 500, mensaje: 'Error al buscar tipo de veterinario' }),
      );
  }
}

export async function crearTipoVeterinario(req: Request, res: Response) {
  try {
    const now = new Date();
    const nuevoTipo = new TipoVeterinarioModel({
      ...req.body,
      usuarioCrea: req.body.usuarioCrea || 'sistema',
      usuarioModifica: req.body.usuarioCrea || 'sistema',
      fechaHora_crea: now,
      fechaHora_modifica: now,
      estado: req.body.estado || 'Activo',
    });

    await nuevoTipo.save();
    return res
      .status(201)
      .json(
        buildResponse({
          data: nuevoTipo,
          codigo: 201,
          mensaje: 'Tipo de veterinario creado correctamente',
        }),
      );
  } catch (error) {
    return res
      .status(200)
      .json(
        buildResponse({ error: true, codigo: 500, mensaje: 'Error al crear tipo de veterinario' }),
      );
  }
}

export async function modificarTipoVeterinario(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 400, mensaje: 'ID requerido' }));
    }

    const updateData = {
      ...req.body,
      usuarioModifica: req.body.usuarioModifica || 'sistema',
    };

    const tipoActualizado = await TipoVeterinarioModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!tipoActualizado) {
      return res
        .status(200)
        .json(
          buildResponse({ error: true, codigo: 404, mensaje: 'Tipo de veterinario no encontrado' }),
        );
    }

    return res
      .status(200)
      .json(
        buildResponse({
          data: tipoActualizado,
          mensaje: 'Tipo de veterinario actualizado correctamente',
        }),
      );
  } catch (error) {
    return res
      .status(200)
      .json(
        buildResponse({
          error: true,
          codigo: 500,
          mensaje: 'Error al actualizar tipo de veterinario',
        }),
      );
  }
}

export async function eliminarTipoVeterinario(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 400, mensaje: 'ID requerido' }));
    }

    const tipoEliminado = await TipoVeterinarioModel.findByIdAndUpdate(
      id,
      { estado: 'Bloqueado' },
      { new: true },
    );

    if (!tipoEliminado) {
      return res
        .status(200)
        .json(
          buildResponse({ error: true, codigo: 404, mensaje: 'Tipo de veterinario no encontrado' }),
        );
    }

    return res
      .status(200)
      .json(
        buildResponse({
          data: tipoEliminado,
          mensaje: 'Tipo de veterinario eliminado correctamente',
        }),
      );
  } catch (error) {
    return res
      .status(200)
      .json(
        buildResponse({
          error: true,
          codigo: 500,
          mensaje: 'Error al eliminar tipo de veterinario',
        }),
      );
  }
}
