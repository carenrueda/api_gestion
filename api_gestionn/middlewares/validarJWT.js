import jwt from "jsonwebtoken";
import Usuario from "../models/Users.js";

const validarJWT = async (req, res, next) => {
  const token = req.header("x-token");

  if (!token) {
    return res.status(401).json({ ok: false,
      msg: "No hay token en la petición" });
  }

  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findById(id).populate('globalRole', 'name');

    if (!usuario || !usuario.isActive) {
      return res.status(401).json({
        ok: false,
        msg: 'Token inválido - usuario no existe o está inactivo'
      });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    return res.status(401).json({ msg: "Token no válido", error: error.message });
  }
};

export default validarJWT;