const { connect } = require("../connect");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
const { isAdmin } = require("../middleware/auth");
// const validator = require('validator');
// const users = require('../routes/users');

// Declara un array vacío para almacenar los usuarios
// let users = [];
// const validationAdmin = (req, resp) => {
//   if (req.role !== "admin") {
//     return false;
//     // O return resp.status(403).send('No tiene acceso'); si deseas manejarlo directamente aquí
//   }
//   return true;
// };
function validationEmailUser(email) {
  const validation = /^\w+([.-_+]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/;
  return validation.test(email);
}
// const validationWaiter = (req, resp) => {
//   if (req.role === "waiter") {
//     return false;
//     // O return resp.status(403).send('No tiene acceso'); si deseas manejarlo directamente aquí
//   }
//   return true;
// };

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
      const validationEmail = validationEmailUser(email);
      if (!validationEmail) {
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
        password: bcrypt.hashSync(password, 10),
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
    try {
      const db = await connect();
      const collection = db.collection("users");
      // id del usuario que se va a eliminar
      const { uid } = req.params;
      console.log(uid, "uid");

      const validationEmail = validationEmailUser(uid);
      // validar los identificadores
      const isValidObjectId = ObjectId.isValid(uid);
      console.log(validationEmail, "validationEmail");
      let user;
      if (validationEmail) {
        user = await collection.findOne({ email: req.params.uid });
      } else if (isValidObjectId) {
        user = await collection.findOne({ _id: new ObjectId(uid) });
      } else {
        return resp.status(403).json({ error: "Usuario invalido" });
      }

      if (!user) {
        return resp.status(404).json({ msg: "Usuario no encontrado" });
      }
      const authAdmin = req.isAdmin;
      // usuario que inició sesión
      const loggedInUserId = req.params.uid;
      console.log(user._id.toString() !== loggedInUserId, "x");
      console.log(authAdmin, "is admin");
      console.log(loggedInUserId, "loggedInUserId");
      console.log(user._id.toString(), "user._id");
      // es propietaria y administrador
      // si id de la usuarioencontrada!=usuarialogeada y si no es administradora(inició sesion)

      if (
        user.email !== loggedInUserId &&
        user._id.toString() !== loggedInUserId &&
        !authAdmin
      ) {
        return resp.status(403).json({ error: "No tienes autorización" });
      }
      await collection.deleteOne(user);
      console.log({ _id: user._id }, "usuario eliminado");

      return resp.status(200).json(user);
    } catch (error) {
      resp.status(500).send("Error del servidor");
    }

    // resp.status(200).json({ message: "Usuario eliminado correctamente" });
    // const findUser = await collection.findOne({ _id:uid });

    // if (findUser === null) {
    //   resp.status(404).send("usuario no registrado");
    // }
    // if (!validationAdmin(req, resp)) {
    //   return resp.status(404).send("No tiene acceso");
    // }
    // No es administrador
    // if (req.role !== "admin") {
    //   if (uid !== req.uid) {
    //     return resp.status(403).send("No eres propietario");
    //   }
    // }
  },

  findUserById: async (req, resp, next) => {
    // 403 el que intenta acceder no es admin
    // 401 cuando no hay autenticacion
    // 404 id no encontrado por que no esta registrado

    // should fail with 404 when admin and not found (8 ms)
    // × should get own user (10 ms)
    // × should get other user as admin (11 ms)
    try {
      const db = await connect();
      const collection = db.collection("users");

      const { uid } = req.params;

      const validationEmail = validationEmailUser(uid);
      // validar los identificadores
      const isValidObjectId = ObjectId.isValid(uid);
      console.log(validationEmail, "validationEmail");

      let user;
      if (validationEmail) {
        user = await collection.findOne({ email: req.params.uid });
      } else if (isValidObjectId) {
        user = await collection.findOne({ _id: new ObjectId(uid) });
      } else {
        return resp.status(403).json({ error: "Usuario invalido" });
      }

      if (!user) {
        return resp.status(404).json({ msg: "Userio no encontrado" });
      }

      const authAdmin = req.isAdmin;
      // usuario que inició sesión
      const loggedInUserId = req.params.uid;

      console.log(user._id.toString() !== loggedInUserId, "x");
      console.log(authAdmin, "is admin");
      console.log(loggedInUserId, "loggedInUserId");
      console.log(user._id.toString(), "user._id");
      // es propietaria y administrador
      // si id de la usuarioencontrada != usuarialogeada y si no es administradora(inició sesion)
      if (user.email !== loggedInUserId && user._id.toString() !== loggedInUserId && !authAdmin) {
        console.log(user._id.toString() !== loggedInUserId && !authAdmin, "y");
        return resp.status(403).json({ error: "No tienes permisso" });
      }
      return resp.status(200).json(user);
    } catch (error) {
      resp.status(500).json({ error: "Error del servidor" });
    }
  },
  // const foundUser = await collection.findOne({ _id: uid });
  // console.log("founduser", foundUser);

  // if (!validationAdmin(req, resp)) {
  //   return resp.status(403).send("No tiene acceso");
  // }
  // if (!foundUser) {
  //   return resp.status(404).send("usuario no registrado");
  //   //   .send("usuario encontrado");
  // }
  // return resp.status(200).json( foundUser );
  // // return resp.status(404).send("usuario no registrado");

  modifyUser: async (req, resp, next) => {
    //  debería fallar con 404 cuando el administrador no se encuentra (7 ms)
    // × debería fallar con 400 cuando no hay accesorios para actualizar (7 ms)
    // × debe actualizar el usuario cuando tenga datos propios (cambio de contraseña) (7 ms)
    // × debería actualizar el usuario cuando sea administrador (7 ms)
    try {
      const db = await connect();
      const collection = db.collection("users");
      const { uid } = req.params;
      const { email, password, role } = req.body;

      const validationEmail = validationEmailUser(uid);
      // validar los identificadores
      const isValidObjectId = ObjectId.isValid(uid);
      console.log(validationEmail, "validationEmail");

      let user;
      if (validationEmail) {
        user = await collection.findOne({ email: uid });
      } else if (isValidObjectId) {
        user = await collection.findOne({ _id: new ObjectId(uid) });
      } else {
        return resp.status(403).json({ error: "Usuario invalido" });
      }

      if (!user) {
        return resp.status(404).json({ msg: "Userio no encontrado" });
      }

      const authAdmin = req.isAdmin;
      // usuario que inició sesión
      const loggedInUserId = req.params.uid;

      console.log(user.email !== loggedInUserId);
      console.log(user._id.toString() !== loggedInUserId);
      console.log(loggedInUserId);
      console.log("isadmin",!authAdmin);
      // es propietaria y administrador
      // si id de la usuarioencontrada != usuarialogeada y si no es administradora(inició sesion)
      if (user.email !== loggedInUserId && user._id.toString() !== loggedInUserId && !authAdmin) {
        return resp.status(403).json({ error: "No tienes permisos" });
      }
      
      if (!email && !password && !role) {
        return resp
          .status(400)
          .json({ error: "No se han proporcionado datos para actualizar" });
      }
      console.log("user.role", user.role);
      console.log("user.role !== admin",user.role !== "admin")
      console.log ("req.body.role",req.body.role)
      if (user.role !== "admin") {
          if (req.body.role) {
            return resp.status(403).json({ error: "No tienes permisos para cambiar rol" });
          }
        }
      // Verificar si hay cambios para actualizar
      if (req.body.email && req.body.email !== user.email) {
        user.email = req.body.email;
      }
      // if (req.body.password && req.body.password !== user.password) {
      //   user.password = req.body.password;
      // }
      console.log("no hay datos iguales", req.body.password !== user.password);
      console.log("req.body.password", req.body.password);
      console.log("user.password", user.password);
      console.log("compare", await bcrypt.compare(req.body.password, user.password));
      if (await bcrypt.compare(req.body.password, user.password)) {
        return resp
          .status(400)
          .json({ error: "No hay datos nuevos para la contraseña" });
      }
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        user.password = hashedPassword;

        
      if (req.body.role && req.body.role !== user.role) {
        user.role = req.body.role;
      }
      // Guardar los cambios en la base de datos solo si hay modificaciones
      await collection.updateOne({ _id: user._id }, { $set: user });

      // Responder con el usuario modificado
      resp.status(200).json(user);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      resp.status(500).json({ error: "Error interno del servidor" });
    }
  },
};
