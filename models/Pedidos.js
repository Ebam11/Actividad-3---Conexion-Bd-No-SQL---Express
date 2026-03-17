const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    producto:        { type: String, required: true },
    cantidad:        { type: Number, required: true },
    precio_unitario: { type: Number, required: true },
}, { _id: false });

const pedidoSchema = new mongoose.Schema({
    cliente:   { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' },
    productos: { type: [itemSchema], required: true },
    total:     { type: Number, required: true },
    estado:    { type: String, enum: ['pendiente', 'enviado', 'entregado'], default: 'pendiente' }
});

module.exports = mongoose.model('Pedido', pedidoSchema);

