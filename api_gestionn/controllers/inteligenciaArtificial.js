import { GoogleGenerativeAI } from '@google/generative-ai';
import Project from '../models/projects.js';
import Task from '../models/tasks.js';
import Comment from '../models/comments.js';
import State from '../models/states.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv'

dotenv.config();
// Configuración de IA (al inicio del archivo)
console.log('🔍 Verificando configuración de IA...');
console.log('Clave API en .env:', process.env.GEMINI_API_KEY ? '✅ Presente' : '❌ Faltante');

let iaConfigurada = false;
let model;

try {
  if (process.env.GEMINI_API_KEY) {
    console.log('Intentando configurar Gemini AI...');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim()); // Añade .trim()
    model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    iaConfigurada = true;
    console.log('✅ Gemini AI configurado correctamente');
  } else {
    console.warn('⚠️ GEMINI_API_KEY no encontrada en variables de entorno');
  }
} catch (error) {
  console.error('❌ Error configurando Gemini AI:', error.message);
}

// Helper para parsear respuestas de IA
const parsearRespuestaIA = (text) => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No se encontró JSON válido en la respuesta');
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error parseando respuesta IA:', error);
    throw new Error('La respuesta de la IA no tiene el formato esperado');
  }
};

// Helper para verificar acceso a proyecto
const verificarAccesoProyecto = async (projectId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error('ID de proyecto inválido');
  }

  const proyecto = await Project.findOne({
    _id: projectId,
    $or: [{ owner: userId }, { 'members.user': userId }],
    isActive: true
  }).populate({
    path: 'category',
    select: 'name description',
    options: { lean: true }
  }).populate('status', 'name');

  if (!proyecto) throw new Error('Proyecto no encontrado o no tienes acceso');
  return proyecto;
};

