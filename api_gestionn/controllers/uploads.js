import subirArchivo from '../helpers/subirArchivo.js';
import Usuario from '../models/Users.js';
import Project from '../models/projects.js';
import path from 'path';
import url from 'url';
import fs from 'fs';
import cloudinary from 'cloudinary';

// Configuración de Cloudinary (debe estar en .env)
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
    secure: true
});

// Cargar avatar de usuario - Servidor propio
const cargarAvatarUsuario = async (req, res) => {
    try {
        const userId = req.usuario._id;

        if (!req.files || !req.files.archivo) {
            return res.status(400).json({
                ok: false,
                msg: 'No se ha seleccionado ningún archivo para el usuario'
            });
        }

        // Subir archivo
        const nombre = await subirArchivo(req.files, ['png', 'jpg', 'jpeg', 'gif', 'webp']);
        
        // Obtener usuario actual
        let usuario = await Usuario.findById(userId);
        
        // Si el usuario ya tiene avatar, eliminar el anterior
        if (usuario.avatar) {
            const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
            const pathImage = path.join(__dirname, '../uploads/', usuario.avatar);
            
            if (fs.existsSync(pathImage)) {
                fs.unlinkSync(pathImage);
            }
        }

        // Actualizar usuario con el nuevo avatar
        usuario = await Usuario.findByIdAndUpdate(
            userId, 
            { avatar: nombre },
            { new: true }
        ).populate('globalRole', 'name description').select('-password');

        res.json({
            ok: true,
            msg: 'Avatar actualizado exitosamente',
            usuario,
            avatar: nombre
        });
    } catch (error) {
        console.error('Error en cargarAvatarUsuario:', error);
        res.status(400).json({
            ok: false,
            msg: error.toString()
        });
    }
};

// Mostrar imagen de usuario
const mostrarImagenUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        
        const usuario = await Usuario.findById(id);
        
        if (!usuario || !usuario.avatar) {
            return res.status(404).json({
                ok: false,
                msg: 'Usuario no encontrado o sin avatar'
            });
        }

        const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
        const pathImage = path.join(__dirname, '../uploads/', usuario.avatar);
        
        if (fs.existsSync(pathImage)) {
            return res.sendFile(pathImage);
        }
        
        res.status(404).json({
            ok: false,
            msg: 'Imagen no encontrada'
        });
    } catch (error) {
        res.status(400).json({
            ok: false,
            msg: 'Error al mostrar imagen',
            error: error.message
        });
    }
};

// Cargar imagen de proyecto - Cloudinary
const cargarImagenProyecto = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.usuario._id;

        if (!req.files || !req.files.archivo) {
            return res.status(400).json({
                ok: false,
                msg: 'No se ha seleccionado ningún archivo'
            });
        }

        // Verificar que el usuario tiene acceso al proyecto
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

        const { tempFilePath } = req.files.archivo;

        // Subir a Cloudinary
        const result = await cloudinary.v2.uploader.upload(tempFilePath, {
            folder: `proyectos/${projectId}`,
            width: 800,
            height: 600,
            crop: "limit",
            quality: "auto"
        });

        // Si el proyecto ya tenía imagen, eliminar la anterior de Cloudinary
        if (proyecto.imageUrl) {
            try {
                const urlParts = proyecto.imageUrl.split('/');
                const publicIdWithExtension = urlParts[urlParts.length - 1];
                const publicId = `proyectos/${projectId}/${publicIdWithExtension.split('.')[0]}`;
                await cloudinary.v2.uploader.destroy(publicId);
            } catch (deleteError) {
                console.error('Error eliminando imagen anterior:', deleteError);
            }
        }

        // Actualizar proyecto con la nueva URL
        const proyectoActualizado = await Project.findByIdAndUpdate(
            projectId,
            { imageUrl: result.secure_url },
            { new: true }
        ).populate('owner', 'firstName lastName email')
          .populate('category', 'name')
          .populate('status', 'name');

        res.json({
            ok: true,
            msg: 'Imagen de proyecto actualizada exitosamente',
            proyecto: proyectoActualizado,
            imageUrl: result.secure_url
        });

    } catch (error) {
        console.error('Error en cargarImagenProyecto:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al subir imagen',
            error: error.message
        });
    }
};

// Cargar múltiples archivos para tareas
const cargarArchivosMultiples = async (req, res) => {
    try {
        const userId = req.usuario._id;
        
        if (!req.files) {
            return res.status(400).json({
                ok: false,
                msg: 'No se han seleccionado archivos'
            });
        }

        const archivos = Array.isArray(req.files.archivos) 
            ? req.files.archivos 
            : [req.files.archivos];

        const archivosSubidos = [];
        const errores = [];

        for (let i = 0; i < archivos.length; i++) {
            try {
                const archivo = archivos[i];
                
                // Crear un objeto files temporal para usar con subirArchivo
                const filesTemp = { archivo };
                const nombre = await subirArchivo(filesTemp, ['png', 'jpg', 'jpeg', 'gif', 'pdf', 'doc', 'docx']);
                
                archivosSubidos.push({
                    nombre: nombre,
                    nombreOriginal: archivo.name,
                    size: archivo.size,
                    tipo: archivo.mimetype
                });
            } catch (error) {
                errores.push({
                    archivo: archivos[i].name,
                    error: error.toString()
                });
            }
        }

        res.json({
            ok: true,
            msg: `${archivosSubidos.length} archivos subidos exitosamente`,
            archivos: archivosSubidos,
            errores: errores.length > 0 ? errores : undefined
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Error al subir archivos',
            error: error.message
        });
    }
};

// Eliminar imagen
const eliminarImagen = async (req, res) => {
    try {
        const { tipo, id } = req.params; // tipo: 'usuario' | 'proyecto'
        const userId = req.usuario._id;

        if (tipo === 'usuario') {
            if (id !== userId.toString()) {
                return res.status(403).json({
                    ok: false,
                    msg: 'Solo puedes eliminar tu propio avatar'
                });
            }

            const usuario = await Usuario.findById(id);
            if (usuario && usuario.avatar) {
                const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
                const pathImage = path.join(__dirname, '../uploads/', usuario.avatar);
                
                if (fs.existsSync(pathImage)) {
                    fs.unlinkSync(pathImage);
                }

                await Usuario.findByIdAndUpdate(id, { avatar: '' });
            }
        } else if (tipo === 'proyecto') {
            const proyecto = await Project.findOne({
                _id: id,
                $or: [{ owner: userId }, { 'members.user': userId }],
                isActive: true
            });

            if (!proyecto) {
                return res.status(404).json({
                    ok: false,
                    msg: 'Proyecto no encontrado o no tienes acceso'
                });
            }

            if (proyecto.imageUrl) {
                try {
                    const urlParts = proyecto.imageUrl.split('/');
                    const publicIdWithExtension = urlParts[urlParts.length - 1];
                    const publicId = `proyectos/${id}/${publicIdWithExtension.split('.')[0]}`;
                    await cloudinary.v2.uploader.destroy(publicId);
                } catch (deleteError) {
                    console.error('Error eliminando de Cloudinary:', deleteError);
                }

                await Project.findByIdAndUpdate(id, { imageUrl: '' });
            }
        }

        res.json({
            ok: true,
            msg: 'Imagen eliminada exitosamente'
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Error al eliminar imagen',
            error: error.message
        });
    }
};

export default {
    cargarAvatarUsuario,
    mostrarImagenUsuario,
    cargarImagenProyecto,
    cargarArchivosMultiples,
    eliminarImagen
};