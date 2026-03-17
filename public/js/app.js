// Configuracion base de cada coleccion.
// De aqui salen los campos que se usan en los formularios.

const COLECCIONES = {

  clientes: {
    icono: '👤',
    desc:  'nombre · email · edad · ciudad',
    campos: [
      { key: 'nombre',   label: 'Nombre',   type: 'text',   ph: 'Ana Torres',    req: true  },
      { key: 'email',    label: 'Email',    type: 'email',  ph: 'ana@mail.com',  req: true  },
      { key: 'edad',     label: 'Edad',     type: 'number', ph: '28',            req: true  },
      { key: 'ciudad',   label: 'Ciudad',   type: 'text',   ph: 'Cali',          req: true  },
      { key: 'telefono',     label: 'Teléfono',          type: 'text',   ph: '3001234567', req: false },
    ],
  },

  productos: {
    icono: '📦',
    desc:  'nombre · precio · categoría · stock',
    campos: [
      { key: 'nombre',    label: 'Nombre',    type: 'text',   ph: 'Laptop Lenovo', req: true  },
      { key: 'precio',    label: 'Precio',    type: 'number', ph: '2500000',       req: true  },
      { key: 'categoria', label: 'Categoría', type: 'text',   ph: 'computadores',  req: true  },
      { key: 'stock',     label: 'Stock',     type: 'number', ph: '10',            req: false },
      { key: 'proveedor', label: 'Proveedor', type: 'select', opts: [],            req: false },
    ],
  },

  pedidos: {
    icono: '🧾',
    desc:  'cliente · productos[ ] · total · estado',
    campos: [
      { key: 'clienteId',        label: 'Cliente',           type: 'select', opts: [],             req: true  },
      { key: 'total',            label: 'Total ($)',          type: 'number', ph: '2990000',        req: true  },
      { key: 'estado',           label: 'Estado',            type: 'select', opts: ['pendiente','enviado','entregado'], req: false },
      { key: 'productoNombre',   label: 'Producto',          type: 'select', opts: [],             req: true  },
      { key: 'productoCantidad', label: 'Cantidad',          type: 'number', ph: '1',              req: false },
      { key: 'productoPrecio',   label: 'Precio unitario',   type: 'number', ph: '2500000',        req: false },
    ],
  },

  proveedores: {
    icono: '🏭',
    desc:  'nombre · email · teléfono · ciudad',
    campos: [
      { key: 'nombre',   label: 'Nombre',   type: 'text',  ph: 'TechDistrib SAS', req: true  },
      { key: 'email',    label: 'Email',    type: 'email', ph: 'ventas@tech.com', req: true  },
      { key: 'telefono', label: 'Teléfono', type: 'text',  ph: '3001234567',      req: false },
      { key: 'ciudad',   label: 'Ciudad',   type: 'text',  ph: 'Bogotá',          req: false },
    ],
  },

};

// Funciones de apoyo para llamadas API y render de tablas.

// Envoltorio de fetch con tiempo de respuesta para mostrarlo en UI.
async function api(method, url, body = null) {
  const t0 = Date.now();
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const r    = await fetch(url, opts);
    const data = await r.json();
    return { status: r.status, ms: Date.now() - t0, data, ok: r.ok };
  } catch (e) {
    return { status: 0, ms: Date.now() - t0, data: { error: e.message }, ok: false };
  }
}

// Normaliza respuestas para trabajar siempre con un arreglo de filas.
function normalizarFilas(data) {
  if (Array.isArray(data?.data)) return data.data;
  if (data?.data && typeof data.data === 'object') return [data.data];
  if (data?.mensaje) return [{ mensaje: data.mensaje }];
  if (data?.error) return [{ error: data.error }];
  if (data && typeof data === 'object') return [data];
  return [];
}

