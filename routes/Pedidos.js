const express = require('express');
const router  = express.Router();
const Pedido  = require('../models/Pedidos');
const Producto = require('../models/Productos');

const OPERADORES_VALIDOS = new Set(['$eq', '$ne', '$gt', '$gte', '$lt', '$lte']);

function parsearValor(valor) {
  if (valor === 'true') return true;
  if (valor === 'false') return false;
  return isNaN(valor) ? valor : Number(valor);
}

function normalizarOperador(operador = '') {
  const op = operador.startsWith('$') ? operador : `$${operador}`;
  return OPERADORES_VALIDOS.has(op) ? op : null;
}

function parsearFiltro(query) {
  const filtro = {};
  for (const [clave, valor] of Object.entries(query)) {
    if (typeof valor === 'object') {
      const sub = {};
      for (const [op, val] of Object.entries(valor)) {
        sub[op] = isNaN(val) ? val : Number(val);
      }
      filtro[clave] = sub;
    } else {
      filtro[clave] = isNaN(valor) ? valor : Number(valor);
    }
  }
  return filtro;
}


router.get('/', async (req, res) => {
  try {
    const filtro  = parsearFiltro(req.query);
    const pedidos = await Pedido.find(filtro).populate('cliente', 'nombre ciudad');
    res.json({ ok: true, total: pedidos.length, filtro, data: pedidos });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});


router.get('/buscar', async (req, res) => {
  try {
    const { campo, valor, operador } = req.query;
    if (!campo || valor === undefined)
      return res.status(400).json({ ok: false, error: 'Debes enviar campo y valor' });

    const valorParseado = parsearValor(valor);
    let filtro = {};

    if (operador) {
      const op = normalizarOperador(operador);
      if (!op) {
        return res.status(400).json({
          ok: false,
          error: 'Operador invalido. Usa: eq, ne, gt, gte, lt, lte (con o sin $)',
        });
      }

      filtro[campo] = { [op]: valorParseado };
    } else {
      filtro[campo] = typeof valorParseado === 'string'
        ? { $regex: valorParseado, $options: 'i' }
        : valorParseado;
    }

    const pedidos = await Pedido.find(filtro).populate('cliente', 'nombre ciudad');
    res.json({ ok: true, total: pedidos.length, filtro, data: pedidos });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});


router.post('/consulta', async (req, res) => {
  try {
    const filtro  = req.body;
    const pedidos = await Pedido.find(filtro).populate('cliente', 'nombre ciudad');
    res.json({ ok: true, total: pedidos.length, filtro, data: pedidos });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Filtro inválido: ' + err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id).populate('cliente');
    if (!pedido) return res.status(404).json({ ok: false, error: 'No encontrado' });
    res.json({ ok: true, data: pedido });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});


router.post('/', async (req, res) => {
  try {
    const { productos = [] } = req.body;

    if (!Array.isArray(productos) || !productos.length) {
      return res.status(400).json({ ok: false, error: 'Debes enviar al menos un producto en el pedido.' });
    }

    const itemsValidados = [];

    for (const item of productos) {
      const nombreProducto = String(item.producto || '').trim();
      const cantidad = Number(item.cantidad);

      if (!nombreProducto) {
        return res.status(400).json({ ok: false, error: 'Cada item del pedido debe incluir el nombre del producto.' });
      }

      if (!Number.isFinite(cantidad) || cantidad <= 0) {
        return res.status(400).json({ ok: false, error: `Cantidad invalida para "${nombreProducto}".` });
      }

      const producto = await Producto.findOne({ nombre: nombreProducto });
      if (!producto) {
        return res.status(400).json({ ok: false, error: `El producto "${nombreProducto}" no existe.` });
      }

      if (producto.stock < cantidad) {
        return res.status(400).json({
          ok: false,
          error: `Stock insuficiente para "${nombreProducto}". Disponible: ${producto.stock}, solicitado: ${cantidad}.`,
        });
      }

      itemsValidados.push({ producto, cantidad });
    }

    // Si todo es valido, descuenta inventario antes de guardar el pedido.
    for (const item of itemsValidados) {
      await Producto.updateOne({ _id: item.producto._id }, { $inc: { stock: -item.cantidad } });
    }

    const pedido = await Pedido.create(req.body);
    res.status(201).json({ ok: true, data: pedido });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});


router.put('/:id', async (req, res) => {
  try {
    const pedido = await Pedido.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!pedido) return res.status(404).json({ ok: false, error: 'No encontrado' });
    res.json({ ok: true, data: pedido });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// DELETE 
router.delete('/:id', async (req, res) => {
  try {
    const pedido = await Pedido.findByIdAndDelete(req.params.id);
    if (!pedido) return res.status(404).json({ ok: false, error: 'No encontrado' });
    res.json({ ok: true, mensaje: 'Pedido eliminado' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
