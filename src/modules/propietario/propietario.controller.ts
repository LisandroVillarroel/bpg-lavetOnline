import fs from 'fs';
import path from 'path';
import { hash } from 'bcryptjs';
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
  const filename = `propietario-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
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

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const sanitizePropietario = <T extends { toObject?: () => object; contrasena?: string } | null>(
  propietario: T,
) => {
  if (!propietario) {
    return null;
  }

  const data =
    typeof propietario.toObject === 'function' ? propietario.toObject() : { ...propietario };
  delete (data as { contrasena?: string }).contrasena;
  return data;
};

const sanitizePropietarios = <T extends { toObject?: () => object; contrasena?: string }>(
  propietarios: T[],
) => propietarios.map((propietario) => sanitizePropietario(propietario));

const getDuplicateUsuarioMessage = () => 'El Propietario ya existe';

const PROPIETARIO_FILTER = { tipoUsuario: 'Propietario' as const };

export async function obtenerPropietarios(req: Request, res: Response) {
  try {
    const { empresaId } = req.params;
    const filtro: Record<string, string> = {
      estado: 'Activo',
      tipoUsuario: PROPIETARIO_FILTER.tipoUsuario,
    };

    if (empresaId) {
      filtro['empresa.empresaId'] = empresaId;
    }

    const propietarios = await UserModel.find(filtro);
    return res.status(200).json(
      buildResponse({
        data: sanitizePropietarios(propietarios),
        mensaje: 'Propietarios obtenidos correctamente',
      }),
    );
  } catch (error) {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al obtener propietarios' }));
  }
}

export async function obtenerPropietarioPorId(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 400, mensaje: 'ID requerido' }));
    }

    const propietario = await UserModel.findOne({
      _id: id,
      estado: 'Activo',
      tipoUsuario: PROPIETARIO_FILTER.tipoUsuario,
    });

    if (!propietario) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 404, mensaje: 'Propietario no encontrado' }));
    }

    return res.status(200).json(
      buildResponse({
        data: sanitizePropietario(propietario),
        mensaje: 'Propietario encontrado',
      }),
    );
  } catch (error) {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al buscar propietario' }));
  }
}

export async function obtenerPropietarioPorUsuario(req: Request, res: Response) {
  try {
    const { usuario } = req.params;

    if (!usuario) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 400, mensaje: 'Usuario requerido' }));
    }

    const propietario = await UserModel.findOne({
      usuario,
      estado: 'Activo',
      tipoUsuario: PROPIETARIO_FILTER.tipoUsuario,
    });

    if (!propietario) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 404, mensaje: 'Propietario no encontrado' }));
    }

    return res.status(200).json(
      buildResponse({
        data: sanitizePropietario(propietario),
        mensaje: 'Propietario encontrado',
      }),
    );
  } catch (error) {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al buscar propietario' }));
  }
}

export async function agregarPropietario(req: Request, res: Response) {
  try {
    const body = { ...req.body, tipoUsuario: PROPIETARIO_FILTER.tipoUsuario };
    const usuarioNormalizado = typeof body.usuario === 'string' ? body.usuario.trim() : '';

    if (usuarioNormalizado) {
      body.usuario = usuarioNormalizado;
      const usuarioExistente = await UserModel.findOne({
        usuario: { $regex: `^${escapeRegex(usuarioNormalizado)}$`, $options: 'i' },
      })
        .select('usuario')
        .lean();

      if (usuarioExistente) {
        return res.status(200).json(
          buildResponse({
            error: true,
            codigo: 409,
            mensaje: getDuplicateUsuarioMessage(),
          }),
        );
      }
    }

    if (body.contrasena) {
      body.contrasena = await hash(body.contrasena, 10);
    }

    if (body.fotoBase64) {
      const relativeFotoUrl = await saveBase64Image(body.fotoBase64);
      body.fotoUrl = buildFotoUrl(req, relativeFotoUrl);
      delete body.fotoBase64;
    }

    const nuevoPropietario = new UserModel(body);
    await nuevoPropietario.save();

    return res.status(201).json(
      buildResponse({
        data: sanitizePropietario(nuevoPropietario),
        mensaje: 'Propietario creado correctamente',
        codigo: 201,
      }),
    );
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 409,
          mensaje: getDuplicateUsuarioMessage(),
        }),
      );
    }

    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al crear propietario' }));
  }
}

export async function modificarPropietario(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 400, mensaje: 'ID requerido' }));
    }

    const body = { ...req.body, tipoUsuario: PROPIETARIO_FILTER.tipoUsuario };

    if (body.contrasena) {
      body.contrasena = await hash(body.contrasena, 10);
    }

    if (body.fotoBase64) {
      const relativeFotoUrl = await saveBase64Image(body.fotoBase64);
      body.fotoUrl = buildFotoUrl(req, relativeFotoUrl);
      delete body.fotoBase64;
    }

    const usuarioModifica = req.user?._id || req.user?.id || 'sistema';
    const propietarioActualizado = await UserModel.findOneAndUpdate(
      { _id: id, tipoUsuario: PROPIETARIO_FILTER.tipoUsuario },
      { ...body, usuarioModifica },
      { new: true },
    );

    if (!propietarioActualizado) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 404, mensaje: 'Propietario no encontrado' }));
    }

    return res.status(200).json(
      buildResponse({
        data: sanitizePropietario(propietarioActualizado),
        mensaje: 'Propietario actualizado correctamente',
      }),
    );
  } catch (error) {
    return res
      .status(200)
      .json(
        buildResponse({ error: true, codigo: 500, mensaje: 'Error al actualizar propietario' }),
      );
  }
}

export async function eliminarPropietario(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 400, mensaje: 'ID requerido' }));
    }

    const usuarioModifica = req.user?._id || req.user?.id || 'sistema';
    const propietarioEliminado = await UserModel.findOneAndUpdate(
      { _id: id, tipoUsuario: PROPIETARIO_FILTER.tipoUsuario },
      { estadoUsuario: 'Bloqueado', usuarioModifica },
      { new: true },
    );

    if (!propietarioEliminado) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 404, mensaje: 'Propietario no encontrado' }));
    }

    return res.status(200).json(
      buildResponse({
        data: sanitizePropietario(propietarioEliminado),
        mensaje: 'Propietario eliminado correctamente',
      }),
    );
  } catch (error) {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al eliminar propietario' }));
  }
}
