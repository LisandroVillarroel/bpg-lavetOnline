import { IUser } from '../modules/usuario/usuario.interface';
import { Request } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      _id?: string;
      id?: string;
      // Puedes agregar más propiedades si tu objeto user las tiene
    };
  }
}
