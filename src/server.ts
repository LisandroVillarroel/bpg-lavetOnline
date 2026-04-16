import express from 'express';
import cors from 'cors';
import { connectMongo } from './config/mongo';
import { logger } from './config/logger';

import authRoutes from './modules/auth/auth.routes';
import { authenticateToken } from './modules/auth/auth.middleware';
import menuRoutes from './modules/menu/menu.routes';
import usuarioRoutes from './modules/usuario/usuario.routes';
import empresaRoutes from './modules/empresa/empresa.routes';

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      const allowedOrigins = [
        /^http:\/\/localhost:\d+$/,
        /^http:\/\/127\.0\.0\.1:\d+$/,
        /^https:\/\/localhost:\d+$/,
        /^https:\/\/127\.0\.0\.1:\d+$/,
      ];

      const isAllowed = allowedOrigins.some((pattern) => pattern.test(origin));
      return callback(isAllowed ? null : new Error('Origen no permitido por CORS'), isAllowed);
    },
    credentials: true,
  }),
);
/*
// Middleware para forzar encabezados CORS en todas las respuestas
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});
*/
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Endpoint de prueba
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Rutas de menú
app.use('/api/menu', authenticateToken, menuRoutes);

// Rutas de usuario
app.use('/api/usuario', authenticateToken, usuarioRoutes);

// Rutas de empresa
app.use('/api/empresa', authenticateToken, empresaRoutes);

const startServer = async () => {
  await connectMongo();
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    logger.info(`Servidor escuchando en puerto ${port}`);
  });
};

startServer();
