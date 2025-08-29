import express from 'express';
import iaController from '../controllers/inteligenciaArtificial.js';
import validarJWT from '../middlewares/validarJWT.js';
import { validarIA } from '../helpers/configIA.js';

const router = express.Router();


router.use(validarJWT);
router.use(validarIA);

// POST /api/ai/generate-tasks - Generar tareas automáticamente basadas en descripción del proyecto
router.post('/generate-tasks', iaController.generarTareas);

// POST /api/ai/analyze-project - Análisis y sugerencias de mejora para el proyecto
router.post('/analyze-project', iaController.analizarProyecto);

// POST /api/ai/estimate-time - Estimación de tiempo para completar tareas
router.post('/estimate-time', iaController.estimarTiempo);

// POST /api/ai/generate-summary - Generar resumen del progreso del proyecto
router.post('/generate-summary', iaController.generarResumen);

// POST /api/ai/suggest-improvements - Sugerencias basadas en comentarios y estados
router.post('/suggest-improvements', iaController.sugerirMejoras);

export default router;