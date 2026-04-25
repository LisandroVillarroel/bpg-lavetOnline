import { Schema, model, Document } from 'mongoose';

export interface IRegionComuna extends Document {
  region: string;
  sigla: string;
  descripcion: string;
  comuna: Array<{
    sigla: string;
    descripcion: string;
  }>;
  estado?: 'Activo' | 'Borrado';
  usuarioCrea_id?: string;
  usuarioModifica_id?: string;
  fechaHora_Crea?: Date;
  fechaHora_Modifica?: Date;
}

const RegionComunaSchema = new Schema<IRegionComuna>(
  {
    region: { type: String, required: true },
    sigla: { type: String, required: true, unique: true },
    descripcion: { type: String, required: true },
    comuna: [
      {
        sigla: { type: String, required: true },
        descripcion: { type: String, required: true },
      },
    ],
    estado: { type: String, default: 'Activo' },
    usuarioCrea_id: { type: String },
    usuarioModifica_id: { type: String },
    fechaHora_Crea: { type: Date, default: Date.now },
    fechaHora_Modifica: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

RegionComunaSchema.pre('findOneAndUpdate', function (next) {
  this.set({ fechaHora_Modifica: new Date() });
  next();
});

export default model<IRegionComuna>('RegionComuna', RegionComunaSchema);
