const express = require('express');
const cors = require('cors');
const clientesRouter = require('./routes/clientes');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/clientes', clientesRouter);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'ABM Clientes API', timestamp: new Date().toISOString() });
});

// ── 404 ────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ ok: false, message: 'Endpoint no encontrado' });
});

// ── Error handler ──────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ ok: false, message: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`\n✅ ABM Clientes API corriendo en http://localhost:${PORT}`);
  console.log(`   Endpoints:\n   GET  /api/health\n   GET  /api/clientes\n   POST /api/clientes\n   PUT  /api/clientes/:id\n   DELETE /api/clientes/:id\n`);
});
