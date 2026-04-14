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

// Esquema Mongoose para MenuItem reutilizable en todos los modelos
import { Schema } from 'mongoose';
export const MenuItemSchema = new Schema<MenuItem>(
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
