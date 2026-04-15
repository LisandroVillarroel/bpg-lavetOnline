import { Request, Response } from 'express';
import { UserModel } from '../user/user.model';

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

// Consultar todos los usuarios (solo activos)
export async function obtenerUsuarios(req: Request, res: Response) {
  try {
    const { empresaId } = req.params;
    const filtro: any = { estadoUsuario: 'Activo' };
    if (empresaId) filtro['empresa.empresaId'] = empresaId;

    console.log('Filtro para obtener usuarios:', filtro);
    const usuarios = await UserModel.find(filtro);
    return res
      .status(200)
      .json(buildResponse({ data: usuarios, mensaje: 'Usuarios obtenidos correctamente' }));
  } catch (error) {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al obtener usuarios' }));
  }
}

// Consultar usuario por nombre de usuario
export async function obtenerUsuarioPorUsuario(req: Request, res: Response) {
  try {
    const { usuario } = req.params;
    if (!usuario) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 400, mensaje: 'Usuario requerido' }));
    }
    const user = await UserModel.findOne({ usuario, estadoUsuario: 'Activo' });
    if (!user) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 404, mensaje: 'Usuario no encontrado' }));
    }
    return res.status(200).json(buildResponse({ data: user, mensaje: 'Usuario encontrado' }));
  } catch (error) {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al buscar usuario' }));
  }
}

// Agregar usuario
export async function agregarUsuario(req: Request, res: Response) {
  try {
    const nuevoUsuario = new UserModel(req.body);
    await nuevoUsuario.save();
    return res
      .status(201)
      .json(
        buildResponse({ data: nuevoUsuario, mensaje: 'Usuario creado correctamente', codigo: 201 }),
      );
  } catch (error) {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al crear usuario' }));
  }
}

// Modificar usuario
export async function modificarUsuario(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 400, mensaje: 'ID requerido' }));
    }
    const usuarioActualizado = await UserModel.findByIdAndUpdate(id, req.body, { new: true });
    if (!usuarioActualizado) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 404, mensaje: 'Usuario no encontrado' }));
    }
    return res
      .status(200)
      .json(
        buildResponse({ data: usuarioActualizado, mensaje: 'Usuario actualizado correctamente' }),
      );
  } catch (error) {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al actualizar usuario' }));
  }
}

// Eliminar usuario (lógico)
export async function eliminarUsuario(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 400, mensaje: 'ID requerido' }));
    }
    const usuarioEliminado = await UserModel.findByIdAndUpdate(
      id,
      { estadoUsuario: 'Bloqueado' },
      { new: true },
    );
    if (!usuarioEliminado) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 404, mensaje: 'Usuario no encontrado' }));
    }
    return res
      .status(200)
      .json(buildResponse({ data: usuarioEliminado, mensaje: 'Usuario eliminado correctamente' }));
  } catch (error) {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al eliminar usuario' }));
  }
}

// Modificar solo el menú del usuario
export async function modificarMenuUsuario(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { MenuItem } = req.body;
    if (!id) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 400, mensaje: 'ID requerido' }));
    }
    if (!MenuItem || !Array.isArray(MenuItem)) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 400, mensaje: 'MenuItem debe ser un array' }));
    }
    const usuarioActualizado = await UserModel.findByIdAndUpdate(id, { MenuItem }, { new: true });
    if (!usuarioActualizado) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 404, mensaje: 'Usuario no encontrado' }));
    }
    return res.status(200).json(
      buildResponse({
        data: usuarioActualizado,
        mensaje: 'Menú del usuario actualizado correctamente',
      }),
    );
  } catch (error) {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al actualizar el menú del usuario',
      }),
    );
  }
}
