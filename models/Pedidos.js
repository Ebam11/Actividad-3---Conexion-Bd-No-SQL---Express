const mongoose = require('mongoose');

// Cada item representa un producto dentro del pedido.
const itemSchema = new mongoose.Schema({
    producto:        { type: String, required: true },
    cantidad:        { type: Number, required: true },
    precio_unitario: { type: Number, required: true },
}, { _id: false });

// Pedido principal con referencia al cliente y estado de entrega.
const pedidoSchema = new mongoose.Schema({
    cliente:   { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' },
    productos: { type: [itemSchema], required: true },
    total:     { type: Number, required: true },
    estado:    { type: String, enum: ['pendiente', 'enviado', 'entregado'], default: 'pendiente' }
});

// Modelo para la coleccion de pedidos.
module.exports = mongoose.model('Pedido', pedidoSchema);

