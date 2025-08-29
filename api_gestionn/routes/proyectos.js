import express from 'express';
import proyectosController from '../controllers/proyectos.js';
import tareasController from '../controllers/tareas.js';
import comentariosController from '../controllers/comentarios.js';
import validarJWT from '../middlewares/validarJWT.js';

const router = express.Router();


router.use(validarJWT);

// GET /api/projects - Listar proyectos del usuario
router.get('/', proyectosController.listarProyectos);

// POST /api/projects - Crear proyecto
router.post('/', proyectosController.crearProyecto);

// GET /api/projects/:id - Obtener proyecto específico
router.get('/:id', proyectosController.obtenerProyecto);

// PUT /api/projects/:id - Actualizar proyecto
router.put('/:id', proyectosController.actualizarProyecto);

// DELETE /api/projects/:id - Eliminar proyecto
router.delete('/:id', proyectosController.eliminarProyecto);

// POST /api/projects/:id/members - Agregar miembro al proyecto
router.post('/:id/members', proyectosController.agregarMiembro);

// DELETE /api/projects/:id/members/:userId - Remover miembro
router.delete('/:id/members/:userId', proyectosController.removerMiembro);

// PUT /api/projects/:id/status - Cambiar estado del proyecto
router.put('/:id/status', proyectosController.cambiarEstado);

// === RUTAS DE TAREAS DEL PROYECTO ===
// GET /api/projects/:projectId/tasks - Listar tareas del proyecto
router.get('/:projectId/tasks', tareasController.listarTareasProyecto);

// POST /api/projects/:projectId/tasks - Crear tarea
router.post('/:projectId/tasks', tareasController.crearTarea);

// === RUTAS DE COMENTARIOS DEL PROYECTO ===
// GET /api/projects/:id/comments - Comentarios del proyecto
router.get('/:id/comments', comentariosController.listarComentarios);

// POST /api/projects/:id/comments - Comentar en proyecto
router.post('/:id/comments', comentariosController.crearComentario);

export default router;