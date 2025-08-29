import mongoose from 'mongoose';

const categoriaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre de la categoria es obligatorio'],
    unique: true
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

export default mongoose.model('Categoria', categoriaSchema);