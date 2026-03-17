const express  = require('express');
const router   = express.Router();
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

// GET /api/productos
router.get('/', async (req, res) => {
  try {
    const filtro    = parsearFiltro(req.query);
    const productos = await Producto.find(filtro).populate('proveedor', 'nombre');
    res.json({ ok: true, total: productos.length, filtro, data: productos });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/productos/buscar?campo=categoria&valor=periféricos
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

    const productos = await Producto.find(filtro).populate('proveedor', 'nombre');
    res.json({ ok: true, total: productos.length, filtro, data: productos });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/productos/consulta  →  filtro libre en el body
router.post('/consulta', async (req, res) => {
  try {
    const filtro    = req.body;
    const productos = await Producto.find(filtro).populate('proveedor', 'nombre');
    res.json({ ok: true, total: productos.length, filtro, data: productos });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Filtro inválido: ' + err.message });
  }
});

// GET /api/productos/:id
router.get('/:id', async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id).populate('proveedor', 'nombre');
    if (!producto) return res.status(404).json({ ok: false, error: 'No encontrado' });
    res.json({ ok: true, data: producto });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/productos
router.post('/', async (req, res) => {
  try {
    const producto = await Producto.create(req.body);
    res.status(201).json({ ok: true, data: producto });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// PUT /api/productos/:id
router.put('/:id', async (req, res) => {
  try {
    const producto = await Producto.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!producto) return res.status(404).json({ ok: false, error: 'No encontrado' });
    res.json({ ok: true, data: producto });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// DELETE /api/productos/:id
router.delete('/:id', async (req, res) => {
  try {
    const producto = await Producto.findByIdAndDelete(req.params.id);
    if (!producto) return res.status(404).json({ ok: false, error: 'No encontrado' });
    res.json({ ok: true, mensaje: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
