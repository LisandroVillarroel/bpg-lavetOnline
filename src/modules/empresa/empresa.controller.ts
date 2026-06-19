import { Request, Response } from 'express';
import Categoria from '../categoria/categoria.model';
import Examen from '../examen/examen.model';
import Especie from '../especie/especie.model';
import Raza from '../raza/raza.model';
import { UserModel } from '../user/user.model';
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

const getDuplicateEmpresaMessage = (keyPattern: Record<string, unknown> = {}): string => {
  if (keyPattern['rutEmpresa']) {
    return 'Ya existe una empresa registrada con ese RUT';
  }

  return 'Ya existe una empresa con esos datos';
};

const getValidationEmpresaMessage = (error: unknown): string | null => {
  if (typeof error !== 'object' || error === null || !('errors' in error)) {
    return null;
  }

  const errors = (error as { errors?: Record<string, { message?: string }> }).errors;
  const firstError = errors ? Object.values(errors)[0] : undefined;
  return firstError?.message?.trim() || null;
};

const getAuthenticatedUserId = (req: Request): string =>
  String(req.user?._id || req.user?.id || 'sistema');

const rollbackClonedData = async (params: {
  empresaId: string;
  categoriaIds: string[];
  examenIds: string[];
  especieIds: string[];
  razaIds: string[];
}) => {
  const { empresaId, categoriaIds, examenIds, especieIds, razaIds } = params;

  await Promise.all([
    examenIds.length ? Examen.deleteMany({ _id: { $in: examenIds } }) : Promise.resolve(),
    categoriaIds.length ? Categoria.deleteMany({ _id: { $in: categoriaIds } }) : Promise.resolve(),
    especieIds.length ? Especie.deleteMany({ _id: { $in: especieIds } }) : Promise.resolve(),
    razaIds.length ? Raza.deleteMany({ _id: { $in: razaIds } }) : Promise.resolve(),
    Empresa.findByIdAndDelete(empresaId),
  ]);
};

const clonarDatosEmpresaOrigen = async (params: {
  empresaOrigenId: string;
  empresaDestinoId: string;
  usuarioId: string;
}) => {
  const { empresaOrigenId, empresaDestinoId, usuarioId } = params;
  const ahora = new Date();

  const [categoriasOrigen, examenesOrigen, especiesOrigen, razasOrigen] = await Promise.all([
    Categoria.find({ empresa_Id: empresaOrigenId, estado: 'Activo' }).lean(),
    Examen.find({ empresa_Id: empresaOrigenId, estado: 'Activo' }).lean(),
    Especie.find({ empresa_Id: empresaOrigenId, estado: 'Activo' }).lean(),
    Raza.find({ empresa_Id: empresaOrigenId, estado: 'Activo' }).lean(),
  ]);

  const categoriaIds: string[] = [];
  const examenIds: string[] = [];
  const especieIds: string[] = [];
  const razaIds: string[] = [];

  try {
    const categoriasCreadas = categoriasOrigen.length
      ? await Categoria.insertMany(
          categoriasOrigen.map(
            ({
              _id,
              usuarioCrea_id,
              usuarioModifica_id,
              fechaHora_Crea,
              fechaHora_Modifica,
              ...categoria
            }) => ({
              ...categoria,
              empresa_Id: empresaDestinoId,
              usuarioCrea_id: usuarioId,
              usuarioModifica_id: usuarioId,
              fechaHora_Crea: ahora,
              fechaHora_Modifica: ahora,
            }),
          ),
        )
      : [];

    categoriaIds.push(...categoriasCreadas.map((categoria) => String(categoria._id)));

    const categoriaMap = new Map(
      categoriasOrigen.map((categoria, index) => [
        String(categoria._id),
        String(categoriasCreadas[index]?._id ?? ''),
      ]),
    );

    const examenesCreados = examenesOrigen.length
      ? await Examen.insertMany(
          examenesOrigen
            .map(
              ({
                _id,
                usuarioCrea_id,
                usuarioModifica_id,
                fechaHora_Crea,
                fechaHora_Modifica,
                ...examen
              }) => {
                const categoriaDestinoId = categoriaMap.get(String(examen.categoria));
                if (!categoriaDestinoId) {
                  return null;
                }

                return {
                  ...examen,
                  categoria: categoriaDestinoId,
                  empresa_Id: empresaDestinoId,
                  usuarioCrea_id: usuarioId,
                  usuarioModifica_id: usuarioId,
                  fechaHora_Crea: ahora,
                  fechaHora_Modifica: ahora,
                };
              },
            )
            .filter((examen): examen is NonNullable<typeof examen> => examen !== null),
        )
      : [];

    examenIds.push(...examenesCreados.map((examen) => String(examen._id)));

    const especiesCreadas = especiesOrigen.length
      ? await Especie.insertMany(
          especiesOrigen.map(
            ({
              _id,
              usuarioCrea_id,
              usuarioModifica_id,
              fechaHora_Crea,
              fechaHora_Modifica,
              ...especie
            }) => ({
              ...especie,
              empresa_Id: empresaDestinoId,
              usuarioCrea_id: usuarioId,
              usuarioModifica_id: usuarioId,
              fechaHora_Crea: ahora,
              fechaHora_Modifica: ahora,
            }),
          ),
        )
      : [];

    especieIds.push(...especiesCreadas.map((especie) => String(especie._id)));

    const razasCreadas = razasOrigen.length
      ? await Raza.insertMany(
          razasOrigen.map(
            ({
              _id,
              usuarioCrea_id,
              usuarioModifica_id,
              fechaHora_Crea,
              fechaHora_Modifica,
              ...raza
            }) => ({
              ...raza,
              empresa_Id: empresaDestinoId,
              usuarioCrea_id: usuarioId,
              usuarioModifica_id: usuarioId,
              fechaHora_Crea: ahora,
              fechaHora_Modifica: ahora,
            }),
          ),
        )
      : [];

    razaIds.push(...razasCreadas.map((raza) => String(raza._id)));
  } catch (error) {
    await rollbackClonedData({
      empresaId: empresaDestinoId,
      categoriaIds,
      examenIds,
      especieIds,
      razaIds,
    });
    throw error;
  }
};

