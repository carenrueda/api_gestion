import express from 'express';
import estadosController from '../controllers/estados.js';
import validarJWT from '../middlewares/validarJWT.js';
import { esAdmin } from '../middlewares/autorizacion.js';

const router = express.Router();

router.use(validarJWT);

// GET /api/states - Listar estados 
router.get('/', estadosController.listarEstados);

// GET /api/states/projects - Estados disponibles para proyectos
router.get('/projects', estadosController.listarEstadosProyectos);

// GET /api/states/tasks - Estados disponibles para tareas
router.get('/tasks', estadosController.listarEstadosTareas);

// GET /api/states/:id - Obtener estado específico
router.get('/:id', estadosController.obtenerEstado);

// Solo administradores pueden crear, actualizar y eliminar estados
router.post('/', esAdmin, estadosController.crearEstado);
router.put('/:id', esAdmin, estadosController.actualizarEstado);
router.delete('/:id', esAdmin, estadosController.eliminarEstado);

export default router;