function escapeHtml(texto) {
  return String(texto)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function limpiarObjetoVista(valor) {
  if (Array.isArray(valor)) return valor.map(limpiarObjetoVista);
  if (!valor || typeof valor !== 'object') return valor;

  const limpio = {};
  Object.entries(valor).forEach(([k, v]) => {
    const lower = k.toLowerCase();
    if (lower === '_id' || lower === '__v' || lower.endsWith('id')) return;
    limpio[k] = limpiarObjetoVista(v);
  });
  return limpio;
}

function formatearObjetoLegible(obj) {
  if (!obj || typeof obj !== 'object') return '';
  if (obj.nombre && obj.ciudad) return `${obj.nombre} (${obj.ciudad})`;
  if (obj.nombre) return String(obj.nombre);

  const pares = Object.entries(obj)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${k}: ${v}`);

  return pares.join(' · ');
}

function valorCelda(valor, columna = '') {
  if (valor === null || valor === undefined) return '—';

  if (columna === 'productos' && Array.isArray(valor)) {
    if (!valor.length) return '—';
    const items = valor
      .map(p => {
        const limpio = limpiarObjetoVista(p);
        const nombre = limpio.producto || limpio.nombre || 'producto';
        const cant   = limpio.cantidad ?? '-';
        const precio = limpio.precio_unitario ?? limpio.precio ?? '-';
        return `${nombre} x${cant} ($${precio})`;
      })
      .map(escapeHtml)
      .join('<br>');
    return items;
  }

  if (columna === 'cliente' && typeof valor === 'object') {
    const legible = formatearObjetoLegible(limpiarObjetoVista(valor));
    return escapeHtml(legible || JSON.stringify(limpiarObjetoVista(valor)));
  }

  if (columna === 'proveedor' && typeof valor === 'object') {
    const limpio = limpiarObjetoVista(valor);
    const nombre = limpio.nombre || formatearObjetoLegible(limpio);
    return escapeHtml(nombre || '—');
  }

  if (Array.isArray(valor)) {
    if (!valor.length) return '[]';
    return valor.map(v => {
      if (typeof v === 'object') return escapeHtml(formatearObjetoLegible(limpiarObjetoVista(v)) || JSON.stringify(limpiarObjetoVista(v)));
      return escapeHtml(String(v));
    }).join(' | ');
  }
  if (typeof valor === 'object') {
    const limpio = limpiarObjetoVista(valor);
    return escapeHtml(formatearObjetoLegible(limpio) || JSON.stringify(limpio));
  }
  return escapeHtml(String(valor));
}

function construirTablaHTML(filas) {
  if (!filas.length) {
    return '<p class="table-empty">Sin registros para mostrar.</p>';
  }

  const columnas = [...new Set(filas.flatMap(f => Object.keys(f)))].filter(c => {
    const lower = c.toLowerCase();
    return lower !== '_id' && lower !== '__v' && !lower.endsWith('id');
  });

  if (!columnas.length) {
    return '<p class="table-empty">Sin columnas visibles (IDs ocultos).</p>';
  }

  const head = columnas.map(c => `<th>${c}</th>`).join('') + '<th>acciones</th>';
  const body = filas
    .map((fila, i) => {
      const acciones = fila._id
        ? `<button class="row-act row-act--edit" data-row-edit="${i}">Editar</button><button class="row-act row-act--del" data-row-del="${fila._id}">Eliminar</button>`
        : '—';
      return `<tr>${columnas.map(col => `<td>${valorCelda(fila[col], col)}</td>`).join('')}<td class="row-actions">${acciones}</td></tr>`;
    })
    .join('');

  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr>${head}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>`;
}

function mostrarEnCard(col, resultado) {
  const { status, ms, data, ok } = resultado;

  document.getElementById(`res-${col}`).classList.add('open');
  document.getElementById(`tag-${col}`).textContent  = status || 'Error';
  document.getElementById(`tag-${col}`).className    = 'res__tag ' + (ok ? 'res__tag--ok' : 'res__tag--err');
  document.getElementById(`time-${col}`).textContent = ms + 'ms';

  const salida = document.getElementById(`table-${col}`);
  const filas  = normalizarFilas(data);
  salida.innerHTML = construirTablaHTML(filas);
  salida.className = 'res__table ' + (ok ? 'res__table--ok' : 'res__table--err');

  conectarAccionesFila(col, filas);

  document.getElementById(`res-${col}`)
    .scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  actualizarContador(col);
}

// Toma todos los campos visibles del formulario actual.
function leerCampos(col) {
  const vals = {};
  document.getElementById(`card-${col}`)
    .querySelectorAll('[data-campo]')
    .forEach(el => vals[el.dataset.campo] = el.value.trim());
  return vals;
}

// Arma el body final segun la coleccion y la accion.
function armarBody(col, vals) {
  if (col === 'pedidos') {
    const b = {};
    const cantidad = parseInt(vals.productoCantidad) || 1;
    const precio   = parseFloat(vals.productoPrecio) || 0;
    if (vals.clienteId) b.cliente = vals.clienteId;
    b.total = vals.total !== '' ? (parseFloat(vals.total) || 0) : cantidad * precio;
    if (vals.estado) b.estado = vals.estado;
    if (vals.productoNombre) {
      b.productos = [{
        producto:        vals.productoNombre,
        cantidad,
        precio_unitario: precio,
      }];
    }
    return b;
  }
  const b = {};
  COLECCIONES[col].campos.forEach(c => {
    const v = vals[c.key];
    if (v !== undefined && v !== '')
      b[c.key] = c.type === 'number' ? Number(v) : v;
  });
  return b;
}


// Render de inputs/selects para formularios dinamicos.

function htmlCampo(c) {
  if (c.type === 'select') {
    const opts = c.opts.length
      ? c.opts.map(o => `<option value="${o}">${o}</option>`).join('')
      : '<option value="">Selecciona una opcion</option>';
    return `<div class="field"><label>${c.label}</label><select data-campo="${c.key}">${opts}</select></div>`;
  }
  return `<div class="field"><label>${c.label}${c.req ? ' *' : ''}</label>
    <input type="${c.type}" data-campo="${c.key}" placeholder="${c.ph}"/></div>`;
}

function htmlIdField(lbl = 'ObjectId del documento') {
  return `<div class="field field--full"><label>${lbl}</label>
    <input type="text" data-campo="_id" placeholder="507f1f77bcf86cd799439011"/></div>`;
}

function htmlHiddenIdField() {
  return '<input type="hidden" data-campo="_id"/>';
}

function construirForm(col, accion) {
  const camposEdit = `<div class="form-grid">${htmlHiddenIdField()}${COLECCIONES[col].campos.map(htmlCampo).join('')}</div>`;

  const cfg = {
    add:   { hint: 'Completa los campos para <strong>crear</strong> un nuevo documento.',  campos: `<div class="form-grid">${COLECCIONES[col].campos.map(htmlCampo).join('')}</div>`, color: 'purple', btn: 'Guardar nuevo →'   },
    edit:  { hint: 'Actualiza los campos del registro seleccionado.',  campos: camposEdit, color: 'amber', btn: 'Guardar cambios →' },
    del:   { hint: 'Ingresa el ID del documento a <strong>eliminar</strong>. Permanente.', campos: `<div class="form-grid">${htmlIdField('ID del documento a eliminar')}</div>`,        color: 'red',    btn: 'Eliminar →'        },
  };
  const c = cfg[accion];
  return `
    <p class="form-hint">${c.hint}</p>
    ${c.campos}
    <div class="form-btns">
      <button class="btn-exec btn-exec--${c.color}" id="exec-${col}">${c.btn}</button>
      <button class="btn-cancel" id="cancel-${col}">Cancelar</button>
    </div>`;
}


// Construye la card principal de cada coleccion.

function crearCard(col) {
  const div  = document.createElement('div');
  div.className   = 'card';
  div.id          = `card-${col}`;
  div.dataset.active = '';

  div.innerHTML = `
    <div class="card__actions card__actions--single">
      <button class="btn-add-main" data-col="${col}" data-action="add">+ Agregar</button>
    </div>

    <div class="card__form" id="form-${col}"></div>

    <div class="card__res" id="res-${col}">
      <div class="res__bar">
        Respuesta —
        <span class="res__tag" id="tag-${col}"></span>
        <span class="res__time" id="time-${col}"></span>
      </div>
      <div class="res__table" id="table-${col}"></div>
    </div>`;

  return div;
}


// Eventos de botones y acciones CRUD.

const estadoActivo = {};
let cacheClientes = [];
let cacheProductos = [];
let cacheProveedores = [];

function valorAtributoSeguro(texto) {
  return String(texto).replaceAll('"', '&quot;');
}

function conectarAccionesFormulario(col, accion) {
  document.getElementById(`exec-${col}`)
    .addEventListener('click', () => ejecutar(col, accion));

  document.getElementById(`cancel-${col}`)
    .addEventListener('click', () => {
      const formEl = document.getElementById(`form-${col}`);
      const card   = document.getElementById(`card-${col}`);
      formEl.classList.remove('open');
      formEl.innerHTML = '';
      estadoActivo[col] = null;
      card.querySelectorAll('[data-action]').forEach(b => b.classList.remove('active'));
    });
}

function setCampoValor(formEl, key, value) {
  const el = formEl.querySelector(`[data-campo="${key}"]`);
  if (!el || value === undefined || value === null) return;

  if (typeof value === 'object') {
    if (value._id) {
      el.value = String(value._id);
      return;
    }
    if (value.nombre) {
      el.value = String(value.nombre);
      return;
    }
    return;
  }

  if (el.type === 'date') {
    const fecha = new Date(value);
    if (!Number.isNaN(fecha.getTime())) {
      el.value = fecha.toISOString().slice(0, 10);
    }
    return;
  }
  el.value = String(value);
}

async function abrirEdicionFila(col, fila) {
  const formEl = document.getElementById(`form-${col}`);
  formEl.innerHTML = construirForm(col, 'edit');
  formEl.classList.add('open');
  estadoActivo[col] = 'edit';

  if (col === 'pedidos') {
    await prepararFormularioPedidos();
    const producto0 = Array.isArray(fila.productos) ? fila.productos[0] : null;
    const clienteId = typeof fila.cliente === 'object' ? fila.cliente?._id : fila.cliente;
    setCampoValor(formEl, 'clienteId', clienteId || '');
    setCampoValor(formEl, 'total', fila.total);
    setCampoValor(formEl, 'estado', fila.estado);
    setCampoValor(formEl, 'productoNombre', producto0?.producto);
    setCampoValor(formEl, 'productoCantidad', producto0?.cantidad);
    setCampoValor(formEl, 'productoPrecio', producto0?.precio_unitario);
  } else if (col === 'productos') {
    await prepararFormularioProductos();
    COLECCIONES[col].campos.forEach(c => setCampoValor(formEl, c.key, fila[c.key]));
  } else {
    COLECCIONES[col].campos.forEach(c => setCampoValor(formEl, c.key, fila[c.key]));
  }

  setCampoValor(formEl, '_id', fila._id);
  conectarAccionesFormulario(col, 'edit');
}

async function eliminarFila(col, id) {
  if (!confirm(`¿Eliminar este documento de «${col}»?`)) return;
  const r = await api('DELETE', `/api/${col}/${id}`);
  if (col === 'clientes' && r.ok) cacheClientes = [];
  if (col === 'productos' && r.ok) cacheProductos = [];
  if (col === 'proveedores' && r.ok) cacheProveedores = [];

  if (r.ok) {
    await mostrarListaActualizada(col, r);
  } else {
    mostrarEnCard(col, r);
  }
}

function conectarAccionesFila(col, filas) {
  const cont = document.getElementById(`table-${col}`);
  if (!cont) return;

  cont.querySelectorAll('[data-row-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.rowEdit);
      const fila = filas[i];
      if (fila) abrirEdicionFila(col, fila);
    });
  });

  cont.querySelectorAll('[data-row-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      eliminarFila(col, btn.dataset.rowDel);
    });
  });
}

