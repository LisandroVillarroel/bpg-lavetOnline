import { Schema, model } from 'mongoose';

const HospitalizacionSchema = new Schema({
  atencionIngreso_Id: {
    type: Schema.Types.ObjectId,
    ref: 'Atencion',
    required: true,
    unique: true,
  },
  ficha_Id: { type: Schema.Types.ObjectId, ref: 'Ficha', required: true },
  empresa_Id: { type: Schema.Types.ObjectId, ref: 'Empresa', required: true },
  fechaIngreso: { type: Date, required: true, default: Date.now },
  fechaEgreso: { type: Date },
  estado: { type: String, enum: ['Activa', 'Cerrada', 'Borrado'], default: 'Activa' },
  box: { type: String, trim: true },
  motivo: { type: String, trim: true },
  observaciones: { type: String, trim: true },
  usuarioCrea_id: { type: Schema.Types.ObjectId, ref: 'usuarios' },
  fechaHora_Crea: { type: Date, default: Date.now },
  usuarioModifica_id: { type: Schema.Types.ObjectId, ref: 'usuarios' },
  fechaHora_Modifica: { type: Date },
});

HospitalizacionSchema.index({ empresa_Id: 1, estado: 1, fechaIngreso: -1 });
HospitalizacionSchema.index({ ficha_Id: 1, estado: 1, fechaIngreso: -1 });

export default model('Hospitalizacion', HospitalizacionSchema);
