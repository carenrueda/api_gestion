import express from 'express';
import autenticacion from '../controllers/autenticacion.js';

const router = express.Router();

router.post('/register', autenticacion.registrar);
router.post('/login', autenticacion.login);
router.post('/refresh', autenticacion.refresh);
router.post('/logout', autenticacion.logout);
router.post('/forgot-password', autenticacion.forgotPassword);
router.post('/reset-password', autenticacion.resetPassword);

export default router; 