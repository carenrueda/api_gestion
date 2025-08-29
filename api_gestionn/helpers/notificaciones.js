import { sendEmail, emailTemplates } from './serviceEmail.js';

export const enviarNotificacionSegura = async (tipo, datos) => {
    try {
        let resultado;
        
        switch (tipo) {
            case 'tarea_asignada':
                resultado = await sendEmail(
                    datos.destinatario.email,
                    `Nueva tarea asignada: ${datos.tarea.title}`,
                    emailTemplates.taskAssigned(datos.tarea, datos.destinatario, datos.asignadoPor)
                );
                break;
                
            case 'invitacion_proyecto':
                resultado = await sendEmail(
                    datos.destinatario.email,
                    `Invitación al proyecto: ${datos.proyecto.name}`,
                    emailTemplates.projectInvitation(datos.proyecto, datos.destinatario, datos.invitadoPor)
                );
                break;
                
            case 'nuevo_comentario':
                const emails = datos.destinatarios
                    .filter(user => user.email && user._id.toString() !== datos.autor._id.toString())
                    .map(user => user.email);
                
                if (emails.length > 0) {
                    resultado = await sendEmail(
                        emails,
                        `Nuevo comentario en: ${datos.proyecto.name}`,
                        emailTemplates.newComment(datos.comentario, datos.proyecto, datos.autor, datos.destinatarios)
                    );
                }
                break;
        }
        
        if (resultado && resultado.success) {
            console.log(`✅ Notificación ${tipo} enviada exitosamente`);
        }
        
    } catch (error) {
        console.error(`❌ Error enviando notificación ${tipo}:`, error);
    }
};