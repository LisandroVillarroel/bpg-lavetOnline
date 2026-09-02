import { Request, Response } from 'express';
import Atencion from './atencion.model';
import Ficha from '../ficha/ficha.model';
import Procedimiento from '../procedimiento/procedimiento.model';
import Medicamento from '../medicamento/medicamento.model';
import TipoCobro from '../tipo-cobro/tipo-cobro.model';
import TipoAtencion from '../tipo-atencion/tipo-atencion.model';
import { UserModel } from '../user/user.model';
import Examen from '../examen/examen.model';
import CatalogoClinico from '../catalogo-clinico/catalogo-clinico.model';
import { getVeterinaryAccess, isAllowedCompany } from '../../core/utils/veterinary-access';
import InventarioInsumo from '../inventario/inventario-insumo.model';
import MovimientoInventario from '../inventario/movimiento-inventario.model';
import { ClientSession, Types } from 'mongoose';

const buildResponse = <T>(
  overrides?: Partial<{ error: boolean; data: T | null; codigo: number; mensaje: string }>,
) => ({
  error: false,
  data: null,
  codigo: 200,
  mensaje: 'ok',
  ...overrides,
});

const atencionPopulate = [
  {
    path: 'ficha_Id',
    select: 'nombre especie_Id raza_Id propietario_Id',
    populate: [
      {
        path: 'propietario_Id',
        select: 'nombres apellidoPaterno apellidoMaterno',
      },
      {
        path: 'especie_Id',
        select: 'nombre',
      },
    ],
  },
  {
    path: 'procedimientos.procedimiento_Id',
    select: 'nombre precio',
  },
  {
    path: 'tipoAtencion_Id',
    select: 'nombre',
  },
  {
    path: 'recetas.medicamento_Id',
    select: 'nombre precio',
  },
  {
    path: 'cobros.tipoCobro_Id',
    select: 'nombre',
  },
];

type AtencionProcedimientoPayload = {
  procedimiento_Id?: string;
  nombre?: string;
  cantidad?: number;
  precioUnitario?: number;
};

type AtencionRecetaPayload = {
  medicamento_Id?: string;
  medicamento?: string;
  dosis?: string;
  frecuencia?: string;
  duracionDias?: number;
  cantidad?: number;
  precioUnitario?: number;
};

type AtencionCobroPayload = {
  tipoCobro_Id?: string;
  tipo?: string;
  descripcion?: string;
  cantidad?: number;
  precioUnitario?: number;
  descuento?: number;
};

type AtencionExamenPayload = {
  examen_Id?: string;
  nombre?: string;
  estado?: string;
  resultado?: string;
};

type TipoAtencionPayload = {
  tipoAtencion_Id?: string;
  tipoAtencion?: string;
};

const roundMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toPositive = (value: unknown, fallback = 0): number => {
  const parsed = toNumber(value, fallback);
  return parsed > 0 ? parsed : 0;
};

const toPositiveOrDefault = (value: unknown, fallback = 1): number => {
  const parsed = toNumber(value, fallback);
  return parsed > 0 ? parsed : fallback;
};

const normalizeString = (value: unknown): string => String(value ?? '').trim();

async function actualizarStockPorAtencion(
  insumos: unknown,
  empresaId: string,
  atencionId: unknown,
  usuarioId: string,
  tipo: 'Entrada' | 'Salida',
  session?: ClientSession,
) {
  if (!Array.isArray(insumos)) return;
  const cantidades = new Map<string, number>();
  for (const item of insumos as Array<Record<string, unknown>>) {
    const insumoId = normalizeString(item.insumo_Id);
    const cantidad = toPositiveOrDefault(item.cantidad, 1);
    if (insumoId) cantidades.set(insumoId, (cantidades.get(insumoId) ?? 0) + cantidad);
  }

  for (const [insumoId, cantidad] of cantidades) {
    const filtro = {
      empresa_Id: empresaId,
      insumo_Id: insumoId,
      estado: 'Activo',
      ...(tipo === 'Salida' ? { stock: { $gte: cantidad } } : {}),
    };
    const inventario = await InventarioInsumo.findOneAndUpdate(
      filtro,
      {
        $inc: { stock: tipo === 'Salida' ? -cantidad : cantidad },
        $set: {
          usuarioModifica_id: new Types.ObjectId(usuarioId),
          fechaHora_Modifica: new Date(),
        },
      },
      { new: false, ...(session ? { session } : {}) },
    );
    if (!inventario)
      throw new Error(
        tipo === 'Salida'
          ? `Stock insuficiente para ${insumoId}`
          : `Insumo sin inventario ${insumoId}`,
      );
    const stockAnterior = inventario.stock;
    const stockPosterior = tipo === 'Salida' ? stockAnterior - cantidad : stockAnterior + cantidad;
    await MovimientoInventario.create(
      [
        {
          inventarioInsumo_Id: inventario._id,
          insumo_Id: insumoId,
          empresa_Id: empresaId,
          atencion_Id: atencionId,
          origen: 'ATENCION',
          tipo,
          cantidad,
          stockAnterior,
          stockPosterior,
          costoUnitario: inventario.costoUnitario,
          usuarioCrea_id: usuarioId,
        },
      ],
      session ? { session } : undefined,
    );
  }
}