async function obtenerClientes() {
  if (cacheClientes.length) return cacheClientes;

  const r = await api('GET', '/api/clientes');
  if (r.ok && Array.isArray(r.data?.data)) {
    cacheClientes = r.data.data;
    return cacheClientes;
  }
  return [];
}

async function obtenerProductos() {
  if (cacheProductos.length) return cacheProductos;

  const r = await api('GET', '/api/productos');
  if (r.ok && Array.isArray(r.data?.data)) {
    cacheProductos = r.data.data;
    return cacheProductos;
  }
  return [];
}

async function obtenerProveedores() {
  if (cacheProveedores.length) return cacheProveedores;

  const r = await api('GET', '/api/proveedores');
  if (r.ok && Array.isArray(r.data?.data)) {
    cacheProveedores = r.data.data;
    return cacheProveedores;
  }
  return [];
}

async function poblarSelectClientesEnPedidos() {
  const select = document.querySelector('#card-pedidos select[data-campo="clienteId"]');
  if (!select) return;

  const clientes = await obtenerClientes();
  if (!clientes.length) {
    select.innerHTML = '<option value="">No hay clientes registrados</option>';
    return;
  }

  const opciones = clientes
    .map(c => `<option value="${c._id}">${c.nombre}</option>`)
    .join('');

  select.innerHTML = '<option value="">Selecciona cliente</option>' + opciones;
}

