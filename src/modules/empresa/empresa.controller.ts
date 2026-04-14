import { Request, Response } from 'express';
import Empresa from './empresa.model';

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

// Consultar todas las empresas (solo activas)
export async function obtenerEmpresas(_req: Request, res: Response) {
  try {
    const empresas = await Empresa.find({ estadoEmpresa: { $ne: 'Bloqueado' } });
    return res
      .status(200)
      .json(buildResponse({ data: empresas, mensaje: 'Empresas obtenidas correctamente' }));
  } catch (error) {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al obtener empresas' }));
  }
}

// Consultar empresa por ID
export async function obtenerEmpresaPorId(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 400, mensaje: 'ID requerido' }));
    }
    const empresa = await Empresa.findById(id);
    if (!empresa || empresa.estadoEmpresa === 'Bloqueado') {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 404, mensaje: 'Empresa no encontrada' }));
    }
    return res.status(200).json(buildResponse({ data: empresa, mensaje: 'Empresa encontrada' }));
  } catch (error) {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al buscar empresa' }));
  }
}

// Agregar empresa
export async function agregarEmpresa(req: Request, res: Response) {
  try {
    const now = new Date();
    const nuevaEmpresa = new Empresa({
      ...req.body,
      usuarioCrea: req.body.usuarioCrea || 'sistema',
      fechaHora_crea: now,
      usuarioModifica: req.body.usuarioCrea || 'sistema',
      fechaHora_modifica: now,
    });
    await nuevaEmpresa.save();
    return res
      .status(201)
      .json(
        buildResponse({ data: nuevaEmpresa, mensaje: 'Empresa creada correctamente', codigo: 201 }),
      );
  } catch (error) {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al crear empresa' }));
  }
}

// Modificar empresa
export async function modificarEmpresa(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 400, mensaje: 'ID requerido' }));
    }
    const now = new Date();
    const updateData = {
      ...req.body,
      usuarioModifica: req.body.usuarioModifica || 'sistema',
      fechaHora_modifica: now,
    };
    const empresaActualizada = await Empresa.findByIdAndUpdate(id, updateData, { new: true });
    if (!empresaActualizada) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 404, mensaje: 'Empresa no encontrada' }));
    }
    return res
      .status(200)
      .json(
        buildResponse({ data: empresaActualizada, mensaje: 'Empresa actualizada correctamente' }),
      );
  } catch (error) {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al actualizar empresa' }));
  }
}

// Eliminar empresa (lógico)
export async function eliminarEmpresa(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 400, mensaje: 'ID requerido' }));
    }
    const empresaEliminada = await Empresa.findByIdAndUpdate(
      id,
      { estadoEmpresa: 'Bloqueado' },
      { new: true },
    );
    if (!empresaEliminada) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 404, mensaje: 'Empresa no encontrada' }));
    }
    return res
      .status(200)
      .json(buildResponse({ data: empresaEliminada, mensaje: 'Empresa eliminada correctamente' }));
  } catch (error) {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al eliminar empresa' }));
  }
}

// Modificar solo el menú de la empresa
export async function modificarMenuEmpresa(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { MenuItem } = req.body;
    if (!id) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 400, mensaje: 'ID requerido' }));
    }
    if (!MenuItem || !Array.isArray(MenuItem)) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 400, mensaje: 'MenuItem debe ser un array' }));
    }
    const empresaActualizada = await Empresa.findByIdAndUpdate(id, { MenuItem }, { new: true });
    if (!empresaActualizada) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 404, mensaje: 'Empresa no encontrada' }));
    }
    return res.status(200).json(
      buildResponse({
        data: empresaActualizada,
        mensaje: 'Menú de la empresa actualizado correctamente',
      }),
    );
  } catch (error) {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al actualizar el menú de la empresa',
      }),
    );
  }
}
