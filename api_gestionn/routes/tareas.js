import express from 'express';
import tareasController from '../controllers/tareas.js';
import validarJWT from '../middlewares/validarJWT.js';

const router = express.Router();

router.use(validarJWT);

// GET /api/tasks/my-tasks - Tareas asignadas al usuario
router.get('/my-tasks', tareasController.misTareas);

// GET /api/tasks/:id - Obtener tarea específica
router.get('/:id', tareasController.obtenerTarea);

// PUT /api/tasks/:id - Actualizar tarea
router.put('/:id', tareasController.actualizarTarea);

// DELETE /api/tasks/:id - Eliminar tarea
router.delete('/:id', tareasController.eliminarTarea);

// PUT /api/tasks/:id/status - Cambiar estado de tarea
router.put('/:id/status', tareasController.cambiarEstado);

// PUT /api/tasks/:id/assign - Asignar tarea a usuario
router.put('/:id/assign', tareasController.asignarTarea);

export default router;