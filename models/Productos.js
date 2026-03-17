const mongoose = require('mongoose');

// Esquema de inventario: datos base de cada producto.
const productoSchema = new mongoose.Schema({
    nombre:    { type: String, required: true },
    precio:    { type: Number, required: true },
    categoria: { type: String, required: true },
    stock:     { type: Number, required: true },
    // Relacion opcional con el proveedor del producto.
    proveedor: { type: mongoose.Schema.Types.ObjectId, ref: 'Proveedor' }
});

// Modelo para la coleccion de productos.
module.exports = mongoose.model('Producto', productoSchema);