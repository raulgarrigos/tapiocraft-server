const jwt = require("jsonwebtoken");

function isTokenValid(req, res, next) {
  try {
    const token = req.headers.authorization.split(" ")[1];
    console.log("Token recibido:", token); // Agregar este registro de depuración

    const payload = jwt.verify(token, process.env.TOKEN_SECRET);
    console.log("Payload decodificado:", payload); // Agregar este registro de depuración

    req.payload = payload;
    return next();
  } catch (error) {
    console.error("Error al verificar el token:", error); // Agregar este registro de depuración
    res.status(401).json("El token no existe o no es válido");
  }
}

module.exports = isTokenValid;
