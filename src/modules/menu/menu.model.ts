import mongoose, { Schema, Document } from 'mongoose';

export interface IMenuItem {
  despliegaNombre: string;
  iconoNombre: string;
  route?: string;
  tipoPermiso?: string;
  indeterminate?: boolean;
  seleccionado?: boolean;
  children?: IMenuItem[];
}

export interface IMenu extends Document {
  nombreMenu: 'Laboratorio' | 'Veterinaria' | 'Propietario';
  menuItem: IMenuItem[];
  estado?: 'Activo' | 'Inactivo';
  usuarioCrea_id?: string;
  usuarioModifica_id?: string;
  fechaHora_crea?: Date;
  fechaHora_modifica?: Date;
}

// Definición recursiva para children
const MenuItemSchema = new Schema<IMenuItem>(
  {
    despliegaNombre: { type: String, required: true },
    iconoNombre: { type: String, required: true },
    route: { type: String },
    tipoPermiso: { type: String },
    indeterminate: { type: Boolean, default: false },
    seleccionado: { type: Boolean, default: false },
    children: [{ type: Schema.Types.Mixed }], // placeholder, se redefine abajo
  },
  { _id: true },
);

// Asignar children recursivamente
MenuItemSchema.add({ children: [MenuItemSchema] });

const MenuSchema = new Schema<IMenu>(
  {
    nombreMenu: {
      type: String,
      enum: ['Laboratorio', 'Veterinaria', 'Propietario'],
      required: true,
    },
    menuItem: [MenuItemSchema],
    estado: { type: String, enum: ['Activo', 'Inactivo'], default: 'Activo' },
    usuarioCrea_id: { type: String },
    usuarioModifica_id: { type: String },
  },
  {
    timestamps: { createdAt: 'fechaHora_crea', updatedAt: 'fechaHora_modifica' },
  },
);

export const MenuModel = mongoose.model<IMenu>('menus', MenuSchema);
