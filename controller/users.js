const { connect } = require("../connect");
const bcrypt = require("bcrypt");
// const validator = require('validator');
// const users = require('../routes/users');

// Declara un array vacío para almacenar los usuarios
// let users = [];
const validationAdmin = (req, resp) => {
  if (req.user.roles !== "admin") {
    return false;
    // O return resp.status(403).send('No tiene acceso'); si deseas manejarlo directamente aquí
  }
  return true;
};

const validationWaiter = (req, resp) => {
  if (req.user.roles === "waiter") {
    return false;
    // O return resp.status(403).send('No tiene acceso'); si deseas manejarlo directamente aquí
  }
  return true;
};

module.exports = {
  getUsers: async (req, resp, next) => {
    // TODO: Implementar la función necesaria para obtener la colección o tabla de usuarios
    try {
      const db = await connect(); // Obtener la instancia de la base de datos
      const collection = db.collection("users");

      // // Devolver todos los usuarios-Recupera todos los usuarios
      // const users = await collection.find({}).toArray();
      // resp.json(users);

      // if (!validationAdmin(req, resp)) {
      //   return resp.status(404).send("No tiene acceso");
      // }
      // Configurar la paginación
      const page = parseInt(req.query._page, 10) || 1; // Página actual
      const limit = parseInt(req.query._limit, 10) || 10; // Tamaño de página
      const startIndex = (page - 1) * limit; // Índice de inicio
      const endIndex = page * limit; // Índice de fin

      // Recuperar los usuarios de la página actual
      const users = await collection.find({}).toArray();

      // Verificar si hay resultados adicionales para la paginación
      const results = {};
      if (endIndex < users.length) {
        results.next = {
          page: page + 1,
          limit: limit,
        };
      }
      if (startIndex > 0) {
        results.previous = {
          page: page - 1,
          limit: limit,
        };
      }
      results.results = users.slice(startIndex, endIndex);

      // Enviar resultados al cliente
      resp.status(200).json(results.results);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      resp.status(500).json({ error: "Error interno del servidor" });
    }
  },
  createUser: async (req, resp, next) => {
    // should create new user (173 ms)
    // should create new admin user (183 ms)
    // should fail with 403 when user is already registered
    try {
      const db = await connect();
      const collection = db.collection("users");
      const { email, password, role } = req.body;

      if (!email || !password) {
        return resp.status(400).send("Falta llenar datos");
      }
      // validar el email y contraseña
      const validation = /^\w+([.-_+]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/;
      if (!validation.test(email)) {
        return resp.status(400).send("El formato del email no es válido");
      }
      if (password.trim().length < 4) {
        return resp
          .status(400)
          .json({ error: "La contraseña ingresada no es válida" });
      }
      // Verificar si el usuario ya está registrado
      const existingUser = await collection.findOne({ email: email });
      if (existingUser) {
        return resp
          .status(403)
          .json({ error: "El usuario ya está registrado" });
      }
      const creatingUser = await collection.insertOne({
        email: email,
        password: password,
        role: role,
      });
      // Utiliza insertedId para obtener el _id del usuario creado
      console.log("creatingUser", creatingUser);
      resp.status(200).json({
        _id: creatingUser.insertedId,
        email: email,
        role: role,
      });
    } catch (error) {
      console.error("Error al agregar usuario a la base de datos:", error);
      resp.status(500).send("Error interno del servidor");
    }
  },

  deleteUser: async (req, resp, next) => {
    // √ debería fallar con 401 cuando no hay autenticación (6 ms)
    // × debería fallar con 403 cuando no es propietario ni administrador (24 ms)
    // √ debería fallar con 404 cuando el administrador no se encuentra (4 ms)
    // × debería eliminar el propio usuario (4 ms)
    // × debería eliminar a otro usuario como administrador (3 ms)
    const db = await connect();
    const collection = db.collection("users");
    const { email, password, roles } = req.body;
    // id del usuario que se va a eliminar
    const { uid } = req.params;
    const findUser = collection.find((user) => user.uid === uid);
 
    if (!validationAdmin(req, resp)) {
      return resp.status(404).send("No tiene acceso");
    }
    // No es administrador
    if (!validationWaiter(req, resp)) {
      return resp.send("No tiene acceso");
    }
    if (uid !== findUser.uid) {
      resp.status(404).send("usuario no registrado");
    } else {
      resp.status(404).send("usuario no registrado");
    }
    await collection.deleteUser({ _id: uid });
    resp.status(200).json({ message: "Usuario eliminado correctamente" });
  },

  findUserById: async (req, resp, next) => {
    // 403 el que intenta acceder no es admin
    // 401 cuando no hay autenticacion
    // 404 id no encontrado por que no esta registrado

    // should fail with 404 when admin and not found (8 ms)
    // × should get own user (10 ms)
    // × should get other user as admin (11 ms)
    const db = await connect();
    const collection = db.collection("users");
    const { email, password, roles } = req.body;
    // const userUid = req.params.uid;
    const { _id } = req.params;
    const foundUser = await collection.findOne({ uid: _id });
    console.log("founduser", foundUser);

    // if (!validationAdmin(req, resp)) {
    //   return resp.status(403).send("No tiene acceso");
    // }
    // if (!foundUser) {
    //   return resp.status(404).send("usuario no registrado");
    // //   .send("usuario encontrado");
    // }
    return resp.status(200).json(foundUser);
    // return resp.status(404).send("usuario no registrado");
  },
  modifyUser: async (req, resp, next) => {
    //  debería fallar con 404 cuando el administrador no se encuentra (7 ms)
    // × debería fallar con 400 cuando no hay accesorios para actualizar (7 ms)
    // × debe actualizar el usuario cuando tenga datos propios (cambio de contraseña) (7 ms)
    // × debería actualizar el usuario cuando sea administrador (7 ms)
    try {
      const db = await connect();
      const collection = db.collection("users");
      const { email, password, roles } = req.params;
      const { body } = req;
      const { uid } = req.params;
      const userUpdate = collection.find((user) => user.uid === uid);

      if (!validationAdmin(req, resp)) {
        return resp.status(403).send("No tiene acceso");
      }
      if (userUpdate !== userUpdate.uid) {
        return resp.status(404).send("Usuario no registrado");
      }
      if (password === password.uid) {
        return resp.status(400).send("No hay datos para actualizar");
      }
      await userUpdate.update(body);
      resp.json(userUpdate);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      resp.status(500).json({ error: "Error interno del servidor" });
    }
  },
};
