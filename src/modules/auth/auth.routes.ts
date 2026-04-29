import { Router } from 'express';
import { changePassword, login, me } from './auth.controller';
import { authenticateToken } from './auth.middleware';

const router = Router();

// Endpoint de login
router.post('/login', login);

// Endpoint para obtener el usuario autenticado
router.get('/me', authenticateToken, me);
router.post('/change-password', authenticateToken, changePassword);

export default router;
