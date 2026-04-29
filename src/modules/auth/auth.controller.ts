import { UserModel } from '../user/user.model';
import { Request, Response } from 'express';
import { compare, hash } from 'bcryptjs';
// Devuelve el usuario autenticado a partir del token
export async function me(req: Request, res: Response) {
  // @ts-ignore
  const userData = req.user;
  if (!userData || !userData.id) {
    return res.status(401).json({ error: true, mensaje: 'No autorizado', codigo: 401 });
  }
  // Busca el usuario en la base de datos usando el campo correcto
  const usuario = await UserModel.findById(userData.id).select('-contrasena');
  if (!usuario) {
    return res.status(404).json({ error: true, mensaje: 'Usuario no encontrado', codigo: 404 });
  }
  res.json(usuario);
}
import jwt, { Secret } from 'jsonwebtoken';
import { env } from '../../config/env';

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

export async function login(req: Request, res: Response) {
  console.log('req.body:', req.body);
  const usuario_ = req.body.usuario;
  const contrasena_ = req.body.contrasena;

  if (!usuario_ || !contrasena_) {
    return res.status(200).json(
      buildResponse({
        error: true,
        mensaje: 'Usuario y contraseña son requeridos',
        codigo: 400,
      }),
    );
  }
  // Buscar por usuario o rutUsuario
  const usuario = await UserModel.findOne({
    $or: [{ usuario: usuario_ }, { rutUsuario: usuario_ }],
  });
  console.log('suaruio encontrado:', usuario);
  if (!usuario) {
    return res.status(200).json(
      buildResponse({
        error: true,
        mensaje: 'Usuario o Contraseña incorrecta',
        codigo: 400,
      }),
    );
  }
  const valid = await compare(contrasena_, usuario.contrasena ?? '');
  if (!valid) {
    return res.status(200).json(
      buildResponse({
        error: true,
        mensaje: 'Usuario o Contraseña incorrecta',
        codigo: 400,
      }),
    );
  }
  const jwtSecret: Secret = env.JWT_SECRET as string;
  const accessToken = jwt.sign({ id: usuario._id, tipoUsuario: usuario.tipoUsuario }, jwtSecret, {
    expiresIn: String(env.JWT_EXPIRES_IN),
  } as jwt.SignOptions);
  const refreshToken = jwt.sign({ id: usuario._id }, jwtSecret, {
    expiresIn: String(env.REFRESH_TOKEN_EXPIRES_IN),
  } as jwt.SignOptions);

  return res.status(200).json(
    buildResponse({
      data: {
        usuario,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: env.JWT_EXPIRES_IN,
        },
      },
    }),
  );
}

export async function changePassword(req: Request, res: Response) {
  // @ts-ignore
  const userData = req.user;
  if (!userData?.id) {
    return res.status(401).json(
      buildResponse({
        error: true,
        mensaje: 'No autorizado',
        codigo: 401,
      }),
    );
  }

  const contrasenaActual = String(req.body?.contrasenaActual ?? '').trim();
  const nuevaContrasena = String(req.body?.nuevaContrasena ?? '').trim();

  if (!contrasenaActual || !nuevaContrasena) {
    return res.status(200).json(
      buildResponse({
        error: true,
        mensaje: 'La contraseña actual y la nueva contraseña son requeridas',
        codigo: 400,
      }),
    );
  }

  if (nuevaContrasena.length < 6) {
    return res.status(200).json(
      buildResponse({
        error: true,
        mensaje: 'La nueva contraseña debe tener al menos 6 caracteres',
        codigo: 400,
      }),
    );
  }

  const usuario = await UserModel.findById(userData.id);
  if (!usuario) {
    return res.status(404).json(
      buildResponse({
        error: true,
        mensaje: 'Usuario no encontrado',
        codigo: 404,
      }),
    );
  }

  const valid = await compare(contrasenaActual, usuario.contrasena ?? '');
  if (!valid) {
    return res.status(200).json(
      buildResponse({
        error: true,
        mensaje: 'La contraseña actual es incorrecta',
        codigo: 400,
      }),
    );
  }

  const nuevaContrasenaHash = await hash(nuevaContrasena, 10);
  usuario.contrasena = nuevaContrasenaHash;
  usuario.fechaHora_modifica = new Date();
  await usuario.save();

  return res.status(200).json(
    buildResponse({
      mensaje: 'Contraseña actualizada correctamente',
      codigo: 200,
    }),
  );
}
