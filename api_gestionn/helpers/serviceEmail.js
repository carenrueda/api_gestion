import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configuración del transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Plantilla base HTML
const getBaseTemplate = (title, content) => {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #007bff;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .header h1 {
                color: #007bff;
                margin: 0;
            }
            .content {
                margin: 20px 0;
            }
            .button {
                display: inline-block;
                padding: 12px 24px;
                background-color: #007bff;
                color: white !important;
                text-decoration: none;
                border-radius: 5px;
                margin: 15px 0;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 14px;
            }
            .project-info {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 5px;
                margin: 15px 0;
            }
            .task-info {
                background: #e7f3ff;
                padding: 15px;
                border-radius: 5px;
                margin: 15px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📋 ${process.env.EMAIL_FROM_NAME || 'Gestión de Proyectos'}</h1>
            </div>
            <div class="content">
                ${content}
            </div>
            <div class="footer">
                <p>Este es un mensaje automático, por favor no responda a este correo.</p>
                <p>&copy; 2025 Sistema de Gestión de Proyectos</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

// Función principal para enviar correos
export const sendEmail = async (to, subject, htmlContent, textContent = '') => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('⚠️ Credenciales de email no configuradas');
            return { success: false, message: 'Credenciales de email no configuradas' };
        }

        const transporter = createTransporter();
        
        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME || 'Sistema'}" <${process.env.EMAIL_USER}>`,
            to: Array.isArray(to) ? to.join(', ') : to,
            subject: subject,
            text: textContent,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Correo enviado:', info.messageId);
        
        return { 
            success: true, 
            messageId: info.messageId,
            message: 'Correo enviado exitosamente'
        };

    } catch (error) {
        console.error('❌ Error enviando correo:', error);
        return { 
            success: false, 
            message: error.message,
            error: error 
        };
    }
};

