import mongoose, { Schema, Document } from 'mongoose';
import { MenuItem, MenuItemSchema } from '../../shared/modulo/menu-item.interface';

export interface IUsuarioEmpresa {
  empresaId: string;
  rutEmpresa: string;
  razonSocial: string;
  nombreFantasia: string;
  tipoEmpresa?: 'Laboratorio' | 'Veterinaria' | 'Usuario';
}

export interface IVeterinaria {
  tipoVeterinario: string;
  rolVeterinario: string;
  porcentajeComisionVeterinario: number;
}

export interface IUsuario extends Document {
  usuario?: string;
  contrasena?: string;
  temaColorSistema?: string;
  rutUsuario: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  region?: String;
  comuna?: string;
  MenuItem?: MenuItem[];
  tipoUsuario?: 'Laboratorio' | 'Veterinaria' | 'Usuario';
  veterinaria?: IVeterinaria;
  empresa?: IUsuarioEmpresa;
  fotoUrl?: string;
  estadoUsuario?: 'Activo' | 'Bloqueado' | 'Suspendido';
  usuarioCrea?: string;
  usuarioModifica?: string;
  fechaHora_crea?: Date;
  fechaHora_modifica?: Date;
  estado?: string;
}

const UsuarioEmpresaSchema = new Schema<IUsuarioEmpresa>(
  {
    empresaId: { type: String, required: true },
    rutEmpresa: { type: String, required: true },
    razonSocial: { type: String, required: true },
    nombreFantasia: { type: String, required: true },
    tipoEmpresa: { type: String },
  },
  { _id: false },
);

const VeterinariaSchema = new Schema<IVeterinaria>(
  {
    tipoVeterinario: { type: String, required: true },
    rolVeterinario: { type: String, required: true }, //Administrador-Veterinario, Veterinario, AsistenteVeterinario
    porcentajeComisionVeterinario: { type: Number, required: true },
  },
  { _id: false },
);

const UsuarioSchema = new Schema<IUsuario>({
  usuario: { type: String, required: true, unique: true },
  contrasena: { type: String, required: true },
  temaColorSistema: { type: String },
  rutUsuario: { type: String, required: true },
  nombres: { type: String, required: true },
  apellidoPaterno: { type: String, required: true },
  apellidoMaterno: { type: String, required: true },
  telefono: { type: String },
  email: { type: String },
  direccion: { type: String },
  region: { type: String },
  comuna: { type: String },
  MenuItem: [MenuItemSchema],
  tipoUsuario: { type: String, enum: ['Laboratorio', 'Veterinaria', 'Propietario'] },
  veterinaria: { type: VeterinariaSchema },
  empresa: { type: UsuarioEmpresaSchema },
  fotoUrl: { type: String },
  estadoUsuario: { type: String },
  usuarioCrea: { type: String },
  usuarioModifica: { type: String },
  fechaHora_crea: { type: Date, default: Date.now },
  fechaHora_modifica: { type: Date, default: Date.now },
  estado: { type: String },
});

// Middleware para actualizar fechaHora_modifica automáticamente
UsuarioSchema.pre('findOneAndUpdate', function (next) {
  this.set({ fechaHora_modifica: new Date() });
  next();
});

export const UserModel = mongoose.model<IUsuario>('usuarios', UsuarioSchema);
