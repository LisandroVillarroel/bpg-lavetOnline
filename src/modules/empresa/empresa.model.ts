import { Schema, model, Document } from 'mongoose';
import { MenuItem, MenuItemSchema } from '../../shared/modulo/menu-item.interface';

export interface Empresa extends Document {
  rutEmpresa: string;
  razonSocial: string;
  nombreFantasia: string;
  direccion: string;
  telefono: string;
  emailEmpresa: string;
  contacto: {
    nombreContacto: string;
    emailContacto: string;
    telefonoContacto: string;
  };
  tipoEmpresa: string; // (Laboratorio-Veterinaria)
  MenuItem: MenuItem[];
  estadoEmpresa: 'Activo' | 'Bloqueado';
  usuarioCrea?: string;
  usuarioModifica?: string;
  fechaHora_crea?: Date;
  fechaHora_modifica?: Date;
}

const EmpresaSchema = new Schema<Empresa>({
  rutEmpresa: { type: String, required: true, unique: true },
  razonSocial: { type: String, required: true },
  nombreFantasia: { type: String, required: true },
  direccion: { type: String, required: true },
  telefono: { type: String, required: true },
  emailEmpresa: { type: String, required: true },
  contacto: {
    nombreContacto: { type: String, required: true },
    emailContacto: { type: String, required: true },
    telefonoContacto: { type: String, required: true },
  },
  tipoEmpresa: { type: String, required: true },
  MenuItem: [MenuItemSchema],
  estadoEmpresa: { type: String, enum: ['Activo', 'Bloqueado'], default: 'Activo' },
  usuarioCrea: { type: String },
  usuarioModifica: { type: String },
  fechaHora_crea: { type: Date, default: Date.now },
  fechaHora_modifica: { type: Date, default: Date.now },
});

// Middleware para actualizar fechaHora_modifica automáticamente
EmpresaSchema.pre('findOneAndUpdate', function (next) {
  this.set({ fechaHora_modifica: new Date() });
  next();
});

export default model<Empresa>('Empresa', EmpresaSchema);
