import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del rol es obligatorio'],
    unique: true,
    enum: ['Admin', 'Project Manager', 'Developer', 'Viewer','Tester', 'QA']
  },
  description: {
    type: String,
    required: [true, 'La descripción es obligatoria']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Role', roleSchema);