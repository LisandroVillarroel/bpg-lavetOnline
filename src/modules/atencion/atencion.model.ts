import { Schema, model } from 'mongoose';

const VacunaSchema = new Schema(
  {
    vacuna_Id: { type: Schema.Types.ObjectId, ref: 'Vacuna' },
    nombre: { type: String },
    dosis: { type: String },
    costo: { type: Number },
  },
  { _id: false },
);

const InsumoSchema = new Schema(
  {
    insumo_Id: { type: Schema.Types.ObjectId, ref: 'Insumo' },
    nombre: { type: String },
    cantidad: { type: Number },
    costoUnitario: { type: Number },
  },
  { _id: false },
);

const AtencionSchema = new Schema({
  mascota_Id: { type: Schema.Types.ObjectId, ref: 'Mascota', required: true },
  propietario_Id: { type: Schema.Types.ObjectId, ref: 'usuarios', required: true },
  empresa_Id: { type: Schema.Types.ObjectId, ref: 'Empresa', required: true },
  fechaAtencion: { type: Date, default: Date.now },
  tipoAtencion: { type: String, required: true },
  motivo: { type: String },
  diagnostico: { type: String },
  tratamiento: { type: String },
  valorTotal: { type: Number, default: 0 },
  vacunas: [VacunaSchema],
  insumos: [InsumoSchema],
  estado: { type: String, enum: ['Activo', 'Borrado'], default: 'Activo' },
  usuarioCrea_id: { type: Schema.Types.ObjectId, ref: 'usuarios' },
  fechaHora_Crea: { type: Date, default: Date.now },
  usuarioModifica_id: { type: Schema.Types.ObjectId, ref: 'usuarios' },
  fechaHora_Modifica: { type: Date },
});

export default model('Atencion', AtencionSchema);
