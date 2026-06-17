import fs from 'fs';
import path from 'path';
import { hash } from 'bcryptjs';
import { Request, Response } from 'express';

import { UserModel } from '../../user/user.model';

type ApiResponse<T> = {
  error: boolean;
  data: T | null;
  codigo: number;
  mensaje: string;
};

const uploadsDir = path.join(__dirname, '..', '..', '..', '..', 'uploads', 'usuarios');
fs.mkdirSync(uploadsDir, { recursive: true });

const saveBase64Image = async (base64String: string): Promise<string> => {
  const matches = base64String.match(/^data:(image\/[^;]+);base64,(.*)$/);
  const mimeType = matches?.[1] ?? 'image/png';
  const data = matches?.[2] ?? base64String;
  const extension = mimeType.split('/')[1] ?? 'png';
  const filename = `cliente-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
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

const sanitizeCliente = <T extends { toObject?: () => object; contrasena?: string } | null>(
  cliente: T,
) => {
  if (!cliente) {
    return null;
  }

  const data = typeof cliente.toObject === 'function' ? cliente.toObject() : { ...cliente };
  delete (data as { contrasena?: string }).contrasena;
  return data;
};

const sanitizeClientes = <T extends { toObject?: () => object; contrasena?: string }>(
  clientes: T[],
) => clientes.map((cliente) => sanitizeCliente(cliente));

const getDuplicateUsuarioMessage = () => 'El Cliente ya existe';

const CLIENTE_FILTER = { tipoUsuario: 'Propietario' as const };

export async function obtenerClientes(req: Request, res: Response) {
  try {
    const { empresaId } = req.params;
    const filtro: Record<string, string> = {
      estado: 'Activo',
      tipoUsuario: CLIENTE_FILTER.tipoUsuario,
    };

    if (empresaId) {
      filtro['empresa.empresaId'] = empresaId;
    }

    const clientes = await UserModel.find(filtro);
    return res.status(200).json(
      buildResponse({
        data: sanitizeClientes(clientes),
        mensaje: 'Clientes obtenidos correctamente',
      }),
    );
  } catch (error) {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al obtener clientes' }));
  }
}

export async function obtenerClientePorId(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 400, mensaje: 'ID requerido' }));
    }

    const cliente = await UserModel.findOne({
      _id: id,
      estado: 'Activo',
      tipoUsuario: CLIENTE_FILTER.tipoUsuario,
    });

    if (!cliente) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 404, mensaje: 'Cliente no encontrado' }));
    }

    return res.status(200).json(
      buildResponse({
        data: sanitizeCliente(cliente),
        mensaje: 'Cliente encontrado',
      }),
    );
  } catch (error) {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al buscar cliente' }));
  }
}

export async function obtenerClientePorUsuario(req: Request, res: Response) {
  try {
    const { usuario } = req.params;

    if (!usuario) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 400, mensaje: 'Usuario requerido' }));
    }

    const cliente = await UserModel.findOne({
      usuario,
      estado: 'Activo',
      tipoUsuario: CLIENTE_FILTER.tipoUsuario,
    });

    if (!cliente) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 404, mensaje: 'Cliente no encontrado' }));
    }

    return res.status(200).json(
      buildResponse({
        data: sanitizeCliente(cliente),
        mensaje: 'Cliente encontrado',
      }),
    );
  } catch (error) {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al buscar cliente' }));
  }
}

export async function agregarCliente(req: Request, res: Response) {
  try {
    const body = { ...req.body, tipoUsuario: CLIENTE_FILTER.tipoUsuario };
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

    const nuevoCliente = new UserModel(body);
    await nuevoCliente.save();

    return res.status(201).json(
      buildResponse({
        data: sanitizeCliente(nuevoCliente),
        mensaje: 'Cliente creado correctamente',
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
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al crear cliente' }));
  }
}

export async function modificarCliente(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 400, mensaje: 'ID requerido' }));
    }

    const body = { ...req.body, tipoUsuario: CLIENTE_FILTER.tipoUsuario };

    if (body.contrasena) {
      body.contrasena = await hash(body.contrasena, 10);
    }

    if (body.fotoBase64) {
      const relativeFotoUrl = await saveBase64Image(body.fotoBase64);
      body.fotoUrl = buildFotoUrl(req, relativeFotoUrl);
      delete body.fotoBase64;
    }

    const usuarioModifica = req.user?._id || req.user?.id || 'sistema';
    const clienteActualizado = await UserModel.findOneAndUpdate(
      { _id: id, tipoUsuario: CLIENTE_FILTER.tipoUsuario },
      { ...body, usuarioModifica },
      { new: true },
    );

    if (!clienteActualizado) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 404, mensaje: 'Cliente no encontrado' }));
    }

    return res.status(200).json(
      buildResponse({
        data: sanitizeCliente(clienteActualizado),
        mensaje: 'Cliente actualizado correctamente',
      }),
    );
  } catch (error) {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al actualizar cliente' }));
  }
}

export async function eliminarCliente(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 400, mensaje: 'ID requerido' }));
    }

    const usuarioModifica = req.user?._id || req.user?.id || 'sistema';
    const clienteEliminado = await UserModel.findOneAndUpdate(
      { _id: id, tipoUsuario: CLIENTE_FILTER.tipoUsuario },
      { estadoUsuario: 'Bloqueado', usuarioModifica },
      { new: true },
    );

    if (!clienteEliminado) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 404, mensaje: 'Cliente no encontrado' }));
    }

    return res.status(200).json(
      buildResponse({
        data: sanitizeCliente(clienteEliminado),
        mensaje: 'Cliente eliminado correctamente',
      }),
    );
  } catch (error) {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al eliminar cliente' }));
  }
}