async function construirCampoClinico(
  id: unknown,
  texto: unknown,
  tipo: 'MOTIVO_CONSULTA' | 'DIAGNOSTICO',
  empresaId: string,
) {
  const catalogoId = normalizeString(id);
  const registro = catalogoId
    ? await CatalogoClinico.findOne({
        _id: catalogoId,
        tipo,
        empresa_Id: empresaId,
        estado: 'Activo',
      })
        .select('_id nombre')
        .lean()
    : null;

  return {
    id: registro?._id ? String(registro._id) : undefined,
    texto: normalizeString(registro?.nombre) || normalizeString(texto),
  };
}

async function construirSnapshotClinico(fichaId: unknown, profesionalId: unknown) {
  const ficha = await Ficha.findById(fichaId)
    .populate('propietario_Id', 'nombres apellidoPaterno apellidoMaterno rutUsuario')
    .populate('especie_Id', 'nombre')
    .populate('raza_Id', 'nombre')
    .lean();
  if (!ficha) {
    return undefined;
  }

  const propietario = ficha.propietario_Id as unknown as Record<string, unknown>;
  const especie = ficha.especie_Id as unknown as Record<string, unknown>;
  const raza = ficha.raza_Id as unknown as Record<string, unknown>;
  const profesional = profesionalId
    ? await UserModel.findById(profesionalId)
        .select('nombres apellidoPaterno apellidoMaterno')
        .lean()
    : null;

  return {
    mascota: {
      id: ficha._id,
      nombre: ficha.nombre,
      especie: normalizeString(especie?.nombre),
      raza: normalizeString(raza?.nombre),
    },
    propietario: {
      id: propietario?._id,
      nombre: [propietario?.nombres, propietario?.apellidoPaterno, propietario?.apellidoMaterno]
        .filter(Boolean)
        .join(' '),
      rut: normalizeString(propietario?.rutUsuario),
    },
    ...(profesional
      ? {
          profesional: {
            id: profesional._id,
            nombre: [profesional.nombres, profesional.apellidoPaterno, profesional.apellidoMaterno]
              .filter(Boolean)
              .join(' '),
          },
        }
      : {}),
  };
}

async function construirTipoAtencion(payload: TipoAtencionPayload, empresaId: string) {
  const tipoAtencionId = normalizeString(payload.tipoAtencion_Id);
  const tipoAtencionTexto = normalizeString(payload.tipoAtencion);

  if (!tipoAtencionId) {
    return {
      tipoAtencion_Id: undefined,
      tipoAtencion: tipoAtencionTexto,
    };
  }

  const tipoAtencionCatalogo = await TipoAtencion.findOne({
    _id: tipoAtencionId,
    empresa_Id: empresaId,
    estado: 'Activo',
  })
    .select('_id nombre')
    .lean();

  if (!tipoAtencionCatalogo) {
    return {
      tipoAtencion_Id: undefined,
      tipoAtencion: tipoAtencionTexto,
    };
  }

  return {
    tipoAtencion_Id: String(tipoAtencionCatalogo._id),
    tipoAtencion: normalizeString(tipoAtencionCatalogo.nombre),
  };
}

const calcularSubtotalVacunas = (vacunas: unknown): number => {
  if (!Array.isArray(vacunas)) {
    return 0;
  }

  return roundMoney(
    vacunas.reduce((total, vacuna) => {
      const costo = toPositive((vacuna as Record<string, unknown>)?.costo, 0);
      return total + costo;
    }, 0),
  );
};