async function poblarSelectProductosEnPedidos() {
  const select = document.querySelector('#card-pedidos select[data-campo="productoNombre"]');
  if (!select) return;

  const productos = await obtenerProductos();
  if (!productos.length) {
    select.innerHTML = '<option value="">No hay productos registrados</option>';
    return;
  }

  const opciones = productos
    .map(p => `<option value="${valorAtributoSeguro(p.nombre)}" data-precio="${p.precio}">${p.nombre} ($${p.precio})</option>`)
    .join('');

  select.innerHTML = '<option value="">Selecciona producto</option>' + opciones;
}

async function poblarSelectProveedoresEnProductos() {
  const select = document.querySelector('#card-productos select[data-campo="proveedor"]');
  if (!select) return;

  const proveedores = await obtenerProveedores();
  if (!proveedores.length) {
    select.innerHTML = '<option value="">No hay proveedores registrados</option>';
    return;
  }

  const opciones = proveedores
    .map(p => `<option value="${p._id}">${p.nombre}</option>`)
    .join('');

  select.innerHTML = '<option value="">Selecciona proveedor</option>' + opciones;
}

async function prepararFormularioProductos() {
  await poblarSelectProveedoresEnProductos();
}

function recalcularTotalPedido() {
  const form = document.getElementById('form-pedidos');
  if (!form) return;

  const cantidadEl = form.querySelector('[data-campo="productoCantidad"]');
  const precioEl   = form.querySelector('[data-campo="productoPrecio"]');
  const totalEl    = form.querySelector('[data-campo="total"]');
  if (!cantidadEl || !precioEl || !totalEl) return;

  const cantidad = Number(cantidadEl.value || 1);
  const precio   = Number(precioEl.value || 0);
  if (!Number.isFinite(cantidad) || !Number.isFinite(precio)) return;
  if (cantidad > 0 && precio > 0) totalEl.value = String(cantidad * precio);
}

