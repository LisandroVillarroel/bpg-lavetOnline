import { Request, Response } from 'express';

import { getVeterinaryAccess, isAllowedCompany } from '../../core/utils/veterinary-access';
import TipoCatalogoClinico from './tipo-catalogo-clinico.model';

const buildResponse = <T>(
  overrides?: Partial<{ error: boolean; data: T | null; codigo: number; mensaje: string }>,
) => ({
  error: false,
  data: null,
  codigo: 200,
  mensaje: 'ok',
  ...overrides,
});

async function getScope(req: Request) {
  return getVeterinaryAccess(req);
}

export async function getAll(req: Request, res: Response) {
  try {
    const access = await getScope(req);
    const requestedCompany = String(req.query.empresa_Id ?? '');
    const empresaId = access?.esAdministrador ? requestedCompany : (access?.empresaId ?? '');
    if (!access || !empresaId || !isAllowedCompany(access, empresaId)) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 403, mensaje: 'Empresa no autorizada' }));
    }
    const registros = await TipoCatalogoClinico.find({
      empresa_Id: empresaId,
      estado: 'Activo',
    }).sort({ nombre: 1 });
    return res
      .status(200)
      .json(
        buildResponse({ data: registros, mensaje: 'Tipos de catálogo obtenidos correctamente' }),
      );
  } catch {
    return res
      .status(200)
      .json(
        buildResponse({ error: true, codigo: 500, mensaje: 'Error al obtener tipos de catálogo' }),
      );
  }
}

export async function create(req: Request, res: Response) {
  try {
    const access = await getScope(req);
    const empresaId = access?.esAdministrador
      ? String(req.body?.empresa_Id ?? '')
      : (access?.empresaId ?? '');
    const codigo = String(req.body?.codigo ?? '')
      .trim()
      .toUpperCase();
    const nombre = String(req.body?.nombre ?? '').trim();
    if (!access || !empresaId || !codigo || !nombre || !isAllowedCompany(access, empresaId)) {
      return res
        .status(200)
        .json(
          buildResponse({
            error: true,
            codigo: 400,
            mensaje: 'Empresa, código y nombre son requeridos',
          }),
        );
    }
    const registro = await TipoCatalogoClinico.create({
      ...req.body,
      empresa_Id: empresaId,
      codigo,
      nombre,
      estado: 'Activo',
      usuarioCrea_id: access.userId,
    });
    return res
      .status(201)
      .json(
        buildResponse({
          data: registro,
          codigo: 201,
          mensaje: 'Tipo de catálogo creado correctamente',
        }),
      );
  } catch (error) {
    const isDuplicate =
      typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
    return res
      .status(200)
      .json(
        buildResponse({
          error: true,
          codigo: isDuplicate ? 409 : 500,
          mensaje: isDuplicate
            ? 'El código del tipo de catálogo ya existe'
            : 'Error al crear tipo de catálogo',
        }),
      );
  }
}

export async function update(req: Request, res: Response) {
  try {
    const access = await getScope(req);
    const actual = await TipoCatalogoClinico.findById(req.params.id).lean();
    if (!access || !actual || !isAllowedCompany(access, String(actual.empresa_Id))) {
      return res
        .status(200)
        .json(
          buildResponse({ error: true, codigo: 403, mensaje: 'Tipo de catálogo no autorizado' }),
        );
    }
    const data = { ...req.body };
    if (data.codigo) data.codigo = String(data.codigo).trim().toUpperCase();
    if (data.nombre) data.nombre = String(data.nombre).trim();
    delete data.empresa_Id;
    const registro = await TipoCatalogoClinico.findByIdAndUpdate(
      req.params.id,
      { ...data, usuarioModifica_id: access.userId, fechaHora_Modifica: new Date() },
      { new: true },
    );
    return res
      .status(200)
      .json(
        buildResponse({ data: registro, mensaje: 'Tipo de catálogo actualizado correctamente' }),
      );
  } catch {
    return res
      .status(200)
      .json(
        buildResponse({
          error: true,
          codigo: 500,
          mensaje: 'Error al actualizar tipo de catálogo',
        }),
      );
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const access = await getScope(req);
    const actual = await TipoCatalogoClinico.findById(req.params.id).lean();
    if (!access || !actual || !isAllowedCompany(access, String(actual.empresa_Id))) {
      return res
        .status(200)
        .json(
          buildResponse({ error: true, codigo: 403, mensaje: 'Tipo de catálogo no autorizado' }),
        );
    }
    const registro = await TipoCatalogoClinico.findByIdAndUpdate(
      req.params.id,
      { estado: 'Borrado', usuarioModifica_id: access.userId, fechaHora_Modifica: new Date() },
      { new: true },
    );
    return res
      .status(200)
      .json(buildResponse({ data: registro, mensaje: 'Tipo de catálogo eliminado correctamente' }));
  } catch {
    return res
      .status(200)
      .json(
        buildResponse({ error: true, codigo: 500, mensaje: 'Error al eliminar tipo de catálogo' }),
      );
  }
}