const calcularSubtotalInsumos = (insumos: unknown): number => {
  if (!Array.isArray(insumos)) {
    return 0;
  }

  return roundMoney(
    insumos.reduce((total, insumo) => {
      const cantidad = toPositiveOrDefault((insumo as Record<string, unknown>)?.cantidad, 1);
      const costoUnitario = toPositive((insumo as Record<string, unknown>)?.costoUnitario, 0);
      return total + cantidad * costoUnitario;
    }, 0),
  );
};

async function construirExamenes(examenesPayload: unknown, empresaId: string) {
  const examenes = Array.isArray(examenesPayload)
    ? (examenesPayload as AtencionExamenPayload[])
    : [];
  const ids = Array.from(
    new Set(examenes.map((item) => normalizeString(item.examen_Id)).filter(Boolean)),
  );
  const catalogo = ids.length
    ? await Examen.find({ _id: { $in: ids }, empresa_Id: empresaId, estado: 'Activo' })
        .select('_id nombre precio')
        .lean()
    : [];
  const mapa = new Map(catalogo.map((item) => [String(item._id), item]));
  return examenes
    .map((item) => {
      const id = normalizeString(item.examen_Id);
      const examen = mapa.get(id);
      return {
        ...(id ? { examen_Id: id } : {}),
        nombre: normalizeString(item.nombre) || normalizeString(examen?.nombre),
        estado: normalizeString(item.estado) || 'Pendiente',
        resultado: normalizeString(item.resultado),
        precio: toPositive(examen?.precio, 0),
      };
    })
    .filter((item) => !!item.nombre);
}

async function construirProcedimientos(
  procedimientosPayload: unknown,
  empresaId: string,
): Promise<
  Array<{
    procedimiento_Id?: string;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }>
> {
  const procedimientos = Array.isArray(procedimientosPayload)
    ? (procedimientosPayload as AtencionProcedimientoPayload[])
    : [];

  const procedimientoIds = Array.from(
    new Set(
      procedimientos
        .map((item) => normalizeString(item.procedimiento_Id))
        .filter((procedimientoId) => !!procedimientoId),
    ),
  );

  const catalogo = procedimientoIds.length
    ? await Procedimiento.find({
        _id: { $in: procedimientoIds },
        empresa_Id: empresaId,
        estado: 'Activo',
      })
        .select('_id nombre precio')
        .lean()
    : [];

  const catalogoMap = new Map(
    catalogo.map((item) => [String(item._id), { nombre: item.nombre, precio: item.precio }]),
  );

  return procedimientos
    .map((item) => {
      const procedimientoId = normalizeString(item.procedimiento_Id);
      const procedCatalogo = catalogoMap.get(procedimientoId);
      const nombre =
        normalizeString(item.nombre) || normalizeString(procedCatalogo?.nombre) || 'Procedimiento';
      const cantidad = toPositiveOrDefault(item.cantidad, 1);
      const precioUnitario = toPositive(item.precioUnitario, toPositive(procedCatalogo?.precio, 0));
      const subtotal = roundMoney(cantidad * precioUnitario);

      return {
        ...(procedimientoId ? { procedimiento_Id: procedimientoId } : {}),
        nombre,
        cantidad,
        precioUnitario,
        subtotal,
      };
    })
    .filter((item) => !!item.nombre || !!item.procedimiento_Id);
}

async function construirRecetas(
  recetasPayload: unknown,
  empresaId: string,
): Promise<
  Array<{
    medicamento_Id?: string;
    medicamento: string;
    dosis: string;
    frecuencia: string;
    duracionDias: number;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }>
