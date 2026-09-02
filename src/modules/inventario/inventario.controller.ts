import { Request, Response } from 'express';
import { Types } from 'mongoose';

import CatalogoClinico from '../catalogo-clinico/catalogo-clinico.model';
import { getVeterinaryAccess, isAllowedCompany } from '../../core/utils/veterinary-access';
import InventarioInsumo from './inventario-insumo.model';
import MovimientoInventario from './movimiento-inventario.model';
import TipoCatalogoClinico from '../tipo-catalogo-clinico/tipo-catalogo-clinico.model';

const response = <T>(data: T | null, mensaje: string, error = false, codigo = 200) => ({
  error,
  data,
  codigo,
  mensaje,
});

async function accessCompany(req: Request, empresaId: string) {
  const access = await getVeterinaryAccess(req);
  return access && isAllowedCompany(access, empresaId) ? access : null;
}

export async function listar(req: Request, res: Response) {
  const empresaId = String(req.query.empresa_Id ?? '');
  const access = await accessCompany(req, empresaId);
  if (!access) return res.status(200).json(response(null, 'Empresa no autorizada', true, 403));

  const registros = await InventarioInsumo.find({ empresa_Id: empresaId, estado: 'Activo' })
    .populate('insumo_Id', 'codigo nombre precio')
    .sort({ stock: 1 });
  return res.status(200).json(response(registros, 'Inventario obtenido correctamente'));
}

export async function crear(req: Request, res: Response) {
  const empresaId = String(req.body?.empresa_Id ?? '');
  const access = await accessCompany(req, empresaId);
  const insumoId = String(req.body?.insumo_Id ?? '');
  const tipoInsumo = await TipoCatalogoClinico.findOne({
    codigo: 'INSUMO',
    empresa_Id: empresaId,
    estado: 'Activo',
  })
    .select('_id')
    .lean();
  const insumo = await CatalogoClinico.findOne({
    _id: insumoId,
    empresa_Id: empresaId,
    tipoCatalogoClinico_Id: tipoInsumo?._id,
    estado: 'Activo',
  }).lean();
  if (!access || !insumo)
    return res.status(200).json(response(null, 'Insumo no autorizado', true, 403));

  const registro = await InventarioInsumo.findOneAndUpdate(
    { empresa_Id: empresaId, insumo_Id: insumoId },
    {
      ...req.body,
      empresa_Id: empresaId,
      insumo_Id: insumoId,
      estado: 'Activo',
      usuarioModifica_id: access.userId,
      fechaHora_Modifica: new Date(),
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  return res.status(201).json(response(registro, 'Stock creado o actualizado correctamente'));
}

export async function mover(req: Request, res: Response) {
  const empresaId = String(req.body?.empresa_Id ?? '');
  const access = await accessCompany(req, empresaId);
  const insumoId = String(req.body?.insumo_Id ?? '');
  const cantidad = Number(req.body?.cantidad);
  const tipo = req.body?.tipo;
  if (
    !access ||
    !insumoId ||
    !['Entrada', 'Salida'].includes(tipo) ||
    !Number.isFinite(cantidad) ||
    cantidad <= 0
  ) {
    return res.status(200).json(response(null, 'Movimiento inválido', true, 400));
  }

  const tipoInsumo = await TipoCatalogoClinico.findOne({
    codigo: 'INSUMO',
    empresa_Id: empresaId,
    estado: 'Activo',
  })
    .select('_id')
    .lean();
  const insumo = await CatalogoClinico.findOne({
    _id: insumoId,
    empresa_Id: empresaId,
    tipoCatalogoClinico_Id: tipoInsumo?._id,
    estado: 'Activo',
  }).lean();
  const filtroInventario = {
    empresa_Id: empresaId,
    insumo_Id: insumoId,
    estado: 'Activo',
    ...(tipo === 'Salida' ? { stock: { $gte: cantidad } } : {}),
  };
  const inventario = await InventarioInsumo.findOneAndUpdate(
    filtroInventario,
    {
      $inc: { stock: tipo === 'Entrada' ? cantidad : -cantidad },
      $set: {
        usuarioModifica_id: new Types.ObjectId(access.userId),
        fechaHora_Modifica: new Date(),
      },
    },
    { new: false },
  );
  if (!insumo || !inventario)
    return res.status(200).json(response(null, 'Insumo sin inventario', true, 404));

  const stockAnterior = inventario.stock;
  const stockPosterior = tipo === 'Entrada' ? stockAnterior + cantidad : stockAnterior - cantidad;
  const movimiento = await MovimientoInventario.create({
    ...req.body,
    inventarioInsumo_Id: inventario._id,
    insumo_Id: insumoId,
    empresa_Id: empresaId,
    cantidad,
    tipo,
    stockAnterior,
    stockPosterior,
    usuarioCrea_id: access.userId,
  });
  return res
    .status(201)
    .json(response({ inventario, movimiento }, 'Movimiento aplicado correctamente'));
}

export async function movimientos(req: Request, res: Response) {
  const empresaId = String(req.query.empresa_Id ?? '');
  const access = await accessCompany(req, empresaId);
  if (!access) return res.status(200).json(response(null, 'Empresa no autorizada', true, 403));
  const filtro = {
    empresa_Id: empresaId,
    ...(req.query.insumo_Id ? { insumo_Id: String(req.query.insumo_Id) } : {}),
  };
  const registros = await MovimientoInventario.find(filtro).sort({ fechaHora_Crea: -1 });
  return res.status(200).json(response(registros, 'Movimientos obtenidos correctamente'));
}
