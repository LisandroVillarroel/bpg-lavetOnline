import mongoose, { Schema, Document } from 'mongoose';

export interface IRaza extends Document {
  nombre: string;
  empresa_Id: string;
  especieNombre: string;
  estado: 'Activo' | 'Borrado';
  usuarioCrea_id: string;
  fechaHora_Crea: Date;
  usuarioModifica_id?: string;
  fechaHora_Modifica?: Date;
}

const RazaSchema: Schema = new Schema({
  nombre: { type: String, required: true },
  empresa_Id: { type: String, required: true },
  especieNombre: { type: String, required: true },
  estado: { type: String, enum: ['Activo', 'Borrado'], default: 'Activo' },
  usuarioCrea_id: { type: String, required: true },
  fechaHora_Crea: { type: Date, default: Date.now },
  usuarioModifica_id: { type: String },
  fechaHora_Modifica: { type: Date },
});

export default mongoose.model<IRaza>('Raza', RazaSchema);
