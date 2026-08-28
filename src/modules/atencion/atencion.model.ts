import { Schema, model } from 'mongoose';

const VacunaSchema = new Schema(
  {
    vacuna_Id: { type: Schema.Types.ObjectId, ref: 'Vacuna' },
    nombre: { type: String },
    dosis: { type: String },
    costo: { type: Number },
    numeroDosis: { type: Number },
    fechaAplicacion: { type: Date },
    mesesSiguiente: { type: Number },
    proximaFechaDosis: { type: Date },
    notificoPropietario: { type: Boolean, default: false },
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

const ExamenAplicadoSchema = new Schema(
  {
    examen_Id: { type: Schema.Types.ObjectId, ref: 'Examen' },
    nombre: { type: String },
    estado: { type: String, default: 'Pendiente' },
    resultado: { type: String },
    precio: { type: Number, default: 0 },
  },
  { _id: false },
);

const ProcedimientoAtencionSchema = new Schema(
  {
    procedimiento_Id: { type: Schema.Types.ObjectId, ref: 'Procedimiento' },
    nombre: { type: String },
    cantidad: { type: Number, default: 1 },
    precioUnitario: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
  },
  { _id: false },
);

const RecetaAtencionSchema = new Schema(
  {
    medicamento_Id: { type: Schema.Types.ObjectId, ref: 'Medicamento' },
    medicamento: { type: String },
    dosis: { type: String },
    frecuencia: { type: String },
    duracionDias: { type: Number, default: 0 },
    cantidad: { type: Number, default: 1 },
    precioUnitario: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
  },
  { _id: false },
);

const CobroAtencionSchema = new Schema(
  {
    tipoCobro_Id: { type: Schema.Types.ObjectId, ref: 'TipoCobro' },
    tipo: { type: String, default: 'Servicio' },
    descripcion: { type: String },
    cantidad: { type: Number, default: 1 },
    precioUnitario: { type: Number, default: 0 },
    descuento: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
  },
  { _id: false },
);

const ResumenCobroSchema = new Schema(
  {
    subtotal: { type: Number, default: 0 },
    descuentoTotal: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    pagado: { type: Number, default: 0 },
    saldo: { type: Number, default: 0 },
    estadoCobro: {
      type: String,
      enum: ['Pendiente', 'Parcial', 'Pagado'],
      default: 'Pendiente',
    },
  },
  { _id: false },
);

const SnapshotClinicoSchema = new Schema(
  {
    mascota: {
      id: { type: Schema.Types.ObjectId },
      nombre: { type: String },
      especie: { type: String },
      raza: { type: String },
    },
    propietario: {
      id: { type: Schema.Types.ObjectId },
      nombre: { type: String },
      rut: { type: String },
    },
    profesional: {
      id: { type: Schema.Types.ObjectId },
      nombre: { type: String },
    },
  },
  { _id: false },
);

const AtencionSchema = new Schema({
  ficha_Id: { type: Schema.Types.ObjectId, ref: 'Ficha', required: true },
  empresa_Id: { type: Schema.Types.ObjectId, ref: 'Empresa', required: true },
  fechaAtencion: { type: Date, default: Date.now },
  tipoAtencion_Id: { type: Schema.Types.ObjectId, ref: 'TipoAtencion' },
  tipoAtencion: { type: String, required: true },
  motivo: { type: String },
  diagnostico: { type: String },
  tratamiento: { type: String },
  valorTotal: { type: Number, default: 0 },
  vacunas: [VacunaSchema],
  insumos: [InsumoSchema],
  examenes: [ExamenAplicadoSchema],
  procedimientos: [ProcedimientoAtencionSchema],
  recetas: [RecetaAtencionSchema],
  cobros: [CobroAtencionSchema],
  resumenCobro: { type: ResumenCobroSchema, default: () => ({}) },
  snapshotClinico: { type: SnapshotClinicoSchema },
  estado: { type: String, enum: ['Activo', 'Borrado'], default: 'Activo' },
  usuarioCrea_id: { type: Schema.Types.ObjectId, ref: 'usuarios' },
  fechaHora_Crea: { type: Date, default: Date.now },
  usuarioModifica_id: { type: Schema.Types.ObjectId, ref: 'usuarios' },
  fechaHora_Modifica: { type: Date },
});

AtencionSchema.index({ empresa_Id: 1, estado: 1, fechaAtencion: -1 });
AtencionSchema.index({ ficha_Id: 1, estado: 1, fechaAtencion: -1 });
AtencionSchema.index({ empresa_Id: 1, tipoAtencion_Id: 1, estado: 1 });

export default model('Atencion', AtencionSchema);
