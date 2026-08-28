import { Request, Response } from 'express';

import { UserModel } from '../user/user.model';
import CatalogoClinico from './catalogo-clinico.model';

type CatalogoTipo = 'MOTIVO_CONSULTA' | 'DIAGNOSTICO' | 'VACUNA' | 'INSUMO';

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

const getTipo = (value: unknown): CatalogoTipo | null =>
  value === 'MOTIVO_CONSULTA' || value === 'DIAGNOSTICO' || value === 'VACUNA' || value === 'INSUMO'
    ? value
    : null;

async function getEmpresaScope(req: Request): Promise<string | null> {
  const userId = req.user?._id || req.user?.id;
  if (!userId) {
    return null;
  }

  const usuario = await UserModel.findById(userId).select('tipoUsuario veterinaria empresa').lean();
  const esAdministrador =
    usuario?.tipoUsuario === 'Administración' ||
    usuario?.veterinaria?.rolVeterinario?.toLowerCase().includes('administrador');

  if (esAdministrador) {
    return '';
  }

  return usuario?.empresa?.empresaId || null;
}

export async function getAll(req: Request, res: Response) {
  try {
    const empresaScope = await getEmpresaScope(req);
    if (empresaScope === null) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 403, mensaje: 'Empresa no autorizada' }));
    }

    const { empresa_Id, tipo } = req.query;
    const filter: Record<string, unknown> = { estado: 'Activo' };

    if (empresaScope) {
      filter.empresa_Id = empresaScope;
    } else if (typeof empresa_Id === 'string' && empresa_Id) {
      filter.empresa_Id = empresa_Id;
    }

    const tipoCatalogo = getTipo(tipo);
    if (tipoCatalogo) {
      filter.tipo = tipoCatalogo;
    }

    const registros = await CatalogoClinico.find(filter).sort({ nombre: 1 });
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
    const empresaScope = await getEmpresaScope(req);
    const filtro =
      empresaScope === null
        ? null
        : { _id: req.params.id, ...(empresaScope ? { empresa_Id: empresaScope } : {}) };
    const registro = filtro ? await CatalogoClinico.findOne(filtro) : null;
    if (!registro || registro.estado === 'Borrado') {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 404, mensaje: 'Registro no encontrado' }));
    }

    return res.status(200).json(buildResponse({ data: registro, mensaje: 'Registro encontrado' }));
  } catch {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al buscar registro' }));
  }
}

export async function create(req: Request, res: Response) {
  try {
    const empresaScope = await getEmpresaScope(req);
    const empresaId =
      empresaScope === null ? '' : empresaScope || String(req.body?.empresa_Id || '').trim();
    const tipo = getTipo(req.body?.tipo);
    if (!empresaId || !tipo || !req.body?.codigo || !req.body?.nombre) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 400,
          mensaje: 'Tipo, empresa, código y nombre son requeridos',
        }),
      );
    }

    const registro = new CatalogoClinico({
      ...req.body,
      tipo,
      empresa_Id: empresaId,
      codigo: String(req.body.codigo).trim().toUpperCase(),
      nombre: String(req.body.nombre).trim(),
      estado: 'Activo',
      fechaHora_Crea: new Date(),
    });
    await registro.save();

    return res
      .status(200)
      .json(buildResponse({ data: registro, mensaje: 'Registro creado correctamente' }));
  } catch {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al crear registro' }));
  }
}

export async function update(req: Request, res: Response) {
  try {
    const empresaScope = await getEmpresaScope(req);
    if (empresaScope === null) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 403, mensaje: 'Empresa no autorizada' }));
    }

    const data = { ...req.body };
    if (data.tipo) {
      const tipo = getTipo(data.tipo);
      if (!tipo) {
        return res
          .status(200)
          .json(buildResponse({ error: true, codigo: 400, mensaje: 'Tipo de catálogo no válido' }));
      }
      data.tipo = tipo;
    }
    if (data.codigo) {
      data.codigo = String(data.codigo).trim().toUpperCase();
    }
    if (data.nombre) {
      data.nombre = String(data.nombre).trim();
    }

    const registro = await CatalogoClinico.findOneAndUpdate(
      { _id: req.params.id, ...(empresaScope ? { empresa_Id: empresaScope } : {}) },
      {
        ...data,
        usuarioModifica_id: req.user?._id || req.user?.id,
        fechaHora_Modifica: new Date(),
      },
      { new: true },
    );
    if (!registro) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 404, mensaje: 'Registro no encontrado' }));
    }

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
    const empresaScope = await getEmpresaScope(req);
    if (empresaScope === null) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 403, mensaje: 'Empresa no autorizada' }));
    }

    const registro = await CatalogoClinico.findOneAndUpdate(
      { _id: req.params.id, ...(empresaScope ? { empresa_Id: empresaScope } : {}) },
      {
        estado: 'Borrado',
        usuarioModifica_id: req.user?._id || req.user?.id,
        fechaHora_Modifica: new Date(),
      },
      { new: true },
    );
    if (!registro) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 404, mensaje: 'Registro no encontrado' }));
    }

    return res
      .status(200)
      .json(buildResponse({ data: registro, mensaje: 'Registro eliminado correctamente' }));
  } catch {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al eliminar registro' }));
  }
}
