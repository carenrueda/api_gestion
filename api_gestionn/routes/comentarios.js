import express from 'express';
import comentariosController from '../controllers/comentarios.js';
import validarJWT from '../middlewares/validarJWT.js';

const router = express.Router();

router.use(validarJWT);

// PUT /api/comments/:id - Editar comentario
router.put('/:id', comentariosController.editarComentario);

// DELETE /api/comments/:id - Eliminar comentario
router.delete('/:id', comentariosController.eliminarComentario);

export default router;