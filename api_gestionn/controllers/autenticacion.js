import Usuario from '../models/Users.js';
import Role from '../models/role.js';
import generarJWT from '../helpers/generarJWT.js';
import jwt from 'jsonwebtoken';
import { isValidEmail } from '../helpers/validaremail.js';
import { hashPassword, comparePassword } from '../helpers/password.js';
import { sendEmail, emailTemplates } from '../helpers/serviceEmail.js';

// Función para crear roles iniciales
const crearRolesIniciales = async () => {
  const roles = [
    { name: 'Admin', description: 'Administrador del sistema con todos los permisos' },
    { name: 'Project Manager', description: 'Gestor de proyectos con permisos de administración de proyectos' },
    { name: 'Developer', description: 'Desarrollador con permisos para trabajar en tareas' },
    { name: 'Viewer', description: 'Usuario con permisos de solo lectura' }
  ];

  for (const rolData of roles) {
    const rolExistente = await Role.findOne({ name: rolData.name });
    if (!rolExistente) {
      const nuevoRol = new Role(rolData);
      await nuevoRol.save();
      console.log(`Rol ${rolData.name} creado`);
    }
  }
};

// Registro
const registrar = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        ok: false,
        msg: "Todos los campos son obligatorios"
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        ok: false,
        msg: "Formato de correo inválido"
      });
    }

    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({
        ok: false,
        msg: "El correo ya está registrado"
      });
    }

    // Obtener rol por defecto (Viewer)
    let rolPorDefecto = await Role.findOne({ name: 'Viewer', isActive: true });

    // Si no existe el rol Viewer, crear los roles básicos
    if (!rolPorDefecto) {
      await crearRolesIniciales();
      rolPorDefecto = await Role.findOne({ name: 'Viewer', isActive: true });
    }

    const hashedPassword = await hashPassword(password);

    const nuevoUsuario = new Usuario({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      globalRole: rolPorDefecto._id,
      isEmailVerified: false
    });

    await nuevoUsuario.save();

     try {
      const welcomeEmail = emailTemplates.welcome({
        firstName: firstName,
        lastName: lastName,
        email: email,
        role: rolPorDefecto.name
      });
      
      await sendEmail(
        email, 
        '¡Bienvenido al Sistema de Gestión de Proyectos!', 
        welcomeEmail
      );
      console.log(`📧 Correo de bienvenida enviado a ${email}`);
    } catch (emailError) {
      console.error('Error enviando correo de bienvenida:', emailError);
      // No fallar el registro si el correo no se puede enviar
    }

    res.status(201).json({
      ok: true,
      msg: "Usuario registrado correctamente"
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      msg: "Error al registrar usuario",
      error: error.message
    });
  }
};
  

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const usuario = await Usuario.findOne({ email, isActive: true })
      .populate('globalRole', 'name description');

    if (!usuario) {
      return res.status(400).json({
        ok: false,
        msg: 'Usuario no encontrado o inactivo'
      });
    }

    const validPassword = await comparePassword(password, usuario.password);
    if (!validPassword) {
      return res.status(400).json({
        ok: false,
        msg: 'Contraseña incorrecta'
      });
    }

    usuario.lastLogin = new Date();
    await usuario.save();

    const token = await generarJWT(usuario._id);

    res.json({
      ok: true,
      usuario: {
        id: usuario._id,
        email: usuario.email,
        firstName: usuario.firstName,
        lastName: usuario.lastName,
        globalRole: usuario.globalRole
      },
      token
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      msg: 'Error al iniciar sesión',
      error: err.message
    });
  }
};

// Refresh token
const refresh = async (req, res) => {
  const { token } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const nuevoToken = await generarJWT(decoded.id);
    res.json({
      ok: true,
      token: nuevoToken
    });
  } catch (err) {
    res.status(401).json({
      ok: false,
      msg: "Token inválido o expirado"
    });
  }
};

// Logout
const logout = async (req, res) => {
  res.json({
    ok: true,
    msg: 'Sesión cerrada correctamente'
  });
};

// Recuperación de contraseña (placeholder)
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  res.json({
    ok: true,
    msg: `Correo de recuperación enviado a ${email}`
  });
};

// Restablecer contraseña (placeholder)
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  res.json({
    ok: true,
    msg: 'Contraseña restablecida correctamente'
  });
};

export default {
  registrar,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword
};