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
    try {
    if (req.user.role !== 'admin'){
        return resp.status(403).json({ error: "El usuario no tiene permisos para consultar la información"})
    }
      const db = await connect(); // Obtener la instancia de la base de datos
    const collection = db.collection("users");
    // Devolver todos los usuarios-Recupera todos los usuarios
    const users = await collection.find({}).toArray();
    resp.json(users)
  }
  catch(error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
  },
  
  createUser: async (req, resp, next) => {
    try {
      const db = await connect();
      const collection = db.collection("users");
      const { email, password, role } = req.body;

      // Obtener el rol del usuario actual (si está disponible)
      const userRole = req.user.role;

      // Verificar si el usuario tiene permisos de administrador
      if (userRole !== 'admin') {
        return resp.status(403).json({ error: "Solo los administradores pueden crear usuarios" });
      }

      if (!email || !password) {
        return resp.status(400).send("Falta llenar datos");
      }
      // validar el email y contraseña
      const validation = /^\w+([.-_+]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/;
      if (!validation.test(email)) {
        return resp.status(400).send("El formato del email no es válido");
      }

      const creatingUser = await collection.insertOne({
        email: email,
        password: password,
        role: role,
      });
      console.log(creatingUser);
      resp.json({
        _id: insertedId,
        email: email,
        role: role,}).send(
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
      return resp.send(founduser).status(200).send("usuario encontrado");
    }
    return resp.status(404).send("usuario no registrado");
  },
  modifyUser: async (req, resp, next) => {
    const db = await connect();
    const collection = db.collection("users");
    const { email, password, roles } = req.body;
    const { uid } = req.params;
    const founduser = collection.find((user) => user.uid === uid);

    if (!validationAdmin(req, resp)) {
      return resp.status(403).send("No tiene acceso");
    }
    if (founduser !== founduser.uid) {
      return resp.status(404).send("Usuario no registrado");
    }
    if (password === password.uid) {
      return resp.status(400).send("No hay datos para actualizar");
    }
  },
};
