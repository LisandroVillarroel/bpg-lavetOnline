"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectMongo = connectMongo;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const logger_1 = require("./logger");
async function connectMongo() {
    try {
        await mongoose_1.default.connect(env_1.env.MONGODB_URI, {
            dbName: env_1.env.MONGO_DB,
            user: env_1.env.MONGO_USER,
            pass: env_1.env.MONGO_PASS,
            authSource: env_1.env.MONGO_AUTH_SOURCE,
            autoIndex: true,
            maxPoolSize: 10,
        });
        logger_1.logger.info('Conexión a MongoDB exitosa');
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'Error al conectar a MongoDB');
        process.exit(1);
    }
}
