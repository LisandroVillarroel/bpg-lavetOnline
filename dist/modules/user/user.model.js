"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const UsuarioEmpresaSchema = new mongoose_1.Schema({
    idEmpresa: { type: String, required: true },
    rutEmpresa: { type: String, required: true },
    razonSocial: { type: String, required: true },
    nombreFantasia: { type: String, required: true },
    menu_Id: { type: String, required: true },
    tipoEmpresa: { type: String },
}, { _id: false });
const MenuItemSchema = new mongoose_1.Schema({
    despliegaNombre: { type: String, required: true },
    iconoNombre: { type: String, required: true },
    route: { type: String },
    tipoPermiso: { type: String },
    indeterminate: { type: Boolean },
    seleccionado: { type: Boolean },
    children: [{ type: mongoose_1.Schema.Types.Mixed }],
}, { _id: false });
const UsuarioSchema = new mongoose_1.Schema({
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
exports.UserModel = mongoose_1.default.model('usuarios', UsuarioSchema);
