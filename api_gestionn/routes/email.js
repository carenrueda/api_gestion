import express from 'express';
import emailController from '../controllers/email.js';
import validarJWT from '../middlewares/validarJWT.js';
import { esAdmin } from '../middlewares/autorizacion.js';

const router = express.Router();

router.use(validarJWT);

// POST /api/email/test - Probar envío de correos (solo admins)
router.post('/test', esAdmin, emailController.probarCorreo);

export default router;