function conectarEventosProductoPedido() {
  const form = document.getElementById('form-pedidos');
  if (!form) return;

  const productoEl = form.querySelector('[data-campo="productoNombre"]');
  const cantidadEl = form.querySelector('[data-campo="productoCantidad"]');
  const precioEl   = form.querySelector('[data-campo="productoPrecio"]');

  if (productoEl) {
    productoEl.addEventListener('change', () => {
      const opt = productoEl.selectedOptions?.[0];
      const precio = opt?.dataset?.precio || '';
      if (precioEl && precio) precioEl.value = precio;
      recalcularTotalPedido();
    });
  }

  if (cantidadEl) cantidadEl.addEventListener('input', recalcularTotalPedido);
  if (precioEl)   precioEl.addEventListener('input', recalcularTotalPedido);
}

async function prepararFormularioPedidos() {
  await Promise.all([
    poblarSelectClientesEnPedidos(),
    poblarSelectProductosEnPedidos(),
  ]);

  const form = document.getElementById('form-pedidos');
  if (form) {
    const cantidadEl = form.querySelector('[data-campo="productoCantidad"]');
    const productoEl = form.querySelector('[data-campo="productoNombre"]');
    const precioEl   = form.querySelector('[data-campo="productoPrecio"]');
    if (cantidadEl && !cantidadEl.value) cantidadEl.value = '1';

    if (productoEl && !productoEl.value && productoEl.options.length > 1) {
      productoEl.selectedIndex = 1;
      const precio = productoEl.selectedOptions?.[0]?.dataset?.precio;
      if (precioEl && precio) precioEl.value = precio;
    }
  }

  conectarEventosProductoPedido();
  recalcularTotalPedido();
}

async function mostrarListaActualizada(col, fallback) {
  const lista = await api('GET', `/api/${col}`);
  if (lista.ok) {
    mostrarEnCard(col, lista);
    return;
  }
  mostrarEnCard(col, fallback);
}

function actualizarDrawerActivo(col) {
  document.querySelectorAll('.drawer__item')
    .forEach(btn => btn.classList.toggle('active', btn.dataset.view === col));

  const title = document.getElementById('view-title');
  if (title) title.textContent = `Coleccion: ${col}`;
}

async function mostrarVista(col) {
  Object.keys(COLECCIONES).forEach(c => {
    const card = document.getElementById(`card-${c}`);
    if (card) card.style.display = c === col ? 'block' : 'none';
  });

  actualizarDrawerActivo(col);
  const r = await api('GET', `/api/${col}`);
  mostrarEnCard(col, r);
}