> {
  const recetas = Array.isArray(recetasPayload) ? (recetasPayload as AtencionRecetaPayload[]) : [];
  const medicamentoIds = Array.from(
    new Set(recetas.map((item) => normalizeString(item.medicamento_Id)).filter(Boolean)),
  );
  const catalogo = medicamentoIds.length
    ? await Medicamento.find({
        _id: { $in: medicamentoIds },
        empresa_Id: empresaId,
        estado: 'Activo',
      })
        .select('_id nombre precio')
        .lean()
    : [];
  const catalogoMap = new Map(
    catalogo.map((item) => [String(item._id), { nombre: item.nombre, precio: item.precio }]),
  );

  return recetas
    .map((item) => {
      const medicamentoId = normalizeString(item.medicamento_Id);
      const medicamentoCatalogo = catalogoMap.get(medicamentoId);
      const medicamento =
        normalizeString(item.medicamento) || normalizeString(medicamentoCatalogo?.nombre);
      const dosis = normalizeString(item.dosis);
      const frecuencia = normalizeString(item.frecuencia);
      const duracionDias = Math.max(0, Math.round(toNumber(item.duracionDias, 0)));
      const cantidad = toPositiveOrDefault(item.cantidad, 1);
      const precioUnitario = toPositive(
        item.precioUnitario,
        toPositive(medicamentoCatalogo?.precio, 0),
      );
      const subtotal = roundMoney(cantidad * precioUnitario);

      return {
        ...(medicamentoId ? { medicamento_Id: medicamentoId } : {}),
        medicamento,
        dosis,
        frecuencia,
        duracionDias,
        cantidad,
        precioUnitario,
        subtotal,
      };
    })
    .filter((item) => !!item.medicamento || item.subtotal > 0);
}

async function construirCobros(
  cobrosPayload: unknown,
  empresaId: string,
): Promise<
  Array<{
    tipoCobro_Id?: string;
    tipo: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    descuento: number;
    subtotal: number;
  }>
> {
  const cobros = Array.isArray(cobrosPayload) ? (cobrosPayload as AtencionCobroPayload[]) : [];
  const tipoCobroIds = Array.from(
    new Set(cobros.map((item) => normalizeString(item.tipoCobro_Id)).filter(Boolean)),
  );
  const catalogo = tipoCobroIds.length
    ? await TipoCobro.find({
        _id: { $in: tipoCobroIds },
        empresa_Id: empresaId,
        estado: 'Activo',
      })
        .select('_id nombre')
        .lean()
    : [];
  const catalogoMap = new Map(catalogo.map((item) => [String(item._id), item.nombre]));

  return cobros
    .map((item) => {
      const tipoCobroId = normalizeString(item.tipoCobro_Id);
      const tipo =
        normalizeString(item.tipo) || normalizeString(catalogoMap.get(tipoCobroId)) || 'Servicio';
      const descripcion = normalizeString(item.descripcion);
      const cantidad = toPositiveOrDefault(item.cantidad, 1);
      const precioUnitario = toPositive(item.precioUnitario, 0);
      const descuento = toPositive(item.descuento, 0);
      const bruto = roundMoney(cantidad * precioUnitario);
      const subtotal = roundMoney(Math.max(0, bruto - descuento));

      return {
        ...(tipoCobroId ? { tipoCobro_Id: tipoCobroId } : {}),
        tipo,
        descripcion,
        cantidad,
        precioUnitario,
        descuento,
        subtotal,
      };
    })
    .filter((item) => !!item.descripcion || item.subtotal > 0 || item.descuento > 0);
}

function construirResumenCobro(payload: {
  vacunas: unknown;
  insumos: unknown;
  procedimientos: Array<{ subtotal: number }>;
  recetas: Array<{ subtotal: number }>;
  examenes: Array<{ precio: number }>;
  cobros: Array<{ cantidad: number; precioUnitario: number; descuento: number }>;
  pagado: unknown;
}) {
  const subtotalVacunas = calcularSubtotalVacunas(payload.vacunas);
  const subtotalInsumos = calcularSubtotalInsumos(payload.insumos);
  const subtotalProcedimientos = roundMoney(
    payload.procedimientos.reduce((total, item) => total + toPositive(item.subtotal, 0), 0),
  );
  const subtotalRecetas = roundMoney(
    payload.recetas.reduce((total, item) => total + toPositive(item.subtotal, 0), 0),
  );
  const subtotalExamenes = roundMoney(
    payload.examenes.reduce((total, item) => total + toPositive(item.precio, 0), 0),
  );
  const subtotalCobrosBruto = roundMoney(
    payload.cobros.reduce(
      (total, item) => total + toPositive(item.cantidad, 0) * toPositive(item.precioUnitario, 0),
      0,
    ),
  );
  const descuentoTotal = roundMoney(
    payload.cobros.reduce((total, item) => total + toPositive(item.descuento, 0), 0),
  );
  const subtotal = roundMoney(
    subtotalVacunas +
      subtotalInsumos +
      subtotalProcedimientos +
      subtotalRecetas +
      subtotalExamenes +
      subtotalCobrosBruto,
  );
  const total = roundMoney(Math.max(0, subtotal - descuentoTotal));
  const pagado = toPositive(payload.pagado, 0);
  const saldo = roundMoney(Math.max(0, total - pagado));
  const estadoCobro =
    pagado >= total && total > 0 ? 'Pagado' : pagado > 0 ? 'Parcial' : 'Pendiente';

  return {
    subtotal,
    descuentoTotal,
    total,
    pagado,
    saldo,
    estadoCobro,
  };
}

