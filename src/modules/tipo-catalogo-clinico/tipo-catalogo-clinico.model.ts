import { Schema, model } from 'mongoose';

const TipoCatalogoClinicoSchema = new Schema({
  codigo: { type: String, required: true, trim: true, uppercase: true },
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true },
  empresa_Id: { type: Schema.Types.ObjectId, ref: 'Empresa', required: true },
  estado: { type: String, enum: ['Activo', 'Borrado'], default: 'Activo' },
  usuarioCrea_id: { type: Schema.Types.ObjectId, ref: 'usuarios' },
  fechaHora_Crea: { type: Date, default: Date.now },
  usuarioModifica_id: { type: Schema.Types.ObjectId, ref: 'usuarios' },
  fechaHora_Modifica: { type: Date },
});

TipoCatalogoClinicoSchema.index({ empresa_Id: 1, codigo: 1 }, { unique: true });
TipoCatalogoClinicoSchema.index({ empresa_Id: 1, estado: 1, nombre: 1 });

export default model('TipoCatalogoClinico', TipoCatalogoClinicoSchema);
