import Categoria from '../models/categorias.js';
import Project from '../models/projects.js';
import mongoose from 'mongoose';


const listarCategorias = async (req, res) => {
    try {
        const categorias = await Categoria.find({ isActive: true })
            .sort({ name: 1 });

        res.json({
            ok: true,
            categorias
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Error al listar categorías',
            error: error.message
        });
    }
};


const crearCategoria = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name || !description) {
            return res.status(400).json({
                ok: false,
                msg: 'El nombre y la descripción son obligatorios'
            });
        }

        const nuevaCategoria = new Categoria({
            name,
            description
        });

        await nuevaCategoria.save();

        res.status(201).json({
            ok: true,
            msg: 'Categoría creada exitosamente',
            categoria: nuevaCategoria
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                ok: false,
                msg: 'Ya existe una categoría con ese nombre'
            });
        }

        res.status(500).json({
            ok: false,
            msg: 'Error al crear categoría',
            error: error.message
        });
    }
};


const obtenerCategoria = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                msg: 'ID de categoría inválido'
            });
        }

        const categoria = await Categoria.findOne({
            _id: id,
            isActive: true
        });

        if (!categoria) {
            return res.status(404).json({
                ok: false,
                msg: 'Categoría no encontrada'
            });
        }

        res.json({
            ok: true,
            categoria
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener categoría',
            error: error.message
        });
    }
};


const actualizarCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                msg: 'ID de categoría inválido'
            });
        }

        if (!name || !description) {
            return res.status(400).json({
                ok: false,
                msg: 'El nombre y la descripción son obligatorios'
            });
        }

        const categoriaActualizada = await Categoria.findByIdAndUpdate(
            id,
            { name, description },
            { new: true, runValidators: true }
        );

        if (!categoriaActualizada) {
            return res.status(404).json({
                ok: false,
                msg: 'Categoría no encontrada'
            });
        }

        res.json({
            ok: true,
            msg: 'Categoría actualizada exitosamente',
            categoria: categoriaActualizada
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                ok: false,
                msg: 'Ya existe una categoría con ese nombre'
            });
        }

        res.status(500).json({
            ok: false,
            msg: 'Error al actualizar categoría',
            error: error.message
        });
    }
};


const eliminarCategoria = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                msg: 'ID de categoría inválido'
            });
        }

        const proyectosConCategoria = await Project.countDocuments({
            category: id,
            isActive: true
        });

        if (proyectosConCategoria > 0) {
            return res.status(400).json({
                ok: false,
                msg: `No se puede eliminar la categoría porque tiene ${proyectosConCategoria} proyecto(s) asociado(s)`
            });
        }

        const categoria = await Categoria.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!categoria) {
            return res.status(404).json({
                ok: false,
                msg: 'Categoría no encontrada'
            });
        }

        res.json({
            ok: true,
            msg: 'Categoría eliminada exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Error al eliminar categoría',
            error: error.message
        });
    }
};

export default {
    listarCategorias,
    crearCategoria,
    obtenerCategoria,
    actualizarCategoria,
    eliminarCategoria
};