// Generar tareas automáticamente
const generarTareas = async (req, res) => {
  if (!iaConfigurada) {
    return res.status(503).json({
      ok: false,
      msg: 'Servicio de IA no configurado'
    });
  }

  try {
    const { projectId, additionalContext } = req.body;
    const userId = req.usuario._id;

    const proyecto = await verificarAccesoProyecto(projectId, userId);
    const nombreCategoria = proyecto.category?.name || 'Sin categoría';

    // Obtener estados para tareas
    const estadosTareas = await State.find({ 
      type: 'Task', 
      isActive: true 
    }).sort({ order: 1 }).lean();

    if (estadosTareas.length === 0) {
      return res.status(400).json({
        ok: false,
        msg: 'No hay estados disponibles para tareas'
      });
    }

    const estadoInicial = estadosTareas[0];

    // Prompt mejor estructurado
    const prompt = `Como experto en gestión de proyectos, genera entre 5 y 10 tareas para:
Proyecto: ${proyecto.name} | Descripción: ${proyecto.description || 'N/A'}
Categoría: ${nombreCategoria} | Contexto: ${additionalContext || 'N/A'}

Requisitos:
1. Tareas específicas y accionables
2. Orden lógico
3. Estimaciones realistas
4. Prioridades adecuadas

Respuesta en JSON exactamente con este formato:
{
  "tasks": [
    {
      "title": "Título",
      "description": "Descripción detallada",
      "priority": "Low/Medium/High/Critical",
      "estimatedHours": número,
      "tags": ["tag1", "tag2"]
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const tareasGeneradas = parsearRespuestaIA(response.text());

    // Crear tareas con validación
    const tareasCreadas = await Promise.all(
      tareasGeneradas.tasks.map(async (tareaData) => {
        const nuevaTarea = new Task({
          title: tareaData.title || 'Tarea sin título',
          description: tareaData.description || '',
          project: projectId,
          createdBy: userId,
          status: estadoInicial._id,
          priority: tareaData.priority || 'Medium',
          estimatedHours: tareaData.estimatedHours || 1,
          tags: tareaData.tags || []
        });

        await nuevaTarea.save();
        return nuevaTarea.populate([
          { path: 'createdBy', select: 'firstName lastName email' },
          { path: 'status', select: 'name description color' }
        ]);
      })
    );

    res.json({
      ok: true,
      msg: `Tareas generadas: ${tareasCreadas.length}`,
      tareas: tareasCreadas
    });

  } catch (error) {
    console.error('Error en generarTareas:', error);
    res.status(500).json({
      ok: false,
      msg: error.message || 'Error al generar tareas con IA'
    });
  }
};

// Análisis de proyecto
const analizarProyecto = async (req, res) => {
  if (!iaConfigurada) {
    return res.status(503).json({
      ok: false,
      msg: 'Servicio de IA no configurado'
    });
  }

  try {
    const { projectId } = req.body;
    const userId = req.usuario._id;

    const proyecto = await verificarAccesoProyecto(projectId, userId);

    // Obtener datos en paralelo para mejor performance
    const [tareas, comentarios] = await Promise.all([
      Task.find({ project: projectId, isActive: true })
        .populate('status', 'name isFinal'),
      Comment.find({ projectId })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('author', 'firstName lastName')
    ]);

    // Calcular métricas
    const totalTareas = tareas.length;
    const tareasCompletadas = tareas.filter(t => t.status.isFinal).length;
    const progreso = totalTareas > 0 ? Math.round((tareasCompletadas / totalTareas) * 100) : 0;

    const prompt = `Analiza este proyecto:
Nombre: ${proyecto.name}
Estado: ${proyecto.status?.name || 'N/A'}
Progreso: ${progreso}%
Tareas: ${totalTareas} (Completadas: ${tareasCompletadas})
Comentarios recientes: ${comentarios.slice(0, 3).map(c => `${c.author.firstName}: ${c.content.substring(0, 50)}...`).join(', ')}

Devuelve JSON con:
{
  "analisis": { "estado_general": "...", "puntos_fuertes": [], "areas_mejora": [] },
  "recomendaciones": { "inmediatas": [], "mediano_plazo": [] },
  "metricas": { "eficiencia": "...", "calidad": "..." }
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analisisData = parsearRespuestaIA(response.text());

    res.json({
      ok: true,
      analisis: analisisData,
      estadisticas: { totalTareas, tareasCompletadas, progreso }
    });

  } catch (error) {
    console.error('Error en analizarProyecto:', error);
    res.status(500).json({
      ok: false,
      msg: error.message || 'Error al analizar proyecto'
    });
  }
};

// Estimación de tiempo
const estimarTiempo = async (req, res) => {
  if (!iaConfigurada) {
    return res.status(503).json({
      ok: false,
      msg: 'Servicio de IA no configurado'
    });
  }

  try {
    const { taskIds } = req.body;
    const userId = req.usuario._id;

    // Validación de IDs
    const validIds = taskIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) throw new Error('IDs de tareas inválidos');

    // Obtener tareas con acceso verificado
    const tareas = await Task.find({ _id: { $in: validIds }, isActive: true })
      .populate('project', 'owner members')
      .populate('status', 'name');

    const tareasAccesibles = tareas.filter(tarea => 
      tarea.project.owner.equals(userId) || 
      tarea.project.members.some(m => m.user.equals(userId))
    );

    if (tareasAccesibles.length === 0) throw new Error('No tienes acceso a estas tareas');

    const prompt = `Estima tiempo para estas tareas:
${tareasAccesibles.map(t => 
  `- ${t.title} (${t.status.name}): ${t.estimatedHours}h`
).join('\n')}

Respuesta en JSON:
{
  "estimaciones": [
    {
      "taskId": "id",
      "estimacionHoras": número,
      "confianza": "Alta/Media/Baja",
      "factores_riesgo": []
    }
  ],
  "resumen": {
    "total_horas": número,
    "rango_min": número,
    "rango_max": número
  }
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const estimacionData = parsearRespuestaIA(response.text());

    res.json({
      ok: true,
      estimaciones: estimacionData,
      tareasAnalizadas: tareasAccesibles.length
    });

  } catch (error) {
    console.error('Error en estimarTiempo:', error);
    res.status(400).json({
      ok: false,
      msg: error.message || 'Error al estimar tiempos'
    });
  }
};

// Generar resumen del progreso (FUNCIÓN NUEVA)
const generarResumen = async (req, res) => {
  if (!iaConfigurada) {
    return res.status(503).json({
      ok: false,
      msg: 'Servicio de IA no configurado'
    });
  }

  try {
    const { projectId, periodo = '30' } = req.body;
    const userId = req.usuario._id;

    const proyecto = await verificarAccesoProyecto(projectId, userId);

    // Calcular fecha de inicio del periodo
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - parseInt(periodo));

    // Obtener datos del periodo
    const [tareas, comentariosRecientes] = await Promise.all([
      Task.find({
        project: projectId,
        isActive: true
      }).populate('status', 'name isFinal'),
      Comment.find({
        projectId: projectId,
        createdAt: { $gte: fechaInicio }
      }).populate('author', 'firstName lastName')
    ]);

    const tareasCompletadasPeriodo = tareas.filter(t => 
      t.completedAt && t.completedAt >= fechaInicio
    );

    const prompt = `Genera resumen ejecutivo para el proyecto ${proyecto.name} (últimos ${periodo} días):
- Tareas completadas: ${tareasCompletadasPeriodo.length}/${tareas.length}
- Comentarios: ${comentariosRecientes.length}
- Estado actual: ${proyecto.status?.name || 'N/A'}

Formato JSON requerido:
{
  "resumen_ejecutivo": "texto resumen",
  "logros_principales": [],
  "desafios_identificados": [],
  "proximos_pasos": [],
  "metricas_clave": {
    "progreso_general": "",
    "velocidad_trabajo": "",
    "calidad_entregables": ""
  },
  "recomendaciones": []
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const resumenData = parsearRespuestaIA(response.text());

    res.json({
      ok: true,
      resumen: resumenData,
      periodo_analizado: `${periodo} días`,
      estadisticas: {
        tareas_completadas: tareasCompletadasPeriodo.length,
        total_tareas: tareas.length,
        actividad_comentarios: comentariosRecientes.length
      }
    });

  } catch (error) {
    console.error('Error en generarResumen:', error);
    res.status(500).json({
      ok: false,
      msg: error.message || 'Error al generar resumen'
    });
  }
};

// Sugerir mejoras (FUNCIÓN NUEVA)
const sugerirMejoras = async (req, res) => {
  if (!iaConfigurada) {
    return res.status(503).json({
      ok: false,
      msg: 'Servicio de IA no configurado'
    });
  }

  try {
    const { projectId } = req.body;
    const userId = req.usuario._id;

    const proyecto = await verificarAccesoProyecto(projectId, userId);

    // Obtener datos en paralelo
    const [comentarios, tareasProblematicas] = await Promise.all([
      Comment.find({ projectId })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('author', 'firstName lastName'),
      Task.find({
        project: projectId,
        $or: [
          { dueDate: { $lt: new Date() }, completedAt: null },
          { actualHours: { $gt: 0 }, $expr: { $gt: ['$actualHours', { $multiply: ['$estimatedHours', 1.5] }] } 
          }],
        isActive: true
      }).populate('status', 'name')
    ]);

    const prompt = `Sugiere mejoras para el proyecto ${proyecto.name} basado en:
- Comentarios recientes: ${comentarios.slice(0, 3).map(c => `${c.author.firstName}: ${c.content.substring(0, 50)}...`).join('\n')}
- Tareas problemáticas: ${tareasProblematicas.length} (${tareasProblematicas.slice(0, 3).map(t => t.title).join(', ')})

Formato JSON requerido:
{
  "analisis": {
    "problemas_principales": [],
    "causas_raiz": []
  },
  "sugerencias": {
    "inmediatas": [],
    "mediano_plazo": [],
    "estructurales": []
  }
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const sugerenciasData = parsearRespuestaIA(response.text());

    res.json({
      ok: true,
      sugerencias: sugerenciasData,
      datos_analizados: {
        comentarios: comentarios.length,
        tareas_problematicas: tareasProblematicas.length
      }
    });

  } catch (error) {
    console.error('Error en sugerirMejoras:', error);
    res.status(500).json({
      ok: false,
      msg: error.message || 'Error al generar sugerencias'
    });
  }
};

// Exportar todas las funciones
export default {
  generarTareas,
  analizarProyecto,
  estimarTiempo,
  generarResumen,
  sugerirMejoras
};