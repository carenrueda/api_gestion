import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import url from 'url';
import fs from 'fs';

const subirArchivo = (files, extensionesValidas = ['png', 'jpg', 'jpeg', 'gif', 'webp']) => {
    return new Promise((resolve, reject) => {
        if (!files) {
            return reject('No se ha seleccionado ningún archivo');
        }

        const { archivo } = files;
        const nombreCortado = archivo.name.split('.');
        const extension = nombreCortado[nombreCortado.length - 1].toLowerCase();

        if (!extensionesValidas.includes(extension)) {
            return reject(`La extensión ${extension} no es permitida, solo [${extensionesValidas.join(', ')}]`);
        }

        // Validar tamaño (5MB máximo)
        if (archivo.size > 5 * 1024 * 1024) {
            return reject('El archivo es demasiado grande. Máximo 5MB');
        }

        const nombreTemp = uuidv4() + "." + extension;
        const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
        const uploadPath = path.join(__dirname, '../uploads/', nombreTemp);

        // Crear directorio si no existe
        const uploadsDir = path.join(__dirname, '../uploads/');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        archivo.mv(uploadPath, (err) => {
            if (err) {
                console.error('Error moviendo archivo:', err);
                return reject('Error al guardar el archivo');
            }
            return resolve(nombreTemp);
        });
    });
};

export default subirArchivo;