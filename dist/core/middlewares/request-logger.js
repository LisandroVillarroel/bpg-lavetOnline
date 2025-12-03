"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
const logger_1 = require("../../config/logger");
function requestLogger(req, res, next) {
    const { method, originalUrl } = req;
    const started = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - started;
        logger_1.logger.info({ method, url: originalUrl, statusCode: res.statusCode, duration }, 'HTTP request');
    });
    next();
}
