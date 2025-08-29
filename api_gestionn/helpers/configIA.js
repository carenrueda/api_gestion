// Validar que la API key de Gemini esté configurada
export const validarConfiguracionIA = () => {
    if (!process.env.GEMINI_API_KEY) {
        console.warn('⚠️  GEMINI_API_KEY no está configurada. Las funciones de IA no funcionarán.');
        return false;
    }
    return true;
};

// Middleware para validar configuración de IA antes de usar endpoints
export const validarIA = (req, res, next) => {
    if (!validarConfiguracionIA()) {
        return res.status(503).json({
            ok: false,
            msg: 'Servicio de IA no disponible. Configuración faltante.'
        });
    }
    next();
};

// Función para limpiar y parsear respuesta JSON de IA
export const limpiarRespuestaJSON = (texto) => {
    try {
        // Buscar contenido JSON en el texto
        const jsonMatch = texto.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No se encontró JSON válido en la respuesta');
        }
        
        // Limpiar caracteres especiales que puedan interferir
        let jsonLimpio = jsonMatch[0]
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();
        
        return JSON.parse(jsonLimpio);
    } catch (error) {
        throw new Error(`Error al parsear respuesta JSON: ${error.message}`);
    }
};

// Prompts predefinidos para diferentes funcionalidades
export const PROMPTS = {
    GENERAR_TAREAS: (proyecto, contexto) => `
        Como experto en gestión de proyectos, genera una lista de tareas detalladas para:
        
        **Proyecto:** ${proyecto.name}
        **Descripción:** ${proyecto.description}
        **Categoría:** ${proyecto.category?.name || 'No especificada'}
        **Contexto:** ${contexto || 'No proporcionado'}
        
        Genera 5-8 tareas específicas, accionables y ordenadas lógicamente.
        
        Responde ÚNICAMENTE en formato JSON válido:
        {
            "tasks": [
                {
                    "title": "Título específico y claro",
                    "description": "Descripción detallada de qué hacer",
                    "priority": "Low|Medium|High|Critical",
                    "estimatedHours": numero_de_horas,
                    "tags": ["tag1", "tag2"]
                }
            ]
        }
    `,
    
    ANALIZAR_PROYECTO: (proyecto, estadisticas) => `
        Analiza el proyecto y proporciona recomendaciones profesionales:
        
        **PROYECTO:** ${proyecto.name} (Estado: ${proyecto.status?.name})
        **ESTADÍSTICAS:**
        - Total tareas: ${estadisticas.totalTareas}
        - Completadas: ${estadisticas.tareasCompletadas}
        - Vencidas: ${estadisticas.tareasVencidas}
        - Horas estimadas: ${estadisticas.horasEstimadas}
        - Horas reales: ${estadisticas.horasReales}
        
        Responde ÚNICAMENTE en formato JSON válido:
        {
            "analisis": {
                "estado_general": "descripción",
                "puntos_fuertes": ["punto1", "punto2"],
                "areas_mejora": ["area1", "area2"],
                "riesgos_identificados": ["riesgo1", "riesgo2"]
            },
            "recomendaciones": {
                "inmediatas": ["accion1", "accion2"],
                "mediano_plazo": ["accion1", "accion2"],
                "largo_plazo": ["accion1", "accion2"]
            }
        }
    `
};