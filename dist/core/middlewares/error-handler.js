"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const logger_1 = require("../../config/logger");
const app_error_1 = require("../errors/app-error");
function errorHandler(err, _req, res, _next) {
    if (err instanceof app_error_1.AppError) {
        logger_1.logger.warn({ err }, 'Handled application error');
        res.status(err.statusCode).json({ message: err.message, details: err.details ?? null });
        return;
    }
    logger_1.logger.error({ err }, 'Unhandled error');
    res.status(500).json({ message: 'Internal server error' });
}