export async function obtenerAtencionesPorEmpresa(req: Request, res: Response) {
  try {
    const { empresaId } = req.params;
    const access = await getVeterinaryAccess(req);
    if (!access || !isAllowedCompany(access, empresaId)) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 403, mensaje: 'Empresa no autorizada' }));
    }
    const filtro = {
      estado: 'Activo',
      empresa_Id: empresaId,
      ...(access.esPropietario ? { propietario_Id: access.userId } : {}),
    };
    const atenciones = await Atencion.find(filtro)
      .populate({
        path: 'ficha_Id',
        match: access.esPropietario ? { propietario_Id: access.userId } : {},
      })
      .populate(atencionPopulate)
      .sort({ fechaAtencion: -1 });

    return res.status(200).json(
      buildResponse({
        data: atenciones,
        mensaje: 'Atenciones obtenidas correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al obtener atenciones',
      }),
    );
  }
}

export async function obtenerAtencionesPorFicha(req: Request, res: Response) {
  try {
    const { fichaId } = req.params;
    const access = await getVeterinaryAccess(req);
    const ficha = await Ficha.findById(fichaId).select('empresa_Id propietario_Id').lean();
    if (
      !access ||
      !ficha ||
      !isAllowedCompany(access, String(ficha.empresa_Id)) ||
      (access.esPropietario && String(ficha.propietario_Id) !== access.userId)
    ) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 403, mensaje: 'Ficha no autorizada' }));
    }
    const filtro = { estado: 'Activo', ficha_Id: fichaId };
    const atenciones = await Atencion.find(filtro)
      .populate(atencionPopulate)
      .sort({ fechaAtencion: -1 });

    return res.status(200).json(
      buildResponse({
        data: atenciones,
        mensaje: 'Atenciones obtenidas correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al obtener atenciones de la ficha',
      }),
    );
  }
}

export async function obtenerVacunasProximas(req: Request, res: Response) {
  try {
    const access = await getVeterinaryAccess(req);
    const empresaId = String(req.query.empresa_Id ?? access?.empresaId ?? '');
    const dias = Math.min(365, Math.max(0, Number(req.query.dias ?? 30)));
    if (!access || !empresaId || !isAllowedCompany(access, empresaId)) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 403, mensaje: 'Empresa no autorizada' }));
    }

    const desde = new Date();
    desde.setHours(0, 0, 0, 0);
    const hasta = new Date(desde);
    hasta.setDate(hasta.getDate() + dias);
    const fichas = access.esPropietario
      ? await Ficha.find({ empresa_Id: empresaId, propietario_Id: access.userId })
          .select('_id')
          .lean()
      : [];
    const filtro: Record<string, unknown> = {
      empresa_Id: empresaId,
      estado: 'Activo',
      'vacunas.proximaFechaDosis': { $gte: desde, $lte: hasta },
    };
    if (access.esPropietario) {
      filtro.ficha_Id = { $in: fichas.map((ficha) => ficha._id) };
    }

    const atenciones = await Atencion.find(filtro)
      .select('ficha_Id fechaAtencion vacunas snapshotClinico')
      .sort({ 'vacunas.proximaFechaDosis': 1 })
      .lean();
    const vacunas = atenciones.flatMap((atencion) =>
      (atencion.vacunas ?? [])
        .filter((vacuna) => {
          const fecha = vacuna.proximaFechaDosis ? new Date(vacuna.proximaFechaDosis) : null;
          return fecha && fecha >= desde && fecha <= hasta;
        })
        .map((vacuna) => ({
          ...vacuna,
          atencion_Id: atencion._id,
          ficha_Id: atencion.ficha_Id,
          vacunaIndex: atencion.vacunas?.indexOf(vacuna),
          fichaNombre: atencion.snapshotClinico?.mascota?.nombre,
          propietarioNombre: atencion.snapshotClinico?.propietario?.nombre,
        })),
    );

    return res
      .status(200)
      .json(buildResponse({ data: vacunas, mensaje: 'Próximas vacunas obtenidas correctamente' }));
  } catch {
    return res
      .status(200)
      .json(
        buildResponse({ error: true, codigo: 500, mensaje: 'Error al obtener próximas vacunas' }),
      );
  }
}

