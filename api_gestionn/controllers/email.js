import { sendEmail, emailTemplates } from '../helpers/serviceEmail.js';
import Usuario from '../models/Users.js';
import Project from '../models/projects.js';
import Task from '../models/tasks.js';

// Endpoint para probar envío de correos
const probarCorreo = async (req, res) => {
    try {
        const { destinatario, tipo = 'welcome' } = req.body;
        const usuario = req.usuario;

        if (!destinatario) {
            return res.status(400).json({
                ok: false,
                msg: 'El destinatario es obligatorio'
            });
        }

        let htmlContent = '';
        let subject = '';

        switch (tipo) {
            case 'welcome':
                subject = '¡Bienvenido al Sistema de Gestión de Proyectos!';
                htmlContent = emailTemplates.welcome({
                    firstName: usuario.firstName,
                    lastName: usuario.lastName,
                    email: usuario.email,
                    role: usuario.globalRole?.name || 'Usuario'
                });
                break;

            case 'test':
                subject = 'Correo de Prueba - Sistema Funcionando';
                htmlContent = emailTemplates.welcome({
                    firstName: 'Usuario',
                    lastName: 'de Prueba',
                    email: destinatario,
                    role: 'Tester'
                });
                break;

            default:
                return res.status(400).json({
                    ok: false,
                    msg: 'Tipo de correo no válido'
                });
        }

        const result = await sendEmail(destinatario, subject, htmlContent);

        if (result.success) {
            res.json({
                ok: true,
                msg: 'Correo enviado exitosamente',
                messageId: result.messageId
            });
        } else {
            res.status(500).json({
                ok: false,
                msg: 'Error al enviar correo',
                error: result.message
            });
        }

    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Error en el servidor',
            error: error.message
        });
    }
};

// Notificar nueva tarea asignada
const notificarTareaAsignada = async (taskData, assignedUser, assignedBy) => {
    try {
        if (!assignedUser.email) return;

        const subject = `Nueva tarea asignada: ${taskData.title}`;
        const htmlContent = emailTemplates.taskAssigned(taskData, assignedUser, assignedBy);

        await sendEmail(assignedUser.email, subject, htmlContent);
        console.log(`📧 Notificación de tarea enviada a ${assignedUser.email}`);
        
    } catch (error) {
        console.error('Error enviando notificación de tarea:', error);
    }
};

// Notificar invitación a proyecto
const notificarInvitacionProyecto = async (projectData, invitedUser, invitedBy) => {
    try {
        if (!invitedUser.email) return;

        const subject = `Invitación al proyecto: ${projectData.name}`;
        const htmlContent = emailTemplates.projectInvitation(projectData, invitedBy, invitedUser);

        await sendEmail(invitedUser.email, subject, htmlContent);
        console.log(`📧 Invitación de proyecto enviada a ${invitedUser.email}`);
        
    } catch (error) {
        console.error('Error enviando invitación de proyecto:', error);
    }
};

// Notificar nuevo comentario
const notificarNuevoComentario = async (commentData, projectData, author, recipients) => {
    try {
        const emails = recipients
            .filter(user => user.email && user._id.toString() !== author._id.toString())
            .map(user => user.email);


        if (emails.length === 0) return;

        const subject = `Nuevo comentario en: ${projectData.name}`;
        const htmlContent = emailTemplates.newComment(commentData, projectData, author, recipients);

        await sendEmail(emails, subject, htmlContent);
        console.log(`📧 Notificación de comentario enviada a ${emails.length} usuario(s)`);
        
    } catch (error) {
        console.error('Error enviando notificación de comentario:', error);
    }
};

export default {
    probarCorreo,
    notificarTareaAsignada,
    notificarInvitacionProyecto,
    notificarNuevoComentario
};

// Exportar funciones individuales para usar en otros controladores
export {
    notificarTareaAsignada,
    notificarInvitacionProyecto,
    notificarNuevoComentario
};