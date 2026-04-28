import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import { UserModel } from '../user/user.model';

type ApiResponse<T> = {
  error: boolean;
  data: T | null;
  codigo: number;
  mensaje: string;
};

const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads', 'usuarios');
fs.mkdirSync(uploadsDir, { recursive: true });

const saveBase64Image = async (base64String: string): Promise<string> => {
  const matches = base64String.match(/^data:(image\/[^;]+);base64,(.*)$/);
  const mimeType = matches?.[1] ?? 'image/png';
  const data = matches?.[2] ?? base64String;
  const extension = mimeType.split('/')[1] ?? 'png';
  const filename = `usuario-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const filePath = path.join(uploadsDir, filename);
  const buffer = Buffer.from(data, 'base64');
  await fs.promises.writeFile(filePath, buffer);
  return `/uploads/usuarios/${filename}`;
};

const buildFotoUrl = (req: Request, relativePath: string): string => {
  const host = req.get('host') ?? 'localhost';
  return `${req.protocol}://${host}${relativePath}`;
};

const buildResponse = <T>(overrides?: Partial<ApiResponse<T>>): ApiResponse<T> => ({
  error: false,
  data: null,
  codigo: 200,
  mensaje: 'ok',
  ...overrides,
});

const TEMAS_VALIDOS = [
  'rose-red-theme',
  'azure-blue-theme',
  'magenta-violet-theme',
  'cyan-orange-theme',
];

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
    const body = { ...req.body };
    if (body.fotoBase64) {
      const relativeFotoUrl = await saveBase64Image(body.fotoBase64);
      body.fotoUrl = buildFotoUrl(req, relativeFotoUrl);
      delete body.fotoBase64;
    }
    const nuevoUsuario = new UserModel(body);
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
    const body = { ...req.body };
    if (body.fotoBase64) {
      const relativeFotoUrl = await saveBase64Image(body.fotoBase64);
      body.fotoUrl = buildFotoUrl(req, relativeFotoUrl);
      delete body.fotoBase64;
    }
    const usuarioActualizado = await UserModel.findByIdAndUpdate(id, body, { new: true });
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

export async function modificarTemaColorSistema(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { temaColorSistema } = req.body;

    if (!id) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 400, mensaje: 'ID requerido' }));
    }

    if (!temaColorSistema || typeof temaColorSistema !== 'string') {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 400,
          mensaje: 'temaColorSistema es requerido',
        }),
      );
    }

    if (!TEMAS_VALIDOS.includes(temaColorSistema)) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 400,
          mensaje: 'temaColorSistema no es valido',
        }),
      );
    }

    const usuarioActualizado = await UserModel.findByIdAndUpdate(
      id,
      { temaColorSistema },
      { new: true },
    );

    if (!usuarioActualizado) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 404, mensaje: 'Usuario no encontrado' }));
    }

    return res.status(200).json(
      buildResponse({
        data: usuarioActualizado,
        mensaje: 'Tema del sistema actualizado correctamente',
      }),
    );
  } catch (error) {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al actualizar el tema del sistema',
      }),
    );
  }
}
