import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || typeof authHeader !== 'string') {
    return res
      .status(401)
      .json({ error: true, mensaje: 'Authorization Bearer requerido', codigo: 401 });
  }

  const [scheme, token, ...extraParts] = authHeader.trim().split(/\s+/);

  if (scheme !== 'Bearer' || !token || extraParts.length > 0) {
    return res
      .status(401)
      .json({ error: true, mensaje: 'Formato Authorization Bearer invalido', codigo: 401 });
  }

  jwt.verify(token, env.JWT_SECRET as string, (err, user) => {
    if (err) {
      return res.status(403).json({ error: true, mensaje: 'Token inválido', codigo: 403 });
    }
    // @ts-ignore
    req.user = user;
    next();
  });
}
