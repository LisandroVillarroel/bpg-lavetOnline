import { Schema, model } from 'mongoose';

const FichaSchema = new Schema({
  propietario_Id: { type: Schema.Types.ObjectId, ref: 'usuarios', required: true },
  empresa_Id: { type: Schema.Types.ObjectId, ref: 'Empresa', required: true },
  nombre: { type: String, required: true },
  especie_Id: { type: Schema.Types.ObjectId, ref: 'Especie', required: true },
  raza_Id: { type: Schema.Types.ObjectId, ref: 'Raza', required: true },
  fechaNacimiento: { type: Date },
  genero: { type: String },
  peso: { type: Number },
  color: { type: String },
  observaciones: { type: String },
  estado: { type: String, enum: ['Activo', 'Borrado'], default: 'Activo' },
  usuarioCrea_id: { type: Schema.Types.ObjectId, ref: 'usuarios' },
  fechaHora_Crea: { type: Date, default: Date.now },
  usuarioModifica_id: { type: Schema.Types.ObjectId, ref: 'usuarios' },
  fechaHora_Modifica: { type: Date },
});

FichaSchema.index({ empresa_Id: 1, estado: 1, nombre: 1 });
FichaSchema.index({ propietario_Id: 1, estado: 1, nombre: 1 });

export default model('Ficha', FichaSchema);
