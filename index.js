require('dotenv').config({ override: true });
const express   = require('express');
const conectarDB = require('./config/db');

const app  = express();
const PORT = process.env.PORT || 3000;

// Conectar a MongoDB
conectarDB();

// Middleware
app.use(express.json());
app.use(express.static('public'));  // Sirve el dashboard en /

// Rutas CRUD
app.use('/api/clientes',    require('./routes/Clientes'));
app.use('/api/productos',   require('./routes/Productos'));
app.use('/api/pedidos',     require('./routes/Pedidos'));
app.use('/api/proveedores', require('./routes/Proveedores'));

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
