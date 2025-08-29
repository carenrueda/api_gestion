import express from 'express';
import uploadsController from '../controllers/uploads.js';
import validarJWT from '../middlewares/validarJWT.js';

const router = express.Router();

router.use(validarJWT);

// Avatar de usuario
router.post('/usuario/avatar', uploadsController.cargarAvatarUsuario);
router.get('/usuario/:id/avatar', uploadsController.mostrarImagenUsuario);

// Imágenes de proyecto (Cloudinary)
router.post('/proyecto/:projectId/imagen', uploadsController.cargarImagenProyecto);

// Múltiples archivos
router.post('/archivos-multiples', uploadsController.cargarArchivosMultiples);

// Eliminar imágenes
router.delete('/:tipo/:id', uploadsController.eliminarImagen);

export default router;