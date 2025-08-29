import express from 'express';
import categoriasController from '../controllers/categorias.js';
import validarJWT from '../middlewares/validarJWT.js';

const router = express.Router();

router.use(validarJWT);

// GET /api/categories - Listar todas las categorías
router.get('/', categoriasController.listarCategorias);

// POST /api/categories - Crear categoría
router.post('/', categoriasController.crearCategoria);

// GET /api/categories/:id - Obtener categoría específica
router.get('/:id', categoriasController.obtenerCategoria);

// PUT /api/categories/:id - Actualizar categoría
router.put('/:id', categoriasController.actualizarCategoria);

// DELETE /api/categories/:id - Eliminar categoría
router.delete('/:id', categoriasController.eliminarCategoria);

export default router;