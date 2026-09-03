import { Request, Response } from 'express';
import Categoria from '../categoria/categoria.model';
import Examen from '../examen/examen.model';
import Especie from '../especie/especie.model';
import Raza from '../raza/raza.model';
import RolVeterinario from '../rol-veterinario/rol-veterinario.model';
import TipoVeterinario from '../tipo-veterinario/tipo-veterinario.model';
import { UserModel } from '../user/user.model';
import Empresa from './empresa.model';
import { MenuItem } from '../../shared/modulo/menu-item.interface';

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

const ordenarMenuUsuario = (items: MenuItem[], ordenEmpresa: Map<string, number>): MenuItem[] =>
  [...items]
    .sort((a, b) => {
      const ordenA = ordenEmpresa.get(String(a._id)) ?? Number.MAX_SAFE_INTEGER;
      const ordenB = ordenEmpresa.get(String(b._id)) ?? Number.MAX_SAFE_INTEGER;
      return ordenA - ordenB;
    })
    .map((item, index) => ({
      ...item,
      orden: index,
      children: item.children?.length
        ? ordenarMenuUsuario(item.children, ordenEmpresa)
        : item.children,
    }));

const construirOrdenMenu = (items: MenuItem[], ordenEmpresa: Map<string, number>): void => {
  items.forEach((item, index) => {
    if (item._id) {
      ordenEmpresa.set(String(item._id), index);
    }
    if (item.children?.length) {
      construirOrdenMenu(item.children, ordenEmpresa);
    }
  });
};

