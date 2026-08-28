import { Schema, model } from 'mongoose';

const EvolucionHospitalizacionSchema = new Schema({
  hospitalizacion_Id: { type: Schema.Types.ObjectId, ref: 'Hospitalizacion', required: true },
  empresa_Id: { type: Schema.Types.ObjectId, ref: 'Empresa', required: true },
  fechaHora: { type: Date, required: true, default: Date.now },
  temperatura: { type: Number },
  peso: { type: Number },
  estadoPaciente: { type: String, trim: true },
  observaciones: { type: String, trim: true },
  usuarioCrea_id: { type: Schema.Types.ObjectId, ref: 'usuarios' },
  fechaHora_Crea: { type: Date, default: Date.now },
  usuarioModifica_id: { type: Schema.Types.ObjectId, ref: 'usuarios' },
  fechaHora_Modifica: { type: Date },
});

EvolucionHospitalizacionSchema.index({ hospitalizacion_Id: 1, fechaHora: -1 });
EvolucionHospitalizacionSchema.index({ empresa_Id: 1, fechaHora: -1 });

export default model('EvolucionHospitalizacion', EvolucionHospitalizacionSchema);
