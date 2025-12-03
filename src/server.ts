import express from 'express';
import cors from 'cors';
import { connectMongo } from './config/mongo';
import { logger } from './config/logger';
import authRoutes from './modules/auth/auth.routes';

const app = express();

app.use(
  cors({
    origin: 'http://localhost:4200',
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

const startServer = async () => {
  await connectMongo();
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    logger.info(`Servidor escuchando en puerto ${port}`);
  });
};

startServer();
