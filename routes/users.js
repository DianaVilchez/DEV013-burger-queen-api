const bcrypt = require("bcrypt");
const { connect } = require("../connect");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { getUsers, createUser, deleteUser, findUserById, modifyUser } = require("../controller/users");
// app:objeto de la aplicación Express
const initAdminUser = async (app, next) => {
  const { adminEmail, adminPassword } = app.get("config");
  if (!adminEmail || !adminPassword) {
    return next();
  }
  // const adminUser = {
  //   email: adminEmail,
  //   password: bcrypt.hashSync(adminPassword, 10),
  //   roles: "admin",
  // };
  // .get: es una forma de acceder a la base de datos
  // collection:es un metodo que se usa para acceder a una coleccion especifica en la base de datos
  // findOne es un método que se utiliza para encontrar un único documento que coincida
  // con los criterios de búsqueda proporcionados.
  // lo de adentro es de findone es lo que se busca, en este caso el email
  
  const db = await connect(); // Obtener la instancia de la base de datos
  const collection = db.collection("users"); // Obtener la colección de usuarios
  
  // const collection = await connect().collection("users");
  
  const adminUserExists = await collection
    .findOne({ email: adminEmail });
  if (!adminUserExists) {
    const adminUser = {
      email: adminEmail,
      password: bcrypt.hashSync(adminPassword, 10),
      roles: "admin",
    };
    await collection.insertOne(adminUser);
    console.log("Admin user created successfully.");
  } else {
    console.log("Admin user already exists.");
  }
  // TODO: Create admin user
  // First, check if adminUser already exists in the database
  // If it doesn't exist, it needs to be saved
  next();
};
/*
 * Español:
 *
 * Diagrama de flujo de una aplicación y petición en node - express :
 *
 * request  -> middleware1 -> middleware2 -> route
 *                                             |
 * response <- middleware4 <- middleware3   <---
 *
 * la gracia es que la petición va pasando por cada una de las funciones
 * intermedias o "middlewares" hasta llegar a la función de la ruta, luego esa
 * función genera la respuesta y esta pasa nuevamente por otras funciones
 * intermedias hasta responder finalmente a la usuaria.
 *
 * Un ejemplo de middleware podría ser una función que verifique que una usuaria
 * está realmente registrado en la aplicación y que tiene permisos para usar la
 * ruta. O también un middleware de traducción, que cambie la respuesta
 * dependiendo del idioma de la usuaria.
 *
 * Es por lo anterior que siempre veremos los argumentos request, response y
 * next en nuestros middlewares y rutas. Cada una de estas funciones tendrá
 * la oportunidad de acceder a la consulta (request) y hacerse cargo de enviar
 * una respuesta (rompiendo la cadena), o delegar la consulta a la siguiente
 * función en la cadena (invocando next). De esta forma, la petición (request)
 * va pasando a través de las funciones, así como también la respuesta
 * (response).
 */
/*
 * Português Brasileiro:
 *
 * Fluxo de uma aplicação e requisição em node - express:
 *
 * request  -> middleware1 -> middleware2 -> rota
 *                                             |
 * response <- middleware4 <- middleware3   <---
 *
 * A essência é que a requisição passa por cada uma das funções intermediárias
 * ou "middlewares" até chegar à função da rota; em seguida, essa função gera a
 * resposta, que passa novamente por outras funções intermediárias até finalmente
 * responder à usuária.
 *
 * Um exemplo de middleware poderia ser uma função que verifica se uma usuária
 * está realmente registrada na aplicação e tem permissões para usar a rota. Ou
 * também um middleware de tradução, que altera a resposta dependendo do idioma
 * da usuária.
 *
 * É por isso que sempre veremos os argumentos request, response e next em nossos
 * middlewares e rotas. Cada uma dessas funções terá a oportunidade de acessar a
 * requisição (request) e cuidar de enviar uma resposta (quebrando a cadeia) ou
 * delegar a requisição para a próxima função na cadeia (invocando next). Dessa
 * forma, a requisição (request) passa através das funções, assim como a resposta
 * (response).
 */
module.exports = (app, next) => {
  app.get("/users", requireAdmin, getUsers);
  console.log (getUsers);
  app.get("/users/:uid", requireAuth, findUserById);
  app.post("/users", requireAdmin, createUser);
  app.put("/users/:uid",requireAuth, modifyUser);
  app.delete("/users/:uid",requireAuth, deleteUser);
  initAdminUser(app, next);
};