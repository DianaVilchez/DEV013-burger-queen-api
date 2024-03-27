const { MongoClient } = require('mongodb');
const config = require('./config');
// eslint-disable-next-line no-unused-vars
const { dbUrl } = config;
// crear un nuevo cliente de Mongodb
const client = new MongoClient(dbUrl);
// let db;
async function connect() {
  // TODO: Database Connection
  try {
    // Conectarse al servidor MongoDB
    await client.connect();
    console.log('conexion exitosa');
    // Seleccionar la base de datos
    const db = client.db('BQbasededatos');
    return db;
  } catch (error) {
    console.log('Error', error);
  }
}
module.exports = { connect };
