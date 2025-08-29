import mongoose from 'mongoose';

const stateSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        trim: true
    },
    description: { 
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['Project', 'Task'],
        required: true
    },
    color: { 
        type: String, 
        default: '#6b7280' // Color por defecto (gris)
    },
    order: {
        type: Number,
        default: 0 // Para ordenar los estados en la UI
    },
    isFinal: {
        type: Boolean,
        default: false // Indica si es un estado final del proyecto/tarea
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Índice compuesto para name y type (permite duplicar nombres entre tipos)
stateSchema.index({ name: 1, type: 1 }, { unique: true });

// Middleware para actualizar updatedAt
stateSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

stateSchema.pre('findOneAndUpdate', function(next) {
    this.set({ updatedAt: Date.now() });
    next();
});

export default mongoose.model('State', stateSchema);