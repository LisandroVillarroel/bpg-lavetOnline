import { Request } from 'express';
import { UserModel } from '../../modules/user/user.model';

export type VeterinaryAccess = {
  userId: string;
  empresaId: string | null;
  propietarioId: string | null;
  esPropietario: boolean;
  esAdministrador: boolean;
};

export async function getVeterinaryAccess(req: Request): Promise<VeterinaryAccess | null> {
  const userId = req.user?._id || req.user?.id;
  if (!userId) {
    return null;
  }

  const usuario = await UserModel.findById(userId)
    .select('_id tipoUsuario veterinaria empresa.empresaId')
    .lean();
  if (!usuario) {
    return null;
  }

  const esPropietario = usuario.tipoUsuario === 'Propietario';
  const rol = usuario.veterinaria?.rolVeterinario?.toLowerCase() ?? '';
  const esAdministrador = usuario.tipoUsuario === 'Administración' || rol.includes('administrador');

  return {
    userId: String(usuario._id),
    empresaId: usuario.empresa?.empresaId ? String(usuario.empresa.empresaId) : null,
    propietarioId: esPropietario ? String(usuario._id) : null,
    esPropietario,
    esAdministrador,
  };
}

export function isAllowedCompany(access: VeterinaryAccess, empresaId: string): boolean {
  return access.esAdministrador || access.empresaId === empresaId;
}
