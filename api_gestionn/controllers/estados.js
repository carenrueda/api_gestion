import State from '../models/states.js';
import mongoose from 'mongoose';

const listarEstadosProyectos = async (req, res) => {
    try {
        const estados = await State.find({
            type: 'Project',
            isActive: true
        }).sort({ order: 1, name: 1 });

        res.json({
            ok: true,
            estados
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Error al listar estados de proyectos',
            error: error.message
        });
    }
};

const listarEstadosTareas = async (req, res) => {
    try {
        const estados = await State.find({
            type: 'Task',
            isActive: true
        }).sort({ order: 1, name: 1 });

        res.json({
            ok: true,
            estados
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Error al listar estados de tareas',
            error: error.message
        });
    }
};

const listarEstados = async (req, res) => {
    try {
        const { type } = req.query;
        let filtro = { isActive: true };

        if (type && ['Project', 'Task'].includes(type)) {
            filtro.type = type;
        }

        const estados = await State.find(filtro)
            .sort({ type: 1, order: 1, name: 1 });

        res.json({
            ok: true,
            estados
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Error al listar estados',
            error: error.message
        });
    }
};

const crearEstado = async (req, res) => {
    try {
        const { name, description, type, color, order, isFinal } = req.body;

        if (!name || !type) {
            return res.status(400).json({
                ok: false,
                msg: 'El nombre y el tipo son obligatorios'
            });
        }

        if (!['Project', 'Task'].includes(type)) {
            return res.status(400).json({
                ok: false,
                msg: 'El tipo debe ser Project o Task'
            });
        }

        const nuevoEstado = new State({
            name,
            description,
            type,
            color,
            order: order || 0,
            isFinal: isFinal || false
        });

        await nuevoEstado.save();

        res.status(201).json({
            ok: true,
            msg: 'Estado creado exitosamente',
            estado: nuevoEstado
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                ok: false,
                msg: 'Ya existe un estado con ese nombre para este tipo'
            });
        }

        res.status(500).json({
            ok: false,
            msg: 'Error al crear estado',
            error: error.message
        });
    }
};

const actualizarEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, type, color, order, isFinal } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                msg: 'ID de estado inválido'
            });
        }

        if (type && !['Project', 'Task'].includes(type)) {
            return res.status(400).json({
                ok: false,
                msg: 'El tipo debe ser Project o Task'
            });
        }

        const datosActualizar = {};
        if (name) datosActualizar.name = name;
        if (description !== undefined) datosActualizar.description = description;
        if (type) datosActualizar.type = type;
        if (color) datosActualizar.color = color;
        if (order !== undefined) datosActualizar.order = order;
        if (isFinal !== undefined) datosActualizar.isFinal = isFinal;

        const estadoActualizado = await State.findByIdAndUpdate(
            id,
            datosActualizar,
            { new: true, runValidators: true }
        );

        if (!estadoActualizado) {
            return res.status(404).json({
                ok: false,
                msg: 'Estado no encontrado'
            });
        }

        res.json({
            ok: true,
            msg: 'Estado actualizado exitosamente',
            estado: estadoActualizado
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                ok: false,
                msg: 'Ya existe un estado con ese nombre para este tipo'
            });
        }

        res.status(500).json({
            ok: false,
            msg: 'Error al actualizar estado',
            error: error.message
        });
    }
};


const eliminarEstado = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                msg: 'ID de estado inválido'
            });
        }


        const estado = await State.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!estado) {
            return res.status(404).json({
                ok: false,
                msg: 'Estado no encontrado'
            });
        }

        res.json({
            ok: true,
            msg: 'Estado eliminado exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Error al eliminar estado',
            error: error.message
        });
    }
};


const obtenerEstado = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                msg: 'ID de estado inválido'
            });
        }

        const estado = await State.findOne({
            _id: id,
            isActive: true
        });

        if (!estado) {
            return res.status(404).json({
                ok: false,
                msg: 'Estado no encontrado'
            });
        }

        res.json({
            ok: true,
            estado
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener estado',
            error: error.message
        });
    }
};

export default {
    listarEstados,
    listarEstadosProyectos,
    listarEstadosTareas,
    crearEstado,
    actualizarEstado,
    eliminarEstado,
    obtenerEstado
};