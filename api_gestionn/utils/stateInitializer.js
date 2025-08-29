import State from '../models/states.js';

const defaultStates = [
  // Estados para Proyectos
  { name: 'Planificación', description: 'Proyecto en fase de planificación inicial', type: 'Project', color: '#3b82f6', order: 1, isFinal: false },
  { name: 'En Progreso', description: 'Proyecto activo en desarrollo', type: 'Project', color: '#f59e0b', order: 2, isFinal: false },
  { name: 'En Revisión', description: 'Proyecto en proceso de revisión', type: 'Project', color: '#8b5cf6', order: 3, isFinal: false },
  { name: 'Completado', description: 'Proyecto finalizado exitosamente', type: 'Project', color: '#10b981', order: 4, isFinal: true },
  { name: 'Cancelado', description: 'Proyecto cancelado', type: 'Project', color: '#ef4444', order: 5, isFinal: true },
  { name: 'En Pausa', description: 'Proyecto temporalmente pausado', type: 'Project', color: '#6b7280', order: 6, isFinal: false },
  
  // Estados para Tareas
  { name: 'Pendiente', description: 'Tarea creada pero no iniciada', type: 'Task', color: '#6b7280', order: 1, isFinal: false },
  { name: 'En Progreso', description: 'Tarea siendo trabajada activamente', type: 'Task', color: '#f59e0b', order: 2, isFinal: false },
  { name: 'En Revisión', description: 'Tarea completada, esperando revisión', type: 'Task', color: '#8b5cf6', order: 3, isFinal: false },
  { name: 'Bloqueada', description: 'Tarea bloqueada por dependencias externas', type: 'Task', color: '#ef4444', order: 4, isFinal: false },
  { name: 'Completada', description: 'Tarea finalizada y aprobada', type: 'Task', color: '#10b981', order: 5, isFinal: true },
  { name: 'Cancelada', description: 'Tarea cancelada', type: 'Task', color: '#dc2626', order: 6, isFinal: true }
];

export async function initializeStates() {
  try {
    console.log('🔍 Verificando estados iniciales...');
    
    // Verificar por tipo de estado
    const projectStatesCount = await State.countDocuments({ type: 'Project' });
    const taskStatesCount = await State.countDocuments({ type: 'Task' });

    let createdCount = 0;

    // Crear estados de proyecto si no existen
    if (projectStatesCount === 0) {
      const projectStates = defaultStates.filter(state => state.type === 'Project');
      await State.insertMany(projectStates);
      createdCount += projectStates.length;
      console.log(`✅ ${projectStates.length} estados de proyecto creados`);
    }

    // Crear estados de tarea si no existen
    if (taskStatesCount === 0) {
      const taskStates = defaultStates.filter(state => state.type === 'Task');
      await State.insertMany(taskStates);
      createdCount += taskStates.length;
      console.log(`✅ ${taskStates.length} estados de tarea creados`);
    }

    // Si ya existían ambos tipos
    if (createdCount === 0) {
      console.log('ℹ️  Todos los estados necesarios ya existen en la base de datos');
    }

    return {
      success: true,
      created: createdCount,
      existing: (projectStatesCount + taskStatesCount)
    };

  } catch (error) {
    if (error.code === 11000) {
      console.log('⚠️  Algunos estados ya existían (duplicados ignorados)');
      return {
        success: true,
        warning: 'Algunos estados ya existían'
      };
    } else {
      console.error('❌ Error crítico al inicializar estados:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}