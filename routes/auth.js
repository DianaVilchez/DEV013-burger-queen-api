const jwt = require("jsonwebtoken");
const config = require("../config");
const { connect } = require("../connect");
const bcrypt = require("bcrypt");

const { secret } = config;
// TODO: Autenticar al usuario
// Es necesario confirmar si el correo electrónico y la contraseña
// coincide con un usuario en la base de datos
// Si coinciden, envía un token de acceso creado con JWT
module.exports = (app, nextMain) => {
  app.post("/login", async (req, resp, next) => {
    const { password, email } = req.body;
    if (!email || !password) {
      console.log("Falta informacion");
      return resp.status(400).json({error:"Datos no ingresados"});
    }
    // La función sign es parte de la librería JWT y se utiliza para firmar un token JWT
    // utilizando un secreto o clave privada,toma tres argumentos:Payload,clave secreta y opciones

    const db = await connect(); // Obtener la instancia de la base de datos
    const collection = db.collection("users");
    const userEmail = await collection.findOne({ email });
    // const userPassword = await collection.findOne({password});

    if (!userEmail) {
      return resp.status(404).json({ message: "Email Incorrecto" });
    }
    const { _id, role } = userEmail;
    // const validationPassword = await bcrypt.compare(password, userEmail.password)
    // if (!validationPassword) {
    //   return resp.status(404).json({ message: "password incorrecto" });
    // }
    const token = jwt.sign(
      { email, 
        role:userEmail.role, 
        uid:userEmail._id},
      secret,
      { expiresIn: "1h" }
      // console.log(secret),
    );
    console.log("Token JWT creado exitosamente");
    return resp.status(200).json({
      token: token,
      user: {
        id: _id,
        email: email,
        role: role,
      },
    });

    // next();
  });
  return nextMain();
};
