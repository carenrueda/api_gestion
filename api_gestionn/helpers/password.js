// helpers/password.js
import bcrypt from "bcryptjs";

// Hashear contraseña
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Comparar contraseñas
export const comparePassword = async (password, hashed) => {
  return await bcrypt.compare(password, hashed);
};
