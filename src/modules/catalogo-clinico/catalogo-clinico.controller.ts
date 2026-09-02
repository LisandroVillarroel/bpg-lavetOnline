import { Request, Response } from 'express';

import { UserModel } from '../user/user.model';
import TipoCatalogoClinico from '../tipo-catalogo-clinico/tipo-catalogo-clinico.model';
import CatalogoClinico from './catalogo-clinico.model';

type ApiResponse<T> = { error: boolean; data: T | null; codigo: number; mensaje: string };

const buildResponse = <T>(overrides?: Partial<ApiResponse<T>>): ApiResponse<T> => ({
  error: false,
  data: null,
  codigo: 200,
  mensaje: 'ok',
  ...overrides,
});

async function getEmpresaScope(req: Request): Promise<string | null> {
  const userId = req.user?._id || req.user?.id;
  if (!userId) return null;
  const usuario = await UserModel.findById(userId).select('tipoUsuario veterinaria empresa').lean();
  if (!usuario) return null;
  const rol = usuario.veterinaria?.rolVeterinario?.toLowerCase() ?? '';
  const esAdministrador = usuario.tipoUsuario === 'Administración' || rol.includes('administrador');
  return esAdministrador ? '' : usuario.empresa?.empresaId || null;
}

function companyFilter(scope: string, requestedCompany: unknown) {
  return { empresa_Id: scope || String(requestedCompany ?? '') };
}

export async function getAll(req: Request, res: Response) {
  try {
    const scope = await getEmpresaScope(req);
    if (scope === null)
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 403, mensaje: 'Empresa no autorizada' }));
    const filter: Record<string, unknown> = {
      estado: 'Activo',
      ...companyFilter(scope, req.query.empresa_Id),
    };
    if (typeof req.query.tipoCatalogoClinico_Id === 'string' && req.query.tipoCatalogoClinico_Id) {
      filter.tipoCatalogoClinico_Id = req.query.tipoCatalogoClinico_Id;
    }
    const registros = await CatalogoClinico.find(filter)
      .populate('tipoCatalogoClinico_Id', 'codigo nombre')
      .sort({ nombre: 1 });
    return res
      .status(200)
      .json(buildResponse({ data: registros, mensaje: 'Catálogo clínico obtenido correctamente' }));
  } catch {
    return res
      .status(200)
      .json(
        buildResponse({ error: true, codigo: 500, mensaje: 'Error al obtener catálogo clínico' }),
      );
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const scope = await getEmpresaScope(req);
    if (scope === null)
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 403, mensaje: 'Empresa no autorizada' }));
    const registro = await CatalogoClinico.findOne({
      _id: req.params.id,
      ...companyFilter(scope, req.query.empresa_Id),
      estado: 'Activo',
    }).populate('tipoCatalogoClinico_Id', 'codigo nombre');
    if (!registro)
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 404, mensaje: 'Registro no encontrado' }));
    return res.status(200).json(buildResponse({ data: registro, mensaje: 'Registro encontrado' }));
  } catch {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al buscar registro' }));
  }
}

export async function create(req: Request, res: Response) {
  try {
    const scope = await getEmpresaScope(req);
    const empresaId = scope || String(req.body?.empresa_Id ?? '').trim();
    const tipoId = String(req.body?.tipoCatalogoClinico_Id ?? '').trim();
    const tipo = await TipoCatalogoClinico.findOne({
      _id: tipoId,
      empresa_Id: empresaId,
      estado: 'Activo',
    }).lean();
    const codigo = String(req.body?.codigo ?? '')
      .trim()
      .toUpperCase();
    const nombre = String(req.body?.nombre ?? '').trim();
    if (scope === null || !empresaId || !tipo || !codigo || !nombre)
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 400,
          mensaje: 'Tipo, empresa, código y nombre son requeridos',
        }),
      );
    const registro = await CatalogoClinico.create({
      ...req.body,
      empresa_Id: empresaId,
      tipoCatalogoClinico_Id: tipo._id,
      codigo,
      nombre,
      estado: 'Activo',
      usuarioCrea_id: req.user?._id || req.user?.id,
    });
    return res
      .status(201)
      .json(
        buildResponse({ data: registro, codigo: 201, mensaje: 'Registro creado correctamente' }),
      );
  } catch (error) {
    const duplicate =
      typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: duplicate ? 409 : 500,
        mensaje: duplicate ? 'El código ya existe para este tipo' : 'Error al crear registro',
      }),
    );
  }
}

export async function update(req: Request, res: Response) {
  try {
    const scope = await getEmpresaScope(req);
    if (scope === null)
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 403, mensaje: 'Empresa no autorizada' }));
    const actual = await CatalogoClinico.findOne({
      _id: req.params.id,
      ...companyFilter(scope, req.body?.empresa_Id),
    });
    if (!actual)
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 404, mensaje: 'Registro no encontrado' }));
    const data = { ...req.body };
    delete data.empresa_Id;
    if (data.tipoCatalogoClinico_Id) {
      const tipo = await TipoCatalogoClinico.findOne({
        _id: data.tipoCatalogoClinico_Id,
        empresa_Id: actual.empresa_Id,
        estado: 'Activo',
      }).lean();
      if (!tipo)
        return res
          .status(200)
          .json(buildResponse({ error: true, codigo: 400, mensaje: 'Tipo de catálogo no válido' }));
    }
    if (data.codigo) data.codigo = String(data.codigo).trim().toUpperCase();
    if (data.nombre) data.nombre = String(data.nombre).trim();
    const registro = await CatalogoClinico.findByIdAndUpdate(
      req.params.id,
      {
        ...data,
        usuarioModifica_id: req.user?._id || req.user?.id,
        fechaHora_Modifica: new Date(),
      },
      { new: true },
    ).populate('tipoCatalogoClinico_Id', 'codigo nombre');
    return res
      .status(200)
      .json(buildResponse({ data: registro, mensaje: 'Registro actualizado correctamente' }));
  } catch {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al actualizar registro' }));
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const scope = await getEmpresaScope(req);
    if (scope === null)
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 403, mensaje: 'Empresa no autorizada' }));
    const registro = await CatalogoClinico.findOneAndUpdate(
      { _id: req.params.id, ...companyFilter(scope, req.body?.empresa_Id), estado: 'Activo' },
      {
        estado: 'Borrado',
        usuarioModifica_id: req.user?._id || req.user?.id,
        fechaHora_Modifica: new Date(),
      },
      { new: true },
    );
    if (!registro)
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 404, mensaje: 'Registro no encontrado' }));
    return res
      .status(200)
      .json(buildResponse({ data: registro, mensaje: 'Registro eliminado correctamente' }));
  } catch {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al eliminar registro' }));
  }
}
