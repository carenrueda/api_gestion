import Task from '../models/tasks.js';
import Project from '../models/projects.js';
import State from '../models/states.js';
import Usuario from '../models/Users.js'; // AGREGAR ESTA IMPORTACIÓN
import mongoose from 'mongoose';
import { notificarTareaAsignada } from './email.js'; 

const listarTareasProyecto = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.usuario._id;

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({
                ok: false,
                msg: 'ID de proyecto inválido'
            });
        }

        const proyecto = await Project.findOne({
            _id: projectId,
            $or: [
                { owner: userId },
                { 'members.user': userId }
            ],
            isActive: true
        });

        if (!proyecto) {
            return res.status(404).json({
                ok: false,
                msg: 'Proyecto no encontrado o no tienes acceso'
            });
        }

        const tareas = await Task.find({
            project: projectId,
            isActive: true
        })
            .populate('assignedTo', 'firstName lastName email')
            .populate('createdBy', 'firstName lastName email')
            .populate('status', 'name description color')
            .sort({ createdAt: -1 });

        res.json({
            ok: true,
            tareas,
            total: tareas.length
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Error al listar tareas',
            error: error.message
        });
    }
};
const crearTarea = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.usuario._id;
        const {
            title,
            description,
            assignedTo,
            status,
            priority = 'Medium',
            estimatedHours,
            startDate,
            dueDate,
            tags
        } = req.body;

        if (!title || !description || !status) {
            return res.status(400).json({
                ok: false,
                msg: 'Los campos title, description y status son obligatorios'
            });
        }

        const proyecto = await Project.findOne({
            _id: projectId,
            $or: [
                { owner: userId },
                { 'members.user': userId }
            ],
            isActive: true
        });

        if (!proyecto) {
            return res.status(404).json({
                ok: false,
                msg: 'Proyecto no encontrado o no tienes acceso'
            });
        }

        const estado = await State.findOne({
            _id: status,
            type: 'Task',
            isActive: true
        });

        if (!estado) {
            return res.status(400).json({
                ok: false,
                msg: 'Estado inválido para tareas'
            });
        }

        const nuevaTarea = new Task({
            title,
            description,
            project: projectId,
            assignedTo: assignedTo || null,
            createdBy: userId,
            status,
            priority,
            estimatedHours: estimatedHours || 0,
            startDate: startDate || Date.now(),
            dueDate,
            tags: tags || []
        });

        await nuevaTarea.save();
        
        await nuevaTarea.populate([
            { path: 'assignedTo', select: 'firstName lastName email' },
            { path: 'createdBy', select: 'firstName lastName email' },
            { path: 'status', select: 'name description color' }
        ]);

        res.status(201).json({
            ok: true,
            msg: 'Tarea creada exitosamente',
            tarea: nuevaTarea
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Error al crear tarea',
            error: error.message
        });
    }
};

