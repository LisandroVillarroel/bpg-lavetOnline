import { Request, Response } from 'express';
import RolVeterinario from './rol-veterinario.model';

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

export async function obtenerRolesVeterinario(_req: Request, res: Response) {
  try {
    const roles = await RolVeterinario.find({ estado: { $ne: 'Bloqueado' } });
    return res
      .status(200)
      .json(
        buildResponse({ data: roles, mensaje: 'Roles de veterinario obtenidos correctamente' }),
      );
  } catch (error) {
    return res
      .status(200)
      .json(
        buildResponse({
          error: true,
          codigo: 500,
          mensaje: 'Error al obtener roles de veterinario',
        }),
      );
  }
}

export async function obtenerRolVeterinarioPorId(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 400, mensaje: 'ID requerido' }));
    }

    const rol = await RolVeterinario.findById(id);
    if (!rol || rol.estado === 'Bloqueado') {
      return res
        .status(200)
        .json(
          buildResponse({ error: true, codigo: 404, mensaje: 'Rol de veterinario no encontrado' }),
        );
    }

    return res
      .status(200)
      .json(buildResponse({ data: rol, mensaje: 'Rol de veterinario encontrado' }));
  } catch (error) {
    return res
      .status(200)
      .json(
        buildResponse({ error: true, codigo: 500, mensaje: 'Error al buscar rol de veterinario' }),
      );
  }
}

export async function crearRolVeterinario(req: Request, res: Response) {
  try {
    const now = new Date();
    const nuevoRol = new RolVeterinario({
      ...req.body,
      usuarioCrea: req.body.usuarioCrea || 'sistema',
      usuarioModifica: req.body.usuarioCrea || 'sistema',
      fechaHora_crea: now,
      fechaHora_modifica: now,
      estado: req.body.estado || 'Activo',
    });
    await nuevoRol.save();

    return res
      .status(201)
      .json(
        buildResponse({
          data: nuevoRol,
          codigo: 201,
          mensaje: 'Rol de veterinario creado correctamente',
        }),
      );
  } catch (error) {
    return res
      .status(200)
      .json(
        buildResponse({ error: true, codigo: 500, mensaje: 'Error al crear rol de veterinario' }),
      );
  }
}

export async function modificarRolVeterinario(req: Request, res: Response) {
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

    const rolActualizado = await RolVeterinario.findByIdAndUpdate(id, updateData, { new: true });
    if (!rolActualizado) {
      return res
        .status(200)
        .json(
          buildResponse({ error: true, codigo: 404, mensaje: 'Rol de veterinario no encontrado' }),
        );
    }

    return res
      .status(200)
      .json(
        buildResponse({
          data: rolActualizado,
          mensaje: 'Rol de veterinario actualizado correctamente',
        }),
      );
  } catch (error) {
    return res
      .status(200)
      .json(
        buildResponse({
          error: true,
          codigo: 500,
          mensaje: 'Error al actualizar rol de veterinario',
        }),
      );
  }
}

export async function eliminarRolVeterinario(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 400, mensaje: 'ID requerido' }));
    }

    const rolEliminado = await RolVeterinario.findByIdAndUpdate(
      id,
      { estado: 'Bloqueado' },
      { new: true },
    );

    if (!rolEliminado) {
      return res
        .status(200)
        .json(
          buildResponse({ error: true, codigo: 404, mensaje: 'Rol de veterinario no encontrado' }),
        );
    }

    return res
      .status(200)
      .json(
        buildResponse({
          data: rolEliminado,
          mensaje: 'Rol de veterinario eliminado correctamente',
        }),
      );
  } catch (error) {
    return res
      .status(200)
      .json(
        buildResponse({
          error: true,
          codigo: 500,
          mensaje: 'Error al eliminar rol de veterinario',
        }),
      );
  }
}
