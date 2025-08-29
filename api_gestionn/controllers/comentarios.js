import Comment from '../models/comments.js';
import Project from '../models/projects.js';
import Usuario from '../models/Users.js';
import mongoose from 'mongoose';
import { notificarNuevoComentario } from './email.js'; 


const listarComentarios = async (req, res) => {
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

        const comentarios = await Comment.find({
            projectId: id
        })
            .populate('author', 'firstName lastName email avatar')
            .sort({ createdAt: -1 });

        res.json({
            ok: true,
            comentarios,
            total: comentarios.length
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Error al listar comentarios',
            error: error.message
        });
    }
};


const crearComentario = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.usuario._id;

        // Validaciones básicas
        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                ok: false,
                msg: 'El contenido del comentario es obligatorio'
            });
        }

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
        .populate('owner', 'firstName lastName email') // AGREGAR POPULATE
        .populate('members.user', 'firstName lastName email'); // AGREGAR POPULATE

        if (!proyecto) {
            return res.status(404).json({
                ok: false,
                msg: 'Proyecto no encontrado o no tienes acceso'
            });
        }

        const nuevoComentario = new Comment({
            content: content.trim(),
            author: userId,
            projectId: id
        });

        await nuevoComentario.save();

        await nuevoComentario.populate('author', 'firstName lastName email avatar');

        // ENVIAR NOTIFICACIONES POR EMAIL
        try {
            // Crear lista de destinatarios (owner + miembros, excluyendo al autor)
            const destinatarios = [];
            
            // Agregar owner si no es el autor
            if (proyecto.owner._id.toString() !== userId.toString()) {
                destinatarios.push(proyecto.owner);
            }
            
            // Agregar miembros que no sean el autor
            proyecto.members.forEach(member => {
                if (member.user._id.toString() !== userId.toString()) {
                    destinatarios.push(member.user);
                }
            });

            if (destinatarios.length > 0) {
                await notificarNuevoComentario(
                    {
                        content: nuevoComentario.content,
                        createdAt: nuevoComentario.createdAt
                    },
                    {
                        name: proyecto.name,
                        description: proyecto.description
                    },
                    nuevoComentario.author,
                    destinatarios
                );
            }
        } catch (emailError) {
            console.error('Error enviando notificación de comentario:', emailError);
            // No fallar la operación si el email no se puede enviar
        }

        res.status(201).json({
            ok: true,
            msg: 'Comentario creado exitosamente',
            comentario: nuevoComentario
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Error al crear comentario',
            error: error.message
        });
    }
};

const editarComentario = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.usuario._id;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                ok: false,
                msg: 'El contenido del comentario es obligatorio'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                msg: 'ID de comentario inválido'
            });
        }

        const comentario = await Comment.findById(id);

        if (!comentario) {
            return res.status(404).json({
                ok: false,
                msg: 'Comentario no encontrado'
            });
        }

        if (comentario.author.toString() !== userId.toString()) {
            return res.status(403).json({
                ok: false,
                msg: 'Solo puedes editar tus propios comentarios'
            });
        }

        const proyecto = await Project.findOne({
            _id: comentario.projectId,
            $or: [
                { owner: userId },
                { 'members.user': userId }
            ],
            isActive: true
        });

        if (!proyecto) {
            return res.status(403).json({
                ok: false,
                msg: 'Ya no tienes acceso a este proyecto'
            });
        }

        const comentarioActualizado = await Comment.findByIdAndUpdate(
            id,
            {
                content: content.trim(),
                editedAt: new Date()
            },
            { new: true, runValidators: true }
        ).populate('author', 'firstName lastName email avatar');

        res.json({
            ok: true,
            msg: 'Comentario actualizado exitosamente',
            comentario: comentarioActualizado
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Error al editar comentario',
            error: error.message
        });
    }
};


const eliminarComentario = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.usuario._id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                msg: 'ID de comentario inválido'
            });
        }

        const comentario = await Comment.findById(id)
            .populate('projectId', 'owner');

        if (!comentario) {
            return res.status(404).json({
                ok: false,
                msg: 'Comentario no encontrado'
            });
        }

        const esAutor = comentario.author.toString() === userId.toString();
        const esOwnerProyecto = comentario.projectId.owner.toString() === userId.toString();

        if (!esAutor && !esOwnerProyecto) {
            return res.status(403).json({
                ok: false,
                msg: 'No tienes permisos para eliminar este comentario'
            });
        }

        await Comment.findByIdAndDelete(id);

        res.json({
            ok: true,
            msg: 'Comentario eliminado exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Error al eliminar comentario',
            error: error.message
        });
    }
};

export default {
    listarComentarios,
    crearComentario,
    editarComentario,
    eliminarComentario
};