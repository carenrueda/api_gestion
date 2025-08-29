import Role from '../models/role.js';

const listarRoles = async (req, res) => {
  try {
    const roles = await Role.find({ isActive: true });

    res.json({
      ok: true,
      roles
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      msg: 'Error al obtener roles',
      error: error.message
    });
  }
};

const crearRol = async (req, res) => {
  try {
    const { name, description } = req.body;

    const rolExistente = await Role.findOne({ name });
    if (rolExistente) {
      return res.status(400).json({
        ok: false,
        msg: 'El rol ya existe'
      });
    }

    const nuevoRol = new Role({
      name,
      description
    });

    await nuevoRol.save();

    res.status(201).json({
      ok: true,
      msg: 'Rol creado correctamente',
      rol: nuevoRol
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      msg: 'Error al crear rol',
      error: error.message
    });
  }
};

const actualizarRol = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const rolActualizado = await Role.findByIdAndUpdate(
      id,
      { name, description },
      { new: true }
    );

    if (!rolActualizado) {
      return res.status(404).json({
        ok: false,
        msg: 'Rol no encontrado'
      });
    }

    res.json({
      ok: true,
      msg: 'Rol actualizado correctamente',
      rol: rolActualizado
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      msg: 'Error al actualizar rol',
      error: error.message
    });
  }
};

const eliminarRol = async (req, res) => {
  try {
    const { id } = req.params;

    const rolEliminado = await Role.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!rolEliminado) {
      return res.status(404).json({
        ok: false,
        msg: 'Rol no encontrado'
      });
    }

    res.json({
      ok: true,
      msg: 'Rol eliminado correctamente'
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      msg: 'Error al eliminar rol',
      error: error.message
    });
  }
};



export default {
  listarRoles,
  crearRol,
  actualizarRol,
  eliminarRol
};