// Plantillas específicas
export const emailTemplates = {
    
    // Bienvenida de usuario
    welcome: (userData) => {
        const content = `
            <h2>¡Bienvenido ${userData.firstName}! 🎉</h2>
            <p>Tu cuenta ha sido creada exitosamente en nuestro sistema de gestión de proyectos.</p>
            
            <div class="project-info">
                <h3>📧 Detalles de tu cuenta:</h3>
                <p><strong>Nombre:</strong> ${userData.firstName} ${userData.lastName}</p>
                <p><strong>Email:</strong> ${userData.email}</p>
                <p><strong>Rol:</strong> ${userData.role}</p>
            </div>
            
            <p>Ya puedes comenzar a crear y gestionar proyectos.</p>
            <p>Si tienes alguna duda, no dudes en contactarnos.</p>
        `;
        
        return getBaseTemplate('Bienvenido al Sistema', content);
    },

    // Invitación a proyecto
    projectInvitation: (projectData, invitedUser, invitedBy) => {
    const content = `
        <h2>📋 Invitación a Proyecto</h2>
        <p>¡Hola ${invitedUser.firstName}!</p>
        <p><strong>${invitedBy.firstName} ${invitedBy.lastName}</strong> te ha invitado a colaborar en un proyecto.</p>
        
        <div class="project-info">
            <h3>📂 Detalles del Proyecto:</h3>
            <p><strong>Nombre:</strong> ${projectData.name}</p>
            <p><strong>Descripción:</strong> ${projectData.description}</p>
            <p><strong>Categoría:</strong> ${projectData.category?.name || 'Sin categoría'}</p>
            <p><strong>Propietario:</strong> ${invitedBy.firstName} ${invitedBy.lastName}</p>
        </div>
        
        <p>Inicia sesión en el sistema para empezar a trabajar en este proyecto.</p>
    `;
    
    return getBaseTemplate('Invitación a Proyecto', content);
},

    // Nueva tarea asignada
    taskAssigned: (taskData, assignedUser, assignedBy) => {
        const priorityColor = {
            'Low': '#28a745',
            'Medium': '#ffc107',
            'High': '#fd7e14',
            'Critical': '#dc3545'
        };

        const content = `
            <h2>📋 Nueva Tarea Asignada</h2>
            <p>¡Hola ${assignedUser.firstName}!</p>
            <p><strong>${assignedBy.firstName} ${assignedBy.lastName}</strong> te ha asignado una nueva tarea.</p>
            
            <div class="task-info">
                <h3>✅ Detalles de la Tarea:</h3>
                <p><strong>Título:</strong> ${taskData.title}</p>
                <p><strong>Descripción:</strong> ${taskData.description}</p>
                <p><strong>Prioridad:</strong> 
                    <span style="color: ${priorityColor[taskData.priority] || '#6c757d'};">
                        ${taskData.priority}
                    </span>
                </p>
                <p><strong>Horas estimadas:</strong> ${taskData.estimatedHours || 0} horas</p>
                ${taskData.dueDate ? `<p><strong>Fecha límite:</strong> ${new Date(taskData.dueDate).toLocaleDateString('es-ES')}</p>` : ''}
                <p><strong>Proyecto:</strong> ${taskData.project?.name || 'N/A'}</p>
            </div>
            
            <p>Inicia sesión para ver más detalles y comenzar a trabajar.</p>
        `;
        
        return getBaseTemplate('Nueva Tarea Asignada', content);
    },

    // Recordatorio de tarea vencida
    taskOverdue: (taskData, assignedUser) => {
        const content = `
            <h2>⚠️ Tarea Vencida</h2>
            <p>¡Hola ${assignedUser.firstName}!</p>
            <p>Te recordamos que tienes una tarea que ha vencido y requiere tu atención.</p>
            
            <div class="task-info" style="border-left: 4px solid #dc3545;">
                <h3>📅 Tarea Vencida:</h3>
                <p><strong>Título:</strong> ${taskData.title}</p>
                <p><strong>Fecha límite:</strong> ${new Date(taskData.dueDate).toLocaleDateString('es-ES')}</p>
                <p><strong>Días vencidos:</strong> ${Math.floor((new Date() - new Date(taskData.dueDate)) / (1000 * 60 * 60 * 24))} días</p>
                <p><strong>Proyecto:</strong> ${taskData.project?.name || 'N/A'}</p>
            </div>
            
            <p>Por favor, actualiza el estado de la tarea lo antes posible.</p>
        `;
        
        return getBaseTemplate('Tarea Vencida - Recordatorio', content);
    },

    // Proyecto completado
    projectCompleted: (projectData, teamMembers) => {
        const content = `
            <h2>🎉 ¡Proyecto Completado!</h2>
            <p>Nos complace informarte que el proyecto ha sido completado exitosamente.</p>
            
            <div class="project-info" style="border-left: 4px solid #28a745;">
                <h3>✅ Proyecto Finalizado:</h3>
                <p><strong>Nombre:</strong> ${projectData.name}</p>
                <p><strong>Descripción:</strong> ${projectData.description}</p>
                <p><strong>Fecha de finalización:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
                <p><strong>Duración:</strong> ${Math.floor((new Date() - new Date(projectData.startDate)) / (1000 * 60 * 60 * 24))} días</p>
            </div>
            
            <p>Agradecemos la dedicación y el esfuerzo de todo el equipo para lograr este objetivo.</p>
            <p><strong>Equipo participante:</strong> ${teamMembers.map(member => `${member.firstName} ${member.lastName}`).join(', ')}</p>
        `;
        
        return getBaseTemplate('Proyecto Completado', content);
    },

    // Comentario en proyecto
    newComment: (commentData, projectData, author, recipients) => {
        const content = `
            <h2>💬 Nuevo Comentario en Proyecto</h2>
            <p><strong>${author.firstName} ${author.lastName}</strong> ha agregado un comentario en el proyecto.</p>
            
            <div class="project-info">
                <h3>📂 Proyecto:</h3>
                <p><strong>${projectData.name}</strong></p>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 15px 0;">
                <h4>💬 Comentario:</h4>
                <p style="font-style: italic;">"${commentData.content}"</p>
                <small style="color: #666;">
                    Por ${author.firstName} ${author.lastName} - ${new Date(commentData.createdAt).toLocaleString('es-ES')}
                </small>
            </div>
            
            <p>Inicia sesión para ver todos los comentarios y responder.</p>
        `;
        
        return getBaseTemplate('Nuevo Comentario', content);
    },

    // Recuperación de contraseña
    passwordReset: (userData, resetToken) => {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        
        const content = `
            <h2>🔐 Recuperación de Contraseña</h2>
            <p>¡Hola ${userData.firstName}!</p>
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
            
            <div class="project-info" style="border-left: 4px solid #ffc107;">
                <h3>⚠️ Instrucciones:</h3>
                <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
                <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
                <p><small>Este enlace expirará en 1 hora por seguridad.</small></p>
            </div>
            
            <p>Si no solicitaste este cambio, puedes ignorar este correo y tu contraseña permanecerá sin cambios.</p>
            
            <p><strong>Enlace alternativo:</strong><br>
            <small style="word-break: break-all;">${resetUrl}</small></p>
        `;
        
        return getBaseTemplate('Recuperación de Contraseña', content);
    }
};