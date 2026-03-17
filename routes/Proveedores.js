const express    = require('express');
const router     = express.Router();
const Proveedor  = require('../models/Proveedor');

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

// GET /api/proveedores
router.get('/', async (req, res) => {
  try {
    const filtro       = parsearFiltro(req.query);
    const proveedores  = await Proveedor.find(filtro);
    res.json({ ok: true, total: proveedores.length, filtro, data: proveedores });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/proveedores/buscar?campo=ciudad&valor=Bogotá
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

    const proveedores = await Proveedor.find(filtro);
    res.json({ ok: true, total: proveedores.length, filtro, data: proveedores });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/proveedores/consulta  →  filtro libre
router.post('/consulta', async (req, res) => {
  try {
    const filtro      = req.body;
    const proveedores = await Proveedor.find(filtro);
    res.json({ ok: true, total: proveedores.length, filtro, data: proveedores });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Filtro inválido: ' + err.message });
  }
});

// GET /api/proveedores/:id
router.get('/:id', async (req, res) => {
  try {
    const proveedor = await Proveedor.findById(req.params.id);
    if (!proveedor) return res.status(404).json({ ok: false, error: 'No encontrado' });
    res.json({ ok: true, data: proveedor });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/proveedores
router.post('/', async (req, res) => {
  try {
    const proveedor = await Proveedor.create(req.body);
    res.status(201).json({ ok: true, data: proveedor });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// PUT /api/proveedores/:id
router.put('/:id', async (req, res) => {
  try {
    const proveedor = await Proveedor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!proveedor) return res.status(404).json({ ok: false, error: 'No encontrado' });
    res.json({ ok: true, data: proveedor });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// DELETE /api/proveedores/:id
router.delete('/:id', async (req, res) => {
  try {
    const proveedor = await Proveedor.findByIdAndDelete(req.params.id);
    if (!proveedor) return res.status(404).json({ ok: false, error: 'No encontrado' });
    res.json({ ok: true, mensaje: 'Proveedor eliminado' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
