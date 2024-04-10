const jwt = require('jsonwebtoken');
const { connect } = require("../connect");
// const { ObjectId } = require('mongodb')


module.exports = (secret) => (req, resp, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return next();
  }
  // separa el type y el token de la cadena de autorizacion
  // el type es Bearer
  const [type, token] = authorization.split(' ');

  if (type.toLowerCase() !== 'bearer') {
    return next();
  }
  // decodedToken es el identificador dentro del token(en este caso es por  el uid)
  jwt.verify(token, secret, async (err, decodedToken) => {
    if (err) {
      return next(403);
    }
    // TODO: Verify user identity using `decodeToken.uid`
    const { uid } = decodedToken;

    const db = await connect();
    const collection = db.collection("users");

    const user = await collection.findOne({ _id: uid });
    req.user = decodedToken;

    if (req.user.role === 'admin') {
      req.isAdmin = true;
      console.log(req.isAdmin, "admin")
    }
    console.log(user)
    return next();
  });
};

module.exports.isAuthenticated = (req) => {
  // TODO: Decide based on the request information whether the user is authenticated
  if (!req.user) {
    return false
  }
  return true;
};

module.exports.isAdmin = (req) => {
  // TODO: Decide based on the request information whether the user is an admin
  if (req.user.role === 'admin') {
    return true
  }
  return false;
};

module.exports.requireAuth = (req, resp, next) => (
  (!module.exports.isAuthenticated(req))
    ? next(401)
    : next()
);

module.exports.requireAdmin = (req, resp, next) => (
  // eslint-disable-next-line no-nested-ternary
  (!module.exports.isAuthenticated(req))
    ? next(401)
    : (!module.exports.isAdmin(req))
      ? next(403)
      : next()
);