export async function marcarVacunaNotificada(req: Request, res: Response) {
  try {
    const access = await getVeterinaryAccess(req);
    const indice = Number(req.params.indice);
    const atencion = await Atencion.findById(req.params.atencionId);
    if (
      !access ||
      !atencion ||
      !Number.isInteger(indice) ||
      indice < 0 ||
      !isAllowedCompany(access, String(atencion.empresa_Id))
    ) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 403, mensaje: 'Vacuna no autorizada' }));
    }
    const ficha = await Ficha.findById(atencion.ficha_Id).select('propietario_Id').lean();
    if (access.esPropietario && String(ficha?.propietario_Id) !== access.userId) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 403, mensaje: 'Vacuna no autorizada' }));
    }
    const vacuna = atencion.vacunas?.[indice];
    if (!vacuna)
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 404, mensaje: 'Vacuna no encontrada' }));
    vacuna.notificoPropietario = true;
    atencion.usuarioModifica_id = new Types.ObjectId(access.userId);
    atencion.fechaHora_Modifica = new Date();
    await atencion.save();
    return res
      .status(200)
      .json(buildResponse({ data: atencion, mensaje: 'Vacuna marcada como notificada' }));
  } catch {
    return res
      .status(200)
      .json(buildResponse({ error: true, codigo: 500, mensaje: 'Error al marcar vacuna' }));
  }
}

export async function obtenerResumenReporteria(req: Request, res: Response) {
  try {
    const access = await getVeterinaryAccess(req);
    const empresaId = String(req.query.empresa_Id ?? access?.empresaId ?? '');
    if (!access || !empresaId || !isAllowedCompany(access, empresaId)) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 403, mensaje: 'Empresa no autorizada' }));
    }

    const desde = req.query.desde ? new Date(String(req.query.desde)) : new Date(0);
    const hasta = req.query.hasta ? new Date(String(req.query.hasta)) : new Date();
    hasta.setHours(23, 59, 59, 999);
    const filtro: Record<string, unknown> = {
      empresa_Id: empresaId,
      estado: 'Activo',
      fechaAtencion: { $gte: desde, $lte: hasta },
    };
    if (access.esPropietario) filtro['snapshotClinico.propietario.id'] = access.userId;

    const [totales, diagnosticos, motivos] = await Promise.all([
      Atencion.aggregate([
        { $match: filtro },
        { $group: { _id: null, atenciones: { $sum: 1 }, ingresos: { $sum: '$valorTotal' } } },
      ]),
      Atencion.aggregate([
        { $match: filtro },
        { $match: { diagnostico: { $nin: ['', null] } } },
        { $group: { _id: '$diagnostico', cantidad: { $sum: 1 } } },
        { $sort: { cantidad: -1 } },
        { $limit: 10 },
      ]),
      Atencion.aggregate([
        { $match: filtro },
        { $match: { motivo: { $nin: ['', null] } } },
        { $group: { _id: '$motivo', cantidad: { $sum: 1 } } },
        { $sort: { cantidad: -1 } },
        { $limit: 10 },
      ]),
    ]);

    return res.status(200).json(
      buildResponse({
        data: {
          periodo: { desde, hasta },
          totales: totales[0] ?? { atenciones: 0, ingresos: 0 },
          diagnosticos,
          motivos,
        },
        mensaje: 'Resumen de reportería obtenido correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al obtener resumen de reportería',
      }),
    );
  }
}

export async function obtenerAtencionPorId(req: Request, res: Response) {
  try {
    const access = await getVeterinaryAccess(req);
    const atencionBase = await Atencion.findById(req.params.id)
      .select('empresa_Id ficha_Id')
      .lean();
    const ficha = atencionBase
      ? await Ficha.findById(atencionBase.ficha_Id).select('propietario_Id').lean()
      : null;
    if (
      !access ||
      !atencionBase ||
      !isAllowedCompany(access, String(atencionBase.empresa_Id)) ||
      (access.esPropietario && String(ficha?.propietario_Id) !== access.userId)
    ) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 403, mensaje: 'Atención no autorizada' }));
    }
    const atencion = await Atencion.findById(req.params.id).populate(atencionPopulate);

    if (!atencion || atencion.estado === 'Borrado') {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Atención no encontrada',
        }),
      );
    }

    return res.status(200).json(
      buildResponse({
        data: atencion,
        mensaje: 'Atención encontrada',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al buscar atención',
      }),
    );
  }
}

