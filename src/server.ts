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
import especieRoutes from './modules/especie/especie.routes';
import categoriaRoutes from './modules/categoria/categoria.routes';
import examenRoutes from './modules/examen/examen.routes';
import procedimientoRoutes from './modules/procedimiento/procedimiento.routes';
import medicamentoRoutes from './modules/medicamento/medicamento.routes';
import tipoCobroRoutes from './modules/tipo-cobro/tipo-cobro.routes';
import tipoAtencionRoutes from './modules/tipo-atencion/tipo-atencion.routes';
import catalogoClinicoRoutes from './modules/catalogo-clinico/catalogo-clinico.routes';
import tipoCatalogoClinicoRoutes from './modules/tipo-catalogo-clinico/tipo-catalogo-clinico.routes';
import razaRoutes from './modules/raza/raza.routes';
import clienteRoutes from './modules/administracion/cliente/cliente.routes';
import fichaRoutes from './modules/ficha/ficha.routes';
import atencionRoutes from './modules/atencion/atencion.routes';
import hospitalizacionRoutes from './modules/hospitalizacion/hospitalizacion.routes';
import propietarioRoutes from './modules/propietario/propietario.routes';
import inventarioRoutes from './modules/inventario/inventario.routes';

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

// Rutas de cliente
app.use('/api/cliente', authenticateToken, clienteRoutes);

// Rutas de propietario
app.use('/api/propietario', authenticateToken, propietarioRoutes);

// Rutas de empresa
app.use('/api/empresa', authenticateToken, empresaRoutes);

// Rutas de tipo veterinario
app.use('/api/tipo-veterinario', authenticateToken, tipoVeterinarioRoutes);

// Rutas de rol veterinario
app.use('/api/rol-veterinario', authenticateToken, rolVeterinarioRoutes);

// Rutas de región y comuna
app.use('/api/region-comuna', authenticateToken, regionComunaRoutes);

// Rutas de especie
app.use('/api/especie', authenticateToken, especieRoutes);

// Rutas de categoria
app.use('/api/categoria', authenticateToken, categoriaRoutes);

// Rutas de examen
app.use('/api/examen', authenticateToken, examenRoutes);

// Rutas de procedimiento
app.use('/api/procedimiento', authenticateToken, procedimientoRoutes);

// Rutas de medicamento
app.use('/api/medicamento', authenticateToken, medicamentoRoutes);

// Rutas de tipo de cobro
app.use('/api/tipo-cobro', authenticateToken, tipoCobroRoutes);

// Rutas de tipo de atención
app.use('/api/tipo-atencion', authenticateToken, tipoAtencionRoutes);

// Catálogos clínicos parametrizables (motivos y diagnósticos)
app.use('/api/catalogo-clinico', authenticateToken, catalogoClinicoRoutes);

// Tipos parametrizables del catálogo clínico.
app.use('/api/tipo-catalogo-clinico', authenticateToken, tipoCatalogoClinicoRoutes);

// Rutas de raza
app.use('/api/raza', authenticateToken, razaRoutes);

// Rutas de ficha
app.use('/api/ficha', authenticateToken, fichaRoutes);

// Rutas de atención
app.use('/api/atencion', authenticateToken, atencionRoutes);

// Hospitalizaciones y evoluciones clínicas asociadas a una atención.
app.use('/api/hospitalizacion', authenticateToken, hospitalizacionRoutes);

// Stock y movimientos de insumos veterinarios.
app.use('/api/inventario', authenticateToken, inventarioRoutes);

const startServer = async () => {
  await connectMongo();
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    logger.info(`Servidor escuchando en puerto ${port}`);
  });
};

startServer();
