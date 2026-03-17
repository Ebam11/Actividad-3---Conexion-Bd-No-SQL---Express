const mongoose = require('mongoose');

// Abre la conexion principal a MongoDB usando variables de entorno.
const conectarDB = async () => {
  try {
    // Permite forzar nombre de base si se define MONGODB_DB.
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB || undefined,
    });
    console.log(`✅ MongoDB conectado: ${conn.connection.host} / DB: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    process.exit(1);
  }
};

// Exporta la funcion para usarla desde index.js.
module.exports = conectarDB;