const getDuplicateEmpresaMessage = (keyPattern: Record<string, unknown> = {}): string => {
  if (keyPattern['rutEmpresa']) {
    return 'Ya existe una empresa registrada con ese RUT';
  }

  if (keyPattern['sigla']) {
    return 'Existe un tipo o rol veterinario duplicado para la empresa origen';
  }

  if (keyPattern['idEmpresa'] || keyPattern['idEmpresa_1'] || keyPattern['sigla_1']) {
    return 'Existe un tipo o rol veterinario duplicado para la empresa destino';
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
  rolVeterinarioIds: string[];
  tipoVeterinarioIds: string[];
}) => {
  const {
    empresaId,
    categoriaIds,
    examenIds,
    especieIds,
    razaIds,
    rolVeterinarioIds,
    tipoVeterinarioIds,
  } = params;

  await Promise.all([
    examenIds.length ? Examen.deleteMany({ _id: { $in: examenIds } }) : Promise.resolve(),
    categoriaIds.length ? Categoria.deleteMany({ _id: { $in: categoriaIds } }) : Promise.resolve(),
    especieIds.length ? Especie.deleteMany({ _id: { $in: especieIds } }) : Promise.resolve(),
    razaIds.length ? Raza.deleteMany({ _id: { $in: razaIds } }) : Promise.resolve(),
    rolVeterinarioIds.length
      ? RolVeterinario.deleteMany({ _id: { $in: rolVeterinarioIds } })
      : Promise.resolve(),
    tipoVeterinarioIds.length
      ? TipoVeterinario.deleteMany({ _id: { $in: tipoVeterinarioIds } })
      : Promise.resolve(),
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

  const [
    categoriasOrigen,
    examenesOrigen,
    especiesOrigen,
    razasOrigen,
    rolesVeterinarioOrigen,
    tiposVeterinarioOrigen,
  ] = await Promise.all([
    Categoria.find({ empresa_Id: empresaOrigenId, estado: 'Activo' }).lean(),
    Examen.find({ empresa_Id: empresaOrigenId, estado: 'Activo' }).lean(),
    Especie.find({ empresa_Id: empresaOrigenId, estado: 'Activo' }).lean(),
    Raza.find({ empresa_Id: empresaOrigenId, estado: 'Activo' }).lean(),
    RolVeterinario.find({ idEmpresa: empresaOrigenId, estado: 'Activo' }).lean(),
    TipoVeterinario.find({ idEmpresa: empresaOrigenId, estado: 'Activo' }).lean(),
  ]);

  const categoriaIds: string[] = [];
  const examenIds: string[] = [];
  const especieIds: string[] = [];
  const razaIds: string[] = [];
  const rolVeterinarioIds: string[] = [];
  const tipoVeterinarioIds: string[] = [];

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

    const rolesVeterinarioCreados = rolesVeterinarioOrigen.length
      ? await RolVeterinario.insertMany(
          rolesVeterinarioOrigen.map(
            ({
              _id,
              usuarioCrea,
              usuarioModifica,
              fechaHora_crea,
              fechaHora_modifica,
              ...rolVeterinario
            }) => ({
              ...rolVeterinario,
              idEmpresa: empresaDestinoId,
              usuarioCrea: usuarioId,
              usuarioModifica: usuarioId,
              fechaHora_crea: ahora,
              fechaHora_modifica: ahora,
            }),
          ),
        )
      : [];

    rolVeterinarioIds.push(
      ...rolesVeterinarioCreados.map((rolVeterinario) => String(rolVeterinario._id)),
    );

    const tiposVeterinarioCreados = tiposVeterinarioOrigen.length
      ? await TipoVeterinario.insertMany(
          tiposVeterinarioOrigen.map(
            ({
              _id,
              usuarioCrea,
              usuarioModifica,
              fechaHora_crea,
              fechaHora_modifica,
              ...tipoVeterinario
            }) => ({
              ...tipoVeterinario,
              idEmpresa: empresaDestinoId,
              usuarioCrea: usuarioId,
              usuarioModifica: usuarioId,
              fechaHora_crea: ahora,
              fechaHora_modifica: ahora,
            }),
          ),
        )
      : [];

    tipoVeterinarioIds.push(
      ...tiposVeterinarioCreados.map((tipoVeterinario) => String(tipoVeterinario._id)),
    );
  } catch (error) {
    await rollbackClonedData({
      empresaId: empresaDestinoId,
      categoriaIds,
      examenIds,
      especieIds,
      razaIds,
      rolVeterinarioIds,
      tipoVeterinarioIds,
    });
    throw error;
  }
};

const eliminarDatosAsociadosEmpresa = async (empresaId: string) => {
  await Promise.all([
    Categoria.deleteMany({ empresa_Id: empresaId }),
    Examen.deleteMany({ empresa_Id: empresaId }),
    Especie.deleteMany({ empresa_Id: empresaId }),
    Raza.deleteMany({ empresa_Id: empresaId }),
    TipoVeterinario.deleteMany({ idEmpresa: empresaId }),
    RolVeterinario.deleteMany({ idEmpresa: empresaId }),
    UserModel.deleteMany({ 'empresa.empresaId': empresaId }),
  ]);
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

// Eliminar empresa y todos sus datos asociados
export async function eliminarEmpresa(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 400, mensaje: 'ID requerido' }));
    }

    const empresaEliminada = await Empresa.findById(id);
    if (!empresaEliminada) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 404, mensaje: 'Empresa no encontrada' }));
    }

    await eliminarDatosAsociadosEmpresa(id);
    await Empresa.findByIdAndDelete(id);

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

    const ordenEmpresa = new Map<string, number>();
    construirOrdenMenu(MenuItem as MenuItem[], ordenEmpresa);
    const usuariosEmpresa = await UserModel.find({ 'empresa.empresaId': String(id) })
      .select('_id MenuItem')
      .lean();
    const actualizacionesUsuarios = usuariosEmpresa
      .filter((usuario) => usuario.MenuItem?.length)
      .map((usuario) => ({
        updateOne: {
          filter: { _id: usuario._id },
          update: {
            $set: {
              MenuItem: ordenarMenuUsuario(usuario.MenuItem as MenuItem[], ordenEmpresa),
            },
          },
        },
      }));

    if (actualizacionesUsuarios.length) {
      await UserModel.bulkWrite(actualizacionesUsuarios);
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
