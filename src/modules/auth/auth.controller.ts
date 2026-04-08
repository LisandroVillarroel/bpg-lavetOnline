import { UserModel } from '../user/user.model';
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
import { Request, Response } from 'express';
import { compare } from 'bcryptjs';
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