function manejarAccion(col, accion) {
  const formEl = document.getElementById(`form-${col}`);
  const card   = document.getElementById(`card-${col}`);

  card.querySelectorAll('[data-action]').forEach(b => b.classList.remove('active'));

  // Toggle: si ya estaba abierto, cerrar
  if (estadoActivo[col] === accion) {
    formEl.classList.remove('open');
    formEl.innerHTML = '';
    estadoActivo[col] = null;
    return;
  }

  estadoActivo[col] = accion;
  const botonAccion = card.querySelector(`[data-action="${accion}"]`);
  if (botonAccion) botonAccion.classList.add('active');

  formEl.innerHTML = construirForm(col, accion);
  formEl.classList.add('open');

  if (col === 'pedidos' && (accion === 'add' || accion === 'edit')) {
    prepararFormularioPedidos();
  }

  if (col === 'productos' && (accion === 'add' || accion === 'edit')) {
    prepararFormularioProductos();
  }

  conectarAccionesFormulario(col, accion);
}

async function ejecutar(col, accion) {
  const vals = leerCampos(col);
  const base = `/api/${col}`;

  if (col === 'pedidos' && accion === 'add' && !vals.clienteId) {
    return alert('Selecciona un cliente para crear el pedido.');
  }

  if (col === 'pedidos' && accion === 'add' && !vals.productoNombre) {
    return alert('Selecciona un producto para crear el pedido.');
  }

  if (accion === 'add') {
    const r = await api('POST', base, armarBody(col, vals));
    if (col === 'clientes' && r.ok) cacheClientes = [];
    if (col === 'productos' && r.ok) cacheProductos = [];
    if (col === 'proveedores' && r.ok) cacheProveedores = [];
    if (col === 'pedidos' && r.ok) cacheProductos = [];

    if (r.ok) {
      await mostrarListaActualizada(col, r);
    } else {
      mostrarEnCard(col, r);
      if (col === 'pedidos' && /stock|inventario|insuficiente/i.test(String(r.data?.error || ''))) {
        alert(r.data.error);
      }
    }
  }

  if (accion === 'edit') {
    if (!vals._id) return alert('Ingresa el ID del documento.');
    const body = armarBody(col, vals);
    delete body._id;
    const r = await api('PUT', `${base}/${vals._id}`, body);
    if (col === 'clientes' && r.ok) cacheClientes = [];
    if (col === 'productos' && r.ok) cacheProductos = [];
    if (col === 'proveedores' && r.ok) cacheProveedores = [];

    if (r.ok) {
      await mostrarListaActualizada(col, r);
    } else {
      mostrarEnCard(col, r);
    }
  }

  if (accion === 'del') {
    if (!vals._id) return alert('Ingresa el ID del documento.');
    if (!confirm(`¿Eliminar este documento de «${col}»?`)) return;
    const r = await api('DELETE', `${base}/${vals._id}`);
    if (col === 'clientes' && r.ok) cacheClientes = [];
    if (col === 'productos' && r.ok) cacheProductos = [];
    if (col === 'proveedores' && r.ok) cacheProveedores = [];

    if (r.ok) {
      await mostrarListaActualizada(col, r);
    } else {
      mostrarEnCard(col, r);
    }
  }

}


// Actualiza los contadores de la parte superior.

async function actualizarContador(col) {
  try {
    const r = await api('GET', `/api/${col}`);
    if (!r.ok) return;
    const n  = r.data.total ?? '—';
    const b  = document.getElementById(`badge-${col}`);
    const s  = document.getElementById(`cnt-${col}`);
    if (b) b.textContent = n + ' docs';
    if (s) s.textContent = n;
  } catch {}
}

async function cargarContadores() {
  for (const col of Object.keys(COLECCIONES)) {
    await actualizarContador(col);
  }
}


// Inicializa cards, drawer y carga inicial.

document.addEventListener('DOMContentLoaded', () => {

  // Genera cards en el DOM
  const contenedorCards = document.getElementById('cards');
  Object.keys(COLECCIONES).forEach(col => {
    const card = crearCard(col);
    contenedorCards.appendChild(card);

    // Conecta botones de acción
    card.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        manejarAccion(btn.dataset.col, btn.dataset.action);
      });
    });
  });

  document.querySelectorAll('.drawer__item').forEach(btn => {
    btn.addEventListener('click', () => {
      mostrarVista(btn.dataset.view);
    });
  });

  // Carga contadores iniciales
  cargarContadores();

  // Vista inicial
  mostrarVista('clientes');

});
