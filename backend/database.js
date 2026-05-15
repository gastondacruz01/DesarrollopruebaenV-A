const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'clientes.db');

let db;

function getDB() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clientes (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      razon_social TEXT    NOT NULL,
      cuit         TEXT    NOT NULL UNIQUE,
      tipo_persona TEXT    NOT NULL CHECK(tipo_persona IN ('FISICA','JURIDICA')),
      segmento     TEXT    NOT NULL CHECK(segmento IN ('RETAIL','PYME','CORPORATIVO','PREMIUM')),
      estado       TEXT    NOT NULL DEFAULT 'ACTIVO' CHECK(estado IN ('ACTIVO','INACTIVO','BLOQUEADO')),
      email        TEXT,
      telefono     TEXT,
      direccion    TEXT,
      localidad    TEXT,
      provincia    TEXT,
      codigo_postal TEXT,
      fecha_alta   TEXT    NOT NULL DEFAULT (date('now')),
      fecha_mod    TEXT    NOT NULL DEFAULT (datetime('now')),
      observaciones TEXT
    );

    CREATE TABLE IF NOT EXISTS auditoria (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER NOT NULL,
      accion     TEXT    NOT NULL CHECK(accion IN ('ALTA','MODIFICACION','BAJA')),
      campos_mod TEXT,
      fecha      TEXT    NOT NULL DEFAULT (datetime('now')),
      usuario    TEXT    NOT NULL DEFAULT 'sistema',
      FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    );
  `);

  // Seed data for demo
  const count = db.prepare('SELECT COUNT(*) as c FROM clientes').get();
  if (count.c === 0) {
    const insert = db.prepare(`
      INSERT INTO clientes (razon_social, cuit, tipo_persona, segmento, estado, email, telefono, direccion, localidad, provincia, codigo_postal)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const seedData = [
      ['Tech Solutions S.A.', '30-71234567-8', 'JURIDICA', 'CORPORATIVO', 'ACTIVO', 'contacto@techsol.com', '+54 11 4567-8901', 'Av. Corrientes 1234', 'Buenos Aires', 'CABA', '1043'],
      ['María García', '27-28765432-1', 'FISICA', 'RETAIL', 'ACTIVO', 'mgarcia@gmail.com', '+54 9 11 5678-9012', 'Calle Mitre 567', 'Rosario', 'Santa Fe', '2000'],
      ['Industrias Patagonia S.R.L.', '30-56789012-3', 'JURIDICA', 'PYME', 'ACTIVO', 'admin@patagonia.com.ar', '+54 299 4321-8765', 'Ruta 22 km 5', 'Neuquén', 'Neuquén', '8300'],
      ['Carlos Rodríguez', '20-15432678-9', 'FISICA', 'PREMIUM', 'ACTIVO', 'crodriguez@empresa.com', '+54 9 11 6789-0123', 'Av. Santa Fe 2890', 'Buenos Aires', 'CABA', '1425'],
      ['Distribuidora Norte S.A.', '30-23456789-0', 'JURIDICA', 'PYME', 'INACTIVO', 'info@distnorte.com', '+54 381 4567-8901', 'Belgrano 890', 'San Miguel de Tucumán', 'Tucumán', '4000'],
    ];
    const insertAll = db.transaction(() => {
      for (const row of seedData) insert.run(...row);
    });
    insertAll();
  }
}

module.exports = { getDB };
