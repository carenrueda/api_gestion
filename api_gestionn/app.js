
import express from "express";
import roleRoutes from "./routes/roles.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./routes/autenticacion.js";
import projectRoutes from "./routes/proyectos.js";
import sistemaRoutes from "./routes/sistema.js";
import usuarioRoutes from "./routes/usuarios.js";
import categoriasRoutes from "./routes/categorias.js";
import tareasRoutes from "./routes/tareas.js";
import comentariosRoutes from "./routes/comentarios.js";
import estadosRoutes from "./routes/estados.js";
import iaRoutes from "./routes/inteligenciaArtificial.js";
import uploadsRoutes from "./routes/uploads.js";
import emailRoutes from "./routes/email.js"; // NUEVA IMPORTACIÓN
import fileUpload from 'express-fileupload';
import path from 'path';
import url from 'url';
import { initializeStates } from "./utils/stateInitializer.js"; 

dotenv.config();
const app = express();

// Validar configuración de email
const validarConfigEmail = () => {
    const requeridos = ['EMAIL_USER', 'EMAIL_PASS', 'EMAIL_SERVICE'];
    const faltantes = requeridos.filter(key => !process.env[key]);
    
    if (faltantes.length > 0) {
        console.warn(`⚠️  Configuración de email incompleta. Faltan: ${faltantes.join(', ')}`);
        console.warn('Las notificaciones por email no funcionarán correctamente.');
        return false;
    }
    
    console.log('✅ Configuración de email válida');
    return true;
};

validarConfigEmail();

// Middlewares
app.use(express.json());

app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: './tmp/',
    limits: { fileSize: 50 * 1024 * 1024 },
    abortOnLimit: true,
    responseOnLimit: 'El archivo es demasiado grande',
    createParentPath: true
}));

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/users", usuarioRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/system", sistemaRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", tareasRoutes);
app.use("/api/comments", comentariosRoutes);
app.use("/api/states", estadosRoutes);
app.use("/api/ai", iaRoutes);
app.use("/api/uploads", uploadsRoutes);
app.use("/api/email", emailRoutes); // NUEVA RUTA

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB conectado");

    await initializeStates(); 

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    });

  } catch (err) {
    console.error("❌ Error al iniciar la aplicación:", err);
    process.exit(1);
  }
}

startServer();