import express from 'express';
import usuarios from '../controllers/usuarios.js';
import validarJWT from '../middlewares/validarJWT.js';
import { esAdmin } from '../middlewares/autorizacion.js';

const router = express.Router();

router.use(validarJWT);

// GET /api/users - Listar usuarios (Solo Admin)
router.get('/', esAdmin, usuarios.listarUsuarios);

// GET /api/users/profile - Perfil del usuario actual
router.get('/profile', usuarios.obtenerPerfil);

// PUT /api/users/profile - Actualizar perfil
router.put('/profile', usuarios.actualizarPerfil);

// DELETE /api/users/:id - Eliminar usuario (Solo Admin)
router.delete('/:id', esAdmin, usuarios.eliminarUsuario);

// PUT /api/users/:id/role - Cambiar rol (Solo Admin)
router.put('/:id/role', esAdmin, usuarios.cambiarRol);

export default router;