const obtenerTarea = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.usuario._id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                msg: 'ID de tarea inválido'
            });
        }

        const tarea = await Task.findOne({
            _id: id,
            isActive: true
        })
            .populate('assignedTo', 'firstName lastName email')
            .populate('createdBy', 'firstName lastName email')
            .populate('status', 'name description color')
            .populate('project', 'name owner members');

        if (!tarea) {
            return res.status(404).json({
                ok: false,
                msg: 'Tarea no encontrada'
            });
        }

        const tieneAcceso = tarea.project.owner.toString() === userId.toString() ||
            tarea.project.members.some(member => member.user.toString() === userId.toString());

        if (!tieneAcceso) {
            return res.status(403).json({
                ok: false,
                msg: 'No tienes acceso a esta tarea'
            });
        }

        res.json({
            ok: true,
            tarea
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener tarea',
            error: error.message
        });
    }
};
const actualizarTarea = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.usuario._id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                msg: 'ID de tarea inválido'
            });
        }

        const tarea = await Task.findOne({
            _id: id,
            isActive: true
        }).populate('project', 'owner members');

        if (!tarea) {
            return res.status(404).json({
                ok: false,
                msg: 'Tarea no encontrada'
            });
        }

        const esOwner = tarea.project.owner.toString() === userId.toString();
        const esCreador = tarea.createdBy.toString() === userId.toString();
        const esAsignado = tarea.assignedTo && tarea.assignedTo.toString() === userId.toString();

        if (!esOwner && !esCreador && !esAsignado) {
            return res.status(403).json({
                ok: false,
                msg: 'No tienes permisos para actualizar esta tarea'
            });
        }

        // Campos actualizables
        const camposPermitidos = [
            'title', 'description', 'priority', 'estimatedHours',
            'actualHours', 'startDate', 'dueDate', 'tags'
        ];

        const actualizaciones = {};
        camposPermitidos.forEach(campo => {
            if (req.body[campo] !== undefined) {
                actualizaciones[campo] = req.body[campo];
            }
        });

        const tareaActualizada = await Task.findByIdAndUpdate(
            id,
            actualizaciones,
            { new: true, runValidators: true }
        )
            .populate('assignedTo', 'firstName lastName email')
            .populate('createdBy', 'firstName lastName email')
            .populate('status', 'name description color');

        res.json({
            ok: true,
            msg: 'Tarea actualizada exitosamente',
            tarea: tareaActualizada
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Error al actualizar tarea',
            error: error.message
        });
    }
};

const eliminarTarea = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.usuario._id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                msg: 'ID de tarea inválido'
            });
        }

        const tarea = await Task.findOne({
            _id: id,
            isActive: true
        }).populate('project', 'owner');

        if (!tarea) {
            return res.status(404).json({
                ok: false,
                msg: 'Tarea no encontrada'
            });
        }

        const esOwner = tarea.project.owner.toString() === userId.toString();
        const esCreador = tarea.createdBy.toString() === userId.toString();

        if (!esOwner && !esCreador) {
            return res.status(403).json({
                ok: false,
                msg: 'No tienes permisos para eliminar esta tarea'
            });
        }

        await Task.findByIdAndUpdate(id, {
            isActive: false,
            updatedAt: Date.now()
        });

        res.json({
            ok: true,
            msg: 'Tarea eliminada exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Error al eliminar tarea',
            error: error.message
        });
    }
};

const cambiarEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { statusId } = req.body;
        const userId = req.usuario._id;

        if (!mongoose.Types.ObjectId.isValid(id) ||
            !mongoose.Types.ObjectId.isValid(statusId)) {
            return res.status(400).json({
                ok: false,
                msg: 'IDs inválidos'
            });
        }

        const tarea = await Task.findOne({
            _id: id,
            isActive: true
        }).populate('project', 'owner members');

        if (!tarea) {
            return res.status(404).json({
                ok: false,
                msg: 'Tarea no encontrada'
            });
        }

        const tieneAcceso = tarea.project.owner.toString() === userId.toString() ||
            tarea.project.members.some(member => member.user.toString() === userId.toString()) ||
            (tarea.assignedTo && tarea.assignedTo.toString() === userId.toString());

        if (!tieneAcceso) {
            return res.status(403).json({
                ok: false,
                msg: 'No tienes acceso para cambiar el estado de esta tarea'
            });
        }

        const estado = await State.findOne({
            _id: statusId,
            type: 'Task',
            isActive: true
        });

        if (!estado) {
            return res.status(400).json({
                ok: false,
                msg: 'Estado inválido para tareas'
            });
        }

        const actualizaciones = { status: statusId };
        if (estado.isFinal && !tarea.completedAt) {
            actualizaciones.completedAt = new Date();
        } else if (!estado.isFinal && tarea.completedAt) {
            actualizaciones.completedAt = null;
        }

        const tareaActualizada = await Task.findByIdAndUpdate(
            id,
            actualizaciones,
            { new: true, runValidators: true }
        )
            .populate('status', 'name description color')
            .populate('assignedTo', 'firstName lastName email');

        res.json({
            ok: true,
            msg: 'Estado de la tarea actualizado exitosamente',
            tarea: {
                _id: tareaActualizada._id,
                title: tareaActualizada.title,
                status: tareaActualizada.status,
                assignedTo: tareaActualizada.assignedTo,
                completedAt: tareaActualizada.completedAt,
                updatedAt: tareaActualizada.updatedAt
            }
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Error al cambiar estado de la tarea',
            error: error.message
        });
    }
};

