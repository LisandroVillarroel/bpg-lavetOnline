import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { connectMongo } from './config/mongo';
import { logger } from './config/logger';

import authRoutes from './modules/auth/auth.routes';
import { authenticateToken } from './modules/auth/auth.middleware';
import menuRoutes from './modules/menu/menu.routes';
import usuarioRoutes from './modules/usuario/usuario.routes';
import empresaRoutes from './modules/empresa/empresa.routes';
import tipoVeterinarioRoutes from './modules/tipo-veterinario/tipo-veterinario.routes';
import rolVeterinarioRoutes from './modules/rol-veterinario/rol-veterinario.routes';
import regionComunaRoutes from './modules/region-comuna/region-comuna.routes';

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
const uploadsFolder = path.join(__dirname, '..', 'uploads');
const uploadStaticFolder = path.join(uploadsFolder, 'usuarios');
fs.mkdirSync(uploadStaticFolder, { recursive: true });
app.use('/uploads', express.static(uploadsFolder));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

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

// Rutas de tipo veterinario
app.use('/api/tipo-veterinario', tipoVeterinarioRoutes);

// Rutas de rol veterinario
app.use('/api/rol-veterinario', authenticateToken, rolVeterinarioRoutes);

// Rutas de región y comuna
app.use('/api/region-comuna', authenticateToken, regionComunaRoutes);

const startServer = async () => {
  await connectMongo();
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    logger.info(`Servidor escuchando en puerto ${port}`);
  });
};

startServer();
