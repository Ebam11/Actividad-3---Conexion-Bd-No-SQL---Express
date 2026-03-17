const mongoose = require('mongoose');

// Datos de contacto de proveedores para asociarlos a productos.
const proveedorSchema = new mongoose.Schema({
    nombre:   { type: String, required: true},
    email:    { type: String, required: true},
    telefono: { type: String },
    ciudad:   { type: String }
});

// Modelo para la coleccion de proveedores.
module.exports = mongoose.model('Proveedor', proveedorSchema);