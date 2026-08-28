import { Schema, model } from 'mongoose';

const InventarioInsumoSchema = new Schema({
  insumo_Id: { type: Schema.Types.ObjectId, ref: 'CatalogoClinico', required: true },
  empresa_Id: { type: Schema.Types.ObjectId, ref: 'Empresa', required: true },
  stock: { type: Number, required: true, default: 0, min: 0 },
  stockMinimo: { type: Number, required: true, default: 0, min: 0 },
  costoUnitario: { type: Number, required: true, default: 0, min: 0 },
  estado: { type: String, enum: ['Activo', 'Borrado'], default: 'Activo' },
  usuarioCrea_id: { type: Schema.Types.ObjectId, ref: 'usuarios' },
  fechaHora_Crea: { type: Date, default: Date.now },
  usuarioModifica_id: { type: Schema.Types.ObjectId, ref: 'usuarios' },
  fechaHora_Modifica: { type: Date },
});

InventarioInsumoSchema.index({ empresa_Id: 1, insumo_Id: 1 }, { unique: true });
InventarioInsumoSchema.index({ empresa_Id: 1, estado: 1, stock: 1 });

export default model('InventarioInsumo', InventarioInsumoSchema);
