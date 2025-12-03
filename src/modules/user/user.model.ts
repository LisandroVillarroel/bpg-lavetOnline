import mongoose, { Schema, Document } from 'mongoose';

export interface IUsuarioEmpresa {
  idEmpresa: string;
  rutEmpresa: string;
  razonSocial: string;
  nombreFantasia: string;
  menu_Id: string;
  tipoEmpresa?: 'Laboratorio' | 'Veterinaria' | 'Usuario';
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
  usuarioEmpresa?: IUsuarioEmpresa;
  tipoUsuario?: 'Laboratorio' | 'Veterinaria' | 'Usuario';
  MenuItem?: MenuItem[];
  usuarioCrea_id?: string;
  usuarioModifica_id?: string;
  estadoUsuario?: 'Activo' | 'Inactivo';
  estado?: string;
}

const UsuarioEmpresaSchema = new Schema<IUsuarioEmpresa>(
  {
    idEmpresa: { type: String, required: true },
    rutEmpresa: { type: String, required: true },
    razonSocial: { type: String, required: true },
    nombreFantasia: { type: String, required: true },
    menu_Id: { type: String, required: true },
    tipoEmpresa: { type: String },
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

const UsuarioSchema = new Schema<IUsuario>({
  usuario: { type: String, required: true, unique: true },
  contrasena: { type: String, required: true },
  rutUsuario: { type: String, required: true },
  nombres: { type: String, required: true },
  apellidoPaterno: { type: String, required: true },
  apellidoMaterno: { type: String, required: true },
  telefono: { type: String },
  email: { type: String },
  direccion: { type: String },
  usuarioEmpresa: { type: UsuarioEmpresaSchema },
  tipoUsuario: { type: String, enum: ['Laboratorio', 'Veterinaria', 'Usuario'] },
  MenuItem: [MenuItemSchema],
  usuarioCrea_id: { type: String },
  usuarioModifica_id: { type: String },
  estadoUsuario: { type: String, enum: ['Activo', 'Inactivo'] },
  estado: { type: String },
});

export const UserModel = mongoose.model<IUsuario>('usuarios', UsuarioSchema);
