import { Schema, model, Document } from 'mongoose';

export interface IRolVeterinario extends Document {
  descripcion: string;
  sigla: string;
  idEmpresa: string;
  usuarioCrea?: string;
  usuarioModifica?: string;
  fechaHora_crea?: Date;
  fechaHora_modifica?: Date;
  estado?: string;
}

const RolVeterinarioSchema = new Schema<IRolVeterinario>(
  {
    descripcion: { type: String, required: true },
    sigla: { type: String, required: true, unique: true },
    idEmpresa: { type: String, required: true },
    usuarioCrea: { type: String },
    usuarioModifica: { type: String },
    fechaHora_crea: { type: Date, default: Date.now },
    fechaHora_modifica: { type: Date, default: Date.now },
    estado: { type: String, default: 'Activo' },
  },
  { timestamps: false },
);

RolVeterinarioSchema.pre('findOneAndUpdate', function (next) {
  this.set({ fechaHora_modifica: new Date() });
  next();
});

export default model<IRolVeterinario>('RolVeterinario', RolVeterinarioSchema);
