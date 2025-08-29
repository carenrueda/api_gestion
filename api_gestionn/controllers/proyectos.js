import Project from '../models/projects.js';
import Categoria from '../models/categorias.js';
import Usuario from '../models/Users.js'; // AGREGAR ESTA IMPORTACIÓN
import mongoose from 'mongoose';
import { notificarInvitacionProyecto } from './email.js'; // AGREGAR ESTA IMPORTACIÓN


const listarProyectos = async (req, res) => {
    try {
        const userId = req.usuario._id;

        const proyectos = await Project.find({
            $or: [
                { owner: userId },
                { 'members.user': userId }
            ],
            isActive: true
        })
            .populate('owner', 'firstName lastName email')
            .populate('category', 'name')
            .populate('status', 'name')
            .populate('members.user', 'firstName lastName email')
            .populate('members.role', 'name')
            .sort({ createdAt: -1 });

        res.json({
            ok: true,
            proyectos,
            total: proyectos.length
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Error al listar proyectos',
            error: error.message
        });
    }
};

const crearProyecto = async (req, res) => {
    try {
        const {
            name,
            description,
            category,
            status,
            priority = 'Medium',
            startDate,
            endDate,
            estimatedHours,
            budget,
            tags
        } = req.body;

        if (!name || !description || !category || !status) {
            return res.status(400).json({
                ok: false,
                msg: 'Los campos name, description, category y status son obligatorios'
            });
        }

        const nuevoProyecto = new Project({
            name,
            description,
            category,
            owner: req.usuario._id,
            status,
            priority,
            startDate: startDate || Date.now(),
            endDate,
            estimatedHours,
            budget,
            tags: tags || [],
            members: []
        });

        await nuevoProyecto.save();

        await nuevoProyecto.populate([
            { path: 'owner', select: 'firstName lastName email' },
            { path: 'category', select: 'name' },
            { path: 'status', select: 'name' }
        ]);

        res.status(201).json({
            ok: true,
            msg: 'Proyecto creado exitosamente',
            proyecto: nuevoProyecto
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Error al crear proyecto',
            error: error.message
        });
    }
};


const obtenerProyecto = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.usuario._id;

        // Validar ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                msg: 'ID de proyecto inválido'
            });
        }

        const proyecto = await Project.findOne({
            _id: id,
            $or: [
                { owner: userId },
                { 'members.user': userId }
            ],
            isActive: true
        })
            .populate('owner', 'firstName lastName email')
            .populate('category', 'name description')
            .populate('status', 'name description')
            .populate('members.user', 'firstName lastName email')
            .populate('members.role', 'name permissions');

        if (!proyecto) {
            return res.status(404).json({
                ok: false,
                msg: 'Proyecto no encontrado o no tienes acceso'
            });
        }

        res.json({
            ok: true,
            proyecto
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener proyecto',
            error: error.message
        });
    }
};

const actualizarProyecto = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.usuario._id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                msg: 'ID de proyecto inválido'
            });
        }

        const proyecto = await Project.findOne({
            _id: id,
            owner: userId,
            isActive: true
        });

        if (!proyecto) {
            return res.status(404).json({
                ok: false,
                msg: 'Proyecto no encontrado o no tienes permisos para editarlo'
            });
        }

        const camposPermitidos = [
            'name', 'description', 'category', 'priority',
            'startDate', 'endDate', 'estimatedHours', 'actualHours',
            'budget', 'tags'
        ];

        const actualizaciones = {};
        camposPermitidos.forEach(campo => {
            if (req.body[campo] !== undefined) {
                actualizaciones[campo] = req.body[campo];
            }
        });

        const proyectoActualizado = await Project.findByIdAndUpdate(
            id,
            actualizaciones,
            { new: true, runValidators: true }
        )
            .populate('owner', 'firstName lastName email')
            .populate('category', 'name')
            .populate('status', 'name')
            .populate('members.user', 'firstName lastName email')
            .populate('members.role', 'name');

        res.json({
            ok: true,
            msg: 'Proyecto actualizado exitosamente',
            proyecto: proyectoActualizado
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Error al actualizar proyecto',
            error: error.message
        });
    }
};