// Consultar todas las empresas (solo activas)
export async function obtenerEmpresas(_req: Request, res: Response) {
  try {
    const empresas = await Empresa.find({ estadoEmpresa: 'Activo' });
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
    if (!empresa || empresa.estadoEmpresa !== 'Activo') {
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
    const usuarioId = getAuthenticatedUserId(req);
    const { copiarDatosOrigen, ...empresaPayload } = req.body as { copiarDatosOrigen?: boolean };
    const nuevaEmpresa = new Empresa({
      ...empresaPayload,
      usuarioCrea: usuarioId,
      fechaHora_crea: now,
      usuarioModifica: usuarioId,
      fechaHora_modifica: now,
    });
    await nuevaEmpresa.save();

    if (copiarDatosOrigen) {
      const usuarioLogueado = await UserModel.findById(usuarioId).lean();
      const empresaOrigenId = usuarioLogueado?.empresa?.empresaId?.trim();

      if (!empresaOrigenId) {
        await Empresa.findByIdAndDelete(nuevaEmpresa._id);
        return res.status(200).json(
          buildResponse({
            error: true,
            codigo: 400,
            mensaje: 'No se pudo determinar la empresa origen del usuario logueado',
          }),
        );
      }

      await clonarDatosEmpresaOrigen({
        empresaOrigenId,
        empresaDestinoId: String(nuevaEmpresa._id),
        usuarioId,
      });
    }

    return res
      .status(201)
      .json(
        buildResponse({ data: nuevaEmpresa, mensaje: 'Empresa creada correctamente', codigo: 201 }),
      );
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000 &&
      'keyPattern' in error
    ) {
      const duplicatedError = error as {
        keyPattern?: Record<string, unknown>;
      };

      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 409,
          mensaje: getDuplicateEmpresaMessage(duplicatedError.keyPattern ?? {}),
        }),
      );
    }

    const validationMessage = getValidationEmpresaMessage(error);
    if (validationMessage) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 400,
          mensaje: validationMessage,
        }),
      );
    }

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
    const usuarioModifica = req.user?._id || req.user?.id || 'sistema';
    const updateData = {
      ...req.body,
      usuarioModifica,
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
    const usuarioModifica = req.user?._id || req.user?.id || 'sistema';
    const empresaEliminada = await Empresa.findByIdAndUpdate(
      id,
      { estadoEmpresa: 'Bloqueado', usuarioModifica },
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
