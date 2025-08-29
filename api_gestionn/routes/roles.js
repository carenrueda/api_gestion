import express from 'express';
import roles from '../controllers/roles.js';
import validarJWT from '../middlewares/validarJWT.js';
import { esAdmin } from '../middlewares/autorizacion.js';

const router = express.Router();


router.use(validarJWT);

// GET /api/roles - Listar roles (todos los usuarios autenticados)
router.get('/', roles.listarRoles);

// Solo administradores pueden crear, actualizar y eliminar roles
router.post('/', esAdmin, roles.crearRol);
router.put('/:id', esAdmin, roles.actualizarRol);
router.delete('/:id', esAdmin, roles.eliminarRol);

export default router;