export async function crearAtencion(req: Request, res: Response) {
  try {
    const access = await getVeterinaryAccess(req);
    const fichaId = req.body?.ficha_Id;
    if (!fichaId) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 400,
          mensaje: 'Ficha es requerida',
        }),
      );
    }

    const ficha = await Ficha.findById(fichaId);
    if (
      !access ||
      !ficha ||
      ficha.estado === 'Borrado' ||
      !isAllowedCompany(access, String(ficha.empresa_Id)) ||
      (access.esPropietario && String(ficha.propietario_Id) !== access.userId)
    ) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Ficha no encontrada',
        }),
      );
    }

    const procedimientos = await construirProcedimientos(
      req.body?.procedimientos,
      String(ficha.empresa_Id),
    );
    const tipoAtencion = await construirTipoAtencion(
      {
        tipoAtencion_Id: req.body?.tipoAtencion_Id,
        tipoAtencion: req.body?.tipoAtencion,
      },
      String(ficha.empresa_Id),
    );
    const motivo = await construirCampoClinico(
      req.body?.motivo_Id,
      req.body?.motivo,
      'MOTIVO_CONSULTA',
      String(ficha.empresa_Id),
    );
    const diagnostico = await construirCampoClinico(
      req.body?.diagnostico_Id,
      req.body?.diagnostico,
      'DIAGNOSTICO',
      String(ficha.empresa_Id),
    );
    const recetas = await construirRecetas(req.body?.recetas, String(ficha.empresa_Id));
    const cobros = await construirCobros(req.body?.cobros, String(ficha.empresa_Id));
    const examenes = await construirExamenes(req.body?.examenes, String(ficha.empresa_Id));
    const resumenCobro = construirResumenCobro({
      vacunas: req.body?.vacunas,
      insumos: req.body?.insumos,
      procedimientos,
      recetas,
      examenes,
      cobros,
      pagado: req.body?.resumenCobro?.pagado,
    });
    const snapshotClinico = await construirSnapshotClinico(ficha._id, access?.userId);

    const atencion = new Atencion({
      ...req.body,
      ficha_Id: ficha._id,
      empresa_Id: ficha.empresa_Id,
      tipoAtencion_Id: tipoAtencion.tipoAtencion_Id,
      tipoAtencion: tipoAtencion.tipoAtencion,
      motivo_Id: motivo.id,
      motivo: motivo.texto,
      diagnostico_Id: diagnostico.id,
      diagnostico: diagnostico.texto,
      procedimientos,
      recetas,
      examenes,
      cobros,
      resumenCobro,
      snapshotClinico,
      valorTotal: resumenCobro.total,
      estado: 'Activo',
      fechaHora_Crea: new Date(),
    });
    await actualizarStockPorAtencion(
      atencion.insumos,
      String(ficha.empresa_Id),
      atencion._id,
      access.userId,
      'Salida',
    );
    await atencion.save();
    await atencion.populate(atencionPopulate);

    return res.status(200).json(
      buildResponse({
        data: atencion,
        mensaje: 'Atención creada correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al crear atención',
      }),
    );
  }
}

