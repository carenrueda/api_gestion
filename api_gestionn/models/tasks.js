import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'El título de la tarea es obligatorio'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'La descripción es obligatoria'],
        trim: true
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'State',
        required: true
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
    },
    estimatedHours: {
        type: Number,
        min: 0,
        default: 0
    },
    actualHours: {
        type: Number,
        min: 0,
        default: 0
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date
    },
    completedAt: {
        type: Date,
        default: null
    },
    tags: [{
        type: String,
        trim: true
    }],
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

taskSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});


taskSchema.pre('findOneAndUpdate', function(next) {
    this.set({ updatedAt: Date.now() });
    next();
});

taskSchema.index({ project: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ createdBy: 1 });

export default mongoose.model('Task', taskSchema);