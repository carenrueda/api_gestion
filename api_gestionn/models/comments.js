import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, 'El contenido del comentario es obligatorio'],
        trim: true,
        minlength: 1
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    editedAt: {
        type: Date,
        default: null
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

commentSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

commentSchema.pre('findOneAndUpdate', function(next) {
    this.set({ updatedAt: Date.now() });
    next();
});

commentSchema.index({ projectId: 1 });
commentSchema.index({ author: 1 });
commentSchema.index({ createdAt: -1 });

export default mongoose.model('Comment', commentSchema);