import { Router } from 'express';
import {
  obtenerMenus,
  obtenerMenuPorTipo,
  obtenerMenuPorId,
  crearMenu,
  actualizarMenu,
  actualizarItemsMenu,
  eliminarMenu,
  cambiarEstadoMenu,
} from './menu.controller';

const router = Router();

// Consulta - Obtener todos los menús
router.get('/', obtenerMenus);

// Consulta - Obtener menú por tipo (Laboratorio, Veterinaria, Propietario)
router.get('/:tipo', obtenerMenuPorTipo);

// Consulta - Obtener menú por ID
router.get('/id/:id', obtenerMenuPorId);

// Crear - Nuevo menú
router.post('/', crearMenu);

// Modificar - Menú completo
router.put('/:id', actualizarMenu);

// Modificar - Solo items del menú
router.put('/:id/items', actualizarItemsMenu);

// Modificar - Estado
router.patch('/:id/estado', cambiarEstadoMenu);

// Eliminar - Menú
router.delete('/:id', eliminarMenu);

export default router;