export async function modificarAtencion(req: Request, res: Response) {
  try {
    const access = await getVeterinaryAccess(req);
    const usuarioModifica_id = req.user?._id || req.user?.id;
    const atencionActual = await Atencion.findById(req.params.id);
    if (!access || !atencionActual) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Atención no encontrada',
        }),
      );
    }

    const fichaId = atencionActual.ficha_Id;
    const ficha = await Ficha.findById(fichaId);
    if (
      !ficha ||
      ficha.estado === 'Borrado' ||
      !isAllowedCompany(access, String(ficha.empresa_Id)) ||
      (access.esPropietario && String(ficha.propietario_Id) !== access.userId)
    ) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Ficha no encontrada',
        }),
      );
    }

    const procedimientos = await construirProcedimientos(
      req.body?.procedimientos,
      String(ficha.empresa_Id),
    );
    const tipoAtencion = await construirTipoAtencion(
      {
        tipoAtencion_Id: req.body?.tipoAtencion_Id,
        tipoAtencion: req.body?.tipoAtencion,
      },
      String(ficha.empresa_Id),
    );
    const motivo = await construirCampoClinico(
      req.body?.motivo_Id,
      req.body?.motivo,
      'MOTIVO_CONSULTA',
      String(ficha.empresa_Id),
    );
    const diagnostico = await construirCampoClinico(
      req.body?.diagnostico_Id,
      req.body?.diagnostico,
      'DIAGNOSTICO',
      String(ficha.empresa_Id),
    );
    const recetas = await construirRecetas(req.body?.recetas, String(ficha.empresa_Id));
    const cobros = await construirCobros(req.body?.cobros, String(ficha.empresa_Id));
    const examenes = await construirExamenes(req.body?.examenes, String(ficha.empresa_Id));
    const resumenCobro = construirResumenCobro({
      vacunas: req.body?.vacunas,
      insumos: req.body?.insumos,
      procedimientos,
      recetas,
      examenes,
      cobros,
      pagado: req.body?.resumenCobro?.pagado,
    });
    const snapshotClinico = await construirSnapshotClinico(ficha._id, access?.userId);

    const atencion = await Atencion.findOneAndUpdate(
      { _id: req.params.id, empresa_Id: ficha.empresa_Id, ficha_Id: ficha._id },
      {
        ...req.body,
        ficha_Id: ficha._id,
        empresa_Id: ficha.empresa_Id,
        tipoAtencion_Id: tipoAtencion.tipoAtencion_Id,
        tipoAtencion: tipoAtencion.tipoAtencion,
        motivo_Id: motivo.id,
        motivo: motivo.texto,
        diagnostico_Id: diagnostico.id,
        diagnostico: diagnostico.texto,
        procedimientos,
        recetas,
        examenes,
        cobros,
        resumenCobro,
        snapshotClinico,
        valorTotal: resumenCobro.total,
        usuarioModifica_id,
        fechaHora_Modifica: new Date(),
      },
      { new: true },
    ).populate(atencionPopulate);

    if (!atencion) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Atención no encontrada',
        }),
      );
    }

    await actualizarStockPorAtencion(
      atencionActual.insumos,
      String(atencionActual.empresa_Id),
      atencionActual._id,
      access.userId,
      'Entrada',
    );
    await actualizarStockPorAtencion(
      atencion.insumos,
      String(atencion.empresa_Id),
      atencion._id,
      access.userId,
      'Salida',
    );

    return res.status(200).json(
      buildResponse({
        data: atencion,
        mensaje: 'Atención actualizada correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al actualizar atención',
      }),
    );
  }
}

export async function eliminarAtencion(req: Request, res: Response) {
  try {
    const access = await getVeterinaryAccess(req);
    const usuarioModifica_id = req.user?._id || req.user?.id;
    const atencionActual = await Atencion.findById(req.params.id)
      .select('empresa_Id ficha_Id insumos estado')
      .lean();
    const ficha = atencionActual
      ? await Ficha.findById(atencionActual.ficha_Id).select('propietario_Id').lean()
      : null;
    if (
      !access ||
      !atencionActual ||
      !isAllowedCompany(access, String(atencionActual.empresa_Id)) ||
      (access.esPropietario && String(ficha?.propietario_Id) !== access.userId)
    ) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 403, mensaje: 'Atención no autorizada' }));
    }
    if (atencionActual.estado === 'Borrado') {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 404, mensaje: 'Atención no encontrada' }));
    }
    const atencion = await Atencion.findOneAndUpdate(
      { _id: req.params.id, empresa_Id: atencionActual.empresa_Id },
      {
        estado: 'Borrado',
        usuarioModifica_id,
        fechaHora_Modifica: new Date(),
      },
      { new: true },
    ).populate(atencionPopulate);

    if (!atencion) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Atención no encontrada',
        }),
      );
    }

    await actualizarStockPorAtencion(
      atencionActual.insumos,
      String(atencionActual.empresa_Id),
      atencionActual._id,
      access.userId,
      'Entrada',
    );

    return res.status(200).json(
      buildResponse({
        data: atencion,
        mensaje: 'Atención eliminada correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al eliminar atención',
      }),
    );
  }
}
