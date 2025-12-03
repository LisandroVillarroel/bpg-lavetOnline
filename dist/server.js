"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongo_1 = require("./config/mongo");
const logger_1 = require("./config/logger");
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: 'http://localhost:4200',
    credentials: true,
}));
/*
// Middleware para forzar encabezados CORS en todas las respuestas
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});
*/
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
// Endpoint de prueba
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
// Rutas de autenticación
app.use('/api/auth', auth_routes_1.default);
const startServer = async () => {
    await (0, mongo_1.connectMongo)();
    const port = process.env.PORT || 4000;
    app.listen(port, () => {
        logger_1.logger.info(`Servidor escuchando en puerto ${port}`);
    });
};
startServer();
