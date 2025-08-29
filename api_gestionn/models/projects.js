import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        trim: true
    },
    description: { 
        type: String, 
        required: true,
        trim: true
    },
    category: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Categoria",
        required: true
    },
    owner: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User",
        required: true
    },
    members: [{
        user: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User",
            required: true
        },
        role: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Role",
            required: true
        },
        joinedAt: { 
            type: Date, 
            default: Date.now 
        }
    }],
    status: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "State",
        required: true
    },
    priority: { 
        type: String, 
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
    },
    startDate: { 
        type: Date,
        default: Date.now
    },
    endDate: { 
        type: Date 
    },
    estimatedHours: { 
        type: Number,
        min: 0
    },
    actualHours: { 
        type: Number,
        default: 0,
        min: 0
    },
    budget: { 
        type: Number,
        min: 0
    },
    imageUrl: { // NUEVO CAMPO
        type: String,
        default: ''
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    tags: [{ 
        type: String,
        trim: true
    }],
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

projectSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

projectSchema.pre('findOneAndUpdate', function(next) {
    this.set({ updatedAt: Date.now() });
    next();
});

export default mongoose.model('Project', projectSchema);