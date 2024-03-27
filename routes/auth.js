const jwt = require("jsonwebtoken");
const config = require("../config");
const { connect } = require("../connect");
const { secret } = config;
// TODO: Authenticate the user
    // It is necessary to confirm if the email and password
    // match a user in the database
    // If they match, send an access token created with JWT
module.exports = (app, nextMain) => {
  app.post("/login", async (req, resp, next) => {

    const { password ,email} = req.body;
    if (!email || !password) {
      console.log('Datos no existen');
      return next(400);
    }
    // La función sign es parte de la librería JWT y se utiliza para firmar un token JWT 
    // utilizando un secreto o clave privada,toma tres argumentos:Payload,clave secreta y opciones
    
    const db =  await connect(); // Obtener la instancia de la base de datos
    const collection = db.collection("users"); 
    const userEmail = await collection.findOne({ email});
    const userPassword = await collection.findOne({password});
    

    if (userEmail === null || userEmail === undefined){
      return resp.status(404).json({ message: "Email Incorrecto" });  
    }
    
    // if (!userPassword){
    //   return resp.status(404).json({ message: "Email Incorrecto" });  
    // }
    const token = jwt.sign(
        { email },
        secret,
        { expiresIn: "1h" },
        // console.log(secret),
      );
      console.log('Token JWT creado exitosamente');
      return resp.status(200).json({ token });  
    
    
    // next();
  });
  return nextMain();
};
