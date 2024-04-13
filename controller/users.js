const { connect } = require("../connect");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
// validación de correo electronico con (.com)
function validationEmailUser(email) {
  const validation = /^\w+([.-_+]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/;
  return validation.test(email);
}
module.exports = {
  getUsers: async (req, resp, next) => {
    // TODO: Implementar la función necesaria para obtener la colección o tabla de usuarios
    try {
      const db = await connect(); // Obtener la instancia de la base de datos
      const collection = db.collection("users");

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
      const queryingUser = req.params.uid;
      console.log(user._id.toString() !== queryingUser, "x");
      console.log(authAdmin, "is admin");
      console.log(queryingUser, "queryingUser");
      console.log(user._id.toString(), "user._id");

      // si no es propietario ni admin
      if (
        req.user.email !== queryingUser &&
        req.user._id.toString() !== queryingUser &&
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
    try {
      const db = await connect();
      const collection = db.collection("users");

      const { uid } = req.params;

      const validationEmail = validationEmailUser(uid);
      // validar los identificadores
      const isValidObjectId = ObjectId.isValid(uid);
      console.log(validationEmail, "validationEmail");

      let userParams;
      if (validationEmail) {
        userParams = await collection.findOne({ email: req.params.uid });
      } else if (isValidObjectId) {
        userParams = await collection.findOne({ _id: new ObjectId(uid) });
      } else {
        return resp.status(403).json({ error: "Usuario invalido" });
      }
      console.log("y1")
      if (!userParams) {
        return resp.status(404).json({ msg: "Userio no encontrado" });
      }
console.log("y2")
      const authAdmin = req.isAdmin;
      console.log("x1")
      // usuario que inició sesión
      const queryingUser = req.params.uid;
      console.log("x2")

      console.log(userParams._id.toString() !== queryingUser, "x");
      console.log(authAdmin, "is admin");
      console.log(queryingUser, "queryingUser");
      console.log(userParams._id.toString(), "user._id");
      // console.log(req.user)
      console.log(req.user._id, "req.user._id");
      console.log(req.user.email, "req.user.email");

      // es propietaria y administrador
      // si id de la usuarioencontrada != usuarialogeada y si no es administradora(inició sesion)
      console.log("y3")     
      if (
        req.user.email !== queryingUser &&
        req.user._id.toString() !== queryingUser &&
        !authAdmin
      ) {
        console.log(
          req.user.email !== queryingUser &&
            req.user._id.toString() !== queryingUser &&
            !authAdmin,
          "y"
        );
        return resp.status(403).json({ error: "No tienes permisos" });
      }
      console.log("y4")

      return resp.status(200).json(userParams);
    } catch (error) {
      resp.status(500).json({ error: "Error del servidor" });
    }
  },

  modifyUser: async (req, resp, next) => {
    try {
      console.log("decotoken", req.user);
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
      const queryingUser = req.params.uid;

      console.log(user.email !== queryingUser);
      console.log(user._id.toString() !== queryingUser);
      console.log(queryingUser);
      console.log("isadmin", !authAdmin);
      //no  es propietaria y administrador
      // si id de la usuarioencontrada != usuarialogeada y si no es administradora(inició sesion)
      if (
        req.user.email !== queryingUser &&
        req.user._id.toString() !== queryingUser &&
        !authAdmin
      ) {
        return resp.status(403).json({ error: "No tienes permisos" });
      }

      if (!email && !password && !role) {
        return resp
          .status(400)
          .json({ error: "No se han proporcionado datos para actualizar" });
      }
      console.log("user.role", user.role);
      console.log("user.role !== admin", user.role !== "admin");
      console.log("req.body.role", req.body.role);
      if (user.role !== "admin") {
        if (req.body.role) {
          return resp
            .status(403)
            .json({ error: "No tienes permisos para cambiar rol" });
        }
      }
      // Verificar si hay cambios para actualizar
      if (req.body.email && req.body.email !== user.email) {
        user.email = req.body.email;
      }
      
      console.log("no hay datos iguales", req.body.password !== user.password);
      console.log("req.body.password", req.body.password);
      console.log("user.password", user.password);
      console.log(
        "compare",
        await bcrypt.compare(req.body.password, user.password)
      );
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
