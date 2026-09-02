import { Schema, model } from 'mongoose';

const MovimientoInventarioSchema = new Schema({
  inventarioInsumo_Id: { type: Schema.Types.ObjectId, ref: 'InventarioInsumo', required: true },
  insumo_Id: { type: Schema.Types.ObjectId, ref: 'CatalogoClinico', required: true },
  empresa_Id: { type: Schema.Types.ObjectId, ref: 'Empresa', required: true },
  atencion_Id: { type: Schema.Types.ObjectId, ref: 'Atencion' },
  origen: { type: String, enum: ['MANUAL', 'ATENCION'], default: 'MANUAL' },
  tipo: { type: String, enum: ['Entrada', 'Salida'], required: true },
  cantidad: { type: Number, required: true, min: 0.01 },
  stockAnterior: { type: Number, required: true, min: 0 },
  stockPosterior: { type: Number, required: true, min: 0 },
  costoUnitario: { type: Number, min: 0 },
  observacion: { type: String, trim: true },
  usuarioCrea_id: { type: Schema.Types.ObjectId, ref: 'usuarios' },
  fechaHora_Crea: { type: Date, default: Date.now },
});

MovimientoInventarioSchema.index({ empresa_Id: 1, insumo_Id: 1, fechaHora_Crea: -1 });

export default model('MovimientoInventario', MovimientoInventarioSchema);
