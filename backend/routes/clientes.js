const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { getDB } = require('../database');

const router = express.Router();

// ── Helpers ────────────────────────────────────────────────────────────────

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.array() });
  }
  return null;
}

function registrarAuditoria(db, clienteId, accion, camposMod = null, usuario = 'sistema') {
  db.prepare(`
    INSERT INTO auditoria (cliente_id, accion, campos_mod, usuario)
    VALUES (?, ?, ?, ?)
  `).run(clienteId, accion, camposMod ? JSON.stringify(camposMod) : null, usuario);
}

// ── GET /clientes — listado con filtros y paginación ───────────────────────

router.get('/', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('busqueda').optional().trim(),
  query('segmento').optional().trim(),
  query('estado').optional().trim(),
  query('tipo_persona').optional().trim(),
], (req, res) => {
  if (handleValidation(req, res)) return;

  const db = getDB();
  const {
    page = 1,
    limit = 10,
    busqueda = '',
    segmento = '',
    estado = '',
    tipo_persona = '',
  } = req.query;

  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (busqueda) {
    conditions.push('(razon_social LIKE ? OR cuit LIKE ? OR email LIKE ?)');
    const like = `%${busqueda}%`;
    params.push(like, like, like);
  }
  if (segmento)     { conditions.push('segmento = ?');     params.push(segmento); }
  if (estado)       { conditions.push('estado = ?');       params.push(estado); }
  if (tipo_persona) { conditions.push('tipo_persona = ?'); params.push(tipo_persona); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const total = db.prepare(`SELECT COUNT(*) as c FROM clientes ${where}`).get(...params).c;
  const clientes = db.prepare(
    `SELECT * FROM clientes ${where} ORDER BY razon_social ASC LIMIT ? OFFSET ?`
  ).all(...params, limit, offset);

  res.json({
    ok: true,
    data: clientes,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// ── GET /clientes/:id ─────────────────────────────────────────────────────

router.get('/:id', (req, res) => {
  const db = getDB();
  const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id);
  if (!cliente) return res.status(404).json({ ok: false, message: 'Cliente no encontrado' });
  res.json({ ok: true, data: cliente });
});

// ── Validaciones comunes ──────────────────────────────────────────────────

const clienteValidations = [
  body('razon_social').trim().notEmpty().withMessage('Razón social requerida').isLength({ max: 200 }),
  body('cuit').trim().notEmpty().withMessage('CUIT requerido')
    .matches(/^\d{2}-\d{7,8}-\d$/).withMessage('Formato de CUIT inválido (XX-XXXXXXXX-X)'),
  body('tipo_persona').isIn(['FISICA', 'JURIDICA']).withMessage('Tipo de persona inválido'),
  body('segmento').isIn(['RETAIL', 'PYME', 'CORPORATIVO', 'PREMIUM']).withMessage('Segmento inválido'),
  body('estado').optional().isIn(['ACTIVO', 'INACTIVO', 'BLOQUEADO']).withMessage('Estado inválido'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email inválido'),
  body('telefono').optional().trim().isLength({ max: 30 }),
  body('direccion').optional().trim().isLength({ max: 300 }),
  body('localidad').optional().trim().isLength({ max: 100 }),
  body('provincia').optional().trim().isLength({ max: 100 }),
  body('codigo_postal').optional().trim().isLength({ max: 10 }),
  body('observaciones').optional().trim().isLength({ max: 1000 }),
];

// ── POST /clientes — alta ─────────────────────────────────────────────────

router.post('/', clienteValidations, (req, res) => {
  if (handleValidation(req, res)) return;

  const db = getDB();
  const {
    razon_social, cuit, tipo_persona, segmento,
    estado = 'ACTIVO', email, telefono, direccion,
    localidad, provincia, codigo_postal, observaciones,
  } = req.body;

  // CUIT duplicado
  const existing = db.prepare('SELECT id FROM clientes WHERE cuit = ?').get(cuit);
  if (existing) {
    return res.status(409).json({ ok: false, message: `Ya existe un cliente con CUIT ${cuit}` });
  }

  const result = db.prepare(`
    INSERT INTO clientes
      (razon_social, cuit, tipo_persona, segmento, estado, email, telefono,
       direccion, localidad, provincia, codigo_postal, observaciones)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(razon_social, cuit, tipo_persona, segmento, estado,
         email || null, telefono || null, direccion || null,
         localidad || null, provincia || null, codigo_postal || null, observaciones || null);

  registrarAuditoria(db, result.lastInsertRowid, 'ALTA');
  const nuevo = db.prepare('SELECT * FROM clientes WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ok: true, data: nuevo, message: 'Cliente creado correctamente' });
});

// ── PUT /clientes/:id — modificación ─────────────────────────────────────

router.put('/:id', clienteValidations, (req, res) => {
  if (handleValidation(req, res)) return;

  const db = getDB();
  const { id } = req.params;
  const original = db.prepare('SELECT * FROM clientes WHERE id = ?').get(id);
  if (!original) return res.status(404).json({ ok: false, message: 'Cliente no encontrado' });

  const {
    razon_social, cuit, tipo_persona, segmento, estado,
    email, telefono, direccion, localidad, provincia, codigo_postal, observaciones,
  } = req.body;

  // CUIT duplicado en otro registro
  const cuitConflict = db.prepare('SELECT id FROM clientes WHERE cuit = ? AND id != ?').get(cuit, id);
  if (cuitConflict) {
    return res.status(409).json({ ok: false, message: `El CUIT ${cuit} pertenece a otro cliente` });
  }

  // Detectar campos modificados para auditoría
  const camposMod = {};
  const campos = { razon_social, cuit, tipo_persona, segmento, estado, email, telefono, direccion, localidad, provincia, codigo_postal, observaciones };
  for (const [k, v] of Object.entries(campos)) {
    if ((v ?? '') !== (original[k] ?? '')) camposMod[k] = { antes: original[k], despues: v };
  }

  db.prepare(`
    UPDATE clientes SET
      razon_social=?, cuit=?, tipo_persona=?, segmento=?, estado=?,
      email=?, telefono=?, direccion=?, localidad=?, provincia=?,
      codigo_postal=?, observaciones=?, fecha_mod=datetime('now')
    WHERE id=?
  `).run(razon_social, cuit, tipo_persona, segmento, estado,
         email || null, telefono || null, direccion || null,
         localidad || null, provincia || null, codigo_postal || null,
         observaciones || null, id);

  registrarAuditoria(db, id, 'MODIFICACION', Object.keys(camposMod).length ? camposMod : null);
  const actualizado = db.prepare('SELECT * FROM clientes WHERE id = ?').get(id);
  res.json({ ok: true, data: actualizado, message: 'Cliente actualizado correctamente' });
});

// ── DELETE /clientes/:id — baja lógica ───────────────────────────────────

router.delete('/:id', (req, res) => {
  const db = getDB();
  const { id } = req.params;
  const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(id);
  if (!cliente) return res.status(404).json({ ok: false, message: 'Cliente no encontrado' });
  if (cliente.estado === 'INACTIVO') {
    return res.status(400).json({ ok: false, message: 'El cliente ya se encuentra inactivo' });
  }

  db.prepare(`UPDATE clientes SET estado='INACTIVO', fecha_mod=datetime('now') WHERE id=?`).run(id);
  registrarAuditoria(db, id, 'BAJA');
  res.json({ ok: true, message: `Cliente "${cliente.razon_social}" dado de baja correctamente` });
});

// ── GET /clientes/:id/auditoria ───────────────────────────────────────────

router.get('/:id/auditoria', (req, res) => {
  const db = getDB();
  const logs = db.prepare(
    'SELECT * FROM auditoria WHERE cliente_id = ? ORDER BY fecha DESC'
  ).all(req.params.id);
  res.json({ ok: true, data: logs });
});

module.exports = router;
