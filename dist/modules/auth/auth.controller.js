"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
const user_model_1 = require("../user/user.model");
const bcryptjs_1 = require("bcryptjs");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const buildResponse = (overrides) => ({
    error: false,
    data: null,
    codigo: 200,
    mensaje: 'ok',
    ...overrides,
});
async function login(req, res) {
    console.log('req.body:', req.body);
    const usuario_ = req.body.usuario;
    const contrasena_ = req.body.contrasena;
    if (!usuario_ || !contrasena_) {
        return res.status(200).json(buildResponse({
            error: true,
            mensaje: 'Usuario y contraseña son requeridos',
            codigo: 400,
        }));
    }
    // Buscar por usuario o rutUsuario
    const usuario = await user_model_1.UserModel.findOne({
        $or: [{ usuario: usuario_ }, { rutUsuario: usuario_ }],
    });
    if (!usuario) {
        return res.status(200).json(buildResponse({
            error: true,
            mensaje: 'Usuario o Contraseña incorrecta',
            codigo: 400,
        }));
    }
    const valid = await (0, bcryptjs_1.compare)(contrasena_, usuario.contrasena ?? '');
    if (!valid) {
        return res.status(200).json(buildResponse({
            error: true,
            mensaje: 'Usuario o Contraseña incorrecta',
            codigo: 400,
        }));
    }
    const jwtSecret = env_1.env.JWT_SECRET;
    const accessToken = jsonwebtoken_1.default.sign({ id: usuario._id, tipoUsuario: usuario.tipoUsuario }, jwtSecret, {
        expiresIn: String(env_1.env.JWT_EXPIRES_IN),
    });
    const refreshToken = jsonwebtoken_1.default.sign({ id: usuario._id }, jwtSecret, {
        expiresIn: String(env_1.env.REFRESH_TOKEN_EXPIRES_IN),
    });
    return res.status(200).json(buildResponse({
        data: {
            usuario,
            tokens: {
                accessToken,
                refreshToken,
                expiresIn: env_1.env.JWT_EXPIRES_IN,
            },
        },
    }));
}
