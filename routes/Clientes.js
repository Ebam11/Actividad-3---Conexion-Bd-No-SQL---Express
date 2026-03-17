const express = require('express');
const router  = express.Router();
const Cliente = require('../models/Cliente');

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

// Helper: convierte query params a filtro Mongoose
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

// GET /api/clientes  →  listar (soporta ?campo=valor en query string)
router.get('/', async (req, res) => {
  try {
    const filtro   = parsearFiltro(req.query);
    const clientes = await Cliente.find(filtro);
    res.json({ ok: true, total: clientes.length, filtro, data: clientes });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/clientes/buscar?campo=ciudad&valor=Cali&operador=$gt
// Búsqueda flexible por cualquier campo con operador opcional
router.get('/buscar', async (req, res) => {
  try {
    const { campo, valor, operador } = req.query;
    if (!campo || valor === undefined)
      return res.status(400).json({ ok: false, error: 'Debes enviar campo y valor' });

    let filtro = {};
    const valorParseado = parsearValor(valor);

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
      // texto → regex insensible a mayúsculas; número → exacto
      filtro[campo] = typeof valorParseado === 'string'
        ? { $regex: valorParseado, $options: 'i' }
        : valorParseado;
    }

    const clientes = await Cliente.find(filtro);
    res.json({ ok: true, total: clientes.length, filtro, data: clientes });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/clientes/consulta
// El body ES el filtro MongoDB: { "ciudad": "Cali" } o { "edad": { "$gt": 30 } }
router.post('/consulta', async (req, res) => {
  try {
    const filtro   = req.body;
    const clientes = await Cliente.find(filtro);
    res.json({ ok: true, total: clientes.length, filtro, data: clientes });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Filtro inválido: ' + err.message });
  }
});

// GET /api/clientes/:id
router.get('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) return res.status(404).json({ ok: false, error: 'No encontrado' });
    res.json({ ok: true, data: cliente });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/clientes
router.post('/', async (req, res) => {
  try {
    const cliente = await Cliente.create(req.body);
    res.status(201).json({ ok: true, data: cliente });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// PUT /api/clientes/:id
router.put('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!cliente) return res.status(404).json({ ok: false, error: 'No encontrado' });
    res.json({ ok: true, data: cliente });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// DELETE /api/clientes/:id
router.delete('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndDelete(req.params.id);
    if (!cliente) return res.status(404).json({ ok: false, error: 'No encontrado' });
    res.json({ ok: true, mensaje: 'Cliente eliminado' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
