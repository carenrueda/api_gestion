// middlewares/autorizacion.js
import Role from '../models/role.js';

// Middleware para verificar si el usuario es Admin
const esAdmin = async (req, res, next) => {
  try {
    const usuario = req.usuario;
    
    // Obtener el rol del usuario
    const rol = await Role.findById(usuario.globalRole);
    
    if (!rol || rol.name !== 'Admin') {
      return res.status(403).json({
        ok: false,
        msg: 'Acceso denegado. Se requieren permisos de administrador.'
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({
      ok: false,
      msg: 'Error al verificar permisos',
      error: error.message
    });
  }
};

// Middleware para verificar roles múltiples
const tieneRol = (...rolesPermitidos) => {
  return async (req, res, next) => {
    try {
      const usuario = req.usuario;
      
      // Obtener el rol del usuario
      const rol = await Role.findById(usuario.globalRole);
      
      if (!rol || !rolesPermitidos.includes(rol.name)) {
        return res.status(403).json({
          ok: false,
          msg: `Acceso denegado. Se requiere uno de estos roles: ${rolesPermitidos.join(', ')}`
        });
      }
      
      next();
    } catch (error) {
      return res.status(500).json({
        ok: false,
        msg: 'Error al verificar permisos',
        error: error.message
      });
    }
  };
};

export { esAdmin, tieneRol };