const asignarTarea = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId: assignedUserId } = req.body;
        const userId = req.usuario._id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                msg: 'ID de tarea inválido'
            });
        }

        const tarea = await Task.findOne({
            _id: id,
            isActive: true
        }).populate('project', 'owner members name description'); // AGREGAR name y description

        if (!tarea) {
            return res.status(404).json({
                ok: false,
                msg: 'Tarea no encontrada'
            });
        }

        if (tarea.project.owner.toString() !== userId.toString()) {
            return res.status(403).json({
                ok: false,
                msg: 'Solo el owner del proyecto puede asignar tareas'
            });
        }

        let usuarioAsignado = null;

        if (assignedUserId) {
            const esMiembro = tarea.project.owner.toString() === assignedUserId ||
                tarea.project.members.some(member => member.user.toString() === assignedUserId);

            if (!esMiembro) {
                return res.status(400).json({
                    ok: false,
                    msg: 'El usuario debe ser miembro del proyecto'
                });
            }

            // OBTENER DATOS COMPLETOS DEL USUARIO ASIGNADO
            usuarioAsignado = await Usuario.findById(assignedUserId)
                .select('firstName lastName email');

            if (!usuarioAsignado) {
                return res.status(404).json({
                    ok: false,
                    msg: 'Usuario asignado no encontrado'
                });
            }
        }

        const tareaActualizada = await Task.findByIdAndUpdate(
            id,
            { assignedTo: assignedUserId || null },
            { new: true, runValidators: true }
        )
            .populate('assignedTo', 'firstName lastName email')
            .populate('status', 'name description color')
            .populate('project', 'name description');

        // ENVIAR NOTIFICACIÓN POR EMAIL SI SE ASIGNA LA TAREA
        if (assignedUserId && usuarioAsignado) {
            try {
                await notificarTareaAsignada(
                    {
                        title: tareaActualizada.title,
                        description: tareaActualizada.description,
                        priority: tareaActualizada.priority,
                        estimatedHours: tareaActualizada.estimatedHours,
                        dueDate: tareaActualizada.dueDate,
                        project: tareaActualizada.project
                    },
                    usuarioAsignado,
                    req.usuario
                );
            } catch (emailError) {
                console.error('Error enviando notificación de tarea:', emailError);
                // No fallar la operación si el email no se puede enviar
            }
        }

        res.json({
            ok: true,
            msg: assignedUserId ? 'Tarea asignada exitosamente' : 'Asignación de tarea removida exitosamente',
            tarea: {
                _id: tareaActualizada._id,
                title: tareaActualizada.title,
                assignedTo: tareaActualizada.assignedTo,
                status: tareaActualizada.status,
                updatedAt: tareaActualizada.updatedAt
            }
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Error al asignar tarea',
            error: error.message
        });
    }
};

const misTareas = async (req, res) => {
    try {
        const userId = req.usuario._id;

        const tareas = await Task.find({
            assignedTo: userId,
            isActive: true
        })
            .populate('project', 'name owner')
            .populate('createdBy', 'firstName lastName email')
            .populate('status', 'name description color')
            .sort({ dueDate: 1, createdAt: -1 });

        res.json({
            ok: true,
            tareas,
            total: tareas.length
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener tus tareas',
            error: error.message
        });
    }
};

export default {
    listarTareasProyecto,
    crearTarea,
    obtenerTarea,
    actualizarTarea,
    eliminarTarea,
    cambiarEstado,
    asignarTarea,
    misTareas
};