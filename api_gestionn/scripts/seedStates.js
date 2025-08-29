import mongoose from 'mongoose';
import dotenv from 'dotenv';
import State from '../models/states.js';

dotenv.config();

const estadosIniciales = [
    // Estados para Proyectos
    {
        name: 'Planificación',
        description: 'Proyecto en fase de planificación inicial',
        type: 'Project',
        color: '#3b82f6',
        order: 1,
        isFinal: false
    },
    {
        name: 'En Progreso',
        description: 'Proyecto activo en desarrollo',
        type: 'Project',
        color: '#f59e0b',
        order: 2,
        isFinal: false
    },
    {
        name: 'En Revisión',
        description: 'Proyecto en proceso de revisión',
        type: 'Project',
        color: '#8b5cf6',
        order: 3,
        isFinal: false
    },
    {
        name: 'Completado',
        description: 'Proyecto finalizado exitosamente',
        type: 'Project',
        color: '#10b981',
        order: 4,
        isFinal: true
    },
    {
        name: 'Cancelado',
        description: 'Proyecto cancelado',
        type: 'Project',
        color: '#ef4444',
        order: 5,
        isFinal: true
    },
    {
        name: 'En Pausa',
        description: 'Proyecto temporalmente pausado',
        type: 'Project',
        color: '#6b7280',
        order: 6,
        isFinal: false
    },

    // Estados para Tareas
    {
        name: 'Pendiente',
        description: 'Tarea creada pero no iniciada',
        type: 'Task',
        color: '#6b7280',
        order: 1,
        isFinal: false
    },
    {
        name: 'En Progreso',
        description: 'Tarea siendo trabajada activamente',
        type: 'Task',
        color: '#f59e0b',
        order: 2,
        isFinal: false
    },
    {
        name: 'En Revisión',
        description: 'Tarea completada, esperando revisión',
        type: 'Task',
        color: '#8b5cf6',
        order: 3,
        isFinal: false
    },
    {
        name: 'Bloqueada',
        description: 'Tarea bloqueada por dependencias externas',
        type: 'Task',
        color: '#ef4444',
        order: 4,
        isFinal: false
    },
    {
        name: 'Completada',
        description: 'Tarea finalizada y aprobada',
        type: 'Task',
        color: '#10b981',
        order: 5,
        isFinal: true
    },
    {
        name: 'Cancelada',
        description: 'Tarea cancelada',
        type: 'Task',
        color: '#dc2626',
        order: 6,
        isFinal: true
    }
];

const seedStates = async () => {
    try {
        console.log('🔄 Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Conectado a MongoDB');

        console.log('🔄 Iniciando proceso de seed...');
        
        let createdCount = 0;
        let skippedCount = 0;
        
        for (const estado of estadosIniciales) {
            try {
                // Buscar por nombre Y tipo para verificar existencia
                const existe = await State.findOne({ 
                    name: estado.name, 
                    type: estado.type 
                });
                
                if (!existe) {
                    await State.create(estado);
                    console.log(`✅ Creado: ${estado.name} (${estado.type})`);
                    createdCount++;
                } else {
                    console.log(`⏩ Saltado (ya existe): ${estado.name} (${estado.type})`);
                    skippedCount++;
                }
            } catch (error) {
                console.error(`❌ Error procesando ${estado.name}:`, error.message);
            }
        }
        
        console.log('\n📊 Resumen:');
        console.log(`- Estados creados: ${createdCount}`);
        console.log(`- Estados existentes (no modificados): ${skippedCount}`);
        
        const totalProyectos = await State.countDocuments({ type: 'Project' });
        const totalTareas = await State.countDocuments({ type: 'Task' });
        console.log(`\n🏁 Totales en DB: ${totalProyectos} estados para proyectos, ${totalTareas} estados para tareas`);
        
    } catch (error) {
        console.error('❌ Error general en el script:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔒 Desconectado de MongoDB');
        process.exit(0);
    }
};

seedStates();