const eliminarProyecto = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.usuario._id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                msg: 'ID de proyecto inválido'
            });
        }

        const proyecto = await Project.findOne({
            _id: id,
            owner: userId,
            isActive: true
        });

        if (!proyecto) {
            return res.status(404).json({
                ok: false,
                msg: 'Proyecto no encontrado o no tienes permisos para eliminarlo'
            });
        }

        await Project.findByIdAndUpdate(id, {
            isActive: false,
            updatedAt: Date.now()
        });

        res.json({
            ok: true,
            msg: 'Proyecto eliminado exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Error al eliminar proyecto',
            error: error.message
        });
    }
};

const agregarMiembro = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, roleId } = req.body;
        const ownerId = req.usuario._id;

        // Validaciones
        if (!mongoose.Types.ObjectId.isValid(id) ||
            !mongoose.Types.ObjectId.isValid(userId) ||
            !mongoose.Types.ObjectId.isValid(roleId)) {
            return res.status(400).json({
                ok: false,
                msg: 'IDs inválidos'
            });
        }

        const proyecto = await Project.findOne({
            _id: id,
            owner: ownerId,
            isActive: true
        }).populate('category', 'name description'); // AGREGAR POPULATE

        if (!proyecto) {
            return res.status(404).json({
                ok: false,
                msg: 'Proyecto no encontrado o no tienes permisos'
            });
        }

        const yaMiembro = proyecto.members.some(member =>
            member.user.toString() === userId
        );

        if (yaMiembro) {
            return res.status(400).json({
                ok: false,
                msg: 'El usuario ya es miembro del proyecto'
            });
        }

        // OBTENER DATOS DEL USUARIO INVITADO
        const usuarioInvitado = await Usuario.findById(userId)
            .select('firstName lastName email');

        if (!usuarioInvitado) {
            return res.status(404).json({
                ok: false,
                msg: 'Usuario no encontrado'
            });
        }

        proyecto.members.push({
            user: userId,
            role: roleId,
            joinedAt: new Date()
        });

        await proyecto.save();

        // ENVIAR NOTIFICACIÓN POR EMAIL
        try {
            await notificarInvitacionProyecto(
                {
                    name: proyecto.name,
                    description: proyecto.description,
                    category: proyecto.category
                },
                usuarioInvitado,
                req.usuario
            );
        } catch (emailError) {
            console.error('Error enviando invitación por email:', emailError);
            // No fallar la operación si el email no se puede enviar
        }

        await proyecto.populate('members.user', 'firstName lastName email');
        await proyecto.populate('members.role', 'name');

        res.json({
            ok: true,
            msg: 'Miembro agregado exitosamente',
            members: proyecto.members
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Error al agregar miembro',
            error: error.message
        });
    }
};

const removerMiembro = async (req, res) => {
    try {
        const { id, userId } = req.params;
        const ownerId = req.usuario._id;

        if (!mongoose.Types.ObjectId.isValid(id) ||
            !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                ok: false,
                msg: 'IDs inválidos'
            });
        }

        const proyecto = await Project.findOne({
            _id: id,
            owner: ownerId,
            isActive: true
        });

        if (!proyecto) {
            return res.status(404).json({
                ok: false,
                msg: 'Proyecto no encontrado o no tienes permisos'
            });
        }

        const miembroIndex = proyecto.members.findIndex(member =>
            member.user.toString() === userId
        );

        if (miembroIndex === -1) {
            return res.status(400).json({
                ok: false,
                msg: 'El usuario no es miembro del proyecto'
            });
        }

        proyecto.members.splice(miembroIndex, 1);
        await proyecto.save();

        res.json({
            ok: true,
            msg: 'Miembro removido exitosamente',
            members: proyecto.members
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Error al remover miembro',
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

        const proyecto = await Project.findOne({
            _id: id,
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

        const proyectoActualizado = await Project.findByIdAndUpdate(
            id,
            { status: statusId },
            { new: true, runValidators: true }
        )
            .populate('status', 'name description')
            .populate('owner', 'firstName lastName email');

        res.json({
            ok: true,
            msg: 'Estado del proyecto actualizado exitosamente',
            proyecto: {
                _id: proyectoActualizado._id,
                name: proyectoActualizado.name,
                status: proyectoActualizado.status,
                owner: proyectoActualizado.owner,
                updatedAt: proyectoActualizado.updatedAt
            }
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Error al cambiar estado del proyecto',
            error: error.message
        });
    }
};

export default {
    listarProyectos,
    crearProyecto,
    obtenerProyecto,
    actualizarProyecto,
    eliminarProyecto,
    agregarMiembro,
    removerMiembro,
    cambiarEstado
};