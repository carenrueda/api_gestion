import jwt from "jsonwebtoken";

const generarJWT = (id) => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      { id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }, // expira en 1 día
      (err, token) => {
        if (err) {
          reject("No se pudo generar el token");
        } else {
          resolve(token);
        }
      }
    );
  });
};

export default generarJWT;