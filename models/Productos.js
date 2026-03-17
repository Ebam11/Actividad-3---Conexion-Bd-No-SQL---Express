const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
    nombre:    { type: String, required: true },
    precio:    { type: Number, required: true },
    categoria: { type: String, required: true },
    stock:     { type: Number, required: true },
    proveedor: { type: mongoose.Schema.Types.ObjectId, ref: 'Proveedor' }
});

module.exports = mongoose.model('Producto', productoSchema);