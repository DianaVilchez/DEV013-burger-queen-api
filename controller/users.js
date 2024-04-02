const { connect } = require("../connect");
// const validator = require('validator');
// const users = require('../routes/users');

// Declara un array vacío para almacenar los usuarios
// let users = [];
const validationAdmin = (req, userId) => {
  if (req.user.roles !== "admin") {
    return false;
    // O return resp.status(403).send('No tiene acceso'); si deseas manejarlo directamente aquí
  }
  return true;
};
module.exports = {
  getUsers: async (req, resp, next) => {
    // TODO: Implementar la función necesaria para obtener la colección o tabla de usuarios
    const db = await connect(); // Obtener la instancia de la base de datos
    const collection = db.collection("users");
    // Devolver todos los usuarios
    const users = await collection.find({}).toArray();
    console.log(users);
    console.log(req.body);
    return resp.json(users);
  },

  createUser: async (req, resp, next) => {
    const db = await connect();
    const collection = db.collection("users");
    const { email, password } = req.body;

    if (!email || !password) {
      return resp.status(400).send("Falta llenar datos");
    }
    // validar el email y contraseña
    const validation = /^\w+([.-_+]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/;
    if (!validation.test(email)) {
      return resp.status(400).send("El formato del email no es válido");
    }
    try {
      await collection.insertOne({ email, password });
      resp.send(
        `Usuario con el nombre de usuario ${email} añadido a la base de datos!`
      );
    } catch (error) {
      console.error("Error al agregar usuario a la base de datos:", error);
      resp.status(500).send("Error interno del servidor");
    }
  },

  deleteUser: async (req, resp, next) => {
    const db = await connect();
    const collection = db.collection("users");
    const { email, password, roles } = req.body;
    const { uid } = req.params;
    const deleteUser = collection.find((user) => user.uid === uid);

    if (!validationAdmin(req, userId)) {
      return resp.status(403).send("No tiene acceso");
    }
    if (deleteUser === deleteUser.uid) {
      resp.status(200).send("usuario eliminado");
    } else {
      resp.status(404).send("usuario no registrado");
    }
  },
  findUserById: async (req, resp, next) => {
    // 403 el que intenta acceder no es admin
    // 401 cuando no hay autenticacion
    // 404 id no encontrado por que no esta registrado
    const db = await connect();
    const collection = db.collection("users");
    const { email, password, roles } = req.body;
    const { uid } = req.params;
    const founduser = collection.find((user) => user.uid === uid);

    if (!validationAdmin(req, resp)) {
      return resp.status(403).send("No tiene acceso");
    }
    if (founduser === founduser.uid) {
      resp.send(founduser).status(200).send("usuario encontrado");
    } else {
      resp.status(404).send("usuario no registrado");
    }
  },
  modifyUser: async (req, resp, next) => {

  }
};
