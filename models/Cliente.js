const mongoose = require('mongoose');

// Esquema base de clientes usado por toda la API.
const clienteSchema = new mongoose.Schema({
    // Datos principales del cliente.
    nombre:   { type: String, required: true},

    // Se marca como unico para evitar clientes duplicados por correo.
    email:    { type: String, required: true, unique: true},

    // Edad y ciudad son obligatorias para filtros y reportes.
    edad:     { type: Number, required: true},
    ciudad:   { type: String, required: true},

    // Campo opcional.
    telefono: { type: String }
});

// Mongoose genera la coleccion "clientes" a partir de este modelo.
module.exports = mongoose.model('Cliente', clienteSchema);