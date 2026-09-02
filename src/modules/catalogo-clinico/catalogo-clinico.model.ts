import { Schema, model } from 'mongoose';

const CatalogoClinicoSchema = new Schema({
  tipoCatalogoClinico_Id: {
    type: Schema.Types.ObjectId,
    ref: 'TipoCatalogoClinico',
    required: true,
  },
  codigo: { type: String, required: true, trim: true },
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true },
  precio: { type: Number, default: 0 },
  empresa_Id: { type: Schema.Types.ObjectId, ref: 'Empresa', required: true },
  estado: { type: String, enum: ['Activo', 'Borrado'], default: 'Activo' },
  usuarioCrea_id: { type: Schema.Types.ObjectId, ref: 'Usuario' },
  fechaHora_Crea: { type: Date, default: Date.now },
  usuarioModifica_id: { type: Schema.Types.ObjectId, ref: 'Usuario' },
  fechaHora_Modifica: { type: Date },
});

CatalogoClinicoSchema.index(
  { empresa_Id: 1, tipoCatalogoClinico_Id: 1, codigo: 1 },
  { unique: true },
);
CatalogoClinicoSchema.index({ empresa_Id: 1, tipoCatalogoClinico_Id: 1, estado: 1, nombre: 1 });

export default model('CatalogoClinico', CatalogoClinicoSchema);
