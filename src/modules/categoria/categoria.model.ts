import { Schema, model } from 'mongoose';

const CategoriaSchema = new Schema({
  nombre: { type: String, required: true },
  sigla: { type: String, required: true },
  empresa_Id: { type: Schema.Types.ObjectId, ref: 'Empresa', required: true },
  estado: { type: String, enum: ['Activo', 'Borrado'], default: 'Activo' },
  usuarioCrea_id: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  fechaHora_Crea: { type: Date, default: Date.now },
  usuarioModifica_id: { type: Schema.Types.ObjectId, ref: 'Usuario' },
  fechaHora_Modifica: { type: Date },
});

export default model('Categoria', CategoriaSchema);
