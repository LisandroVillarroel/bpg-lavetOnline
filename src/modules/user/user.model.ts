import mongoose, { Schema, Document } from 'mongoose';

export interface IUsuarioEmpresa {
  empresa_Id: string;
  rutEmpresa: string;
  razonSocial: string;
  nombreFantasia: string;
  menu_Id: string;
  tipoEmpresa?: 'Laboratorio' | 'Veterinaria' | 'Usuario';
}

export interface IVeterinaria {
  tipoVeterinario: string;
  rolVeterinario: string;
  porcentajeComisionVeterinario: number;
}

export interface MenuItem {
  _id?: string;
  despliegaNombre: string;
  iconoNombre: string;
  route?: string;
  tipoPermiso?: string;
  indeterminate?: boolean;
  seleccionado?: boolean;
  children?: MenuItem[];
}

export interface IUsuario extends Document {
  usuario?: string;
  contrasena?: string;
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
  usuarioEmpresa?: IUsuarioEmpresa;
  estadoUsuario?: 'Activo' | 'Bloqueado' | 'Suspendido';
  usuarioCrea_id?: string;
  usuarioModifica_id?: string;
  estado?: string;
}

const UsuarioEmpresaSchema = new Schema<IUsuarioEmpresa>(
  {
    empresa_Id: { type: String, required: true },
    rutEmpresa: { type: String, required: true },
    razonSocial: { type: String, required: true },
    nombreFantasia: { type: String, required: true },
    menu_Id: { type: String, required: true },
    tipoEmpresa: { type: String },
  },
  { _id: false },
);

const VeterinariaSchema = new Schema<IVeterinaria>(
  {
    tipoVeterinario: { type: String, required: true },
    rolVeterinario: { type: String, required: true },
    porcentajeComisionVeterinario: { type: Number, required: true },
  },
  { _id: false },
);

const MenuItemSchema = new Schema<MenuItem>(
  {
    despliegaNombre: { type: String, required: true },
    iconoNombre: { type: String, required: true },
    route: { type: String },
    tipoPermiso: { type: String },
    indeterminate: { type: Boolean },
    seleccionado: { type: Boolean },
    children: [{ type: Schema.Types.Mixed }],
  },
  { _id: false },
);

const UsuarioSchema = new Schema<IUsuario>(
  {
    usuario: { type: String, required: true, unique: true },
    contrasena: { type: String, required: true },
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
    usuarioEmpresa: { type: UsuarioEmpresaSchema },
    estadoUsuario: { type: String },
    usuarioCrea_id: { type: String },
    usuarioModifica_id: { type: String },

    estado: { type: String },
  },
  {
    timestamps: { createdAt: 'fechaHora_crea', updatedAt: 'fechaHora_modifica' },
    // Guardar Fecha creacion y actualizacion
  },
);

export const UserModel = mongoose.model<IUsuario>('usuarios', UsuarioSchema);
